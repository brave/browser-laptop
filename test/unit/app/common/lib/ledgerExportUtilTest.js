/* global describe, it, before */
const assert = require('assert')
const underscore = require('underscore')
const uuid = require('uuid')
const format = require('date-fns/format')

require('../../../braveUnit')

const ledgerExportUtil = require('../../../../../app/common/lib/ledgerExportUtil')

const CSV_HEADER_ROW_PREFIX_COLUMNS = ['Publisher', 'Votes', 'Fraction']
const CSV_HEADER_ROW_PREFIX = CSV_HEADER_ROW_PREFIX_COLUMNS.join(',')
const DEFAULT_CSV_HEADER_ROW_COLUMNS = CSV_HEADER_ROW_PREFIX_COLUMNS.concat(['USD'])
const DEFAULT_CSV_HEADER_ROW = DEFAULT_CSV_HEADER_ROW_COLUMNS.join(',')
const CSV_COLUMN_COUNT = DEFAULT_CSV_HEADER_ROW.split(',').length
// N.B. the expected datatype for the 'USD'/fiat column is a 'string' because it is of form '5.00 USD'
const CSV_EXPECTED_COLUMN_DATATYPES = ['string', 'number', 'number', 'string']

const EXPORT_FILENAME_CONST_PREFIX_PART = 'Brave_Payments_'
const EXPORT_FILENAME_PREFIX_EXPECTED_FORM = `${EXPORT_FILENAME_CONST_PREFIX_PART}\${YYYY-MM-DD}`

const exampleTransactions = require('../../../fixtures/exampleLedgerData').transactions
const exampleTransaction = exampleTransactions[0]

const PUBLISHERS = (exampleTransaction.ballots ? underscore.keys(exampleTransaction.ballots) : [])
const NUM_PUBLISHERS = PUBLISHERS.length

describe('ledger export utilities test', function () {
  describe('example transaction data ("exampleLedgerData.js")', function () {
    it('there should be example transactions to test with', function () {
      assert(!!exampleTransactions)
      assert(exampleTransactions.length)
    })

    it('the first example transaction should have a "ballots" object', function () {
      assert(!!exampleTransaction.ballots)
    })

    it('the first example transaction\'s "ballots" object should contain >= 1 publisher / vote-count KV pairs', function () {
      assert(NUM_PUBLISHERS > 0)
      assert.equal(typeof PUBLISHERS[0], 'string')
      assert.equal(typeof exampleTransaction.ballots[PUBLISHERS[0]], 'number')
    })
  })

  describe('getTransactionCSVRows', function () {
    describe('with invalid input', function () {
      it('returns an array w/ header if undefined', function () {
        assert.deepEqual(ledgerExportUtil.getTransactionCSVRows(undefined),
          [DEFAULT_CSV_HEADER_ROW])
      })

      it('returns an array w/ header if null', function () {
        assert.deepEqual(ledgerExportUtil.getTransactionCSVRows(null),
          [DEFAULT_CSV_HEADER_ROW])
      })

      it('returns an array w/ header if empty', function () {
        assert.deepEqual(ledgerExportUtil.getTransactionCSVRows([]),
          [DEFAULT_CSV_HEADER_ROW])
      })
    })

    it('returns a CSV row array, where the first row is the expected header row up to the currency column (which varies)', function () {
      let rows = ledgerExportUtil.getTransactionCSVRows(exampleTransactions)

      checkHeaderRowPrefixForRows(rows)
    })

    it('returns a CSV row array with the same number of columns in every row', function () {
      let rows = ledgerExportUtil.getTransactionCSVRows(exampleTransactions)

      checkColumnCountsForRows(rows)
    })

    it('returns a CSV row array with expected data types for each column in every row', function () {
      let rows = ledgerExportUtil.getTransactionCSVRows(exampleTransactions)

      checkColumnDatatypesForRows(rows)
    })

    describe('with `addTotalRow` == false', function () {
      it('returns an array w/ correct # of rows', function () {
        const EXPECTED_CSV_ROW_COUNT_NO_TOTAL = 1 + NUM_PUBLISHERS
        const rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction)

        assert.equal(rows.length, EXPECTED_CSV_ROW_COUNT_NO_TOTAL)
      })
    })

    describe('with `addTotalRow` == true', function () {
      it('returns an array w/ correct # of rows (1 header, 1 per publisher, and 1 with totals)', function () {
        const EXPECTED_CSV_ROW_COUNT_WITH_TOTAL = 1 + NUM_PUBLISHERS + 1
        const ADD_TOTAL_ROW = true
        const rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction, null, ADD_TOTAL_ROW)

        assert.equal(rows.length, EXPECTED_CSV_ROW_COUNT_WITH_TOTAL)
      })
      it('returns a `total row` entry with correct totals for each numeric column', function () {
        const ADD_TOTAL_ROW = true
        let rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction, null, ADD_TOTAL_ROW)

        checkTotalRow(rows)
      })
    })

    describe('with `sortByContribution` == false', function () {
      it('sort publishers alphabetically (per spec)', function () {
        const rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction)
        let lastEntry
        let isValid = true
        rows.forEach((row) => {
          const rowData = row.split(',')
          const publisherName = rowData[0]
          if (!lastEntry) {
            lastEntry = publisherName
            return
          }
          if (publisherName < lastEntry) {
            isValid = false
          }
          lastEntry = publisherName
        })
        assert.equal(isValid, true)
      })
    })

    describe('with `sortByContribution` == true', function () {
      it('sort publishers by contribution', function () {
        const rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction, null, null, true)
        let lastEntry
        let isValid = true
        rows.forEach((row) => {
          const rowData = row.split(',')
          const votes = parseInt(rowData[1], 10)
          if (typeof lastEntry !== 'number') {
            lastEntry = votes
            return
          }
          if (votes > lastEntry) {
            isValid = false
          }
          lastEntry = votes
        })
        assert.equal(isValid, true)
      })
    })
  })

  describe('getPublisherVoteData', function () {
    let publisherData
    let publishers

    before(function () {
      publisherData = ledgerExportUtil.getPublisherVoteData(exampleTransactions)
      if (publisherData && typeof publisherData === 'object') {
        publishers = underscore.keys(publisherData)
      }
    })

    it('should return a publisher data object with 1 key per publisher', function () {
      assert(!!publisherData, 'returned publisher data should exist')
      assert.equal(typeof publisherData, 'object', 'returned publisher data should be an object')

      let publishers = underscore.keys(publisherData)

      assert(!!publishers && underscore.isArray(publishers))

      assert.equal(publishers.length, NUM_PUBLISHERS, 'there should be 1 key per publisher')

      publishers.forEach(function (publisher) {
        let value = publisherData[publisher]
        assert(!!value, `publisher "${publisher}" does not have a value associated with it`)
        assert.equal(typeof value, 'object', `publisher "${publisher}" has a value that is not an object associated with it (value: "${value}")`)
      })
    })

    describe('each publisher value', function () {
      it('should have "votes" (type number, >= 0) defined', function () {
        publishers.forEach(function (publisher) {
          assert(typeof publisherData[publisher].votes, 'number')
          assert(publisherData[publisher].votes >= 0)
        })
      })

      it('should have "fraction" (type number, >= 0) defined', function () {
        publishers.forEach(function (publisher) {
          assert(typeof publisherData[publisher].fraction, 'number')
          assert(publisherData[publisher].fraction >= 0)
        })
      })

      it('should have "contribution" (type object) defined', function () {
        publishers.forEach(function (publisher) {
          assert(typeof publisherData[publisher].contribution, 'object')
        })
      })

      describe('each publisher->contribution entry', function () {
        it('should have "fiat" (type number, >= 0) defined', function () {
          publishers.forEach(function (publisher) {
            let publisherContributionEntry = publisherData[publisher].contribution
            assert(typeof publisherContributionEntry.fiat, 'number')
            assert(publisherContributionEntry.fiat >= 0)
          })
        })

        it('should have "currency" (type string) defined', function () {
          publishers.forEach(function (publisher) {
            let publisherContributionEntry = publisherData[publisher].contribution
            assert(typeof publisherContributionEntry.currency, 'string')
          })
        })
      })
    })

    it('the sum of the "fraction" value across all publisher entries should be 1', function () {
      let fractionSum = 0
      publishers.forEach(function (publisher) {
        fractionSum += publisherData[publisher].fraction
      })
      assert.equal(fractionSum, 1)
    })

    it('the sum of the "votes" value across all publisher entries should be equal to the overall "votes" entry for the transaction object given as input', function () {
      let txLevelVotesSum = 0
      exampleTransactions.forEach(function (tx) {
        txLevelVotesSum += tx.votes
      })
      let votesSum = 0
      publishers.forEach(function (publisher) {
        votesSum += publisherData[publisher].votes
      })
      assert.equal(votesSum, txLevelVotesSum)
    })
  })

  describe('getTransactionsByViewingIds', function () {
    it('given a single viewingId as a string, it returns an array containing just that transaction (if it exists)', function () {
      const EXAMPLE_VIEWING_ID = exampleTransactions[0].viewingId
      let filteredTxArr = ledgerExportUtil.getTransactionsByViewingIds(exampleTransactions, EXAMPLE_VIEWING_ID)

      assert(underscore.isArray(filteredTxArr), 'it should return an array')
      assert.equal(filteredTxArr.length, 1, 'it should contain a single transaction when a viewingId present in original array is provided')
      assert.deepEqual(filteredTxArr[0], exampleTransactions[0], 'it should return the correct transaction object from the array')

      let emptyFilteredTxArr = ledgerExportUtil.getTransactionsByViewingIds(exampleTransactions, 'INVALID VIEWING ID')
      assert(underscore.isArray(emptyFilteredTxArr), 'it should return an array')
      assert.equal(emptyFilteredTxArr.length, 0, 'it should be an empty array when a viewingId NOT present in original array is provided')
    })

    it('given viewingIds as an array, it filters a transactions array for those transactions', function () {
      // TODO: NEED MORE TRANSACTIONS IN EXAMPLE DATA TO REALLY MAKE THIS A GOOD TEST
      const EXAMPLE_VIEWING_IDS = [exampleTransactions[0].viewingId, 'INVALID VIEWING ID EXAMPLE']
      let filteredTxArr = ledgerExportUtil.getTransactionsByViewingIds(exampleTransactions, EXAMPLE_VIEWING_IDS)

      assert(underscore.isArray(filteredTxArr), 'it should return an array')
      assert.equal(filteredTxArr.length, 1, 'the returned array should contain only transactions with matching viewingIds')
      assert.deepEqual(filteredTxArr[0], exampleTransactions[0], 'it should return the correct transaction object from the array')
    })
  })

  describe('getTotalContribution', function () {
    /**
      var totalContribution = {
        fiat: { amount: 0, currency: null },
        fee: 0
      }
    **/
    let contributionData

    before(function () {
      contributionData = ledgerExportUtil.getTotalContribution(exampleTransactions)
    })

    it('returns a total contribution object', function () {
      assert.equal(typeof contributionData, 'object')
    })

    describe('total contribution object', function () {
      it('has a key "fiat" associated with an object containing two subkeys, "amount" (number) and "currency" (string)', function () {
        assert.equal(typeof contributionData.fiat, 'object', 'should have a key "fiat" with an object associated')
        assert.equal(typeof contributionData.fiat.amount, 'number', 'should have a key "amount" with value of type "number"')
        assert.equal(typeof contributionData.fiat.currency, 'string', 'should have a key "amount" with value of type "string"')
      })

      it('has a key, fee with value of type number (>= 0)', function () {
        assert.equal(typeof contributionData.fee, 'number')
        assert(contributionData.fee >= 0)
      })
    })
  })

  describe('addExportFilenamePrefixToTransactions', function () {
    it('should return an empty array if not passed any transactions (empty array, null, or undefined input)', function () {
      let output

      output = ledgerExportUtil.addExportFilenamePrefixToTransactions([])
      assert(output && underscore.isArray(output) && output.length === 0, 'should return an empty array when given an empty array as input')

      output = ledgerExportUtil.addExportFilenamePrefixToTransactions(undefined)
      assert(output && underscore.isArray(output) && output.length === 0, 'should return an empty array when given undefined as input')

      output = ledgerExportUtil.addExportFilenamePrefixToTransactions(null)
      assert(output && underscore.isArray(output) && output.length === 0, 'should return an empty array when given null as input')
    })

    it('should return the same output for a single transaction given as an array or single object', function () {
      let txs = [cloneTransactionWithNewViewingId(exampleTransaction)]
      assert(txs[0] && !txs[0].exportFilenamePrefix, 'the example transaction should not already have "exportFilenamePrefix" defined')

      let outputFromArray = ledgerExportUtil.addExportFilenamePrefixToTransactions(txs)
      let outputFromObject = ledgerExportUtil.addExportFilenamePrefixToTransactions(txs[0])

      assert.deepEqual(outputFromArray, outputFromObject, 'the same output should be returned for an array with 1 transaction and the transaction object itself')
    })

    it(`should add a field "exportFilenamePrefix" to each transaction with correct form ("${EXPORT_FILENAME_PREFIX_EXPECTED_FORM}")`, function () {
      let txs = [cloneTransactionWithNewViewingId(exampleTransaction)]
      assert(txs[0] && !txs[0].exportFilenamePrefix, 'the example transaction should not already have "exportFilenamePrefix" defined')
      txs = ledgerExportUtil.addExportFilenamePrefixToTransactions(txs)

      let tx = txs[0]
      let timestamp = tx.submissionStamp
      let dateStr = format(new Date(timestamp), 'YYYY-MM-DD')
      let expectedExportFilenamePrefix = `${EXPORT_FILENAME_CONST_PREFIX_PART}${dateStr}`

      assert.equal(typeof tx.exportFilenamePrefix, 'string', 'transaction should have "exportFilenamePrefix" field with type "string"')
      assert.equal(tx.exportFilenamePrefix, expectedExportFilenamePrefix, `"exportFilenamePrefix" field should have expected form: "${EXPORT_FILENAME_PREFIX_EXPECTED_FORM}", here with date string = "${dateStr}"`)
    })

    it('should add a distinct suffix ("_<n>") to "exportFilenamePrefix" when multiple transactions occur on same day to ensure the field value is unique', function () {
      // create 3 clone transactions identical except for viewingId
      //  -> these will all have a submissionStamp corresponding to the same DAY
      let txs = [cloneTransactionWithNewViewingId(exampleTransaction), cloneTransactionWithNewViewingId(exampleTransaction), cloneTransactionWithNewViewingId(exampleTransaction)]

      let sameDaySubmissionStamp = txs[0].submissionStamp

      // add one more clone transaction but modify the date to be a day later
      //  -> this should NOT get the distinguishing suffix
      let txOnDifferentDate = cloneTransactionWithNewViewingId(exampleTransaction)
      txOnDifferentDate.submissionStamp += 1000 * 3600 * 48 // shift by 48 hours (2 days)
      txs.push(txOnDifferentDate)

      txs.forEach(function (tx) {
        assert(tx && !tx.exportFilenamePrefix, 'the example transactions should not already have "exportFilenamePrefix" defined')
      })

      txs = ledgerExportUtil.addExportFilenamePrefixToTransactions(txs)

      let numSameDayTxProcessed = 0
      txs.forEach(function (tx, idx) {
        assert.equal(typeof tx.exportFilenamePrefix, 'string', 'each transactions should now have a "exportFilenamePrefix" field of type "string" defined')

        if (tx.submissionStamp === sameDaySubmissionStamp) {
          numSameDayTxProcessed++
        }

        let firstTransactionForDate = !idx || tx.submissionStamp !== sameDaySubmissionStamp
        if (firstTransactionForDate) {
          let errMessage = `the first transaction for a given date should NOT have the distinguishing "_<n>" suffix: "${tx.exportFilenamePrefix}" (tx idx = ${idx})`
          assert.equal(tx.exportFilenamePrefix.slice(tx.exportFilenamePrefix.length - 2).indexOf('_'), -1, errMessage)
        } else { // if 2nd or 3rd transaction on a given date...
          assert.equal(tx.exportFilenamePrefix.slice(tx.exportFilenamePrefix.length - 2), `_${numSameDayTxProcessed}`, 'the second and third transaction for a given date SHOULD have the suffix "_<n>"')
        }
      })
    })
  })
})

// clone a transaction but give it a unique viewingId
function cloneTransactionWithNewViewingId (tx) {
  let cloneTx = underscore.clone(tx)
  cloneTx.viewingId = uuid.v4().toLowerCase()

  return cloneTx
}

function checkColumnCountsForRows (rows) {
  for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    let row = rows[rowIdx]
    assert(!!row, `expected row ${rowIdx} to exist`)

    let cols = row.split(',')
    assert.equal(cols.length, CSV_COLUMN_COUNT, `expected row ${rowIdx} to have ${CSV_COLUMN_COUNT} columns`)
  }
}

function checkHeaderRowPrefixForRows (rows) {
  assert(!!rows && rows.length, 'expected output to have at least one row')

  let headerRow = rows[0]
  assert(!!headerRow, 'expected header row to exist')
  assert.equal(headerRow.slice(0, CSV_HEADER_ROW_PREFIX.length), CSV_HEADER_ROW_PREFIX)
}

function checkColumnDatatypesForRows (rows) {
  let COLUMN_LABELS = CSV_HEADER_ROW_PREFIX_COLUMNS.concat(['FIAT'])
  // start at rowIdx = 1 to SKIP the header row
  for (var rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    let row = rows[rowIdx]
    assert(!!row, `expected row ${rowIdx} to exist`)
    let cols = row.split(',')
    for (var colIdx = 0; colIdx < cols.length; colIdx++) {
      let colVal = cols[colIdx]

      if (CSV_EXPECTED_COLUMN_DATATYPES[colIdx] === 'number' &&
          `${parseFloat(colVal)}` === colVal) {
        colVal = parseFloat(colVal)
      }

      let columnDatatype = typeof colVal
      assert.equal(columnDatatype, CSV_EXPECTED_COLUMN_DATATYPES[colIdx], `expected ${COLUMN_LABELS[colIdx]} column (value = ${cols[colIdx]}) for row ${rowIdx} to be type "${CSV_EXPECTED_COLUMN_DATATYPES[colIdx]}" , but found type "${columnDatatype}"`)
    }
  }
}

function checkTotalRow (rows) {
  let totalRow = rows[rows.length - 1]

  let totalRowColumns = totalRow.split(',')

  for (var colIdx = 0; colIdx < totalRowColumns.length; colIdx++) {
    let expectedColType = CSV_EXPECTED_COLUMN_DATATYPES[colIdx]

    if (expectedColType === 'number') {
      let totalRowValue = parseFloat(totalRowColumns[colIdx])
      checkCSVColumnTotal(rows.slice(1, rows.length - 1), colIdx, totalRowValue)
    }
  }
}

function checkCSVColumnTotal (rows, colIdx, expectedTotal) {
  let sum = 0

  for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    let row = rows[rowIdx]
    let cols = row.split(',')

    let colVal = (cols || [])[colIdx]
    assert(colVal === 0 || (!!colVal), `value for row ${rowIdx}, column ${colIdx} is not defined!`)

    let parsedColVal = parseFloat(colVal)
    assert(`${parsedColVal}` === colVal, `value (${colVal}) for row ${rowIdx}, column ${colIdx} is not numeric`)

    sum += parsedColVal
  }

  assert.equal(sum, expectedTotal, `Sum for column ${colIdx} across ${rows.length} rows does not match expected value`)

  /**
   * anyone debugging this test may want to temporarily uncomment the following two ines:
   *   let columnNames = CSV_HEADER_ROW_PREFIX_COLUMNS.concat(['Fiat'])
   *   console.log(`\tSum for column ${columnNames[colIdx]} (#${colIdx}) across ${rows.length} rows (=${sum}) matches expected total (${expectedTotal})`)
   **/
}
