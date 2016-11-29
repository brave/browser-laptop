/* global describe, it */
const assert = require('assert')
const Immutable = require('immutable')
const historyUtil = require('../../../../../app/common/lib/historyUtil')

require('../../../braveUnit')

describe('historyUtil', function () {
  const historyDayOne = Immutable.fromJS({
    lastAccessedTime: 1477944718876,
    location: 'https://brave.com/page1',
    title: 'sample 1',
    tags: []
  })
  const historyDayTwo = Immutable.fromJS({
    lastAccessedTime: 1478079042097,
    location: 'https://brave.com/page2',
    title: 'sample 2',
    tags: []
  })
  const historyDayThree = Immutable.fromJS([{
    lastAccessedTime: 1478157051910,
    location: 'https://brave.com/page3',
    title: 'sample 3',
    tags: []
  }, {
    lastAccessedTime: 1478157051921,
    location: 'https://brave.com/page4',
    title: 'sample 4',
    tags: []
  }, {
    lastAccessedTime: 1478157051932,
    location: 'https://brave.com/page5',
    title: 'sample 5',
    tags: []
  }])
  const historyMultipleDays = historyDayThree.push(historyDayTwo, historyDayOne)

  describe('getHistory', function () {
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
})
