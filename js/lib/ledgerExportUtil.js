const txUtil = require('ledger-client/util')
const base64Encode = require('./base64').encode

let transactionsToCSVDataURL = function (transactions) {
  let csvText = txUtil.getTransactionCSVText(transactions)
  return 'data:text/csv;base64,' + base64Encode(csvText)
}

module.exports = {
  transactionsToCSVRows: txUtil.getTransactionCSVRows,
  transactionsToCSVText: txUtil.getTransactionCSVText,
  transactionsToCSVDataURL: transactionsToCSVDataURL
}
