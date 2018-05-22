/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M8.25 18v1.5c0 .41475.33525.75.75.75h9.75c.41475 0 .75-.33525.75-.75v-12c0-.41475-.33525-.75-.75-.75H16.5'
        />
      <path d='M15.75 17.25H5.25c-.41475 0-.75-.33525-.75-.75v-12c0-.41475.33525-.75.75-.75H12c2.48475 0 4.5 2.01525 4.5 4.5v8.25c0 .41475-.33525.75-.75.75z'
        />
      <path d='M16.5 9H12c-.41475 0-.75-.33525-.75-.75v-4.5' />
    </g>
  </svg>
