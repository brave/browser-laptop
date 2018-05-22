/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path d='M7.5 8.1897c0 1.24275-1.00725 2.25-2.25 2.25S3 9.43245 3 8.1897s1.00725-2.25 2.25-2.25 2.25 1.00725 2.25 2.25'
        />
      <path d='M5.86777 16.098c1.42275 2.10675 3.83325 3.492 6.567 3.492 4.374 0 7.92-3.546 7.92-7.92 0-4.374-3.546-7.92-7.92-7.92-2.796 0-5.25375 1.449-6.663 3.6375'
        />
      <path d='M10.59008 14.9697l2.64-2.64v-4.41' />
    </g>
  </svg>
