/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path className={css(iconStyles.icon__path_solid)} d='M8.5 6.5v10.351l3.057-1.679a1.453 1.453 0 0 1 1.386 0L16 16.851V6.5H8.5zm7.815 10.523h.01-.01zM8.28 18.499c-.23 0-.461-.061-.664-.181A1.23 1.23 0 0 1 7 17.252V6.247C7 5.56 7.574 5 8.279 5h7.942c.705 0 1.279.56 1.279 1.247v11.005c0 .439-.23.839-.616 1.066a1.31 1.31 0 0 1-1.293.02l-3.37-1.852-3.313 1.852a1.302 1.302 0 0 1-.628.161z'
        />
    </g>
  </svg>
