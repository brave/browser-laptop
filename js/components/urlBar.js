/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('url').parse

const ImmutableComponent = require('./immutableComponent')
const WindowActions = require('../actions/windowActions')
const KeyCodes = require('../constants/keyCodes')
const cx = require('../lib/classSet.js')
const ipc = global.require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions.js')
const messages = require('../constants/messages')
const contextMenus = require('../contextMenus')
const Config = require('../constants/config')

import {isUrl} from '../lib/appUrlUtil.js'

class UrlBar extends ImmutableComponent {

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
    } else {
      urlInput.blur()
    }
  }

  updateDOMInputSelected (selected) {
    if (selected) {
      this.urlInput.select()
    }
  }

  get searchDetail () {
    return this.props.searchDetail
  }

  // restores the url bar to the current location
  restore () {
    const location = this.props.activeFrameProps.get('location')
    WindowActions.setNavBarUserInput(location)
  }

  // Whether the suggestions box is visible
  get suggestionsShown () {
    return this.urlBarSuggestions.shouldRender()
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        let location = this.props.urlbar.get('location')
        if (location === null || location.length === 0) {
          this.restore()
          WindowActions.setUrlBarSelected(true)
        } else {
          const isLocationUrl = isUrl(location)
          const searchUrl = this.searchDetail.get('searchURL').replace('{searchTerms}', location)
          const selectedIndex = this.urlBarSuggestions.activeIndex
          if (this.suggestionsShown && selectedIndex > 0) {
            // load the selected suggestion
            this.urlBarSuggestions.clickSelected()
          // If control key is pressed and input has no space in it add www. as a prefix and .com as a suffix.
          // For whitepsace we want a search no matter what.
          } else if (!isLocationUrl && !/\s/g.test(location) && e.ctrlKey) {
            WindowActions.loadUrl(this.props.activeFrameProps, `www.${location}.com`)
          } else {
            location = isLocationUrl ? location : searchUrl
            // do search.
            if (e.altKey) {
              WindowActions.newFrame({ location }, true)
            } else if (e.metaKey) {
              WindowActions.newFrame({ location }, false)
            } else {
              WindowActions.loadUrl(this.props.activeFrameProps, location)
            }
          }
          // this can't go through AppActions for some reason
          // or the whole window will reload on the first page request
          this.updateDOMInputFocus(false)
        }
        break
      case KeyCodes.UP:
        if (this.suggestionsShown) {
          this.urlBarSuggestions.previousSuggestion()
          e.preventDefault()
        }
        break
      case KeyCodes.DOWN:
        if (this.suggestionsShown) {
          this.urlBarSuggestions.nextSuggestion()
          e.preventDefault()
        }
        break
      case KeyCodes.ESC:
        e.preventDefault()
        ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_STOP)
        break
      default:
    }
  }

  onClick (e) {
    // if the url bar is already selected then clicking in it should make it active
    if (this.isSelected()) {
      WindowActions.setUrlBarSelected(false)
      WindowActions.setUrlBarActive(true)
    }
  }

  onBlur (e) {
    // if suggestion box is active then keep url bar active
    if (!this.suggestionsShown) {
      WindowActions.setUrlBarActive(false)
    }
    WindowActions.setUrlBarSelected(false)
    WindowActions.setNavBarFocused(false)
  }

  onChange (e) {
    WindowActions.setUrlBarSelected(false)
    WindowActions.setUrlBarActive(true)
    WindowActions.setNavBarUserInput(e.target.value)
  }

  onFocus (e) {
    WindowActions.setUrlBarSelected(true)
  }

  onActiveFrameStop () {
    this.restore()
    WindowActions.setUrlBarSelected(true)
    WindowActions.setUrlBarActive(false)
  }

  componentWillMount () {
    ipc.on(messages.SHORTCUT_FOCUS_URL, (e, forSearchMode) => {
      WindowActions.setUrlBarSelected(true, forSearchMode)
    })
    // escape key handling
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_STOP, this.onActiveFrameStop.bind(this))
  }

  componentDidMount () {
    this.updateDOM()
  }

  componentDidUpdate () {
    this.updateDOM()
  }

  get hostValue () {
    const parsed = urlParse(this.props.activeFrameProps.get('location'))
    return parsed.host && parsed.protocol !== 'about:' ? parsed.host : ''
  }

  get titleValue () {
    // For about:newtab we don't want the top of the browser saying New Tab
    // Instead just show "Brave"
    return ['about:blank', 'about:newtab'].includes(this.props.urlbar.get('location'))
      ? '' : this.props.activeFrameProps.get('title')
  }

  get locationValue () {
    return ['about:newtab'].includes(this.props.urlbar.get('location'))
      ? '' : this.props.urlbar.get('location')
  }

  get loadTime () {
    let loadTime = ''
    if (this.props.activeFrameProps.get('startLoadTime') &&
        this.props.activeFrameProps.get('endLoadTime')) {
      const loadMilliseconds = this.props.activeFrameProps.get('endLoadTime') -
        this.props.activeFrameProps.get('startLoadTime')
      if (loadMilliseconds > 1000) {
        loadTime = (loadMilliseconds / 1000 | 0) + 's '
      }
      loadTime += (loadMilliseconds % 1000 | 0) + 'ms'
    }
    return loadTime
  }

  get secure () {
    return this.props.activeFrameProps.getIn(['security', 'isSecure'])
  }

  get aboutPage () {
    const protocol = urlParse(this.props.activeFrameProps.get('location')).protocol
    return ['about:', 'file:', 'chrome:', 'view-source:'].includes(protocol)
  }

  get isHTTPPage () {
    // Whether this page is HTTP or HTTPS. We don't show security indicators
    // for other protocols like mailto: and about:.
    const protocol = urlParse(this.props.activeFrameProps.get('location')).protocol
    return protocol === 'http:' || protocol === 'https:'
  }

  onSiteInfo () {
    WindowActions.setSiteInfoVisible(true)
  }

  render () {
    return <form
      action='#'
      id='urlbar'
      ref='urlbar'>
        <div id='titleBarWrapper'>
        <span
          onClick={this.onSiteInfo}
          className={cx({
            urlbarIcon: true,
            'fa': true,
            'fa-lock': this.isHTTPPage && this.secure && !this.props.urlbar.get('active'),
            'fa-unlock': this.isHTTPPage && !this.secure && !this.props.urlbar.get('active') && !this.props.titleMode,
            'fa fa-search': this.props.searchSuggestions && this.props.urlbar.get('focused') && this.props.loading === false,
            'fa fa-file-o': !this.props.searchSuggestions && this.props.urlbar.get('focused') && this.props.loading === false,
            extendedValidation: this.extendedValidationSSL
          })}/>
        <div id='titleBar'>
          <span><strong>{this.hostValue}</strong></span>
          <span>{this.hostValue && this.titleValue ? ' | ' : ''}</span>
          <span>{this.titleValue}</span>
        </div>
        </div>
      <input type='text'
        disabled={this.props.activeFrameProps.get('location') === Config.defaultUrl && this.loadTime === ''}
        onFocus={this.onFocus.bind(this)}
        onBlur={this.onBlur.bind(this)}
        onKeyDown={this.onKeyDown.bind(this)}
        onChange={this.onChange.bind(this)}
        onClick={this.onClick.bind(this)}
        onContextMenu={contextMenus.onUrlBarContextMenu.bind(this)}
        value={this.locationValue}
        data-l10n-id='urlbar'
        className={cx({
          insecure: !this.secure && this.props.loading === false && !this.isHTTPPage,
          private: this.private,
          testHookLoadDone: !this.props.loading
        })}
        id='urlInput'
        readOnly={this.props.titleMode}
        ref={node => this.urlInput = node}/>
        { !this.props.titleMode
          ? <span className='loadTime'>{this.loadTime}</span> : null }
        <UrlBarSuggestions
          ref={node => this.urlBarSuggestions = node}
          suggestions={this.props.urlbar.get('suggestions')}
          settings={this.props.settings}
          sites={this.props.sites}
          frames={this.props.frames}
          searchDetail={this.searchDetail}
          searchSuggestions={this.props.searchSuggestions}
          activeFrameProps={this.props.activeFrameProps}
          urlLocation={this.props.urlbar.get('location')}
          urlPreview={this.props.urlbar.get('urlPreview')}
          urlActive={this.props.urlbar.get('active')}
          previewActiveIndex={this.props.previewActiveIndex || 0} />
      </form>
  }
}

module.exports = UrlBar
