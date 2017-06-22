/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const Main = require('./main/main')
const ReduxComponent = require('./reduxComponent')

// Actions
const appActions = require('../../../js/actions/appActions')

// Utils
const cx = require('../../../js/lib/classSet')
const {getPlatformStyles} = require('../../common/lib/platformUtil')

window.appActions = appActions

class Window extends React.Component {
  get classes () {
    let classes = {}
    classes['windowContainer'] = true

    const platformClasses = getPlatformStyles()
    platformClasses.forEach((className) => {
      classes[className] = true
    })

    // Windows puts a 1px border around frameless window
    // For Windows 10, this defaults to blue. When window
    // becomes inactive it needs to change to gray.
    if (classes['win10']) {
      classes['inactive'] = !this.props.isFocused
    }

    return classes
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')

    const props = {}
    props.isFocused = currentWindow.getIn(['ui', 'isFocused'])

    return props
  }

  render () {
    return <div id='windowContainer' className={cx(this.classes)} >
      <Main />
    </div>
  }
}

module.exports = ReduxComponent.connect(Window)
