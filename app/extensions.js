const browserActions = require('./browser/extensions/browserActions')
const extensionActions = require('./common/actions/extensionActions')
const AppStore = require('../js/stores/appStore')
const config = require('../js/constants/config')
const {fileUrl} = require('../js/lib/appUrlUtil')
const {getAppUrl, getExtensionsPath, getIndexHTML} = require('../js/lib/appUrlUtil')
const {getSetting} = require('../js/settings')
const settings = require('../js/constants/settings')
const {passwordManagers, extensionIds} = require('../js/constants/passwordManagers')
const appStore = require('../js/stores/appStore')
const extensionState = require('./common/state/extensionState')
const fs = require('fs')
const path = require('path')

let generateBraveManifest = () => {
  let baseManifest = {
    name: 'brave',
    manifest_version: 2,
    version: '1.0',
    background: {
      scripts: [ 'content/scripts/idleHandler.js' ]
    },
    content_scripts: [
      {
        run_at: 'document_start',
        all_frames: true,
        matches: ['<all_urls>'],
        include_globs: [
          'http://*/*', 'https://*/*', 'file://*', 'data:*', 'about:srcdoc'
        ],
        exclude_globs: [
          getIndexHTML()
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
          getIndexHTML()
        ],
        js: [
          'content/scripts/adInsertion.js',
          'content/scripts/passwordManager.js',
          'content/scripts/flashListener.js',
          'content/scripts/pageInformation.js'
        ]
      },
      {
        run_at: 'document_end',
        all_frames: false,
        matches: ['<all_urls>'],
        include_globs: [
          'http://*/*', 'https://*/*', 'file://*', 'data:*', 'about:srcdoc',
          getIndexHTML(),
          getAppUrl('about-*.html'),
          getAppUrl('about-*.html') + '#*'
        ],
        exclude_globs: [
          getAppUrl('about-blank.html'),
          getAppUrl('about-blank.html') + '#*'
        ],
        js: [
          'content/scripts/spellCheck.js',
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
          getIndexHTML(),
          getAppUrl('about-*.html'),
          getAppUrl('about-*.html') + '#*'
        ],
        exclude_globs: [
          getAppUrl('about-blank.html'),
          getAppUrl('about-blank.html') + '#*'
        ]
      }
    ],
    permissions: [
      'externally_connectable.all_urls', 'tabs', '<all_urls>', 'contentSettings', 'idle'
    ],
    externally_connectable: {
      matches: [
        '<all_urls>'
      ]
    },
    web_accessible_resources: [
      'about-*.html',
      'img/favicon.ico'
    ],
    incognito: 'spanning',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAupOLMy5Fd4dCSOtjcApsAQOnuBdTs+OvBVt/3P93noIrf068x0xXkvxbn+fpigcqfNamiJ5CjGyfx9zAIs7zcHwbxjOw0Uih4SllfgtK+svNTeE0r5atMWE0xR489BvsqNuPSxYJUmW28JqhaSZ4SabYrRx114KcU6ko7hkjyPkjQa3P+chStJjIKYgu5tWBiMJp5QVLelKoM+xkY6S7efvJ8AfajxCViLGyDQPDviGr2D0VvIBob0D1ZmAoTvYOWafcNCaqaejPDybFtuLFX3pZBqfyOCyyzGhucyCmfBXJALKbhjRAqN5glNsUmGhhPK87TuGATQfVuZtenMvXMQIDAQAB'
  }

  let cspDirectives = {
    'default-src': '\'self\'',
    'form-action': '\'none\'',
    'referrer': 'no-referrer',
    'style-src': '\'self\' \'unsafe-inline\'',
    'img-src': '* data:',
    'frame-src': '\'self\' https://buy.coinbase.com'
  }

  if (process.env.NODE_ENV === 'development') {
    // allow access to webpack dev server resources
    let devServer = 'localhost:' + process.env.npm_package_config_port
    cspDirectives['default-src'] = '\'self\' http://' + devServer
    cspDirectives['connect-src'] = '\'self\' http://' + devServer + ' ws://' + devServer
    cspDirectives['style-src'] = '\'self\' \'unsafe-inline\' http://' + devServer
  }

  var csp = ''
  for (var directive in cspDirectives) {
    csp += directive + ' ' + cspDirectives[directive] + '; '
  }
  baseManifest.content_security_policy = csp.trim()

  return baseManifest
}

module.exports.init = () => {
  const loadedExtensions = {}
  const registeredExtensions = {}
  browserActions.init()

  const {componentUpdater} = require('electron')
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
  componentUpdater.on('component-ready', (e, extensionId, extensionPath) => {
    // console.log('component-ready', extensionId, extensionPath)
    // Re-setup the loadedExtensions info if it exists
    delete loadedExtensions[extensionId]
    loadExtension(extensionId, extensionPath)
  })
  componentUpdater.on('component-not-updated', () => {
    // console.log('update-not-updated')
  })
  componentUpdater.on('component-registered', (e, extensionId) => {
    // console.log('component-registered')
    const extensions = extensionState.getExtensions(appStore.getState())
    const extensionPath = extensions.getIn([extensionId, 'filePath'])
    // If we don't have info on the extension yet, check for an update / install
    if (!extensionPath) {
      componentUpdater.checkNow(extensionId)
    } else {
      loadExtension(extensionId, extensionPath)
    }
  })

  let extensionInstalled = (installInfo) => {
    if (installInfo.error) {
      console.error(installInfo.error)
      // TODO(bridiver) extensionActions.extensionInstallFailed
      return
    }
    loadedExtensions[installInfo.id] = installInfo
    installInfo.filePath = installInfo.base_path
    installInfo.base_path = fileUrl(installInfo.base_path)
    extensionActions.extensionInstalled(installInfo.id, installInfo)
    enableExtension(installInfo.id)
  }

  let loadExtension = (extensionId, extensionPath, options = {}) => {
    if (!loadedExtensions[extensionId]) {
      if (extensionId === config.braveExtensionId) {
        process.emit('load-extension', extensionPath, options, extensionInstalled)
        return
      }
      // Verify we don't have info about an extension which doesn't exist
      // on disk anymore.  It will crash if it doesn't exist, so this is
      // just a safety net.
      fs.exists(path.join(extensionPath, 'manifest.json'), (exists) => {
        if (exists) {
          process.emit('load-extension', extensionPath, options, extensionInstalled)
        } else {
          delete loadedExtensions[extensionId]
          componentUpdater.checkNow(extensionId)
        }
      })
    } else {
      enableExtension(extensionId)
    }
  }

  let enableExtension = (extensionId) => {
    var installInfo = loadedExtensions[extensionId]
    if (installInfo) {
      process.emit('enable-extension', installInfo.id)
      extensionActions.extensionEnabled(installInfo.id)
    }
  }

  let disableExtension = (extensionId) => {
    var installInfo = loadedExtensions[extensionId]
    if (installInfo) {
      process.emit('disable-extension', installInfo.id)
      extensionActions.extensionDisabled(installInfo.id)
    }
  }

  let registerExtension = (extensionId) => {
    const extensions = extensionState.getExtensions(appStore.getState())
    if (!registeredExtensions[extensionId]) {
      componentUpdater.registerComponent(extensionId)
      registeredExtensions[extensionId] = true
    } else {
      const extensionPath = extensions.getIn([extensionId, 'filePath'])
      if (extensionPath) {
        // Otheriwse just install it
        loadExtension(extensionId, extensionPath)
      }
    }
  }

  // Manually install only the braveExtension
  registeredExtensions[config.braveExtensionId] = true
  loadExtension(config.braveExtensionId, getExtensionsPath('brave'), {manifest_location: 'component', manifest: generateBraveManifest()})

  let registerExtensions = () => {
    if (getSetting(settings.PDFJS_ENABLED)) {
      registerExtension(config.PDFJSExtensionId)
    } else {
      disableExtension(config.PDFJSExtensionId)
    }

    const activePasswordManager = getSetting(settings.ACTIVE_PASSWORD_MANAGER)
    if (activePasswordManager === passwordManagers.ONE_PASSWORD) {
      registerExtension(extensionIds[passwordManagers.ONE_PASSWORD])
    } else {
      disableExtension(extensionIds[passwordManagers.ONE_PASSWORD])
    }

    if (activePasswordManager === passwordManagers.DASHLANE) {
      registerExtension(extensionIds[passwordManagers.DASHLANE])
    } else {
      disableExtension(extensionIds[passwordManagers.DASHLANE])
    }

    if (activePasswordManager === passwordManagers.LAST_PASS) {
      registerExtension(extensionIds[passwordManagers.LAST_PASS])
    } else {
      disableExtension(extensionIds[passwordManagers.LAST_PASS])
    }
  }

  registerExtensions()
  AppStore.addChangeListener(registerExtensions)
}
