/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const tableSort = require('tablesort')
const cx = require('../lib/classSet')
const eventUtil = require('../lib/eventUtil')

tableSort.extend('number', (item) => {
  return typeof item === 'number'
}, (a, b) => {
  a = isNaN(a) ? 0 : a
  b = isNaN(b) ? 0 : b
  return b - a
})

class SortableTable extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
  }
  componentDidMount (event) {
    return tableSort(this.table)
  }
  onClick (e) {
    const targetElement = e.target.parentNode

    if (eventUtil.isForSecondaryAction(e)) {
      if (targetElement.className.includes(' selected')) {
        targetElement.className = targetElement.className.replace(' selected', '')
      } else {
        targetElement.className += ' ' + 'selected'
      }
    } else if (e.shiftKey) {
      const selected = document.querySelectorAll('.selected')
      const targetID = targetElement.id
      const tableEntries = targetElement.parentNode.childNodes
      selected.forEach((entry) => {
        if (entry.id === targetID) {
          if (entry.rowIndex < targetElement.rowIndex) {
            for (let i = entry.rowIndex - 1; i < targetElement.rowIndex; ++i) {
              if (!tableEntries[i].className.includes(' selected')) {
                tableEntries[i].className += ' ' + 'selected'
              }
            }
          } else if (entry.rowIndex > targetElement.rowIndex) {
            for (let i = targetElement.rowIndex - 1; i < entry.rowIndex; ++i) {
              if (!tableEntries[i].className.includes(' selected')) {
                tableEntries[i].className += ' ' + 'selected'
              }
            }
          }
        }
      })
    } else {
      let sameTarget = false
      const selected = document.querySelectorAll('.selected')
      selected.forEach((entry) => {
        entry.className = entry.className.replace(' selected', '')
        if (entry === targetElement) {
          sameTarget = true
        }
      })
      if (!sameTarget) {
        targetElement.className += ' ' + 'selected'
      }
    }
  }
  onContextMenu (e) {
    const selected = document.querySelectorAll('.selected')
    let handlerInputs = []
    selected.forEach((entry) => {
      entry.className = entry.className.replace(' selected', '')
      const tableID = entry.id
      const index = entry.rowIndex - 1
      const handlerInput = this.props.totalRowObjects
        ? (typeof this.props.totalRowObjects[parseInt(tableID)][index].toJS === 'function'
          ? this.props.totalRowObjects[parseInt(tableID)][index].toJS()
          : this.props.totalRowObjects[parseInt(tableID)][index])
        : null
      if (handlerInput) {
        handlerInputs.push(handlerInput)
      }
    })
    if (handlerInputs.length && this.hasContextMenu) {
      if (handlerInputs.length === 1) {
        this.props.onContextMenu(handlerInputs[0], this.props.contextMenuName, e)
      } else {
        this.props.onContextMenu(handlerInputs, this.props.contextMenuName, e)
      }
    }
  }
  get hasClickHandler () {
    return typeof this.props.onClick === 'function'
  }
  get hasColumnClassNames () {
    return this.props.columnClassNames &&
      this.props.columnClassNames.length === this.props.headings.length
  }
  get hasRowClassNames () {
    return this.props.rowClassNames &&
      this.props.rowClassNames.length === this.props.rows.length
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

    return <table className={cx({
      sort: true,
      sortableTable: !this.props.overrideDefaultStyle
    })}
      ref={(node) => { this.table = node }}>
      <thead>
        <tr>
          {this.props.headings.map((heading, j) => {
            const firstEntry = this.props.rows[0][j]
            let dataType = typeof firstEntry
            if (dataType === 'object' && firstEntry.value) {
              dataType = typeof firstEntry.value
            }
            return <th className={cx({
              'sort-header': true,
              'sort-default': heading === this.props.defaultHeading})}
              data-sort-method={dataType === 'number' ? 'number' : undefined}
              data-sort-order={this.props.defaultHeadingSortOrder}>
              <div className='th-inner' data-l10n-id={heading} />
            </th>
          })}
        </tr>
      </thead>
      <tbody>
        {
          this.props.rows.map((row, i) => {
            const entry = row.map((item, j) => {
              const value = typeof item === 'object' ? item.value : item
              const html = typeof item === 'object' ? item.html : item
              const cell = typeof item === 'object' ? item.cell : item

              return <td className={this.hasColumnClassNames ? this.props.columnClassNames[j] : undefined} data-sort={value}>
                {
                  cell || (value === true ? '✕' : html)
                }
              </td>
            })
            const rowAttributes = this.getRowAttributes(row, i)
            return row.length
              ? <tr {...rowAttributes}
                data-context-menu-disable={rowAttributes.onContextMenu ? true : undefined}
                id={this.props.tableID}
                className={this.hasRowClassNames
                  ? this.props.rowClassNames[i] + ' ' + rowAttributes.className
                  : rowAttributes.className} onClick={this.props.multiSelect ? this.onClick : undefined}
                onContextMenu={this.props.multiSelect ? this.onContextMenu : undefined}>{entry}</tr>
              : null
          })
        }
      </tbody>
    </table>
  }
}

module.exports = SortableTable
