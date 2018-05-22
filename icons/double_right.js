/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M12.52553 18.87825l6.79575-6.7485c.2385-.237.2385-.6435 0-.8805L12.52552 4.5M4.5 18.87825l7.30725-6.7485c.2565-.237.2565-.6435 0-.8805L4.5 4.5'
    />
  </svg>
