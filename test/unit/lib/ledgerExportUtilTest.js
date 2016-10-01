/* global describe, it */
const assert = require('assert')
const underscore = require('underscore')

require('../braveUnit')

const ledgerExportUtil = require('../../../js/lib/ledgerExportUtil.js')
const base64Encode = require('../../../js/lib/base64').encode

const CSV_HEADER_ROW_PREFIX_COLUMNS = ['Publisher', 'Votes', 'Fraction', 'BTC']
const CSV_HEADER_ROW_PREFIX = CSV_HEADER_ROW_PREFIX_COLUMNS.join(',')
const DEFAULT_CSV_HEADER_ROW_COLUMNS = CSV_HEADER_ROW_PREFIX_COLUMNS.concat(['USD'])
const DEFAULT_CSV_HEADER_ROW = DEFAULT_CSV_HEADER_ROW_COLUMNS.join(',')
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

      checkHeaderRowPrefixForRows(rows)
    })

    it('returns a CSV with the same number of columns in every row', function () {
      let output = ledgerExportUtil.getTransactionCSVText(exampleTransactions)

      let rows = output.split('\n')

      checkColumnCountsForRows(rows)
    })

    it('returns a CSV with expected data types for each column in every row', function () {
      let ADD_TOTAL_ROW = true
      let output = ledgerExportUtil.getTransactionCSVText(exampleTransactions, null, ADD_TOTAL_ROW)

      let rows = output.split('\n')

      checkColumnDatatypesForRows(rows)
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

    it('returns CSV text matching the CSV rows returned by getTransactionCSVRows', function () {
      let ADD_TOTAL_ROW = true
      let output = ledgerExportUtil.getTransactionCSVText(exampleTransactions, null, ADD_TOTAL_ROW)

      let rows = output.split('\n')

      let expectedOutputRows = ledgerExportUtil.getTransactionCSVRows(exampleTransactions, null, ADD_TOTAL_ROW)
      assert.deepEqual(rows, expectedOutputRows)
    })

    it('when argument addTotalRow===true, there should be a total row with correct totals for each numeric column', function () {
      let ADD_TOTAL_ROW = true
      let output = ledgerExportUtil.getTransactionCSVText(exampleTransaction, null, ADD_TOTAL_ROW)

      let rows = output.split('\n')

      checkTotalRow(rows)
    })
  })

  describe('getTransactionCSVRows', function () {
    it('for empty input, returns an array containing only the expected CSV header row', function () {
      let output

      output = ledgerExportUtil.getTransactionCSVRows(undefined)
      assert.deepEqual(output, [DEFAULT_CSV_HEADER_ROW])

      output = ledgerExportUtil.getTransactionCSVRows(null)
      assert.deepEqual(output, [DEFAULT_CSV_HEADER_ROW])

      output = ledgerExportUtil.getTransactionCSVRows([])
      assert.deepEqual(output, [DEFAULT_CSV_HEADER_ROW])
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

    it('returns the same output for a single transaction input as an array of 1 element and a plain transaction object', function () {
      let singleTxRows = ledgerExportUtil.getTransactionCSVText(exampleTransaction)
      let arrayWithSingleTxRows = ledgerExportUtil.getTransactionCSVText(exampleTransactions)

      assert.deepEqual(singleTxRows, arrayWithSingleTxRows)
    })

    it('given a transaction, returns an array containing the right number of CSV rows: 1 header row, 1 row per publisher, and if addTotalRow===true, 1 row with totals', function () {
      const EXPECTED_CSV_ROW_COUNT_NO_TOTAL = 1 + NUM_PUBLISHERS
      const EXPECTED_CSV_ROW_COUNT_WITH_TOTAL = 1 + NUM_PUBLISHERS + 1

      // output with NO TOTAL ROW
      var rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction)

      assert.equal(rows.length, EXPECTED_CSV_ROW_COUNT_NO_TOTAL)

      let ADD_TOTAL_ROW = true
      rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction, null, ADD_TOTAL_ROW)

      assert.equal(rows.length, EXPECTED_CSV_ROW_COUNT_WITH_TOTAL)
    })

    it('when argument addTotalRow===true, there should be a total row with correct totals for each numeric column', function () {
      let ADD_TOTAL_ROW = true
      let rows = ledgerExportUtil.getTransactionCSVRows(exampleTransaction, null, ADD_TOTAL_ROW)

      checkTotalRow(rows)
    })
  })

  describe('getPublisherVoteData', function () {
    it('should return a contribution object with 1 key per publisher', function () {
      assert(false, 'test not yet impl')
    })

    describe('each publisher value', function () {
      it('should have "votes" (type number) defined', function () {
        assert(false, 'test not yet impl')
      })

      it('should have "fraction" (type number) defined', function () {
        assert(false, 'test not yet impl')
      })

      it('should have "contribution" (type object) defined', function () {
        assert(false, 'test not yet impl')
      })

      describe('each publisher->contribution entry', function () {
        it('should have "satoshis" (type number) defined', function () {
          assert(false, 'test not yet impl')
        })

        it('should have "fiat" (type number) defined', function () {
          assert(false, 'test not yet impl')
        })

        it('should have "currency" (type string) defined', function () {
          assert(false, 'test not yet impl')
        })
      })
    })

    it('the sum of the "fraction" value across all publisher entries should be 1', function () {
      assert(false, 'test not yet impl')
    })

    it('the sum of the "votes" value across all publisher entries should be equal to the overall "votes" entry for the transaction object given as input', function () {
      assert(false, 'test not yet impl')
    })
  })

  describe('getTransactionsByViewingIds', function () {
    it('given a single viewingId as a string, it filters a transactions array for that transaction', function () {
      assert(false, 'test not yet impl')
    })

    it('given viewingIds as an array, it filters a transactions array those transactions', function () {
      assert(false, 'test not yet impl')
    })
  })

  describe('getTotalContribution', function () {
    it('returns a total contribution object', function () {
      assert(false, 'test not yet impl')
    })

    describe('total contribution object', function () {
      it('has a key "satoshis" associated with value of number (positive integer)', function () {
        assert(false, 'test not yet impl')
      })

      it('has a key "fiat" associated with an object containing two subkeys, "amount" (number) and "currency" (string)', function () {
        assert(false, 'test not yet impl')
      })

      it('has a key, fee with a value of type number (positive integer)', function () {
        assert(false, 'test not yet impl')
      })
    })
  })
})

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
  let columnNames = CSV_HEADER_ROW_PREFIX_COLUMNS.concat(['Fiat'])
  console.log(`\tSum for column ${columnNames[colIdx]} (#${colIdx}) across ${rows.length} rows (=${sum}) matches expected total (${expectedTotal})`)
}
