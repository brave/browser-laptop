/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M18.75 12.50977v-3.51c0-.414-.336-.75-.75-.75H6c-.414 0-.75.336-.75.75v3.51c0 .156.04875.309.1395.43576l3.471 4.85924c.09075.12675.1395.279.1395.43576v2.00924c0 .41475.336.75.75.75h4.5c.414 0 .75-.33525.75-.75v-2.00924c0-.15676.04875-.309.1395-.43576l3.471-4.85925c.09075-.12674.1395-.27975.1395-.43575zM14.25 8.25V3v5.25m-4.5 0V3M9 18h6'
    />
  </svg>
