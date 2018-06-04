/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path className={css(iconStyles.icon__path_solid)} d='M15.201 9.799a2.024 2.024 0 1 0 4.049 0 2.021 2.021 0 0 0-1.934-2.016c-.007-.01-.009-.023-.016-.033A6.86 6.86 0 0 0 11.825 5 6.832 6.832 0 0 0 5 11.824a6.832 6.832 0 0 0 6.825 6.824 6.789 6.789 0 0 0 5.367-2.609.75.75 0 1 0-1.179-.927 5.297 5.297 0 0 1-4.188 2.036A5.33 5.33 0 0 1 6.5 11.824 5.33 5.33 0 0 1 11.825 6.5a5.27 5.27 0 0 1 4.01 1.833 2.013 2.013 0 0 0-.634 1.466'
        />
    </g>
  </svg>
