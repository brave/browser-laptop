/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const AboutPageIcon = require('../../../../icons/brave')
const WarningIcon = require('../../../../icons/information')
const EncryptedIcon = require('../../../../icons/small_lock')
const UnencryptedIcon = require('../../../../icons/small_unlock')
const DefaultSearchIcon = require('../../../../icons/search')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')

// State
const tabState = require('../../../common/state/tabState')

// Utils
const dndData = require('../../../../js/dndData')
const UrlUtil = require('../../../../js/lib/urlutil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const {isPotentialPhishingUrl, isOnionUrl} = require('../../../../js/lib/urlutil')

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
    const frameSecurity = activeFrame.get('security')

    const props = {}
    // used in renderer
    props.activateSearchEngine = urlBar.getIn(['searchDetail', 'activateSearchEngine'])
    props.active = urlBar.get('active')
    props.isSecure = frameSecurity && frameSecurity.get('isSecure')
    props.isSecureWithEVCert = frameSecurity && frameSecurity.get('evCert')
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

    let icon = null
    let iconTestId = ''
    let isInsecure = false
    let isExtendedSecure = false
    const instanceStyles = {}

    if (this.props.activateSearchEngine) {
      icon = <img src={this.props.searchSelectImage}
        className={css(styles.searchIcon)} alt='Search provider icon' />
    } else if (this.props.isPotentialPhishingUrl) {
      icon = <WarningIcon />
      iconTestId = 'isPotentialPhishingUrl'
      isInsecure = true
    } else if (this.isSearch) {
      icon = <DefaultSearchIcon />
      iconTestId = 'isSearch'
    } else if (this.props.isAboutPage) {
      icon = <AboutPageIcon />
      iconTestId = 'isAbout'
    } else if (this.props.isHTTPPage && !this.props.active) {
      if (this.props.isSecure === true) {
        icon = <EncryptedIcon />
        iconTestId = 'isSecure'
        isExtendedSecure = this.props.isSecureWithEVCert
      } else if (this.props.isOnionUrl) {
        iconTestId = 'isInsecureOnion'
      } else if (this.props.isSecure === 1) {
        icon = <UnencryptedIcon />
        iconTestId = 'isInsecure'
      } else if (this.props.isSecure === false || this.props.isSecure === 2) {
        icon = <UnencryptedIcon />
        iconTestId = 'isInsecureColor'
        isInsecure = true
      }
    }

    return <div
      data-test-id='urlBarIcon'
      data-test2-id={iconTestId}
      {...props}
      className={css(
        styles.urlBarIcon,
        isExtendedSecure && styles.urlBarIcon_extendedSecure,
        isInsecure && styles.urlBarIcon_warning
      )}
      style={instanceStyles}
    >
      { icon }
    </div>
  }
}

const searchIconSize = 14
const iconSize = 20
const styles = StyleSheet.create({
  urlBarIcon: {
    '--url-bar-icon-color': '#696970',
    '--icon-line-color': '#696970',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    width: `${iconSize}px`,
    flexShrink: 0
  },

  searchIcon: {
    width: `${searchIconSize}px`
  },

  urlBarIcon_extendedSecure: {
    '--icon-line-color': '#7ED321'
  },

  urlBarIcon_warning: {
    '--icon-line-color': '#ff0000'
  }
})

module.exports = ReduxComponent.connect(UrlBarIcon)
