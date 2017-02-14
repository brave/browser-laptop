/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')
const suggestionTypes = require('../../../../../js/constants/suggestionTypes')
let UrlBarSuggestionItem
require('../../../braveUnit')

describe('UrlBarSuggestionItem component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    UrlBarSuggestionItem = require('../../../../../app/renderer/components/urlBarSuggestionItem')
  })
  after(function () {
    mockery.disable()
  })

  Object.values(suggestionTypes).forEach((suggestionType) => {
    describe(`${suggestionType} suggestion item`, function () {
      before(function () {
        this.onMouseOver = sinon.spy()
        this.onSuggestionClicked = sinon.spy()
        this.suggestion = {
          title: 'hello',
          type: suggestionType,
          location: 'http://www.brave.com'
        }
        this.result = mount(<UrlBarSuggestionItem
          suggestion={this.suggestion}
          selected
          currentIndex={1}
          i={0}
          onMouseOver={this.onMouseOver}
          onClick={this.onSuggestionClicked}
        />)
      })

      it('renders a list item', function () {
        assert.equal(this.result.find('li').length, 1)
      })

      it('renders the suggestion title', function () {
        if (suggestionType !== suggestionTypes.TOP_SITE) {
          assert.equal(this.result.find('.suggestionTitle').length, 1)
          assert.equal(this.result.find('.suggestionTitle').text(), this.suggestion.title)
        } else {
          assert.equal(this.result.find('.suggestionTitle').length, 0)
        }
      })

      it('renders a suggestion URL', function () {
        if (suggestionType !== suggestionTypes.SEARCH && suggestionType !== suggestionTypes.ABOUT_PAGES) {
          assert.equal(this.result.find('.suggestionLocation').length, 1)
          assert.equal(this.result.find('.suggestionLocation').text(), this.suggestion.location)
        } else {
          assert.equal(this.result.find('.suggestionLocation').length, 0)
        }
      })

      it('detects mouse moves', function () {
        this.result.simulate('click')
        assert.ok(this.onSuggestionClicked.calledOnce)
        assert.ok(this.onMouseOver.notCalled)
      })

      it('detects mouse moves', function () {
        this.result.simulate('mouseover')
        assert.ok(this.onMouseOver.calledOnce)
      })
    })
  })
})
