/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('url').parse

const ImmutableComponent = require('./immutableComponent')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const KeyCodes = require('../constants/keyCodes')
const cx = require('../lib/classSet.js')
const ipc = global.require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions.js')
const messages = require('../constants/messages')
const dragTypes = require('../constants/dragTypes')
const { getSetting } = require('../settings')
const settings = require('../constants/settings')
const contextMenus = require('../contextMenus')
const dndData = require('../dndData')
const pdfjsExtensionId = require('../constants/config').PDFJSExtensionId
const windowStore = require('../stores/windowStore')

const { isUrl, isIntermediateAboutPage } = require('../lib/appUrlUtil')

class UrlBar extends ImmutableComponent {
  constructor () {
    super()
    this.onActiveFrameStop = this.onActiveFrameStop.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  isActive () {
    return this.props.urlbar.get('active')
  }

  isSelected () {
    return this.props.urlbar.get('selected')
  }

  isFocused () {
    return this.props.urlbar.get('focused')
  }

  // update the DOM with state that is not stored in the component
  updateDOM () {
    this.updateDOMInputFocus(this.isFocused())
    this.updateDOMInputSelected(this.isSelected())
  }

  updateDOMInputFocus (focused) {
    const urlInput = this.urlInput
    if (focused) {
      urlInput.focus()
    }
  }

  updateDOMInputSelected (selected) {
    if (selected) {
      this.urlInput.select()
    }
  }

  // restores the url bar to the current location
  restore () {
    windowActions.setNavBarUserInput(this.props.location)
  }

  // Temporarily disable the autocomplete when a user is pressing backspace.
  // Otherwise, they'd have to hit backspace twice for each character they wanted
  // to delete.
  hideAutoComplete () {
    if (this.autocompleteEnabled) {
      windowActions.setUrlBarAutocompleteEnabled(false)
    }
    windowActions.setUrlBarSuggestions(undefined, null)
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        windowActions.setUrlBarActive(false)
        this.restore()
        e.preventDefault()

        let location = this.props.urlbar.get('location')

        if (location === null || location.length === 0) {
          windowActions.setUrlBarSelected(true)
        } else {
          // Filter javascript URLs to prevent self-XSS
          location = location.replace(/^(\s*javascript:)+/i, '')
          const isLocationUrl = isUrl(location)
          // If control key is pressed and input has no space in it add www. as a prefix and .com as a suffix.
          // For whitepsace we want a search no matter what.
          if (!isLocationUrl && !/\s/g.test(location) && e.ctrlKey) {
            windowActions.loadUrl(this.activeFrame, `www.${location}.com`)
          } else if (this.shouldRenderUrlBarSuggestions && (this.urlBarSuggestions.activeIndex > 0 || this.props.locationValueSuffix)) {
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
            let searchUrl = this.props.searchDetail.get('searchURL').replace('{searchTerms}', encodeURIComponent(location))
            location = isLocationUrl ? location : searchUrl
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
          this.updateDOMInputFocus(false)
        }
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
        ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_STOP)
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
        break
      default:
        // Any other keydown is fair game for autocomplete to be enabled.
        if (!this.autocompleteEnabled) {
          windowActions.setUrlBarAutocompleteEnabled(true)
        }
    }
  }

  onClick (e) {
    // if the url bar is already selected then clicking in it should make it active
    if (this.isSelected()) {
      windowActions.setUrlBarSelected(false)
      windowActions.setUrlBarActive(true)
    }
  }

  onBlur (e) {
    windowActions.setNavBarFocused(false)
    windowActions.setUrlBarSelected(false)
    // On blur, a user expects the text shown from the last autocomplete suffix
    // to be auto entered as the new location.
    this.updateLocationToSuggestion()
  }

  updateLocationToSuggestion () {
    if (this.props.locationValueSuffix.length > 0) {
      windowActions.setNavBarUserInput(this.locationValue + this.props.locationValueSuffix)
    }
  }

  onChange (e) {
    windowActions.setUrlBarSelected(false)
    windowActions.setUrlBarActive(true)
    windowActions.setNavBarUserInput(e.target.value)
  }

  onFocus (e) {
    windowActions.setUrlBarSelected(true)
  }

  onActiveFrameStop () {
    this.restore()
    windowActions.setUrlBarSelected(true)
    windowActions.setUrlBarActive(false)
  }

  componentWillMount () {
    ipc.on(messages.SHORTCUT_FOCUS_URL, (e) => {
      // If the user hits Command+L while in the URL bar they want everything suggested as the new potential URL to laod.
      this.updateLocationToSuggestion()
      windowActions.setUrlBarSelected(true)
      // The urlbar "selected" might already be set in the window state, so subsequent Command+L won't trigger component updates, so this needs another DOM refresh for selection.
      this.updateDOM()
    })
    // escape key handling
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_STOP, this.onActiveFrameStop)
  }

  componentDidMount () {
    this.updateDOM()
  }

  componentDidUpdate (prevProps) {
    this.updateDOM()
    // Select the part of the URL which was an autocomplete suffix.
    if (this.urlInput && this.props.locationValueSuffix.length > 0) {
      const len = this.urlInput.value.length
      const suffixLen = this.props.locationValueSuffix.length
      this.urlInput.setSelectionRange(len - suffixLen, len)
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
    // If there's a selected autocomplete entry, we just want to show its location
    if (this.props.suggestionIndex) {
      const suggestionLocation = this.props.urlbar.getIn(['suggestions', 'suggestionList', this.props.suggestionIndex - 1]).location
      if (suggestionLocation) {
        return suggestionLocation
      }
    }

    let location = this.props.urlbar.get('location')
    const history = this.props.history
    if (isIntermediateAboutPage(location) && history.size > 0) {
      return history.last()
    }

    // We can extend the conditions if there are more chrome-extension to
    // truncate
    if (getSetting(settings.PDFJS_ENABLED) &&
        location.startsWith(`chrome-extension://${pdfjsExtensionId}/`)) {
      location = location.replace(/^chrome-extension:\/\/.+\/(\w+:\/\/.+)/, '$1')
    }

    return ['about:blank', 'about:newtab'].includes(this.props.urlbar.get('location'))
      ? '' : location
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
    const protocol = urlParse(this.props.location).protocol
    return protocol === 'http:' || protocol === 'https:'
  }

  onSiteInfo () {
    windowActions.setSiteInfoVisible(true)
  }

  get shouldRenderUrlBarSuggestions () {
    return (this.props.urlbar.get('location') || this.props.urlbar.get('urlPreview')) &&
      this.props.urlbar.get('active')
  }

  onDragStart (e) {
    dndData.setupDataTransferURL(e.dataTransfer, this.props.location, this.props.title)
    dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.TAB, this.activeFrame)
  }

  onContextMenu (e) {
    contextMenus.onUrlBarContextMenu(this.props.searchDetail, this.activeFrame, e)
  }

  render () {
    return <form
      className='urlbarForm'
      action='#'
      id='urlbar'
      ref='urlbar'>
      <span
        onDragStart={this.onDragStart}
        draggable
        onClick={this.onSiteInfo}
        className={cx({
          urlbarIcon: true,
          'fa': true,
          'fa-lock': this.isHTTPPage && this.props.isSecure && !this.props.urlbar.get('active'),
          'fa-unlock-alt': this.isHTTPPage && !this.props.isSecure && !this.props.urlbar.get('active') && !this.props.titleMode,
          'fa fa-file': this.props.urlbar.get('active') && this.props.loading === false,
          extendedValidation: this.extendedValidationSSL
        })} />
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
            onChange={this.onChange}
            onClick={this.onClick}
            onContextMenu={this.onContextMenu}
            value={this.locationValue + this.props.locationValueSuffix}
            data-l10n-id='urlbar'
            className={cx({
              insecure: !this.props.isSecure && this.props.loading === false && !this.isHTTPPage,
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
            previewActiveIndex={this.props.previewActiveIndex || 0} />
          : null
        }
    </form>
  }
}

module.exports = UrlBar
