/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlResolve = require('url').resolve
const {StyleSheet, css} = require('aphrodite/no-important')
const ImmutableComponent = require('../immutableComponent')

class FullScreenWarning extends ImmutableComponent {
  render () {
    const l10nArgs = {
      host: urlResolve(this.props.location, '/')
    }
    return <div className={css(styles.fullScreenModeWarning)}
      data-l10n-id='fullScreenModeWarning'
      data-l10n-args={JSON.stringify(l10nArgs)} />
  }
}

const styles = StyleSheet.create({
  fullScreenModeWarning: {
    background: '#3a3a3a',
    color: 'white',
    fontSize: 'larger',
    left: 0,
    right: 0,
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '20px',
    position: 'absolute',
    textAlign: 'center',
    zIndex: 30
  }
})

module.exports = FullScreenWarning
