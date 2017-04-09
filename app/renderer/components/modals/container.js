/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const ModalBackupLedger = require('./backupLedger')

class ModalsContainer extends ImmutableComponent {
  render () {
    console.log(this.props.modals)
    return <div data-test-id='modals-container'>
      {this.props.modals.map((modal) => {
        const found = modals.find((item) => {
          return item.id === modal.get('id')
        })

        if (found) {
          const Slug = found.component
          return <Slug />
        }

        return null
      })}
    </div>
  }
}

module.exports = ModalsContainer

const modals = [{
  id: 'ledgerBackup',
  component: ModalBackupLedger
}]
