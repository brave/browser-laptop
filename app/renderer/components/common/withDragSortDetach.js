// @flow

/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const throttle = require('lodash.throttle')

const DRAG_DETACH_PX_THRESHOLD_X = 60
const DRAG_DETACH_MS_TIME_BUFFER = 0
const DRAG_DETACH_PX_THRESHOLD_INITIAL = 44
const DRAG_DETACH_PX_THRESHOLD_POSTSORT = 80
const DRAG_PAGEMOVE_PX_THRESHOLD = 38

type Props = {
  /** The first index that is currently displayed and
   * able to be sorted to in a drag operation  */
  firstItemDisplayIndex: number,
  /** The total number of items, including any that
   * are not visible and not able to be dragged to
   */
  totalItemCount: number,
  /** index of this item as it appears in the
   * currently-displayed group
   */
  displayIndex: number,
  /** Count of items in the currently-displayed group */
  displayedItemCount: number,
  /**
   * Called when the item has been dragged away from
   * the list
   */
  onRequestDetach: (x: number, y: number) => void,
  /** Called when an item is dragged that has no siblings */
  onDragMoveSingleItem: (x: number, y: number) => void,
  /** Called when an item has been dragged past a threshold to a new index */
  onDragChangeIndex: (currentIndex: number, destinationIndex: number) => Boolean,
  /**
   * Request to start dragging. Caller should change the `isDragging` prop to `true`
   * in reponse to this call.
   */
  onStartDragSortDetach: (dragData: any, clientX: number, clientY: number, screenX: number, screenY: number, dragElementWidth: number, dragElementHeight: number, relativeDragX: number, relativeDragY: number) => void,
  /** unique key for the currently-displayed group (i.e. page) */
  containerKey: any,
  /**
   * this sets up the main events,
   * has the element position track the mouse
   * and sends relevant index changes to the prop functions
   */
  isDragging: Boolean,
  /**
   * Data to pass back to the `onStartDragSortDetach` prop function
   */
  dragData?: any,
  /**
   * A manual override for where the mouse is currently located
   * in relation to the window, on the x-axis. This should be used for a
   * temporary override when there has been a delay in responding to a
   * request to change sort index.
   */
  dragWindowClientX: number,
  /**
   * A manual override for where the mouse is currently located
   * in relation to the window, on the y-axis. This should be used for a
   * temporary override when there has been a delay in responding to a
   * request to change sort index.
   */
  dragWindowClientY: number,
  /**
   * An offset that the item should always have.
   * Exmaple use-case is if the item has been detached,
   * and it should stay at its previous parent offset until
   * the drag operation completes
   */
  detachedFromItemX: number,
  /**
   * Number of pixels relative to the left edge of the element,
   * the drag was initiated by the pointing device at */
  relativeXDragStart: number,
  /** can be used to pause movement processing during a drag opertion */
  dragProcessMoves: Boolean,
  /** whether the item can be detached if dragged past a threshold */
  dragCanDetach: Boolean,
}

type ChildProps = {
  dragElementRef: HTMLElement => void,
  onDragStart: SyntheticDragEvent<HTMLElement> => void
}

export type ParentClientRect = {
  x: number,
  y: number,
  left: number,
  top: number,
  width: number,
  height: number,
  offsetDifference: number,
  windowWidth: number
}

type EvaluateDraggingItemAndParentSizeFunction = (HTMLElement) => ({
  draggingItemWidth: number,
  nonDraggingItemWidth: number,
  parentClientRect: ParentClientRect
})

type MouseEventClientPoint = {
  clientX: number,
  clientY: number
}

// HACK - see the related `createEventFromSendMouseMoveInput` in tabDraggingWindowReducer.js
function translateEventFromSendMouseMoveInput (receivedEvent: any): MouseEventClientPoint {
  return (receivedEvent.x === 1 && receivedEvent.y === 99)
    ? { clientX: receivedEvent.screenX || 0, clientY: receivedEvent.screenY || 0 }
    : receivedEvent
}

module.exports = function withDragSortDetach (
  WrappedComponent: React.ComponentType<Props & ChildProps>,
  evaluateDraggingItemAndParentSize: EvaluateDraggingItemAndParentSizeFunction
): React.ComponentType<Props> {
  class WithDragSortDetach extends React.Component<Props> {
    static displayName = `WithDragSortDetach(${(typeof WrappedComponent.displayName === 'string' ? WrappedComponent.displayName : WrappedComponent.name) || 'Component'})`
    onDraggingMouseMoveDetectSortChangeThrottled: Function
    draggingDetachThreshold: ?number
    draggingDetachTimeout: ?number
    onNextDragIndexChange: ?Function
    currentMouseX: ?number
    suspendOrderChangeUntilUpdate: ?boolean
    elementRef: ?HTMLElement
    parentClientRect: ?ParentClientRect
    draggingItemWidth: ?number
    nonDraggingItemWidth: ?number
    dragItemMouseMoveFrame: ?any
    singleItemPosition: ?ClientRect
    hasRequestedDetach: ?boolean

    constructor (props: Props) {
      super(props)
      this.onDraggingMouseMoveDetectSortChangeThrottled = throttle(this.onDraggingMouseMoveDetectSortChange.bind(this), 1)
    }

    logWarning (...args: any) {
      console.warn(`[${WithDragSortDetach.displayName || 'withDragSortDetach'}]`, ...args)
    }

    //
    // React Lifecycle Events
    //

    componentDidMount () {
      // if a new item is already dragging,
      // that means that it has been attached from another window,
      // or moved from another page.
      // All we have to do is move the item DOM element,
      // and let the store know when the item should move to another
      // item's position
      if (this.props.isDragging) {
        // setup item moving
        this.attachDragSortHandlers()
        // if mount, dragging, and not single item, then it is either
        // an attach to the window
        // or a change in page
        if (!this.isSingleItem() && this.props.dragWindowClientX) {
          // the item will attach at the correct index, but the mouse may have moved since the attach was requested,
          // so make sure we move the item to the mouse position by forwarding the event
          window.requestAnimationFrame(() => {
            this.onDraggingMouseMove({ clientX: this.props.dragWindowClientX, clientY: this.props.dragWindowClientY })
          })
        }
      }
    }

    componentWillUnmount () {
      // tear-down item moving if still setup
      if (this.props.isDragging) {
        this.removeDragSortHandlers()
      }
    }

    componentDidUpdate (prevProps: Props) {
      if (this.props.isDragging && prevProps.isDragging === false) {
        // setup event to move item DOM element along with
        // mousemove and let the store know when it should
        // move the sort position of the item.
        // A different process (different because the window the item is in may change)
        // is firing the event to the store which will check
        // for detach / attach to windows
        this.attachDragSortHandlers()
        // fire sort handler manually with the first update, if we have one
        // since we may have attached but not received mouse event yet
        if (this.props.dragWindowClientX && this.props.dragWindowClientY) {
          window.requestAnimationFrame(() => {
            this.onDraggingMouseMove({ clientX: this.props.dragWindowClientX, clientY: this.props.dragWindowClientY })
          })
        }
      } else if (prevProps.isDragging && !this.props.isDragging) {
        // tear-down item moving
        this.removeDragSortHandlers()
      } else if (this.props.isDragging && this.props.containerKey !== prevProps.containerKey) {
        // handle changing page index during a drag
        // reevaluate anything that's changed when item is dragged to a new page
        this.draggingItemWidth = null
        window.requestAnimationFrame(() => this.evaluateDraggingItemWidth())
      }

      // mid-drag index change (due to dragging to a new position)
      if (this.props.isDragging && this.props.displayIndex !== prevProps.displayIndex) {
        // allow something to queue an event for after the index change happens
        // e.g. to preventing layout thrashing
        if (this.onNextDragIndexChange) {
          const fn = this.onNextDragIndexChange
          this.onNextDragIndexChange = null
          fn()
        }
        // re-calculate the translation we need to apply to the element
        // after an index change, since the element position will be new
        // but the mouse may have moved the item away from its new location
        if (this.currentMouseX) {
          // TODO: support clientY position for horizontal drag distance
          this.dragItem({ clientX: this.currentMouseX, clientY: 0 })
          this.currentMouseX = null
        }
        // we pause the mousemove handler from being able to calculate new index based
        // on drag position, whilst we're waiting for an existing index change
        // Now that the index has changed, we can resume
        this.suspendOrderChangeUntilUpdate = false
      }
    }

    render () {
      return <WrappedComponent
        dragElementRef={element => { this.elementRef = element }}
        onDragStart={this.onDragStart}
        {...this.props}
      />
    }

    //
    // Helpers
    //

    isSingleItem (props: Props = this.props) {
      return props.totalItemCount === 1
    }

    /*
    * Should be called whenever item size changes. Since Chrome does not yet support ResizeObserver,
    * we have to figure out the times. Luckily it's probably just initial drag start and when
    * then item group index changes
    */
    evaluateDraggingItemWidth () {
      if (!this.elementRef) {
        return
      }
      const itemSizeDetails = evaluateDraggingItemAndParentSize(this.elementRef)
      if (itemSizeDetails) {
        this.draggingItemWidth = itemSizeDetails.draggingItemWidth
        this.nonDraggingItemWidth = itemSizeDetails.nonDraggingItemWidth
        this.parentClientRect = itemSizeDetails.parentClientRect
      }
    }

    //
    // Event(s) to dispatch drag operations to store.
    // Only run by source window
    //

    // Setup this item's window instance as the dragging source
    // moving the item and orchestrating order changes
    // as well as dispatching events to the store so it can
    // handle detach / attach
    // Because this drag event starts in this window's web context,
    // it will receive locations even outside of the window.
    // If we start monitoring mousemove events in another window, it wouldn't
    // get position updates when the mouse moves outside the window, which we need
    // so we use the event instances started from this window to control the movement
    // in any other window the item may have been dragged to
    onDragStart = (e: SyntheticDragEvent<HTMLElement>) => {
      e.preventDefault()
      const dragElement: ?HTMLElement = e.target instanceof HTMLElement ? e.target : this.elementRef
      if (!dragElement) {
        throw new Error('No valid element target for drag start operation')
      }
      // let the store know where on the item element the mouse is, so it can always
      // keep the item in the same place under the mouse, regardless of which
      // actual element from which window is being moved
      const dragElementBounds = dragElement.getBoundingClientRect()
      const relativeXDragStart = e.clientX - dragElementBounds.left
      const relativeYDragStart = e.clientY - dragElementBounds.top
      this.props.onStartDragSortDetach(
        this.props.dragData,
        e.clientX,
        e.clientY,
        e.screenX,
        e.screenY,
        dragElementBounds.width,
        dragElementBounds.height,
        relativeXDragStart,
        relativeYDragStart
      )
    }

    //
    // Events for drag-sort amongst this item's group
    // Run by any window that receives a dragged item
    //

    attachDragSortHandlers () {
      // get item width
      window.requestAnimationFrame(() => this.evaluateDraggingItemWidth())
      // initial distance that has to be travelled outside the item's bounds in order to detach the item
      // (increases after some sorting has happened, as the user may be more 'relaxed' with the mouse)
      this.draggingDetachThreshold = DRAG_DETACH_PX_THRESHOLD_INITIAL

      window.addEventListener('mousemove', this.onDraggingMouseMove)
      if (this.isSingleItem() && this.props.detachedFromItemX) {
        if (this.elementRef) {
          this.elementRef.style.setProperty('--dragging-delta-x', this.props.detachedFromItemX + 'px')
        } else {
          console.warn(`[${WithDragSortDetach.displayName || 'withDragSortDetach'}] Ref element was not received in time for drag attach - could not set its visual position!`)
        }
      }
    }

    removeDragSortHandlers () {
      this.draggingItemWidth = null
      this.parentClientRect = null
      this.singleItemPosition = null
      this.suspendOrderChangeUntilUpdate = null
      window.removeEventListener('mousemove', this.onDraggingMouseMove)
      if (this.draggingDetachTimeout) {
        window.clearTimeout(this.draggingDetachTimeout)
        this.draggingDetachThreshold = null
      }
      this.itemFinishedDragging()
    }

    itemFinishedDragging () {
      // move item back to it's actual position, from the mouse position
      if (this.elementRef) {
        window.requestAnimationFrame(() => {
          // need to check if element is still around
          if (!this.elementRef) {
            return
          }
          const lastPos = this.elementRef.style.getPropertyValue('--dragging-delta-x')
          if (lastPos !== '') { // default for a property not set is empty string
            if (!this.elementRef) {
              console.warn(`[${WithDragSortDetach.displayName || 'withDragSortDetach'}] itemFinishedDragging - Ref element was not received - could not set its visual position!`)
              return
            }
            this.elementRef.style.removeProperty('--dragging-delta-x')
            // $FlowFixMe flow does not support .animate
            this.elementRef.animate([{
              transform: `translateX(${lastPos})`
            }, {
              transform: 'translateX(0)'
            }], {
              duration: 240,
              easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
            })
          }
        })
      }
    }

    onDraggingMouseMove = (e: MouseEventClientPoint) => {
      const position = translateEventFromSendMouseMoveInput(e)
      if (!this.isSingleItem() || !this.props.onDragMoveSingleItem) {
        // move item with mouse (rAF - smooth)
        this.dragItemMouseMoveFrame = this.dragItemMouseMoveFrame || window.requestAnimationFrame(this.dragItem.bind(this, position))
      }
      if (this.props.dragProcessMoves) {
        if (!this.isSingleItem()) {
          // don't continue if we're about to detach
          // we'll soon get the props change to remove mouse event listeners
          if (!this.hasRequestedDetach) {
            // change order of items when passed boundaries (debounced - helps being smooth)
            this.onDraggingMouseMoveDetectSortChangeThrottled(position)
          }
        } else {
          this.onItemDraggingMoveSingleItemWindow()
        }
      }
    }

    dragItem (e: MouseEventClientPoint) {
      // cache just in case we need to force the item to move to the mouse cursor
      // without a mousemove event
      this.currentMouseX = e.clientX
      if (!this.elementRef || !this.parentClientRect) {
        return
      }
      this.dragItemMouseMoveFrame = null
      const relativeLeft = this.props.relativeXDragStart
      // include any gap between parent edge and first item
      const currentX = this.elementRef.offsetLeft - this.parentClientRect.offsetDifference
      const deltaX = this.currentMouseX - this.parentClientRect.left - currentX - relativeLeft
      this.elementRef.style.setProperty('--dragging-delta-x', deltaX + 'px')
    }

    onDraggingMouseMoveDetectSortChange (e: MouseEventClientPoint) {
      if (!this.parentClientRect || !this.draggingItemWidth) {
        return
      }
      // find when the order should be changed
      // ...but don't if we already have requested it,
      // instead, wait until the order changes
      if (this.suspendOrderChangeUntilUpdate) {
        return
      }
      // assumes all (non-dragging) items in this group have same width
      // we need to consider the current drag item width, and the width of the other items
      // as they may differ due to using the width of the item from the source window
      // during a drag operation
      const dragItemWidth = this.draggingItemWidth
      const itemWidth = this.nonDraggingItemWidth || this.draggingItemWidth
      const itemLeft = e.clientX - this.parentClientRect.left - this.props.relativeXDragStart
      // detect when to ask for detach
      if (this.props.dragCanDetach) {
        // detach threshold is a time thing
        // If it's been outside of the bounds for X time, then we can detach
        const isOutsideBounds =
        e.clientX < 0 - DRAG_DETACH_PX_THRESHOLD_X ||
        e.clientX > this.parentClientRect.windowWidth + DRAG_DETACH_PX_THRESHOLD_X ||
        e.clientY < this.parentClientRect.y - (this.draggingDetachThreshold || 0) ||
        e.clientY > this.parentClientRect.y + this.parentClientRect.height + this.draggingDetachThreshold
        if (isOutsideBounds) {
          // start a timeout to see if we're still outside, don't restart if we already started one
          this.draggingDetachTimeout = this.draggingDetachTimeout || window.setTimeout(() => {
            this.hasRequestedDetach = true
            this.props.onRequestDetach(itemLeft, this.parentClientRect ? this.parentClientRect.top : 0)
          }, DRAG_DETACH_MS_TIME_BUFFER)
          return
        } else {
          // we're not outside, so reset the timer
          if (this.draggingDetachTimeout) {
            window.clearTimeout(this.draggingDetachTimeout)
            this.draggingDetachTimeout = null
          }
        }
      }
      // calculate destination index to move item to
      // based on coords of dragged item
      const destinationIndex = this.detectDragIndexPosition(
        itemWidth,
        dragItemWidth,
        itemLeft
      )
      if (destinationIndex == null) {
        return
      }
      // ask consumer to change the index
      // it can respond that it will make the change async, and we shouldn't ask
      // for a further index change until after the next index change (see cDU for that detection)
      const suspendOrderChangeUntilUpdate = this.props.onDragChangeIndex(this.props.displayIndex, destinationIndex)
      if (suspendOrderChangeUntilUpdate === true) {
        this.suspendOrderChangeUntilUpdate = true
      }
      // if the requested index is different to the current index
      if (this.props.displayIndex !== destinationIndex) {
        // a display index has changed, so increase the threshold
        // required for detach (different axis of movement)
        this.draggingDetachThreshold = DRAG_DETACH_PX_THRESHOLD_POSTSORT
      }
    }

    detectDragIndexPosition (itemWidth: number, dragItemWidth: number, itemLeft: number): ?number {
      const lastIndex = this.props.totalItemCount - 1
      const itemRight = itemLeft + dragItemWidth
      if (!this.parentClientRect || this.parentClientRect.width == null) {
        this.logWarning('Required calculation of drag surface width was not provided!')
        return
      }
      if (itemLeft < 0 - DRAG_PAGEMOVE_PX_THRESHOLD) {
        // item is past the pagemove left threshold,
        // so ask for the last index of the previous page
        // unless we are already at the first page
        return Math.max(0, this.props.firstItemDisplayIndex - 1)
      } else if (itemRight > this.parentClientRect.width + DRAG_PAGEMOVE_PX_THRESHOLD) {
        // item is past the pagemove right threshold,
        // so ask for the first index of the next page
        // unless we are already at the last page
        return Math.min(lastIndex, this.props.firstItemDisplayIndex + this.props.displayedItemCount)
      } else {
        // calculate which index within the group a item would be if it started at
        // the left edge of the dragged item (do not consider the dragged item width since it can be different)
        const groupIndexOfItemLeft = Math.floor((itemLeft - (itemWidth / 2)) / itemWidth) + 1
        // make sure the index we want to move the item is within the allowed range
        return Math.max(
          0,
          Math.min(this.props.totalItemCount - 1, this.props.firstItemDisplayIndex + groupIndexOfItemLeft)
        )
      }
    }

    onItemDraggingMoveSingleItemWindow () {
      if (!this.elementRef) {
        return
      }
      // send the store the location of the item to the window
      // so that it can calculate where to move the window
      // cached
      const { left, top } = this.singleItemPosition = this.singleItemPosition || this.elementRef.getBoundingClientRect()
      if (this.props.onDragMoveSingleItem) {
        this.props.onDragMoveSingleItem(left, top)
      }
    }
    // class end
  }
  // give the component a meaningful name in case the render tree is inspected by a human
//  WithDragSortDetach.displayName =
  return WithDragSortDetach
}
