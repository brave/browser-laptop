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
      this.focus()
    })
    ipc.on('shortcut-stop', () => {
      this.blur()
    })
  }

  focus () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.focus()
  }

  select () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.focus()
    urlInput.select()
  }

  blur () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.blur()
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        AppActions.loadUrl(this.props.urlbar.get('location'))
        this.blur()
        break
      case KeyCodes.ESC:
        e.preventDefault()
        this.blur()
        break
    }
  }

  onBlur (e) {
    AppActions.setNavBarFocused(false)
  }

  onChange (e) {
    AppActions.setNavBarInput(e.target.value)
  }

  onFocus (e) {
    this.select()
    AppActions.setNavBarFocused(true)
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
          previewActiveIndex={this.props.previewActiveIndex || 0} />
      </form>
  }
}

module.exports = UrlBar
