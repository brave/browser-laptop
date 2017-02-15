/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const suggestionTypes = require('../../../js/constants/suggestionTypes')
const cx = require('../../../js/lib/classSet')

class UrlBarSuggestionItem extends ImmutableComponent {
  componentDidMount () {
    this.node.addEventListener('auxclick', this.props.onClick)
  }
  componentWillUpdate (nextProps) {
    if (!this.props.selected && nextProps.selected) {
      this.node.scrollIntoView()
    }
  }
  render () {
    return <li data-index={this.props.currentIndex}
      onMouseOver={this.props.onMouseOver.bind(this)}
      onClick={this.props.onClick}
      key={`${this.props.suggestion.location}|${this.props.currentIndex + this.props.i}`}
      ref={(node) => { this.node = node }}
      className={cx({
        selected: this.props.selected,
        suggestionItem: true,
        [this.props.suggestion.type]: true
      })}>
      {
        this.props.suggestion.type !== suggestionTypes.TOP_SITE && this.props.suggestion.title
        ? <div className='suggestionTitle'>{this.props.suggestion.title}</div>
        : null
      }
      {
        this.props.suggestion.type !== suggestionTypes.SEARCH && this.props.suggestion.type !== suggestionTypes.ABOUT_PAGES
        ? <div className='suggestionLocation'>{this.props.suggestion.location}</div>
        : null
      }
    </li>
  }
}

module.exports = UrlBarSuggestionItem
