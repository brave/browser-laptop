const React = require('react')

const ImmutableComponent = require('./immutableComponent')
const UrlUtil = require('./../../node_modules/urlutil.js/dist/node-urlutil.js')

const Config = require('../constants/config')
import top500 from './../data/top500.js'
import {isSourceAboutUrl} from '../lib/appUrlUtil.js'
import Immutable from 'immutable'
import debounce from '../lib/debounce.js'
import {getSiteIconClass} from '../lib/siteUtil.js'

class UrlBarSuggestions extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.searchXHR = debounce(this.searchXHR.bind(this), 50)
  }

  get activeIndex () {
    return Math.abs(this.props.previewActiveIndex % (this.props.suggestions.size + 1))
  }

  nextSuggestion () {
    this.updateSuggestions(this.props.previewActiveIndex + 1)
  }

  previousSuggestion () {
    var suggestions = this.props.suggestions
    if (!suggestions) {
      return
    }

    var newIndex = this.props.previewActiveIndex - 1
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
    this.mergeState({
      suggestions: null,
      activeIndex: null
    })
    this.props.onPreviewUpdate(null)
  }

  render () {
    var suggestions = this.props.suggestions
    window.removeEventListener('click', this)
    if (!this.props.urlValue && !this.props.urlPreview ||
        !suggestions || suggestions.size === 0) {
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
    if (this.props.urlValue === prevProps.urlValue) {
      return
    }
    this.searchXHR()
  }

  updateSuggestions (newIndex) {
    if (!this.props.urlValue && !this.props.urlPreview) {
      return null
    }

    let navigateClickHandler = formatUrl => site => {
      this.props.onNavigate(formatUrl(site))
      this.blur()
    }

    let suggestions = new Immutable.List()
    let defaultme = x => x
    let mapListToElements = ({data, maxResults, classHandler, clickHandler = navigateClickHandler,
        sortHandler = defaultme, formatTitle = defaultme,
        filterValue = site => site.toLowerCase().includes(this.props.urlValue.toLowerCase())
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
    suggestions = suggestions.concat(mapListToElements({
      data: this.props.frames,
      maxResults: Config.urlBarSuggestions.maxOpenedFrames,
      classHandler: () => 'fa-file',
      clickHandler: this.props.onSelectFrame,
      formatTitle: frame => frame.get('title') || frame.get('location'),
      filterValue: frame => !isSourceAboutUrl(frame.get('location')) &&
        frame.get('key') !== this.props.activeFrameProps.get('key') &&
        (frame.get('title') && frame.get('title').toLowerCase().includes(this.props.urlValue.toLowerCase()) ||
        frame.get('location') && frame.get('location').toLowerCase().includes(this.props.urlValue.toLowerCase()))}))

    // history, bookmarks, reader list
    suggestions = suggestions.concat(mapListToElements({
      data: this.props.sites,
      maxResults: Config.urlBarSuggestions.maxSites,
      classHandler: getSiteIconClass,
      clickHandler: navigateClickHandler(site => {
        console.log('Site is:', site)
        return site.get('location')
      }),
      sortHandler: (site1, site2) => {
        return site2.get('tags').size - site1.get('tags').size
      },
      formatTitle: site => site.get('title') || site.get('location'),
      filterValue: site => {
        var val = site.get('title') || site.get('location')
        return val.toLowerCase()
      }
    }))

    // Search suggestions
    if (this.props.searchSuggestions) {
      suggestions = suggestions.concat(mapListToElements({
        data: this.props.searchResults,
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

    this.setState('suggestions', suggestions)

    // Update the urlbar preview content
    if (newIndex === 0 || newIndex > suggestions.size) {
      this.props.onPreviewUpdate(null)
    } else {
      var currentActive = suggestions.get(newIndex - 1)
      currentActive.previewActiveIndex = newIndex
      this.props.onPreviewUpdate(currentActive)
    }
  }

  searchXHR () {
    if (!this.props.searchSuggestions) {
      this.updateSuggestions(this.props.previewActiveIndex)
      return
    }

    let urlValue = this.props.urlValue
    if (!UrlUtil.isURL(urlValue) && urlValue.length > 0) {
      let xhr = new window.XMLHttpRequest({mozSystem: true})
      xhr.open('GET', this.props.searchDetail.get('autocompleteURL')
        .replace('{searchTerms}', urlValue), true)
      xhr.responseType = 'json'
      xhr.send()
      xhr.onload = () => {
        this.setState('searchResults', Immutable.fromJS(xhr.response[1]))
        this.updateSuggestions(this.props.previewActiveIndex)
      }
    } else {
      this.setState('searchResults', Immutable.fromJS([]))
      this.updateSuggestions(this.props.previewActiveIndex)
    }
  }
}

module.exports = UrlBarSuggestions
