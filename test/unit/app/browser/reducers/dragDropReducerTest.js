/* global describe, it, before, after */
const Immutable = require('immutable')
const assert = require('assert')

const appConstants = require('../../../../../js/constants/appConstants')
const dragTypes = require('../../../../../js/constants/dragTypes')
require('../../../braveUnit')

describe('dragDropReducer', function () {
  let dragDropReducer
  before(function () {
    dragDropReducer = require('../../../../../app/browser/reducers/dragDropReducer')
  })

  after(function () {
  })

  describe('APP_DRAG_STARTED', function () {
    it('sets drag data from the action', function () {
      const state = Immutable.Map()
      const action = {
        actionType: appConstants.APP_DRAG_STARTED,
        windowId: 7,
        dragType: dragTypes.BOOKMARK,
        dragData: {
          meaningOfLife: 42
        }
      }
      const newState = dragDropReducer(state, action).toJS()
      assert.equal(newState.dragData.windowId, action.windowId)
      assert.equal(newState.dragData.type, action.dragType)
      assert.deepEqual(newState.dragData.data, action.dragData)
    })
  })
  describe('APP_DRAG_STOPPED', function () {
    it('deletes drag data from the action', function () {
      const state = Immutable.fromJS({
        dragData: {
          windowId: 7,
          type: dragTypes.BOOKMARK,
          data: {
            meaningOfLife: 42
          },
          dropWindowId: 73,
          dragOverData: {
            twinOf73: 71
          }
        }
      })
      const action = {
        actionType: appConstants.APP_DRAG_STOPPED
      }
      const newState = dragDropReducer(state, action).toJS()
      assert.equal(newState.dragData, undefined)
    })
  })
  describe('APP_DRAG_DROPPED', function () {
    it('sets the drop window ID', function () {
      const state = Immutable.Map()
      const action = {
        actionType: appConstants.APP_DATA_DROPPED,
        dropWindowId: 71
      }
      const newState = dragDropReducer(state, action).toJS()
      assert.equal(newState.dragData.dropWindowId, action.dropWindowId)
    })
    it('does not overwrite existing dragData', function () {
      const state = Immutable.fromJS({
        dragData: {
          windowId: 73
        }
      })
      const action = {
        actionType: appConstants.APP_DATA_DROPPED,
        dropWindowId: 71
      }
      const newState = dragDropReducer(state, action).toJS()
      assert.equal(newState.dragData.dropWindowId, action.dropWindowId)
      assert.equal(newState.dragData.windowId, state.getIn(['dragData', 'windowId']))
    })
  })
  describe('APP_DRAG_OVER', function () {
    it('sets the drag over data', function () {
      const state = Immutable.Map()
      const action = {
        actionType: appConstants.APP_DRAGGED_OVER,
        draggedOverData: {
          twinOf73: 71
        }
      }
      const newState = dragDropReducer(state, action).toJS()
      assert.deepEqual(newState.dragData.dragOverData, action.draggedOverData)
    })
    it('does not overwrite existing dragData', function () {
      const state = Immutable.fromJS({
        dragData: {
          windowId: 73
        }
      })
      const action = {
        actionType: appConstants.APP_DRAGGED_OVER,
        draggedOverData: {
          twinOf73: 71
        }
      }
      const newState = dragDropReducer(state, action).toJS()
      assert.equal(newState.dragData.windowId, state.getIn(['dragData', 'windowId']))
      assert.deepEqual(newState.dragData.dragOverData, action.draggedOverData)
    })
  })
})
