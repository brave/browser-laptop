/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')

const cx = require('../lib/classSet')
const Button = require('./button')
const UrlBar = require('./urlBar')
const windowActions = require('../actions/windowActions')
const siteTags = require('../constants/siteTags')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const ipc = global.require('electron').ipcRenderer
const {isSourceAboutUrl} = require('../lib/appUrlUtil')
const siteUtil = require('../state/siteUtil')
const eventUtil = require('../lib/eventUtil')
const getSetting = require('../settings').getSetting
const windowStore = require('../stores/windowStore')

class NavigationBar extends ImmutableComponent {
  constructor () {
    super()
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
    this.onStop = this.onStop.bind(this)
    this.onReload = this.onReload.bind(this)
    this.onNoScript = this.onNoScript.bind(this)
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  get loading () {
    return this.props.activeFrameKey !== undefined && this.props.loading
  }

  onToggleBookmark () {
    // trigger the AddEditBookmark modal; saving/deleting takes place there
    const siteDetail = siteUtil.getDetailFromFrame(this.activeFrame, siteTags.BOOKMARK)
    windowActions.setBookmarkDetail(siteDetail, siteDetail)
  }

  onReload (e) {
    if (eventUtil.isForSecondaryAction(e)) {
      ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_CLONE, {}, { openInForeground: !!e.shiftKey })
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
    return this.props.activeFrameKey !== undefined &&
      siteUtil.isSiteBookmarked(this.props.sites, Immutable.fromJS({
        location: this.props.location,
        partitionNumber: this.props.partitionNumber,
        title: this.props.title
      }))
  }

  get titleMode () {
    return this.props.mouseInTitlebar === false &&
      this.props.title &&
      !['about:blank', 'about:newtab'].includes(this.props.location) &&
      !this.loading &&
      !this.props.navbar.getIn(['urlbar', 'focused']) &&
      !this.props.navbar.getIn(['urlbar', 'active']) &&
      getSetting(settings.DISABLE_TITLE_MODE) === false
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

  get showNoScriptInfo () {
    return this.props.enableNoScript && this.props.scriptsBlocked && this.props.scriptsBlocked.size
  }

  onNoScript () {
    windowActions.setNoScriptVisible(!this.props.noScriptIsVisible)
  }

  componentDidUpdate (prevProps) {
    if (this.props.noScriptIsVisible && !this.showNoScriptInfo) {
      // There are no blocked scripts, so hide the noscript dialog.
      windowActions.setNoScriptVisible(false)
    }
  }

  render () {
    if (this.props.activeFrameKey === undefined) {
      return null
    }

    return <div id='navigator'
      ref='navigator'
      data-frame-key={this.props.activeFrameKey}
      className={cx({
        titleMode: this.titleMode
      })}>
      <div className='startButtons'>
        {
          isSourceAboutUrl(this.props.location) || this.titleMode
          ? <span className='browserButton' />
          : this.loading
            ? <Button iconClass='fa-times'
              l10nId='stopButton'
              className='navbutton stop-button'
              onClick={this.onStop} />
            : <Button iconClass='fa-repeat'
              l10nId='reloadButton'
              className='navbutton reload-button'
              onClick={this.onReload} />
        }
        {
          !this.titleMode && getSetting(settings.SHOW_HOME_BUTTON)
          ? <Button iconClass='fa-home'
            l10nId='homeButton'
            className='navbutton homeButton'
            onClick={this.onHome} />
          : null
        }
      </div>
      <UrlBar ref='urlBar'
        sites={this.props.sites}
        activeFrameKey={this.props.activeFrameKey}
        searchDetail={this.props.searchDetail}
        loading={this.loading}
        location={this.props.location}
        suggestionIndex={this.props.suggestionIndex}
        title={this.props.title}
        history={this.props.history}
        isSecure={this.props.isSecure}
        locationValueSuffix={this.props.locationValueSuffix}
        startLoadTime={this.props.startLoadTime}
        endLoadTime={this.props.endLoadTime}
        titleMode={this.titleMode}
        urlbar={this.props.navbar.get('urlbar')}
        />
      {
        isSourceAboutUrl(this.props.location)
        ? <div className='endButtons'>
          <span className='browserButton' />
        </div>
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
          <Button iconClass={this.bookmarked ? 'fa-star' : 'fa-star-o'}
            className={cx({
              navbutton: true,
              bookmarkButton: true,
              removeBookmarkButton: this.bookmarked
            })}
            l10nId={this.bookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
            onClick={this.onToggleBookmark} />
        </div>
      }
    </div>
  }
}

module.exports = NavigationBar
