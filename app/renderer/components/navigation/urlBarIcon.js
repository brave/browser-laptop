/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const windowActions = require('../../../../js/actions/windowActions')
const cx = require('../../../../js/lib/classSet')
const dragTypes = require('../../../../js/constants/dragTypes')
const dndData = require('../../../../js/dndData')
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const {isPotentialPhishingUrl} = require('../../../../js/lib/urlutil')
const windowStore = require('../../../../js/stores/windowStore')
const {getActiveFrame} = require('../../../../js/state/frameStateUtil')
const searchIconSize = 16

class UrlBarIcon extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
  }
  get iconCssClasses () {
    if (isPotentialPhishingUrl(this.props.location)) {
      return ['fa-exclamation-triangle', 'insecure-color']
    } else if (this.isSearch) {
      return ['fa-search']
    } else if (this.isAboutPage && !this.props.titleMode) {
      return ['fa-list']
    } else if (this.props.isHTTPPage && !this.props.active) {
      // NOTE: EV style not approved yet; see discussion at https://github.com/brave/browser-laptop/issues/791
      if (this.props.isSecure === true) {
        return ['fa-lock']
      } else if (this.props.isSecure === false) {
        return ['fa-unlock', 'insecure-color']
      } else if (this.props.isSecure === 1) {
        return ['fa-unlock']
      }
    }
    return []
  }
  /**
   * search icon:
   * - does not show when in title mode
   * - shows when urlbar is active (ex: you can type)
   * - is a catch-all for: about pages, files, etc
   */
  get isSearch () {
    const showSearch = this.props.isSearching && !this.props.titleMode

    const defaultToSearch = (!this.props.isHTTPPage || this.props.active) &&
                            !this.props.titleMode &&
                            !this.isAboutPage

    return showSearch || defaultToSearch
  }
  get isAboutPage () {
    return isSourceAboutUrl(this.props.location) &&
      this.props.location !== 'about:newtab'
  }
  get iconClasses () {
    if (this.props.activateSearchEngine) {
      return cx({urlbarIcon: true})
    }
    const iconClasses = {
      urlbarIcon: true,
      fa: true
    }
    this.iconCssClasses.forEach((iconClass) => {
      iconClasses[iconClass] = true
    })
    return cx(iconClasses)
  }
  get iconStyles () {
    if (!this.props.activateSearchEngine) {
      return {}
    }

    return {
      backgroundImage: `url(${this.props.searchSelectEntry.get('image')})`,
      backgroundSize: searchIconSize,
      width: searchIconSize,
      height: searchIconSize
    }
  }
  onClick () {
    if (isSourceAboutUrl(this.props.location)) {
      return
    }
    windowActions.setSiteInfoVisible(true)
  }
  onDragStart (e) {
    dndData.setupDataTransferURL(e.dataTransfer, this.props.location, this.props.title)
    const activeFrame = getActiveFrame(windowStore.state)
    dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.TAB, activeFrame)
  }
  render () {
    // allow click and drag (unless tab is showing a message box)
    const props = {}
    if (!this.props.activeTabShowingMessageBox) {
      props.draggable = true
      props.onClick = this.onClick
      props.onDragStart = this.onDragStart
    }
    return <span
      {...props}
      className={this.iconClasses}
      style={this.iconStyles} />
  }
}

module.exports = UrlBarIcon
