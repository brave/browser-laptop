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
    const styles = StyleSheet.create({
      icon: {
        fontSize: this.props.symbolContent ? '8px' : 'inherit',
        display: 'flex',
        alignSelf: 'center',
        width: globalStyles.spacing.iconSize,
        height: globalStyles.spacing.iconSize,
        alignItems: 'center',
        justifyContent: this.props.symbolContent ? 'flex-end' : 'left',
        fontWeight: this.props.symbolContent ? 'bold' : 'normal',
        color: this.props.symbolContent ? globalStyles.color.black100 : 'inherit'
      }
    })

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
      {...altProps}
    >
      {
        this.props.symbol
          ? <span
            className={cx({
              [this.props.symbol]: true,
              [css(styles.icon)]: true
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

module.exports = TabIcon
