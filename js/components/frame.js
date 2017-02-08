/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('../../app/common/urlParse')
const windowActions = require('../actions/windowActions')
const webviewActions = require('../actions/webviewActions')
const appActions = require('../actions/appActions')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const cx = require('../lib/classSet')
const siteUtil = require('../state/siteUtil')
const FrameStateUtil = require('../state/frameStateUtil')
const UrlUtil = require('../lib/urlutil')
const messages = require('../constants/messages')
const contextMenus = require('../contextMenus')
const ipc = require('electron').ipcRenderer
const FullScreenWarning = require('./fullScreenWarning')
const debounce = require('../lib/debounce')
const getSetting = require('../settings').getSetting
const config = require('../constants/config')
const settings = require('../constants/settings')
const {aboutUrls, isSourceMagnetUrl, isSourceAboutUrl, isTargetAboutUrl, getTargetAboutUrl, getBaseUrl, isIntermediateAboutPage} = require('../lib/appUrlUtil')
const {isFrameError} = require('../../app/common/lib/httpUtil')
const locale = require('../l10n')
const appConfig = require('../constants/appConfig')
const {getSiteSettingsForHostPattern} = require('../state/siteSettings')
const {currentWindowWebContents, isFocused} = require('../../app/renderer/currentWindow')
const windowStore = require('../stores/windowStore')
const appStoreRenderer = require('../stores/appStoreRenderer')
const siteSettings = require('../state/siteSettings')
const {newTabMode} = require('../../app/common/constants/settingsEnums')
const imageUtil = require('../lib/imageUtil')

const WEBRTC_DEFAULT = 'default'
const WEBRTC_DISABLE_NON_PROXY = 'disable_non_proxied_udp'
// Looks like Brave leaks true public IP from behind system proxy when this option
// is on.
// const WEBRTC_PUBLIC_ONLY = 'default_public_interface_only'

const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}/`

function isTorrentViewerURL (url) {
  const isEnabled = getSetting(settings.TORRENT_VIEWER_ENABLED)
  return isEnabled && isSourceMagnetUrl(url)
}

class Frame extends ImmutableComponent {
  constructor () {
    super()
    this.onUpdateWheelZoom = debounce(this.onUpdateWheelZoom.bind(this), 20)
    this.onFocus = this.onFocus.bind(this)
    // Maps notification message to its callback
    this.notificationCallbacks = {}
    // Counter for detecting PDF URL redirect loops
    this.reloadCounter = {}
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey) || Immutable.fromJS({})
  }

  get tab () {
    const frame = this.frame
    return appStoreRenderer.state.get('tabs').find((tab) => tab.get('tabId') === frame.get('tabId'))
  }

  getFrameBraverySettings (props) {
    props = props || this.props
    const frameSiteSettings =
      siteSettings.getSiteSettingsForURL(props.allSiteSettings, props.location)
    return Immutable.fromJS(siteSettings.activeSettings(frameSiteSettings,
                                                        appStoreRenderer.state,
                                                        appConfig))
  }

  isAboutPage () {
    return aboutUrls.get(getBaseUrl(this.props.location))
  }

  isIntermediateAboutPage () {
    return isIntermediateAboutPage(getBaseUrl(this.props.location))
  }

  /**
   * Send data critical for the given about page via IPC.
   * The page receiving the data typically uses it in component state.
   */
  updateAboutDetails (prevProps) {
    let location = getBaseUrl(this.props.location)
    if (location === 'about:preferences' || location === 'about:contributions' || location === aboutUrls.get('about:contributions')) {
      if (prevProps.partition !== this.props.partition) {
        ipc.send(messages.CHECK_BITCOIN_HANDLER, this.props.partition)
      }
      if (!Immutable.is(prevProps.ledgerInfo, this.props.ledgerInfo) ||
          !Immutable.is(prevProps.publisherInfo, this.props.publisherInfo) ||
          !Immutable.is(prevProps.preferencesData, this.props.preferencesData)) {
        const ledgerData = this.props.ledgerInfo.merge(this.props.publisherInfo).merge(this.props.preferencesData)
        this.webview.send(messages.LEDGER_UPDATED, ledgerData.toJS())
      }
      if (!Immutable.is(prevProps.settings, this.props.settings)) {
        this.webview.send(messages.SETTINGS_UPDATED, this.props.settings ? this.props.settings.toJS() : null)
      }
      if (!Immutable.is(prevProps.allSiteSettings, this.props.allSiteSettings)) {
        this.webview.send(messages.SITE_SETTINGS_UPDATED, this.props.allSiteSettings ? this.props.allSiteSettings.toJS() : null)
      }
      if (!Immutable.is(prevProps.braveryDefaults, this.props.braveryDefaults)) {
        this.webview.send(messages.BRAVERY_DEFAULTS_UPDATED, this.props.braveryDefaults.toJS())
      }
    } else if (location === 'about:bookmarks') {
      if (!Immutable.is(prevProps.bookmarks, this.props.bookmarks) ||
          !Immutable.is(prevProps.bookmarkFolders, this.props.bookmarkFolders)) {
        this.webview.send(messages.BOOKMARKS_UPDATED, {
          bookmarks: this.props.bookmarks.toList().sort(siteUtil.siteSort).toJS(),
          bookmarkFolders: this.props.bookmarkFolders.toList().sort(siteUtil.siteSort).toJS()
        })
      }
    } else if (location === 'about:history') {
      if (!Immutable.is(prevProps.history, this.props.history)) {
        const aboutHistoryState = this.props.history && this.props.history.toJS
          ? this.props.history.toJS()
          : {}
        this.webview.send(messages.HISTORY_UPDATED, aboutHistoryState)
      }
      if (!Immutable.is(prevProps.settings, this.props.settings)) {
        this.webview.send(messages.SETTINGS_UPDATED, this.props.settings ? this.props.settings.toJS() : null)
      }
    } else if (location === 'about:extensions') {
      if (!Immutable.is(prevProps.extensions, this.props.extensions)) {
        this.webview.send(messages.EXTENSIONS_UPDATED, {
          extensions: this.props.extensions.toJS()
        })
      }
    } else if (location === 'about:adblock') {
      if (!Immutable.is(prevProps.adblock, this.props.adblock) ||
          !Immutable.is(prevProps.settings, this.props.settings)) {
        this.webview.send(messages.ADBLOCK_UPDATED, {
          adblock: this.props.adblock.toJS(),
          settings: this.props.settings ? this.props.settings.toJS() : null,
          resources: require('ad-block/lib/regions')
        })
      }
    } else if (location === 'about:downloads') {
      if (!Immutable.is(prevProps.downloads, this.props.downloads)) {
        this.webview.send(messages.DOWNLOADS_UPDATED, {
          downloads: this.props.downloads.toJS()
        })
      }
    } else if (location === 'about:passwords') {
      if (this.props.passwords && !Immutable.is(prevProps.passwords, this.props.passwords)) {
        this.webview.send(messages.PASSWORD_DETAILS_UPDATED, this.props.passwords.toJS())
      }
      if (this.props.allSiteSettings && !Immutable.is(prevProps.allSiteSettings, this.props.allSiteSettings)) {
        this.webview.send(messages.PASSWORD_SITE_DETAILS_UPDATED,
                            this.props.allSiteSettings.filter((setting) => setting.get('savePasswords') === false).toJS())
      }
    } else if (location === 'about:flash') {
      if (!Immutable.is(prevProps.braveryDefaults, this.props.braveryDefaults)) {
        this.webview.send(messages.BRAVERY_DEFAULTS_UPDATED, this.props.braveryDefaults.toJS())
      }
    } else if (location === 'about:newtab') {
      if (!Immutable.is(prevProps.settings, this.props.settings) ||
          prevProps.trackedBlockersCount !== this.props.trackedBlockersCount ||
          prevProps.adblockCount !== this.props.adblockCount ||
          prevProps.httpsUpgradedCount !== this.props.httpsUpgradedCount ||
          !Immutable.is(prevProps.newTabDetail, this.props.newTabDetail)) {
        this.webview.send(messages.NEWTAB_DATA_UPDATED, {
          showEmptyPage: getSetting(settings.NEWTAB_MODE) === newTabMode.EMPTY_NEW_TAB,
          trackedBlockersCount: this.props.trackedBlockersCount,
          adblockCount: this.props.adblockCount,
          httpsUpgradedCount: this.props.httpsUpgradedCount,
          newTabDetail: this.props.newTabDetail ? this.props.newTabDetail.toJS() : null
        })
      }
    } else if (location === 'about:autofill') {
      if (this.props.autofillAddresses && !Immutable.is(prevProps.autofillAddresses, this.props.autofillAddresses)) {
        const defaultSession = require('electron').remote.session.defaultSession
        const guids = this.props.autofillAddresses.get('guid')
        let list = []
        guids.forEach((entry) => {
          const address = defaultSession.autofill.getProfile(entry)
          let addressDetail = {
            name: address.full_name,
            organization: address.company_name,
            streetAddress: address.street_address,
            city: address.city,
            state: address.state,
            postalCode: address.postal_code,
            country: address.country_code,
            phone: address.phone,
            email: address.email,
            guid: entry
          }
          list.push(addressDetail)
        })
        this.webview.send(messages.AUTOFILL_ADDRESSES_UPDATED, list)
      }
      if (this.props.autofillCreditCards && !Immutable.is(prevProps.autofillCreditCards, this.props.autofillCreditCards)) {
        const defaultSession = require('electron').remote.session.defaultSession
        const guids = this.props.autofillCreditCards.get('guid')
        let list = []
        guids.forEach((entry) => {
          const creditCard = defaultSession.autofill.getCreditCard(entry)
          let creditCardDetail = {
            name: creditCard.name,
            card: creditCard.card_number,
            month: creditCard.expiration_month,
            year: creditCard.expiration_year,
            guid: entry
          }
          list.push(creditCardDetail)
        })
        this.webview.send(messages.AUTOFILL_CREDIT_CARDS_UPDATED, list)
      }
    } else if (location === 'about:brave') {
      if (this.props.versionInformation && this.props.versionInformation.toJS &&
          !Immutable.is(prevProps.versionInformation, this.props.versionInformation)) {
        this.webview.send(messages.VERSION_INFORMATION_UPDATED, this.props.versionInformation.toJS())
      }
    }

    // send state to about pages
    if (this.isAboutPage() && this.props.aboutDetails) {
      if (!Immutable.is(prevProps.aboutDetails, this.props.aboutDetails)) {
        this.webview.send(messages.STATE_UPDATED, this.props.aboutDetails.toJS())
      }
    }
  }

  shouldCreateWebview () {
    return !this.webview
  }

  runInsecureContent () {
    const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings, this.origin)
    return activeSiteSettings === undefined
      ? false : activeSiteSettings.get('runInsecureContent')
  }

  allowRunningWidevinePlugin (url) {
    if (!this.props.widevine || !this.props.widevine.get('enabled')) {
      return false
    }
    const origin = url ? siteUtil.getOrigin(url) : this.origin
    if (!origin) {
      return false
    }
    // Check for at least one CtP allowed on this origin
    if (!this.props.allSiteSettings) {
      return false
    }
    const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings,
                                                             origin)
    if (activeSiteSettings && typeof activeSiteSettings.get('widevine') === 'number') {
      return true
    }
    return false
  }

  expireContentSettings (origin) {
    // Expired Flash settings should be deleted when the webview is
    // navigated or closed. Same for NoScript's allow-once option.
    const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings,
                                                             origin)
    if (!activeSiteSettings) {
      return
    }
    if (typeof activeSiteSettings.get('flash') === 'number') {
      if (activeSiteSettings.get('flash') < Date.now()) {
        appActions.removeSiteSetting(origin, 'flash', this.props.isPrivate)
      }
    }
    if (activeSiteSettings.get('widevine') === 0) {
      appActions.removeSiteSetting(origin, 'widevine', this.props.isPrivate)
    }
    if (activeSiteSettings.get('noScript') === 0) {
      appActions.removeSiteSetting(origin, 'noScript', this.props.isPrivate)
    }
  }

  componentWillUnmount () {
    this.expireContentSettings(this.origin)
  }

  updateWebview (cb, newSrc) {
    // lazy load webview
    if (!this.webview && !this.props.isActive && !this.props.isPreview &&
        // allow force loading of new frames
        this.props.unloaded === true &&
        // don't lazy load about pages
        !aboutUrls.get(getBaseUrl(this.props.src)) &&
        // pinned tabs don't serialize their state so the icon is lost for lazy loading
        !this.props.pinnedLocation) {
      return
    }

    newSrc = newSrc || this.props.src

    if (isSourceAboutUrl(newSrc)) {
      newSrc = getTargetAboutUrl(newSrc)
    }

    let guestInstanceId = null

    // Create the webview dynamically because React doesn't whitelist all
    // of the attributes we need
    let webviewAdded = false
    if (this.shouldCreateWebview()) {
      guestInstanceId = this.props.guestInstanceId
      this.webview = document.createElement('webview')
      if (guestInstanceId) {
        if (!this.webview.setGuestInstanceId(guestInstanceId)) {
          console.error('could not set guestInstanceId ' + guestInstanceId)
          guestInstanceId = null
        }
      } else {
        let partition = FrameStateUtil.getPartition(this.frame)
        ipc.sendSync(messages.INITIALIZE_PARTITION, partition)
        this.webview.setAttribute('partition', partition)
      }

      this.addEventListeners()
      if (cb) {
        this.runOnDomReady = cb
        let eventCallback = (e) => {
          this.webview.removeEventListener(e.type, eventCallback)
          this.runOnDomReady()
          delete this.runOnDomReady
        }
        this.webview.addEventListener('did-attach', eventCallback)
      }

      webviewAdded = true
    }

    if (!guestInstanceId || newSrc !== getTargetAboutUrl('about:blank')) {
      this.webview.setAttribute('src', newSrc)
    }

    this.webview.setAttribute('data-frame-key', this.props.frameKey)

    if (webviewAdded) {
      this.webviewContainer.appendChild(this.webview)
    } else {
      cb && cb()
    }
  }

  onPropsChanged (prevProps = {}) {
    this.webview.setActive(this.props.isActive)
    this.webview.setTabIndex(this.props.tabIndex)
    if (this.frame && this.props.isActive && isFocused()) {
      windowActions.setFocusedFrame(this.frame)
    }
    this.updateAboutDetails(prevProps)
  }

  componentDidMount () {
    this.updateWebview(this.onPropsChanged)
  }

  get zoomLevel () {
    const zoom = this.props.frameSiteSettings && this.props.frameSiteSettings.get('zoomLevel')
    appActions.removeSiteSetting(this.origin, 'zoomLevel', this.props.isPrivate)
    return zoom
  }

  zoomIn () {
    if (this.webview) {
      this.webview.zoomIn()
      windowActions.setLastZoomPercentage(this.frame, this.webview.getZoomPercent())
    }
  }

  zoomOut () {
    if (this.webview) {
      this.webview.zoomOut()
      windowActions.setLastZoomPercentage(this.frame, this.webview.getZoomPercent())
    }
  }

  zoomReset () {
    if (this.webview) {
      this.webview.zoomReset()
      windowActions.setLastZoomPercentage(this.frame, this.webview.getZoomPercent())
    }
  }

  enterHtmlFullScreen () {
    if (this.webview) {
      this.webview.executeScriptInTab(config.braveExtensionId, 'document.documentElement.webkitRequestFullScreen()', {})
      this.webview.focus()
    }
  }

  exitHtmlFullScreen () {
    if (this.webview) {
      this.webview.executeScriptInTab(config.braveExtensionId, 'document.webkitExitFullscreen()', {})
    }
  }

  setTitle (title) {
    if (this.frame.isEmpty()) {
      return
    }
    windowActions.setFrameTitle(this.frame, title)
  }

  componentDidUpdate (prevProps) {
    // TODO: This title should be set in app/browser/tabs.js and then we should use the
    // app state for the tabData everywhere and remove windowState's title completely.
    if (this.props.tabData && this.frame &&
        this.props.tabData.get('title') !== this.frame.get('title')) {
      this.setTitle(this.props.tabData.get('title'))
    }

    const cb = () => {
      this.onPropsChanged(prevProps)
      if (this.getWebRTCPolicy(prevProps) !== this.getWebRTCPolicy(this.props)) {
        this.webview.setWebRTCIPHandlingPolicy(this.getWebRTCPolicy(this.props))
      }
      if (prevProps.activeShortcut !== this.props.activeShortcut) {
        this.handleShortcut()
      }

      if (this.props.isActive && !prevProps.isActive && !this.props.urlBarFocused) {
        this.webview.focus()
      }

      // make sure the webview content updates to
      // match the fullscreen state of the frame
      if (prevProps.isFullScreen !== this.props.isFullScreen ||
          (this.props.isFullScreen && !this.props.isActive)) {
        if (this.props.isFullScreen && this.props.isActive) {
          this.enterHtmlFullScreen()
        } else {
          this.exitHtmlFullScreen()
        }
      }
    }

    // For cross-origin navigation, clear temp approvals
    const prevOrigin = siteUtil.getOrigin(prevProps.location)
    if (this.origin !== prevOrigin) {
      this.expireContentSettings(prevOrigin)
    }

    if (this.props.src !== prevProps.src) {
      this.updateWebview(cb)
    } else if (this.shouldCreateWebview()) {
      // plugin/insecure-content allow state has changed. recreate with the current
      // location, not the src.
      this.updateWebview(cb, this.props.location)
    } else {
      if (this.runOnDomReady) {
        // there is already a callback waiting for did-attach
        // so replace it with this callback because it might be a
        // mount callback which is a subset of the update callback
        this.runOnDomReady = cb
      } else {
        cb()
      }
    }
  }

  handleShortcut () {
    switch (this.props.activeShortcut) {
      case 'stop':
        this.webview.stop()
        break
      case 'reload':
        // Ensure that the webview thinks we're on the same location as the browser does.
        // This can happen for pages which don't load properly.
        // Some examples are basic http auth and bookmarklets.
        // In this case both the user display and the user think they're on this.props.location.
        if (this.tab.get('url') !== this.props.location &&
          !this.isAboutPage() &&
          !isTorrentViewerURL(this.props.location)) {
          this.webview.loadURL(this.props.location)
        } else if (this.isIntermediateAboutPage() &&
          this.tab.get('url') !== this.props.location &&
          this.tab.get('url') !== this.props.aboutDetails.get('url')) {
          windowActions.setUrl(this.props.aboutDetails.get('url'),
            this.props.aboutDetails.get('frameKey'))
        } else {
          this.webview.reload()
        }
        break
      case 'clean-reload':
        this.webview.reloadIgnoringCache()
        break
      case 'explicitLoadURL':
        this.webview.loadURL(this.props.location)
        break
      case 'zoom-in':
        this.zoomIn()
        break
      case 'zoom-out':
        this.zoomOut()
        break
      case 'zoom-reset':
        this.zoomReset()
        break
      case 'view-source':
        const sourceLocation = UrlUtil.getViewSourceUrlFromUrl(this.tab.get('url'))
        if (sourceLocation !== null) {
          windowActions.newFrame({
            location: sourceLocation,
            isPrivate: this.frame.get('isPrivate'),
            partitionNumber: this.frame.get('partitionNumber'),
            parentFrameKey: this.frame.get('key')
          }, true)
        }
        // TODO: Make the URL bar show the view-source: prefix
        break
      case 'save':
        const downloadLocation = getSetting(settings.PDFJS_ENABLED)
          ? UrlUtil.getLocationIfPDF(this.tab.get('url'))
          : this.tab.get('url')
        // TODO: Sometimes this tries to save in a non-existent directory
        this.webview.downloadURL(downloadLocation)
        break
      case 'print':
        this.webview.print()
        break
      case 'show-findbar':
        windowActions.setFindbarShown(this.frame, true)
        break
      case 'fill-password':
        let currentUrl = urlParse(this.tab.get('url'))
        if (currentUrl &&
            [currentUrl.protocol, currentUrl.host].join('//') === this.props.activeShortcutDetails.get('origin')) {
          this.webview.send(messages.GOT_PASSWORD,
                            this.props.activeShortcutDetails.get('username'),
                            this.props.activeShortcutDetails.get('password'),
                            this.props.activeShortcutDetails.get('origin'),
                            this.props.activeShortcutDetails.get('action'),
                            true)
        }
        break
      case 'focus-webview':
        setImmediate(() => this.webview.focus())
        break
      case 'load-non-navigatable-url':
        this.webview.loadURL(this.props.activeShortcutDetails)
        break
      case 'copy':
        let selection = window.getSelection()
        if (selection && selection.toString()) {
          appActions.clipboardTextCopied(selection.toString())
        } else {
          this.webview.copy()
        }
        break
      case 'find-next':
        this.onFindAgain(true)
        break
      case 'find-prev':
        this.onFindAgain(false)
        break
    }
    if (this.props.activeShortcut) {
      windowActions.setActiveFrameShortcut(this.frame, null, null)
    }
  }

  /**
   * Shows a Widevine CtP notification if Widevine is installed and enabled.
   * If not enabled, alert user that Widevine is installed.
   * @param {string} origin - frame origin that is requesting to run widevine.
   *   can either be main frame or subframe.
   * @param {function=} noWidevineCallback - Optional callback to run if Widevine is not
   *   installed
   * @param {function=} widevineCallback - Optional callback to run if Widevine is
   *   accepted
   */
  showWidevineNotification (location, origin, noWidevineCallback, widevineCallback) {
    // https://www.nfl.com is said to be a widevine site but it actually uses Flash for me Oct 10, 2016
    const widevineSites = ['https://www.netflix.com',
      'http://bitmovin.com',
      'https://shaka-player-demo.appspot.com']
    const isForWidevineTest = process.env.NODE_ENV === 'test' && location.endsWith('/drm.html')
    if (!isForWidevineTest && (!origin || !widevineSites.includes(origin))) {
      noWidevineCallback()
      return
    }

    // Generate a random string that is unlikely to collide. Not
    // cryptographically random.
    const nonce = Math.random().toString()

    if (this.props.widevine && this.props.widevine.get('enabled')) {
      const message = locale.translation('allowWidevine').replace(/{{\s*origin\s*}}/, this.origin)
      // Show Widevine notification bar
      appActions.showMessageBox({
        buttons: [
          {text: locale.translation('deny')},
          {text: locale.translation('allow')}
        ],
        message,
        frameOrigin: this.origin,
        options: {
          nonce,
          persist: true
        }
      })
      this.notificationCallbacks[message] = (buttonIndex, persist) => {
        if (buttonIndex === 1) {
          if (persist) {
            appActions.changeSiteSetting(this.origin, 'widevine', 1)
          } else {
            appActions.changeSiteSetting(this.origin, 'widevine', 0)
          }
          if (widevineCallback) {
            widevineCallback()
          }
        } else {
          if (persist) {
            appActions.changeSiteSetting(this.origin, 'widevine', false)
          }
        }
        appActions.hideMessageBox(message)
      }
    } else {
      windowActions.widevineSiteAccessedWithoutInstall()
    }

    ipc.once(messages.NOTIFICATION_RESPONSE + nonce, (e, msg, buttonIndex, persist) => {
      const cb = this.notificationCallbacks[msg]
      if (cb) {
        cb(buttonIndex, persist)
      }
    })
  }

  addEventListeners () {
    this.webview.addEventListener('content-blocked', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.details[0] === 'javascript' && e.details[1]) {
        windowActions.setBlockedBy(this.frame, 'noScript', e.details[1])
      }
    })
    this.webview.addEventListener('did-block-run-insecure-content', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setBlockedRunInsecureContent(this.frame, e.details[0])
    })
    this.webview.addEventListener('enable-pepper-menu', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onFlashContextMenu(e.params, this.frame)
      e.preventDefault()
      e.stopPropagation()
    })
    this.webview.addEventListener('context-menu', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onMainContextMenu(e.params, this.frame, this.tab)
      e.preventDefault()
      e.stopPropagation()
    })
    this.webview.addEventListener('update-target-url', (e) => {
      if (!this.root) {
        this.root = window.getComputedStyle(document.querySelector(':root'))
        this.downloadsBarHeight = Number.parseInt(this.root.getPropertyValue('--downloads-bar-height'), 10)
      }
      let nearBottom = e.y > (window.innerHeight - 150 - this.downloadsBarHeight)
      let mouseOnLeft = e.x < (window.innerWidth / 2)
      let showOnRight = nearBottom && mouseOnLeft
      windowActions.setLinkHoverPreview(e.url, showOnRight)
    })
    this.webview.addEventListener('focus', this.onFocus)
    this.webview.addEventListener('mouseenter', (e) => {
      currentWindowWebContents.send(messages.ENABLE_SWIPE_GESTURE)
    })
    this.webview.addEventListener('mouseleave', (e) => {
      currentWindowWebContents.send(messages.DISABLE_SWIPE_GESTURE)
    })
    this.webview.addEventListener('did-attach', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      // TODO: Remove webview.getId() part below when everyone is on a newer electron
      let tabId = e.tabId !== undefined ? e.tabId : this.webview.getId()
      if (this.props.tabId !== tabId) {
        windowActions.setFrameTabId(this.frame, tabId)
      }
    })
    this.webview.addEventListener('destroyed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      this.props.onCloseFrame(this.frame)
    })
    this.webview.addEventListener('close', () => {
      if (this.frame.isEmpty()) {
        return
      }
      this.props.onCloseFrame(this.frame)
    })
    this.webview.addEventListener('page-favicon-updated', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.favicons && e.favicons.length > 0) {
        imageUtil.getWorkingImageUrl(e.favicons[0], (imageFound) => {
          windowActions.setFavicon(this.frame, imageFound ? e.favicons[0] : null)
        })
      }
    })
    this.webview.addEventListener('show-autofill-settings', (e) => {
      windowActions.newFrame({ location: 'about:autofill' }, true)
    })
    this.webview.addEventListener('show-autofill-popup', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onShowAutofillMenu(e.suggestions, e.rect, this.frame)
    })
    this.webview.addEventListener('hide-autofill-popup', (e) => {
      if (this.props.contextMenuDetail && this.props.contextMenuDetail.get('type') === 'autofill' &&
        (this.props.contextMenuDetail.get('tabId') !== this.props.tabId || this.webview.isFocused())) {
        windowActions.autofillPopupHidden(this.props.tabId)
      }
    })
    this.webview.addEventListener('ipc-message', (e) => {
      let method = () => {}
      switch (e.channel) {
        case messages.ABOUT_COMPONENT_INITIALIZED:
          this.updateAboutDetails({})
          break
        case messages.GOT_CANVAS_FINGERPRINTING:
          if (this.frame.isEmpty()) {
            return
          }
          method = (detail) => {
            const description = [detail.type, detail.scriptUrl || this.props.provisionalLocation].join(': ')
            windowActions.setBlockedBy(this.frame, 'fingerprintingProtection', description)
          }
          break
        case messages.THEME_COLOR_COMPUTED:
          if (this.frame.isEmpty()) {
            return
          }
          method = (computedThemeColor) =>
            windowActions.setThemeColor(this.frame, undefined, computedThemeColor || null)
          break
        case messages.CONTEXT_MENU_OPENED:
          if (this.frame.isEmpty()) {
            return
          }
          method = (nodeProps, contextMenuType) => {
            contextMenus.onMainContextMenu(nodeProps, this.frame, this.tab, contextMenuType)
          }
          break
        case messages.STOP_LOAD:
          method = () => this.webview.stop()
          break
        case messages.GO_BACK:
          method = () => this.webview.goBack()
          break
        case messages.GO_FORWARD:
          method = () => this.webview.goForward()
          break
        case messages.RELOAD:
          method = () => {
            this.reloadCounter[this.props.location] = this.reloadCounter[this.props.location] || 0
            if (this.reloadCounter[this.props.location] < 2) {
              this.webview.reload()
              this.reloadCounter[this.props.location] = this.reloadCounter[this.props.location] + 1
            }
          }
          break
        case messages.CLEAR_BROWSING_DATA_NOW:
          method = () =>
            windowActions.setClearBrowsingDataPanelVisible(true)
          break
        case messages.AUTOFILL_SET_ADDRESS:
          method = (currentDetail, originalDetail) =>
            windowActions.setAutofillAddressDetail(currentDetail, originalDetail)
          break
        case messages.AUTOFILL_SET_CREDIT_CARD:
          method = (currentDetail, originalDetail) =>
            windowActions.setAutofillCreditCardDetail(currentDetail, originalDetail)
          break
      }
      method.apply(this, e.args)
    })

    const loadStart = (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.isMainFrame && !e.isErrorPage && !e.isFrameSrcDoc) {
        windowActions.onWebviewLoadStart(this.frame, e.url)
        // Clear security state
        windowActions.setBlockedRunInsecureContent(this.frame)
        windowActions.setSecurityState(this.frame, {
          secure: null,
          runInsecureContent: false
        })
      }
    }

    const loadEnd = (savePage, url) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.onWebviewLoadEnd(this.frame, url)
      const parsedUrl = urlParse(url)
      if (!this.allowRunningWidevinePlugin()) {
        this.showWidevineNotification(this.props.location, this.origin, () => {
        }, () => {
          windowActions.loadUrl(this.frame, this.props.provisionalLocation)
        })
      }

      const protocol = parsedUrl.protocol
      const isError = this.props.aboutDetails && this.props.aboutDetails.get('errorCode')
      if (!this.props.isPrivate && (protocol === 'http:' || protocol === 'https:') && !isError && savePage) {
        // Register the site for recent history for navigation bar
        // calling with setTimeout is an ugly hack for a race condition
        // with setTitle. We either need to delay this call until the title is
        // or add a way to update it
        setTimeout(() => {
          appActions.addSite(siteUtil.getDetailFromFrame(this.frame))
        }, 250)
      }

      if (url.startsWith(pdfjsOrigin)) {
        let displayLocation = UrlUtil.getLocationIfPDF(url)
        windowActions.setSecurityState(this.frame, {
          secure: urlParse(displayLocation).protocol === 'https:',
          runInsecureContent: false
        })
      }
    }

    const loadFail = (e, provisionLoadFailure, url) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (isFrameError(e.errorCode)) {
        // temporary workaround for https://github.com/brave/browser-laptop/issues/1817
        if (e.validatedURL === aboutUrls.get('about:newtab') ||
            e.validatedURL === aboutUrls.get('about:blank') ||
            e.validatedURL === aboutUrls.get('about:certerror') ||
            e.validatedURL === aboutUrls.get('about:error') ||
            e.validatedURL === aboutUrls.get('about:safebrowsing')) {
          // this will just display a blank page for errors
          // but we don't want to take the user out of the private tab
          return
        } else if (isTargetAboutUrl(e.validatedURL)) {
          // open a new tab for other about urls
          // and send this tab back to wherever it came from
          this.goBack()
          windowActions.newFrame({location: e.validatedURL}, true)
          return
        }

        windowActions.setFrameError(this.frame, {
          event_type: 'did-fail-load',
          errorCode: e.errorCode,
          url: e.validatedURL
        })
        windowActions.loadUrl(this.frame, 'about:error')
        appActions.removeSite(siteUtil.getDetailFromFrame(this.frame))
      } else if (provisionLoadFailure) {
        windowActions.setNavigated(url, this.props.frameKey, true, this.frame.get('tabId'))
      }
    }
    this.webview.addEventListener('security-style-changed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      let isSecure = null
      let runInsecureContent = this.runInsecureContent()
      // 'warning' and 'passive mixed content' should never upgrade the
      // security state from insecure to secure
      if (e.securityState === 'secure' ||
          (this.props.isSecure !== false &&
           runInsecureContent !== true &&
           ['warning', 'passive-mixed-content'].includes(e.securityState))) {
        isSecure = true
      } else if (['broken', 'insecure'].includes(e.securityState)) {
        isSecure = false
      }
      // TODO: show intermediate UI for 'warning' and 'passive-mixed-content'
      windowActions.setSecurityState(this.frame, {
        secure: isSecure,
        runInsecureContent
      })
      if (isSecure) {
        // Check that there isn't a cert error.
        const parsedUrl = urlParse(this.props.location)
        ipc.send(messages.CHECK_CERT_ERROR_ACCEPTED, parsedUrl.host, this.props.frameKey)
      }
    })
    this.webview.addEventListener('load-start', (e) => {
      loadStart(e)
    })
    this.webview.addEventListener('did-navigate', (e) => {
      if (this.props.findbarShown) {
        this.props.onFindHide()
      }

      for (let message in this.notificationCallbacks) {
        appActions.hideMessageBox(message)
      }
      this.notificationCallbacks = {}
      const isNewTabPage = getBaseUrl(e.url) === getTargetAboutUrl('about:newtab')
      // Only take focus away from the urlBar if:
      // The tab is active, it's not the new tab page, and the webview isn't already active.
      if (this.props.isActive && !isNewTabPage && document.activeElement !== this.webview) {
        this.webview.focus()
      }
      if (!this.frame.isEmpty()) {
        windowActions.setNavigated(e.url, this.props.frameKey, false, this.frame.get('tabId'))
      }
      // force temporary url display for tabnapping protection
      windowActions.setMouseInTitlebar(true)
    })
    this.webview.addEventListener('crashed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFrameError(this.frame, {
        event_type: 'crashed',
        title: 'unexpectedError',
        url: this.props.location
      })
      windowActions.loadUrl(this.frame, 'about:error')
      this.webview = false
    })
    this.webview.addEventListener('did-fail-provisional-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false, e.validatedURL)
        loadFail(e, true, e.currentURL)
      }
    })
    this.webview.addEventListener('did-fail-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false, e.validatedURL)
        loadFail(e, false, e.validatedURL)
      }
    })
    this.webview.addEventListener('did-finish-load', (e) => {
      loadEnd(true, e.validatedURL)
      if (this.runInsecureContent()) {
        appActions.removeSiteSetting(this.origin, 'runInsecureContent', this.props.isPrivate)
      }
    })
    this.webview.addEventListener('did-navigate-in-page', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.isMainFrame) {
        windowActions.setNavigated(e.url, this.props.frameKey, true, this.frame.get('tabId'))
        loadEnd(true, e.url)
      }
    })
    this.webview.addEventListener('enter-html-full-screen', () => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFullScreen(this.frame, true, true)
      // disable the fullscreen warning after 5 seconds
      setTimeout(windowActions.setFullScreen.bind(this, this.frame, undefined, false), 5000)
    })
    this.webview.addEventListener('leave-html-full-screen', () => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFullScreen(this.frame, false)
    })
    this.webview.addEventListener('media-started-playing', ({title}) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setAudioPlaybackActive(this.frame, true)
    })
    this.webview.addEventListener('media-paused', ({title}) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setAudioPlaybackActive(this.frame, false)
    })
    this.webview.addEventListener('did-change-theme-color', ({themeColor}) => {
      if (this.frame.isEmpty()) {
        return
      }
      // Due to a bug in Electron, after navigating to a page with a theme color
      // to a page without a theme color, the background is sent to us as black
      // even know there is no background. To work around this we just ignore
      // the theme color in that case and let the computed theme color take over.
      windowActions.setThemeColor(this.frame, themeColor !== '#000000' ? themeColor : null)
    })
    this.webview.addEventListener('found-in-page', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.result !== undefined && (e.result.matches !== undefined || e.result.activeMatchOrdinal !== undefined)) {
        if (e.result.matches === 0) {
          windowActions.setFindDetail(this.frame, Immutable.fromJS({
            numberOfMatches: 0,
            activeMatchOrdinal: 0
          }))
          return
        }
        windowActions.setFindDetail(this.frame, Immutable.fromJS({
          numberOfMatches: e.result.matches || this.props.findDetail && this.props.findDetail.get('numberOfMatches') || 0,
          activeMatchOrdinal: e.result.activeMatchOrdinal || this.props.findDetail && this.props.findDetail.get('activeMatchOrdinal')
        }))
      }
    })
    this.webview.addEventListener('did-get-response-details', (details) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.gotResponseDetails(this.frame.get('tabId'), details)
    })
    // Handle zoom using Ctrl/Cmd and the mouse wheel.
    this.webview.addEventListener('mousewheel', this.onMouseWheel.bind(this))
  }

  goBack () {
    this.webview.goBack()
  }

  getHistoryEntry (sites, index) {
    const url = this.webview.getURLAtIndex(index)
    const title = this.webview.getTitleAtIndex(index)

    let entry = {
      index: index,
      url: url,
      display: title || url,
      icon: null
    }

    if (url.startsWith('chrome-extension://')) {
      // TODO: return brave lion (or better: get icon from extension if possible as data URI)
    } else {
      if (sites) {
        const site = sites.find(function (element) { return element.get('location') === url })
        if (site) { entry.icon = site.get('favicon') }
      }

      if (!entry.icon) { entry.icon = UrlUtil.getDefaultFaviconUrl(url) }
    }

    return entry
  }

  getHistory (appState) {
    const historyCount = this.webview.getEntryCount()
    const currentIndex = this.webview.getCurrentEntryIndex()
    const sites = appState ? appState.get('sites') : null

    let history = {
      count: historyCount,
      currentIndex,
      entries: []
    }

    for (let index = 0; index < historyCount; index++) {
      history.entries.push(this.getHistoryEntry(sites, index))
    }

    return history
  }

  goToIndex (index) {
    this.webview.goToIndex(index)
  }

  goForward () {
    this.webview.goForward()
  }

  get origin () {
    return siteUtil.getOrigin(this.props.location)
  }

  onFocus () {
    if (!this.frame.isEmpty()) {
      windowActions.setTabPageIndexByFrame(this.frame)
    }

    // Make sure urlBar focused state is updated so that on tab
    // changes the focus state doesn't go back to the urlBar
    windowActions.setUrlBarFocused(false)
    windowActions.setUrlBarActive(false)

    windowActions.setContextMenuDetail()
    windowActions.setPopupWindowDetail()
  }

  onFindAgain (forward) {
    if (!this.props.findbarShown) {
      windowActions.setFindbarShown(this.frame, true)
    }
    const searchString = this.props.findDetail && this.props.findDetail.get('searchString')
    if (searchString) {
      webviewActions.findInPage(searchString, this.props.findDetail && this.props.findDetail.get('caseSensitivity') || undefined, forward, this.props.findDetail.get('internalFindStatePresent'), this.webview)
    }
  }

  onUpdateWheelZoom () {
    if (this.wheelDeltaY > 0) {
      this.zoomIn()
    } else if (this.wheelDeltaY < 0) {
      this.zoomOut()
    }
    this.wheelDeltaY = 0
  }

  onMouseWheel (e) {
    if (e.ctrlKey) {
      e.preventDefault()
      this.wheelDeltaY = (this.wheelDeltaY || 0) + e.wheelDeltaY
      this.onUpdateWheelZoom()
    } else {
      this.wheelDeltaY = 0
    }
  }

  getWebRTCPolicy (props) {
    const braverySettings = this.getFrameBraverySettings(props)
    if (!braverySettings || braverySettings.get('fingerprintingProtection') !== true) {
      return WEBRTC_DEFAULT
    } else {
      return WEBRTC_DISABLE_NON_PROXY
    }
  }

  render () {
    return <div
      className={cx({
        frameWrapper: true,
        isPreview: this.props.isPreview,
        isActive: this.props.isActive
      })}>
      {
        this.props.isFullScreen && this.props.showFullScreenWarning
        ? <FullScreenWarning location={this.props.location} />
        : null
      }
      <div ref={(node) => { this.webviewContainer = node }}
        className={cx({
          webviewContainer: true,
          isPreview: this.props.isPreview
        })} />
      {
        this.props.hrefPreview
        ? <div className={cx({
          hrefPreview: true,
          right: this.props.showOnRight
        })}>
          {this.props.hrefPreview}
        </div>
        : null
      }
    </div>
  }
}

module.exports = Frame
