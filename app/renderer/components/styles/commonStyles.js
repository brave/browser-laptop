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

  browserButton: {
    border: 'none',
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
  }
})

module.exports = styles
