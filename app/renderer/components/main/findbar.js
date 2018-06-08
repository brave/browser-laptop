/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const BrowserButton = require('../common/browserButton')
const SwitchControl = require('../common/switchControl')

// Constants
const keyCodes = require('../../../common/constants/keyCodes')
const settings = require('../../../../js/constants/settings')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const tabActions = require('../../../common/actions/tabActions')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const {getTextColorForBackground} = require('../../../../js/lib/color')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {getSetting} = require('../../../../js/settings')
const debounce = require('../../../../js/lib/debounce')
const cx = require('../../../../js/lib/classSet')

// Styles
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')
const {theme} = require('../styles/theme')
const {commonFormStyles} = require('../common/commonForm')

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
    this.onSetFindDetail = debounce(windowActions.setFindDetail, 100)
  }

  onInput (e) {
    this.onSetFindDetail(this.props.activeFrameKey, Immutable.fromJS({
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
    frameStateUtil.onFindBarHide(this.props.activeFrameKey, this.props.activeTabId)
  }

  onFind (searchString, caseSensitivity, forward, findNext) {
    tabActions.findInPageRequest(this.props.activeTabId, this.props.searchString, caseSensitivity, forward, findNext)
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

      return <div
        data-l10n-args={JSON.stringify(l10nArgs)}
        data-l10n-id='findResults'
        data-test-id='foundResults'
      />
    } else if (this.props.numberOfMatches === 0 && this.props.searchString) {
      const l10nArgs = {
        activeMatchOrdinal: this.props.activeMatchOrdinal,
        numberOfMatches: this.props.numberOfMatches
      }

      return <div
        data-l10n-args={JSON.stringify(l10nArgs)}
        data-l10n-id='findResultMatches'
        data-test-id='foundResults'
      />
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
    props.activeTabId = activeFrame.get('tabId')
    props.isSelected = activeFrame.get('findbarSelected', false)
    props.internalFindStatePresent = activeFrame.getIn(['findDetail', 'internalFindStatePresent'])
    props.isPrivate = activeFrame.get('isPrivate', false)

    return props
  }

  render () {
    let findBarStyle = {}
    let findBarTextStyles = {}

    if (this.props.backgroundColor) {
      findBarTextStyles = StyleSheet.create({
        matchingTextColor: {
          color: this.props.textColor
        }
      })
      findBarStyle = {
        background: this.props.backgroundColor,
        color: this.props.textColor
      }
    }

    // See autofillAddressPanel.js
    // Ref: https://github.com/brave/browser-laptop/pull/7164#discussion_r100586892
    const commonForm = css(
      commonStyles.formControl,
      commonStyles.textbox,
      commonStyles.textbox__outlineable,
      commonStyles.isCommonForm,
      commonFormStyles.input__box,
      styles.findBar__string__input
    )

    return <div className={css(styles.findBar)}
      data-test-id='findBar'
      style={findBarStyle}
      onBlur={this.onBlur}
    >
      <div className={css(styles.findBar__string)}>
        <span className={cx({
          [globalStyles.appIcons.search]: true,
          [css(styles.findBar__string__icon, styles.findBar__string__icon_search)]: true
        })} />
        <input
          className={commonForm}
          ref={(node) => { this.searchInput = node }}
          type='text'
          spellCheck='false'
          onContextMenu={this.onContextMenu}
          onFocus={this.onInputFocus}
          onKeyDown={this.onKeyDown}
          onInput={this.onInput}
          data-test-id='findBarInput'
        />
        <BrowserButton
          iconClass={globalStyles.appIcons.remove}
          custom={[
            styles.findBar__string__icon,
            styles.findBar__string__icon_clear
          ]}
          onClick={this.onClear}
          testId='findBarClearButton'
        />
      </div>
      <span className={css(
        styles.findBar__find,
        findBarTextStyles.matchingTextColor
      )}>
        {this.findTextMatch}
      </span>
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
        checkedOn={this.props.isCaseSensitive}
        onClick={this.onCaseSensitivityChange}
        customRightTextClassName={css(findBarTextStyles.matchingTextColor)}
        rightl10nId='caseSensitivity'
        testId='caseSensitivityCheckbox'
      />
      <BrowserButton
        iconOnly
        iconClass={globalStyles.appIcons.remove}
        size='.8rem'
        custom={[
          findBarTextStyles.matchingTextColor,
          styles.findBar__close
        ]}
        onClick={this.onFindHide}
        testId='findBarClearButton'
      />
    </div>
  }
}

const styles = StyleSheet.create({
  findBar: {
    background: theme.findBar.backgroundColor,
    borderBottom: `1px solid ${theme.findBar.border.bottom.color}`,
    color: theme.findBar.color,
    fontSize: '.7rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '.4rem .8rem',
    animation: 'slideIn 25ms',
    cursor: 'default',
    WebkitAppRegion: 'no-drag'
  },

  findBar__string: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative'
  },

  findBar__string__icon: {
    position: 'relative',
    margin: 0,
    padding: 0,
    width: 0,
    color: theme.findBar.string.icon.color
  },

  findBar__string__icon_search: {
    left: '8px'
  },

  findBar__string__icon_clear: {
    left: '-20px'
  },

  findBar__string__input: {
    height: '25px',
    width: '200px',
    padding: '0 25px'
  },

  findBar__find: {
    minWidth: '60px',
    margin: '0 10px',
    color: theme.findBar.find.color,
    textAlign: 'center'
  },

  findBar__close: {
    position: 'absolute',
    right: '.8rem',

    ':hover': {
      color: theme.findBar.close.onHover.color
    }
  }
})

module.exports = ReduxComponent.connect(FindBar)
