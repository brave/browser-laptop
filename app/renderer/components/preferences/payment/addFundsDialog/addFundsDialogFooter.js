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
const upholdLogo = require('../../../../../extensions/brave/img/ledger/uphold_logo_medium.png')

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
      case 'addFundsWizardMain':
        // TODO: add the below comment under 'batContribMatching'
        // when it is publicly available
        // appActions.onChangeAddFundsDialogStep('batContribMatching')
        // break
        appActions.onChangeAddFundsDialogStep('batWelcomeScreen')
        break
      case 'addFundsWizardAddress':
        appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
        this.props.onNavigate()
        break
      default:
        break
    }
  }

  onNext () {
    switch (this.currentPage) {
      // TODO: replace 'batWelcomeScreen' with 'batContribMatching'
      // once latter is available
      case 'batWelcomeScreen':
      // case 'batContribMatching':
        appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
        break
      case 'addFundsWizardMain':
        appActions.onChangeAddFundsDialogStep('addFundsWizardAddress')
        break
      default:
        // TODO: enable again once 'batContribMatching' is available
        // and remove the current
        // appActions.onChangeAddFundsDialogStep('batContribMatching')
        appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
        this.props.onNavigate()
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
      this.currentPage !== 'batWelcomeScreen' &&
      // Should users be allowed to go back once in the wizard?
      // for now they can't
      this.currentPage !== 'addFundsWizardMain'
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
      <section className={css(styles.footer)} data-test-id='addFundsDialogFooter'>
        <div className={css(styles.footer__start)}>
          <img src={upholdLogo}
            className={css(styles.footer__start__uphold_logo)}
          />
          <div className={css(styles.footer__start__uphold_text)}>
            <span data-l10n-id='upholdFooterText1' />
            <span data-l10n-id='upholdFooterText2' />
            <a data-l10n-id='learnMore'
              href='https://uphold.com/en/brave'
              target='_blank'
              rel='noreferrer noopener'
            />
          </div>
        </div>
        <div className={css(styles.footer__wrapper)}>
          {
            this.showBackButton
              ? <BrowserButton l10nId='backWithArrow'
                testId='previousButton'
                groupedItem
                secondaryColor
                onClick={this.onBack}
              />
              : null
          }
          {
            this.showNextButton
            ? <BrowserButton l10nId='nextWithArrow'
              testId='nextButton'
              groupedItem
              secondaryColor
              onClick={this.onNext}
            />
            : null
          }
          {
            this.showDoneButton
            ? <BrowserButton l10nId='done'
              testId='doneButton'
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
  },

  footer__wrapper: {
    display: 'flex'
  }
})

module.exports = AddFundsDialogFooter
