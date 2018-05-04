/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const NavigationButton = require('./navigationButton')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Constants
const messages = require('../../../../../js/constants/messages')

const {theme} = require('../../styles/theme')

class BookmarkButton extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

  onToggleBookmark () {
    if (this.props.bookmarkKey) {
      windowActions.editBookmark(this.props.bookmarkKey, true)
    } else {
      windowActions.onBookmarkAdded(true)
    }
  }

  render () {
    const isBookmarked = !!this.props.bookmarkKey
    return <NavigationButton
      l10nId={this.props.bookmarkKey ? 'removeBookmarkButton' : 'addBookmarkButton'}
      testId={this.props.bookmarkKey ? 'removeBookmarkButton' : 'addBookmarkButton'}
      onClick={this.onToggleBookmark}
      class={css(
        styles.bookmarkButton,
        isBookmarked && styles.bookmarkButton_isBookmarked
      )}
    >

      <svg className={css(styles.bookmarkButton__icon)} xmlns='http://www.w3.org/2000/svg' width='11' viewBox='0 0 11 14'>
        <g fillRule='evenodd'>
          <path d='M9.73517619 12.7646505L5.85338553 9.38605009c-.09731509-.08518367-.24711175-.08518367-.34548174 0L1.62611313 12.7646505c-.1640379.1426761-.42829187.031911-.42829187-.1806526V.94179063c0-.13476425.11472104-.24447448.25607845-.24447448h8.45428107c.14135742 0 .25634218.10971023.25634218.24447448V12.5839979c0 .2125636-.2645177.3233287-.42934677.1806526'/>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.25' d='M9.73517619 12.7646505L5.85338553 9.38605009c-.09731509-.08518367-.24711175-.08518367-.34548174 0L1.62611313 12.7646505c-.1640379.1426761-.42829187.031911-.42829187-.1806526V.94179063c0-.13476425.11472104-.24447448.25607845-.24447448h8.45428107c.14135742 0 .25634218.10971023.25634218.24447448V12.5839979c0 .2125636-.2645177.3233287-.42934677.1806526z'/>
        </g>
      </svg>
    </NavigationButton>
  }
}


const styles = StyleSheet.create({
  bookmarkButton: {
    '--bookmark-icon-line-color': 'var(--icon-line-color)',
    '--bookmark-icon-fill-color': 'transparent',
    '--bookmark-icon-transit-easing': 'ease-out',
    justifyContent: 'flex-start'
  },

  bookmarkButton_isBookmarked: {
    '--bookmark-icon-line-color': '#FB542B',
    '--bookmark-icon-fill-color': '#FB542B',
    '--bookmark-icon-transit-easing': 'ease-in'
  },

  bookmarkButton__icon: {
    width: '11px',
    height: '14px',
    fill: 'var(--bookmark-icon-fill-color)',
    stroke: 'var(--bookmark-icon-line-color)',
    transition: ['fill', 'stroke'].map(prop => `${prop} .12s var(--bookmark-icon-transit-easing)`).join(', '),
    paddingLeft: theme.navigator.icons.spacing,
    paddingTop: '1px'
  }
})

module.exports = BookmarkButton
