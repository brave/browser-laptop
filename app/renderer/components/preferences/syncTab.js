/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const Immutable = require('immutable')
const niceware = require('niceware')

// Components
const ModalOverlay = require('../../../../js/components/modalOverlay')
const Button = require('../../../../js/components/button')
const {DeviceNameTextbox} = require('../textbox')

const aboutActions = require('../../../../js/about/aboutActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')

class SyncTab extends ImmutableComponent {
  constructor () {
    super()
    this.toggleSync = this.toggleSync.bind(this)
    this.onSetup = this.setupSyncProfile.bind(this, false)
    this.onRestore = this.restoreSyncProfile.bind(this)
  }

  get isSetup () {
    return this.props.syncData.get('seed') instanceof Immutable.List && this.props.syncData.get('seed').size === 32
  }

  get enabled () {
    return getSetting(settings.SYNC_ENABLED, this.props.settings)
  }

  get setupContent () {
    // displayed before a sync userId has been created
    return <div>
      <Button l10nId='syncStart' className='primaryButton' onClick={this.props.showOverlay.bind(this, 'syncStart')} />
      <Button l10nId='syncAdd' className='whiteButton' onClick={this.props.showOverlay.bind(this, 'syncAdd')} />
    </div>
  }

  get postSetupContent () {
    const {SettingCheckbox} = require('../../../../js/about/preferences')
    return <div><div className='settingsList' id='syncEnableSwitch'>
      <SettingCheckbox dataL10nId='syncEnable' prefKey={settings.SYNC_ENABLED} settings={this.props.settings} onChangeSetting={this.toggleSync} />
    </div>
      <Button l10nId='syncNewDevice' className='whiteButton syncNewDeviceButton' onClick={this.props.showOverlay.bind(this, 'syncNewDevice')} />
    </div>
  }

  get qrcodeContent () {
    if (!this.isSetup) {
      return null
    }
    return this.props.syncQRVisible
      ? <div>
        <div><Button l10nId='syncHideQR' className='whiteButton syncToggleButton' onClick={this.props.hideQR} /></div>
        <img id='syncQR' title='Brave sync QR code' src={this.props.syncData.get('seedQr')} />
      </div>
    : <Button l10nId='syncShowQR' className='whiteButton syncToggleButton' onClick={this.props.showQR} />
  }

  get passphraseContent () {
    if (!this.isSetup) {
      return null
    }
    const seed = Buffer.from(this.props.syncData.get('seed').toJS())
    const passphrase = niceware.bytesToPassphrase(seed)
    const words = [
      passphrase.slice(0, 4).join(' '),
      passphrase.slice(4, 8).join(' '),
      passphrase.slice(8, 12).join(' '),
      passphrase.slice(12, 16).join(' ')
    ]
    return this.props.syncPassphraseVisible
      ? <div>
        <Button l10nId='syncHidePassphrase' className='whiteButton syncToggleButton' onClick={this.props.hidePassphrase} />
        <pre id='syncPassphrase'>{words.join('\n')}</pre>
      </div>
      : <Button l10nId='syncShowPassphrase' className='whiteButton syncToggleButton' onClick={this.props.showPassphrase} />
  }

  get overlayContent () {
    return <div className='syncOverlay'>
      <div>
        <ol>
          <li data-l10n-id='syncNewDevice1' />
          <li data-l10n-id='syncNewDevice2' />
          {this.qrcodeContent}
          <li data-l10n-id='syncNewDevice3' />
          {this.passphraseContent}
        </ol>
      </div>
    </div>
  }

  get deviceNameInputContent () {
    const osName = {
      darwin: 'Mac',
      freebsd: 'FreeBSD',
      linux: 'Linux',
      win32: 'Windows'
    }
    const placeholder = process.platform
      ? [(osName[process.platform] || process.platform), 'Laptop'].join(' ')
      : getSetting(settings.SYNC_DEVICE_NAME, this.props.settings)
    return <div>
      <span data-l10n-id='syncDeviceName' />
      <DeviceNameTextbox spellCheck='false'
        ref={(node) => { this.deviceNameInput = node }}
        data-isDeviceName
        placeholder={placeholder} />
    </div>
  }

  get addOverlayContent () {
    return <div className='syncOverlay'>
      <p data-l10n-id='syncEnterPassphrase' />
      <textarea spellCheck='false'
        ref={(node) => { this.passphraseInput = node }}
        className='form-control' />
      <div>{this.deviceNameInputContent}</div>
      <Button l10nId='syncCreate' className='primaryButton'
        onClick={this.onRestore}
        disabled={!!this.passphraseInput} />
    </div>
  }

  get startOverlayContent () {
    return <div className='syncOverlay'>
      {this.deviceNameInputContent}
      <div>
        <Button l10nId='syncCreate' className='primaryButton' onClick={this.onSetup} />
      </div>
    </div>
  }

  setupSyncProfile (isRestoring) {
    if (this.deviceNameInput.value) {
      this.props.onChangeSetting(settings.SYNC_DEVICE_NAME, this.deviceNameInput.value)
    }
    this.toggleSync(settings.SYNC_ENABLED, true, isRestoring)
    this.props.hideOverlay('syncStart')
  }

  toggleSync (key, value, isRestoring = false) {
    this.props.onChangeSetting(key, value)
    if (!isRestoring) {
      aboutActions.reloadSyncExtension()
    }
  }

  restoreSyncProfile () {
    if (this.passphraseInput.value) {
      let text = this.passphraseInput.value.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
      let inputCode = ''
      try {
        inputCode = window.niceware.passphraseToBytes(text.split(' '))
      } catch (e) {
        console.log('Could not convert niceware passphrase', e)
      }
      if (inputCode && inputCode.length === 32) {
        // QR code and device ID are set after sync restarts
        aboutActions.saveSyncInitData(Array.from(inputCode))
        this.setupSyncProfile(true)
        return
      }
    }
    window.alert('Invalid input code; please try again or create a new profile.')
  }

  render () {
    const {SettingsList, SettingCheckbox} = require('../../../../js/about/preferences')
    return <div id='syncContainer'>
      {
      this.isSetup && this.props.syncNewDeviceOverlayVisible
        ? <ModalOverlay title={'syncNewDevice'} content={this.overlayContent} onHide={this.props.hideOverlay.bind(this, 'syncNewDevice')} />
        : null
      }
      {
      !this.isSetup && this.props.syncStartOverlayVisible
        ? <ModalOverlay title={'syncStart'} content={this.startOverlayContent} onHide={this.props.hideOverlay.bind(this, 'syncStart')} />
        : null
      }
      {
      !this.isSetup && this.props.syncAddOverlayVisible
        ? <ModalOverlay title={'syncAdd'} content={this.addOverlayContent} onHide={this.props.hideOverlay.bind(this, 'syncAdd')} />
        : null
      }
      <div className='sectionTitle' data-l10n-id='syncTitle' />
      <div className='settingsListContainer'>
        <span className='settingsListTitle syncTitleMessage' data-l10n-id='syncTitleMessage' />
        <a href='https://github.com/brave/sync/wiki/Design' target='_blank'>
          <span className='fa fa-question-circle fundsFAQ' />
        </a>
        {
          this.isSetup
            ? this.postSetupContent
            : this.setupContent
        }
      </div>
      {
        this.isSetup && this.enabled
          ? <div id='syncData'><div className='sectionTitle' data-l10n-id='syncData' />
            <SettingsList dataL10nId='syncDataMessage'>
              <SettingCheckbox dataL10nId='syncBookmarks' prefKey={settings.SYNC_TYPE_BOOKMARK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
              <SettingCheckbox dataL10nId='syncSiteSettings' prefKey={settings.SYNC_TYPE_SITE_SETTING} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
              <SettingCheckbox dataL10nId='syncHistory' prefKey={settings.SYNC_TYPE_HISTORY} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
            </SettingsList>
          </div>
          : null
      }
    </div>
  }
}

module.exports = SyncTab
