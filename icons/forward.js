/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M15.8296687,12.8192319 L8.57346234,17.8985764 C8.12101305,18.2152909 7.49748259,18.1052561 7.18076808,17.6528068 C7.0631096,17.4847232 7,17.2845165 7,17.0793444 L7,6.92065556 C7,6.36837081 7.44771525,5.92065556 8,5.92065556 C8.2051721,5.92065556 8.40537881,5.98376517 8.57346234,6.10142364 L15.8296687,11.1807681 C16.282118,11.4974826 16.3921528,12.121013 16.0754383,12.5734623 C16.0084893,12.6691037 15.92531,12.752283 15.8296687,12.8192319 Z'
    />
  </svg>
