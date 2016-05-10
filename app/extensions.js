const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const AppStore = require('../js/stores/appStore')
const { getAppUrl, getExtensionsPath } = require('../js/lib/appUrlUtil')
const getSetting = require('../js/settings').getSetting
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
        matches: ['http://*/*', 'https://*/*'],
        js: [
          'brave-default.js'
        ],
        css: [
          'brave-default.css'
        ]
      },
      {
        run_at: 'document_start',
        js: [
          'brave-about.js'
        ],
        matches: [
          '<all_urls>'
        ],
        include_globs: [
          getAppUrl('about-*.html')
        ],
        exclude_globs: [
          getAppUrl('about-blank.html')
        ]
      }
    ],
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
    'style-src': '\'self\' \'unsafe-inline\''
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
      installExtension('dashlane', getExtensionsPath())
      enableExtension('dashlane')
    } else {
      disableExtension('dashlane')
    }
  }

  enableExtensions()

  AppStore.addChangeListener(() => {
    enableExtensions()
  })
}
