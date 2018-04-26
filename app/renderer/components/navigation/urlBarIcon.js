/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const AboutPageIcon = require('./icons/aboutPage')

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

function EncryptedIcon () {
  return <svg xmlns='http://www.w3.org/2000/svg' width='11' height='14' viewBox='0 0 11 14'>
    <path fill='none' className={css(iconStyles.linePath)} strokeLinecap='round' strokeLinejoin='round'
      strokeWidth='1.25' d='M9.26666667 6.22341719h-7.2C1.47786667 6.22341719 1 6.70128385 1 7.29008385v4.26880005c0 .5898666.47786667 1.0666666 1.06666667 1.0666666h7.2c.58986666 0 1.06666666-.4768 1.06666666-1.0666666V7.29008385c0-.5888-.4768-1.06666666-1.06666666-1.06666666zm-1.06666667 0V3.68475052c0-1.39626667-1.1328-2.528-2.528-2.528h-.01066667c-1.39626666 0-2.528 1.13173333-2.528 2.528v2.53866667'
    />
  </svg>
}

function UnencryptedIcon () {
  return <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'>
    <g className={css(iconStyles.linePath)} fillRule='evenodd' strokeLinecap='round'
      strokeLinejoin='round' strokeWidth='1.25'>
      <path d='M10.01106767 6.183771h-7.3125c-.59908334 0-1.08333334.48533333-1.08333334 1.08333333v4.33549997c0 .5990834.48425 1.0833334 1.08333334 1.0833334h7.3125c.59908333 0 1.08333333-.48425 1.08333333-1.0833334V7.26710433c0-.598-.48425-1.08333333-1.08333333-1.08333333z'
      />
      <path d='M13.2632343 2.879821c-.3130833-1.06491667-1.29675-1.84166667-2.46349997-1.84166667H10.788901c-1.41808333 0-2.5675 1.14941667-2.5675 2.56641667v2.57941667'
      />
    </g>
  </svg>
}

function DefaultSearchIcon () {
  return <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 13 13'>
    <path className={css(iconStyles.linePath)} strokeLinecap='round' strokeLinejoin='round'
      strokeWidth='1.25' d='M5.273041 9.835491c-2.5146 0-4.5534-2.0388-4.5534-4.554 0-2.5146 2.0388-4.5534 4.5534-4.5534 2.5146 0 4.5534 2.0388 4.5534 4.5534 0 2.5152-2.0388 4.554-4.5534 4.554zm3.21972-1.33356l3.4764 3.4764'
    />
  </svg>
}

function WarningIcon () {
  return <svg xmlns='http://www.w3.org/2000/svg' width='15' height='14' viewBox='0 0 15 14'>
    <g className={css(iconStyles.linePath)} fillRule='evenodd' strokeLinecap='round'
      strokeWidth='1.25'>
      <path d='M7.48830485 1.38180744c.20831413 0 .41662827.10324073.53208684.31033309l2.84797801 5.09606025 2.8809663 5.15470592c.1124041.1997616.0946882.4227372-.0079416.5956196m.0001832.0001221c-.1026298.1734933-.2926172.2975044-.5241452.2975044H1.75954384c-.23213892 0-.4221263-.1240111-.52475614-.2975044M7.48830485 1.38180744c-.20831414 0-.41662828.10324073-.53208685.31033309L4.10823995 6.78820078 1.22727373 11.9429067c-.11240411.1997616-.09468825.4227372.0079416.5956196'
      />
      <path strokeLinejoin='round' d='M7.50744629 5.17997901v3.72988573m0 1.63472441v.08348995'
      />
    </g>
  </svg>
}

function SpecificSearchEngineIcon ({ faviconUrl }) {
  return null
}

const iconStyles = StyleSheet.create({
  linePath: {
    stroke: 'var(--url-bar-icon-color)',
    fill: 'none'
  }
})

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
const styles = StyleSheet.create({
  urlBarIcon: {
    '--url-bar-icon-color': '#696970',
    height: '100%',
    display: 'flex',
    alignItems: 'center'
  },

  urlBarIcon_secure: {
    '--url-bar-icon-color': '#7ED321'
  },

  urlBarIcon_warning: {
    '--url-bar-icon-color': '#ff0000'
  },

  urlBarIcon_specificSearchEngine: {
    backgroundImage: 'var(--search-engine-favicon-url)',
    backgroundSize: searchIconSize,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    width: searchIconSize
  }
})

module.exports = ReduxComponent.connect(UrlBarIcon)
