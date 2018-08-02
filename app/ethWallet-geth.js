const fs = require('fs')
const path = require('path')
const dns = require('dns-then')
const byline = require('byline')
const {spawn} = require('child_process')
const portfinder = require('portfinder')
const net = require('net')

const {app, ipcMain} = require('electron')
const {getExtensionsPath} = require('../js/lib/appUrlUtil')
const appStore = require('../js/stores/appStore')
const ledgerState = require('./common/state/ledgerState')

const envNet = process.env.ETHEREUM_NETWORK
const gethDataDir = path.join(app.getPath('userData'), envNet || 'ethereum')

const gethProcessKey = process.platform === 'win32'
  ? 'geth.exe'
  : 'geth'
const ipcPath = process.platform === 'win32'
  ? '\\\\.\\pipe\\geth.ipc'
  : path.join(gethDataDir, 'geth.ipc')
const pidPath = process.platform === 'win32'
  ? '\\\\.\\pipe\\geth.pid'
  : path.join(gethDataDir, 'geth.pid')
const gethProcessPath = path.join(getExtensionsPath('bin'), gethProcessKey)

const configurePeers = () => {
  const client = net.createConnection(ipcPath)
  let id = 1
  let terminateId = 1

  client.on('connect', () => {
    client.write(JSON.stringify({ 'method': 'admin_peers', 'params': [], 'id': id++, 'jsonrpc': '2.0' }))
  })

  client.on('data', (data) => {
    const response = JSON.parse(data)
    if (response.id === 1) {
      const existingNodes = response.result
      const discoveryDomain = `_enode._tcp.${envNet || 'mainnet'}.ethwallet.bravesoftware.com`

      ;(async function () {
        const newNodes = await dns.resolveSrv(discoveryDomain)
        const newNodesNames = newNodes.map(({ name }) => name)
        const newNodesPublicKeys = await Promise.all(newNodesNames.map(name => dns.resolveTxt(name)))
        const newNodesIps = await Promise.all(newNodesNames.map(name => dns.resolve4(name)))

        const enodes = newNodes.map(({name, port}, i) => `enode://${newNodesPublicKeys[i]}@${newNodesIps[i]}:${port}`)
        const commands = []
        enodes.forEach(enode => {
          if (!existingNodes.includes(enode)) {
            commands.push({ method: 'admin_addPeer', params: [enode] })
          }
        })
        existingNodes.forEach(enode => {
          if (!enodes.includes(enode)) {
            commands.push({ method: 'admin_removePeer', params: [enode] })
          }
        })

        commands.forEach(command => {
          client.write(JSON.stringify(Object.assign({ id: id++, jsonrpc: '2.0' }, command)))
        })

        terminateId = id
      })()
    } else {
      if (response.id === terminateId) {
        client.end()
      }
    }
  })
}

// needs to be shared to the eth-wallet app over ipc
let wsPort

let geth
let gethProcessId
let gethRetryTimeoutId
const gethRetryInterval = 30000

const spawnGeth = async () => {
  portfinder.basePort = 40400
  const port = await portfinder.getPortPromise()

  portfinder.basePort = 40600
  wsPort = await portfinder.getPortPromise()

  const gethArgs = [
    '--port',
    port,
    '--syncmode',
    'light',
    '--rpc',
    '--ws',
    '--wsorigins',
    'chrome-extension://dakeiobolocmlkdebloniehpglcjkgcp',
    '--wsport',
    wsPort,
    '--datadir',
    gethDataDir,
    '--ipcpath',
    ipcPath
  ]

  if (envNet === 'ropsten') {
    gethArgs.push('--testnet')
    gethArgs.push('--rpcapi', 'admin,eth,web3')
  }
  // Ensure geth dir is available
  if (!fs.existsSync(gethDataDir)) {
    fs.mkdirSync(gethDataDir)
  }

  // If the process from the previous browswer session still lingers, it should be killed
  if (fs.existsSync(pidPath)) {
    try {
      const pid = fs.readFileSync(pidPath)
      cleanupGeth(pid)
    } catch (ex) {
      console.error('Could not read from geth.pid')
    }
  }

  geth = spawn(gethProcessPath, gethArgs)

  byline(geth.stderr).on('data', function (line) {
    line = line.toString()
    if (process.env.GETH_LOG) {
      console.log(line)
    }

    if (line.match(/IPC endpoint opened/)) {
      configurePeers()
    }
  })

  geth.on('exit', handleGethStop.bind(null, 'exit'))
  geth.on('close', handleGethStop.bind(null, 'close'))

  writeGethPid(geth.pid)

  console.warn('GETH: spawned')
}

const handleGethStop = (event, code, signal) => {
  console.warn(`GETH Stop: Code: ${code} | Signal: ${signal}`)

  if (code) {
    return
  }

  // Restart should occur on close only, else restart
  // events can compound.
  if (event === 'exit') {
    geth = null
  } else if (event === 'close') {
    restartGeth()
  }
}

const writeGethPid = (pid) => {
  if (!pid) {
    return
  }

  gethProcessId = pid

  try {
    fs.writeFileSync(pidPath, gethProcessId)
  } catch (ex) {
    console.error('Could not write geth.pid')
  }
}

const cleanupGeth = (processId) => {
  if (processId) {
    // Set geth to null to remove bound listeners
    // Otherwise, geth will attempt to restart itself
    // when killed.
    if (geth) {
      geth = null
    }
    process.kill(processId)

    // Remove in memory process id
    if (gethProcessId) {
      gethProcessId = null
    }

    try {
      fs.unlinkSync(pidPath)
    } catch (ex) {
      console.error('Could not delete geth.pid')
    }
    console.warn('GETH: cleanup done')
  }
}

// Attempts to restart geth up to 3 times
const restartGeth = (tries = 3) => {
  if (tries === 0) {
    return
  }

  spawnGeth()

  if (gethRetryTimeoutId) {
    clearTimeout(gethRetryTimeoutId)
  }

  if (geth == null) {
    gethRetryTimeoutId = setTimeout(restartGeth(tries--), gethRetryInterval)
  }
}

// Geth should be killed on normal process, exit, SIGINT,
// and application crashing exceptions.
process.on('exit', () => {
  cleanupGeth(gethProcessId)
})
process.on('SIGINT', () => {
  cleanupGeth(gethProcessId)
  process.exit(2)
})
process.on('uncaughtException', () => {
  cleanupGeth(gethProcessId)
  process.exit(99)
})

ipcMain.on('eth-wallet-create-wallet', (e, pwd) => {
  const client = net.createConnection(ipcPath)

  client.on('connect', () => {
    client.write(JSON.stringify({ 'method': 'personal_newAccount', 'params': [pwd], 'id': 1, 'jsonrpc': '2.0' }))
  })

  client.on('data', (data) => {
    client.end()
  })
})

ipcMain.on('eth-wallet-wallets', (e, data) => {
  const client = net.createConnection(ipcPath)

  client.on('connect', () => {
    client.write(JSON.stringify({ 'method': 'db_putString', 'params': ['braveEthWallet', 'wallets', data], 'id': 1, 'jsonrpc': '2.0' }))
  })

  client.on('data', (data) => {
    client.end()
  })
})

ipcMain.on('eth-wallet-unlock-account', (e, data) => {
  const [ pw, tx ] = JSON.parse(data)
  const client = net.createConnection(ipcPath)

  client.on('connect', () => {
    client.write(JSON.stringify({ 'method': 'personal_unlockAccount', 'params': [tx.from, pw], 'id': 1, 'jsonrpc': '2.0' }))
  })

  client.on('data', (data) => {
    client.end()
    const response = JSON.parse(data.toString())

    if (response.error) {
      e.sender.send('eth-wallet-notification-error', response.error.message)
    } else {
      e.sender.send('eth-wallet-retry-tx', JSON.stringify(tx))
    }
  })
})

ipcMain.on('eth-wallet-get-geth-address', (e) => {
  console.log(wsPort)
  e.sender.send('eth-wallet-geth-address', `ws://localhost:${wsPort}`)
})

ipcMain.on('get-popup-bat-balance', (e) => {
  const appState = appStore.getState()
  const ledgerInfo = ledgerState.getInfoProps(appState)
  e.sender.send('popup-bat-balance',
                ledgerInfo.get('balance'),
                ledgerInfo.getIn(['addresses', 'BAT']))
})

module.exports = async function () {
  await spawnGeth()
}
