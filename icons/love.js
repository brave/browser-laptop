/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M12.84075 18.63225c-.48825.432-1.19325.432-1.6815 0-2.862-2.5245-7.20525-5.84325-7.404-9.86625C3.753 8.69475 3.75 8.62575 3.75 8.5545 3.75 6.31575 5.5965 4.5 7.87575 4.5 10.1535 4.5 12 6.31575 12 8.5545 12 6.31575 13.8465 4.5 16.12575 4.5 18.4035 4.5 20.25 6.31575 20.25 8.5545c0 .07125-.0015.14025-.00525.2115-.1995 4.023-4.54275 7.34175-7.404 9.86625z'
    />
  </svg>
