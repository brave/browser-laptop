/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const windowActions = require('../actions/windowActions')
const ImmutableComponent = require('./immutableComponent')

const config = require('../constants/config')
const top500 = require('./../data/top500')
const {aboutUrls, isNavigatableAboutPage, isSourceAboutUrl, isUrl} = require('../lib/appUrlUtil')
const Immutable = require('immutable')
const debounce = require('../lib/debounce')
const settings = require('../constants/settings')
const siteTags = require('../constants/siteTags')
const suggestionTypes = require('../constants/suggestionTypes')
const getSetting = require('../settings').getSetting
const eventUtil = require('../lib/eventUtil')
const cx = require('../lib/classSet')
const locale = require('../l10n')
const windowStore = require('../stores/windowStore')
const suggestion = require('../../app/renderer/lib/suggestion')

class UrlBarSuggestions extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.searchXHR = debounce(this.searchXHR.bind(this), 50)
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  get activeIndex () {
    if (this.props.suggestionList === null) {
      return 0
    }
    return Math.abs(this.props.selectedIndex % (this.props.suggestionList.size + 1))
  }

  nextSuggestion () {
    // If the user presses down and don't have an explicit selected index, skip to the 2nd one
    if (this.props.locationValueSuffix && this.props.selectedIndex === null && this.props.suggestionList.size > 1) {
      this.updateSuggestions(2)
      return
    }

    this.updateSuggestions(this.props.selectedIndex + 1)
  }

  previousSuggestion () {
    const suggestions = this.props.suggestionList
    if (!suggestions) {
      return
    }

    let newIndex = this.props.selectedIndex - 1
    if (newIndex < 0) {
      newIndex = suggestions.size
    }
    this.updateSuggestions(newIndex)
  }

  blur () {
    window.removeEventListener('click', this)
    windowActions.setUrlBarSuggestions(null, null)
    windowActions.setUrlBarPreview(null)
  }

  clickSelected (e) {
    this.ctrlKey = e.ctrlKey
    this.metaKey = e.metaKey
    this.shiftKey = e.shiftKey
    const node = ReactDOM.findDOMNode(this)
    if (node) {
      node.getElementsByClassName('selected')[0].click()
    }
  }

  // Whether the suggestions box should be rendered
  shouldRender () {
    return this.props.suggestionList && this.props.suggestionList.size > 0
  }

  render () {
    window.removeEventListener('click', this)

    if (!this.shouldRender()) {
      return null
    }

    // Add an event listener on the window to hide suggestions when they are shown.
    window.addEventListener('click', this)

    // If there is a URL suffix that means there's an active autocomplete for the first element.
    // We should show that as selected so the user knows what is being matched.

    const suggestions = this.props.suggestionList
    const bookmarkSuggestions = suggestions.filter((s) => s.type === suggestionTypes.BOOKMARK)
    const historySuggestions = suggestions.filter((s) => s.type === suggestionTypes.HISTORY)
    const aboutPagesSuggestions = suggestions.filter((s) => s.type === suggestionTypes.ABOUT_PAGES)
    const tabSuggestions = suggestions.filter((s) => s.type === suggestionTypes.TAB)
    const searchSuggestions = suggestions.filter((s) => s.type === suggestionTypes.SEARCH)
    const topSiteSuggestions = suggestions.filter((s) => s.type === suggestionTypes.TOP_SITE)

    let items = []
    let index = 0
    const addToItems = (suggestions, sectionKey, title, icon) => {
      if (suggestions.size > 0) {
        items.push(<li className='suggestionSection'>
          {
            icon
            ? <span className={cx({
              suggestionSectionIcon: true,
              [sectionKey]: true,
              fa: true,
              [icon]: true
            })} />
            : null
          }
          <span className='suggestionSectionTitle'>{title}</span>
        </li>)
      }
      items = items.concat(suggestions.map((suggestion, i) => {
        const currentIndex = index + i
        const selected = this.activeIndex === currentIndex + 1 || (!this.activeIndex && currentIndex === 0 && this.props.locationValueSuffix)
        return <li data-index={currentIndex + 1}
          onMouseOver={this.onMouseOver.bind(this)}
          onClick={suggestion.onClick}
          key={`${suggestion.location}|${index + i}`}
          ref={(node) => { selected && (this.selectedElement = node) }}
          className={cx({
            selected,
            suggestionItem: true,
            [suggestion.type]: true
          })}>
          {
            suggestion.type !== suggestionTypes.TOP_SITE && suggestion.title
            ? <div className='suggestionTitle'>{suggestion.title}</div>
            : null
          }
          {
            suggestion.type !== suggestionTypes.SEARCH && suggestion.type !== suggestionTypes.ABOUT_PAGES
            ? <div className='suggestionLocation'>{suggestion.location}</div>
            : null
          }
        </li>
      }))
      index += suggestions.size
    }
    addToItems(historySuggestions, 'historyTitle', locale.translation('historySuggestionTitle'), 'fa-clock-o')
    addToItems(bookmarkSuggestions, 'bookmarksTitle', locale.translation('bookmarksSuggestionTitle'), 'fa-star-o')
    addToItems(aboutPagesSuggestions, 'aboutPagesTitle', locale.translation('aboutPagesSuggestionTitle'), null)
    addToItems(tabSuggestions, 'tabsTitle', locale.translation('tabsSuggestionTitle'), 'fa-external-link')
    addToItems(searchSuggestions, 'searchTitle', locale.translation('searchSuggestionTitle'), 'fa-search')
    addToItems(topSiteSuggestions, 'topSiteTitle', locale.translation('topSiteSuggestionTitle'), 'fa-link')
    const documentHeight = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--navbar-height'), 10)
    const menuHeight = this.props.menubarVisible ? 30 : 0
    return <ul className='urlBarSuggestions' style={{
      maxHeight: document.documentElement.offsetHeight - documentHeight - 2 - menuHeight
    }}>
      {items}
    </ul>
  }

  onMouseOver (e) {
    this.updateSuggestions(parseInt(e.target.dataset.index, 10))
  }

  componentDidMount () {
    if (this.props.urlLocation.length > 0) {
      this.suggestionList = this.getNewSuggestionList(this.props)
      this.searchXHR(this.props, true)
    }
  }

  componentWillUpdate (nextProps) {
    if (this.selectedElement) {
      this.selectedElement.scrollIntoView()
    }
    // If both the URL is the same and the number of sites to consider is
    // the same then we don't need to regenerate the suggestions list.
    if (this.props.urlLocation === nextProps.urlLocation &&
        this.props.sites.size === nextProps.sites.size &&
        // Make sure to update if there are online suggestions
        this.props.searchResults.size === nextProps.searchResults.size) {
      return
    }
    this.suggestionList = this.getNewSuggestionList(nextProps)
    this.searchXHR(nextProps, !(this.props.urlLocation === nextProps.urlLocation))
  }

  getNewSuggestionList (props) {
    props = props || this.props
    if (!props.urlLocation && !props.urlPreview) {
      return null
    }

    const navigateClickHandler = (formatUrl) => (site, e) => {
      // We have a wonky way of fake clicking from keyboard enter,
      // so remove the meta keys from the real event here.
      e.metaKey = e.metaKey || this.metaKey
      e.ctrlKey = e.ctrlKey || this.ctrlKey
      e.shiftKey = e.shiftKey || this.shiftKey
      delete this.metaKey
      delete this.ctrlKey
      delete this.shiftKey

      const location = formatUrl(site)
      // When clicked make sure to hide autocomplete
      windowActions.setRenderUrlBarSuggestions(false)
      if (eventUtil.isForSecondaryAction(e)) {
        windowActions.newFrame({
          location,
          partitionNumber: site && site.get && site.get('partitionNumber') || undefined
        }, !!e.shiftKey)
        e.preventDefault()
      } else {
        windowActions.loadUrl(this.activeFrame, location)
        windowActions.setUrlBarActive(false)
        windowActions.setUrlBarPreview(null)
        this.blur()
      }
    }

    const urlLocationLower = props.urlLocation.toLowerCase()
    let suggestions = new Immutable.List()
    const defaultme = (x) => x
    const mapListToElements = ({data, maxResults, type, clickHandler = navigateClickHandler,
        sortHandler = defaultme, formatTitle = defaultme, formatUrl = defaultme,
        filterValue = (site) => site.toLowerCase().includes(urlLocationLower)
    }) => // Filter out things which are already in our own list at a smaller index
      data
      // Per suggestion provider filter
      .filter(filterValue)
      // Filter out things which are already in the suggestions list
      .filter((site) =>
        suggestions.findIndex((x) => (x.location || '').toLowerCase() === (formatUrl(site) || '').toLowerCase()) === -1 ||
          // Tab autosuggestions should always be included since they will almost always be in history
          type === suggestionTypes.TAB)
      .sort(sortHandler)
      .take(maxResults)
      .map((site) => {
        return {
          onClick: clickHandler.bind(null, site),
          title: formatTitle(site),
          location: formatUrl(site),
          type
        }
      })

    const shouldNormalize = suggestion.shouldNormalizeLocation(urlLocationLower)
    const urlLocationLowerNormalized = suggestion.normalizeLocation(urlLocationLower)
    const sortBasedOnLocationPos = (s1, s2) => {
      const location1 = shouldNormalize ? suggestion.normalizeLocation(s1.get('location')) : s1.get('location')
      const location2 = shouldNormalize ? suggestion.normalizeLocation(s2.get('location')) : s2.get('location')
      const pos1 = location1.indexOf(urlLocationLowerNormalized)
      const pos2 = location2.indexOf(urlLocationLowerNormalized)
      if (pos1 === -1 && pos2 === -1) {
        return 0
      } else if (pos1 === -1) {
        return 1
      } else if (pos2 === -1) {
        return -1
      } else {
        if (pos1 - pos2 !== 0) {
          return pos1 - pos2
        } else {
          // sort site.com higher than site.com/somepath
          const sdnv1 = suggestion.simpleDomainNameValue(s1)
          const sdnv2 = suggestion.simpleDomainNameValue(s2)
          if (sdnv1 !== sdnv2) {
            return sdnv2 - sdnv1
          } else {
            // If there's a tie on the match location, use the age
            // decay modified access count
            return suggestion.sortByAccessCountWithAgeDecay(s1, s2)
          }
        }
      }
    }

    const historyFilter = (site) => {
      if (!site) {
        return false
      }
      const title = site.get('title') || ''
      const location = site.get('location') || ''
      // Note: Bookmark sites are now included in history. This will allow
      // sites to appear in the auto-complete regardless of their bookmark
      // status. If history is turned off, bookmarked sites will appear
      // in the bookmark section.
      return (title.toLowerCase().includes(urlLocationLower) ||
              location.toLowerCase().includes(urlLocationLower)) &&
              site.get('lastAccessedTime')
    }
    var historySites = props.sites.filter(historyFilter)

    // potentially append virtual history items (such as www.google.com when
    // searches have been made but the root site has not been visited)
    historySites = historySites.concat(suggestion.createVirtualHistoryItems(historySites))

    // history
    if (getSetting(settings.HISTORY_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: historySites,
        maxResults: config.urlBarSuggestions.maxHistorySites,
        type: suggestionTypes.HISTORY,
        clickHandler: navigateClickHandler((site) => {
          return site.get('location')
        }),
        sortHandler: sortBasedOnLocationPos,
        formatTitle: (site) => site.get('title'),
        formatUrl: (site) => site.get('location'),
        filterValue: historyFilter
      }))
    }

    // bookmarks
    if (getSetting(settings.BOOKMARK_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: props.sites,
        maxResults: config.urlBarSuggestions.maxBookmarkSites,
        type: suggestionTypes.BOOKMARK,
        clickHandler: navigateClickHandler((site) => {
          return site.get('location')
        }),
        sortHandler: sortBasedOnLocationPos,
        formatTitle: (site) => site.get('title'),
        formatUrl: (site) => site.get('location'),
        filterValue: (site) => {
          const title = site.get('title') || ''
          const location = site.get('location') || ''
          return (title.toLowerCase().includes(urlLocationLower) ||
            location.toLowerCase().includes(urlLocationLower)) &&
            site.get('tags') && site.get('tags').includes(siteTags.BOOKMARK)
        }
      }))
    }

    // about pages
    suggestions = suggestions.concat(mapListToElements({
      data: aboutUrls.keySeq().filter((x) => isNavigatableAboutPage(x)),
      maxResults: config.urlBarSuggestions.maxAboutPages,
      type: suggestionTypes.ABOUT_PAGES,
      clickHandler: navigateClickHandler((x) => x)}))

    // opened frames
    if (getSetting(settings.OPENED_TAB_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: windowStore.getFrames(),
        maxResults: config.urlBarSuggestions.maxOpenedFrames,
        type: suggestionTypes.TAB,
        clickHandler: (frameProps) =>
          windowActions.setActiveFrame(frameProps),
        sortHandler: sortBasedOnLocationPos,
        formatTitle: (frame) => frame.get('title'),
        formatUrl: (frame) => frame.get('location'),
        filterValue: (frame) => !isSourceAboutUrl(frame.get('location')) &&
          frame.get('key') !== props.activeFrameKey &&
          (frame.get('title') && frame.get('title').toLowerCase().includes(urlLocationLower) ||
          frame.get('location') && frame.get('location').toLowerCase().includes(urlLocationLower))}))
    }

    // Search suggestions
    if (getSetting(settings.OFFER_SEARCH_SUGGESTIONS) && props.searchResults) {
      suggestions = suggestions.concat(mapListToElements({
        data: props.searchResults,
        maxResults: config.urlBarSuggestions.maxSearch,
        type: suggestionTypes.SEARCH,
        clickHandler: navigateClickHandler((searchTerms) => {
          let searchURL = props.searchSelectEntry
          ? props.searchSelectEntry.search : props.searchDetail.get('searchURL')
          return searchURL.replace('{searchTerms}', encodeURIComponent(searchTerms))
        })
      }))
    }

    // Alexa top 500
    suggestions = suggestions.concat(mapListToElements({
      data: top500,
      maxResults: config.urlBarSuggestions.maxTopSites,
      type: suggestionTypes.TOP_SITE,
      clickHandler: navigateClickHandler((x) => x)}))

    return suggestions
  }

  updateSuggestions (newIndex) {
    const suggestions = this.suggestionList || this.props.suggestionList
    if (!suggestions) {
      return
    }
    // Update the urlbar preview content
    if (newIndex === 0 || newIndex > suggestions.size) {
      windowActions.setUrlBarPreview(null)
      newIndex = null
    } else {
      const currentActive = suggestions.get(newIndex - 1)
      if (currentActive && currentActive.title) {
        windowActions.setUrlBarPreview(currentActive.title)
      }
    }
    windowActions.setUrlBarSuggestions(suggestions, newIndex)
  }

  searchXHR (props, searchOnline) {
    props = props || this.props
    let autocompleteURL = props.searchSelectEntry
    ? props.searchSelectEntry.autocomplete : props.searchDetail.get('autocompleteURL')
    if (!getSetting(settings.OFFER_SEARCH_SUGGESTIONS) || !autocompleteURL) {
      windowActions.setUrlBarSuggestionSearchResults(Immutable.fromJS([]))
      this.updateSuggestions(props.selectedIndex)
      return
    }

    let urlLocation = props.urlLocation
    if (!isUrl(urlLocation) && urlLocation.length > 0) {
      if (props.searchSelectEntry) {
        const replaceRE = new RegExp('^' + props.searchSelectEntry.shortcut + ' ', 'g')
        urlLocation = urlLocation.replace(replaceRE, '')
      }
      // Render all suggestions asap
      this.updateSuggestions(props.selectedIndex)

      if (searchOnline) {
        const xhr = new window.XMLHttpRequest({mozSystem: true})
        xhr.open('GET', autocompleteURL
          .replace('{searchTerms}', encodeURIComponent(urlLocation)), true)
        xhr.responseType = 'json'
        xhr.send()
        xhr.onload = () => {
          // Once we have the online suggestions, append them to the others
          windowActions.setUrlBarSuggestionSearchResults(Immutable.fromJS(xhr.response[1]))
          this.updateSuggestions(props.selectedIndex)
        }
      }
    } else {
      windowActions.setUrlBarSuggestionSearchResults(Immutable.fromJS([]))
      this.updateSuggestions(props.selectedIndex)
    }
  }
}

module.exports = UrlBarSuggestions
