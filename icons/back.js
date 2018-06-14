/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd'>
      <path className={css(iconStyles.icon__path_solid)} d='M14.253 5.487a1.75 1.75 0 0 1 2.753 1.434v10.158a1.75 1.75 0 0 1-2.753 1.434l-7.256-5.08a1.75 1.75 0 0 1 0-2.867l7.256-5.079zm-6.458 6.37a.25.25 0 0 0 .062.348l7.256 5.08a.25.25 0 0 0 .393-.206V6.921a.25.25 0 0 0-.393-.205l-7.256 5.08a.25.25 0 0 0-.062.06z'
        />
    </g>
  </svg>
