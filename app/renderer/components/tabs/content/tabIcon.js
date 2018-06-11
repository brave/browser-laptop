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
      className={css(styles.tabIcon, this.props.className)}
      data-test-favicon={this.props['data-test-favicon']}
      onDragStart={this.props.onDragStart}
      draggable={this.props.draggable}
      onClick={this.props.onClick}
      style={this.props.style}
      title={this.props.title}
      {...altProps}
    >
      {
        this.props.symbol
          ? <span
            className={cx({
              [css(styles.tabIcon, styles.tabIcon_symbol)]: true,
              [this.props.symbol]: true
            })}
            data-test-id={this.props['data-test-id']}
            data-test2-id={this.props['data-test2-id']}
            data-l10n-id={this.props.l10nId}
            data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
          >{this.props.symbolContent}</span>
          : this.props.children
      }
    </div>
  }
}

const styles = StyleSheet.create({
  tabIcon: {
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: globalStyles.zindex.zindexTabsThumbnail,

    // Default spacing properties
    height: globalStyles.spacing.iconSize,
    width: globalStyles.spacing.iconSize,

    // Default flex properties
    display: 'flex',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // must keep set width and height and not crop self

    // Default background properties
    backgroundSize: globalStyles.spacing.iconSize,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',

    // Default animation properties
    animationFillMode: 'forwards'
  },

  tabIcon_symbol: {
    fontSize: 'inherit',
    fontWeight: 'normal',
    color: 'inherit'
  }
})

module.exports = TabIcon
