/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// components
const ImmutableComponent = require('../../immutableComponent')

// style
const globalStyles = require('../../styles/global')
const {paymentStyles} = require('../../styles/payment')
const PIA = require('../../../../extensions/brave/img/private_internet_access.png')
const PIA2 = require('../../../../extensions/brave/img/private_internet_access_2x.png')
const uphold = require('../../../../extensions/brave/img/ledger/uphold_logo_small.png')
const uphold2 = require('../../../../extensions/brave/img/ledger/uphold_logo_medium.png')

class DisabledContent extends ImmutableComponent {
  render () {
    return <section data-test-id='disabledContent'>
      <div className={css(styles.paymentsMessage, styles.walletBarMargin)} data-test-id='paymentsMessage'>
        <h3 className={css(styles.h3)} data-l10n-id='paymentsWelcomeTitle' />
        <div className={css(styles.text)} data-l10n-id='paymentsWelcomeText1' />
        <div className={css(styles.boldText, styles.text)} data-l10n-id='paymentsWelcomeText2' />
        <div className={css(styles.text)} data-l10n-id='paymentsWelcomeText3' />
        <div className={css(styles.text)} data-l10n-id='paymentsWelcomeText4' />
        <div className={css(styles.text)}data-l10n-id='paymentsWelcomeText5' />
        <div className={css(styles.text)}>
          <span data-l10n-id='paymentsWelcomeText6' />&nbsp;
          <a className='linkText' href='https://brave.com/Payments_FAQ.html' target='_blank' data-l10n-id='paymentsWelcomeLink' />&nbsp;
          <span data-l10n-id='paymentsWelcomeText7' />
        </div>
      </div>
      <div className={css(styles.paymentsSidebar)}>
        <h2 className={css(styles.sideH2)} data-l10n-id='paymentsSidebarText1' />
        <div className={css(styles.textSide)} data-l10n-id='paymentsSidebarText2' />
        <a href='https://www.privateinternetaccess.com/' target='_blank'><span className={css(styles.paymentsSidebarPIA)} /></a>
        <div className={css(styles.textSide)} data-l10n-id='paymentsSidebarText3' />
        <a href='https://uphold.com/' rel='noopener' target='_blank'><span className={css(styles.paymentsSidebarUphold)} /></a>
      </div>
    </section>
  }
}

const styles = StyleSheet.create({
  paymentsMessage: {
    backgroundColor: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    padding: '40px',
    fontSize: paymentStyles.font.regular,
    lineHeight: '1.8em',
    color: globalStyles.color.mediumGray,
    width: '500px',
    float: 'left'
  },

  text: {
    padding: '0.5em 0'
  },

  textSide: {
    fontSize: paymentStyles.font.regular,
    margin: '50px 0 20px 12px'
  },

  walletBarMargin: {
    marginTop: globalStyles.spacing.panelMargin
  },

  h3: {
    fontSize: '18px',
    paddingBottom: '0.5em'
  },

  sideH2: {
    fontSize: '18px',
    margin: '70px 0 -15px 12px'
  },

  boldText: {
    fontWeight: 'bold'
  },

  paymentsSidebar: {
    opacity: 0.8,
    width: '200px',
    float: 'left',
    marginLeft: '23px'
  },

  paymentsSidebarPIA: {
    backgroundImage: `-webkit-image-set(url(${PIA}) 1x, url(${PIA2}) 2x)`,
    width: '195px',
    height: '20px',
    margin: '0 0 20px 12px',
    display: 'block'
  },

  paymentsSidebarUphold: {
    backgroundImage: `-webkit-image-set(url(${uphold}) 1x, url(${uphold2}) 2x)`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    margin: '0 0 20px 12px',
    display: 'block',
    height: '50px'
  }
})

module.exports = DisabledContent
