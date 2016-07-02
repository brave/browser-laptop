# Changelog

## [0.11.0](https://github.com/brave/browser-laptop/releases/v0.11.0dev)
- Added LastPass support. ([#2316](https://github.com/brave/browser-laptop/issues/2316))
- Added WebRTC fingerprinting protection. ([#260](https://github.com/brave/browser-laptop/issues/260))
- Added Flash Click to Play support (Flash is only available after enabling Flash in preferences explicitly). ([#2279](https://github.com/brave/browser-laptop/issues/2279))
- Added lookup selection to context menu for macOS. ([#1627](https://github.com/brave/browser-laptop/issues/1627))
- Changed pin tab option to not show for `about:blank` and `about:newtab`. ([#2253](https://github.com/brave/browser-laptop/issues/2253))
- Changed user agent for Adobe Flash website Brave detection. ([811e742](https://github.com/brave/browser-laptop/commit/811e742b4bdb393cc9dc092d9d61af2bb879a047))
- Fixed 1password auto-start. ([#2298](https://github.com/brave/browser-laptop/issues/2298))
- Fixed 1password auto-fill regression. ([#2308](https://github.com/brave/browser-laptop/issues/2308))
- Fixed session tabs 1password bug. ([#2303](https://github.com/brave/browser-laptop/issues/2303))
- Fixed downloads bar overflow. ([#2322](https://github.com/brave/browser-laptop/issues/2322))
- Fixed selection menu to truncate properly. ([#2240](https://github.com/brave/browser-laptop/issues/2240))
- Fixed cookie changes not persisting to disk on fast shutdown. ([#2335](https://github.com/brave/browser-laptop/issues/2335))

## [0.10.4](https://github.com/brave/browser-laptop/releases/v0.10.4dev)
- Added autocomplete support in the URL bar. ([#1596](https://github.com/brave/browser-laptop/issues/1596))
- Added blocking for 3rd party client storage mechanisms. ([#313](https://github.com/brave/browser-laptop/issues/313))
- Added blocking for 3rd party referrers. ([#2214](https://github.com/brave/browser-laptop/issues/2214))
- Added default content zoom option. ([#1401](https://github.com/brave/browser-laptop/issues/1401))
- Added option for disabling title mode (defaulted to on for Windows until we remove the title bar). ([#1984](https://github.com/brave/browser-laptop/issues/1984))
- Added experimental Flash support (disabled by default). ([#1093](https://github.com/brave/browser-laptop/issues/1093))
- Improved URL bar suggestions and now include URL of suggestion. ([#2210](https://github.com/brave/browser-laptop/issues/2210))
- Improved Bookmarks Manager folders so they stick when scrolling. ([#2076](https://github.com/brave/browser-laptop/issues/2076))
- Improved session storage saving to write in a more safe way. ([#2067](https://github.com/brave/browser-laptop/issues/2067))
- Improved zoom handling. ([#2165](https://github.com/brave/browser-laptop/issues/2165))
- Fixed Twitch.tv playing streams twice. ([#2119](https://github.com/brave/browser-laptop/issues/2119))
- Fixed crash when navigating with the notification bar open. ([#1726](https://github.com/brave/browser-laptop/issues/1726))
- Fixed tab page ordering with pinned tabs. ([#149](https://github.com/brave/browser-laptop/issues/149))
- Fixed window state not saving in session storage. ([#146](https://github.com/brave/browser-laptop/issues/146))
- Fixed navigator.doNotTrack not reporting correctly. ([#2177](https://github.com/brave/browser-laptop/issues/2177))
- Fixed window titles not showing up in the Window menu in macOS. ([#2192](https://github.com/brave/browser-laptop/issues/2192))
- Fixed navigation controller sometimes making back button not function correctly. ([#2144](https://github.com/brave/browser-laptop/issues/2144))
- Fixed Fullscreen mode on Windows so it hides menu bar. ([#2053](https://github.com/brave/browser-laptop/issues/2053))
- Upgrade to libchromiumcontent 51.0.2704.103. ([#2211](https://github.com/brave/browser-laptop/issues/2211))
- Upgrade to Electron 1.2.3. ([#2294](https://github.com/brave/browser-laptop/issues/2294))

## [0.10.3](https://github.com/brave/browser-laptop/releases/v0.10.3dev)
- Upgrade to libchromiumcontent 51.0.2704.84. ([#2122](https://github.com/brave/browser-laptop/issues/2122))

## [0.10.2](https://github.com/brave/browser-laptop/releases/v0.10.2dev)
- Fixed crash on Windows when clicking on certain link types. ([#2064](https://github.com/brave/browser-laptop/issues/2064))

## [0.10.1](https://github.com/brave/browser-laptop/releases/v0.10.1dev)
- Included fingerprinting protection into the Bravery Panel. ([#1876](https://github.com/brave/browser-laptop/issues/1876))
- Added protection for AudioContext fingerprinting. ([#1884](https://github.com/brave/browser-laptop/issues/1884))
- Added number of scripts blocked to the Bravery panel. ([#1833](https://github.com/brave/browser-laptop/issues/1833))
- Added support for bookmarklets. ([#1880](https://github.com/brave/browser-laptop/issues/1880))
- Added show only favicon option to the bookmarks toolbar. ([#1657](https://github.com/brave/browser-laptop/issues/1657))
- Added bookmark tooltips. ([#1848](https://github.com/brave/browser-laptop/issues/1848))
- Added folder icons when using bookmark toolbar favicons. ([#1469](https://github.com/brave/browser-laptop/issues/1469))
- Added application icon in Ubuntu. ([#1282](https://github.com/brave/browser-laptop/issues/1282))
- Expose chrome.runtime for better site compat mainly for Google drive. ([#1948](https://github.com/brave/browser-laptop/pull/1948))
- Fixed processes sometimes not quitting. ([#1756](https://github.com/brave/browser-laptop/issues/1756))
- Fixed Windows taskbar grouping. ([#156](https://github.com/brave/browser-laptop/issues/156))
- Fixed whitescreen which could happen when dragging and dropping. ([#1891](https://github.com/brave/browser-laptop/issues/1891))
- Fixed bookmark items middle click to open in a new tab on Windows 10. ([#1724](https://github.com/brave/browser-laptop/issues/1724))
- Fixed redownloading files on session restore ([#1219](https://github.com/brave/browser-laptop/issues/1219))
- Fixed pinned tabs sometimes duplicating. ([#1508](https://github.com/brave/browser-laptop/issues/1508))
- Fixed Fullscreen mode showing a black bar up top on macOS. ([#1358](https://github.com/brave/browser-laptop/issues/1358))
- Fixed contractions showing up as misspelled for spell check. ([#2015](https://github.com/brave/browser-laptop/issues/2015))
- Fixed non-English spell checking dictionaries. ([#1788](https://github.com/brave/browser-laptop/issues/1788))
- Possibly fixed intermittent problem with copy on macOS. ([#1060](https://github.com/brave/browser-laptop/issues/1060))
- Upgrade to HTTPS Everywhere definitions for 5.1.9. ([#1692](https://github.com/brave/browser-laptop/issues/1692))
- Upgrade to libchromiumcontent 51.0.2704.63. ([#1405](https://github.com/brave/browser-laptop/issues/1405))
- Upgrade to Electron 1.2.0. ([#1968](https://github.com/brave/browser-laptop/issues/1968))
- Upgrade to Node 6.1. ([#1969](https://github.com/brave/browser-laptop/issues/1969))
- [Various other fixes.](https://github.com/brave/browser-laptop/milestones/0.10.1dev)

## [0.10.0](https://github.com/brave/browser-laptop/releases/v0.10.0dev)
- Per site Bravery panel and per site settings. ([#1621](https://github.com/brave/browser-laptop/issues/1621))
- Bravery setting defaults now in preferences. ([#1818](https://github.com/brave/browser-laptop/issues/1818))
- Implemented error pages. ([#1611](https://github.com/brave/browser-laptop/issues/1611))
- Lazy load tabs on startup. ([#470](https://github.com/brave/browser-laptop/issues/470))
- Added search for selected text context menu. ([#1672](https://github.com/brave/browser-laptop/pull/1672))
- Fixed various crashes. ([#1611](https://github.com/brave/browser-laptop/issues/1611), [#1772](https://github.com/brave/browser-laptop/issues/1772))
- Fixed zoom not working in some cases. ([#1717](https://github.com/brave/browser-laptop/issues/1717))
- Re-added close tabs left / right context menu on tabs. ([#1783](https://github.com/brave/browser-laptop/issues/1783))
- Updated localization files and added Spanish and Tamil. ([#1828](https://github.com/brave/browser-laptop/pull/1828))
- [Various other fixes.](https://github.com/brave/browser-laptop/issues?q=milestone%3A0.10.0dev+is%3Aclosed)

## [0.9.6](https://github.com/brave/browser-laptop/releases/v0.9.6dev)
- Upgrade to libchromiumcontent 50.0.2661.102. ([#1708](https://github.com/brave/browser-laptop/issues/1708))
- Fix application sometimes not quitting fully. ([#1540](https://github.com/brave/browser-laptop/issues/1540))
- Fix for URL bar context menu selection detection. ([#1709](https://github.com/brave/browser-laptop/issues/1709))
- Fix for disabling extensions without a browser restart. ([#1707](https://github.com/brave/browser-laptop/issues/1707))
- Fix zoom indicator in hamburger menu in private tabs. ([#1706](https://github.com/brave/browser-laptop/issues/1706))
- Menu bar is now auto hidden by default unless turned on. ([#1730](https://github.com/brave/browser-laptop/issues/1730))

## [0.9.5](https://github.com/brave/browser-laptop/releases/v0.9.5dev)
- Added spell check. ([#859](https://github.com/brave/browser-laptop/issues/859))
- Added NoScript like script blocking. ([#231](https://github.com/brave/browser-laptop/issues/231))
- Added support for many more languages. ([#1625](https://github.com/brave/browser-laptop/pull/1625))
- Various windows installer fixes. ([#523](https://github.com/brave/browser-laptop/pull/523), [#1244](https://github.com/brave/browser-laptop/pull/1244), [#1400](https://github.com/brave/browser-laptop/pull/1400), [#565](https://github.com/brave/browser-laptop/pull/565))
- Added Paste and Go and Paste and Search items in the URL bar context menu. ([#1670](https://github.com/brave/browser-laptop/pull/1670))
- Added ability to autohide menu bar on Windows. ([#1630](https://github.com/brave/browser-laptop/pull/1630))
- Fix for nfl.com videos when blocking was enabled. ([#1528](https://github.com/brave/browser-laptop/issues/1528))
- Fix bookmarks not filling up the complete bookmarks toolbar. ([#1567](https://github.com/brave/browser-laptop/issues/1567))
- Fix crash when navigating while dev tools are open. ([#1588](https://github.com/brave/browser-laptop/issues/1588))
- Fix for "tabnapping" phishing attempt. ([#1618](https://github.com/brave/browser-laptop/issues/1618))
- Fix unneeded indent in Windows for navigation controls. ([#1638](https://github.com/brave/browser-laptop/pull/1638))
- Fix for using numpad '+' for zoom. ([#1495](https://github.com/brave/browser-laptop/issues/1495))
- Fix for changing tabs per page giving an uneven distribution of tabs. ([#1561](https://github.com/brave/browser-laptop/issues/1561))
- Fix for opening and copying image context menus sometimes not giving the full URL. ([#1606](https://github.com/brave/browser-laptop/issues/1606))

## [0.9.4](https://github.com/brave/browser-laptop/releases/v0.9.4dev)
- Fixed startup problem if user data directory does not already exist.

## [0.9.3](https://github.com/brave/browser-laptop/releases/v0.9.3dev)
- Dashlane support bundled.
- Added permission handler for external protocols.
- Permission prompts now save decisions between restarts.
- Bookmark Toolbar favicons (can be turned on in about:preferences).
- Downloads remember last save location.
- More zoom fixes for page navigation.
- More password autofill fixes.
- More locales added.
- Added optional Home button.
- Fixed various bugs.
- Upgrade to libchromiumcontent 50.0.2661.94.
- Upgrade to Electron 0.37.7.

## [0.9.2](https://github.com/brave/browser-laptop/releases/v0.9.2dev)
- Added the ability to set Brave as the default browser within Control Panel on Windows.
- Added 32-bit Windows support.
- Added ability to block HTML canvas and WebGL fingerprinting which can be enabled in preferences.
- Zoom is now persisted across sessions and remembered per origin.
- Added menu item to clear all cookies and site data.
- Multi language support.  Initially this includes: en-US, nl-NL, and pt-Br.
- Ability to open html files when Brave is the default on macOS.
- Block 'javascript:' URLs from being loaded when entered in URL bar.
- Printing fixed.
- Fixed various bugs.
- Upgrade to libchromiumcontent 49.0.2623.112.
- Upgrade to Electron 0.37.6.

## [0.9.1](https://github.com/brave/browser-laptop/releases/v0.9.1dev)
- Undo closed tab now focuses the webview.
- Upgrade to React v15 for cleaner DOM and faster performance.
- Fix for about: pages font size.
- Fix for clicking on some JavaScript links not working.
- Fix startup error relating to session storage and passwords saved from forms without actions.
- Fix docusign.com login button not working.
- Fix for Twitch.tv.
- Fix for startup problem with default window size.

## [0.9.0](https://github.com/brave/browser-laptop/releases/v0.9.0dev)
- 1Password support bundled.
- Added malware and phishing protection with click through pages.
- Some downloads bar and password saving fixes.
- Windows installer now using SHA-256 digest and gets signed with a timestamp.
- New look for the SSL cert warning pages.
- Removed Brave from the User Agent HTTP header to reduce fingerprinting.
- Windows shortcuts added F12 for developer tools and F11 for fullscreen.
- Partial extensions support added internally for running some Chrome extensions unmodified.
- Upgrade to Node 5.10.0.

## [0.8.3](https://github.com/brave/browser-laptop/releases/v0.8.3dev)
- Add ability to enable/disable password manager in Preferences
- Added downloads toolbar which shows when there are active downloads.
- Added downloads manager (about:downloads).
- Added passwords manager (about:passwords).
- Inspect Element context menu option added to bring up the DOM inspector.
- Mouse wheel zooming with modifier key.
- Close other tabs context menu items added.
- Password saving fixes.
- Bookmark fixes.
- Upgrade to libchromiumcontent 49.0.2623.108.
- Upgrade to Electron 0.37.3.
- Upgrade to Node 5.9.1.
- Fixed various bugs.
- .deb and .rpm [Linux packages available](https://github.com/brave/browser-laptop/blob/master/docs/linuxInstall.md) for various distros.

## [0.8.2](https://github.com/brave/browser-laptop/releases/v0.8.2dev)
- Password saving feature added.
- Brave is now a single instance application.
- HTTPS Everywhere information is now displayed in the site information popup.
- Find in page now shows match ordinal.
- Open all bookmarks in bookmark folder context menu added.
- Improved bookmark import support (Safari, Pinboard).
- Fixes for fullscreen mode.
- Fixes for pinned sites not unpinning.
- Upgraded to libchromiumcontent 49.0.2623.87.
- Upgraded to Node v5.9.
- Various other bug fixes.

## [0.8.1](https://github.com/brave/browser-laptop/releases/v0.8.1dev)
- Upgrade to libchromiumcontent 49.0.2623.75.
- Upgrade to Electron 0.37.2.
- Upgrade to Node 5.8.
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
- 2 finger navigation on macOS.
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
