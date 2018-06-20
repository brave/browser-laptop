/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path d='M15.33323 9.123V6.885c0-1.73175-1.49175-3.135-3.333-3.135-1.8405 0-3.33376 1.40325-3.33376 3.135v2.238'
        />
      <path d='M17.25 19.78927H6.75c-.41475 0-.75-.336-.75-.75v-9.1665c0-.414.33525-.75.75-.75h10.5c.41475 0 .75.336.75.75v9.1665c0 .414-.33525.75-.75.75z'
        />
      <path d='M13.5 13.10445c0 .82875-.672 1.5-1.5 1.5s-1.5-.67125-1.5-1.5.672-1.5 1.5-1.5 1.5.67125 1.5 1.5m-1.5.9375v2.25'
        />
    </g>
  </svg>
