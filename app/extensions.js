const browserActions = require('./browser/extensions/browserActions')
const contextMenus = require('./browser/extensions/contextMenus')
const extensionActions = require('./common/actions/extensionActions')
const config = require('../js/constants/config')
const appConfig = require('../js/constants/appConfig')
const messages = require('../js/constants/messages')
const {fileUrl} = require('../js/lib/appUrlUtil')
const {getExtensionsPath, getBraveExtUrl, getBraveExtIndexHTML} = require('../js/lib/appUrlUtil')
const {getSetting} = require('../js/settings')
const settings = require('../js/constants/settings')
const extensionStates = require('../js/constants/extensionStates')
const {passwordManagers, extensionIds, publicKeys} = require('../js/constants/passwordManagers')
const appStore = require('../js/stores/appStore')
const extensionState = require('./common/state/extensionState')
const appActions = require('../js/actions/appActions')
const fs = require('fs')
const path = require('path')
const l10n = require('../js/l10n')
const {bravifyText} = require('./renderer/lib/extensionsUtil')
const {ipcMain, componentUpdater, session} = require('electron')

// Takes Content Security Policy flags, for example { 'default-src': '*' }
// Returns a CSP string, for example 'default-src: *;'
let concatCSP = (cspDirectives) => {
  let csp = ''
  for (let directive in cspDirectives) {
    csp += directive + ' ' + cspDirectives[directive] + '; '
  }
  return csp.trim()
}

// Returns the Chromium extension manifest for the braveExtension
// The braveExtension handles about: pages, ad blocking, and a few other things
let generateBraveManifest = () => {
  const indexHTML = getBraveExtIndexHTML()

  let baseManifest = {
    name: 'brave',
    manifest_version: 2,
    version: '1.0',
    background: {
      scripts: [ 'content/scripts/idleHandler.js' ],
      persistent: true
    },
    content_scripts: [
      {
        run_at: 'document_start',
        all_frames: true,
        matches: ['http://www.glennbeck.com/*'],
        js: [
          'content/scripts/siteHack-glennbeck.com.js'
        ]
      },
      {
        run_at: 'document_start',
        all_frames: true,
        matches: ['https://www.washingtonpost.com/*', 'https://www.youtube.com/*'],
        css: [
          'content/styles/removeEmptyElements.css'
        ]
      },
      {
        run_at: 'document_start',
        all_frames: true,
        matches: ['<all_urls>'],
        include_globs: [
          'http://*/*', 'https://*/*', 'file://*', 'data:*', 'about:srcdoc'
        ],
        exclude_globs: [
          indexHTML
        ],
        match_about_blank: true,
        js: [
          'content/scripts/util.js',
          'content/scripts/navigator.js',
          'content/scripts/blockFlash.js',
          'content/scripts/blockCanvasFingerprinting.js',
          'content/scripts/block3rdPartyContent.js',
          'content/scripts/inputHandler.js'
        ],
        css: [
          'brave-default.css'
        ]
      },
      {
        run_at: 'document_end',
        all_frames: true,
        matches: ['<all_urls>'],
        include_globs: [
          'http://*/*', 'https://*/*', 'file://*', 'data:*', 'about:srcdoc'
        ],
        exclude_globs: [
          indexHTML
        ],
        js: [
          'content/scripts/adInsertion.js',
          'content/scripts/pageInformation.js',
          'content/scripts/flashListener.js'
        ]
      },
      {
        run_at: 'document_end',
        all_frames: false,
        matches: ['<all_urls>'],
        include_globs: [
          'http://*/*', 'https://*/*', 'file://*', 'data:*', 'about:srcdoc',
          indexHTML,
          getBraveExtUrl('about-*.html'),
          getBraveExtUrl('about-*.html') + '#*'
        ],
        exclude_globs: [
          getBraveExtUrl('about-blank.html'),
          getBraveExtUrl('about-blank.html') + '#*'
        ],
        js: [
          'content/scripts/themeColor.js'
        ]
      },
      {
        run_at: 'document_start',
        js: [
          'content/scripts/util.js',
          'content/scripts/inputHandler.js'
        ],
        matches: [
          '<all_urls>'
        ],
        include_globs: [
          indexHTML,
          getBraveExtUrl('about-*.html'),
          getBraveExtUrl('about-*.html') + '#*'
        ],
        exclude_globs: [
          getBraveExtUrl('about-blank.html'),
          getBraveExtUrl('about-blank.html') + '#*'
        ]
      },
      {
        run_at: 'document_start',
        all_frames: true,
        js: [
          'content/scripts/dndHandler.js'
        ],
        matches: [
          '<all_urls>'
        ],
        exclude_globs: [
          indexHTML,
          getBraveExtUrl('*')
        ]
      },
      {
        run_at: 'document_start',
        all_frames: true,
        js: [
          'content/scripts/dappListener.js'
        ],
        matches: [
          '<all_urls>'
        ],
        include_globs: [
          'http://*/*', 'https://*/*', 'file://*'
        ],
        exclude_globs: [
          indexHTML,
          getBraveExtUrl('*')
        ]
      }
    ],
    web_accessible_resources: [
      'img/favicon.ico'
    ],
    permissions: [
      'externally_connectable.all_urls', 'tabs', '<all_urls>', 'contentSettings', 'idle'
    ],
    externally_connectable: {
      matches: [
        '<all_urls>'
      ]
    },
    incognito: 'split',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAupOLMy5Fd4dCSOtjcApsAQOnuBdTs+OvBVt/3P93noIrf068x0xXkvxbn+fpigcqfNamiJ5CjGyfx9zAIs7zcHwbxjOw0Uih4SllfgtK+svNTeE0r5atMWE0xR489BvsqNuPSxYJUmW28JqhaSZ4SabYrRx114KcU6ko7hkjyPkjQa3P+chStJjIKYgu5tWBiMJp5QVLelKoM+xkY6S7efvJ8AfajxCViLGyDQPDviGr2D0VvIBob0D1ZmAoTvYOWafcNCaqaejPDybFtuLFX3pZBqfyOCyyzGhucyCmfBXJALKbhjRAqN5glNsUmGhhPK87TuGATQfVuZtenMvXMQIDAQAB'
  }

  let cspDirectives = {
    'default-src': '\'self\'',
    'form-action': '\'none\'',
    'style-src': '\'self\' \'unsafe-inline\'',
    'img-src': '* data: file://*',
    'frame-src': '\'self\' https://brave.com'
  }

  if (process.env.NODE_ENV === 'development') {
    // allow access to webpack dev server resources
    let devServer = 'localhost:' + process.env.npm_package_config_port
    cspDirectives['default-src'] = '\'self\' http://' + devServer
    cspDirectives['connect-src'] = ['\'self\'',
      'http://' + devServer,
      'ws://' + devServer].join(' ')
    cspDirectives['style-src'] = '\'self\' \'unsafe-inline\' http://' + devServer
  }

  baseManifest.content_security_policy = concatCSP(cspDirectives)

  return baseManifest
}

// Returns the Chromium extension manifest for the torrentExtension
// The torrentExtension handles magnet: URLs
// Analagous to the PDFJS extension, it shows a special UI for that type of resource
let generateTorrentManifest = () => {
  let cspDirectives = {
    'default-src': '\'self\'',
    // TODO(bridiver) - remove example.com when webtorrent no longer requires it
    //                  (i.e. once Brave uses webpack v2)
    'connect-src': '\'self\' https://example.com',
    'media-src': '\'self\' http://localhost:*',
    'form-action': '\'none\'',
    'style-src': '\'self\' \'unsafe-inline\'',
    'frame-src': '\'self\' http://localhost:*'
  }

  if (process.env.NODE_ENV === 'development') {
    // allow access to webpack dev server resources
    let devServer = 'localhost:' + process.env.npm_package_config_port
    cspDirectives['default-src'] += ' http://' + devServer
    cspDirectives['connect-src'] += ' http://' + devServer + ' ws://' + devServer
    cspDirectives['media-src'] += ' http://' + devServer
    cspDirectives['frame-src'] += ' http://' + devServer
    cspDirectives['style-src'] += ' http://' + devServer
  }

  return {
    name: 'Torrent Viewer',
    description: l10n.translation('torrentDesc'),
    manifest_version: 2,
    version: '1.0',
    content_security_policy: concatCSP(cspDirectives),
    content_scripts: [],
    permissions: [
      'externally_connectable.all_urls', 'tabs', '<all_urls>'
    ],
    externally_connectable: {
      matches: [
        '<all_urls>'
      ]
    },
    icons: {
      128: 'img/webtorrent-128.png',
      48: 'img/webtorrent-48.png',
      16: 'img/webtorrent-16.png'
    },
    incognito: 'split',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyWl+wMvL0wZX3JUs7GeZAvxMP+LWEh2bwMV1HyuBra/lGZIq3Fmh0+AFnvFPXz1NpQkbLS3QWyqhdIn/lepGwuc2ma0glPzzmieqwctUurMGSGManApGO1MkcbSPhb+R1mx8tMam5+wbme4WoW37PI3oATgOs2NvHYuP60qol3U7b/zB3IWuqtwtqKe2Q1xY17btvPuz148ygWWIHneedt0jwfr6Zp+CSLARB9Heq/jqGXV4dPSVZ5ebBHLQ452iZkHxS6fm4Z+IxjKdYs3HNj/s8xbfEZ2ydnArGdJ0lpSK9jkDGYyUBugq5Qp3FH6zV89WqBvoV1dqUmL9gxbHsQIDAQAB'
  }
}

let generateSyncManifest = () => {
  let cspDirectives = {
    'default-src': '\'self\'',
    'form-action': '\'none\''
  }
  const connectSources = ['\'self\'', appConfig.sync.serverUrl, appConfig.sync.s3Url, appConfig.sync.snsUrl, appConfig.sync.sqsUrl]
  if (process.env.NODE_ENV === 'development') {
    connectSources.push(appConfig.sync.testS3Url)
  }

  cspDirectives['connect-src'] = connectSources.join(' ')

  if (process.env.NODE_ENV === 'development') {
    // allow access to webpack dev server resources
    let devServer = 'localhost:' + process.env.npm_package_config_port
    cspDirectives['default-src'] += ' http://' + devServer
    cspDirectives['connect-src'] += ' http://' + devServer + ' ws://' + devServer
  }

  return {
    name: 'Brave Sync',
    manifest_version: 2,
    version: '1.0',
    content_security_policy: concatCSP(cspDirectives),
    content_scripts: [],
    background: {
      scripts: [ 'content/scripts/sync.js' ]
    },
    icons: {
      128: 'img/sync-128.png',
      48: 'img/sync-48.png',
      16: 'img/sync-16.png'
    },
    incognito: 'not_allowed',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxOmBmOVzntEY6zrcrGSAyrhzL2FJt4FaP12nb899+SrV0LgpOgyqDjytuXT5IlHS74j7ZK2zTOTQy5/E9hqo6ioi1GA3PQU8E71DTaN6kW+XzP+VyZmgPoQHIxPg8jkYk/H4erfP9kMhkVOtu/XqDTqluNhOT0BvVlBpWd4unTQFWdgpCYlPrI6PsYya4FSuIDe6rCKtJABfuKFEr7U9d9MNAOJEnRS8vdBHWCuhWHqsfAaAPyKHQhnwFSFZ4eB+JznBQf7cQtB3EpOoBElyR9QvmbWFrYu87eGL5XxsojKHCrxlQ4X5ANsALa1Mdd2DHDMVqLMIiEEU42DVB0ZDewIDAQAB'
  }
}

const extensionInfo = {
  isEnabled: function (extensionId) {
    return this.extensionState[extensionId] === extensionStates.ENABLED
  },
  isDisabled: function (extensionId) {
    return this.extensionState[extensionId] === extensionStates.DISABLED
  },
  isLoading: function (extensionId) {
    return this.extensionState[extensionId] === extensionStates.LOADING
  },
  isLoaded: function (extensionId) {
    return [extensionStates.ENABLED, extensionStates.DISABLED].includes(this.extensionState[extensionId])
  },
  isRegistered: function (extensionId) {
    return [extensionStates.REGISTERED, extensionStates.LOADING, extensionStates.ENABLED, extensionStates.DISABLED].includes(this.extensionState[extensionId])
  },
  isRegistering: function (extensionId) {
    return this.extensionState[extensionId] === extensionStates.REGISTERING
  },
  getInstallInfo: function (extensionId) {
    return this.installInfo[extensionId]
  },
  setState: function (extensionId, state) {
    this.extensionState[extensionId] = state
  },
  setInstallInfo: function (extensionId, installInfo) {
    this.installInfo[extensionId] = installInfo
  },
  extensionState: {},
  installInfo: {}
}

const isExtension = (componentId) =>
  componentId !== config.widevineComponentId
const isWidevine = (componentId) =>
  componentId === config.widevineComponentId

const enableExtension = (extensionId) => {
  session.defaultSession.extensions.enable(extensionId)
}

const disableExtension = (extensionId) => {
  session.defaultSession.extensions.disable(extensionId)
}

module.exports.reloadExtension = (extensionId) => {
  const reload = (unloadedExtensionId) => {
    if (extensionId === unloadedExtensionId) {
      setImmediate(() => {
        enableExtension(extensionId)
      })
      process.removeListener('extension-unloaded', reload)
    }
  }
  process.on('extension-unloaded', reload)
  disableExtension(extensionId)
}

module.exports.init = () => {
  browserActions.init()
  contextMenus.init()

  componentUpdater.on('component-checking-for-updates', () => {
    // console.log('checking for update')
  })
  componentUpdater.on('component-update-found', () => {
    // console.log('update-found')
  })
  componentUpdater.on('component-update-ready', () => {
    // console.log('update-ready')
  })
  componentUpdater.on('component-update-updated', (e, extensionId, version) => {
    // console.log('update-updated', extensionId, version)
  })
  componentUpdater.on('component-ready', (e, componentId, extensionPath) => {
    // console.log('component-ready', componentId, extensionPath)
    // Re-setup the loadedExtensions info if it exists
    extensionInfo.setState(componentId, extensionStates.REGISTERED)
    if (isExtension(componentId)) {
      loadExtension(componentId, extensionPath)
    } else if (isWidevine(componentId)) {
      appActions.resourceReady(appConfig.resourceNames.WIDEVINE)
    }
  })
  componentUpdater.on('component-not-updated', () => {
    // console.log('update-not-updated')
  })
  componentUpdater.on('component-registered', (e, extensionId) => {
    const extensions = extensionState.getExtensions(appStore.getState())
    const extensionPath = extensions.getIn([extensionId, 'filePath'])
    // If we don't have info on the extension yet, check for an update / install
    if (!extensionPath) {
      componentUpdater.checkNow(extensionId)
    } else {
      extensionInfo.setState(extensionId, extensionStates.REGISTERED)
      loadExtension(extensionId, extensionPath)
    }
  })

  ipcMain.on(messages.LOAD_URL_REQUESTED, (e, tabId, url) => {
    appActions.loadURLRequested(tabId, url)
  })

  process.on('extension-load-error', (error) => {
    console.error(error)
  })

  process.on('extension-unloaded', (extensionId) => {
    extensionInfo.setState(extensionId, extensionStates.DISABLED)
    extensionActions.extensionDisabled(extensionId)
  })

  process.on('extension-ready', (installInfo) => {
    installInfo = insertLocaleStrings(installInfo)
    extensionInfo.setState(installInfo.id, extensionStates.ENABLED)
    extensionInfo.setInstallInfo(installInfo.id, installInfo)
    installInfo.filePath = installInfo.base_path
    installInfo.base_path = fileUrl(installInfo.base_path)
    extensionActions.extensionInstalled(installInfo.id, installInfo)
    extensionActions.extensionEnabled(installInfo.id)
  })

  let insertLocaleStrings = (installInfo) => {
    let defaultLocale = installInfo.manifest.default_locale
    if (defaultLocale) {
      let msgPath = path.join(installInfo.base_path, '_locales', defaultLocale, 'messages.json')
      if (fs.existsSync(msgPath)) {
        let messages = JSON.parse(fs.readFileSync(msgPath).toString())
        installInfo = insertPredefinedMessages(installInfo, messages, /^__MSG_(.*)__$/)
      }
    }
    return installInfo
  }

  let insertPredefinedMessages = function (object, dictionary, pattern) {
    Object.keys(object).forEach(key => {
      let value = object[key]
      let type = typeof value
      if (type === 'object' && !Array.isArray(value)) {
        object[key] = insertPredefinedMessages(value, dictionary, pattern)
        return
      }
      if (typeof value === 'string') {
        let match = value.match(pattern)
        if (match) {
          let message = dictionary[match[1]]
          object[key] = message ? bravifyText(message.message) : value
        }
      }
    })
    return object
  }

  let loadExtension = (extensionId, extensionPath, manifest = {}, manifestLocation = 'unpacked') => {
    if (extensionId === config.PDFJSExtensionId) {
      manifestLocation = 'component'
    }
    if (!extensionInfo.isLoaded(extensionId) && !extensionInfo.isLoading(extensionId)) {
      extensionInfo.setState(extensionId, extensionStates.LOADING)
      if (extensionId === config.braveExtensionId || extensionId === config.torrentExtensionId || extensionId === config.syncExtensionId) {
        session.defaultSession.extensions.load(extensionPath, manifest, manifestLocation)
        return
      }
      // Verify we don't have info about an extension which doesn't exist
      // on disk anymore.  It will crash if it doesn't exist, so this is
      // just a safety net.
      fs.access(path.join(extensionPath, 'manifest.json'), fs.constants.F_OK, (err) => {
        if (err) {
          // This is an error condition, but we can recover.
          extensionInfo.setState(extensionId, undefined)
          componentUpdater.checkNow(extensionId)
        } else {
          session.defaultSession.extensions.load(extensionPath, manifest, manifestLocation)
        }
      })
    } else {
      enableExtension(extensionId)
    }
  }

  let registerComponent = (extensionId, publicKeyString) => {
    if (!extensionInfo.isRegistered(extensionId) && !extensionInfo.isRegistering(extensionId)) {
      extensionInfo.setState(extensionId, extensionStates.REGISTERING)
      if (typeof publicKeyString !== 'undefined') {
        componentUpdater.registerComponent(extensionId, publicKeyString)
      } else {
        componentUpdater.registerComponent(extensionId)
      }
    } else {
      const extensions = extensionState.getExtensions(appStore.getState())
      const extensionPath = extensions.getIn([extensionId, 'filePath'])
      if (extensionPath) {
        // Otheriwse just install it
        loadExtension(extensionId, extensionPath)
      }
    }
  }

  // Manually install the braveExtension and torrentExtension
  extensionInfo.setState(config.braveExtensionId, extensionStates.REGISTERED)
  loadExtension(config.braveExtensionId, getExtensionsPath('brave'), generateBraveManifest(), 'component')
  extensionInfo.setState(config.syncExtensionId, extensionStates.REGISTERED)
  loadExtension(config.syncExtensionId, getExtensionsPath('brave'), generateSyncManifest(), 'unpacked')

  if (getSetting(settings.TORRENT_VIEWER_ENABLED)) {
    extensionInfo.setState(config.torrentExtensionId, extensionStates.REGISTERED)
    loadExtension(config.torrentExtensionId, getExtensionsPath('torrent'), generateTorrentManifest(), 'component')
  } else {
    extensionInfo.setState(config.torrentExtensionId, extensionStates.DISABLED)
    extensionActions.extensionDisabled(config.torrentExtensionId)
  }

  let registerComponents = (diff) => {
    if (getSetting(settings.PDFJS_ENABLED)) {
      registerComponent(config.PDFJSExtensionId, config.PDFJSExtensionPublicKey)
    } else {
      disableExtension(config.PDFJSExtensionId)
    }

    const activePasswordManager = getSetting(settings.ACTIVE_PASSWORD_MANAGER)
    if (activePasswordManager === passwordManagers.ONE_PASSWORD) {
      registerComponent(extensionIds[passwordManagers.ONE_PASSWORD], publicKeys[passwordManagers.ONE_PASSWORD])
    } else {
      disableExtension(extensionIds[passwordManagers.ONE_PASSWORD])
    }

    if (activePasswordManager === passwordManagers.DASHLANE) {
      registerComponent(extensionIds[passwordManagers.DASHLANE], publicKeys[passwordManagers.DASHLANE])
    } else {
      disableExtension(extensionIds[passwordManagers.DASHLANE])
    }

    if (activePasswordManager === passwordManagers.LAST_PASS) {
      registerComponent(extensionIds[passwordManagers.LAST_PASS], publicKeys[passwordManagers.LAST_PASS])
    } else {
      disableExtension(extensionIds[passwordManagers.LAST_PASS])
    }

    // if (activePasswordManager === passwordManagers.ENPASS) {
    //   registerComponent(extensionIds[passwordManagers.ENPASS], publicKeys[passwordManagers.ENPASS])
    // } else {
    //   disableExtension(extensionIds[passwordManagers.ENPASS])
    // }

    if (activePasswordManager === passwordManagers.BITWARDEN) {
      registerComponent(extensionIds[passwordManagers.BITWARDEN], publicKeys[passwordManagers.BITWARDEN])
    } else {
      disableExtension(extensionIds[passwordManagers.BITWARDEN])
    }

    if (getSetting(settings.POCKET_ENABLED)) {
      registerComponent(config.PocketExtensionId, config.PocketExtensionPublicKey)
    } else {
      disableExtension(config.PocketExtensionId)
    }

    // if (getSetting(settings.VIMIUM_ENABLED)) {
    //   registerComponent(config.vimiumExtensionId, config.vimiumExtensionPublicKey)
    // } else {
    //   disableExtension(config.vimiumExtensionId)
    // }

    if (getSetting(settings.HONEY_ENABLED)) {
      registerComponent(config.honeyExtensionId, config.honeyExtensionPublicKey)
    } else {
      disableExtension(config.honeyExtensionId)
    }

    // if (getSetting(settings.PINTEREST_ENABLED)) {
    //   registerComponent(config.pinterestExtensionId, config.pinterestExtensionPublicKey)
    // } else {
    //   disableExtension(config.pinterestExtensionId)
    // }

    if (getSetting(settings.METAMASK_ENABLED)) {
      registerComponent(config.metamaskExtensionId, config.metamaskPublicKey)
    } else {
      disableExtension(config.metamaskExtensionId)
    }

    if (appStore.getState().getIn(['widevine', 'enabled'])) {
      registerComponent(config.widevineComponentId, config.widevineComponentPublicKey)
    }
  }

  registerComponents()
  appStore.addChangeListener(registerComponents)
}
