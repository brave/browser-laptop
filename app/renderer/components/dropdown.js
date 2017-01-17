/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('./styles/global')
const commonStyles = require('./styles/commonStyles')

const caretDownGrey = require('../../extensions/brave/img/caret_down_grey.svg')

class Dropdown extends ImmutableComponent {
  render () {
    const className = css(
      this.props['data-isFormControl'] && commonStyles.formControl,
      styles.dropdown,
      this.props['data-isSettings'] && styles.settings
    )

    return <select className={className} {...this.props}>
      {this.props.children}
    </select>
  }
}

class FormDropdown extends ImmutableComponent {
  render () {
    return <Dropdown data-isFormControl='true' {...this.props} />
  }
}

class SettingDropdown extends ImmutableComponent {
  render () {
    return <FormDropdown data-isSettings='true' {...this.props} />
  }
}

const selectPadding = '0.4em'

const styles = StyleSheet.create({
  'dropdown': {
    background: `url(${caretDownGrey}) calc(100% - ${selectPadding}) 50% / contain no-repeat`,
    backgroundColor: '#fefefe',
    backgroundSize: '12px 12px',
    boxShadow: `-1px 1px 3px -1px ${globalStyles.color.mediumGray}`,
    height: '2rem',
    outline: 'none',
    padding: selectPadding,
    '-webkit-appearance': 'none',
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
  'settings': {
    width: '280px'
  }
})

module.exports = {
  Dropdown,
  FormDropdown,
  SettingDropdown
}
