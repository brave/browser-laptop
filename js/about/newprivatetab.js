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
const torEnabled = ['newTabDetail', 'torEnabled']

class NewPrivateTab extends React.Component {
  onChangePrivateSearch (e) {
    aboutActions.changeSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE, e.target.value)
  }

  onChangeTor (e) {
    aboutActions.changeSetting(settings.USE_TOR_PRIVATE_TABS, e.target.value)
    aboutActions.recreateTorTab(e.target.value)
  }

  onClickPrivateSearchTitle () {
    const newSettingValue = !this.props.newTabData.getIn(useAlternativePrivateSearchEngineDataKeys)
    aboutActions.changeSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE, newSettingValue)
  }

  onClickTorTitle () {
    const newSettingValue = !this.props.newTabData.getIn(torEnabled)
    aboutActions.changeSetting(settings.USE_TOR_PRIVATE_TABS, newSettingValue)
  }

  render () {
    if (!this.props.newTabData) {
      return null
    }
    return <div data-test-id='privateTabContent' className={css(styles.newPrivateTab, styles.newPrivateTabVars)}>
      <div className='statsBar'>
        <Stats newTabData={this.props.newTabData} />
        <Clock />
      </div>
      <div className={css(styles.section_privateTab, styles.wrapper)}>
        <div className={css(styles.textWrapper)}>
          <h1 className={css(styles.title)} data-l10n-id='privateTabTitle' />
          {
            this.props.newTabData.hasIn(useAlternativePrivateSearchEngineDataKeys) &&
            <div className={css(styles.privateSearch)}>
              <div className={css(styles.privateSearch__setting)}>
                <img className={css(styles.privateSearch__ddgImage)} src={ddgIcon} alt='DuckDuckGo logo' />
                <span>
                  <h2 onClick={this.onClickPrivateSearchTitle.bind(this)} className={css(styles.privateSearch__title)}>
                    <span className={css(styles.text_sectionTitle)} data-l10n-id='privateTabSearchSectionTitle' />
                  </h2>
                  <p className={css(styles.text, styles.text_privateSearch)} data-l10n-id='privateTabSearchText1' />
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
          {
            <div className={css(styles.privateSearch)}>
              <div className={css(styles.privateSearch__setting)}>
                <img className={css(styles.privateSearch__torImage)} src={torIcon} alt='Tor logo' />
                <span>
                  <h2 onClick={this.onClickPrivateSearchTitle.bind(this)} className={css(styles.privateSearch__title)}>
                    <span className={css(styles.text_sectionTitle)} data-l10n-id='privateTabTorTitle' />
                  </h2>
                  <p className={css(styles.text, styles.text_privateSearch)} data-l10n-id='privateTabTorText1' />
                </span>
                <SettingCheckbox
                  large
                  switchClassName={css(styles.privateSearch__switch)}
                  rightLabelClassName={css(styles.sectionTitle)}
                  checked={Boolean(this.props.newTabData.getIn(torEnabled))}
                  onChange={this.onChangeTor.bind(this)}
                />
              </div>
            </div>
          }
        </div>
      </div>
      <div className={css(styles.section_privateTab)}>
        <h1 className={css(styles.title)} data-l10n-id='privateTabsMore' />
        <p className={css(styles.text)} data-l10n-id='privateTabText1' />
        <p className={css(styles.text)} data-l10n-id='privateTabText2' />
        <p className={css(styles.text)} data-l10n-id='privateTabText3' />
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
    '--private-tab-section-title-font-size': '24px',
    '--private-tab-section-title-letter-spacing': globalStyles.typography.display.spacingMedium,
    '--private-tab-section-title-logo-height': 'calc((var(--private-tab-section-title-font-size) / 2) * 3)',

    [atBreakpointPrivateSearchTitle]: {
      '--private-tab-section-title-font-size': '18px',
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
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: '100%',
    height: 'initial',
    padding: '40px 60px' // same as newtab
  },

  section_privateTab: {
    margin: '0 0 10px 70px'
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
      padding: '14px 0',
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
    marginTop: '14px',
    marginBottom: '22px',
    fontFamily: globalStyles.typography.display.family,
    letterSpacing: globalStyles.typography.display.spacingLarge,
    fontSize: '30px',
    color: globalStyles.color.white100
  },

  text: {
    lineHeight: '1.5',
    fontSize: '17px',
    color: globalStyles.color.alphaWhite,
    maxWidth: '800px',
    fontFamily: 'inherit',
    ':not(:last-of-type)': {
      paddingBottom: '20px'
    }
  },

  text_privateSearch: {
    fontSize: '17px',
    lineHeight: '1.5'
  },

  text_sectionTitle: {
    fontFamily: globalStyles.typography.display.family,
    fontSize: 'var(--private-tab-section-title-font-size)',
    fontWeight: '400',
    color: globalStyles.color.white100,
    letterSpacing: 'var(--private-tab-section-title-letter-spacing)'
  },

  text_sectionTitleHighlight: {
    fontWeight: '600',
    marginLeft: '7px'
  },

  privateSearch: {
    border: 'solid 2px',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '10px'
  },

  privateSearch__setting: {
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'center'
  },

  privateSearch__ddgImage: {
    width: '82px',
    marginRight: '20px'
  },

  privateSearch__torImage: {
    width: '70px',
    marginRight: '14px'
  },

  privateSearch__switch: {
    marginLeft: '14px',
    padding: 0,
    cursor: 'pointer'
  },

  privateSearch__title: {
    maxWidth: '800px',
    whiteSpace: 'nowrap',
    marginRight: '18px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  }
})

module.exports = NewPrivateTab
