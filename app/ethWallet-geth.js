const fs = require('fs-extra')
const path = require('path')
const dns = require('dns-then')
const {spawn, spawnSync} = require('child_process')
const portfinder = require('portfinder')
const net = require('net')
const underscore = require('underscore')
const bcrypt = require('bcryptjs')

const {app, ipcMain} = require('electron')
const {getExtensionsPath} = require('../js/lib/appUrlUtil')
const appStore = require('../js/stores/appStore')
const ledgerState = require('./common/state/ledgerState')
const {getSetting} = require('../js/settings')
const settings = require('../js/constants/settings')
const appDispatcher = require('../js/dispatcher/appDispatcher')
const appConstants = require('../js/constants/appConstants')

const gethCache = process.env.GETH_CACHE || '1024'
const envNet = process.env.ETHEREUM_NETWORK || 'mainnet'
const envSubDomain = envNet === 'mainnet' ? 'ethwallet' : 'ethwallet-test'
const gethDataDir = path.join(app.getPath('userData'), 'ethereum', envNet)

const isWindows = process.platform === 'win32'
const gethProcessKey = isWindows ? 'geth.exe' : 'geth'

const ipcPath = isWindows ? '\\\\.\\pipe\\geth.ipc' : path.join(gethDataDir, 'geth.ipc')
const pidPath = isWindows ? '\\\\.\\pipe\\geth.pid' : path.join(gethDataDir, 'geth.pid')
const pwPath = path.join(gethDataDir, 'wallets.pw')
const gethProcessPath = path.join(getExtensionsPath('bin'), gethProcessKey)

const configurePeers = async (dataDir) => {
  const staticNodePath = path.join(dataDir, 'static-nodes.json')
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

    await fs.writeFile(staticNodePath, JSON.stringify(enodes))
  } catch (ex) {
    console.error('unable to configure ' + staticNodePath + ': ' + ex.message)
    throw ex
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
    stdio: ((envNet === 'ropsten') || process.env.GETH_LOG) ? 'inherit' : 'ignore'
  }

  // If the process from the previous browswer session still lingers, it should be killed
  if (await fs.pathExists(pidPath)) {
    try {
      const pid = await fs.readFile(pidPath)
      cleanupGeth(pid)
    } catch (ex) {
      console.error('unable to read ' + pidPath + ': ' + ex.message)
    }
  }

  ensureGethDataDir()

  try {
    geth = spawn(gethProcessPath, gethArgs, gethOptions)

    geth.on('exit', handleGethStop.bind(null, 'exit'))
    geth.on('close', handleGethStop.bind(null, 'close'))

    await writeGethPid(geth.pid)

    console.warn('GETH: spawned')
  } catch (ex) {
    console.error('unable to spawn ' + gethProcessPath + ': ' + ex.message)
    cleanupGeth(geth && geth.pid)
  }
}

const ensureGethDataDir = () => {
  if (!isWindows) {
    fs.ensureDirSync(gethDataDir)
  } else {
    spawnSync('mkdir', ['-p', gethDataDir])
  }
  configurePeers(gethDataDir)
}

const handleGethStop = (event, code, signal) => {
  console.warn(`GETH ${event}: Code: ${code} | Signal: ${signal}`)

  if (code) {
    return
  }

  const isEnabled = getSetting(settings.ETHWALLET_ENABLED)
  // Restart should occur on close only, else restart
  // events can compound.
  if (event === 'exit') {
    geth = null
  } else if (isEnabled && event === 'close') {
    restartGeth()
  }
}

const writeGethPid = async (pid) => {
  if (!pid) {
    throw new Error('no pid returned by spawn')
  }

  gethProcessId = pid

  try {
    await fs.writeFile(pidPath, gethProcessId)
  } catch (ex) {
    console.error('unable to write ' + pidPath + ': ' + ex.message)
    throw ex
  }
}

const cleanupGethAndExit = (exitCode) => {
  cleanupGeth()
  process.exit(exitCode || 2)
}

const cleanupGeth = (processId) => {
  processId = processId || gethProcessId

  if (!processId) return console.warn('GET: nothing to cleanup')

  // Set geth to null to remove bound listeners
  // Otherwise, geth will attempt to restart itself
  // when killed.
  geth = null

  // Kill process
  try {
    process.kill(processId)
  } catch (ex) {
    console.error('unable to kill ' + processId + ': ' + ex.message)
  }
  try {
    process.kill(processId, 0)
    console.log('GETH: unable to kill ' + processId)
  } catch (ex) {
    if (ex.code === 'ESRCH') {
      console.log('GETH: process killed')
    } else {
      console.error('unable to kill ' + processId + ': ' + ex.message)
    }
  }

  // Remove in memory process id
  gethProcessId = null

  // Named pipes on Windows will get deleted
  // automatically once no processes are using them.
  if (!isWindows) {
    try {
      fs.unlinkSync(pidPath)
    } catch (ex) {
      console.error('unable to delete ' + pidPath + ': ' + ex.message)
    }
  }
  console.warn('GETH: cleanup done')
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
process.on('exit', cleanupGeth)
process.on('SIGHUP', cleanupGethAndExit)
process.on('SIGTERM', cleanupGethAndExit)
process.on('SIGINT', cleanupGethAndExit)

ipcMain.on('eth-wallet-create-wallet', (e, pwd) => {
  let client

  try {
    client = net.createConnection(ipcPath)
  } catch (ex) {
    return console.error('unable to connect to ' + ipcPath + ' (1): ' + ex.message)
  }

  client.on('connect', () => {
    client.write(JSON.stringify({ 'method': 'personal_newAccount', 'params': [pwd], 'id': 1, 'jsonrpc': '2.0' }))
  })

  client.on('data', (data) => {
    const res = JSON.parse(data.toString())
    if (res.result) {
      e.sender.send('eth-wallet-new-wallet', res.result)
    }
    client.end()
  })
})

ipcMain.on('eth-wallet-wallets', (e, data) => {
  let client

  try {
    client = net.createConnection(ipcPath)
  } catch (ex) {
    console.error('unable to connect to ' + ipcPath + ' (2): ' + ex.message)
  }

  client.on('connect', () => {
    client.write(JSON.stringify({ 'method': 'db_putString', 'params': ['braveEthWallet', 'wallets', data], 'id': 1, 'jsonrpc': '2.0' }))
  })

  client.on('data', (data) => {
    client.end()
  })
})

ipcMain.on('eth-wallet-unlock-account', (e, address, pw) => {
  let client

  try {
    client = net.createConnection(ipcPath)
  } catch (ex) {
    console.error('unable to connect to ' + ipcPath + ' (3): ' + ex.message)
  }

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

ipcMain.on('eth-wallet-get-metamask-state', (e) => {
  e.sender.send('eth-wallet-metamask-state', getSetting(settings.METAMASK_ENABLED) ? 'enabled' : 'disabled')
})

ipcMain.on('eth-wallet-enable-metamask', (e) => {
  appDispatcher.dispatch({
    actionType: appConstants.APP_CHANGE_SETTING,
    key: settings.METAMASK_ENABLED,
    value: true
  })
})

ipcMain.on('eth-wallet-get-keys-path', (e) => {
  e.sender.send('eth-wallet-keys-path', path.join(gethDataDir, 'keystore'))
})

ipcMain.on('eth-wallet-get-password-hash', (e) => {
  fs.readFile(pwPath, 'utf8', (err, hash) => {
    if (err || !hash) {
      e.sender.send('eth-wallet-password-hash', null)
    } else {
      e.sender.send('eth-wallet-password-hash', hash)
    }
  })
})

ipcMain.on('eth-wallet-store-password-hash', (e, str) => {
  bcrypt.genSalt(14, (err, salt) => {
    if (err) {
      console.error(err)
      return
    }
    bcrypt.hash(str, salt, (err, hash) => {
      if (err) {
        console.error(err)
        return
      }
      fs.writeFile(pwPath, hash, (err) => {
        if (err) {
          console.error(err)
        }
      })
    })
  })
})

ipcMain.on('eth-wallet-get-compare-password-hash', (e, str, hash) => {
  bcrypt.compare(str, hash, (err, res) => {
    if (err) {
      e.sender.send('eth-wallet-compare-password-hash', false)
    } else {
      e.sender.send('eth-wallet-compare-password-hash', res)
    }
  })
})

const launchGeth = async function () {
  await spawnGeth()
}

module.exports = {
  launchGeth,
  cleanupGeth
}
