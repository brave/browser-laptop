/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../immutableComponent')

// Constants
const suggestionTypes = require('../../../../js/constants/suggestionTypes')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// utils
const cx = require('../../../../js/lib/classSet')
const {isForSecondaryAction} = require('../../../../js/lib/eventUtil')
const {getCurrentWindowId} = require('../../currentWindow')

class UrlBarSuggestionItem extends ImmutableComponent {
  constructor () {
    super()
    this.onMouseOver = this.onMouseOver.bind(this)
  }

  onMouseOver (e) {
    let newIndex = parseInt(e.target.getAttribute('data-index'), 10)

    if (newIndex < 0) {
      newIndex = null
    }

    appActions.urlBarSelectedIndexChanged(getCurrentWindowId(), newIndex)
  }

  onClick (e) {
    windowActions.activeSuggestionClicked(isForSecondaryAction(e), e.shiftKey)
  }

  componentDidMount () {
    this.node.addEventListener('auxclick', this.onClick)
  }

  componentWillUpdate (nextProps) {
    if (!this.props.selected && nextProps.selected) {
      this.node.scrollIntoView()
    }
  }

  render () {
    const urlLocation = this.props.suggestion.get('location')
    let firstPortion, boldPortion, endPortion

    if (this.props.suggestion.get('type') !== suggestionTypes.CURRENT_SEARCH) {
      const sizeOfCurrentValue = this.props.currentSearchValue.length
      const boldPortionStart = urlLocation.indexOf(this.props.currentSearchValue)
      firstPortion = urlLocation.slice(0, boldPortionStart)
      boldPortion = urlLocation.slice(boldPortionStart, boldPortionStart + sizeOfCurrentValue)
      endPortion = urlLocation.slice(boldPortionStart + sizeOfCurrentValue)
    }

    return <li className={cx({
      selected: this.props.selected,
      suggestionItem: true,
      [this.props.suggestion.get('type')]: true
    })}
      data-test-id='list-item'
      data-test2-id={this.props.selected ? 'selected' : 'notSelected'}
      data-index={this.props.currentIndex}
      onMouseOver={this.onMouseOver}
      onClick={this.onClick}
      key={`${this.props.suggestion.get('location')}|${this.props.currentIndex + this.props.i}`}
      ref={(node) => { this.node = node }}
    >
      {
        this.props.icon && this.props.sectionKey && this.props.suggestion.get('type') !== suggestionTypes.TAB
        ? <span className={cx({
          suggestionSectionIcon: true,
          [this.props.sectionKey]: true,
          fa: true,
          [this.props.icon]: true
        })} />
        : null
      }
      {
        this.props.suggestion.get('type') === suggestionTypes.ABOUT_PAGES && this.props.suggestion.get('title')
        ? <span data-test-id='suggestionTitle' className='suggestionTitle'>{this.props.suggestion.get('title')}</span>
        : null
      }
      {
        this.props.suggestion.get('type') === suggestionTypes.CURRENT_SEARCH
        ? <span data-test-id='suggestionLocation' className='suggestionLocation'>{urlLocation} - {this.props.suggestion.get('title')}</span>
        : null
      }
      {
        this.props.suggestion.get('type') !== suggestionTypes.SEARCH && this.props.suggestion.get('type') !== suggestionTypes.ABOUT_PAGES && this.props.suggestion.get('type') !== suggestionTypes.CURRENT_SEARCH
        ? <span data-test-id='suggestionLocation' className='suggestionLocation'>{firstPortion}<strong>{boldPortion}</strong>{endPortion} - {this.props.suggestion.get('title')}</span>
        : null
      }
    </li>
  }
}

module.exports = UrlBarSuggestionItem
