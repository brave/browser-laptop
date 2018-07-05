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
const isWindows = require('../../../../common/lib/platformUtil').isWindows()

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')

class SubmenuIndicatorContainer extends React.Component {
  render () {
    return <div className={css(styles.submenuIndicatorContainer)}>
      {this.props.children}
    </div>
  }
}

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

    const icon = !this.props.isTor && this.props.contextMenuItem.get('icon')
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
      return <div className={css(styles.item_separator)} data-test-id='contextMenuItem' role='listitem'>
        <hr className={css(styles.item_separator__hr)} />
      </div>
    }
    const props = {
      className: css(
        styles.item,
        isWindows && styles.item_isWindows,
        this.props.selected && styles.item_selectedByKeyboard,
        this.isMulti && styles.item_isMulti,
        (icon || faIcon) && styles.item_hasIcon,
        (icon && faIcon) && styles.item_hasFaIcon,
        this.props.contextMenuItem.get('checked') && styles.item_checked,
        (this.props.contextMenuItem.get('type') !== 'separator') && styles.item_item,
        (this.props.contextMenuItem.get('enabled') === false) && styles.item_isDisabled
      ),
      role: 'listitem'
    }

    if (typeof this.props.dataIndex === 'number') {
      props['data-index'] = this.props.dataIndex
    }

    return <div {...props}
      data-context-menu-item
      data-context-menu-item-selected-by-keyboard={this.props.selected}
      data-test-id='contextMenuItem'
      data-test2-id={this.props.selected ? 'selectedByKeyboard' : null}
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
          ? <span className={cx({
            [globalStyles.appIcons.check]: true,
            [css(styles.item__checkIndicator)]: true
          })} />
          : null
      }
      {
        icon || faIcon
          ? <span className={cx({
            [css(styles.item__icon, !!faIcon && styles.item__icon_hasFa)]: true,
            fa: faIcon,
            [faIcon]: !!faIcon
          })}
            style={iconStyle}
          />
          : null
      }
      <span className={css(styles.item__text)}
        data-l10n-id={this.props.contextMenuItem.get('l10nLabelId')}
        data-test-id='contextMenuItemText'
      >{this.props.contextMenuItem.get('label')}</span>
      {
        this.isMulti && this.props.contextMenuItem.get('items').map((subItem) =>
          <div className={css(styles.item__isMulti)}
            onClick={this.onClick.bind(this, subItem.get('click'), false)}
          >
            <span data-l10n-id={subItem.get('l10nLabelId')}>{this.getLabelForItem(subItem)}</span>
          </div>)
      }
      {
        this.hasSubmenu
          ? <SubmenuIndicatorContainer>
            <span className={cx({
              [globalStyles.appIcons.next]: true,
              [css(styles.item__submenuIndicator, styles.item__submenuIndicator_next)]: true
            })} />
          </SubmenuIndicatorContainer>
          : this.hasAccelerator
          ? <SubmenuIndicatorContainer>
            <span className={css(
              styles.item__submenuIndicator,
              isWindows && styles.item__submenuIndicator_accelerator_isWindows
            )}>{formatAccelerator(this.accelerator)}</span>
          </SubmenuIndicatorContainer>
          : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  submenuIndicatorContainer: {
    display: 'flex'
  },

  item_separator: {
    padding: '1px 0px'
  },

  item_separator__hr: {
    backgroundColor: theme.contextMenu.item.separator.hr.backgroundColor,
    border: 'none',
    height: '1px',
    width: '100%'
  },

  item: {
    maxWidth: 'inherit',
    minWidth: 'inherit',
    paddingTop: '6px',
    paddingRight: '10px',
    paddingBottom: '6px',
    paddingLeft: '20px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    userSelect: 'none',

    ':hover': {
      color: theme.contextMenu.item.selected.color,
      backgroundColor: theme.contextMenu.item.selected.backgroundColor
    }
  },

  item_isWindows: {
    // Make context menu style match menubar (Windows only- for use w/ slim titlebar)
    fontFamily: 'menu',
    fontSize: '12px'
  },

  item_selectedByKeyboard: {
    backgroundColor: theme.contextMenu.item.selected.backgroundColor,
    color: theme.contextMenu.item.selected.color
  },

  item_isMulti: {
    display: 'flex'
  },

  item_hasIcon: {
    paddingLeft: '10px'
  },

  item_hasFaIcon: {
    paddingLeft: '12px'
  },

  item_checked: {
    justifyContent: 'flex-start',
    paddingLeft: '4px'
  },

  item_item: {
    ':hover': {
      color: theme.contextMenu.item.selected.color,
      backgroundColor: theme.contextMenu.item.selected.backgroundColor
    }
  },

  item_isDisabled: {
    color: theme.contextMenu.item.disabled.color
  },

  item__checkIndicator: {
    paddingRight: '4px'
  },

  item__icon: {
    fontSize: '14px',
    marginRight: '8px'
  },

  item__icon_hasFa: {
    color: theme.contextMenu.item.icon.hasFaIcon.color
  },

  item__text: {
    flex: 1,
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingRight: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  item__isMulti: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.contextMenu.item.isMulti.borderColor,
    borderRadius: globalStyles.radius.borderRadius,
    backgroundColor: theme.contextMenu.item.isMulti.backgroundColor,
    color: theme.contextMenu.item.isMulti.color,
    display: 'flex',
    justifyContent: 'center',
    margin: '1px',
    padding: '4px 1rem'
  },

  item__submenuIndicator: {
    color: theme.contextMenu.item.submenuIndicator.color
  },

  item__submenuIndicator_next: {
    fontSize: '1rem'
  },

  item__submenuIndicator_accelerator_isWindows: {
    // Make context menu style match menubar (Windows only- for use w/ slim titlebar)
    fontFamily: 'menu',
    fontSize: '12px'
  }
})

module.exports = ContextMenuItem
