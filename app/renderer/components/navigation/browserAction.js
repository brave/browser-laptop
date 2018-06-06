/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const electron = require('electron')
const ipc = electron.ipcRenderer
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const NavigationButton = require('./buttons/navigationButton')
const BrowserActionBadge = require('./browserActionBadge')

// State
const extensionState = require('../../../common/state/extensionState')
const tabState = require('../../../common/state/tabState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

class BrowserAction extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }

  onClick (e) {
    if (/^chrome-extension/.test(this.props.popupWindowSrc)) {
      windowActions.setPopupWindowDetail()
      return
    }
    let centerX
    let centerY
    if (!e.nativeEvent.x || !e.nativeEvent.y) {
      // Handles case where user focuses button, and presses Enter
      let { top: offsetTop, left: offsetLeft } = e.target.getBoundingClientRect()
      centerX = offsetLeft + (e.target.offsetWidth * 0.5)
      centerY = offsetTop + (e.target.offsetHeight * 0.5)
    }
    let props = {
      x: e.nativeEvent.x || centerX,
      y: e.nativeEvent.y || centerY,
      screenX: e.nativeEvent.screenX,
      screenY: e.nativeEvent.screenY,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY
    }
    ipc.send('chrome-browser-action-clicked', this.props.extensionId, this.props.activeTabId, this.props.title, props)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    let browserActions = extensionState.getBrowserActionByTabId(state, ownProps.extensionId, activeTabId) || Immutable.Map()
    let tabAction = browserActions.getIn(['tabs', activeTabId.toString()])

    if (tabAction) {
      browserActions = browserActions.merge(tabAction)
    }

    const props = {}
    // used in renderer
    props.extensionId = ownProps.extensionId
    props.title = browserActions.get('title')
    props.text = browserActions.get('text')
    props.color = browserActions.get('color')
    props.image = extensionState.browserActionBackgroundImage(browserActions, activeTabId)

    // used in other functions
    props.popupWindowSrc = currentWindow.getIn(['popupWindowDetail', 'src'])
    props.activeTabId = activeTabId

    return props
  }

  render () {
    console.log(this.props.image)
    return <div className={css(styles.browserActionButton)}>
      <NavigationButton
        l10nId='browserActionButton'
        testId={`extensionBrowserAction ${this.props.extensionId}`}
        l10nArgs={{ name: this.props.title }}
        onClick={this.onClick}
        styles={
          styles.browserActionButton__button
        }
      >
        <div
          className={css(
            styles.browserActionButton__icon
          )}
          style={{
            '--browser-action-image': this.props.image
          }}
        />
      </NavigationButton>
      {
        this.props.text
        ? <BrowserActionBadge text={this.props.text} color={this.props.color} />
        : null
      }
    </div>
  }
}

module.exports = ReduxComponent.connect(BrowserAction)

const styles = StyleSheet.create({
  browserActionButton: {
    position: 'relative',
    marginRight: '5px',
    display: 'flex',
    alignItems: 'center'
  },

  browserActionButton__button: {
    display: 'block',
    width: '22px',
    height: '100%',
    margin: 0
  },

  browserActionButton__icon: {
    height: '100%',
    width: '100%',
    backgroundImage: 'var(--browser-action-image)',
    backgroundPosition: 'center',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat'
  }
})
