/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../immutableComponent')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Utils
const cx = require('../../../../../js/lib/classSet')
const {formatAccelerator} = require('../../../../common/lib/formatUtil')
const {elementHasDataset} = require('../../../../../js/lib/eventUtil')

class ContextMenuItem extends ImmutableComponent {
  componentDidMount () {
    if (this.node) {
      this.node.addEventListener('auxclick', this.onAuxClick.bind(this))
    }
  }
  get submenu () {
    return this.props.contextMenuItem.get('submenu')
  }
  get items () {
    return this.props.contextMenuItem.get('items')
  }
  get hasSubmenu () {
    return (this.submenu && this.submenu.size > 0) || this.props.contextMenuItem.has('folderKey')
  }
  get isMulti () {
    return this.items && this.items.size > 0
  }

  get accelerator () {
    const accelerator = this.props.contextMenuItem.get('accelerator')
    return accelerator && typeof accelerator === 'string'
      ? accelerator.trim()
      : null
  }
  get hasAccelerator () {
    return this.accelerator !== null
  }

  /**
   * Get Y position (top) fo the current event (target)
   * @param e {event} - event for which we want to determinate top position
   * @returns {number} - Y position
   */
  getYAxis (e) {
    let node = e.target
    while (node && !elementHasDataset(node, 'contextMenuItem')) {
      node = node.parentNode
    }
    let parentNode = node.parentNode
    while (parentNode && !elementHasDataset(parentNode, 'contextMenu')) {
      parentNode = parentNode.parentNode
    }
    const parentBoundingRect = parentNode.getBoundingClientRect()
    const boundingRect = node.getBoundingClientRect()

    return boundingRect.top - parentBoundingRect.top - 1 + parentNode.scrollTop
  }

  onClick (clickAction, shouldHide, e) {
    e.stopPropagation()
    if (clickAction) {
      if (shouldHide) {
        setImmediate(() => windowActions.resetMenuState())
      }
      clickAction(e)
    }
  }
  onDragStart (e) {
    if (this.props.contextMenuItem.get('dragStart')) {
      this.props.contextMenuItem.get('dragStart')(e)
    }
  }
  onDragEnd (e) {
    if (this.props.contextMenuItem.get('dragEnd')) {
      this.props.contextMenuItem.get('dragEnd')(e)
    }
  }
  onDragOver (e) {
    if (this.props.contextMenuItem.get('dragOver')) {
      this.props.contextMenuItem.get('dragOver')(e)
    }
    this.onMouseEnter(e)
  }
  onDrop (e) {
    if (this.props.contextMenuItem.get('drop')) {
      this.props.contextMenuItem.get('drop')(e)
    }
    windowActions.setContextMenuDetail()
  }
  onContextMenu (e) {
    if (this.props.contextMenuItem.get('contextMenu')) {
      this.props.contextMenuItem.get('contextMenu')(e)
    }
    windowActions.setContextMenuDetail()
  }
  onAuxClick (e) {
    if (e.button === 1) {
      this.onClick(this.props.contextMenuItem.get('click'), true, e)
    }
  }

  onMouseEnter (e) {
    if (this.props.contextMenuItem.has('folderKey')) {
      // Context menu item in bookmarks toolbar (bookmarks always have a folder id)
      const yAxis = this.getYAxis(e)
      windowActions.onShowBookmarkFolderMenu(this.props.contextMenuItem.get('folderKey'), yAxis, null, this.props.submenuIndex)
    } else if (this.hasSubmenu) {
      // Regular context menu with submenu (ex: hamburger menu)
      let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')

      openedSubmenuDetails = openedSubmenuDetails
        ? openedSubmenuDetails.splice(this.props.submenuIndex, openedSubmenuDetails.size)
        : new Immutable.List()
      const yAxis = this.getYAxis(e)

      openedSubmenuDetails = openedSubmenuDetails.push(Immutable.fromJS({
        y: yAxis,
        template: this.submenu,
        openerSubmenuIndex: this.props.submenuIndex,
        openerDataIndex: this.props.dataIndex
      }))

      windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
    } else {
      // Regular context menu item (no children)
      let openedSubmenuDetails = this.props.contextMenuDetail && this.props.contextMenuDetail.get('openedSubmenuDetails')

      // If a menu is open, see if the submenuIndex matches
      if (openedSubmenuDetails) {
        for (let i = 0; i < openedSubmenuDetails.size; i++) {
          if (this.props.submenuIndex === openedSubmenuDetails.getIn([i, 'openerSubmenuIndex'])) {
            // When index matches, menu should be closed
            // User is hovering over a different item at the same level
            openedSubmenuDetails = openedSubmenuDetails.remove(i)
            windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
            break
          }
        }
      }
    }
  }
  getLabelForItem (item) {
    const label = item.get('label')
    if (label) {
      return label
    }
    if (item.get('labelDataBind') === 'zoomLevel') {
      const percent = this.props.lastZoomPercentage || 100
      return `${percent}%`
    }
    return ''
  }
  render () {
    const iconSize = 16
    let iconStyle = {
      minWidth: iconSize,
      width: iconSize
    }

    const icon = this.props.contextMenuItem.get('icon')
    let faIcon
    if (icon) {
      iconStyle = Object.assign(iconStyle, {
        backgroundImage: `url(${icon})`,
        backgroundSize: iconSize,
        height: iconSize
      })
    } else {
      faIcon = this.props.contextMenuItem.get('faIcon')
    }

    if (this.props.contextMenuItem.get('type') === 'separator') {
      return <div className='contextMenuItem contextMenuSeparator' role='listitem'>
        <hr />
      </div>
    }
    const props = {
      className: cx({
        contextMenuItem: true,
        hasFaIcon: faIcon,
        checkedMenuItem: this.props.contextMenuItem.get('checked'),
        hasIcon: icon || faIcon,
        selectedByKeyboard: this.props.selected,
        multiContextMenuItem: this.isMulti
      }),
      role: 'listitem'
    }

    if (typeof this.props.dataIndex === 'number') {
      props['data-index'] = this.props.dataIndex
    }

    return <div {...props}
      data-context-menu-item
      ref={(node) => { this.node = node }}
      draggable={this.props.contextMenuItem.get('draggable')}
      onDragStart={this.onDragStart.bind(this)}
      onDragEnd={this.onDragEnd.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onDrop={this.onDrop.bind(this)}
      onContextMenu={this.onContextMenu.bind(this)}
      disabled={this.props.contextMenuItem.get('enabled') === false}
      onMouseEnter={this.onMouseEnter.bind(this)}
      onClick={this.onClick.bind(this, this.props.contextMenuItem.get('click'), true)}
    >
      {
        this.props.contextMenuItem.get('checked')
          ? <span className='fa fa-check contextMenuCheckIndicator' />
          : null
      }
      {
        icon || faIcon
          ? <span className={cx({
            contextMenuIcon: true,
            hasFaIcon: !!faIcon,
            fa: faIcon,
            [faIcon]: !!faIcon
          })}
            style={iconStyle}
          />
          : null
      }
      <span className='contextMenuItemText'
        data-l10n-id={this.props.contextMenuItem.get('l10nLabelId')}
      >{this.props.contextMenuItem.get('label')}</span>
      {
        this.isMulti && this.props.contextMenuItem.get('items').map((subItem) =>
          <div className='contextMenuSubItem'
            onClick={this.onClick.bind(this, subItem.get('click'), false)}
          >
            <span data-l10n-id={subItem.get('l10nLabelId')}>{this.getLabelForItem(subItem)}</span>
          </div>)
      }
      {
        this.hasSubmenu
          ? <span className='submenuIndicatorContainer'>
            <span className='submenuIndicatorSpacer' />
            <span className='submenuIndicator fa fa-chevron-right' />
          </span>
          : this.hasAccelerator
          ? <span className='submenuIndicatorContainer'>
            <span className='submenuIndicatorSpacer' />
            <span className='accelerator'>{formatAccelerator(this.accelerator)}</span>
          </span>
          : null
      }
    </div>
  }
}

module.exports = ContextMenuItem
