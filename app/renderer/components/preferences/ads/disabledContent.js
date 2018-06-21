/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const settings = require('../../../../../js/constants/settings')

// style
const globalStyles = require('../../styles/global')
const welcomeBg = require('../../../../extensions/brave/img/preferences/ads_welcome_BG.png')

class DisabledContent extends React.Component {
  constructor () {
    super()
    this.onAgree = this.onAgree.bind(this)
    this.onStart = this.onStart.bind(this)
    this.state = {
      agree: false
    }

    // check if notifications are configured correctly and currently allowed
    appActions.onNativeNotificationCheck(false)
  }

  onAgree () {
    this.setState({
      agree: !this.state.agree
    })
  }

  onStart () {
    if (this.state.agree) {
      appActions.changeSetting(settings.ADS_ENABLED, true)
    }
  }

  agreeBlock () {
    return <div>
      <div className={css(styles.disabledContent__message__checkbox)} onClick={this.onAgree}>
        <span className={css(styles.disabledContent__message__checkbox__box)}>
          <span className={css(this.state.agree && styles.disabledContent__message__checkbox__box_on)} />
        </span>
        <span
          className={css(
            styles.disabledContent__message_bold,
            styles.disabledContent__message__checkbox__text
          )}
          data-l10n-id='adsWelcomeAgree'
        />
      </div>
      <button
        className={css(
          styles.disabledContent__message__button,
          this.state.agree && styles.disabledContent__message__button_on
        )}
        data-l10n-id='adsWelcomeStart'
        onClick={this.onStart}
      />
    </div>
  }

  showWarning (config, available) {
    if (config === undefined && available === undefined) {
      return null
    }

    if (!available) {
      return <div className={css(styles.disabledContent__message__warning)}>
        <span data-l10n-id='adsWelcomeAvailable' className={css(styles.disabledContent__message__warning_text)} />&nbsp;
        <a href='https://brave.com/faq-ads-testing#linux-build' target={'_blank'} className={css(styles.disabledContent__message__warning_text)}>
          <span data-l10n-id='adsWelcomeMore' className={css(styles.disabledContent__message__warning_text)} />
        </a>
      </div>
    }

    if (!config) {
      return <div>
        <div className={css(styles.disabledContent__message__warning)}>
          <span data-l10n-id='adsWelcomeConfig' className={css(styles.disabledContent__message__warning_text)} />&nbsp;
          <a href='https://brave.com/faq-ads-testing#os-settings' target={'_blank'} className={css(styles.disabledContent__message__warning_text)}>
            <span data-l10n-id='adsWelcomeMore' className={css(styles.disabledContent__message__warning_text)} />
          </a>
        </div>
        <button
          data-l10n-id='adsWelcomeReTry'
          className={css(styles.disabledContent__message__button, styles.disabledContent__message__button_on)}
          onClick={appActions.onNativeNotificationConfigurationCheck}
        />
      </div>
    }
  }

  disabledContent = () => {
    const config = this.props.userModelData.configured
    const available = this.props.userModelData.available

    return <div>
      <p className={css(styles.disabledContent__message__text, styles.disabledContent__message_white)}>
        Thank you helping us develop BAT Ads in Brave. This test phase involves
        <b className={css(styles.disabledContent__message_bold)}> sending a detailed log of your browsing activity
        (including full URLs) in non-private tabs, which ads are seen and clicked, IP address, operating system and
        browser version, browser ads settings, when the browser is being used, and a unique identifier per
        participant to Brave. In addition, you may choose to send Brave a self-selected description of the
        location associated with your current WiFi network (“home”, “work”, etc.).</b>&nbsp;
        We use this information as algorithmic test data for our machine learning system that will be used upon release of Brave Ads.
      </p>
      <p className={css(styles.disabledContent__message__text, styles.disabledContent__message_white)}>
        Once you have opted in to the program, you can check the details of the log files collected and
        sent to Brave by clicking on ‘Click to see Logs’ on this page.
      </p>
      <p className={css(styles.disabledContent__message__text, styles.disabledContent__message_white)}>
        This is not a production version of Brave and
        <b className={css(styles.disabledContent__message_bold)}>does NOT offer the same privacy guarantees as the
        production version of the Brave browser.</b> Only use this version as part of the Brave Ads test program.
        Otherwise, download Brave from <a className={css(styles.disabledContent__message_white, styles.disabledContent__message_link)} href='https://brave.com/download'>https://brave.com/download</a>.
        When Brave Ads launches later this year, all personal data and browsing history will remain on-device
        and will not be transmitted to Brave or anyone else. The data being collected in this early test is
        specific to this test.
      </p>
      <p className={css(styles.disabledContent__message__text, styles.disabledContent__message_white)}>
        You can leave this test at any time by switching off this feature, or using the current release
        version of Brave. Any browsing done in private tabs is not subject to data collection. <a className={css(styles.disabledContent__message_white, styles.disabledContent__message_link)} href='https://brave.com/hc-privacy'>Learn more about this test.</a>
      </p>
      {
        config && available
        ? this.agreeBlock()
        : this.showWarning(config, available)
      }
    </div>
  }

  expiredContent () {
    return <div>
      <div className={css(styles.disabledContent__message__warning)}>
        <p className={css(styles.disabledContent__message__text)}>
          <span className={css(styles.disabledContent__message_white)} data-l10n-id='adsExpiredText1' />
        </p>
      </div>
      <a
        data-l10n-id='adsExpiredDownload'
        className={css(styles.disabledContent__message__button, styles.disabledContent__message__button_on)}
        href='https://brave.com/download'
        target='_blank'
        />
    </div>
  }

  render () {
    const expired = this.props.userModelData.expired

    return <section className={css(styles.disabledContent)} data-test-id='disabledContent'>
      <div className={css(styles.disabledContent__message)} data-test-id='paymentsMessage'>
        <h3 className={css(styles.disabledContent__message__header)} data-l10n-id='adsWelcomeHeader' />
        {
          expired
          ? this.expiredContent()
          : this.disabledContent()
        }
      </div>
    </section>
  }
}

const styles = StyleSheet.create({
  disabledContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'left',
    marginTop: globalStyles.spacing.panelMargin
  },

  disabledContent__message__text: {
    padding: '0.5em 0',
    color: globalStyles.color.white100,
    paddingRight: '63px'
  },

  disabledContent__message: {
    background: `url(${welcomeBg}) no-repeat top right, linear-gradient(180deg,#5c32e5 10%,#6b2f8e 100%);`,
    backgroundSize: 'contain',
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    lineHeight: '1.4em',
    fontSize: '15px'
  },

  disabledContent__message__header: {
    fontSize: '23px',
    paddingBottom: '30px',
    fontWeight: 'bold',
    color: globalStyles.color.white100
  },

  disabledContent__message_white: {
    color: globalStyles.color.white100,
    display: 'inline-block'
  },

  disabledContent__message_link: {
    textDecoration: 'underline !important'
  },

  disabledContent__message_bold: {
    fontWeight: 'bold',
    color: globalStyles.color.white100
  },

  disabledContent__message__checkbox: {
    marginTop: '20px',
    cursor: 'pointer'
  },

  disabledContent__message__checkbox__text: {
    fontSize: '17px',
    userSelect: 'none'
  },

  disabledContent__message__checkbox__box: {
    width: '15px',
    height: '15px',
    display: 'inline-block',
    border: '2px solid #FFF',
    borderRadius: '4px',
    marginRight: '10px',
    position: 'relative',
    top: '4px'
  },

  disabledContent__message__checkbox__box_on: {
    background: '#fff',
    width: '11px',
    height: '11px',
    display: 'block',
    margin: '2px 0 0 2px'
  },

  disabledContent__message__warning: {
    color: '#fff',
    marginTop: '20px',
    display: 'block',
    fontSize: '16px',
    fontWeight: 'bold'
  },

  disabledContent__message__warning_text: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold'
  },

  disabledContent__message__button: {
    background: 'none',
    marginTop: '70px',
    border: '2px solid #FFF',
    borderRadius: '20px',
    textTransform: 'uppercase',
    color: '#FFF',
    padding: '10px 50px',
    fontSize: '16px',
    fontWeight: 'bold',
    opacity: 0.5,
    display: 'inline-block',

    ':hover': {
      textDecoration: 'none'
    }
  },

  disabledContent__message__button_on: {
    opacity: 1,
    cursor: 'pointer'
  }
})

module.exports = DisabledContent
