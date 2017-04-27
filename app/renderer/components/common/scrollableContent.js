/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

class ScrollableContent extends ImmutableComponent {
  render () {
    return <div data-test-id={this.props.testId}
      className={css(styles.wrapper, this.props.scrollClassName)}>
      {this.props.children}
    </div>
  }
}

const styles = StyleSheet.create({
  wrapper: {
    boxSizing: 'border-box',
    borderRadius: '4px',
    paddingRight: globalStyles.spacing.scrollBarSize,
    overflowX: 'inherit',
    overflowY: 'inherit',
    maxHeight: 'inherit',

    '::-webkit-scrollbar': {
      width: globalStyles.spacing.scrollBarSize
    },

    '::-webkit-scrollbar-thumb': {
      background: globalStyles.color.braveOrange,
      boxShadow: globalStyles.shadow.braveComponentsShadow,
      borderRadius: '4px'
    },

    '::-webkit-scrollbar-track': {
      // specific for this component
      boxShadow: 'inset 0px 0px 5px -1px rgba(0, 0, 0, 0.25)',
      borderRadius: '4px',
      margin: '2px 0'
    }
  }
})

module.exports = ScrollableContent
