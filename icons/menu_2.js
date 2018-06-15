/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path className={css(iconStyles.icon__path_solid)} d='M8.522 7.5C8.234 7.5 8 7.164 8 6.75S8.234 6 8.522 6h6.956c.288 0 .522.336.522.75s-.234.75-.522.75H8.522zm0 5c-.288 0-.522-.336-.522-.75s.234-.75.522-.75h6.956c.288 0 .522.336.522.75s-.234.75-.522.75H8.522zm0 5c-.288 0-.522-.336-.522-.75s.234-.75.522-.75h6.956c.288 0 .522.336.522.75s-.234.75-.522.75H8.522z'
        />
    </g>
  </svg>
