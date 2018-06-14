/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M19.5 16.5h-15c-.414 0-.75-.33525-.75-.75V5.25c0-.41475.336-.75.75-.75h15c.414 0 .75.33525.75.75v10.5c0 .41475-.336.75-.75.75zM3.75 12h16.5M9 19.5h6m-3 0v-3'
    />
  </svg>
