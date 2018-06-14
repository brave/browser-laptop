/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M14.634 10.50015H7.11675c-.61725 0-1.11675.4995-1.11675 1.116v5.268c0 .6165.4995 1.116 1.11675 1.116H14.634c.6165 0 1.116-.4995 1.116-1.116v-5.268c0-.6165-.4995-1.116-1.116-1.116zm3.3105-3.35265C17.622 6.05025 16.60875 5.25 15.4065 5.25h-.01125c-1.461 0-2.64525 1.18425-2.64525 2.64525V10.5'
    />
  </svg>
