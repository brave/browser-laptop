/* global describe, it */

const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const assert = require('assert')
const Immutable = require('immutable')

describe('siteUtil', function () {
  const testUrl1 = 'https://brave.com/'
  const testUrl2 = 'http://example.com/'
  const testFavicon1 = 'https://brave.com/favicon.ico'
  const emptySites = Immutable.fromJS({})
  const bookmarkAllFields = Immutable.fromJS({
    lastAccessedTime: 123,
    tags: [siteTags.BOOKMARK],
    location: testUrl1,
    title: 'sample',
    parentFolderId: 0,
    partitionNumber: 0
  })
  const bookmarkMinFields = Immutable.fromJS({
    location: testUrl1,
    title: 'sample',
    parentFolderId: 0
  })
  const folderMinFields = Immutable.fromJS({
    customTitle: 'folder1',
    parentFolderId: 0,
    tags: [siteTags.BOOKMARK_FOLDER]
  })
  const siteMinFields = Immutable.fromJS({
    location: testUrl1,
    title: 'sample'
  })

  describe('getSiteKey', function () {
    it('returns null if siteDetail is falsey', function () {
      const key = siteUtil.getSiteKey(null)
      assert.equal(key, null)
    })
    describe('matching `BOOKMARK_FOLDER`', function () {
      it('returns key if folderId matches', function () {
        const siteDetail = Immutable.fromJS({
          folderId: 1
        })
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, 1)
      })
      it('returns null if folderId is missing', function () {
        const siteDetail = new Immutable.Map()
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, null)
      })
    })
    describe('matching `BOOKMARK`', function () {
      it('returns key if location and partitionNumber match', function () {
        const siteDetail = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 0
        })
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, testUrl1 + '00')
      })
      it('returns key if location matches and partitionNumber is NOT present', function () {
        const siteDetail = Immutable.fromJS({
          location: testUrl1
        })
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, testUrl1 + '00')
      })
      it('returns null if location is missing', function () {
        const siteDetail = new Immutable.Map()
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, null)
      })
    })
  })

  describe('isSiteBookmarked', function () {
    it('returns true if site is bookmarked', function () {
      const site = {
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      }
      const siteDetail = Immutable.fromJS(site)
      const key = siteUtil.getSiteKey(siteDetail)
      const sites = {}
      sites[key] = site
      const result = siteUtil.isSiteBookmarked(Immutable.fromJS(sites), siteDetail)
      assert.equal(result, true)
    })
    it('returns false if site is not bookmarked', function () {
      const site = {
        location: testUrl2,
        tags: [siteTags.BOOKMARK]
      }
      const key = siteUtil.getSiteKey(Immutable.fromJS(site))
      const sites = {}
      sites[key] = site
      const result = siteUtil.isSiteBookmarked(Immutable.fromJS(sites), Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      }))
      assert.equal(result, false)
    })
    it('returns false if site is a bookmark folder', function () {
      const site = {
        folderId: 0,
        tags: [siteTags.BOOKMARK_FOLDER]
      }
      const siteDetail = Immutable.fromJS(site)
      const key = siteUtil.getSiteKey(siteDetail)
      const sites = {}
      sites[key] = site
      const result = siteUtil.isSiteBookmarked(Immutable.fromJS(sites), siteDetail)
      assert.equal(result, false)
    })
  })

  describe('getNextFolderId', function () {
    it('returns the next possible folderId', function () {
      const sites = Immutable.fromJS({
        'key1': {
          folderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        },
        'key2': {
          folderId: 1,
          tags: [siteTags.BOOKMARK_FOLDER]
        }
      })
      assert.equal(siteUtil.getNextFolderId(sites), 2)
    })
    it('returns default (0) if sites is falsey', function () {
      assert.equal(siteUtil.getNextFolderId(null), 0)
    })
  })

  describe('addSite', function () {
    it('gets the tag from siteDetail if not provided', function () {
      const processedSites = siteUtil.addSite(emptySites, bookmarkAllFields)
      const processedKey = siteUtil.getSiteKey(bookmarkAllFields)
      assert.deepEqual(processedSites.getIn([processedKey, 'tags']), bookmarkAllFields.get('tags'))
    })
    describe('record count', function () {
      var processedSites
      it('create history record with count', function () {
        processedSites = siteUtil.addSite(emptySites, siteMinFields)
        const processedKey = siteUtil.getSiteKey(siteMinFields)
        assert.deepEqual(processedSites.getIn([processedKey, 'count']), 1)
      })
      it('increments count for history item', function () {
        processedSites = siteUtil.addSite(processedSites, siteMinFields)
        const processedKey = siteUtil.getSiteKey(siteMinFields)
        assert.deepEqual(processedSites.getIn([processedKey, 'count']), 2)
      })
    })
    describe('for new entries (oldSite is null)', function () {
      describe('when adding bookmark', function () {
        it('preserves existing siteDetail fields', function () {
          const processedSites = siteUtil.addSite(emptySites, bookmarkAllFields, siteTags.BOOKMARK)
          const processedKey = siteUtil.getSiteKey(bookmarkAllFields)
          let sites = {}
          sites[processedKey] = bookmarkAllFields.set('order', 0).toJS()
          const expectedSites = Immutable.fromJS(sites)
          assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
        })
        it('sets 0 for lastAccessedTime if not specified', function () {
          const processedSites = siteUtil.addSite(emptySites, bookmarkMinFields, siteTags.BOOKMARK)
          const processedKey = siteUtil.getSiteKey(bookmarkMinFields)
          assert.equal(processedSites.getIn([processedKey, 'lastAccessedTime']), 0)
          assert.deepEqual(processedSites.getIn([processedKey, 'tags']).toJS(), [siteTags.BOOKMARK])
        })
      })
      describe('when adding bookmark folder', function () {
        it('assigns a folderId', function () {
          const processedSites = siteUtil.addSite(emptySites, folderMinFields)
          const folderMinFieldsWithId = folderMinFields.set('folderId', 1)
          const processedKey = siteUtil.getSiteKey(folderMinFieldsWithId)
          const folderId = processedSites.getIn([processedKey, 'folderId'])
          assert.equal(folderId, 1)
        })
        it('allows for new folders to use the same customTitle as an existing folder', function () {
          // Add a new bookmark folder
          let processedSites = siteUtil.addSite(emptySites, folderMinFields)
          const folderMinFieldsWithId1 = folderMinFields.set('folderId', 1)
          const processedKey1 = siteUtil.getSiteKey(folderMinFieldsWithId1)
          const folderId = processedSites.getIn([processedKey1, 'folderId'])
          const bookmark = Immutable.fromJS({
            lastAccessedTime: 123,
            title: 'bookmark1',
            parentFolderId: folderId,
            location: testUrl1,
            tags: [siteTags.BOOKMARK]
          })
          // Add a bookmark into that folder
          processedSites = siteUtil.addSite(processedSites, bookmark)
          const processedKey2 = siteUtil.getSiteKey(bookmark)
          assert.equal(processedSites.size, 2)
          assert.equal(processedSites.getIn([processedKey2, 'parentFolderId']), folderId)

          // Add another bookmark folder with the same name / parentFolderId
          processedSites = siteUtil.addSite(processedSites, folderMinFields)
          const folderMinFieldsWithId2 = folderMinFields.set('folderId', 2)
          const processedKey3 = siteUtil.getSiteKey(folderMinFieldsWithId2)
          assert.equal(processedSites.size, 3)
          const folderId2 = processedSites.getIn([processedKey3, 'folderId'])
          assert.equal(folderId === folderId2, false)

          // Ensure fields for both folders are still in sites array
          assert.equal(processedSites.getIn([processedKey1, 'customTitle']),
            processedSites.getIn([processedKey3, 'customTitle']))
          assert.deepEqual(processedSites.getIn([processedKey1, 'tags']), processedSites.getIn([processedKey3, 'tags']))
        })
        it('calls removeSite on bookmark folders which have the same customTitle/parentFolderId', function () {
          let sites = {}
          const site1 = {
            lastAccessedTime: 123,
            customTitle: 'folder1',
            title: undefined,
            folderId: 1,
            parentFolderId: 0,
            order: 0,
            tags: [siteTags.BOOKMARK_FOLDER]
          }
          const site2 = {
            lastAccessedTime: 123,
            customTitle: 'folder2',
            title: undefined,
            folderId: 2,
            parentFolderId: 1,
            order: 1,
            tags: [siteTags.BOOKMARK_FOLDER]
          }
          const site3 = {
            lastAccessedTime: 123,
            title: 'bookmark1',
            parentFolderId: 1,
            location: testUrl1,
            order: 2,
            tags: [siteTags.BOOKMARK]
          }
          const site4 = {
            lastAccessedTime: 123,
            title: 'bookmark2',
            parentFolderId: 2,
            location: testUrl2,
            order: 3,
            tags: [siteTags.BOOKMARK]
          }
          const siteKey1 = siteUtil.getSiteKey(Immutable.fromJS(site1))
          const siteKey2 = siteUtil.getSiteKey(Immutable.fromJS(site2))
          const siteKey3 = siteUtil.getSiteKey(Immutable.fromJS(site3))
          const siteKey4 = siteUtil.getSiteKey(Immutable.fromJS(site4))
          sites[siteKey1] = site1
          sites[siteKey2] = site2
          sites[siteKey3] = site3
          sites[siteKey4] = site4
          let processedSites = Immutable.fromJS(sites)
          Immutable.fromJS(sites).forEach((site) => {
            processedSites = siteUtil.addSite(processedSites, site)
          })
          const expectedSites = Immutable.fromJS(sites)
          assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
        })
      })
      describe('when adding history', function () {
        it('sets default values for lastAccessedTime and tag when they are missing', function () {
          const processedSites = siteUtil.addSite(emptySites, bookmarkMinFields)
          const processedKey = siteUtil.getSiteKey(bookmarkMinFields)
          assert.equal(!!processedSites.getIn([processedKey, 'lastAccessedTime']), true)
          assert.deepEqual(processedSites.getIn([processedKey, 'tags']).toJS(), [])
        })
      })
    })
    describe('for existing entries (oldSite is an existing siteDetail)', function () {
      it('uses parentFolderId, partitionNumber, and favicon values from old siteDetail if null', function () {
        const oldSiteDetail = Immutable.fromJS({
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          title: 'bookmarked site',
          customTitle: 'old customTitle',
          partitionNumber: 3,
          parentFolderId: 8,
          order: 0,
          favicon: testFavicon1
        })
        const oldSiteKey = siteUtil.getSiteKey(oldSiteDetail)
        const newSiteDetail = Immutable.fromJS({
          lastAccessedTime: 456,
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          title: 'same entry also acts as history entry'
        })
        const expectedSiteDetail = Immutable.fromJS({
          lastAccessedTime: newSiteDetail.get('lastAccessedTime'),
          tags: newSiteDetail.get('tags').toJS(),
          location: newSiteDetail.get('location'),
          title: newSiteDetail.get('title'),
          customTitle: oldSiteDetail.get('customTitle'),
          partitionNumber: oldSiteDetail.get('partitionNumber'),
          parentFolderId: oldSiteDetail.get('parentFolderId'),
          order: oldSiteDetail.get('order'),
          favicon: oldSiteDetail.get('favicon')
        })
        let sites = {}
        sites[oldSiteKey] = oldSiteDetail.toJS()
        const processedSites = siteUtil.addSite(Immutable.fromJS(sites), newSiteDetail, siteTags.BOOKMARK, oldSiteDetail)
        const expectedSiteKey = siteUtil.getSiteKey(expectedSiteDetail)
        let expectedSites = {}
        expectedSites[expectedSiteKey] = expectedSiteDetail.toJS()
        assert.deepEqual(processedSites.toJS(), expectedSites)
      })
      it('overrides the old title with the new title', function () {
        const oldSiteDetail = Immutable.fromJS({
          lastAccessedTime: 123,
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          title: 'old title',
          order: 0,
          customTitle: 'old customTitle'
        })
        const oldSiteKey = siteUtil.getSiteKey(oldSiteDetail)
        const newSiteDetail = Immutable.fromJS({
          lastAccessedTime: 456,
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          title: 'new title',
          customTitle: 'new customTitle'
        })
        let sites = {}
        sites[oldSiteKey] = oldSiteDetail.toJS()
        const processedSites = siteUtil.addSite(Immutable.fromJS(sites), newSiteDetail, siteTags.BOOKMARK, oldSiteDetail)
        const expectedSites = {}
        const expectedSiteKey = siteUtil.getSiteKey(newSiteDetail)
        expectedSites[expectedSiteKey] = newSiteDetail.set('order', 0).toJS()
        assert.deepEqual(processedSites.toJS(), expectedSites)
      })
    })
  })

  describe('removeSite', function () {
    describe('tag=truthy', function () {
      it('removes the entry', function () {
        const siteDetail = {
          tags: [siteTags.BOOKMARK],
          location: testUrl1
        }
        const siteKey = siteUtil.getSiteKey(Immutable.fromJS(siteDetail))
        let sites = {}
        sites[siteKey] = siteDetail
        const processedSites = siteUtil.removeSite(Immutable.fromJS(sites), Immutable.fromJS(siteDetail), siteTags.BOOKMARK)
        const expectedSites = new Immutable.Map()
        assert.deepEqual(processedSites, expectedSites)
      })
      it('removes folder and its children', function () {
        let sites = {}
        const site1 = {
          folderId: 1,
          parentFolderId: 0,
          order: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        const site2 = {
          folderId: 2,
          parentFolderId: 1,
          order: 1,
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        const site3 = {
          parentFolderId: 1,
          location: testUrl1,
          order: 2,
          tags: [siteTags.BOOKMARK]
        }
        const site4 = {
          parentFolderId: 2,
          location: testUrl2,
          order: 3,
          tags: [siteTags.BOOKMARK]
        }
        const siteKey1 = siteUtil.getSiteKey(Immutable.fromJS(site1))
        const siteKey2 = siteUtil.getSiteKey(Immutable.fromJS(site2))
        const siteKey3 = siteUtil.getSiteKey(Immutable.fromJS(site3))
        const siteKey4 = siteUtil.getSiteKey(Immutable.fromJS(site4))
        sites[siteKey1] = site1
        sites[siteKey2] = site2
        sites[siteKey3] = site3
        sites[siteKey4] = site4
        const siteDetail = {
          folderId: 1,
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        const processedSites = siteUtil.removeSite(Immutable.fromJS(sites), Immutable.fromJS(siteDetail), siteTags.BOOKMARK_FOLDER)
        const expectedSites = new Immutable.Map()
        assert.deepEqual(processedSites, expectedSites)
      })
      it('removes with reorder', function () {
        let sites = {}
        let expectedSites = {}
        const site1 = {
          folderId: 1,
          parentFolderId: 0,
          order: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        const site2 = {
          folderId: 2,
          parentFolderId: 1,
          order: 1,
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        const site3 = {
          parentFolderId: 1,
          location: testUrl1,
          order: 2,
          tags: [siteTags.BOOKMARK]
        }
        const site4 = {
          parentFolderId: 2,
          location: testUrl2,
          order: 3,
          tags: [siteTags.BOOKMARK]
        }
        const expectedSite4 = {
          parentFolderId: 2,
          location: testUrl2,
          order: 2,
          tags: [siteTags.BOOKMARK]
        }
        const siteKey1 = siteUtil.getSiteKey(Immutable.fromJS(site1))
        const siteKey2 = siteUtil.getSiteKey(Immutable.fromJS(site2))
        const siteKey3 = siteUtil.getSiteKey(Immutable.fromJS(site3))
        const siteKey4 = siteUtil.getSiteKey(Immutable.fromJS(site4))
        sites[siteKey1] = site1
        sites[siteKey2] = site2
        sites[siteKey3] = site3
        sites[siteKey4] = site4
        expectedSites[siteKey1] = site1
        expectedSites[siteKey2] = site2
        expectedSites[siteKey4] = expectedSite4
        const siteDetail = {
          parentFolderId: 1,
          location: testUrl1,
          tags: [siteTags.BOOKMARK]
        }
        const processedSites = siteUtil.removeSite(Immutable.fromJS(sites), Immutable.fromJS(siteDetail),
          siteTags.BOOKMARK_FOLDER)
        assert.deepEqual(processedSites.toJS(), expectedSites)
      })
    })
    describe('tag=falsey', function () {
      it('deletes a history entry (has no tags)', function () {
        const siteDetail = {
          tags: [],
          location: testUrl1
        }
        const siteKey = siteUtil.getSiteKey(Immutable.fromJS(siteDetail))
        let sites = {}
        sites[siteKey] = siteDetail
        const processedSites = siteUtil.removeSite(Immutable.fromJS(sites), Immutable.fromJS(siteDetail))
        assert.deepEqual(processedSites, Immutable.fromJS({}))
      })
    })
  })

  describe('isMoveAllowed', function () {
    // NOTE: usage taken from Bookmark Manager, which calls aboutActions.moveSite
    it('does not allow you to move a bookmark folder into itself', function () {
      // Add a new bookmark folder
      let processedSites = siteUtil.addSite(emptySites, folderMinFields)
      const folderMinFieldsWithId = folderMinFields.set('folderId', 1)
      const processedKey = siteUtil.getSiteKey(folderMinFieldsWithId)
      const folderId = processedSites.getIn([processedKey, 'folderId'])
      // Add a bookmark into that folder
      processedSites = siteUtil.addSite(processedSites, bookmarkAllFields.set('parentFolderId', folderId))
      const bookmarkFolder = processedSites.get(processedKey)
      // Should NOT be able to move bookmark folder into itself
      assert.equal(false, siteUtil.isMoveAllowed(processedSites, bookmarkFolder, bookmarkFolder))
    })
    it('does not allow you to move an ancestor folder into a descendant folder', function () {
      // Add a new bookmark folder
      let processedSites = siteUtil.addSite(emptySites, folderMinFields)
      const folderMinFieldsWithId1 = folderMinFields.set('folderId', 1)
      const processedKey1 = siteUtil.getSiteKey(folderMinFieldsWithId1)
      const folderId1 = processedSites.getIn([processedKey1, 'folderId'])
      // Add a child below that folder
      processedSites = siteUtil.addSite(processedSites, folderMinFields.set('parentFolderId', folderId1))
      const folderMinFieldsWithId2 = folderMinFields.set('folderId', 2)
      const processedKey2 = siteUtil.getSiteKey(folderMinFieldsWithId2)
      const folderId2 = processedSites.getIn([processedKey2, 'folderId'])
      // Add a folder below the previous child
      processedSites = siteUtil.addSite(processedSites, folderMinFields.set('parentFolderId', folderId2))
      const folderMinFieldsWithId3 = folderMinFields.set('folderId', 3)
      const processedKey3 = siteUtil.getSiteKey(folderMinFieldsWithId3)
      const bookmarkFolder1 = processedSites.get(processedKey1)
      const bookmarkFolder3 = processedSites.get(processedKey3)
      // Should NOT be able to move grandparent folder into its grandchild
      assert.equal(false, siteUtil.isMoveAllowed(processedSites, bookmarkFolder1, bookmarkFolder3))
    })
  })

  describe('moveSite', function () {
  })

  describe('updateSiteFavicon', function () {
    it('updates the favicon for all matching entries (normalizing the URL)', function () {
      const siteDetail1 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK],
        location: testUrl1,
        title: 'bookmarked site',
        lastAccessedTime: 123
      })
      const siteDetail2 = Immutable.fromJS({
        tags: [],
        location: 'https://www.brave.com',
        title: 'history entry',
        lastAccessedTime: 456
      })
      let sites = siteUtil.addSite(emptySites, siteDetail1, siteTags.BOOKMARK)
      sites = siteUtil.addSite(sites, siteDetail2)
      const processedSites = siteUtil.updateSiteFavicon(sites, testUrl1, testFavicon1)
      const updatedSiteDetail1 = siteDetail1.set('favicon', testFavicon1)
      const updatedSiteDetail2 = siteDetail2.set('favicon', testFavicon1)
      let expectedSites = siteUtil.addSite(emptySites, updatedSiteDetail1, siteTags.BOOKMARK)
      expectedSites = siteUtil.addSite(expectedSites, updatedSiteDetail2)

      assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
    })
    it('returns the object unchanged if location is not a URL', function () {
      const sites = siteUtil.addSite(emptySites, bookmarkMinFields, siteTags.BOOKMARK)
      const processedSites = siteUtil.updateSiteFavicon(sites, 'not-a-url', 'https://brave.com/favicon.ico')
      assert.deepEqual(processedSites, sites)
    })
    it('returns the object unchanged if it is not an Immutable.Map', function () {
      const emptyLegacySites = Immutable.fromJS([])
      const processedSites = siteUtil.updateSiteFavicon(emptyLegacySites, testUrl1, 'https://brave.com/favicon.ico')
      assert.deepEqual(processedSites, emptyLegacySites)
    })
    it('works even if null/undefined entries are present', function () {
      const hasInvalidEntries = Immutable.fromJS({
        'null': null,
        'undefined': undefined
      })
      const sites = siteUtil.addSite(hasInvalidEntries, bookmarkMinFields, siteTags.BOOKMARK)
      const processedSites = siteUtil.updateSiteFavicon(sites, testUrl1, 'https://brave.com/favicon.ico')
      const updatedSiteDetail = bookmarkMinFields.set('favicon', 'https://brave.com/favicon.ico')
      const expectedSites = siteUtil.addSite(hasInvalidEntries, updatedSiteDetail, siteTags.BOOKMARK)
      assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
    })
  })

  describe('getDetailFromFrame', function () {
    it('returns an Immutable object with all expected properties', function () {
      const frame = Immutable.fromJS({
        location: testUrl1,
        title: 'test123',
        partitionNumber: 8,
        tag: siteTags.BOOKMARK,
        favicon: testUrl1 + 'favicon.ico'
      })
      const siteDetail = siteUtil.getDetailFromFrame(frame, siteTags.BOOKMARK)
      assert.equal(siteDetail.get('location'), frame.get('location'))
      assert.equal(siteDetail.get('title'), frame.get('title'))
      assert.equal(siteDetail.get('partitionNumber'), frame.get('partitionNumber'))
      assert.deepEqual(siteDetail.get('tags'), Immutable.fromJS([frame.get('tag')]))
      assert.equal(siteDetail.get('icon'), frame.get('icon'))
    })
    it('properly sets location for pinned sites', function () {
      const frame = Immutable.fromJS({
        pinnedLocation: testUrl1,
        tag: siteTags.PINNED
      })
      const siteDetail = siteUtil.getDetailFromFrame(frame, siteTags.PINNED)
      assert.equal(siteDetail.get('location'), frame.get('pinnedLocation'))
    })
  })

  describe('toFrameOpts', function () {
    it('returns a plain javascript object with location and partitionNumber', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        partitionNumber: 5
      })
      const result = siteUtil.toFrameOpts(siteDetail)
      assert.equal(result.location, siteDetail.get('location'))
      assert.equal(result.partitionNumber, siteDetail.get('partitionNumber'))
    })
  })

  describe('isEquivalent', function () {
    it('returns true if both siteDetail objects are identical', function () {
      const siteDetail1 = Immutable.fromJS({
        location: testUrl1,
        partitionNumber: 0,
        tags: [siteTags.BOOKMARK]
      })
      const siteDetail2 = Immutable.fromJS({
        location: testUrl1,
        partitionNumber: 0,
        tags: [siteTags.BOOKMARK]
      })
      assert.equal(siteUtil.isEquivalent(siteDetail1, siteDetail2), true)
    })
    it('returns false if one object is a folder and the other is not', function () {
      const siteDetail1 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK]
      })
      const siteDetail2 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER]
      })
      assert.equal(siteUtil.isEquivalent(siteDetail1, siteDetail2), false)
    })
    it('returns false if both are folders and have a different folderId', function () {
      const siteDetail1 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER],
        folderId: 0
      })
      const siteDetail2 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER],
        folderId: 1
      })
      assert.equal(siteUtil.isEquivalent(siteDetail1, siteDetail2), false)
    })
    it('returns false if both are bookmarks and have a different location', function () {
      const siteDetail1 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK],
        location: testUrl1
      })
      const siteDetail2 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK],
        location: 'http://example.com/'
      })
      assert.equal(siteUtil.isEquivalent(siteDetail1, siteDetail2), false)
    })
    it('returns false if both are bookmarks and have a different partitionNumber', function () {
      const siteDetail1 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK],
        location: testUrl1,
        partitionNumber: 0
      })
      const siteDetail2 = Immutable.fromJS({
        tags: [siteTags.BOOKMARK],
        location: testUrl2,
        partitionNumber: 1
      })
      assert.equal(siteUtil.isEquivalent(siteDetail1, siteDetail2), false)
    })
  })

  describe('isFolder', function () {
    it('returns true if the input is a siteDetail and has a `BOOKMARK_FOLDER` tag', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER]
      })
      assert.equal(siteUtil.isFolder(siteDetail), true)
    })
    it('returns false if the input does not have a `BOOKMARK_FOLDER` tag', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK]
      })
      assert.equal(siteUtil.isFolder(siteDetail), false)
    })
    it('returns false if there is not a `tags` property', function () {
      const siteDetail = Immutable.fromJS({
        notTags: null
      })
      assert.equal(siteUtil.isFolder(siteDetail), false)
    })
    it('returns false if the input is null', function () {
      assert.equal(siteUtil.isFolder(null), false)
    })
    it('returns false if the input is undefined', function () {
      assert.equal(siteUtil.isFolder(), false)
    })
  })

  describe('isBookmark', function () {
    it('returns true if the input is a siteDetail and has a `BOOKMARK` tag', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK]
      })
      assert.equal(siteUtil.isBookmark(siteDetail), true)
    })
    it('returns false if the input does not have a `BOOKMARK` tag', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER]
      })
      assert.equal(siteUtil.isBookmark(siteDetail), false)
    })
    it('returns false if there is not a `tags` property', function () {
      const siteDetail = Immutable.fromJS({
        notTags: null
      })
      assert.equal(siteUtil.isBookmark(siteDetail), false)
    })
    it('returns false if the input is falsey', function () {
      assert.equal(siteUtil.isBookmark(null), false)
    })
  })

  describe('isHistoryEntry', function () {
    it('returns true for a typical history entry', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), true)
    })
    it('returns true for a bookmark history entry which has lastAccessedTime', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK],
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), true)
    })
    it('returns false for a bookmark entry with falsey lastAccessedTime', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
    it('returns false for a bookmarks folder', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK_FOLDER],
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
    it('returns false if input is falsey', function () {
      assert.equal(siteUtil.isHistoryEntry(null), false)
      assert.equal(siteUtil.isHistoryEntry(undefined), false)
    })
    it('returns false for about: pages', function () {
      const siteDetail = Immutable.fromJS({
        location: 'about:fake-page-here',
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
  })

  describe('getFolders', function () {
  })

  describe('filterOutNonRecents', function () {
  })

  describe('filterSitesRelativeTo', function () {
  })

  describe('clearHistory', function () {
    it('does not remove sites which have a valid `tags` property', function () {
      const sites = Immutable.fromJS({
        'key1': { tags: [siteTags.BOOKMARK_FOLDER] },
        'key2': { tags: [siteTags.BOOKMARK] }
      })
      const processedSites = siteUtil.clearHistory(sites)
      assert.deepEqual(processedSites.toJS(), sites.toJS())
    })
    it('sets the lastAccessedTime for all entries to null', function () {
      const sites = Immutable.fromJS({
        'key1': {
          location: 'location1',
          tags: [],
          lastAccessedTime: 123
        },
        'key2': {
          location: 'location2',
          tags: [siteTags.BOOKMARK],
          lastAccessedTime: 123
        }
      })
      const expectedSites = Immutable.fromJS({
        'key2': {
          location: 'location2',
          tags: [siteTags.BOOKMARK],
          lastAccessedTime: null
        }
      })
      const processedSites = siteUtil.clearHistory(sites)
      assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
    })
  })

  describe('getBookmarks', function () {
    it('returns items which are tagged either `BOOKMARK_FOLDER` or `BOOKMARK`', function () {
      const sites = Immutable.fromJS({
        'key1': {
          tags: [siteTags.BOOKMARK_FOLDER]
        },
        'key2': {
          tags: [siteTags.BOOKMARK]
        }
      })
      const processedSites = siteUtil.getBookmarks(sites)
      assert.deepEqual(sites, processedSites)
    })
    it('excludes items which are NOT tagged `BOOKMARK_FOLDER` or `BOOKMARK`', function () {
      const sites = Immutable.fromJS({
        'key1': {
          tags: ['unknown1']
        },
        'key2': {
          tags: ['unknown1']
        }
      })
      const expectedSites = Immutable.fromJS({})
      const processedSites = siteUtil.getBookmarks(sites)
      assert.deepEqual(expectedSites.toJS(), processedSites.toJS())
    })
    it('returns empty map if input was falsey', function () {
      const processedSites = siteUtil.getBookmarks(null)
      const expectedSites = Immutable.fromJS({})
      assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
    })
  })

  describe('getOrigin', function () {
    it('returns file:/// for any file url', function () {
      assert.strictEqual(siteUtil.getOrigin('file://'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///some'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///some/'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///some/path'), 'file:///')
    })
    it('gets URL origin for simple url', function () {
      assert.strictEqual(siteUtil.getOrigin('https://abc.bing.com'), 'https://abc.bing.com')
    })
    it('gets URL origin for url with port', function () {
      assert.strictEqual(siteUtil.getOrigin('https://bing.com:443/?test=1#abc'), 'https://bing.com:443')
    })
    it('gets URL origin for IP host', function () {
      assert.strictEqual(siteUtil.getOrigin('http://127.0.0.1:443/?test=1#abc'), 'http://127.0.0.1:443')
    })
    it('gets URL origin for slashless protocol URL', function () {
      assert.strictEqual(siteUtil.getOrigin('about:test/foo'), 'about:test')
    })
    it('returns null for invalid URL', function () {
      assert.strictEqual(siteUtil.getOrigin('abc'), null)
    })
    it('returns null for empty URL', function () {
      assert.strictEqual(siteUtil.getOrigin(''), null)
    })
    it('returns null for null URL', function () {
      assert.strictEqual(siteUtil.getOrigin(null), null)
    })
    it('returns correct result for URL with hostname that is a scheme', function () {
      assert.strictEqual(siteUtil.getOrigin('http://http/test'), 'http://http')
    })
  })
})
