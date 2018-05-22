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
const {isPotentialPhishingUrl} = require('../../../../js/lib/urlutil')

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

    const props = {}
    // used in renderer
    props.activateSearchEngine = urlBar.getIn(['searchDetail', 'activateSearchEngine'])
    props.active = urlBar.get('active')
    props.isSecure = activeFrame.getIn(['security', 'isSecure'])
    props.isFullySecure = props.isSecure === true
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
    let isVeryInsecure = false
    let isVerySecure = false
    if (this.props.activateSearchEngine) {

    } else if (this.props.isPotentialPhishingUrl) {
      icon = <WarningIcon />
      iconTestId = 'isPotentialPhishingUrl'
      isVeryInsecure = true
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
        isVerySecure = true
      } else if (this.props.isSecure === 1) {
        icon = <UnencryptedIcon />
        iconTestId = 'isInsecure'
      } else if (this.props.isSecure === false || this.props.isSecure === 2) {
        icon = <UnencryptedIcon />
        iconTestId = 'isInsecureColor'
        isVeryInsecure = true
      }
    }

    const instanceStyles = {}
    if (this.props.activateSearchEngine) {
      instanceStyles['--search-engine-favicon-url'] = `url(${this.props.searchSelectImage})`
    }

    return <div
      data-test-id='urlBarIcon'
      data-test2-id={iconTestId}
      {...props}
      className={css(
        styles.urlBarIcon,
        isVerySecure && styles.urlBarIcon_secure,
        isVeryInsecure && styles.urlBarIcon_warning,
        this.props.activateSearchEngine && styles.urlBarIcon_specificSearchEngine
      )}
      style={instanceStyles}>
      { icon }
    </div>
  }
}

const searchIconSize = 16
const iconSize = 20
const styles = StyleSheet.create({
  urlBarIcon: {
    '--url-bar-icon-color': '#696970',
    '--icon-line-color': '#696970',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    width: `${iconSize}px`
  },

  urlBarIcon_secure: {
    '--icon-line-color': '#7ED321'
  },

  urlBarIcon_warning: {
    '--icon-line-color': '#ff0000'
  },

  urlBarIcon_specificSearchEngine: {
    backgroundImage: 'var(--search-engine-favicon-url)',
    backgroundSize: `${searchIconSize}px`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center'
  }
})

module.exports = ReduxComponent.connect(UrlBarIcon)
