/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {StyleSheet} = require('aphrodite')
const globalStyles = require('./global')

const styles = StyleSheet.create({
  formControl: {
    background: 'white',
    border: `solid 1px ${globalStyles.color.black20}`,
    borderRadius: globalStyles.radius.borderRadius,
    boxShadow: `inset 0 1px 1px ${globalStyles.color.black10}`,
    boxSizing: 'border-box',
    display: 'block',
    color: globalStyles.color.darkGray,
    fontSize: globalStyles.spacing.textAreaFontSize,
    height: '2.25em',
    outline: 'none',
    padding: '0.4em',
    width: '100%'
  },
  flyoutDialog: {
    backgroundColor: globalStyles.color.toolbarBackground,
    borderRadius: globalStyles.radius.borderRadius,
    boxShadow: '2px 2px 8px #3b3b3b',
    color: '#000',
    fontSize: '13px',
    padding: '10px 30px',
    position: 'absolute',
    textAlign: 'left',
    top: globalStyles.spacing.dialogTopOffset
  },

  // itemList.less
  listItem: {
    cursor: 'default',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    padding: '8px 12px',
    WebkitUserSelect: 'none',

    ':hover': {
      backgroundColor: globalStyles.color.lightGray
    }
  },
  aboutListItem: {
    display: 'flex'
  },
  aboutItemSeparator: {
    color: '#aaa',
    padding: '0 4px'
  },
  aboutItemTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  aboutItemLocation: {
    color: '#aaa',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  // Buttons
  browserButton: {
    margin: '0',
    whiteSpace: 'nowrap',
    outline: 'none',
    cursor: 'default',
    display: 'inline-block',
    lineHeight: globalStyles.spacing.buttonHeight,
    height: globalStyles.spacing.buttonHeight,
    width: globalStyles.spacing.buttonWidth,
    fontSize: globalStyles.spacing.defaultFontSize,
    color: globalStyles.color.buttonColor,
    borderRadius: globalStyles.radius.borderRadius,
    textAlign: 'center',
    transition: '.1s opacity, .1s background',
    WebkitUserSelect: 'none',
    backgroundSize: '16px',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat'
  },
  primaryButton: {
    background: 'linear-gradient(#FF7A1D, #ff5000)',
    borderLeft: '2px solid transparent',
    borderRight: '2px solid transparent',
    borderTop: '2px solid #FF7A1D',
    borderBottom: '2px solid #ff5000',
    boxShadow: '0px 1px 5px -1px rgba(0, 0, 0, 0.5)',
    fontWeight: '500',
    fontSize: '0.9rem',
    padding: '8px 20px',
    margin: 0,
    color: '#fff',
    lineHeight: '1.25',
    width: 'auto',
    height: 'auto',
    minWidth: '78px',

    ':hover': {
      border: '2px solid white',
      color: 'white',
      cursor: 'pointer'
    }
  },
  whiteButton: {
    background: 'linear-gradient(white, #ececec)',
    border: '1px solid white',
    boxShadow: '0px 1px 5px -1px rgba(0, 0, 0, 0.5)',
    cursor: 'pointer',
    color: '#444444',
    lineHeight: 1.25,
    width: 'auto',
    height: 'auto',
    minWidth: '78px',
    fontSize: '0.9rem',
    padding: '8px 20px',
    margin: 0,

    ':hover': {
      border: `1px solid ${globalStyles.color.gray}`,
      color: '#000'
    }
  },
  inlineButton: {
    display: 'inline'
  },

  // margin/padding
  noMarginTop: {
    marginTop: 0
  },
  noMarginBottom: {
    marginBottom: 0
  },
  noMarginLeft: {
    marginLeft: 0
  },
  noMarginRight: {
    marginRight: 0
  },
  noPaddingTop: {
    paddingTop: 0
  },
  noPaddingBottom: {
    paddingBottom: 0
  },
  noPaddingLeft: {
    paddingLeft: 0
  },
  noPaddingRight: {
    paddingRight: 0
  },

  // notificationBar
  notificationBar: {
    display: 'inline-block',
    boxSizing: 'border-box',
    width: '100%',
    cursor: 'default',
    WebkitUserSelect: 'none',
    marginTop: globalStyles.spacing.navbarMenubarMargin
  },
  notificationBar__notificationItem: {
    backgroundColor: '#ffefc0',
    boxSizing: 'border-box',
    borderTop: `1px solid ${globalStyles.color.tabsToolbarBorderColor}`,
    borderBottom: `1px solid ${globalStyles.color.tabsToolbarBorderColor}`,
    lineHeight: '24px',
    padding: '8px 20px'
  },
  notificationBar__greetingStyle: {
    backgroundColor: '#fff',
    padding: '8px 20px',
    width: '100%'
  },
  notificationItem__greeting: {
    color: globalStyles.color.braveOrange,
    fontSize: '16px',
    margin: 'auto 10px auto 0',
    userSelect: 'none'
  },
  notificationItem__message: {
    color: '#000',
    fontSize: '15px',
    margin: 'auto 6px auto 0',
    userSelect: 'none',
    cursor: 'default'
  },
  notificationItem__secondaryMessage: {
    color: '#888',
    fontSize: '14px',
    padding: '0',
    margin: 'auto 0 auto 10px'
  },
  notificationItem__button: {
    fontSize: '13px',
    marginRight: '10px',
    padding: '2px 15px',
    textTransform: 'capitalize',
    width: 'auto'
  }
})

module.exports = styles
