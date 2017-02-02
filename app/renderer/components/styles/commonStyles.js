/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {StyleSheet} = require('aphrodite')
const globalStyles = require('./global')

const styles = StyleSheet.create({
  'formControl': {
    background: 'white',
    border: `solid 1px ${globalStyles.color.black20}`,
    borderRadius: globalStyles.radius.borderRadius,
    boxShadow: `inset 0 1px 1px ${globalStyles.color.black10}`,
    boxSizing: 'border-box',
    display: 'block',
    color: globalStyles.color.darkGray,
    fontSize: '14.5px',
    height: '2.25em',
    outline: 'none',
    padding: '0.4em',
    width: '100%'
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
  }
})

module.exports = styles
