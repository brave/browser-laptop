/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <g fillRule='evenodd' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      <path d='M9.5592 12c-.309 0-.5595.2505-.5595.5595l-1.5 6.1905c0 .82425-.65325 1.5-1.4535 1.5h12.3345c.61575 0 1.119-.50325 1.119-1.11825l1.5-6.57225c0-.309-.2505-.5595-.5595-.5595H9.5592z'
        />
      <path d='M6 20.24925h-.76275C4.0065 20.24925 3 19.24275 3 18.01275V4.3095c0-.309.2505-.5595.5595-.5595h3.642c.18675 0 .36075.093.465.249L8.835 5.75025A.55868.55868 0 0 0 9.30075 6h7.38975c.309 0 .5595.2505.5595.5595V12'
        />
    </g>
  </svg>
