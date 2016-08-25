# Changelog

## [0.11.6](https://github.com/brave/browser-laptop/releases/v0.11.6dev)
 - Added Ledger beta integration. ([#3195](https://github.com/brave/browser-laptop/issues/3195))
 - Added about:history, sets back/forward nav limit, more efficient dynamic menus. ([#3206](https://github.com/brave/browser-laptop/issues/3206))
 - Added history and Ctrl +Y to bring it up suggestion. ([#444](https://github.com/brave/browser-laptop/issues/444))
 - Changed Hamburger Menu with layout mentioned in #1893. ([#3003](https://github.com/brave/browser-laptop/issues/3003))
 - Changed new tab button too high. ([#3208](https://github.com/brave/browser-laptop/issues/3208))
 - Changed Back button history does not hint at options beyond a certain point. ([#2889](https://github.com/brave/browser-laptop/issues/2889))
 - Changed Temporarily remove insertions. ([#3211](https://github.com/brave/browser-laptop/issues/3211))
 - Fixed Address bar input ignored if no default search engine set. ([#3254](https://github.com/brave/browser-laptop/issues/3254))
 - Fixed default engine display problem for fresh profile. ([#3275](https://github.com/brave/browser-laptop/issues/3275))
 - Fixed Payments Add Funds modal is misaligned. ([#3267](https://github.com/brave/browser-laptop/issues/3267))
 - Fixed Payments monthly budget dropdown is missing units. ([#3266](https://github.com/brave/browser-laptop/issues/3266))
 - Fixed many things in History. ([#3253](https://github.com/brave/browser-laptop/issues/3253))
 - Fixed URL bar autocomplete mouseover does not interfere with typed URL (fixes #3012) (take 2). ([#3225](https://github.com/brave/browser-laptop/issues/3225))
 - Fixed Autofill on URL bar. ([#3012](https://github.com/brave/browser-laptop/issues/3012))
 - Fixed new tab button position fixes #3208. ([#3213](https://github.com/brave/browser-laptop/issues/3213))
 - Fixed Back/Forward navigation, tab shows page URL instead of page title. ([#3200](https://github.com/brave/browser-laptop/issues/3200))
 - Fixed tab title on back/forward fixes #3200. ([#3202](https://github.com/brave/browser-laptop/issues/3202))
 - Fixed Bookmarks Menu should list the bookmarks like other browsers do enhancement. ([#1993](https://github.com/brave/browser-laptop/issues/1993))
 - Fixed "auto open bookmarks toolbar for the first bookmark" test needs to be udpated. ([#2941](https://github.com/brave/browser-laptop/issues/2941))
 - Fixed "Pinning with partitions" test is failing but the functionality works. ([#2942](https://github.com/brave/browser-laptop/issues/2942))
 - Fixed Application icon is with poor resolution on Linux. ([#3229](https://github.com/brave/browser-laptop/issues/3229))
 - Fixed Change the size of the Linux icon fixes #3229. ([#3230](https://github.com/brave/browser-laptop/issues/3230))
 - Fixed Users can create bookmark folders with no name. ([#3188](https://github.com/brave/browser-laptop/issues/3188))
 - Fixed Validate bookmark name before creation Fixes #3188. ([#3190](https://github.com/brave/browser-laptop/issues/3190))
 - Fixed etags for data file downloading haven't been working. ([#3222](https://github.com/brave/browser-laptop/issues/3222))
 - Fixed Make targets.host UNIQUE, which auto-creates index. ([#3215](https://github.com/brave/browser-laptop/issues/3215))
 - Fixed Use noScript state per site instead of blocking scripts. ([#3205](https://github.com/brave/browser-laptop/issues/3205))
 - Fixed Non-script version of DuckDuckGo when blocking scripts is not loaded from location bar at first instance. ([#3189](https://github.com/brave/browser-laptop/issues/3189))
 - Fixed Market graph on wsj.com. ([#2102](https://github.com/brave/browser-laptop/issues/2102))
 - Fixed tab-specific notifications should be closed when tab is closed. ([#3169](https://github.com/brave/browser-laptop/issues/3169))
 - Fixed Brave can't handle URLs with whitespace in it. ([#3167](https://github.com/brave/browser-laptop/issues/3167))
 - Fixed Whitespace in url fixes #3167. ([#3168](https://github.com/brave/browser-laptop/issues/3168))
 - Fixed Flash on http://www.y8.com/games/superfighters. ([#3082](https://github.com/brave/browser-laptop/issues/3082))
 - Fixed Bookmarks now show under Bookmarks menu. ([#3055](https://github.com/brave/browser-laptop/issues/3055))
 - Fixed Menu should only be built once. ([#3022](https://github.com/brave/browser-laptop/issues/3022))
 - Update to https everywere 5.2.0. ([#2581](https://github.com/brave/browser-laptop/issues/2581))

## [0.11.5](https://github.com/brave/browser-laptop/releases/v0.11.5dev)
- Fixed a top crasher. ([#3054](https://github.com/brave/browser-laptop/issues/3054))
- Fixed parts of the UI that was not getting translated for different locales. ([#2638](https://github.com/brave/browser-laptop/issues/2638))
- Fixed URL bar sometimes clearing if you type very fast when a new tab is opened. ([#2812](https://github.com/brave/browser-laptop/issues/2812))
- Fixed the possibility to have a blank tab set when closing a tab under some cases ([#3092](https://github.com/brave/browser-laptop/issues/3092))
- Fixed DuckDuckGo URL to use the NoScript version when NoScript is on. ([#3118](https://github.com/brave/browser-laptop/issues/3118))
- Fixed cloned tabs ordering, it will now appear next to the original one ([#2779](https://github.com/brave/browser-laptop/issues/2779))
- Fixed needing to press Esc two times to clear typing. ([#3088](https://github.com/brave/browser-laptop/issues/3088))
- Fixed Flash click to play on Google docs. ([#3090](https://github.com/brave/browser-laptop/issues/3090))
- Fixed restart notification in the preferences page so it doesn't show if you toggle a pref on / off. ([#2958](https://github.com/brave/browser-laptop/issues/2958))

## [0.11.4](https://github.com/brave/browser-laptop/releases/v0.11.4dev)
- Added a clear browsing data now button in preferences and popup panel with clearing options. ([#2471](https://github.com/brave/browser-laptop/issues/2471))
- Added tab page previews. ([#1424](https://github.com/brave/browser-laptop/issues/1424))
- Changed Accept-Encoding to advertise it supports Brotli compression. ([#2890](https://github.com/brave/browser-laptop/issues/2890))
- Fixed printing on Windows. ([#1616](https://github.com/brave/browser-laptop/issues/1616))
- Fixed some memory leaks. ([#3030](https://github.com/brave/browser-laptop/issues/3030))
- Fixed Flash placeholder sometimes not showing. ([#3047](https://github.com/brave/browser-laptop/issues/3047))
- Fixed Spotify WebPlayer. ([#3011](https://github.com/brave/browser-laptop/issues/3011))
- Fixed a common Brave crasher. ([#1954](https://github.com/brave/browser-laptop/issues/1954))
- Fixed closing an inactive tab should not change the active tab. ([#2923](https://github.com/brave/browser-laptop/issues/2923))
- Fixed PDFJS error when clicking on a dropbox file. ([#3056](https://github.com/brave/browser-laptop/issues/3056))

## [0.11.3](https://github.com/brave/browser-laptop/releases/v0.11.3dev)
- Fix URL bar problem from no default search engine. ([#2956](https://github.com/brave/browser-laptop/issues/2956))
- Fix PDF downloading with File > Save Page as. ([#2954](https://github.com/brave/browser-laptop/issues/2954))
- Fix NoScript should not take effect when shields are down. ([#2950](https://github.com/brave/browser-laptop/issues/2950))
- Fix undefined error popup caused by zoomed page upgrading. ([#2989](https://github.com/brave/browser-laptop/issues/2989))
- Upgrade to libchromiumcontent 52.0.2743.116. ([#2964](https://github.com/brave/browser-laptop/issues/2964))

## [0.11.2](https://github.com/brave/browser-laptop/releases/v0.11.2dev)
- Added history on long click over back and forward buttons. ([#1622](https://github.com/brave/browser-laptop/issues/1622))
- Added search panel to preferences with more search options. ([#2694](https://github.com/brave/browser-laptop/issues/2694))
- Added search shortcuts (Example: "yt cat videos" in the URL bar to search for cat videos on YouTube). ([#2694](https://github.com/brave/browser-laptop/issues/2694))
- Added a search box to the Bookmarks page (about:bookmarks) ([#995](https://github.com/brave/browser-laptop/issues/995))
- Added context menu for cloning a tab including back-forward history. ([#2593](https://github.com/brave/browser-laptop/pull/2593))
- Added support for forking navigation via `CmdOrCtrl+Click` on back, forward or reload buttons. ([#2753](https://github.com/brave/browser-laptop/issues/2753))
- Added optional Shift for zoom in shortcut. ([#2685](https://github.com/brave/browser-laptop/issues/2685))
- Added Run `<noscript>` tag when noscript is active. ([#2671](https://github.com/brave/browser-laptop/issues/2671))
- Added smoother animations. ([#2765](https://github.com/brave/browser-laptop/issues/2765))
- Added Bravery top level menu. ([#2669](https://github.com/brave/browser-laptop/issues/2669))
- Added restart dialog for prefs that require restart. ([#2543](https://github.com/brave/browser-laptop/issues/2543))
- Added search image on context menu if default engine is google. ([#2606](https://github.com/brave/browser-laptop/issues/2606))
- Added a way to view SSL certificates when there is an error. ([#1057](https://github.com/brave/browser-laptop/issues/1057))
- Security (Severity: High): Address Bar Spoofing security. ([#2723](https://github.com/brave/browser-laptop/issues/2723))
- Security (Severity: High): Re-enable mixed content blocking. ([#2887](https://github.com/brave/browser-laptop/issues/2887))
- Optimized React rendering and IPC when typing in the URL bar. ([#2736](https://github.com/brave/browser-laptop/issues/2736))
- Changed tab-specific notifications to only be shown on the active tab. ([#1928](https://github.com/brave/browser-laptop/issues/1928))
- Changed bookmarks bar to auto opens on first bookmark if no bookmarks exist. ([#1487](https://github.com/brave/browser-laptop/issues/1487))
- Fixed auto logging out when clear cookies on shutdown option is on. ([#2620](https://github.com/brave/browser-laptop/issues/2620))
- Fixed basic auth not working on some pages. ([#1997](https://github.com/brave/browser-laptop/issues/1997))
- Fixed playing videos on drive.google.com. ([#2533](https://github.com/brave/browser-laptop/issues/2533))
- Fixed viewing s.codepen.io. ([#2665](https://github.com/brave/browser-laptop/issues/2665))
- Fixed running 2 instances of PDF.js at once. ([#2619](https://github.com/brave/browser-laptop/issues/2619))
- Fixed exiting fullscreen view when tab is closed. ([#2618](https://github.com/brave/browser-laptop/issues/2618))
- Fixed not hiding find bar for inter-page navigation. ([#323](https://github.com/brave/browser-laptop/issues/323))
- Fixed delete button handling in URL bar. ([#2647](https://github.com/brave/browser-laptop/issues/2647))
- Fixed some PDF files not showing. ([#2654](https://github.com/brave/browser-laptop/issues/2654))
- Fixed Notification bar for crashes not dismissing. ([#2617](https://github.com/brave/browser-laptop/issues/2617))
- Fixed "Open Image In New Tab" respecting private / session info. ([#2746](https://github.com/brave/browser-laptop/issues/2746))
- Fixed pressing down on URL bar now shows autosuggest. ([#2444](https://github.com/brave/browser-laptop/issues/2444))
- Fixed showing scrollbars in tabs bar in Arch linux. ([#2599](https://github.com/brave/browser-laptop/issues/2599))
- Upgrade to libchromiumcontent 52.0.2743.82. ([#1592](https://github.com/brave/browser-laptop/issues/1592))
- Upgrade to Electron 1.3.0. ([#2635](https://github.com/brave/browser-laptop/issues/2635))

## [0.11.1](https://github.com/brave/browser-laptop/releases/v0.11.1dev)
- Added built-in PDF reader with PDF.js. Can be disabled in preferences. ([#1084](https://github.com/brave/browser-laptop/issues/1084))
- Added more data clearing options, including on shutdown. ([#2472](https://github.com/brave/browser-laptop/issues/2472))
- Added support for navigator.registerProtocolHandler (Mostly used for gmail `mailto:` and `bitcoin:` handling). ([#1583](https://github.com/brave/browser-laptop/issues/1583))
- Added Copy Image to clipboard option through the context menu. ([#1174](https://github.com/brave/browser-laptop/issues/1174))
- Added a customized Windows 10 Start Menu tile. ([#2372](https://github.com/brave/browser-laptop/issues/2372))
- Added edit bookmark ability when staring a site. ([#2439](https://github.com/brave/browser-laptop/issues/2439))
- Added Lastpass preferences. ([#2411](https://github.com/brave/browser-laptop/pull/2411))
- Added `Command + Shift + Click` support for various UI elements to open and focus a new tab. ([#2436](https://github.com/brave/browser-laptop/issues/2436))
- Fixed Vimeo player not playing due to referrer blocking. ([#2474](https://github.com/brave/browser-laptop/issues/2474))
- Fixed crashes with notifications. ([#1931](https://github.com/brave/browser-laptop/issues/1931))
- Fixed new-tab ordering from pinned tabs. ([#2453](https://github.com/brave/browser-laptop/issues/2453))
- Fixed exiting full screen when closing a full screen tab. ([#2404](https://github.com/brave/browser-laptop/issues/2404))
- Fixed spell check happening in URLbar. ([#2434](https://github.com/brave/browser-laptop/issues/2434))
- Fixed webRTC fingerprinting blocking. ([#2412](https://github.com/brave/browser-laptop/issues/2412))
- Fixed find in page highlighting not clearing when find bar is closed. ([#2476](https://github.com/brave/browser-laptop/issues/2476))
- Fixed two finger swipe gesture on macOS conflicting with scrolling. ([#2577](https://github.com/brave/browser-laptop/issues/2577))
- Upgrade to Electron 1.2.7. ([#2470](https://github.com/brave/browser-laptop/issues/2470))

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
