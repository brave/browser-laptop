/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('../styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon, iconStyles.icon__path_solid)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path d='M8.54829876 8.59872029c-.33066409-.2494677-.39648676-.71975744-.14701905-1.05042153.2494677-.33066409.71975744-.39648676 1.05042153-.14701905l5.99999996 4.52666709c.3991499.3011364.3974432.9011397-.0034134 1.2000006l-5.99999996 4.4733329c-.33207795.2475825-.80198562.1790855-1.04956815-.1529925-.24758254-.3320779-.17908548-.8019856.15299247-1.0495681l5.19828274-3.8756083-5.20169614-3.92439111z'
    />
  </svg>
