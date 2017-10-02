/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../../immutableComponent')

class AddFounds extends ImmutableComponent {
  render () {
    return <section data-test-id='addFounds'>
      Add founds
    </section>
  }
}

module.exports = AddFounds
