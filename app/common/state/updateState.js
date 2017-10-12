/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const updateStatus = require('../../../js/constants/updateStatus')

const isUpdateVisible = (state) => {
  const updates = state.get('updates', Immutable.Map())

  const isVerbose = updates.get('verbose', false)
  const status = updates.get('status')

  // When verbose is not set we only want to show update available
  // prompts, because otherwise the check is a background check and
  // the user shouldn't be bothered.
  return !(
    !status ||
    (
      !isVerbose &&
      status !== updateStatus.UPDATE_AVAILABLE
    ) ||
    status === updateStatus.UPDATE_NONE ||
    status === updateStatus.UPDATE_APPLYING_RESTART ||
    status === updateStatus.UPDATE_APPLYING_NO_RESTART
  )
}

const getUpdateStatus = (state) => {
  let status = state.getIn(['updates', 'status'])

  // The only difference between the deferred and non deferred variant is that
  // the deferred allows hiding.  Otherwise you couldn't hide available prompts.
  if (status === updateStatus.UPDATE_AVAILABLE_DEFERRED) {
    status = updateStatus.UPDATE_AVAILABLE
  }

  return status
}

module.exports = {
  isUpdateVisible,
  getUpdateStatus
}
