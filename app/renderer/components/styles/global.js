/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {opacityIncreaseKeyframes} = require('./animations')

/**
 * Historically this file includes styles with no defined criteria.
 * Imagine this file as a future reference for theming, in a way
 * that each component should be an object wrapping all properties
 * that would change in a dark mode, for example.
 *
 * Valid as well for things that needs to be fully global,
 * i.e. breakpoints, icons and zIndexes.
 *
 * Thus said, please take preference for inlined styles in the component itself.
 * If you really feel repetitve writing the same style for a given component,
 * consider including a variable inside component.
 *
 * TODO:
 * remove unnecessary styles properties (as items get refactored)
 * Remove fully global items and take preference for component properties (@see button)
 */

const globalStyles = {
  breakpoint: {
    breakpointWideViewport: '1000px',
    breakpointNarrowViewport: '600px',
    breakpointExtensionButtonPadding: '720px',
    breakpointSmallWin32: '650px',
    breakpointTinyWin32: '500px',
    breakpointNewPrivateTab: '890px',
    tab: {
      default: '184px', // match tabArea max-width
      large: '120px',
      largeMedium: '83px',
      medium: '66px',
      mediumSmall: '53px',
      small: '46px',
      extraSmall: '40px',
      smallest: '19px'
    }
  },
  color: {
    commonTextColor: '#3b3b3b',
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
    tabsToolbarBorderColor: '#bbb',
    tabsBackground: '#ddd',
    tabsBackgroundInactive: '#ddd',
    commonFormBottomWrapperBackground: '#ddd',
    commonFormBackgroundColor: '#f7f7f7',
    toolbarBackground: '#eee',
    toolbarBorderColor: '#ccc',
    menuSelectionColor: '#2F7AFB',
    errorTextColor: '#999',
    progressBarColor: '#3498DB',
    siteInsecureColor: '#C63626',
    siteEVColor: 'green',
    buttonColor: '#5a5a5a',
    braveOrange: 'rgb(255, 80, 0)',
    braveLightOrange: '#FF7A1D',
    braveMediumOrange: 'rgb(232, 72, 0)',
    braveDarkOrange: '#D44600',
    switchBG_off: '#d3d3d3',
    switchBG_off_lrg: '#adadad',
    switchBG_dis: '#e8e8e8',
    switchNubColor: 'white',
    findbarBackground: '#F7F7F7',
    veryLightGray: 'rgb(250, 250, 250)',
    lightGray: 'rgb(236, 236, 236)',
    gray: 'rgb(153, 153, 153)',
    mediumGray: 'rgb(101, 101, 101)',
    darkGray: 'rgb(68, 68, 68)',
    modalVeryLightGray: 'rgb(247, 247, 247)',
    modalLightGray: 'rgb(231, 231, 231)',
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
    urlBarOutline: '#bbb',
    alphaWhite: 'rgba(255,255,255,0.8)'
  },
  filter: {
    makeWhite: 'brightness(0) invert(1)',
    whiteShadow: 'drop-shadow(0px 0px 2px rgb(255, 255, 255))'
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
    navigatorHeight: '48px',
    defaultSpacing: '12px',
    defaultFontSize: '13px',
    contextMenuFontSize: '14px',
    textAreaFontSize: '14.5px',
    dragSpacing: '50px',
    switchHeight: '16px',
    switchWidth: '45px',
    switchNubDiameter: '12px',
    switchNubTopMargin: '2px',
    switchNubLeftMargin: '2px',
    switchNubRightMargin: '2px',
    navbarHeight: '36px',
    downloadsBarHeight: '60px',
    tabsToolbarHeight: '26px',
    tabPagesHeight: '7px',
    bookmarkHangerMaxWidth: '350px',
    bookmarksToolbarHeight: '24px',
    bookmarksToolbarWithFaviconsHeight: '24px',
    bookmarksFileIconSize: '13px',
    bookmarksFolderIconSize: '15px',
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
    defaultTabPadding: '0 4px',
    defaultIconPadding: '2px',
    iconSize: '16px',
    closeIconSize: '13px',
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
    panelPadding: '18px'
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
    zindexTabsDragIndicator: '1100',
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
    clipboard: 'fa fa-clipboard',
    closeTab: 'fa fa-times-circle',
    defaultIcon: 'fa fa-file-o',
    loading: 'fa fa-spinner fa-spin',
    private: 'fa fa-eye',
    refresh: 'fa fa-refresh',
    remove: 'fa fa-times',
    volumeOff: 'fa fa-volume-off',
    volumeOn: 'fa fa-volume-up',
    exclude: 'fa fa-ban',
    trash: 'fa fa-trash',
    moreInfo: 'fa fa-info-circle',
    angleDoubleRight: 'fa fa-angle-double-right',
    findPrev: 'fa fa-caret-up',
    findNext: 'fa fa-caret-down'
  },
  animations: {
    subtleShowUp: {
      opacity: 0,
      animationName: opacityIncreaseKeyframes,
      animationDelay: '120ms',
      animationTimingFunction: 'linear',
      animationDuration: '120ms',
      animationFillMode: 'forwards'
    }
  },

  button: {
    color: '#5a5a5a',

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
      gradientColor2: '#ececec',
      background: 'linear-gradient(#fff, #ececec)',
      color: '#666',
      hoverColor: '#444',
      borderHoverColor: 'rgb(153, 153, 153)'
    },

    subtle: {
      // cf: https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L151
      backgroundColor: '#ccc'
    },

    action: {
      backgroundColor: '#4099FF',
      hoverColor: '#000'
    }
  },

  braveryPanel: {
    color: '#3b3b3b',

    header: {
      color: '#fafafa',
      background: '#808080',
      switchControlTopTextColor: '#d3d3d3',
      border: '1px solid #aaa'
    },

    stats: {
      background: '#f7f7f7'
    },

    body: {
      background: '#eee',

      hr: {
        background: '#ccc'
      }
    }
  },

  navigationBar: {

    urlbarForm: {
      height: '25px'
    }
  }
}

globalStyles.color.chromeBorderColor = globalStyles.color.chromePrimary
globalStyles.color.chromeControlsWarningBackground = globalStyles.color.chromePrimary
globalStyles.color.audioColor = globalStyles.color.highlightBlue
globalStyles.color.focusUrlbarOutline = globalStyles.color.highlightBlue
globalStyles.color.siteSecureColor = globalStyles.color.buttonColor
globalStyles.color.loadTimeColor = globalStyles.color.highlightBlue
globalStyles.color.activeTabDefaultColor = globalStyles.color.chromePrimary
globalStyles.color.switchBG_on = globalStyles.color.braveOrange

globalStyles.spacing.tabHeight = globalStyles.spacing.tabsToolbarHeight

globalStyles.braveryPanel.stats.colorAds = globalStyles.color.statsRed
globalStyles.braveryPanel.stats.colorRedirected = globalStyles.color.statsBlue
globalStyles.braveryPanel.stats.colorFp = globalStyles.color.statsYellow
globalStyles.braveryPanel.stats.colorNoScript = globalStyles.color.chromeText

module.exports = globalStyles
