/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')
const WindowActions = require('../actions/windowActions')
const KeyCodes = require('../constants/keyCodes')
const cx = require('../lib/classSet.js')
const ipc = global.require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions.js')
const messages = require('../constants/messages')

import {isUrl} from '../lib/appUrlUtil.js'

class UrlBar extends ImmutableComponent {

  isActive () {
    return this.props.urlbar.get('active')
  }

  isAutoselected () {
    return this.props.urlbar.get('autoselected')
  }

  isFocused () {
    return this.props.urlbar.get('focused')
  }

  // update the DOM with state that is not stored in the component
  updateDOM () {
    this.updateDOMInputFocus(this.isFocused())
    this.updateDOMSelectionIfAuto(this.isAutoselected())
  }

  updateDOMInputFocus (focused) {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    if (focused) {
      urlInput.focus()
    } else {
      urlInput.blur()
    }
  }

  updateDOMSelectionIfAuto (autoselected) {
    if (autoselected) {
      let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
      urlInput.select()
    }
  }

  get searchDetail () {
    return this.props.activeFrameProps.get('searchDetail')
  }

  // restores the url bar to the current location
  restore () {
    let location = this.props.activeFrameProps.get('location')
    WindowActions.setNavBarUserInput(location)
  }

  // Whether the suggestions box is visible
  get suggestionsShown () {
    return this.refs.urlBarSuggestions.shouldRender()
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        let location = this.props.urlbar.get('location')
        if (location === null || location.length === 0) {
          this.restore()
          WindowActions.setUrlBarAutoselected(true)
        } else {
          let selectedIndex = this.refs.urlBarSuggestions.activeIndex
          if (this.suggestionsShown && selectedIndex > 0) {
            // load the selected suggestion
            this.refs.urlBarSuggestions.clickSelected()
          } else if (this.props.searchSuggestions && !isUrl(location)) {
            // do search.
            WindowActions.loadUrl(this.searchDetail.get('searchURL').replace('{searchTerms}', location))
          } else {
            WindowActions.loadUrl(location)
          }
          // this can't go through AppActions for some reason
          // or the whole window will reload on the first page request
          this.updateDOMInputFocus(false)
        }
        break
      case KeyCodes.UP:
        if (this.suggestionsShown) {
          this.refs.urlBarSuggestions.previousSuggestion()
          e.preventDefault()
        }
        break
      case KeyCodes.DOWN:
        if (this.suggestionsShown) {
          this.refs.urlBarSuggestions.nextSuggestion()
          e.preventDefault()
        }
        break
      // escape is handled by ipc shortcut-active-frame-stop event
      default:
        WindowActions.setUrlBarAutoselected(false)
        WindowActions.setUrlBarActive(true)
    }
  }

  onClick (e) {
    // if the url bar is already selected then clicking in it should make it active
    if (this.isAutoselected()) {
      WindowActions.setUrlBarAutoselected(false)
      WindowActions.setUrlBarActive(true)
      e.preventDefault()
    } else if (!this.isActive()) {
      WindowActions.setUrlBarAutoselected(true)
    }
  }

  onBlur (e) {
    // if suggestion box is active then keep url bar active
    if (!this.suggestionsShown) {
      WindowActions.setUrlBarActive(false)
    }
    WindowActions.setUrlBarAutoselected(false)
    WindowActions.setNavBarFocused(false)
  }

  onChange (e) {
    WindowActions.setNavBarUserInput(e.target.value)
  }

  onFocus (e) {
    WindowActions.setNavBarFocused(true)
  }

  onActiveFrameStop () {
    this.restore()
    WindowActions.setUrlBarAutoselected(true)
    WindowActions.setUrlBarActive(false)
  }

  componentWillMount () {
    ipc.on(messages.SHORTCUT_FOCUS_URL, () => {
      this.onFocus.bind(this)
      WindowActions.setUrlBarAutoselected(true)
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

  render () {
    return <form
      action='#'
      id='urlbar'
      ref='urlbar'>
        <span
          onClick={this.props.onSiteInfo}
          className={cx({
            urlbarIcon: true,
            'fa': true,
            'fa-lock': this.secure && this.loading === false && !this.props.focused,
            'fa-unlock': !this.secure && this.loading === false && this.aboutPage === false && !this.props.focused,
            'fa fa-spinner fa-spin': this.loading === true,
            'fa fa-search': this.props.searchSuggestions && this.props.focused && this.loading === false,
            extendedValidation: this.extendedValidationSSL
          })}/>
      <input type='text'
        onFocus={this.onFocus.bind(this)}
        onBlur={this.onBlur.bind(this)}
        onKeyDown={this.onKeyDown.bind(this)}
        onChange={this.onChange.bind(this)}
        onClick={this.onClick.bind(this)}
        value={this.props.urlbar.get('location')}
        data-l10n-id='urlbar'
        className={cx({
          insecure: !this.secure && this.loading === false && this.aboutPage === false,
          private: this.private,
          testHookLoadDone: !this.loading
        })}
        id='urlInput'
        ref='urlInput'/>
        <UrlBarSuggestions
          ref='urlBarSuggestions'
          suggestions={this.props.urlbar.get('suggestions')}
          sites={this.props.sites}
          frames={this.props.frames}
          searchDetail={this.searchDetail}
          searchSuggestions={this.props.activeFrameProps.get('searchSuggestions')}
          activeFrameProps={this.props.activeFrameProps}
          urlLocation={this.props.urlbar.get('location')}
          urlPreview={this.props.urlbar.get('urlPreview')}
          urlActive={this.props.urlbar.get('active')}
          previewActiveIndex={this.props.previewActiveIndex || 0} />
      </form>
  }
}

module.exports = UrlBar
