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
const _ = require('underscore')
let NewTabPage, randomSpy, Clock, Stats, FooterInfo, NewPrivateTab
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
    mockery.registerMock('../../fonts')
    mockery.registerMock('../../app/extensions/brave/img/newtab/private_tab_pagearea_icon.svg')
    mockery.registerMock('../../app/extensions/brave/img/newtab/private_tab_pagearea_ddgicon.svg')
    mockery.registerMock('../../app/extensions/brave/img/newtab/toricon.svg')
    randomSpy = sinon.spy(randomWrapper, 'random')
    mockery.registerMock('../../app/common/lib/randomUtil', randomWrapper)
    window.chrome = fakeElectron
    window.CustomEvent = {}
    NewTabPage = require('../../../js/about/newtab').component
    Clock = require('../../../js/about/newTabComponents/clock')
    Stats = require('../../../js/about/newTabComponents/stats')
    FooterInfo = require('../../../js/about/newTabComponents/footerInfo')
    NewPrivateTab = require('../../../js/about/newprivatetab')
  })

  after(function () {
    mockery.disable()
    randomSpy.restore()
  })

  let wrapper, incognitoWrapper
  const backgroundImage = {
    source: 'testing123.jpg'
  }
  const TIME_UNIT = {
    SECOND: 'S',
    MINUTE: 'M',
    HOUR: 'H',
    DAY: 'D'
  }
  const calculateSavedCount = function (estimatedTimeValue, estimatedTimeUnit, millisecondsPerItem) {
    let milliseconds
    switch (estimatedTimeUnit) {
      case TIME_UNIT.SECOND:
        milliseconds = estimatedTimeValue * 1000
        break
      case TIME_UNIT.MINUTE:
        milliseconds = estimatedTimeValue * 60 * 1000
        break
      case TIME_UNIT.HOUR:
        milliseconds = estimatedTimeValue * 60 * 60 * 1000
        break
      case TIME_UNIT.DAY:
        milliseconds = estimatedTimeValue * 24 * 60 * 60 * 1000
        break
      default:
        milliseconds = 0
        break
    }
    return milliseconds / millisecondsPerItem
  }

  beforeEach(function () {
    wrapper = shallow(
      <NewTabPage />
    )
    incognitoWrapper = shallow(
      <NewTabPage isIncognito />
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
        const result = wrapper.instance().randomBackgroundImage
        assert.notEqual(result, undefined)
        assert.equal(randomSpy.calledOnce, true)
      })

      it('returns an object which has a value set for `source`', function () {
        const instance = wrapper.instance()
        const result = instance.randomBackgroundImage
        assert.notEqual(result, undefined)
        assert.notEqual(result.source, undefined)
      })
    })
    describe('fallbackImage', function () {
      it('returns an object which has a value set for `source`', function () {
        const instance = wrapper.instance()
        const result = instance.fallbackImage
        assert.notEqual(result, undefined)
        assert.notEqual(result.source, undefined)
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

      it('renders newPrivateTab page if isIncognito props is true', function () {
        assert.equal(incognitoWrapper.find(NewPrivateTab).length, 1)
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

        it('includes wallpaper background element', function () {
          assert.equal(wrapper.find('[data-test-id="backgroundImage"]').length, 1)
        })

        it('sets backgroundImage for root element to the URL of the image', function () {
          const node = wrapper.find('[data-test-id="backgroundImage"]').node
          assert.notEqual(node, undefined)
          assert.deepEqual(node.props.src, backgroundImage.source)
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

        it('does NOT include wallpaper background', function () {
          assert.equal(wrapper.find('[data-test-id="backgroundImage"]').length, 0)
        })
      })
    })
  })

  describe('Time saved stats, when time saved', function () {
    const runs = [{
      message: '== 1 second',
      input: {
        estimatedTimeValue: 1,
        estimatedTimeUnit: TIME_UNIT.SECOND
      },
      expectedOutput: {
        expectedTimeSaved: 1
      }
    }, {
      message: '== 1.5 seconds',
      input: {
        estimatedTimeValue: 1.5,
        estimatedTimeUnit: TIME_UNIT.SECOND
      },
      expectedOutput: {
        expectedTimeSaved: 2
      }
    }, {
      message: '== 1 minute',
      input: {
        estimatedTimeValue: 1,
        estimatedTimeUnit: TIME_UNIT.MINUTE
      },
      expectedOutput: {
        expectedTimeSaved: 1
      }
    }, {
      message: '== 1.5 minutes',
      input: {
        estimatedTimeValue: 1.5,
        estimatedTimeUnit: TIME_UNIT.MINUTE
      },
      expectedOutput: {
        expectedTimeSaved: 2
      }
    }, {
      message: '== 1 hour',
      input: {
        estimatedTimeValue: 1,
        estimatedTimeUnit: TIME_UNIT.HOUR
      },
      expectedOutput: {
        expectedTimeSaved: 1
      }
    }, {
      message: '== 1.55 hours',
      input: {
        estimatedTimeValue: 1.55,
        estimatedTimeUnit: TIME_UNIT.HOUR
      },
      expectedOutput: {
        expectedTimeSaved: 1.6
      }
    }, {
      message: '== 1 day',
      input: {
        estimatedTimeValue: 1,
        estimatedTimeUnit: TIME_UNIT.DAY
      },
      expectedOutput: {
        expectedTimeSaved: 1
      }
    }, {
      message: '== 2.555 days',
      input: {
        estimatedTimeValue: 2.555,
        estimatedTimeUnit: TIME_UNIT.DAY
      },
      expectedOutput: {
        expectedTimeSaved: 2.56
      }
    }]
    let millisecondsPerItem

    // This is just there to get the millisecondsPerItem in a generic way
    before(function () {
      const dummyStatsInstace = shallow(<Stats newTabData={Immutable.fromJS({})} />).instance()
      millisecondsPerItem = dummyStatsInstace.millisecondsPerItem
    })

    _.each(runs, function (run) {
      it(run.message, function () {
        const timeSavedCount = calculateSavedCount(run.input.estimatedTimeValue, run.input.estimatedTimeUnit, millisecondsPerItem)
        const newTabData = Immutable.fromJS({
          adblockCount: timeSavedCount
        })
        const statsInstance = shallow(<Stats newTabData={newTabData} />).instance()
        assert.equal(statsInstance.estimatedTimeSaved.value, run.expectedOutput.expectedTimeSaved)
      })
    })
  })
})
