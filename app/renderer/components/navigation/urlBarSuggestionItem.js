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
    this.onMouseMove = this.onMouseMove.bind(this)
  }

  onMouseMove (e) {
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
    return <li className={cx({
      selected: this.props.selected,
      suggestionItem: true,
      [this.props.suggestion.get('type')]: true
    })}
      data-test-id='list-item'
      data-test2-id={this.props.selected ? 'selected' : 'notSelected'}
      data-index={this.props.currentIndex}
      onMouseMove={this.onMouseMove}
      onClick={this.onClick}
      key={`${this.props.suggestion.get('location')}|${this.props.currentIndex + this.props.i}`}
      ref={(node) => { this.node = node }}
    >
      {
        this.props.suggestion.get('type') !== suggestionTypes.TOP_SITE && this.props.suggestion.get('title')
        ? <div data-test-id='suggestionTitle' className='suggestionTitle'>{this.props.suggestion.get('title')}</div>
        : null
      }
      {
        this.props.suggestion.get('type') !== suggestionTypes.SEARCH && this.props.suggestion.get('type') !== suggestionTypes.ABOUT_PAGES
        ? <div data-test-id='suggestionLocation' className='suggestionLocation'>{this.props.suggestion.get('location')}</div>
        : null
      }
    </li>
  }
}

module.exports = UrlBarSuggestionItem
