/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const {DefaultSectionTitle} = require('../common/sectionTitle')
const {SettingsList, SettingItem, SettingCheckbox} = require('../common/settings')

const {SettingDropdown} = require('../common/dropdown')

const {tabCloseAction, tabPreviewTiming} = require('../../../common/constants/settingsEnums')
const {changeSetting} = require('../../lib/settingsUtil')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')

class TabsTab extends ImmutableComponent {
  get tabsPerTabPageOption () {
    return [6, 8, 10, 20, 100]
  }

  get tabCloseActionOptions () {
    return [
      {
        id: 'tabCloseActionLastActive',
        action: tabCloseAction.LAST_ACTIVE
      },
      {
        id: 'tabCloseActionNext',
        action: tabCloseAction.NEXT
      },
      {
        id: 'tabCloseActionParent',
        action: tabCloseAction.PARENT
      }
    ]
  }
  get tabPreviewTimingOptions () {
    return [
      {
        id: 'none',
        action: tabPreviewTiming.NONE
      },
      {
        id: 'short',
        action: tabPreviewTiming.SHORT
      },
      {
        id: 'long',
        action: tabPreviewTiming.LONG
      }
    ]
  }
  render () {
    return (
      <div>
        <DefaultSectionTitle data-l10n-id='tabSettings' />
        <SettingsList>
          <SettingItem dataL10nId='tabsPerTabPage'>
            <SettingDropdown
              data-test-id='tabsPerTabPage'
              value={getSetting(settings.TABS_PER_PAGE, this.props.settings)}
              data-type='number'
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TABS_PER_PAGE)}>
              {// Sorry, Brad says he hates primes :'(
              this.tabsPerTabPageOption.map(option =>
                <option
                  data-test-id='tabsPerTabPageOption'
                  data-test-active={
                    getSetting(settings.TABS_PER_PAGE, this.props.settings) === option
                  }
                  value={option}
                  key={option}>
                  {option}
                </option>
              )}
            </SettingDropdown>
          </SettingItem>
          <SettingItem dataL10nId='tabCloseAction'>
            <SettingDropdown
              value={getSetting(settings.TAB_CLOSE_ACTION, this.props.settings)}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TAB_CLOSE_ACTION)}>
              {this.tabCloseActionOptions.map(option =>
                <option
                  data-l10n-id={option.id}
                  data-test-id='tabCloseActionActiveOption'
                  data-test-active={
                    getSetting(settings.TAB_CLOSE_ACTION, this.props.settings) === option.action
                  }
                  value={option.action}
                />
              )}
            </SettingDropdown>
          </SettingItem>
          <SettingCheckbox
            dataL10nId='switchToNewTabs'
            dataTestId='switchToNewTabs'
            testIsEnabled={
              getSetting(settings.SWITCH_TO_NEW_TABS, this.props.settings) === true
            }
            prefKey={settings.SWITCH_TO_NEW_TABS}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
          />
          <SettingCheckbox
            dataL10nId='paintTabs'
            dataTestId='paintTabs'
            testIsEnabled={
              getSetting(settings.PAINT_TABS, this.props.settings) === true
            }
            prefKey={settings.PAINT_TABS}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
          />
          <SettingCheckbox
            dataL10nId='showTabPreviews'
            dataTestId='showTabPreviews'
            testIsEnabled={
              getSetting(settings.SHOW_TAB_PREVIEWS, this.props.settings) === true
            }
            prefKey={settings.SHOW_TAB_PREVIEWS}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
          />
          {
            getSetting(settings.SHOW_TAB_PREVIEWS, this.props.settings)
              ? <SettingItem dataL10nId='tabPreviewTiming'>
                <SettingDropdown
                  value={getSetting(settings.TAB_PREVIEW_TIMING, this.props.settings)}
                  onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TAB_PREVIEW_TIMING)}>
                  {this.tabPreviewTimingOptions.map(option =>
                    <option
                      data-l10n-id={option.id}
                      data-test-id='tabPreviewTimingOption'
                      data-test-active={
                        getSetting(settings.TAB_PREVIEW_TIMING, this.props.settings) === option.action
                      }
                      value={option.action}
                    />
                  )}
                </SettingDropdown>
              </SettingItem>
              : null
          }
          <SettingItem dataL10nId='dashboardSettingsTitle'>
            <SettingCheckbox
              dataL10nId='dashboardShowImages'
              dataTestId='dashboardShowImages'
              testIsEnabled={
                getSetting(settings.SHOW_DASHBOARD_IMAGES, this.props.settings) === true
              }
              prefKey={settings.SHOW_DASHBOARD_IMAGES}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting}
            />

            <SettingCheckbox
              dataL10nId='clockDisplayTwentyFour'
              dataTestId='clockDisplayTwentyFour'
              testIsEnabled={
                getSetting(settings.CLOCK_DISPLAY_TWENTY_FOUR, this.props.settings) === true
              }
              prefKey={settings.CLOCK_DISPLAY_TWENTY_FOUR}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting}
            />
          </SettingItem>
        </SettingsList>
      </div>
    )
  }
}

module.exports = TabsTab
