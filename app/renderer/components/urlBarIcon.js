/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const windowActions = require('../../../js/actions/windowActions')
const cx = require('../../../js/lib/classSet')
const dragTypes = require('../../../js/constants/dragTypes')
const dndData = require('../../../js/dndData')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')
const searchIconSize = 16

class UrlBarIcon extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
  }
  get isSecure () {
    return this.props.isHTTPPage &&
           this.props.isSecure &&
           !this.props.active
  }
  /**
   * insecure icon does not show when:
   * - loading
   * - in title mode
   * - urlbar is active (ex: you can type)
   */
  get isInsecure () {
    return this.props.isHTTPPage &&
           this.props.isSecure === false &&
           !this.props.active
  }
  /**
   * search icon:
   * - does not show when loading
   * - does not show when in title mode
   * - shows when urlbar is active (ex: you can type)
   * - is a catch-all for: about pages, files, etc
   */
  get isSearch () {
    const showSearch = this.props.active &&
                       this.props.loading === false

    const defaultToSearch = (!this.isSecure && !this.isInsecure && !showSearch) &&
                            !this.props.titleMode &&
                            this.props.loading === false &&
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

    return cx({
      urlbarIcon: true,
      'fa': true,
      // NOTE: EV style not approved yet; see discussion at https://github.com/brave/browser-laptop/issues/791
      'fa-lock': this.isSecure,
      'fa-unlock': this.isInsecure,
      'fa-search': this.isSearch && !this.isAboutPage,
      'fa-list': this.isAboutPage && !this.props.titleMode
    })
  }
  get iconStyles () {
    if (!this.props.activateSearchEngine) {
      return {}
    }

    return {
      backgroundImage: `url(${this.props.searchSelectEntry.image})`,
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
    dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.TAB, this.activeFrame)
  }
  render () {
    return <span
      onDragStart={this.onDragStart}
      draggable
      onClick={this.onClick}
      className={this.iconClasses}
      style={this.iconStyles} />
  }
}

module.exports = UrlBarIcon
