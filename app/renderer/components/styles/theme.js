/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

  const globalStyles = require('./global')

 /**
  * Includes color options for theming
  * This should be used as a boilerplate for all
  * future theming, including darkUI.
  * Note: If an element is not color-related, it should go into global.js
  */
  module.exports.theme = {
    tab: {
      transition: `
      background-color 150ms cubic-bezier(0.26, 0.63, 0.39, 0.65),
      color 150ms cubic-bezier(0.26, 0.63, 0.39, 0.65)
    `,
      background: '#ddd',
      borderColor: '#bbb',
      color: '#5a5a5a',

      hover: {
        background: 'rgba(255, 255, 255, 0.4)'
      },

      forWindows: {
        color: '#555'
      },

      active: {
        background: 'rgba(255, 255, 255, 0.8)',

        private: {
          background: '#4b3c6e',
          color: '#fff'
        }
      },

      private: {
        background: '#d9d6e0',
        color: '#4b3c6e'
      },

      content: {
        icon: {
          default: {
            primary: '#fff',
            secondary: 'rgb(101, 101, 101)'
          },

          private: {
            background: {
              active: '#fff',
              notActive: '#000'
            }
          },

          audio: {
            color: '#69B9F9'
          },

          close: {
            filter: 'invert(100%) grayscale(1) contrast(0.5) brightness(160%)'
          }
        }
      }
    },

    findBar: {
      backgroundColor: '#F7F7F7',
      color: globalStyles.color.highlightBlue,

      border: {
        bottom: {
          color: globalStyles.color.lightGray
        }
      },

      string: {
        icon: {
          color: globalStyles.color.gray
        }
      },

      find: {
        color: '#555'
      },

      close: {
        onHover: {
          color: 'inherit'
        }
      }
    }
  }
