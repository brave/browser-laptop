/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M18 6.75v13.5c0 .414-.336.75-.75.75H6.75c-.414 0-.75-.336-.75-.75V6.75m3.75 3.75v6.75m4.5-6.75v6.75M15 6.75v-3c0-.414-.336-.75-.75-.75h-4.5c-.414 0-.75.336-.75.75v3m-5.25 0h16.5'
    />
  </svg>
