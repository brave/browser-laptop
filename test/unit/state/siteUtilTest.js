/* global describe, it */

const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const assert = require('assert')
const Immutable = require('immutable')

describe('siteUtil', function () {
  const testUrl1 = 'https://brave.com/'
  const testUrl2 = 'http://example.com/'
  const emptySites = Immutable.fromJS([])
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

  describe('getSiteIndex', function () {
    it('returns -1 if sites is falsey', function () {
      const siteDetail = Immutable.fromJS({
        folderId: 0
      })
      const index = siteUtil.getSiteIndex(null, siteDetail, siteTags.BOOKMARK_FOLDER)
      assert.equal(index, -1)
    })
    it('returns -1 if siteDetail is falsey', function () {
      const sites = Immutable.fromJS([{
        folderId: 0,
        tags: [siteTags.BOOKMARK_FOLDER]
      }])
      const index = siteUtil.getSiteIndex(sites, null, siteTags.BOOKMARK_FOLDER)
      assert.equal(index, -1)
    })
    describe('matching `BOOKMARK_FOLDER`', function () {
      it('returns index if folderId matches', function () {
        const sites = Immutable.fromJS([{
          folderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }])
        const siteDetail = Immutable.fromJS({
          folderId: 0
        })
        const index = siteUtil.getSiteIndex(sites, siteDetail, siteTags.BOOKMARK_FOLDER)
        assert.equal(index, 0)
      })
      it('returns -1 if folderId does not match', function () {
        const sites = Immutable.fromJS([{
          folderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }])
        const siteDetail = Immutable.fromJS({
          folderId: 1
        })
        const index = siteUtil.getSiteIndex(sites, siteDetail, siteTags.BOOKMARK_FOLDER)
        assert.equal(index, -1)
      })
    })
    describe('matching `BOOKMARK`', function () {
      it('returns index if location and partitionNumber match', function () {
        const sites = Immutable.fromJS([{
          location: testUrl1,
          partitionNumber: 0,
          tags: [siteTags.BOOKMARK]
        }])
        const siteDetail = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 0
        })
        const index = siteUtil.getSiteIndex(sites, siteDetail, siteTags.BOOKMARK)
        assert.equal(index, 0)
      })
      it('returns index if location matches and partitionNumber is NOT present', function () {
        const sites = Immutable.fromJS([{
          location: testUrl1,
          tags: [siteTags.BOOKMARK]
        }])
        const siteDetail = Immutable.fromJS({
          location: testUrl1
        })
        const index = siteUtil.getSiteIndex(sites, siteDetail, siteTags.BOOKMARK)
        assert.equal(index, 0)
      })
      it('returns -1 if location does not match', function () {
        const sites = Immutable.fromJS([{
          location: testUrl1,
          tags: [siteTags.BOOKMARK]
        }])
        const siteDetail = Immutable.fromJS({
          location: testUrl2
        })
        const index = siteUtil.getSiteIndex(sites, siteDetail, siteTags.BOOKMARK)
        assert.equal(index, -1)
      })
      it('returns -1 if partitionNumber does not match', function () {
        const sites = Immutable.fromJS([{
          location: testUrl1,
          partitionNumber: 0,
          tags: [siteTags.BOOKMARK]
        }])
        const siteDetail = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 1
        })
        const index = siteUtil.getSiteIndex(sites, siteDetail, siteTags.BOOKMARK)
        assert.equal(index, -1)
      })
    })
  })

  describe('isSiteBookmarked', function () {
    it('returns true if site is bookmarked', function () {
      const sites = Immutable.fromJS([{
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      }])
      const siteDetail = Immutable.fromJS({
        location: testUrl1
      })
      const result = siteUtil.isSiteBookmarked(sites, siteDetail)
      assert.equal(result, true)
    })
    it('returns false if site is not bookmarked', function () {
      const sites = Immutable.fromJS([{
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      }])
      const siteDetail = Immutable.fromJS({
        location: testUrl2
      })
      const result = siteUtil.isSiteBookmarked(sites, siteDetail)
      assert.equal(result, false)
    })
    it('returns false if site is a bookmark folder', function () {
      const sites = Immutable.fromJS([{
        folderId: 0,
        tags: [siteTags.BOOKMARK_FOLDER]
      }])
      const siteDetail = Immutable.fromJS({
        folderId: 0
      })
      const result = siteUtil.isSiteBookmarked(sites, siteDetail)
      assert.equal(result, false)
    })
  })

  describe('getNextFolderId', function () {
    it('returns the next possible folderId', function () {
      const sites = Immutable.fromJS([{
        folderId: 0,
        tags: [siteTags.BOOKMARK_FOLDER]
      }, {
        folderId: 1,
        tags: [siteTags.BOOKMARK_FOLDER]
      }])
      assert.equal(siteUtil.getNextFolderId(sites), 2)
    })
    it('returns default (0) if sites is falsey', function () {
      assert.equal(siteUtil.getNextFolderId(null), 0)
    })
  })

  describe('addSite', function () {
    it('gets the tag from siteDetail if not provided', function () {
      const processedSites = siteUtil.addSite(emptySites, bookmarkAllFields)
      const expectedSites = Immutable.fromJS([bookmarkAllFields])
      assert.deepEqual(processedSites.getIn([0, 'tags']), expectedSites.getIn([0, 'tags']))
    })

    describe('for new entries (oldSite is null)', function () {
      describe('when adding bookmark', function () {
        it('preserves existing siteDetail fields', function () {
          const processedSites = siteUtil.addSite(emptySites, bookmarkAllFields, siteTags.BOOKMARK)
          const expectedSites = Immutable.fromJS([bookmarkAllFields])
          assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
        })
        it('sets default values for lastAccessedTime and tag when they are missing', function () {
          const processedSites = siteUtil.addSite(emptySites, bookmarkMinFields, siteTags.BOOKMARK)
          assert.equal(!!processedSites.getIn([0, 'lastAccessedTime']), true)
          assert.deepEqual(processedSites.getIn([0, 'tags']).toJS(), [siteTags.BOOKMARK])
        })
      })

      describe('when adding bookmark folder', function () {
        it('assigns a folderId', function () {
          const processedSites = siteUtil.addSite(emptySites, folderMinFields)
          const folderId = processedSites.getIn([0, 'folderId'])
          assert.equal(folderId, 1)
        })
        it('allows for new folders to use the same customTitle as an existing folder', function () {
          // Add a new bookmark folder
          let processedSites = siteUtil.addSite(emptySites, folderMinFields)
          const folderId = processedSites.getIn([0, 'folderId'])
          const bookmark = Immutable.fromJS({
            lastAccessedTime: 123,
            title: 'bookmark1',
            parentFolderId: folderId,
            location: testUrl1,
            tags: [siteTags.BOOKMARK]
          })
          // Add a bookmark into that folder
          processedSites = siteUtil.addSite(processedSites, bookmark)
          assert.equal(processedSites.size, 2)
          assert.equal(processedSites.getIn([1, 'parentFolderId']), folderId)

          // Add another bookmark folder with the same name / parentFolderId
          processedSites = siteUtil.addSite(processedSites, folderMinFields)
          assert.equal(processedSites.size, 3)
          const folderId2 = processedSites.getIn([2, 'folderId'])
          assert.equal(folderId === folderId2, false)

          // Ensure fields for both folders are still in sites array
          assert.equal(processedSites.getIn([0, 'customTitle']), processedSites.getIn([2, 'customTitle']))
          assert.deepEqual(processedSites.getIn([0, 'tags']), processedSites.getIn([2, 'tags']))
        })
        it('calls removeSite on bookmark folders which have the same customTitle/parentFolderId', function () {
          const sites = Immutable.fromJS([
            {
              lastAccessedTime: 123,
              customTitle: 'folder1',
              title: undefined,
              folderId: 1,
              parentFolderId: 0,
              tags: [siteTags.BOOKMARK_FOLDER]
            },
            {
              lastAccessedTime: 123,
              customTitle: 'folder2',
              title: undefined,
              folderId: 2,
              parentFolderId: 1,
              tags: [siteTags.BOOKMARK_FOLDER]
            },
            {
              lastAccessedTime: 123,
              title: 'bookmark1',
              parentFolderId: 1,
              location: testUrl1,
              tags: [siteTags.BOOKMARK]
            },
            {
              lastAccessedTime: 123,
              title: 'bookmark2',
              parentFolderId: 2,
              location: testUrl2,
              tags: [siteTags.BOOKMARK]
            }
          ])
          let processedSites = sites
          sites.forEach((site) => {
            processedSites = siteUtil.addSite(processedSites, site)
          })
          const expectedSites = sites
          assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
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
          favicon: 'https://brave.com/favicon.ico'
        })
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
          favicon: oldSiteDetail.get('favicon')
        })
        const sites = Immutable.fromJS([oldSiteDetail])
        const processedSites = siteUtil.addSite(sites, newSiteDetail, siteTags.BOOKMARK, oldSiteDetail)
        const expectedSites = Immutable.fromJS([expectedSiteDetail])
        assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
      })
      it('overrides the old title with the new title', function () {
        const oldSiteDetail = Immutable.fromJS({
          lastAccessedTime: 123,
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          title: 'old title',
          customTitle: 'old customTitle'
        })
        const newSiteDetail = Immutable.fromJS({
          lastAccessedTime: 456,
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          title: 'new title',
          customTitle: 'new customTitle'
        })
        const sites = Immutable.fromJS([oldSiteDetail])
        const processedSites = siteUtil.addSite(sites, newSiteDetail, siteTags.BOOKMARK, oldSiteDetail)
        const expectedSites = Immutable.fromJS([newSiteDetail])
        assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
      })
    })
  })

  describe('removeSite', function () {
    describe('tag=truthy', function () {
      it('removes the tag from the siteDetail', function () {
        const siteDetail = {
          tags: [siteTags.BOOKMARK],
          location: testUrl1
        }
        const sites = Immutable.fromJS([siteDetail])
        const processedSites = siteUtil.removeSite(sites, Immutable.fromJS(siteDetail), siteTags.BOOKMARK)
        const expectedSites = sites.setIn([0, 'parentFolderId'], 0).setIn([0, 'tags'], Immutable.List([]))
        assert.deepEqual(processedSites, expectedSites)
      })
      it('removes the customTitle', function () {
        const siteDetail = {
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          customTitle: 'customTitle'
        }
        const sites = Immutable.fromJS([siteDetail])
        const processedSites = siteUtil.removeSite(sites, Immutable.fromJS(siteDetail), siteTags.BOOKMARK)
        const expectedSites = sites.setIn([0, 'parentFolderId'], 0)
          .deleteIn([0, 'customTitle'])
          .setIn([0, 'tags'], Immutable.List([]))
        assert.deepEqual(processedSites, expectedSites)
      })
      it('removes folder and its children', function () {
        const sites = Immutable.fromJS([
          {
            folderId: 1,
            parentFolderId: 0,
            tags: [siteTags.BOOKMARK_FOLDER]
          },
          {
            folderId: 2,
            parentFolderId: 1,
            tags: [siteTags.BOOKMARK_FOLDER]
          },
          {
            parentFolderId: 1,
            location: testUrl1,
            tags: [siteTags.BOOKMARK]
          },
          {
            parentFolderId: 2,
            location: testUrl2,
            tags: [siteTags.BOOKMARK]
          }
        ])
        const siteDetail = {
          folderId: 1,
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        const processedSites = siteUtil.removeSite(sites, Immutable.fromJS(siteDetail), siteTags.BOOKMARK_FOLDER)
        const expectedSites = Immutable.fromJS([
          {
            folderId: 1,
            parentFolderId: 0,
            tags: Immutable.List([])
          },
          {
            folderId: 2,
            parentFolderId: 0,
            tags: Immutable.List([])
          },
          {
            parentFolderId: 0,
            location: testUrl1,
            tags: Immutable.List([])
          },
          {
            parentFolderId: 0,
            location: testUrl2,
            tags: Immutable.List([])
          }
        ])
        assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
      })
    })
    describe('tag=falsey', function () {
      it('deletes a history entry (has no tags)', function () {
        const siteDetail = {
          tags: [],
          location: testUrl1
        }
        const sites = Immutable.fromJS([siteDetail])
        const processedSites = siteUtil.removeSite(sites, Immutable.fromJS(siteDetail))
        assert.deepEqual(processedSites, Immutable.fromJS([]))
      })
      it('nulls out the lastAccessedTime for a bookmarked entry (has tag)', function () {
        const siteDetail = {
          location: testUrl1,
          tags: [siteTags.BOOKMARK],
          lastAccessedTime: 123
        }
        const sites = Immutable.fromJS([siteDetail])
        const processedSites = siteUtil.removeSite(sites, Immutable.fromJS(siteDetail))
        const expectedSites = sites.setIn([0, 'lastAccessedTime'], null)
        assert.deepEqual(processedSites, expectedSites)
      })
    })
  })

  describe('moveSite', function () {
    it('does not allow you to move a bookmark folder into itself', function () {
      // Add a new bookmark folder
      let processedSites = siteUtil.addSite(emptySites, folderMinFields)
      const folderId = processedSites.getIn([0, 'folderId'])
      const bookmark = Immutable.fromJS({
        lastAccessedTime: 123,
        title: 'bookmark1',
        parentFolderId: folderId,
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      })
      // Add a bookmark into that folder
      processedSites = siteUtil.addSite(processedSites, bookmark)
      const bookmarkFolder = processedSites.get(0)

      // Usage taken from Bookmark Manager, which calls aboutActions.moveSite
      processedSites = siteUtil.moveSite(processedSites, bookmarkFolder, bookmarkFolder, false, true, false)
      const siteIndex = siteUtil.getSiteIndex(processedSites, bookmarkFolder, siteTags.BOOKMARK_FOLDER)

      assert.notEqual(processedSites.getIn([siteIndex, 'parentFolderId']), processedSites.getIn([siteIndex, 'folderId']))
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
      const sites = Immutable.fromJS([
        { tags: [siteTags.BOOKMARK_FOLDER] },
        { tags: [siteTags.BOOKMARK] }
      ])
      const processedSites = siteUtil.clearHistory(sites)
      assert.deepEqual(processedSites.toJS(), sites.toJS())
    })
    it('sets the lastAccessedTime for all entries to null', function () {
      const sites = Immutable.fromJS([
        {
          location: 'location1',
          tags: [],
          lastAccessedTime: 123
        },
        {
          location: 'location2',
          tags: [siteTags.BOOKMARK],
          lastAccessedTime: 123
        }
      ])
      const expectedSites = Immutable.fromJS([{
        location: 'location2',
        tags: [siteTags.BOOKMARK],
        lastAccessedTime: null
      }])
      const processedSites = siteUtil.clearHistory(sites)
      assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
    })
  })

  describe('hasNoTagSites', function () {
    it('returns true if the ANY sites in the provided list are missing a `tags` property', function () {
      const sites = [
        Immutable.fromJS({
          location: 'https://brave.com'
        })]
      assert.equal(siteUtil.hasNoTagSites(sites), true)
    })
    it('returns true if the ANY sites in the provided list have an empty `tags` property', function () {
      const sites = [
        Immutable.fromJS({
          tags: []
        })]
      assert.equal(siteUtil.hasNoTagSites(sites), true)
    })
    it('returns false if all sites have a valid `tags` property', function () {
      const sites = [
        Immutable.fromJS({
          tags: [siteTags.BOOKMARK_FOLDER]
        }),
        Immutable.fromJS({
          tags: [siteTags.BOOKMARK]
        })]
      assert.equal(siteUtil.hasNoTagSites(sites), false)
    })
  })

  describe('getBookmarks', function () {
    it('returns items which are tagged either `BOOKMARK_FOLDER` or `BOOKMARK`', function () {
      const sites = [
        Immutable.fromJS({
          tags: [siteTags.BOOKMARK_FOLDER]
        }),
        Immutable.fromJS({
          tags: [siteTags.BOOKMARK]
        })]
      const processedSites = siteUtil.getBookmarks(sites)
      assert.deepEqual(sites, processedSites)
    })
    it('excludes items which are NOT tagged `BOOKMARK_FOLDER` or `BOOKMARK`', function () {
      const sites = [
        Immutable.fromJS({
          tags: ['unknown1']
        }),
        Immutable.fromJS({
          tags: ['unknown2']
        })]
      const expectedSites = []
      const processedSites = siteUtil.getBookmarks(sites)
      assert.deepEqual(expectedSites, processedSites)
    })
    it('returns empty list if input was falsey', function () {
      const processedSites = siteUtil.getBookmarks(null)
      const expectedSites = []
      assert.deepEqual(processedSites, expectedSites)
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
