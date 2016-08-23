/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const tableSort = require('tablesort')

/**
 * Represents a sortable table with supp
 */

class SortableTable extends ImmutableComponent {
  componentDidMount (event) {
    return tableSort(document.getElementsByClassName('sortableTable')[0])
  }
  get hasClickHandler () {
    return typeof this.props.onClick === 'function'
  }
  get hasColumnClassNames () {
    return this.props.columnClassNames &&
      this.props.columnClassNames.length === this.props.headings.length
  }
  get hasDoubleClickHandler () {
    return typeof this.props.onDoubleClick === 'function'
  }
  get hasContextMenu () {
    return typeof this.props.onContextMenu === 'function' &&
      typeof this.props.contextMenuName === 'string'
  }
  getHandlerInput (rows, index) {
    if (this.props.rowObjects) {
      return typeof this.props.rowObjects[index].toJS === 'function'
        ? this.props.rowObjects[index].toJS()
        : this.props.rowObjects[index]
    }
    return rows[index]
  }
  getRowAttributes (handlerInput, index) {
    const rowAttributes = {}
    if (this.props.addHoverClass) {
      rowAttributes.className = 'rowHover'
    }
    if (this.hasClickHandler) {
      rowAttributes.onClick = this.props.onClick.bind(this, handlerInput)
    }
    if (this.hasDoubleClickHandler) {
      rowAttributes.onDoubleClick = this.props.onDoubleClick.bind(this, handlerInput)
    }
    if (this.hasContextMenu) {
      rowAttributes.onContextMenu = this.props.onContextMenu.bind(this, handlerInput, this.props.contextMenuName)
    }
    return rowAttributes
  }
  render () {
    let headings = []
    let rows = []
    let columnClassNames = []

    if (!this.props.headings || !this.props.rows) {
      return false
    }

    if (this.hasColumnClassNames) {
      this.props.columnClassNames.forEach((className) => columnClassNames.push(className))
    }

    for (let i = 0; i < this.props.rows.length; i++) {
      rows[i] = []
      for (let j = 0; j < this.props.headings.length; j++) {
        headings[j] = headings[j] || <th className='sort-header' data-l10n-id={this.props.headings[j]} />
        rows[i][j] = typeof columnClassNames[j] === 'string'
          ? <td className={columnClassNames[j]} data-sort={this.props.rows[i][j]}>{this.props.rows[i][j] === true ? '✕' : this.props.rows[i][j]}</td>
          : <td data-sort={this.props.rows[i][j]}>{this.props.rows[i][j] === true ? '✕' : this.props.rows[i][j]}</td>
      }

      const handlerInput = this.getHandlerInput(rows, i)
      const rowAttributes = this.getRowAttributes(handlerInput, i)

      rows[i] = rowAttributes.onContextMenu
      ? <tr {...rowAttributes} data-context-menu-disable>{rows[i]}</tr>
      : rows[i] = <tr {...rowAttributes}>{rows[i]}</tr>
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
  rows: React.PropTypes.array.isRequired,
  columnClassNames: React.PropTypes.array,
  addHoverClass: React.PropTypes.bool,
  contextMenuName: React.PropTypes.string
}

module.exports = SortableTable
