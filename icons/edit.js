/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M16.85319 4.79756l2.35125 2.35275c.3945.39525.3945 1.04175 0 1.43925l-9.81825 9.82275c-.1305.1305-.29475.222-.47325.267l-3.15975.7905c-.7335.18375-1.4025-.45825-1.224-1.1745l.7995-3.20175c.045-.18.13725-.34275.26775-.47325l9.8175-9.82275c.396-.39675 1.04325-.39675 1.43925 0zm-3.87743 2.439l3.84375 3.7395'
    />
  </svg>
