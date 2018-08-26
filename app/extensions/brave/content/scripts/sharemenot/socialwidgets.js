/*
 * This file is adapted from Privacy Badger <https://www.eff.org/privacybadger>
 * Copyright (C) 2014 Electronic Frontier Foundation
 * Derived from ShareMeNot
 * Copyright (C) 2011-2014 University of Washington
 *
 * Privacy Badger is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Privacy Badger is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Privacy Badger.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * ShareMeNot is licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2011-2014 University of Washington
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// runtime origin for images
const baseImageUrl = `chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/content/scripts/sharemenot/img/`

const trackerInfo = []
for (let name in trackerInfoObject) {
  trackerInfo.push(Object.assign({name: name}, trackerInfoObject[name]))
}

/**
 * Initializes the content script.
 */
const initialize = function () {
  // Get tracker info and check for initial blocks (that happened
  // before content script was attached)
  replaceInitialTrackerButtonsHelper();

  // Set up listener for blocks that happen after initial check
  // TODO: actually send this message
  chrome.runtime.onMessage.addListener(function(request/*, sender, sendResponse*/) {
    if (request.replaceSocialWidget) {
      replaceSubsequentTrackerButtonsHelper(request.trackerDomain);
    }
  });
}

/**
 * Creates a replacement button element for the given tracker.
 *
 * @param {Tracker} tracker the Tracker object for the button
 *
 * @param {Element} trackerElem the tracking element that we are replacing
 *
 * @param {Function} callback called with the replacement button element for the tracker
 */
function createReplacementButtonImage(tracker, trackerElem, callback) {
  return setTimeout(function () {
    _createReplacementButtonImageCallback(tracker, trackerElem, callback);
  }, 0);
}

function _createReplacementButtonImageCallback(tracker, trackerElem, callback) {
  var buttonData = tracker.replacementButton;
  var button = document.createElement("img");
  var buttonUrl = `${baseImageUrl}${tracker.replacementButton.imagePath}`;
  var buttonType = buttonData.type;
  var details = buttonData.details;

  button.setAttribute("src", buttonUrl);
  button.setAttribute("title",
                      tracker.name + ' tracker blocked by Brave');
  button.setAttribute(
    "style",
    "border: none !important; cursor: pointer !important; height: auto !important; width: auto !important;"
  );

  switch (buttonType) {
    case 0: // normal button type; just open a new window when clicked
      var popupUrl = details + encodeURIComponent(window.location.href);

      button.addEventListener("click", function() {
        window.open(popupUrl);
      });

      break;

    // in place button type; replace the existing button
    // with an iframe when clicked
    case 1:
      var iframeUrl = details + encodeURIComponent(window.location.href);

      button.addEventListener("click", function() {
        replaceButtonWithIframeAndUnblockTracker(button, buttonData.unblockDomains, iframeUrl);
      }, { once: true });

      break;

    // in place button type; replace the existing button with code
    // specified in the Trackers file
    case 2:
      button.addEventListener("click", function() {
        replaceButtonWithHtmlCodeAndUnblockTracker(button, buttonData.unblockDomains, details);
      }, { once: true });
      break;

    case 3:
      button.addEventListener("click", function() {
        replaceButtonWithHtmlCodeAndUnblockTracker(button, buttonData.unblockDomains, trackerElem);
      }, { once: true });
      break;

    default:
      throw "Invalid button type specified: " + buttonType;
  }

  callback(button);
}


/**
 * Unblocks the given tracker and replaces the given button with an iframe
 * pointing to the given URL.
 *
 * @param {Element} button the DOM element of the button to replace
 * @param {Tracker} tracker the Tracker object for the tracker that should be
 *                          unblocked
 * @param {String} iframeUrl the URL of the iframe to replace the button
 */
function replaceButtonWithIframeAndUnblockTracker(button, tracker, iframeUrl) {
  unblockTracker(tracker, function() {
    // check is needed as for an unknown reason this callback function is
    // executed for buttons that have already been removed; we are trying
    // to prevent replacing an already removed button
    if (button.parentNode !== null) {
      var iframe = document.createElement("iframe");

      iframe.setAttribute("src", iframeUrl);
      iframe.setAttribute("style", "border: none !important; height: 1.5em !important;");

      button.parentNode.replaceChild(iframe, button);
    }
  });
}

/**
 * Unblocks the given tracker and replaces the given button with the
 * HTML code defined in the provided Tracker object.
 *
 * @param {Element} button the DOM element of the button to replace
 * @param {Tracker} tracker the Tracker object for the tracker that should be
 *                          unblocked
 * @param {(String|Element)} html an HTML string or DOM Element that should replace the button
 */
function replaceButtonWithHtmlCodeAndUnblockTracker(button, tracker, html) {
  unblockTracker(tracker, function() {
    // check is needed as for an unknown reason this callback function is
    // executed for buttons that have already been removed; we are trying
    // to prevent replacing an already removed button
    if (button.parentNode !== null) {
      var codeContainer = document.createElement("div");
      if (typeof html == "string") {
        codeContainer.innerHTML = html;
      } else {
        codeContainer.innerHTML = html.outerHTML;
      }

      button.parentNode.replaceChild(codeContainer, button);

      replaceScriptsRecurse(codeContainer);
    }
  });
}

/**
 * Dumping scripts into innerHTML won't execute them, so replace them
 * with executable scripts.
 */
function replaceScriptsRecurse(node) {
  if (node.getAttribute && node.getAttribute("type") == "text/javascript") {
    var script = document.createElement("script");
    script.text = node.innerHTML;
    script.src = node.src;
    node.parentNode.replaceChild(script, node);
  } else {
    var i = 0;
    var children = node.childNodes;
    while (i < children.length) {
      replaceScriptsRecurse(children[i]);
      i++;
    }
  }
  return node;
}


/**
 * Replaces all tracker buttons on the current web page with the internal
 * replacement buttons.
 */
function replaceInitialTrackerButtonsHelper() {
  trackerInfo.forEach(function(tracker) {
    replaceIndividualButton(tracker);
  });
}

/**
 * Individually replaces tracker buttons blocked after initial check.
 */
function replaceSubsequentTrackerButtonsHelper(trackerDomain) {
  if (!trackerInfo) { return; }
  trackerInfo.forEach(function(tracker) {
    var replaceTrackerButtons = (tracker.domain == trackerDomain);
    if (replaceTrackerButtons) {
      replaceIndividualButton(tracker);
    }
  });
}

/**
 * Actually do the work of replacing the button.
 */
function replaceIndividualButton(tracker) {

  // makes a comma separated list of CSS selectors that specify
  // buttons for the current tracker; used for document.querySelectorAll
  var buttonSelectorsString = tracker.buttonSelectors.toString();
  var buttonsToReplace =
    document.querySelectorAll(buttonSelectorsString);

  buttonsToReplace.forEach(function (buttonToReplace) {
    console.log("Replacing social widget for " + tracker.name);

    createReplacementButtonImage(tracker, buttonToReplace, function (button) {
      buttonToReplace.parentNode.replaceChild(button, buttonToReplace);
    });
  });
}

/**
* Unblocks the tracker with the given name from the page. Calls the
* provided callback function after the tracker has been unblocked.
*
* @param {String} trackerName the name of the tracker to unblock
* @param {Function} callback the function to call after the tracker has
*                            been unblocked
*/
function unblockTracker(buttonUrls, callback) {
  var request = {
    "unblockSocialWidget" : true,
    "buttonUrls": buttonUrls
  };
  // TODO: do something here
  chrome.runtime.sendMessage(request, callback);
}

initialize();
