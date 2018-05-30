/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M7.42662 11.18085l7.25621-5.07934c.45245-.31671 1.07598-.20668 1.3927.24577a1 1 0 0 1 .18076.57346v10.15869c0 .55229-.44771 1-1 1a1 1 0 0 1-.57346-.18077l-7.2562-5.07934c-.45246-.31672-.5625-.94025-.24578-1.3927a1 1 0 0 1 .24577-.24577z'
    />
  </svg>
