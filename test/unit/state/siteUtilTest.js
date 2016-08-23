/* global describe, it */

const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const assert = require('assert')
const Immutable = require('immutable')

const testUrl1 = 'https://brave.com/'
const testUrl2 = 'http://example.com/'

describe('siteUtil', function () {
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
    describe('sites list does not have this siteDetail yet', function () {
      it('returns the updated site list which includes the new site', function () {
        const sites = Immutable.fromJS([])
        const siteDetail = Immutable.fromJS({
          lastAccessedTime: 123,
          tags: [siteTags.BOOKMARK],
          location: testUrl1,
          title: 'sample'
        })
        const processedSites = siteUtil.addSite(sites, siteDetail, siteTags.BOOKMARK)
        const expectedSites = sites.push(siteDetail)
        assert.deepEqual(processedSites, expectedSites)
      })
    })

    describe('sites list already has this siteDetail', function () {
      it('uses the title from the old siteDetail', function () {
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
        const expectedSiteDetail = Immutable.fromJS({
          lastAccessedTime: newSiteDetail.get('lastAccessedTime'),
          tags: newSiteDetail.get('tags').toJS(),
          location: newSiteDetail.get('location'),
          title: oldSiteDetail.get('title'),
          customTitle: newSiteDetail.get('customTitle')
        })
        const sites = Immutable.fromJS([oldSiteDetail])
        const processedSites = siteUtil.addSite(sites, newSiteDetail, siteTags.BOOKMARK, oldSiteDetail)
        const expectedSites = Immutable.fromJS([expectedSiteDetail])
        // toJS needed because immutable ownerID :(
        assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
      })
      it('uses the customTitle from the old siteDetail if customTitle is falsey', function () {
        // NOTE: test can be removed if we resolve https://github.com/brave/browser-laptop/issues/2972
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
          customTitle: ''
        })
        const expectedSiteDetail = Immutable.fromJS({
          lastAccessedTime: newSiteDetail.get('lastAccessedTime'),
          tags: newSiteDetail.get('tags').toJS(),
          location: newSiteDetail.get('location'),
          title: oldSiteDetail.get('title'),
          customTitle: oldSiteDetail.get('customTitle')
        })
        const sites = Immutable.fromJS([oldSiteDetail])
        const processedSites = siteUtil.addSite(sites, newSiteDetail, siteTags.BOOKMARK, oldSiteDetail)
        const expectedSites = Immutable.fromJS([expectedSiteDetail])
        // toJS needed because immutable ownerID :(
        assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
      })
      it('allows you to override the old title with the new title', function () {
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
        const processedSites = siteUtil.addSite(sites, newSiteDetail, siteTags.BOOKMARK, oldSiteDetail, true)
        const expectedSites = Immutable.fromJS([newSiteDetail])
        // toJS needed because immutable ownerID :(
        assert.deepEqual(processedSites.toJS(), expectedSites.toJS())
      })
    })
  })

  describe('removeSite', function () {
    it('removes the siteDetail from the site list (by removing the tag)', function () {
      const siteDetail = {
        tags: [siteTags.BOOKMARK],
        location: testUrl1
      }
      const sites = Immutable.fromJS([siteDetail])
      const processedSites = siteUtil.removeSite(sites, Immutable.fromJS(siteDetail), siteTags.BOOKMARK)
      const expectedSites = sites.setIn([0, 'parentFolderId'], 0).setIn([0, 'tags'], Immutable.List([]))
      assert.deepEqual(processedSites, expectedSites)
    })
    describe('called with tag=null/undefined', function () {
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

  describe('getFolders', function () {
  })

  describe('filterOutNonRecents', function () {
  })

  describe('filterSitesRelativeTo', function () {
  })

  describe('clearSitesWithoutTags', function () {
    it('does not remove sites which have a valid `tags` property', function () {
      const sites = [
        Immutable.fromJS({
          tags: [siteTags.BOOKMARK_FOLDER]
        }),
        Immutable.fromJS({
          tags: [siteTags.BOOKMARK]
        })]
      const processedSites = siteUtil.clearSitesWithoutTags(sites)
      assert.deepEqual(sites, processedSites)
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
