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
const {SettingsList, SettingItem, SettingCheckbox} = require('../settings')

const aboutActions = require('../../../../js/about/aboutActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')

class SyncTab extends ImmutableComponent {
  constructor () {
    super()
    this.toggleSync = this.toggleSync.bind(this)
    this.onSetup = this.setupSyncProfile.bind(this, false)
    this.onReset = this.reset.bind(this)
    this.onRestore = this.restoreSyncProfile.bind(this)
    this.enableRestore = this.enableRestore.bind(this)
  }

  get setupError () {
    return this.props.syncData.get('setupError')
  }

  get isSetup () {
    return !this.setupError && this.props.syncData.get('seed') instanceof Immutable.List && this.props.syncData.get('seed').size === 32
  }

  get enabled () {
    return getSetting(settings.SYNC_ENABLED, this.props.settings)
  }

  get errorContent () {
    return <div className='errorContainer'>
      <div className='setupError'>{this.setupError}</div>
      <Button l10nId='syncRetryButton' className='primaryButton' onClick={this.retry.bind(this)} />
    </div>
  }

  get clearDataContent () {
    return <div className='syncClearData'>
      <div className='sectionTitle' data-l10n-id='syncClearData' />
      {
        this.enabled
          ? <button data-l10n-id='syncResetButton' className='linkButton' onClick={this.props.showOverlay.bind(this, 'syncReset')} />
          : <div>
            <button disabled data-l10n-id='syncResetButton' className='linkButton' />
            <div data-l10n-id='syncResetDataDisabled' className='settingsListTitle' />
          </div>
      }
    </div>
  }

  get setupContent () {
    if (this.setupError) {
      return null
    }
    // displayed before a sync userId has been created
    return <div className='setupContent'>
      <Button l10nId='syncStart' className='primaryButton' onClick={this.props.showOverlay.bind(this, 'syncStart')} />
      <Button l10nId='syncAdd' className='whiteButton' onClick={this.props.showOverlay.bind(this, 'syncAdd')} />
    </div>
  }

  get postSetupContent () {
    return <SettingsList>
      <div className='device'>
        <SettingCheckbox dataL10nId='syncEnable' id='syncEnableSwitch' prefKey={settings.SYNC_ENABLED} settings={this.props.settings} onChangeSetting={this.toggleSync} />
        <div>
          <span className='syncDeviceLabel' data-l10n-id='syncDeviceName' />
          <div className='deviceName'>
            {getSetting(settings.SYNC_DEVICE_NAME, this.props.settings)}
          </div>
        </div>
      </div>
      <SettingItem>
        <Button l10nId='syncNewDevice' className='whiteButton' onClick={this.props.showOverlay.bind(this, 'syncNewDevice')} />
      </SettingItem>
    </SettingsList>
  }

  get qrcodeContent () {
    if (!this.isSetup) {
      return null
    }
    return this.props.syncQRVisible
      ? <div>
        <div><Button l10nId='syncHideQR' className='whiteButton wideButton syncToggleButton' onClick={this.props.hideQR} /></div>
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
        <Button l10nId='syncHidePassphrase' className='whiteButton wideButton syncToggleButton' onClick={this.props.hidePassphrase} />
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

  get defaultDeviceName () {
    const osName = {
      darwin: 'Mac',
      freebsd: 'FreeBSD',
      linux: 'Linux',
      win32: 'Windows'
    }
    return process.platform
      ? [(osName[process.platform] || process.platform), 'Laptop'].join(' ')
      : getSetting(settings.SYNC_DEVICE_NAME, this.props.settings)
  }

  get deviceNameInputContent () {
    return <SettingItem>
      <span data-l10n-id='syncDeviceNameInput' />
      <input className='deviceNameInput formControl' spellCheck='false'
        ref={(node) => { this.deviceNameInput = node }}
        placeholder={this.defaultDeviceName} />
    </SettingItem>
  }

  get addOverlayContent () {
    return <div className='syncOverlay'>
      <SettingsList>
        <SettingItem>
          <span data-l10n-id='syncEnterPassphrase' />
          <textarea spellCheck='false'
            ref={(node) => { this.passphraseInput = node }}
            onChange={this.enableRestore}
            className='form-control' />
        </SettingItem>
        {this.deviceNameInputContent}
      </SettingsList>
    </div>
  }

  get addOverlayFooter () {
    return <Button l10nId='syncCreate' className='primaryButton'
      onClick={this.onRestore}
      disabled={this.props.syncRestoreEnabled === false} />
  }

  get resetOverlayContent () {
    return <div className='syncOverlay'>
      <ul>
        <li data-l10n-id='syncResetMessageWhat' />
        <li data-l10n-id='syncResetMessageWhatNot' />
        <li data-l10n-id='syncResetMessageOtherDevices' />
      </ul>
    </div>
  }

  get resetOverlayFooter () {
    return <div className='panel'>
      <Button l10nId='syncReset' className='primaryButton' onClick={this.onReset} />
      <Button l10nId='cancel' className='whiteButton' onClick={this.props.hideOverlay.bind(this, 'syncReset')} />
    </div>
  }

  get startOverlayContent () {
    return <div className='syncOverlay'>
      <SettingsList>
        {this.deviceNameInputContent}
      </SettingsList>
    </div>
  }

  get startOverlayFooter () {
    return <div className='panel'>
      <Button l10nId='syncCreate' className='primaryButton' onClick={this.onSetup} />
    </div>
  }

  enableRestore (e) {
    if (this.props.syncRestoreEnabled === false && e.target.value) {
      this.props.enableSyncRestore(true)
    } else if (this.props.syncRestoreEnabled && !e.target.value) {
      this.props.enableSyncRestore(false)
    }
  }

  reset () {
    const locale = require('../../../../js/l10n')
    const msg = locale.translation('areYouSure')
    if (window.confirm(msg)) {
      aboutActions.resetSync()
      this.props.hideOverlay('syncReset')
    }
  }

  retry () {
    aboutActions.reloadSyncExtension()
    window.location.reload()
  }

  setupSyncProfile (isRestoring) {
    this.props.onChangeSetting(settings.SYNC_DEVICE_NAME,
      this.deviceNameInput.value || this.defaultDeviceName)
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
    return <div className='syncContainer'>
      {
      this.isSetup && this.props.syncNewDeviceOverlayVisible
        ? <ModalOverlay title={'syncNewDevice'} content={this.overlayContent} onHide={this.props.hideOverlay.bind(this, 'syncNewDevice')} />
        : null
      }
      {
      !this.isSetup && this.props.syncStartOverlayVisible
        ? <ModalOverlay title={'syncStart'} content={this.startOverlayContent} footer={this.startOverlayFooter} onHide={this.props.hideOverlay.bind(this, 'syncStart')} />
        : null
      }
      {
      !this.isSetup && this.props.syncAddOverlayVisible
        ? <ModalOverlay title={'syncAdd'} content={this.addOverlayContent} footer={this.addOverlayFooter} onHide={this.props.hideOverlay.bind(this, 'syncAdd')} />
        : null
      }
      {
      this.isSetup && this.props.syncResetOverlayVisible
        ? <ModalOverlay title={'syncReset'} content={this.resetOverlayContent} footer={this.resetOverlayFooter} onHide={this.props.hideOverlay.bind(this, 'syncReset')} />
        : null
      }
      <div className='sectionTitleWrapper'>
        <span className='sectionTitle' data-l10n-id='syncTitle' />
        <span className='sectionSubTitle'>beta</span>
      </div>
      <div className='settingsListContainer'>
        <span className='settingsListTitle syncTitleMessage' data-l10n-id='syncTitleMessage' />
        <a href='https://github.com/brave/sync/wiki/Design' target='_blank'>
          <span className='fa fa-question-circle' />
        </a>
        <div className='settingsListTitle syncBetaMessage' data-l10n-id='syncBetaMessage' />
        {
          this.setupError
          ? this.errorContent
          : this.isSetup
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
      {
        this.isSetup
          ? this.clearDataContent
          : null
      }
    </div>
  }
}

module.exports = SyncTab
