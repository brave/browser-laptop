/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M11.71425 15.9285c3.156 0 5.71425-2.55825 5.71425-5.71425 0-3.156-2.55825-5.71425-5.71425-5.71425C8.55825 4.5 6 7.05825 6 10.21425c0 3.156 2.55825 5.71425 5.71425 5.71425zm3.57127-.71415l2.8575 4.2855'
    />
  </svg>
