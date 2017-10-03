/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Components
const React = require('react')
const {AboutPageSectionTitle} = require('../../../../common/sectionTitle')

// Styles
const {StyleSheet, css} = require('aphrodite')
const {addFundsDialogMinHeight} = require('../../../../styles/global').spacing
const batIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')

class BatWelcomeScreen extends React.Component {
  render () {
    return (
      <div data-test-id='batWelcomeScreen'
        className={css(styles.addFundsBatScreen)}
      >
        <AboutPageSectionTitle canWrap data-l10n-id='helloBat' />
        <p data-l10n-id='helloBatText1'
          className={css(styles.addFundsBatScreen__text)}
        />
        <p data-l10n-id='helloBatText2'
          className={css(styles.addFundsBatScreen__text)}
        />
      </div>
    )
  }
}

class BatContribMatching extends React.Component {
  render () {
    return (
      <div data-test-id='batContribMatching'
        className={css(styles.addFundsBatScreen)}>
        <div>
          <AboutPageSectionTitle canWrap data-l10n-id='batContributionTitle' />
          <p data-l10n-id='batContributionText1'
            className={css(styles.addFundsBatScreen__text)}
          />
          <p data-l10n-id='batContributionText2'
            className={css(styles.addFundsBatScreen__text)}
          />
        </div>
        <p data-l10n-id='batContributionText3'
          className={css(
            styles.addFundsBatScreen__text,
            styles.addFundsBatScreen__text_small
          )}
        />
      </div>
    )
  }
}

const styles = StyleSheet.create({
  addFundsBatScreen: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: '60px',
    minHeight: addFundsDialogMinHeight,

    '::before': {
      position: 'absolute',
      top: 0,
      left: 0,
      content: '""',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundImage: `url(${batIcon})`,
      width: '40px',
      height: '40px'
    }
  },

  addFundsBatScreen__text: {
    margin: '20px 0'
  },

  addFundsBatScreen__text_small: {
    fontSize: 'small'
  }
})

module.exports = {
  BatWelcomeScreen,
  BatContribMatching
}
