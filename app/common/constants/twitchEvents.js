/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const events = {
  BUFFER_EMPTY: 'buffer-empty',
  BUFFER_REFILL: 'buffer-refill',
  MINUTE_WATCHED: 'minute-watched',
  PLAY_PAUSE: 'video_pause',
  SEEK: 'player_click_vod_seek',
  START: 'video-play',
  END: 'video_end',
  VIDEO_ERROR: 'video_error'
}

module.exports = events
