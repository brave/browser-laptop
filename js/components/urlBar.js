/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('url').parse

const ImmutableComponent = require('./immutableComponent')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const KeyCodes = require('../../app/common/constants/keyCodes')
const cx = require('../lib/classSet')
const debounce = require('../lib/debounce')
const ipc = require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions')
const UrlBarIcon = require('../../app/renderer/components/urlBarIcon')
const messages = require('../constants/messages')
const {getSetting} = require('../settings')
const settings = require('../constants/settings')
const contextMenus = require('../contextMenus')
const windowStore = require('../stores/windowStore')
const searchProviders = require('../data/searchProviders')
const UrlUtil = require('../lib/urlutil')

const EventUtil = require('../lib/eventUtil')
const eventElHasAncestorWithClasses = EventUtil.eventElHasAncestorWithClasses

const {isUrl, isIntermediateAboutPage} = require('../lib/appUrlUtil')

class UrlBar extends ImmutableComponent {
  constructor () {
    super()
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.activateSearchEngine = false
    this.searchSelectEntry = null
    this.keyPressed = false
    this.showAutocompleteResult = debounce(() => {
      if (!this.urlInput || this.keyPressed || this.locationValue.length === 0) {
        return
      }
      const suffixLen = this.props.locationValueSuffix.length
      if (suffixLen > 0 && this.urlInput.value !== this.locationValue + this.props.locationValueSuffix) {
        this.urlInput.value = this.locationValue + this.props.locationValueSuffix
        const len = this.locationValue.length
        this.urlInput.setSelectionRange(len, len + suffixLen)
      }
    }, 10)
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

  // restores the url bar to the current location
  restore () {
    const location = UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED))
    if (this.urlInput) {
      this.urlInput.value = location
    }
    windowActions.setNavBarUserInput(location)
  }

  // Temporarily disable the autocomplete when a user is pressing backspace.
  // Otherwise, they'd have to hit backspace twice for each character they wanted
  // to delete.
  hideAutoComplete () {
    if (this.autocompleteEnabled) {
      windowActions.setUrlBarAutocompleteEnabled(false)
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
      if (provider.platformClientId) {
        const platformUtil = require('../../app/common/lib/platformUtil')
        if (platformUtil.isWindows()) {
          return provider.platformClientId.win32 || ''
        } else if (platformUtil.isDarwin()) {
          return provider.platformClientId.darwin || ''
        }
        return provider.platformClientId.linux || ''
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
      const shortcut = new RegExp('^' + provider.shortcut + ' ', 'g')
      searchTerms = searchTerms.replace(shortcut, '')
      url = provider.search
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
    if (!this.isActive) {
      windowActions.setUrlBarActive(true)
    }
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        let location = this.urlInput ? this.urlInput.value : this.props.urlbar.get('location')
        windowActions.setUrlBarActive(false)

        if (location === null || location.length === 0) {
          windowActions.setUrlBarSelected(true)
        } else {
          // Filter javascript URLs to prevent self-XSS
          location = location.replace(/^(\s*javascript:)+/i, '')
          const isLocationUrl = isUrl(location)
          if (!isLocationUrl && e.ctrlKey) {
            windowActions.loadUrl(this.activeFrame, `www.${location}.com`)
          } else if (this.shouldRenderUrlBarSuggestions && (this.urlBarSuggestions.activeIndex > 0 || this.props.locationValueSuffix && this.autocompleteEnabled)) {
            // Hack to make alt enter open a new tab for url bar suggestions when hitting enter on them.
            const isDarwin = process.platform === 'darwin'
            if (e.altKey) {
              if (isDarwin) {
                e.metaKey = true
              } else {
                e.ctrlKey = true
              }
            }
            // TODO: We shouldn't be calling into urlBarSuggestions from the parent component at all
            // load the selected suggestion
            this.urlBarSuggestions.clickSelected(e)
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
              windowActions.loadUrl(this.activeFrame, location)
            }
          }
          // this can't go through appActions for some reason
          // or the whole window will reload on the first page request
          this.clearSearchEngine()
        }
        windowActions.setRenderUrlBarSuggestions(false)
        break
      case KeyCodes.UP:
        if (this.shouldRenderUrlBarSuggestions) {
          // TODO: We shouldn't be calling into urlBarSuggestions from the parent component at all
          this.urlBarSuggestions.previousSuggestion()
          e.preventDefault()
        }
        break
      case KeyCodes.DOWN:
        if (this.shouldRenderUrlBarSuggestions) {
          // TODO: We shouldn't be calling into urlBarSuggestions from the parent component at all
          if (!this.urlBarSuggestions.suggestionList) {
            this.urlBarSuggestions.suggestionList = this.urlBarSuggestions.getNewSuggestionList()
          }
          this.urlBarSuggestions.nextSuggestion()
          e.preventDefault()
        }
        break
      case KeyCodes.ESC:
        e.preventDefault()
        this.props.onStop()
        this.clearSearchEngine()
        this.restore()
        this.select()
        break
      case KeyCodes.DELETE:
        if (e.shiftKey) {
          const selectedIndex = this.props.locationValueSuffix.length > 0 ? 1 : this.activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])
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
        this.clearSearchEngine()
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
          windowActions.setUrlBarAutocompleteEnabled(true)
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
    // On blur, a user expects the text shown from the last autocomplete suffix
    // to be auto entered as the new location.
    this.clearSearchEngine()

    if (!eventElHasAncestorWithClasses(e, ['urlBarSuggestions', 'urlbarForm'])) {
      this.updateLocationToSuggestion()
    }
  }

  updateLocationToSuggestion () {
    if (this.props.locationValueSuffix.length > 0) {
      windowActions.setNavBarUserInput(this.locationValue + this.props.locationValueSuffix)
    }
  }

  detectSearchEngine (input) {
    let location = typeof input === 'string' ? input : this.props.urlbar.get('location')
    if (typeof location === 'string' && location.length !== 0) {
      const isLocationUrl = isUrl(location)
      if (!isLocationUrl &&
        !(this.searchSelectEntry && location.startsWith(this.searchSelectEntry.shortcut + ' '))) {
        let entries = searchProviders.providers
        entries.forEach((entry) => {
          if (location.startsWith(entry.shortcut + ' ')) {
            this.activateSearchEngine = true
            this.searchSelectEntry = entry
            return false
          }
        })
      }
    }
  }

  clearSearchEngine () {
    this.activateSearchEngine = false
    this.searchSelectEntry = null
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

  onChange (e) {
    const oldActivateSearchEngine = this.activateSearchEngine
    const oldSearchSelectEntry = this.searchSelectEntry

    this.clearSearchEngine()
    this.detectSearchEngine(e.target.value)

    if (this.suggestionLocation) {
      windowActions.setUrlBarSuggestions(undefined, null)
    }

    // TODO: activeSearchEngine and searchSelectEntry should be stored in
    // state so we don't have to do this hack.
    // It comes into play because no keyUp state changes happen when
    // you use the context menu to select all and then cut.
    if (oldActivateSearchEngine !== this.activateSearchEngine ||
        oldSearchSelectEntry !== this.searchSelectEntry) {
      this.forceUpdate()
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
    if (this.locationValue + this.props.locationValueSuffix !== e.target.value) {
      windowActions.setNavBarUserInput(e.target.value)
    }
    this.clearSearchEngine()
    this.detectSearchEngine(e.target.value)
    this.keyPressed = false

    if ((e.target.value !== undefined) && e.target.value.length === 0) {
      windowActions.setRenderUrlBarSuggestions(false)
    }
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
    this.detectSearchEngine()
  }

  componentWillMount () {
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
      this.urlInput.value = UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED))
      this.focus()
    }
  }

  componentDidUpdate (prevProps) {
    // this.urlInput is not initialized in titleMode
    if (this.urlInput) {
      if (this.props.activeFrameKey !== prevProps.activeFrameKey) {
        // The user just changed tabs
        this.urlInput.value = UrlUtil.getDisplayLocation(this.props.urlbar.get('location'), getSetting(settings.PDFJS_ENABLED))
        // Each tab has a focused state stored separately
        if (this.isFocused()) {
          this.focus()
        }
        windowActions.setUrlBarSuggestions(undefined, null)
        windowActions.setRenderUrlBarSuggestions(false)
      } else if (this.props.location !== prevProps.location) {
        // This is a url nav change
        this.urlInput.value = UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED))
      } else if (this.props.locationValueSuffix.length > 0 && this.isActive &&
        (this.props.locationValueSuffix !== prevProps.locationValueSuffix ||
         this.props.urlbar.get('location') !== prevProps.urlbar.get('location'))) {
        this.showAutocompleteResult()
      } else if (this.props.activeFrameKey !== prevProps.activeFrameKey ||
          this.props.titleMode !== prevProps.titleMode ||
          !this.isActive && !this.isFocused) {
        this.urlInput.value = this.locationValue
      } else if (this.props.urlbar.get('location') !== prevProps.urlbar.get('location') &&
          this.urlInput.value !== this.props.urlbar.get('location')) {
        this.urlInput.value = this.locationValue
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
    if (isIntermediateAboutPage(location) && history.size > 0 &&
        !this.activeFrame.get('canGoForward')) {
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
    let shouldRender = this.props.urlbar.getIn(['suggestions', 'shouldRender'])
    return shouldRender === true
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
          // TODO(for perf!): urlLocation shouldn't be passed into UrlBarSuggestions props.
          // `urlLocation` usage should be refactored out into UrlBar.
          // Passing it in causes uneeded extra renders for UrlBarSuggestions.
          this.shouldRenderUrlBarSuggestions
          ? <UrlBarSuggestions
            ref={(node) => { this.urlBarSuggestions = node }}
            selectedIndex={this.props.urlbar.getIn(['suggestions', 'selectedIndex'])}
            suggestionList={this.props.urlbar.getIn(['suggestions', 'suggestionList'])}
            searchResults={this.props.urlbar.getIn(['suggestions', 'searchResults'])}
            locationValueSuffix={this.props.locationValueSuffix}
            sites={this.props.sites}
            searchDetail={this.props.searchDetail}
            activeFrameKey={this.props.activeFrameKey}
            urlLocation={this.props.urlbar.get('location')}
            urlPreview={this.props.urlbar.get('urlPreview')}
            searchSelectEntry={this.searchSelectEntry}
            menubarVisible={this.props.menubarVisible} />
          : null
        }
    </form>
  }
}

module.exports = UrlBar
