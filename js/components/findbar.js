/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const keyCodes = require('../constants/keyCodes')
const Button = require('./button.js')
const WindowActions = require('../actions/windowActions')

export default class FindBar extends ImmutableComponent {
  constructor () {
    super()
  }

  onChange (e) {
    WindowActions.setFindDetail(this.props.frame, Immutable.fromJS({
      searchString: e.target.value,
      caseSensitivity: this.props.findDetail.get('caseSensitivity')
    }))
  }

  onCaseSensitivityChange (e) {
    WindowActions.setFindDetail(this.props.frame, Immutable.fromJS({
      searchString: this.props.findDetail.get('searchString'),
      caseSensitivity: e.target.checked
    }))
  }

  onFind () {
    this.props.onFindAll(this.props.findDetail.get('searchString'),
                         this.props.findDetail.get('caseSensitivity'))
  }

  onFindNext () {
    this.props.onFindAll(this.props.findDetail.get('searchString'),
                         this.props.findDetail.get('caseSensitivity'),
                         true)
  }

  onFindPrev () {
    this.props.onFindAgain(this.props.findDetail.get('searchString'),
                           this.props.findDetail.get('caseSensitivity'),
                           false)
  }

  /**
   * Focus the find in page input and select the text
   */
  focus () {
    let input = ReactDOM.findDOMNode(this.refs.searchString)
    input.focus()
    input.select()
  }

  componentDidUpdate (prevProps) {
    if (!this.props.active) {
      return null
    }
    if (!prevProps.active) {
      // Focus and select the find input
      this.focus()
    }
    if (this.props.findDetail !== prevProps.findDetail) {
      // Redo search if details have changed
      this.onFind()
    }
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case keyCodes.ESC:
        // ESC is handled by a local shortcut, so use shift+ESC
        if (e.shiftKey) {
          this.props.onHide()
        }
        break
      case keyCodes.ENTER:
        if (e.shiftKey) {
          this.onFindPrev()
        } else {
          this.onFind()
        }
        break
    }
  }

  get numberofMatches () {
    // TODO: Hook this up when found-in-page event fires
    if (!this.props.findInPageDetail) {
      return -1
    }
    return this.props.findInPageDetail.get('numberOfMatches')
  }

  get activeMatchOrdinal () {
    if (!this.props.findInPageDetail) {
      return -1
    }
    return this.props.findInPageDetail.get('activeMatchOrdinal')
  }

  get isCaseSensitive () {
    this.props.findDetail.get('caseSensitivity')
  }

  render () {
    if (!this.props.active) {
      return null
    }

    let findMatchText
    if (this.numberofMatches !== -1 && this.props.findDetail.get('searchString')) {
      let l10nArgs = {
        activeMatchOrdinal: this.activeMatchOrdinal,
        numberofMatches: this.numberofMatches
      }
      findMatchText = <span data-l10n-id='findResults'
      data-l10n-args={JSON.stringify(l10nArgs)}>{JSON.stringify(l10nArgs)}</span>
    }

    return <div className='findBar'>
      <span className='searchStringContainer'>
        <input type='text'
          ref='searchString'
          onKeyDown={this.onKeyDown.bind(this)}
          onChange={this.onChange.bind(this)}
          value={this.props.findDetail.get('searchString')}/>
          {findMatchText}
      </span>
      <Button iconClass='findButton fa-chevron-up'
        className='findButton smallButton findPrev'
        disabled={this.numberofMatches === 0}
        onClick={this.onFindPrev.bind(this)} />
      <Button iconClass='findButton fa-chevron-down'
        className='findButton smallButton findNext'
        disabled={this.numberofMatches === 0}
        onClick={this.onFindNext.bind(this)} />
      <Button iconClass='fa-times'
        className='findButton smallButton hideButton'
        onClick={this.props.onHide} />
      <div className='caseSensitivityContainer'>
        <input
          id='caseSensitivityCheckbox'
          type='checkbox'
          className='caseSensitivityCheckbox'
          checked={this.isCaseSensitive}
          onChange={this.onCaseSensitivityChange.bind(this)} />
        <label htmlFor='caseSensitivityCheckbox' data-l10n-id='caseSensitivity'>
          {'Match case'}
        </label>
      </div>
    </div>
  }
}
