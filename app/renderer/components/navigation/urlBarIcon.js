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
const {isPotentialPhishingUrl, isOnionUrl} = require('../../../../js/lib/urlutil')

const searchIconSize = 16

class UrlBarIcon extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
  }

  get iconCssClasses () {
    if (this.props.isPotentialPhishingUrl) {
      return ['fa-exclamation-triangle', 'insecure-color']
    } else if (this.isSearch) {
      return ['fa-search']
    } else if (this.props.isAboutPage && !this.props.titleMode) {
      return ['fa-list']
    } else if (this.props.isHTTPPage && !this.props.active) {
      if (this.props.isSecure === true) {
        return ['fa-lock']
      } else if (this.props.isOnionUrl) {
        return []
      } else if (this.props.isSecure === false || this.props.isSecure === 2) {
        return ['fa-unlock', 'insecure-color']
      } else if (this.props.isSecure === 1) {
        return ['fa-unlock']
      }
    }

    return []
  }

  get dataTestId () {
    if (this.props.isPotentialPhishingUrl) {
      return ['isPotentialPhishingUrl']
    } else if (this.isSearch) {
      return ['isSearch']
    } else if (this.props.isAboutPage && !this.props.titleMode) {
      return ['isAboutPage']
    } else if (this.props.isHTTPPage && !this.props.active) {
      if (this.props.isSecure === true) {
        return ['isSecure']
      } else if (this.props.isSecure === false || this.props.isSecure === 2) {
        return ['isInsecureColor']
      } else if (this.props.isSecure === 1) {
        return ['isInsecure']
      }
    }

    return []
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

  get iconClasses () {
    if (this.props.activateSearchEngine) {
      return cx({
        urlbarIcon: true
      })
    }

    const iconClasses = {
      urlbarIcon: true,
      fa: true
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
      height: searchIconSize
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
    dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.TAB, {
      location: this.props.location,
      title: this.props.title
    })
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
    props.isOnionUrl = isOnionUrl(props.location)

    // used in other functions
    props.title = activeFrame.get('title', '')

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
      data-test-id='urlBarIcon'
      data-test2-id={this.dataTestId}
      {...props}
      className={this.iconClasses}
      style={this.iconStyles} />
  }
}

module.exports = ReduxComponent.connect(UrlBarIcon)
