/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path d='M11.99475 4.5h.0105C16.14375 4.5 19.5 7.85625 19.5 11.99475v.0105c0 4.1385-3.35625 7.49475-7.49475 7.49475h-.0105C7.8555 19.5 4.5 16.14375 4.5 12.00525v-.0105C4.5 7.85625 7.8555 4.5 11.99475 4.5zm.0051 6.75V15'
        />
      <path className={css(iconStyles.icon__path_solid)} d='M12.74985 9c0 .41475-.33525.75-.75.75s-.75-.33525-.75-.75.33525-.75.75-.75.75.33525.75.75'
        />
    </g>
  </svg>
