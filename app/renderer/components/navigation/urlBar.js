/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('../../../common/urlParse')

const ImmutableComponent = require('../../../../js/components/immutableComponent')
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')
const KeyCodes = require('../../../common/constants/keyCodes')
const cx = require('../../../../js/lib/classSet')
const debounce = require('../../../../js/lib/debounce')
const ipc = require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions')
const UrlBarIcon = require('./urlBarIcon')
const messages = require('../../../../js/constants/messages')
const {getSetting} = require('../../../../js/settings')
const settings = require('../../../../js/constants/settings')
const contextMenus = require('../../../../js/contextMenus')
const windowStore = require('../../../../js/stores/windowStore')
const UrlUtil = require('../../../../js/lib/urlutil')
const {eventElHasAncestorWithClasses, isForSecondaryAction} = require('../../../../js/lib/eventUtil')
const {isUrl, isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')

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
      const suffixLen = this.locationValueSuffix.length
      if (suffixLen > 0 && this.urlInput.value !== this.locationValue + this.locationValueSuffix) {
        this.setValue(this.locationValue, this.locationValueSuffix)
        const len = this.locationValue.length
        this.urlInput.setSelectionRange(len, len + suffixLen)
      }
    }, 10)
  }

  get locationValueSuffix () {
    return this.activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix'])
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  get isActive () {
    return this.props.urlbar.get('active')
  }

  isSelected () {
    return this.props.urlbar.get('selected')
  }

  isFocused () {
    return this.props.urlbar.get('focused')
  }

  get activateSearchEngine () {
    return this.props.urlbar.getIn(['searchDetail', 'activateSearchEngine'])
  }

  get searchSelectEntry () {
    return this.props.urlbar.get('searchDetail')
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
        const platformUtil = require('../../../common/lib/platformUtil')
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
    if (this.activateSearchEngine && this.searchSelectEntry !== null) {
      provider = this.searchSelectEntry
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

  get suggestionList () {
    return this.props.urlbar.getIn(['suggestions', 'suggestionList'])
  }

  get selectedIndex () {
    return this.props.urlbar.getIn(['suggestions', 'selectedIndex'])
  }

  get activeIndex () {
    if (this.suggestionList === null) {
      return -1
    }
    return this.selectedIndex
  }

  onKeyDown (e) {
    if (!this.isActive) {
      windowActions.setUrlBarActive(true)
    }
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        let location = this.urlInput ? this.urlInput.value : this.props.urlbar.get('location')

        if (location === null || location.length === 0) {
          windowActions.setUrlBarSelected(true)
        } else {
          // Filter javascript URLs to prevent self-XSS
          location = location.replace(/^(\s*javascript:)+/i, '')
          const isLocationUrl = isUrl(location)
          if (!isLocationUrl && e.ctrlKey) {
            appActions.loadURLRequested(this.activeFrame.get('tabId'), `www.${location}.com`)
          } else if (this.shouldRenderUrlBarSuggestions &&
              ((typeof this.activeIndex === 'number' && this.activeIndex >= 0) ||
              (this.locationValueSuffix && this.autocompleteEnabled))) {
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
              appActions.loadURLRequested(this.activeFrame.get('tabId'), location)
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
          const selectedIndex = this.locationValueSuffix.length > 0 ? 1 : this.activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])
          if (selectedIndex !== undefined) {
            const suggestionLocation = this.activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'suggestionList', selectedIndex - 1]).location
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
        if (!this.autocompleteEnabled) {
          windowActions.urlBarAutocompleteEnabled(true)
        }
    }
  }

  onClick (e) {
    if (this.isSelected()) {
      windowActions.setUrlBarActive(true)
    }
  }

  onBlur (e) {
    // We intentionally do not setUrlBarFocused(false) here because
    // that state is for managing when it should be set if it is active.
    if (!this.isActive) {
      windowActions.setNavBarUserInput(e.target.value)
    }

    if (!eventElHasAncestorWithClasses(e, ['urlBarSuggestions', 'urlbarForm'])) {
      this.updateLocationToSuggestion()
    }
  }

  updateLocationToSuggestion () {
    if (this.locationValueSuffix.length > 0) {
      windowActions.setNavBarUserInput(this.locationValue + this.locationValueSuffix)
    }
  }

  get suggestionLocation () {
    const selectedIndex = this.activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])
    if (typeof selectedIndex === 'number') {
      const suggestion = this.activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'suggestionList', selectedIndex - 1])
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
    if (this.isSelected()) {
      windowActions.setUrlBarSelected(false)
    }
    // We never want to set the full navbar user input to include the suffix
    if (this.locationValue + this.locationValueSuffix !== e.target.value) {
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

  componentDidUpdate (prevProps) {
    // this.urlInput is not initialized in titleMode
    if (this.urlInput) {
      if (this.props.activeFrameKey !== prevProps.activeFrameKey) {
        // The user just changed tabs
        this.setValue(UrlUtil.getDisplayLocation(this.props.urlbar.get('location'), getSetting(settings.PDFJS_ENABLED)))
        // Each tab has a focused state stored separately
        if (this.isFocused()) {
          this.focus()
        }
        windowActions.setUrlBarSuggestions(undefined, null)
        windowActions.setRenderUrlBarSuggestions(false)
      } else if (this.props.location !== prevProps.location) {
        // This is a url nav change
        this.setValue(UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED)))
      } else if (this.props.hasLocationValueSuffix && this.isActive &&
        (this.props.hasLocationValueSuffix !== prevProps.hasLocationValueSuffix ||
         this.props.urlbar.get('location') !== prevProps.urlbar.get('location'))) {
        this.showAutocompleteResult()
      } else if ((this.props.titleMode !== prevProps.titleMode) ||
          (!this.isActive && !this.isFocused)) {
        this.setValue(this.locationValue)
      } else if (this.props.urlbar.get('location') !== prevProps.urlbar.get('location') &&
          this.urlInput.value !== this.props.urlbar.get('location')) {
        this.setValue(this.locationValue)
      }
    }
    if (this.isSelected() && !prevProps.urlbar.get('selected')) {
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
    return ['about:blank', 'about:newtab'].includes(this.props.urlbar.get('location'))
      ? '' : this.props.title
  }

  get autocompleteEnabled () {
    return this.props.urlbar.getIn(['suggestions', 'autocompleteEnabled'])
  }

  get locationValue () {
    const location = this.props.urlbar.get('location')
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

  get shouldRenderUrlBarSuggestions () {
    return this.props.urlbar.getIn(['suggestions', 'shouldRender']) === true &&
      this.suggestionList && this.suggestionList.size > 0
  }

  onContextMenu (e) {
    contextMenus.onUrlBarContextMenu(this.props.searchDetail, this.activeFrame, e)
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
          activateSearchEngine={this.activateSearchEngine}
          active={this.props.urlbar.get('active')}
          isSecure={this.props.isSecure}
          isHTTPPage={this.isHTTPPage}
          loading={this.props.loading}
          location={this.props.location}
          searchSelectEntry={this.searchSelectEntry}
          title={this.props.title}
          titleMode={this.props.titleMode}
          isSearching={this.props.location !== this.props.urlbar.get('location')}
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
          this.shouldRenderUrlBarSuggestions
          ? <UrlBarSuggestions
            selectedIndex={this.props.urlbar.getIn(['suggestions', 'selectedIndex'])}
            suggestionList={this.props.urlbar.getIn(['suggestions', 'suggestionList'])}
            hasLocationValueSuffix={this.props.hasLocationValueSuffix}
            menubarVisible={this.props.menubarVisible} />
          : null
        }
    </form>
  }
}

module.exports = UrlBar
