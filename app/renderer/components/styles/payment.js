/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const globalStyles = require('./global')

const paymentStyles = {
  font: {
    regular: '14.5px'
  },
  width: {
    tableRow: '235px',
    tableCell: '265px' // width.tableRow + 30px
  }
}

const paymentStylesVariables = {
  spacing: {
    paymentHistoryTablePadding: '30px'
  },

  tableHeader: {
    fontColor: globalStyles.color.darkGray,
    fontWeight: '600'
  }
}

module.exports = {
  paymentStyles,
  paymentStylesVariables
}
