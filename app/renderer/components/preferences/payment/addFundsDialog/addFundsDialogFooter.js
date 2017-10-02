/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Components
const React = require('react')
const BrowserButton = require('../../../common/browserButton')

// Actions
const appActions = require('../../../../../../js/actions/appActions')

// Styles
const {StyleSheet, css} = require('aphrodite')
const upholdLogo = require('../../../../../extensions/brave/img/ledger/uphold-logo.png')

class AddFundsDialogFooter extends React.Component {
  constructor (props) {
    super(props)
    this.onBack = this.onBack.bind(this)
    this.onNext = this.onNext.bind(this)
    this.onDone = this.onDone.bind(this)
  }

  get currentPage () {
    return this.props.addFundsDialog.get('currentPage')
  }

  onBack () {
    switch (this.currentPage) {
      case 'batContribMatching':
        appActions.onChangeAddFundsDialogStep('batWelcomeScreen')
        break
      case 'addFundsWizardMain':
        appActions.onChangeAddFundsDialogStep('batContribMatching')
        break
      case 'addFundsWizardAddress':
        appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
        break
      default:
        break
    }
  }

  onNext () {
    switch (this.currentPage) {
      case 'batContribMatching':
        appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
        break
      case 'addFundsWizardMain':
        appActions.onChangeAddFundsDialogStep('addFundsWizardAddress')
        break
      default:
        appActions.onChangeAddFundsDialogStep('batContribMatching')
        break
    }
  }

  onDone () {
    // close the dialog and set default page
    // to add funds wizard to avoid
    // user seeing welcome greetings all the time
    this.props.onHide()
    appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
  }

  get showBackButton () {
    return (
      this.currentPage != null &&
      this.currentPage !== 'batWelcomeScreen'
    )
  }

  get showNextButton () {
    return (
      this.currentPage !== 'addFundsWizardMain' &&
      this.currentPage !== 'addFundsWizardAddress'
    )
  }

  get showDoneButton () {
    return (
      this.currentPage === 'addFundsWizardMain' ||
      this.currentPage === 'addFundsWizardAddress'
    )
  }

  render () {
    return (
      <section className={css(styles.footer)} data-test-id='AddFundsDialogFooter'>
        <div className={css(styles.footer__start)}>
          <img src={upholdLogo}
            className={css(styles.footer__start__uphold_logo)}
          />
          <div className={css(styles.footer__start__uphold_text)}>
            <span data-l10n-id='uphold' />
            <a data-l10n-id='learnMore'
              href='https://uphold.com/signup'
              target='_blank'
              rel='noreferrer noopener'
            />
          </div>
        </div>
        <div>
          {
            this.showBackButton
              ? <BrowserButton l10nId='backWithArrow'
                groupedItem
                secondaryColor
                onClick={this.onBack}
              />
              : null
          }
          {
            this.showNextButton
            ? <BrowserButton l10nId='nextWithArrow'
              groupedItem
              secondaryColor
              onClick={this.onNext}
            />
            : null
          }
          {
            this.showDoneButton
            ? <BrowserButton l10nId='done'
              groupedItem
              secondaryColor
              onClick={this.onDone}
            />
            : null
          }
        </div>
      </section>
    )
  }
}

const styles = StyleSheet.create({
  footer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  footer__start: {
    display: 'flex',
    alignItems: 'center'
  },

  footer__start__uphold_logo: {
    width: '120px',
    hestart: '35px'
  },

  footer__start__uphold_text: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 'small',
    fontStyle: 'italic',
    margin: '0 10px'
  }
})

module.exports = AddFundsDialogFooter
