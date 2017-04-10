/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// components
const Button = require('../../../../../js/components/button')
const ModalOverlay = require('../../../../../js/components/modalOverlay')
const ImmutableComponent = require('../../../../../js/components/immutableComponent')

// styles
const commonStyles = require('../../styles/commonStyles')
const globalStyles = require('../../styles/global')
const {paymentCommon} = require('../../styles/payment')
const cx = require('../../../../../js/lib/classSet')
const CoinBase = require('../../../../extensions/brave/img/coinbase_logo.png')
const Andorid = require('../../../../extensions/brave/img/android_download.svg')
const IOS = require('../../../../extensions/brave/img/ios_download.svg')

// other
const coinbaseCountries = require('../../../../../js/constants/coinbaseCountries')
const config = require('../../../../../js/constants/config')
const getSetting = require('../../../../../js/settings').getSetting
const settings = require('../../../../../js/constants/settings')
const aboutActions = require('../../../../../js/about/aboutActions')

class BitcoinDashboard extends ImmutableComponent {
  constructor () {
    super()
    this.buyCompleted = false
    this.openBuyURLTab = this.openBuyURLTab.bind(this)
  }

  get currency () {
    return this.props.ledgerData.get('currency') || 'USD'
  }

  get amount () {
    return getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, this.props.settings) || 0
  }

  get canUseCoinbase () {
    if (!this.props.ledgerData.get('buyMaximumUSD')) return true

    return this.currency === 'USD' && this.amount < this.props.ledgerData.get('buyMaximumUSD')
  }

  get userInAmerica () {
    const countryCode = this.props.ledgerData.get('countryCode')
    return !(countryCode && countryCode !== 'US')
  }

  bitcoinPurchaseButton () {
    if (!this.props.ledgerData.get('buyURLFrame')) {
      /* TODO refactor button */
      return <Button className={cx({
        primaryButton: true,
        [css(styles.panelButton)]: true
      })}
        l10nId='add'
        testId='bitcoinPurchaseButton'
        onClick={this.props.showOverlay.bind(this)} />
    }

    return <a href={this.props.ledgerData.get('buyURL')} target='_blank' onClick={this.openBuyURLTab}>
      {/* TODO: refactor button.js */}
      <Button className={cx({
        primaryButton: true,
        [css(styles.panelButton)]: true
      })}
        l10nId='add'
        testId='bitcoinPurchaseButton' />
    </a>
  }

  qrcodeOverlayContent () {
    return <div>
      <img className={css(styles.qrcodeImage)} src={this.props.ledgerData.get('paymentIMG')} title='Brave wallet QR code' />
      <div className={css(styles.bitcoinQRTitle)} data-l10n-id='bitcoinQR' />
    </div>
  }

  qrcodeOverlayFooter () {
    if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return <div className={css(styles.qrcodeOverlayFooter)}>
        <div className={css(styles.coinbaseLogo)} />
        <a target='_blank' className={css(styles.qrcodeLogo, styles.appstoreLogo)} href='https://itunes.apple.com/us/app/coinbase-bitcoin-wallet/id886427730?mt=8' />
        <a target='_blank' className={css(styles.qrcodeLogo, styles.playstoreLogo)} href='https://play.google.com/store/apps/details?id=com.coinbase.android' />
      </div>
    }

    return null
  }

  coinbasePanel () {
    if (this.canUseCoinbase) {
      return <div className={css(paymentCommon.panel, styles.panel, commonStyles.noMarginTop)}>
        <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerFirst)}>
          <span className={cx({
            fa: true,
            'fa-credit-card': true,
            [css(styles.fa)]: true,
            [css(styles.faCreditCard)]: true
          })} />
          <div className={css(styles.settingsListTitle)} data-l10n-id='moneyAdd' />
          <div className={css(styles.settingsListTitle, styles.subTitle)} data-l10n-id='moneyAddSubTitle' />
        </div>
        <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerLast)}>
          {this.bitcoinPurchaseButton()}
          <div className={css(styles.settingsListTitle, styles.subTitle)} data-l10n-id='transferTime' />
        </div>
      </div>
    } else {
      return <div className={css(paymentCommon.panel, styles.panel)}>
        <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerFirst)}>
          <span className={cx({
            fa: true,
            'fa-credit-card': true,
            [css(styles.fa)]: true,
            [css(styles.faCreditCard)]: true
          })} />
          <div className={css(styles.settingsListTitle)} data-l10n-id='moneyAdd' />
          <div className={css(styles.settingsListTitle, styles.subTitle)} data-l10n-id='moneyAddSubTitle' />
        </div>
        <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerLast)}>
          <div data-l10n-id='coinbaseNotAvailable' />
        </div>
      </div>
    }
  }

  exchangePanel () {
    const url = this.props.ledgerData.getIn(['exchangeInfo', 'exchangeURL'])
    const name = this.props.ledgerData.getIn(['exchangeInfo', 'exchangeName'])
    // Call worldWidePanel if we don't have the URL or Name
    if (!url || !name) {
      return this.worldWidePanel()
    } else {
      return <div className={css(paymentCommon.panel, styles.panel, commonStyles.noMarginTop)}>
        <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerFirst)}>
          <span className={cx({
            fa: true,
            'fa-credit-card': true,
            [css(styles.fa)]: true,
            [css(styles.faCreditCard)]: true
          })} />
          <div className={css(styles.settingsListTitle)} data-l10n-id='outsideUSAPayment' />
        </div>
        <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerLast)}>
          <a target='_blank' href={url}>
            {/* TODO: refactor button.js */}
            <Button className={cx({
              primaryButton: true,
              [css(styles.panelButton)]: true
            })}
              testId='exchangePanelButton'
              label={name} />
          </a>
        </div>
      </div>
    }
  }

  smartphonePanel () {
    return <div className={css(paymentCommon.panel, styles.panel, commonStyles.noMarginBottom)}>
      <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerFirst, styles.alignMiddle)}>
        <span className={cx({
          fa: true,
          'fa-mobile': true,
          [css(styles.faMobile)]: true,
          [css(styles.fa)]: true
        })} />
        <div className={css(styles.settingsListTitle)} data-l10n-id='smartphoneTitle' />
      </div>
      <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerLast, styles.alignMiddle)}>
        {/* TODO: refactor button.js */}
        <Button className={cx({
          primaryButton: true,
          [css(styles.panelButton)]: true
        })}
          l10nId='displayQRCode'
          testId='displayQRCode'
          onClick={this.props.showQRcode.bind(this)} />
      </div>
    </div>
  }

  panelFooter () {
    if (this.props.ledgerData.get('buyURLFrame')) {
      return <div className={css(paymentCommon.panelFooter, styles.panelFooter)}>
        {/* TODO: refactor button.js */}
        <Button className='whiteButton'
          l10nId='done'
          testId='panelDoneButton'
          onClick={this.props.hideParentOverlay} />
      </div>
    } else if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return <div className={css(paymentCommon.panelFooter, styles.panelFooter, styles.coinbaseFooter)}>
        <div className={css(styles.coinbase)}>
          <div className={css(styles.coinbaseLogo)} />
          <span className={css(styles.coinbaseMessage)} data-l10n-id='coinbaseMessage' />
        </div>
        {/* TODO: refactor button.js */}
        <Button className='whiteButton'
          l10nId='done'
          testId='panelDoneButton'
          onClick={this.props.hideParentOverlay} />
      </div>
    } else {
      return <div className={css(paymentCommon.panelFooter, styles.panelFooter)}>
        {/* TODO: refactor button.js */}
        <Button className='whiteButton'
          l10nId='done'
          testId='panelDoneButton'
          onClick={this.props.hideParentOverlay} />
      </div>
    }
  }

  openBuyURLTab () {
    // close parent dialog
    this.props.hideParentOverlay()
  }

  bitcoinOverlayContent () {
    return <iframe src={this.props.ledgerData.get('buyURL')} />
  }

  worldWidePanel () {
    return <div className={css(paymentCommon.panel, styles.panel)}>
      <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerFirst)}>
        <span className={cx({
          fa: true,
          'fa-credit-card': true,
          [css(styles.fa)]: true,
          [css(styles.faCreditCard)]: true
        })} />
        <div className={css(styles.settingsListTitle)} data-l10n-id='outsideUSAPayment' />
      </div>
      <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerLast)}>
        <a target='_blank' href='https://www.buybitcoinworldwide.com/'>
          {/* TODO: refactor button.js */}
          <Button className={cx({
            primaryButton: true,
            [css(styles.panelButton)]: true
          })}
            testId='worldWidePanelButton'
            label='buybitcoinworldwide.com' />
        </a>
      </div>
    </div>
  }

  copyToClipboard (text) {
    aboutActions.setClipboard(text)
  }

  onMessage (e) {
    if (!e.data || e.origin !== config.coinbaseOrigin) {
      return
    }
    if (e.data.event === 'modal_closed') {
      if (this.buyCompleted) {
        this.props.hideParentOverlay()
        this.buyCompleted = false
      } else {
        this.props.hideOverlay()
      }
    } else if (e.data.event === 'buy_completed') {
      this.buyCompleted = true
    }
  }

  render () {
    window.addEventListener('message', this.onMessage.bind(this), false)
    const ledgerData = this.props.ledgerData

    // TODO remove bitcoinDashboard class
    return <div className='bitcoinDashboard' data-test-id='bitcoinDashboard'>
      {
        this.props.bitcoinOverlayVisible
          ? <ModalOverlay
            title={'bitcoinBuy'}
            content={this.bitcoinOverlayContent()}
            customTitleClasses={'coinbaseOverlay'}
            emptyDialog
            onHide={this.props.hideOverlay.bind(this)}
          />
          : null
      }
      {
        this.props.qrcodeOverlayVisible
          ? <ModalOverlay
            content={this.qrcodeOverlayContent()}
            customTitleClasses={'qrcodeOverlay'}
            footer={this.qrcodeOverlayFooter()}
            onHide={this.props.hideQRcode.bind(this)}
          />
          : null
      }
      <div className={css(paymentCommon.board)}>
        {
          (this.userInAmerica || ledgerData.get('buyURLFrame'))
            ? this.coinbasePanel()
            : this.exchangePanel()
        }
        <div className={css(paymentCommon.panel, styles.panel)}>
          <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerFirst)}>
            <span className={cx({
              'fa-stack': true,
              'fa-lg': true,
              [css(styles.bitcoinIcon)]: true
            })}>
              <span className={cx({
                fa: true,
                'fa-circle': true,
                'fa-stack-2x': true,
                [css(styles.faCircle)]: true,
                [css(styles.fa)]: true
              })} />
              <span className={cx({
                fa: true,
                'fa-bitcoin': true,
                'fa-stack-1x': true,
                [css(styles.faBitcoin)]: true,
                [css(styles.fa)]: true
              })} />
            </span>
            <div className={css(styles.settingsListTitle)} data-l10n-id='bitcoinAdd' />
            <div className={css(styles.settingsListTitle, styles.subTitle)} data-l10n-id='bitcoinAddDescription' />
          </div>
          {
            ledgerData.get('address')
              ? <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerLast)}>
                {
                  ledgerData.get('hasBitcoinHandler') && ledgerData.get('paymentURL')
                    ? <div className={css(styles.hasBitcoinHandler)}>
                      <a href={ledgerData.get('paymentURL')} target='_blank'>
                        {/* TODO: refactor button.js */}
                        <Button className={cx({
                          primaryButton: true,
                          [css(globalStyles.spacing.dialogInsideMargin)]: true
                        })}
                          l10nId='bitcoinVisitAccount'
                          testId='bitcoinVisitAccountButton'
                        />
                      </a>
                      <div data-l10n-id='bitcoinAddress' className={css(styles.walletLabelText)} />
                    </div>
                    : <div>
                      <div data-l10n-id='bitcoinPaymentURL' className={css(styles.walletLabelText)} />
                    </div>
                }
                <div className={css(styles.walletAddressText)}>{ledgerData.get('address')}</div>
                {/* TODO: refactor button.js */}
                <Button className={cx({
                  primaryButton: true,
                  [css(styles.panelButton)]: true
                })}
                  l10nId='copyToClipboard'
                  testId='copyToClipboardButton'
                  onClick={this.copyToClipboard.bind(this, ledgerData.get('address'))} />
              </div>
              : <div className={css(styles.settingsPanelDivider, styles.settingsPanelDividerLast)}>
                <div data-l10n-id='bitcoinWalletNotAvailable' />
              </div>
          }
        </div>
        {this.smartphonePanel()}
        {this.panelFooter()}
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  panel: {
    display: 'flex',
    paddingLeft: '100px'
  },
  panelFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  disabledPanel: {
    padding: '15px 0'
  },
  panelButton: {
    minWidth: '180px'
  },
  settingsPanelDivider: {
    width: '50%',
    position: 'relative',
    display: 'flex',
    flexFlow: 'column'
  },
  settingsPanelDividerFirst: {
    alignItems: 'flex-start'
  },
  settingsPanelDividerLast: {
    alignItems: 'flex-end'
  },
  bitcoinQRTitle: {
    color: globalStyles.color.braveOrange,
    textAlign: 'center'
  },
  qrcodeOverlayFooter: {
    display: 'flex',
    justifyContent: 'center',
    background: globalStyles.color.gray,
    padding: '15px 0'
  },
  qrcodeLogo: {
    width: '130.5px',
    height: '42.75px',
    display: 'inline-block'
  },
  qrcodeImage: {
    clear: 'both',
    display: 'block',
    margin: '0 auto'
  },
  appstoreLogo: {
    background: `url(${IOS})`,
    backgroundSize: '130.5px 42.75px',
    marginRight: '5px'
  },
  playstoreLogo: {
    background: `url(${Andorid})`,
    backgroundSize: '130.5px 42.75px'
  },
  coinbaseLogo: {
    width: '40px',
    height: '40px',
    display: 'inlineBlock',
    marginTop: '1px',
    marginRight: '10px',
    background: `url(${CoinBase}) 0 0 / contain no-repeat`
  },
  settingsListTitle: {
    color: '#444444',
    fontWeight: 'bold',
    fontSize: '15px',
    margin: '0'
  },
  subTitle: {
    clear: 'both',
    fontWeight: 'normal',
    fontSize: '14px',
    fontStyle: 'italic',
    lineHeight: '1.3em',
    marginTop: '20px'
  },
  coinbaseFooter: {
    justifyContent: 'space-between'
  },
  coinbase: {
    display: 'flex',
    alignItems: 'center'
  },
  coinbaseMessage: {
    display: 'inline-block',
    maxWidth: '450px'
  },
  bitcoinIcon: {
    position: 'absolute',
    left: '-5px',
    top: 0
  },
  walletLabelText: {
    fontSize: '1em',
    color: globalStyles.color.braveOrange,
    marginBottom: '5px'
  },
  walletAddressText: {
    fontSize: '12px',
    color: 'black',
    marginBottom: '15px'
  },
  hasBitcoinHandler: {
    display: 'flex',
    flexFlow: 'column',
    alignItems: 'flex-end'
  },
  alignMiddle: {
    justifyContent: 'center'
  },
  faCircle: {
    color: globalStyles.color.bitcoinOrange
  },
  faBitcoin: {
    color: 'white',
    transform: 'rotate(12deg)'
  },
  faCreditCard: {
    fontSize: '30px'
  },
  faMobile: {
    fontSize: '50px',
    left: '-40px'
  },
  fa: {
    position: 'absolute',
    left: '-45px'
  }
})

module.exports = BitcoinDashboard
