/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M8.8092 9c-.309 0-.5595.2505-.5595.5595V18.75c0 .82425-.65325 1.5-1.4535 1.5h12.3345c.61575 0 1.119-.50325 1.119-1.11825V9.5595c0-.309-.2505-.5595-.5595-.5595H8.8092z'
        />
      <path d='M6.75 20.24925h-.76275c-1.23075 0-2.23725-1.0065-2.23725-2.2365V4.3095c0-.309.2505-.5595.5595-.5595h3.642c.18675 0 .36075.093.465.249L9.585 5.75025A.55868.55868 0 0 0 10.05075 6h7.38975c.309 0 .5595.2505.5595.5595V9m-3.75 3.75v4.5M16.5 15H12'
        />
    </g>
  </svg>
