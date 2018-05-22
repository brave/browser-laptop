/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M6.75 18.1067v-12c0-.6795.288-1.05376.75-.75l9.41325 6.17324c.4485.2955.4485.96675 0 1.26225L7.4835 18.8567c-.46275.30375-.7335-.0705-.7335-.75z'
    />
  </svg>
