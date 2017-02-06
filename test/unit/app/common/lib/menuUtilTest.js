/* global describe, before, after, it */
const siteTags = require('../../../../../js/constants/siteTags')
const mockery = require('mockery')
const assert = require('assert')
const Immutable = require('immutable')

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
    // This is required; commonMenu is included by menuUtil (and references electron)
    mockery.registerMock('electron', require('../../../lib/fakeElectron'))
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

  describe('setTemplateItemChecked', function () {
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
      const newTemplate = menuUtil.setTemplateItemChecked(defaultTemplate, 'Bookmarks Toolbar', true)
      assert.deepEqual(newTemplate.toJS(), expectedTemplate.toJS())
    })
    it('returns null when no change is made', function () {
      const newTemplate = menuUtil.setTemplateItemChecked(defaultTemplate, 'Bookmarks Toolbar', false)
      assert.equal(newTemplate, null)
    })
  })

  describe('createBookmarkTemplateItems', function () {
    it('returns an array of items w/ the bookmark tag', function () {
      const appStateSites = Immutable.fromJS([
        { tags: [siteTags.BOOKMARK], title: 'my website', location: 'https://brave.com' }
      ])

      const menuItems = menuUtil.createBookmarkTemplateItems(appStateSites)

      assert.equal(Array.isArray(menuItems), true)
      assert.equal(menuItems.length, 1)
      assert.equal(menuItems[0].label, 'my website')
    })
    it('prefers the customTitle field for the bookmark title (over the page title)', function () {
      const appStateSites = Immutable.fromJS([
        { tags: [siteTags.BOOKMARK], customTitle: 'use this', title: 'not this', location: 'https://brave.com' }
      ])

      const menuItems = menuUtil.createBookmarkTemplateItems(appStateSites)

      assert.equal(menuItems[0].label, 'use this')
    })
    it('only returns bookmarks that have a location set', function () {
      const appStateSites = Immutable.fromJS({
        sites: [
          { tags: [siteTags.BOOKMARK], title: 'not valid', location: '' }
        ]
      })

      const menuItems = menuUtil.createBookmarkTemplateItems(appStateSites)

      assert.deepEqual(menuItems, [])
    })
    it('returns empty array if no bookmarks present', function () {
      const appStateSites = Immutable.fromJS({
        sites: [
          { tags: [], title: 'this is a history entry', location: 'https://brave.com' }
        ]
      })

      const menuItems = menuUtil.createBookmarkTemplateItems(appStateSites)

      assert.deepEqual(menuItems, [])
    })
    it('does not count pinned tabs as bookmarks', function () {
      const appStateSites = Immutable.fromJS([
        { tags: [siteTags.PINNED], title: 'pinned site', location: 'https://pinned-website.com' },
        { tags: [siteTags.BOOKMARK], title: 'my website', location: 'https://brave.com' }
      ])
      const menuItems = menuUtil.createBookmarkTemplateItems(appStateSites)

      assert.equal(menuItems.length, 1)
      assert.equal(menuItems[0].label, 'my website')
    })
    it('processes folders', function () {
      const appStateSites = Immutable.fromJS([
        { tags: [siteTags.BOOKMARK_FOLDER], title: 'my folder', folderId: 123 },
        { tags: [siteTags.BOOKMARK], title: 'my website', location: 'https://brave.com', parentFolderId: 123 }
      ])
      const menuItems = menuUtil.createBookmarkTemplateItems(appStateSites)

      assert.equal(menuItems.length, 1)
      assert.equal(menuItems[0].label, 'my folder')
      assert.equal(menuItems[0].submenu.length, 1)
      assert.equal(menuItems[0].submenu[0].label, 'my website')
    })
    it('considers customTitle when processing folders', function () {
      const appStateSites = Immutable.fromJS([
        { tags: [siteTags.BOOKMARK_FOLDER], customTitle: 'use this', title: 'not this', folderId: 123 },
        { tags: [siteTags.BOOKMARK], title: 'my website', location: 'https://brave.com', parentFolderId: 123 }
      ])

      const menuItems = menuUtil.createBookmarkTemplateItems(appStateSites)

      assert.equal(menuItems.length, 1)
      assert.equal(menuItems[0].label, 'use this')
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
    it('only shows the last 10 items', function () {
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
      assert.equal(menuItems[2].label, windowStateClosedFrames.get(1).get('title'))
      assert.equal(menuItems[11].label, windowStateClosedFrames.get(10).get('title'))
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
