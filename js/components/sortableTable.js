/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
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
    // Work backwards until element is TR
    let targetElement = e.target
    while (targetElement) {
      if (targetElement.tagName === 'TR') break
      targetElement = targetElement.parentNode
    }
    if (!targetElement) return

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
        : (this.props.rowObjects.size > 0 || this.props.rowObjects.length > 0)
          ? (typeof this.props.rowObjects.toJS === 'function'
            ? this.props.rowObjects.get(index).toJS()
            : this.props.rowObjects[index])
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
  get hasContextMenu () {
    return typeof this.props.onContextMenu === 'function' &&
      typeof this.props.contextMenuName === 'string'
  }
  get sortingDisabled () {
    if (typeof this.props.sortingDisabled === 'boolean') {
      return this.props.sortingDisabled
    }
    return false
  }
  getRowAttributes (row, index) {
    const rowAttributes = {}
    const handlerInput = this.props.rowObjects &&
      (this.props.rowObjects.size > 0 || this.props.rowObjects.length > 0)
      ? (typeof this.props.rowObjects.toJS === 'function'
        ? this.props.rowObjects.get(index).toJS()
        : this.props.rowObjects[index])
      : row

    if (this.props.addHoverClass) {
      rowAttributes.className = 'rowHover'
    }
    if (this.hasContextMenu) {
      rowAttributes.onContextMenu = this.props.onContextMenu.bind(this, handlerInput, this.props.contextMenuName)
    }
    // Bindings for row-specific event handlers
    if (typeof this.props.onClick === 'function') {
      rowAttributes.onClick = this.props.onClick.bind(this, handlerInput)
    }
    if (typeof this.props.onDoubleClick === 'function') {
      rowAttributes.onDoubleClick = this.props.onDoubleClick.bind(this, handlerInput)
    }
    if (typeof this.props.onDragStart === 'function') {
      rowAttributes.onDragStart = this.props.onDragStart.bind(this, Immutable.fromJS(handlerInput))
      rowAttributes.draggable = true
    }
    if (typeof this.props.onDragOver === 'function') {
      rowAttributes.onDragOver = this.props.onDragOver.bind(this, Immutable.fromJS(handlerInput))
      rowAttributes.draggable = true
    }
    if (typeof this.props.onDrop === 'function') {
      rowAttributes.onDrop = this.props.onDrop.bind(this, Immutable.fromJS(handlerInput))
      rowAttributes.draggable = true
    }
    return rowAttributes
  }
  render () {
    if (!this.props.headings || !this.props.rows) {
      return false
    }
    return <table className={cx({
      sort: !this.sortingDisabled,
      sortableTable: !this.props.overrideDefaultStyle
    })}
      ref={(node) => { this.table = node }}>
      <thead>
        <tr>
          {this.props.headings.map((heading, j) => {
            const firstEntry = this.props.rows.length > 0
              ? this.props.rows[0][j]
              : undefined
            let dataType = typeof firstEntry
            if (dataType === 'object' && firstEntry.value) {
              dataType = typeof firstEntry.value
            }
            return <th className={cx({
              'sort-header': true,
              'sort-default': this.sortingDisabled || heading === this.props.defaultHeading})}
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
            const rowAttributes = row.length
              ? this.getRowAttributes(row, i)
              : null
            return row.length
              ? <tr {...rowAttributes}
                data-context-menu-disable={rowAttributes.onContextMenu ? true : undefined}
                id={this.props.tableID}
                className={
                  (this.hasRowClassNames
                  ? this.props.rowClassNames[i] + ' ' + rowAttributes.className
                  : rowAttributes.className) +
                  (this.sortingDisabled ? ' no-sort' : '')
                }
                onClick={this.props.multiSelect ? this.onClick : rowAttributes.onClick}
                onContextMenu={this.props.multiSelect ? this.onContextMenu : rowAttributes.onContextMenu}>{entry}</tr>
              : null
          })
        }
      </tbody>
    </table>
  }
}

module.exports = SortableTable
