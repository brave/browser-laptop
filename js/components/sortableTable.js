/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const tableSort = require('tablesort')
const cx = require('../lib/classSet')
const eventUtil = require('../lib/eventUtil')
const cursorMultiCopyPages = require('../../img/cursor_multi_copy_pages.svg')

tableSort.extend('number', (item) => {
  return typeof item === 'number'
}, (a, b) => {
  a = isNaN(a) ? 0 : a
  b = isNaN(b) ? 0 : b
  return b - a
})

class SortableTable extends React.Component {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onTableDragStart = this.onTableDragStart.bind(this)
    this.state = {
      selection: Immutable.Set()
    }
  }
  componentDidMount (event) {
    return tableSort(this.table)
  }
  /**
   * If you want multi-select to span multiple tables, you can
   * provide a single React.Component as the state owner.
   * NOTE: The state owner must have a state.selection property available.
   * (ignored unless multi-select is specified)
   */
  get stateOwner () {
    return this.props.multiSelect
      ? this.props.stateOwner
        ? this.props.stateOwner
        : this
      : this
  }
  get nullSelection () {
    return this.props.multiSelect
      ? this.stateOwner.state.selection.size === 0
      : false
  }
  get multipleItemsSelected () {
    return this.props.multiSelect
      ? this.stateOwner.state.selection.size > 1
      : false
  }
  /**
   * If multi-select spans multiple tables (ex: it has a state owner),
   * tableID must be unique between all tables for which that state is bound.
   * (ignored unless multi-select and state owner are specified)
   */
  get tableID () {
    return this.props.multiSelect && this.props.stateOwner
      ? this.props.tableID || 0
      : 0
  }
  /**
   * Creates a multi-table-safe index using the tableID.
   */
  getGlobalIndex (index) {
    return this.tableID + '-' + index
  }
  /**
   * [CmdOrCtrl + click] selection can span multiple tables.
   * (ignored unless multi-select is specified)
   */
  processControlClick (index) {
    const globalIndex = this.getGlobalIndex(index)
    this.stateOwner.setState({
      selection: this.stateOwner.state.selection.includes(globalIndex)
        ? this.stateOwner.state.selection.delete(globalIndex)
        : this.stateOwner.state.selection.add(globalIndex)
    })
  }
  /**
   * [Shift + click] can only multi-select within the same table.
   */
  processShiftClick (index) {
    let newSelection = Immutable.Set()
    this.stateOwner.state.selection.forEach((globalIndex) => {
      const tableParts = globalIndex.split('-')
      const tableID = parseInt(tableParts[0])
      const rowIndex = parseInt(tableParts[1])
      if (tableID === this.tableID) {
        let startIndex
        let endIndex
        if (rowIndex < index) {
          startIndex = rowIndex
          endIndex = index
        } else if (rowIndex > index) {
          startIndex = index
          endIndex = rowIndex
        } else {
          return
        }
        for (let i = startIndex; i <= endIndex; ++i) {
          newSelection = newSelection.add(this.getGlobalIndex(i))
        }
      }
    })
    this.stateOwner.setState({
      selection: newSelection
    })
  }
  /**
   * Regular click (clear selection and toggle the value if already set).
   * (ignored unless multi-select is specified)
   */
  processClick (index) {
    const globalIndex = this.getGlobalIndex(index)
    this.stateOwner.setState({
      selection: this.stateOwner.state.selection.includes(globalIndex)
      ? Immutable.Set()
      : Immutable.Set().add(globalIndex)
    })
  }
  /**
   * Clear all selected items.
   * (ignored unless multi-select is specified)
   */
  clearSelection () {
    this.stateOwner.setState({
      selection: Immutable.Set()
    })
  }
  /**
   * Used by onClick to find the row that was clicked.
   * (ignored unless multi-select is specified)
   */
  getRowElement (e) {
    // Work backwards until element is TR
    let targetElement = e.target
    while (targetElement) {
      if (targetElement.tagName === 'TR') break
      targetElement = targetElement.parentNode
    }
    return targetElement
  }
  /**
   * Handle click, shift + click, and CmdOrCtrl + click
   * (ignored unless multi-select is specified)
   */
  onClick (e) {
    const targetElement = this.getRowElement(e)
    if (!targetElement) return

    const clickedIndex = parseInt(targetElement.getAttribute('data-row-index'))
    if (eventUtil.isForSecondaryAction(e)) {
      this.processControlClick(clickedIndex)
    } else if (e.shiftKey) {
      this.processShiftClick(clickedIndex)
    } else {
      this.processClick(clickedIndex)
    }
  }
  getSelectedRowObjects () {
    const handlerInputs = []
    this.stateOwner.state.selection.forEach((globalIndex) => {
      const tableParts = globalIndex.split('-')
      const tableID = parseInt(tableParts[0])
      const rowIndex = parseInt(tableParts[1])
      const handlerInput = this.props.totalRowObjects
        ? (typeof this.props.totalRowObjects[parseInt(tableID)][rowIndex].toJS === 'function'
          ? this.props.totalRowObjects[parseInt(tableID)][rowIndex].toJS()
          : this.props.totalRowObjects[parseInt(tableID)][rowIndex])
        : (this.props.rowObjects.size > 0 || this.props.rowObjects.length > 0)
          ? (typeof this.props.rowObjects.toJS === 'function'
            ? this.props.rowObjects.get(rowIndex).toJS()
            : this.props.rowObjects[rowIndex])
          : null
      if (handlerInput) {
        handlerInputs.push(handlerInput)
      }
    })
    return handlerInputs
  }
  /**
   * Handle right-click context menu for multiple selected items.
   * (ignored unless multi-select is specified)
   */
  onContextMenu (e) {
    const handlerInputs = this.getSelectedRowObjects()
    if (handlerInputs.length && this.hasContextMenu) {
      if (handlerInputs.length === 1) {
        this.props.onContextMenu(handlerInputs[0], this.props.contextMenuName, e)
      } else {
        this.props.onContextMenu(handlerInputs, this.props.contextMenuName, e)
      }
      this.clearSelection()
    }
  }
  /**
   * Alternate drag start handler for when multiple items are selected.
   * (ignored unless multi-select is specified AND multiple items are selected)
   */
  onTableDragStart (e) {
    // Set the ghost drag icon to default of SVG of multiple pages
    // TODO: does this cause a memory leak if you continually drag items?
    const dragImage = document.createElement('img')
    dragImage.src = cursorMultiCopyPages
    e.dataTransfer.setDragImage(dragImage, 15, 30)

    // Call the provided onDragStart handler with the list of selected objects
    const thisArg = this.props.thisArg || this
    const handlerInputs = this.getSelectedRowObjects()
    this.props.onDragStart.call(thisArg, Immutable.fromJS(handlerInputs), e)
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
  getTableAttributes () {
    const tableAttributes = {}
    if (this.props.multiSelect && this.multipleItemsSelected) {
      if (typeof this.props.onDragStart === 'function') {
        tableAttributes.onDragStart = this.onTableDragStart
        tableAttributes.draggable = true
      }
    }
    return tableAttributes
  }
  getRowAttributes (row, index) {
    const rowAttributes = {}

    // Object bound to this row. Not passed to multi-select handlers.
    const handlerInput = this.props.rowObjects &&
      (this.props.rowObjects.size > 0 || this.props.rowObjects.length > 0)
      ? (typeof this.props.rowObjects.toJS === 'function'
        ? this.props.rowObjects.get(index).toJS()
        : (typeof this.props.rowObjects[index].toJS === 'function'
          ? this.props.rowObjects[index].toJS()
          : this.props.rowObjects[index]))
      : row

    // Allow parent control to optionally specify context
    const thisArg = this.props.thisArg || this

    // Optionally add class to each row for easy hover styling
    if (this.props.addHoverClass) {
      rowAttributes.className = 'rowHover'
    }

    // Bindings for multi-select-specific event handlers
    if (this.props.multiSelect) {
      // Table supports multi-select
      rowAttributes.onClick = this.onClick
      if (this.nullSelection && this.hasContextMenu) {
        // If nothing is selected yet, offer a default per-item context menu
        rowAttributes.onContextMenu = this.props.onContextMenu.bind(this, handlerInput, this.props.contextMenuName)
      } else {
        // If items are selected we must use the multiple item handler
        rowAttributes.onContextMenu = this.onContextMenu
      }
    } else {
      // Table does not support multi-select
      if (this.hasContextMenu) {
        rowAttributes.onContextMenu = this.props.onContextMenu.bind(this, handlerInput, this.props.contextMenuName)
      }
      if (this.hasClickHandler) {
        rowAttributes.onClick = this.props.onClick.bind(thisArg, handlerInput)
      }
    }

    // Bindings for row-specific event handlers
    if (typeof this.props.onDoubleClick === 'function') {
      rowAttributes.onDoubleClick = this.props.onDoubleClick.bind(thisArg, handlerInput)
    }
    // Only bind the ROW SPECIFIC onDragStart handler if:
    // - one or no items are selected
    // - onDragStart has a value
    // When multiple items are selected, the drag
    // handler is bound at the TABLE level.
    if (!(this.props.multiSelect && this.multipleItemsSelected)) {
      if (typeof this.props.onDragStart === 'function') {
        rowAttributes.onDragStart = this.props.onDragStart.bind(thisArg, Immutable.fromJS(handlerInput))
        rowAttributes.draggable = true
      }
    }
    if (typeof this.props.onDragOver === 'function') {
      rowAttributes.onDragOver = this.props.onDragOver.bind(thisArg, Immutable.fromJS(handlerInput))
    }
    if (typeof this.props.onDrop === 'function') {
      rowAttributes.onDrop = this.props.onDrop.bind(thisArg, Immutable.fromJS(handlerInput))
    }

    return rowAttributes
  }
  render () {
    if (!this.props.headings || !this.props.rows) {
      return false
    }
    return <table
      {...this.getTableAttributes()}
      className={cx({
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
            const headerClasses = {
              'sort-header': true,
              'sort-default': this.sortingDisabled || heading === this.props.defaultHeading
            }
            const isString = typeof heading === 'string'
            if (isString) headerClasses['heading-' + heading] = true
            return <th className={cx(headerClasses)}
              data-sort-method={dataType === 'number' ? 'number' : undefined}
              data-sort-order={this.props.defaultHeadingSortOrder}>
              {
                isString
                  ? <div className='th-inner' data-l10n-id={heading} />
                  : heading
              }
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

            const classes = []
            if (rowAttributes) classes.push(rowAttributes.className)
            if (this.hasRowClassNames) classes.push(this.props.rowClassNames[i])
            if (this.stateOwner.state.selection.includes(this.getGlobalIndex(i))) classes.push('selected')
            if (this.sortingDisabled) classes.push('no-sort')

            return row.length
              ? <tr {...rowAttributes}
                data-context-menu-disable={rowAttributes && rowAttributes.onContextMenu ? true : undefined}
                data-table-id={this.tableID}
                data-row-index={i}
                className={classes.join(' ')}>{entry}</tr>
              : null
          })
        }
      </tbody>
    </table>
  }
}

module.exports = SortableTable
