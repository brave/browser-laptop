/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const {BrowserButton} = require('../common/browserButton')
const SwitchControl = require('../common/switchControl')

// Constants
const keyCodes = require('../../../common/constants/keyCodes')
const settings = require('../../../../js/constants/settings')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const {getTextColorForBackground} = require('../../../../js/lib/color')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {getSetting} = require('../../../../js/settings')

// Styles
const globalStyles = require('../styles/global')

class FindBar extends React.Component {
  constructor (props) {
    super(props)
    this.onBlur = this.onBlur.bind(this)
    this.onInputFocus = this.onInputFocus.bind(this)
    this.onClear = this.onClear.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onInput = this.onInput.bind(this)
    this.onFindPrev = this.onFindPrev.bind(this)
    this.onFindNext = this.onFindNext.bind(this)
    this.onCaseSensitivityChange = this.onCaseSensitivityChange.bind(this)
    this.onFind = this.onFind.bind(this)
    this.onFindHide = this.onFindHide.bind(this)
  }

  onInput (e) {
    windowActions.setFindDetail(this.props.activeFrameKey, Immutable.fromJS({
      searchString: e.target.value,
      caseSensitivity: this.props.isCaseSensitive
    }))
  }

  onCaseSensitivityChange (e) {
    windowActions.setFindDetail(this.props.activeFrameKey, Immutable.fromJS({
      searchString: this.props.searchString,
      caseSensitivity: !this.props.isCaseSensitive
    }))
  }

  onFindFirst () {
    this.onFind(this.props.searchString, this.props.isCaseSensitive, true, false)
  }

  onFindNext () {
    this.onFind(this.props.searchString, this.props.isCaseSensitive, true, this.props.internalFindStatePresent)
  }

  onFindPrev () {
    this.onFind(this.props.searchString, this.props.isCaseSensitive, false, this.props.internalFindStatePresent)
  }

  onContextMenu (e) {
    // Without this timeout selection is not shown when right clicking in
    // a word so the word replacement is kind of a surprise.  This is because
    // our context menus are modal at the moment.  If we fix that we can
    // remove this timeout.
    setTimeout(() => contextMenus.onFindBarContextMenu(e), 10)
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
    this.searchInput.value = this.props.searchString
    this.focus()
    this.select()
    windowActions.setFindbarSelected(this.props.activeFrameKey, false)
  }

  componentWillUpdate (nextProps) {
    if (nextProps.activeFrameKey !== this.props.activeFrameKey) {
      this.searchInput.value = nextProps.searchString
    }
  }

  componentWillUnmount () {
    if (this.props.isPrivate) {
      windowActions.setFindDetail(this.props.activeFrameKey, Immutable.fromJS({
        searchString: '',
        caseSensitivity: this.props.isCaseSensitive
      }))
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.isSelected && !prevProps.isSelected) {
      this.focus()
      // Findbar might already be focused, so make sure select happens even if no
      // onFocus event happens.
      this.select()
      windowActions.setFindbarSelected(this.props.activeFrameKey, false)
    }

    if (this.props.searchString !== prevProps.searchString || this.props.isCaseSensitive !== prevProps.isCaseSensitive) {
      // Redo search if details have changed
      this.onFindFirst()
    }
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case keyCodes.ESC:
        e.preventDefault()
        this.onFindHide()
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
    windowActions.setFindbarSelected(this.props.activeFrameKey, false)
  }

  onClear () {
    this.searchInput.value = ''
    windowActions.setFindDetail(this.props.activeFrameKey, Immutable.fromJS({
      searchString: '',
      caseSensitivity: this.props.isCaseSensitive
    }))
    this.focus()
  }

  onFindHide () {
    frameStateUtil.onFindBarHide(this.props.activeFrameKey)
  }

  onFind (searchString, caseSensitivity, forward, findNext) {
    webviewActions.findInPage(searchString, caseSensitivity, forward, findNext)
    if (!findNext) {
      windowActions.setFindDetail(this.props.activeFrameKey, Immutable.fromJS({
        internalFindStatePresent: true
      }))
    }
  }

  get findTextMatch () {
    if (this.props.numberOfMatches > 0 && this.props.activeMatchOrdinal > 0 && this.props.searchString) {
      const l10nArgs = {
        activeMatchOrdinal: this.props.activeMatchOrdinal,
        numberOfMatches: this.props.numberOfMatches
      }

      return <div className='foundResults'
        data-l10n-args={JSON.stringify(l10nArgs)}
        data-l10n-id='findResults' />
    } else if (this.props.numberOfMatches === 0 && this.props.searchString) {
      const l10nArgs = {
        activeMatchOrdinal: this.props.activeMatchOrdinal,
        numberOfMatches: this.props.numberOfMatches
      }

      return <div className='foundResults'
        data-l10n-args={JSON.stringify(l10nArgs)}
        data-l10n-id='findResultMatches' />
    }

    return null
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeFrameKey = activeFrame.get('key')

    const props = {}
    // used in renderer
    props.backgroundColor = getSetting(settings.PAINT_TABS) &&
      (activeFrame.get('themeColor') || activeFrame.get('computedThemeColor'))
    props.textColor = props.backgroundColor && getTextColorForBackground(props.backgroundColor)
    props.numberOfMatches = activeFrame.getIn(['findDetail', 'numberOfMatches'], -1)
    props.activeMatchOrdinal = activeFrame.getIn(['findDetail', 'activeMatchOrdinal'], -1)
    props.searchString = activeFrame.getIn(['findDetail', 'searchString'], '')
    props.isCaseSensitive = activeFrame.getIn(['findDetail', 'caseSensitivity'], false)

    // used in other functions
    props.activeFrameKey = activeFrameKey
    props.isSelected = activeFrame.get('findbarSelected', false)
    props.internalFindStatePresent = activeFrame.getIn(['findDetail', 'internalFindStatePresent'])
    props.isPrivate = activeFrame.get('isPrivate', false)

    return props
  }

  render () {
    let findBarStyle = {}
    let findBarTextStyle = {}

    if (this.props.backgroundColor) {
      findBarStyle = {
        background: this.props.backgroundColor,
        color: this.props.textColor
      }
      findBarTextStyle = {
        color: this.props.textColor
      }
    }

    return <div className='findBar' style={findBarStyle} onBlur={this.onBlur}>
      <div className='searchContainer'>
        <div className='searchStringContainer'>
          <span className='searchStringContainerIcon fa fa-search' />
          <input
            ref={(node) => { this.searchInput = node }}
            type='text'
            spellCheck='false'
            onContextMenu={this.onContextMenu}
            onFocus={this.onInputFocus}
            onKeyDown={this.onKeyDown}
            onInput={this.onInput}
          />
          <span
            className='searchStringContainerIcon fa fa-times findClear'
            onClick={this.onClear}
          />
        </div>
        <span className='findMatchText'>{this.findTextMatch}</span>
        <BrowserButton
          iconOnly
          iconClass={globalStyles.appIcons.findPrev}
          inlineStyles={findBarStyle}
          testId='findBarPrevButton'
          disabled={this.props.numberOfMatches <= 0}
          onClick={this.onFindPrev}
        />
        <BrowserButton
          iconOnly
          iconClass={globalStyles.appIcons.findNext}
          inlineStyles={findBarStyle}
          testId='findBarNextButton'
          disabled={this.props.numberOfMatches <= 0}
          onClick={this.onFindNext}
        />
        <SwitchControl
          id='caseSensitivityCheckbox'
          checkedOn={this.props.isCaseSensitive}
          onClick={this.onCaseSensitivityChange}
        />
        <label
          htmlFor='caseSensitivityCheckbox'
          data-l10n-id='caseSensitivity'
          style={findBarTextStyle}
        />
      </div>
      <span
        className='closeButton'
        style={findBarTextStyle}
        onClick={this.onFindHide}
      >+</span>
    </div>
  }
}

module.exports = ReduxComponent.connect(FindBar)
