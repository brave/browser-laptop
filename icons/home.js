/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M19.8375 8.43075L12.75 3.8625c-.258-.14925-1.2435-.15075-1.5 0L4.1565 8.43c-.252.14775-.4065.4185-.4065.71025V19.5315c0 .45525.369.825.82425.825H19.425c.456 0 .825-.36975.825-.825V9.14475c0-.294-.15675-.567-.4125-.714z'
        />
      <path d='M9.525 20.35643v-7.425c0-.456.369-.825.825-.825h3.3c.45525 0 .825.369.825.825v7.425'
        />
    </g>
  </svg>
