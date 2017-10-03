/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// components
const ImmutableComponent = require('../../immutableComponent')

// style
const globalStyles = require('../../styles/global')
const commonStyles = require('../../styles/commonStyles')
const PIA = require('../../../../extensions/brave/img/private_internet_access.png')
const PIA2 = require('../../../../extensions/brave/img/private_internet_access_2x.png')
const uphold = require('../../../../extensions/brave/img/ledger/uphold_logo_small.png')
const uphold2 = require('../../../../extensions/brave/img/ledger/uphold_logo_medium.png')

class DisabledContent extends ImmutableComponent {
  render () {
    return <section className={css(styles.disabledContent)} data-test-id='disabledContent'>
      <div className={css(styles.disabledContent__message)} data-test-id='paymentsMessage'>
        <h3 className={css(styles.disabledContent__message__header)} data-l10n-id='paymentsWelcomeTitle' />
        <div className={css(styles.disabledContent__message__text)} data-l10n-id='paymentsWelcomeText1' />
        <div className={css(styles.disabledContent__message__text, styles.disabledContent__message__text_bold)} data-l10n-id='paymentsWelcomeText2' />
        <div className={css(styles.disabledContent__message__text)} data-l10n-id='paymentsWelcomeText3' />
        <div className={css(styles.disabledContent__message__text)} data-l10n-id='paymentsWelcomeText4' />
        <div className={css(styles.disabledContent__message__text)} data-l10n-id='paymentsWelcomeText5' />
        <div className={css(styles.disabledContent__message__text)}>
          <span data-l10n-id='paymentsWelcomeText6' />&nbsp;
          <a className={css(commonStyles.linkText)} href='https://brave.com/Payments_FAQ.html' rel='noopener' target='_blank' data-l10n-id='paymentsWelcomeLink' />&nbsp;
          <span data-l10n-id='paymentsWelcomeText7' />
        </div>
      </div>
      <div className={css(styles.disabledContent__sidebar)}>
        <h2 className={css(styles.disabledContent__sidebar__header)} data-l10n-id='paymentsSidebarText1' />
        <div className={css(styles.disabledContent__sidebar__text)} data-l10n-id='paymentsSidebarText2' />
        <a href='https://www.privateinternetaccess.com/' rel='noopener' target='_blank'><span className={css(styles.disabledContent__sidebar__logo, styles.disabledContent__sidebar__logo_PIA)} /></a>
        <div className={css(styles.disabledContent__sidebar__text)} data-l10n-id='paymentsSidebarText3' />
        <a href='https://uphold.com/' rel='noopener' target='_blank'><span className={css(styles.disabledContent__sidebar__logo, styles.disabledContent__sidebar__logo_uphold)} /></a>
      </div>
    </section>
  }
}

const styles = StyleSheet.create({
  disabledContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: globalStyles.spacing.panelMargin
  },

  disabledContent__message: {
    backgroundColor: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    fontSize: globalStyles.payments.fontSize.regular,
    lineHeight: '1.8em',
    color: globalStyles.color.mediumGray
  },

  disabledContent__message__header: {
    fontSize: '18px',
    paddingBottom: '0.5em'
  },

  disabledContent__message__text: {
    padding: '0.5em 0'
  },

  disabledContent__message__text_bold: {
    fontWeight: 'bold'
  },

  disabledContent__sidebar: {
    minWidth: '200px',
    marginLeft: '35px'
  },

  disabledContent__sidebar__header: {
    opacity: 0.8,
    fontSize: '18px',
    margin: '70px 0 30px'
  },

  disabledContent__sidebar__text: {
    opacity: 0.8,
    fontSize: globalStyles.payments.fontSize.regular
  },

  disabledContent__sidebar__logo: {
    margin: '20px 0px 50px',
    display: 'block'
  },

  disabledContent__sidebar__logo_PIA: {
    backgroundImage: `-webkit-image-set(url(${PIA}) 1x, url(${PIA2}) 2x)`,
    width: '195px',
    height: '20px'
  },

  disabledContent__sidebar__logo_uphold: {
    backgroundImage: `-webkit-image-set(url(${uphold}) 1x, url(${uphold2}) 2x)`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    height: '50px'
  }
})

module.exports = DisabledContent
