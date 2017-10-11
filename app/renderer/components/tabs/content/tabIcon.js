/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')

// Utils
const cx = require('../../../../../js/lib/classSet')

// Styles
const globalStyles = require('../../styles/global')

class TabIcon extends ImmutableComponent {
  render () {
    let altProps
    if (!this.props.symbol) {
      altProps = {
        'data-test-id': this.props['data-test-id'],
        'data-test2-id': this.props['data-test2-id']
      }
    }

    return <div
      className={this.props.className}
      data-test-favicon={this.props['data-test-favicon']}
      onDragStart={this.props.onDragStart}
      draggable={this.props.draggable}
      onClick={this.props.onClick}
      style={this.props.style}
      {...altProps}
    >
      {
        this.props.symbol
          ? <span
            className={cx({
              [this.props.symbol]: true,
              [css(styles.tabIcon, this.props.symbolContent && styles.tabIcon_hasSymbol)]: true
            })}
            data-test-id={this.props['data-test-id']}
            data-test2-id={this.props['data-test2-id']}
            data-l10n-id={this.props.l10nId}
            data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
          >{this.props.symbolContent}</span>
          : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 'inherit',
    display: 'flex',
    width: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize,
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'normal',
    color: 'inherit'
  },

  tabIcon_hasSymbol: {
    fontSize: '8px',
    justifyContent: 'flex-end',
    fontWeight: 'bold',
    color: globalStyles.color.black100
  }
})

module.exports = TabIcon
