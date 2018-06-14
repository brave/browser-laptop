/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path d='M12.00015 13.5l.00225-1.5c1.05975 0 1.97475-.9555 1.97475-1.93125 0-.975-.915-1.81875-1.97475-1.81875-.786 0-1.54275.5415-1.839 1.16475'
        />
      <path d='M12.00525 19.5h-.0105C7.85625 19.5 4.5 16.14375 4.5 12.00525v-.0105C4.5 7.85625 7.85625 4.5 11.99475 4.5h.0105C16.1445 4.5 19.5 7.85625 19.5 11.99475v.0105c0 4.1385-3.3555 7.49475-7.49475 7.49475z'
        />
      <path d='M12.75015 15.75c0 .41475-.336.75-.75.75s-.75-.33525-.75-.75.336-.75.75-.75.75.33525.75.75'
        />
    </g>
  </svg>
