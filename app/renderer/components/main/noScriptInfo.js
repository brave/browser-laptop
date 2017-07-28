/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const urlParse = require('../../../common/urlParse')

// Components
const ReduxComponent = require('../reduxComponent')
const ImmutableComponent = require('../immutableComponent')
const Dialog = require('../common/dialog')
const {BrowserButton} = require('../common/browserButton')

// Actions
const appActions = require('../../../../js/actions/appActions')
const tabActions = require('../../../common/actions/tabActions')
const windowActions = require('../../../../js/actions/windowActions')

// State
const tabState = require('../../../common/state/tabState')

// Utils
const siteUtil = require('../../../../js/state/siteUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

class NoScriptCheckbox extends ImmutableComponent {
  toggleCheckbox (e) {
    e.stopPropagation()
    this.checkbox.checked = !this.checkbox.checked
  }

  get id () {
    return `checkbox-for-${this.props.origin}`
  }

  render () {
    return <div
      className='noScriptCheckbox'
      id={this.id}
      onClick={this.toggleCheckbox.bind(this)}
    >
      <input
        type='checkbox'
        onClick={(e) => { e.stopPropagation() }}
        ref={(node) => { this.checkbox = node }}
        defaultChecked
        origin={this.props.origin}
      />
      <label htmlFor={this.id}>{this.props.origin}</label>
    </div>
  }
}

class NoScriptInfo extends React.Component {
  constructor (props) {
    super(props)
    this.unselectAll = this.unselectAll.bind(this)
  }

  onClickInner (e) {
    e.stopPropagation()
  }

  unselectAll (e) {
    e.stopPropagation()
    let checkboxes = this.checkboxes.querySelectorAll('input')

    if (checkboxes) {
      checkboxes.forEach((box) => {
        box.checked = false
      })
    }
  }

  reload () {
    tabActions.reload(this.props.activeTabId)
  }

  onAllow (setting) {
    if (!this.props.origin) {
      return
    }

    let checkedOrigins = new Immutable.Map()
    this.checkboxes.querySelectorAll('input').forEach((box) => {
      const origin = box.getAttribute('origin')
      if (origin) {
        checkedOrigins = checkedOrigins.set(origin, box.checked ? setting : false)
      }
    })

    if (checkedOrigins.filter((value) => value !== false).size) {
      appActions.noScriptExceptionsAdded(this.props.origin, checkedOrigins, this.props.isPrivate)
      this.reload()
      this.onHide()
    }
  }

  onHide () {
    windowActions.setNoScriptVisible(false)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const blocked = activeFrame.getIn(['noScript', 'blocked'])
    let blockedOrigins = Immutable.List()

    if (blocked && blocked.size) {
      const originsSet = Immutable.Set(blocked.map(siteUtil.getOrigin))
      blockedOrigins = Immutable.List(originsSet.toJS())
    }

    const props = {}
    // used in renderer
    props.siteHost = urlParse(activeFrame.get('location')).host
    props.showBlocks = blocked && blockedOrigins.size
    props.blockedOrigins = blockedOrigins
    props.isPrivate = activeFrame.get('isPrivate')

    // Used in other function
    props.activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    props.origin = siteUtil.getOrigin(activeFrame.get('location'))

    return props
  }

  render () {
    const l10nArgs = {
      site: this.props.siteHost
    }

    return <Dialog onHide={this.onHide} className='noScriptInfo' isClickDismiss>
      <div className='dialogInner' onClick={this.onClickInner}>
        <div
          className='truncate'
          data-l10n-args={JSON.stringify(l10nArgs)}
          data-l10n-id='scriptsBlocked'
        />
        {
          this.props.showBlocks
          ? <div>
            <div ref={(node) => { this.checkboxes = node }} className='blockedOriginsList'>
              {
                this.props.blockedOrigins.map((origin) => <NoScriptCheckbox origin={origin} />)
              }
            </div>
            <div
              data-l10n-id='unselectAll'
              className='clickable'
              onClick={this.unselectAll}
            />
            <div>
              <BrowserButton
                groupedItem
                actionItem
                l10nId='allowScriptsOnce'
                onClick={this.onAllow.bind(this, 0)}
              />
              {
                !this.props.isPrivate
                ? <BrowserButton
                  groupedItem
                  subtleItem
                  l10nId='allowScriptsTemp'
                  onClick={this.onAllow.bind(this, 1)}
                />
                : null
              }
            </div>
          </div>
          : null
        }
      </div>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(NoScriptInfo)
