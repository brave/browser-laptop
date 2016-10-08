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
    const bgFiles = [
      {
        'name': 'Tuolome Meadows',
        'source': 'dksfoto1.jpg'
      }, {
        'name': 'South Tufa, Mono Lake',
        'source': 'dksfoto2.jpg'
      }, {
        'name': 'Little Lakes Valley',
        'source': 'dksfoto3.jpg'
      }, {
        'name': 'Bay Bridge',
        'source': 'dksfoto4.jpg'
      }, {
        'name': 'Yosemite',
        'source': 'dksfoto5.jpg'
      }, {
        'name': 'Beach Ice',
        'source': 'dksfoto6.jpg'
      }, {
        'name': 'Color and White Trunks',
        'source': 'dksfoto7.jpg'
      }, {
        'name': 'Golden Gate Bridge',
        'source': 'dksfoto8.jpg'
      }, {
        'name': 'Long Lake',
        'source': 'dksfoto9.jpg'
      }, {
        'name': 'San Francisco Skyline',
        'source': 'dksfoto10.jpg'
      }, {
        'name': 'Across Mono Basin',
        'source': 'dksfoto11.jpg'
      }
    ]
    const randomImage = bgFiles[Math.floor(Math.random() * bgFiles.length)]
    const pathToBgImage = path.join(__dirname, '..', '..', 'img', 'newTabBackground', randomImage.source)

    return {
      name: randomImage.name,
      source: {backgroundImage: 'url(' + `${pathToBgImage}` + ')'}
    }
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
    const hours = estimatedMillisecondsSaved < 1000 * 60 * 60 * 24
    const minutes = estimatedMillisecondsSaved < 1000 * 60 * 60
    const seconds = estimatedMillisecondsSaved < 1000 * 60
    let counter
    let text

    if (seconds) {
      counter = Math.ceil(estimatedMillisecondsSaved / 1000)
      text = 'seconds'
    } else if (minutes) {
      counter = Math.ceil(estimatedMillisecondsSaved / 1000 / 60)
      text = 'minutes'
    } else if (hours) {
      counter = Math.ceil(estimatedMillisecondsSaved / 1000 / 60 / 60)
      text = 'hours'
    // Otherwise the output is in days
    } else {
      counter = Math.ceil(estimatedMillisecondsSaved / 1000 / 60 / 60 / 24)
      text = 'days'
    }
    return { counter, text }
  }

  get sites () {
    return this.state.newTabData.getIn(['newTabDetail', 'sites'])
  }

  get pinnedTopSites () {
    return this.state.newTabData.getIn(['newTabDetail', 'pinnedTopSites'])
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

  isBookmarked (siteProps) {
    return siteUtil.isSiteBookmarked(this.topSites, siteProps)
  }

  get topSites () {
    // topSites are defined by users. Pinned sites are attached to their positions
    // in the grid, and the non pinned indexes are populated with newly accessed sites
    let gridSites = Immutable.List().setSize(18)
    let sites = this.sites
    const pinnedTopSites = this.pinnedTopSites.setSize(gridSites.size)
    const ignoredTopSites = this.ignoredTopSites

    // We need to know which sites are pinned first, so we can skip them while populating
    gridSites = gridSites.push.apply(pinnedTopSites, gridSites)

    for (let i = 0; i < gridSites.size; i++) {
      // skip pinnedTopSites while populating
      if (!this.isPinned(i)) {
        gridSites = gridSites.set(i, sites.first())
        sites = sites.shift()
      }
    }

    // Remove from grid all ignored sites
    gridSites = gridSites.filter((site) => ignoredTopSites.indexOf(site) === -1)

    // Filter duplicated and remove null
    gridSites = gridSites.toSet().toList()
    gridSites = gridSites.filter(site => site != null)

    return gridSites
  }

  get gridLayout () {
    const gridLayoutSize = this.gridLayoutSize
    const gridSizes = {large: 18, medium: 12, small: 6}
    const sitesRow = gridSizes[gridLayoutSize]

    return this.topSites.take(sitesRow)
  }

  onChangeGridLayout () {
    // save number of rows on store. gridsLayout starts with 3 rows (large).
    // Rows are reduced at each click and then reset to three again
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
    if (this.isPinned(currentPosition)) {
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
    let pinnedTopSites = this.pinnedTopSites.setSize(18)

    const currentPosition = gridSites.filter((site) => siteProps.get('location') === site.get('location')).get(0)
    const currentPositionIndex = gridSites.indexOf(currentPosition)

    // Stores site on ignoredTopSites list, retaining the same position
    pinnedTopSites = pinnedTopSites.splice(currentPositionIndex, 1, siteProps)

    aboutActions.setNewTabDetail({pinnedTopSites: pinnedTopSites})
  }

  onIgnoredSite (siteProps) {
    const gridSites = this.topSites
    let pinnedTopSites = this.pinnedTopSites
    const ignoredTopSites = this.ignoredTopSites.push(siteProps)

    const currentPosition = gridSites.filter((site) => siteProps.get('location') === site.get('location')).get(0)
    const currentPositionIndex = gridSites.indexOf(currentPosition)

    if (this.isPinned(siteProps)) {
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
    const backgroundImage = this.backgroundImage.source
    const backgroundImageName = this.backgroundImage.name
    const trackedBlockersCount = this.trackedBlockersCount
    const adblockCount = this.adblockCount
    const httpsUpgradedCount = this.httpsUpgradedCount
    const estimatedTimeCount = this.estimatedTimeSaved.counter
    const estimatedTimeText = this.estimatedTimeSaved.text
    const gridLayoutSize = this.gridLayoutSize
    const gridLayout = this.gridLayout

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
                    style={{backgroundColor: site.get('themeColor')}}
                    onBookmarkedSite={this.onToggleBookmark.bind(this, site)}
                    onPinnedSite={this.onPinnedSite.bind(this, site)}
                    onIgnoredSite={this.onIgnoredSite.bind(this, site)}
                    onDraggedSite={this.onDraggedSite.bind(this)}
                    isPinned={this.isPinned(site)}
                    isBookmarked={this.isBookmarked(site)}
                  />
                )
              }
            </nav>
          </div>
        </main>
        <footer className='footerContainer'>
          <div className='copyrightNotice'>
            <div className='copyrightCredits'>
              <span className='photoBy' data-l10n-id='photoBy' /> <a className='copyrightOwner' href='http://dksfoto.smugmug.com' target='_blank'>Darrell Sano</a>
            </div>
            <span className='photoName'>{backgroundImageName}</span>
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
