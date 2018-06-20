/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M18.75 9c-.26475 0-.5145.054-.75.138V6.75c0-.414-.336-.75-.75-.75h-3.888c.084-.2355.138-.48525.138-.75C13.5 4.00725 12.49275 3 11.25 3S9 4.00725 9 5.25c0 .26475.054.5145.138.75H6.75c-.414 0-.75.336-.75.75v4.638c-.2355-.084-.48525-.138-.75-.138C4.00725 11.25 3 12.25725 3 13.5s1.00725 2.25 2.25 2.25c.26475 0 .5145-.054.75-.138v1.638c0 .414.336.75.75.75h3.888c-.084.2355-.138.48525-.138.75 0 1.24275 1.00725 2.25 2.25 2.25S15 19.99275 15 18.75c0-.26475-.054-.5145-.138-.75h2.388c.414 0 .75-.336.75-.75v-3.888c.2355.084.48525.138.75.138 1.24275 0 2.25-1.00725 2.25-2.25S19.99275 9 18.75 9z'
    />
  </svg>
