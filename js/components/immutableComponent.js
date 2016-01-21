/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

class ImmutableComponent extends React.Component {
  shouldComponentUpdate (nextProps, nextState) {
    return !Immutable.is(Immutable.fromJS(this.props), Immutable.fromJS(nextProps))
  }
}

module.exports = ImmutableComponent
