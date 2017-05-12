/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const UrlBarSuggestionItem = require('./urlBarSuggestionItem')
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')
const suggestionTypes = require('../../../../js/constants/suggestionTypes')
const cx = require('../../../../js/lib/classSet')
const locale = require('../../../../js/l10n')
const {isForSecondaryAction} = require('../../../../js/lib/eventUtil')

class UrlBarSuggestions extends ImmutableComponent {
  constructor () {
    super()
    this.onSuggestionClicked = this.onSuggestionClicked.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
  }

  get activeIndex () {
    if (this.props.suggestionList === null) {
      return -1
    }
    return this.props.selectedIndex
  }

  blur () {
    appActions.urlBarSuggestionsChanged(null, null)
  }

  onSuggestionClicked (e) {
    windowActions.activeSuggestionClicked(isForSecondaryAction(e), e.shiftKey)
  }

  render () {
    const suggestions = this.props.suggestionList
    const bookmarkSuggestions = suggestions.filter((s) => s.get('type') === suggestionTypes.BOOKMARK)
    const historySuggestions = suggestions.filter((s) => s.get('type') === suggestionTypes.HISTORY)
    const aboutPagesSuggestions = suggestions.filter((s) => s.get('type') === suggestionTypes.ABOUT_PAGES)
    const tabSuggestions = suggestions.filter((s) => s.get('type') === suggestionTypes.TAB)
    const searchSuggestions = suggestions.filter((s) => s.get('type') === suggestionTypes.SEARCH)
    const topSiteSuggestions = suggestions.filter((s) => s.get('type') === suggestionTypes.TOP_SITE)

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
        const selected = this.activeIndex === currentIndex || (!this.activeIndex && currentIndex === 0 && this.props.hasLocationValueSuffix)
        return <UrlBarSuggestionItem
          suggestion={suggestion}
          selected={selected}
          currentIndex={currentIndex}
          i={i}
          onMouseOver={this.onMouseOver}
          onClick={this.onSuggestionClicked} />
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
  }

  updateSuggestions (newIndex) {
    const suggestions = this.suggestionList || this.props.suggestionList
    if (!suggestions) {
      return
    }
    // Update the urlbar preview content
    if (newIndex === 0 || newIndex > suggestions.size) {
      newIndex = null
    }
    appActions.urlBarSuggestionsChanged(suggestions, newIndex)
  }
}

module.exports = UrlBarSuggestions
