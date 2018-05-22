/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M4.5 19.5l4.80375-4.80375m.2694-5.1228l4.7745-4.776c.3975-.396 1.04175-.396 1.4385 0l3.4155 3.41625c.3975.39675.3975 1.041 0 1.43775l-4.7745 4.776'
        />
      <path d='M13.16895 18.561L5.4387 10.83l.53925-.5385c1.19175-1.19175 3.123-1.19175 4.3155 0l3.41475 3.4155c1.19175 1.191 1.19175 3.123 0 4.3155l-.53925.5385z'
        />
    </g>
  </svg>
