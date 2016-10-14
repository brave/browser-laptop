/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const DragSource = require('react-dnd').DragSource
const DropTarget = require('react-dnd').DropTarget

const Types = {
  BLOCK: 'block'
}

const blockSource = {
  /**
   * Required. Called when the dragging starts
   * It's the only data available to the drop targets about the drag source
   * @see http://gaearon.github.io/react-dnd/docs-drag-source.html#specification-methods
   */
  beginDrag (props) {
    return {
      id: props.id
    }
  }
}

const blockTarget = {
  /**
   * Optional. Called when an item is hovered over the component
   * @see http://gaearon.github.io/react-dnd/docs-drop-target.html#specification-methods
   */
  hover (props, monitor) {
    const draggedId = monitor.getItem().id
    if (draggedId !== props.id) {
      props.onDraggedSite(draggedId, props.id)
    }
  }
}

/**
 * Both sourceCollect and targetCollect are called *Collecting Functions*
 * They will be called by React DnD with a connector that lets you connect
 * nodes to the DnD backend, and a monitor to query information about the drag state.
 * It should return a plain object of props to inject into your component.
 *
 * @see http://gaearon.github.io/react-dnd/docs-drop-target.html#the-collecting-function
 */

const sourceCollect = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }
}

const targetCollect = (connect) => {
  return {
    connectDropTarget: connect.dropTarget()
  }
}

class Block extends React.Component {
  render () {
    const connectDragSource = this.props.connectDragSource
    const connectDropTarget = this.props.connectDropTarget
    const opacity = this.props.isDragging ? 0 : 1
    const isBookmarked = this.props.isBookmarked
    const isPinned = this.props.isPinned

    return connectDragSource(connectDropTarget(
      <div className='topSiteSquareSpace'>
        <div
          className='topSitesElement'
          style={{
            opacity: opacity
          }}
        >
          <div className='topSitesActionContainer'>
            <button
              className='topSitesActionBtn fa fa-star'
              onClick={this.props.onBookmarkedSite}
              data-l10n-id={isBookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
            />
            <button
              className='topSitesActionBtn fa fa-thumb-tack'
              onClick={this.props.onPinnedSite}
              data-l10n-id={isPinned ? 'pinTopSiteButton' : 'unpinTopSiteButton'}
            />
            <button
              className='topSitesActionBtn fa fa-close'
              onClick={this.props.onIgnoredSite}
              data-l10n-id='removeTopSiteButton'
            />
          </div>
          <a
            className='topSitesElementFavicon'
            title={this.props.title}
            href={this.props.href}
            style={{
              backgroundColor: this.props.themeColor
            }}
          >
            {
              isPinned ? <div className='pinnedTopSite'><span className='pin fa fa-thumb-tack' /></div> : null
            }
            {this.props.favicon}
          </a>
        </div>
      </div>
    ))
  }
}

/**
 * Wraps the component to make it draggable
 * Only the drop targets registered for the same type will
 * react to the items produced by this drag source.
 *
 * @see http://gaearon.github.io/react-dnd/docs-drag-source.html
 */
const source = DragSource(Types.BLOCK, blockSource, sourceCollect)(Block)

/**
 * React to the compatible items being dragged, hovered, or dropped on it
 * Works with the same parameters as DragSource() above.
 *
 * @see http://gaearon.github.io/react-dnd/docs-drop-target.html
 */
const block = DropTarget(Types.BLOCK, blockTarget, targetCollect)(source)

// Notice that we're exporting the DropTarget and not Block Class.
module.exports = block
