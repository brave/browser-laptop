/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

const ReduxComponent = require('../reduxComponent')
const {StyleSheet, css} = require('aphrodite')
const Immutable = require('immutable')

const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')
const urlParse = require('../../../common/urlParse')
const KeyCodes = require('../../../common/constants/keyCodes')
const cx = require('../../../../js/lib/classSet')
const debounce = require('../../../../js/lib/debounce')
const ipc = require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions')
const UrlBarIcon = require('./urlBarIcon')
const messages = require('../../../../js/constants/messages')
const siteSettings = require('../../../../js/state/siteSettings')
const {getSetting} = require('../../../../js/settings')
const settings = require('../../../../js/constants/settings')
const contextMenus = require('../../../../js/contextMenus')
const UrlUtil = require('../../../../js/lib/urlutil')
const {eventElHasAncestorWithClasses, isForSecondaryAction} = require('../../../../js/lib/eventUtil')
const {getBaseUrl, isUrl, isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')
const {getCurrentWindowId} = require('../../currentWindow')

// Icons
const iconNoScript = require('../../../../img/url-bar-no-script.svg')

// State
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const tabState = require('../../../common/state/tabState')

class UrlBar extends React.Component {
  constructor (props) {
    super(props)
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onKeyPress = this.onKeyPress.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.keyPressed = false
    this.showAutocompleteResult = debounce(() => {
      if (!this.urlInput || this.keyPressed || this.props.locationValue.length === 0) {
        return
      }
      const suffixLen = this.props.locationValueSuffix.length
      if (suffixLen > 0 && this.urlInput.value !== this.props.locationValue + this.props.locationValueSuffix) {
        this.setValue(this.props.locationValue, this.props.locationValueSuffix)
        const len = this.props.locationValue.length
        this.urlInput.setSelectionRange(len, len + suffixLen)
      }
    }, 10)
  }

  // restores the url bar to the current location
  restore () {
    const location = UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED))
    if (this.urlInput) {
      this.setValue(location)
    }
    windowActions.setNavBarUserInput(location)
  }

  /**
   * Build a search URL considering:
   * - user's default search engine provider
   * - search engine shortcut keywords
   *
   * Future considerations could include criteria such as:
   * - user's country / locale (amazon.com vs amazon.ca)
   * - http verb
   */
  buildSearchUrl (searchTerms) {
    searchTerms = searchTerms.replace(this.props.searchShortcut, '')
    return this.props.searchURL.replace('{searchTerms}', encodeURIComponent(searchTerms))
  }

  // Temporarily disable the autocomplete when a user is pressing backspace.
  // Otherwise, they'd have to hit backspace twice for each character they wanted
  // to delete.
  hideAutoComplete () {
    if (this.props.autocompleteEnabled) {
      windowActions.urlBarAutocompleteEnabled(false)
    }
    windowActions.setUrlBarSuggestions(undefined, null)
    windowActions.setRenderUrlBarSuggestions(false)
  }

  get activeIndex () {
    if (this.props.suggestionList === null) {
      return -1
    }
    return this.props.selectedIndex
  }

  onKeyDown (e) {
    if (!this.props.isActive) {
      windowActions.setUrlBarActive(true)
    }
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        let location = this.urlInput ? this.urlInput.value : this.props.urlbarLocation

        if (location === null || location.length === 0) {
          windowActions.setUrlBarSelected(true)
        } else {
          // Filter javascript URLs to prevent self-XSS
          location = location.replace(/^(\s*javascript:)+/i, '')
          const isLocationUrl = isUrl(location)
          if (!isLocationUrl && e.ctrlKey) {
            appActions.loadURLRequested(this.props.activeTabId, `www.${location}.com`)
          } else if (this.shouldRenderUrlBarSuggestions &&
              ((typeof this.activeIndex === 'number' && this.activeIndex >= 0) ||
              (this.props.locationValueSuffix && this.props.autocompleteEnabled))) {
            // Hack to make alt enter open a new tab for url bar suggestions when hitting enter on them.
            const isDarwin = process.platform === 'darwin'
            if (e.altKey) {
              if (isDarwin) {
                e.metaKey = true
              } else {
                e.ctrlKey = true
              }
            }
            windowActions.activeSuggestionClicked(isForSecondaryAction(e), e.shiftKey)
          } else {
            location = isLocationUrl
              ? location
              : this.buildSearchUrl(location)
            // do search.
            if (e.altKey) {
              appActions.createTabRequested({
                url: location
              })
            } else if (e.metaKey) {
              appActions.createTabRequested({
                url: location,
                active: !!e.shiftKey
              })
            } else {
              appActions.loadURLRequested(this.props.activeTabId, location)
            }
          }
        }
        windowActions.setUrlBarActive(false)
        windowActions.setRenderUrlBarSuggestions(false)
        break
      case KeyCodes.UP:
        if (this.shouldRenderUrlBarSuggestions) {
          windowActions.previousUrlBarSuggestionSelected()
          e.preventDefault()
        }
        break
      case KeyCodes.DOWN:
        if (this.shouldRenderUrlBarSuggestions) {
          windowActions.nextUrlBarSuggestionSelected()
          e.preventDefault()
        }
        break
      case KeyCodes.ESC:
        e.preventDefault()
        this.props.onStop()
        this.restore()
        this.select()
        break
      case KeyCodes.DELETE:
        if (e.shiftKey) {
          const selectedIndex = this.props.locationValueSuffix.length > 0 ? 1 : this.props.selectedIndex
          if (selectedIndex !== undefined) {
            const suggestionLocation = this.props.suggestion.location
            appActions.removeSite({ location: suggestionLocation })
          }
        } else {
          this.hideAutoComplete()
        }
        break
      case KeyCodes.BACKSPACE:
        this.hideAutoComplete()
        break
      case KeyCodes.TAB:
        this.hideAutoComplete()
        break
      // Do not trigger rendering of suggestions if you are pressing alt or shift
      case KeyCodes.ALT:
      case KeyCodes.SHIFT:
      case KeyCodes.CMD1:
      case KeyCodes.CMD2:
      case KeyCodes.CTRL:
        break
      default:
        this.keyPressed = true
        windowActions.setRenderUrlBarSuggestions(true)
        // Any other keydown is fair game for autocomplete to be enabled.
        if (!this.props.autocompleteEnabled) {
          windowActions.urlBarAutocompleteEnabled(true)
        }
    }
  }

  onClick (e) {
    if (this.props.isSelected) {
      windowActions.setUrlBarActive(true)
    }
  }

  onBlur (e) {
    windowActions.urlBarOnBlur(getCurrentWindowId(), e.target.value, this.props.locationValue, eventElHasAncestorWithClasses(e, ['urlBarSuggestions', 'urlbarForm']))
  }

  get suggestionLocation () {
    const selectedIndex = this.props.selectedIndex
    if (typeof selectedIndex === 'number') {
      const suggestion = this.props.suggestion
      if (suggestion) {
        return suggestion.location
      }
    }
  }

  onKeyPress (e) {
    // If we're just continuing an autocomplete then prevent a change event
    const last = this.lastVal + this.lastSuffix
    const newValue = this.lastVal + String.fromCharCode(e.which)
    if (last.startsWith(newValue)) {
      const newSuffix = last.substring(newValue.length)
      this.setValue(newValue, newSuffix)
      windowActions.setNavBarUserInput(newValue)
      this.urlInput.setSelectionRange(newValue.length, newValue.length + newSuffix.length + 1)
      if (this.suggestionLocation) {
        windowActions.setUrlBarSuggestions(undefined, null)
      }
      e.preventDefault()
    }
  }

  onChange (e) {
    this.setValue(e.target.value)
    if (this.suggestionLocation) {
      windowActions.setUrlBarSuggestions(undefined, null)
    }
  }

  // Keeps track of which part was set for the url suffix and which
  // part was set for the value.
  setValue (val, suffix) {
    val = val || ''
    suffix = suffix || ''
    this.lastVal = val
    this.lastSuffix = suffix
    const newValue = val + suffix
    if (this.urlInput.value !== newValue) {
      this.urlInput.value = newValue
    }
  }

  onKeyUp (e) {
    switch (e.keyCode) {
      case KeyCodes.UP:
      case KeyCodes.DOWN:
      case KeyCodes.ESC:
        return
    }
    if (this.props.isSelected) {
      windowActions.setUrlBarSelected(false)
    }
    // We never want to set the full navbar user input to include the suffix
    if (this.props.locationValue + this.props.locationValueSuffix !== e.target.value) {
      windowActions.setNavBarUserInput(this.lastVal)
    }
    this.keyPressed = false
  }

  select () {
    if (this.urlInput) {
      this.urlInput.select()
    }
  }

  focus () {
    if (this.urlInput) {
      this.urlInput.focus()
    }
  }

  onFocus (e) {
    this.select()
    windowActions.urlBarOnFocus(getCurrentWindowId())
  }

  componentWillMount () {
    this.lastVal = ''
    this.lastSuffix = ''
    ipc.on(messages.SHORTCUT_FOCUS_URL, (e) => {
      this.focus()
      this.select()
      windowActions.setRenderUrlBarSuggestions(false)
      windowActions.setUrlBarActive(true)
      windowActions.urlBarOnFocus(getCurrentWindowId())
    })
  }

  componentDidMount () {
    if (this.urlInput) {
      this.setValue(UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED)))
      this.focus()
    }
  }

  componentDidUpdate (prevProps) {
    // this.urlInput is not initialized in titleMode
    if (this.urlInput) {
      if (this.props.activeFrameKey !== prevProps.activeFrameKey) {
        // The user just changed tabs
        this.setValue(this.props.locationValue)
        // Each tab has a focused state stored separately
        if (this.props.isFocused) {
          this.focus()
        }
        windowActions.setUrlBarSuggestions(undefined, null)
        windowActions.setRenderUrlBarSuggestions(false)
      } else if (this.props.location !== prevProps.location) {
        // This is a url nav change
        this.setValue(UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED)))
      } else if (this.props.hasLocationValueSuffix && this.props.isActive &&
        (this.props.hasLocationValueSuffix !== prevProps.hasLocationValueSuffix ||
         this.props.urlbarLocation !== prevProps.urlbarLocation)) {
        this.showAutocompleteResult()
      } else if ((this.props.titleMode !== prevProps.titleMode) ||
          (!this.props.isActive && !this.props.isFocused)) {
        this.setValue(this.props.locationValue)
      } else if (this.props.urlbarLocation !== prevProps.urlbarLocation &&
          this.urlInput.value !== this.props.urlbarLocation) {
        this.setValue(this.props.locationValue)
      }
    }

    if (this.props.isSelected && !prevProps.isSelected) {
      this.select()
      windowActions.setUrlBarSelected(false)
    }

    if (this.props.noScriptIsVisible && !this.showNoScriptInfo) {
      // There are no blocked scripts, so hide the noscript dialog.
      windowActions.setNoScriptVisible(false)
    }
  }

  get hostValue () {
    const parsed = urlParse(this.props.location)
    return parsed.host &&
      parsed.protocol !== 'about:' &&
      parsed.protocol !== 'chrome-extension:' ? parsed.host : ''
  }

  get titleValue () {
    // For about:newtab we don't want the top of the browser saying New Tab
    // Instead just show "Brave"
    return ['about:blank', 'about:newtab'].includes(this.props.urlbarLocation)
      ? '' : this.props.title
  }

  get loadTime () {
    if (this.props.startLoadTime && this.props.endLoadTime) {
      const loadMilliseconds = this.props.endLoadTime - this.props.startLoadTime
      return (loadMilliseconds / 1000).toFixed(2) + 's'
    }
    return ''
  }

  get aboutPage () {
    const protocol = urlParse(this.props.location).protocol
    return ['about:', 'file:', 'chrome:', 'view-source:'].includes(protocol)
  }

  get shouldRenderUrlBarSuggestions () {
    return this.props.shouldRender === true &&
      this.props.suggestionList && this.props.suggestionList.size > 0
  }

  get showNoScriptInfo () {
    return this.props.enableNoScript && this.props.scriptsBlocked && this.props.scriptsBlocked.size
  }

  onNoScript () {
    windowActions.setNoScriptVisible()
  }

  onContextMenu (e) {
    contextMenus.onUrlBarContextMenu(e)
  }

  mergeProps (state, dispatchProps, ownProps) {
    const windowState = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(windowState) || Immutable.Map()
    const activeTabId = tabState.getActiveTabId(state, getCurrentWindowId())

    const location = activeFrame.get('location') || ''
    const baseUrl = getBaseUrl(location)
    const urlbar = activeFrame.getIn(['navbar', 'urlbar']) || Immutable.Map()
    const history = (activeFrame.get('history') || new Immutable.List())
    const canGoForward = activeTabId === tabState.TAB_ID_NONE ? false : tabState.canGoForward(state, activeTabId)
    const urlbarLocation = urlbar.get('location')
    const locationValue = (isIntermediateAboutPage(urlbarLocation) && history.size > 0 && !canGoForward)
        ? history.last() : UrlUtil.getDisplayLocation(urlbarLocation, getSetting(settings.PDFJS_ENABLED))
    const selectedIndex = activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])

    // TODO(bridiver) - these definitely needs a helpers
    const publisherId = state.getIn(['locationInfo', baseUrl, 'publisher'])
    const hostPattern = UrlUtil.getHostPattern(publisherId)
    const hostSettings = siteSettings.getSiteSettingsForHostPattern(state.get('settings'), hostPattern)
    const ledgerPaymentsShown = hostSettings && hostSettings.get('ledgerPaymentsShown')
    const visiblePublisher = typeof ledgerPaymentsShown === 'boolean' ? ledgerPaymentsShown : true
    const isPublisherButtonEnabled = getSetting(settings.PAYMENTS_ENABLED) &&
        UrlUtil.isHttpOrHttps(location) && visiblePublisher

    const activateSearchEngine = urlbar.getIn(['searchDetail', 'activateSearchEngine'])
    const urlbarSearchDetail = urlbar.get('searchDetail')
    let searchURL = windowState.getIn(['searchDetail', 'searchURL'])
    let searchShortcut = ''
    // remove shortcut from the search terms
    if (activateSearchEngine && urlbarSearchDetail !== null) {
      const provider = urlbarSearchDetail
      searchShortcut = new RegExp('^' + provider.get('shortcut') + ' ', 'g')
      searchURL = provider.get('search')
    }

    // Whether this page is HTTP or HTTPS. We don't show security indicators
    // for other protocols like mailto: and about:.
    const protocol = urlParse(
      UrlUtil.getLocationIfPDF(location)).protocol
    const isHTTPPage = protocol === 'http:' || protocol === 'https:'

    const props = {}

    props.activeTabId = activeTabId
    props.activeFrameKey = activeFrame.get('key')
    props.location = location
    props.title = activeFrame.get('title') || ''
    props.scriptsBlocked = activeFrame.getIn(['noScript', 'blocked'])
    props.isSecure = activeFrame.getIn(['security', 'isSecure'])
    props.hasLocationValueSuffix = activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix'])
    props.startLoadTime = activeFrame.get('startLoadTime')
    props.endLoadTime = activeFrame.get('endLoadTime')
    props.loading = activeFrame.get('loading')
    props.enableNoScript = ownProps.enableNoScript
    props.noScriptIsVisible = windowState.getIn(['ui', 'noScriptInfo', 'isVisible']) || false
    props.menubarVisible = ownProps.menubarVisible
    props.activeTabShowingMessageBox = tabState.isShowingMessageBox(state, activeTabId)
    props.noBorderRadius = isPublisherButtonEnabled
    props.onStop = ownProps.onStop
    props.titleMode = ownProps.titleMode
    props.locationValue = locationValue
    props.locationValueSuffix = activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix'])
    props.selectedIndex = selectedIndex
    props.suggestionList = urlbar.getIn(['suggestions', 'suggestionList'])
    props.suggestion = activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'suggestionList', selectedIndex - 1])
    props.shouldRender = urlbar.getIn(['suggestions', 'shouldRender'])
    props.urlbarLocation = urlbarLocation
    props.isActive = urlbar.get('active')
    props.isSelected = urlbar.get('selected')
    props.isFocused = urlbar.get('focused')
    props.isHTTPPage = isHTTPPage
    props.activateSearchEngine = activateSearchEngine
    props.searchSelectEntry = urlbarSearchDetail
    props.autocompleteEnabled = urlbar.getIn(['suggestions', 'autocompleteEnabled'])
    props.searchURL = searchURL
    props.searchShortcut = searchShortcut

    return props
  }

  render () {
    return <form
      className={cx({
        urlbarForm: true,
        noBorderRadius: this.props.noBorderRadius
      })}
      action='#'
      id='urlbar'
      ref='urlbar'>
      <div className='urlbarIconContainer'>
        <UrlBarIcon
          activateSearchEngine={this.props.activateSearchEngine}
          active={this.props.isActive}
          isSecure={this.props.isSecure}
          isHTTPPage={this.props.isHTTPPage}
          loading={this.props.loading}
          location={this.props.location}
          searchSelectEntry={this.props.searchSelectEntry}
          title={this.props.title}
          titleMode={this.props.titleMode}
          isSearching={this.props.location !== this.props.urlbarLocation}
          activeTabShowingMessageBox={this.props.activeTabShowingMessageBox}
        />
      </div>
      {
        this.props.titleMode
        ? <div id='titleBar'>
          <span><strong>{this.hostValue}</strong></span>
          <span>{this.hostValue && this.titleValue ? ' | ' : ''}</span>
          <span>{this.titleValue}</span>
        </div>
        : <input type='text'
          spellCheck='false'
          disabled={this.props.location === undefined && this.loadTime === ''}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onKeyDown={this.onKeyDown}
          onKeyUp={this.onKeyUp}
          onChange={this.onChange}
          onKeyPress={this.onKeyPress}
          onClick={this.onClick}
          onContextMenu={this.onContextMenu}
          data-l10n-id='urlbar'
          className={cx({
            private: this.private,
            testHookLoadDone: !this.props.loading
          })}
          id='urlInput'
          readOnly={this.props.titleMode}
          ref={(node) => { this.urlInput = node }} />
      }
      <legend />
      {
        this.props.titleMode || this.aboutPage
        ? null
        : <span className={cx({
          'loadTime': true,
          'onFocus': this.props.isActive
        })}>{this.loadTime}</span>
      }
      {
        !this.showNoScriptInfo
        ? null
        : <span className={css(styles.noScriptContainer)}
          onClick={this.onNoScript}>
          <span
            data-l10n-id='noScriptButton'
            data-test-id='noScriptButton'
            className={css(styles.noScriptButton)} />
        </span>
      }
      {
          this.shouldRenderUrlBarSuggestions
          ? <UrlBarSuggestions
            selectedIndex={this.props.selectedIndex}
            suggestionList={this.props.suggestionList}
            hasLocationValueSuffix={this.props.hasLocationValueSuffix}
            menubarVisible={this.props.menubarVisible} />
          : null
        }
    </form>
  }
}

const styles = StyleSheet.create({
  noScriptContainer: {
    display: 'flex',
    padding: '5px',
    marginRight: '-8px',
    WebkitAppRegion: 'drag'
  },
  noScriptButton: {
    WebkitAppRegion: 'no-drag',
    backgroundImage: `url(${iconNoScript})`,
    width: '14px',
    height: '14px',
    border: '0px'
  }
})

module.exports = ReduxComponent.connect(UrlBar)
