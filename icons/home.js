/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
     <path d='M5 19V9.47134a1 1 0 0 1 .50386-.86824l6.07629-3.47216a1 1 0 0 1 .99227 0l6.07629 3.47216a1 1 0 0 1 .50386.86824V19h-5.05449v-6.06539h-4.0436V19H5z'
     />
    </g>
  </svg>
