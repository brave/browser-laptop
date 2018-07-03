/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const privateTabIcon = require('../../app/extensions/brave/img/newtab/private_tab_pagearea_icon.svg')
const ddgIcon = require('../../app/extensions/brave/img/newtab/private_tab_pagearea_ddgicon.svg')
const torIcon = require('../../app/extensions/brave/img/newtab/toricon.svg')
const globalStyles = require('../../app/renderer/components/styles/global')
const { theme } = require('../../app/renderer/components/styles/theme')
const {SettingCheckbox} = require('../../app/renderer/components/common/settings')
const settings = require('../constants/settings')
const Stats = require('./newTabComponents/stats')
const Clock = require('./newTabComponents/clock')
const aboutActions = require('./aboutActions')

// TODO: remove it once we use Aphrodite on stats and clock components
require('../../less/about/newtab.less')

const useAlternativePrivateSearchEngineDataKeys = ['newTabDetail', 'useAlternativePrivateSearchEngine']
const torFAQ = 'https://github.com/brave/browser-laptop/wiki/Using-Tor-in-Brave#faq'

const onChangeTor = (value) => {
  aboutActions.recreateTorTab(value)
}

class NewPrivateTab extends React.Component {
  onChangePrivateSearch (e) {
    aboutActions.changeSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE, e.target.value)
  }

  onChangeTor (e) {
    onChangeTor(e.target.value)
  }

  onClickPrivateSearchTitle () {
    const newSettingValue = !this.props.newTabData.getIn(useAlternativePrivateSearchEngineDataKeys)
    aboutActions.changeSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE, newSettingValue)
  }

  onClickTorTitle () {
    const newSettingValue = !this.props.torEnabled
    onChangeTor(newSettingValue)
  }

  render () {
    if (!this.props.newTabData) {
      return null
    }
    const isTor = Boolean(this.props.torEnabled)
    return <div data-test-id='privateTabContent' className={css(styles.newPrivateTab, styles.newPrivateTabVars)}>
      <div className='statsBar'>
        <Stats newTabData={this.props.newTabData} />
        <Clock />
      </div>
      <div className={css(styles.section_privateTab, styles.wrapper)}>
        <div className={css(styles.textWrapper)}>
          <h1 className={css(styles.title)} data-l10n-id='privateTabTitle' />
          {
            <div className={css(styles.privateSearch)}>
              <div className={css(styles.privateSearch__setting)}>
                <img className={css(styles.privateSearch__torImage)} src={torIcon} alt='Tor logo' />
                <span>
                  <h2 onClick={this.onClickTorTitle.bind(this)} className={css(styles.privateSearch__title)}>
                    <span className={css(styles.text_sectionTitle)} data-l10n-id='privateTabTorTitle' />
                    <strong className={css(styles.text_sectionTitle, styles.text_sectionTitleHighlight)}>&nbsp;Tor</strong>
                    <span className={css(styles.text__badge, styles.text__badge_beta)}>Beta</span>
                  </h2>
                  <p className={css(styles.text)} data-l10n-id='privateTabTorText1' />
                  <p className={css(styles.text, styles.text_clickable)} onClick={aboutActions.createTabRequested.bind(null, {url: torFAQ, isPrivate: true, isTor})} data-l10n-id='learnMore' />
                </span>
                <SettingCheckbox
                  large
                  switchClassName={css(styles.privateSearch__switch)}
                  rightLabelClassName={css(styles.sectionTitle)}
                  checked={isTor}
                  onChange={this.onChangeTor.bind(this)}
                />
              </div>
            </div>
          }
          {
            isTor &&
            <div className={css(styles.privateSearch)}>
              <div className={css(styles.privateSearch__setting)}>
                <p>
                  <span className={css(styles.text, styles.text_DDG)} data-l10n-id='privateTabTorText2' />
                  <span className={css(styles.text, styles.text_clickable)} data-l10n-id='searchPreferences' onClick={aboutActions.createTabRequested.bind(null, {url: 'about:preferences#search'})} />
                </p>
              </div>
            </div>
          }
          {
            !isTor &&
            this.props.newTabData.hasIn(useAlternativePrivateSearchEngineDataKeys) &&
            <div className={css(styles.privateSearch)}>
              <div className={css(styles.privateSearch__setting)}>
                <img className={css(styles.privateSearch__ddgImage)} src={ddgIcon} alt='DuckDuckGo logo' />
                <span>
                  <h2 onClick={this.onClickPrivateSearchTitle.bind(this)} className={css(styles.privateSearch__title)}>
                    <span className={css(styles.text_sectionTitle)} data-l10n-id='privateTabSearchSectionTitle' />
                    <strong className={css(styles.text_sectionTitle, styles.text_sectionTitleHighlight)}>&nbsp;DuckDuckGo</strong>
                  </h2>
                  <p className={css(styles.text)} data-l10n-id='privateTabSearchText1' />
                </span>
                <SettingCheckbox
                  large
                  switchClassName={css(styles.privateSearch__switch)}
                  rightLabelClassName={css(styles.sectionTitle)}
                  checked={Boolean(this.props.newTabData.getIn(useAlternativePrivateSearchEngineDataKeys))}
                  onChange={this.onChangePrivateSearch.bind(this)}
                />
              </div>
            </div>
          }
        </div>
      </div>
      <div className={css(styles.section_privateTab)}>
        <h1 className={css(styles.text)} data-l10n-id='privateTabsMore' />
        <p className={css(styles.text_footer)} data-l10n-id='privateTabText1' />
      </div>
    </div>
  }
}

// point at which icon gutter should collapse
const atBreakpointIconGutter = `@media screen and (max-width: 800px)`
// point at which Private Search trio (switch, title, logo) should squeeze to fit
const atBreakpointPrivateSearchTitle = '@media screen and (max-width: 590px)'
const styles = StyleSheet.create({
  newPrivateTabVars: {
    '--private-tab-section-title-font-size': '20px',
    '--private-tab-section-title-letter-spacing': globalStyles.typography.display.spacingMedium,
    '--private-tab-section-title-logo-height': 'calc((var(--private-tab-section-title-font-size) / 2) * 3)',

    [atBreakpointPrivateSearchTitle]: {
      '--private-tab-section-title-font-size': '20px',
      '--private-tab-section-title-letter-spacing': globalStyles.typography.display.spacingRegular
    }
  },

  newPrivateTab: {
    background: `linear-gradient(
      ${theme.frame.privateTabBackground},
      ${theme.frame.privateTabBackground2}
    )`,
    backgroundAttachment: 'fixed',
    // fade in from the new tab background color
    animationName: {
      '0%': {
        opacity: '0'
      },
      '100%': {
        opacity: '1'
      }
    },
    animationDuration: `0.35s`,
    animationTiming: 'ease-out',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100%',
    height: 'initial',
    padding: '40px 60px' // same as newtab
  },

  wrapper: {
    fontFamily: globalStyles.typography.body.family,
    display: 'flex',
    maxWidth: '780px',

    [atBreakpointIconGutter]: {
      flexDirection: 'column'
    }
  },

  textWrapper: {
    fontFamily: 'inherit',
    marginBottom: 0,
    [atBreakpointIconGutter]: {
      alignSelf: 'center',
      display: 'flex',
      flexDirection: 'column'
    }
  },

  iconGutter: {
    minWidth: '80px',
    minHeight: '100px',
    display: 'flex',
    // position contents at the top right
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    flexDirection: 'row',

    [atBreakpointIconGutter]: {
      alignSelf: 'center',
      // position contents in the middle
      justifyContent: 'center'
    }
  },

  lionImage: {
    backgroundImage: `url(${privateTabIcon})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center top',
    backgroundSize: 'contain'
  },

  title: {
    marginTop: '20px',
    marginBottom: '30px',
    paddingBottom: '30px',
    fontFamily: globalStyles.typography.display.family,
    letterSpacing: globalStyles.typography.display.spacingLarge,
    fontSize: '26px',
    color: globalStyles.color.white100,
    borderBottom: 'solid 1px rgba(255,255,255,.1)'
  },

  text: {
    lineHeight: '1.75',
    fontSize: '16px',
    color: globalStyles.color.alphaWhite,
    maxWidth: '800px',
    fontFamily: 'inherit',
    paddingRight: '40px'
  },

  text_DDG: {
    paddingRight: '10px'
  },

  text_footer: {
    lineHeight: '1.5',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, .5)',
    maxWidth: '800px',
    fontFamily: 'inherit'
  },

  text_sectionTitle: {
    fontFamily: globalStyles.typography.display.family,
    fontSize: 'var(--private-tab-section-title-font-size)',
    fontWeight: '400',
    color: globalStyles.color.white100,
    letterSpacing: 'var(--private-tab-section-title-letter-spacing)'
  },

  text_sectionTitleHighlight: {
    fontWeight: '600'
  },

  text_clickable: {
    cursor: 'pointer',
    textDecoration: 'underline',
    color: '#FF6000',
    marginTop: '20px',
    paddingRight: 0,
    display: 'inline-block'
  },

  text__badge: {
    alignSelf: 'center',
    marginLeft: '10px',
    padding: '3px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    font: '600 11px Poppins',
    letterSpacing: '0.5px'
  },

  text__badge_beta: {
    background: '#0795fa',
    color: 'white'
  },

  privateSearch: {
    borderBottom: 'solid 1px rgba(255,255,255,.1)',
    marginBottom: '30px'
  },

  privateSearch__setting: {
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center'
  },

  privateSearch__ddgImage: {
    width: '114px',
    marginRight: '30px'
  },

  privateSearch__torImage: {
    width: '114px',
    marginRight: '30px'
  },

  privateSearch__switch: {
    padding: 0,
    cursor: 'pointer'
  },

  privateSearch__title: {
    maxWidth: '800px',
    whiteSpace: 'nowrap',
    marginBottom: '10px',
    display: 'flex',
    cursor: 'pointer'
  }
})

module.exports = NewPrivateTab
