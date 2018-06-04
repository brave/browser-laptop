/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
<svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
  <g fillRule='evenodd'>
    <path className={css(iconStyles.icon__path_solid)} d='M17.444 17.435h-3.11V12.05a.775.775 0 0 0-.778-.772h-3.112a.775.775 0 0 0-.777.772v5.385H6.556V9.893l5.218-3.337c.116-.017.336-.017.452 0l5.218 3.34v7.539zm-6.222 0h1.556v-4.613h-1.556v4.613zm7.098-8.816l-5.364-3.432c-.443-.254-1.482-.251-1.943.02L5.69 8.61c-.426.25-.69.708-.69 1.198v7.781c0 .766.628 1.39 1.4 1.39h3.939c.036.005.068.021.105.021.038 0 .07-.016.106-.02h2.9c.036.004.068.02.106.02.037 0 .069-.016.105-.02H17.6c.772 0 1.4-.625 1.4-1.39V9.81c0-.487-.26-.941-.68-1.192z'
      />
  </g>
</svg>
