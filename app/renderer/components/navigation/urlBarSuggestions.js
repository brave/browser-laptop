/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const UrlBarSuggestionItem = require('./urlBarSuggestionItem')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Utils
const cx = require('../../../../js/lib/classSet')
const locale = require('../../../../js/l10n')
const suggestions = require('../../../common/lib/suggestion')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const domUtil = require('../../lib/domUtil')
const menuBarState = require('../../../common/state/menuBarState')
const {getCurrentWindowId} = require('../../currentWindow')

class UrlBarSuggestions extends React.Component {
  blur () {
    appActions.urlBarSuggestionsChanged(getCurrentWindowId(), null, null)
  }

  generateAllItems () {
    let items = []
    let index = 0

    const addToItems = (suggestions, sectionKey, title, icon) => {
      if (suggestions.length > 0 && title === 'Tabs') {
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
        const selected = this.props.activeIndex === currentIndex || (this.props.activeIndex == null && currentIndex === 0 && this.props.hasSuggestionMatch)
        return <UrlBarSuggestionItem
          suggestion={suggestion}
          selected={selected}
          sectionKey={sectionKey}
          icon={icon}
          currentSearchValue={this.props.currentSearchValue}
          currentIndex={currentIndex}
          i={i} />
      }))
      index += suggestions.length
    }

    const list = suggestions.filterSuggestionListByType(this.props.suggestionList)

    addToItems(list.currentSearch, 'currentSearchTitle', locale.translation('searchSuggestionTitle'), 'fa-search')
    addToItems(list.historySuggestions, 'historyTitle', locale.translation('historySuggestionTitle'), 'fa-clock-o')
    addToItems(list.bookmarkSuggestions, 'bookmarksTitle', locale.translation('bookmarksSuggestionTitle'), 'fa-star-o')
    addToItems(list.aboutPagesSuggestions, 'aboutPagesTitle', locale.translation('aboutPagesSuggestionTitle'), null)
    addToItems(list.searchSuggestions, 'searchTitle', locale.translation('searchSuggestionTitle'), 'fa-search')
    addToItems(list.topSiteSuggestions, 'topSiteTitle', locale.translation('topSiteSuggestionTitle'), 'fa-link')
    addToItems(list.tabSuggestions, 'tabsTitle', locale.translation('tabsSuggestionTitle'), 'fa-external-link')

    return items
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const urlBar = activeFrame.getIn(['navbar', 'urlbar'], Immutable.Map())
    const currentSearchValue = urlBar.get('location')
    const documentHeight = domUtil.getStyleConstants('navbar-height')
    const menubarVisible = menuBarState.isMenuBarVisible(currentWindow)
    const menuHeight = menubarVisible ? 30 : 0

    const props = {}
    // used in renderer
    props.maxHeight = document.documentElement.offsetHeight - documentHeight - 2 - menuHeight
    props.currentSearchValue = currentSearchValue

    // used in functions
    props.suggestionList = urlBar.getIn(['suggestions', 'suggestionList']) // TODO (nejc) improve, use primitives
    props.hasSuggestionMatch = urlBar.getIn(['suggestions', 'hasSuggestionMatch'])
    props.activeIndex = props.suggestionList === null
      ? -1
      : urlBar.getIn(['suggestions', 'selectedIndex'])

    return props
  }

  render () {
    return <ul className='urlBarSuggestions'
      data-test-id='urlBarSuggestions'
      style={{
        maxHeight: this.props.maxHeight
      }}
    >
      {this.generateAllItems()}
    </ul>
  }
}

module.exports = ReduxComponent.connect(UrlBarSuggestions)
