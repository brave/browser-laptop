/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const Immutable = require('immutable')
const niceware = require('niceware')

// Components
const ModalOverlay = require('../common/modalOverlay')
const {BrowserButton} = require('../common/browserButton')
const {SettingsList, SettingItem, SettingCheckbox} = require('../common/settings')
const SortableTable = require('../common/sortableTable')

const {
  SectionTitleLabelWrapper,
  AboutPageSectionTitle,
  DefaultSectionTitle,
  SectionLabelTitle
} = require('../common/sectionTitle')

const aboutActions = require('../../../../js/about/aboutActions')
const tabActions = require('../../../common/actions/tabActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')

const cx = require('../../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')

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
    return <section className={css(styles.settingsListContainerMargin__bottom)}>
      <div className={css(styles.errorContent__setupError)} data-test-id='syncSetupError'>{this.setupError}</div>
      <BrowserButton primaryColor
        l10nId='syncRetryButton'
        testId='syncRetryButton'
        onClick={this.retry.bind(this)}
      />
    </section>
  }

  get clearDataContent () {
    return <section className={css(styles.settingsListContainerMargin__bottom)}>
      <DefaultSectionTitle data-l10n-id='syncClearData' />
      {
        this.enabled
          ? <BrowserButton primaryColor
            l10nId='syncResetButton'
            testId='clearDataButton'
            onClick={this.props.showOverlay.bind(this, 'syncReset')}
          />
          : <div>
            <BrowserButton primaryColor
              disabled
              l10nId='syncResetButton'
              testId='clearDataButton'
            />
            <div data-l10n-id='syncResetDataDisabled' className='settingsListTitle' />
          </div>
      }
    </section>
  }

  get setupContent () {
    if (this.setupError) {
      return null
    }
    // displayed before a sync userId has been created
    return <section className={css(styles.setupContent)}>
      <BrowserButton groupedItem primaryColor
        l10nId='syncStart'
        testId='syncStartButton'
        onClick={this.props.showOverlay.bind(this, 'syncStart')}
      />
      <BrowserButton groupedItem secondaryColor
        l10nId='syncAdd'
        testId='syncAddButton'
        onClick={this.props.showOverlay.bind(this, 'syncAdd')}
      />
    </section>
  }

  get postSetupContent () {
    return <SettingsList>
      <div className={css(styles.device__box)}>
        <SettingCheckbox
          className={css(styles.device__item)}
          dataL10nId='syncEnable'
          prefKey={settings.SYNC_ENABLED}
          settings={this.props.settings}
          onChangeSetting={this.toggleSync}
        />
        <div className={css(styles.device__item)}>
          <span className={css(styles.device__syncDeviceLabel)} data-l10n-id='syncDeviceName' />
          <div className={css(styles.device__deviceName)}>
            {getSetting(settings.SYNC_DEVICE_NAME, this.props.settings)}
          </div>
        </div>
      </div>
      {this.enabled ? this.devicesContent : null}
      <BrowserButton primaryColor
        l10nId='syncNewDevice'
        testId='syncNewDeviceButton'
        onClick={this.props.showOverlay.bind(this, 'syncNewDevice')}
      />
    </SettingsList>
  }

  get devicesTableRows () {
    const devices = this.props.syncData.get('devices')
    if (!devices) { return [] }
    return devices.map((device, id) => [
      {
        html: id,
        value: parseInt(id)
      },
      {
        html: device.get('name'),
        value: device.get('name')
      },
      {
        html: new Date(device.get('lastRecordTimestamp')).toLocaleString(),
        value: device.get('lastRecordTimestamp')
      }
    ])
  }

  get devicesContent () {
    return <section className={css(styles.settingsListContainerMargin__top)}>
      <DefaultSectionTitle data-l10n-id='syncDevices' data-test-id='syncDevices' />
      <SortableTable
        headings={['id', 'syncDeviceName', 'syncDeviceLastActive']}
        defaultHeading='syncDeviceLastActive'
        defaultHeadingSortOrder='desc'
        rows={this.devicesTableRows}
        customCellClasses={css(styles.devices__devicesListCell)}
        tableClassNames={css(styles.devices__devicesList)}
      />
    </section>
  }

  get qrcodeContent () {
    if (!this.isSetup) {
      return null
    }
    return this.props.syncQRVisible
      ? <section>
        <ul className={css(styles.syncOverlayBody__listWrapper)}>
          <li className={css(
            styles.syncOverlayBody__listItem,
            commonStyles.noMarginLeft
          )}>
            <BrowserButton secondaryColor
              l10nId='syncHideQR'
              testId='syncHideQRButton'
              onClick={this.props.hideQR}
            />
          </li>
        </ul>
        <img className={css(styles.syncOverlayBody__syncQRImg)}
          src={this.props.syncData.get('seedQr')}
          data-l10n-id='syncQRImg'
          data-test-id='syncQRImg'
        />
      </section>
    : <ul className={css(styles.syncOverlayBody__listWrapper)}>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginLeft
      )}>
        <BrowserButton secondaryColor
          l10nId='syncShowQR'
          testId='syncShowQRButton'
          onClick={this.props.showQR}
        />
      </li>
    </ul>
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
      ? <ul className={css(styles.syncOverlayBody__listWrapper)}>
        <li className={css(
          styles.syncOverlayBody__listItem,
          commonStyles.noMarginBottom,
          commonStyles.noMarginLeft
        )}>
          <BrowserButton secondaryColor
            l10nId='syncHidePassphrase'
            testId='syncHidePassphraseButton'
            onClick={this.props.hidePassphrase}
          />
          <pre data-test-id='syncPassphrase'
            className={css(
              styles.passphrase,
              styles.listItem__passphrase,
              commonStyles.noMarginBottom
            )}>{words.join('\n')}</pre>
        </li>
      </ul>
      : <ul className={css(styles.syncOverlayBody__listWrapper)}>
        <li className={css(
          styles.syncOverlayBody__listItem,
          commonStyles.noMarginBottom,
          commonStyles.noMarginLeft
        )}>
          <BrowserButton secondaryColor
            l10nId='syncShowPassphrase'
            testId='syncShowPassphraseButton'
            onClick={this.props.showPassphrase}
          />
        </li>
      </ul>
  }

  get newOverlayContent () {
    return <ol>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginTop
      )} data-l10n-id='syncNewDevice1' />
      <li className={css(styles.syncOverlayBody__listItem)}>
        <div data-l10n-id='syncNewDevice2' />
        {this.qrcodeContent}
      </li>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginBottom
      )}>
        <div data-l10n-id='syncNewDevice3' />
        {this.passphraseContent}
      </li>
    </ol>
  }

  get newOverlayFooter () {
    return <BrowserButton secondaryColor
      l10nId='done'
      testId='doneButton'
      onClick={this.props.hideOverlay.bind(this, 'syncNewDevice')}
    />
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
      <div className={css(styles.syncOverlayBody__label)} data-l10n-id='syncDeviceNameInput' />
      <input className={css(
        commonStyles.formControl,
        commonStyles.textbox,
        commonStyles.textbox__outlineable,
        commonStyles.textbox__isSettings
      )}
        spellCheck='false'
        ref={(node) => { this.deviceNameInput = node }}
        placeholder={this.defaultDeviceName} />
    </SettingItem>
  }

  get startOverlayContent () {
    return <section className={css(styles.syncOverlayBody__formBottomMargin)}>
      {this.deviceNameInputContent}
    </section>
  }

  get startOverlayFooter () {
    return <BrowserButton primaryColor
      l10nId='syncCreate'
      testId='syncCreateButton'
      onClick={this.onSetup}
    />
  }

  get addOverlayContent () {
    return <section>
      <div className={css(styles.syncOverlayBody__label)} data-l10n-id='syncEnterPassphrase' />
      <div className={css(styles.syncOverlayBody__form)}>
        <textarea className={css(
          commonStyles.formControl,
          commonStyles.textArea,
          styles.passphrase,
          styles.textArea__passphrase
        )}
          spellCheck='false'
          ref={(node) => { this.passphraseInput = node }}
          onChange={this.enableRestore}
        />
      </div>
      <div className={css(styles.syncOverlayBody__formBottomMargin)}>
        {this.deviceNameInputContent}
      </div>
    </section>
  }

  get addOverlayFooter () {
    return <BrowserButton primaryColor
      l10nId='syncCreate'
      testId='syncCreateButton'
      onClick={this.onRestore}
      disabled={this.props.syncRestoreEnabled === false}
    />
  }

  get resetOverlayContent () {
    return <ul>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginTop
      )} data-l10n-id='syncResetMessageWhat' />
      <li className={css(styles.syncOverlayBody__listItem)} data-l10n-id='syncResetMessageWhatNot' />
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginBottom
      )} data-l10n-id='syncResetMessageOtherDevices' />
    </ul>
  }

  get resetOverlayFooter () {
    return <section>
      <BrowserButton groupedItem secondaryColor
        l10nId='cancel'
        testId='cancelButton'
        onClick={this.props.hideOverlay.bind(this, 'syncReset')}
      />
      <BrowserButton groupedItem primaryColor
        l10nId='syncReset'
        testId='syncResetButton'
        onClick={this.onReset}
      />
    </section>
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
    tabActions.reload()
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

  componentDidUpdate () {
    if (!this.isSetup && this.props.syncStartOverlayVisible) {
      this.deviceNameInput.focus()
    }
    if (!this.isSetup && this.props.syncAddOverlayVisible) {
      this.passphraseInput.focus()
    }
  }

  render () {
    return <section className='syncContainer'>
      {
      this.isSetup && this.props.syncNewDeviceOverlayVisible
        ? <ModalOverlay
          title={'syncNewDevice'}
          content={this.newOverlayContent}
          footer={this.newOverlayFooter}
          onHide={this.props.hideOverlay.bind(this, 'syncNewDevice')} />
        : null
      }
      {
      !this.isSetup && this.props.syncStartOverlayVisible
        ? <ModalOverlay
          title={'syncStart'}
          content={this.startOverlayContent}
          footer={this.startOverlayFooter}
          onHide={this.props.hideOverlay.bind(this, 'syncStart')} />
        : null
      }
      {
      !this.isSetup && this.props.syncAddOverlayVisible
        ? <ModalOverlay
          title={'syncAdd'}
          content={this.addOverlayContent}
          footer={this.addOverlayFooter}
          onHide={this.props.hideOverlay.bind(this, 'syncAdd')} />
        : null
      }
      {
      this.isSetup && this.props.syncResetOverlayVisible
        ? <ModalOverlay
          title={'syncReset'}
          content={this.resetOverlayContent}
          footer={this.resetOverlayFooter}
          onHide={this.props.hideOverlay.bind(this, 'syncReset')} />
        : null
      }
      <section className={css(styles.settingsListContainerMargin__bottom)}>
        <SectionTitleLabelWrapper>
          <AboutPageSectionTitle data-l10n-id='syncTitle' />
          <SectionLabelTitle>beta</SectionLabelTitle>
        </SectionTitleLabelWrapper>

        <div className={css(styles.settingsListContainerMargin__bottom)}>
          <span className='settingsListTitle' data-l10n-id='syncTitleMessage' />
          <a href='https://github.com/brave/sync/wiki/Design' target='_blank'>
            <span className={cx({
              fa: true,
              'fa-question-circle': true
            })} />
          </a>
          <div className={cx({
            settingsListTitle: true,
            [css(styles.subText)]: true
          })} data-l10n-id='syncBetaMessage' />
          {
            this.setupError
            ? this.errorContent
            : this.isSetup
              ? this.postSetupContent
              : this.setupContent
          }
        </div>
      </section>
      {
        this.isSetup && this.enabled
          ? <section data-test-id='syncDataSection' className={css(styles.settingsListContainerMargin__bottom)}>
            <DefaultSectionTitle data-l10n-id='syncData' />
            <SettingsList dataL10nId='syncDataMessage'>
              <SettingCheckbox
                dataL10nId='syncBookmarks'
                prefKey={settings.SYNC_TYPE_BOOKMARK}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting}
              />
              <SettingCheckbox
                dataL10nId='syncSiteSettings'
                prefKey={settings.SYNC_TYPE_SITE_SETTING}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting}
              />
              <SettingCheckbox
                dataL10nId='syncHistory'
                prefKey={settings.SYNC_TYPE_HISTORY}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting}
              />
            </SettingsList>
          </section>
          : null
      }
      {
        this.isSetup
          ? this.clearDataContent
          : null
      }
    </section>
  }
}

const styles = StyleSheet.create({
  settingsListContainerMargin__top: {
    marginTop: globalStyles.spacing.settingsListContainerMargin
  },
  settingsListContainerMargin__bottom: {
    marginBottom: globalStyles.spacing.settingsListContainerMargin
  },
  passphrase: {
    font: '18px monospace'
  },
  subText: {
    color: globalStyles.color.gray,
    fontSize: '.9rem',
    marginTop: '.5rem'
  },

  setupContent: {
    marginTop: globalStyles.spacing.dialogInsideMargin
  },
  errorContent__setupError: {
    color: globalStyles.color.braveDarkOrange,
    fontWeight: 'bold',
    margin: `calc(${globalStyles.spacing.panelPadding} / 2) 0 ${globalStyles.spacing.dialogInsideMargin}`
  },

  device__box: {
    display: 'flex',
    alignItems: 'center',
    background: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    color: globalStyles.color.mediumGray,
    margin: `${globalStyles.spacing.panelMargin} 0`,
    padding: globalStyles.spacing.panelPadding,
    boxSizing: 'border-box',
    width: '600px'
  },
  device__item: {
    flex: 1
  },
  device__syncDeviceLabel: {
    fontSize: '.9rem'
  },
  device__deviceName: {
    marginTop: `calc(${globalStyles.spacing.panelPadding} / 2)`
  },

  devices__devicesList: {
    // TODO: refactor sortableTable to remove !important
    marginBottom: `${globalStyles.spacing.dialogInsideMargin} !important`,
    boxSizing: 'border-box',
    width: '600px !important'
  },
  devices__devicesListCell: {
    padding: '4px 8px'
  },

  textArea__passphrase: {
    width: '80%',
    height: '100px'
  },

  listItem__passphrase: {
    margin: `${globalStyles.spacing.dialogInsideMargin} 0`,
    color: globalStyles.color.braveDarkOrange,
    userSelect: 'initial',
    cursor: 'initial'
  },

  syncOverlayBody__listWrapper: {
    listStyle: 'none'
  },
  syncOverlayBody__listItem: {
    margin: globalStyles.spacing.dialogInsideMargin
  },

  syncOverlayBody__syncQRImg: {
    position: 'relative',
    right: globalStyles.spacing.dialogInsideMargin
  },
  syncOverlayBody__label: {
    // TODO: refactor preferences.less
    // See: .settingsList .settingItem > *:not(.switchControl)
    marginBottom: `${globalStyles.spacing.modalPanelHeaderMarginBottom} !important`
  },
  syncOverlayBody__form: {
    marginBottom: globalStyles.spacing.settingsListContainerMargin
  },
  syncOverlayBody__formBottomMargin: {
    marginBottom: globalStyles.spacing.dialogInsideMargin
  }
})

module.exports = SyncTab
