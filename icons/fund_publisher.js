/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const { css } = require('aphrodite/no-important')
const iconStyles = require('./styles')

module.exports = ({ isVerified, isFunding, styles }) =>
  <svg
    className={css(iconStyles.icon, iconStyles.icon_customDrawn)} xmlns='http://www.w3.org/2000/svg' baseProfile='tiny' version='1.2' viewBox='0 0 48 48'
  >
    { isFunding
      ? <path fill='#FFC200' d='M19.7 44.8c-.4 0-.8-.1-1.1-.3l-17-9.8C.9 34.3.5 33.6.5 32.8c0-1.8-.1-11.2 0-19.6 0-.8.4-1.5 1.1-1.9l16.7-9.8c.7-.4 1.6-.4 2.3 0l16.8 9.8c.7.4 1.1 1.1 1.1 1.9v19.3c0 .8-.4 1.5-1.1 1.9l-16.6 10c-.3.3-.7.4-1.1.4z' />
      : <path className={css(iconStyles.icon__path_solid)} d='M19.9 44.7c-.4 0-.8-.1-1.1-.3L1.9 34.6c-.7-.4-1.1-1.1-1.1-1.9 0-1.8-.1-11.2 0-19.5 0-.8.4-1.5 1.1-1.9l16.7-9.8c.7-.4 1.6-.4 2.3 0l16.8 9.8c.7.4 1.1 1.1 1.1 2v19.2c0 .8-.4 1.5-1.1 1.9l-16.5 10c-.5.2-.9.3-1.3.3zm1-3.8zm-16-9.3l15 8.7 14.7-8.9V14.3L19.7 5.5 4.9 14.3c-.1 6.9 0 14.5 0 17.3zm30.6-16.8zM4.9 13.2z' />
    }
    <path className={css(iconStyles.icon__path_solid)} d='M29.8 20.4c0 2-.9 3.6-2 5.1-1.7 2.2-3.9 3.8-6 5.5-.6.5-1.1.9-1.7 1.3-.3.2-.3.3-.5 0-2.5-2-5.2-3.8-7.3-6.3-1.5-1.7-2.6-3.7-2.5-6.1.2-2.4 2.3-4.5 4.8-4.6 2.2-.1 3.9.7 5 2.6.3.5.4.2.6-.1 1.9-3.2 6.6-3.4 8.8-.5.5.9.8 1.9.8 3.1z'
    />
    { isVerified &&
      <g>
        <path fill='#7AC943' d='M38 23.9s.7-.5 1.6 0l7.5 4.4s.6.4.6 1.2v8.7s0 .7-.6 1l-7.7 4.6s-.5.4-1.3 0l-7.7-4.5s-.7-.4-.7-1v-9.2s0-.6.6-1l7.7-4.2z'
        />
        <g fill='#FFF'>
          <path d='M36.24112 36.8857l7.7781-7.7781 1.90917 1.90917-7.7781 7.7781z'
          />
          <path d='M33.27453 33.96097l1.90917-1.90917 4.87899 4.87899-1.90917 1.90917z'
          />
        </g>
      </g>
    }
  </svg>
