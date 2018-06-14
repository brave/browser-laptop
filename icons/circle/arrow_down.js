/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M11.99475 4.5h.0105C16.14375 4.5 19.5 7.85625 19.5 11.99475v.0105c0 4.1385-3.35625 7.49475-7.49475 7.49475h-.0105C7.8555 19.5 4.5 16.14375 4.5 12.00525v-.0105C4.5 7.85625 7.8555 4.5 11.99475 4.5zm.0051 4.5v4.5'
        />
      <path d='M9.74985 12.75l1.71975 1.71975c.29325.29325.76725.29325 1.0605 0L14.24985 12.75'
        />
    </g>
  </svg>
