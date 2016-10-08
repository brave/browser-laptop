/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path')
const React = require('react')
const Immutable = require('immutable')
const messages = require('../constants/messages')
const HTML5Backend = require('react-dnd-html5-backend')
const { DragDropContext } = require('react-dnd')
const Block = require('./newTabComponents/block')
const Clock = require('./newTabComponents/clock')
const aboutActions = require('./aboutActions')
const siteUtil = require('../state/siteUtil')
const siteTags = require('../constants/siteTags')
const cx = require('../lib/classSet.js')
const { aboutUrls } = require('../lib/appUrlUtil')
// const siteUtil = require('../state/siteUtil')
// const windowActions = require('../actions/windowActions')

const ipc = window.chrome.ipc

require('../../less/about/newtab.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class NewTabPage extends React.Component {
  constructor () {
    super()
    this.state = {}
    ipc.on(messages.NEWTAB_DATA_UPDATED, (e, newTabData) => {
      this.setState({ newTabData: Immutable.fromJS(newTabData || {}) })
    })
  }

  get randomBackgroundImage () {
    // Temporary workaround until we have a better image storage
    // currently all images has the dksfoto prefix. Can be changes as needed
    // TODO: @cezaraugusto Must be set as state
    const bgFiles = [
      'dksfoto1.jpg', 'dksfoto2.jpg', 'dksfoto3.jpg',
      'dksfoto4.jpg', 'dksfoto5.jpg', 'dksfoto6.jpg',
      'dksfoto6.jpg', 'dksfoto7.jpg', 'dksfoto8.jpg',
      'dksfoto9.jpg', 'dksfoto10.jpg', 'dksfoto11.jpg'
    ]
    const randomImage = bgFiles[Math.floor(Math.random() * bgFiles.length)]
    const pathToBgImage = path.join(__dirname, '..', '..', 'img', 'newTabBackground', randomImage)

    return {backgroundImage: 'url(' + `${pathToBgImage}` + ')'}
  }

  get trackedBlockersCount () {
    return this.state.newTabData.get('trackedBlockersCount') || 0
  }

  get adblockCount () {
    return this.state.newTabData.get('adblockCount') || 0
  }

  get httpsUpgradedCount () {
    return this.state.newTabData.get('httpsUpgradedCount') || 0
  }

  get estimatedTimeSaved () {
    const estimatedMillisecondsSaved = (this.adblockCount + this.trackedBlockersCount) * 50 || 0

    // Check if output is in seconds
    if (estimatedMillisecondsSaved < 1000 * 60) {
      return {
        counter: Math.ceil(estimatedMillisecondsSaved / 1000),
        text: 'seconds'
      }
    // Check if output is in minutes
    } else if (estimatedMillisecondsSaved < 1000 * 60 * 60) {
      return {
        counter: Math.ceil(estimatedMillisecondsSaved / 1000 / 60),
        text: 'minutes'
      }
    // Check it output is in hours
    } else if (estimatedMillisecondsSaved < 1000 * 60 * 60 * 24) {
      return {
        counter: Math.ceil(estimatedMillisecondsSaved / 1000 / 60 / 60),
        text: 'hours'
      }
    // Otherwise the output is in days
    } else {
      return {
        counter: Math.ceil(estimatedMillisecondsSaved / 1000 / 60 / 60 / 24),
        text: 'days'
      }
    }
  }

  get newTabDetail () {
    return this.state.newTabData.get('newTabDetail')
  }

  get topSites () {
    // topSites are defined by users. Pinned sites are attached to their positions
    // in the grid, and the non pinned indexes are populated with newly accessed sites
    let sites = this.newTabDetail.get('sites')
    console.log('show me params', JSON.stringify(sites))
    let gridSites = Immutable.List().setSize(18)
    const pinnedTopSites = this.newTabDetail.get('pinnedTopSites').setSize(18)
    const ignoredTopSites = this.newTabDetail.get('ignoredTopSites')

    // We need to know which sites are pinned first, so we populate null spaces with visited sites
    gridSites = gridSites.push.apply(pinnedTopSites, gridSites)

    // Populate null spaces with visitedSites
    for (let i = 0; i < gridSites.size; i++) {
      if (!gridSites.get(i)) {
        gridSites = gridSites.set(i, sites.first())
        sites = sites.shift()
      }
    }

    // Remove from grid all ignored sites
    gridSites = gridSites.filter((site) => ignoredTopSites.indexOf(site) === -1)

    // Filter duplicated and remove null
    gridSites = gridSites.toSet().toList().filter(site => site != null)

    return gridSites
  }

  get gridLayout () {
    const gridLayout = this.newTabDetail.get('gridLayout')
    const gridSizes = {large: 18, medium: 12, small: 6}
    const sitesRow = gridSizes[gridLayout]

    return this.topSites.take(sitesRow)
  }

  onChangeGridLayout () {
    // save number of rows on store. gridsLayout starts with 3 rows (large).
    // Rows are reduced at each click and then reset to three again
    const gridLayout = this.newTabDetail.get('gridLayout')
    const gridSize = (size) => aboutActions.setNewTabDetail({gridLayout: size})

    if (gridLayout === 'large') {
      gridSize('medium')
    } else if (gridLayout === 'medium') {
      gridSize('small')
    } else if (gridLayout === 'small') {
      gridSize('large')
    } else {
      gridSize('large')
    }

    return gridLayout
  }

  onDraggedSite (currentId, finalId) {
    let gridSites = this.topSites
    const currentPosition = gridSites.filter((site) => site.get('location') === currentId).get(0)
    const finalPosition = gridSites.filter((site) => site.get('location') === finalId).get(0)

    let pinnedTopSites = this.newTabDetail.get('pinnedTopSites') // .setSize(18)
    const isTopSitePinned = pinnedTopSites.includes(currentPosition)

    const currentPositionIndex = gridSites.indexOf(currentPosition)
    const finalPositionIndex = gridSites.indexOf(finalPosition)

    // Removes block current position and puts it after
    gridSites = gridSites.splice(currentPositionIndex, 1)
    gridSites = gridSites.splice(finalPositionIndex, 0, currentPosition)

    // If the reordered site is pinned, we ned to replace it with null
    // TO-DO @cezaraugusto; doesn't work
    // |
    // |
    // v
    pinnedTopSites = pinnedTopSites.splice(currentPositionIndex, 1, null)
    pinnedTopSites = pinnedTopSites.splice(finalPositionIndex, 1, currentPosition)

    // If site is pinned, update pinnedTopSites list
    if (isTopSitePinned) {
      aboutActions.setNewTabDetail({pinnedTopSites: pinnedTopSites})
    }
    aboutActions.setNewTabDetail({sites: gridSites})
  }

  onToggleBookmark (siteProps) {
    const siteDetail = siteUtil.getDetailFromFrame(siteProps, siteTags.BOOKMARK)
    aboutActions.setBookmarkDetail(siteDetail, siteDetail)
  }

  onPinnedSite (siteProps) {
    const gridSites = this.topSites

    const currentPosition = gridSites.filter((site) => siteProps.get('location') === site.get('location')).get(0)
    const currentPositionIndex = gridSites.indexOf(currentPosition)

    let pinnedTopSites = this.newTabDetail.get('pinnedTopSites').setSize(18)

    // Stores site on ignoredTopSites list, retaining the same position
    pinnedTopSites = pinnedTopSites.splice(currentPositionIndex, 1, siteProps)

    aboutActions.setNewTabDetail({pinnedTopSites: pinnedTopSites})
  }

  onIgnoredSite (siteProps) {
    const gridSites = this.topSites
    const ignoredTopSites = this.newTabDetail.get('ignoredTopSites').push(siteProps)

    let pinnedTopSites = this.newTabDetail.get('pinnedTopSites')
    const isTopSitePinned = pinnedTopSites.includes(siteProps)

    const currentPosition = gridSites.filter((site) => siteProps.get('location') === site.get('location')).get(0)
    const currentPositionIndex = gridSites.indexOf(currentPosition)

    if (isTopSitePinned) {
      // If a pinnedTopSite is ignored, remove it from the pinned list as well
      pinnedTopSites = pinnedTopSites.splice(currentPositionIndex, 1, null)
      aboutActions.setNewTabDetail({pinnedTopSites: pinnedTopSites})
    }
    aboutActions.setNewTabDetail({ignoredTopSites: ignoredTopSites})
  }

  restorePinnedSitesList () {
    // TO-DO: @cezaraugusto
  }

  restoreIgnoredSitesList () {
    // TO-DO: @cezaraugusto
  }

  componentWillMount () {
    // Attach random background image right before component is mounted
    // so it can be random only at each new page
    this.backgroundImage = this.randomBackgroundImage
  }

  render () {
    // don't render until object is found
    if (!this.state.newTabData) {
      return null
    }
    const backgroundImage = this.backgroundImage
    const trackedBlockersCount = this.trackedBlockersCount
    const adblockCount = this.adblockCount
    const httpsUpgradedCount = this.httpsUpgradedCount
    const estimatedTimeCount = this.estimatedTimeSaved.counter
    const estimatedTimeText = this.estimatedTimeSaved.text
    const gridLayoutSize = this.newTabDetail.get('gridLayout')
    const gridLayout = this.gridLayout
    const isPinned = (site) => this.newTabDetail.get('pinnedTopSites').includes(site)
    // const isBookmarked = this.getBookmarkedTopSite

    return <div className='dynamicBackground' style={backgroundImage}>
      <div className='gradient' />
      <div className='content'>
        <main>
          <div className='statsBar'>
            <ul className='statsContainer'>
              <li className='statsBlock'>
                <span className='counter trackers'>{trackedBlockersCount}</span>
                <span className='statsText' data-l10n-id='trackersBlocked' />
              </li>
              <li className='statsBlock'>
                <span className='counter ads'>{adblockCount}</span>
                <span className='statsText' data-l10n-id='adsBlocked' />
              </li>
              <li className='statsBlock'>
                <span className='counter https'>{httpsUpgradedCount}</span>
                <span className='statsText' data-l10n-id='httpsUpgraded' />
              </li>
              <li className='statsBlock'>
                <span className='counter timeSaved'>
                  {estimatedTimeCount} <span className='text' data-l10n-id={estimatedTimeText} />
                </span>
                <span className='statsText' data-l10n-id='estimatedTimeSaved' />
              </li>
            </ul>
            <Clock />
          </div>
          <div className='topSitesContainer'>
            <button
              className={cx({
                toggleTopSitesGridIcon: true,
                hasThreeRows: gridLayoutSize === 'large',
                hasTwoRows: gridLayoutSize === 'medium',
                hasOneRow: gridLayoutSize === 'small'
              })}
              onClick={this.onChangeGridLayout.bind(this)}
            />
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
                      ? site.get('title').charAt(0).toUpperCase()
                      : <img src={site.get('favicon')} />
                    }
                    backgroundColor={site.get('themeColor')}
                    onBookmarkedSite={this.onToggleBookmark.bind(this, site)}
                    onPinnedSite={this.onPinnedSite.bind(this, site)}
                    onIgnoredSite={this.onIgnoredSite.bind(this, site)}
                    onDraggedSite={this.onDraggedSite.bind(this)}
                    isPinned={isPinned(site)}
                  />
                )
              }
            </nav>
          </div>
        </main>
        <footer className='footerContainer'>
          <div className='copyrightNotice'>
            <div className='copyrightCredits'>
              <span className='photoBy' data-l10n-id='photoBy' /> <a className='copyrightOwner' href='#URL_HERE' target='_blank'>DKSPhoto</a>, 2016
            </div>
            <span className='photoName'>Bay Bridge at dusk</span>
          </div>
          <nav className='shortcutsContainer'>
            <a className='shortcutIcon settingsIcon' href={aboutUrls.get('about:preferences')} data-l10n-id='preferencesPage' />
            <a className='shortcutIcon bookmarksIcon' href={aboutUrls.get('about:bookmarks')} data-l10n-id='bookmarksPage' />
            <a className='shortcutIcon historyIcon' href={aboutUrls.get('about:history')} data-l10n-id='historyPage' />
          </nav>
        </footer>
      </div>
    </div>
  }
}

module.exports = React.createElement(DragDropContext(HTML5Backend)(NewTabPage))
