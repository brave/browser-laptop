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



### updateRequested() 

Dispatches an event to the main process to update the browser



### addSite(siteDetail, tag, originalSiteDetail) 

Adds a site to the site list

**Parameters**

**siteDetail**: `Object`, Properties of the site in question, can also be an array of siteDetail

**tag**: `string`, A tag to associate with the site. e.g. bookmarks.

**originalSiteDetail**: `string`, If specified, the original site detail to edit / overwrite.
  The details of the old entries will be modified if this is set, otherwise only the tag will be added.



### removeSite(siteDetail, tag) 

Removes a site from the site list

**Parameters**

**siteDetail**: `Object`, Properties of the site in question

**tag**: `string`, A tag to associate with the site. e.g. bookmarks.



### moveSite(sourceDetail, destinationDetail, prepend) 

Dispatches a message to move a site locations.

**Parameters**

**sourceDetail**: `string`, the location, partitionNumber, etc of the source moved site

**destinationDetail**: `string`, the location, partitionNumber, etc of the destination moved site

**prepend**: `boolean`, Whether or not to prepend to the destinationLocation



### setDefaultWindowSize(size) 

Sets the default window size

**Parameters**

**size**: `Array`, [width, height]



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



### setUpdateLastCheck() 

Sets the update.lastCheckTimestamp to the current
epoch timestamp (milliseconds)



### setUpdateStatus(status, verbose, metadata) 

Sets the update status

**Parameters**

**status**: `string`, update status from js/constants/updateStatus.js.

**verbose**: `boolean`, Whether to show UI for all the update steps.

**metadata**: `object`, Metadata from the pdate server, with info like release notes.



### changeSetting(key, value) 

Changes an application level setting

**Parameters**

**key**: `string`, The key name for the setting

**value**: `string`, The value of the setting




* * *










