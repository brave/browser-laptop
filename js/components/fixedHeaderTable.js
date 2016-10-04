/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const SortableTable = require('./sortableTable')

class FixedHeaderTable extends ImmutableComponent {
  render () {
    return <div className='fixed-table-container'>
      <div className='table-header' />
      <div className='fixed-table-container-inner'>
        <SortableTable {...this.props} />
      </div>
    </div>
  }
}

module.exports = FixedHeaderTable
