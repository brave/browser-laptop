/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

const FlyoutDialog = require('./flyoutDialog')
const {FormDropdown} = require('./dropdown')
const {FormTextbox} = require('./textbox')

/* See about:styles for templates */

class CommonForm extends ImmutableComponent {
  render () {
    return <FlyoutDialog custom={[
      styles.commonForm,
      this.props.small && styles.commonForm_small,
      this.props.medium && styles.commonForm_medium,
      this.props.large && styles.commonForm_large,
      this.props.custom
    ]}
      onClick={this.props.onClick}
      testId={this.props.testId}
    >
      {this.props.children}
    </FlyoutDialog>
  }
}

class CommonFormHanger extends ImmutableComponent {
  render () {
    return <CommonForm custom={[
      styles.commonForm_hanger,
      this.props.bookmark && styles.commonForm_hanger_bookmark,
      this.props.custom
    ]}>
      {this.props.children}
    </CommonForm>
  }
}

class CommonFormDropdown extends ImmutableComponent {
  render () {
    return <FormDropdown data-isCommonForm='true' {...this.props} />
  }
}

class CommonFormTextbox extends ImmutableComponent {
  render () {
    return <FormTextbox data-isCommonForm='true' {...this.props} />
  }
}

class CommonFormSection extends ImmutableComponent {
  render () {
    return <div className={css(
      styles.commonForm__section,
      this.props.subSection && styles.commonForm__section_sub,
      this.props.title && styles.commonForm__section_title,
      this.props.buttons && styles.commonForm__section_buttons,
      this.props.bottom && styles.commonForm__section_bottom,
      this.props.custom
    )}
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
    >
      {this.props.children}
    </div>
  }
}

class CommonFormClickable extends ImmutableComponent {
  render () {
    return <div className={css(
      styles.commonForm__clickable,
      this.props.custom
    )}
      data-l10n-id={this.props.l10nId}
      onClick={this.props.onClick}
    >
      {this.props.children}
    </div>
  }
}

const styles = StyleSheet.create({
  commonForm: {
    background: globalStyles.color.modalVeryLightGray,
    color: globalStyles.color.commonTextColor,
    padding: 0,
    top: '40px',
    cursor: 'default',
    width: '100%',
    maxWidth: globalStyles.spacing.dialogWidth,
    minWidth: '310px',
    height: 'auto',
    userSelect: 'none',

    // #8634: commonStyles.flyoutDialog,
    maxHeight: '100vh'

    // Need a general solution
    // See: #7930
    // overflowY: 'auto',
    // maxHeight: '100%'
  },

  commonForm_small: {
    maxWidth: globalStyles.spacing.dialogSmallWidth
  },

  commonForm_medium: {
    maxWidth: globalStyles.spacing.dialogMediumWidth
  },

  commonForm_large: {
    maxWidth: globalStyles.spacing.dialogLargeWidth
  },

  commonForm_hanger: {
    // Cancel the inherited value from .navbarMenubarFlexContainer, which is 'nowrap'.
    whiteSpace: 'normal',

    // #8634
    height: 'initial'
  },

  commonForm_hanger_bookmark: {
    maxWidth: globalStyles.spacing.bookmarkHangerMaxWidth
  },

  commonForm__section: {
    // PR #7985
    margin: `${globalStyles.spacing.dialogInsideMargin} 30px`
  },

  commonForm__section_sub: {
    margin: `0 0 ${globalStyles.spacing.dialogInsideMargin} ${globalStyles.spacing.dialogInsideMargin}`
  },

  commonForm__section_title: {
    color: globalStyles.color.braveOrange,
    fontSize: '1.2em'
  },

  commonForm__section_buttons: {
    display: 'flex',
    justifyContent: 'flex-end'
  },

  commonForm__section_bottom: {
    margin: 0,
    padding: `${globalStyles.spacing.dialogInsideMargin} 30px`,
    background: globalStyles.color.commonFormBottomWrapperBackground,
    borderRadius: `0 0 ${globalStyles.radius.borderRadius} ${globalStyles.radius.borderRadius}`
  },

  commonForm__clickable: {
    color: '#5b5b5b',

    ':hover': {
      color: '#000'
    }
  }
})

const commonFormStyles = StyleSheet.create({
  sectionWrapper: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  inputWrapper: {
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-around'
  },
  inputWrapper__label: {
    marginRight: `calc(${globalStyles.spacing.dialogInsideMargin} / 2)`
  },
  inputWrapper__input: {
    flexGrow: 1
  },

  input__bottomRow: {
    marginTop: `calc(${globalStyles.spacing.dialogInsideMargin} / 3)`
  },
  input__marginRow: {
    marginTop: `calc(${globalStyles.spacing.dialogInsideMargin} / 3)`
  },
  input__box: {
    fontSize: globalStyles.fontSize.flyoutDialog
  }
})

module.exports = {
  CommonForm,
  CommonFormHanger,
  CommonFormDropdown,
  CommonFormTextbox,
  CommonFormSection,
  CommonFormClickable,
  commonFormStyles
}
