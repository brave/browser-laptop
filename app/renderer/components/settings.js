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
const settings = require('../../../js/constants/settings')

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
    if (this.props.forPassword) {
      // You can only have one active password manager
      // if user decide to disable all,
      // switch back password to unmanaged (null)
      e.target.value
        ? aboutActions.changeSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.prefKey)
        : aboutActions.changeSetting(settings.ACTIVE_PASSWORD_MANAGER, void (0))
    }
    if (this.props.disabled) {
      return
    }
    return this.props.onChange
      ? this.props.onChange(e)
      : changeSetting(this.props.onChangeSetting, this.props.prefKey, e)
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
        data-l10n-args={this.props.dataL10nArgs}
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

class SettingItemIcon extends ImmutableComponent {
  render () {
    const bg = StyleSheet.create({
      Icon: {
        '-webkit-mask-image': `url(${this.props.icon})`
      }
    })

    return <div className='settingItem'>
      {
        this.props.dataL10nId
          ? <span data-l10n-id={this.props.dataL10nId} />
          : null
      }
      <div>
        {
          this.props.position === 'left'
            ? <span className={css(bg.Icon, styles.icon, styles.iconLeft)} data-icon-position='left' onClick={this.props.clickAction} />
            : null
        }
        <div className={css(styles.child)}>
          {this.props.children}
        </div>
        {
          this.props.position === 'right'
            ? <span className={css(bg.Icon, styles.icon, styles.iconRight)} data-icon-position='right' onClick={this.props.clickAction} />
            : null
        }
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  icon: {
    backgroundColor: '#5a5a5a',
    height: '16px',
    width: '16px',
    display: 'inline-block',
    verticalAlign: 'top',
    padding: '0px',
    '-webkit-mask-repeat': 'no-repeat',

    ':hover': {
      backgroundColor: '#000'
    }
  },

  iconLeft: {
    margin: '8px 10px 0 0'
  },

  iconRight: {
    margin: '8px 0 0 10px'
  },

  child: {
    display: 'inline-block'
  }
})

module.exports = {
  SettingsList,
  SettingItem,
  SettingCheckbox,
  SiteSettingCheckbox,
  SettingItemIcon
}
