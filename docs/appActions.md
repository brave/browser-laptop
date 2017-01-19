# Global





* * *

### setState(appState) 

Dispatches an event to the main process to replace the app state
This is called from the main process on startup before anything else

**Parameters**

**appState**: `object`, Initial app state object (not yet converted to ImmutableJS)



### newWindow(frameOpts, browserOpts, restoredState, cb) 

Dispatches an event to the main process to create a new window.

**Parameters**

**frameOpts**: `Object`, Options for the first frame in the window.

**browserOpts**: `Object`, Options for the browser.

**restoredState**: `Object`, State for the window to restore.

**cb**: `function`, Callback to call after the window is loaded, will only work if called from the main process.



### newTab(createProperties) 

A new tab has been requested

**Parameters**

**createProperties**: `Object`, windowId, url, active, openerTabId



### tabCreated(tabValue) 

A new tab has been created

**Parameters**

**tabValue**: `Object`, A new tab has been created



### tabUpdated(tabValue) 

A tab has been updated

**Parameters**

**tabValue**: `Object`, A tab has been updated



### tabClosed(tabId) 

Closes an open tab

**Parameters**

**tabId**: `number`, Closes an open tab



### addSite(siteDetail, tag, originalSiteDetail, destinationIsParent, skipSync) 

Adds a site to the site list

**Parameters**

**siteDetail**: `Object`, Properties of the site in question, can also be an array of siteDetail

**tag**: `string`, A tag to associate with the site. e.g. bookmarks.

**originalSiteDetail**: `string`, If specified, the original site detail to edit / overwrite.

**destinationIsParent**: `boolean`, Whether or not the destinationDetail should be considered the new parent.
  The details of the old entries will be modified if this is set, otherwise only the tag will be added.

**skipSync**: `boolean`, Set true if a site isn't eligible for Sync (e.g. if addSite was triggered by Sync)



### clearHistory() 

Clears history (all sites without tags). Indirectly called by appActions.onClearBrowsingData().



### removeSite(siteDetail, tag, skipSync) 

Removes a site from the site list

**Parameters**

**siteDetail**: `Object`, Properties of the site in question

**tag**: `string`, A tag to associate with the site. e.g. bookmarks.

**skipSync**: `boolean`, Set true if a site isn't eligible for Sync (e.g. if this removal was triggered by Sync)



### moveSite(sourceDetail, destinationDetail, prepend, destinationIsParent) 

Dispatches a message to move a site locations.

**Parameters**

**sourceDetail**: `string`, the location, partitionNumber, etc of the source moved site

**destinationDetail**: `string`, the location, partitionNumber, etc of the destination moved site

**prepend**: `boolean`, Whether or not to prepend to the destinationLocation
  If false, the destinationDetail is considered a sibling.

**destinationIsParent**: `boolean`, Whether or not the destinationDetail should be considered the new parent.



### mergeDownloadDetail(downloadId, downloadDetail) 

Dispatches a message to add/edit download details
If set, also indicates that add/edit is shown

**Parameters**

**downloadId**: `string`, A unique ID for the download

**downloadDetail**: `Object`, Properties for the download



### clearCompletedDownloads() 

Dispatches a message to clear all completed downloads



### ledgerRecoverySucceeded() 

Dispatches a message indicating ledger recovery succeeded



### ledgerRecoveryFailed() 

Dispatches a message indicating ledger recovery failed



### defaultWindowParamsChanged(size, position) 

Sets the default window size / position

**Parameters**

**size**: `Array`, [width, height]

**position**: `Array`, [x, y]



### setResourceETag(resourceName, etag) 

Sets the etag value for a downloaded data file.
This is used for keeping track of when to re-download adblock and tracking
protection data.

**Parameters**

**resourceName**: `string`, 'adblock' or 'trackingProtection'

**etag**: `string`, The etag of the reosurce from the http response



### setResourceLastCheck(resourceName, lastCheck) 

Sets the lastCheck date.getTime() value for the data file

**Parameters**

**resourceName**: `string`, 'adblock', 'trackingProtection', or 'httpsEverywhere'

**lastCheck**: `number`, The last check date of the reosurce from the http response



### setResourceEnabled(resourceName, enabled) 

Sets whether the resource is enabled or not.

**Parameters**

**resourceName**: `string`, 'adblock', 'trackingProtection', or 'httpsEverywhere'

**enabled**: `boolean`, true if the resource is enabled.



### resourceReady(resourceName) 

Indicates a resource is ready

**Parameters**

**resourceName**: `string`, 'widevine'



### addResourceCount(resourceName, count) 

Checks how many resources were blocked.

**Parameters**

**resourceName**: `string`, 'adblock', 'trackingProtection', or 'httpsEverywhere'

**count**: `number`, number of blocked resources to add to the global count



### setUpdateLastCheck() 

Sets the update.lastCheckTimestamp to the current
epoch timestamp (milliseconds)



### setUpdateStatus(status, verbose, metadata) 

Sets the update status

**Parameters**

**status**: `string`, update status from js/constants/updateStatus.js.

**verbose**: `boolean`, Whether to show UI for all the update steps.

**metadata**: `object`, Metadata from the pdate server, with info like release notes.



### savePassword(passwordDetail) 

Saves login credentials

**Parameters**

**passwordDetail**: `Object`, login details



### deletePassword(passwordDetail) 

Deletes login credentials

**Parameters**

**passwordDetail**: `Object`, login details



### clearPasswords() 

Deletes all saved login credentials



### changeSetting(key, value) 

Changes an application level setting

**Parameters**

**key**: `string`, The key name for the setting

**value**: `string`, The value of the setting



### changeSiteSetting(hostPattern, key, value, temp, skipSync) 

Change a hostPattern's config

**Parameters**

**hostPattern**: `string`, The host pattern to update the config for

**key**: `string`, The config key to update

**value**: `string | number`, The value to update to

**temp**: `boolean`, Whether to change temporary or persistent
  settings. defaults to false (persistent).

**skipSync**: `boolean`, Set true if a site isn't eligible for Sync (e.g. if addSite was triggered by Sync)



### removeSiteSetting(hostPattern, key, temp, skipSync) 

Removes a site setting

**Parameters**

**hostPattern**: `string`, The host pattern to update the config for

**key**: `string`, The config key to update

**temp**: `boolean`, Whether to change temporary or persistent
  settings. defaults to false (persistent).

**skipSync**: `boolean`, Set true if a site isn't eligible for Sync (e.g. if addSite was triggered by Sync)



### updateLedgerInfo(ledgerInfo) 

Updates ledger information for the payments pane

**Parameters**

**ledgerInfo**: `object`, the current ledger state



### updatePublisherInfo(publisherInfo) 

Updates publisher information for the payments pane

**Parameters**

**publisherInfo**: `object`, the current publisher synopsis



### showMessageBox(detail) 

Shows a message box in the notification bar

**Parameters**

**detail**: `Object`, Shows a message box in the notification bar



### hideMessageBox(message) 

Hides a message box in the notification bar

**Parameters**

**message**: `string`, Hides a message box in the notification bar



### clearMessageBoxes(origin) 

Clears all message boxes for a given origin.

**Parameters**

**origin**: `string`, Clears all message boxes for a given origin.



### addWord(word, learn) 

Adds a word to the dictionary

**Parameters**

**word**: `string`, The word to add

**learn**: `boolean`, true if the word should be learned, false if ignored



### setDictionary(locale) 

Adds a word to the dictionary

**Parameters**

**locale**: `string`, The locale to set for the dictionary



### setLoginRequiredDetail(tabId, detail) 

Adds information about pending basic auth login requests

**Parameters**

**tabId**: `number`, The tabId that generated the request

**detail**: `string`, login request info



### onClearBrowsingData(clearDataDetail) 

Clears the data specified in clearDataDetail

**Parameters**

**clearDataDetail**: `object`, the app data to clear as per doc/state.md's clearBrowsingDataDefaults



### importBrowserData(selected) 

Import browser data specified in selected

**Parameters**

**selected**: `object`, the browser data to import as per doc/state.md's importBrowserDataSelected



### addAutofillAddress(detail, originalDetail) 

Add address data

**Parameters**

**detail**: `object`, the address to add as per doc/state.md's autofillAddressDetail

**originalDetail**: `object`, the original address before editing



### removeAutofillAddress(detail) 

Remove address data

**Parameters**

**detail**: `object`, the address to remove as per doc/state.md's autofillAddressDetail



### addAutofillCreditCard(detail, originalDetail) 

Add credit card data

**Parameters**

**detail**: `object`, the credit card to add as per doc/state.md's autofillCreditCardDetail

**originalDetail**: `object`, the original credit card before editing



### removeAutofillCreditCard(detail) 

Remove credit card data

**Parameters**

**detail**: `object`, the credit card to remove as per doc/state.md's autofillCreditCardDetail



### autofillDataChanged(addressGuids, creditCardGuids) 

Autofill data changed

**Parameters**

**addressGuids**: `Array`, the guid array to access address entries in autofill DB

**creditCardGuids**: `Array`, the guid array to access credit card entries in autofill DB



### windowBlurred(windowId) 

Dispatches a message when appWindowId loses focus
Dispatches a message when windowId loses focus

**Parameters**

**windowId**: `Number`, the unique id of the window



### setMenubarTemplate(menubarTemplate) 

Saves current menubar template for use w/ Windows titlebar

**Parameters**

**menubarTemplate**: `Object`, JSON used to build the menu



### networkConnected() 

Dispatches a message when the network is re-connected
after being disconnected



### networkDisconnected() 

Dispatches a message when the network is disconnected



### defaultBrowserUpdated(useBrave) 

Dispatch a message to set default browser

**Parameters**

**useBrave**: `boolean`, whether set Brave as default browser



### defaultBrowserCheckComplete() 

Dispatch a message to indicate default browser check is complete



### populateHistory() 

Notify the AppStore to provide default history values.



### dataURLCopied() 

Dispatch a message to copy data URL to clipboard



### shuttingDown() 

Dispatches a message when the app is shutting down.



### downloadRevealed(downloadId) 

Dispatches a message when a download is being revealed.
Typically this will open the download directory in finder / explorer and select the icon.

**Parameters**

**downloadId**: `string`, ID of the download being revealed



### downloadOpened(downloadId) 

Dispatches a message when a download is being opened.

**Parameters**

**downloadId**: `string`, ID of the download being opened



### downloadActionPerformed(downloadId, downloadAction) 

Dispatches a message when an electron download action is being performed (pause, resume, cancel)

**Parameters**

**downloadId**: `string`, ID of the download item the action is being performed to

**downloadAction**: `string`, the action to perform from constants/electronDownloadItemActions.js



### downloadCopiedToClipboard(downloadId) 

Dispatches a message when a download URL is being copied to the clipboard

**Parameters**

**downloadId**: `string`, ID of the download item being copied to the clipboard



### downloadDeleted(downloadId) 

Dispatches a message when a download is being deleted

**Parameters**

**downloadId**: `string`, ID of the download item being deleted



### downloadCleared(downloadId) 

Dispatches a message when a download is being cleared

**Parameters**

**downloadId**: `string`, ID of the download item being cleared



### downloadRedownloaded(downloadId) 

Dispatches a message when a download is being redownloaded

**Parameters**

**downloadId**: `string`, ID of the download item being redownloaded



### clipboardTextCopied(text) 

Dispatches a message when text is updated to the clipboard

**Parameters**

**text**: `string`, clipboard text which is copied



### tabCloned(tabId, options) 

Dispatches a message when a tab is being cloned

**Parameters**

**tabId**: `number`, The tabId of the tab to clone

**options**: `object`, object containing options such as acive, back, and forward booleans



### setObjectId(objectId, objectPath) 

Dispatches a message to set objectId for a syncable object.

**Parameters**

**objectId**: `Array.&lt;number&gt;`, Dispatches a message to set objectId for a syncable object.

**objectPath**: `Array.&lt;string&gt;`, Dispatches a message to set objectId for a syncable object.



### saveSyncInitData(seed, deviceId, lastFetchTimestamp, seedQr) 

Dispatches a message when sync init data needs to be saved

**Parameters**

**seed**: `Array.&lt;number&gt; | null`, Dispatches a message when sync init data needs to be saved

**deviceId**: `Array.&lt;number&gt; | null`, Dispatches a message when sync init data needs to be saved

**lastFetchTimestamp**: `number | null`, Dispatches a message when sync init data needs to be saved

**seedQr**: `string`, Dispatches a message when sync init data needs to be saved




* * *










