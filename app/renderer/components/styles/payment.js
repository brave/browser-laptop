/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {StyleSheet} = require('aphrodite')
const globalStyles = require('./global')

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

const paymentCommon = StyleSheet.create({
  board: {
    overflowX: 'hidden',
    clear: 'both'
  },
  panel: {
    background: '#fff',
    position: 'relative',
    marginTop: '8px',
    marginBottom: '8px',
    padding: '25px 20px'
  },
  panelFooter: {
    color: globalStyles.color.darkGray,
    fontSize: '13px',
    fontStyle: 'italic',
    padding: '20px 20px 20px 50px'
  },
  marginButtons: {
    marginLeft: globalStyles.spacing.overlayButtonMargin
  }
})

const paymentStylesVariables = {
  color: {
    // See: .paymentsContainer .modal .dialog.paymentHistory .dialog-body
    paymentHistoryTableBackgroundColor: '#fff'
  },
  spacing: {
    paymentHistoryTablePadding: '30px'
  }
}

module.exports = {
  paymentStyles,
  paymentCommon,
  paymentStylesVariables
}
