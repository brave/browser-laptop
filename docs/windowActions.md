# Global





* * *

### setState(windowState) 

Dispatches an event to the main process to replace the window state

**Parameters**

**windowState**: `object`, Initial window state object



### loadUrl(frame, location) 

Dispatches a message to the store to load a new URL.
Both the frame's src and location properties will be updated accordingly.

If the frame is a pinned site and the origin of the pinned site does
not match the origin of the passed in location, then a new frame will be
created for the load.

In general, an iframe's src should not be updated when navigating within the frame to a new page,
but the location should. For user entered new URLs, both should be updated.

**Parameters**

**frame**: `object`, The frame props

**location**: `string`, The URL of the page to load



### setUrl(location, key) 

Dispatches a message to the store to set the new URL.

**Parameters**

**location**: `string`, Dispatches a message to the store to set the new URL.

**key**: `number`, Dispatches a message to the store to set the new URL.



### setNavigated(location, key, isNavigatedInPage, tabId) 

Dispatches a message to the store to let it know a page has been navigated.

**Parameters**

**location**: `string`, The URL of the page that was navigated to.

**key**: `number`, The frame key to modify.

**isNavigatedInPage**: `boolean`, true if it was a navigation within the same page.

**tabId**: `number`, the tab id



### setSecurityState(frameProps, securityState) 

Dispatches a message to set the security state.

**Parameters**

**frameProps**: `Object`, The frame properties to modify.

**securityState**: `Object`, The security state properties that have
  changed.



### setFrameTabId(frameProps, tabId) 

Dispatches a message to set the frame tab id

**Parameters**

**frameProps**: `Object`, The frame properties

**tabId**: `Number`, the tab id to set



### setFrameError(frameProps, errorDetails) 

Dispatches a message to set the frame error state

**Parameters**

**frameProps**: `Object`, The frame properties

**errorDetails**: `Object`, The error properties
  changed.



### setNavBarUserInput(location) 

Dispatches a message to the store to set the user entered text for the URL bar.
Unlike setLocation and loadUrl, this does not modify the state of src and location.

**Parameters**

**location**: `string`, The text to set as the new navbar URL input



### setFrameTitle(frameProps, title) 

Dispatches a message to the store to set the current frame's title.
This should be called in response to the webview encountering a `<title>` tag.

**Parameters**

**frameProps**: `Object`, The frame properties to modify

**title**: `string`, The title to set for the frame



### setFindbarShown(frameProps, shown) 

Shows/hides the find-in-page bar.

**Parameters**

**frameProps**: `Object`, The frame properties to modify

**shown**: `boolean`, Whether to show the findbar



### setFindbarSelected(frameProps, selected) 

Highlight text in the findbar

**Parameters**

**frameProps**: `Object`, The frame properties to modify

**selected**: `boolean`, Whether to select the findbar search text



### setPinned(frameProps, isPinned) 

Sets a frame as pinned

**Parameters**

**frameProps**: `Object`, The frame properties to modify

**isPinned**: `boolean`, Whether to pin or not



### onWebviewLoadStart(frameProps, location) 

Dispatches a message to the store to indicate that the webview is loading.

**Parameters**

**frameProps**: `Object`, The frame properties for the webview in question.

**location**: `string`, The location being loaded.



### onWebviewLoadEnd(frameProps) 

Dispatches a message to the store to indicate that the webview is done loading.

**Parameters**

**frameProps**: `Object`, The frame properties for the webview in question.



### setFullScreen(frameProps, isFullScreen, showFullScreenWarning) 

Dispatches a message to the store to indicate that the webview entered full screen mode.

**Parameters**

**frameProps**: `Object`, The frame properties to put in full screen

**isFullScreen**: `boolean`, true if the webview is entering full screen mode.

**showFullScreenWarning**: `boolean`, true if a warning about entering full screen should be shown.



### newFrame(frameOpts, openInForeground) 

Dispatches a message to the store to create a new frame

**Parameters**

**frameOpts**: `Object`, An object of frame options such as isPrivate, element, and tab features.
                 These may not all be hooked up in Electron yet.

**openInForeground**: `boolean`, true if the new frame should become the new active frame



### closeFrame(frames, frameProps) 

Dispatches a message to close a frame

**Parameters**

**frames**: `Array.&lt;Object&gt;`, Immutable list of of all the frames

**frameProps**: `Object`, The properties of the frame to close



### undoClosedFrame() 

Dispatches a message to the store to undo a closed frame
The new frame is expected to appear at the index it was last closed at



### clearClosedFrames() 

Dispatches a message to the store to clear closed frames



### setActiveFrame(frameProps) 

Dispatches a message to the store to set a new frame as the active frame.

**Parameters**

**frameProps**: `Object`, the frame properties for the webview in question.



### setFocusedFrame(frameProps) 

Dispatches a message to the store when the frame is active and the window is focused

**Parameters**

**frameProps**: `Object`, the frame properties for the webview in question.



### setPreviewFrame(frameProps) 

Dispatches a message to the store to set a preview frame.
This is done when hovering over a tab.

**Parameters**

**frameProps**: `Object`, the frame properties for the webview in question.



### setTabPageIndex(index) 

Dispatches a message to the store to set the tab page index.

**Parameters**

**index**: `number`, the tab page index to change to



### setTabBreakpoint(frameProps, breakpoint) 

Dispatches a message to the store to set the tab breakpoint.

**Parameters**

**frameProps**: `Object`, the frame properties for the webview in question.

**breakpoint**: `string`, the tab breakpoint to change to



### setTabHoverState(frameProps, hoverState) 

Dispatches a message to the store to set the current tab hover state.

**Parameters**

**frameProps**: `Object`, the frame properties for the webview in question.

**hoverState**: `boolean`, whether or not mouse is over tab



### setPreviewTabPageIndex(previewTabPageIndex) 

Dispatches a message to the store to set the tab page index being previewed.

**Parameters**

**previewTabPageIndex**: `number`, The tab page index to preview



### setTabPageIndexByFrame(frameProps) 

Dispatches a message to the store to set the tab page index.

**Parameters**

**frameProps**: `number`, The frame props to center around



### setIsBeingDraggedOverDetail(dragType, dragOverKey, dragDetail) 

Dispatches a message to the store to indicate that something is dragging over this item.

**Parameters**

**dragType**: `string`, The type of drag operation being performed

**dragOverKey**: `Object`, A unique identifier for the storage for the item being dragged over

**dragDetail**: `Object`, detail about the item drag operation



### moveTab(sourceFrameProps, destinationFrameProps, prepend) 

Dispatches a message to the store to indicate that the specified frame should move locations.

**Parameters**

**sourceFrameProps**: `Object`, the frame properties for the webview to move.

**destinationFrameProps**: `Object`, the frame properties for the webview to move to.

**prepend**: `boolean`, Whether or not to prepend to the destinationFrameProps



### setUrlBarSuggestions(suggestionList, selectedIndex) 

Sets the URL bar suggestions and selected index.

**Parameters**

**suggestionList**: `Array.&lt;Object&gt;`, The list of suggestions for the entered URL bar text. This can be generated from history, bookmarks, etc.

**selectedIndex**: `number`, The index for the selected item (users can select items with down arrow on their keyboard)



### activeSuggestionClicked(isForSecondaryAction, shiftKey) 

The active URL bar suggestion was clicked

**Parameters**

**isForSecondaryAction**: `boolean`, Whether the secondary action is expected
 which happens when a modifier key is pressed.

**shiftKey**: `boolean`, Whether the shift key is being pressed



### previousUrlBarSuggestionSelected() 

The previous suggestion is being selected



### nextUrlBarSuggestionSelected() 

The next suggestion is being selected



### urlBarAutocompleteEnabled(enabled) 

autocomplete for urlbar is being enabled or disabled.
Autocomplete is defined to be the action of inserting text into the urlbar itself
to the first item's URL match if possible.  The inserted text is auto selected so
that the next character inserted will replace it.
This is sometimes only temporarily disabled, e.g. a user is pressing backspace.

**Parameters**

**enabled**: `boolean`, true if the urlbar should autocomplete



### searchSuggestionResultsAvailable(tabId, searchResults) 

New URL bar suggestion search results are available.
This is typically from a service like Duck Duck Go auto complete for the portion of text that the user typed in.

**Parameters**

**tabId**: `number`, the tab id for the action

**searchResults**: , The search results for the currently entered URL bar text.



### setUrlBarSelected(isSelected) 

Marks the URL bar text as selected or not

**Parameters**

**isSelected**: `boolean`, Whether or not the URL bar text input should be selected



### setUrlBarActive(isActive) 

Marks the URL bar as active or not.
If the URL bar is active that means it's in a position that it should be displaying
autocomplete.  It may choose not to display autocomplete and still be active if there
are no autocomplete results.

**Parameters**

**isActive**: `boolean`, Whether or not the URL bar should be marked as active



### setUrlBarFocused(isFocused) 

Marks the URL bar as focused or not.

**Parameters**

**isFocused**: `boolean`, Whether or not the URL bar should be marked as focused



### setActiveFrameShortcut(frameProps, activeShortcut, activeShortcutDetails) 

Dispatches a message to the store to indicate that the pending frame shortcut info should be updated.

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**activeShortcut**: `string`, The text for the new shortcut. Usually this is null to clear info which was previously
set from an IPC call.

**activeShortcutDetails**: `string`, Parameters for the shortcut action



### setSearchDetail(searchDetail) 

Dispatches a message to set the search engine details.

**Parameters**

**searchDetail**: `Object`, the search details



### setFindDetail(frameProps, findDetail) 

Dispatches a message to set the find-in-page details.

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**findDetail**: `Object`, the find details



### setBookmarkDetail(currentDetail, originalDetail, destinationDetail, shouldShowLocation, isBookmarkHanger) 

Dispatches a message to set add/edit bookmark details
If set, also indicates that add/edit is shown

**Parameters**

**currentDetail**: `Object`, Properties of the bookmark to change to

**originalDetail**: `Object`, Properties of the bookmark to edit

**destinationDetail**: `Object`, Will move the added bookmark to the specified position

**shouldShowLocation**: `boolean`, Whether or not to show the URL input

**isBookmarkHanger**: `boolean`, true if triggered from star icon in nav bar



### setContextMenuDetail(detail) 

Dispatches a message to set context menu detail.
If set, also indicates that the context menu is shown.

**Parameters**

**detail**: `Object`, The context menu detail



### setPopupWindowDetail(detail) 

Dispatches a message to set popup window detail.
If set, also indicates that the popup window is shown.

**Parameters**

**detail**: `Object`, The popup window detail



### setAudioMuted(frameProps, muted) 

Dispatches a message to indicate that the frame should be muted

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**muted**: `boolean`, true if the frame is muted



### muteAllAudio(framePropsList, muted) 

Dispatches a mute/unmute call to all frames in a provided list (used by TabList).

**Parameters**

**framePropsList**: `Object`, List of frame properties to consider

**muted**: `boolean`, true if the frames should be muted



### muteAllAudioExcept(frameToSkip) 

Dispatches a mute call to all frames except the one provided.
The provided frame will have its audio unmuted.

**Parameters**

**frameToSkip**: `Object`, Properties of the frame to keep audio



### setAudioPlaybackActive(frameProps, audioPlaybackActive) 

Dispatches a message to indicate that audio is playing

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**audioPlaybackActive**: `boolean`, true if audio is playing in the frame



### setThemeColor(frameProps, themeColor, computedThemeColor) 

Dispatches a message to indicate that the theme color has changed for a page

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**themeColor**: `string`, Theme color of the frame

**computedThemeColor**: `string`, Computed theme color of the
  frame which is used if no frame color is present



### setFavicon(frameProps, favicon) 

Dispatches a message to indicate that the favicon has changed

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**favicon**: `string`, A url to the favicon to use



### setLastZoomPercentage(frameProps, percentage) 

Dispatches a message to store the last zoom percentage.
This is mainly just used to trigger updates throughout React.

**Parameters**

**frameProps**: `object`, The frame to set blocked info on

**percentage**: `number`, The new zoom percentage



### setMaximizeState(isMaximized) 

Sets the maximize state of the window

**Parameters**

**isMaximized**: `boolean`, true if window is maximized



### savePosition(position) 

Saves the position of the window in the window state

**Parameters**

**position**: `Array`, [x, y]



### saveSize(size) 

Saves the size (width, height) of the window in the window state

**Parameters**

**size**: `Array`, [x, y]



### setWindowFullScreen(isFullScreen) 

Sets the fullscreen state of the window

**Parameters**

**isFullScreen**: `boolean`, true if window is fullscreen



### setMouseInTitlebar(mouseInTitlebar) 

Dispatches a message to indicate if the mouse is in the titlebar

**Parameters**

**mouseInTitlebar**: `boolean`, true if the mouse is in the titlebar



### setSiteInfoVisible(isVisible) 

Dispatches a message to indicate the site info, such as # of blocked ads, should be shown

**Parameters**

**isVisible**: `boolean`, true if the site info should be shown



### setBraveryPanelDetail(braveryPanelDetail) 

Dispatches a message to indicate the bravery panel should be shown

**Parameters**

**braveryPanelDetail**: `Object`, Details about how to show the bravery panel.
  Set to undefined to hide the panel.  See state documentation for more info.



### setDownloadsToolbarVisible(isVisible) 

Dispatches a message to indicate if the downloads toolbar is visible

**Parameters**

**isVisible**: `boolean`, true if the site info should be shown



### setReleaseNotesVisible(isVisible) 

Dispatches a message to indicate the release notes should be visible

**Parameters**

**isVisible**: `boolean`, true if the site info should be shown



### setLinkHoverPreview(href, showOnRight) 

Dispatches a message to indicate the href preview should be shown
for a hovered link

**Parameters**

**href**: `string`, the href of the link

**showOnRight**: `boolean`, display in the right corner



### setBlockedBy(frameProps, blockType, location) 

Dispatches a message to indicate the site info, such as # of blocked ads, should be shown

**Parameters**

**frameProps**: `object`, The frame to set blocked info on

**blockType**: `string`, type of the block

**location**: `string`, URL that was blocked



### setRedirectedBy(frameProps, ruleset, location) 

Similar to setBlockedBy but for httpse redirects

**Parameters**

**frameProps**: `Object`, The frame to set blocked info on

**ruleset**: `string`, Name of the HTTPS Everywhere ruleset XML file

**location**: `string`, URL that was redirected



### setNoScript(frameProps, source) 

Sets which scripts were blocked on a page.

**Parameters**

**frameProps**: `Object`, The frame to set blocked info on

**source**: `string`, Source of blocked js



### setNoScriptVisible(isVisible) 

Sets whether the noscript icon is visible.

**Parameters**

**isVisible**: `boolean`, Sets whether the noscript icon is visible.



### addHistory(frameProps) 

Adds a history entry

**Parameters**

**frameProps**: `Object`, The frame properties to change history for.



### setClearBrowsingDataPanelVisible(isVisible) 

Sets whether the clear browsing data popup is visible

**Parameters**

**isVisible**: `boolean`, Sets whether the clear browsing data popup is visible



### setImportBrowserDataDetail(importBrowserDataDetail) 

Sets the import browser data popup detail

**Parameters**

**importBrowserDataDetail**: `Array`, list of supported browsers



### setImportBrowserDataSelected(selected) 

Sets the selected import browser data

**Parameters**

**selected**: `Object`, selected browser data to import



### widevinePanelDetailChanged(widevinePanelDetail) 

Widevine popup detail changed

**Parameters**

**widevinePanelDetail**: `Object`, detail of the widevine panel



### setAutofillAddressDetail(currentDetail, originalDetail) 

Sets the manage autofill address popup detail

**Parameters**

**currentDetail**: `Object`, Properties of the address to change to

**originalDetail**: `Object`, Properties of the address to edit



### setAutofillCreditCardDetail(currentDetail, originalDetail) 

Sets the manage autofill credit card popup detail

**Parameters**

**currentDetail**: `Object`, Properties of the credit card to change to

**originalDetail**: `Object`, Properties of the credit card to edit



### setBlockedRunInsecureContent(frameProps, source) 

Sets source of blocked active mixed content.

**Parameters**

**frameProps**: `Object`, The frame to set source of
blocked active mixed content on

**source**: `string`, Source of blocked active mixed content



### toggleMenubarVisible(isVisible) 

(Windows only)
Dispatches a message to indicate the custom rendered Menubar should be toggled (shown/hidden)

**Parameters**

**isVisible**: `boolean`, (optional)



### clickMenubarSubmenu(label) 

(Windows only)
Used to trigger the click() action for a menu
Called from the Menubar control, handled in menu.js

**Parameters**

**label**: `string`, text of the label that was clicked



### resetMenuState() 

Used by `main.js` when click happens on content area (not on a link or react control).
- closes context menu
- closes popup menu
- nulls out menubar item selected (Windows only)
- hides menubar if auto-hide preference is set (Windows only)



### setMenuBarSelectedIndex(index) 

(Windows only)
Used to track selected index of a menu bar
Needed because arrow keys can be used to navigate the custom menu

**Parameters**

**index**: `number`, zero based index of the item.
  Index excludes menu separators and hidden items.



### setContextMenuSelectedIndex(index) 

Used to track selected index of a context menu
Needed because arrow keys can be used to navigate the context menu

**Parameters**

**index**: `number`, zero based index of the item.
  Index excludes menu separators and hidden items.



### setLastFocusedSelector(selector) 

(Windows only at the moment)
Used to track last selected element (typically the URL bar or the frame)
Important because focus is lost when using the custom menu and needs
to be returned in order for the cut/copy operation to work

**Parameters**

**selector**: `string`, selector used w/ querySelectorAll to return focus
  after a menu item is selected (via the custom titlebar / menubar)



### gotResponseDetails(tabId, details) 

Used to get response details (such as the HTTP response code) from a response
See `eventStore.js` for an example use-case

**Parameters**

**tabId**: `number`, the tab id to set

**details**: `Object`, object containing response details



### setBookmarksToolbarSelectedFolderId(folderId) 

Fired when the mouse clicks or hovers over a bookmark folder in the bookmarks toolbar

**Parameters**

**folderId**: `number`, from the siteDetail for the bookmark folder
  If set to null, no menu is open. If set to -1, mouse is over a bookmark, not a folder



### onFocusChanged(hasFocus) 

Fired when window receives or loses focus

**Parameters**

**hasFocus**: `boolean`, true if focused, false if blurred



### setModalDialogDetail(className, props) 

Set Modal Dialog detail

**Parameters**

**className**: `string`, name of modal dialog

**props**: `Object`, properties of the modal dialog




* * *










