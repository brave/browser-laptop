/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const appConstants = require('../../../../../js/constants/appConstants')
const windowConstants = require('../../../../../js/constants/windowConstants')
const fakeElectron = require('../../../lib/fakeElectron')
const fakeAdBlock = require('../../../lib/fakeAdBlock')

require('../../../braveUnit')

describe('menu reducer unit tests', function () {
  let menuReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    const fakeLocale = {
      translation: (token) => { return token }
    }

    const fakeMenuUtil = {
      createRecentlyClosedTemplateItems: (closedFrames) => {
        return []
      },
      updateRecentlyClosedMenuItems: (menu, closedFrames) => {},
      createBookmarkTemplateItems: (sites) => {
        return []
      },
      createOtherBookmarkTemplateItems: (sites) => {
        return []
      },
      getMenuItem: (menu, label) => {
        return {
          click: () => {}
        }
      }
    }

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../js/l10n', fakeLocale)
    mockery.registerMock('../common/lib/menuUtil', fakeMenuUtil)
    menuReducer = require('../../../../../app/browser/reducers/menuReducer')
  })

  after(function () {
    mockery.disable()
  })

  const assertNoStateChange = (actionType) => {
    const input = Immutable.fromJS({bookmarks: {}, keyGoesHere: 'valueGoesHere'})
    const output = menuReducer(input, {actionType})
    assert.deepEqual(input, output)
  }

  describe('APP_ADD_BOOKMARK', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_ADD_BOOKMARK)
    })
  })

  describe('APP_EDIT_BOOKMARK', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_EDIT_BOOKMARK)
    })
  })

  describe('APP_MOVE_BOOKMARK', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_MOVE_BOOKMARK)
    })
  })

  describe('APP_REMOVE_BOOKMARK', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_REMOVE_BOOKMARK)
    })
  })

  describe('APP_ADD_BOOKMARK_FOLDER', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_ADD_BOOKMARK_FOLDER)
    })
  })

  describe('APP_MOVE_BOOKMARK_FOLDER', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_MOVE_BOOKMARK_FOLDER)
    })
  })

  describe('APP_EDIT_BOOKMARK_FOLDER', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_EDIT_BOOKMARK_FOLDER)
    })
  })

  describe('APP_REMOVE_BOOKMARK_FOLDER', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_REMOVE_BOOKMARK_FOLDER)
    })
  })

  describe('APP_SET_STATE', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_SET_STATE)
    })
  })

  describe('WINDOW_SET_FOCUSED_FRAME', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(windowConstants.WINDOW_SET_FOCUSED_FRAME)
    })
  })

  describe('APP_CHANGE_SETTING', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_CHANGE_SETTING)
    })
  })

  describe('WINDOW_UNDO_CLOSED_FRAME', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(windowConstants.WINDOW_UNDO_CLOSED_FRAME)
    })
  })

  describe('WINDOW_CLEAR_CLOSED_FRAMES', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(windowConstants.WINDOW_CLEAR_CLOSED_FRAMES)
    })
  })

  describe('APP_TAB_CLOSE_REQUESTED', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_TAB_CLOSE_REQUESTED)
    })
  })

  describe('APP_APPLY_SITE_RECORDS', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_APPLY_SITE_RECORDS)
    })
  })

  describe('APP_ADD_SITE', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_ADD_SITE)
    })
  })

  describe('APP_REMOVE_SITE', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_REMOVE_SITE)
    })
  })

  describe('APP_ON_CLEAR_BROWSING_DATA', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(appConstants.APP_ON_CLEAR_BROWSING_DATA)
    })
  })

  describe('WINDOW_CLICK_MENUBAR_SUBMENU', function () {
    it('state is returned unchanged', function () {
      assertNoStateChange(windowConstants.WINDOW_CLICK_MENUBAR_SUBMENU)
    })
  })
})
