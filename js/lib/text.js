/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Add an ellipse (...) character and limit length of a string to a specific size.
// By testing against one length and slicing at a lower threshold, we prevent against unnecesary and early use of ellipses.
//
// If we just test and slice against one length, for example > 20 [...] text.slice(0, 20):
//   [20] countersurveillances        countersurveillances
//   [21] photolithographically       photolithographicall...
//
// If we test one length, and slice at a lower threshhold, for example > 25 [...] text.slice(0, 20)
//   [25] immunoelectrophoretically   immunoelectrophoretically
//   [26] zusammengehörigkeitsgefühl  zusammengehörigkeits...

module.exports.ellipse = (text) => {
  if (text.length > 25) {
    return text.slice(0, 20) + '...'
  } else {
    return text
  }
}
