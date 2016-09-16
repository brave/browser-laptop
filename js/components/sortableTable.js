/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const tableSort = require('tablesort')
const cx = require('../lib/classSet')

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
  getRowAttributes (row, index) {
    const rowAttributes = {}
    const handlerInput = this.props.rowObjects
      ? (typeof this.props.rowObjects[index].toJS === 'function'
        ? this.props.rowObjects[index].toJS()
        : this.props.rowObjects[index])
      : row

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
    if (!this.props.headings || !this.props.rows) {
      return false
    }

    return <table className='sortableTable sort'>
      <thead>
        <tr>
          {this.props.headings.map((heading) => <th className={cx({
            'sort-header': true,
            'sort-default': heading === this.props.defaultHeading
          })}
            data-l10n-id={heading}
            data-sort-order={this.props.defaultHeadingSortOrder} />)}
        </tr>
      </thead>
      <tbody>
        {
          this.props.rows.map((row, i) => {
            const entry = row.map((item, j) => {
              const value = typeof item === 'object' ? item.value : item
              const html = typeof item === 'object' ? item.html : item
              return <td className={this.hasColumnClassNames ? this.props.columnClassNames[j] : undefined} data-sort={value}>
                {value === true ? '✕' : html}
              </td>
            })
            const rowAttributes = this.getRowAttributes(row, i)
            return rowAttributes.onContextMenu
              ? <tr {...rowAttributes} data-context-menu-disable>{entry}</tr>
              : <tr {...rowAttributes}>{entry}</tr>
          })
        }
      </tbody>
    </table>
  }
}

SortableTable.defaultProps = {
  headings: React.PropTypes.array.isRequired, // list of data-10n-id's
  rows: React.PropTypes.array.isRequired, // value or {html: <displayed_html>, value: <value_to_sort_by>} for each table entry
  columnClassNames: React.PropTypes.array,
  addHoverClass: React.PropTypes.bool,
  contextMenuName: React.PropTypes.string
}

module.exports = SortableTable
