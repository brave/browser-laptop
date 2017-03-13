/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// components
const ImmutableComponent = require('../../../../../js/components/immutableComponent')
const SortableTable = require('../../../../../js/components/sortableTable')

// style
const globalStyles = require('../../styles/global')
const verifiedGreenIcon = require('../../../../extensions/brave/img/ledger/verified_green_icon.svg')
const verifiedWhiteIcon = require('../../../../extensions/brave/img/ledger/verified_white_icon.svg')

// other
const settings = require('../../../../../js/constants/settings')
const getSetting = require('../../../../../js/settings').getSetting
const aboutActions = require('../../../../../js/about/aboutActions')
const {SettingCheckbox, SiteSettingCheckbox} = require('../../settings')

class LedgerTable extends ImmutableComponent {
  get synopsis () {
    return this.props.ledgerData.get('synopsis')
  }

  getFormattedTime (synopsis) {
    var d = synopsis.get('daysSpent')
    var h = synopsis.get('hoursSpent')
    var m = synopsis.get('minutesSpent')
    var s = synopsis.get('secondsSpent')
    if (d << 0 > 364) {
      return '>1y'
    }
    d = (d << 0 === 0) ? '' : (d + 'd ')
    h = (h << 0 === 0) ? '' : (h + 'h ')
    m = (m << 0 === 0) ? '' : (m + 'm ')
    s = (s << 0 === 0) ? '' : (s + 's ')
    return (d + h + m + s + '')
  }

  getHostPattern (synopsis) {
    return `https?://${synopsis.get('site')}`
  }

  getVerifiedIcon (synopsis) {
    return <span className={css(
      styles.verified,
      !this.enabledForSite(synopsis) && styles.disabled
    )} />
  }

  enabledForSite (synopsis) {
    const hostSettings = this.props.siteSettings.get(this.getHostPattern(synopsis))
    if (hostSettings) {
      const result = hostSettings.get('ledgerPayments')
      if (typeof result === 'boolean') {
        return result
      }
    }
    return getSetting(settings.AUTO_SUGGEST_SITES, this.props.settings)
  }

  shouldShow (synopsis) {
    const hostSettings = this.props.siteSettings.get(this.getHostPattern(synopsis))
    if (hostSettings) {
      const result = hostSettings.get('ledgerPaymentsShown')
      if (typeof result === 'boolean') {
        return result
      }
    }
    return true
  }

  banSite (hostPattern) {
    aboutActions.changeSiteSetting(hostPattern, 'ledgerPaymentsShown', false)
  }

  get columnClassNames () {
    return [
      css(styles.tableTd),
      css(styles.tableTd, styles.alignRight),
      css(styles.tableTd),
      css(styles.tableTd),
      css(styles.tableTd, styles.alignRight),
      css(styles.tableTd, styles.alignRight),
      css(styles.tableTd, styles.alignRight)
    ]
  }

  getRow (synopsis) {
    if (!synopsis || !synopsis.get || !this.shouldShow(synopsis)) {
      return []
    }
    const faviconURL = synopsis.get('faviconURL')
    const rank = synopsis.get('rank')
    const views = synopsis.get('views')
    const verified = synopsis.get('verified')
    const duration = synopsis.get('duration')
    const publisherURL = synopsis.get('publisherURL')
    const percentage = synopsis.get('percentage')
    const site = synopsis.get('site')
    const defaultAutoInclude = this.enabledForSite(synopsis)

    return [
      {
        html: <div className={css(styles.neverShowSiteIcon)}
          onClick={this.banSite.bind(this, this.getHostPattern(synopsis))}>
          <span className={globalStyles.appIcons.exclude} />
        </div>,
        value: ''
      },
      rank,
      {
        html: <div>
          {
            verified && this.getVerifiedIcon(synopsis)
          }
          <a className={css(styles.siteData)} href={publisherURL} target='_blank'>
            {
              faviconURL
                ? <img className={css(styles.favicon)} src={faviconURL} alt={site} />
                : <span className={css(styles.defaultIcon)}><span className={globalStyles.appIcons.defaultIcon} /></span>
            }
            <span className={css(styles.url)}>{site}</span>
          </a>
        </div>,
        value: site
      },
      {
        html: <SiteSettingCheckbox small
          hostPattern={this.getHostPattern(synopsis)}
          defaultValue={defaultAutoInclude}
          prefKey='ledgerPayments'
          siteSettings={this.props.siteSettings}
          checked={this.enabledForSite(synopsis)} />,
        value: this.enabledForSite(synopsis) ? 1 : 0
      },
      views,
      {
        html: this.getFormattedTime(synopsis),
        value: duration
      },
      percentage
    ]
  }

  render () {
    if (!this.synopsis || !this.synopsis.size) {
      return null
    }
    return <div data-test-id='ledgerTable'>
      <div className={css(styles.hideExcludedSites)}>
        <div className={css(styles.columnOffset)} />
        <div className={css(styles.rightColumn)}>
          <SettingCheckbox small
            dataL10nId='hideExcluded'
            prefKey={settings.HIDE_EXCLUDED_SITES}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
          />
        </div>
      </div>
      <SortableTable
        tableClassNames={css(styles.tableClass)}
        headings={['remove', 'rank', 'publisher', 'include', 'views', 'timeSpent', 'percentage']}
        defaultHeading='rank'
        headerClassNames={css(styles.tableTh)}
        columnClassNames={this.columnClassNames}
        rowClassNames={this.synopsis.map((item, i) => this.enabledForSite(item)
          ? css(styles.tableTr, i % 2 && styles.tableTdBg)
          : css(styles.tableTr, styles.paymentsDisabled, i % 2 && styles.tableTdBg)
        ).toJS()}
        onContextMenu={aboutActions.contextMenu}
        contextMenuName='synopsis'
        rowObjects={this.synopsis.map(entry => {
          return {
            hostPattern: this.getHostPattern(entry),
            location: entry.get('publisherURL')
          }
        }).toJS()}
        rows={this.synopsis.filter(synopsis => {
          return !getSetting(settings.HIDE_EXCLUDED_SITES, this.props.settings) || this.enabledForSite(synopsis)
        }).map((synopsis) => this.getRow(synopsis)).toJS()}
      />
    </div>
  }
}

const verifiedBadge = (icon) => ({
  position: 'absolute',
  height: '20px',
  width: '20px',
  left: '-10px',
  top: '3px',
  background: `url(${icon}) center no-repeat`
})

const styles = StyleSheet.create({
  verified: verifiedBadge(verifiedGreenIcon),
  disabled: verifiedBadge(verifiedWhiteIcon),

  neverShowSiteIcon: {
    opacity: 0,
    fontSize: '20px',
    textAlign: 'center',

    ':hover': {
      opacity: 1
    }
  },

  tableClass: {
    width: '100%',
    textAlign: 'left'
  },

  tableTh: {
    fontSize: '14px',

    ':hover': {
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  },

  tableTr: {
    height: '26px'
  },

  tableTd: {
    position: 'relative',
    padding: '0 15px'
  },

  tableTdBg: {
    background: '#f6f7f7'
  },

  siteData: {
    display: 'flex',
    flex: '1',
    alignItems: 'center'
  },

  defaultIcon: {
    fontSize: '15px',
    width: globalStyles.spacing.iconSize,
    textAlign: 'center'
  },

  favicon: {
    width: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize
  },

  url: {
    padding: '0 6px'
  },

  hideExcludedSites: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    height: '35px'
  },

  columnOffset: {
    display: 'flex',
    flexGrow: 8,
    flexShrink: 8
  },

  rightColumn: {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1
  },

  alignRight: {
    textAlign: 'right'
  },

  paymentsDisabled: {
    opacity: 0.6
  }
})

module.exports = LedgerTable
