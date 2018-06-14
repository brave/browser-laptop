/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(iconStyles.icon, styles)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M11.24697 6.00101c3.72975 0 6.753 3.02325 6.753 6.7515 0 3.72975-3.02325 6.753-6.753 6.753-3.72825 0-6.7515-3.02325-6.7515-6.753 0-3.72825 3.02325-6.7515 6.7515-6.7515z'
        />
      <path d='M19.91667 17.51689c.4245 1.119.45825 1.9785.01575 2.42025-1.24275 1.2435-5.83575-1.3335-10.185-5.68275-4.35075-4.35225-6.927-8.94375-5.685-10.18725.417-.417 1.20525-.41025 2.23275-.05325'
        />
    </g>
  </svg>
