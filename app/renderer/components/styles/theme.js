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
    navigator: {
      menuBar: {
        item: {
          borderColor: 'transparent',
          color: '#000',

          onHover: {
            backgroundColor: '#e5f3ff',
            borderColor: '#cce8ff'
          },

          selected: {
            backgroundColor: '#cce8ff',
            borderColor: '#99d1ff'
          }
        }
      },

      braveMenu: {
        counter: {
          backgroundColor: '#555',
          color: '#fff'
        }
      }
    },

    audio: {
      color: globalStyles.color.audioColor
    },

    filter: {
      makeWhite: 'brightness(0) invert(1)',
      whiteShadow: 'drop-shadow(0px 0px 2px rgb(255, 255, 255))'
    },

    tabsToolbar: {
      backgroundColor: '#ddd',

      border: {
        color: '#bbb'
      },

      button: {
        backgroundColor: globalStyles.color.buttonColor,

        onHover: {
          backgroundColor: '#000'
        }
      },

      tabs: {
        navigation: {
          borderColor: '#bbb'
        }
      }
    },

    tabPage: {
      backgroundColor: '#fff',
      borderColor: '#bbb',

      hover: {
        backgroundColor: globalStyles.color.braveOrange,
        borderColor: globalStyles.color.braveOrange
      },

      active: {
        backgroundColor: globalStyles.color.braveOrange,
        borderColor: globalStyles.color.braveOrange,

        hover: {
          backgroundColor: globalStyles.color.braveOrange,
          borderColor: globalStyles.color.braveOrange
        }
      }
    },

    contextMenu: {
      color: '#000',

      scrollBar: {
        backgroundColor: 'transparent'
      },

      item: {
        separator: {
          hr: {
            backgroundColor: '#bbb'
          }
        },

        selected: {
          color: '#fff',
          backgroundColor: '#488afb'
        },

        disabled: {
          color: '#bbb'
        },

        icon: {
          hasFaIcon: {
            color: globalStyles.color.darkGray
          }
        },

        isMulti: {
          borderColor: '#aaa',
          backgroundColor: '#fbfbfb',
          color: '#000'
        },

        submenuIndicator: {
          color: '#676767'
        }
      },

      single: {
        backgroundColor: 'rgba(238, 238, 238, 1)',
        borderColor: 'rgba(204, 204, 204, 0.54)',
        boxShadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },

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
        },

        symbol: {
          color: globalStyles.color.black100,

          default: {
            backgroundColor: globalStyles.color.mediumGray,

            light: {
              backgroundColor: globalStyles.color.white100
            }
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
    },

    frame: {
      defaultBackground: '#fff',
      newTabBackground: '#222',
      privateTabBackground: globalStyles.color.privateTabBackgroundActive,
      privateTabBackground2: '#000'
    },

    switchControl: {
      label: {
        top: {
          color: '#bbb'
        }
      },

      switch: {
        off: {
          backgroundColor: '#d3d3d3',

          large: {
            backgroundColor: '#adadad'
          }
        },

        on: {
          backgroundColor: globalStyles.color.braveOrange
        },

        indicator: {
          backgroundColor: '#fff'
        }
      }
    },

    downloadsBar: {
      backgroundColor: '#e6e6e6',
      borderTopColor: '#888',
      color: '#000',

      item: {
        backgroundColor: '#fff',
        backgroundColor_filled: '#e6e6e6',
        borderColor: globalStyles.color.chromeTertiary,

        deleteConfirmation: {
          borderColor: '#ccc'
        },

        progress: {
          backgroundColor: globalStyles.color.highlightBlue,

          isPaused: {
            borderColor: '#000'
          }
        },

        unlock: {
          color: globalStyles.color.siteInsecureColor
        }
      }
    }
  }
