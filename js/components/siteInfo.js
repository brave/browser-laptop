/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const Dialog = require('./dialog')

class SiteInfo extends ImmutableComponent {
  get isExtendedValidation () {
    return this.props.frameProps.getIn(['security', 'isExtendedValidation'])
  }
  get isSecure () {
    return this.props.frameProps.getIn(['security', 'isSecure'])
  }
  get isMixedContent () {
    return this.props.frameProps.getIn(['security', 'isMixedContent'])
  }
  get partitionNumber () {
    return this.props.frameProps.getIn(['partitionNumber'])
  }
  render () {
    let secureIcon
    if (this.isSecure && !this.isMixedContent) {
      secureIcon = <li><span
        className={cx({
          fa: true,
          'fa-lock': true,
          extendedValidation: this.isExtendedValidation
        })} /><span data-l10n-id='secureConnection' /></li>
    } else if (this.isMixedContent) {
      secureIcon = <li><span className='fa fa-unlock-alt' /><span data-l10n-id='mixedConnection' /></li>
    } else {
      secureIcon = <li><span className='fa fa-unlock' /><span data-l10n-id='insecureConnection' data-l10n-args={JSON.stringify(l10nArgs)} /></li>
    }

    // Figure out the partition info display
    let l10nArgs = {
      partitionNumber: this.partitionNumber
    }

    let partitionInfo
    if (this.partitionNumber) {
      partitionInfo = <li><span className='fa fa-user' />
        <span data-l10n-args={JSON.stringify(l10nArgs)} data-l10n-id='sessionInfo' /></li>
    }

    return <Dialog onHide={this.props.onHide} className='siteInfo' isClickDismiss>
      <ul onClick={(e) => e.stopPropagation()}>
      {
        secureIcon
      }
      {
        partitionInfo
      }
      </ul>
    </Dialog>
  }
}

SiteInfo.propTypes = {
  frameProps: React.PropTypes.object,
  onHide: React.PropTypes.func
}

module.exports = SiteInfo
