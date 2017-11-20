/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// components
const ImmutableComponent = require('../../immutableComponent')
const SortableTable = require('../../common/sortableTable')
const SwitchControl = require('../../common/switchControl')
const BrowserButton = require('../../common/browserButton')
const PinnedInput = require('./pinnedInput')

// style
const globalStyles = require('../../styles/global')
const {paymentStylesVariables} = require('../../styles/payment')
const verifiedGreenIcon = require('../../../../extensions/brave/img/ledger/verified_green_icon.svg')
const verifiedWhiteIcon = require('../../../../extensions/brave/img/ledger/verified_white_icon.svg')
const removeIcon = require('../../../../extensions/brave/img/ledger/icon_remove.svg')
const pinIcon = require('../../../../extensions/brave/img/ledger/icon_pin.svg')

// other
const settings = require('../../../../../js/constants/settings')
const getSetting = require('../../../../../js/settings').getSetting
const aboutActions = require('../../../../../js/about/aboutActions')
const urlUtil = require('../../../../../js/lib/urlutil')
const {SettingCheckbox, SiteSettingCheckbox} = require('../../common/settings')

class LedgerTable extends ImmutableComponent {
  get synopsis () {
    return this.props.ledgerData.get('synopsis')
  }

  showAll (value) {
    this.props.onChangeSetting(settings.PAYMENTS_SITES_SHOW_LESS, value)
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
    return urlUtil.getHostPattern(synopsis.get('publisherKey'))
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

    return !synopsis.get('exclude')
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

  isPinned (synopsis) {
    return synopsis.get('pinPercentage') > 0
  }

  pinPercentageValue (synopsis) {
    return synopsis.get('pinPercentage')
  }

  banSite (hostPattern) {
    aboutActions.changeSiteSetting(hostPattern, 'ledgerPaymentsShown', false)
  }

  togglePinSite (hostPattern, pinned, percentage) {
    if (pinned) {
      if (percentage < 1) {
        percentage = 1
      } else {
        percentage = Math.floor(percentage)
      }

      aboutActions.changeSiteSetting(hostPattern, 'ledgerPinPercentage', percentage)
      aboutActions.changeSiteSetting(hostPattern, 'ledgerPayments', true)
    } else {
      aboutActions.changeSiteSetting(hostPattern, 'ledgerPinPercentage', 0)
    }
  }

  get columnClassNames () {
    return [
      css(styles.alignRight, styles.verifiedTd), // verified
      css(styles.alignRight), // sites
      css(styles.alignLeft),  // include
      css(styles.alignRight), // views
      css(styles.alignRight), // time spent
      css(styles.alignRight, styles.percTd), // percentage
      css(styles.alignLeft)   // actions
    ]
  }

  rowClassNames (pinnedRows, unPinnedRows) {
    let j = -1

    return [
      pinnedRows.map(item => {
        j++
        return this.enabledForSite(item)
          ? css(j % 2 && styles.tableTdBg)
          : css(styles.paymentsDisabled, j % 2 && styles.tableTdBg)
      }).toJS(),
      unPinnedRows.map(item => {
        j++
        return this.enabledForSite(item)
          ? css(j % 2 && styles.tableTdBg)
          : css(styles.paymentsDisabled, j % 2 && styles.tableTdBg)
      }).toJS()
    ]
  }

  getRow (synopsis) {
    const faviconURL = synopsis.get('faviconURL')
    const views = synopsis.get('views')
    const verified = synopsis.get('verified')
    const pinned = this.isPinned(synopsis)
    const duration = synopsis.get('duration')
    const publisherURL = synopsis.get('publisherURL')
    const percentage = pinned ? this.pinPercentageValue(synopsis) : synopsis.get('percentage')
    const publisherKey = synopsis.get('publisherKey')
    const siteName = synopsis.get('siteName')
    const defaultAutoInclude = this.enabledForSite(synopsis)

    const rowRefName = 'rowPercentage_' + publisherKey
    if (this.refs[rowRefName]) {
      this.refs[rowRefName].value = percentage
    }

    return [
      {
        html: verified && this.getVerifiedIcon(synopsis),
        value: ''
      },
      {
        html: <div>
          <a className={css(styles.siteData)} href={publisherURL} rel='noopener' target='_blank' tabIndex={-1}>
            {
              faviconURL
                ? <img className={css(styles.favicon)} src={faviconURL} alt={siteName} />
                : <span className={css(styles.defaultIcon)}><span className={globalStyles.appIcons.defaultIcon} /></span>
            }
            <span className={css(styles.url)} data-test-id='siteName'>{siteName}</span>
          </a>
        </div>,
        value: publisherKey
      },
      {
        html: pinned
          ? <SwitchControl
            small
            disabled
            checkedOn
            indicatorClassName={css(styles.pinnedToggle)}
            testId='pinnedDisabled'
            onClick={() => {}}
          />
          : <SiteSettingCheckbox small
            hostPattern={this.getHostPattern(synopsis)}
            defaultValue={defaultAutoInclude}
            prefKey='ledgerPayments'
            siteSettings={this.props.siteSettings}
            checked={this.enabledForSite(synopsis)}
          />,
        value: this.enabledForSite(synopsis) ? 1 : 0
      },
      views,
      {
        html: this.getFormattedTime(synopsis),
        value: duration
      },
      {
        html: <span data-test-id='percentageValue'>
          {
            pinned
            ? <PinnedInput
              defaultValue={percentage}
              patern={this.getHostPattern(synopsis)}
            />
            : percentage
          }
        </span>,
        value: percentage
      },
      {
        html: <span>
          <span className={css(styles.mainIcon, styles.pinIcon, pinned && styles.pinnedIcon)}
            onClick={this.togglePinSite.bind(this, this.getHostPattern(synopsis), !pinned, percentage)}
            data-test-pinned={pinned}
            data-test-url={publisherURL}
          />
          <span className={css(styles.mainIcon, styles.removeIcon)}
            onClick={this.banSite.bind(this, this.getHostPattern(synopsis))}
          />
        </span>,
        value: ''
      }
    ]
  }

  render () {
    if (!this.synopsis || !this.synopsis.size) {
      return null
    }

    const allRows = this.synopsis.filter(synopsis => {
      return (!getSetting(settings.PAYMENTS_SITES_HIDE_EXCLUDED, this.props.settings) || this.enabledForSite(synopsis)) &&
        this.shouldShow(synopsis)
    })
    const pinnedRows = allRows.filter(synopsis => {
      return this.isPinned(synopsis)
    })
    let unPinnedRows = allRows.filter(synopsis => {
      return !this.isPinned(synopsis)
    })

    const totalUnPinnedRows = unPinnedRows.size
    const showLess = getSetting(settings.PAYMENTS_SITES_SHOW_LESS, this.props.settings)

    if (showLess && totalUnPinnedRows > 10) {
      let sumUnPinned = 0
      let threshold = 90
      const limit = 0.9 // show only 90th of publishers

      threshold = unPinnedRows.reduce((value, publisher) => value + publisher.get('percentage'), 0) * limit
      unPinnedRows = unPinnedRows.filter(publisher => {
        sumUnPinned += publisher.get('percentage')
        return !(sumUnPinned >= threshold)
      })
    }

    const showButton = (showLess && totalUnPinnedRows !== unPinnedRows.size) || (!showLess && totalUnPinnedRows > 10)

    return <section data-test-id='ledgerTable'>
      <div className={css(styles.hideExcludedSites)}>
        <div className={css(gridStyles.row1col1)} />
        <div className={css(gridStyles.row1col2)}>
          <SettingCheckbox
            small
            dataL10nId='hideExcluded'
            prefKey={settings.PAYMENTS_SITES_HIDE_EXCLUDED}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            switchClassName={css(styles.hideExcludedSites__switchWrap__switchControl)}
          />
        </div>
      </div>
      <SortableTable
        fillAvailable
        smallRow
        headings={['', 'publisher', 'include', 'views', 'timeSpent', 'percentage', 'actions']}
        defaultHeading='percentage'
        defaultHeadingSortOrder='desc'
        headerClassNames={css(styles.tableTh)}
        columnClassNames={this.columnClassNames}
        rowClassNames={this.rowClassNames(pinnedRows, unPinnedRows)}
        bodyClassNames={[css(unPinnedRows.size > 0 && styles.pinnedBody), '']}
        onContextMenu={aboutActions.contextMenu}
        contextMenuName='synopsis'
        rowObjects={[
          pinnedRows.map(entry => {
            return {
              hostPattern: this.getHostPattern(entry),
              location: entry.get('publisherURL')
            }
          }).toJS(),
          unPinnedRows.map(entry => {
            return {
              hostPattern: this.getHostPattern(entry),
              location: entry.get('publisherURL')
            }
          }).toJS()
        ]}
        rows={[
          pinnedRows.map((synopsis) => this.getRow(synopsis)).toJS(),
          unPinnedRows.map((synopsis) => this.getRow(synopsis)).toJS()
        ]}
      />
      {
        showButton
        ? <div className={css(styles.ledgerTable__showAllWrap)}>
          <BrowserButton secondaryColor
            testId={showLess ? 'showAll' : 'showLess'}
            l10nId={showLess ? 'showAll' : 'showLess'}
            onClick={this.showAll.bind(this, !showLess)}
          />
        </div>
        : null
      }
    </section>
  }
}

const verifiedBadge = (icon) => ({
  height: '20px',
  width: '20px',
  marginRight: '-10px',
  display: 'block',
  background: `url(${icon}) center no-repeat`
})

const gridStyles = StyleSheet.create({
  row1col1: {
    gridRow: 1,
    gridColumn: 1
  },

  row1col2: {
    gridRow: 1,
    gridColumn: 2
  }
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

  tableTh: {
    color: paymentStylesVariables.tableHeader.fontColor,
    fontWeight: paymentStylesVariables.tableHeader.fontWeight
  },

  tableTdBg: {
    background: '#f6f7f7'
  },

  verifiedTd: {
    padding: '0 0 0 15px'
  },

  percTd: {
    width: '45px'
  },

  hideTd: {
    display: 'none'
  },

  pinnedBody: {
    borderBottom: `1px solid ${globalStyles.color.braveOrange}`,
    borderCollapse: 'collapse'
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
    padding: '0 6px',
    textAlign: 'left'
  },

  hideExcludedSites: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '2fr 1fr',
    width: `calc(100% - calc(${globalStyles.spacing.panelPadding} / 2))`,
    marginBottom: globalStyles.spacing.panelMargin
  },

  hideExcludedSites__switchWrap__switchControl: {
    padding: '0 5px 0 0'
  },

  alignRight: {
    textAlign: 'right'
  },

  alignLeft: {
    textAlign: 'left'
  },

  paymentsDisabled: {
    opacity: 0.6
  },

  mainIcon: {
    backgroundColor: '#c4c5c5',
    width: '15px',
    height: '16px',
    display: 'inline-block',
    marginRight: '10px',
    marginTop: '6px',

    ':hover': {
      backgroundColor: globalStyles.color.buttonColor
    }
  },

  pinIcon: {
    '-webkit-mask-image': `url(${pinIcon})`
  },

  pinnedIcon: {
    backgroundColor: globalStyles.color.braveOrange,

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },

  removeIcon: {
    '-webkit-mask-image': `url(${removeIcon})`
  },

  pinnedToggle: {
    right: '2px'
  },

  ledgerTable__showAllWrap: {
    textAlign: 'center',
    marginTop: globalStyles.spacing.panelMargin
  }
})

module.exports = LedgerTable
