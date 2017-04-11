/* global describe, it, before, after */
const assert = require('assert')
const mockery = require('mockery')
const fs = require('fs')
const Immutable = require('immutable')

const siteTags = require('../../../../js/constants/siteTags')
require('../../braveUnit')

describe('Bookmarks export', function () {
  let exporter

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../../lib/fakeElectron'))
    exporter = require('../../../../app/browser/bookmarksExporter')
  })

  after(function () {
    mockery.disable()
  })

  /**
   * Toolbar
   * + website 1
   * + folder 1
   * ++ website 2
   * ++ folder 2
   * +++ website 3
   * +++ website 4
   * ++ folder 3
   * +++ website 5
   * + website 6
   * + folder 4
   * Other
   * + website 7
   * + folder 5
   * ++ website 8
   * ++ website 9
   * + folder 6
   */
  const sites = Immutable.fromJS([
    { tags: [], title: 'Fake', location: 'https://brave.com' },
    { tags: [siteTags.BOOKMARK], title: 'Website 1', location: 'https://brave.com/1' },
    { tags: [siteTags.BOOKMARK_FOLDER], title: 'folder 1', folderId: 1 },
    { tags: [siteTags.BOOKMARK], title: 'Website 2', location: 'https://brave.com/2', parentFolderId: 1 },
    { tags: [siteTags.BOOKMARK_FOLDER], title: 'folder 2', folderId: 2, parentFolderId: 1 },
    { tags: [siteTags.BOOKMARK], title: 'Website 3', location: 'https://brave.com/3', parentFolderId: 2 },
    { tags: [siteTags.BOOKMARK], title: 'Website 4', location: 'https://brave.com/4', parentFolderId: 2 },
    { tags: [siteTags.BOOKMARK_FOLDER], title: 'folder 3', folderId: 3, parentFolderId: 1 },
    { tags: [siteTags.BOOKMARK], title: 'Website 5', location: 'https://brave.com/5', parentFolderId: 3 },
    { tags: [siteTags.BOOKMARK], title: 'Website 6', location: 'https://brave.com/6' },
    { tags: [siteTags.BOOKMARK_FOLDER], title: 'folder 4', folderId: 4 },
    { tags: [siteTags.BOOKMARK], title: 'Website 7', location: 'https://brave.com/7', parentFolderId: -1 },
    { tags: [siteTags.BOOKMARK_FOLDER], title: 'folder 5', folderId: 5, parentFolderId: -1 },
    { tags: [siteTags.BOOKMARK], title: 'Website 8', location: 'https://brave.com/8', parentFolderId: 5 },
    { tags: [siteTags.BOOKMARK], title: 'Website 9', location: 'https://brave.com/9', parentFolderId: 5 },
    { tags: [siteTags.BOOKMARK_FOLDER], title: 'folder 6', folderId: 6, parentFolderId: -1 }
  ])

  const personalArray = [
    '  <DL><p>',
    '    <DT><A HREF="https://brave.com/1">Website 1</A>',
    '    <DT><H3>folder 1</H3>',
    '    <DL><p>',
    '      <DT><A HREF="https://brave.com/2">Website 2</A>',
    '      <DT><H3>folder 2</H3>',
    '      <DL><p>',
    '        <DT><A HREF="https://brave.com/3">Website 3</A>',
    '        <DT><A HREF="https://brave.com/4">Website 4</A>',
    '      </DL><p>',
    '      <DT><H3>folder 3</H3>',
    '      <DL><p>',
    '        <DT><A HREF="https://brave.com/5">Website 5</A>',
    '      </DL><p>',
    '    </DL><p>',
    '    <DT><A HREF="https://brave.com/6">Website 6</A>',
    '    <DT><H3>folder 4</H3>',
    '    <DL><p>',
    '    </DL><p>',
    '  </DL><p>'
  ]

  const otherArray = [
    '  <DT><A HREF="https://brave.com/7">Website 7</A>',
    '  <DT><H3>folder 5</H3>',
    '    <DL><p>',
    '      <DT><A HREF="https://brave.com/8">Website 8</A>',
    '      <DT><A HREF="https://brave.com/9">Website 9</A>',
    '    </DL><p>',
    '  <DT><H3>folder 6</H3>',
    '    <DL><p>',
    '    </DL><p>'
  ]

  it('personal array', function () {
    const gen = exporter.createBookmarkArray(sites)
    assert.deepEqual(gen, personalArray)
  })

  it('other array', function () {
    const gen = exporter.createBookmarkArray(sites, -1, false)
    assert.deepEqual(gen, otherArray)
  })

  it('generated html', function () {
    const personal = exporter.createBookmarkArray(sites)
    const other = exporter.createBookmarkArray(sites, -1, false)
    let result = exporter.createBookmarkHTML(personal, other)
    let expected = fs.readFileSync('./test/fixtures/bookmarkExport.html', 'utf8')

    result = result.replace(/\s+/g, ' ')
    expected = expected.replace(/\s+/g, ' ')

    assert.equal(result, expected)
  })
})
