/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const windowActions = require('../../../js/actions/windowActions')
const separatorMenuItem = require('../../common/commonMenu').separatorMenuItem
const keyCodes = require('../../../js/constants/keyCodes')
const {wrappingClamp} = require('../../common/lib/formatUtil')

const bindClickHandler = (contextMenu, lastFocusedSelector) => {
  if (contextMenu.type === separatorMenuItem.type) {
    return contextMenu
  }
  contextMenu.click = function (e) {
    e.preventDefault()
    if (lastFocusedSelector) {
      // Send focus back to the active web frame
      const results = document.querySelectorAll(lastFocusedSelector)
      if (results.length === 1) results[0].focus()
    }
    windowActions.clickMenubarSubmenu(contextMenu.label)
  }
  if (contextMenu.submenu) {
    contextMenu.submenu = contextMenu.submenu.map((submenuItem) => {
      return bindClickHandler(submenuItem, lastFocusedSelector)
    })
  }
  return contextMenu
}

const showContextMenu = (rect, submenu, lastFocusedSelector) => {
  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: rect.left,
    top: rect.bottom,
    template: submenu.map((submenuItem) => {
      return bindClickHandler(submenuItem, lastFocusedSelector)
    })
  }))
}

class MenubarItem extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
  }
  onClick (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    // If clicking on an already selected item, deselect it
    const selected = this.props.menubar.props.selectedIndex
      ? this.props.menubar.props.selectedIndex[0]
      : null
    if (selected && selected === this.props.index) {
      windowActions.setContextMenuDetail()
      windowActions.setSubmenuSelectedIndex()
      return
    }
    // Otherwise, mark item as selected and show its context menu
    windowActions.setSubmenuSelectedIndex([this.props.index])
    const rect = e.target.getBoundingClientRect()
    showContextMenu(rect, this.props.submenu, this.props.lastFocusedSelector)
  }
  onMouseOver (e) {
    const selected = this.props.menubar.props.selectedIndex
      ? this.props.menubar.props.selectedIndex[0]
      : null
    if (typeof selected === 'number' && selected !== this.props.index) {
      this.onClick(e)
    }
  }
  render () {
    return <span
      className={'menubarItem' + (this.props.selected ? ' selected' : '')}
      onClick={this.onClick}
      onMouseOver={this.onMouseOver}
      data-index={this.props.index}>
      { this.props.label }
    </span>
  }
}

/**
 * Menubar that can be optionally be displayed at the top of a window (in favor of the system menu).
 * First intended use is with Windows to enable a slim titlebar.
 * NOTE: the system menu is still created and used in order to keep the accelerators working.
 */
class Menubar extends ImmutableComponent {
  constructor () {
    super()
    this.onKeyDown = this.onKeyDown.bind(this)
  }
  componentWillMount () {
    document.addEventListener('keydown', this.onKeyDown)
  }
  componentWillUnmount () {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  /**
   * Used to get the submenu of a top level menu like File, Edit, etc.
   * Index will default to the selected menu if not provided / valid.
   */
  getTemplate (index) {
    if (typeof index !== 'number') index = this.props.selectedIndex[0]
    return this.props.template.get(index).get('submenu')
  }
  /**
   * Same as getTemplate but excluding line separators and items that are not visible.
   */
  getTemplateItemsOnly (index) {
    return this.getTemplate(index).filter((element) => {
      if (element.get('type') === separatorMenuItem.type) return false
      if (element.has('visible')) return element.get('visible')
      return true
    })
  }
  /**
   * Get client rect for the MenubarItem controls.
   * Used to position the context menu object.
   */
  getMenubarItemBounds (index) {
    if (typeof index !== 'number') index = this.props.selectedIndex[0]
    const selected = document.querySelectorAll('.menubar .menubarItem[data-index=\'' + index + '\']')
    if (selected.length === 1) {
      return selected.item(0).getBoundingClientRect()
    }
    return null
  }
  /**
   * Get client rect for the actively selected ContextMenu.
   * Used to position the child menu if parent has children.
   */
  getContextMenuItemBounds () {
    const selected = document.querySelectorAll('.contextMenuItem.selectedByKeyboard')
    if (selected.length > 0) {
      return selected.item(selected.length - 1).getBoundingClientRect()
    }
    return null
  }
  /**
   * Returns index for the active / focused menu.
   */
  get currentIndex () {
    return this.props.selectedIndex[this.props.selectedIndex.length - 1]
  }
  /**
   * Upper bound for the active / focused menu.
   */
  get maxIndex () {
    return this.getMenuByIndex().size - 1
  }
  /**
   * Returns true is current state is inside a regular menu.
   */
  get hasMenuSelection () {
    return this.props.selectedIndex.length > 1
  }
  /**
   * Returns true if current state is inside a submenu.
   */
  get hasSubmenuSelection () {
    return this.props.selectedIndex.length > 2
  }
  /**
   * Fetch menu based on selected index.
   * Will navigate children to find nested menus.
   */
  getMenuByIndex (parentItem, currentDepth) {
    if (!parentItem) parentItem = this.getTemplateItemsOnly()
    if (!currentDepth) currentDepth = 0

    const selectedIndices = this.props.selectedIndex.slice(1)
    if (selectedIndices.length === 0) return parentItem

    const submenuIndex = selectedIndices[currentDepth]
    const childItem = parentItem.get(submenuIndex)

    if (childItem && childItem.get('submenu') && currentDepth < (selectedIndices.length - 1)) {
      return this.getMenuByIndex(childItem.get('submenu'), currentDepth + 1)
    }

    return parentItem
  }

  onKeyDown (e) {
    const selectedIndex = this.props.selectedIndex

    if (!selectedIndex || !this.props.template) return

    switch (e.which) {
      case keyCodes.ENTER:
        e.preventDefault()
        const selectedLabel = this.getMenuByIndex().getIn([this.currentIndex, 'label'])
        windowActions.clickMenubarSubmenu(selectedLabel)
        windowActions.resetMenuState()
        break

      case keyCodes.LEFT:
      case keyCodes.RIGHT:
        e.preventDefault()

        // Left arrow inside a submenu
        // <= go back one level
        if (e.which === keyCodes.LEFT && this.hasSubmenuSelection) {
          const newIndices = selectedIndex.slice()
          newIndices.pop()
          windowActions.setSubmenuSelectedIndex(newIndices)

          let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
            ? this.props.contextMenuDetail.get('openedSubmenuDetails')
            : new Immutable.List()
          openedSubmenuDetails = openedSubmenuDetails.pop()

          windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
          break
        }

        const selectedMenuItem = selectedIndex
          ? this.getMenuByIndex().get(this.currentIndex)
          : null

        // Right arrow on a menu item which has a submenu
        // => go up one level (default next menu to item 0)
        if (e.which === keyCodes.RIGHT && selectedMenuItem && selectedMenuItem.has('submenu')) {
          const newIndices = selectedIndex.slice()
          newIndices.push(0)
          windowActions.setSubmenuSelectedIndex(newIndices)

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
          break
        }

        // Regular old menu item
        const nextIndex = selectedIndex === null
          ? 0
          : wrappingClamp(
              selectedIndex[0] + (e.which === keyCodes.LEFT ? -1 : 1),
              0,
              this.props.template.size - 1)

        // Context menu already being displayed; auto-open the next one
        if (this.props.contextMenuDetail) {
          windowActions.setSubmenuSelectedIndex([nextIndex, 0])
          showContextMenu(this.getMenubarItemBounds(nextIndex), this.getTemplate(nextIndex).toJS(), this.props.lastFocusedSelector)
        } else {
          windowActions.setSubmenuSelectedIndex([nextIndex])
        }
        break

      case keyCodes.UP:
      case keyCodes.DOWN:
        e.preventDefault()
        if (this.getTemplateItemsOnly()) {
          if (!this.props.contextMenuDetail) {
            // First time hitting up/down; popup the context menu
            const newIndices = selectedIndex.slice()
            newIndices.push(0)
            windowActions.setSubmenuSelectedIndex(newIndices)
            showContextMenu(this.getMenubarItemBounds(), this.getTemplate().toJS(), this.props.lastFocusedSelector)
          } else {
            // Context menu already visible; move selection up or down
            const nextIndex = wrappingClamp(
              this.currentIndex + (e.which === keyCodes.UP ? -1 : 1),
              0,
              this.maxIndex)

            const newIndices = selectedIndex.slice()
            if (this.hasMenuSelection) {
              newIndices[selectedIndex.length - 1] = nextIndex
            } else {
              newIndices.push(0)
            }
            windowActions.setSubmenuSelectedIndex(newIndices)
          }
        }
        break
    }
  }
  shouldComponentUpdate (nextProps, nextState) {
    return this.props.selectedIndex !== nextProps.selectedIndex
  }
  render () {
    let i = 0
    return <div className='menubar'>
      {
        this.props.template.map((menubarItem) => {
          let props = {
            label: menubarItem.get('label'),
            index: i++,
            submenu: menubarItem.get('submenu').toJS(),
            lastFocusedSelector: this.props.lastFocusedSelector,
            menubar: this
          }
          if (this.props.selectedIndex && props.index === this.props.selectedIndex[0]) {
            props.selected = true
          }
          return <MenubarItem {...props} />
        })
      }
    </div>
  }
}

module.exports = Menubar
