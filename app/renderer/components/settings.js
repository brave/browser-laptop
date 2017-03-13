/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite')
const aboutActions = require('../../../js/about/aboutActions')
const getSetting = require('../../../js/settings').getSetting
const {changeSetting} = require('../lib/settingsUtil')
const SwitchControl = require('../../../js/components/switchControl')
const cx = require('../../../js/lib/classSet')

class SettingsList extends ImmutableComponent {
  render () {
    return <div className={cx({
      settingsListContainer: true,
      [this.props.className]: !!this.props.className
    })}>
      {
        this.props.dataL10nId
        ? <div className={cx({
          settingsListTitle: true,
          [this.props.titleClassName]: !!this.props.titleClassName
        })} data-l10n-id={this.props.dataL10nId} />
        : null
      }
      <div className={cx({
        settingsList: true,
        [this.props.listClassName]: !!this.props.listClassName
      })}>
        {this.props.children}
      </div>
    </div>
  }
}

class SettingItem extends ImmutableComponent {
  render () {
    return <div className={cx({
      settingItem: true,
      [this.props.itemClassName]: !!this.props.itemClassName
    })}>
      {
        this.props.dataL10nId
          ? <span data-l10n-id={this.props.dataL10nId} />
          : null
      }
      {this.props.children}
    </div>
  }
}

class SettingCheckbox extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }

  onClick (e) {
    if (this.props.disabled) {
      return
    }
    return this.props.onChange ? this.props.onChange(e) : changeSetting(this.props.onChangeSetting, this.props.prefKey, e)
  }

  render () {
    const props = {
      style: this.props.style,
      className: cx({
        settingItem: true,
        [this.props.className]: !!this.props.className
      })
    }

    if (this.props.id) {
      props.id = this.props.id
    }

    const labelClass = cx({
      [css(settingCheckboxStyles.label)]: this.props.small,
      [this.props.labelClassName]: !!this.props.labelClassName

    })

    return <div {...props}>
      <SwitchControl id={this.props.prefKey}
        small={this.props.small}
        disabled={this.props.disabled}
        onClick={this.onClick}
        checkedOn={this.props.checked !== undefined ? this.props.checked : getSetting(this.props.prefKey, this.props.settings)}
        className={this.props.switchClassName}
      />
      <label className={labelClass}
        data-l10n-id={this.props.dataL10nId}
        htmlFor={this.props.prefKey}
      />
      {this.props.options}
    </div>
  }
}

const settingCheckboxStyles = StyleSheet.create({
  label: {
    fontSize: 'smaller'
  }
})

class SiteSettingCheckbox extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }

  onClick (e) {
    if (!this.props.disabled || this.props.hostPattern) {
      const value = !!e.target.value
      value === this.props.defaultValue
        ? aboutActions.removeSiteSetting(this.props.hostPattern,
            this.props.prefKey)
        : aboutActions.changeSiteSetting(this.props.hostPattern,
            this.props.prefKey, value)
    }
  }

  render () {
    return <div style={this.props.style} className={cx({
      settingItem: true,
      siteSettingItem: true,
      [this.props.className]: !!this.props.className
    })}>
      <SwitchControl
        small={this.props.small}
        disabled={this.props.disabled}
        onClick={this.onClick}
        checkedOn={this.props.checked}
        className={this.props.switchClassName}
      />
    </div>
  }
}

module.exports = {
  SettingsList,
  SettingItem,
  SettingCheckbox,
  SiteSettingCheckbox
}
