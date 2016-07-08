const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const AppStore = require('../js/stores/appStore')
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
          'http://*/*', 'https://*/*', 'file://*', 'data:*', 'about:srcdoc'
        ],
        exclude_globs: [
          getIndexHTML()
        ],
        match_about_blank: true,
        js: [
          'content/scripts/util.js',
          'js/actions/extensionActions.js',
          'content/scripts/navigator.js',
          'content/scripts/blockFlash.js',
          'content/scripts/blockCanvasFingerprinting.js',
          'content/scripts/block3rdPartyContent.js',
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
          'http://*/*', 'https://*/*', 'file://*', 'data:*', 'about:srcdoc'
        ],
        exclude_globs: [
          getIndexHTML()
        ],
        js: [
          'content/scripts/adInfo.js',
          'content/scripts/adInsertion.js',
          'content/scripts/passwordManager.js',
          'content/scripts/flashListener.js',
          'js/actions/extensionActions.js',
          'content/scripts/themeColor.js'
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
      },
      {
        run_at: 'document_start',
        all_frames: true,
        js: [
          'content/scripts/brave-about-flash.js'
        ],
        matches: [
          '<all_urls>'
        ]
      }
    ],
    permissions: [
      'externally_connectable.all_urls', 'tabs', '<all_urls>', 'contentSettings'
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

let defaultExtensions = {
  PDFJS: 'oemmndcbldboiebfnladdacbdfmadadm',
  OnePassword: 'aomjjhallfgjeglblehebfpbcfeobpgk',
  Dashlane: 'fdjamakpfbbddfjaooikfcpapjohcfmg',
  LastPass: 'hdokiejnpimakedhajhdlcegeplioahd'
}

module.exports.init = () => {
  process.on('chrome-browser-action-popup', function (extensionId, tabId, name, props, popup) {
    // TODO(bridiver) find window from tabId
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
    installedExtensions[installInfo.id] = installInfo
  }

  let installExtension = (extensionId, path, options = {}) => {
    if (!installedExtensions[extensionId]) {
      process.emit('load-extension', path, options, extensionInstalled)
    }
  }

  let enableExtension = (extensionId) => {
    var installInfo = installedExtensions[extensionId]
    if (installInfo) {
      process.emit('enable-extension', installInfo.id)
    }
  }

  let disableExtension = (extensionId) => {
    var installInfo = installedExtensions[extensionId]
    if (installInfo) {
      process.emit('disable-extension', installInfo.id)
    }
  }

  let enableExtensions = () => {
    installExtension(config.braveExtensionId, getExtensionsPath('brave'), {manifest_location: 'component', manifest: generateBraveManifest()})

    if (getSetting(settings.PDFJS_ENABLED)) {
      installExtension(defaultExtensions.PDFJS, getExtensionsPath('pdfjs'))
      enableExtension(defaultExtensions.PDFJS)
    } else {
      disableExtension(defaultExtensions.PDFJS)
    }

    if (getSetting(settings.ONE_PASSWORD_ENABLED)) {
      installExtension(defaultExtensions.OnePassword, getExtensionsPath('1password'))
      enableExtension(defaultExtensions.OnePassword)
    } else {
      disableExtension(defaultExtensions.OnePassword)
    }

    if (getSetting(settings.LAST_PASS_ENABLED)) {
      installExtension(defaultExtensions.LastPass, getExtensionsPath('lastpass'))
      enableExtension(defaultExtensions.LastPass)
    } else {
      disableExtension(defaultExtensions.LastPass)
    }

    if (getSetting(settings.DASHLANE_ENABLED)) {
      installExtension(defaultExtensions.Dashlane, getExtensionsPath('dashlane'))
      enableExtension(defaultExtensions.Dashlane)
    } else {
      disableExtension(defaultExtensions.Dashlane)
    }
  }

  enableExtensions()

  AppStore.addChangeListener(() => {
    enableExtensions()
  })
}
