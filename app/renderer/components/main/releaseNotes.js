/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const FlyoutDialog = require('../common/flyoutDialog')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

class ReleaseNotes extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }

  onClick (e) {
    e.stopPropagation()
  }

  onHide () {
    windowActions.setReleaseNotesVisible(false)
  }

  mergeProps (state, ownProps) {
    const metadata = state.getIn(['updates', 'metadata'], Immutable.Map())

    const props = {}
    props.name = metadata.get('name')
    props.notes = metadata.get('notes')

    return props
  }

  render () {
    return <Dialog onHide={this.onHide} isClickDismiss>
      <FlyoutDialog className={styles.releaseNotes} onClick={this.onClick}>
        <h1 className={css(styles.header)}>{this.props.name}</h1>
        <div>{this.props.notes}</div>
      </FlyoutDialog>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  releaseNotes: {
    width: 'auto',
    maxWidth: '350px',
    textAlign: 'left',
    overflowY: 'auto'
  },

  header: {
    marginBottom: '10px'
  }
})

module.exports = ReduxComponent.connect(ReleaseNotes)
