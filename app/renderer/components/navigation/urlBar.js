/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer

// Components
const ReduxComponent = require('../reduxComponent')
const UrlBarSuggestions = require('./urlBarSuggestions')
const UrlBarIcon = require('./urlBarIcon')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// Constants
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')
const KeyCodes = require('../../../common/constants/keyCodes')

// State
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const siteSettings = require('../../../../js/state/siteSettings')
const tabState = require('../../../common/state/tabState')
const siteSettingsState = require('../../../common/state/siteSettingsState')

// Utils
const urlParse = require('../../../common/urlParse')
const cx = require('../../../../js/lib/classSet')
const debounce = require('../../../../js/lib/debounce')
const {getSetting} = require('../../../../js/settings')
const contextMenus = require('../../../../js/contextMenus')
const UrlUtil = require('../../../../js/lib/urlutil')
const {eventElHasAncestorWithClasses, isForSecondaryAction} = require('../../../../js/lib/eventUtil')
const {getBaseUrl, isUrl, isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')
const {getCurrentWindowId} = require('../../currentWindow')
const {normalizeLocation} = require('../../../common/lib/suggestion')

// Icons
const iconNoScript = require('../../../../img/url-bar-no-script.svg')

// Stores
const appStoreRenderer = require('../../../../js/stores/appStoreRenderer')

class UrlBar extends React.Component {
  constructor (props) {
    super(props)
    this.lastVal = ''
    this.lastSuffix = ''
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
      if (this.keyPressed || !this.urlInput || this.props.locationValueSuffix.length === 0) {
        return
      }
      this.updateAutocomplete(this.lastVal)
    }, 10)
  }

  maybeUrlBarTextChanged (value) {
    if (value !== this.props.locationValue) {
      appActions.urlBarTextChanged(getCurrentWindowId(), this.props.activeTabId, value)
    }
  }

  // restores the url bar to the current location
  restore () {
    const location = UrlUtil.getDisplayLocation(this.props.location, getSetting(settings.PDFJS_ENABLED))
    if (this.urlInput) {
      this.setValue(location)
    }
    this.maybeUrlBarTextChanged(location)
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
    this.lastSuffix = ''
    if (this.props.autocompleteEnabled) {
      windowActions.urlBarAutocompleteEnabled(false)
    }
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
        let location = this.urlInput ? this.getValue() : this.props.urlbarLocation

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
      default:
        this.keyPressed = true
        // Only enable suggestions and autocomplete if we are typing in
        // a printable character without cmd/ctrl
        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          windowActions.setRenderUrlBarSuggestions(true)
          // Any other keydown is fair game for autocomplete to be enabled.
          if (!this.props.autocompleteEnabled) {
            windowActions.urlBarAutocompleteEnabled(true)
          }
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

  updateAutocomplete (newValue) {
    let suggestion = ''
    let suggestionNormalized = ''
    if (this.props.suggestionList && this.props.suggestionList.size > 0) {
      suggestion = this.props.suggestionList.getIn([this.activeIndex || 0, 'location']) || ''
      suggestionNormalized = normalizeLocation(suggestion)
    }
    const newValueNormalized = normalizeLocation(newValue)
    if (suggestionNormalized.startsWith(newValueNormalized) && suggestionNormalized.length > 0) {
      const newSuffix = suggestionNormalized.substring(newValueNormalized.length)
      this.setValue(newValue, newSuffix)
      this.urlInput.setSelectionRange(newValue.length, newValue.length + newSuffix.length + 1)
      return true
    } else {
      return false
    }
  }

  onKeyPress (e) {
    // handle urlInput.value = '' from tests
    if (this.urlInput.value === '') {
      this.lastVal = ''
      this.lastSuffix = ''
    }

    // if there is no selection then we are not in autocomplete
    // so make sure that this.lastValue is set to urlInput.value
    if (this.urlInput.selectionStart === this.urlInput.selectionEnd) {
      this.lastVal = this.urlInput.value
      this.lastSuffix = ''
    }

    const selectionStart = this.urlInput.selectionStart
    const newValue = [
      this.lastVal.slice(0, selectionStart),
      String.fromCharCode(e.which),
      this.lastVal.slice(this.urlInput.selectionEnd)
    ].join('')

    if (!this.updateAutocomplete(newValue)) {
      this.setValue(newValue)
      this.urlInput.setSelectionRange(selectionStart + 1, selectionStart + 1)
    }

    e.preventDefault()
  }

  onChange (e) {
    if (e.target.value !== this.lastVal + this.lastSuffix) {
      e.preventDefault()
      this.setValue(e.target.value)
    }
  }

  getValue () {
    return this.lastVal + this.lastSuffix
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
      if (!this.keyPress) {
        // if this is a key press don't sent the update until keyUp so
        // showAutocompleteResult can handle the result
        this.maybeUrlBarTextChanged(val)
      }
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
    this.keyPressed = false
    this.maybeUrlBarTextChanged(this.lastVal)
  }

  select () {
    setImmediate(() => {
      if (this.urlInput) {
        this.urlInput.select()
      }
    })
  }

  focus () {
    setImmediate(() => {
      if (this.urlInput) {
        this.urlInput.focus()
      }
    })
  }

  onFocus (e) {
    this.select()
    windowActions.urlBarOnFocus(getCurrentWindowId())
  }

  componentWillMount () {
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
      const pdfjsEnabled = getSetting(settings.PDFJS_ENABLED)
      if (this.props.activeFrameKey !== prevProps.activeFrameKey) {
        this.keyPressed = false
        // The user just changed tabs
        this.setValue(this.props.locationValue !== 'about:blank'
          ? this.props.locationValue
          : UrlUtil.getDisplayLocation(this.props.location, pdfjsEnabled))
        // Each tab has a focused state stored separately
        if (this.props.isFocused) {
          this.focus()
        }
        windowActions.setRenderUrlBarSuggestions(false)
      } else if (this.props.location !== prevProps.location) {
        // This is a url nav change
        this.setValue(UrlUtil.getDisplayLocation(this.props.location, pdfjsEnabled))
      } else if (this.props.hasLocationValueSuffix &&
                this.props.isActive &&
                this.props.locationValueSuffix !== this.lastSuffix) {
        this.showAutocompleteResult()
      } else if ((this.props.titleMode !== prevProps.titleMode) ||
          (!this.props.isActive && !this.props.isFocused)) {
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
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId') || tabState.TAB_ID_NONE

    const location = activeFrame.get('location') || ''
    const baseUrl = getBaseUrl(location)
    const urlbar = activeFrame.getIn(['navbar', 'urlbar']) || Immutable.Map()
    const history = (activeFrame.get('history') || new Immutable.List())
    const canGoForward = activeTabId === tabState.TAB_ID_NONE ? false : tabState.canGoForward(state, activeTabId)
    const urlbarLocation = urlbar.get('location')
    const locationValue = (isIntermediateAboutPage(urlbarLocation) && history.size > 0 && !canGoForward)
        ? history.last() : UrlUtil.getDisplayLocation(urlbarLocation, getSetting(settings.PDFJS_ENABLED))
    const selectedIndex = urlbar.getIn(['suggestions', 'selectedIndex'])
    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, activeFrame.get('isPrivate'))
    const braverySettings = siteSettings.getSiteSettingsForURL(allSiteSettings, location)

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
    let searchURL = appStoreRenderer.state.getIn(['searchDetail', 'searchURL'])
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
    props.hasLocationValueSuffix = urlbar.getIn(['suggestions', 'urlSuffix'])
    props.startLoadTime = activeFrame.get('startLoadTime')
    props.endLoadTime = activeFrame.get('endLoadTime')
    props.loading = activeFrame.get('loading')
    props.enableNoScript = siteSettingsState.isNoScriptEnabled(state, braverySettings)
    props.noScriptIsVisible = currentWindow.getIn(['ui', 'noScriptInfo', 'isVisible']) || false
    props.menubarVisible = ownProps.menubarVisible
    props.activeTabShowingMessageBox = tabState.isShowingMessageBox(state, activeTabId)
    props.noBorderRadius = isPublisherButtonEnabled
    props.onStop = ownProps.onStop
    props.titleMode = ownProps.titleMode
    props.locationValue = locationValue
    props.locationValueSuffix = urlbar.getIn(['suggestions', 'urlSuffix'])
    props.selectedIndex = selectedIndex
    props.suggestionList = urlbar.getIn(['suggestions', 'suggestionList'])
    props.suggestion = urlbar.getIn(['suggestions', 'suggestionList', selectedIndex - 1])
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
