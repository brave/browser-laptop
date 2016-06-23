/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const windowActions = require('../actions/windowActions')
const ImmutableComponent = require('./immutableComponent')

const config = require('../constants/config.js')
const top500 = require('./../data/top500.js')
const {isSourceAboutUrl, isUrl} = require('../lib/appUrlUtil')
const Immutable = require('immutable')
const debounce = require('../lib/debounce.js')
const settings = require('../constants/settings')
const siteTags = require('../constants/siteTags')
const suggestionTypes = require('../constants/suggestionTypes')
const getSetting = require('../settings').getSetting
const eventUtil = require('../lib/eventUtil.js')
const cx = require('../lib/classSet.js')
const locale = require('../l10n')

class UrlBarSuggestions extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.searchXHR = debounce(this.searchXHR.bind(this), 50)
  }

  get activeIndex () {
    if (this.props.suggestions.get('suggestionList') === null) {
      return 0
    }
    return Math.abs(this.props.suggestions.get('selectedIndex') % (this.props.suggestions.get('suggestionList').size + 1))
  }

  nextSuggestion () {
    // If the user presses down and don't have an explicit selected index, skip to the 2nd one
    const hasUrlSuffix = this.props.activeFrameProps.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix']) || ''
    if (hasUrlSuffix && this.props.suggestions.get('selectedIndex') === null && this.props.suggestions.get('suggestionList').size > 1) {
      this.updateSuggestions(2)
      return
    }

    this.updateSuggestions(this.props.suggestions.get('selectedIndex') + 1)
  }

  previousSuggestion () {
    const suggestions = this.props.suggestions.get('suggestionList')
    if (!suggestions) {
      return
    }

    let newIndex = this.props.suggestions.get('selectedIndex') - 1
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
    ReactDOM.findDOMNode(this).getElementsByClassName('selected')[0].click()
  }

  // Whether the suggestions box should be rendered
  shouldRender () {
    const suggestions = this.props.suggestions.get('suggestionList')
    return suggestions && suggestions.size > 0
  }

  render () {
    const suggestions = this.props.suggestions.get('suggestionList')
    window.removeEventListener('click', this)

    if (!this.shouldRender()) {
      return null
    }

    // Add an event listener on the window to hide suggestions when they are shown.
    window.addEventListener('click', this)

    // If there is a URL suffix that means there's an active autocomplete for the first element.
    // We should show that as selected so the user knows what is being matched.
    const hasUrlSuffix = this.props.activeFrameProps.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix']) || ''

    const tabSuggestions = suggestions.filter((s) => s.type === suggestionTypes.TAB)
    const bookmarkSuggestions = suggestions.filter((s) => s.type === suggestionTypes.BOOKMARK)
    const historySuggestions = suggestions.filter((s) => s.type === suggestionTypes.HISTORY)
    const searchSuggestions = suggestions.filter((s) => s.type === suggestionTypes.SEARCH)
    const topSiteSuggestions = suggestions.filter((s) => s.type === suggestionTypes.TOP_SITE)

    let items = []
    let index = 0
    const addToItems = (suggestions, sectionKey, title, icon) => {
      if (suggestions.size > 0) {
        items.push(<li className='suggestionSection'>
          <span className='suggestionSectionTitle'>{title}</span>
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
        </li>)
      }
      items = items.concat(suggestions.map((suggestion, i) => {
        const currentIndex = index + i
        const selected = this.activeIndex === currentIndex + 1 || currentIndex === 0 && hasUrlSuffix
        return <li data-index={currentIndex + 1}
          onMouseOver={this.onMouseOver.bind(this)}
          onClick={suggestion.onClick}
          key={suggestion.location}
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
            suggestion.type !== suggestionTypes.SEARCH
            ? <div className='suggestionLocation'>{suggestion.location}</div>
            : null
          }
        </li>
      }))
      index += suggestions.size
    }
    addToItems(tabSuggestions, 'tabsTitle', locale.translation('tabsSuggestionTitle'), 'fa-external-link')
    addToItems(bookmarkSuggestions, 'bookmarksTitle', locale.translation('bookmarksSuggestionTitle'), 'fa-star-o')
    addToItems(historySuggestions, 'historyTitle', locale.translation('historySuggestionTitle'), 'fa-clock-o')
    addToItems(searchSuggestions, 'searchTitle', locale.translation('searchSuggestionTitle'), 'fa-search')
    addToItems(topSiteSuggestions, 'topSiteTitle', locale.translation('topSiteSuggestionTitle'), 'fa-link')
    const documentHeight = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--navbar-height'), 10)
    return <ul className='urlBarSuggestions' style={{
      maxHeight: document.documentElement.offsetHeight - documentHeight - 2
    }}>
      {items}
    </ul>
  }

  onMouseOver (e) {
    this.updateSuggestions(parseInt(e.target.dataset.index, 10))
  }

  componentDidUpdate (prevProps) {
    if (this.selectedElement) {
      this.selectedElement.scrollIntoView()
    }
    if (this.props.urlLocation === prevProps.urlLocation) {
      return
    }
    this.suggestionList = this.getNewSuggestionList()
    this.searchXHR()
  }

  getNewSuggestionList () {
    if (!this.props.urlLocation && !this.props.urlPreview) {
      return null
    }

    const navigateClickHandler = (formatUrl) => (site, e) => {
      // We have a wonky way of fake clicking from keyboard enter,
      // so remove the meta keys from the real event here.
      e.metaKey = e.metaKey || this.metaKey
      e.ctrlKey = e.ctrlKey || this.ctrlKey
      delete this.metaKey
      delete this.ctrlKey

      const location = formatUrl(site)
      if (eventUtil.isForSecondaryAction(e)) {
        windowActions.newFrame({
          location,
          partitionNumber: site && site.get && site.get('partitionNumber') || undefined
        }, false)
        e.preventDefault()
        windowActions.setNavBarFocused(true)
      } else {
        windowActions.loadUrl(this.props.activeFrameProps, location)
        windowActions.setUrlBarActive(false)
        this.blur()
      }
    }

    const urlLocationLower = this.props.urlLocation.toLowerCase()
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
        suggestions.findIndex((x) => (x.location || '').toLowerCase() === (formatUrl(site) || '').toLowerCase()) === -1)
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

    const sortBasedOnLocationPos = (s1, s2) => {
      const pos1 = s1.get('location').indexOf(urlLocationLower)
      const pos2 = s2.get('location').indexOf(urlLocationLower)
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
          // If there's a tie on the match location, use the shorter URL
          return s1.get('location').length - s2.get('location').length
        }
      }
    }

    // opened frames
    if (getSetting(settings.OPENED_TAB_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.frames,
        maxResults: config.urlBarSuggestions.maxOpenedFrames,
        type: suggestionTypes.TAB,
        clickHandler: (frameProps) =>
          windowActions.setActiveFrame(frameProps),
        sortHandler: sortBasedOnLocationPos,
        formatTitle: (frame) => frame.get('title'),
        formatUrl: (frame) => frame.get('location'),
        filterValue: (frame) => !isSourceAboutUrl(frame.get('location')) &&
          frame.get('key') !== this.props.activeFrameProps.get('key') &&
          (frame.get('title') && frame.get('title').toLowerCase().includes(urlLocationLower) ||
          frame.get('location') && frame.get('location').toLowerCase().includes(urlLocationLower))}))
    }

    // bookmarks
    if (getSetting(settings.BOOKMARK_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.sites,
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

    // history
    if (getSetting(settings.HISTORY_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.sites,
        maxResults: config.urlBarSuggestions.maxHistorySites,
        type: suggestionTypes.HISTORY,
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
            (!site.get('tags') || site.get('tags').size === 0)
        }
      }))
    }

    // Search suggestions
    if (getSetting(settings.OFFER_SEARCH_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.suggestions.get('searchResults'),
        maxResults: config.urlBarSuggestions.maxSearch,
        type: suggestionTypes.SEARCH,
        clickHandler: navigateClickHandler((searchTerms) => this.props.searchDetail.get('searchURL')
          .replace('{searchTerms}', encodeURIComponent(searchTerms)))}))
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
    const suggestions = this.suggestionList || this.props.suggestions.get('suggestionList')
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

  searchXHR () {
    if (!getSetting(settings.OFFER_SEARCH_SUGGESTIONS)) {
      this.updateSuggestions(this.props.suggestions.get('selectedIndex'))
      return
    }

    const urlLocation = this.props.urlLocation
    if (!isUrl(urlLocation) && urlLocation.length > 0) {
      const xhr = new window.XMLHttpRequest({mozSystem: true})
      xhr.open('GET', this.props.searchDetail.get('autocompleteURL')
        .replace('{searchTerms}', encodeURIComponent(urlLocation)), true)
      xhr.responseType = 'json'
      xhr.send()
      xhr.onload = () => {
        windowActions.setUrlBarSuggestionSearchResults(Immutable.fromJS(xhr.response[1]))
        this.updateSuggestions(this.props.suggestions.get('selectedIndex'))
      }
    } else {
      windowActions.setUrlBarSuggestionSearchResults(Immutable.fromJS([]))
      this.updateSuggestions(this.props.suggestions.get('selectedIndex'))
    }
  }
}

module.exports = UrlBarSuggestions
