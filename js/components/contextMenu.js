/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')
const windowActions = require('../actions/windowActions')
const cx = require('../lib/classSet')
const KeyCodes = require('../../app/common/constants/keyCodes')
const {formatAccelerator, wrappingClamp} = require('../../app/common/lib/formatUtil')
const separatorMenuItem = require('../../app/common/commonMenu').separatorMenuItem
const keyCodes = require('../../app/common/constants/keyCodes')

class ContextMenuItem extends ImmutableComponent {
  componentDidMount () {
    if (this.node) {
      this.node.addEventListener('auxclick', this.onAuxClick.bind(this))
    }
  }
  get submenu () {
    return this.props.contextMenuItem.get('submenu')
  }
  get hasSubmenu () {
    return this.submenu && this.submenu.size > 0
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
    this.onClick(this.props.contextMenuItem.get('click'), true, e)
  }

  onMouseEnter (e) {
    let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
    openedSubmenuDetails = openedSubmenuDetails
      ? openedSubmenuDetails.splice(this.props.submenuIndex, this.props.contextMenuDetail.get('openedSubmenuDetails').size)
      : new Immutable.List()

    if (this.hasSubmenu) {
      let node = e.target
      while (node && node.classList && !node.classList.contains('contextMenuItem')) {
        node = node.parentNode
      }
      let parentNode = node.parentNode
      while (parentNode && parentNode.classList && !parentNode.classList.contains('contextMenu')) {
        parentNode = parentNode.parentNode
      }
      const parentBoundingRect = parentNode.getBoundingClientRect()
      const boundingRect = node.getBoundingClientRect()
      openedSubmenuDetails = openedSubmenuDetails.push(Immutable.fromJS({
        y: boundingRect.top - parentBoundingRect.top - 1,
        template: this.submenu
      }))
    }
    windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
  }
  getLabelForItem (item) {
    const label = item.get('label')
    if (label) {
      return label
    }
    if (item.get('labelDataBind') === 'zoomLevel') {
      const activeWebview = document.querySelector('.frameWrapper.isActive webview')
      let percent = 100
      if (activeWebview) {
        percent = activeWebview.getZoomPercent()
      }
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
    } else if (this.props.contextMenuItem.get('type') === 'multi') {
      return <div className='contextMenuItem multiContextMenuItem'>
        <span className='multiItemTitle' data-l10n-id={this.props.contextMenuItem.get('l10nLabelId')} />
        {
          this.props.contextMenuItem.get('submenu').map((subItem) =>
            <div className='contextMenuSubItem'
              onClick={this.onClick.bind(this, subItem.get('click'), false)}>
              <span data-l10n-id={subItem.get('l10nLabelId')}>{this.getLabelForItem(subItem)}</span>
            </div>)
        }
      </div>
    }
    const props = {
      className: cx({
        contextMenuItem: true,
        hasFaIcon: faIcon,
        checkedMenuItem: this.props.contextMenuItem.get('checked'),
        hasIcon: icon || faIcon,
        selectedByKeyboard: this.props.selected
      }),
      role: 'listitem'
    }

    if (typeof this.props.dataIndex === 'number') {
      props['data-index'] = this.props.dataIndex
    }

    return <div {...props}
      ref={(node) => { this.node = node }}
      draggable={this.props.contextMenuItem.get('draggable')}
      onDragStart={this.onDragStart.bind(this)}
      onDragEnd={this.onDragEnd.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onDrop={this.onDrop.bind(this)}
      onContextMenu={this.onContextMenu.bind(this)}
      disabled={this.props.contextMenuItem.get('enabled') === false}
      onMouseEnter={this.onMouseEnter.bind(this)}
      onClick={this.onClick.bind(this, this.props.contextMenuItem.get('click'), true)}>
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
          style={iconStyle} />
        : null
      }
      <span className='contextMenuItemText'
        data-l10n-id={this.props.contextMenuItem.get('l10nLabelId')}>{this.props.contextMenuItem.get('label')}</span>
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

/**
 * Represents a single popup menu (not including submenu)
 */
class ContextMenuSingle extends ImmutableComponent {
  render () {
    const styles = {}
    if (this.props.y) {
      styles.top = this.props.y
    }
    const visibleMenuItems = this.props.template.filter((element) => {
      return element.has('visible')
        ? element.get('visible')
        : true
    })

    let index = 0
    return <div role='list' className={cx({
      contextMenuSingle: true,
      isSubmenu: this.props.submenuIndex !== 0
    })} style={styles}>
      {
        visibleMenuItems.map((contextMenuItem) => {
          let props = {
            contextMenuItem: contextMenuItem,
            submenuIndex: this.props.submenuIndex,
            lastZoomPercentage: this.props.lastZoomPercentage,
            contextMenuDetail: this.props.contextMenuDetail,
            selected: false
          }
          // don't count separators when finding selectedIndex
          if (contextMenuItem.get('type') !== separatorMenuItem.type) {
            props.dataIndex = index
            props.selected = (index === this.props.selectedIndex)
            index++
          }
          return <ContextMenuItem {...props} />
        })
      }
    </div>
  }
}

/**
 * Represents a context menu including all submenus
 */
class ContextMenu extends ImmutableComponent {
  constructor () {
    super()
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  componentDidMount () {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  onKeyDown (e) {
    let selectedIndex = null
    let currentIndex = null
    let selectedTemplate = null
    let selectedMenuItem = null

    if (this.props.selectedIndex !== null) {
      selectedIndex = this.props.selectedIndex
      currentIndex = selectedIndex[selectedIndex.length - 1]
      selectedTemplate = this.getMenuByIndex(selectedIndex, this.props.contextMenuDetail.get('template'))
      selectedMenuItem = selectedTemplate.get(currentIndex)
    }

    switch (e.keyCode) {
      case keyCodes.ENTER:
        e.preventDefault()
        e.stopPropagation()
        if (currentIndex !== null) {
          const action = selectedTemplate.getIn([currentIndex, 'click'])
          if (action) {
            action(e)
          }
        }
        windowActions.resetMenuState()
        break

      case KeyCodes.ESC:
      case KeyCodes.TAB:
        windowActions.resetMenuState()
        break

      case keyCodes.LEFT:
        // Left arrow inside a sub menu
        // <= go back one level
        if (this.hasSubmenuSelection) {
          const newIndices = selectedIndex.slice()
          newIndices.pop()
          windowActions.setContextMenuSelectedIndex(newIndices)

          let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
            ? this.props.contextMenuDetail.get('openedSubmenuDetails')
            : new Immutable.List()
          openedSubmenuDetails = openedSubmenuDetails.pop()

          windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
        }
        break

      case keyCodes.RIGHT:
        // Right arrow on a menu item which has a sub menu
        // => go up one level (default next menu to item 0)
        const isSubMenu = !!selectedMenuItem.get('submenu')

        if (isSubMenu) {
          e.stopPropagation()
          const newIndices = selectedIndex.slice()
          newIndices.push(0)
          windowActions.setContextMenuSelectedIndex(newIndices)

          let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
            ? this.props.contextMenuDetail.get('openedSubmenuDetails')
            : new Immutable.List()

          const rect = this.getContextMenuItemBounds()
          const itemHeight = (rect.bottom - rect.top)

          openedSubmenuDetails = openedSubmenuDetails.push(Immutable.fromJS({
            y: (rect.top - itemHeight),
            template: selectedMenuItem.get('submenu')
          }))

          windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
        }
        break

      case keyCodes.UP:
      case keyCodes.DOWN:
        if (this.props.contextMenuDetail) {
          let newIndices

          if (selectedIndex === null) {
            newIndices = [0]
          } else {
            const nextIndex = wrappingClamp(
              currentIndex + (e.which === keyCodes.UP ? -1 : 1),
              0,
              this.maxIndex(selectedTemplate))

            newIndices = selectedIndex.slice()
            newIndices[selectedIndex.length - 1] = nextIndex
          }

          windowActions.setContextMenuSelectedIndex(newIndices)
        }
        break
    }
  }

  onKeyUp (e) {
    e.preventDefault()
  }

  onClick () {
    setImmediate(() => windowActions.resetMenuState())
  }

  getTemplateItemsOnly (template) {
    return template.filter((element) => {
      if (element.get('type') === separatorMenuItem.type) return false
      if (element.has('visible')) return element.get('visible')
      return true
    })
  }

  getMenuByIndex (selectedIndex, parentItem, currentDepth) {
    parentItem = this.getTemplateItemsOnly(parentItem)
    if (!currentDepth) currentDepth = 0

    const selectedIndices = selectedIndex.slice(1)
    if (selectedIndices.length === 0) return parentItem

    const submenuIndex = selectedIndex[0]
    const childItem = parentItem.get(submenuIndex)

    if (childItem && childItem.get('submenu')) {
      return this.getMenuByIndex(selectedIndices, childItem.get('submenu'), currentDepth + 1)
    }

    return parentItem
  }

  getContextMenuItemBounds () {
    const selected = document.querySelectorAll('.contextMenuItem.selectedByKeyboard')
    if (selected.length > 0) {
      return selected.item(selected.length - 1).getBoundingClientRect()
    }
    return null
  }

  /**
   * Upper bound for the active / focused menu.
   */
  maxIndex (template) {
    return template.filter((element) => {
      if (element.get('type') === separatorMenuItem.type) return false
      if (element.has('visible')) return element.get('visible')
      return true
    }).size - 1
  }

  get openedSubmenuDetails () {
    return this.props.contextMenuDetail.get('openedSubmenuDetails') || new Immutable.List()
  }

  get hasSubmenuSelection () {
    return (this.props.selectedIndex === null) ? false : this.props.selectedIndex.length > 1
  }

  render () {
    const selectedIndex = (this.props.selectedIndex === null) ? [0] : this.props.selectedIndex
    const styles = {}
    if (this.props.contextMenuDetail.get('left') !== undefined) {
      styles.left = this.props.contextMenuDetail.get('left')
    }
    if (this.props.contextMenuDetail.get('right') !== undefined) {
      styles.right = this.props.contextMenuDetail.get('right')
    }
    if (this.props.contextMenuDetail.get('top') !== undefined) {
      styles.top = this.props.contextMenuDetail.get('top')
    }
    if (this.props.contextMenuDetail.get('bottom') !== undefined) {
      styles.bottom = this.props.contextMenuDetail.get('bottom')
    }
    if (this.props.contextMenuDetail.get('width') !== undefined) {
      styles.width = this.props.contextMenuDetail.get('width')
    }
    if (this.props.contextMenuDetail.get('maxHeight')) {
      styles.maxHeight = this.props.contextMenuDetail.get('maxHeight')
    }
    return <div
      className={cx({
        contextMenu: true,
        reverseExpand: this.props.contextMenuDetail.get('right') !== undefined,
        contextMenuScrollable: this.props.contextMenuDetail.get('maxHeight') !== undefined
      })}
      onClick={this.onClick.bind(this)}
      style={styles}>
      <ContextMenuSingle contextMenuDetail={this.props.contextMenuDetail}
        submenuIndex={0}
        lastZoomPercentage={this.props.lastZoomPercentage}
        template={this.props.contextMenuDetail.get('template')}
        selectedIndex={this.props.selectedIndex ? this.props.selectedIndex[0] : null} />
      {
        this.openedSubmenuDetails.map((openedSubmenuDetail, i) =>
          <ContextMenuSingle contextMenuDetail={this.props.contextMenuDetail}
            submenuIndex={i + 1}
            lastZoomPercentage={this.props.lastZoomPercentage}
            template={openedSubmenuDetail.get('template')}
            y={openedSubmenuDetail.get('y')}
            selectedIndex={
              selectedIndex && (i + 1) < selectedIndex.length
                ? selectedIndex[i + 1]
                : null} />)
      }
    </div>
  }
}

module.exports = ContextMenu
