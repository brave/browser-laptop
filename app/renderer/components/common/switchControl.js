/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const cx = require('../../../../js/lib/classSet')

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
        ? <div className='switchControlText'><div className='switchControlLeftText'><div className='switchSpacer'>&nbsp;</div><span className='switchControlLeftText' data-l10n-id={this.props.leftl10nId} /></div></div>
        : (this.props.leftl10nId
          ? <span className='switchControlLeftText' data-l10n-id={this.props.leftl10nId} />
          : null)
      }
      <div className='switchMiddle'>
        {
          this.props.topl10nId
          ? <span className={cx({
            switchControlTopText: true,
            [this.props.customTopTextClassName]: !!this.props.customTopTextClassName
          })}
            data-l10n-id={this.props.topl10nId} />
          : null
        }
        <div data-test-id='switchBackground' className={cx({
          switchBackground: true,
          switchedOn: this.props.checkedOn,
          [this.props.backgroundClassName]: !!this.props.backgroundClassName
        })} onClick={this.onClick}>
          <div className={cx({
            switchIndicator: true,
            [this.props.indicatorClassName]: !!this.props.indicatorClassName
          })} />
        </div>
      </div>
      {
        (this.props.rightl10nId || this.props.rightText) && this.props.topl10nId
        ? <div className='switchControlText'>
          <div className='switchControlRightText'>
            <div className='switchSpacer'>&nbsp;</div>
            <span className={cx({
              switchControlRightText: true,
              [this.props.customRightTextClassName]: !!this.props.customRightTextClassName
            })}
              data-l10n-id={this.props.rightl10nId}
              data-l10n-args={this.props.rightl10nArgs}
            >{this.props.rightText || ''}</span>
          </div>
        </div>
        : <div className='switchControlRight'>
          {
            (this.props.rightl10nId || this.props.rightText) && !this.props.onInfoClick
            ? <span className={cx({
              switchControlRightText: true,
              [this.props.customRightTextClassName]: !!this.props.customRightTextClassName
            })}
              data-l10n-id={this.props.rightl10nId}
              data-l10n-args={this.props.rightl10nArgs}
            >{this.props.rightText || ''}</span>
          : null
        }
          {
            (this.props.rightl10nId || this.props.rightText) && this.props.onInfoClick
            ? <div className='switchControlRightText'>
              <span data-l10n-id={this.props.rightl10nId}
                data-l10n-args={this.props.rightl10nArgs}>
                {this.props.rightText}
              </span>
              <span className={cx({
                fa: true,
                'fa-question-circle': true,
                info: true,
                clickable: true,
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

module.exports = SwitchControl
