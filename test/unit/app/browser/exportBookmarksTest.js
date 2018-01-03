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
  const state = Immutable.fromJS({
    bookmarks: {
      'https://brave.com/1|0|0': {
        title: 'Website 1',
        location: 'https://brave.com/1',
        parentFolderId: 0,
        key: 'https://brave.com/1|0|0',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/2|0|1': {
        title: 'Website 2',
        location: 'https://brave.com/2',
        parentFolderId: 1,
        key: 'https://brave.com/2|0|1',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/3|0|2': {
        title: 'Website 3',
        location: 'https://brave.com/3',
        parentFolderId: 2,
        key: 'https://brave.com/3|0|2',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/4|0|2': {
        title: 'Website 4',
        location: 'https://brave.com/4',
        parentFolderId: 2,
        key: 'https://brave.com/4|0|2',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/5|0|3': {
        title: 'Title </A> with "characters" in it',
        location: 'https://brave.com/5',
        parentFolderId: 3,
        key: 'https://brave.com/5|0|3',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/6|0|0': {
        title: 'Bookmarklet example',
        location: 'javascript:(function(){var x,n,nD,z,i; function htmlEscape(s){s=s.replace(/&/g,\'&amp;\');s=s.replace(/>/g,\'&gt;\');s=s.replace(/</g,\'&lt;\');return s;} function attrQuoteEscape(s){s=s.replace(/&/g,\'&amp;\'); s=s.replace(/"/g, \'&quot;\');return s;} x=prompt("show links with this word/phrase in link text or target url (leave blank to list all links):", ""); n=0; if(x!=null) { x=x.toLowerCase(); nD = window.open().document; nD.writeln(\'<html><head><title>Links containing "\'+htmlEscape(x)+\'"</title><base target="_blank"></head><body>\'); nD.writeln(\'Links on <a href="\'+attrQuoteEscape(location.href)+\'">\'+htmlEscape(location.href)+\'</a><br> with link text or target url containing &quot;\' + htmlEscape(x) + \'&quot;<br><hr>\'); z = document.links; for (i = 0; i < z.length; ++i) { if ((z[i].innerHTML && z[i].innerHTML.toLowerCase().indexOf(x) != -1) || z[i].href.toLowerCase().indexOf(x) != -1 ) { nD.writeln(++n + \'. <a href="\' + attrQuoteEscape(z[i].href) + \'">\' + (z[i].innerHTML || htmlEscape(z[i].href)) + \'</a><br>\'); } } nD.writeln(\'<hr></body></html>\'); nD.close(); } })();',
        parentFolderId: 0,
        key: 'https://brave.com/6|0|0',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/7|0|-1': {
        title: 'Website 7',
        location: 'https://brave.com/7',
        parentFolderId: -1,
        key: 'https://brave.com/7|0|-1',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/8|0|5': {
        title: 'Website 8',
        location: 'https://brave.com/8',
        parentFolderId: 5,
        key: 'https://brave.com/8|0|5',
        type: siteTags.BOOKMARK
      },
      'https://brave.com/9|0|5': {
        title: 'Website 9',
        location: 'https://brave.com/9',
        parentFolderId: 5,
        key: 'https://brave.com/9|0|5',
        type: siteTags.BOOKMARK
      }
    },
    bookmarkFolders: {
      '1': {key: '1', title: 'folder 1', folderId: 1, type: siteTags.BOOKMARK_FOLDER, parentFolderId: 0},
      '2': {key: '2', title: 'folder 2', folderId: 2, type: siteTags.BOOKMARK_FOLDER, parentFolderId: 1},
      '3': {key: '3', title: 'folder 3', folderId: 3, type: siteTags.BOOKMARK_FOLDER, parentFolderId: 1},
      '4': {key: '4', title: 'folder 4', folderId: 4, type: siteTags.BOOKMARK_FOLDER, parentFolderId: 0},
      '5': {key: '5', title: 'folder 5', folderId: 5, type: siteTags.BOOKMARK_FOLDER, parentFolderId: -1},
      '6': {key: '6', title: 'folder 6', folderId: 6, type: siteTags.BOOKMARK_FOLDER, parentFolderId: -1}
    },
    cache: {
      bookmarkOrder: {
        '0': [
          {key: 'https://brave.com/1|0|0', order: 0, type: siteTags.BOOKMARK},
          {key: '1', order: 1, type: siteTags.BOOKMARK_FOLDER},
          {key: 'https://brave.com/6|0|0', order: 2, type: siteTags.BOOKMARK},
          {key: '4', order: 3, type: siteTags.BOOKMARK_FOLDER}
        ],
        '1': [
          {key: 'https://brave.com/2|0|1', order: 0, type: siteTags.BOOKMARK},
          {key: '2', order: 1, type: siteTags.BOOKMARK_FOLDER},
          {key: '3', order: 2, type: siteTags.BOOKMARK_FOLDER}
        ],
        '2': [
          {key: 'https://brave.com/3|0|2', order: 0, type: siteTags.BOOKMARK},
          {key: 'https://brave.com/4|0|2', order: 1, type: siteTags.BOOKMARK}
        ],
        '3': [
          {key: 'https://brave.com/5|0|3', order: 0, type: siteTags.BOOKMARK}
        ],
        '-1': [
          {key: 'https://brave.com/7|0|-1', order: 0, type: siteTags.BOOKMARK},
          {key: '5', order: 1, type: siteTags.BOOKMARK_FOLDER},
          {key: '6', order: 2, type: siteTags.BOOKMARK_FOLDER}
        ],
        '5': [
          {key: 'https://brave.com/8|0|5', order: 0, type: siteTags.BOOKMARK},
          {key: 'https://brave.com/9|0|5', order: 1, type: siteTags.BOOKMARK}
        ]
      }
    }
  })

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
    '        <DT><A HREF="https://brave.com/5">Title &lt;/A&gt; with &quot;characters&quot; in it</A>',
    '      </DL><p>',
    '    </DL><p>',
    '    <DT><A HREF="javascript:(function(){var x,n,nD,z,i; function htmlEscape(s){s=s.replace(/&/g,\'&amp;\');s=s.replace(/>/g,\'&gt;\');s=s.replace(/</g,\'&lt;\');return s;} function attrQuoteEscape(s){s=s.replace(/&/g,\'&amp;\'); s=s.replace(/&quot;/g, \'&quot;\');return s;} x=prompt(&quot;show links with this word/phrase in link text or target url (leave blank to list all links):&quot;, &quot;&quot;); n=0; if(x!=null) { x=x.toLowerCase(); nD = window.open().document; nD.writeln(\'<html><head><title>Links containing &quot;\'+htmlEscape(x)+\'&quot;</title><base target=&quot;_blank&quot;></head><body>\'); nD.writeln(\'Links on <a href=&quot;\'+attrQuoteEscape(location.href)+\'&quot;>\'+htmlEscape(location.href)+\'</a><br> with link text or target url containing &quot;\' + htmlEscape(x) + \'&quot;<br><hr>\'); z = document.links; for (i = 0; i < z.length; ++i) { if ((z[i].innerHTML && z[i].innerHTML.toLowerCase().indexOf(x) != -1) || z[i].href.toLowerCase().indexOf(x) != -1 ) { nD.writeln(++n + \'. <a href=&quot;\' + attrQuoteEscape(z[i].href) + \'&quot;>\' + (z[i].innerHTML || htmlEscape(z[i].href)) + \'</a><br>\'); } } nD.writeln(\'<hr></body></html>\'); nD.close(); } })();">Bookmarklet example</A>',
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

  describe('createBookmarkArray', function () {
    it('serializes the regular bookmarks', function () {
      const gen = exporter.createBookmarkArray(state)
      assert.deepEqual(gen, personalArray)
    })

    it('serializes the "other" bookmarks', function () {
      const gen = exporter.createBookmarkArray(state, -1, false)
      assert.deepEqual(gen, otherArray)
    })
  })

  describe('createBookmarkHTML', function () {
    it('generates an HTML response', function () {
      const personal = exporter.createBookmarkArray(state)
      const other = exporter.createBookmarkArray(state, -1, false)
      let result = exporter.createBookmarkHTML(personal, other)
      let expected = fs.readFileSync('./test/fixtures/bookmarkExport.html', 'utf8')

      result = result.replace(/\s+/g, ' ').trim()
      expected = expected.replace(/\s+/g, ' ').trim()

      assert.equal(result, expected)
    })
  })
})
