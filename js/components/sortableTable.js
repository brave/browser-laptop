/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const tableSort = require('tableSort')

/**
 * Represents a sortable table with supp
 */

class SortableTable extends ImmutableComponent {
  componentDidMount (event) {
    return tableSort(document.getElementsByClassName('sortableTable')[0])
  }
  render () {
    var headings = []
    var rows = []
    if (!this.props.headings || !this.props.rows) {
      return false
    }
    for (let i = 0; i < this.props.rows.length; i++) {
      rows[i] = []
      for (let j = 0; j < this.props.headings.length; j++) {
        headings[j] = headings[j] || <th className='sort-header' data-l10n-id={this.props.headings[j]} />
        rows[i][j] = <td data-sort={this.props.rows[i][j]}>{this.props.rows[i][j] === true ? '✕' : this.props.rows[i][j]}</td>
      }
      rows[i] = <tr>{rows[i]}</tr>
    }
    return <table className='sortableTable sort'>
      <thead>
        <tr>
          {headings}
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  }
}

SortableTable.defaultProps = {
  headings: React.PropTypes.array.isRequired,
  rows: React.PropTypes.array.isRequired
}

module.exports = SortableTable
