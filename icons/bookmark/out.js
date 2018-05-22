/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M15 3.75H6c-.414 0-.75.366-.75.8175V18.681c0 .62775.62175 1.0215 1.122.71025l3.74925-2.3325c.2325-.144.525-.144.7575 0l3.74925 2.3325c.50025.31125 1.122-.0825 1.122-.71025v-1.14975m-3-7.03125H18m-2.25 3l3-3-3-3'
    />
  </svg>
