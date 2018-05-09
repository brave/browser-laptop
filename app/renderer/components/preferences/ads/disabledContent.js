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
const iconPaymentsOn = require('../../../../extensions/brave/img/preferences/ads_welcome_BG.png')

class DisabledContent extends React.Component {
  constructor () {
    super()
    this.onAgree = this.onAgree.bind(this)
    this.onStart = this.onStart.bind(this)
    this.state = {
      agree: false
    }
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

  render () {
    return <section className={css(styles.disabledContent)} data-test-id='disabledContent'>
      <div className={css(styles.disabledContent__message)} data-test-id='paymentsMessage'>
        <h3 className={css(styles.disabledContent__message__header)} data-l10n-id='adsWelcomeHeader' />
        <p className={css(styles.disabledContent__message__text)}>
          <span className={css(styles.disabledContent__message_white)} data-l10n-id='adsWelcomeText1' />&nbsp;
          <span className={css(styles.disabledContent__message_bold)} data-l10n-id='adsWelcomeText4' />&nbsp;
          <span className={css(styles.disabledContent__message_white)} data-l10n-id='adsWelcomeText5' />&nbsp;
        </p>
        <p className={css(styles.disabledContent__message__text)}>
          <span className={css(styles.disabledContent__message_white)} data-l10n-id='adsWelcomeText2' />
          <a
            href='https://brave.com/download'
            target='_blank'
            className={css(styles.disabledContent__message_white)}
          >
            https://brave.com/download
          </a>.
        </p>
        <p className={css(styles.disabledContent__message__text)} data-l10n-id='adsWelcomeText3' />
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
    background: `url(${iconPaymentsOn}) no-repeat bottom right #FB542B`,
    backgroundSize: 'contain',
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    lineHeight: '1.2em',
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
    opacity: 0.5
  },

  disabledContent__message__button_on: {
    opacity: 1,
    cursor: 'pointer'
  }
})

module.exports = DisabledContent
