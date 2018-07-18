/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')

// Utils
const cx = require('../../../../../js/lib/classSet')

// style
const globalStyles = require('../../styles/global')
const commonStyles = require('../../styles/commonStyles')
const uphold = require('../../../../extensions/brave/img/ledger/uphold_logo_small.png')
const uphold2 = require('../../../../extensions/brave/img/ledger/uphold_logo_medium.png')

class DisabledContent extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.text = this.getAlternativeText()
  }

  getAlternativeText () {
    return <div>
      <h3 className={css(styles.disabledContent__message__header)} data-l10n-id='paymentsWelcomeTitle' />
      <p className={css(styles.disabledContent__commonText)} data-l10n-id='paymentsWelcomeText1' />
      <p className={css(styles.disabledContent__commonText)} data-l10n-id='paymentsWelcomeText2' />
    </div>
  }

  getText () {
    if (this.props.ledgerData == null) {
      return
    }

    const markup = this.props.ledgerData.getIn(['promotion', 'panel', 'optInMarkup'])
    const claimed = this.props.ledgerData.has('claimedTimestamp')

    if (!markup || claimed) {
      return
    }

    const text = markup.get('title')
    let message = markup.get('message')

    this.text = <div>
      <h3 className={css(styles.disabledContent__message__header)}>{ text }</h3>
      {
        message.map(item => <p className={css(styles.disabledContent__commonText)}>{ item }</p>)
      }
    </div>
  }

  render () {
    this.getText()

    return <section className={css(styles.disabledContent)} data-test-id='disabledContent'>
      <div>
        <div className={css(styles.disabledContent__wrapper)} data-test-id='paymentsMessage'>
          <div className={cx({
            [css(styles.disabledContent__message)]: true,
            disabledLedgerContent: true
          })} data-test-id='paymentsMessage'>
            {this.text}
          </div>
          <div className={css(styles.disabledContent__message__toc)}>
            <a data-l10n-id='termsOfService'
              data-test-id='termsOfService'
              className={css(styles.disabledContent__message__toc__link)}
              href='https://basicattentiontoken.org/contributor-terms-of-service/'
              target='_blank'
              rel='noreferrer noopener'
            />
          </div>
          <div className={css(styles.disabledContent__footer)}>
            <div className={css(styles.disabledContent__commonText)} data-l10n-id='paymentsWelcomeText3' />
            <div className={css(styles.disabledContent__commonText)} data-l10n-id='paymentsWelcomeText4' />
            <div className={css(styles.disabledContent__commonText)} data-l10n-id='paymentsWelcomeText5' />
            <div className={css(styles.disabledContent__commonText)}>
              <span data-l10n-id='paymentsWelcomeText6' />&nbsp;
              <a className={css(commonStyles.linkText)} href='https://brave.com/Payments_FAQ.html' rel='noopener' target='_blank' data-l10n-id='paymentsWelcomeLink' />&nbsp;
              <span data-l10n-id='paymentsWelcomeText7' />
            </div>
          </div>
        </div>
      </div>
      <div className={css(styles.disabledContent__sidebar)}>
        <h2 className={css(styles.disabledContent__sidebar__header)} data-l10n-id='paymentsSidebarText1' />
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

  disabledContent__commonText: {
    padding: '0.5em 0'
  },

  disabledContent__commonText_bold: {
    fontWeight: 'bold'
  },

  disabledContent__wrapper: {
    fontSize: globalStyles.payments.fontSize.regular,
    color: globalStyles.color.mediumGray
  },

  disabledContent__message: {
    backgroundColor: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    lineHeight: '1.8em'
  },

  disabledContent__message__header: {
    fontSize: '18px',
    paddingBottom: '0.5em'
  },

  disabledContent__message__toc: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    padding: '20px 0'
  },

  disabledContent__message__toc__link: {
    fontSize: '13px',
    color: '#666'
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

  disabledContent__sidebar__logo_uphold: {
    backgroundImage: `-webkit-image-set(url(${uphold}) 1x, url(${uphold2}) 2x)`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    height: '50px'
  },

  disabledContent__footer: {
    lineHeight: '1.2em',
    padding: '20px'
  }
})

module.exports = DisabledContent
