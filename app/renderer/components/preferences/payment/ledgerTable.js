/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

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
const locale = require('../../../../../js/l10n')
const ledgerUtil = require('../../../../common/lib/ledgerUtil')

class LedgerTable extends ImmutableComponent {
  get synopsis () {
    return this.props.ledgerData.get('synopsis')
  }

  showAll (value) {
    this.props.onChangeSetting(settings.PAYMENTS_SITES_SHOW_LESS, value)
  }

  onFaviconError (faviconURL, publisherKey) {
    console.log('missing or corrupted favicon file', faviconURL)
    // Set the publishers favicon to null so that it gets refetched
    aboutActions.setLedgerFavicon(publisherKey, null)
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
    const confMsg = locale.translation('banSiteConfirmation')
    if (window.confirm(confMsg)) {
      aboutActions.changeSiteSetting(hostPattern, 'ledgerPaymentsShown', false)
    }
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

  get columnStyles () {
    return [
      styles.column_verified,
      styles.column_sites,
      null,  // include
      [styles.column_nowrap, styles.alignRight], // views
      [styles.column_nowrap, styles.alignRight], // time spent
      [styles.alignRight, styles.column_percentage],
      styles.alignCenter // actions
    ]
  }

  rowClassNames (pinnedRows, unPinnedRows) {
    let j = -1

    return [
      pinnedRows.map(item => {
        j++
        return this.enabledForSite(item)
          ? css(j % 2 && styles.row)
          : css(j % 2 && styles.row, styles.row_disabled)
      }).toJS(),
      unPinnedRows.map(item => {
        j++
        return this.enabledForSite(item)
          ? css(j % 2 && styles.row)
          : css(j % 2 && styles.row, styles.row_disabled)
      }).toJS()
    ]
  }

  getImage (faviconURL, providerName, publisherKey) {
    if (!faviconURL && providerName) {
      faviconURL = ledgerUtil.getDefaultMediaFavicon(providerName)
    }

    if (!faviconURL) {
      return <span className={css(styles.siteData__anchor__icon_default)}>
        <span className={globalStyles.appIcons.defaultIcon} />
      </span>
    }

    return <img
      className={css(styles.siteData__anchor__icon_favicon)}
      src={faviconURL}
      alt=''
      onError={this.onFaviconError.bind(null, faviconURL, publisherKey)}
    />
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
    const providerName = synopsis.get('providerName')
    const siteName = synopsis.get('siteName')
    const defaultAutoInclude = this.enabledForSite(synopsis)

    const rowRefName = 'rowPercentage_' + publisherKey
    if (this.refs[rowRefName]) {
      this.refs[rowRefName].value = percentage
    }

    return [
      {
        html: verified && this.getVerifiedIcon(synopsis),
        value: verified ? (this.enabledForSite(synopsis) ? 2 : 1) : 0
      },
      {
        html: <div className={css(styles.siteData)}>
          <a className={css(styles.siteData__anchor)} href={publisherURL} rel='noopener' target='_blank' tabIndex={-1}>
            { this.getImage(faviconURL, providerName, publisherKey) }
            <span className={css(styles.siteData__anchor__url)} title={siteName} data-test-id='siteName'>{siteName}</span>
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
            customStyleWrapper={styles.switchControl_center}
            testId='pinnedDisabled'
            onClick={() => {}}
          />
          : <SiteSettingCheckbox
            small
            switchClassName={css(styles.switchControl_center)}
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
            : <span className={css(styles.regularPercentage)}>{percentage}</span>
          }
        </span>,
        value: percentage
      },
      {
        html: <div className={css(styles.actionIcons)}>
          <span className={css(
            styles.actionIcons__icon,
            styles.actionIcons__icon_pin,
            pinned && styles.actionIcons__icon_pin_isPinned
          )}
            onClick={this.togglePinSite.bind(this, this.getHostPattern(synopsis), !pinned, percentage)}
            data-test-pinned={pinned}
          />
          <span className={css(
            styles.actionIcons__icon,
            styles.actionIcons__icon_remove
          )}
            onClick={this.banSite.bind(this, this.getHostPattern(synopsis))}
          />
        </div>,
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
        <SettingCheckbox
          small
          dataL10nId='hideExcluded'
          prefKey={settings.PAYMENTS_SITES_HIDE_EXCLUDED}
          settings={this.props.settings}
          onChangeSetting={this.props.onChangeSetting}
          switchClassName={css(
            gridStyles.row1col2,
            styles.hideExcludedSites__settingCheckbox
          )}
        />
      </div>
      <SortableTable
        fillAvailable
        smallRow
        headings={['', 'publisher', 'include', 'views', 'timeSpent', 'percentage', 'actions']}
        nonSortableColumns={['actions']}
        defaultHeading='percentage'
        defaultHeadingSortOrder='desc'
        headerStyles={styles.header}
        columnStyles={this.columnStyles}
        rowClassNames={this.rowClassNames(pinnedRows, unPinnedRows)}
        bodyStyles={[unPinnedRows.size > 0 && styles.pinnedBody, '']}
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
        ? <div className={css(styles.ledgerTable__showAll)}>
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
  display: 'block',
  background: `url(${icon}) center no-repeat`,
  margin: 'auto'
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

  header: {
    color: paymentStylesVariables.tableHeader.fontColor,
    fontWeight: paymentStylesVariables.tableHeader.fontWeight
  },

  row: {
    background: '#f6f7f7'
  },

  row_disabled: {
    opacity: 0.6
  },

  column_verified: {
    paddingRight: 0,
    paddingLeft: 0
  },

  column_nowrap: {
    whiteSpace: 'nowrap'
  },

  column_sites: {
    // TODO: Refactor sortableTable.less to remove !important
    width: '100% !important'
  },

  column_percentage: {
    minWidth: '3ch',
    paddingRight: `calc(${globalStyles.sortableTable.cell.small.padding} + .2rem)`,
    paddingLeft: `calc(${globalStyles.sortableTable.cell.small.padding} + .2rem)`
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

  siteData__anchor: {
    width: '430px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  siteData__anchor__icon_favicon: {
    width: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize
  },

  siteData__anchor__icon_default: {
    fontSize: '15px',
    width: globalStyles.spacing.iconSize,
    textAlign: 'center'
  },

  siteData__anchor__url: {
    // See table__tbody__tr_smallRow__td on sortableTable.js
    paddingLeft: globalStyles.sortableTable.cell.small.padding
  },

  switchControl_center: {
    justifyContent: 'center'
  },

  hideExcludedSites: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '2fr 1fr',
    width: '100%',
    marginBottom: globalStyles.spacing.panelMargin
  },

  hideExcludedSites__settingCheckbox: {
    padding: '0 !important',
    position: 'relative',
    whiteSpace: 'nowrap' // Disable line wrap
  },

  alignRight: {
    textAlign: 'right'
  },

  alignLeft: {
    textAlign: 'left'
  },

  alignCenter: {
    textAlign: 'center'
  },

  actionIcons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '50px',
    margin: 'auto'
  },

  actionIcons__icon: {
    backgroundColor: '#c4c5c5',
    width: '1rem',
    height: '1rem',
    display: 'inline-block',

    ':hover': {
      backgroundColor: globalStyles.color.buttonColor
    }
  },

  actionIcons__icon_pin: {
    '-webkit-mask-image': `url(${pinIcon})`
  },

  actionIcons__icon_pin_isPinned: {
    backgroundColor: globalStyles.color.braveOrange,

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },

  actionIcons__icon_remove: {
    '-webkit-mask-image': `url(${removeIcon})`
  },

  ledgerTable__showAll: {
    textAlign: 'center',
    marginTop: globalStyles.spacing.panelMargin
  },

  regularPercentage: {
    paddingRight: '10px'
  }
})

module.exports = LedgerTable
