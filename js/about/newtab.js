/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path')
const React = require('react')
const Immutable = require('immutable')
const messages = require('../constants/messages')
const HTML5Backend = require('react-dnd-html5-backend')
const { DragDropContext } = require('react-dnd')
const Stats = require('./newTabComponents/stats')
const Clock = require('./newTabComponents/clock')
const Block = require('./newTabComponents/block')
const SiteRemovalNotification = require('./newTabComponents/siteRemovalNotification')
const FooterInfo = require('./newTabComponents/footerInfo')
const aboutActions = require('./aboutActions')
const siteUtil = require('../state/siteUtil')
const urlutils = require('../lib/urlutil')
const siteTags = require('../constants/siteTags')
const config = require('../constants/config')
const backgrounds = require('../data/backgrounds')

const ipc = window.chrome.ipc

require('../../less/about/newtab.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class NewTabPage extends React.Component {
  constructor () {
    super()
    this.state = {
      showSiteRemovalNotification: false,
      backgroundImage: this.randomBackgroundImage,
      imageLoadFailed: false,
      updatedStamp: undefined
    }
    ipc.on(messages.NEWTAB_DATA_UPDATED, (e, newTabData) => {
      const data = Immutable.fromJS(newTabData || {})
      const updatedStamp = data.getIn(['newTabDetail', 'updatedStamp'])

      // Only update if the data has changed.
      if (typeof updatedStamp === 'number' &&
          typeof this.state.updatedStamp === 'number' &&
          updatedStamp === this.state.updatedStamp) {
        return
      }

      this.setState({
        newTabData: data,
        updatedStamp: updatedStamp
      })
    })
  }

  get randomBackgroundImage () {
    const image = Object.assign({}, backgrounds[Math.floor(Math.random() * backgrounds.length)])
    image.style = {backgroundImage: 'url(' + image.source + ')'}
    return image
  }

  get fallbackImage () {
    const image = Object.assign({}, config.newtab.fallbackImage)
    const pathToImage = path.join(__dirname, '..', '..', image.source)
    image.style = {backgroundImage: 'url(' + `${pathToImage}` + ')'}
    return image
  }

  get sites () {
    return this.state.newTabData.getIn(['newTabDetail', 'sites'])
  }

  get pinnedTopSites () {
    return this.state.newTabData.getIn(['newTabDetail', 'pinnedTopSites']).setSize(18)
  }

  get ignoredTopSites () {
    return this.state.newTabData.getIn(['newTabDetail', 'ignoredTopSites'])
  }

  get gridLayoutSize () {
    return this.state.newTabData.getIn(['newTabDetail', 'gridLayoutSize'])
  }

  isPinned (siteProps) {
    return this.pinnedTopSites.includes(siteProps)
  }

  isIgnored (siteProps) {
    return this.ignoredTopSites.includes(siteProps)
  }

  isBookmarked (siteProps) {
    return siteUtil.isSiteBookmarked(this.topSites, siteProps)
  }

  /**
   * topSites are defined by users. Pinned sites are attached to their positions
   * in the grid, and the non pinned indexes are populated with newly accessed sites
   */
  get topSites () {
    const pinnedTopSites = this.pinnedTopSites
    const sites = this.sites
    let unpinnedTopSites = sites.filter((site) => !this.isPinned(site) ? site : null)
    let gridSites

    const getUnpinned = () => {
      const firstSite = unpinnedTopSites.first()
      unpinnedTopSites = unpinnedTopSites.slice(1)
      return firstSite
    }

    gridSites = pinnedTopSites.map(pinned => pinned || getUnpinned())

    // Remove from grid all ignored sites
    gridSites = gridSites.filter((site) => !this.isIgnored(site))

    return gridSites.filter(site => site != null)
  }

  get gridLayout () {
    const gridLayoutSize = this.gridLayoutSize
    const gridSizes = {large: 18, medium: 12, small: 6}
    const sitesRow = gridSizes[gridLayoutSize]

    return this.topSites.take(sitesRow)
  }

  showSiteRemovalNotification () {
    this.setState({
      showSiteRemovalNotification: true
    })
  }

  hideSiteRemovalNotification () {
    this.setState({
      showSiteRemovalNotification: false
    })
  }

  /**
   * save number of rows on store. gridsLayout starts with 3 rows (large).
   * Rows are reduced at each click and then reset to three again
   */
  onChangeGridLayout () {
    const gridLayoutSize = this.gridLayoutSize
    const changeGridSizeTo = (size) => aboutActions.setNewTabDetail({gridLayoutSize: size})

    if (gridLayoutSize === 'large') {
      changeGridSizeTo('medium')
    } else if (gridLayoutSize === 'medium') {
      changeGridSizeTo('small')
    } else if (gridLayoutSize === 'small') {
      changeGridSizeTo('large')
    } else {
      changeGridSizeTo('large')
    }

    return gridLayoutSize
  }

  onDraggedSite (currentId, finalId) {
    let gridSites = this.topSites
    let pinnedTopSites = this.pinnedTopSites

    const currentPosition = gridSites.filter((site) => site.get('location') === currentId).get(0)
    const finalPosition = gridSites.filter((site) => site.get('location') === finalId).get(0)

    const currentPositionIndex = gridSites.indexOf(currentPosition)
    const finalPositionIndex = gridSites.indexOf(finalPosition)

    // Removes block current position and puts it after
    gridSites = gridSites.splice(currentPositionIndex, 1)
    gridSites = gridSites.splice(finalPositionIndex, 0, currentPosition)

    // If the reordered site is pinned, update pinned order as well
    pinnedTopSites = pinnedTopSites.splice(currentPositionIndex, 1)
    pinnedTopSites = pinnedTopSites.splice(finalPositionIndex, 0, currentPosition)

    // If site is pinned, update pinnedTopSites list
    const newTabState = {}
    if (this.isPinned(currentPosition)) {
      newTabState.pinnedTopSites = pinnedTopSites
    }
    newTabState.sites = gridSites

    // Only update if there was an actual change
    const stateDiff = Immutable.fromJS(newTabState)
    const existingState = this.state.newTabData || Immutable.fromJS({})
    const proposedState = existingState.mergeIn(['newTabDetail'], stateDiff)
    if (!proposedState.isSubset(existingState)) {
      aboutActions.setNewTabDetail(stateDiff)
    }
  }

  onToggleBookmark (siteProps) {
    const siteDetail = siteUtil.getDetailFromFrame(siteProps, siteTags.BOOKMARK)
    const editing = this.isBookmarked(siteProps)
    aboutActions.setBookmarkDetail(siteDetail, siteDetail, null, editing)
  }

  onPinnedTopSite (siteProps) {
    const gridSites = this.topSites
    const currentPosition = gridSites.filter((site) => siteProps.get('location') === site.get('location')).get(0)
    const currentPositionIndex = gridSites.indexOf(currentPosition)

    // If pinned, leave it null. Otherwise stores site on ignoredTopSites list, retaining the same position
    let pinnedTopSites = this.pinnedTopSites
    pinnedTopSites = pinnedTopSites.splice(currentPositionIndex, 1, this.isPinned(siteProps) ? null : siteProps)

    aboutActions.setNewTabDetail({pinnedTopSites: pinnedTopSites})
  }

  onIgnoredTopSite (siteProps) {
    this.showSiteRemovalNotification()

    // If a pinnedTopSite is ignored, remove it from the pinned list as well
    const newTabState = {}
    if (this.isPinned(siteProps)) {
      const gridSites = this.topSites
      const currentPosition = gridSites.filter((site) => siteProps.get('location') === site.get('location')).get(0)
      const currentPositionIndex = gridSites.indexOf(currentPosition)
      const pinnedTopSites = this.pinnedTopSites.splice(currentPositionIndex, 1, null)
      newTabState.pinnedTopSites = pinnedTopSites
    }

    newTabState.ignoredTopSites = this.ignoredTopSites.push(siteProps)
    aboutActions.setNewTabDetail(newTabState)
  }

  onUndoIgnoredTopSite () {
    // Remove last List's entry
    const ignoredTopSites = this.ignoredTopSites.splice(-1, 1)
    aboutActions.setNewTabDetail({ignoredTopSites: ignoredTopSites})
    this.hideSiteRemovalNotification()
  }

  /**
   * Clear ignoredTopSites and pinnedTopSites list
   */
  onRestoreAll () {
    aboutActions.setNewTabDetail({ignoredTopSites: [], pinnedTopSites: []})
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
        ? {}
        : this.fallbackImage
    })
  }

  render () {
    // don't render until object is found
    if (!this.state.newTabData) {
      return null
    }

    const gridLayout = this.gridLayout

    const getLetterFromUrl = (url) => {
      const hostname = urlutils.getHostname(url.get('location'), true)
      const name = url.get('title') || hostname || '?'
      return name.charAt(0).toUpperCase()
    }

    return <div className='dynamicBackground' style={this.state.backgroundImage.style}>
      {
        this.state.backgroundImage
          ? <img src={this.state.backgroundImage.source} onError={this.onImageLoadFailed.bind(this)} />
          : null
      }
      <div className='gradient' />
      <div className='content'>
        <main>
          <div className='statsBar'>
            <Stats newTabData={this.state.newTabData} />
            <Clock />
          </div>
          <div className='topSitesContainer'>
            <nav className='topSitesGrid'>
              {
                gridLayout.map((site) =>
                  <Block
                    key={site.get('location')}
                    id={site.get('location')}
                    title={site.get('title')}
                    href={site.get('location')}
                    favicon={
                      site.get('favicon') == null
                      ? getLetterFromUrl(site)
                      : <img src={site.get('favicon')} />
                    }
                    style={{backgroundColor: site.get('themeColor')}}
                    onToggleBookmark={this.onToggleBookmark.bind(this, site)}
                    onPinnedTopSite={this.onPinnedTopSite.bind(this, site)}
                    onIgnoredTopSite={this.onIgnoredTopSite.bind(this, site)}
                    onDraggedSite={this.onDraggedSite.bind(this)}
                    isPinned={this.isPinned(site)}
                    isBookmarked={this.isBookmarked(site)}
                  />
                )
              }
            </nav>
          </div>
        </main>
        {
          this.state.showSiteRemovalNotification
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

module.exports = React.createElement(DragDropContext(HTML5Backend)(NewTabPage))
