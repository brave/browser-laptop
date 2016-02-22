# Global





* * *

### setState(windowState) 

Dispatches an event to the main process to replace the window state

**Parameters**

**windowState**: `object`, Initial window state object



### loadUrl(activeFrame, location) 

Dispatches a message to the store to load a new URL for the active frame.
Both the frame's src and location properties will be updated accordingly.

If the activeFrame is a pinned site and the origin of the pinned site does
not match the origin of the passed in location, then a new frame will be
created for the load.

In general, an iframe's src should not be updated when navigating within the frame to a new page,
but the location should. For user entered new URLs, both should be updated.

**Parameters**

**activeFrame**: `object`, The frame props for the active frame

**location**: `string`, The URL of the page to load



### setLocation(location, key) 

Dispatches a message to the store to set the current navigated location.
This differs from the above in that it will not change the webview's (iframe's) src.
This should be used for inter-page navigation but not user initiated loads.

**Parameters**

**location**: `string`, The URL of the page to load

**key**: `number`, The frame key to modify, it is checked against the active frame and if
it is active the URL text will also be changed.



### setSecurityState(frameProps, securityState) 

Dispatches a message to set the security state.

**Parameters**

**frameProps**: `Object`, The frame properties to modify.

**securityState**: `Object`, The security state properties that have
  changed.



### setNavBarUserInput(location) 

Dispatches a message to the store to set the user entered text for the URL bar.
Unlike setLocation and loadUrl, this does not modify the state of src and location.

**Parameters**

**location**: `string`, The text to set as the new navbar URL input



### setFrameTitle(frameProps, title) 

Dispatches a message to the store to set the current frame's title.
This should be called in response to the webview encountering a <title> tag.

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



### onWebviewLoadStart(frameProps) 

Dispatches a message to the store to indicate that the webview is loading.

**Parameters**

**frameProps**: `Object`, The frame properties for the webview in question.



### onWebviewLoadEnd(frameProps) 

Dispatches a message to the store to indicate that the webview is done loading.

**Parameters**

**frameProps**: `Object`, The frame properties for the webview in question.



### setNavBarFocused(focused) 

Dispatches a message to the store to indicate if the navigation bar is focused.

**Parameters**

**focused**: `boolean`, true if the navigation bar should be considered as focused



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



### quitApplication() 

Dispatches an event to the main process to quit the entire application



### setActiveFrame(frameProps) 

Dispatches a message to the store to set a new frame as the active frame.

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



### setTabPageIndexByFrame(frameProps) 

Dispatches a message to the store to set the tab page index.

**Parameters**

**frameProps**: `number`, The frame props to center around



### updateBackForwardState(frameProps, canGoBack, canGoForward) 

Dispatches a message to the store to update the back-forward information.

**Parameters**

**frameProps**: `Object`, the frame properties for the webview in question.

**canGoBack**: `boolean`, Specifies if the active frame has previous entries in its history

**canGoForward**: `boolean`, Specifies if the active frame has next entries in its history (i.e. the user pressed back at least once)



### setIsBeingDragged(dragType, sourceDragData, dragging) 

Dispatches a message to the store to indicate that dragging has started / stopped for the item.

**Parameters**

**dragType**: `string`, The type of drag operation being performed

**sourceDragData**: `Object`, the properties for the item being dragged

**dragging**: `boolean`, true if the item is being dragged.



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



### setUrlBarSuggestionSearchResults(searchResults) 

Sets the URL bar suggestion search results.
This is typically from a service like Duck Duck Go auto complete for the portion of text that the user typed in.
Note: This should eventually be refactored outside of the component doing XHR and into a store.

**Parameters**

**searchResults**: , The search results to set for the currently entered URL bar text.



### setUrlBarSelected(isSelected, forSearchMode) 

Marks the URL bar text as selected or not

**Parameters**

**isSelected**: `boolean`, Whether or not the URL bar text input should be selected

**forSearchMode**: `boolean`, Whether or not to enable auto-complete search suggestions



### setUrlBarActive(isActive) 

Marks the URL bar as active or not

**Parameters**

**isActive**: `boolean`, Whether or not the URL bar should be marked as active



### setActiveFrameShortcut(frameProps, activeShortcut) 

Dispatches a message to the store to indicate that the pending frame shortcut info should be updated.

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**activeShortcut**: `string`, The text for the new shortcut. Usually this is null to clear info which was previously
set from an IPC call.



### setSearchDetail(searchDetail) 

Dispatches a message to set the search engine details.

**Parameters**

**searchDetail**: `Object`, the search details



### setFindDetail(frameProps, findDetail) 

Dispatches a message to set the find-in-page details.

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**findDetail**: `Object`, the find details



### setBookmarkDetail(currentDetail, originalDetail) 

Dispatches a message to set add/edit bookmark details
If set, also indicates that add/edit is shown

**Parameters**

**currentDetail**: `Object`, Properties of the bookmark to change to

**originalDetail**: `Object`, Properties of the bookmark to edit



### setAudioMuted(frameProps, muted) 

Dispatches a message to indicate that the frame should be muted

**Parameters**

**frameProps**: `Object`, Properties of the frame in question

**muted**: `boolean`, true if the frame is muted



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



### setMouseInTitlebar(mouseInTitlebar) 

Dispatches a message to indicate if the mouse is in the titlebar

**Parameters**

**mouseInTitlebar**: `boolean`, true if the mouse is in the titlebar



### setSiteInfoVisible(isVisible, expandTrackingProtection, expandAdblock) 

Dispatches a message to indicate the site info, such as # of blocked ads, should be shown

**Parameters**

**isVisible**: `boolean`, true if the site info should be shown

**expandTrackingProtection**: `boolean`, If specified, indicates if the TP section should be expanded

**expandAdblock**: `boolean`, If specified, indicates if the adblock section should be expanded



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



### setBlockedBy(frameProps, blockType) 

Dispatches a message to indicate the site info, such as # of blocked ads, should be shown

**Parameters**

**frameProps**: `object`, The frame to set blocked info on

**blockType**: `string`, either 'adblock' or 'trackingProtection'




* * *










