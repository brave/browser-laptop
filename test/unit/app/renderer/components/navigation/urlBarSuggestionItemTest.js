/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it, afterEach */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const fakeElectron = require('../../../../lib/fakeElectron')
const suggestionTypes = require('../../../../../../js/constants/suggestionTypes')
require('../../../../braveUnit')

describe('UrlBarSuggestionItem component', function () {
  let appActions, windowActions, UrlBarSuggestionItem

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    UrlBarSuggestionItem = require('../../../../../../app/renderer/components/navigation/urlBarSuggestionItem')
    appActions = require('../../../../../../js/actions/appActions')
    windowActions = require('../../../../../../js/actions/windowActions')
    this.onMouseMove = sinon.spy(appActions, 'urlBarSelectedIndexChanged')
    this.onSuggestionClicked = sinon.spy(windowActions, 'activeSuggestionClicked')
  })

  afterEach(function () {
    this.onMouseMove.reset()
    this.onSuggestionClicked.reset()
  })

  after(function () {
    mockery.disable()
  })

  Object.values(suggestionTypes).forEach((suggestionType) => {
    describe(`${suggestionType} suggestion item`, function () {
      before(function () {
        this.suggestion = Immutable.fromJS({
          title: 'hello',
          type: suggestionType,
          location: 'http://www.brave.com'
        })
        this.result = mount(<UrlBarSuggestionItem
          suggestion={this.suggestion}
          selected
          currentIndex={1}
          i={0}
        />)
      })

      it('renders a list item', function () {
        assert.equal(this.result.find('li').length, 1)
      })

      it('renders the suggestion title', function () {
        if (suggestionType !== suggestionTypes.TOP_SITE) {
          assert.equal(this.result.find('[data-test-id="suggestionTitle"]').length, 1)
          assert.equal(this.result.find('[data-test-id="suggestionTitle"]').text(), this.suggestion.get('title'))
        } else {
          assert.equal(this.result.find('[data-test-id="suggestionTitle"]').length, 0)
        }
      })

      it('renders a suggestion URL', function () {
        if (suggestionType !== suggestionTypes.SEARCH && suggestionType !== suggestionTypes.ABOUT_PAGES) {
          assert.equal(this.result.find('[data-test-id="suggestionLocation"]').length, 1)
          assert.equal(this.result.find('[data-test-id="suggestionLocation"]').text(), this.suggestion.get('location'))
        } else {
          assert.equal(this.result.find('[data-test-id="suggestionLocation"]').length, 0)
        }
      })

      it('detects mouse click', function () {
        this.result.simulate('click')
        assert.ok(this.onSuggestionClicked.calledOnce)
        assert.ok(this.onMouseMove.notCalled)
      })

      it('detects mouse move', function () {
        this.result.simulate('mousemove')
        assert.ok(this.onMouseMove.calledOnce)
      })
    })
  })
})
