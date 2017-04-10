/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../../../js/components/immutableComponent')
const globalStyles = require('./styles/global')

class HelpfulText extends ImmutableComponent {
  render () {
    return <div className={this.props.wrapperClassName}>
      <span className={globalStyles.appIcons.moreInfo}
        style={{
          color: globalStyles.color.mediumGray,
          fontSize: '20px',
          marginRight: '5px'
        }} />
      <span className={this.props.textClassName} data-l10n-id={this.props.l10nId} />
      {this.props.children}
    </div>
  }
}

module.exports = HelpfulText
