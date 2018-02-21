/* global describe, it, after, afterEach, before */
const sinon = require('sinon')
const assert = require('assert')
const Immutable = require('immutable')
const historyUtil = require('../../../../../app/common/lib/historyUtil')

require('../../../braveUnit')

describe('historyUtil unit tests', function () {
  const historyDayOne = Immutable.fromJS({
    lastAccessedTime: 1477944718876,
    location: 'https://brave.com/page1',
    title: 'sample 1'
  })
  const historyDayTwo = Immutable.fromJS({
    lastAccessedTime: 1478079042097,
    location: 'https://brave.com/page2',
    title: 'sample 2'
  })
  const historyDayThree = Immutable.fromJS([{
    lastAccessedTime: 1478157051910,
    location: 'https://brave.com/page3',
    title: 'sample 3'
  }, {
    lastAccessedTime: 1478157051921,
    location: 'https://brave.com/page4',
    title: 'sample 4'
  }, {
    lastAccessedTime: 1478157051932,
    location: 'https://brave.com/page5',
    title: 'sample 5'
  }])
  const historyMultipleDays = historyDayThree.push(historyDayTwo, historyDayOne)

  describe('getHistory', function () {
    it('null case', function () {
      const result = historyUtil.getHistory()
      assert.deepEqual(result.toJS(), [])
    })

    it('returns the result as an Immutable.List', function () {
      const result = historyUtil.getHistory(historyMultipleDays)
      assert.equal(Immutable.List.isList(result), true)
    })

    it('sorts the items by date/time DESC', function () {
      const result = historyUtil.getHistory(historyMultipleDays)
      const expectedResult = historyDayThree.toJS().reverse()
      expectedResult.push(historyDayTwo.toJS())
      expectedResult.push(historyDayOne.toJS())
      assert.deepEqual(result.toJS(), expectedResult)
    })

    it('only returns `historyUtil.maxEntries` results', function () {
      let tooManyEntries = new Immutable.List().push(historyDayOne)
      for (let i = 0; i < historyUtil.maxEntries; i++) {
        tooManyEntries = tooManyEntries.push(historyDayOne)
      }
      assert.equal(tooManyEntries.size, (historyUtil.maxEntries + 1))
      const result = historyUtil.getHistory(tooManyEntries)
      assert.equal(result.size, historyUtil.maxEntries)
    })
  })

  describe('groupEntriesByDay', function () {
    it('null case', function () {
      const result = historyUtil.groupEntriesByDay()
      assert.deepEqual(result.toJS(), [])
    })

    it('returns the result as an Immutable.List', function () {
      const result = historyUtil.groupEntriesByDay(historyDayThree)
      assert.equal(Immutable.List.isList(result), true)
    })

    it('has one object for each day', function () {
      const result = historyUtil.groupEntriesByDay(historyDayThree)
      assert.equal(result.size, 1)
    })

    it('can handle multiple days', function () {
      const result = historyUtil.groupEntriesByDay(historyMultipleDays)
      assert.equal(result.size, 3)
    })

    describe('with the object representing a day', function () {
      it('formats a readable `date` field', function () {
        const result = historyUtil.groupEntriesByDay(historyDayThree, 'en-US')
        assert.equal(result.getIn([0, 'date']), 'Thursday, November 3, 2016')
      })

      it('has an entry for each history item', function () {
        const result = historyUtil.groupEntriesByDay(historyDayThree, 'en-US')
        const entries = result.getIn([0, 'entries'])
        assert.equal(entries && entries.size, historyDayThree.size)
      })
    })
  })

  describe('totalEntries', function () {
    it('null case', function () {
      const result = historyUtil.totalEntries()
      assert.deepEqual(result.toJS(), [])
    })

    it('returns the result as an Immutable.List', function () {
      const result1 = historyUtil.groupEntriesByDay(historyMultipleDays)
      const result2 = historyUtil.totalEntries(result1)
      assert.equal(Immutable.List.isList(result2), true)
    })

    it('combines entries for multiple days into one response', function () {
      const result1 = historyUtil.groupEntriesByDay(historyMultipleDays)
      const result2 = historyUtil.totalEntries(result1)
      const expectedResult = [
        historyDayThree.toJS(),
        [historyDayTwo.toJS()],
        [historyDayOne.toJS()]
      ]
      assert.deepEqual(result2.toJS(), expectedResult)
    })
  })

  describe('prepareHistoryEntry', function () {
    let getKeySpy
    let siteDetailsSlim = Immutable.fromJS({
      title: 'ok',
      location: 'https://brave.com'
    })
    const siteDetails = Immutable.fromJS({
      title: 'ok',
      location: 'https://brave.com',
      lastAccessedTime: 1234,
      objectId: null,
      partitionNumber: 1,
      count: 1,
      themeColor: '#FFF',
      favicon: undefined,
      key: 'https://brave.com|1',
      skipSync: null
    })
    before(function () {
      getKeySpy = sinon.spy(historyUtil, 'getKey')
      this.clock = sinon.useFakeTimers()
      this.clock.tick(100)
    })

    afterEach(function () {
      getKeySpy.reset()
    })

    after(function () {
      getKeySpy.restore()
      this.clock.restore()
    })

    it('null case', function () {
      const result = historyUtil.prepareHistoryEntry()
      assert.deepEqual(result, Immutable.Map())
      assert(getKeySpy.notCalled)
    })

    it('set current time when lastAccessedTime is missing', function () {
      const result = historyUtil.prepareHistoryEntry(siteDetailsSlim)
      const expectedResult = {
        title: 'ok',
        location: 'https://brave.com',
        lastAccessedTime: 100,
        objectId: null,
        partitionNumber: 0,
        count: 1,
        themeColor: undefined,
        favicon: undefined,
        key: 'https://brave.com|0',
        skipSync: null
      }
      assert.deepEqual(result.toJS(), expectedResult)
      assert(getKeySpy.calledOnce)
    })

    it('generates history entry', function () {
      const result = historyUtil.prepareHistoryEntry(siteDetails)
      const expectedResult = {
        title: 'ok',
        location: 'https://brave.com',
        lastAccessedTime: 1234,
        objectId: null,
        partitionNumber: 1,
        count: 1,
        themeColor: '#FFF',
        favicon: undefined,
        key: 'https://brave.com|1',
        skipSync: null
      }
      assert.deepEqual(result.toJS(), expectedResult)
      assert(getKeySpy.calledOnce)
    })
  })

  describe('mergeSiteDetails', function () {
    let getKeySpy
    before(function () {
      getKeySpy = sinon.spy(historyUtil, 'getKey')
      this.clock = sinon.useFakeTimers()
      this.clock.tick(100)
    })

    afterEach(function () {
      getKeySpy.reset()
    })

    after(function () {
      getKeySpy.restore()
      this.clock.restore()
    })

    it('null case', function () {
      const result = historyUtil.mergeSiteDetails()
      assert.deepEqual(result, Immutable.Map())
      assert(getKeySpy.notCalled)
    })

    it('take new object', function () {
      const oldDetails = Immutable.fromJS({
        objectId: 1,
        lastAccessedTime: 10,
        title: 'old',
        location: 'https://brave.com',
        partitionNumber: 1,
        count: 1,
        themeColor: '#FFF',
        favicon: ''
      })

      const newDetails = Immutable.fromJS({
        objectId: 2,
        title: 'new',
        location: 'https://clifton.io',
        partitionNumber: 2,
        count: 3,
        themeColor: '#F00',
        favicon: 'icon'
      })

      const expectedResult = {
        objectId: 2,
        title: 'new',
        location: 'https://clifton.io',
        partitionNumber: 2,
        count: 2,
        themeColor: '#F00',
        favicon: 'icon',
        key: 'https://clifton.io|2',
        lastAccessedTime: 100
      }

      const result = historyUtil.mergeSiteDetails(oldDetails, newDetails)
      assert.deepEqual(result.toJS(), expectedResult)
      assert(getKeySpy.calledOnce)
    })

    it('take old object', function () {
      const oldDetails = Immutable.fromJS({
        objectId: 1,
        lastAccessedTime: 10,
        title: 'old',
        location: 'https://brave.com',
        partitionNumber: 1,
        count: 1,
        themeColor: '#FFF',
        favicon: 'icon'
      })

      const newDetails = Immutable.fromJS({
        title: 'new',
        location: 'https://clifton.io'
      })

      const expectedResult = {
        objectId: 1,
        lastAccessedTime: 100,
        title: 'new',
        location: 'https://clifton.io',
        partitionNumber: 0,
        count: 2,
        themeColor: '#FFF',
        key: 'https://clifton.io|0',
        favicon: 'icon'
      }

      const result = historyUtil.mergeSiteDetails(oldDetails, newDetails)
      assert.deepEqual(result.toJS(), expectedResult)
      assert(getKeySpy.calledOnce)
    })
  })

  describe('getDetailFromFrame', function () {
    it('null case', function () {
      const result = historyUtil.getDetailFromFrame()
      assert.deepEqual(result, null)
    })

    it('no location case', function () {
      const badFrame = Immutable.Map().set('partitionNumber', 0)
      const result = historyUtil.getDetailFromFrame(badFrame)
      assert.deepEqual(result, null)
    })

    it('returns details', function () {
      const frame = Immutable.fromJS({
        guestInstanceId: '1',
        hasBeenActivated: true,
        hrefPreview: '',
        isFullScreen: false,
        isPrivate: false,
        key: 1,
        lastZoomPercentage: 1,
        loading: true,
        location: 'https://brave.com',
        title: 'Brave'
      })
      const expectedResult = {
        location: 'https://brave.com',
        title: 'Brave',
        partitionNumber: 0,
        favicon: undefined,
        themeColor: undefined
      }
      const result = historyUtil.getDetailFromFrame(frame)
      assert.deepEqual(result.toJS(), expectedResult)
    })
  })

  describe('getKey', function () {
    it('null case', function () {
      const result = historyUtil.getKey()
      assert.equal(result, null)
    })

    it('location is missing', function () {
      const detail = Immutable.fromJS({
        title: 'working'
      })
      const result = historyUtil.getKey(detail)
      assert.equal(result, null)
    })

    it('key is generated, with the default partition', function () {
      const detail = Immutable.fromJS({
        title: 'working',
        location: 'https://brave.com'
      })
      const result = historyUtil.getKey(detail)
      assert.equal(result, 'https://brave.com|0')
    })

    it('key is generated', function () {
      const detail = Immutable.fromJS({
        title: 'working',
        location: 'https://brave.com',
        partitionNumber: 1
      })
      const result = historyUtil.getKey(detail)
      assert.equal(result, 'https://brave.com|1')
    })
  })
})
