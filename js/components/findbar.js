/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const keyCodes = require('../constants/keyCodes')
const Button = require('./button.js')
const windowActions = require('../actions/windowActions')

class FindBar extends ImmutableComponent {
  constructor () {
    super()
    this.onBlur = this.onBlur.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onFindPrev = this.onFindPrev.bind(this)
    this.onFindNext = this.onFindNext.bind(this)
    this.onCaseSensitivityChange = this.onCaseSensitivityChange.bind(this)
  }

  onChange (e) {
    windowActions.setFindDetail(this.props.frame, Immutable.fromJS({
      searchString: e.target.value,
      caseSensitivity: this.isCaseSensitive
    }))
  }

  onCaseSensitivityChange (e) {
    windowActions.setFindDetail(this.props.frame, Immutable.fromJS({
      searchString: this.searchString,
      caseSensitivity: e.target.checked
    }))
  }

  onFindFirst () {
    this.props.onFind(this.searchString, this.isCaseSensitive)
  }

  onFindNext () {
    this.props.onFind(this.searchString, this.isCaseSensitive, true)
  }

  onFindPrev () {
    this.props.onFind(this.searchString, this.isCaseSensitive, false)
  }

  /**
   * Focus the find in page input and select the text
   */
  focus () {
    const input = this.searchInput
    input.focus()
    input.select()
  }

  componentDidMount () {
    this.focus()
  }

  componentDidUpdate (prevProps) {
    if (this.props.selected) {
      this.focus()
    }
    if (!this.props.findDetail || !prevProps.findDetail ||
        this.props.findDetail.get('searchString') !== prevProps.findDetail.get('searchString') ||
        this.props.findDetail.get('caseSensitivity') !== prevProps.findDetail.get('caseSensitivity')) {
      // Redo search if details have changed
      this.onFindFirst()
    }
    if (this.props.frame.get('location') !== prevProps.frame.get('location')) {
      this.props.onFindHide()
    }
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case keyCodes.ESC:
        e.preventDefault()
        this.props.onFindHide()
        break
      case keyCodes.ENTER:
        e.preventDefault()
        if (e.shiftKey) {
          this.onFindPrev()
        } else {
          this.onFindNext()
        }
        break
    }
  }

  onBlur (e) {
    windowActions.setFindbarSelected(this.props.frame, false)
  }

  get numberOfMatches () {
    if (!this.props.findDetail || this.props.findDetail.get('numberOfMatches') === undefined) {
      return -1
    }
    return this.props.findDetail.get('numberOfMatches')
  }

  get activeMatchOrdinal () {
    if (!this.props.findDetail || this.props.findDetail.get('activeMatchOrdinal') === undefined) {
      return -1
    }
    return this.props.findDetail.get('activeMatchOrdinal') || -1
  }

  get isCaseSensitive () {
    if (!this.props.findDetail) {
      return false
    }
    return this.props.findDetail.get('caseSensitivity')
  }

  get searchString () {
    if (!this.props.findDetail) {
      return ''
    }
    return this.props.findDetail.get('searchString')
  }

  render () {
    let findMatchText
    if (this.numberOfMatches !== -1 && this.activeMatchOrdinal !== -1 && this.searchString) {
      const l10nArgs = {
        activeMatchOrdinal: this.activeMatchOrdinal,
        numberOfMatches: this.numberOfMatches
      }
      findMatchText = <div className='foundResults'
        data-l10n-args={JSON.stringify(l10nArgs)}
        data-l10n-id='findResults' />
    } else if (this.numberOfMatches !== -1 && this.searchString) {
      const l10nArgs = {
        activeMatchOrdinal: this.activeMatchOrdinal,
        numberOfMatches: this.numberOfMatches
      }
      findMatchText = <div className='foundResults'
        data-l10n-args={JSON.stringify(l10nArgs)}
        data-l10n-id='findResultMatches' />
    }

    return <div className='findBar' onBlur={this.onBlur}>
      <div className='searchStringContainer'>
        <input type='text'
          spellCheck='false'
          ref={(node) => { this.searchInput = node }}
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          value={this.searchString} />
          {findMatchText}
      </div>
      <Button iconClass='findButton fa-chevron-up'
        className='findButton smallButton findPrev'
        disabled={this.numberOfMatches === 0}

        onClick={this.onFindPrev} />
      <Button iconClass='findButton fa-chevron-down'
        className='findButton smallButton findNext'
        disabled={this.numberOfMatches === 0}
        onClick={this.onFindNext} />
      <Button iconClass='fa-times'
        className='findButton smallButton hideButton'
        onClick={this.props.onFindHide} />
      <div className='caseSensitivityContainer'>
        <input
          id='caseSensitivityCheckbox'
          type='checkbox'
          className='caseSensitivityCheckbox'
          checked={this.isCaseSensitive}
          onChange={this.onCaseSensitivityChange} />
        <label htmlFor='caseSensitivityCheckbox' data-l10n-id='caseSensitivity'>
          {'Match case'}
        </label>
      </div>
    </div>
  }
}

module.exports = FindBar
