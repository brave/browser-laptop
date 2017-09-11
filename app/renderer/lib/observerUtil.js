/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 const {noIntersection} = require('../../renderer/components/styles/global').intersection

 /**
  * Observes an element's against its parentNode intercection.
  * This method enable a callback with information about when
  * the node should be considerated intercected or not.
  * @param {Object} node - The DOM node to get the parentNode to be used as a root
  * @param {Number|String|Array} threshold - Intersection point that will fire the callback
  * @returns {Function} Callback with options to be fired when observable passes the threshold.
  */
 module.exports.setObserver = (node, threshold, rootMargin = null, cb) => {
   const options = {
     // We always rely on element's parentNode. original API defaults to window
     root: node.parentNode,
     // Threshold at 0 means element is fully hidden and 1 means fully visible
     threshold: threshold,
     // rootMargin is an optional gutter to include in the root element
     // such as padding or margin. Accepts default CSS convention TOP RIGHT DOWN LEFT.
     // As of Chrome 60, needs units such as pixel or percentage to work
     rootMargin: rootMargin
   }
   return new window.IntersectionObserver(cb, options)
 }

 /**
  * Checks whether or not the entry in question is being intersected by the parent
  * @param {Object} state - The application's current window state
  * @param {string} component - The component to watch intersection
  * @param {Number|null} ratio - the intersection ratio to listen for
  */
 module.exports.isEntryIntersected = (state, component, ratio = null) => {
   // intersectionRatio === 1 means the element is not being intercected
   // so if ratio is undefined check for a minimum intersection
   if (ratio == null) {
     return state.getIn(['ui', component, 'intersectionRatio']) < noIntersection
   }
   return state.getIn(['ui', component, 'intersectionRatio']) <= ratio
 }
