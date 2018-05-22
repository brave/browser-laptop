/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M17.24963 6.1067v12c0 .6795-.27076 1.05374-.7335.75l-9.42976-6.17326c-.4485-.2955-.4485-.96675 0-1.26225l9.42976-6.0645c.46274-.30375.7335.0705.7335.75z'
    />
  </svg>
