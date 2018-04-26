/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const {opacityIncreaseKeyframes, tabFadeInKeyframes} = require('./animations')

/**
* Use this file when the style you need
* is applied in more than one element, or depends on it
* Use theme.js file to include colors that can be customized
*
* TODO:
* remove unnecessary styles properties (as items get refactored)
* migrate customizable options to theme.js
*/

const defaultFontFamily = `-apple-system, BlinkMacSystemFont, "Segoe UI"` +
`, "Helvetica Neue", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans"` +
`, "Droid Sans", sans-serif`

const globalStyles = {

  breakpoint: {
    breakpointWideViewport: '1000px',
    breakpointNarrowViewport: '600px',
    breakpointExtensionButtonPadding: '720px',
    breakpointSmallWin32: '650px',
    breakpointTinyWin32: '500px'
  },
  intersection: {
    // whereas 1 === 100%
    noIntersection: 1,
    at75: 0.75,
    at60: 0.6,
    at46: 0.46,
    at40: 0.4,
    at30: 0.3,
    at20: 0.20,
    at12: 0.125
  },
  color: {
    commonTextColor: 'rgb(59, 59, 62)',
    linkColor: '#0099CC',
    highlightBlue: '#37A9FD',
    privateTabBackground: '#665296',
    privateTabBackgroundActive: '#4b3c6e',
    bitcoinOrange: '#f7931a',
    chromePrimary: '#F3F3F3',
    chromeSecondary: '#d3d3d3',
    chromeTertiary: '#c7c7c7',
    chromeText: '#555555',
    navigationBarBackground: 'white',
    chromeControlsBackground: '#bbb',
    chromeControlsBackground2: 'white',
    commonFormBottomWrapperBackground: '#ddd',
    commonFormBackgroundColor: '#f7f7f7',
    toolbarBackground: '#eee',
    toolbarBorderColor: '#ccc',
    menuSelectionColor: '#2F7AFB',
    errorTextColor: '#999',
    progressBarColor: '#3498DB',
    siteInsecureColor: '#C63626',
    siteEVColor: 'green',
    buttonColor: 'rgb(105, 105, 112)',
    buttonColorActive: 'rgb(101, 101, 107)',
    braveOrange: 'rgb(255, 80, 0)',
    braveLightOrange: '#FF7A1D',
    braveMediumOrange: 'rgb(232, 72, 0)',
    braveDarkOrange: '#D44600',
    veryLightGray: 'rgb(250, 250, 251)',
    lightGray: 'rgb(236, 236, 239)',
    gray: 'rgb(153, 153, 157)',
    mediumGray: 'rgb(101, 101, 107)',
    darkGray: 'rgb(68, 68, 72)',
    modalVeryLightGray: 'rgb(247, 247, 249)',
    modalLightGray: 'rgb(231, 231, 234)',
    white25: 'rgba(255, 255, 255, 0.25)',
    white50: 'rgba(255, 255, 255, 0.5)',
    white100: 'rgba(255, 255, 255, 1)',
    gray25: 'rgba(116, 116, 130, 0.25)',
    gray50: 'rgba(116, 116, 130, 0.5)',
    black10: 'rgba(0, 0, 0, 0.1)',
    black20: 'rgba(0, 0, 0, 0.2)',
    black25: 'rgba(0, 0, 0, 0.25)',
    black50: 'rgba(0, 0, 0, 0.5)',
    black75: 'rgba(0, 0, 0, 0.75)',
    black100: 'rgba(0, 0, 0, 1)',
    statsYellow: '#ffc000',
    statsOrange: '#f39030',
    statsRed: '#fe521d',
    statsBlue: '#0796fa',
    statsLightGray: '#999999',
    defaultIconBackground: '#F7F7F7',
    notificationItemColor: '#f1e9e5',
    notificationBottomBorderColor: '#ff5500',
    almostInvisible: 'rgba(255,255,255,0.01)',
    urlBarOutline: 'rgb(187, 187, 191)',
    alphaWhite: 'rgba(255,255,255,0.8)'
  },
  typography: {
    // font for titles, labels in *most* cases (it's not a hard rule, consult a designer)
    display: {
      family: 'Poppins, ' + defaultFontFamily,
      // spacing for fonts >= 30px (generally)
      spacingLarge: '-0.4px',
      // spacing for font >= 20px and < 30px
      spacingMedium: '-0.2px',
      // spacing for font < 20px
      spacingRegular: 0
    },
    // font choices for flowing body text
    body: {
      family: `Muli, ` + defaultFontFamily
    },
    // system text
    default: {
      family: defaultFontFamily
    }
  },
  radius: {
    borderRadius: '4px',
    borderRadiusTabs: '4px',
    borderRadiusURL: '4px',
    borderRadiusUIbox: '8px',
    borderRadiusModal: '8px',
    bigBorderRadius: '14px',
    switchRadius: '10px',
    carotRadius: '8px'
  },
  spacing: {
    sentinelSize: '120px',
    navigatorHeight: '48px',
    defaultSpacing: '12px',
    defaultFontSize: '13px',
    contextMenuFontSize: '14px',
    textAreaFontSize: '14.5px',
    dragSpacing: '50px',
    switchHeight: '16px',
    switchHeightLarge: '26px',
    switchHeightSmall: '12px',
    switchWidth: '45px',
    switchWidthLarge: '60px',
    switchWidthSmall: '30px',
    switchNubDiameter: '12px',
    switchNubDiameterLarge: '22px',
    switchNubDiameterSmall: '10px',
    switchNubTopMargin: '2px',
    switchNubLeftMargin: '2px',
    switchNubRightMargin: '2px',
    buttonHeight: '25px',
    buttonWidth: '25px',
    navbarHeight: '36px',
    downloadsBarHeight: '60px',
    // This includes the toolbar's borders
    tabsToolbarHeight: '29px',
    tabPagesHeight: '7px',
    bookmarkHangerMaxWidth: '350px',
    bookmarksToolbarHeight: '20px',
    bookmarksToolbarTextOnlyHeight: '18px',
    bookmarksFileIconSize: '13px',
    bookmarksFolderIconSize: '15px',
    bookmarksItemMaxWidth: '100px',
    bookmarksItemPadding: '4px',
    bookmarksItemMargin: '4px',
    bookmarksItemChevronMargin: '4px',
    bookmarksItemChevronFontSize: '8px',
    bookmarksToolbarPadding: '10px',
    bookmarksItemFontSize: '11px',
    bookmarksToolbarButtonDraggingMargin: '25px',
    bookmarksToolbarOverflowButtonWidth: '9px',
    navbarMenubarMargin: '7px',
    navbarButtonSpacing: '4px',
    navbarButtonWidth: '20px',
    navbarBraveButtonWidth: '23px',
    navbarBraveButtonMarginLeft: '80px',
    navbarLeftMarginDarwin: '76px',
    sideBarWidth: '190px',
    aboutPageDetailsPageWidth: '704px',
    aboutPageSectionPadding: '24px',
    aboutPageSectionMargin: '10px',
    defaultTabMargin: '10px',
    defaultIconPadding: '2px',
    iconSize: '16px',
    sessionIconSize: '14px',
    closeIconSize: '14px',
    newSessionIconSize: '14px',
    narrowIconSize: '12px',
    dialogWidth: '422px',
    dialogSmallWidth: '350px',
    dialogMediumWidth: '500px',
    dialogLargeWidth: '600px',
    dialogTopOffset: '30px',
    dialogInsideMargin: '18px',
    modalDialogPaddingHorizontal: '50px',
    privateTabPaddingHorizontal: '30px',
    privateTabPadding: '40px',
    settingsListContainerMargin: '2rem',
    modalPanelHeaderMarginBottom: '.5rem',
    overlayButtonMargin: '8px',
    panelMargin: '15px',
    panelItemMargin: '12px',
    panelPadding: '18px',
    addFundsDialogMinHeight: '250px',
    batIconWidth: '40px'
  },
  shadow: {
    switchShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.35)',
    switchNubShadow: '1px 1px 5px -2px black',
    buttonShadow: '0px 1px 5px -1px rgba(0, 0, 0, 1.0)',
    dialogShadow: '0px 8px 22px 0px rgba(0, 0, 0, .5)',
    flyoutDialogBoxShadow: '2px 2px 8px rgba(59, 59, 59, 1.0)',
    softBoxShadow: '0 4px 8px lightGray',
    lightBoxShadow: '0 2px 2px lightGray',
    insetShadow: 'inset -5px 0 15px rgba(0, 0, 0, 0.25)',
    orangeButtonShadow: '0 2px 0 braveDarkOrange',
    bookmarkHangerArrowUpShadow: '-2px 2px 3px 0px rgba(0, 0, 0, 0.1)'
  },
  transition: {
    transitionDuration: '100ms',
    transition: 'all 600ms linear',
    transitionFast: 'all 100ms linear',
    transitionSlow: 'all 1s linear',
    transitionEase: 'all 600ms ease',
    transitionFastEase: 'all 100ms ease',
    transitionSlowEase: 'all 1s ease',
    switchBGTransition: 'background-color 100ms',
    switchNubTransition: 'right 100ms',
    tabBackgroundTransition: 'background-color 100ms linear'
  },
  zindex: {
    zindexWindowNotActive: '900',
    zindexWindow: '1000',
    zindexWindowIsPreview: '1100',
    zindexDownloadsBar: '1000',
    zindexTabs: '1000',
    zindexTabsThumbnail: '1100',
    zindexNavigationBar: '2000',
    zindexUrlbarNotLegend: '2100',
    zindexPopUp: '3000',
    zindexContextMenu: '3000',
    zindexDialogs: '3000',
    zindexModal: '3000',
    zindexPopupWindow: '3000',
    zindexForms: '3000',
    zindexSuggestionText: '3100',
    zindexWindowFullScreen: '4000',
    zindexWindowFullScreenBanner: '4100'
  },
  fontSize: {
    tabIcon: '14px',
    tabTitle: '12px',
    settingItemSubtext: '.95rem',
    flyoutDialog: '13px',
    prefsPanelHeading: '23px'
  },
  appIcons: {
    check: 'fa fa-check',
    clipboard: 'fa fa-clipboard',
    closeTab: 'fa fa-times-circle',
    defaultIcon: 'fa fa-file-o',
    exclude: 'fa fa-ban',
    findNext: 'fa fa-caret-down',
    findPrev: 'fa fa-caret-up',
    loading: 'fa fa-spinner fa-spin',
    lock: 'fa fa-lock',
    moreInfo: 'fa fa-info-circle',
    next: 'fa fa-caret-right',
    openLocation: 'fa fa-folder-open-o',
    pause: 'fa fa-pause',
    prev: 'fa fa-caret-left',
    private: 'fa fa-eye',
    question: 'fa fa-question-circle',
    refresh: 'fa fa-refresh',
    remove: 'fa fa-times',
    resume: 'fa fa-play',
    retry: 'fa fa-repeat',
    search: 'fa fa-search',
    trash: 'fa fa-trash',
    unlock: 'fa fa-unlock',
    user: 'fa fa-user',
    volumeOff: 'fa fa-volume-off',
    volumeOn: 'fa fa-volume-up'
  },
  animations: {
    subtleShowUp: {
      opacity: 0,
      willChange: 'opacity',
      animationName: opacityIncreaseKeyframes,
      animationDelay: '120ms',
      animationTimingFunction: 'linear',
      animationDuration: '120ms',
      animationFillMode: 'forwards'
    },

    tabFadeIn: {
      opacity: 0.5,
      willChange: 'opacity',
      animationName: tabFadeInKeyframes,
      animationDuration: '0.75s',
      animationTimingFunction: 'ease-in-out',
      animationFillMode: 'forwards'
    }
  },

  button: {
    color: 'rgb(90, 90, 98)',

    default: {
      color: '#fff',
      backgroundColor: 'transparent',
      hoverColor: '#000',
      boxShadow: '0px 1px 5px -1px rgba(0, 0, 0, 0.5)'
    },

    primary: {
      gradientColor1: '#FF7A1D',
      gradientColor2: '#ff5000',
      background: 'linear-gradient(#FF7A1D, #ff5000)',
      hoverColor: '#fff',
      borderHoverColor: '#fff'
    },

    secondary: {
      gradientColor1: '#fff',
      gradientColor2: 'rgb(236, 236, 239)',
      background: 'linear-gradient(#fff, rgb(236, 236, 239))',
      color: 'rgb(101, 101, 107)',
      hoverColor: 'rgb(68, 68, 72)',
      borderHoverColor: 'rgb(153, 153, 157)'
    },

    subtle: {
      // cf: https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L151
      backgroundColor: '#ccc'
    },

    action: {
      backgroundColor: '#4099FF',
      hoverColor: '#000'
    },

    alert: {
      color: '#fff',
      gradientColor1: '#ff5000',
      gradientColor2: '#ff001b',
      background: 'linear-gradient(#ff5000, #ff001b)',
      hoverColor: '#fff',
      borderHoverColor: '#fff'
    },

    panel: {
      width: '180px'
    }
  },

  braveryPanel: {
    color: 'rgb(59, 59, 62)',

    header: {
      color: '#fff',
      background: 'rgb(128, 128, 133)',
      switchControlTopTextColor: '#d3d3d3',
      border: '1px solid #aaa'
    },

    stats: {
      background: '#f7f7f7'
    },

    body: {
      background: 'rgb(239, 239, 241)',

      hr: {
        background: 'rgb(204, 204, 214)'
      }
    }
  },

  // TODO (Suguru): move them to payment.js after style refactoring is done
  payments: {
    fontSize: {
      regular: '14.5px'
    }
  },

  sortableTable: {
    cell: {
      normal: {
        padding: '.6rem'
      },

      small: {
        padding: '.5rem'
      }
    }
  }
}

globalStyles.color.chromeBorderColor = globalStyles.color.chromePrimary
globalStyles.color.chromeControlsWarningBackground = globalStyles.color.chromePrimary
globalStyles.color.audioColor = globalStyles.color.highlightBlue
globalStyles.color.focusUrlbarOutline = globalStyles.color.highlightBlue
globalStyles.color.loadTimeColor = globalStyles.color.highlightBlue
globalStyles.color.activeTabDefaultColor = globalStyles.color.chromePrimary

globalStyles.braveryPanel.stats.colorAds = globalStyles.color.statsRed
globalStyles.braveryPanel.stats.colorRedirected = globalStyles.color.statsBlue
globalStyles.braveryPanel.stats.colorFp = globalStyles.color.statsYellow
globalStyles.braveryPanel.stats.colorNoScript = globalStyles.color.chromeText

module.exports = globalStyles
