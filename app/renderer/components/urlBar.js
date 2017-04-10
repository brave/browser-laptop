/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('../../common/urlParse')

const ImmutableComponent = require('../../../js/components/immutableComponent')
const ReduxComponent = require('./reduxComponent')
const windowActions = require('../../../js/actions/windowActions')
const appActions = require('../../../js/actions/appActions')
const KeyCodes = require('../../common/constants/keyCodes')
const cx = require('../../../js/lib/classSet')
const debounce = require('../../../js/lib/debounce')
const ipc = require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions')
const UrlBarIcon = require('./urlBarIcon')
const messages = require('../../../js/constants/messages')
const {getSetting} = require('../../../js/settings')
const settings = require('../../../js/constants/settings')
const contextMenus = require('../../../js/contextMenus')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const UrlUtil = require('../../../js/lib/urlutil')
const {isForSecondaryAction} = require('../../../js/lib/eventUtil')
const {isUrl, isIntermediateAboutPage} = require('../../../js/lib/appUrlUtil')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')

// state helpers
const frameState = require('../../common/state/frameState')
const navigationBarState = require('../../common/state/navigationBarState')
const tabState = require('../../common/state/tabState')

class UrlBar extends ImmutableComponent {
  constructor () {
    super()
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
      if (!this.urlInput || this.keyPressed || this.locationValue.length === 0) {
        return
      }
      const suffixLen = this.props.locationValueSuffix.length
      if (suffixLen > 0 && this.urlInput.value !== this.locationValue + this.props.locationValueSuffix) {
        this.setValue(this.locationValue, this.props.locationValueSuffix)
        const len = this.locationValue.length
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

  // Temporarily disable the autocomplete when a user is pressing backspace.
  // Otherwise, they'd have to hit backspace twice for each character they wanted
  // to delete.
  hideAutoComplete () {
    if (this.autocompleteEnabled) {
      windowActions.urlBarAutocompleteEnabled(false)
    }
    windowActions.setUrlBarSuggestions(undefined, null)
    windowActions.setRenderUrlBarSuggestions(false)
  }

  /**
   * Assign client ID based on user's os/platform.
   * `platformClientId` must be populated for this entry in `searchProviders.js`.
   */
  getPlatformClientId (provider) {
    try {
      if (provider.get('platformClientId')) {
        const platformUtil = require('../../common/lib/platformUtil')
        if (platformUtil.isWindows()) {
          return provider.getIn(['platformClientId', 'win32']) || ''
        } else if (platformUtil.isDarwin()) {
          return provider.getIn(['platformClientId', 'darwin']) || ''
        }
        return provider.getIn(['platformClientId', 'linux']) || ''
      }
    } catch (e) { }
    return ''
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
    let provider = this.props.searchDetail.toJS()
    let url = provider.searchURL

    // remove shortcut from the search terms
    if (this.props.activateSearchEngine && this.props.searchSelectEntry !== null) {
      provider = this.props.searchSelectEntry
      const shortcut = new RegExp('^' + provider.get('shortcut') + ' ', 'g')
      searchTerms = searchTerms.replace(shortcut, '')
      url = provider.get('search')
    }

    // required: populate the search terms (URL encoded)
    url = url.replace('{searchTerms}',
      encodeURIComponent(searchTerms))

    // optional: populate the client id
    // some search engines have a different clientId depending on the platform
    if (url.indexOf('{platformClientId}') > -1) {
      url = url.replace('{platformClientId}',
        this.getPlatformClientId(provider))
    }
    return url
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
            windowActions.loadUrl(this.props.activeFrame, `www.${location}.com`)
          } else if (this.props.shouldRenderUrlBarSuggestions &&
              ((typeof this.props.activeIndex === 'number' && this.props.activeIndex >= 0) ||
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
              windowActions.newFrame({ location }, true)
            } else if (e.metaKey) {
              windowActions.newFrame({ location }, !!e.shiftKey)
            } else {
              windowActions.loadUrl(this.props.activeFrame, location)
            }
          }
        }
        windowActions.setUrlBarActive(false)
        windowActions.setRenderUrlBarSuggestions(false)
        break
      case KeyCodes.UP:
        if (this.props.shouldRenderUrlBarSuggestions) {
          windowActions.previousUrlBarSuggestionSelected()
          e.preventDefault()
        }
        break
      case KeyCodes.DOWN:
        if (this.props.shouldRenderUrlBarSuggestions) {
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
            appActions.removeSite({ location: this.props.suggestionLocation })
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
    windowActions.setNavBarUserInput(e.target.value)
  }

  updateLocationToSuggestion () {
    if (this.props.locationValueSuffix.length > 0) {
      windowActions.setNavBarUserInput(this.locationValue + this.props.locationValueSuffix)
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
      if (this.props.suggestionLocation) {
        windowActions.setUrlBarSuggestions(undefined, null)
      }
      e.preventDefault()
    }
  }

  onChange (e) {
    this.setValue(e.target.value)
    if (this.props.suggestionLocation) {
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
    if (this.locationValue + this.props.locationValueSuffix !== e.target.value) {
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
    windowActions.setUrlBarFocused(true)
    windowActions.setUrlBarSelected(true)
  }

  componentWillMount () {
    this.lastVal = ''
    this.lastSuffix = ''
    ipc.on(messages.SHORTCUT_FOCUS_URL, (e) => {
      this.focus()
      this.select()
      windowActions.setRenderUrlBarSuggestions(false)
      windowActions.setUrlBarFocused(true)
      windowActions.setUrlBarSelected(true)
      windowActions.setUrlBarActive(true)
    })
  }

  componentDidMount () {
    if (this.urlInput) {
      this.setValue(UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED)))
      this.focus()
    }
  }

  mergeProps (state, dispatchProps, ownProps) {
    // TODO(bridiver) - add state helpers
    const currentWindow = state.get('currentWindow')
    const searchDetail = currentWindow.get('searchDetail')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow)
    const activeFrameKey = activeFrame.get('key')
    const bookmarkDetail = currentWindow.get('bookmarkDetail')

    const tabId = frameState.getTabIdByFrameKey(state, activeFrameKey)
    const location = tabState.getLocation(state, tabId)
    const urlbar = navigationBarState.getUrlBar(state, tabId)
    const selectedIndex = navigationBarState.getSelectedIndex(state, tabId)
    const suggestionList = navigationBarState.getSuggestionList(state, tabId)

    const shouldRenderUrlBarSuggestions = urlbar.getIn(['suggestions', 'shouldRender']) === true &&
        suggestionList && suggestionList.size > 0

    const props = {
      activeFrame,
      activeFrameKey,
      activeIndex: suggestionList == null ? -1 : selectedIndex,
      activeTabShowingMessageBox: tabState.isShowingMessageBox(state, tabId),
      autocompleteEnabled: navigationBarState.showAutoComplete(state, tabId),
      canGoForward: tabState.canGoForward(state, tabId),
      endLoadTime: tabState.endLoadTime(state, tabId),
      hasLocationValueSuffix: navigationBarState.hasLocationValueSuffix(state, tabId),
      history: tabState.getHistory(state, tabId),
      isSecure: tabState.isSecure(state, tabId),
      loading: tabState.isLoading(state, tabId),
      location,
      locationValueSuffix: navigationBarState.locationValueSuffix(state, tabId),
      noBorderRadius: !isSourceAboutUrl(location),
      selectedIndex,
      shouldRenderUrlBarSuggestions,
      startLoadTime: tabState.startLoadTime(state, tabId),
      suggestionList,
      suggestionLocation: navigationBarState.getSuggestionLocation(state, tabId),
      title: tabState.getTitle(state, tabId),
      titleMode: navigationBarState.isTitleMode(state, tabId, bookmarkDetail),
      urlbar,
      urlbarLocation: navigationBarState.getLocation(state, tabId),
      searchDetail,

      // TODO(bridiver) - add state helpers
      activateSearchEngine: urlbar.getIn(['searchDetail', 'activateSearchEngine']),
      isActive: urlbar.get('active'),
      isFocused: urlbar.get('focused'),
      isSelected: urlbar.get('selected'),
      searchSelectEntry: urlbar.get('searchDetail')
    }

    return Object.assign({}, ownProps, props)
  }

  componentDidUpdate (prevProps) {
    // this.urlInput is not initialized in titleMode
    if (this.urlInput) {
      if (this.props.activeFrameKey !== prevProps.activeFrameKey) {
        // The user just changed tabs
        this.setValue(UrlUtil.getDisplayLocation(this.props.urlbarLocation, getSetting(settings.PDFJS_ENABLED)))
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
        (this.props.locationValueSuffix !== prevProps.locationValueSuffix ||
         this.props.urlbarLocation !== prevProps.urlbarLocation)) {
        this.showAutocompleteResult()
      } else if ((this.props.titleMode !== prevProps.titleMode) ||
          (!this.props.isActive && !this.props.isFocused)) {
        this.setValue(this.locationValue)
      } else if (this.props.urlbarLocation !== prevProps.urlbarLocation &&
          this.urlInput.value !== this.props.urlbarLocation) {
        this.setValue(this.locationValue)
      }
    }
    if (this.props.isSelected && !prevProps.isSelected) {
      this.select()
      windowActions.setUrlBarSelected(false)
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

  get locationValue () {
    const location = this.props.urlbarLocation
    const history = this.props.history
    if (isIntermediateAboutPage(location) && history.size > 0 && !this.props.canGoForward) {
      return history.last()
    }

    return UrlUtil.getDisplayLocation(location, getSetting(settings.PDFJS_ENABLED))
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

  get isHTTPPage () {
    // Whether this page is HTTP or HTTPS. We don't show security indicators
    // for other protocols like mailto: and about:.
    const protocol = urlParse(
      UrlUtil.getLocationIfPDF(this.props.location)).protocol
    return protocol === 'http:' || protocol === 'https:'
  }

  onContextMenu (e) {
    contextMenus.onUrlBarContextMenu(this.props.searchDetail, this.props.activeFrame, e)
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
          active={this.props.urlbar.get('active')}
          isSecure={this.props.isSecure}
          isHTTPPage={this.isHTTPPage}
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
          'onFocus': this.props.urlbar.get('active')
        })}>{this.loadTime}</span>
      }

      {
          this.props.shouldRenderUrlBarSuggestions
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

module.exports = ReduxComponent.connect(UrlBar)
