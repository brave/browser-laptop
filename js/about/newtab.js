/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path')
const React = require('react')
const Immutable = require('immutable')
const {DragDropContext} = require('react-dnd')
const HTML5Backend = require('react-dnd-html5-backend')

// Components
const Stats = require('./newTabComponents/stats')
const Clock = require('./newTabComponents/clock')
const Block = require('./newTabComponents/block')
const SiteRemovalNotification = require('./newTabComponents/siteRemovalNotification')
const FooterInfo = require('./newTabComponents/footerInfo')
const NewPrivateTab = require('./newprivatetab')

// Constants
const messages = require('../constants/messages')
const config = require('../constants/config')

// Actions
const aboutActions = require('./aboutActions')
const windowActions = require('../actions/windowActions')

// Data
const backgrounds = require('../data/backgrounds')

// Utils
const urlutils = require('../lib/urlutil')
const {random} = require('../../app/common/lib/randomUtil')
const ipc = window.chrome.ipcRenderer

// Styles
require('../../less/about/newtab.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class NewTabPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showNotification: false,
      imageLoadFailed: false,
      updatedStamp: undefined,
      showEmptyPage: true,
      showImages: false,
      backgroundImage: undefined
    }

    ipc.on(messages.NEWTAB_DATA_UPDATED, (e, newData) => {
      let data = Immutable.fromJS(newData || {})
      const updatedStamp = data.getIn(['newTabDetail', 'updatedStamp'])

      // Only update if the data has changed.
      if (typeof updatedStamp === 'number' &&
          typeof this.state.updatedStamp === 'number' &&
          updatedStamp === this.state.updatedStamp) {
        return
      }

      const showEmptyPage = !!data.get('showEmptyPage')
      const showImages = !!data.get('showImages') && !showEmptyPage
      this.setState({
        newTabData: data,
        updatedStamp,
        showEmptyPage,
        showImages: !!data.get('showImages') && !showEmptyPage,
        backgroundImage: showImages
          ? this.state.backgroundImage || this.randomBackgroundImage
          : undefined
      })
    })
  }

  get showImages () {
    return this.state.showImages && !!this.state.backgroundImage
  }

  get randomBackgroundImage () {
    const image = Object.assign({}, backgrounds[Math.floor(random() * backgrounds.length)])
    image.style = {backgroundImage: 'url(' + image.source + ')'}
    return image
  }

  get fallbackImage () {
    const image = Object.assign({}, config.newtab.fallbackImage)
    const pathToImage = path.join(__dirname, '..', '..', image.source)
    image.style = {backgroundImage: 'url(' + `${pathToImage}` + ')'}
    return image
  }

  get topSites () {
    return this.state.newTabData.getIn(['newTabDetail', 'sites'], Immutable.List())
  }

  get pinnedTopSites () {
    return this.state.newTabData.getIn(['newTabDetail', 'pinnedTopSites'], Immutable.List())
  }

  get ignoredTopSites () {
    return this.state.newTabData.getIn(['newTabDetail', 'ignoredTopSites'], Immutable.List())
  }

  get gridLayoutSize () {
    return this.state.newTabData.getIn(['newTabDetail', 'gridLayoutSize'], 'small')
  }

  isPinned (siteKey) {
    return this.pinnedTopSites.find(site => site.get('key') === siteKey)
  }

  get gridLayout () {
    const sizeToCount = {large: 18, medium: 12, small: 6}
    const count = sizeToCount[this.gridLayoutSize]

    let sites = this.pinnedTopSites.take(count)

    if (sites.size < count) {
      sites = sites.concat(this.topSites.take(count - sites.size))
    }

    return sites
  }

  showNotification () {
    this.setState({
      showNotification: true
    })
  }

  hideSiteRemovalNotification () {
    this.setState({
      showNotification: false
    })
  }

  onDraggedSite (siteKey, destinationKey) {
    let gridSites = this.topSites
    const currentPosition = gridSites.find(site => site.get('key') === siteKey)
    const finalPosition = gridSites.find(site => site.get('key') === destinationKey)

    const currentPositionIndex = gridSites.indexOf(currentPosition)
    const finalPositionIndex = gridSites.indexOf(finalPosition)

    // Removes block current position and puts it after
    gridSites = gridSites.splice(currentPositionIndex, 1)
    gridSites = gridSites.splice(finalPositionIndex, 0, currentPosition)

    // If the reordered site is pinned, update pinned order as well
    let pinnedTopSites = this.pinnedTopSites
    pinnedTopSites = pinnedTopSites.splice(currentPositionIndex, 1)
    pinnedTopSites = pinnedTopSites.splice(finalPositionIndex, 0, currentPosition)

    // If site is pinned, update pinnedTopSites list
    let newTabState = Immutable.Map()
    if (this.isPinned(currentPosition)) {
      newTabState = newTabState.set('pinnedTopSites', pinnedTopSites)
    }
    newTabState = newTabState.set('sites', gridSites)

    // Only update if there was an actual change
    const existingState = this.state.newTabData || Immutable.fromJS({})
    const proposedState = existingState.mergeIn(['newTabDetail'], newTabState)
    if (!proposedState.isSubset(existingState)) {
      aboutActions.setNewTabDetail(newTabState)
    }
  }

  onToggleBookmark (site) {
    if (site.get('bookmarked')) {
      windowActions.editBookmark(site.get('key'))
    } else {
      windowActions.onBookmarkAdded(false, site)
    }
  }

  onPinnedTopSite (siteKey) {
    let pinnedTopSites = this.pinnedTopSites
    const siteProps = this.topSites.find(site => site.get('key') === siteKey)

    if (this.isPinned(siteKey)) {
      pinnedTopSites = pinnedTopSites.filter(site => site.get('key') !== siteKey)
    } else {
      pinnedTopSites = pinnedTopSites.push(siteProps)
    }

    aboutActions.setNewTabDetail({pinnedTopSites: pinnedTopSites}, true)
  }

  onIgnoredTopSite (siteKey) {
    this.showNotification(siteKey)

    // If a pinnedTopSite is ignored, remove it from the pinned list as well
    const newTabState = {}
    if (this.isPinned(siteKey)) {
      newTabState.pinnedTopSites = this.pinnedTopSites.filter(site => site.get('key') !== siteKey)
    }

    newTabState.ignoredTopSites = this.ignoredTopSites.push(siteKey)
    aboutActions.setNewTabDetail(newTabState, true)
  }

  onUndoIgnoredTopSite () {
    // Remove last List's entry
    const ignoredTopSites = this.ignoredTopSites.pop()
    aboutActions.setNewTabDetail({ignoredTopSites: ignoredTopSites}, true)
    this.hideSiteRemovalNotification()
  }

  /**
   * Clear ignoredTopSites and pinnedTopSites list
   */
  onRestoreAll () {
    aboutActions.setNewTabDetail({ignoredTopSites: []}, true)
    this.hideSiteRemovalNotification()
  }

  /**
   * This handler only fires when the image fails to load.
   * If both the remote and local image fail, page defaults to gradients.
   */
  onImageLoadFailed () {
    this.setState({
      imageLoadFailed: true,
      backgroundImage: this.state.imageLoadFailed
        ? undefined
        : this.fallbackImage
    })
  }

  getLetterFromUrl (url) {
    const hostname = urlutils.getHostname(url.get('location'), true)
    const name = url.get('title') || hostname || '?'
    return name.charAt(0).toUpperCase()
  }

  render () {
    // don't render if user prefers an empty page
    if (this.state.showEmptyPage && !this.props.isIncognito) {
      return <div className='empty' />
    }

    if (this.props.isIncognito) {
      return <NewPrivateTab newTabData={this.state.newTabData} />
    }

    // don't render until object is found
    if (!this.state.newTabData) {
      return null
    }
    const gridLayout = this.gridLayout
    const backgroundProps = {}
    let gradientClassName = 'gradient'
    if (this.showImages) {
      backgroundProps.style = this.state.backgroundImage.style
      gradientClassName = 'bgGradient'
    }
    return <div data-test-id='dynamicBackground' className='dynamicBackground' {...backgroundProps}>
      {
        this.showImages
          ? <img src={this.state.backgroundImage.source} onError={this.onImageLoadFailed.bind(this)} data-test-id='backgroundImage' />
          : null
      }
      <div data-test-id={this.showImages ? 'bgGradient' : 'gradient'} className={gradientClassName} />
      <div className='content'>
        <main>
          <div className='statsBar'>
            <Stats newTabData={this.state.newTabData} />
            <Clock />
          </div>
          <div className='topSitesContainer'>
            <nav className='topSitesGrid'>
              {
                gridLayout.map(site =>
                  <Block
                    key={site.get('location')}
                    id={site.get('key')}
                    title={site.get('title')}
                    href={site.get('location')}
                    favicon={
                      site.get('favicon') == null
                      ? this.getLetterFromUrl(site)
                      : <img src={site.get('favicon')} />
                    }
                    style={{backgroundColor: site.get('themeColor')}}
                    onToggleBookmark={this.onToggleBookmark.bind(this, site)}
                    onPinnedTopSite={this.onPinnedTopSite.bind(this, site.get('key'))}
                    onIgnoredTopSite={this.onIgnoredTopSite.bind(this, site.get('key'))}
                    onDraggedSite={this.onDraggedSite.bind(this)}
                    isPinned={this.isPinned(site.get('key'))}
                    isBookmarked={site.get('bookmarked')}
                  />
                )
              }
            </nav>
          </div>
        </main>
        {
          this.state.showNotification
            ? <SiteRemovalNotification
              onUndoIgnoredTopSite={this.onUndoIgnoredTopSite.bind(this)}
              onRestoreAll={this.onRestoreAll.bind(this)}
              onCloseNotification={this.hideSiteRemovalNotification.bind(this)}
              />
            : null
        }
        <FooterInfo backgroundImage={this.state.backgroundImage} />
      </div>
    </div>
  }
}

module.exports = {
  component: NewTabPage,
  AboutNewTab: React.createElement(DragDropContext(HTML5Backend)(NewTabPage), {
    isIncognito: window.chrome && window.chrome.extension && window.chrome.extension.inIncognitoContext
  })
}
