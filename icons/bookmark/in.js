/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M9 3.75h9c.41475 0 .75.366.75.8175V18.681c0 .62775-.62175 1.0215-1.122.71025l-3.74925-2.3325a.71813.71813 0 0 0-.7575 0L9.372 19.39125c-.50025.31125-1.122-.0825-1.122-.71025v-1.14975M5.25 10.5h5.25'
        />
      <path d='M8.25 7.5l3 3-3 3' />
    </g>
  </svg>
