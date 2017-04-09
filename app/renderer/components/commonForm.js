/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('./styles/global')
const commonStyles = require('./styles/commonStyles')

const {FormDropdown} = require('./dropdown')

class CommonForm extends ImmutableComponent {
  render () {
    return <div className={css(commonStyles.flyoutDialog, styles.CommonForm)} {...this.props} />
  }
}

class CommonFormDropdown extends ImmutableComponent {
  render () {
    return <FormDropdown data-isCommonForm='true' {...this.props} />
  }
}

class CommonFormClickable extends ImmutableComponent {
  render () {
    return <div className={css(styles.CommonFormClickable)} {...this.props} />
  }
}

class CommonFormSection extends ImmutableComponent {
  render () {
    return <div className={css(styles.CommonFormSection)} {...this.props} />
  }
}

class CommonFormTitle extends ImmutableComponent {
  render () {
    return <div className={css(styles.CommonFormSection, styles.CommonFormTitle)} {...this.props} />
  }
}

class CommonFormSubSection extends ImmutableComponent {
  render () {
    return <div className={css(styles.CommonFormSection, styles.CommonFormSubSection)} {...this.props} />
  }
}

class CommonFormButtonWrapper extends ImmutableComponent {
  render () {
    return <div className={css(styles.CommonFormSection, styles.flexJustifyEnd)} {...this.props} />
  }
}

class CommonFormBottomWrapper extends ImmutableComponent {
  render () {
    return <div className={css(styles.CommonFormSection, styles.CommonFormBottomWrapper)} {...this.props} />
  }
}

const styles = StyleSheet.create({
  flexJustifyEnd: {
    display: 'flex',
    justifyContent: 'flex-end'
  },

  CommonForm: {
    background: globalStyles.color.commonFormBackgroundColor,
    color: '#3b3b3b',
    padding: 0,
    top: '40px',
    cursor: 'default',
    maxWidth: '422px',
    userSelect: 'none'

    // Need a general solution
    // See: #7930
    // overflowY: 'auto',
    // maxHeight: '100%'
  },

  CommonFormClickable: {
    color: '#5b5b5b',

    ':hover': {
      color: '#000'
    }
  },

  CommonFormTitle: {
    color: globalStyles.color.braveOrange,
    fontSize: '1.2em'
  },

  CommonFormSection: {
    // PR #7985
    margin: `${globalStyles.spacing.dialogInsideMargin} 30px`
  },

  CommonFormSubSection: {
    margin: `0 0 0 ${globalStyles.spacing.dialogInsideMargin}`
  },

  CommonFormBottomWrapper: {
    margin: 0,
    padding: `${globalStyles.spacing.dialogInsideMargin} 30px`,
    background: globalStyles.color.commonFormBottomWrapperBackground
  }
})

module.exports = {
  CommonForm,
  CommonFormDropdown,
  CommonFormClickable,
  CommonFormSection,
  CommonFormTitle,
  CommonFormSubSection,
  CommonFormButtonWrapper,
  CommonFormBottomWrapper
}
