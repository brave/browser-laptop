/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')

class SettingsList extends ImmutableComponent {
  render () {
    return <div className='settingsListContainer'>
      {
        this.props.dataL10nId
        ? <div className='settingsListTitle' data-l10n-id={this.props.dataL10nId} />
        : null
      }
      <div className='settingsList'>
        {this.props.children}
      </div>
    </div>
  }
}

class SettingItem extends ImmutableComponent {
  render () {
    return <div className='settingItem'>
      {
        this.props.dataL10nId
          ? <span data-l10n-id={this.props.dataL10nId} />
          : null
      }
      {this.props.children}
    </div>
  }
}

module.exports = {
  SettingsList,
  SettingItem
}
