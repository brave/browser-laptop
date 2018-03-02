/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const format = require('date-fns/format')
const {StyleSheet, css} = require('aphrodite/no-important')
const ipc = window.chrome.ipcRenderer

// Constants
const messages = require('../../../../js/constants/messages')

class PrintKeys extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      passphrase: ''
    }

    ipc.on(messages.PRINTKEYS_UPDATED, (e, detail) => {
      if (detail) {
        this.setState({
          passphrase: detail && detail.passphrase
        })
      }
    })
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.passphrase !== this.state.passphrase) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }

  render () {
    const date = format(new Date(), 'MM/DD/YYYY')

    return <div className={css(styles.content)}>
      <div data-l10n-id='ledgerBackupText1' />
      <div>
        <span data-l10n-id='ledgerBackupText2' /> {date}
      </div>
      <br />
      <div>
        <span data-l10n-id='ledgerBackupText4' /> <b>{this.state.passphrase}</b>
      </div>
      <br />
      <div data-l10n-id='ledgerBackupText5' />
    </div>
  }
}

const styles = StyleSheet.create({
  content: {
    fontWeight: '400',
    color: '#3b3b3b',
    fontSize: '16px'
  }
})

module.exports = <PrintKeys />
