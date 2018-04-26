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
const appActions = require('../../../../../js/actions/appActions')

// Constants
const messages = require('../../../../../js/constants/messages')

// Utils
const contextMenus = require('../../../../../js/contextMenus')
const eventUtil = require('../../../../../js/lib/eventUtil')

class ReloadButton extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onReload = this.onReload.bind(this)
    this.onReloadLongPress = this.onReloadLongPress.bind(this)
  }

  onReload (e) {
    if (eventUtil.isForSecondaryAction(e)) {
      appActions.tabCloned(this.props.activeTabId, {active: !!e.shiftKey})
    } else {
      ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
    }
  }

  onReloadLongPress (target) {
    contextMenus.onReloadContextMenu(target)
  }

  render () {
    return <NavigationButton
      l10nId='reloadButton'
      testId='reloadButton'
      class={css(styles.reloadButton)}
      onClick={this.onReload}
      onLongPress={this.onReloadLongPress}>

      <svg className={css(styles.reloadButton__icon)} xmlns='http://www.w3.org/2000/svg' width='17' height='15' viewBox='0 0 17 15'>
        <g fill='none' fillRule='evenodd'>
          <path className={css(styles.reloadButton__icon__circle)} strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.25'
            d='M11.5573565 12.7856102C10.464 13.5506271 9.12285217 14.001 7.67408697 14.001h-.00904349C3.98434783 14.001 1 11.0934068 1 7.50540677v-.00793221C1 3.90947458 3.98434783 1.001 7.66504348 1.001h.00904349c2.5303652 0 4.39241733 1.37491525 5.52194783 3.39938983L14 6.39930509'
          />
          <path className={css(styles.reloadButton__icon__ball)} fillRule='nonzero' d='M16.275 6.851c0-1.0764-.8736-1.95-1.95-1.95s-1.95.8736-1.95 1.95c0 1.077375.8736 1.95 1.95 1.95s1.95-.872625 1.95-1.95z'
          />
        </g>
      </svg>

    </NavigationButton>
  }
}

const styles = StyleSheet.create({
  reloadButton: {

  },

  reloadButton__icon: {

  },

  // main circle of icon
  reloadButton__icon__circle: {
    stroke: 'var(--icon-line-color)'
  },
  // ball is at end of circle
  reloadButton__icon__ball: {
    fill: 'var(--icon-line-color)'
  }
})

module.exports = ReloadButton
