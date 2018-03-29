/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer
const remote = require('electron').remote

// Actions
const appActions = require('../../../../js/actions/appActions')
const tabActions = require('../../../common/actions/tabActions')
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const getSetting = require('../../../../js/settings').getSetting

// Components
const ReduxComponent = require('../reduxComponent')

// Store
const windowStore = require('../../../../js/stores/windowStore')
const appStoreRenderer = require('../../../../js/stores/appStoreRenderer')

// State
const siteSettings = require('../../../../js/state/siteSettings')
const siteSettingsState = require('../../../common/state/siteSettingsState')
const tabState = require('../../../common/state/tabState')

// Utils
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const UrlUtil = require('../../../../js/lib/urlutil')
const urlParse = require('../../../common/urlParse')
const domUtil = require('../../lib/domUtil')
const {
  aboutUrls,
  isSourceMagnetUrl,
  isTargetAboutUrl,
  getTargetAboutUrl,
  getBaseUrl,
  isIntermediateAboutPage
} = require('../../../../js/lib/appUrlUtil')
const {isFrameError, isAborted} = require('../../../common/lib/httpUtil')
const {isFocused} = require('../../currentWindow')
const debounce = require('../../../../js/lib/debounce')
const locale = require('../../../../js/l10n')
const imageUtil = require('../../../../js/lib/imageUtil')
const historyUtil = require('../../../common/lib/historyUtil')

// Constants
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')
const messages = require('../../../../js/constants/messages')
const config = require('../../../../js/constants/config')

function isTorrentViewerURL (url) {
  const isEnabled = getSetting(settings.TORRENT_VIEWER_ENABLED)
  return isEnabled && isSourceMagnetUrl(url)
}

function isPDFJSURL (url) {
  const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}/`
  return url && url.startsWith(pdfjsOrigin)
}

class Frame extends React.Component {
  constructor (props) {
    super(props)
    // TODO: use something more purpose-built than a fake element for event emitting
    this.tabEventEmitter = document.createElement('div')
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey) || Immutable.fromJS({})
  }

  get tab () {
    const frame = this.frame
    if (!appStoreRenderer.state.get('tabs')) {
      return undefined
    }
    return appStoreRenderer.state.get('tabs').find((tab) => tab.get('tabId') === frame.get('tabId'))
  }

  isAboutPage () {
    return aboutUrls.get(getBaseUrl(this.props.location))
  }

  isIntermediateAboutPage () {
    return isIntermediateAboutPage(getBaseUrl(this.props.location))
  }


  componentDidMount () {
    this.addEventListeners()
  }

  // NOT CALLED:
  // get zoomLevel () {
  //   const zoom = this.props.siteZoomLevel
  //   appActions.removeSiteSetting(this.props.origin, 'zoomLevel', this.props.isPrivate)
  //   return zoom
  // }

  componentDidUpdate (prevProps) {

    // tab id changed
    if (prevProps.tabId && this.props.tabId !== prevProps.tabId) {
      console.log('cdu frame tab id changed', this.props.tabId)
      this.unregisterEventListener(prevProps.tabId)
      this.registerEventListener(this.props.tabId)
    }
  }

  eventListener (event) {
    if (event.type === 'destroyed') {
      console.log('tab destroyed, unregistering remote webcontents event listener')
      this.unregisterEventListener(this.props.tabId)
    }
    console.debug(this.props.tabId, event.type)
    this.tabEventEmitter.dispatchEvent(event)
  }

  registerEventListener (tabId) {
    this.webContents = null
    remote.getWebContents(tabId, (webContents) => {
      this.webContents = webContents
      if (!webContents) {
        console.error('frame could not get webcontents')
      }
    })
    remote.registerEvents(tabId, this.eventListener)
  }

  unregisterEventListener (tabId) {
    if (tabId == null)
      return

    remote.unregisterEvents(tabId, this.eventListener)
  }

  addEventListeners () {
    console.log(this.props.tabId, 'registering event listeners')
    this.eventListener = this.eventListener.bind(this)

    if (this.props.tabId) {
      this.registerEventListener(this.props.tabId)
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey) || Immutable.Map()
    const tabId = frame.get('tabId', tabState.TAB_ID_NONE)

    const location = frame.get('location')
    const origin = tabState.getVisibleOrigin(state, tabId)
    const isPrivate = frame.get('isPrivate', false)

    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, isPrivate)
    const frameSiteSettings = siteSettings.getSiteSettingsForURL(allSiteSettings, location) || Immutable.Map()

    const tab = tabId && tabId > -1 && tabState.getByTabId(state, tabId)

    const props = {}
    // used in renderer
    props.isFullScreen = frame.get('isFullScreen')
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, frame.get('key'))
    props.location = location
    props.tabId = tabId

    // used in other functions
    props.frameKey = ownProps.frameKey
    props.origin = origin
    props.noScript = frameSiteSettings.get('noScript')
    props.noScriptExceptions = frameSiteSettings.get('noScriptExceptions')

    props.widevine = frameSiteSettings.get('widevine')
    props.flash = frameSiteSettings.get('flash')
    props.isPrivate = frame.get('isPrivate')

    return props
  }

  render () {
    return null
  }
}

module.exports = ReduxComponent.connect(Frame)
