/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../immutableComponent')

const {DefaultSectionTitle} = require('../common/sectionTitle')

class DemoTab extends ImmutableComponent {
  render () {
    return <section>
      <DefaultSectionTitle data-l10n-id='demo' />
      {
        (this.props.demoValue || []).map(item => {
          return <div>{item}</div>
        })
      }
    </section>
  }
}

module.exports = DemoTab
