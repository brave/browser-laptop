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
const BrowserButton = require('../common/browserButton')
const {SettingsList, SettingCheckbox} = require('../common/settings')
const SortableTable = require('../common/sortableTable')
const {Grid, Column} = require('brave-ui')
const ClipboardButton = require('../common/clipboardButton')

const {
  SectionTitleLabelWrapper,
  AboutPageSectionTitle,
  DefaultSectionTitle,
  SectionLabelTitle
} = require('../common/sectionTitle')

const aboutActions = require('../../../../js/about/aboutActions')
const appActions = require('../../../../js/actions/appActions')
const tabActions = require('../../../common/actions/tabActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')

const cx = require('../../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')
const syncDevicesImage = require('../../../extensions/brave/img/sync/circle_of_sync_landing_graphic.svg')
const syncPhoneTabletImage = require('../../../extensions/brave/img/sync/device_type_phone-tablet.svg')
const syncComputerImage = require('../../../extensions/brave/img/sync/device_type_computer.svg')
const syncPlusImage = require('../../../extensions/brave/img/sync/add_device_titleicon.svg')
const syncCodeImage = require('../../../extensions/brave/img/sync/synccode_titleicon.svg')
const syncHandImage = require('../../../extensions/brave/img/sync/hand_image.png')
const syncPassphraseInputSize = 16

class SyncTab extends ImmutableComponent {
  constructor () {
    super()
    this.toggleSync = this.toggleSync.bind(this)
    this.onSetup = this.setupSyncProfile.bind(this, false)
    this.onReset = this.reset.bind(this)
    this.onRestore = this.restoreSyncProfile.bind(this)
    this.enableRestore = this.enableRestore.bind(this)
    this.onCopy = this.copyPassphraseToClipboard.bind(this)
    this.state = {
      wordCount: 0,
      currentDeviceOption: ''
    }
  }

  get setupError () {
    return this.props.syncData.get('setupError')
  }

  get isSetup () {
    return (
      this.props.syncData.get('setupCompleted') &&
      !this.setupError &&
      this.props.syncData.get('seed') instanceof Immutable.List &&
      this.props.syncData.get('seed').size === 32
    )
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

    return (
      <div className={css(styles.syncContainer)}>
        <Grid>
          <Column size={6}>
            <img className={css(styles.sync__image)} src={syncDevicesImage} />
          </Column>
          <Column size={6}>
            <SectionTitleLabelWrapper>
              <AboutPageSectionTitle data-l10n-id='syncTitle' />
              <SectionLabelTitle>beta</SectionLabelTitle>
            </SectionTitleLabelWrapper>
            <Column>
              <p
                data-l10n-id='syncWelcome1'
                className={css(styles.syncContainer__text_big)}
              />
              <p
                data-l10n-id='syncWelcome2'
                className={css(styles.syncContainer__text_small)}
              />
            </Column>
            <Column>
              <section className={css(styles.setupContent)}>
                <BrowserButton groupedItem primaryColor
                  l10nId='syncStart'
                  testId='syncStartButton'
                  onClick={this.setupSync.bind(this)}
                />
                <BrowserButton groupedItem secondaryColor
                  l10nId='syncAddCode'
                  testId='syncAddCodeButton'
                  onClick={this.props.showOverlay.bind(this, 'syncAdd')}
                />
              </section>
            </Column>
          </Column>
        </Grid>
      </div>
    )
  }

  setupSync () {
    this.setupSyncProfile(true)
    this.props.showOverlay('syncStart')
  }

  get postSetupContent () {
    return (
      <div>
        <SectionTitleLabelWrapper>
          <AboutPageSectionTitle data-l10n-id='syncTitle' />
          <SectionLabelTitle>beta</SectionLabelTitle>
        </SectionTitleLabelWrapper>

        <div className={css(styles.settingsListContainerMargin__bottom)}>
          <span className='settingsListTitle' data-l10n-id='syncTitleMessage' />
          <a href='https://github.com/brave/sync/wiki/Design' rel='noopener' target='_blank'>
            <span className={cx({
              fa: true,
              'fa-question-circle': true
            })} />
          </a>
          <div
            data-l10n-id='syncBetaMessage'
            className={cx({
              settingsListTitle: true,
              [css(styles.subText)]: true
            })}
          />
        </div>
        <SettingsList>
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
            l10nId='syncNewDeviceButton'
            l10nArgs={{device: this.defaultDeviceName}}
            testId='syncNewDeviceButton'
            onClick={this.props.showOverlay.bind(this, 'syncStart')}
          />
        </SettingsList>
      </div>
    )
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
      <Grid gap={0} columns={2}>
        <Column size={1}>
          <SortableTable
            headings={['id', 'syncDeviceName', 'syncDeviceLastActive']}
            defaultHeading='syncDeviceLastActive'
            defaultHeadingSortOrder='desc'
            rows={this.devicesTableRows}
            tableClassNames={css(styles.devices__devicesList)}
          />
        </Column>
        <Column size={1}>
          <BrowserButton
            secondaryColor
            l10nId='syncAddDevice'
            onClick={this.props.showOverlay.bind(this, 'syncStart')}
            custom={styles.sync__button_block}
          />
          <BrowserButton
            secondaryColor
            l10nId='syncViewCode'
            onClick={this.props.showOverlay.bind(this, 'syncQRPassphrase')}
            custom={styles.sync__button_block}
           />
        </Column>
      </Grid>
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

  copyPassphraseToClipboard () {
    if (!this.passphraseDisplay) {
      return
    }
    appActions.clipboardTextCopied(this.passphraseDisplay.value)
  }

  get passphraseContent () {
    const seed = Buffer.from(this.props.syncData.get('seed').toJS())
    const passphrase = niceware.bytesToPassphrase(seed)
    const words = [
      passphrase.slice(0, 4).join(' '),
      passphrase.slice(4, 8).join(' '),
      passphrase.slice(8, 12).join(' '),
      passphrase.slice(12, 16).join(' ')
    ]

    return (
      <div className={css(styles.syncOverlayBody__form)}>
        <textarea className={css(
          commonStyles.formControl,
          commonStyles.textArea,
          styles.passphrase,
          styles.textArea__passphrase
        )}
          disabled
          spellCheck='false'
          value={words.join(' ').replace(',', ' ')}
          ref={(node) => { this.passphraseDisplay = node }}
        />
        <div className={css(styles.syncOverlayBody__form__wordCount)}>
          <div>
            <span data-l10n-id='wordCount' /> {syncPassphraseInputSize}
          </div>
          <ClipboardButton
            leftTooltip
            copyAction={this.onCopy}
          />
        </div>
      </div>
    )
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

  /**
   * Sync Start Overlay
   */
  get startOverlayContent () {
    return <section className={css(styles.syncOverlayBody__formBottomMargin)}>
      <Grid gap={0} columns={2} padding='0 90px'>
        <Column><span data-l10n-id='syncChooseDevice' /></Column>
        <Column size={1} align='center' verticalAlign='center' direction='column'>
          <img className={css(
            styles.sync__image,
            styles.sync__image_start
          )} src={syncPhoneTabletImage} />
          <BrowserButton primaryColor
            l10nId='syncPhoneOrTablet'
            testId='syncPhoneOrTablet'
            onClick={this.onClickSyncScanCodeButton.bind(this)}
          />
        </Column>
        <Column size={1} align='center' verticalAlign='center' direction='column'>
          <img className={css(
            styles.sync__image,
            styles.sync__image_start
          )} src={syncComputerImage} />
          <BrowserButton primaryColor
            l10nId='computer'
            testId='syncComputer'
            onClick={this.onClickSyncChainCodeButton.bind(this)}
          />
        </Column>
      </Grid>
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
      <Grid gap={0} padding='0 0 0 90px'>
        <Column>
          <div
            data-l10n-id='syncEnterPassphrase'
            className={css(styles.syncOverlayBody__formBottomMargin)}
          />
          <div className={css(styles.syncOverlayBody__form)}>
            <textarea className={css(
              commonStyles.formControl,
              commonStyles.textArea,
              styles.passphrase,
              styles.textArea__passphrase
            )}
              spellCheck='false'
              autoFocus
              ref={(node) => { this.passphraseInput = node }}
              onChange={this.enableRestore}
            />
            <div className={css(styles.syncOverlayBody__form__wordCount)}>
              <span data-l10n-id='wordCount' /> {this.state.wordCount}
            </div>
          </div>
        </Column>
      </Grid>
    </section>
  }

  get addOverlayFooter () {
    return (
      <div>
        <BrowserButton groupedItem secondaryColor
          l10nId='cancel'
          testId='cancelButton'
          onClick={this.addOverlayCancelAction.bind(this)}
        />
        <BrowserButton groupedItem primaryColor
          disabled={this.props.syncRestoreEnabled === false}
          l10nId='syncConfirm'
          testId='syncConfirmButton'
          onClick={this.addOverlayConfirmAction.bind(this)}
        />
      </div>
    )
  }

  addOverlayCancelAction () {
    this.props.hideOverlay('syncAdd')
  }

  addOverlayConfirmAction () {
    // close possible current modal
    this.props.hideOverlay('syncChainCode')
    this.props.hideOverlay('syncAdd')
    // verify if you can restore sync
    this.restoreSyncProfile()
  }

  onClickSyncChainCodeButton () {
    this.setState({currentDeviceOption: 'computer'})
    // close current modal
    this.props.hideOverlay('syncStart')
    // open chain code modal
    this.props.showOverlay('syncChainCode')
  }

  onClickSyncScanCodeButton () {
    this.setState({currentDeviceOption: 'mobile'})
    // close current modal
    this.props.hideOverlay('syncStart')
    // open scan code modal
    this.props.showOverlay('syncScanCode')
  }

  /**
   * Sync Chain Code Overlay
   */
  get chainCodeOverlayContent () {
    this.checkDeviceUpdatesFor('syncChainCode')
    return (
      <Grid gap={0} columns={1} padding='0 90px'>
        <Column>
          <p data-l10n-id='syncChainCodeDescription1' />
          <p data-l10n-id='syncChainCodeDescription2' />
          <p
            data-l10n-id='syncChainCodeDescription3'
            className={css(
              styles.settingsListContainerMargin__top,
              styles.settingsListContainerMargin__bottom
            )}
          />
          {this.passphraseContent}
        </Column>
      </Grid>
    )
  }

  get chainCodeOverlayFooter () {
    return (
      <div className={css(styles.syncOverlayFooter_split)}>
        <BrowserButton secondaryColor
          l10nId='syncScanQRCode'
          onClick={this.chainCodeOverlayUseCameraInstead.bind(this)}
        />
        <div>
          <BrowserButton groupedItem secondaryColor
            l10nId='backWithArrow'
            testId='cancelButton'
            onClick={this.chainCodeOverlayPreviousAction.bind(this)}
          />
          <BrowserButton groupedItem primaryColor
            l10nId={
            this.props.syncData.get('devices').size < 2
              ? 'syncLookingForDevice'
              : 'done'
            }
            testId='syncLookingForDevice'
            disabled={this.props.syncData.get('devices').size < 2}
            onClick={this.chainCodeOverlayNextAction.bind(this)}
          />
        </div>
      </div>
    )
  }

  chainCodeOverlayUseCameraInstead () {
    // hide current modal
    this.props.hideOverlay('syncChainCode')
    // open chain code modal
    this.props.showOverlay('syncScanCode')
  }

  chainCodeOverlayPreviousAction () {
    // hide current modal
    this.props.hideOverlay('syncChainCode')
    // open previous modal
    this.props.showOverlay('syncStart')
  }

  chainCodeOverlayNextAction () {
    // close current modal
    this.props.hideOverlay('syncChainCode')
    this.props.hideOverlay('syncAdd')
  }

  /**
   * Sync Scan Code (QR code) Overlay
   */
  get scanCodeOverlayContent () {
    this.checkDeviceUpdatesFor('syncScanCode')
    return (
      <div>
        <Grid gap={0} columns={2}>
          <Column><p data-l10n-id='syncScanDescription' /></Column>
          <Column size={1} verticalAlign='center'>
            <img src={syncHandImage} />
          </Column>
          <Column size={1} align='center' verticalAlign='center'>
            <img className={css(styles.syncOverlayBody__syncQRImg)}
              src={this.props.syncData.get('seedQr')}
              data-l10n-id='syncQRImg'
              data-test-id='syncQRImg'
            />
          </Column>
        </Grid>
      </div>
    )
  }

  get scanCodeOverlayFooter () {
    return (
      <div className={css(styles.syncOverlayFooter_split)}>
        <BrowserButton secondaryColor
          l10nId='syncTypeSecurityCode'
          onClick={this.scanCodeOverlayNoCameraAvailable.bind(this)}
        />
        <div>
          <BrowserButton groupedItem secondaryColor
            l10nId='backWithArrow'
            testId='cancelButton'
            onClick={this.scanCodeOverlayPreviousAction.bind(this)}
          />
          <BrowserButton groupedItem primaryColor
            l10nId={
              this.props.syncData.get('devices').size < 2
                ? 'syncLookingForDevice'
                : 'done'
              }
            testId='syncLookingForDevice'
            disabled={this.props.syncData.get('devices').size < 2}
            onClick={this.scanCodeOverlayNextAction.bind(this)}
          />
        </div>
      </div>
    )
  }

  onHideAnySetupOverlay () {
    // hide every setup modal
    this.props.hideOverlay('syncScanCode')
    this.props.hideOverlay('syncChainCode')
    this.props.hideOverlay('syncQRPassphrase')
    this.props.hideOverlay('syncAdd')

    if (!this.isSetup) {
      // cancel sync without warning as user didn't complete setup
      this.onReset(false)
    }
  }

  scanCodeOverlayNoCameraAvailable () {
    // hide current modal
    this.props.hideOverlay('syncScanCode')
    // open chain code modal
    this.props.showOverlay('syncChainCode')
  }

  scanCodeOverlayPreviousAction () {
    // hide current modal
    this.props.hideOverlay('syncScanCode')
    // open previous modal
    this.props.showOverlay('syncStart')
  }

  checkDeviceUpdatesFor (modalName) {
    const devices = this.props.syncData.get('devices')
    const isSetupCompleted = this.props.syncData.get('setupCompleted')

    // if setup is completed there's no need to check for updates
    if (isSetupCompleted) {
      return
    }

    if (devices.isEmpty()) {
      // Update modal after 5s to check if new device is already fetch
      setTimeout(() => this.forceUpdate(), 5000)
    }

    // the only way to finish sync setup is
    // to have >= 2 devices in the list
    if (devices.size >= 2) {
      appActions.syncSetupCompleted(true)
      // close current modal
      this.props.hideOverlay(modalName)
    }
  }

  scanCodeOverlayNextAction () {
    // close current modal
    this.props.hideOverlay('syncScanCode')
  }

  /**
   * QR and Passphrase Overlay
   */
  get qrPassphraseOverlayContent () {
    return (
      <Grid gap={0} columns={4} padding='30px 0'>
        <Column size={1} verticalAlign='center'>
          <h3 data-l10n-id='syncQRCode' />
        </Column>
        <Column size={3} verticalAlign='center'>
          <h3 data-l10n-id='syncWordCode' />
        </Column>
        <Column size={1} verticalAlign='center'>
          <img className={css(
            styles.syncOverlayBody__syncQRImg,
            styles.syncOverlayBody__syncQRImg_small
          )}
            src={this.props.syncData.get('seedQr')}
            data-l10n-id='syncQRImg'
            data-test-id='syncQRImg'
          />
        </Column>
        <Column size={3} verticalAlign='center'>
          {this.passphraseContent}
        </Column>
      </Grid>
    )
  }

  get qrPassphraseOverlayFooter () {
    return (
      <BrowserButton groupedItem primaryColor
        l10nId='done'
        testId='qrPassphraseDoneAction'
        onClick={this.qrPassphraseOverlayDoneAction.bind(this)}
      />
    )
  }

  qrPassphraseOverlayDoneAction () {
    // close current modal
    this.props.hideOverlay('syncQRPassphrase')
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
    if (e.target.value.length > 0) {
      const wordCount = e.target.value
        .trim().replace(/\s+/gi, ' ').split(' ').length
      this.setState({wordCount})
    } else {
      this.setState({wordCount: 0})
    }

    if (this.props.syncRestoreEnabled === false && e.target.value) {
      this.props.enableSyncRestore(true)
    } else if (this.props.syncRestoreEnabled && !e.target.value) {
      this.props.enableSyncRestore(false)
    }
  }

  reset (needsConfirmDialog = true) {
    const locale = require('../../../../js/l10n')
    const msg = locale.translation('areYouSure')
    if (needsConfirmDialog && window.confirm(msg)) {
      aboutActions.resetSync()
      appActions.syncSetupCompleted(false)
      this.retry()
      this.props.hideOverlay('syncReset')
      return
    }
    aboutActions.resetSync()
    appActions.syncSetupCompleted(false)
    this.retry()
  }

  retry () {
    aboutActions.reloadSyncExtension()
    tabActions.reload()
  }

  setupSyncProfile (shouldSetup, isRestoring) {
    this.props.onChangeSetting(settings.SYNC_DEVICE_NAME, this.defaultDeviceName)
    this.toggleSync(settings.SYNC_ENABLED, shouldSetup, isRestoring)
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
        console.error('Could not convert niceware passphrase', e)
      }
      if (inputCode && inputCode.length === 32) {
        // QR code and device ID are set after sync restarts
        aboutActions.saveSyncInitData(Array.from(inputCode))
        this.setupSyncProfile(true)
        appActions.syncSetupCompleted(true)
        return
      }
    }
    window.alert('Invalid input code; please try again or create a new profile.')
  }

  render () {
    return <section data-test-id='syncContainer'>
      {
      this.props.syncStartOverlayVisible
        ? <ModalOverlay
          grayOverlay
          title='syncNewDeviceTitle'
          titleArgs={{device: this.defaultDeviceName}}
          titleImage={syncPlusImage}
          content={this.startOverlayContent}
          onHide={this.props.hideOverlay.bind(this, 'syncStart')} />
        : null
      }
      {
      this.props.syncAddOverlayVisible
        ? <ModalOverlay
          grayOverlay
          title='syncAddCode'
          titleImage={syncCodeImage}
          content={this.addOverlayContent}
          footer={this.addOverlayFooter}
          onHide={this.onHideAnySetupOverlay.bind(this)} />
        : null
      }
      {
      this.props.syncScanCodeOverlayVisible
        ? <ModalOverlay
          grayOverlay
          title={
            this.state.currentDeviceOption === 'mobile'
              ? 'syncScanMobile'
              : 'syncScanComputer'
          }
          titleImage={syncPlusImage}
          content={this.scanCodeOverlayContent}
          footer={this.scanCodeOverlayFooter}
          onHide={this.onHideAnySetupOverlay.bind(this)} />
        : null
      }
      {
        this.props.syncChainCodeOverlayVisible
        ? <ModalOverlay
          grayOverlay
          title={
            this.state.currentDeviceOption === 'mobile'
              ? 'syncChainCodeMobile'
              : 'syncChainCodeComputer'
          }
          titleArgs={{deviceType: 'syncChainCode'}}
          titleImage={syncPlusImage}
          content={this.chainCodeOverlayContent}
          footer={this.chainCodeOverlayFooter}
          onHide={this.onHideAnySetupOverlay.bind(this)} />
        : null
      }
      {
        this.props.syncQRPassphraseOverlayVisible
        ? <ModalOverlay
          grayOverlay
          content={this.qrPassphraseOverlayContent}
          footer={this.qrPassphraseOverlayFooter}
          onHide={this.onHideAnySetupOverlay.bind(this)} />
        : null
      }
      {
      this.props.syncResetOverlayVisible
        ? <ModalOverlay
          grayOverlay
          title={'syncReset'}
          content={this.resetOverlayContent}
          footer={this.resetOverlayFooter}
          onHide={this.props.hideOverlay.bind(this, 'syncReset')} />
        : null
      }
      <section className={css(styles.settingsListContainerMargin__bottom)}>
        {
          this.setupError
          ? this.errorContent
          : this.isSetup
            ? this.postSetupContent
            : this.setupContent
        }
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
  syncContainer: {
    margin: '40px 0 0',
    height: '-webkit-fill-available',
    maxWidth: '800px'
  },

  syncContainer__text_big: {
    fontSize: '20px',
    margin: '20px 0'
  },

  syncContainer__text_small: {
    fontSize: '15px'
  },

  sync__image: {
    display: 'block',
    margin: 'auto',
    maxWidth: '100%'
  },

  sync__image_start: {
    width: '120px',
    height: '100px',
    margin: '30px 0'
  },

  settingsListContainerMargin__top: {
    marginTop: globalStyles.spacing.settingsListContainerMargin
  },

  settingsListContainerMargin__bottom: {
    marginBottom: globalStyles.spacing.settingsListContainerMargin
  },

  passphrase: {
    // See: https://github.com/Khan/aphrodite#object-key-ordering
    fontSize: '18px',
    fontFamily: 'monospace'
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
    marginBottom: globalStyles.spacing.dialogInsideMargin,
    width: '600px'
  },

  textArea__passphrase: {
    width: '100%',
    height: '120px',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    resize: 'none'
  },

  syncOverlayBody__listWrapper: {
    listStyle: 'none'
  },

  syncOverlayBody__listItem: {
    margin: globalStyles.spacing.dialogInsideMargin
  },

  syncOverlayBody__syncQRImg: {
    margin: '20px 0'
  },

  syncOverlayBody__syncQRImg_small: {
    maxWidth: '90%'
  },

  syncOverlayBody__form: {
    border: '1px solid #000',
    borderRadius: '4px',
    padding: '2px',
    width: '100%'
  },

  syncOverlayBody__form__wordCount: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: '4px',
    borderBottomRightRadius: '4px',
    padding: '5px 10px',
    background: 'rgba(0, 0, 0, 0.1)',
    fontSize: '13px',
    fontWeight: 'bold'
  },

  syncOverlayBody__formBottomMargin: {
    marginBottom: globalStyles.spacing.dialogInsideMargin
  },

  syncOverlayBody__select: {
    borderRadius: '4px',
    boxShadow: '0px 2px 8px -5px rgba(0, 0, 0, 1)',
    display: 'block',
    color: 'rgb(68, 68, 68)',
    fontSize: '14px',
    border: 'solid 1px rgba(0, 0, 0, 0.2)',
    outline: 'none',
    padding: '0.4em',
    width: '100%',
    maxWidth: '100%',
    margin: '20px 0 0'
  },

  syncOverlayBody__text: {
    marginBottom: '30px',
    display: 'block'
  },

  syncOverlayBody__text_bold: {
    marginRight: '10px',
    fontWeight: 'bold'
  },

  syncOverlayFooter_split: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  sync__button_block: {
    display: 'block',
    margin: '0 15px 15px',
    minWidth: '160px'
  }
})

module.exports = SyncTab
