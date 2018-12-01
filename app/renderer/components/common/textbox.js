/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')

const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

// Textbox
class Textbox extends ImmutableComponent {
  render () {
    const className = css(
      this.props['data-isFormControl'] && commonStyles.formControl,
      styles.textbox,
      (this.props.readonly || this.props.readOnly) ? styles.readOnly : styles.outlineable,
      this.props['data-isCommonForm'] && commonStyles.isCommonForm,
      this.props['data-isSettings'] && styles.isSettings,
      this.props['data-isPrompt'] && styles.isPrompt,
      this.props.customClass
    )

    const props = Object.assign({}, this.props)
    const ref = this.props.inputRef
    delete props.customClass
    delete props.inputRef

    return <input type='text' className={className} {...props} ref={ref} />
  }
}

class FormTextbox extends ImmutableComponent {
  render () {
    return <Textbox data-isFormControl='true' {...this.props} />
  }
}

class GroupedFormTextbox extends ImmutableComponent {
  render () {
    return (
      <div className={css(styles.groupedFormTextBox)}>
        <input
          data-l10n-id={this.props.l10nId}
          ref={this.props.inputRef}
          type={this.props.type}
          readOnly={this.props.readOnly}
          defaultValue={this.props.value}
          className={css(
            styles.groupedFormTextBox__firstGroupedItem,
            this.props.custom
          )}
        />
        <div className={css(styles.groupedFormTextBox__lastGroupedItem)}>
          {this.props.groupedItem}
        </div>
      </div>
    )
  }
}

class SettingTextbox extends ImmutableComponent {
  render () {
    return <FormTextbox data-isSettings='true' {...this.props} />
  }
}

class PromptTextBox extends ImmutableComponent {
  render () {
    return <FormTextbox data-isPrompt='true' {...this.props} />
  }
}

// TextArea
class TextArea extends ImmutableComponent {
  render () {
    const className = css(
      styles.textArea,
      this.props['data-isDefault'] && styles.isDefault
    )

    return <textarea className={className} {...this.props} />
  }
}

class DefaultTextArea extends ImmutableComponent {
  render () {
    return <TextArea data-isDefault='true' {...this.props} />
  }
}

const styles = StyleSheet.create({
  // Textbox
  textbox: {
    boxSizing: 'border-box',
    width: 'auto'
  },
  outlineable: {
    ':focus': {
      outlineColor: globalStyles.color.statsBlue,
      outlineOffset: '-4px',
      outlineStyle: 'solid',
      outlineWidth: '1px'
    }
  },
  isSettings: {
    width: '280px'
  },
  isPrompt: {
    width: '100%',
    marginBottom: '20px'
  },
  readOnly: {
    background: globalStyles.color.lightGray,
    boxShadow: 'none',
    outline: 'none'
  },
  recoveryKeys: {
    marginBottom: '20px'
  },

  // TextArea
  textArea: {
    padding: '5px'
  },
  isDefault: {
    fontSize: globalStyles.spacing.textAreaFontSize  // Issue #6851
  },

  groupedFormTextBox: {
    display: 'flex',
    flex: 1
  },

  groupedFormTextBox__firstGroupedItem: {
    boxSizing: 'border-box',
    background: '#fff',
    borderTopLeftRadius: '4px',
    borderBottomLeftRadius: '4px',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.1)',
    display: 'block',
    border: 'solid 1px rgba(0, 0, 0, 0.2)',
    fontSize: '14.5px',
    height: '2.25em',
    outline: 'none',
    padding: '0.4em',
    width: '100%',
    color: 'rgb(68, 68, 68)'
  },

  groupedFormTextBox__lastGroupedItem: {
    border: 'solid 1px rgba(0, 0, 0, 0.2)',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: '4px',
    borderBottomRightRadius: '4px',
    width: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

module.exports = {
  Textbox,
  FormTextbox,
  GroupedFormTextbox,
  SettingTextbox,
  PromptTextBox,
  TextArea,
  DefaultTextArea
}
