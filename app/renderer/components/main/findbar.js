/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../immutableComponent')
const Button = require('../common/button')
const SwitchControl = require('../common/switchControl')

// Constants
const keyCodes = require('../../../common/constants/keyCodes')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Stores
const windowStore = require('../../../../js/stores/windowStore')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const {getTextColorForBackground} = require('../../../../js/lib/color')

class FindBar extends ImmutableComponent {
  constructor () {
    super()
    this.onBlur = this.onBlur.bind(this)
    this.onInputFocus = this.onInputFocus.bind(this)
    this.onClear = this.onClear.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onInput = this.onInput.bind(this)
    this.onFindPrev = this.onFindPrev.bind(this)
    this.onFindNext = this.onFindNext.bind(this)
    this.onCaseSensitivityChange = this.onCaseSensitivityChange.bind(this)
    this.didFrameChange = true
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey)
  }

  onInput (e) {
    windowActions.setFindDetail(this.props.frameKey, Immutable.fromJS({
      searchString: e.target.value,
      caseSensitivity: this.isCaseSensitive
    }))
  }

  onCaseSensitivityChange (e) {
    windowActions.setFindDetail(this.props.frameKey, Immutable.fromJS({
      searchString: this.searchString,
      caseSensitivity: !this.isCaseSensitive
    }))
  }

  onFindFirst () {
    this.props.onFind(this.searchString, this.isCaseSensitive, true, false)
  }

  onFindNext () {
    this.props.onFind(this.searchString, this.isCaseSensitive, true, this.props.findDetail.get('internalFindStatePresent'))
  }

  onFindPrev () {
    this.props.onFind(this.searchString, this.isCaseSensitive, false, this.props.findDetail.get('internalFindStatePresent'))
  }

  onContextMenu (e) {
    // Without this timeout selection is not shown when right clicking in
    // a word so the word replacement is kind of a surprise.  This is because
    // our context menus are modal at the moment.  If we fix that we can
    // remove this timeout.
    setTimeout(() =>
      contextMenus.onFindBarContextMenu(e), 10)
  }

  /**
   * Focus the find in page input and select the text
   */
  focus () {
    this.searchInput.focus()
  }

  select () {
    this.searchInput.select()
  }

  componentDidMount () {
    this.searchInput.value = this.searchString
    this.focus()
    this.select()
    windowActions.setFindbarSelected(this.frame, false)
  }

  componentWillUpdate (nextProps) {
    if (nextProps.frameKey !== this.props.frameKey) {
      this.searchInput.value = (nextProps.findDetail && nextProps.findDetail.get('searchString')) || ''
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.selected && !prevProps.selected) {
      this.focus()
      // Findbar might already be focused, so make sure select happens even if no
      // onFocus event happens.
      this.select()
      windowActions.setFindbarSelected(this.frame, false)
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

  onInputFocus () {
    this.select()
  }

  onBlur (e) {
    windowActions.setFindbarSelected(this.frame, false)
  }

  onClear () {
    this.searchInput.value = ''
    windowActions.setFindDetail(this.props.frameKey, Immutable.fromJS({
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

  get backgroundColor () {
    return this.props.paintTabs && (this.props.themeColor || this.props.computedThemeColor)
  }

  get textColor () {
    return getTextColorForBackground(this.backgroundColor)
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

    const backgroundColor = this.backgroundColor
    let findBarStyle = {}
    let findBarTextStyle = {}

    if (backgroundColor) {
      findBarStyle = {
        background: backgroundColor,
        color: this.textColor
      }
      findBarTextStyle = {
        color: this.textColor
      }
    }

    return <div className='findBar' style={findBarStyle} onBlur={this.onBlur}>
      <div className='searchContainer'>
        <div className='searchStringContainer'>
          <span className='searchStringContainerIcon fa fa-search' />
          <input type='text'
            spellCheck='false'
            onContextMenu={this.onContextMenu}
            ref={(node) => { this.searchInput = node }}
            onFocus={this.onInputFocus}
            onKeyDown={this.onKeyDown}
            onInput={this.onInput} />
          <span className='searchStringContainerIcon fa fa-times findClear'
            onClick={this.onClear} />
        </div>
        <span className='findMatchText'>{findMatchText}</span>
        <Button iconClass='findButton fa-caret-up'
          inlineStyles={findBarStyle}
          className='findButton smallButton findPrev'
          disabled={this.numberOfMatches <= 0}
          onClick={this.onFindPrev} />
        <Button iconClass='findButton fa-caret-down'
          inlineStyles={findBarStyle}
          className='findButton smallButton findNext'
          disabled={this.numberOfMatches <= 0}
          onClick={this.onFindNext} />
        <SwitchControl
          id='caseSensitivityCheckbox'
          checkedOn={this.isCaseSensitive}
          onClick={this.onCaseSensitivityChange} />
        <label htmlFor='caseSensitivityCheckbox' data-l10n-id='caseSensitivity' style={findBarTextStyle} />
      </div>
      <span className='closeButton'
        style={findBarTextStyle}
        onClick={this.props.onFindHide}>+</span>
    </div>
  }
}

module.exports = FindBar
