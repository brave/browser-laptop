/* global describe, it */
const assert = require('assert')
const underscore = require('underscore')

require('../braveUnit')

const ledgerExportUtil = require('../../../js/lib/ledgerExportUtil.js')
const base64Encode = require('../../../js/lib/base64').encode

const CSV_HEADER_ROW_PREFIX_COLUMNS = ['Publisher', 'Votes', 'Fraction', 'BTC']
const CSV_HEADER_ROW_PREFIX = CSV_HEADER_ROW_PREFIX_COLUMNS.join(',')
const DEFAULT_CSV_HEADER_ROW = CSV_HEADER_ROW_PREFIX + ',USD'
const CSV_COLUMN_COUNT = DEFAULT_CSV_HEADER_ROW.split(',').length
const EMPTY_CSV = DEFAULT_CSV_HEADER_ROW
// N.B. the expected datatype for the 'USD'/fiat column is a 'string' because it is of form '5.00 USD'
const CSV_EXPECTED_COLUMN_DATATYPES = ['string', 'number', 'number', 'number', 'string']

const CSV_CONTENT_TYPE = 'text/csv'
const CSV_DATA_URI_PREFIX = 'data:' + CSV_CONTENT_TYPE + ';base64,'
const EMPTY_CSV_DATA_URL = CSV_DATA_URI_PREFIX + base64Encode(EMPTY_CSV)

const exampleTransactions = require('./exampleLedgerData').transactions
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

  describe('transactionsToCSVDataURL', function () {
    it(`returns a properly formatted data URL string with expected content-type (${CSV_CONTENT_TYPE})`, function () {
      let output = ledgerExportUtil.transactionsToCSVDataURL(exampleTransactions)

      assert.equal(!!output, true)
      assert.equal(typeof output, 'string')
      assert(output.length > CSV_DATA_URI_PREFIX.length)
      assert.equal(output.slice(0, 'data:'.length), 'data:')
      assert.equal(output.slice('data:'.length, 'data:'.length + CSV_CONTENT_TYPE.length), CSV_CONTENT_TYPE)
      assert.equal(output.slice('data:'.length + CSV_CONTENT_TYPE.length, 'data:'.length + CSV_CONTENT_TYPE.length + ';base64,'.length), ';base64,')
    })

    it('for empty input, returns a CSV data URL containing only a header row', function () {
      let output

      output = ledgerExportUtil.transactionsToCSVDataURL(undefined)
      assert.equal(output, EMPTY_CSV_DATA_URL)

      output = ledgerExportUtil.transactionsToCSVDataURL(null)
      assert.equal(output, EMPTY_CSV_DATA_URL)

      output = ledgerExportUtil.transactionsToCSVDataURL([])
      assert.equal(output, EMPTY_CSV_DATA_URL)
    })

    it('given transactions, it returns a data URL containing the expected CSV', function () {
      const ADD_TOTAL_ROW = true
      const EXPECTED_CSV_TEXT = ledgerExportUtil.getTransactionCSVText(exampleTransactions, null, ADD_TOTAL_ROW)

      let output = ledgerExportUtil.transactionsToCSVDataURL(exampleTransactions)

      assert.equal(output, CSV_DATA_URI_PREFIX + base64Encode(EXPECTED_CSV_TEXT))
    })
  })

  describe('getTransactionCSVText', function () {
    it('for empty input, returns a CSV string containing only the expected header row', function () {
      let output

      output = ledgerExportUtil.getTransactionCSVText(undefined)
      assert.equal(output, EMPTY_CSV)

      output = ledgerExportUtil.getTransactionCSVText(null)
      assert.equal(output, EMPTY_CSV)

      output = ledgerExportUtil.getTransactionCSVText([])
      assert.equal(output, EMPTY_CSV)
    })

    it('returns a CSV with the expected header row up to variable currency column', function () {
      let output = ledgerExportUtil.getTransactionCSVText(exampleTransactions)
      assert(!!output, 'expected CsV output to exist')

      let rows = output.split('\n')
      assert(!!rows && rows.length, 'expected CSV output to have at least one newline-separated row(s)`')

      let headerRow = rows[0]
      assert(!!headerRow, 'expected header row to exist')
      assert.equal(headerRow.slice(0, CSV_HEADER_ROW_PREFIX.length), CSV_HEADER_ROW_PREFIX)
    })

    it('returns a CSV with the same number of columns in every row', function () {
      let output = ledgerExportUtil.getTransactionCSVText(exampleTransactions)
      
      let rows = output.split('\n')

      for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        let row = rows[rowIdx]
        assert(!!row, `expected row ${rowIdx} to exist`)
        let cols = row.split(',')
        assert.equal(cols.length, CSV_COLUMN_COUNT, `expected row ${rowIdx} / ${rows.length} to have ${CSV_COLUMN_COUNT} columns`)
      }
    })

    it('returns a CSV with expected data types for each column in every row', function () {
      let ADD_TOTAL_ROW = true
      let output = ledgerExportUtil.getTransactionCSVText(exampleTransactions, null, ADD_TOTAL_ROW)
      
      let rows = output.split('\n')

      let COLUMN_LABELS = CSV_HEADER_ROW_PREFIX_COLUMNS.concat(['FIAT'])
      // start at rowIdx = 1 to SKIP the header row
      for (var rowIdx = 1; rowIdx < rows.length; rowIdx++) {
        let row = rows[rowIdx]
        assert(!!row, `expected row ${rowIdx} to exist`)
        let cols = row.split(',')
        for (var colIdx = 0; colIdx < cols.length; colIdx++) {
          let colVal = cols[colIdx]

          if (CSV_EXPECTED_COLUMN_DATATYPES[colIdx] === 'number'
              && `${parseFloat(colVal)}` === colVal) {
            colVal = parseFloat(colVal)
          }

          let columnDatatype = typeof colVal
          assert.equal(columnDatatype, CSV_EXPECTED_COLUMN_DATATYPES[colIdx], `expected ${COLUMN_LABELS[colIdx]} column (value = ${cols[colIdx]}) for row ${rowIdx} to be type "${CSV_EXPECTED_COLUMN_DATATYPES[colIdx]}" , but found type "${columnDatatype}"`)
        }
      }
    })

    it('returns same CSV for an array containing one transaction and a single transaction object', function () {
      let singleTxOutput = ledgerExportUtil.getTransactionCSVText(exampleTransaction)
      let arrayWithSingleTxOutput = ledgerExportUtil.getTransactionCSVText(exampleTransactions)
      
      assert.equal(singleTxOutput, arrayWithSingleTxOutput)
    })

    it('given a transaction, returns a CSV containing the right number of rows: 1 header row, 1 row per publisher, and if addTotalRow===true, 1 row with totals', function () {
      const EXPECTED_CSV_ROW_COUNT_NO_TOTAL = 1 + NUM_PUBLISHERS
      const EXPECTED_CSV_ROW_COUNT_WITH_TOTAL = 1 + NUM_PUBLISHERS + 1

      // output with NO TOTAL ROW
      var output = ledgerExportUtil.getTransactionCSVText(exampleTransaction)
      
      var rows = output.split('\n')
      assert.equal(rows.length, EXPECTED_CSV_ROW_COUNT_NO_TOTAL)

      let ADD_TOTAL_ROW = true
      output = ledgerExportUtil.getTransactionCSVText(exampleTransaction, null, ADD_TOTAL_ROW)
      rows = output.split('\n')
      assert.equal(rows.length, EXPECTED_CSV_ROW_COUNT_WITH_TOTAL)
    })
  })
})

/**
{
  transactionsToCSVDataURL,
  getTransactionCSVText,
  getTransactionCSVRows,
  getPublisherVoteData,
  getTransactionsByViewingIds,
  getTotalContribution
}
**/
