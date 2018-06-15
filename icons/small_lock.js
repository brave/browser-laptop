/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M17.07825 10.60695H6.921c-.50925 0-.921.372-.921.83025v6.5895c0 .45825.41175.83025.921.83025h10.15725c.50925 0 .92175-.372.92175-.83025v-6.5895c0-.45825-.4125-.83025-.92175-.83025zm-2.07863-.2142v-1.7145c0-1.89375-1.34324-3.42825-3-3.42825-1.65675 0-3 1.5345-3 3.42825v1.7145'
    />
  </svg>
