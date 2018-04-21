# Component Structure

The UI is made up of a tree like structure of React components.

<!--
All [React](https://facebook.github.io/react/) components (with the exception of the top level one named `App`) should extend `ImmutableComponent` which in turn directly extends `React.Component`.
-->
All [React](https://facebook.github.io/react/) components should extend `React.Component` or `ImmutableComponent` which itself extends `React.Component`.
`ImmutableComponent` is meant to be used with [Immutable.js](http://facebook.github.io/immutable-js/) props for data.  State should be sent in from props and components should not attempt to modify state themselves.  Instead they should dispatch actions to one of the stores.
`ImmutableComponent` allows component to figure out if any data has changed more efficiently by doing simple top level equality checks only by implementing React's `shouldComponentUpdate`.

# Hierarchy

- Window
  - Main
    - Navigator
      - NavigationBar
        - AddEditBookmarkHanger
          - Dialog
          - AddEditBookmarkForm
            - [BrowserButton]
            - [CommonFormSection]
            - CommonFormDropdown
            - CommonFormTextbox
          - CommonFormHanger
          - [CommonFormSection]
        - StopButton
        - ReloadButton
        - HomeButton
        - BookmarkButton
        - UrlBar
          - [UrlBarIcon]
          - BrowserButton
          - UrlBarSuggestions
        - PublisherToggle
          - BrowserButton
      - MenuBar
        - MenuBarItem
      - [WindowCaptionButtons]
      - BrowserButton
      - BrowserAction
      - BackButton
      - FowardButton
    - TabPages
      - [TabPage]
    - TabsToolbar
      - Tabs
        - BrowserButton
        - LongPressButton
        - [Tab]
          - Favicon
            - TabIcon
          - AudioTabIcon
            - TabIcon
          - NewSessionIcon
            - TabIcon
          - PrivateIcon
            - TabIcon
          - TabTitle
          - CloseTabIcon
          - NotificationBarCaret
            - NotificationItem
              - BrowserButton
      - PinnedTabs
        - [Tab]
          - Favicon
            - TabIcon
          - AudioTabIcon
            - TabIcon
          - NewSessionIcon
            - TabIcon
          - PrivateIcon
            - TabIcon
          - TabTitle
          - CloseTabIcon
          - NotificationBarCaret
            - NotificationItem
              - BrowserButton
      - BrowserButton
    - [Frame]
      - FullScreenWarning
      - HrefPreview
      - MessageBox
        - Dialog
        - FlyoutDialog
        - BrowserButton
        - SwitchControl
      - electron:webview
    - FindBar
      - [BrowserButton]
      - SwitchControl
    - UpdateBar
      - BrowserButton
      - UpdateAvailable
      - UpdateChecking
      - UpdateDownloading
      - UpdateNotAvailable
      - UpdateError
    - NotificationBar
      - NotificationItem
        - BrowserButton
    - BraveNotificationBar
      - NotificationItem
        - BrowserButton
    - DownloadsBar
      - Button
      - BrowserButton
      - [DownloadItem]
        - [Button]
    - SiteInfo
      - Dialog
      - FlyoutDialog
      - [Button]
    - BraveryPanel
      - Dialog
      - FlyoutDialog
      - BrowserButton
      - [SwitchControl]
      - [FormDropdown]
    - ClearBrowsingDataPanel
      - Dialog
      - [Button]
      - [SwitchControl]
      - CommonForm
      - [CommonFormSection]
    - ImportBrowserDataPanel
      - Dialog
      - [Button]
      - [SwitchControl]
      - CommonForm
      - CommonFormDropdown
      - [CommonFormSection]
    - WidevinePanel
      - Dialog
      - [Button]
      - SwitchControl
      - WidevineInfo
      - CommonForm
      - [CommonFormSection]
    - AutofillAddressPanel
      - Dialog
      - [Button]
      - CommonForm
      - [CommonFormSection]
      - CommonFormDropdown
    - AutofillCreditCardPanel
      - Dialog
      - [Button]
      - CommonForm
      - [CommonFormSection]
      - [CommonFormDropdown]
      - CommonFormTextbox
    - AddEditBookmarkHanger
      - Dialog
      - AddEditBookmarkForm
        - [BrowserButton]
        - [CommonFormSection]
        - CommonFormDropdown
        - CommonFormTextbox
      - CommonFormHanger
      - [CommonFormSection]
    - AddEditBookmerkFolder
      - Dialog
      - AddEditBookmarkFolderForm
        - [BrowserButton]
        - [CommonFormSection]
        - CommonFormDropdown
      - CommonFormHanger
      - CommonFormSection
    - LoginRequired
      - Dialog
      - [Button]
      - CommonForm
      - [CommonFormSection]
      - CommonFormTextbox
    - ReleasedNotes
      - Dialog
      - FlyoutDialog
    - BookmarksToolbar
      - BrowserButton
      - BookmarkToolbarButton
    - ContextMenu
      - [ContextMenuSingle]
    - PopupWindow
    - NoScriptInfo
      - Dialog
      - [BrowserButton]
    - CheckDefaultBrowserDialog
      - Dialog
      - [BrowserButton]
      - SwitchControl
      - CommonForm
      - [CommonFormSection]

# Glossary

**AddEditBookmarkFolder:**
Dialog box for adding/editing bookmark folders.

**AddEditBookmarkHanger:**
Dialog box for adding/editing bookmarks.

**AutofillAddressPanel:**
Dialog box for adding/editing autofill addresses.

**AutofillCreditCardPanel:**
Dialog box for adding/editing credit card information.

**App:**
This should be the only component which modifies state internally and does not extend `ImmutableComponent`.
It listens to events dispatched from the application store and re-renders the component tree.

**BookmarksToolbar:**
Toolbar that displays bookmarks.

**BraveNotificationBar:**

**BraveryPanel:**
Popup dialog that displays site shield settings, ad counters, and ad/cookie controls.

Appears when you click on Brave shield next to URL bar.

**Button:**
Buttons such as back, forward, reload, stop, and new frame.

**CheckDefaultBrowserDialog:**
Dialog box for setting Brave as default browser

**ClearBrowsingDataPanel:**
Dialog box for clearing browsing data

**ContextMenu:**


**DownloadsBar:**

**FindBar:**

**Frame:**
Component which wraps and renders electron webviews.

**ImportBrowserDataPanel:**

**LoginRequired:**

**Main:**
Represents a browser window.

**NavigationBar:**
A collection of page navigation components such as the urlbar and back button.

**Navigator:**

**NoScriptInfo:**

**NotificationBar:**

**PopupWindow:**

**ReleaseNotes:**

**SiteInfo:**

**Tab:**
An individual tab thumbnail

**Tabs:**
Tab controls

**TabPage:**
An individual tab page.

**TabPages:**
Tab page indicators. There are 6 tabs at most per tab page.
This set of indicators shows you which page you are on and allows you to switch pages.

**TabsToolbar:**

**TabsToolbarButtons:**
Collection of Buttons for the tab bar.

**UpdateBar:**

**UrlBar:**
The URL bar part of the navigation bar.

**UrlBarSuggestions:**
The suggestions that come up from when a user types into the URL bar.

**WidevinePanel:**

**WindowButton:**
An individual button for window management such as close, maximize, minimize.

