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
      this.select()
    })
    // escape key handling
    ipc.on('shortcut-stop', () => {
      this.restore()
      this.select()
    })
  }

  focus () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.focus()
  }

  select () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.select()
  }

  blur () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.blur()
  }

  restore () {
    let location = this.props.activeFrameProps.get('location')
    AppActions.setNavBarUserInput(location)
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        AppActions.loadUrl(this.props.urlbar.get('location'))
        AppActions.setUrlBarActive(false)
        this.blur()
        break
      // escape is handled by ipc shortcut-stop event
      default:
        AppActions.setUrlBarActive(true)
    }
  }

  onBlur (e) {
    AppActions.setNavBarFocused(false)
  }

  onChange (e) {
    AppActions.setNavBarUserInput(e.target.value)
  }

  onFocus (e) {
    this.select()
    AppActions.setNavBarFocused(true)
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
