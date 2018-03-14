/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const messages = require('../../../../js/constants/messages')
// const SortableTable = require('../../app/renderer/components/common/sortableTable')

const ipc = window.chrome.ipcRenderer

class HistoryTimeSpent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      ledgerData: Immutable.Map()
    }
    ipc.on(messages.LEDGER_UPDATED, (e, ledgerData) => {
      console.log(ledgerData) // Logs nothing
      this.setState({ ledgerData: Immutable.fromJS(ledgerData) })
    })
    ipc.on(messages.HISTORY_UPDATED, (e, history) => {
      console.log(history) // Logs nothing
    })
  }

  render () {
    const {ledgerData} = this.state
    console.log(ledgerData.toJS()) // is always empty
    return <h1>{ledgerData.size}</h1>
  }
}

module.exports = <HistoryTimeSpent />
