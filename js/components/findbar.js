/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const keyCodes = require('../constants/keyCodes')
const Button = require('./button.js')
const SwitchControl = require('../components/switchControl')
const windowActions = require('../actions/windowActions')
const windowStore = require('../stores/windowStore')
const {getTextColorForBackground} = require('../lib/color')

class FindBar extends ImmutableComponent {
  constructor () {
    super()
    this.onBlur = this.onBlur.bind(this)
    this.onClear = this.onClear.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onFindPrev = this.onFindPrev.bind(this)
    this.onFindNext = this.onFindNext.bind(this)
    this.onCaseSensitivityChange = this.onCaseSensitivityChange.bind(this)
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey)
  }

  onChange (e) {
    windowActions.setFindDetail(this.frame, Immutable.fromJS({
      searchString: e.target.value,
      caseSensitivity: this.isCaseSensitive
    }))
  }

  onCaseSensitivityChange (e) {
    windowActions.setFindDetail(this.frame, Immutable.fromJS({
      searchString: this.searchString,
      caseSensitivity: !this.isCaseSensitive
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
    windowActions.setFindbarSelected(this.frame, false)
  }

  onClear () {
    windowActions.setFindDetail(this.frame, Immutable.fromJS({
      searchString: '',
      caseSensitivity: this.isCaseSensitive
    }))
    this.focus()
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

    const backgroundColor = this.props.paintTabs && (this.props.themeColor || this.props.computedThemeColor)
    let textColor
    let findBarStyle = {}

    if (backgroundColor) {
      textColor = getTextColorForBackground(backgroundColor)
      findBarStyle = {
        background: backgroundColor,
        border: '1px solid ' + backgroundColor,
        color: textColor
      }
    }

    return <div className='findBar' style={findBarStyle} onBlur={this.onBlur}>
      <div className='searchContainer'>
        <div className='searchStringContainer'>
          <span className='fa fa-search'></span>
          <input type='text'
            spellCheck='false'
            ref={(node) => { this.searchInput = node }}
            onKeyDown={this.onKeyDown}
            onChange={this.onChange}
            value={this.searchString} />
          <span className='fa fa-times'
            onClick={this.onClear}></span>
        </div>
        <span className='findMatchText'>{findMatchText}</span>
        <Button iconClass='findButton fa-caret-down'
          className='findButton smallButton findNext'
          disabled={this.numberOfMatches <= 0}
          onClick={this.onFindNext} />
        <Button iconClass='findButton fa-caret-up'
          className='findButton smallButton findPrev'
          disabled={this.numberOfMatches <= 0}
          onClick={this.onFindPrev} />
        <SwitchControl
          id='caseSensitivityCheckbox'
          checkedOn={this.isCaseSensitive}
          onClick={this.onCaseSensitivityChange} />
        <label htmlFor='caseSensitivityCheckbox' data-l10n-id='caseSensitivity' style={findBarStyle}></label>
      </div>
      <Button label='+'
        className='navbutton closeButton'
        onClick={this.props.onFindHide} />
    </div>
  }
}

module.exports = FindBar
