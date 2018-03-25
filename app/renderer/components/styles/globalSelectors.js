/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const { StyleSheet } = require('aphrodite/no-important')
const globalStyles = require('./global')

const GLOBALS = '__GLOBAL_STYLES__'

const globalExtension = {
  selectorHandler: (selector, baseSelector, generateSubtreeStyles) =>
    (baseSelector.includes(GLOBALS) ? generateSubtreeStyles(selector) : null)
}

const extended = StyleSheet.extend([globalExtension])

const styles = extended.StyleSheet.create({
  [GLOBALS]: {
    '*': {
      color: globalStyles.color.commonTextColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", sans-serif',
      fontWeight: 400,
      margin: 0,
      padding: 0
    },

    'html, body, #appContainer, #appContainer > div': {
      height: '100%'
    },

    body: {
      fontSize: '100%'
    },

    // used for titles / labels (in *most* cases)
    '@typography-display': {
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif'
    },

    // in *most* cases, use this letter-spacing value
    // when font-size is greater than 30px
    '@typographyDisplayLargeSpacing': '-0.4px',

    // when font-size is greater than 20px and less than 30px
    '@typographyDisplayMediumSpacing': '-0.2px',

    // used for body / flowing text
    '@typography-body': {
      fontFamily: 'Muli, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif'
    }
  }
})
module.exports = extended.css(styles[GLOBALS])
