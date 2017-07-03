/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Utils
const cx = require('../../../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../styles/global')

const stopLoadingButtonIcon = require('../../../../../img/toolbar/stoploading_btn.svg')

class StopButton extends React.Component {
  render () {
    return (
      <button className={cx({
        // TODO: check if iconOnly solves this and if not
        // find a way to remove cx cos cx is evooool :P
        normalizeButton: true,
        [css(styles.navigationButton, styles.navigationButton_stop)]: true
      })}
        data-l10n-id='stopButton'
        onClick={
          /*
          TODO: check if this is ok to ship as-is.
          This is likely not the best way given it is
          expecting the property from parent component but this
          was a quick workaround to avoid dupping code in both navigationbar
          and this component.
          */
          this.props.onStop
        }
      />
    )
  }
}

const styles = StyleSheet.create({
  navigationButton: {
    backgroundColor: globalStyles.color.buttonColor,
    display: 'inline-block',
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0
  },

  navigationButton_stop: {
    background: `url(${stopLoadingButtonIcon}) center no-repeat`,
    backgroundSize: '11px 11px'
  }
})

module.exports = StopButton
