/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ styles }) =>
  <svg className={css(styles, iconStyles.icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
    <path fillRule='evenodd' d='M19.07813 12.26437c0 1.25026-1.01326 2.26426-2.26426 2.26426-1.251 0-2.26425-1.014-2.26425-2.26426 0-1.25024 1.01325-2.26424 2.26425-2.26424 1.251 0 2.26425 1.014 2.26425 2.26424m-6.87487-5.50012c0 1.251-1.01325 2.26425-2.26425 2.26425-1.251 0-2.26425-1.01325-2.26425-2.26425C7.67475 5.514 8.688 4.5 9.939 4.5c1.251 0 2.26425 1.014 2.26425 2.26425M10.82813 17.7645c0 1.25025-1.01325 2.26425-2.26426 2.26425-1.251 0-2.26424-1.014-2.26424-2.26425 0-1.251 1.01325-2.26425 2.26424-2.26425 1.251 0 2.26426 1.01325 2.26426 2.26425M12.1875 7.01438h8.25m-16.5 0h3.75m11.39063 5.24999h1.359m-16.68713 0h10.8m-3.73545 5.25001h9.62325m-16.5003 0h2.376'
    />
  </svg>
