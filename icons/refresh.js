/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path d='M17.93175 16.58775c-1.39275 2.0625-3.75225 3.4185-6.429 3.4185-4.28175 0-7.75275-3.47175-7.75275-7.7535S7.221 4.5 11.50275 4.5c2.7375 0 5.1435 1.41825 6.52275 3.561'
        />
      <path className={css(iconStyles.icon__path_solid)} d='M20.4246 9.2529c0 1.24275-1.00725 2.25-2.25 2.25s-2.25-1.00725-2.25-2.25 1.00725-2.25 2.25-2.25 2.25 1.00725 2.25 2.25'
        />
    </g>
  </svg>
