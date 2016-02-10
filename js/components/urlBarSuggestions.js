/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const WindowActions = require('../actions/windowActions')
const ImmutableComponent = require('./immutableComponent')

import Config from '../constants/config.js'
import top500 from './../data/top500.js'
import {isSourceAboutUrl, isUrl} from '../lib/appUrlUtil.js'
import Immutable from 'immutable'
import debounce from '../lib/debounce.js'
const {getSiteIconClass} = require('../state/siteUtil.js')
const settings = require('../constants/settings')
const getSetting = require('../settings').getSetting

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

  handleEvent () {
    this.blur()
  }

  blur () {
    window.removeEventListener('click', this)
    WindowActions.setUrlBarSuggestions(null, null)
    WindowActions.setUrlBarPreview(null)
  }

  clickSelected () {
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

    return <ul className='urlBarSuggestions'>
      {suggestions.map((suggestion, index) =>
        <li data-index={index + 1}
            onMouseOver={this.onMouseOver.bind(this)}
            onClick={suggestion.onClick}
            key={suggestion.title}
            className={this.activeIndex === index + 1 ? 'selected' : ''}>
          <span className={`suggestionIcon fa ${suggestion.iconClass}`}/>
          <span className='suggestionText'>{suggestion.title}</span>
        </li>
      )}
    </ul>
  }

  onMouseOver (e) {
    this.updateSuggestions(parseInt(e.target.dataset.index, 10))
  }

  componentDidUpdate (prevProps) {
    if (this.props.urlLocation === prevProps.urlLocation) {
      return
    }
    this.searchXHR()
  }

  updateSuggestions (newIndex) {
    if (!this.props.urlLocation && !this.props.urlPreview) {
      return null
    }

    const navigateClickHandler = formatUrl => site => {
      const location = formatUrl(site)
      WindowActions.setNavBarUserInput(location)
      WindowActions.loadUrl(this.props.activeFrameProps, location)
      WindowActions.setUrlBarActive(false)
      this.blur()
    }

    let suggestions = new Immutable.List()
    const defaultme = x => x
    const mapListToElements = ({data, maxResults, classHandler, clickHandler = navigateClickHandler,
        sortHandler = defaultme, formatTitle = defaultme,
        filterValue = site => site.toLowerCase().includes(this.props.urlLocation.toLowerCase())
    }) => // Filter out things which are already in our own list at a smaller index
      data.filter((site, index) => {
        return data.findIndex(x => formatTitle(x).toLowerCase() === formatTitle(site).toLowerCase()) === index
      })
      // Per suggestion provider filter
      .filter(filterValue)
      // Filter out things which are already in the suggestions list
      .filter(site =>
        suggestions.findIndex(x => x.title.toLowerCase() === formatTitle(site).toLowerCase()) === -1)
      .sort(sortHandler)
      .take(maxResults)
      .map(site => {
        return {
          onClick: clickHandler.bind(null, site),
          title: formatTitle(site),
          iconClass: classHandler(site)
        }
      })

    // opened frames
    if (getSetting(this.props.settings, settings.OPENED_TAB_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.frames,
        maxResults: Config.urlBarSuggestions.maxOpenedFrames,
        classHandler: () => 'fa-file',
        clickHandler: (frameProps) =>
          WindowActions.setActiveFrame(frameProps),
        formatTitle: frame => frame.get('title') || frame.get('location'),
        filterValue: frame => !isSourceAboutUrl(frame.get('location')) &&
          frame.get('key') !== this.props.activeFrameProps.get('key') &&
          (frame.get('title') && frame.get('title').toLowerCase().includes(this.props.urlLocation.toLowerCase()) ||
          frame.get('location') && frame.get('location').toLowerCase().includes(this.props.urlLocation.toLowerCase()))}))
    }

    // bookmarks, reader list
    if (getSetting(this.props.settings, settings.BOOKMARK_SUGGESTIONS)) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.sites,
        maxResults: Config.urlBarSuggestions.maxSites,
        classHandler: getSiteIconClass,
        clickHandler: navigateClickHandler(site => {
          return site.get('location')
        }),
        sortHandler: (site1, site2) => {
          return site2.get('tags').size - site1.get('tags').size
        },
        formatTitle: site => site.get('title') || site.get('location'),
        filterValue: site => {
          const title = site.get('title') || ''
          const location = site.get('location') || ''
          return title.toLowerCase().includes(this.props.urlLocation.toLowerCase()) ||
            location.toLowerCase().includes(this.props.urlLocation.toLowerCase())
        }
      }))
    }

    // Search suggestions
    if (this.props.searchSuggestions) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.suggestions.get('searchResults'),
        maxResults: Config.urlBarSuggestions.maxTopSites,
        classHandler: () => 'fa-search',
        clickHandler: navigateClickHandler(searchTerms => this.props.searchDetail.get('searchURL')
          .replace('{searchTerms}', searchTerms))}))
    }

    // Alexa top 500
    suggestions = suggestions.concat(mapListToElements({
      data: top500,
      maxResults: Config.urlBarSuggestions.maxSearch,
      classHandler: () => 'fa-link',
      clickHandler: navigateClickHandler(x => x)}))

    // Update the urlbar preview content
    if (newIndex === 0 || newIndex > suggestions.size) {
      WindowActions.setUrlBarPreview(null)
      newIndex = null
    } else {
      const currentActive = suggestions.get(newIndex - 1)
      if (currentActive && currentActive.title) {
        WindowActions.setUrlBarPreview(currentActive.title)
      }
    }
    WindowActions.setUrlBarSuggestions(suggestions, newIndex)
  }

  searchXHR () {
    if (!this.props.searchSuggestions) {
      this.updateSuggestions(this.props.suggestions.get('selectedIndex'))
      return
    }

    const urlLocation = this.props.urlLocation
    if (!isUrl(urlLocation) && urlLocation.length > 0) {
      const xhr = new window.XMLHttpRequest({mozSystem: true})
      xhr.open('GET', this.props.searchDetail.get('autocompleteURL')
        .replace('{searchTerms}', urlLocation), true)
      xhr.responseType = 'json'
      xhr.send()
      xhr.onload = () => {
        WindowActions.setUrlBarSuggestionSearchResults(Immutable.fromJS(xhr.response[1]))
        this.updateSuggestions(this.props.suggestions.get('selectedIndex'))
      }
    } else {
      WindowActions.setUrlBarSuggestionSearchResults(Immutable.fromJS([]))
      this.updateSuggestions(this.props.suggestions.get('selectedIndex'))
    }
  }
}

module.exports = UrlBarSuggestions
