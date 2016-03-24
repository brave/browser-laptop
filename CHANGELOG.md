# Changelog

## [0.8.3](https://github.com/brave/browser-laptop/releases/v0.8.3dev)
- Debian .deb packaging now provided.

## [0.8.2](https://github.com/brave/browser-laptop/releases/v0.8.2dev)
- Password saving feature added.
- Brave is now a single instance application.
- HTTPS Everywhere information is now displayed in the site information popup.
- Find in page now shows match ordinal.
- Open all bookmarks in bookmark folder context menu added.
- Improved bookmark import support (Safari, Pinboard).
- Fixes for full screen mode.
- Fixes for pinned sites not unpinning.
- Upgraded to libchromiumcontent 49.0.2623.87.
- Upgraded to Node v5.9.
- Various other bug fixes.

## [0.8.1](https://github.com/brave/browser-laptop/releases/v0.8.1dev)
- Upgrade to libchromiumcontent 49.0.2623.75.
- Upgrade to Electron v0.37.2.
- Upgrade to Node v5.8.
- Basic HTTP authentication now supported.
- Support for Twitch.tv
- Fix bookmarks not working after navigating within a page using push state api.
- Save session state periodically to prevent data loss.
- Window titles actually being set for better compatibility with other apps.
- We now show a broken lock icon for pages with certificate errors.
- Tweaked various UI bits.
- Fixed text cursor jumping to the end of a text input in the settings pane.
- Added import bookmarks item to the hamburger menu.
- Middle clicking on a bookmark folder now opens all bookmarks.
- Control tab, command tab, and middle click now works for bookmarks within a menu on the toolbar.
- Typekit and Google fonts fix.
- Dragging favicon onto bookmarks bar now respects position of the drop.
- We now `display: none` on background webviews for better performance.

## [0.8.0](https://github.com/brave/browser-laptop/releases/v0.8.0dev)
- Bookmark management: Bookmark folders added, drag and drop bookmarks and folders from within the Bookmark Toolbar and Bookmark Manager.
- Ability to import bookmarks from a Firefox or Chrome HTML export.
- History is now remembered for better autocomplete results.
- Permission dialogs added for sites wanting to request special permissions.
- Various shortcuts added for each platform.
- Support added for mouse back/forward web buttons.
- Window is now maximized when navigation bar is double clicked.
- Mouse middle clicking on bookmarks now opens the link in a new tab.
- Adblock and tracking protection fixed for non default sessions.
- Various cert warning page fixes.
- Don’t show context menu if a page has its own (Google docs).
- Added Home menu item and shortcut to go to home page.
- Added Clear history menu item.
- Help menu added to the hamburger menu.
- Various top level menu items now work when there are no windows open.
- Links opened from the context menu item “Open in new tab”  now retains private / session it was opened from.
- Extra protection against badly downloaded adblock, tracking protection, and https everywhere data files.
- Image blocking now replaces images with a 1px transparent local data url instead of blocking the request for better site compat (macworld.com).
- about: pages now have an icon so they can look better when pinned.
- Multiple update channel support added for future builds (beta, release channel support).
- Various other improvements and fixes.

## [0.7.16](https://github.com/brave/browser-laptop/releases/v0.7.16dev)
- Spotty text selection in URL bar fix.
- Added restore last closed window.
- Fix session store to restore state from last closed window.
- Pinned tabs and bookmarks are now session aware (Cmd+Click or Control+Click on Windows to open a bookmark in the original session).
- Fix video playing on CNBC, fix cityam.com adblocker error.
- Faster page loading from optimizations in HTTPS Everywhere.
- HTML drag and drop no longer opens extra tab.
- Dropping files on bookmarks bar to create bookmarks, and on toolbar to open in new tabs.
- Certificate error page improvements.
- Support dropping tabs onto tab set indicators to reorder them.
- Support pinning and unpinning sites via drag and drop.
- Fixed bug in auto suggest when hitting enter.
- Various Linux fixes.
- Fix 3rd party Facebook login.
- SQLite dependency for HTTPS Everywhere removed.

## [0.7.15](https://github.com/brave/browser-laptop/releases/v0.7.15dev)
- Added bookmarks toolbar.
- Added bookmarks manager (Very basic but more features coming soon).
- File picker crash fix.
- Optimizations when opening a new tab.
- Add certificate error pages and improve site security indicators.
- Various context menu, shortcut, and drag and drop improvements.
- Various bug fixes and improvements.

## [0.7.14](https://github.com/brave/browser-laptop/releases/v0.7.14dev)
- Security (Severity: High): Added process sandboxing for content processes ([c794907](https://github.com/brave/electron/commit/c794907d043ca5c498d1f07f5fdf6e866606ebaf)).
- Various UI rendering performance optimization.
- Fix loading videos on CNN and other page loading problems.
- Security (Severity: Low): Hostname is always displayed in title mode in bold.
- Security (Severity: High): Preferences page script context is now reloaded when navigating in the same tab away from preferences ([446dfe8](https://github.com/brave/browser-laptop/commit/446dfe8c1c39203e5f41f9bb6341a2103df1248c)).
- Theme color detection changes.
- Various bug fixes.

## [0.7.13](https://github.com/brave/browser-laptop/releases/v0.7.13dev)
- Preferences: startup mode, homepage, default search engine, various tab preferences, and privacy settings.  More to come.
- Various UI enhancements.
- Security: Third party cookie blocking option (enabled by default).
- Security: Third party HTTP Referer header blocking option (enabled by default).
- Security: Precautionary only, removed node from ever loading in web views.
- Security: Precautionary Added CSP to UI pages.
- Security: Secure sites now display a lock in title mode.
- Various keyboard shortcuts added, various focus issues fixed, various bugs fixed.
- Context menus copy link location works in more cases now.
- about:newtab, about:about pages implemented.
- Placeholder ads link to a page explaining what they are.
- 2 finger navigation on OS X.
- Cleaned up UI to remove unneeded elements for about: pages.

## [0.7.12](https://github.com/brave/browser-laptop/releases/v0.7.12dev)
- Various crash fixes and window.opener fixes.
- Fix for state saving when an update is applied.
- Fix for update error handling when on a flaky connection.
- Visual indicator for Session Tabs added.
- Installers and updates reduced by ~40%.
- Windows taskbar grouping fix.
- Initial window size is now bigger.
- Various keyboard shortcuts added.
- HTTPS Everywhere fixes.

## [0.7.11](https://github.com/brave/browser-laptop/releases/v0.7.11dev)

- Security fix (Severity: High): Prevent BrowserWindow from navigating to remote content ([#445](https://github.com/brave/browser-laptop/issues/445)). Impact: if the user is tricked into dragging and dropping a malicious link outside of the tab content area, the linked site is loaded outside the webview sandbox and can compromise the user's system.
- Dropped URLs now open tabs instead of opening inside the whole window.
- Fixed a tracking protection problem causing some top level sites to not load.
- Bravery menu options are now easier to understand.
- Context menus re-ordered by importance.
- Various Windows shortcuts added.
- Mouse middle click on a tab now closes the tab.
- About menu dialog now works in Windows.
- Release notes viewer will allow mouse activity for copy/pasting.

## [0.7.10](https://github.com/brave/browser-laptop/releases/v0.7.10dev)

- Added the hamburger menu (top right menu).
- Fixed Windows packaging issues.
- Fixed issues with rendering on some Windows systems causing a black window.

## [0.7.9](https://github.com/brave/browser-laptop/releases/v0.7.9dev)

- UI tweaks.
- Fixed bug in adblock causing some sites not to work.
- Per window session state is now preserved.
- Left / right arrow navigation shortcuts.
- Privacy: Browser level web requests loaded into a segmented in memory only partition.

## [0.7.8](https://github.com/brave/browser-laptop/releases/v0.7.8dev)

- New lighter themed UI.
- Partitioned tabs support for multiple sessions per user.
- Security: Sandbox inserted / replaced iframe.
- More context menu options for copy, cut, paste, and copy link.
- Background tabs now actually open in the background.
- Further adblock optimizations.
- Conditionally shows prev / next tab buttons.
- Checking for updates with no windows open opens a new window.
- Closing a pin attempts now goes to next tab.
- Find in page result count indicator.
- Show security icon while HTTP/HTTPS page loads.
- Various bug fixes.

## [0.7.7](https://github.com/brave/browser-laptop/releases/v0.7.7dev)

- Fixed load time indicator and Windows menus
