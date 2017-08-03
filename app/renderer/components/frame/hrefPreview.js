/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')

// Utils
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const cx = require('../../../../js/lib/classSet')

class HrefPreview extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey) || Immutable.Map()

    const props = {}
    // used in renderer
    props.frameKey = ownProps.frameKey
    props.hrefPreview = frame.get('hrefPreview')
    props.showOnRight = frame.get('showOnRight')

    return props
  }

  render () {
    if (!this.props.hrefPreview) {
      return null
    }

    return <div
      className={cx({
        hrefPreview: true,
        right: this.props.showOnRight
      })}
    >
      {this.props.hrefPreview}
    </div>
  }
}

module.exports = ReduxComponent.connect(HrefPreview)
