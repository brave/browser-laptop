/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')
const windowActions = require('../actions/windowActions')
const cx = require('../lib/classSet.js')
const KeyCodes = require('../constants/keyCodes')
const { formatAccelerator } = require('../../app/common/lib/formatUtil')
const separatorMenuItem = require('../../app/common/commonMenu').separatorMenuItem

class ContextMenuItem extends ImmutableComponent {
  componentDidMount () {
    window.addEventListener('keydown', this.onKeyDown)
  }
  componentWillUnmount () {
    window.removeEventListener('keydown', this.onKeyDown)
  }
  onKeyDown (e) {
    if (e.keyCode === KeyCodes.ESC || e.keyCode === KeyCodes.TAB) {
      windowActions.setContextMenuDetail()
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
        windowActions.resetMenuState()
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
  onMouseEnter (e) {
    let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
    openedSubmenuDetails = openedSubmenuDetails ? openedSubmenuDetails.splice(this.props.submenuIndex, this.props.contextMenuDetail.get('openedSubmenuDetails').size) : new Immutable.List()
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
  onMouseLeave (e) {
    if (this.hasSubmenu) {
    }
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
    return <div className={cx({
      contextMenuItem: true,
      hasFaIcon: faIcon,
      checkedMenuItem: this.props.contextMenuItem.get('checked'),
      hasIcon: icon || faIcon,
      selectedByKeyboard: this.props.selected
    })}
      role='listitem'
      draggable={this.props.contextMenuItem.get('draggable')}
      onDragStart={this.onDragStart.bind(this)}
      onDragEnd={this.onDragEnd.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onDrop={this.onDrop.bind(this)}
      onContextMenu={this.onContextMenu.bind(this)}
      disabled={this.props.contextMenuItem.get('enabled') === false}
      onMouseEnter={this.onMouseEnter.bind(this)}
      onMouseLeave={this.onMouseLeave.bind(this)}
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
            props.selected = index === this.props.selectedIndex
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
  onClick () {
    windowActions.resetMenuState()
  }
  get openedSubmenuDetails () {
    return this.props.contextMenuDetail.get('openedSubmenuDetails') || new Immutable.List()
  }
  render () {
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
        selectedIndex={this.props.selectedIndex} />
      {
        this.openedSubmenuDetails.map((openedSubmenuDetail, i) =>
          <ContextMenuSingle contextMenuDetail={this.props.contextMenuDetail}
            submenuIndex={i + 1}
            lastZoomPercentage={this.props.lastZoomPercentage}
            template={openedSubmenuDetail.get('template')}
            y={openedSubmenuDetail.get('y')}
            selectedIndex={this.props.selectedIndex} />)
      }
    </div>
  }
}

module.exports = ContextMenu
