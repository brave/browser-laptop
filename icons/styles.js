/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { StyleSheet } = require('aphrodite/no-important')

module.exports = StyleSheet.create({
  icon: {
    width: '100%',
    height: '100%',
    stroke: 'var(--icon-line-color, currentColor)',
    fill: 'var(--icon-fill-color, none)',
    'stroke-width': '1.5',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    transition: ['fill', 'stroke'].map(prop => `${prop} .12s var(--icon-transit-easing)`).join(', ')
  },

  icon_customDrawn: {
    strokeWidth: 'initial',
    strokeLinejoin: 'initial',
    stroke: 'initial',
    fill: 'initial'
  },

  icon_rotated: {
    transform: 'rotate(180deg)'
  },

  icon_flipH: {
    transform: 'scaleX(-1)'
  },

  icon__path: {
    stroke: 'var(--icon-line-color, currentColor)',
    fill: 'var(--icon-fill-color, none)'
  },

  // A <path> which should have a fill color the same as the line color
  icon__path_solid: {
    fill: 'var(--icon-line-color, currentColor)',
    stroke: 'none'
  }
})
