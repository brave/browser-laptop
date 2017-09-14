/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

class FlyoutDialog extends ImmutableComponent {
  render () {
    return <div
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
      onKeyDown={this.props.onKeyDown}
      onClick={this.props.onClick}
      className={css(styles.flyoutDialog, this.props.custom)}
    >
      {this.props.children}
    </div>
  }
}

const styles = StyleSheet.create({
  flyoutDialog: {
    background: globalStyles.color.toolbarBackground,
    borderRadius: globalStyles.radius.borderRadius,
    boxShadow: globalStyles.shadow.flyoutDialogBoxShadow,
    color: '#000',
    fontSize: '13px',

    // Issue #7949
    padding: `${globalStyles.spacing.dialogInsideMargin} 30px`,
    position: 'absolute',
    top: globalStyles.spacing.dialogTopOffset,

    // Issue #7930
    boxSizing: 'border-box',
    maxWidth: '600px',
    maxHeight: `calc(80vh - ${globalStyles.spacing.downloadsBarHeight})`
  }
})

module.exports = FlyoutDialog
