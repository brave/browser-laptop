/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, beforeEach, after, it */

const React = require('react')
const mockery = require('mockery')
const {shallow} = require('enzyme')
const sinon = require('sinon')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../lib/fakeElectron')
let NewTabPage, randomSpy, Clock, Stats, FooterInfo
require('../braveUnit')

const randomWrapper = {
  random: () => Math.random()
}

describe('NewTab component unit tests', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../less/about/newtab.less', {})
    mockery.registerMock('../../node_modules/font-awesome/css/font-awesome.css', {})
    randomSpy = sinon.spy(randomWrapper, 'random')
    mockery.registerMock('../../app/common/lib/randomUtil', randomWrapper)
    window.chrome = fakeElectron
    window.CustomEvent = {}
    NewTabPage = require('../../../js/about/newtab').component
    Clock = require('../../../js/about/newTabComponents/clock')
    Stats = require('../../../js/about/newTabComponents/stats')
    FooterInfo = require('../../../js/about/newTabComponents/footerInfo')
  })

  after(function () {
    mockery.disable()
    randomSpy.restore()
  })

  let wrapper
  const backgroundImage = {
    style: {
      backgroundImage: 'url(testing123.jpg)'
    }
  }

  beforeEach(function () {
    wrapper = shallow(
      <NewTabPage />
    )
  })

  describe('Object properties', function () {
    describe('showImages', function () {
      it('returns true when `showImages` and `backgroundImage` are true', function () {
        wrapper.setState({showImages: true, backgroundImage})
        const instance = wrapper.instance()
        assert.equal(instance.showImages, true)
      })

      it('returns false when `showImages` is falsey', function () {
        wrapper.setState({showImages: false, backgroundImage})
        const instance = wrapper.instance()
        assert.equal(instance.showImages, false)
      })

      it('returns false when `backgroundImage` is falsey', function () {
        wrapper.setState({showImages: true, backgroundImage: undefined})
        const instance = wrapper.instance()
        assert.equal(instance.showImages, false)
      })
    })

    describe('randomBackgroundImage', function () {
      it('calls random to get a random index', function () {
        randomSpy.reset()
        const instance = wrapper.instance()
        instance.randomBackgroundImage
        assert.equal(randomSpy.calledOnce, true)
      })

      it('returns an object which has a value set for `style.backgroundImage`', function () {
        const instance = wrapper.instance()
        const result = instance.randomBackgroundImage
        assert.notEqual(result, undefined)
        assert.notEqual(result.style, undefined)
        assert.notEqual(result.style.backgroundImage, undefined)
        assert.equal(!!result.style.backgroundImage.match(/^url\(/), true)
      })
    })
    describe('fallbackImage', function () {
      it('returns an object which has a value set for `style.backgroundImage`', function () {
        const instance = wrapper.instance()
        const result = instance.fallbackImage
        assert.notEqual(result, undefined)
        assert.notEqual(result.style, undefined)
        assert.notEqual(result.style.backgroundImage, undefined)
        assert.equal(!!result.style.backgroundImage.match(/^url\(/), true)
      })
    })
    describe('topSites', function () {
    })
    describe('pinnedTopSites', function () {
    })
    describe('ignoredTopSites', function () {
    })
    describe('gridLayoutSize', function () {
    })
    describe('gridLayout', function () {
    })
  })

  describe('Rendering', function () {
    describe('empty new tab', function () {
      it('renders an empty div if `this.state.showEmptyPage` is true', function () {
        wrapper.setState({showEmptyPage: true})
        assert.equal(wrapper.find('div.empty').length, 1)
      })
    })

    describe('dashboard', function () {
      const emptyNewTabData = Immutable.fromJS({})

      it('returns null if newTabData is not set', function () {
        wrapper.setState({showEmptyPage: false})
        assert.equal(wrapper.node, null)
      })

      it('renders the Stats component', function () {
        wrapper.setState({showEmptyPage: false, newTabData: emptyNewTabData})
        assert.equal(wrapper.find(Stats).length, 1)
      })

      it('renders the Clock component', function () {
        wrapper.setState({showEmptyPage: false, newTabData: emptyNewTabData})
        assert.equal(wrapper.find(Clock).length, 1)
      })

      it('renders the FooterInfo component', function () {
        wrapper.setState({showEmptyPage: false, newTabData: emptyNewTabData})
        assert.equal(wrapper.find(FooterInfo).length, 1)
      })

      describe('when `this.showImages` is true', function () {
        beforeEach(function () {
          wrapper.setState({
            showEmptyPage: false,
            showImages: true,
            newTabData: emptyNewTabData,
            backgroundImage
          })
        })

        it('sets backgroundImage for root element to the URL of the image', function () {
          const node = wrapper.find('.dynamicBackground').node
          assert.notEqual(node, undefined)
          assert.deepEqual(node.props.style, backgroundImage.style)
        })

        it('includes div element with class bgGradient', function () {
          assert.equal(wrapper.find('.bgGradient').length, 1)
        })

        it('includes img element (used to detect onError)', function () {
          assert.equal(wrapper.find('img[data-test-id="backgroundImage"]').length, 1)
        })
      })

      describe('when `this.showImages` is false', function () {
        beforeEach(function () {
          wrapper.setState({
            showEmptyPage: false,
            showImages: false,
            newTabData: emptyNewTabData,
            backgroundImage: undefined
          })
        })

        it('includes element with class gradient', function () {
          assert.equal(wrapper.find('.gradient').length, 1)
        })

        it('does NOT include img element (used to detect onError)', function () {
          assert.equal(wrapper.find('img[data-test-id="backgroundImage"]').length, 0)
        })
      })
    })
  })
})
