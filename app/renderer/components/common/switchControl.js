/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const cx = require('../../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

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
      [css(styles.switchControl, this.props.customStyleWrapper)]: true,
      [this.props.className]: !!this.props.className,

      // TODO: Refactor preferences.less to remove this
      switchControl: true
    })}
      data-switch-status={this.props.checkedOn}
      data-test-id={this.props.testId}
    >
      {
        this.props.leftl10nId && this.props.topl10nId
        ? <div className={css(styles.switchControl__text)}>
          <div className={css(this.props.disabled && styles.switchControl__text_disabled)}>
            <div>&nbsp;</div>
            <label className={css(
              styles.switchControl__text__label,
              styles.switchControl__text__label_left,
              this.props.small && styles.switchControl__text__label_small,
              this.props.customStyleTextLeft
            )}
              data-l10n-id={this.props.leftl10nId}
              data-test-id='labelLeft'
              onClick={this.onClick}
            />
          </div>
        </div>
        : (this.props.leftl10nId
          ? <label className={css(
            styles.switchControl__text__label,
            styles.switchControl__text__label_left,
            this.props.small && styles.switchControl__text__label_small,
            this.props.customStyleTextLeft
          )}
            data-l10n-id={this.props.leftl10nId}
            data-test-id='labelLeft'
            onClick={this.onClick}
          />
          : null)
      }
      <div className={css(styles.switchControl__middle)}>
        {
          this.props.topl10nId
          ? <label className={css(
            styles.switchControl__text__label,
            styles.switchControl__middle__label_top,
            this.props.small && styles.switchControl__text__label_small,
            this.props.customStyleTextTop
          )}
            data-l10n-id={this.props.topl10nId}
            data-test-id='labelTop'
            onClick={this.onClick}
          />
          : null
        }
        <div className={css(
          styles.switchControl__middle__background,
          (this.props.large && !this.props.small) && styles.switchControl__middle__background_large,
          (!this.props.large && this.props.small) && styles.switchControl__middle__background_small,

          // Override the default background-color
          this.props.checkedOn && styles.switchControl__middle__background_on,

          // Override switchControl__middle__background_on
          this.props.disabled && styles.switchControl__middle__background_disabled
        )}
          onClick={this.onClick}
          data-test-id='switchBackground'
          data-test2-id={this.props.checkedOn ? 'switchedOn' : null}
        >
          <div className={css(
            styles.switchControl__middle__background__switchIndicator,
            (this.props.large && !this.props.small) && styles.switchControl__middle__background__switchIndicator_large,
            (!this.props.large && this.props.small) && styles.switchControl__middle__background__switchIndicator_small,

            // Override the default margin defined with switchControl__middle__background__switchIndicator
            this.props.checkedOn && styles.switchControl__middle__background__switchIndicator_on
          )} />
        </div>
      </div>
      {
        (this.props.rightl10nId || this.props.rightText) && this.props.topl10nId
        ? <div className={css(styles.switchControl__text)}>
          <div className={css(this.props.disabled && styles.switchControl__text_disabled)}>
            <div>&nbsp;</div>
            <label className={css(
              styles.switchControl__text__label,
              styles.switchControl__text__label_right,
              this.props.small && styles.switchControl__text__label_small,
              this.props.customStyleTextRight
            )}
              data-l10n-id={this.props.rightl10nId}
              data-l10n-args={this.props.rightl10nArgs}
              data-test-id='labelRight'
              onClick={this.onClick}
            >{this.props.rightText || ''}</label>
          </div>
        </div>
        : <div className={css(styles.switchControl__text)}>
          {
            (this.props.rightl10nId || this.props.rightText) && !this.props.onInfoClick
            ? <label className={css(
              styles.switchControl__text__label,
              styles.switchControl__text__label_right,
              this.props.small && styles.switchControl__text__label_small,
              this.props.customStyleTextRight
            )}
              data-l10n-id={this.props.rightl10nId}
              data-l10n-args={this.props.rightl10nArgs}
              data-test-id='labelRight'
              onClick={this.onClick}
            >{this.props.rightText || ''}</label>
          : null
        }
          {
            (this.props.rightl10nId || this.props.rightText) && this.props.onInfoClick
            ? <div className={css(styles.switchControl__text)}>
              <label className={css(
                styles.switchControl__text__label,
                styles.switchControl__text__label_right,
                this.props.small && styles.switchControl__text__label_small,
                this.props.customStyleTextRight
              )}
                data-l10n-id={this.props.rightl10nId}
                data-l10n-args={this.props.rightl10nArgs}
                data-test-id='labelRight'
                onClick={this.onClick}
              >
                {this.props.rightText}
              </label>
              <span className={cx({
                [globalStyles.appIcon.question]: true,
                [css(styles.switchControl__text__label, this.props.small && styles.switchControl__text__label_small)]: true
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
  switchControl: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px'
  },

  switchControl__text: {
    display: 'flex',
    margin: 'auto 0'
  },

  switchControl__text_disabled: {
    opacity: 0.3
  },

  switchControl__text__label: {
    userSelect: 'none'
  },

  switchControl__text__label_small: {
    fontSize: 'smaller'
  },

  switchControl__text__label_right: {
    paddingLeft: '1ch',
    marginLeft: 0
  },

  switchControl__text__label_left: {
    paddingRight: '1ch',
    marginRight: 0
  },

  switchControl__middle: {
    display: 'flex',
    flexDirection: 'column'
  },

  switchControl__middle__label_top: {
    margin: '0 auto 5px auto',
    color: theme.switchControl.label.top.color
  },

  switchControl__middle__background: {
    backgroundColor: theme.switchControl.switch.off.backgroundColor,
    borderRadius: '12px',
    height: globalStyles.spacing.switchHeight,
    width: globalStyles.spacing.switchWidth,
    position: 'relative',
    boxShadow: globalStyles.shadow.switchShadow,
    transition: globalStyles.transition.switchBGTransition
  },

  switchControl__middle__background_large: {
    backgroundColor: theme.switchControl.switch.off.large.backgroundColor,
    height: globalStyles.spacing.switchHeightLarge,
    width: globalStyles.spacing.switchWidthLarge
  },

  switchControl__middle__background_small: {
    height: globalStyles.spacing.switchHeightSmall,
    width: globalStyles.spacing.switchWidthSmall
  },

  switchControl__middle__background_disabled: {
    opacity: 0.3
  },

  switchControl__middle__background_on: {
    backgroundColor: theme.switchControl.switch.on.backgroundColor
  },

  switchControl__middle__background__switchIndicator: {
    backgroundColor: theme.switchControl.switch.indicator.backgroundColor,
    borderRadius: '100%',
    height: globalStyles.spacing.switchNubDiameter,
    width: globalStyles.spacing.switchNubDiameter,
    position: 'absolute',
    right: `calc(
      ${globalStyles.spacing.switchWidth} -
      ${globalStyles.spacing.switchNubDiameter} -
      ${globalStyles.spacing.switchNubRightMargin}
    )`,
    top: globalStyles.spacing.switchNubTopMargin,
    boxShadow: globalStyles.shadow.switchNubShadow,
    transition: globalStyles.transition.switchNubTransition
  },

  switchControl__middle__background__switchIndicator_large: {
    height: globalStyles.spacing.switchNubDiameterLarge,
    width: globalStyles.spacing.switchNubDiameterLarge,
    right: `calc(
      ${globalStyles.spacing.switchWidthLarge} -
      ${globalStyles.spacing.switchNubDiameterLarge} -
      ${globalStyles.spacing.switchNubRightMargin}
    )`
  },

  switchControl__middle__background__switchIndicator_small: {
    height: globalStyles.spacing.switchNubDiameterSmall,
    width: globalStyles.spacing.switchNubDiameterSmall,
    top: '1px',
    right: `calc(
      ${globalStyles.spacing.switchWidthSmall} -
      ${globalStyles.spacing.switchNubDiameterSmall} -
      ${globalStyles.spacing.switchNubRightMargin}
    )`
  },

  switchControl__middle__background__switchIndicator_on: {
    right: '2px'
  }
})

module.exports = SwitchControl
