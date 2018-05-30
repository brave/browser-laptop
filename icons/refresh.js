/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path d='M16.55925 16.16925C15.32325 17.74125 13.404 18.75 11.25 18.75c-3.72825 0-6.75-3.02175-6.75-6.75 0-3.7275 3.02175-6.75 6.75-6.75 2.21775 0 4.185 1.0695 5.41575 2.721'
        />
      <path className={css(iconStyles.icon__path_solid)} d='M19.501425 9.7503c0 1.24275-1.00725 2.25-2.25 2.25s-2.25-1.00725-2.25-2.25 1.00725-2.25 2.25-2.25 2.25 1.00725 2.25 2.25'
        />
    </g>
  </svg>
