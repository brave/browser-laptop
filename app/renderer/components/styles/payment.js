/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const paymentStyles = {
  font: {
    regular: '14.5px'
  },
  width: {
    tableRow: '235px',
    tableCell: '265px' // width.tableRow + 30px
  },

  // Copied to global.js
  margin: {
    bar: '15px',
    barItem: '12px'
  },
  padding: {
    bar: '18px' // margin.barItem * 1.5
  }
}

const paymentStylesVariables = {
  spacing: {
    paymentHistoryTablePadding: '30px'
  }
}

module.exports = {
  paymentStyles,
  paymentStylesVariables
}
