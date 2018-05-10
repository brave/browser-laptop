/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const {subMilliseconds, distanceInWordsStrict} = require('date-fns')
const messages = require('../../../../js/constants/messages')

const ipc = window.chrome.ipcRenderer

class HistoryTimeSpent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      ledgerData: Immutable.Map()
    }
    ipc.on(messages.LEDGER_UPDATED, (e, ledgerData) => {
      this.setState({ledgerData: Immutable.fromJS(ledgerData)})
    })
  }

  renderPublisher = (url, faviconURL) => {
    return <p>
      <img src={faviconURL} width={16} height={16} />
      {url}
    </p>
  }

  renderRow = (row, index) => {
    const {duration, percentage, publisherKey, publisherURL, views, faviconURL} = row.toJS()
    return <tr key={publisherKey}>
      <td>{index + 1}</td>
      <td>
        {this.renderPublisher(publisherURL, faviconURL)}
      </td>
      <td>{views}</td>
      <td>{distanceInWordsStrict(subMilliseconds(new Date(), duration), new Date())}</td>
      <td>{percentage}</td>
    </tr>
  }

  render () {
    const {ledgerData} = this.state
    const synopsis = ledgerData.get('synopsis')
    if (!synopsis || synopsis.size === 0) {
      return <h2>No data available</h2>
    }
    const sortedPublishers = synopsis.sortBy(publisher => publisher.get('score') * -1)

    return <section>
      <h1>Time spent</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Site</th>
            <th>Views</th>
            <th>Time spent</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {sortedPublishers.map(this.renderRow)}
        </tbody>
      </table>
    </section>
  }
}

module.exports = <HistoryTimeSpent />
