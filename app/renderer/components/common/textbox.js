/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')

const ClipboardButton = require('../common/clipboardButton')
const appActions = require('../../../../js/actions/appActions')

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
      this.props.customClass && this.props.customClass
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

class WordCountTextArea extends React.Component {
  constructor () {
    super()
    this.handleCopyToClipboard = this.handleCopyToClipboard.bind(this)
    this.handleOnChange = this.handleOnChange.bind(this)
    this.state = { wordCount: 0 }
  }

  handleOnChange (e) {
    let wordCount = 0

    if (e.target.value.length > 0) {
      wordCount = e.target.value.trim().replace(/\s+/gi, ' ').split(' ').length
    }

    this.setState({wordCount})

    if (this.props.onChangeText) {
      this.props.onChangeText()
    }
  }

  handleCopyToClipboard () {
    if (!this.textAreaBox) {
      return
    }
    appActions.clipboardTextCopied(this.textAreaBox.value)
  }

  render () {
    return (
      <div className={css(styles.wordCountTextArea__main)}>
        <textarea className={css(
          commonStyles.formControl,
          commonStyles.textArea,
          styles.wordCountTextArea__body
        )}
          spellCheck='false'
          disabled={this.props.disabled}
          autoFocus={this.props.autoFocus}
          value={this.props.value}
          ref={(node) => { this.textAreaBox = node }}
          onChange={this.handleOnChange}
        />
        <div className={css(styles.wordCountTextArea__footer)}>
          <div>
            <span data-l10n-id='wordCount' />&nbsp;{this.state.wordCount}
          </div>
          <ClipboardButton
            disabled={this.props.clipboardDisabled}
            leftTooltip
            copyAction={this.handleCopyToClipboard}
          />
        </div>
      </div>
    )
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
  },

  wordCountTextArea__main: {
    background: 'rgba(0, 0, 0, 0.1)',
    border: '1px solid #000',
    borderRadius: '4px',
    padding: '2px',
    width: '100%'
  },

  wordCountTextArea__body: {
    width: '100%',
    height: '120px',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    resize: 'none',
    fontSize: '18px'
  },

  wordCountTextArea__footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: '4px',
    borderBottomRightRadius: '4px',
    padding: '5px 10px',
    fontSize: '13px',
    fontWeight: 'bold'
  }
})

module.exports = {
  Textbox,
  FormTextbox,
  GroupedFormTextbox,
  SettingTextbox,
  PromptTextBox,
  TextArea,
  DefaultTextArea,
  WordCountTextArea
}
