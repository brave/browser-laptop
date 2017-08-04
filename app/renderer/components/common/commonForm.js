/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

const {FormDropdown} = require('./dropdown')
const {FormTextbox} = require('./textbox')

/* See about:styles for templates */

class CommonForm extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.flyoutDialog,
      styles.commonForm
    )} {...this.props} />
  }
}

class CommonFormSmall extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.flyoutDialog,
      styles.commonForm,
      styles.commonFormSmall
    )} {...this.props} />
  }
}

class CommonFormMedium extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.flyoutDialog,
      styles.commonForm,
      styles.commonFormMedium,
    )} {...this.props} />
  }
}

class CommonFormLarge extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.flyoutDialog,
      styles.commonForm,
      styles.commonFormLarge
    )} {...this.props} />
  }
}

class CommonFormBookmarkHanger extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.flyoutDialog,
      styles.commonForm,
      styles.commonFormBookmarkHanger
    )} {...this.props} />
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

class CommonFormClickable extends ImmutableComponent {
  render () {
    return <div className={css(styles.commonFormClickable)} {...this.props} />
  }
}

class CommonFormSection extends ImmutableComponent {
  render () {
    return <div className={css(styles.commonFormSection)} {...this.props} />
  }
}

class CommonFormTitle extends ImmutableComponent {
  render () {
    return <div className={css(
      styles.commonFormSection,
      styles.commonFormTitle
    )} {...this.props} />
  }
}

class CommonFormSubSection extends ImmutableComponent {
  render () {
    return <div className={css(
      styles.commonFormSection,
      styles.commonFormSubSection
    )} {...this.props} />
  }
}

class CommonFormButtonWrapper extends ImmutableComponent {
  render () {
    return <div className={css(
      styles.commonFormSection,
      styles.flexJustifyEnd
    )} {...this.props} />
  }
}

class CommonFormBottomWrapper extends ImmutableComponent {
  render () {
    return <div className={css(
      styles.commonFormSection,
      styles.commonFormBottomWrapper
    )} {...this.props} />
  }
}

const styles = StyleSheet.create({
  flexJustifyEnd: {
    display: 'flex',
    justifyContent: 'flex-end'
  },

  commonForm: {
    background: globalStyles.color.commonFormBackgroundColor,
    color: globalStyles.color.commonTextColor,
    padding: 0,
    top: '40px',
    cursor: 'default',
    width: '100%',
    maxWidth: globalStyles.spacing.dialogWidth,
    minWidth: '310px',
    height: 'auto',
    maxHeight: '100vh', // #8634: commonStyles.flyoutDialog,
    userSelect: 'none'

    // Need a general solution
    // See: #7930
    // overflowY: 'auto',
    // maxHeight: '100%'
  },

  commonFormSmall: {
    maxWidth: globalStyles.spacing.dialogSmallWidth
  },

  commonFormMedium: {
    maxWidth: globalStyles.spacing.dialogMediumWidth
  },

  commonFormLarge: {
    maxWidth: globalStyles.spacing.dialogLargeWidth
  },

  commonFormBookmarkHanger: {
    maxWidth: globalStyles.spacing.bookmarkHangerMaxWidth,
    height: 'initial', // #8634

    // Cancel the inherited value from navigator__menuBarAndNavigationBar on navigator.js, which is 'nowrap'.
    whiteSpace: 'normal'
  },

  commonFormClickable: {
    color: '#5b5b5b',

    ':hover': {
      color: '#000'
    }
  },

  commonFormTitle: {
    color: globalStyles.color.braveOrange,
    fontSize: '1.2em'
  },

  commonFormSection: {
    // PR #7985
    margin: `${globalStyles.spacing.dialogInsideMargin} 30px`
  },

  commonFormSubSection: {
    margin: `0 0 ${globalStyles.spacing.dialogInsideMargin} ${globalStyles.spacing.dialogInsideMargin}`
  },

  commonFormBottomWrapper: {
    margin: 0,
    padding: `${globalStyles.spacing.dialogInsideMargin} 30px`,
    background: globalStyles.color.commonFormBottomWrapperBackground,
    borderRadius: `0 0 ${globalStyles.radius.borderRadius} ${globalStyles.radius.borderRadius}`
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
  CommonFormSmall,
  CommonFormMedium,
  CommonFormLarge,
  CommonFormBookmarkHanger,
  CommonFormDropdown,
  CommonFormTextbox,
  CommonFormClickable,
  CommonFormSection,
  CommonFormTitle,
  CommonFormSubSection,
  CommonFormButtonWrapper,
  CommonFormBottomWrapper,
  commonFormStyles
}
