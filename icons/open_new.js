/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M15.75 9.83325h3c.4125 0 .75.3315.75.73725v8.2755c0 .40725-.336.73725-.75.73725H5.25c-.4125 0-.75-.3315-.75-.73725v-8.2755c0-.40725.336-.73725.75-.73725h3m3.75 3.75v-9m-3.75 2.25L12 3.75l3.75 3.08325'
    />
  </svg>
