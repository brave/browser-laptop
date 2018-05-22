/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M16.32 19.812l-3.93225-2.37675a.75007.75007 0 0 0-.7755 0l-3.933 2.37675c-.41175.24825-.92925-.05775-.92925-.5505V5.1375c0-.35175.276-.6375.61725-.6375H16.632c.34125 0 .618.28575.618.6375v14.124c0 .49275-.51825.79875-.93.5505z'
    />
  </svg>
