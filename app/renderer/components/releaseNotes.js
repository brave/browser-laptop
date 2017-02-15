/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const Dialog = require('../../../js/components/dialog')
const {StyleSheet, css} = require('aphrodite')
const commonStyles = require('./styles/commonStyles')

class ReleaseNotes extends ImmutableComponent {
  onClick (e) {
    e.stopPropagation()
  }
  render () {
    const className = css(
      commonStyles.flyoutDialog,
      styles.releaseNotes
    )

    return <Dialog onHide={this.props.onHide} isClickDismiss>
      <div className={className} onClick={this.onClick.bind(this)}>
        <h1 className={css(styles.header)}>{this.props.metadata.get('name')}</h1>
        <div>{this.props.metadata.get('notes')}</div>
      </div>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  releaseNotes: {
    width: 'auto',
    maxWidth: '350px',
    textAlign: 'left'
  },

  header: {
    marginBottom: '10px'
  }
})

module.exports = ReleaseNotes
