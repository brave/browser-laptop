/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import Config from '../constants/config.js'

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

class AboutPreferences extends ImmutableComponent {
  updateSetting (key, e) {
    // TODO: Need Brian J's API for this
    /*
    dispatch({
      action: messages.CHANGE_SETTING,
      key,
      value: e.target.value
    })
    */
  }

  get language () {
    // TODO get this from appstate config
    return Config.defaultLocale
  }

  render () {
    return <div>
      <h1 data-l10n-id='preferences'/>
      <h2 data-l10n-id='languages'/>
      <select value={this.language}
          onChange={this.updateSetting.bind(this, 'language.current')} >
        <option value='en-US'>English (US)</option>
        <option value='fr'>French</option>
        <option value='es'>Spanish</option>
        <option value='qps-ploc'>Accented English</option>
        <option value='qps-plocm'>Mirrored English</option>
      </select>
    </div>
  }
}

module.exports = <AboutPreferences/>
