/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const {FormDropdown} = require('../../common/dropdown')

// Constants
const settings = require('../../../../../js/constants/settings')
const adsPlaces = require('../../../../common/constants/adsPlaces')

// Utils
const {changeSetting} = require('../../../lib/settingsUtil')
const getSetting = require('../../../../../js/settings').getSetting

// Styles
const globalStyles = require('../../styles/global')
const {paymentStylesVariables} = require('../../styles/payment')

class EnabledContent extends ImmutableComponent {
  render () {
    const perHour = getSetting(settings.ADS_PER_HOUR, this.props.settings)
    const perDay = getSetting(settings.ADS_PER_DAY, this.props.settings)

    return <section className={css(styles.enabledContent)}>
      <div className={css(styles.enabledContent__walletBar)} data-test-id='walletBar'>
        <div className={css(gridStyles.row1col1, styles.enabledContent__walletBar__title)}>
          Ads per hour
        </div>
        <div className={css(gridStyles.row1col2, styles.enabledContent__walletBar__title)}>
          Ads per day
        </div>
        <div className={css(gridStyles.row1col3, styles.enabledContent__walletBar__title)}>
          Place
        </div>
        <div className={css(gridStyles.row2col1)}>
          <input
            type='range'
            min='1'
            max='20'
            defaultValue={perDay}
            step='1'
            list='dayList'
            style={{width: '200px', marginTop: '20px'}}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.ADS_PER_DAY)}
          />
          <datalist id='dayList'>
            <option value='1' label='1' />
            <option value='2' label='2' />
            <option value='3' label='3' />
            <option value='4' label='4' />
            <option value='5' label='5' />
            <option value='6' label='6' />
            <option value='7' label='7' />
            <option value='8' label='8' />
            <option value='9' label='9' />
            <option value='10' label='10' />
            <option value='11' label='11' />
            <option value='12' label='12' />
            <option value='13' label='13' />
            <option value='14' label='14' />
            <option value='15' label='15' />
            <option value='16' label='16' />
            <option value='17' label='17' />
            <option value='18' label='18' />
            <option value='19' label='19' />
            <option value='20' label='20' />
          </datalist>
          <span className={css(styles.enabledContent__walletBar__values)}>{perDay}</span>
        </div>
        <div className={css(gridStyles.row2col2)}>
          <input
            type='range'
            min='1'
            max='6'
            defaultValue={perHour}
            step='1'
            list='hourList'
            style={{width: '200px', marginTop: '20px'}}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.ADS_PER_HOUR)}
          />
          <datalist id='hourList'>
            <option value='1' label='1' />
            <option value='2' label='2' />
            <option value='3' label='3' />
            <option value='4' label='4' />
            <option value='5' label='5' />
            <option value='6' label='6' />
          </datalist>
          <span className={css(styles.enabledContent__walletBar__values)}>{perHour}</span>
        </div>
        <div className={css(gridStyles.row2col3)}>
          <FormDropdown
            data-isPanel
            data-test-id='placeSelectBox'
            customClass={styles.place_input}
            value={getSetting(settings.ADS_PLACE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.ADS_PLACE)}
          >
            {
              Object.keys(adsPlaces).map(key => {
                return <option value={key}>{adsPlaces[key]}</option>
              })
            }
          </FormDropdown>
        </div>
      </div>
      <details style={{marginTop: '50px'}}>
        <summary>Click to see logs</summary>
        <div style={{paddingTop: '10px', marginTop: '10px', borderTop: '1px solid #c5c1c1'}}>
          {
            (this.props.demoValue || []).map(item => {
              return <div style={{marginBottom: '15px'}}>
                <div>
                  {item.time}: <span style={{fontWeight: 'bold'}}>{item.eventName}</span>
                </div>
                <pre style={{paddingLeft: '10px', wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>
                  {JSON.stringify(item.data, null, 2)}
                </pre>
              </div>
            })
          }
        </div>
      </details>
    </section>
  }
}

const styles = StyleSheet.create({
  enabledContent: {
    position: 'relative',
    zIndex: 2
  },

  enabledContent__walletBar: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    background: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    margin: `${globalStyles.spacing.panelMargin} 0 0`
  },

  enabledContent__walletBar__title: {
    color: paymentStylesVariables.tableHeader.fontColor,
    fontWeight: paymentStylesVariables.tableHeader.fontWeight,
    marginBottom: `calc(${globalStyles.spacing.panelPadding} / 1.5)`
  },

  enabledContent__walletBar__message: {
    fontSize: globalStyles.payments.fontSize.regular,
    lineHeight: 1.5,
    marginTop: globalStyles.spacing.panelPadding
  },

  enabledContent__walletBar__values: {
    display: 'inline-block',
    paddingLeft: '10px',
    position: 'relative',
    top: '-4px'
  },

  place_input: {
    marginTop: '12px'
  }
})

const gridStyles = StyleSheet.create({
  row1col1: {
    gridRow: 1,
    gridColumn: 1,
    marginTop: globalStyles.spacing.panelPadding,
    marginLeft: globalStyles.spacing.panelPadding
  },

  row1col2: {
    gridRow: 1,
    gridColumn: 2,
    marginTop: globalStyles.spacing.panelPadding,
    marginRight: `calc(${globalStyles.spacing.panelPadding} / 2)`,
    marginLeft: `calc(${globalStyles.spacing.panelPadding} / 2)`
  },

  row1col3: {
    gridRow: 1,
    gridColumn: 3,
    marginTop: globalStyles.spacing.panelPadding,
    marginRight: globalStyles.spacing.panelPadding
  },

  row2col1: {
    gridRow: 2,
    gridColumn: 1,
    marginLeft: globalStyles.spacing.panelPadding,
    marginBottom: '25px'
  },

  row2col2: {
    gridRow: 2,
    gridColumn: 2,
    marginRight: `calc(${globalStyles.spacing.panelPadding} / 2)`,
    marginLeft: `calc(${globalStyles.spacing.panelPadding} / 2)`,
    marginBottom: '25px'
  },

  row2col3: {
    gridRow: 2,
    gridColumn: 3,
    marginRight: globalStyles.spacing.panelPadding,
    marginBottom: '25px'
  }
})

module.exports = EnabledContent
