/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')

const cx = require('../lib/classSet.js')
const Button = require('./button')
const UrlBar = require('./urlBar')
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const {isSiteInList} = require('../state/siteUtil')
const siteTags = require('../constants/siteTags')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const ipc = global.require('electron').ipcRenderer
const { isSourceAboutUrl } = require('../lib/appUrlUtil')
const siteUtil = require('../state/siteUtil')
const eventUtil = require('../lib/eventUtil')
const getSetting = require('../settings').getSetting

class NavigationBar extends ImmutableComponent {
  constructor () {
    super()
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
    this.onStop = this.onStop.bind(this)
    this.onReload = this.onReload.bind(this)
    this.onNoScript = this.onNoScript.bind(this)
  }

  get loading () {
    return this.props.activeFrame &&
      this.props.activeFrame.get('loading')
  }

  onToggleBookmark (isBookmarked) {
    const siteDetail = siteUtil.getDetailFromFrame(this.props.activeFrame, siteTags.BOOKMARK)
    if (!isBookmarked) {
      appActions.addSite(siteDetail, siteTags.BOOKMARK)
    }
    windowActions.setBookmarkDetail(siteDetail)
  }

  onReload (e) {
    if (eventUtil.isForSecondaryAction(e)) {
      windowActions.cloneFrame(this.props.activeFrame)
    } else {
      ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
    }
  }

  onHome () {
    getSetting(settings.HOMEPAGE).split('|')
      .forEach((homepage, i) => {
        ipc.emit(i === 0 ? messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL : messages.SHORTCUT_NEW_FRAME, {}, homepage)
      })
  }

  onStop () {
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_STOP)
  }

  get bookmarked () {
    return this.props.activeFrame &&
      isSiteInList(this.props.sites, Immutable.fromJS({
        location: this.props.activeFrame.get('location'),
        partitionNumber: this.props.activeFrame.get('partitionNumber'),
        title: this.props.activeFrame.get('title')
      }), siteTags.BOOKMARK)
  }

  get titleMode () {
    return this.props.mouseInTitlebar === false &&
      this.props.activeFrame.get('title') &&
      !['about:blank', 'about:newtab'].includes(this.props.activeFrame.get('location')) &&
      !this.loading &&
      !this.props.navbar.getIn(['urlbar', 'focused']) &&
      !this.props.navbar.getIn(['urlbar', 'active']) &&
      getSetting(settings.DISABLE_TITLE_MODE) === false
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark(false))
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark(true))
  }

  get showNoScriptInfo () {
    const scriptsBlocked = this.props.activeFrame.getIn(['noScript', 'blocked'])
    return this.props.enableNoScript && scriptsBlocked && scriptsBlocked.size
  }

  onNoScript () {
    windowActions.setNoScriptVisible(!this.props.noScriptIsVisible)
  }

  componentDidUpdate (prevProps) {
    // Update the app menu to reflect whether the current page is bookmarked
    const prevBookmarked = prevProps.activeFrame &&
      isSiteInList(prevProps.sites, Immutable.fromJS({
        location: prevProps.activeFrame.get('location'),
        partitionNumber: this.props.activeFrame.get('partitionNumber'),
        title: this.props.activeFrame.get('title')
      }), siteTags.BOOKMARK)
    if (this.bookmarked !== prevBookmarked) {
      ipc.send(messages.UPDATE_APP_MENU, {bookmarked: this.bookmarked})
    }
    if (this.props.noScriptIsVisible && !this.showNoScriptInfo) {
      // There are no blocked scripts, so hide the noscript dialog.
      windowActions.setNoScriptVisible(false)
    }
  }

  render () {
    const frameProps = this.props.activeFrame
    if (!frameProps) {
      return null
    }

    return <div id='navigator'
      ref='navigator'
      data-frame-key={frameProps.get('key')}
      className={cx({
        titleMode: this.titleMode
      })}>
      {
        isSourceAboutUrl(frameProps.get('location')) || this.titleMode
        ? null
        : <div className='startButtons'>
        {
          this.loading
          ? <Button iconClass='fa-times'
            l10nId='reloadButton'
            className='navbutton stop-button'
            onClick={this.onStop} />
          : <Button iconClass='fa-repeat'
            l10nId='reloadButton'
            className='navbutton reload-button'
            onClick={this.onReload} />
        }
        </div>
      }
      {
        !this.titleMode && getSetting(settings.SHOW_HOME_BUTTON)
        ? <Button iconClass='fa-home'
          l10nId='homeButton'
          className='navbutton homeButton'
          onClick={this.onHome} />
        : null
      }
      <UrlBar ref='urlBar'
        sites={this.props.sites}
        activeFrameProps={frameProps}
        searchDetail={this.props.searchDetail}
        frames={this.props.frames}
        loading={this.loading}
        titleMode={this.titleMode}
        urlbar={this.props.navbar.get('urlbar')}
        />
      {
        isSourceAboutUrl(frameProps.get('location'))
        ? null
        : <div className='endButtons'>
          {
            !this.showNoScriptInfo
            ? null
            : <Button iconClass='fa-ban'
              l10nId='noScriptButton'
              className={cx({
                'noScript': true
              })}
              onClick={this.onNoScript} />
          }
          <Button iconClass={this.titleMode ? 'fa-star' : 'fa-star-o'}
            className={cx({
              navbutton: true,
              bookmarkButton: true,
              removeBookmarkButton: this.bookmarked
            })}
            l10nId={this.bookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
            onClick={() => this.onToggleBookmark(this.bookmarked)} />
        </div>
      }
    </div>
  }
}

module.exports = NavigationBar
