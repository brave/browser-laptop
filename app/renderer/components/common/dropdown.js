/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

const caretDownGrey = require('../../../extensions/brave/img/caret_down_grey.svg')

class Dropdown extends ImmutableComponent {
  render () {
    const className = css(
      this.props['data-isFormControl'] && commonStyles.formControl,
      styles.dropdown,
      this.props['data-isCommonForm'] && styles.commonForm,
      this.props['data-isFullWidth'] && styles.fullWidth,
      this.props['data-isSettings'] && styles.settings,
      this.props['data-isPanel'] && styles.settings_panel,
      this.props['data-isBraveryPanel'] && styles.braveryPanel
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

class PanelDropdown extends ImmutableComponent {
  render () {
    return <FormDropdown data-isPanel {...this.props} />
  }
}

class BraveryPanelDropdown extends ImmutableComponent {
  render () {
    return <FormDropdown data-isBraveryPanel {...this.props} />
  }
}

const selectPadding = '0.4em'

const styles = StyleSheet.create({
  dropdown: {
    background: `url(${caretDownGrey}) calc(100% - ${selectPadding}) 50% / contain no-repeat`,
    backgroundColor: '#fbfbfb',
    backgroundSize: '12px 12px',
    boxShadow: `0px 2px 8px -5px ${globalStyles.color.black100}`,
    height: '2rem',
    outline: 'none',
    // right padding is larger, to account for the down arrow SVG
    padding: `${selectPadding} 2em ${selectPadding} ${selectPadding}`,
    '-webkit-appearance': 'none',
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

  commonForm: {
    backgroundColor: '#fff',
    fontSize: globalStyles.fontSize.flyoutDialog
  },

  fullWidth: {
    width: '100%'
  },

  settings: {
    width: '280px'
  },

  settings_panel: {
    width: globalStyles.button.panel.width
  },

  braveryPanel: {
    fontSize: '13px',
    width: '100%'
  }
})

module.exports = {
  Dropdown,
  FormDropdown,
  SettingDropdown,
  PanelDropdown,
  BraveryPanelDropdown
}
