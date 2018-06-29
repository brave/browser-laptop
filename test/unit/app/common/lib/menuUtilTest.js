/* global describe, before, after, it */
const siteTags = require('../../../../../js/constants/siteTags')
const mockery = require('mockery')
const sinon = require('sinon')
const assert = require('assert')
const Immutable = require('immutable')
// This is required; commonMenu is included by menuUtil (and references electron)
const fakeElectron = require('../../../lib/fakeElectron')

require('../../../braveUnit')

describe('menuUtil tests', function () {
  let menuUtil
  let separator

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    menuUtil = require('../../../../../app/common/lib/menuUtil')
    separator = require('../../../../../app/common/commonMenu').separatorMenuItem
  })

  after(function () {
    mockery.disable()
  })

  describe('getMenuItem', function () {
    const defaultMenu = {
      items: [
        {
          label: 'File',
          submenu: {
            items: [
              { label: 'open', temp: 1 },
              { label: 'quit', temp: 2 }
            ]
          }
        },
        {
          label: 'Edit',
          submenu: {
            items: [
              { label: 'copy', temp: 3 },
              { label: 'paste', temp: 4 }
            ]
          }
        },
        {
          label: 'Bookmarks',
          submenu: {
            items: [
              {
                label: 'Bookmarks Toolbar',
                type: 'checkbox',
                checked: false
              },
              {
                label: 'bookmark folder 1',
                submenu: {
                  items: [
                    { label: 'my bookmark', url: 'https://brave.com' }
                  ]
                }
              }
            ]
          }
        }
      ]
    }

    it('returns the electron MenuItem based on the label', function () {
      const menuItem = menuUtil.getMenuItem(defaultMenu, 'quit')
      assert.equal(menuItem.temp, 2)
    })
    it('returns null if label is not found', function () {
      const menuItem = menuUtil.getMenuItem(defaultMenu, 'not-in-here')
      assert.equal(menuItem, null)
    })
    it('searches the menu recursively based on the label', function () {
      const menuItem = menuUtil.getMenuItem(defaultMenu, 'my bookmark')
      assert.equal(menuItem.url, 'https://brave.com')
    })
  })

  describe('setTemplateItemAttribute', function () {
    const defaultTemplate = Immutable.fromJS([
      {
        'label': 'Bookmarks',
        'submenu': [
          {
            'label': 'Bookmarks Toolbar',
            'type': 'checkbox',
            'checked': false
          }
        ]
      }
    ])

    it('returns the new template when checked status is updated', function () {
      const expectedTemplate = Immutable.fromJS([
        {
          'label': 'Bookmarks',
          'submenu': [
            {
              'label': 'Bookmarks Toolbar',
              'type': 'checkbox',
              'checked': true
            }
          ]
        }
      ])
      const newTemplate = menuUtil.setTemplateItemAttribute(defaultTemplate, 'Bookmarks Toolbar', 'checked', true)
      assert.deepEqual(newTemplate.toJS(), expectedTemplate.toJS())
    })
    it('returns null when no change is made', function () {
      const newTemplate = menuUtil.setTemplateItemAttribute(defaultTemplate, 'Bookmarks Toolbar', 'checked', false)
      assert.equal(newTemplate, null)
    })
  })

  describe('createBookmarkTemplateItems', function () {
    it('returns an array of items w/ the bookmark tag', function () {
      const appState = Immutable.fromJS({
        bookmarks: {
          'https://brave.com|0|0': {
            title: 'my website',
            location: 'https://brave.com',
            parentFolderId: 0,
            type: siteTags.BOOKMARK,
            key: 'https://brave.com|0|0'
          }
        },
        cache: {
          bookmarkOrder: {
            '0': [
              {
                order: 0,
                key: 'https://brave.com|0|0',
                type: siteTags.BOOKMARK
              }
            ]
          }
        }
      })

      const menuItems = menuUtil.createBookmarkTemplateItems(appState, 0)

      assert.equal(Array.isArray(menuItems), true)
      assert.equal(menuItems.length, 1)
      assert.equal(menuItems[0].label, 'my website')
    })
    it('only returns bookmarks that have a location set', function () {
      const appState = Immutable.fromJS({
        bookmarks: {
          '|0|0': {
            title: 'my website',
            location: '',
            parentFolderId: 0,
            type: siteTags.BOOKMARK,
            key: '|0|0'
          }
        },
        cache: {
          bookmarkOrder: {
            '0': [
              {
                order: 0,
                key: '|0|0',
                type: siteTags.BOOKMARK
              }
            ]
          }
        }
      })

      const menuItems = menuUtil.createBookmarkTemplateItems(appState)

      assert.deepEqual(menuItems, [])
    })
    it('returns empty array if no bookmarks present', function () {
      const appState = Immutable.fromJS({
        bookmarks: {},
        cache: {
          bookmarkOrder: {}
        }
      })

      const menuItems = menuUtil.createBookmarkTemplateItems(appState)

      assert.deepEqual(menuItems, [])
    })
    it('processes folders', function () {
      const appState = Immutable.fromJS({
        bookmarks: {
          'https://brave.com|0|123': {
            title: 'my website',
            location: 'https://brave.com',
            parentFolderId: 123,
            type: siteTags.BOOKMARK,
            key: 'https://brave.com|0|123'
          }
        },
        bookmarkFolders: {
          '123': {
            type: siteTags.BOOKMARK_FOLDER,
            title: 'my folder',
            folderId: 123,
            key: '123'
          }
        },
        cache: {
          bookmarkOrder: {
            '0': [
              {
                order: 0,
                key: '123',
                type: siteTags.BOOKMARK_FOLDER
              }
            ],
            '123': [
              {
                order: 0,
                key: 'https://brave.com|0|123',
                type: siteTags.BOOKMARK
              }
            ]
          }
        }
      })
      const menuItems = menuUtil.createBookmarkTemplateItems(appState)

      assert.equal(menuItems.length, 1)
      assert.equal(menuItems[0].label, 'my folder')
      assert.equal(menuItems[0].submenu.length, 1)
      assert.equal(menuItems[0].submenu[0].label, 'my website')
    })
  })

  describe('createRecentlyClosedTemplateItems', function () {
    it('returns an array of closedFrames preceded by a separator and "Recently Closed" items', function () {
      const windowStateClosedFrames = Immutable.fromJS([{
        title: 'sample',
        location: 'https://brave.com'
      }])
      const menuItems = menuUtil.createRecentlyClosedTemplateItems(windowStateClosedFrames)

      assert.equal(Array.isArray(menuItems), true)
      assert.equal(menuItems.length, 3)
      assert.equal(menuItems[0].type, 'separator')
      assert.equal(menuItems[1].label, 'RECENTLYCLOSED')
      assert.equal(menuItems[1].enabled, false)
      assert.equal(menuItems[2].label, windowStateClosedFrames.first().get('title'))
      assert.equal(typeof menuItems[2].click === 'function', true)
    })

    it('shows the last 10 items in reverse order (top == last closed)', function () {
      const windowStateClosedFrames = Immutable.fromJS([
        { title: 'site01', location: 'https://brave01.com' },
        { title: 'site02', location: 'https://brave02.com' },
        { title: 'site03', location: 'https://brave03.com' },
        { title: 'site04', location: 'https://brave04.com' },
        { title: 'site05', location: 'https://brave05.com' },
        { title: 'site06', location: 'https://brave06.com' },
        { title: 'site07', location: 'https://brave07.com' },
        { title: 'site08', location: 'https://brave08.com' },
        { title: 'site09', location: 'https://brave09.com' },
        { title: 'site10', location: 'https://brave10.com' },
        { title: 'site11', location: 'https://brave11.com' }
      ])
      const menuItems = menuUtil.createRecentlyClosedTemplateItems(windowStateClosedFrames)

      assert.equal(menuItems.length, 12)
      assert.equal(menuItems[11].label, windowStateClosedFrames.get(1).get('title'))
      assert.equal(menuItems[2].label, windowStateClosedFrames.get(10).get('title'))
    })

    it('returns hidden heading menu items if lastClosedFrames is null, empty, or undefined', function () {
      const hiddenItems = menuUtil.recentlyClosedHeadingTemplates().map((item) => {
        item.visible = false
        return item
      })
      assert.deepEqual(menuUtil.createRecentlyClosedTemplateItems(), hiddenItems)
      assert.deepEqual(menuUtil.createRecentlyClosedTemplateItems(null), hiddenItems)
      assert.deepEqual(menuUtil.createRecentlyClosedTemplateItems(Immutable.fromJS({})), hiddenItems)
    })
  })

  describe('updateRecentlyClosedMenuItems', function () {
    const url1 = 'https://brave01.com'
    const url2 = 'https://brave02.com'
    const url3 = 'https://brave03.com'
    const url4 = 'about:extensions'
    const url5 = 'about:about'
    const frame1 = new Immutable.Map({title: 'site1', location: url1})
    const frame2 = new Immutable.Map({title: 'site2', location: url2})
    const frame3 = new Immutable.Map({title: 'site3', location: url3})
    const frame4 = new Immutable.Map({title: 'site4', location: url4})
    const frame5 = new Immutable.Map({title: 'site5', location: url5})
    const frameMatcher = (frame) => {
      return (menuItem) => {
        return menuItem.id === menuUtil.getRecentlyClosedMenuId(frame.get('location'))
      }
    }

    before(function () {
      this.historyMenu = {
        submenu: {
          insert: sinon.spy(),
          items: []
        }
      }
      sinon.stub(menuUtil, 'getMenuItem').returns(this.historyMenu)
    })

    after(function () {
      menuUtil.getMenuItem.restore()
    })

    it('inserts new closed frames, with more recent frames appearing first', function () {
      let closedFrames = new Immutable.OrderedMap()
      closedFrames = closedFrames.set(frame1.get('location'), frame1)
      closedFrames = closedFrames.set(frame2.get('location'), frame2)
      closedFrames = closedFrames.set(frame3.get('location'), frame3)
      menuUtil.updateRecentlyClosedMenuItems({}, closedFrames)
      sinon.assert.calledWith(
        this.historyMenu.submenu.insert.getCall(0),
        0, sinon.match(frameMatcher(frame3))
      )
      sinon.assert.calledWith(
        this.historyMenu.submenu.insert.getCall(1),
        1, sinon.match(frameMatcher(frame2))
      )
      sinon.assert.calledWith(
        this.historyMenu.submenu.insert.getCall(2),
        2, sinon.match(frameMatcher(frame1))
      )
    })

    it('does not insert duplicate frames', function () {
      let closedFrames = new Immutable.OrderedMap()
      closedFrames = closedFrames.set(frame1.get('location'), frame1)
      this.historyMenu = {
        submenu: {
          insert: sinon.spy(),
          items: [
            {
              id: menuUtil.getRecentlyClosedMenuId(frame1.get('location')),
              label: 'site1',
              visible: true
            }
          ]
        }
      }
      menuUtil.updateRecentlyClosedMenuItems({}, closedFrames)
      assert(this.historyMenu.submenu.insert.notCalled)
    })

    it('does not insert about pages', function () {
      let closedFrames = new Immutable.OrderedMap()
      closedFrames = closedFrames.set(frame4.get('location'), frame4)
      closedFrames = closedFrames.set(frame5.get('location'), frame5)
      this.historyMenu = {
        submenu: {
          insert: sinon.spy(),
          items: [
            {
              id: menuUtil.getRecentlyClosedMenuId(frame3.get('location')),
              label: 'site3',
              visible: true
            },
            {
              id: menuUtil.getRecentlyClosedMenuId(frame2.get('location')),
              label: 'site2',
              visible: true
            },
            {
              id: menuUtil.getRecentlyClosedMenuId(frame1.get('location')),
              label: 'site1',
              visible: true
            }
          ]
        }
      }
      menuUtil.updateRecentlyClosedMenuItems({}, closedFrames)
      assert(this.historyMenu.submenu.insert.notCalled)
    })

    it('hides closed frames which have been reopened', function () {
      let closedFrames = new Immutable.OrderedMap()
      closedFrames = closedFrames.set(frame1.get('location'), frame1)
      closedFrames = closedFrames.set(frame2.get('location'), frame2)
      this.historyMenu = {
        submenu: {
          insert: sinon.spy(),
          items: [
            {
              id: menuUtil.getRecentlyClosedMenuId(frame2.get('location')),
              label: 'site2',
              visible: true
            },
            {
              id: menuUtil.getRecentlyClosedMenuId(frame1.get('location')),
              label: 'site1',
              visible: true
            }
          ]
        }
      }
      menuUtil.updateRecentlyClosedMenuItems({}, closedFrames)
      sinon.assert.notCalled(this.historyMenu.submenu.insert)
      closedFrames.delete(frame2.get('location'))
      menuUtil.updateRecentlyClosedMenuItems({}, closedFrames)
      assert(this.historyMenu.submenu.items[0].visible, false)
      assert(this.historyMenu.submenu.items[1].visible, true)
    })
  })

  describe('sanitizeTemplateItems', function () {
    it('removes entries which are falsey', function () {
      const template = [null, undefined, false, {label: 'lol'}]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol'}]
      assert.deepEqual(result, expectedResult)
    })
    it('removes duplicate menu separators', function () {
      const template = [{label: 'lol1'}, separator, separator, {label: 'lol2'}]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol1'}, separator, {label: 'lol2'}]
      assert.deepEqual(result, expectedResult)
    })
    it('allows l10nLabelId instead of label', function () {
      const template = [{l10nLabelId: 'lol1'}]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{l10nLabelId: 'lol1'}]
      assert.deepEqual(result, expectedResult)
    })
    it('checks submenus recursively', function () {
      const template = [separator, {test: 'test'}, {label: 'lol'},
        { label: 'submenu', submenu: [separator, {label: 'foo'}, {labelDataBind: 'zoomLevel'}] }]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol'}, {label: 'submenu', submenu: [{label: 'foo'}, {labelDataBind: 'zoomLevel'}]}]

      assert.deepEqual(result, expectedResult)
    })
    it('removes items which are missing label or type', function () {
      const template = [{}, {test: 'test'}, {label: 'lol'}]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol'}]
      assert.deepEqual(result, expectedResult)
    })
    it('removes items which have non-string values for label or type', function () {
      const template = [{label: true}, {type: function () { console.log('test') }}, {label: 'lol'}]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol'}]
      assert.deepEqual(result, expectedResult)
    })
    it('always returns an array (even for one item)', function () {
      const template = [{label: 'lol'}]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol'}]
      assert.deepEqual(result, expectedResult)
    })
    it('does not allow the list to start with a separator', function () {
      const template = [separator, {label: 'lol'}]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol'}]
      assert.deepEqual(result, expectedResult)
    })
    it('does not allow the list to end with a separator', function () {
      const template = [{label: 'lol'}, separator]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = [{label: 'lol'}]
      assert.deepEqual(result, expectedResult)
    })
    it('does not allow only a separator', function () {
      const template = [separator]
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = []
      assert.deepEqual(result, expectedResult)
    })
    it('supports empty arrays', function () {
      const template = []
      const result = menuUtil.sanitizeTemplateItems(template)
      const expectedResult = []
      assert.deepEqual(result, expectedResult)
    })
  })
})
