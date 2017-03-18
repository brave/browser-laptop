const TxHelpers = require('./transactionHelpers')

let currentTimestamp = (new Date()).getTime()

const getNthContributionPeriodBack = function (n) {
  return currentTimestamp - ((1000 * 3600 * 24 * 30) * n)
}

function simulateLedgerTransactions (numTx) {
  let numTransactions = numTx || 10

  let transactions = (new Array(numTransactions))
        .fill(null)
        .map(function (nothing, idx) {
          let tx = TxHelpers.generateTransaction()
          tx.submissionStamp = getNthContributionPeriodBack(idx)
          tx.submissionDate = new Date(tx.submissionStamp)

          let validatorOutput = TxHelpers.validateTransaction(tx)
          if (validatorOutput.error) {
            console.error(validatorOutput.error)
          }

          return tx
        })

  return transactions
}

module.exports = simulateLedgerTransactions
