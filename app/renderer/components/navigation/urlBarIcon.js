/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')

// State
const tabState = require('../../../common/state/tabState')

// Utils
const cx = require('../../../../js/lib/classSet')
const dndData = require('../../../../js/dndData')
const UrlUtil = require('../../../../js/lib/urlutil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const {isPotentialPhishingUrl} = require('../../../../js/lib/urlutil')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

const searchIconSize = 16

class UrlBarIcon extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
  }

  /**
   * search icon:
   * - does not show when in title mode
   * - shows when urlbar is active (ex: you can type)
   * - is a catch-all for: about pages, files, etc
   */
  get isSearch () {
    const showSearch = this.props.isSearching && !this.props.titleMode
    const defaultToSearch = (!this.props.isHTTPPage || this.props.active) &&
                            !this.props.titleMode &&
                            !this.props.isAboutPage
    return showSearch || defaultToSearch
  }

  get isAboutPage () {
    return isSourceAboutUrl(this.props.location) &&
      this.props.location !== 'about:newtab'
  }

  get iconCssClasses () {
    if (isPotentialPhishingUrl(this.props.location)) {
      return [globalStyles.appIcons.exclamationTriangle, css(styles.urlbarIcon_large, styles.urlbarIcon_siteInsecureColor)]
    } else if (this.isSearch) {
      return [globalStyles.appIcons.search]
    } else if (this.isAboutPage && !this.props.titleMode) {
      return [globalStyles.appIcons.list]
    } else if (this.props.isHTTPPage && !this.props.active) {
      // NOTE: EV style not approved yet; see discussion at https://github.com/brave/browser-laptop/issues/791
      if (this.props.isSecure === true) {
        return [globalStyles.appIcons.lock, css(styles.urlbarIcon_large)]
      } else if (this.props.isSecure === false || this.props.isSecure === 2) {
        return [globalStyles.appIcons.unlock, css(styles.urlbarIcon_large, styles.urlbarIcon_siteInsecureColor, styles.urlbarIcon_insecure)]
      } else if (this.props.isSecure === 1) {
        return [globalStyles.appIcons.unlock, css(styles.urlbarIcon_large, styles.urlbarIcon_insecure)]
      }
    }
    return []
  }

  get iconClasses () {
    if (this.props.activateSearchEngine) {
      return null
    }

    // Move fa-list (not fa-search) icon on about pages 1px down
    // ref: urlbarIcon_relative
    const relativeIcon = this.isAboutPage && !this.isSearch

    const iconClasses = {
      [css(styles.urlbarIcon, this.props.titleMode && styles.urlbarIcon_titleMode, this.isSearch && styles.urlbarIcon_isSearch, relativeIcon && styles.urlbarIcon_relative)]: true
    }

    this.iconCssClasses.forEach((iconClass) => {
      iconClasses[iconClass] = true
    })

    return cx(iconClasses)
  }

  get iconStyles () {
    if (!this.props.activateSearchEngine) {
      return {}
    }

    return {
      backgroundImage: `url(${this.props.searchSelectImage})`,
      backgroundSize: searchIconSize,
      width: searchIconSize,
      height: searchIconSize,
      WebkitAppRegion: 'no-drag'
    }
  }

  onClick () {
    if (isSourceAboutUrl(this.props.location) || this.isSearch) {
      return
    }

    windowActions.setSiteInfoVisible(true)
  }

  onDragStart (e) {
    dndData.setupDataTransferURL(e.dataTransfer, this.props.location, this.props.title)
    dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.TAB, this.props.activeFrame)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const urlBar = activeFrame.getIn(['navbar', 'urlbar'], Immutable.Map())
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const displayURL = tabState.getVisibleVirtualURL(state, activeTabId) || ''
    const urlBarLocation = urlBar.get('location')

    const props = {}
    // used in renderer
    props.activateSearchEngine = urlBar.getIn(['searchDetail', 'activateSearchEngine'])
    props.active = urlBar.get('active')
    props.isSecure = activeFrame.getIn(['security', 'isSecure'])
    props.location = displayURL
    props.isHTTPPage = UrlUtil.isHttpOrHttps(props.location)
    props.searchSelectImage = urlBar.getIn(['searchDetail', 'image'], '')
    props.titleMode = ownProps.titleMode
    props.isSearching = displayURL !== urlBarLocation
    props.activeTabShowingMessageBox = tabState.isShowingMessageBox(state, activeTabId)
    props.isAboutPage = isSourceAboutUrl(props.location) && props.location !== 'about:newtab'
    props.isPotentialPhishingUrl = isPotentialPhishingUrl(props.location)

    // used in other functions
    props.title = activeFrame.get('title', '')
    props.activeFrame = activeFrame // TODO (nejc) only primitives

    return props
  }

  render () {
    // allow click and drag (unless tab is showing a message box)
    const props = {}

    if (!this.props.activeTabShowingMessageBox) {
      props.draggable = true
      props.onClick = this.onClick
      props.onDragStart = this.onDragStart
    }

    return <span
      data-test-id='urlbarIcon'
      {...props}
      className={this.iconClasses}
      style={this.iconStyles} />
  }
}

const styles = StyleSheet.create({

  // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L893-L896
  urlbarIcon: {
    color: globalStyles.color.siteSecureColor,
    fontSize: '12px',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',

    // Disable window dragging so that dragging the favicon is possible.
    // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L704-L707
    WebkitAppRegion: 'no-drag'
  },

  // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L801-L805
  urlbarIcon_titleMode: {
    display: 'inline-block',
    opacity: 0.5,
    minWidth: 0
  },

  // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L809
  // Unlock icon has this value if the title mode is enabled or not.
  urlbarIcon_insecure: {
    opacity: 1
  },

  // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L900-L906
  // about:newtab
  urlbarIcon_isSearch: {

    // 50% of #5a5a5a
    color: 'rgba(90, 90, 90, .5)'
  },

  // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L908-L913
  urlbarIcon_large: {

    // Refactor iconClasses to remove !important
    fontSize: '16px !important'
  },

  // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L897-L898
  urlbarIcon_relative: {
    position: 'relative',
    bottom: '-1px'
  },

  // ref: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L915-L917
  urlbarIcon_siteInsecureColor: {
    color: globalStyles.color.siteInsecureColor
  }
})

module.exports = ReduxComponent.connect(UrlBarIcon)
