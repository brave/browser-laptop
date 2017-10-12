/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 'use strict'

 const frameStateUtil = require('../../../js/state/frameStateUtil')
 const {makeImmutable} = require('../../common/state/immutableUtil')
 const windowConstants = require('../../../js/constants/windowConstants')

 const tabContentReducer = (state, action, immutableAction) => {
   action = immutableAction || makeImmutable(action)
   switch (action.get('actionType')) {
     case windowConstants.WINDOW_SET_TAB_CONTENT_INTERSECTION_STATE:
       const firstTabOfTabSet = frameStateUtil
         .isFirstFrameKeyInTabPage(state, action.get('frameKey'))

       // since all unpinned tabs in a tabPage share the same size,
       // only computes the intersection state for the first tab in the current tab set.
       // this gives us a huge performance boost.
       if (firstTabOfTabSet) {
         state = state.setIn(['ui', 'tabs', 'intersectionRatio'], action.get('ratio'))
         break
       }
       break
   }
   return state
 }

 module.exports = tabContentReducer
