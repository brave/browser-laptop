/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')
const AppActions = require('../actions/appActions')
const KeyCodes = require('../constants/keyCodes')
const cx = require('../lib/classSet.js')
const ipc = global.require('electron').ipcRenderer

const UrlBarSuggestions = require('./urlBarSuggestions.js')

class UrlBar extends ImmutableComponent {
  constructor () {
    super()
    ipc.on('shortcut-focus-url', () => {
      AppActions.setNavBarFocused(true)
      AppActions.setUrlBarAutoselected(true)
    })
    // escape key handling
    ipc.on('shortcut-active-frame-stop', () => {
      this.restore()
      AppActions.setUrlBarAutoselected(true)
      AppActions.setUrlBarActive(true)
    })
  }

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

  // restores the url bar to the current location
  restore () {
    let location = this.props.activeFrameProps.get('location')
    AppActions.setNavBarUserInput(location)
  }

  getSuggestionBox () {
    return ReactDOM.findDOMNode(this.refs.urlBarSuggestions)
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        let location = this.props.urlbar.get('location')
        if (location === null || location.length === 0) {
          this.restore()
          AppActions.setUrlBarAutoselected(true)
        } else {
          // this can't go through AppActions for some reason
          // or the whole window will reload on the first page request
          let selectedIndex = this.refs.urlBarSuggestions.activeIndex
          let suggestionBox = this.getSuggestionBox()
          if (suggestionBox && selectedIndex > 0) {
            // load the selected suggestion
            this.refs.urlBarSuggestions.clickSelected()
          } else {
            AppActions.loadUrl(location)
          }
          this.updateDOMInputFocus(false)
        }
        break
      case KeyCodes.UP:
        if (this.getSuggestionBox()) {
          this.refs.urlBarSuggestions.previousSuggestion()
          e.preventDefault()
        }
        break
      case KeyCodes.DOWN:
        if (this.getSuggestionBox()) {
          this.refs.urlBarSuggestions.nextSuggestion()
          e.preventDefault()
        }
        break
      // escape is handled by ipc shortcut-active-frame-stop event
      default:
        AppActions.setUrlBarAutoselected(false)
        AppActions.setUrlBarActive(true)
    }
  }

  onClick (e) {
    // if the url bar is already selected then clicking in it should make it active
    if (this.isAutoselected()) {
      AppActions.setUrlBarActive(true)
      AppActions.setUrlBarAutoselected(false)
    } else if (!this.isActive()) {
      AppActions.setUrlBarAutoselected(true)
    }
  }

  onMouseUp (e) {
    // if the urlbar is not active then
    // we want to select the text
    // so we prevent the default mouseUp
    // action that will deselect it
    if (this.isAutoselected() === true && this.isActive() === false) {
      e.preventDefault()
    }
  }

  onBlur (e) {
    // if suggestion box is active then keep url bar active
    if (!this.getSuggestionBox()) {
      AppActions.setUrlBarActive(false)
    }
    AppActions.setUrlBarAutoselected(false)
    AppActions.setNavBarFocused(false)
  }

  onChange (e) {
    AppActions.setNavBarUserInput(e.target.value)
  }

  onFocus (e) {
    AppActions.setNavBarFocused(true)
    AppActions.setUrlBarAutoselected(false)
  }

  componentDidUpdate () {
    this.updateDOM()
  }

  componentWillReceiveProps (newProps) {
    let location = newProps.activeFrameProps.get('location')
    let key = newProps.activeFrameProps.get('key')
    // Update the URL bar when switching tabs
    if (key !== this.props.activeFrameProps.get('key')) {
      AppActions.setLocation(location)
    }
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
        onMouseUp={this.onMouseUp.bind(this)}
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
          searchDetail={this.props.searchDetail}
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
