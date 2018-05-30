/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M16.1142857 18.9199419l-3.745-2.1606728c-.2271428-.1309086-.5114286-.1309086-.7385714 0L7.885 18.9199419c-.39214286.2256809-.885-.0524998-.885-.5004525V5.57954303C7 5.25977164 7.26285714 5 7.58785714 5h8.82357146C16.7364286 5 17 5.25977164 17 5.57954303V18.4194894c0 .4479527-.4935714.7261334-.8857143.5004525z'
    />
  </svg>
