/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M19.5 20.25h-15c-.41475 0-.75-.33525-.75-.75v-15c0-.41475.33525-.75.75-.75h15c.41475 0 .75.33525.75.75v15c0 .41475-.33525.75-.75.75z'
    />
  </svg>
