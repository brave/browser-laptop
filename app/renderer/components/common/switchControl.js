/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const cx = require('../../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')

/**
 * Represents an on/off switch control
 */
class SwitchControl extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }
  onClick () {
    this.props.onClick({
      target: {
        value: !this.props.checkedOn
      }
    })
  }
  render () {
    return <div className={cx({
      switchControl: true,
      [this.props.className]: !!this.props.className,
      disabled: this.props.disabled,
      large: this.props.large,
      small: this.props.small,
      hasTopText: this.props.topl10nId,
      [this.props.customWrapperClassName]: !!this.props.customWrapperClassName
    })}
      data-switch-status={this.props.checkedOn}
      data-test-id={this.props.testId}
    >
      {
        this.props.leftl10nId && this.props.topl10nId
        ? <div className='switchControlText'>
          <div className='switchControlLeftText'>
            <div className='switchSpacer'>&nbsp;</div>
            <label className={cx({
              [css(styles.switchControlText__label, styles.switchControlText_left__label, this.props.small && styles.switchControlText__label_small)]: true,
              [this.props.customLeftTextClassName]: !!this.props.customLeftTextClassName
            })}
              onClick={this.onClick} data-l10n-id={this.props.leftl10nId}
            />
          </div>
        </div>
        : (this.props.leftl10nId
          ? <label className={cx({
            [css(styles.switchControlText__label, styles.switchControlText_left__label, this.props.small && styles.switchControlText__label_small)]: true,
            [this.props.customLeftTextClassName]: !!this.props.customLeftTextClassName
          })}
            onClick={this.onClick} data-l10n-id={this.props.leftl10nId}
          />
          : null)
      }
      <div className='switchMiddle' data-test-id='switchMiddle'>
        {
          this.props.topl10nId
          ? <label className={cx({
            switchControlTopText: true,
            [css(styles.switchControlText__label, this.props.small && styles.switchControlText__label_small)]: true,
            [this.props.customTopTextClassName]: !!this.props.customTopTextClassName
          })}
            onClick={this.onClick}
            data-l10n-id={this.props.topl10nId} />
          : null
        }
        <div className={cx({
          switchBackground: true,
          switchedOn: this.props.checkedOn,
          [this.props.backgroundClassName]: !!this.props.backgroundClassName
        })}
          onClick={this.onClick}
          data-test-id='switchBackground'
          data-test2-id={this.props.checkedOn ? 'switchedOn' : null}
        >
          <div className={cx({
            switchIndicator: true,
            [css(this.props.small && styles.switchControlText__label_small)]: true,
            [this.props.indicatorClassName]: !!this.props.indicatorClassName
          })} />
        </div>
      </div>
      {
        (this.props.rightl10nId || this.props.rightText) && this.props.topl10nId
        ? <div className='switchControlText'>
          <div className='switchControlRightText'>
            <div className='switchSpacer'>&nbsp;</div>
            <label className={cx({
              [css(styles.switchControlText__label, styles.switchControlText_right__label, this.props.small && styles.switchControlText__label_small)]: true,
              [this.props.customRightTextClassName]: !!this.props.customRightTextClassName
            })}
              onClick={this.onClick}
              data-l10n-id={this.props.rightl10nId}
              data-l10n-args={this.props.rightl10nArgs}
            >{this.props.rightText || ''}</label>
          </div>
        </div>
        : <div className='switchControlRight'>
          {
            (this.props.rightl10nId || this.props.rightText) && !this.props.onInfoClick
            ? <label className={cx({
              [css(styles.switchControlText__label, styles.switchControlText_right__label, this.props.small && styles.switchControlText__label_small)]: true,
              [this.props.customRightTextClassName]: !!this.props.customRightTextClassName
            })}
              onClick={this.onClick}
              data-l10n-id={this.props.rightl10nId}
              data-l10n-args={this.props.rightl10nArgs}
            >{this.props.rightText || ''}</label>
          : null
        }
          {
            (this.props.rightl10nId || this.props.rightText) && this.props.onInfoClick
            ? <div className='switchControlRight'>
              <label className={cx({
                [css(styles.switchControlText__label, styles.switchControlText_right__label, this.props.small && styles.switchControlText__label_small)]: true,
                [this.props.customRightTextClassName]: !!this.props.customRightTextClassName
              })}
                onClick={this.onClick}
                data-l10n-id={this.props.rightl10nId}
                data-l10n-args={this.props.rightl10nArgs}
              >
                {this.props.rightText}
              </label>
              <span className={cx({
                fa: true,
                'fa-question-circle': true,
                info: true,
                clickable: true,
                [css(styles.switchControlText__label, this.props.small && styles.switchControlText__label_small)]: true,
                [this.props.customInfoButtonClassName]: !!this.props.customInfoButtonClassName
              })}
                onClick={this.props.onInfoClick}
                title={this.props.infoTitle}
              />
            </div>
            : null
          }
        </div>
      }
    </div>
  }
}

const styles = StyleSheet.create({
  switchControlText__label: {
    userSelect: 'none'
  },

  switchControlText__label_small: {
    fontSize: 'smaller'
  },

  switchControlText_right__label: {
    paddingLeft: '1ch',
    marginLeft: 0
  },

  switchControlText_left__label: {
    paddingRight: '1ch',
    marginRight: 0
  }
})

module.exports = SwitchControl
