/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const Right = require('./right')
const iconStyles = require('../styles')

module.exports = ({ styles }) =>
  <Right styles={[iconStyles.icon_rotated, styles]} />
