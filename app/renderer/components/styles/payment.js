/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const globalStyles = require('./global')

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
  paymentStylesVariables
}
