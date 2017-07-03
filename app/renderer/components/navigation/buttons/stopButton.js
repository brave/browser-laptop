/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet} = require('aphrodite/no-important')
const {NormalizedButton} = require('../../common/browserButton')

const stopLoadingButtonIcon = require('../../../../../img/toolbar/stoploading_btn.svg')

class StopButton extends React.Component {
  // BEM Level: navigationBar__buttonContainer
  render () {
    return <NormalizedButton custom={[
      styles.navigationButton,
      styles.navigationButton_stop
    ]}
      l10nid='stopButton'
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
  }
}

const styles = StyleSheet.create({
  navigationButton: {
    display: 'inline-block',
    width: '100%',
    height: '100%',

    // cf: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L584-L585
    margin: 0,
    padding: 0
  },

  navigationButton_stop: {
    background: `url(${stopLoadingButtonIcon}) center no-repeat`,
    backgroundSize: '11px 11px'
  }
})

module.exports = StopButton
