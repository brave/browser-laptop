/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('../components/immutableComponent')

export default class NewTabPage extends ImmutableComponent {
  render () {
    // TODO: Implement some kind of tiles based new tab page
    return <div>
    </div>
  }
}

ReactDOM.render(<NewTabPage/>, document.querySelector('#appContainer'))
