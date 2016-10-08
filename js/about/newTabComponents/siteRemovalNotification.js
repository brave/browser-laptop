/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const cx = require('../../lib/classSet.js')

class siteRemovalNotification extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const { isActive, onUndoIgnoredTopSite, onRestoreAll, onCloseNotification } = this.props
    return <div
      className={cx({
        siteRemovalNotification: true,
        active: isActive
      })}>
      <span className='notification' data-l10n-id='thumbRemoved' />
      <span className='siteRemovalAction' onClick={onUndoIgnoredTopSite} data-l10n-id='undoRemoved' />
      <span className='siteRemovalAction' onClick={onRestoreAll} data-l10n-id='restoreAll' />
      <button className='fa fa-close' onClick={onCloseNotification} data-l10n-id='close' />
    </div>
  }
}
module.exports = siteRemovalNotification
