/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
<svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
  <g fillRule='evenodd'>
    <path className={css(iconStyles.icon__path_solid)} d='M7 7.75a.75.75 0 0 1 0-1.5h10a.75.75 0 1 1 0 1.5H7zm0 5a.75.75 0 1 1 0-1.5h10a.75.75 0 1 1 0 1.5H7zm0 5a.75.75 0 1 1 0-1.5h10a.75.75 0 1 1 0 1.5H7z'
      />
  </g>
</svg>
