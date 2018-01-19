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
      whiteShadow: 'drop-shadow(-10px 0px 12px rgb(255, 255, 255))'
    },

    tabsToolbar: {
      backgroundColor: '#CDD1D5',

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
      transitionDurationOut: '400ms',
      transitionDurationIn: '200ms',
      transitionEasingOut: 'ease-in',
      transitionEasingIn: 'ease-out',
      background: 'rgb(205,209,213)',
      borderColor: '#bbb',
      borderWidth: 1,
      color: '#222',
      defaultFaviconColor: globalStyles.color.mediumGray,
      defaultFaviconColorLight: '#fff',

      hover: {
        background: 'rgb(219,221,223)',
        active: {
          background: 'rgb(243,243,243)'
        },
        private: {
          background: 'rgb(225,223,238)',
          borderColor: 'rgba(75, 60, 110, .7)'
        }
      },

      active: {
        background: 'rgb(233,233,234)',
        colorLight: 'rgb(255, 255, 255)',
        colorDark: '#222',
        private: {
          background: 'rgb(75,60,110)',
          color: '#fff',
          defaultFaviconColor: '#fff'
        }
      },

      private: {
        background: 'rgb(217,213,228)',
        color: '#4b3c6e'
      },

      preview: {
        background: 'rgb(240,240,240)',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.22)',
        scale: '1.06'
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
          color: '#256ea9'
        },

        close: {
          filter: 'invert(100%) grayscale(1) contrast(0.5) brightness(160%)'
        },

        symbol: {
          color: globalStyles.color.black100
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
    }
  }
