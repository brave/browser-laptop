# Known intermittent failures

This file is parsed when running automated tests on our CI.

Known failures are shown in logs, but status will be green unless it is an uknown failure.
These browser level tests are prone to intermittent failures and without ignoring known failures,
it makes it very hard to know what is safe and what is not safe to merge from PRs.

Parsing of this file simply looks for lines that start with "- " which indicates a known test failure.

## lint

There are no acceptable lint failures.

## unit

There are no acceptable unit test failures.

## about

- Advanced payment panel tests can backup wallet to file
- Advanced payment panel tests can recover wallet from file
- Advanced payment panel tests shows an error popover if a recovery key is not a UUID
- Advanced payment panel tests shows an error popover if both recovery keys are missing
- Advanced payment panel tests shows an error popover if one recovery key is missing
- Advanced payment panel tests shows an error popover if the file is empty
- Ledger table 2 publishers check if all sites are on the unpinned by default
- Ledger table 2 publishers check pinned sites amount, when you have 0 eligible unpinned sites
- Ledger table 2 publishers pin publisher and change percentage
- Ledger table 2 publishers pin publisher and change percentage over 100
- Ledger table 2 publishers toggle non-verified option
- Ledger table 4 publishers check if all sites are on the unpinned list
- Ledger table 4 publishers pin 3 publishers
- Ledger table 4 publishers pin 3 publishers and check unpinned value
- Ledger table 4 publishers pin 3 publishers custom value and check unpinned value
- Ledger table 4 publishers pin 3 publishers over 100 value and check unpinned value
- Regular payment panel tests ledger history is CLEARED if payment is disabled before the close and clear history is true
- Regular payment panel tests ledger history is NOT cleared if payment is disabled before the close and clear history is false
- Regular payment panel tests ledger history is NOT cleared if payment is enabled before the close and clear history is true
- synopsis can sort synopsis table
- synopsis creates synopsis table after visiting a site

Before each hooks:

- Regular payment panel tests can setup payments "before each" hook

Before all hooks:

- about:bookmarks display favicon on bookmarks manager "before all" hook
- about:bookmarks double click behavior "before all" hook

## app

- MessageBox component tests alert when opening a new tab (while alert is showing) lets you use the back button
- MessageBox component tests alert when opening a new tab (while alert is showing) lets you use the forward button

## bookmark-components

- bookmark tests bookmarks Editing a bookmark can delete custom title
- bookmark tests bookmarks Editing a bookmark check custom title
- bookmark tests bookmarks Editing a bookmark custom title and location can be backspaced
- bookmark tests bookmarks Editing a bookmark display punycode custom title and location
- bookmark tests bookmarks pages with title fills in the title field
- bookmark tests menu behavior rebuilds the menu when a bookmark is added
- bookmark tests menu behavior rebuilds the menu when a folder is added
- bookmark tests menu behavior rebuilds the menu when add a list of items
- bookmarksToolbar display favicon on bookmarks toolbar fallback to default bookmark icon when url has no favicon
- bookmarksToolbar when clicking a bookmark folder automatically opens context menu if you move mouse over a different folder
- bookmarksToolbar when clicking a bookmark folder hides context menu when mousing over regular bookmark

Before each hooks:

- bookmark tests bookmark star button is preserved "before each" hook

Before all hooks:

- bookmark tests bookmarks pages with title saved with a title "before all" hook for "does not show the url field"
- bookmark tests bookmarks pages without title "before all" hook

## bravery-components

- Autoplay test "after each" hook for "allow autoplay and remember"
- Bravery Panel Adblock stats iframe tests detects blocked elements in iframe
- Bravery Panel Adblock stats iframe tests detects blocked elements in iframe in private tab
- Bravery Panel Adblock stats without iframe tests block device enumeration
- Bravery Panel Adblock stats without iframe tests blocks custom adblock resources in private tab
- Bravery Panel Adblock stats without iframe tests blocks scripts in a private tab
- Bravery Panel Adblock stats without iframe tests blocks scripts in a regular tab
- Bravery Panel Adblock stats without iframe tests blocks websocket tracking
- Bravery Panel Adblock stats without iframe tests blocks websocket tracking
- Bravery Panel Adblock stats without iframe tests detects adblock resources in private tab
- Bravery Panel Adblock stats without iframe tests downloads and detects regional adblock resources
- Bravery Panel Adblock stats without iframe tests downloads and detects regional adblock resources in private tab
- Bravery Panel Tracking Protection stats detects blocked elements
- Bravery Panel Tracking Protection stats detects blocked elements in private tab
- Clear Browsing Panel with closedFrames clears closedFrames
- Clear Browsing Panel with saved state values saves the history switch state
- noscript info can allow scripts on a file:// URL without allowing all scripts
- noscript info can selectively allow scripts

Before each hooks:

- Autoplay test "before each" hook
- Clear Browsing Panel with closedFrames "before each" hook
- Clear Browsing Panel with history "before each" hook

## contents

- content loading does not support battery status API

## misc-components

- Syncing and clearing data prevents it from syncing history
- Syncing and clearing data prevents it from syncing site settings
- Syncing bookmarks from an existing profile update bookmark, moving it into the folder
- Syncing bookmarks update bookmark, moving it into the folder
- findBar typing while another frame is loading
- findBar urlbar should be selectable if findbar is active

Before all hooks:

- Syncing and clearing data prevents it from syncing "before all" hook
- Syncing bookmarks "before all" hook
- Syncing bookmarks from an existing profile "before all" hook
- Syncing history "before all" hook
- Syncing then turning it off stops syncing "before all" hook

## navbar-components

- navigationBar tests auto open bookmarks toolbar for the first bookmark should remain hidden if user has bookmarks but has toolbar hidden
- navigationBar tests lockIcon Limit effect of running insecure content in private frame
- navigationBar tests navigation focus newtab with page has focus in webview
- navigationBar tests navigation tabnapping updates the location in the navbar when changed by the opener
- navigationBar tests submit page that does not load resets URL to previous location if page does not load
- navigationBar tests submit with about page url input values shows "about:blank" in the URL bar
- navigationBar tests submit with auth url input value hides auth part of the url
- navigator component tests lion badge is grayed out if shield is disabled
- search suggestions Finds search suggestions and performs a search when selected
- urlBar tests keeps url text separate from suffix text changes only the selection

Before each hooks:

- urlBar tests autocomplete "before each" hook
- urlBar tests typing "before each" hook
- urlBarSuggestions "before each" hook

Before all hooks:

- urlBar tests keeps url text separate from suffix text "before all" hook
- urlBar tests typing speed "before all" hook

## tab-components

- tab pages basic tab page functionality allows changing to tab pages clicking tab page changes
- tab tests back forward actions middle click opens in the new tab
- tab tests sequentially closing tabs fallsback to last active tab if next tab does not exist
- tab tests tab transfer can detach into new windows
- tab tests tab transfer can detach the last tab into an existing window
