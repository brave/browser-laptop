const globalStyles = {
  breakpoint: {
    breakpointWideViewport: '1000px',
    breakpointNarrowViewport: '600px',
    breakpointExtensionButtonPadding: '720px',
    breakpointSmallWin32: '650px',
    breakpointTinyWin32: '500px',
    tab: {
      largeMedium: '83px',
      medium: '66px',
      mediumSmall: '53px',
      small: '42px',
      extraSmall: '33px',
      smallest: '19px'
    }
  },
  color: {
    linkColor: '#0099CC',
    highlightBlue: '#37A9FD',
    privateTabBackground: '#392e54',
    bitcoinOrange: '#f7931a',
    chromePrimary: '#F3F3F3',
    chromeSecondary: '#d3d3d3',
    chromeTertiary: '#c7c7c7',
    chromeText: '#555555',
    tabsBackground: '#dddddd',
    navigationBarBackground: 'white',
    chromeControlsBackground: '#bbb',
    chromeControlsBackground2: 'white',
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
    white25: 'rgba(255, 255, 255, 0.25)',
    white50: 'rgba(255, 255, 255, 0.5)',
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
    defaultIconBackground: '#F7F7F7'
  },
  radius: {
    borderRadius: '4px',
    borderRadiusTabs: '4px',
    borderRadiusURL: '4px',
    borderRadiusUIbox: '8px',
    bigBorderRadius: '14px',
    switchRadius: '10px',
    carotRadius: '8px'
  },
  spacing: {
    navigatorHeight: '48px',
    defaultSpacing: '12px',
    defaultFontSize: '13px',
    contextMenuFontSize: '14px',
    dragSpacing: '50px',
    switchHeight: '16px',
    switchWidth: '45px',
    switchNubDiameter: '12px',
    switchNubTopMargin: '2px',
    switchNubLeftMargin: '2px',
    switchNubRightMargin: '2px',
    buttonHeight: '25px',
    buttonWidth: '25px',
    navbarHeight: '36px',
    downloadsBarHeight: '50px',
    tabsToolbarHeight: '28px',
    tabPagesHeight: '9px',
    bookmarksToolbarHeight: '24px',
    bookmarksToolbarWithFaviconsHeight: '28px',
    bookmarksFileIconSize: '13px',
    bookmarksFolderIconSize: '15px',
    navbarButtonSpacing: '4px',
    navbarButtonWidth: '20px',
    navbarBraveButtonWidth: '23px',
    navbarBraveButtonMarginLeft: '80px',
    navbarLeftMarginDarwin: '76px',
    sideBarWidth: '190px',
    aboutPageSectionPadding: '24px',
    defaultTabPadding: '0 4px',
    defaultIconPadding: '0 2px'
  },
  shadow: {
    switchShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.35)',
    switchNubShadow: '1px 1px 5px -2px black',
    buttonShadow: '0px 1px 5px -1px rgba(0, 0, 0, 1.0)',
    dialogShadow: '0px 8px 22px 0px rgba(0, 0, 0, .5)',
    softBoxShadow: '0 4px 8px lightGray',
    lightBoxShadow: '0 2px 2px lightGray',
    insetShadow: 'inset -5px 0 15px black25',
    orangeButtonShadow: '0 2px 0 braveDarkOrange'
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
    switchNubTransition: 'right 100ms'
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
    zindexPopupWindow: '3000',
    zindexForms: '3000',
    zindexSuggestionText: '3100',
    zindexWindowFullScreen: '4000',
    zindexWindowFullScreenBanner: '4100'
  },
  fontSize: {
    tabIcon: '14px',
    tabTitle: '12px'
  },
  appIcons: {
    loading: 'fa fa-spinner fa-spin',
    defaultIcon: 'fa fa-file-o',
    closeTab: 'fa fa-times-circle',
    private: 'fa fa-eye',
    newSession: 'fa fa-user',
    volumeOn: 'fa fa-volume-up',
    volumeOff: 'fa fa-volume-off'
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
globalStyles.color.statsGray = globalStyles.color.chromeText

module.exports = globalStyles
