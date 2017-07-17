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
- Ledger table 2 publishers check pinned sites amount, when you have 0 eligible unpinned sites
- Ledger table 2 publishers pin publisher and change percentage
- Ledger table 4 publishers "before each" hook for "pin 3 publishers"
- Regular payment panel tests auto include "before each" hook for "site is added automatically"
- Regular payment panel tests can setup payments "before each" hook for "shows welcome page"
- Regular payment panel tests ledger history is CLEARED if payment is disabled before the close and clear history is true
- Regular payment panel tests ledger history is NOT cleared if payment is disabled before the close and clear history is false
- Regular payment panel tests ledger history is NOT cleared if payment is enabled before the close and clear history is true
- about:bookmarks multi-select behavior "before all" hook
- synopsis can sort synopsis table

## app

- MessageBox component tests alert when opening a new tab (while alert is showing) lets you use the back button

## bookmark-components

- bookmark tests bookmark star button is preserved "before each" hook for "on new active tabs"
- bookmark tests bookmarks Editing a bookmark "before all" hook
- bookmark tests bookmarks Editing a bookmark can delete custom title
- bookmark tests bookmarks Editing a bookmark check custom title
- bookmark tests bookmarks Editing a bookmark custom title and location can be backspaced
- bookmark tests bookmarks Editing a bookmark display punycode custom title and location
- bookmark tests bookmarks about pages about:preferences
- bookmark tests bookmarks bookmark pdf check location
- bookmark tests bookmarks pages with title saved with a title and then removed "before all" hook for "displays title"
- bookmark tests bookmarks pages with title saved with a title and then removed removes the bookmark from the toolbar
- bookmark tests bookmarks pages with title saved with a title displays title
- bookmark tests menu behavior rebuilds the menu when a bookmark is added
- bookmark tests menu behavior rebuilds the menu when add a list of items
- bookmarksToolbar display favicon on bookmarks toolbar "after all" hook
- bookmarksToolbar display favicon on bookmarks toolbar display bookmark favicon for url that has it
- bookmarksToolbar display favicon on bookmarks toolbar fallback to default bookmark icon when url has no favicon
- bookmarksToolbar when clicking a bookmark folder automatically opens context menu if you move mouse over a different folder
- bookmarksToolbar when clicking a bookmark folder hides context menu when mousing over regular bookmark

## bravery-components

- Bravery Panel Adblock stats without iframe tests block device enumeration
- Bravery Panel Adblock stats without iframe tests blocks websocket tracking
- Bravery Panel Adblock stats without iframe tests detects https upgrades in private tab
- Bravery Panel Tracking Protection stats detects blocked elements in private tab
- Clear Browsing Panel with closedFrames clears closedFrames
- Clear Browsing Panel with history clears the browsing history
- Clear Browsing Panel with saved state values saves the history switch state
- noscript info can allow scripts on a file:// URL without allowing all scripts
- noscript info can selectively allow scripts once
- notificationBar permissions "before each" hook for "can accept permission request persistently"
- notificationBar permissions does not show the same notification twice

## contents

- content loading does not allow local files to load other other files
- content loading does not support battery status API

## misc-components

- Syncing and clearing data prevents it from syncing "before all" hook
- Syncing and clearing data prevents it from syncing history
- Syncing bookmarks "before all" hook
- Syncing bookmarks from an existing profile "before all" hook
- Syncing then turning it off stops syncing "before all" hook

## navbar-components

- navigationBar tests auto open bookmarks toolbar for the first bookmark "before all" hook
- navigationBar tests auto open bookmarks toolbar for the first bookmark should remain hidden if user has bookmarks but has toolbar hidden
- navigationBar tests lockIcon Limit effect of running insecure content in private frame
- navigationBar tests lockIcon Temporarily allow/deny running insecure content
- navigationBar tests navigation User input remains cleared when onChange is fired but not onKeyUp
- navigationBar tests navigation focus newtab with page has focus in webview
- navigationBar tests navigation tabnapping updates the location in the navbar when changed by the opener
- navigationBar tests submit with about page url input values shows the list icon in URL bar for other about pages
- navigationBar tests submit with auth url input value hides auth part of the url
- navigationBar tests submit with no url input value shows search icon when input is empty
- navigationBar tests submit with url input value with regards to the webview urlbar shows webview url when focused
- search suggestions Finds search suggestions and performs a search when selected
- search suggestions does not offer URL suggestions if user is not typing a URL
- urlBar tests autocomplete "before each" hook for "autocompletes with protocol"
- urlBar tests autocomplete "before each" hook for "clears the selection"
- urlBar tests autocomplete "before each" hook for "does not show autosuggest"
- urlBar tests autocomplete "before each" hook for "has no selection"
- urlBar tests autocomplete "before each" hook for "removes the autocomplete value"
- urlBar tests autocomplete "before each" hook for "should clear when it is not a prefix match"
- urlBar tests keeps url text separate from suffix text changes only the selection
- urlBar tests loading different URL as current page with changed input reverts the URL
- urlBar tests loading same URL as current page with changed input "before all" hook
- urlBar tests search engine icon clears clears last search engine when loading arbitrary page
- urlBarSuggestions deactivates suggestions on delete
- urlBarSuggestions navigates to a suggestion when clicked

## tab-components

- tab pages basic tab page functionality allows changing to tab pages clicking tab page changes
- tab tests back forward actions sets correct title
- tab tests tab transfer can detach into new windows
- tab tests tab transfer can detach the last tab into an existing window
- tab tests webview in fullscreen mode keep favicon and title after exiting fullscreen mode
- tab tests webview previews when tab is hovered does not show tab previews when setting is off
