/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('./styles/global')
const commonStyles = require('./styles/commonStyles')

class Textbox extends ImmutableComponent {
  render () {
    const className = css(
      this.props['data-isFormControl'] && commonStyles.formControl,
      styles.textbox,
      this.props['data-isSettings'] && styles.isSettings,
      (this.props.readonly || this.props.readOnly) ? styles.readOnly : styles.outlineable,
      this.props['data-isRecoveryKeyTextbox'] && styles.recoveryKeys
    )

    return <input type='text' className={className} {...this.props} />
  }
}

class FormTextbox extends ImmutableComponent {
  render () {
    return <Textbox data-isFormControl='true' {...this.props} />
  }
}

class SettingTextbox extends ImmutableComponent {
  render () {
    return <FormTextbox data-isSettings='true' {...this.props} />
  }
}

class RecoveryKeyTextbox extends ImmutableComponent {
  render () {
    return <SettingTextbox data-isRecoveryKey='true' {...this.props} />
  }
}

const styles = StyleSheet.create({
  'textbox': {
    boxSizing: 'border-box',
    width: 'auto'
  },
  'outlineable': {
    ':focus': {
      outlineColor: globalStyles.color.statsBlue,
      outlineOffset: '-4px',
      outlineStyle: 'solid',
      outlineWidth: '1px'
    }
  },
  'isSettings': {
    width: '280px'
  },
  'readOnly': {
    background: globalStyles.color.veryLightGray,
    boxShadow: 'none',
    outline: 'none'
  },
  'recoveryKeys': {
    marginBottom: '20px'
  }
})

module.exports = {
  Textbox,
  FormTextbox,
  SettingTextbox,
  RecoveryKeyTextbox
}
