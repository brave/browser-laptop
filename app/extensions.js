const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const AppStore = require('../js/stores/appStore')
const appConfig = require('../js/constants/appConfig')
const config = require('../js/constants/config')
const { getAppUrl, getExtensionsPath, getIndexHTML } = require('../js/lib/appUrlUtil')
const { getSetting } = require('../js/settings')
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')

let generateBraveManifest = () => {
  let baseManifest = {
    name: 'brave',
    manifest_version: 2,
    version: '1.0',
    content_scripts: [
      {
        run_at: 'document_start',
        all_frames: true,
        matches: ['<all_urls>'],
        include_globs: [
          'http://*/*', 'https://*/*', 'file://*', 'data:*'
        ],
        exclude_globs: [
          getIndexHTML()
        ],
        js: [
          'content/scripts/util.js',
          'content/scripts/blockCanvasFingerprinting.js',
          'content/scripts/block3rdPartyStorage.js',
          'content/scripts/brave-default.js',
          'js/actions/extensionActions.js',
          'content/scripts/inputHandler.js',
          'content/scripts/spellCheck.js'
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
          'http://*/*', 'https://*/*', 'file://*', 'data:*'
        ],
        exclude_globs: [
          getIndexHTML()
        ],
        js: [
          'content/scripts/adInfo.js',
          'content/scripts/adInsertion.js',
          'content/scripts/passwordManager.js',
          'content/scripts/brave-default-end.js',
          'js/actions/extensionActions.js',
          'content/scripts/themeColor.js',
          'content/scripts/publisherIdentification.js'
        ]
      },
      {
        run_at: 'document_start',
        js: [
          'content/scripts/util.js',
          'content/scripts/spellCheck.js',
          'content/scripts/inputHandler.js',
          'content/scripts/themeColor.js',
          'content/scripts/brave-about.js'
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
          getAppUrl('about-blank.html')
        ]
      }
    ],
    background: {
      scripts: [
        'ext/immutable.min.js',
        'content/scripts/util.js',
        'js/state/getSiteSettings.js',
        'js/state/activeSettings.js',
        'brave-background.js'
      ]
    },
    permissions: [
      'externally_connectable.all_urls'
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
    'img-src': '\'self\' data:'
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

let backgroundPage = null

module.exports.sendToTab = (tabId, message) => {
  if (backgroundPage) {
    backgroundPage.send('tab-message', tabId, message, [].slice.call(arguments, 2))
  }
}

module.exports.init = () => {
  process.on('background-page-loaded', function (extensionId, backgroundPageWebContents) {
    if (extensionId === config.braveExtensionId) {
      backgroundPage = backgroundPageWebContents
      backgroundPage.send('update-state', AppStore.getState().toJS(), appConfig)
    }
  })

  process.on('background-page-destroyed', function (extensionId, backgroundPageId) {
    if (extensionId === config.braveExtensionId) {
      backgroundPage = null
    }
  })

  process.on('chrome-browser-action-popup', function (extensionId, name, props, popup) {
    let win = BrowserWindow.getFocusedWindow()
    if (!win) {
      return
    }

    win.webContents.send(messages.NEW_POPUP_WINDOW, extensionId, popup, props)
  })

  let installedExtensions = {}
  let extensionInstalled = (installInfo) => {
    if (installInfo.error) {
      console.error(installInfo.error)
    }
    installedExtensions[installInfo.name] = installInfo
  }

  let installExtension = (name, path, options = {}) => {
    process.emit('load-extension', name, path, options, extensionInstalled)
  }

  let enableExtension = (name) => {
    var installInfo = installedExtensions[name]
    if (installInfo) {
      process.emit('enable-extension', installInfo.id)
    }
  }

  let disableExtension = (name) => {
    var installInfo = installedExtensions[name]
    if (installInfo) {
      process.emit('disable-extension', installInfo.id)
    }
  }

  let enableExtensions = () => {
    installExtension('brave', getExtensionsPath(), {manifest_location: 'component', manifest: generateBraveManifest()})

    if (getSetting(settings.ONE_PASSWORD_ENABLED)) {
      installExtension('1password', getExtensionsPath())
      enableExtension('1password')
    } else {
      disableExtension('1password')
    }

    if (getSetting(settings.DASHLANE_ENABLED)) {
      installExtension('Dashlane', getExtensionsPath())
      enableExtension('Dashlane')
    } else {
      disableExtension('Dashlane')
    }
  }

  enableExtensions()

  AppStore.addChangeListener(() => {
    enableExtensions()
    if (backgroundPage) {
      backgroundPage.send('update-state', AppStore.getState().toJS(), appConfig)
    }
  })
}
