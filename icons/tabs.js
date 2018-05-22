/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M20.25 18.75H3.75c-.41475 0-.75-.336-.75-.75V6c0-.414.33525-.75.75-.75h16.5c.41475 0 .75.336.75.75v12c0 .414-.33525.75-.75.75z'
        />
      <path d='M15 5.25v4.5h6M9 5.25v4.5h6' />
    </g>
  </svg>
