/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

const cx = require('../lib/classSet.js')
const Button = require('./button')
const UrlBar = require('./urlBar')
const AppActions = require('../actions/appActions')
const {isSiteInList} = require('../state/siteUtil')
const SiteTags = require('../constants/siteTags')

class NavigationBar extends ImmutableComponent {

  get loading () {
    return this.props.activeFrame &&
      this.props.activeFrame.get('loading')
  }

  onAddBookmark () {
    AppActions.addSite(this.props.activeFrame, SiteTags.BOOKMARK)
  }

  onRemoveBookmark () {
    AppActions.removeSite(this.props.activeFrame, SiteTags.BOOKMARK)
  }

  onBraveMenu () {
    // TODO
  }

  onReload () {
    process.emit('reload-active-frame')
  }

  onStop () {
    process.emit('stop-active-frame')
  }

  get bookmarked () {
    return this.props.activeFrame &&
      isSiteInList(this.props.sites, this.props.activeFrame.get('location'), SiteTags.BOOKMARK)
  }

  render () {
    let frameProps = this.props.activeFrame
    if (!frameProps) {
      return null
    }

    return <div id='navigator'
        ref='navigator'
        className={cx({
          loading: this.loading,
          bookmarked: this.bookmarked
        })}>
      <div className='startButtons'>
        <Button iconClass='fa-repeat'
          className='navbutton reload-button'
          onClick={this.onReload.bind(this)} />
        <Button iconClass='fa-times'
          className='navbutton stop-button'
          onClick={this.onStop.bind(this)} />
      </div>
      <UrlBar ref='urlBar'
        sites={this.props.sites}
        activeFrameProps={frameProps}
        searchDetail={this.props.searchDetail}
        searchSuggestions={this.props.searchSuggestions}
        frames={this.props.frames}
        focused={this.props.focused}
        urlbar={this.props.navbar.get('urlbar')}
        />
      <div className='endButtons'>
        <Button iconClass='fa-star'
          className='navbutton bookmark-button'
          onClick={this.onAddBookmark.bind(this)} />
        <Button iconClass='fa-star'
          className='navbutton remove-bookmark-button'
          onClick={this.onRemoveBookmark.bind(this)} />
        <Button iconClass='fa-shield'
          className='navbutton brave-menu'
          onClick={this.onBraveMenu.bind(this)} />
      </div>
    </div>
  }
}

module.exports = NavigationBar
