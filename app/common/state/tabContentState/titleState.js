/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State helpers
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const locale = require('../../../../js/l10n')

module.exports.getDisplayTitle = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return ''
  }

  // For renderer initiated navigation, make sure we show Untitled
  // until we know what we're loading.  We should probably do this for
  // all about: pages that we already know the title for so we don't have
  // to wait for the title to be parsed.
  if (frame.get('location') === 'about:blank') {
    return locale.translation('aboutBlankTitle')
  } else if (frame.get('location') === 'about:newtab') {
    return locale.translation('newTab')
  }

  // YouTube tries to change the title to add a play icon when
  // there is audio. Since we have our own audio indicator we get
  // rid of it.
  return (frame.get('title') || frame.get('location') || '').replace('▶ ', '')
}
