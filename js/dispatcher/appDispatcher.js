/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var Dispatcher = require('./dispatcher')

class AppDispatcher extends Dispatcher {
  /**
   * A bridge function between the views and the dispatcher, marking the action
   * as a view action.  Another variant here could be handleServerAction.
   * @param  {object} action The data coming from the view.
   */
  handleViewAction (action) {
    this.dispatch({
      source: 'VIEW_ACTION',
      action: action
    })
  }
}

const appDispatcher = new AppDispatcher()
module.exports = appDispatcher
