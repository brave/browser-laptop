/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before */
const assert = require('assert')

const fakeElectron = require('../../../../../lib/fakeElectron')
require('../../../../../braveUnit')

describe('requestHandler unit test', function () {
  let requestHandler, parseFromStringHTML

  before(() => {
    global.chrome = {
      ipcRenderer: fakeElectron.ipcRenderer
    }

    global.DOMParser = class {
      parseFromString () {
        return parseFromStringHTML
      }
    }

    global.XMLSerializer = class {
      serializeToString () {
        return ''
      }
    }

    requestHandler = require('../../../../../../../app/extensions/brave/content/scripts/requestHandler')
  })

  describe('getText', function () {
    it('null case', function () {
      const result = requestHandler.getText()
      assert.equal(result, '')
    })

    it('node is actually number', function () {
      const result = requestHandler.getText(123)
      assert.equal(result, '')
    })

    it('span is provided', function () {
      let span = document.createElement('span')
      span.innerHTML = ('Span hello')
      const result = requestHandler.getText(span)
      assert.equal(result, ' Span hello ')
    })
  })

  describe('urlCheck', function () {
    it('null case', function () {
      const result = requestHandler.urlCheck()
      assert.equal(result, false)
    })

    it('is not url', function () {
      const result = requestHandler.urlCheck(123)
      assert.equal(result, false)
    })

    it('is http url', function () {
      const result = requestHandler.urlCheck('http://test.com')
      assert.equal(result, true)
    })
  })

  describe('getContent', function () {
    it('null case', function () {
      const result = requestHandler.getContent()
      assert.equal(result, null)
    })

    it('empty object', function () {
      const result = requestHandler.getContent({})
      assert.equal(result, null)
    })

    it('src is provided', function () {
      const result = requestHandler.getContent({content: 'some text'})
      assert.equal(result, 'some text')
    })
  })

  describe('getSrc', function () {
    it('null case', function () {
      const result = requestHandler.getSrc()
      assert.equal(result, null)
    })

    it('empty object', function () {
      const result = requestHandler.getSrc({})
      assert.equal(result, null)
    })

    it('src is provided', function () {
      const result = requestHandler.getSrc({src: 'url'})
      assert.equal(result, 'url')
    })
  })

  describe('urlTest', function () {
    it('null case', function () {
      const result = requestHandler.urlTest()
      assert.equal(result, false)
    })

    it('is not url', function () {
      const result = requestHandler.urlTest(123)
      assert.equal(result, false)
    })

    it('is simple url', function () {
      const result = requestHandler.urlTest('test.com')
      assert.equal(result, true)
    })

    it('is http url', function () {
      const result = requestHandler.urlTest('http://test.com')
      assert.equal(result, true)
    })

    it('is file url', function () {
      const result = requestHandler.urlTest('file://test.png')
      assert.equal(result, true)
    })

    it('relative url', function () {
      const result = requestHandler.urlTest('/page', {relative: true})
      assert.equal(result, true)
    })

    it('do not allow relative url', function () {
      const result = requestHandler.urlTest('/page', {relative: false})
      assert.equal(result, false)
    })
  })

  describe('isEmpty', function () {
    it('null case', function () {
      const result = requestHandler.isEmpty()
      assert.equal(result, true)
    })

    it('empty string', function () {
      const result = requestHandler.isEmpty('')
      assert.equal(result, true)
    })

    it('string is provided', function () {
      const result = requestHandler.isEmpty('test.com')
      assert.equal(result, false)
    })
  })

  describe('isUrl', function () {
    it('null case', function () {
      const result = requestHandler.isUrl()
      assert.equal(result, false)
    })

    it('emtpy string', function () {
      const result = requestHandler.isUrl('')
      assert.equal(result, false)
    })

    it('is not url', function () {
      const result = requestHandler.isUrl(123)
      assert.equal(result, false)
    })

    it('is simple url', function () {
      const result = requestHandler.isUrl('test.com')
      assert.equal(result, true)
    })

    it('is http url', function () {
      const result = requestHandler.isUrl('http://test.com')
      assert.equal(result, true)
    })

    it('is file url', function () {
      const result = requestHandler.isUrl('file://test.png')
      assert.equal(result, true)
    })

    it('relative url', function () {
      const result = requestHandler.isUrl('/page', {relative: true})
      assert.equal(result, true)
    })

    it('do not allow relative url', function () {
      const result = requestHandler.isUrl('/page', {relative: false})
      assert.equal(result, false)
    })
  })

  describe('getUrl', function () {
    it('null case', function () {
      const result = requestHandler.getUrl()
      assert.equal(result, undefined)
    })

    it('relative path is absolute link', function () {
      const result = requestHandler.getUrl('https://youtube.com', '/page')
      assert.equal(result, 'https://youtube.com/page')
    })

    it('relative path is relative link', function () {
      const result = requestHandler.getUrl('https://youtube.com', '/page')
      assert.equal(result, 'https://youtube.com/page')
    })

    it('relative path is absolute link', function () {
      const result = requestHandler.getUrl('https://youtube.com', 'https://youtube.com/page')
      assert.equal(result, 'https://youtube.com/page')
    })
  })

  describe('isStrictString', function () {
    it('null case', function () {
      const result = requestHandler.isStrictString()
      assert.equal(result, false)
    })

    it('value is no in correct format', function () {
      const result = requestHandler.isStrictString('firstlast')
      assert.equal(result, false)
    })

    it('value is in correct format', function () {
      const result = requestHandler.isStrictString('first last')
      assert.equal(result, 'first last')
    })
  })

  describe('titleize', function () {
    it('null case', function () {
      const result = requestHandler.titleize()
      assert.equal(result, '')
    })

    it('remove multiple spaces', function () {
      const result = requestHandler.titleize('this is  long     title')
      assert.equal(result, 'this is long title')
    })

    it('keep by by default', function () {
      const result = requestHandler.titleize('by Author')
      assert.equal(result, 'by Author')
    })

    it('keep by by default', function () {
      const result = requestHandler.titleize('by Author', {removeBy: true})
      assert.equal(result, 'Author')
    })
  })

  describe('defaultFn', function () {
    it('null case', function () {
      const result = requestHandler.defaultFn()
      assert.equal(result, '')
    })

    it('parameter is not HTML element', function () {
      const result = requestHandler.defaultFn('something')
      assert.equal(result, '')
    })

    it('text is trimmed', function () {
      let span = document.createElement('span')
      span.innerHTML = ('  Span as a child    ')

      const result = requestHandler.defaultFn(span)
      assert.equal(result, 'Span as a child')
    })
  })

  describe('getValue', function () {
    it('null case', function () {
      const result = requestHandler.getValue()
      assert.equal(result, null)
    })

    it('collection has only one element', function () {
      let wrap = document.createElement('div')
      let span = document.createElement('span')
      span.innerHTML = ('Span as a child')
      wrap.appendChild(span)
      const result = requestHandler.getValue(wrap.querySelector('span'))
      assert.equal(result, 'Span as a child')
    })

    it('collection has multiple elements', function () {
      let wrap = document.createElement('div')
      let span = document.createElement('span')
      span.innerHTML = ('Span as a first child')
      wrap.appendChild(span)
      let span2 = document.createElement('span')
      span2.innerHTML = ('Span as a second child')
      wrap.appendChild(span2)
      const result = requestHandler.getValue(wrap.querySelectorAll('span'))
      assert.equal(result, 'Span as a first child')
    })

    it('first element has empty span', function () {
      let wrap = document.createElement('div')
      let span = document.createElement('span')
      span.innerHTML = ('')
      wrap.appendChild(span)
      let span2 = document.createElement('span')
      span2.innerHTML = ('Span as a second child')
      wrap.appendChild(span2)
      const result = requestHandler.getValue(wrap.querySelectorAll('span'))
      assert.equal(result, 'Span as a second child')
    })
  })

  describe('getThumbnailUrl', function () {
    it('null case', function () {
      const result = requestHandler.getThumbnailUrl()
      assert.equal(result, null)
    })

    it('id is passed in', function () {
      const result = requestHandler.getThumbnailUrl('ABC12302')
      assert.equal(result, `https://img.youtube.com/vi/ABC12302/sddefault.jpg`)
    })
  })

  describe('getVideoId', function () {
    it('null case', function () {
      const result = requestHandler.getVideoId()
      assert.deepEqual(result, {})
    })

    it('strip white space', function () {
      const result = requestHandler.getVideoId('   https://youtu.be/ABC12302    ')
      assert.deepEqual(result, {
        id: 'ABC12302',
        service: 'youtube'
      })
    })

    it('strip white space', function () {
      const result = requestHandler.getVideoId('   https://youtu.be/ABC12302    ')
      assert.deepEqual(result, {
        id: 'ABC12302',
        service: 'youtube'
      })
    })

    it('nocookie ', function () {
      const result = requestHandler.getVideoId('http://www.youtube-nocookie.com/ytscreeningroom?v=ABC12300')
      assert.deepEqual(result, {
        id: 'ABC12300',
        service: 'youtube'
      })
    })

    it('removes www', function () {
      const result = requestHandler.getVideoId('https://www.youtu.be/ABC12302')
      assert.deepEqual(result, {
        id: 'ABC12302',
        service: 'youtube'
      })
    })
  })

  // source https://github.com/radiovisual/get-video-id/blob/master/test.js
  describe('getYouTubeId', function () {
    it('null case', function () {
      const result = requestHandler.getYouTubeId()
      assert.equal(result, '')
    })

    it('gets metadata from youtube short code formats', () => {
      assert.equal(requestHandler.getYouTubeId('youtube://ABC12301'), 'ABC12301')
      assert.equal(requestHandler.getYouTubeId('https://youtu.be/ABC12302'), 'ABC12302')
      assert.equal(requestHandler.getYouTubeId('http://youtu.be/ABC12303'), 'ABC12303')
      assert.equal(requestHandler.getYouTubeId('http://youtu.be/ABC12304?feature=youtube_gdata_player'), 'ABC12304')
    })

    it('handles youtube v= and vi= formats', () => {
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/ytscreeningroom?v=ABC1230'), 'ABC1230')
      assert.equal(requestHandler.getYouTubeId('https://www.youtube.com/watch?v=ABC12301'), 'ABC12301')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12302&list=abc123&index=2&feature=plpp_video'), 'ABC12302')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12303&feature=channel'), 'ABC12303')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12304&playnext_from=TL&videos=abc123&feature=sub'), 'ABC12304')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12305&feature=channel'), 'ABC12305')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12306&playnext_from=TL&videos=abc123&feature=sub'), 'ABC12306')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12307'), 'ABC12307')
      assert.equal(requestHandler.getYouTubeId('http://youtube.com/?v=ABC12308&feature=youtube_gdata_player'), 'ABC12308')
      assert.equal(requestHandler.getYouTubeId('http://youtube.com/?vi=ABC12309&feature=youtube_gdata_player'), 'ABC12309')
      assert.equal(requestHandler.getYouTubeId('http://youtube.com/watch?v=ABC12310&feature=youtube_gdata_player'), 'ABC12310')
      assert.equal(requestHandler.getYouTubeId('http://youtube.com/watch?vi=ABC12311&feature=youtube_gdata_player'), 'ABC12311')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12312&feature=youtube_gdata_player'), 'ABC12312')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/watch?v=ABC12313&feature=youtu.be'), 'ABC12313')
    })

    it('handles youtube /v/ and /vi/ formats', () => {
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/v/ABC1230'), 'ABC1230')
      assert.equal(requestHandler.getYouTubeId('http://youtube.com/v/ABC12301?feature=youtube_gdata_player'), 'ABC12301')
      assert.equal(requestHandler.getYouTubeId('http://youtube.com/vi/ABC12302?feature=youtube_gdata_player'), 'ABC12302')
      assert.equal(requestHandler.getYouTubeId('https://i.ytimg.com/vi/0okagl9U2eo/hqdefault.jpg'), '0okagl9U2eo')
    })

    it('handles youtube image /an_webp/{id}/ formats', () => {
      assert.equal(requestHandler.getYouTubeId('https://i.ytimg.com/an_webp/MYDcdp-VNmQ/mqdefault_6s.webp'), 'MYDcdp-VNmQ')
    })

    it('handles youtube /embed/ formats', () => {
      assert.equal(requestHandler.getYouTubeId('https://www.youtube.com/embed/ABC1230'), 'ABC1230')
      assert.equal(requestHandler.getYouTubeId('www.youtube-nocookie.com/embed/ABC12301?rel=0'), 'ABC12301')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/embed/ABC12302?rel=0'), 'ABC12302')
    })

    it('handles youtube /user/ formats', () => {
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/user/username#p/u/1/ABC1230'), 'ABC1230')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/user/username#p/a/u/2/ABC12301'), 'ABC12301')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/user/username#p/u/1/ABC12302?rel=0'), 'ABC12302')
    })

    it('handles youtube attribution_links', () => {
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/attribution_link?u=%2Fwatch%3Fv%3DABC12300%26feature%3Dshare&a=JdfC0C9V6ZI'), 'ABC12300')
      assert.equal(requestHandler.getYouTubeId('https://www.youtube.com/attribution_link?a=JdfC0C9V6ZI&u=%2Fwatch%3Fv%3DABC12301%26feature%3Dshare'), 'ABC12301')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/attribution_link?u=/watch?v=ABC12302&feature=share&list=UUsnCjinFcybOuyJU1NFOJmg&a=LjnCygXKl21WkJdyKu9O-w'), 'ABC12302')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/attribution_link?u=/watch?v=ABC12303&feature=share&a=9QlmP1yvjcllp0h3l0NwuA'), 'ABC12303')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/attribution_link?a=fF1CWYwxCQ4&u=/watch?v=ABC12304&feature=em-uploademail'), 'ABC12304')
      assert.equal(requestHandler.getYouTubeId('http://www.youtube.com/attribution_link?a=fF1CWYwxCQ4&feature=em-uploademail&u=/watch?v=ABC12305'), 'ABC12305')
    })
  })

  describe('stripParameters', function () {
    it('null case', function () {
      const result = requestHandler.stripParameters()
      assert.equal(result, '')
    })

    it('string with parms', function () {
      const result = requestHandler.stripParameters('this is test')
      assert.equal(result, 'this is test')
    })

    it('string with /', function () {
      const result = requestHandler.stripParameters('this is/test')
      assert.equal(result, 'this is')
    })

    it('string with ?', function () {
      const result = requestHandler.stripParameters('this is?test')
      assert.equal(result, 'this is')
    })
  })

  describe('smartQuotes', function () {
    it('null case', function () {
      const result = requestHandler.smartQuotes()
      assert.equal(result, '')
    })

    it('regular quote', function () {
      const result = requestHandler.smartQuotes(`'test'`)
      assert.equal(result, `‘test’`)
    })

    it('double quote (start)', function () {
      const result = requestHandler.smartQuotes(`'test'`)
      assert.equal(result, `‘test’`)
    })

    it('double quote (start)', function () {
      const result = requestHandler.smartQuotes(`this is "test"`)
      assert.equal(result, `this is “test”`)
    })

    it('compilation 1', function () {
      const result = requestHandler.smartQuotes(`Ma'am, this "test" is from '95`)
      assert.equal(result, `Ma’am, this “test” is from ’95`)
    })

    it('compilation 2', function () {
      const result = requestHandler.smartQuotes(`something of 'Something's`)
      assert.equal(result, `something of ’Something’s`)
    })
  })

  describe('removeByPrefix', function () {
    it('null case', function () {
      const result = requestHandler.removeByPrefix()
      assert.equal(result, '')
    })

    it('case with param null', function () {
      const result = requestHandler.removeByPrefix(null)
      assert.equal(result, '')
    })

    it('removes @ prefix', function () {
      const result = requestHandler.removeByPrefix('test @this')
      assert.equal(result, 'test this')
    })

    it('removes by prefix', function () {
      const result = requestHandler.removeByPrefix(' by me author')
      assert.equal(result, 'me author')
    })

    it('removes BY prefix', function () {
      const result = requestHandler.removeByPrefix(' BY me author')
      assert.equal(result, 'me author')
    })
  })

  describe('createTitle', function () {
    it('null case', function () {
      const result = requestHandler.createTitle()
      assert.equal(result, '')
    })

    it('case with param null', function () {
      const result = requestHandler.createTitle(null)
      assert.equal(result, '')
    })

    it('trim string', function () {
      const result = requestHandler.createTitle('   this is test ')
      assert.equal(result, 'this is test')
    })

    it('remove double and more spaces', function () {
      const result = requestHandler.createTitle('this     is  test     ')
      assert.equal(result, 'this is test')
    })

    it('create smart quotes', function () {
      const result = requestHandler.createTitle(`this "is" test which is 'ok'`)
      assert.strictEqual(result, `this “is” test which is ‘ok’`)
    })
  })

  describe('isAbsoluteUrl', function () {
    it('null case', function () {
      const result = requestHandler.isAbsoluteUrl()
      assert.equal(result, undefined)
    })

    it('object was send in', function () {
      const result = requestHandler.isAbsoluteUrl({})
      assert.equal(result, undefined)
    })

    it('http url', function () {
      const result = requestHandler.isAbsoluteUrl('http://clifton.io')
      assert.equal(result, true)
    })

    it('http url', function () {
      const result = requestHandler.isAbsoluteUrl('https://clifton.io')
      assert.equal(result, true)
    })

    it('data url', function () {
      const result = requestHandler.isAbsoluteUrl('data:text/plain;base64,31c4c5flv')
      assert.equal(result, true)
    })

    it('file url', function () {
      const result = requestHandler.isAbsoluteUrl('file://clifton.io')
      assert.equal(result, true)
    })
  })

  describe('resolveUrl', function () {
    it('null case', function () {
      const result = requestHandler.resolveUrl()
      assert.equal(result, null)
    })

    it('args are not urls', function () {
      const result = requestHandler.resolveUrl('brave', 'com')
      assert.equal(result, 'brave')
    })

    it('we only have base url', function () {
      const result = requestHandler.resolveUrl('https://brave.com')
      assert.equal(result, 'https://brave.com')
    })

    it('relative path is added', function () {
      const result = requestHandler.resolveUrl('https://brave.com', 'test')
      assert.equal(result, 'https://brave.com/test')
    })
  })

  describe('isString', function () {
    it('null case', function () {
      const result = requestHandler.isString()
      assert.equal(result, false)
    })

    it('we send object in', function () {
      const result = requestHandler.isString({})
      assert.equal(result, false)
    })

    it('we send number in', function () {
      const result = requestHandler.isString(10)
      assert.equal(result, false)
    })

    it('we send string in', function () {
      const result = requestHandler.isString('I am string')
      assert.equal(result, true)
    })
  })
})
