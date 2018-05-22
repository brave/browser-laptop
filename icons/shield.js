/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path d='M14.61675 18.5025C14.0595 18.84825 12.69 19.93275 12 20.25c-6.1665-2.838-6.75-7.03425-6.75-8.2755v-5.004c0-.39075.288-.71625.67125-.76725C6.489 6.126 7.32525 5.9685 8.046 5.6535 9.477 5.02725 10.74375 3.75 12 3.75s2.52225 1.27725 3.95325 1.9035c.72075.315 1.557.4725 2.12475.54975.384.051.672.3765.672.76725V10.5'
        />
      <path className={css(iconStyles.icon__path_solid)} d='M18.00052 12.57323c.45975.41174.74925 1.011.74925 1.677 0 1.24274-1.00725 2.25-2.25 2.25s-2.25-1.00725-2.25-2.25c0-1.24276 1.00726-2.25 2.25-2.25.57675 0 1.1025.21674 1.50075.573'
        />
    </g>
  </svg>
