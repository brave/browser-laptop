# Changelog

Release Notes:
## [0.19.131](https://github.com/brave/browser-laptop/releases/tag/v0.19.131dev)

 - Added the ability to enable strict site isolation. ([#12490](https://github.com/brave/browser-laptop/issues/12490))
 - Added additional BAT contribution amounts. ([#12234](https://github.com/brave/browser-laptop/issues/12234))
 - Changed default contribution for new installs to 10 BAT. ([#12528](https://github.com/brave/browser-laptop/issues/12528))
 - Improved security by disabling password autofill during page loads. ([#12489](https://github.com/brave/browser-laptop/issues/12489))
 - Fixed issue with initial 2000 grants during last BAT promotion. ([#12547](https://github.com/brave/browser-laptop/issues/12547))
 - Fixed muted media not being autoplayed. ([#12152](https://github.com/brave/browser-laptop/issues/12152))
 - Fixed autoplay blocking user initialized media. ([#12149](https://github.com/brave/browser-laptop/issues/12149))
 - Fixed music not being played on several popular services. ([#11527](https://github.com/brave/browser-laptop/issues/11527))
 - Fixed notification bar buttons not responding in certain cases. ([#9171](https://github.com/brave/browser-laptop/issues/9171))
 - Fixed autoplay notifications not being dismissed when user ignores notification and continues stream. ([#9143](https://github.com/brave/browser-laptop/issues/9143))
 - Fixed sites being added into the autoplay permission list when default permission is set as "always allow". ([#9008](https://github.com/brave/browser-laptop/issues/9008))
 - Fixed autoplay notifications being displayed for local files. ([#8929](https://github.com/brave/browser-laptop/issues/8929))
 - Upgraded muon to 4.5.36. ([#12501](https://github.com/brave/browser-laptop/issues/12501))
 - Upgraded to Chromium 63.0.3239.132. ([#12521](https://github.com/brave/browser-laptop/issues/12521))

## [0.19.123](https://github.com/brave/browser-laptop/releases/tag/v0.19.123dev)

 - Fixed vulnerability in WebTorrent ([#12400](https://github.com/brave/browser-laptop/issues/12400))

## [0.19.122](https://github.com/brave/browser-laptop/releases/tag/v0.19.122dev)

 - Fixed DuckDuckGo referral code for private search. ([#12347](https://github.com/brave/browser-laptop/issues/12347))

## [0.19.121](https://github.com/brave/browser-laptop/releases/tag/v0.19.121dev)

 - Upgraded muon to 4.5.31. ([#12206](https://github.com/brave/browser-laptop/issues/12206))
 - Upgraded Chromium to 63.0.3239.108. ([#11890](https://github.com/brave/browser-laptop/issues/11890))

## [0.19.116](https://github.com/brave/browser-laptop/releases/tag/v0.19.116dev)

 - Added the ability to use DuckDuckGo as a separate default search engine for private tabs. ([#11305](https://github.com/brave/browser-laptop/issues/11305))
 - Fixed a problem with the restore a backup wallet screen. ([#12254](https://github.com/brave/browser-laptop/issues/12254))
 - Fixed notification not appearing after a contribution is made. ([#12201](https://github.com/brave/browser-laptop/issues/12201))
 - Fixed promotion banners need a line break between text. ([#12145](https://github.com/brave/browser-laptop/issues/12145))
 - Fixed add funds dialog appears even if user already has BAT. ([#12078](https://github.com/brave/browser-laptop/issues/12078))
 - Fixed records for recent contributions not being displayed. ([#12055](https://github.com/brave/browser-laptop/issues/12055))

## [0.19.105](https://github.com/brave/browser-laptop/releases/tag/v0.19.105dev)

 - Fixed USD conversion for wallet balance always shows 1.00. ([#12054](https://github.com/brave/browser-laptop/issues/12054))
 - Fixed time spent calculations when minimum page time set to 1min. ([#11997](https://github.com/brave/browser-laptop/issues/11997))
 - Fixed incorrect values being displayed under contribution notification. ([#11989](https://github.com/brave/browser-laptop/issues/11989))
 - Fixed white flash on new tab page before content loads. ([#5309](https://github.com/brave/browser-laptop/issues/5309))
 - Fixed white flash after tab open or close. ([#11813](https://github.com/brave/browser-laptop/issues/11813))
 - Optimized fingerprint tracking by blocking additional methods. ([#10288](https://github.com/brave/browser-laptop/issues/10288))
 - Optimized blocking technique to avoid hard errors on page that expect blocked functionality. ([#10285](https://github.com/brave/browser-laptop/issues/10285))

## [0.19.95](https://github.com/brave/browser-laptop/releases/tag/v0.19.95dev)

 - Added the ability to pay YouTube publishers with BAT. ([#11851](https://github.com/brave/browser-laptop/issues/11851))
 - Added Terms of Service link for Brave Payments under the payments panel. ([#11942](https://github.com/brave/browser-laptop/issues/11942))
 - Fixed broken FAQ link under preferences. ([#11946](https://github.com/brave/browser-laptop/issues/11946))
 - Fixed several other 0.18.x to 0.19.x transition issues. ([#11936](https://github.com/brave/browser-laptop/issues/11936))
 - Fixed tab indexing issue when closing tabs. ([#11902](https://github.com/brave/browser-laptop/issues/11902))
 - Fixed closing tabs not always leaving preview mode when multiple tab pages are present. ([#11632](https://github.com/brave/browser-laptop/issues/11632))
 - Upgraded Muon to 4.5.16. ([#11971](https://github.com/brave/browser-laptop/issues/11971))
 - Upgraded to Chromium 62.0.3202.94. ([#11971](https://github.com/brave/browser-laptop/issues/11971))

## [0.19.88](https://github.com/brave/browser-laptop/releases/tag/v0.19.88dev)

 - Fixed ctrl-shift-tab keyboard navigation. ([#11331](https://github.com/brave/browser-laptop/issues/11331))
 - Fixed navigating tabs via keyboard shortcuts doesn't switch tab page. ([#11884](https://github.com/brave/browser-laptop/issues/11884))
 - Fixed spell check not being disabled when no language is set. ([#11739](https://github.com/brave/browser-laptop/issues/11739))
 - Fixed ledger notification not appearing above the tab area. ([#11256](https://github.com/brave/browser-laptop/issues/11256))
 - Fixed incorrect USD value being shown momentarily post wallet conversion. ([#11746](https://github.com/brave/browser-laptop/issues/11746))
 - Fixed Uncaught exception ledgerClient is not a function while transition from 0.18.x to 0.19.x. ([#11703](https://github.com/brave/browser-laptop/issues/11703))
 - Fixed errors when toggling payments several times and leaving disabled. ([#11684](https://github.com/brave/browser-laptop/issues/11684))
 - Fixed addresses & QR codes not always being displayed when creating wallet. ([#11589](https://github.com/brave/browser-laptop/issues/11589))
 - Fixed several bad state scenarios for the ledger. ([#11566](https://github.com/brave/browser-laptop/issues/11566))
 - Upgraded to muon 4.5.15. ([#11850](https://github.com/brave/browser-laptop/issues/11850))
 - Upgraded to Chromium 62.0.3202.89. ([#11827](https://github.com/brave/browser-laptop/issues/11827))

## [0.19.80](https://github.com/brave/browser-laptop/releases/tag/v0.19.80dev)

 - Added spell check and the ability to select multiple languages. ([#2183](https://github.com/brave/browser-laptop/issues/2183))
 - Fixed contribution amounts not being updated during the BTC => BAT conversion. ([#11719](https://github.com/brave/browser-laptop/issues/11719))
 - Fixed websockets connection issues. ([#11716](https://github.com/brave/browser-laptop/issues/11716))
 - Fixed unable to highlight sync words for copying. ([#11641](https://github.com/brave/browser-laptop/issues/11641))
 - Fixed error: ENOENT: no such file or directory, access ledger-synopsis.json. ([#11674](https://github.com/brave/browser-laptop/issues/11674))
 - Fixed error: Seed must be Uint8Array. when toggling payment on/off during wallet transition. ([#11673](https://github.com/brave/browser-laptop/issues/11673))
 - Fixed error: ENOENT: no such file or directory, access ledger-newstate.json while upgrading. ([#11669](https://github.com/brave/browser-laptop/issues/11669))
 - Fixed publisher not added if revisit happens. ([#11633](https://github.com/brave/browser-laptop/issues/11633))
 - Fixed button wrap on about:preferences#payments (l10n). ([#11580](https://github.com/brave/browser-laptop/issues/11580))
 - Fixed PDF printing for contribution statements on Windows. ([#11471](https://github.com/brave/browser-laptop/issues/11471))
 - Moved brave/ad-block and brave/tracking-protection deps to muon. ([#11352](https://github.com/brave/browser-laptop/issues/11352))
 - Upgraded to muon 4.5.x. ([#11712](https://github.com/brave/browser-laptop/issues/11712))
 - Upgraded to Chromium 62.0.3202.75. ([#11711](https://github.com/brave/browser-laptop/issues/11711))

## [0.19.70](https://github.com/brave/browser-laptop/releases/tag/v0.19.70dev)

 - Fixed ledger time is not displayed correctly. ([#11675](https://github.com/brave/browser-laptop/issues/11675))
 - Fixed publishers lost if upgrading from 0.18 with wallet disabled. ([#11614](https://github.com/brave/browser-laptop/issues/11614))
 - Fixed removing "update to preview release" in preparation for channel builds. ([#11638](https://github.com/brave/browser-laptop/issues/11638))
 - Fixed extension page opens with each browser launch. ([#11578](https://github.com/brave/browser-laptop/issues/11578))
 - Fixed publishers auto-included even with auto-include switch disabled. ([#11553](https://github.com/brave/browser-laptop/issues/11553))
 - Fixed sometimes a site is not added to publisher list. ([#11274](https://github.com/brave/browser-laptop/issues/11274))
 - Fixed ledger table doesn't auto populate the publishers. ([#11273](https://github.com/brave/browser-laptop/issues/11273))
 - Fixed MetaMask contentscript is injected on about pages when it should not be. ([#11596](https://github.com/brave/browser-laptop/issues/11596))
 - Upgraded to muon 4.5.9. ([#11498](https://github.com/brave/browser-laptop/issues/11498))
 - Upgraded to Chromium 62.0.3202.62. ([#11139](https://github.com/brave/browser-laptop/issues/11139))

## [0.19.53](https://github.com/brave/browser-laptop/releases/tag/v0.19.53dev)

 - Added support for MetaMask. ([#8671](https://github.com/brave/browser-laptop/issues/8671))
 - Added detection of visiting a Dapp to prompt to install MetaMask. ([#11532](https://github.com/brave/browser-laptop/issues/11532))
 - Fixed QR codes not being displayed when creating a new wallet. ([#11492](https://github.com/brave/browser-laptop/issues/11492))
 - Fixed transition overlay displayed when wallet was created in previous version. ([#11506](https://github.com/brave/browser-laptop/issues/11506))
 - Fixed chance of losing wallet on BAT upgrade. ([#11494](https://github.com/brave/browser-laptop/issues/11494))
 - Fixed additional footer text causes button misalignment. ([#11489](https://github.com/brave/browser-laptop/issues/11489))
 - Upgraded to muon 4.4.29. ([#11543](https://github.com/brave/browser-laptop/issues/11543))

## [0.19.48](https://github.com/brave/browser-laptop/releases/tag/v0.19.48dev)

 - Added BAT payments. ([#10945](https://github.com/brave/browser-laptop/issues/10945))
 - Added new add-funds wizard UI to support BAT. ([#11193](https://github.com/brave/browser-laptop/issues/11193))
 - Added notification after Brave app update for BAT Mercury. ([#11021](https://github.com/brave/browser-laptop/issues/11021))
 - Added BAT integration to welcome screens. ([#11242](https://github.com/brave/browser-laptop/issues/11242))
 - Added import passwords from Chrome. ([#9434](https://github.com/brave/browser-laptop/issues/9434))
 - Added import passwords from Firefox. ([#9292](https://github.com/brave/browser-laptop/issues/9292))
 - Added Bitwarden Password Manager. ([#4776](https://github.com/brave/browser-laptop/issues/4776))
 - Added ability to set default browser on Ubuntu. ([#1336](https://github.com/brave/browser-laptop/issues/1336))
 - Added maps.google.com to top site list for suggestions. ([#11181](https://github.com/brave/browser-laptop/issues/11181))
 - Added Swedish (Sweden) language. ([#10297](https://github.com/brave/browser-laptop/issues/10297))
 - Optimized bookmarks toolbar causing jank when browsing. ([#10009](https://github.com/brave/browser-laptop/issues/10009))
 - Optimized window initialization data to use shared memory. ([#10018](https://github.com/brave/browser-laptop/issues/10018))
 - Optimized saving state to use shared memory. ([#10292](https://github.com/brave/browser-laptop/issues/10292))
 - Optimized AppStore to check for differences before generating a state diff. ([#10195](https://github.com/brave/browser-laptop/issues/10195))
 - Optimizations for ledger by refactoring. ([#11009](https://github.com/brave/browser-laptop/issues/11009))
 - Changed ad block to do more checks for same origin URLs. ([#11004](https://github.com/brave/browser-laptop/issues/11004))
 - Changed ad block data files block coin miners by default with Brave shields up. ([#10994](https://github.com/brave/browser-laptop/issues/10994))
 - Changed about:brave to use better names for channels. ([#10239](https://github.com/brave/browser-laptop/issues/10239))
 - Changed reload context menu to native context menu. ([#9571](https://github.com/brave/browser-laptop/issues/9571))
 - Fixed clipboard copy (cmd+c / ctrl+c) doesn't always work. ([#10563](https://github.com/brave/browser-laptop/issues/10563))
 - Fixed URL suggestions for simple domain names sometimes don't appear up top. ([#11057](https://github.com/brave/browser-laptop/issues/11057))
 - Fixed dragging from URL bar to create bookmark on toolbar doesn't respect position. ([#11177](https://github.com/brave/browser-laptop/issues/11177))
 - Fixed Command+L when in URL bar with URL bar suggestion should select full URL. ([#9914](https://github.com/brave/browser-laptop/issues/9914))
 - Fixed Brave freezes when opening tabs while a window is loading. ([#10866](https://github.com/brave/browser-laptop/issues/10866))
 - Fixed history entries cannot be deleted. ([#8761](https://github.com/brave/browser-laptop/issues/8761))
 - Fixed downloading from Google Drive appears to become stuck. ([#9810](https://github.com/brave/browser-laptop/issues/9810))
 - Fixed Moving tabs sometimes doesn't respect the correct position. ([#10961](https://github.com/brave/browser-laptop/issues/10961))
 - Fixed Facebook Messenger error -- cannot Send Image/File. ([#698](https://github.com/brave/browser-laptop/issues/698))
 - Fixed sites shows up with 0 views in payments. ([#10036](https://github.com/brave/browser-laptop/issues/10036))
 - Fixed sites visited before payment enabling is shown as 0 views. ([#9980](https://github.com/brave/browser-laptop/issues/9980))
 - Fixed publisher entry jumps position when enabled/disabled. ([#10716](https://github.com/brave/browser-laptop/issues/10716))
 - Fixed close tabs to the left/right (tab page). ([#9789](https://github.com/brave/browser-laptop/issues/9789))
 - Fixed close tab page is not working. ([#9420](https://github.com/brave/browser-laptop/issues/9420))
 - Fixed theme color for find bar. ([#9758](https://github.com/brave/browser-laptop/issues/9758))
 - Fixed imported bookmarks don't show up in about:bookmark. ([#9716](https://github.com/brave/browser-laptop/issues/9716))
 - Fixed editing a bookmark (or folder) can lock up the browser. ([#9674](https://github.com/brave/browser-laptop/issues/9674))
 - Fixed Netflix/Widevine notification banner does not go away. ([#11054](https://github.com/brave/browser-laptop/issues/11054))
 - Fixed [hackerone] https://hackerone.com/reports/258578. ([#10573](https://github.com/brave/browser-laptop/issues/10573))
 - Fixed [hackerone] homepage homograph attack. ([#11001](https://github.com/brave/browser-laptop/issues/11001))
 - Fixed webview crash can make webview take over full UI. ([#8574](https://github.com/brave/browser-laptop/issues/8574))
 - Fixed devtool via context menu cannot be displayed. ([#10249](https://github.com/brave/browser-laptop/issues/10249))
 - Fixed Autoplay block shouldn't weigh in once users start playing media. ([#8897](https://github.com/brave/browser-laptop/issues/8897)) - Fixed able to view certificate even after the URL is removed. ([#9172](https://github.com/brave/browser-laptop/issues/9172))
 - Fixed find bar lose focus if tab is opened in a background. ([#8877](https://github.com/brave/browser-laptop/issues/8877))
 - Fixed suggestion race condition can lead to undefined. ([#11467](https://github.com/brave/browser-laptop/issues/11467))
 - Fixed add bookmark from toolbar/right click context menu brings up "edit bookmark" modal. ([#5508](https://github.com/brave/browser-laptop/issues/5508))
 - Fixed mailto: notifications display "null" rather than the domain when opening in new tabs. ([#4198](https://github.com/brave/browser-laptop/issues/4198))
 - Fixed changing bookmark folder in the add bookmark modal changes it to bookmark added. ([#5314](https://github.com/brave/browser-laptop/issues/5314))
 - Fixed double click in addressbar maximizes/restores the window instead of selecting the address. ([#4922](https://github.com/brave/browser-laptop/issues/4922))
 - Fixed bookmark toolbar is not hidden if you disable it. ([#10828](https://github.com/brave/browser-laptop/issues/10828))
 - Fixed un/lock icon is not displayed for PDF file. ([#9162](https://github.com/brave/browser-laptop/issues/9162))
 - Fixed bookmark cannot be deleted from the panel if location is changed. ([#4978](https://github.com/brave/browser-laptop/issues/4978))
 - Fixed prevent Tab Close button from allowing tab-tearoff. ([#9511](https://github.com/brave/browser-laptop/issues/9511))
 - Fixed favicon and clearing site cache enhancement. ([#11161](https://github.com/brave/browser-laptop/issues/11161))
 - Fixed ActivateIfOpen doesn't activate if open. ([#9964](https://github.com/brave/browser-laptop/issues/9964))
 - Upgraded to Chromium 61.0.3163.100. ([#11052](https://github.com/brave/browser-laptop/issues/11052))
 - Upgraded to muon 4.4.28. ([#10847](https://github.com/brave/browser-laptop/issues/10847))
 - Upgraded to HTTPS Everywhere 5.2.19. ([#9649](https://github.com/brave/browser-laptop/issues/9649))

## [0.18.36](https://github.com/brave/browser-laptop/releases/tag/v0.18.36dev)

 - Added support for MacBook trackpad pinch to zoom gesture. ([#1364](https://github.com/brave/browser-laptop/issues/1364))
 - Fixed issues with opening some PDFs. ([#10867](https://github.com/brave/browser-laptop/issues/10867))
 - Fixed UI unresponsiveness when sometimes pressing "cmd/ctrl + w". ([#9083](https://github.com/brave/browser-laptop/issues/9083))
 - Fixed second click not deselecting text and placing the cursor in between the URL text for some DPIs on Windows. ([#8472](https://github.com/brave/browser-laptop/issues/8472))
 - Fixed blocking rules not limited to private tabs. ([#10829](https://github.com/brave/browser-laptop/issues/10829))
 - Fixed spell check corrected word still retaining the red underline. ([#9324](https://github.com/brave/browser-laptop/issues/9324))
 - Upgraded to muon 4.3.22. ([#10834](https://github.com/brave/browser-laptop/issues/10834))
 - Upgraded to Chromium 61.0.3163.79. ([#10718](https://github.com/brave/browser-laptop/issues/10718))

## [0.18.29](https://github.com/brave/browser-laptop/releases/tag/v0.18.29dev)
 - Optimized page load time to reduce jank. ([#9987](https://github.com/brave/browser-laptop/issues/9987))
 - Fixed Netflix player by adding VMP support. ([#10449](https://github.com/brave/browser-laptop/issues/10449))
 - Fixed white tab displayed if 'last viewed tab' isn't available. ([#10645](https://github.com/brave/browser-laptop/issues/10645))
 - Fixed tombstone tabs and tabs refreshing themselves. ([#10561](https://github.com/brave/browser-laptop/issues/10561))
 - Fixed focus is always set to first tab, Page view not shown for single tab. ([#10532](https://github.com/brave/browser-laptop/issues/10532))
 - Fixed Brave UI becomes unresponsive. ([#10436](https://github.com/brave/browser-laptop/issues/10436))
 - Fixed about: pages are not always being populated. ([#10384](https://github.com/brave/browser-laptop/issues/10384))
 - Fixed bookmark cannot be moved to bookmark folder on bookmark toolbar. ([#10101](https://github.com/brave/browser-laptop/issues/10101))
 - Fixed toolbar and UI elements scale control. ([#10089](https://github.com/brave/browser-laptop/issues/10089))
 - Fixed active tab closing selecting the wrong next index. ([#10038](https://github.com/brave/browser-laptop/issues/10038))
 - Fixed error while closing tab pages: `Could not find tab for <id>`. ([#9722](https://github.com/brave/browser-laptop/issues/9722))
 - Fixed tear off last tab to window causes original windows last tab to be shown in white. ([#9671](https://github.com/brave/browser-laptop/issues/9671))
 - Fixed unable to switch tabs sometimes. ([#9385](https://github.com/brave/browser-laptop/issues/9385))
 - Fixed HTTP referrer not being blocked. ([#10721](https://github.com/brave/browser-laptop/issues/10721))
 - Upgraded to muon 4.3.16. ([#10730](https://github.com/brave/browser-laptop/issues/10730))
 - Upgraded to Chromium 60.0.3112.113. ([#10799](https://github.com/brave/browser-laptop/issues/10799))

## [0.18.23](https://github.com/brave/browser-laptop/releases/tag/v0.18.23dev)
 - Fixed spell check not working on Disqus comment boxes. ([#10040](https://github.com/brave/browser-laptop/issues/10040))
 - Fixed findbar slowness (cmd + F, typing). ([#10271](https://github.com/brave/browser-laptop/issues/10271))
 - Fixed issue where pinned tab can't be really unpinned. ([#10241](https://github.com/brave/browser-laptop/issues/10241))
 - Fixed pinned tab will not display. ([#10122](https://github.com/brave/browser-laptop/issues/10122))
 - Fixed cursor not shown when editing a bookmark. ([#10104](https://github.com/brave/browser-laptop/issues/10104))
 - Fixed short term video freezes. ([#9808](https://github.com/brave/browser-laptop/issues/9808))
 - Fixed browser freezes per 5 minutes with existing profile. ([#10094](https://github.com/brave/browser-laptop/issues/10094))
 - Fixed tab previews: stick to changing properties that can be handled by the compositor alone. ([#10291](https://github.com/brave/browser-laptop/issues/10291))
 - Fixed when the main process crashes, window state is lost. ([#10349](https://github.com/brave/browser-laptop/issues/10349))
 - Fixed Linux rpm is not signed. ([#10188](https://github.com/brave/browser-laptop/issues/10188))
 - Fixed minimizing the browser window leaves the tooltip open. ([#8697](https://github.com/brave/browser-laptop/issues/8697))
 - Fixed extension popup menu items dismissed on click. ([#10130](https://github.com/brave/browser-laptop/issues/10130))
 - Fixed extension popup not showing. ([#10224](https://github.com/brave/browser-laptop/issues/10224))
 - Fixed about favicons are taking up way too much space in the session store. ([#10000](https://github.com/brave/browser-laptop/issues/10000))
 - Fixed js/lib/urlutil.js for safer url parsing. ([#6098](https://github.com/brave/browser-laptop/issues/6098))
 - Upgraded to muon 4.3.10. ([#10262](https://github.com/brave/browser-laptop/issues/10262))
 - Upgraded to Chromium 60.0.3112.90. ([#10261](https://github.com/brave/browser-laptop/issues/10261))

## [0.18.14](https://github.com/brave/browser-laptop/releases/tag/v0.18.14dev)
 - Added a welcome screen for first time users. ([#9423](https://github.com/brave/browser-laptop/issues/9423))
 - Added Chromium spell checker (in place of Electron spell checker). ([#9880](https://github.com/brave/browser-laptop/issues/9880))
 - Added an option to disable "Top Sites" in autocomplete. ([#4977](https://github.com/brave/browser-laptop/issues/4977))
 - Added "Hide Lower" button on Brave Payments. ([#9137](https://github.com/brave/browser-laptop/issues/9137))
 - Optimized sending messages only to needed windows instead of all windows. ([#9701](https://github.com/brave/browser-laptop/issues/9701))
 - Fixed showing the URL in the location bar for invalid URLs (instead of about:error). ([#2025](https://github.com/brave/browser-laptop/issues/2025))
 - Fixed clicking inside of an extension popup dismisses it. ([#10029](https://github.com/brave/browser-laptop/issues/10029))
 - Fixed LastPass won't stop asking for 2FA code. ([#9259](https://github.com/brave/browser-laptop/issues/9259))
 - Fixed Session restore can lead to lost windows if there is a hung or slow Window on shutdown. ([#9806](https://github.com/brave/browser-laptop/issues/9806))
 - Fixed losing tabs when updating. ([#9805](https://github.com/brave/browser-laptop/issues/9805))
 - Fixed Toolbar and UI Elements scale control should prompt for restart. ([#10132](https://github.com/brave/browser-laptop/issues/10132))
 - Fixed an issue with closing the last frame via keyboard. ([#9948](https://github.com/brave/browser-laptop/issues/9948))
 - Fixed unable to add site to Pocket. ([#9669](https://github.com/brave/browser-laptop/issues/9669))
 - Fixed URL bar icon disappears when video starts playing. ([#9652](https://github.com/brave/browser-laptop/issues/9652))
 - Fixed URL bar titlemode appends colon to the end of the hostname. ([#9503](https://github.com/brave/browser-laptop/issues/9503))
 - Fixed individual bookmarks not synced from laptop after Payments are switched off. ([#9684](https://github.com/brave/browser-laptop/issues/9684))
 - Fixed Sync records are sent twice. ([#9404](https://github.com/brave/browser-laptop/issues/9404))
 - Fixed Sync input fields should have focus when clicked. ([#9175](https://github.com/brave/browser-laptop/issues/9175))
 - Fixed "Allow this time" on NoScript dialog keeps allowing scripts even after reopening the tab. ([#9150](https://github.com/brave/browser-laptop/issues/9150))
 - Fixed extension tabs not auto closing when finished. ([#9132](https://github.com/brave/browser-laptop/issues/9132))
 - Fixed Pocket and LastPass home page loads after logging into account. ([#9117](https://github.com/brave/browser-laptop/issues/9117))
 - Fixed TLD of long domain display in title tooltip on bravery panel. ([#9089](https://github.com/brave/browser-laptop/issues/9089))
 - Fixed about:brave information display for Windows. ([#8933](https://github.com/brave/browser-laptop/issues/8933))
 - Fixed bookmarks in Other Bookmarks folder from being synced to the bookmark toolbar. ([#8024](https://github.com/brave/browser-laptop/issues/8024))
 - Fixed adding a bookmarks folder makes the browser unresponsive in Sync. ([#9745](https://github.com/brave/browser-laptop/issues/9745))
 - Fixed bookmark deletion may lead to duplicated bookmarks in Sync. ([#9724](https://github.com/brave/browser-laptop/issues/9724))
 - Fixed blank tabs bar when increasing the number of tabs per tab set. ([#7806](https://github.com/brave/browser-laptop/issues/7806))
 - Updated to Chromium 60.0.3112.78. ([#9947](https://github.com/brave/browser-laptop/issues/9947))
 - Updated Extension: 1Password 4.6.7.90. ([#9946](https://github.com/brave/browser-laptop/issues/9946))
 - Updated to Muon 4.3.6. ([#9856](https://github.com/brave/browser-laptop/issues/9856))


## [0.17.19](https://github.com/brave/browser-laptop/releases/tag/v0.17.19dev)
 - Optimized getTopsites to speed up URL bar suggestions. ([#10004](https://github.com/brave/browser-laptop/issues/10004))
 - Optimized check for updates. ([#9996](https://github.com/brave/browser-laptop/issues/9996))
 - Optimized window initialization data to use shared memory. ([#10018](https://github.com/brave/browser-laptop/issues/10018))
 - Optimized shared memory IPC to transfer history & bookmarks. ([#10024](https://github.com/brave/browser-laptop/issues/10024))
 - Added Whitelist DuckDuckGo for Brave UA. ([#10020](https://github.com/brave/browser-laptop/issues/10020))
 - Fixed tab display after a tabpage closes. ([#9922](https://github.com/brave/browser-laptop/issues/9922))
 - Fixed history list shows unnecessary duplicates for same-page actions (like google maps). ([#3848](https://github.com/brave/browser-laptop/issues/3848))
 - Fixed : Security : WebTorrent: Torrent server should be restricted to same origin. ([#10012](https://github.com/brave/browser-laptop/issues/10012))
 - Update to Muon 4.1.9. ([#10064](https://github.com/brave/browser-laptop/issues/10064))

## [0.17.16](https://github.com/brave/browser-laptop/releases/tag/v0.17.16dev)
- Added pause and resume of pending sync uploads. ([#125](https://github.com/brave/sync/issues/125))
- Added support for Debian stretch. ([#7508](https://github.com/brave/browser-laptop/issues/7508))
- Fixed URL bar error causing the need for a browser restart. ([#9891](https://github.com/brave/browser-laptop/issues/9891))
- Fixed some URL bar UX issues by disabling title mode by default on Windows. ([#9903](https://github.com/brave/browser-laptop/issues/9903))
- Fixed syncing bookmark folders between laptop and Android. ([#100](https://github.com/brave/sync/issues/100), [#107](https://github.com/brave/sync/issues/107))
- Fixed Ecosia search favicon not shown. ([#9823](https://github.com/brave/browser-laptop/issues/9823))
- Upgrade Muon to 4.1.8. ([#9906](https://github.com/brave/browser-laptop/issues/9906))
- Upgrade Chromium to 59.0.3071.115. ([#9905](https://github.com/brave/browser-laptop/issues/9905))

## [0.17.13](https://github.com/brave/browser-laptop/releases/tag/v0.17.13dev)
- Added Honey extension. ([#8118](https://github.com/brave/browser-laptop/issues/8118))
- Added compact bravery panel option. ([#8954](https://github.com/brave/browser-laptop/issues/8954))
- Added wide URL bar option. ([#8421](https://github.com/brave/browser-laptop/issues/8421))
- Added support for Linux Mint - Serena. ([#9590](https://github.com/brave/browser-laptop/issues/9590))
- Added a new "Welcome" screen. ([#7821](https://github.com/brave/browser-laptop/issues/7821))
- Fixed saving a document doesn't show correct origin. ([#8698](https://github.com/brave/browser-laptop/issues/8698))
- Fixed CSP referrer errors. ([#8920](https://github.com/brave/browser-laptop/issues/8920))
- Fixed NoScript approvals from private tabs apply to regular tabs. ([#8779](https://github.com/brave/browser-laptop/issues/8779))
- Fixed incorrect hostname shown in titlemode when host is very long. ([#9500](https://github.com/brave/browser-laptop/issues/9500))
- Fixed Brave Browser very slow to open or close tabs. ([#4848](https://github.com/brave/browser-laptop/issues/4848))
- Fixed 50-80ms delay when closing a tab. ([#7395](https://github.com/brave/browser-laptop/issues/7395))
- Fixed browser performance reduces when large amount of bookmarks are imported. ([#7240](https://github.com/brave/browser-laptop/issues/7240))
- Fixed slow navigation after importing a lot of bookmarks. ([#9427](https://github.com/brave/browser-laptop/issues/9427))
- Fixed importing bookmarks after sync causes loss of hierarchy. ([#8892](https://github.com/brave/browser-laptop/issues/8892))
- Fixed import data gets duplicated after sync. ([#8508](https://github.com/brave/browser-laptop/issues/8508))
- Fixed CSS for visited links ( A:Visited ). ([#512](https://github.com/brave/browser-laptop/issues/512))
- Fixed download leaves about:blank page loading. ([#9620](https://github.com/brave/browser-laptop/issues/9620))
- Fixed middle click is not working on Home button. ([#9562](https://github.com/brave/browser-laptop/issues/9562))
- Fixed closing the only tab in second tabset showing the wrong number of tabs. ([#9561](https://github.com/brave/browser-laptop/issues/9561))
- Fixed switching tabs while reloading windows from last time . ([#9502](https://github.com/brave/browser-laptop/issues/9502))
- Fixed middle click on pinned tab causes all opened tabs to show as pinned tabs. ([#9492](https://github.com/brave/browser-laptop/issues/9492))
- Fixed tab title isn't hidden for session tabs after the tab threshold is reached. ([#9466](https://github.com/brave/browser-laptop/issues/9466))
- Fixed "Select its parent tab" setting not working as expected. ([#9395](https://github.com/brave/browser-laptop/issues/9395))
- Fixed closing tabs results in white page. ([#9306](https://github.com/brave/browser-laptop/issues/9306))
- Fixed bookmark title is not selected automatically. ([#9091](https://github.com/brave/browser-laptop/issues/9091))
- Fixed improve RPM packaging. ([#9074](https://github.com/brave/browser-laptop/issues/9074))
- Fixed button not disabled on add new bookmark modal by default. ([#9019](https://github.com/brave/browser-laptop/issues/9019))
- Fixed show all button overlaps on ledger table entry. ([#8869](https://github.com/brave/browser-laptop/issues/8869))
- Fixed pinned tab notification doesn't have the caret and shown across all tabs. ([#8626](https://github.com/brave/browser-laptop/issues/8626))
- Fixed viewing HBO GO video. ([#8581](https://github.com/brave/browser-laptop/issues/8581))
- Fixed Allow notification bar choices. ([#8826](https://github.com/brave/browser-laptop/issues/8826))
- Fixed tab preview on hover. ([#7606](https://github.com/brave/browser-laptop/issues/7606))
- Fixed right clicking tab being previewed causes focus to change. ([#7327](https://github.com/brave/browser-laptop/issues/7327))
- Fixed clicking on disabled Ad/Tracker count enables the `<li>` element under braveryPanelBody. ([#7026](https://github.com/brave/browser-laptop/issues/7026))
- Fixed autofill form option blinks and cannot be clicked. ([#5438](https://github.com/brave/browser-laptop/issues/5438))
- Fixed build hangs in tmux on macOS. ([#8916](https://github.com/brave/browser-laptop/issues/8916))
- Upgrade Muon to 4.1.7. ([#9645](https://github.com/brave/browser-laptop/issues/9645))
- Upgrade Chromium to 59.0.3071.109. ([#9626](https://github.com/brave/browser-laptop/issues/9626))

## [0.16.9](https://github.com/brave/browser-laptop/releases/tag/v0.16.9dev)
- Fixed crash on login or other input. ([#9369](https://github.com/brave/browser-laptop/issues/9369))
- Fixed ability to scroll down to latest bookmark. ([#9055](https://github.com/brave/browser-laptop/issues/9055))

## [0.16.5](https://github.com/brave/browser-laptop/releases/v0.16.5dev)
 - Added various performance improvements. ([#9342](https://github.com/brave/browser-laptop/issues/9342))
 - Disabled the “Fund with debit/credit card” button in preparation for new funding method. ([#9327](https://github.com/brave/browser-laptop/issues/9327))
 - Fixed custom bookmark titles not being searched for suggestions. ([#9249](https://github.com/brave/browser-laptop/issues/9249))
 - Fixed pause is not working correctly for downloads. ([#9244](https://github.com/brave/browser-laptop/issues/9244))
 - Fixed pinned tab showing blank white page when relaunching the browser. ([#9134](https://github.com/brave/browser-laptop/issues/9134))
 - Fixed view log shows console errors when checking for update. ([#9122](https://github.com/brave/browser-laptop/issues/9122))
 - Fixed cannot move bookmarks/folders to other folders in Bookmark Manager. ([#9101](https://github.com/brave/browser-laptop/issues/9101))
 - Fixed bookmarks manager scrolling on drag and drop into folders. ([#8946](https://github.com/brave/browser-laptop/issues/8946))
 - Fixed sync not tracking & merging changes in some cases. ([#8454](https://github.com/brave/browser-laptop/issues/8454))
 - Upgraded to Chromium 59.0.3071.86. ([#9012](https://github.com/brave/browser-laptop/issues/9012))
 - Upgraded to Muon 4.0.1. ([#9256](https://github.com/brave/browser-laptop/issues/9256))

## [0.15.314](https://github.com/brave/browser-laptop/releases/v0.15.314dev)
 - Fixed 'autocomplete search term' results are not filtering out 'http...' results. ([#9141](https://github.com/brave/browser-laptop/issues/9141))
 - Fixed WebView Not Visible in Popup Window. ([#9095](https://github.com/brave/browser-laptop/issues/9095))
 - Fixed password update new value is not saved in certain scenarios. ([#9028](https://github.com/brave/browser-laptop/issues/9028))
 - Upgraded to muon 3.0.202. ([#9156](https://github.com/brave/browser-laptop/issues/9156))

## [0.15.310](https://github.com/brave/browser-laptop/releases/v0.15.300dev)

 - Optimized various UI features for when user has large amounts of data. ([#9079](https://github.com/brave/browser-laptop/issues/9079))
 - Added new faster URL bar autocomplete and suggestions engine. ([#7453](https://github.com/brave/browser-laptop/issues/7453))
 - Added Chromium password manager autofill with browser autofill. ([#3530](https://github.com/brave/browser-laptop/issues/3530))
 - Added an option to block autoplay videos. ([#2227](https://github.com/brave/browser-laptop/issues/2227))
 - Added ability to zoom UI. (including font size). ([#1937](https://github.com/brave/browser-laptop/issues/1937))
 - Added a View Certificate option on mixed content sites. ([#8530](https://github.com/brave/browser-laptop/issues/8530))
 - Added send URL by email. ([#3121](https://github.com/brave/browser-laptop/issues/3121))
 - Added sharing to social media sites (Facebook, Twitter, etc.). ([#7555](https://github.com/brave/browser-laptop/issues/7555))
 - Added the ability to close developer tools via keyboard shortcut on macOS. ([#45](https://github.com/brave/browser-laptop/issues/45))
 - Added option to disable blocked count badge (on Lion). ([#8613](https://github.com/brave/browser-laptop/issues/8613))
 - Added ledger switch to disable contributions to non-verified sites (in advanced settings). ([#8231](https://github.com/brave/browser-laptop/issues/8231))
 - Added open link in new window option in the bookmarks toolbar. ([#8063](https://github.com/brave/browser-laptop/issues/8063))
 - Changed header style on about:preferences pages. ([#8165](https://github.com/brave/browser-laptop/issues/8165))
 - Changed font-size to be slightly bigger in the URL bar. ([#7848](https://github.com/brave/browser-laptop/issues/7848))
 - Fixed typing fast in URL bar after new tab gets partially cleared. ([#8959](https://github.com/brave/browser-laptop/issues/8959))
 - Fixed swipe back / forward on trackpads not working. ([#8627](https://github.com/brave/browser-laptop/issues/8627))
 - Fixed PDF reading for file:/// URLs. ([#2714](https://github.com/brave/browser-laptop/issues/2714))
 - Fixed "View page source" not working for file:/// URLs. ([#8049](https://github.com/brave/browser-laptop/issues/8049))
 - Fixed when maximized, hitboxes seem off for buttons and address bar on Windows. ([#7641](https://github.com/brave/browser-laptop/issues/7641))
 - Fixed pinned tabs lose order after re-launch. ([#8543](https://github.com/brave/browser-laptop/issues/8543))
 - Fixed pinned tabs can reappear next load after unpinning. ([#8477](https://github.com/brave/browser-laptop/issues/8477))
 - Fixed opening PDF via Wayback Machine archive.org loads different URL. ([#6726](https://github.com/brave/browser-laptop/issues/6726))
 - Fixed Ad-blocker-blocker on The Atlantic. ([#6291](https://github.com/brave/browser-laptop/issues/6291))
 - Fixed empty modal covers glennbeck.com. ([#8390](https://github.com/brave/browser-laptop/issues/8390))
 - Fixed "Select the last viewed tab" option. ([#8357](https://github.com/brave/browser-laptop/issues/8357))
 - Fixed fingerprinting Brave via extension resources. ([#8323](https://github.com/brave/browser-laptop/issues/8323))
 - Fixed clicking Save Torrent File button does not save .torrent file. ([#8146](https://github.com/brave/browser-laptop/issues/8146))
 - Fixed mouse cursor being visible while in full screen when viewing video. ([#7966](https://github.com/brave/browser-laptop/issues/7966))
 - Fixed WebGL antifingerprint. ([#8448](https://github.com/brave/browser-laptop/issues/8448))
 - Fixed maximizing browser extends into second monitor. ([#5159](https://github.com/brave/browser-laptop/issues/5159))
-  Fixed Brave wallet QR code is now localizable. ([#8663](https://github.com/brave/browser-laptop/issues/8663))
 - Fixed writing session to disk, ensure data is flushed. ([#7876](https://github.com/brave/browser-laptop/issues/7876))
 - Fixed writing ledger files to disk, ensure data is flushed. ([#8602](https://github.com/brave/browser-laptop/issues/8602))
 - Fixed custom filters block resource too strictly. ([#6883](https://github.com/brave/browser-laptop/issues/6883))
 - Fixed pressing tab should cycle through the URL bar suggestion results. ([#8919](https://github.com/brave/browser-laptop/issues/8919))
 - Fixed scrolling with alert boxes with lengthy content. ([#7930](https://github.com/brave/browser-laptop/issues/7930))
 - Fixed browser crash with payment enabled when clearing browsing data. ([#8659](https://github.com/brave/browser-laptop/issues/8659))
 - Fixed Faceblock: FB targeted tracking event assessment & protection. ([#7000](https://github.com/brave/browser-laptop/issues/7000))
 - Fixed pad lock is retained when URL text is cut from context menu. ([#8468](https://github.com/brave/browser-laptop/issues/8468))
 - Fixed new Session tab submenu goes off screen. ([#7748](https://github.com/brave/browser-laptop/issues/7748))
 - Fixed no progress indicator when reloading page. ([#8550](https://github.com/brave/browser-laptop/issues/8550))
 - Fixed Brave quits when New Tab command issued without window. ([#8575](https://github.com/brave/browser-laptop/issues/8575))
 - Fixed insecure connection info shown for about pages and new tab. ([#8299](https://github.com/brave/browser-laptop/issues/8299))
 - Upgraded to Chromium 58.0.3029.110. ([#8962](https://github.com/brave/browser-laptop/issues/8962))
 - Upgraded to muon 3.0.201. ([#8445](https://github.com/brave/browser-laptop/issues/8445))

## [0.15.2](https://github.com/brave/browser-laptop/releases/v0.15.2dev)
 - Update libchromiumcontent to 58.0.3029.96. ([#8638](https://github.com/brave/browser-laptop/issues/8638))
 - Upgraded to muon 2.58.9. ([#8660](https://github.com/brave/browser-laptop/issues/8660))

## [0.15.1](https://github.com/brave/browser-laptop/releases/v0.15.1dev)
 - Fixed navigating to a PDF may crash the tab. ([#8422](https://github.com/brave/browser-laptop/issues/8422))
 - Fixed crash on startup (possibly related to recovering tabs). ([#8552](https://github.com/brave/browser-laptop/issues/8552))
 - Fixed when Brave Payment is enabled, accessing Shield Settings on a blank page will crash the browser. ([#8545](https://github.com/brave/browser-laptop/issues/8545))
 - Fixed Webview crash on http://www.jewsnews.co.il/. ([#8526](https://github.com/brave/browser-laptop/issues/8526))
 - Fixed windowscentral.com crashes renderer on Windows 7. ([#6989](https://github.com/brave/browser-laptop/issues/6989))
 - Upgraded to muon 2.58.8. ([#8563](https://github.com/brave/browser-laptop/issues/8563))

## [0.15.0](https://github.com/brave/browser-laptop/releases/v0.15.0dev)
 - Added tear off tabs - Ability to tear off tabs and to combine them back into other windows. ([#4402](https://github.com/brave/browser-laptop/issues/4402))
 - Added Widevine support for Amazon Prime Video. ([#5233](https://github.com/brave/browser-laptop/issues/5233))
 - Added ledger site pinning in Brave Payments. ([#7347](https://github.com/brave/browser-laptop/issues/7347))
 - Added extensions panel to about:preferences. ([#6530](https://github.com/brave/browser-laptop/issues/6530))
 - Added support for back / forward gesture with three finger swipe. ([#7905](https://github.com/brave/browser-laptop/issues/7905))
 - Added support for torrent link files. ([#6671](https://github.com/brave/browser-laptop/issues/6671))
 - Added noscript into the URL bar. ([#5792](https://github.com/brave/browser-laptop/issues/5792))
 - Added "Extensions..." to window menu. ([#8203](https://github.com/brave/browser-laptop/issues/8203))
 - Added stop button for torrent downloads. ([#6768](https://github.com/brave/browser-laptop/issues/6768))
 - Added a link to release notes in about:brave. ([#6130](https://github.com/brave/browser-laptop/issues/6130))
 - Added context-menu option to close tabs in tab page. ([#5489](https://github.com/brave/browser-laptop/issues/5489))
 - Added extension badge colors. ([#5367](https://github.com/brave/browser-laptop/issues/5367))
 - Added text badges for extensions. ([#5366](https://github.com/brave/browser-laptop/issues/5366))
 - Added selection ability for torrent files. ([#8148](https://github.com/brave/browser-laptop/issues/8148))
 - Added temporary notice to sync prefs page regarding mobile sync and Beta label. ([#8121](https://github.com/brave/browser-laptop/issues/8121))
 - Added a new tab page for private tabs. ([#7934](https://github.com/brave/browser-laptop/issues/7934))
 - Added "Command+Click" to home button (opens home in a new background tab). ([#7718](https://github.com/brave/browser-laptop/issues/7718))
 - Added origin display for downloads, including if download was insecure (HTTP). ([#7468](https://github.com/brave/browser-laptop/issues/7468))
 - Changed about:preferences#extensions link to go to the extension request category in community. ([#8252](https://github.com/brave/browser-laptop/issues/8252))
 - Fixed default browser setting reset after upgrade on Windows. ([#5246](https://github.com/brave/browser-laptop/issues/5246))
 - Fixed Brave crash when visiting Brave Twitter page. ([#8004](https://github.com/brave/browser-laptop/issues/8004))
 - Fixed crash caused by certain pinned tabs. ([#7187](https://github.com/brave/browser-laptop/issues/7187))
 - Fixed opening PDF in new tab fails to load. ([#8364](https://github.com/brave/browser-laptop/issues/8364))
 - Fixed zoom shortcut (scroll and zoom feature). ([#8438](https://github.com/brave/browser-laptop/issues/8438))
 - Fixed bookmarks are re-synced (uploaded) on every load. ([#8408](https://github.com/brave/browser-laptop/issues/8408))
 - Fixed messages shown on extensions page. ([#8318](https://github.com/brave/browser-laptop/issues/8318))
 - Fixed extensions so they sort alphabetically. ([#8315](https://github.com/brave/browser-laptop/issues/8315))
 - Fixed homepage preference isn't being respected. ([#8278](https://github.com/brave/browser-laptop/issues/8278))
 - Fixed screen reader can't identify extension button. ([#8269](https://github.com/brave/browser-laptop/issues/8269))
 - Fixed tabs bar size by another 2px based on increased user feedback. ([#8263](https://github.com/brave/browser-laptop/issues/8263))
 - Fixed memory leak when opening then closing a lot of tabs rapidly. ([#8244](https://github.com/brave/browser-laptop/issues/8244))
 - Fixed about:brave copy to clipboard tooltip. ([#8199](https://github.com/brave/browser-laptop/issues/8199))
 - Fixed invisible pinned tab after upgrade. ([#8190](https://github.com/brave/browser-laptop/issues/8190))
 - Fixed URL bar shape consistency when payments are enabled/disabled. ([#8170](https://github.com/brave/browser-laptop/issues/8170))
 - Fixed creating a bookmark by dragging the Url bar icon. ([#8151](https://github.com/brave/browser-laptop/issues/8151))
 - Fixed image title. ([#8116](https://github.com/brave/browser-laptop/issues/8116))
 - Fixed readability issues with white tab text on dark tab background. ([#8115](https://github.com/brave/browser-laptop/issues/8115))
 - Fixed JavaScript in bookmarks cause connection info box to appear. ([#8087](https://github.com/brave/browser-laptop/issues/8087))
 - Fixed LastPass opening in the wrong position when activated by keyboard. ([#8034](https://github.com/brave/browser-laptop/issues/8034))
 - Fixed about pages cannot be synced because data is too big. ([#8023](https://github.com/brave/browser-laptop/issues/8023))
 - Fixed toggle excluding a site from ledger sometimes removes it from the list. ([#7987](https://github.com/brave/browser-laptop/issues/7987))
 - Fixed Sync does not appear to recover from network outage. ([#7972](https://github.com/brave/browser-laptop/issues/7972))
 - Fixed Sync losing hierarchy when adding bookmarks to new sync members. ([#7971](https://github.com/brave/browser-laptop/issues/7971))
 - Fixed localization ability for delete confirmation message. ([#7958](https://github.com/brave/browser-laptop/issues/7958))
 - Fixed default browser setting for Ubuntu. ([#7800](https://github.com/brave/browser-laptop/issues/7800))
 - Fixed dead tab when enter is pressed twice after typing in URL. ([#7727](https://github.com/brave/browser-laptop/issues/7727))
 - Fixed view source shortcut to be CTRL+U, not CTRL+ALT+U. ([#7702](https://github.com/brave/browser-laptop/issues/7702))
 - Fixed submenu position for bookmarks. ([#7662](https://github.com/brave/browser-laptop/issues/7662))
 - Fixed right click not dismissing / hiding an open menu. ([#7403](https://github.com/brave/browser-laptop/issues/7403))
 - Fixed display of favicons on brave payments list. ([#4178](https://github.com/brave/browser-laptop/issues/4178))
 - Fixed context menu subitems display when the window is small. ([#1589](https://github.com/brave/browser-laptop/issues/1589))
 - Fixed missing content links for info buttons in preferences. ([#5758](https://github.com/brave/browser-laptop/issues/5758))
 - Fixed dragging bookmark into a folder on bookmarks toolbar. ([#7019](https://github.com/brave/browser-laptop/issues/7019))
 - Fixed Spotify no longer playing music. ([#6881](https://github.com/brave/browser-laptop/issues/6881))
 - Removed old extensions settings area from advanced prefs panel. ([#8230](https://github.com/brave/browser-laptop/issues/8230))
 - Removed label from multimedia devices when fingerprinting protection is on. ([#7462](https://github.com/brave/browser-laptop/issues/7462))
 - Updated spinner animation on tab loads. ([#7779](https://github.com/brave/browser-laptop/issues/7779))
 - Updated 1Password description on extensions page. ([#8465](https://github.com/brave/browser-laptop/issues/8465))
 - Updated webtorrent description on extensions page. ([#8208](https://github.com/brave/browser-laptop/issues/8208))
 - Upgraded to Chromium 58.0.3029.81. ([#8353](https://github.com/brave/browser-laptop/issues/8353))
 - Upgraded to muon 2.58.7. ([#8161](https://github.com/brave/browser-laptop/issues/8161))
 - Upgraded to Node v7.9.0. ([#8483](https://github.com/brave/browser-laptop/issues/8483))

## [0.14.1](https://github.com/brave/browser-laptop/releases/v0.14.1dev)
 - Fixed paste not detected issue with context menus. ([#8000](https://github.com/brave/browser-laptop/issues/8000))
 - Fixed accidental selection of lion badge numbers. ([#7994](https://github.com/brave/browser-laptop/issues/7994))
 - Fixed Brave badge too close to edge. ([#7977](https://github.com/brave/browser-laptop/issues/7977))
 - Update muon to 2.57.8. ([#8014](https://github.com/brave/browser-laptop/issues/8014))

## [0.14.0](https://github.com/brave/browser-laptop/releases/v0.14.0dev)
- Added more details on secure connections, you can now view certificate from lock on URL bar. ([#6157](https://github.com/brave/browser-laptop/issues/6157))
- Added setting for more than 20 tabs per set. ([#6692](https://github.com/brave/browser-laptop/issues/6692))
- Added lion icon badge. ([#7859](https://github.com/brave/browser-laptop/issues/7859))
- Added "Block All" cookie option in bravery panel. ([#1987](https://github.com/brave/browser-laptop/issues/1987))
- Added session-tab icon numbers. ([#7367](https://github.com/brave/browser-laptop/issues/7367))
- Added ability to inspect extension background page. ([#7880](https://github.com/brave/browser-laptop/issues/7880))
- Added context menu to Bookmarks Manager. ([#7801](https://github.com/brave/browser-laptop/issues/7801))
- Added searx search engine. ([#7658](https://github.com/brave/browser-laptop/issues/7658))
- Added notification for Flash elements that are too small for the placeholder. ([#7523](https://github.com/brave/browser-laptop/issues/7523))
- Added new strings to handle overdue payments. ([#7078](https://github.com/brave/browser-laptop/issues/7078))
- Added "Save my downloads here" setting. ([#2110](https://github.com/brave/browser-laptop/issues/2110))
- Fixed blocking video ads on YouTube.com. ([#7432](https://github.com/brave/browser-laptop/issues/7432))
- Fixed UI for private tabs. ([#7943](https://github.com/brave/browser-laptop/issues/7943))
- Fixed issues with exclusion list for Brave payments. ([#7940](https://github.com/brave/browser-laptop/issues/7940))
- Fixed new tab for back/forward history. ([#7892](https://github.com/brave/browser-laptop/issues/7892))
- Fixed styles on notification & update bars. ([#7853](https://github.com/brave/browser-laptop/issues/7853))
- Fixed re-launching with a maximized window (When re-launching after maximized, window cannot be maximized again once restored down). ([#7825](https://github.com/brave/browser-laptop/issues/7825))
- Fixed YouTube.com layout when blocking ads. ([#7818](https://github.com/brave/browser-laptop/issues/7818))
- Fixed audio indicator has extra bottom padding compared to favicon. ([#7815](https://github.com/brave/browser-laptop/issues/7815))
- Fixed vertical center display of URL bar (Remove "top: 1px" from .urlbarForm>). ([#7805](https://github.com/brave/browser-laptop/issues/7805))
- Fixed display of text for new tabs. ([#7724](https://github.com/brave/browser-laptop/issues/7724))
- Fixed private session tab color to always show purple. ([#7720](https://github.com/brave/browser-laptop/issues/7720))
- Fixed display of session info on tab. ([#7716](https://github.com/brave/browser-laptop/issues/7716))
- Fixed contribution statement display. ([#7698](https://github.com/brave/browser-laptop/issues/7698))
- Fixed custom bookmark name text box not clearing when deleted. ([#7691](https://github.com/brave/browser-laptop/issues/7691))
- Fixed UI on alert dialogs (Replace float:right with flex). ([#7673](https://github.com/brave/browser-laptop/issues/7673))
- Fixed accidental muting when tabs are small. Sound controls will now be hidden when you have more than 15 tabs. ([#7665](https://github.com/brave/browser-laptop/issues/7665))
- Fixed re-launching when maximized to keep window maximized. ([#7664](https://github.com/brave/browser-laptop/issues/7664))
- Fixed favicon size when tabs are small. ([#7656](https://github.com/brave/browser-laptop/issues/7656))
- Fixed fresh install of Brave advertises Brave properties. ([#7655](https://github.com/brave/browser-laptop/issues/7655))
- Fixed remember password prompt accidentally displaying password in notification for certain sites. ([#7649](https://github.com/brave/browser-laptop/issues/7649))
- Fixed menu on Windows - context menu (right click) does not work on nested items. ([#7624](https://github.com/brave/browser-laptop/issues/7624))
- Fixed Alt+PrtSc key combination is not recognized by Brave. ([#7566](https://github.com/brave/browser-laptop/issues/7566))
- Fixed Flash discovery for sites if shields are down. ([#7549](https://github.com/brave/browser-laptop/issues/7549))
- Fixed closed order for tabs in History menu. ([#7548](https://github.com/brave/browser-laptop/issues/7548))
- Fixed header bar and tab styles (new flat interface look & feel). ([#7546](https://github.com/brave/browser-laptop/issues/7546))
- Fixed tab UI - fade tab on the right-hand side instead of using ellipsis. ([#7535](https://github.com/brave/browser-laptop/issues/7535))
- Fixed URL bar suggestions to show base domain along with deep linked history suggestions. ([#7533](https://github.com/brave/browser-laptop/issues/7533))
- Fixed 'hide sites with <1% usage' should be default on in about:preferences#payments. ([#7520](https://github.com/brave/browser-laptop/issues/7520))
- Fixed large translucent element which obscures Washington Post content. ([#7510](https://github.com/brave/browser-laptop/issues/7510))
- Fixed style and layout on payment tab. ([#7501](https://github.com/brave/browser-laptop/issues/7501))
- Fixed url loads slower if loaded from preferences. ([#7497](https://github.com/brave/browser-laptop/issues/7497))
- Fixed keyboard shortcuts not working on Windows. ([#7491](https://github.com/brave/browser-laptop/issues/7491))
- Fixed advance settings button is blocked by helpful hints in certain situations. ([#7452](https://github.com/brave/browser-laptop/issues/7452))
- Fixed publishers are auto included even when auto-include sites is turned off. ([#7451](https://github.com/brave/browser-laptop/issues/7451))
- Fixed display of Contribution Statement. ([#7416](https://github.com/brave/browser-laptop/issues/7416))
- Fixed new tab display when the window is small. ([#7411](https://github.com/brave/browser-laptop/issues/7411))
- Fixed re-enabling sync doesn't sync bookmarks properly across devices. ([#7405](https://github.com/brave/browser-laptop/issues/7405))
- Fixed style of some ledger elements. ([#7380](https://github.com/brave/browser-laptop/issues/7380))
- Fixed display of ledger items. ([#7379](https://github.com/brave/browser-laptop/issues/7379))
- Fixed open a new tab in same session as session tab. ([#7376](https://github.com/brave/browser-laptop/issues/7376))
- Fixed torrent name missing after download is started. ([#7362](https://github.com/brave/browser-laptop/issues/7362))
- Fixed default order in torrent list. ([#7361](https://github.com/brave/browser-laptop/issues/7361))
- Fixed style on ledger settings UI area to match 1.0 features/changes. ([#7348](https://github.com/brave/browser-laptop/issues/7348))
- Fixed styles on about:extensions with Aphrodite. ([#7345](https://github.com/brave/browser-laptop/issues/7345))
- Fixed drag & drop for images and files broken (causes screen to go white). ([#7266](https://github.com/brave/browser-laptop/issues/7266))
- Fixed torrent viewer CSP rule blocks <iframe> content. ([#7243](https://github.com/brave/browser-laptop/issues/7243))
- Fixed horizontal scrolling with two-finger gesture. ([#7100](https://github.com/brave/browser-laptop/issues/7100))
- Fixed URL address bar adding deleted text back immediately. ([#6956](https://github.com/brave/browser-laptop/issues/6956))
- Fixed idle timer never stopping. ([#6826](https://github.com/brave/browser-laptop/issues/6826))
- Fixed button alignment on the notification bar. ([#6749](https://github.com/brave/browser-laptop/issues/6749))
- Fixed spacing of buttons on torrent viewer. ([#6735](https://github.com/brave/browser-laptop/issues/6735))
- Fixed "Estimated Time Saved" to take minutes into account. ([#6650](https://github.com/brave/browser-laptop/issues/6650))
- Fixed adblocking on SFGate.com. ([#6635](https://github.com/brave/browser-laptop/issues/6635))
- Fixed URL autocomplete offering the option of only completing the hostname. ([#6537](https://github.com/brave/browser-laptop/issues/6537))
- Fixed options on about:preferences#payments to allow for localization. ([#6364](https://github.com/brave/browser-laptop/issues/6364))
- Fixed menu activation with ALT key. ([#5775](https://github.com/brave/browser-laptop/issues/5775))
- Fixed [hackerone] 181558. ([#5762](https://github.com/brave/browser-laptop/issues/5762))
- Fixed [hackerone] 181686. ([#5700](https://github.com/brave/browser-laptop/issues/5700))
- Fixed new tab page shortcut buttons link tooltips to be more user friendly. ([#5657](https://github.com/brave/browser-laptop/issues/5657))
- Fixed close button on tabs if tab size is too small. ([#5431](https://github.com/brave/browser-laptop/issues/5431))
- Fixed access-control-allow-origin: * set on about: pages. ([#4913](https://github.com/brave/browser-laptop/issues/4913))
- Fixed warning about data: URIs in location bar. ([#4899](https://github.com/brave/browser-laptop/issues/4899))
- Fixed copy to clipboard(Flash plugin) blocked on Reverso.net. ([#4020](https://github.com/brave/browser-laptop/issues/4020))
- Fixed back/forward gesture to match system preferences. ([#3299](https://github.com/brave/browser-laptop/issues/3299))
- Fixed visual distinction between session tabs. ([#3083](https://github.com/brave/browser-laptop/issues/3083))
- Fixed 'View Certificate' functionality. ([#2611](https://github.com/brave/browser-laptop/issues/2611))
- Fixed UI for passive (display) mixed content. ([#2168](https://github.com/brave/browser-laptop/issues/2168))
- Fixed about: pages failing to load in private tabs. ([#1817](https://github.com/brave/browser-laptop/issues/1817))
- Fixed Linux update mechanism never finishing. ([#401](https://github.com/brave/browser-laptop/issues/401))
- Removed check for update menu items on Linux. ([#7529](https://github.com/brave/browser-laptop/issues/7529))
- Update libchromiumcontent to 57.0.2987.110. ([#7955](https://github.com/brave/browser-laptop/issues/7955))
- Update muon to 2.57.7. ([#7939](https://github.com/brave/browser-laptop/issues/7939))


## [0.13.5](https://github.com/brave/browser-laptop/releases/v0.13.5dev)
 - Added computer-to-computer sync. ([#1854](https://github.com/brave/browser-laptop/issues/1854))
 - Added preferences page for plugins. ([#7101](https://github.com/brave/browser-laptop/issues/7101))
 - Added export bookmarks option to the kabob menu.  ([#7218](https://github.com/brave/browser-laptop/issues/7218))
 - Added feature to allow scripts by origin. ([#6431](https://github.com/brave/browser-laptop/issues/6431))
 - Added tab press to select autocomplete. ([#7132](https://github.com/brave/browser-laptop/issues/7132))
 - Added delete confirmation to downloads bar. ([#2604](https://github.com/brave/browser-laptop/issues/2604))
 - Added more HTTPS upgrades for links. ([#7297](https://github.com/brave/browser-laptop/issues/7297))
 - Fixed js alert spoofing attacks. ([#2755](https://github.com/brave/browser-laptop/issues/2755))
 - Fixed stop page load button does not stop loading the page. ([#7340](https://github.com/brave/browser-laptop/issues/7340))
 - Fixed Brave is called "brave" on Linux. ([#7166](https://github.com/brave/browser-laptop/issues/7166))
 - Fixed tabs display wrong after exiting HTML5 fullscreen. ([#7301](https://github.com/brave/browser-laptop/issues/7301))
 - Fixed wallet recovery so your address does not change. ([#7288](https://github.com/brave/browser-laptop/issues/7288))
 - Fixed deleting bookmark removes pinned item. ([#7283](https://github.com/brave/browser-laptop/issues/7283))
 - Fixed right click new tab icon (+) also processes left click event. ([#7267](https://github.com/brave/browser-laptop/issues/7267))
 - Fixed missing .pak files on Linux. ([#7260](https://github.com/brave/browser-laptop/issues/7260))
 - Fixed import and export for empty bookmark folders. ([#7193](https://github.com/brave/browser-laptop/issues/7193))
 - Fixed bookmarked PDF link. ([#7190](https://github.com/brave/browser-laptop/issues/7190))
 - Fixed menu display for when first item is a separator. ([#7109](https://github.com/brave/browser-laptop/issues/7109))
 - Fixed cursor should be default on find bar. (follow-up of #5744) ([#6812](https://github.com/brave/browser-laptop/issues/6812))
 - Fixed contact info on about:safebrowsing. ([#6781](https://github.com/brave/browser-laptop/issues/6781))
 - Fixed domains not displayed on my ledger shows up in payment receipt as payment recipients. ([#6531](https://github.com/brave/browser-laptop/issues/6531))
 - Fixed hard to exit/close Brave when site spams you with message box / alerts. ([#3794](https://github.com/brave/browser-laptop/issues/3794))
 - Fixed alert popups should appear below tabs. ([#6901](https://github.com/brave/browser-laptop/issues/6901))
 - Fixed title is cut in tab. ([#7312](https://github.com/brave/browser-laptop/issues/7312))
 - Fixed title in tab is not centered. ([#7304](https://github.com/brave/browser-laptop/issues/7304))
 - Fixed transition missing on download item progress bar. ([#7248](https://github.com/brave/browser-laptop/issues/7248))
 - Fixed clicking "copy to clipboard" buttons missing an animation. ([#6297](https://github.com/brave/browser-laptop/issues/6297))
 - Fixed URL and tab text display on Windows. ([#5624](https://github.com/brave/browser-laptop/issues/5624))
 - Fixed bookmarks toolbar button text letters are clipped partially. ([#7034](https://github.com/brave/browser-laptop/issues/7034))
 - Removed redundant dateline in contributions PDF. ([#6896](https://github.com/brave/browser-laptop/issues/6896))
 - Upgraded muon to 2.56.7. ([#7390](https://github.com/brave/browser-laptop/issues/7390))

## [0.13.4](https://github.com/brave/browser-laptop/releases/v0.13.4dev)
- Fixed crash when loading an invalid URL. ([#7256](https://github.com/brave/browser-laptop/issues/7256))

## [0.13.3](https://github.com/brave/browser-laptop/releases/v0.13.3dev)
- Added a way to export bookmarks. ([#1002](https://github.com/brave/browser-laptop/issues/1002))
- Added preference for background image or gradient for new tab. ([#6965](https://github.com/brave/browser-laptop/issues/6965))
- Added a preference setting to "always allow" full screen view. ([#5979](https://github.com/brave/browser-laptop/issues/5979))
- Added Ecosia as search engine. ([#7158](https://github.com/brave/browser-laptop/issues/7158))
- Added translation for bookmarks manager. ([#7130](https://github.com/brave/browser-laptop/issues/7130))
- Added new verified state for disabled publishers. ([#6974](https://github.com/brave/browser-laptop/issues/6974))
- Fixed lookup in dictionary by context menu. ([#7167](https://github.com/brave/browser-laptop/issues/7167))
- Fixed various UI issues. ([#7181](https://github.com/brave/browser-laptop/issues/7181))
- Fixed 'more bookmarks' menu item. ([#7097](https://github.com/brave/browser-laptop/issues/7097))
- Fixed Brave crash when Brave payment is disabled and enabled frequently. ([#7031](https://github.com/brave/browser-laptop/issues/7031))
- Fixed stutter/odd jump when tab switching with unloaded tabs. ([#6895](https://github.com/brave/browser-laptop/issues/6895))
- Fixed disable close button on tabs if tab size is too small. ([#5431](https://github.com/brave/browser-laptop/issues/5431))
- Fixed viewport regaining focus after closing downloads-bar. ([#3219](https://github.com/brave/browser-laptop/issues/3219))
- Fixed click target for Audio indicator on/off button. ([#1776](https://github.com/brave/browser-laptop/issues/1776))
- Fixed three-finger "Look up" tap. ([#1064](https://github.com/brave/browser-laptop/issues/1064))
- Fixed tabs don't resize with window. ([#100](https://github.com/brave/browser-laptop/issues/100))
- Upgraded to node 7.4.0. ([#7061](https://github.com/brave/browser-laptop/issues/7061))
- Upgraded muon to 2.56.4. ([#7173](https://github.com/brave/browser-laptop/issues/7173))
- Upgraded to Chromium v56.0.2924.87. ([#3681](https://github.com/brave/browser-laptop/issues/3681))


## [0.13.2](https://github.com/brave/browser-laptop/releases/v0.13.2dev)
- Added a way to keep tabs the same size when closing instead of resizing. ([#6088](https://github.com/brave/browser-laptop/issues/6088))
- Added import recovery keys feature for Brave Wallet. ([#4806](https://github.com/brave/browser-laptop/issues/4806))
- Added HTTP auth (login) dialogs which now have a cancel button. ([#6855](https://github.com/brave/browser-laptop/issues/6855))
- Added file open with drag-and-drop. ([#3819](https://github.com/brave/browser-laptop/issues/3819))
- Added keyboard selection for autocomplete.  ([#1302](https://github.com/brave/browser-laptop/issues/1302))
- Added performance improvements (particularly startup time and bookmarks import). ([#6833](https://github.com/brave/browser-laptop/issues/6833))([#4879](https://github.com/brave/browser-laptop/issues/4879))
- Fixed spellcheck on Linux. ([#7015](https://github.com/brave/browser-laptop/issues/7015))([#6967](https://github.com/brave/browser-laptop/issues/6967))
- Fixed Command+Click to open a new tab next to the parent tab. ([#6971](https://github.com/brave/browser-laptop/issues/6971))
- Fixed various UI issues. ([#6812](https://github.com/brave/browser-laptop/issues/6812))([#6806](https://github.com/brave/browser-laptop/issues/6806))([#6867](https://github.com/brave/browser-laptop/issues/6867))([#6754](https://github.com/brave/browser-laptop/issues/6754))([#5494](https://github.com/brave/browser-laptop/issues/5494))
- Fixed various ledger issues. ([#6966](https://github.com/brave/browser-laptop/issues/6966))([#6592](https://github.com/brave/browser-laptop/issues/6592))([#6878](https://github.com/brave/browser-laptop/issues/6878))([#6685](https://github.com/brave/browser-laptop/issues/6685))([#6941](https://github.com/brave/browser-laptop/issues/6941))
- Fixed multiple home page URLs which stopped working - "Your file was not found". ([#6913](https://github.com/brave/browser-laptop/issues/6913))
- Fixed lesechos.fr anti-ad blocking behavior. ([#6879](https://github.com/brave/browser-laptop/issues/6879))
- Fixed tab title display when reloading the page. ([#5738](https://github.com/brave/browser-laptop/issues/5738))
- Fixed autofill suggestion not being dismissed when tabs are switched. ([#6820](https://github.com/brave/browser-laptop/issues/6820))
- Fixed change language to require restart similar to other pref settings. ([#6782](https://github.com/brave/browser-laptop/issues/6782))
- Fixed bookmark hanger items alignment & text blur. ([#6777](https://github.com/brave/browser-laptop/issues/6777))
- Fixed bookmark listing to make it more clickable for adding/editing a bookmark. ([#6704](https://github.com/brave/browser-laptop/issues/6704))
- Fixed apt repository not working for Ubuntu yakkety. ([#6643](https://github.com/brave/browser-laptop/issues/6643))
- Upgraded to muon 2.0.19 ([#7003](https://github.com/brave/browser-laptop/issues/7003))

## [0.13.1](https://github.com/brave/browser-laptop/releases/v0.13.1dev)
- Fixed Widevine not working on Windows (Netflix). ([#6948](https://github.com/brave/browser-laptop/issues/6948))
- Fixed DPI settings on Windows causing blurriness and causing missing pixels.  ([#6462](https://github.com/brave/browser-laptop/issues/6462))
- Fixed high memory usage by temporarily disabling newtab background images.  ([#6945](https://github.com/brave/browser-laptop/issues/6945))
- Upgraded to muon 2.0.18. ([#6949](https://github.com/brave/browser-laptop/issues/6949))

## [0.13.0](https://github.com/brave/browser-laptop/releases/v0.13.0dev)
- Added WebTorrent support for magnet links. ([#5818](https://github.com/brave/browser-laptop/issues/5818))([#5815](https://github.com/brave/browser-laptop/issues/5815))
- Added Linux sandbox. ([#874](https://github.com/brave/browser-laptop/issues/874))
- Added PDF based payment history contribution statements. ([#4769](https://github.com/brave/browser-laptop/issues/4769))
- Added the revision SHA the source code was built from to about:brave. ([#5462](https://github.com/brave/browser-laptop/issues/5462))
- Added copy to clipboard option for about:brave page. ([#5790](https://github.com/brave/browser-laptop/issues/5790))
- Added a display-text-only mode for bookmark toolbar folders. ([#6078](https://github.com/brave/browser-laptop/issues/6078))
- Optimized UI lag caused by about: pages being open. ([#6715](https://github.com/brave/browser-laptop/issues/6715))
- Optimized URL bar autocomplete to no longer flash when you enter text. ([#6644](https://github.com/brave/browser-laptop/issues/6644))
- Changed "window renderer" processes to no longer include Node (content renderers never did in Brave). ([#6454](https://github.com/brave/browser-laptop/issues/6454))
- Changed Battery Status API to require user permission. ([#1885](https://github.com/brave/browser-laptop/issues/1885))
- Updated localization files. ([#6709]((https://github.com/brave/browser-laptop/issues/6709))
- Fixed Twitter login. ([#4758](https://github.com/brave/browser-laptop/issues/4758))
- Fixed blocking of YouTube ads. ([#4693](https://github.com/brave/browser-laptop/issues/4693))
- Fixed tab switching performance. ([#6715](https://github.com/brave/browser-laptop/issues/6715))
- Fixed drag and drop for tabs. ([#6033](https://github.com/brave/browser-laptop/issues/6033))
- Fixed memory leak causing renderer crashes. ([#6656](https://github.com/brave/browser-laptop/issues/6656))
- Fixed 1Password auto-submit on fill. ([#5875](https://github.com/brave/browser-laptop/issues/5875))
- Fixed focus on tabs keeps "bouncing" back to previous tab. ([#5730](https://github.com/brave/browser-laptop/issues/5730))
- Fixed github drop down for releases page. ([#5213](https://github.com/brave/browser-laptop/issues/5213))
- Fixed `window.onbeforeunload` handling. ([#4079](https://github.com/brave/browser-laptop/issues/4079))
- Fixed labels and buttons in notification bar behavior. ([#6417](https://github.com/brave/browser-laptop/issues/6417))
- Fixed Bookmarks showing wrong folder name. ([#4983](https://github.com/brave/browser-laptop/issues/4983))
- Fixed context menu cut and paste does not change findbar state. ([#5753](https://github.com/brave/browser-laptop/issues/5753))
- Fixed clicking links from emails will sometimes do a search instead of directly following. ([#5911](https://github.com/brave/browser-laptop/issues/5911))
- Fixed numerous issues for Brave Payments. ([#6345](https://github.com/brave/browser-laptop/issues/6345))
- Fixed numerous issues for new tab page. ([#6355](https://github.com/brave/browser-laptop/issues/6355))
- Fixed numerous issues for UI polish. ([#6346](https://github.com/brave/browser-laptop/issues/6346))
- Fixed various security & privacy issues.  ([#6356](https://github.com/brave/browser-laptop/issues/6356))
- Fixed borders and corners of each button on navbar not being clickable. ([#5679](https://github.com/brave/browser-laptop/issues/5679))
- Fixed Geolocations not working on Windows ia32. ([#6331](https://github.com/brave/browser-laptop/issues/6331))
- Upgraded to Chromium 54.0.2840.100. ([#3679](https://github.com/brave/browser-laptop/issues/3679))
- Upgraded to muon 2.0.17. ([#6340](https://github.com/brave/browser-laptop/issues/6340))

## [0.12.15](https://github.com/brave/browser-laptop/releases/v0.12.15dev)
- Added Yandex as a new search engine. ([#2703](https://github.com/brave/browser-laptop/issues/2703))
- Added Qwant as a new search engine. ([#2701](https://github.com/brave/browser-laptop/issues/2701))
- Added Semantic Scholar as a new search engine. ([#5656](https://github.com/brave/browser-laptop/issues/5656))
- Changed "Submit Feedback..." link to use community.brave.com. ([#6179](https://github.com/brave/browser-laptop/issues/6179))
- Fixed a Windows installer issue causing shortcuts to try and open brave.exe. ([#6075](https://github.com/brave/browser-laptop/issues/6075))
- Fixed alignment for icons on about pages. ([#6137](https://github.com/brave/browser-laptop/issues/6137))
- Fixed blue line appearing above page contents after some page loads. ([#5661](https://github.com/brave/browser-laptop/issues/5661))
- Moved default zoom level from Advanced to General prefs. ([#5697](https://github.com/brave/browser-laptop/issues/5697))

## [0.12.14](https://github.com/brave/browser-laptop/releases/v0.12.14dev)
- Upgraded to muon 1.4.31 to address Symantec issued cert problems

## [0.12.13](https://github.com/brave/browser-laptop/releases/v0.12.13dev)
- Typing fast could lead to partial selection inside URL bar. ([#5943](https://github.com/brave/browser-laptop/issues/5943))
- Upgraded to muon 1.4.29

## [0.12.12](https://github.com/brave/browser-laptop/releases/v0.12.12dev)
- Upgraded to muon 1.4.28

## [0.12.11](https://github.com/brave/browser-laptop/releases/v0.12.11dev)
- Upgraded to muon 1.4.27

## [0.12.10](https://github.com/brave/browser-laptop/releases/v0.12.10dev)
- Added dropdown menu with options for new tab. ([#4398](https://github.com/brave/browser-laptop/issues/4398))
- Added F6 jump to url / search bar. ([#4464](https://github.com/brave/browser-laptop/issues/4464))
- Fixed various issues for the new tab page. ([#5337](https://github.com/brave/browser-laptop/issues/5337))([#5703](https://github.com/brave/browser-laptop/issues/5703))([#5735](https://github.com/brave/browser-laptop/issues/5735))([#5666](https://github.com/brave/browser-laptop/issues/5666))([#5511](https://github.com/brave/browser-laptop/issues/5511))
- Fixed various issues for Brave Payments. ([#5606](https://github.com/brave/browser-laptop/issues/5606))([#4981](https://github.com/brave/browser-laptop/issues/4981))
([#5503](https://github.com/brave/browser-laptop/issues/5503))
- Fixed URL not showing on address bar. ([#5629](https://github.com/brave/browser-laptop/issues/5629))
- Fixed autocomplete selection accidents made by mouse position. ([#5612](https://github.com/brave/browser-laptop/issues/5612))
- Fixed UI on Brave shield. ([#5715](https://github.com/brave/browser-laptop/issues/5715))
- Fixed address bar showing chrome-extension:// prefix for PDFs. ([#5725](https://github.com/brave/browser-laptop/issues/5725))
- Fixed imported Bookmarks from showing the Wrong Date and Time. ([#5576](https://github.com/brave/browser-laptop/issues/5576))
- Fixed various UI issues. ([#5497](https://github.com/brave/browser-laptop/issues/5497))([#5476](https://github.com/brave/browser-laptop/issues/5476))([#5094](https://github.com/brave/browser-laptop/issues/5094))([#5680](https://github.com/brave/browser-laptop/issues/5680))([#1594](https://github.com/brave/browser-laptop/issues/1594))([#5695](https://github.com/brave/browser-laptop/issues/5695))([#3651](https://github.com/brave/browser-laptop/issues/3651))([#2178](https://github.com/brave/browser-laptop/issues/2178))([#5610](https://github.com/brave/browser-laptop/issues/5610))([#5652](https://github.com/brave/browser-laptop/issues/5652))([#4812](https://github.com/brave/browser-laptop/issues/4812))
- Fixed Chromium not recognized as a browser for importing bookmarks. ([#5463](https://github.com/brave/browser-laptop/issues/5463))
- Fixed about:brave doesn't show details. ([#5633](https://github.com/brave/browser-laptop/issues/5633))
- Fixed [HackerOne] media permission requests in iframes show top-level origin. ([#5378](https://github.com/brave/browser-laptop/issues/5378))
- Upgraded to muon v1.4.26 ([#5716](https://github.com/brave/browser-laptop/issues/5716))

## [0.12.9](https://github.com/brave/browser-laptop/releases/v0.12.9dev)
- Added New Tab page. ([#3001](https://github.com/brave/browser-laptop/issues/3001))([#2106](https://github.com/brave/browser-laptop/issues/2106))([#5334](https://github.com/brave/browser-laptop/issues/5334))([#5310](https://github.com/brave/browser-laptop/issues/5310))([#5396](https://github.com/brave/browser-laptop/issues/5396))([#5336](https://github.com/brave/browser-laptop/issues/5336))([#5482](https://github.com/brave/browser-laptop/issues/5482))([#5332](https://github.com/brave/browser-laptop/issues/5332))([#5337](https://github.com/brave/browser-laptop/issues/5337))([#5380](https://github.com/brave/browser-laptop/issues/5380))([#5324](https://github.com/brave/browser-laptop/issues/5324))([#5321](https://github.com/brave/browser-laptop/issues/5321))([#5322](https://github.com/brave/browser-laptop/issues/5322))
- Added Password Manager/Extension icon in right click menu. ([#5292](https://github.com/brave/browser-laptop/issues/5292))
- Added infogalactic.com to Search prefs. ([#5475](https://github.com/brave/browser-laptop/issues/5475))
- Added Wolfram Alpha to Search prefs. ([#5478](https://github.com/brave/browser-laptop/issues/5478))
- Fixed various UI issues. ([#5069](https://github.com/brave/browser-laptop/issues/5069))([#5522](https://github.com/brave/browser-laptop/pull/5522))([#5381](https://github.com/brave/browser-laptop/issues/5381))([#5518](https://github.com/brave/browser-laptop/issues/5518))([#5456](https://github.com/brave/browser-laptop/issues/5456))([#4852](https://github.com/brave/browser-laptop/issues/4852))([#5384](https://github.com/brave/browser-laptop/issues/5384))([#5446](https://github.com/brave/browser-laptop/issues/5446))([#4910](https://github.com/brave/browser-laptop/issues/4910))([#5145](https://github.com/brave/browser-laptop/issues/5145))([#5210](https://github.com/brave/browser-laptop/issues/5210))([#5383](https://github.com/brave/browser-laptop/issues/5383))([#5485](https://github.com/brave/browser-laptop/issues/5485))([#5436](https://github.com/brave/browser-laptop/issues/5436))([#5398](https://github.com/brave/browser-laptop/issues/5398))([#5023](https://github.com/brave/browser-laptop/issues/5023))([#5416](https://github.com/brave/browser-laptop/issues/5416))([#5377](https://github.com/brave/browser-laptop/issues/5377))
- Fixed various issues for about:history. ([#5458](https://github.com/brave/browser-laptop/issues/5458))([#5525](https://github.com/brave/browser-laptop/pull/5525))([#5405](https://github.com/brave/browser-laptop/issues/5405))
- Fixed right click when using 1Password or Lastpass. ([#5509](https://github.com/brave/browser-laptop/issues/5509))
- Fixed help link. ([#2902](https://github.com/brave/browser-laptop/issues/2902))
- Fixed various issues for Brave Payments. ([#4920](https://github.com/brave/browser-laptop/issues/4920))([#5418](https://github.com/brave/browser-laptop/issues/5418))([#5299](https://github.com/brave/browser-laptop/issues/5299))([#4274](https://github.com/brave/browser-laptop/issues/4274))([#5343](https://github.com/brave/browser-laptop/issues/5343))([#5200](https://github.com/brave/browser-laptop/issues/5200))([#5473](https://github.com/brave/browser-laptop/issues/5473))([#5402](https://github.com/brave/browser-laptop/issues/5402))
- Fixed [HackerOne] security issues. https://hackerone.com/reports/178379 ([#5238](https://github.com/brave/browser-laptop/issues/5238))
 https://hackerone.com/reports/180234 ([#5447](https://github.com/brave/browser-laptop/issues/5447))
- Fixed address bar suggestions. ([#5313](https://github.com/brave/browser-laptop/issues/5313))([#5315](https://github.com/brave/browser-laptop/issues/5315))
- Fixed Widevine permission notification display. ([#5488](https://github.com/brave/browser-laptop/issues/5488))
- Fixed various issues for bookmarks. ([#4860](https://github.com/brave/browser-laptop/issues/4860))([#5183](https://github.com/brave/browser-laptop/issues/5183))([#5374](https://github.com/brave/browser-laptop/issues/5374))([#5357](https://github.com/brave/browser-laptop/issues/5357))
- Fixed AVG deleting latest update. ([#5241](https://github.com/brave/browser-laptop/issues/5241))
- Fixed when Alt key Reveals Toolbar. ([#4295](https://github.com/brave/browser-laptop/issues/4295))
- Fixed various issues with address bar. ([#5460](https://github.com/brave/browser-laptop/issues/5460))([#5063](https://github.com/brave/browser-laptop/issues/5063))([#5459](https://github.com/brave/browser-laptop/issues/5459))([#5036](https://github.com/brave/browser-laptop/issues/5036))
- Fixed Autofill suggestion closing when form is submit / enter pressed. ([#4540](https://github.com/brave/browser-laptop/issues/4540))
- Fixed Autofill suggestion closing when field is out of focus. ([#3816](https://github.com/brave/browser-laptop/issues/3816))
- Upgraded to muon 1.4.25 ([#5568](https://github.com/brave/browser-laptop/issues/5568))

## [0.12.8](https://github.com/brave/browser-laptop/releases/v0.12.8dev)
- Added Pocket extension. ([#4702](https://github.com/brave/browser-laptop/issues/4702))([#5227](https://github.com/brave/browser-laptop/issues/5227))([#516](https://github.com/brave/browser-laptop/issues/516))([#4689](https://github.com/brave/browser-laptop/issues/4689))([#4700](https://github.com/brave/browser-laptop/issues/4700))([#5226](https://github.com/brave/browser-laptop/issues/5226))
- Added button to view about:extensions from preferences. ([#5244](https://github.com/brave/browser-laptop/issues/5244))
- Added regional adblock filter lists for India. ([#4996](https://github.com/brave/browser-laptop/issues/4996))
- Added search autocomplete for start page search engine. ([#5281](https://github.com/brave/browser-laptop/issues/5281))
- Changed clear data menu items in History menu with new, single item. ([#3093](https://github.com/brave/browser-laptop/issues/3093))
- Changed PDFJS to show in extensions section in preferences ([#5245](https://github.com/brave/browser-laptop/issues/5245))
- Fixed numerous issues for bookmark manager. ([#5183](https://github.com/brave/browser-laptop/issues/5183))([#5331](https://github.com/brave/browser-laptop/pull/5331))([#5223](https://github.com/brave/browser-laptop/issues/5223))([#5249](https://github.com/brave/browser-laptop/issues/5249))([#5148](https://github.com/brave/browser-laptop/issues/5148))([#4860](https://github.com/brave/browser-laptop/issues/4860))
- Fixed numerous issues for Brave Payments. ([#5365](https://github.com/brave/browser-laptop/issues/5365))([#4980](https://github.com/brave/browser-laptop/issues/4980))([#5300](https://github.com/brave/browser-laptop/issues/5300))([#4481](https://github.com/brave/browser-laptop/issues/4481))([#4703](https://github.com/brave/browser-laptop/issues/4703))([#4432](https://github.com/brave/browser-laptop/issues/4432))([#5236](https://github.com/brave/browser-laptop/issues/5236))([#4787](https://github.com/brave/browser-laptop/issues/4787))
- Fixed numerous issues for the Findbar. ([#5363](https://github.com/brave/browser-laptop/issues/5363))([#5340](https://github.com/brave/browser-laptop/issues/5340))([#4975](https://github.com/brave/browser-laptop/issues/4975))([#5317](https://github.com/brave/browser-laptop/issues/5317))([#5247](https://github.com/brave/browser-laptop/issues/5247))([#5289](https://github.com/brave/browser-laptop/issues/5289))([#5286](https://github.com/brave/browser-laptop/issues/5286))
- Fixed submit feedback in pref page/hamburger menu. ([#5352](https://github.com/brave/browser-laptop/issues/5352))
- Fixed Brave open from "Open with" context menu. ([#4795](https://github.com/brave/browser-laptop/issues/4795))
- Fixed double-clicking of entries on about:history. ([#5353](https://github.com/brave/browser-laptop/issues/5353))
- Fixed Right Click doesn't work after logging into LastPass extension. ([#5293](https://github.com/brave/browsr-laptop/issues/5293))
- Fixed 1Password and LastPass repeated entries in right click context menu. ([#5291](https://github.com/brave/browser-laptop/issues/5291))
- Fixed download list is out of order. ([#4484](https://github.com/brave/browser-laptop/issues/4484))
- Fixed address bar drops last 2 characters when typing fast (not related to auto suggestions or history). ([#5189](https://github.com/brave/browser-laptop/issues/5189))
- Fixed Brave crashes when trying to visit www.sweclockers.com. ([#5273](https://github.com/brave/browser-laptop/issues/5273))
- Fixed some cases where favicon is not displayed in history pulldown. ([#2747](https://github.com/brave/browser-laptop/issues/2747))
- Fixed TripAdvisor crashes Brave. ([#5264](https://github.com/brave/browser-laptop/issues/5264))
- Fixed visiting http://expressjs.com/ causes Brave to crash. ([#5270](https://github.com/brave/browser-laptop/issues/5270))
- Fixed drag area above address bar. ([#5225](https://github.com/brave/browser-laptop/issues/5225))
- Fixed navigating back doesn't revert URL to the previous site. ([#5221](https://github.com/brave/browser-laptop/issues/5221))
- Fixed check adblock / TP lists more frequently than daily. ([#5228](https://github.com/brave/browser-laptop/issues/5228))
- Fixed don't show blank URL bar for about:blank. ([#5209](https://github.com/brave/browser-laptop/issues/5209))
- Upgraded to brave/electron 1.4.23. ([#5243](https://github.com/brave/browser-laptop/issues/5243))


## [0.12.7](https://github.com/brave/browser-laptop/releases/v0.12.7dev)
- Added Google Widevine for Netflix support. ([#5131](https://github.com/brave/browser-laptop/issues/5131))([#468](https://github.com/brave/browser-laptop/issues/468))
- Added Startpage search engine. ([#3845](https://github.com/brave/browser-laptop/issues/3845))
- Added the ability to select multiple bookmarks at the same time. ([#5165](https://github.com/brave/browser-laptop/issues/5165))([#1005](https://github.com/brave/browser-laptop/issues/1005))
- Added verified icon for verified publishers ([#3467](https://github.com/brave/browser-laptop/issues/3467))
- Fixed numerous issues for the address bar. ([#4663](https://github.com/brave/browser-laptop/issues/4663))([#5025](https://github.com/brave/browser-laptop/issues/5025))
- Fixed autocomplete. ([#5043](https://github.com/brave/browser-laptop/issues/5043))([#5024](https://github.com/brave/browser-laptop/issues/5024))([#5091](https://github.com/brave/browser-laptop/issues/5091))([#4998](https://github.com/brave/browser-laptop/issues/4998))
- Fixed overzealous ad blocking. ([#4442](https://github.com/brave/browser-laptop/issues/4442))
- Fixed error page behavior. ([#5177](https://github.com/brave/browser-laptop/issues/5177))([#4984](https://github.com/brave/browser-laptop/issues/4984))
- Fixed numerous issues for bookmarks. ([#5202](https://github.com/brave/browser-laptop/issues/5202))([#5103](https://github.com/brave/browser-laptop/issues/5103))([#5032](https://github.com/brave/browser-laptop/issues/5032))
- Fixed Brave Payment wallet creation. ([#5107](https://github.com/brave/browser-laptop/issues/5107))
- Fixed remembering window position. ([#3247](https://github.com/brave/browser-laptop/issues/3247))
- Fixed fullscreen display on Windows. ([#5152](https://github.com/brave/browser-laptop/issues/5152))
- Fixed window resizing. ([#586](https://github.com/brave/browser-laptop/issues/586))
- Fixed UI for forms in app. ([#4884](https://github.com/brave/browser-laptop/issues/4884))
- Fixed Brave Payments showing wrong contribution date. ([#4058](https://github.com/brave/browser-laptop/issues/4058))
- Fixed security issue : local file read-access. ([#4906](https://github.com/brave/browser-laptop/issues/4906))
- Fixed security issue : closing windows via scripts. ([#5006](https://github.com/brave/browser-laptop/issues/5006))
- Updated to brave/electron 1.4.20. ([#5188](https://github.com/brave/browser-laptop/issues/5188))

## [0.12.6](https://github.com/brave/browser-laptop/releases/v0.12.6dev)
- Added the ability to set Brave as your default browser on startup and preferences page. ([#4937](https://github.com/brave/browser-laptop/issues/4937))([#4958](https://github.com/brave/browser-laptop/issues/4958))([#4935](https://github.com/brave/browser-laptop/issues/4935))([#4934](https://github.com/brave/browser-laptop/issues/4934))([#2105](https://github.com/brave/browser-laptop/issues/2105))([#4939](https://github.com/brave/browser-laptop/issues/4939))
- Added the option to opt-in to reporting usage stats. ([#4691](https://github.com/brave/browser-laptop/issues/4691))
- Fixed various security issues. ([#4747](https://github.com/brave/browser-laptop/issues/4747))([#4885](https://github.com/brave/browser-laptop/issues/4885))([#4913](https://github.com/brave/browser-laptop/issues/4913))([#4883](https://github.com/brave/browser-laptop/issues/4883))
- Fixed error on invalid homepage URL. ([#4974](https://github.com/brave/browser-laptop/issues/4974))
- Fixed Autocomplete handling so it works better. ([#3049](https://github.com/brave/browser-laptop/issues/3049))([#3235](https://github.com/brave/browser-laptop/issues/3235))([#4861](https://github.com/brave/browser-laptop/issues/4861))
- Fixed Favicons not being loaded when bookmarks imported from other browsers. ([#4882](https://github.com/brave/browser-laptop/issues/4882))
- Fixed Bookmarks bar select element should not be disabled. ([#4936](https://github.com/brave/browser-laptop/issues/4936))
- Fixed blocking `*`y.ai sites from being accidentally blocked. ([#4938](https://github.com/brave/browser-laptop/issues/4938))
- Fixed various UI issues. ([#4923](https://github.com/brave/browser-laptop/issues/4923))([#4897](https://github.com/brave/browser-laptop/issues/4897))([#4814](https://github.com/brave/browser-laptop/issues/4814))([#4817](https://github.com/brave/browser-laptop/issues/4817))([#4866](https://github.com/brave/browser-laptop/issues/4866))([#4855](https://github.com/brave/browser-laptop/issues/4855))([#3282](https://github.com/brave/browser-laptop/issues/3282))([#2894](https://github.com/brave/browser-laptop/issues/2894))([#4864](https://github.com/brave/browser-laptop/issues/4864))([#4854](https://github.com/brave/browser-laptop/issues/4854))([#3008](https://github.com/brave/browser-laptop/issues/3008))([#4830](https://github.com/brave/browser-laptop/issues/4830))([#3604](https://github.com/brave/browser-laptop/issues/3604))([#4648](https://github.com/brave/browser-laptop/issues/4648))([#4810](https://github.com/brave/browser-laptop/issues/4810))([#4766](https://github.com/brave/browser-laptop/issues/4766))([#4836](https://github.com/brave/browser-laptop/issues/4836))([#4790](https://github.com/brave/browser-laptop/issues/4790))
- Fixed double-clicking of entries on about:history opening a blank new tab. ([#4909](https://github.com/brave/browser-laptop/issues/4909))
- Fixed Pressing Tab, then Enter in address bar unexpectedly minimizing window on Windows. ([#4846](https://github.com/brave/browser-laptop/issues/4846))
- Fixed address bar suggestions not working if you are offline. ([#3730](https://github.com/brave/browser-laptop/issues/3730))
- Fixed error tab cannot be reloaded or cloned. ([#2826](https://github.com/brave/browser-laptop/issues/2826))
- Fixed buttons to add bookmark / bookmark folder in about:bookmarks. ([#4684](https://github.com/brave/browser-laptop/issues/4684))
- Upgraded to brave/electrton 1.4.16. ([#4954](https://github.com/brave/browser-laptop/issues/4954))

## [0.12.5](https://github.com/brave/browser-laptop/releases/v0.12.5dev)
- Added Brave Wallet backup and recovery. ([#4743](https://github.com/brave/browser-laptop/issues/4743))([#3350](https://github.com/brave/browser-laptop/issues/3350))
- Added a way for users to opt-out of crash reporting. ([#4479](https://github.com/brave/browser-laptop/issues/4479))
- Added multi-select deletion and drag and drop in about:history. ([#3949](https://github.com/brave/browser-laptop/issues/3949))([#4741](https://github.com/brave/browser-laptop/issues/4741))
- Fixed Linux install for RPM installers. ([#3774](https://github.com/brave/browser-laptop/issues/3774))([#1445](https://github.com/brave/browser-laptop/issues/1445))
- Fixed autocomplete on URL bar. ([#4731](https://github.com/brave/browser-laptop/issues/4731))([#4360](https://github.com/brave/browser-laptop/issues/4360))([#4573](https://github.com/brave/browser-laptop/issues/4573))
- Fixed clearing autofill. ([#4818](https://github.com/brave/browser-laptop/issues/4818))
- Fixed 'about' sites in the address bar. ([#4824](https://github.com/brave/browser-laptop/issues/4824))
- Fixed custom filter list to stop using spell check. ([#4619](https://github.com/brave/browser-laptop/issues/4619))
- Fixed numerous issues for Bookmarks Manager. ([#4739](https://github.com/brave/browser-laptop/issues/4739))([#4685](https://github.com/brave/browser-laptop/issues/4685))([#4751](https://github.com/brave/browser-laptop/issues/4751))([#2652](https://github.com/brave/browser-laptop/issues/2652))([#4728](https://github.com/brave/browser-laptop/issues/4728))([#1994](https://github.com/brave/browser-laptop/issues/1994))([#4523](https://github.com/brave/browser-laptop/issues/4523))([#4562](https://github.com/brave/browser-laptop/issues/4562))
- Fixed some Yahoo ads not being blocked on yahoo.co.jp. ([#4762](https://github.com/brave/browser-laptop/issues/4762))
- Fixed bookmarks from Edge not Importing. ([#4679](https://github.com/brave/browser-laptop/issues/4679))
- Fixed various issues for the Bookmarks Toolbar. ([#4614](https://github.com/brave/browser-laptop/issues/4614))([#3356](https://github.com/brave/browser-laptop/issues/3356))([#1725](https://github.com/brave/browser-laptop/issues/1725))
- Fixed right Alt key opening menubar for Windows users. ([#4626](https://github.com/brave/browser-laptop/issues/4626))
- Fixed the ability to change default search via preferences. ([#4695](https://github.com/brave/browser-laptop/issues/4695))
- Fixed various UI issues in Brave Payments. ([#4292](https://github.com/brave/browser-laptop/issues/4292))([#4605](https://github.com/brave/browser-laptop/issues/4605))([#4537](https://github.com/brave/browser-laptop/issues/4537))([#4566](https://github.com/brave/browser-laptop/issues/4566))
- Fixed address display on about:autofill. ([#4349](https://github.com/brave/browser-laptop/issues/4349))
- Fixed adblock list blocking elements other than ads too. ([#4633](https://github.com/brave/browser-laptop/issues/4633))
- Update adblock definition files. ([#3087](https://github.com/brave/browser-laptop/issues/3087))
- Updated to brave/electron 1.4.14. ([#4767](https://github.com/brave/browser-laptop/issues/4767))

## [0.12.4](https://github.com/brave/browser-laptop/releases/v0.12.4dev)
- Added regional adblocking (Access via about:adblock or in preferences). These are special rules which focus on blocking ads for non-US sites. ([#4489](https://github.com/brave/browser-laptop/issues/4489))([#1357](https://github.com/brave/browser-laptop/issues/1357))
- Added the ability to define custom adblock rules. ([#4620](https://github.com/brave/browser-laptop/issues/4620))
- Added bravery panel settings for private tabs. ([#4468](https://github.com/brave/browser-laptop/issues/4468))([#1824](https://github.com/brave/browser-laptop/issues/1824))
- Added Bookmark This Page option to context menu. ([#3807](https://github.com/brave/browser-laptop/issues/3807))
- Added the ability to clear site exceptions. ([#4174](https://github.com/brave/browser-laptop/issues/4174))([#4134](https://github.com/brave/browser-laptop/issues/4134))
- Fixed scrolling. ([#4472](https://github.com/brave/browser-laptop/issues/4472))
- Fixed flickering on error pages. ([#4502](https://github.com/brave/browser-laptop/issues/4502))
- Fixed various things for Brave Payments. ([#3888](https://github.com/brave/browser-laptop/issues/3888))([#4521](https://github.com/brave/browser-laptop/issues/4521))([#4528](https://github.com/brave/browser-laptop/issues/4528))([#4461](https://github.com/brave/browser-laptop/issues/4461))([#4058](https://github.com/brave/browser-laptop/issues/4058))([#4516](https://github.com/brave/browser-laptop/issues/4516))([#4421](https://github.com/brave/browser-laptop/issues/4421))([#4395](https://github.com/brave/browser-laptop/issues/4395))([#4333](https://github.com/brave/browser-laptop/issues/4333))([#4212](https://github.com/brave/browser-laptop/issues/4212))([#4436](https://github.com/brave/browser-laptop/issues/4436))([#4332](https://github.com/brave/browser-laptop/issues/4332))([#4340](https://github.com/brave/browser-laptop/issues/4340))([#4514](https://github.com/brave/browser-laptop/issues/4514))
- Fixed flickering on hover. ([#4518](https://github.com/brave/browser-laptop/issues/4518))
- Fixed Flash playing in a private tab. ([#3835](https://github.com/brave/browser-laptop/issues/3835))([#3998](https://github.com/brave/browser-laptop/issues/3998))
- Fixed crashing when tabs are closed. ([#4290](https://github.com/brave/browser-laptop/issues/4290))([#3760](https://github.com/brave/browser-laptop/issues/3760))
- Fixed localized dates. ([#4294](https://github.com/brave/browser-laptop/issues/4294))
- Fixed various style issues. ([#4512](https://github.com/brave/browser-laptop/issues/4512))([#4513](https://github.com/brave/browser-laptop/issues/4513))([#4524](https://github.com/brave/browser-laptop/issues/4524))([#4493](https://github.com/brave/browser-laptop/issues/4493))([#4492](https://github.com/brave/browser-laptop/issues/4492))([#4400](https://github.com/brave/browser-laptop/issues/4400))([#4342](https://github.com/brave/browser-laptop/issues/4342))([#4072](https://github.com/brave/browser-laptop/issues/4072))([#3996](https://github.com/brave/browser-laptop/issues/3996))([#4216](https://github.com/brave/browser-laptop/issues/4216))([#4503](https://github.com/brave/browser-laptop/issues/4503))
- Fixed window size being saved. ([#3754](https://github.com/brave/browser-laptop/issues/3754))([#4385](https://github.com/brave/browser-laptop/issues/4385))([#4482](https://github.com/brave/browser-laptop/issues/4482))
- Fixed bookmarks menu update. ([#4227](https://github.com/brave/browser-laptop/issues/4227))([#3968](https://github.com/brave/browser-laptop/issues/3968))([#4390](https://github.com/brave/browser-laptop/issues/4390))
- Fixed shortcut creation on update. ([#1181](https://github.com/brave/browser-laptop/issues/1181))
- Fixed Submit Feedback link. ([#4487](https://github.com/brave/browser-laptop/issues/4487))
- Fixed exiting fullscreen with UI buttons. ([#4416](https://github.com/brave/browser-laptop/issues/4416))([#4463](https://github.com/brave/browser-laptop/issues/4463))
- Fixed autofill when opened from about:about. ([#4350](https://github.com/brave/browser-laptop/issues/4350))([#4357](https://github.com/brave/browser-laptop/issues/4357))
- Fixed various history issues. ([#4488](https://github.com/brave/browser-laptop/issues/4488))
- Fixed favicons showing and hiding on bookmarks toolbar. ([#4339](https://github.com/brave/browser-laptop/issues/4339))([#4345](https://github.com/brave/browser-laptop/issues/4345))
- Fixed selecting text on a page opened in a new tab. ([#4517](https://github.com/brave/browser-laptop/issues/4517))
- Upgraded to libchromiumcontent 53.0.2785.143. ([#4618](https://github.com/brave/browser-laptop/issues/4618))

## [0.12.3](https://github.com/brave/browser-laptop/releases/v0.12.3dev)
- Added the ability to import data from other browsers. ([#428](https://github.com/brave/browser-laptop/issues/428))([#4049](https://github.com/brave/browser-laptop/issues/4049))([#4154](https://github.com/brave/browser-laptop/issues/4154))
- Added a new look for the Windows browser to remove the titlebar for more content viewing area. ([#3854](https://github.com/brave/browser-laptop/issues/3854))
- Added auto updating extensions ([#4080](https://github.com/brave/browser-laptop/issues/4080))
- Added the ability to install extensions remotely instead of prepackaging them. ([#4081](https://github.com/brave/browser-laptop/issues/4081))
- Added search shortcuts for MDN, GitHub, and Stack Overflow. ([#4213](https://github.com/brave/browser-laptop/issues/4213))
- Added the option to clear site-specific settings. ([#2545](https://github.com/brave/browser-laptop/issues/2545))
- Added instant search results for bookmarks. ([#4097](https://github.com/brave/browser-laptop/issues/4097))([#2778](https://github.com/brave/browser-laptop/issues/2778))
- Fixed various things for importing data from other browsers. ([#4275](https://github.com/brave/browser-laptop/issues/4275))([#4293](https://github.com/brave/browser-laptop/issues/4293))([#4291](https://github.com/brave/browser-laptop/issues/4291))([#4270](https://github.com/brave/browser-laptop/issues/4270))([#4271](https://github.com/brave/browser-laptop/issues/4271))
- Fixed various things for the Address bar. ([#4309](https://github.com/brave/browser-laptop/issues/4309)) ([#4303](https://github.com/brave/browser-laptop/issues/4303))([#4315](https://github.com/brave/browser-laptop/issues/4315))([#4273](https://github.com/brave/browser-laptop/issues/4273))
- Fixed various things for the toolbar. ([#4306](https://github.com/brave/browser-laptop/issues/4306))([#4272](https://github.com/brave/browser-laptop/issues/4272))([#1046](https://github.com/brave/browser-laptop/issues/1046))([#4126](https://github.com/brave/browser-laptop/issues/4126))
- Fixed various things for the titlebar. ([#4188](https://github.com/brave/browser-laptop/issues/4284))([#4175](https://github.com/brave/browser-laptop/issues/4175))([#4144](https://github.com/brave/browser-laptop/issues/4144))([#4296](https://github.com/brave/browser-laptop/issues/4296))([#4235](https://github.com/brave/browser-laptop/issues/4235))
- Fixed various things for Brave Payments. ([#4038](https://github.com/brave/browser-laptop/issues/4038))([#3781](https://github.com/brave/browser-laptop/issues/3781))([#4046](https://github.com/brave/browser-laptop/issues/4046))([#4057](https://github.com/brave/browser-laptop/issues/4057))([#3963](https://github.com/brave/browser-laptop/issues/3963))([#4040](https://github.com/brave/browser-laptop/issues/4040))([#4043](https://github.com/brave/browser-laptop/issues/4043))([#4071](https://github.com/brave/browser-laptop/issues/4071))([#4068](https://github.com/brave/browser-laptop/issues/4068))([#4067](https://github.com/brave/browser-laptop/issues/4067))([#4039](https://github.com/brave/browser-laptop/issues/4039))([#3792](https://github.com/brave/browser-laptop/issues/3792))([#4032](https://github.com/brave/browser-laptop/issues/4032))([#3759](https://github.com/brave/browser-laptop/issues/3759))([#4132](https://github.com/brave/browser-laptop/issues/4132)) ([#4058](https://github.com/brave/browser-laptop/issues/4058))([#4085](https://github.com/brave/browser-laptop/issues/4085))([#4314](https://github.com/brave/browser-laptop/issues/4314))([#3477](https://github.com/brave/browser-laptop/issues/3477))([#4312](https://github.com/brave/browser-laptop/issues/4312))([#4316](https://github.com/brave/browser-laptop/issues/4316))
- Fixed browser history sorting. ([#4047](https://github.com/brave/browser-laptop/issues/4047))
- Fixed browser history listing. ([#4048](https://github.com/brave/browser-laptop/issues/4048))([#4029](https://github.com/brave/browser-laptop/issues/4029))
- Fixed redirection on Twitter when blocking scripts. ([#2884](https://github.com/brave/browser-laptop/issues/2884))
- Fixed viewing source on SVG files. ([#4056](https://github.com/brave/browser-laptop/issues/4056))
- Fixed viewing source during private sessions. ([#4077](https://github.com/brave/browser-laptop/issues/4077))
- Fixed language sorting. ([#4055](https://github.com/brave/browser-laptop/issues/4055))
- Fixed HTTPS count from being shown even when its disabled. ([#4300](https://github.com/brave/browser-laptop/issues/4300))
- Fixed geolocation. ([#3825](https://github.com/brave/browser-laptop/issues/3825))
- Fixed left-right gesture for navigation. ([#2548](https://github.com/brave/browser-laptop/issues/2548))([#4064](https://github.com/brave/browser-laptop/issues/4064))
- Fixed deleting bookmark folders and their contents. ([#4124](https://github.com/brave/browser-laptop/issues/4124))
- Fixed deleted bookmark items from showing in URL suggestions. ([#3763](https://github.com/brave/browser-laptop/issues/3763))
- Fixed search engine selection. ([#4099](https://github.com/brave/browser-laptop/issues/4099))
- Security: Fixed unsafe use of first party url. ([#4145](https://github.com/brave/browser-laptop/issues/4145))([#4137](https://github.com/brave/browser-laptop/issues/4137))
- Fixed showing top panel in fullscreen on mouse over. ([#4193](https://github.com/brave/browser-laptop/issues/4193))([#4234](https://github.com/brave/browser-laptop/issues/4234))
- Updated translations. ([#4308](https://github.com/brave/browser-laptop/issues/4308))
- Upgraded to libchromiumcontent 53.0.2785.116. ([#1593](https://github.com/brave/browser-laptop/issues/1593))

## [0.12.1](https://github.com/brave/browser-laptop/releases/v0.12.1dev)
 - Added support for extension action buttons for password managers. ([#3867](https://github.com/brave/browser-laptop/issues/3867))([#2224](https://github.com/brave/browser-laptop/issues/2224))
 - Added notification to let users know 24 hours before their wallet would be used to pay publishers. ([#3828](https://github.com/brave/browser-laptop/issues/3828))
 - Added about:extensions page. ([#3926](https://github.com/brave/browser-laptop/issues/3926))
 - Added clear Autofill option. ([#3458](https://github.com/brave/browser-laptop/issues/3458))
 - Added notification in Brave Payments to inform user of their contribution day. ([#3801](https://github.com/brave/browser-laptop/issues/3801))
 - Added support for 7 languages: Chinese, Malay, Basque, Italian, Korean, Polish, and Russian. ([#3843](https://github.com/brave/browser-laptop/issues/3843))([#3957](https://github.com/brave/browser-laptop/issues/3957))
 - Fixed numerous things for Brave Payments. ([#3711](https://github.com/brave/browser-laptop/issues/3711))([#3612](https://github.com/brave/browser-laptop/issues/3612))([#3785](https://github.com/brave/browser-laptop/issues/3785))([#3852](https://github.com/brave/browser-laptop/issues/3852))([#3716](https://github.com/brave/browser-laptop/issues/3716))([#3778](https://github.com/brave/browser-laptop/issues/3778))([#3830](https://github.com/brave/browser-laptop/issues/3830))([#3805](https://github.com/brave/browser-laptop/issues/3805))([#3824](https://github.com/brave/browser-laptop/issues/3824))([#3831](https://github.com/brave/browser-laptop/issues/3831))
 - Fixed numerous things in the UI. ([#3910](https://github.com/brave/browser-laptop/issues/3910))([#3916](https://github.com/brave/browser-laptop/issues/3916))([#3908](https://github.com/brave/browser-laptop/issues/3908))([#3856](https://github.com/brave/browser-laptop/issues/3856))([#3622](https://github.com/brave/browser-laptop/issues/3622))([#3673](https://github.com/brave/browser-laptop/issues/3673))([#3708](https://github.com/brave/browser-laptop/issues/3708))([#3739](https://github.com/brave/browser-laptop/issues/3739))([#3855](https://github.com/brave/browser-laptop/issues/3855))([#3629](https://github.com/brave/browser-laptop/issues/3629))([#3813](https://github.com/brave/browser-laptop/issues/3813))([#3612](https://github.com/brave/browser-laptop/issues/3621))([#3833](https://github.com/brave/browser-laptop/issues/3833))([#3677](https://github.com/brave/browser-laptop/issues/3677))([#3803](https://github.com/brave/browser-laptop/issues/3803))([#3484](https://github.com/brave/browser-laptop/issues/3484))([#3940](https://github.com/brave/browser-laptop/issues/3940))
 - Fixed typing in the address bar. ([#3928](https://github.com/brave/browser-laptop/issues/3928))([#3927](https://github.com/brave/browser-laptop/issues/3927))([#3857](https://github.com/brave/browser-laptop/issues/3857))([#3718](https://github.com/brave/browser-laptop/issues/3718))([#3712](https://github.com/brave/browser-laptop/issues/3712))([#3933](https://github.com/brave/browser-laptop/issues/3933))
 - Fixed Autocomplete for Twitter login. ([#3915](https://github.com/brave/browser-laptop/issues/3915))
 - Fixed 1Password not filling the form and Brave saving the password. ([#3897](https://github.com/brave/browser-laptop/issues/3897))
 - Fixed enabling "Web notifications" on Twitter. ([#3579](https://github.com/brave/browser-laptop/issues/3579))
 - Fixed Brave crash when Dashlane password manager is selected. ([#3909](https://github.com/brave/browser-laptop/issues/3909))
 - Fixed crash when Linux users would check for updates. ([#3907](https://github.com/brave/browser-laptop/issues/3907))
 - Fixed Redhat desktop launcher. ([#3905](https://github.com/brave/browser-laptop/issues/3905))
 - Fixed setting Brave as the default browser under Linux. ([#3776](https://github.com/brave/browser-laptop/issues/3776))
 - Fixed privacy retention for new tabs opened via context menu actions. ([#3662](https://github.com/brave/browser-laptop/issues/3662))([#3895](https://github.com/brave/browser-laptop/issues/3895))
 - Fixed a LastPass create account issue. ([#2936](https://github.com/brave/browser-laptop/issues/2936))
 - Fixed renderer crash after signing into `https://*.slack.com/home`. ([#3841](https://github.com/brave/browser-laptop/issues/3841))
 - Fixed mixed content pages incorrectly showing as secure in private browsing mode. ([#3793](https://github.com/brave/browser-laptop/issues/3793))([#3795](https://github.com/brave/browser-laptop/issues/3795))
 - Fixed Mixed-content lock control to re-lock and reload the page. ([#3770](https://github.com/brave/browser-laptop/issues/3770))([#3808](https://github.com/brave/browser-laptop/issues/3808))
 - Fixed Mac menu being inaccessible while download is in progress. ([#3823](https://github.com/brave/browser-laptop/issues/3823))
 - Fixed CmdOrCtrl+T (New Tab) shortcut becoming disabled while navigation occurs. ([#3782](https://github.com/brave/browser-laptop/issues/3782))
 - Changed '...' to Unicode ellipsis. ([#3675](https://github.com/brave/browser-laptop/issues/3675))

## [0.12.0](https://github.com/brave/browser-laptop/releases/v0.12.0dev)
 - Added an option to temporarily disable mixed content protection enhancement security. ([#3443](https://github.com/brave/browser-laptop/issues/3443))
 - Added shortcut to view page source. ([#3685](https://github.com/brave/browser-laptop/issues/3685))
 - Added missing context menu shortcut labels for Bookmarking and Reloading pages. ([#3707](https://github.com/brave/browser-laptop/issues/3707))
 - Changed friendlier add funds panel for users without a bitcoin: handler. ([#3623](https://github.com/brave/browser-laptop/issues/3623))
 - Fixed autofill popup dismissal when you tab out. ([#3709](https://github.com/brave/browser-laptop/pull/3709))
 - Fixed 'Open all in tabs' context menu option in Bookmarks Manager. ([#3614](https://github.com/brave/browser-laptop/issues/3614))
 - Fixed creating a wallet with a monthly allowance > $5 causes Brave to crash. ([#3742](https://github.com/brave/browser-laptop/issues/3742))([#3742](https://github.com/brave/browser-laptop/issues/3672))
 - Fixed wrong suggestions appearing in the autocomplete list under URL bar. ([#3643](https://github.com/brave/browser-laptop/issues/3643))
 - Fixed problems with hangouts on inbox.google.com and mail.google.com when shields are up. ([#3704](https://github.com/brave/browser-laptop/issues/3704))([#3704](https://github.com/brave/browser-laptop/issues/3704))
 - Fixed time spent on page calculation for ledger when Brave is in the background. ([#3650](https://github.com/brave/browser-laptop/issues/3650))
 - Fixed potential race condition on session state save ([#3543](https://github.com/brave/browser-laptop/issues/3543))
 - Fixed bookmark custom title from previously bookmarked entry is no longer re-used when it is removed. ([#3641](https://github.com/brave/browser-laptop/issues/3641))
 - Fixed many things for Brave Payments. ([#3697](https://github.com/brave/browser-laptop/issues/3697))([#3625](https://github.com/brave/browser-laptop/issues/3625))([#3613](https://github.com/brave/browser-laptop/issues/3613))([#3703](https://github.com/brave/browser-laptop/issues/3703))
 - Fixed spelling for Ukrainian interface. ([#3695](https://github.com/brave/browser-laptop/issues/3695))
 - Fixed localization for password strings. ([#3671](https://github.com/brave/browser-laptop/issues/3671))
 - Fixed found entries on about:history cannot be deleted. ([#3566](https://github.com/brave/browser-laptop/issues/3566))
 - Fixed bookmarked pages not deleted from history after restarting bookmarks. ([#3616](https://github.com/brave/browser-laptop/issues/3616))
 - Fixed clear the last accessed time for all tags when clearing history. ([#3620](https://github.com/brave/browser-laptop/issues/3620))
 - Fixed about:history showing bookmarks when searched. ([#3627](https://github.com/brave/browser-laptop/issues/3627))

## [0.11.6](https://github.com/brave/browser-laptop/releases/v0.11.6dev)
 - Added the ability to pay publishers with the Brave Payments. ([#3195](https://github.com/brave/browser-laptop/issues/3195))
 - Added form autofill support. ([#860](https://github.com/brave/browser-laptop/issues/860))
 - Added about:history and Ctrl +Y to bring it up. ([#444](https://github.com/brave/browser-laptop/issues/444))
 - Added new look for find bar UI. ([#3159](https://github.com/brave/browser-laptop/issues/3159))
 - Added bookmarks into the bookmarks menu. ([#1993](https://github.com/brave/browser-laptop/issues/1993))
 - Optimized HTTPS Everywhere. ([#3215](https://github.com/brave/browser-laptop/issues/3215))
 - Changed Hamburger Menu with layout. ([#3003](https://github.com/brave/browser-laptop/issues/3003))
 - Changed Back button history does not hint at options beyond a certain point. ([#2889](https://github.com/brave/browser-laptop/issues/2889))
 - Fixed default engine display problem for fresh profile. ([#3275](https://github.com/brave/browser-laptop/issues/3275))
 - Fixed Address bar input ignored if no default search engine set. ([#3254](https://github.com/brave/browser-laptop/issues/3254))
 - Fixed URL bar autocomplete mouseover does not interfere with typed URL. ([#3225](https://github.com/brave/browser-laptop/issues/3225))
 - Fixed ETags for data file downloading haven't been working. ([#3222](https://github.com/brave/browser-laptop/issues/3222))
 - Fixed Modals being clipped when the window is narrow. ([#3575](https://github.com/brave/browser-laptop/issues/3575))
 - Fixed Application icon is with poor resolution on Linux. ([#3229](https://github.com/brave/browser-laptop/issues/3229))
 - Fixed new tab button too high. ([#3208](https://github.com/brave/browser-laptop/issues/3208))
 - Fixed new tab button position fixes #3208. ([#3213](https://github.com/brave/browser-laptop/issues/3213))
 - Fixed flash on http://www.y8.com/games/superfighters does not work. ([#3082](https://github.com/brave/browser-laptop/issues/3082))
 - Fixed Users can create bookmark folders with no name. ([#3188](https://github.com/brave/browser-laptop/issues/3188))
 - Fixed Back/Forward navigation, tab shows page URL instead of page title. ([#3200](https://github.com/brave/browser-laptop/issues/3200))
 - Fixed NoScript version of DuckDuckGo should be used when NoScript is on. ([#3189](https://github.com/brave/browser-laptop/issues/3189))
 - Fixed Use NoScript state per site instead of blocking scripts. ([#3205](https://github.com/brave/browser-laptop/issues/3205))
 - Fixed Market graph on wsj.com. ([#2102](https://github.com/brave/browser-laptop/issues/2102))
 - Fixed tab-specific notifications should be closed when tab is closed. ([#3169](https://github.com/brave/browser-laptop/issues/3169))
 - Fixed Brave can't handle URLs with whitespace in it. ([#3167](https://github.com/brave/browser-laptop/issues/3167))
 - Fixed Regenerating menu too often. ([#3022](https://github.com/brave/browser-laptop/issues/3022))
 - Fixed Bookmarks flow for sites without titles. ([#3442](https://github.com/brave/browser-laptop/issues/3442))
 - Fixed opening files instead of searching for them. ([#3296](https://github.com/brave/browser-laptop/issues/3296))
 - Fixed Pressing backspace while typing makes the browser go to the previous page on some pages. ([#3496](https://github.com/brave/browser-laptop/issues/3496))
 - Fixed username and password field for basic auth dialog not showing up. ([#3578](https://github.com/brave/browser-laptop/issues/3578))
 - Fixed after upgrade, context menu for password manager was not showing. ([#3549](https://github.com/brave/browser-laptop/issues/3549))
 - Fixed passwords are not saved using default settings. ([#3516](https://github.com/brave/browser-laptop/issues/3516))
 - Upgraded to HTTPS Everywhere 5.2.0. ([#2581](https://github.com/brave/browser-laptop/issues/2581))

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
- Upgraded to libchromiumcontent 52.0.2743.116. ([#2964](https://github.com/brave/browser-laptop/issues/2964))

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
- Upgraded to libchromiumcontent 52.0.2743.82. ([#1592](https://github.com/brave/browser-laptop/issues/1592))
- Upgraded to Electron 1.3.0. ([#2635](https://github.com/brave/browser-laptop/issues/2635))

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
- Fixed spell check happening in URL bar. ([#2434](https://github.com/brave/browser-laptop/issues/2434))
- Fixed webRTC fingerprinting blocking. ([#2412](https://github.com/brave/browser-laptop/issues/2412))
- Fixed find in page highlighting not clearing when find bar is closed. ([#2476](https://github.com/brave/browser-laptop/issues/2476))
- Fixed two finger swipe gesture on macOS conflicting with scrolling. ([#2577](https://github.com/brave/browser-laptop/issues/2577))
- Upgraded to Electron 1.2.7. ([#2470](https://github.com/brave/browser-laptop/issues/2470))

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
- Upgraded to libchromiumcontent 51.0.2704.103. ([#2211](https://github.com/brave/browser-laptop/issues/2211))
- Upgraded to Electron 1.2.3. ([#2294](https://github.com/brave/browser-laptop/issues/2294))

## [0.10.3](https://github.com/brave/browser-laptop/releases/v0.10.3dev)
- Upgraded to libchromiumcontent 51.0.2704.84. ([#2122](https://github.com/brave/browser-laptop/issues/2122))

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
- Upgraded to HTTPS Everywhere definitions for 5.1.9. ([#1692](https://github.com/brave/browser-laptop/issues/1692))
- Upgraded to libchromiumcontent 51.0.2704.63. ([#1405](https://github.com/brave/browser-laptop/issues/1405))
- Upgraded to Electron 1.2.0. ([#1968](https://github.com/brave/browser-laptop/issues/1968))
- Upgraded to Node 6.1. ([#1969](https://github.com/brave/browser-laptop/issues/1969))
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
- Upgraded to libchromiumcontent 50.0.2661.102. ([#1708](https://github.com/brave/browser-laptop/issues/1708))
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
- Upgraded to libchromiumcontent 50.0.2661.94.
- Upgraded to Electron 0.37.7.

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
- Upgraded to libchromiumcontent 49.0.2623.112.
- Upgraded to Electron 0.37.6.

## [0.9.1](https://github.com/brave/browser-laptop/releases/v0.9.1dev)
- Undo closed tab now focuses the webview.
- Upgraded to React v15 for cleaner DOM and faster performance.
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
- Upgraded to Node 5.10.0.

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
- Upgraded to libchromiumcontent 49.0.2623.108.
- Upgraded to Electron 0.37.3.
- Upgraded to Node 5.9.1.
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
- Upgraded to libchromiumcontent 49.0.2623.75.
- Upgraded to Electron 0.37.2.
- Upgraded to Node 5.8.
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
