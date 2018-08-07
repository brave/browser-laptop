const fs = require('fs-extra')
const path = require('path')
const dns = require('dns-then')
const {spawn} = require('child_process')
const portfinder = require('portfinder')
const net = require('net')
const underscore = require('underscore')

const {app, ipcMain} = require('electron')
const {getExtensionsPath} = require('../js/lib/appUrlUtil')
const appStore = require('../js/stores/appStore')
const ledgerState = require('./common/state/ledgerState')

const gethCache = process.env.GETH_CACHE || '1024'
const envNet = process.env.ETHEREUM_NETWORK || 'mainnet'
const envSubDomain = envNet === 'mainnet' ? 'ethwallet' : 'ethwallet-test'
const gethDataDir = path.join(app.getPath('userData'), 'ethereum', envNet)

const isWindows = process.platform === 'win32'
const gethProcessKey = isWindows ? 'geth.exe' : 'geth'

const ipcPath = isWindows ? '\\\\.\\pipe\\geth.ipc' : path.join(gethDataDir, 'geth.ipc')
const pidPath = isWindows ? '\\\\.\\pipe\\geth.pid' : path.join(gethDataDir, 'geth.pid')
const gethProcessPath = path.join(getExtensionsPath('bin'), gethProcessKey)

const configurePeers = async (dataDir) => {
  try {
    const discoveryDomain = `_enode._tcp.${envNet}.${envSubDomain}.brave.com`
    let newNodes = await dns.resolveSrv(discoveryDomain)
    newNodes = underscore.shuffle(newNodes).sort((a, b) => {
      const pdiff = a.priority - b.priority

      return ((pdiff !== 0) ? pdiff : (b.weight - a.weight))
    })
    const newNodesNames = newNodes.map(({ name }) => name)

    // start without await to take advantage of async parallelism
    const newNodesPublicKeysPromises = Promise.all(newNodesNames.map(name => dns.resolveTxt(name)))
    const newNodesIps = await Promise.all(newNodesNames.map(name => dns.resolve4(name)))
    const newNodesPublicKeys = await newNodesPublicKeysPromises

    const enodes = newNodes.map(({name, port}, i) => `enode://${newNodesPublicKeys[i]}@${newNodesIps[i]}:${port}`)

    await fs.writeFile(path.join(dataDir, 'static-nodes.json'), JSON.stringify(enodes))
  } catch (e) {
    console.error('Failed to configure static nodes peers ' + e.message)
  }
}

// needs to be shared to the eth-wallet app over ipc
let wsPort
// needs to be shared to the metamask extension
let rpcPort

let geth
let gethProcessId
let gethRetryTimeoutId
const gethRetryInterval = 30000

const spawnGeth = async () => {
  portfinder.basePort = 40400
  const port = await portfinder.getPortPromise()

  portfinder.basePort = 40600
  wsPort = await portfinder.getPortPromise()

  portfinder.basePort = 40800
  rpcPort = await portfinder.getPortPromise()

  const gethArgs = [
    '--port',
    port,
    '--syncmode',
    'light',
    '--cache',
    gethCache,
    '--cache.database',
    gethCache,
    '--trie-cache-gens',
    gethCache,
    '--rpc',
    '--rpcport',
    rpcPort,
    '--ws',
    '--wsorigins',
    'chrome-extension://dakeiobolocmlkdebloniehpglcjkgcp',
    '--wsport',
    wsPort,
    '--datadir',
    gethDataDir,
    '--ipcpath',
    ipcPath,
    '--maxpeers',
    '10'
  ]

  if (envNet === 'ropsten') {
    gethArgs.push('--testnet')
    gethArgs.push('--rpcapi', 'admin,eth,web3')
  }

  const gethOptions = {
    stdio: process.env.GETH_LOG ? 'inherit' : 'ignore'
  }

  // Ensure geth dir is available
  await fs.ensureDir(gethDataDir)

  await configurePeers(gethDataDir)

  // If the process from the previous browswer session still lingers, it should be killed
  if (await fs.pathExists(pidPath)) {
    try {
      const pid = await fs.readFile(pidPath)
      cleanupGeth(pid)
    } catch (ex) {
      console.error('Could not read from geth.pid')
    }
  }

  geth = spawn(gethProcessPath, gethArgs, gethOptions)

  geth.on('exit', handleGethStop.bind(null, 'exit'))
  geth.on('close', handleGethStop.bind(null, 'close'))

  await writeGethPid(geth.pid)

  console.warn('GETH: spawned')
}

const handleGethStop = (event, code, signal) => {
  console.warn(`GETH ${event}: Code: ${code} | Signal: ${signal}`)

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

const writeGethPid = async (pid) => {
  if (!pid) {
    return
  }

  gethProcessId = pid

  try {
    await fs.ensureDir(gethDataDir)
    await fs.writeFile(pidPath, gethProcessId)
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

    // Named pipes on Windows will get deleted
    // automatically once no processes are using them.
    if (!isWindows) {
      try {
        fs.unlinkSync(pidPath)
      } catch (ex) {
        console.error('Could not delete geth.pid')
      }
    }
    console.warn('GETH: cleanup done')
  }
}

// Attempts to restart geth up to 3 times
const restartGeth = async (tries = 3) => {
  if (tries === 0) {
    return
  }

  await spawnGeth()

  if (gethRetryTimeoutId) {
    clearTimeout(gethRetryTimeoutId)
  }

  if (geth == null) {
    gethRetryTimeoutId = setTimeout(() => { restartGeth(--tries) }, gethRetryInterval)
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

ipcMain.on('eth-wallet-unlock-account', (e, address, pw) => {
  const client = net.createConnection(ipcPath)

  client.on('connect', () => {
    client.write(JSON.stringify({ 'method': 'personal_unlockAccount', 'params': [address, pw], 'id': 1, 'jsonrpc': '2.0' }))
  })

  client.on('data', (data) => {
    client.end()
    e.sender.send('eth-wallet-unlock-account-result', data.toString())
  })
})

ipcMain.on('eth-wallet-get-geth-address', (e) => {
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
