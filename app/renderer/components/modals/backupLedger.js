/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// components
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const ModalOverlay = require('../../../../js/components/modalOverlay')
const appActions = require('../../../../js/actions/appActions')

class ModalBackupLedger extends ImmutableComponent {
  modalHidden () {
  }

  closeModal () {
    appActions.hideModal('ledgerBackup')
  }

  render () {
    return <ModalOverlay
      title='modalBackupLedgerTitle'
      content={
        <div>
          <div data-l10n-id='modalBackupLedgerSubTitle' />
          <div data-l10n-id='modalBackupLedgerSubTitle2' />
          <div data-l10n-id='modalBackupLedgerContent' />
        </div>
      }
      footer={
        <div data-l10n-id='modalBackupLedgerLater' onClick={this.closeModal.bind(this)} />
      }
      onHide={this.modalHidden.bind(this)}
    />
  }
}

module.exports = ModalBackupLedger
