function utf8Len(a){if(a>=55296&&a<=57343){throw new Error("Illegal argument: "+a)
}if(a<0){throw new Error("Illegal argument: "+a)}if(a<=127){return 1}if(a<=2047){return 2
}if(a<=65535){return 3}if(a<=2097151){return 4}if(a<=67108863){return 5}if(a<=2147483647){return 6
}throw new Error("Illegal argument: "+a)}function isHighSurrogate(a){return a>=55296&&a<=56319
}function isLowSurrogate(a){return a>=56320&&a<=57343}function toCodepoint(c,a){if(!isHighSurrogate(c)){throw new Error("Illegal argument: "+c)
}if(!isLowSurrogate(a)){throw new Error("Illegal argument: "+a)}c=(1023&c)<<10;var b=c|(1023&a);
return b+65536}function utf8ByteCount(f){var d=0;for(var b=0;b<f.length;b++){var c=f.charCodeAt(b);
if(isHighSurrogate(c)){var e=c;var a=f.charCodeAt(++b);d+=utf8Len(toCodepoint(e,a))
}else{d+=utf8Len(c)}}return d}function KW__getSubtle(){return window.crypto&&(crypto.subtle||crypto.webkitSubtle)||null
}function KW__getKey(){return"7FpaFV0iang8Vpk5bUc2lx28xoTI"}function KW__getSalt(a){a=a||8;
return crypto.getRandomValues(new Uint8Array(a))}function KW__cryptHashPassword(i,e){var c=10204;
var f=null;var b=function(m,l){var k=KW__str2ab("KWH1");var j=new Uint8Array(l.byteLength+k.byteLength+m.byteLength);
j.set(new Uint8Array(l),0);j.set(new Uint8Array(k),l.byteLength);j.set(new Uint8Array(m),l.byteLength+k.byteLength);
return base64js.fromByteArray(j)};var h=KW__getSubtle();if(h&&(KW__CONFIG.browser!==BROWSER_SAFARI)){f=KW__getSalt(32);
h.digest({name:"SHA-512"},KW__str2ab(i)).then(function(j){return h.importKey("raw",j,{name:"PBKDF2"},false,["deriveKey"])
}).then(function(j){return h.deriveKey({name:"PBKDF2",salt:f,iterations:c,hash:"SHA-1"},j,{name:"HMAC",hash:"SHA-256",length:256},true,["sign"])
}).then(function(j){return h.exportKey("raw",j)}).then(function(j){return e(null,b(j,f))
})["catch"](function(j){return e(j)});return}var d=sjcl.hash.sha512.hash(i);if(window.crypto&&crypto.getRandomValues){f=KW__getSalt(32)
}else{}bSalt=sjcl.codec.arrayBuffer.toBits(f.buffer);var g=function(j){return new sjcl.misc.hmac(j,sjcl.hash.sha1)
};d=sjcl.misc.pbkdf2(d,bSalt,c,256,g);var a=sjcl.codec.arrayBuffer.fromBits(d);return e(null,b(a,f))
}function KW__cryptObfuscate(e,g){var f=null;var a=KW__str2ab(e);var l=function(o){var p=new Uint8Array(o);
var n=new Uint8Array(f.byteLength+p.byteLength);n.set(f,0);n.set(p,f.byteLength);
return base64js.fromByteArray(n)};f=KW__getSalt(8);var h=EVP_BytesToKey(KW__getKey(),f);
var j=KW__getSubtle();if(j){j.importKey("raw",h.key.buffer,{name:"AES-CBC"},false,["encrypt"]).then(function(n){return j.encrypt({name:"AES-CBC",iv:h.iv},n,a)
}).then(function(n){return g(null,l(n))})["catch"](function(n){return g(n)});return
}var b=sjcl.codec.arrayBuffer.toBits(a);var c=sjcl.codec.arrayBuffer.toBits(h.key.buffer);
var i=sjcl.codec.arrayBuffer.toBits(h.iv.buffer);var m=new sjcl.cipher.aes(c);var k="CBC mode is dangerous because it doesn't protect message integrity.";
if(!sjcl.mode.cbc){sjcl.beware[k]()}var d=sjcl.mode.cbc.encrypt(m,b,i);return g(null,l(sjcl.codec.arrayBuffer.fromBits(d)))
}function KW__cryptDeObfuscate(f,j){var k=base64js.toByteArray(f);var h=k.subarray(0,8);
var g=k.subarray(8,k.length);var i=EVP_BytesToKey(KW__getKey(),h);var m=KW__getSubtle();
if(m){m.importKey("raw",i.key.buffer,{name:"AES-CBC"},false,["decrypt"]).then(function(p){return m.decrypt({name:"AES-CBC",iv:i.iv},p,g)
}).then(function(q){var p=KW__ab2str(q);return j(null,p)})["catch"](function(p){return j(p)
});return}var b=new Uint8Array(g);var a=sjcl.codec.arrayBuffer.toBits(b.buffer);var e=sjcl.codec.arrayBuffer.toBits(i.key.buffer);
var l=sjcl.codec.arrayBuffer.toBits(i.iv.buffer);var o=new sjcl.cipher.aes(e);var n="CBC mode is dangerous because it doesn't protect message integrity.";
if(!sjcl.mode.cbc){sjcl.beware[n]()}var d=sjcl.mode.cbc.decrypt(o,a,l);var c=KW__ab2str(sjcl.codec.arrayBuffer.fromBits(d));
return j(null,c)}function EVP_BytesToKey(m,g){var n=5;var o=KW__str2ab(m);var i=new Uint8Array(g.byteLength+o.byteLength);
i.set(new Uint8Array(o),0);i.set(new Uint8Array(g),o.byteLength);var d=sjcl.codec.arrayBuffer.toBits(i.buffer);
var k=[],e=[];for(var c=0;c<3;++c){k=k.concat(d);for(var f=0;f<n;++f,k=sjcl.hash.sha1.hash(k)){}e[c]=k
}var l=new Uint8Array(32);var b=new Uint8Array(16);var a=sjcl.codec.arrayBuffer.fromBits(e[0]).slice(0,20);
l.set(new Uint8Array(a),0);a=sjcl.codec.arrayBuffer.fromBits(e[1]).slice(0,12);l.set(new Uint8Array(a),20);
a=sjcl.codec.arrayBuffer.fromBits(e[1]).slice(12,20);b.set(new Uint8Array(a),0);a=sjcl.codec.arrayBuffer.fromBits(e[2]).slice(0,8);
b.set(new Uint8Array(a),8);return{key:l,iv:b}}var KWWebSocketController={_initDone:false,_ports:[11456,15674,17896,21953,32934],_currentPort:-1,_tryingPort:-1,_nextTry:0,_lastConnectionTime:0,_stablePortRetries:0,_pingRate:30*1000,_pingTimer:null,_msgBuffer:[],_initMsgTimer:null,_initMsgTimeout:5*1000,_gotInitMsg:false,_obfuscate:false,_resetBackoff:function(){if(this._currentPort===-1||this._nextTry===0){return
}if(this._nextTry===1){this._nextTry=0;return}this._nextTry/=2;setTimeout(this._resetBackoff.bind(this),this._nextTry)
},_flushBuffer:function(){if(!this._obfuscate){while(this._msgBuffer.length){this._send(this._msgBuffer.shift())
}return}var a=this._msgBuffer.slice();this._msgBuffer=[];var b=function(){if(!a.length){return
}return KW__cryptObfuscate(a.shift(),function(c,d){if(c){a=null;return}if(this._currentPort!==-1&&this._gotInitMsg&&this._obfuscate){this._send(d);
return b()}a=null}.bind(this))}.bind(this);return b()},clearBuffer:function(){this._msgBuffer=[]
},_tryFirstPort:function(){this._tryingPort=this._ports[0];this.open(this._tryingPort)
},init:function(){if(!this._initDone){this._tryFirstPort();this._initDone=true}},retry:function(){this._tryFirstPort()
},open:function(a){throw new Error("KWWebSocketController.open must be implemented per browser")
},_send:function(a){throw new Error("KWWebSocketController.send must be implemented per browser")
},close:function(){throw new Error("KWWebSocketController.close must be implemented per browser")
},send:function(b,a){if(this._currentPort===-1&&!a){return}if(!this._obfuscate){if(this._currentPort!==-1&&this._gotInitMsg){return this._send(b)
}return this._msgBuffer.push(b)}return KW__cryptObfuscate(b,function(c,d){if(c){return
}if(this._currentPort!==-1&&this._gotInitMsg){return this._send(d)}this._msgBuffer.push(b)
}.bind(this))},_ping:function(){if(this._currentPort!==-1){this._send("pInG");this._pingTimer=setTimeout(this._ping.bind(this),this._pingRate)
}},_cancelPing:function(){if(this._pingTimer){clearTimeout(this._pingTimer);this._pingTimer=null
}},onOpen:function(a){if(KW__DEBUG.general){KW__log("Websocket connection established on port "+a,3)
}this._lastConnectionTime=Date.now();this._currentPort=a;this._tryingPort=-1;this._resetBackoff();
this._send(KW__CONFIG.browser);this._pingTimer=setTimeout(this._ping.bind(this),this._pingRate);
this._initMsgTimer=setTimeout(this._onNoInitMessage.bind(this),this._initMsgTimeout);
if(this._nextTry===32&&KW__CONFIG.useWebsocketCom){KWController.sendExceptionLog("ws.onOpen","KWCommunication.ws.commun.js",0,"Connection after max backoff")
}},_onNoInitMessage:function(){throw new Error("KWWebSocketController._onNoInitMessage must be implemented per browser")
},onMessage:function(c){if(!this._gotInitMsg||!this._obfuscate){var b=null;try{b=JSON.parse(c)
}catch(a){KWController.sendExceptionLog("ws.onMessage","KWCommunication.ws.commun.js",0,a+"")
}if(!b){return}if(b.init){return this._handleInitMessage(b.init)}else{if(!this._gotInitMsg){KWController.sendExceptionLog("ws.onMessage","KWCommunication.ws.commun.js",0,"Did not get init message!")
}}return KWTabsController.catchMessageFromCpp(b.tabId,b.message)}return KW__cryptDeObfuscate(c,function(d,f){if(d){KWController.sendExceptionLog("ws.onMessage","KWCommunication.ws.commun.js",0,d+"");
return console.error(d)}var e=null;try{e=JSON.parse(f)}catch(d){KWController.sendExceptionLog("ws.onMessage","KWCommunication.ws.commun.js",0,d+"")
}if(!e){return}if(e.init){return this._handleInitMessage(e.init)}KWTabsController.catchMessageFromCpp(e.tabId,e.message)
}.bind(this))},_handleInitMessage:function(a){if(this._initMsgTimer){clearTimeout(this._initMsgTimer);
this._initMsgTimer=null}if(a.websocketCompatible=="1"){KWController.socketWorking()
}if(a.hasOwnProperty("capabilities")&&a.capabilities>0){KWController.setPluginCapabilities(a.capabilities);
this._send(KWController.getWsInitMessage());this._obfuscate=true}this._gotInitMsg=true;
this._flushBuffer()},_handleDeadConnection:function(c,b){if(this._currentPort===b){KWController.socketClosed()
}this._currentPort=-1;this._gotInitMsg=false;this._obfuscate=false;this._cancelPing();
var a=this._ports.indexOf(b);if(this._lastConnectionTime&&(Date.now()-this._lastConnectionTime)/1000>60&&this._stablePortRetries++<3){this._tryingPort=b;
return this.open(b)}this._lastConnectionTime=0;this._stablePortRetries=0;if(a===this._ports.length-1){this._tryingPort=-1;
setTimeout(this.retry.bind(this),this._nextTry*1000);this._nextTry=Math.min(this._nextTry?this._nextTry*2:1,8);
return}this._tryingPort=this._ports[++a];this.open(this._tryingPort)},onError:function(b,a){if(KW__DEBUG.general){KW__log("Websocket error on port "+a+" : "+b,0)
}if(this._currentPort===a||this._tryingPort===a){this._handleDeadConnection(b,a)}},onClose:function(b,a){if(KW__DEBUG.general){KW__log("Websocket connection was closed: "+b,3)
}if(this._currentPort===a||this._tryingPort===a){this._handleDeadConnection(b,a)}}};
KWWebSocketController.__ws=null;KWWebSocketController.open=function(a){if(this.__ws&&this.__ws.readyState!==WebSocket.CLOSED){KWController.sendExceptionLog("ws.open","KWCommunication.ws.chrome.js",0,"Trying to open a websocket while we already have one");
throw new Error("Trying to open a websocket while we already have one")}var b=null;
try{b=new WebSocket("ws://127.0.0.1:"+a)}catch(d){return this.onError(d,a)}var c=this;
this.__ws=b;b.onopen=function(f){c.__ws=b;c.onOpen(a)};b.onerror=function(f){c.__ws=null;
c.onError(null,a)};b.onmessage=function(f){c.onMessage(f.data)};b.onclose=function(f){if(f.code&&f.code!==1006){KWController.sendExceptionLog("ws.onclose","KWCommunication.ws.chrome.js",0,f.code+"")
}if(b===c.__ws){c.__ws=null;c.onClose(f.reason,a)}}};KWWebSocketController._send=function(a){if(!this.__ws||this.__ws.readyState!==WebSocket.OPEN){var a="Send with bad ws: "+(this.__ws&&this.__ws.readyState||"null");
KWController.sendExceptionLog("ws.send","KWCommunication.ws.chrome.js",0,a);return false
}return this.__ws.send(a)};KWWebSocketController.close=function(){if(!this.__ws){return false
}this.__ws.close();this.__ws=null};KWWebSocketController._onNoInitMessage=function(){this._initMsgTimer=null;
if(KW__CONFIG.os!==PLATFORM_WINDOWS){return}KW__CONFIG.useWebsocketCom=false;KW__ORDER_SENDER.initCommunication()
};var KW__ORDERS={fromInjectedJsToExtension:{logOnline:1,oneClickDebuggerOrder:1,purchaseMessageFromWebpage:1,beforeunload:1,unload:1,uninstallExtension:1,killCws:1,logException:1,signalWebUIHidden:1,DashlaneAPIRequest_webAccountCreation_accountCreated:1,DashlaneAPIRequest_webAccountCreation_createAccount:1,DashlaneAPIRequest_webAccountCreation_doNotShowReactivation:1,DashlaneAPIRequest_webAccountCreation_downloadApp:1,DashlaneAPIRequest_webAccountCreation_started:1},fromInjectedJsToCpp:{documentComplete:1,DOMInformations:1,signalNewDOMInformations:1,signalAjaxDOMInformations:1,signalCssDOMInformations:1,domNodeInserted:1,getDescriptionsForAutoFill:1,autoFillForm:1,changeDefaultAndAutoFillForm:1,focusDescriptionsForAutoFill:1,blurDescriptionsForAutoFill:1,valueDescriptionsForAutoFill:1,eventOnOutFired:1,eventOnLogoutFired:1,signalXPathListForBasket:1,askWebAppAuthStatus:1,signalAutofillDone:1,signalStructurePerformance:1,signalContextDebugInfo:1,signalPutputClickedForLog:1,signalSearchQueryForLog:1,browserMessage:1,DashlaneAPIRequest_getClientVersion:1,DashlaneAPIRequest_isUserLoggedin:1,DashlaneAPIRequest_openDashlaneApplication:1,DashlaneAPIRequest_userWantsToSaveData:1,DashlaneAPIRequest_saveDataObjectsResponse:1,DashlaneAPIRequest_userWantsToSignup:1,DashlaneAPIRequest_signupRequiredDetailsResponse:1,DashlaneAPIRequest_signupFullDataErrorResponse:1,DashlaneAPIRequest_signupFullDataSuccessResponse:1,DashlaneAPIRequest_userWantsToCheckout:1,DashlaneAPIRequest_getUserOnboardingSites:1,DashlaneAPIRequest_doOnboardingSiteStep:1,DashlaneAPIRequest_endWebOnboarding:1,DashlaneAPIRequest_signalOnboardingStep:1,DashlaneAPIRequest_signalSafeSearchActivation:1,DashlaneAPIRequest_getSearchData:1,DashlaneAPIRequest_disableSafeSearch:1,DashlaneAPIRequest_getCardData:1,DashlaneAPIRequest_subscribeCard:1,DashlaneAPIRequest_signalCardEvent:1},fromCppToExtension:{httpServerInfoResponse:1,loadToolbar:1,deleteToolbar:1,nextStep:1,missingInformation:1,signalAuthStatusLoggedin:1,signalAuthStatusLoggedout:1,autoFillStatus:1,askForAutologinOnWebsite:1,changeNavStyle:1,confirmBuyProcedure:1,forwardMessageFromPluginToPlugin:1,changeLanguage:1,takeScreenshot:1,takeScreenshotForLevelOne:1,startTakingScreenshotsForLevelOne:1,stopTakingScreenshotsForLevelOne:1,setCookiesForCoupons:1,switchBrowserMode:1,popover_signalDataRefresh:1,popover_signalPasswordGenerated:1,popover_showLogoutConfirmation:1,disableSafeSearch:1,signalInstallerId:1,showWebUI:1,hideWebUI:1,updateWebUI:1,meaningDataResponse:1,loadUrl:1},fromCppToInjectedJs:{highlightInputsForAutoComplete:1,autofillChoiceLayer:1,fillElements:1,autoLoginStatus:1,askForNewDOMInformations:1,putEventHandlers:1,putEventHandlersOnIns:1,putEventHandlersOnOutsToWatchForLogout:1,signalElementsToWatchValue:1,testXPathListForBasket:1,webAppAuthStatus:1,watchPutputForLog:1,showInput:1,showFormOnPage:1,hideFormOnPage:1,displayOnboardingSuccessOverlay:1,hideOnboardingSuccessOverlay:1,DashlaneAPIResponse_getClientVersion:1,DashlaneAPIResponse_isUserLoggedin:1,DashlaneAPIResponse_saveDataObjectsRequest:1,DashlaneAPIResponse_saveDataResponseRequest:1,DashlaneAPIResponse_signupRequiredDetailsRequest:1,DashlaneAPIResponse_signupFullDataRequest:1,DashlaneAPIResponse_getUserOnboardingSites:1,DashlaneAPIResponse_getSearchData:1,DashlaneAPIResponse_signalSafeSearchActivation:1,DashlaneAPIResponse_disableSafeSearch:1,DashlaneAPIResponse_getCardData:1,DashlaneAPIResponse_subscribeCard:1}};
var KW__ORDER_SENDER={};var KW__ORDER_DISPATCHER={heardFromCpp:false,dispatchOrder:function(c,b){var a=this.getOrderFromMessage(c);
var d=this.getActionFromOrder(a);if(c&&d&&b){for(var e in KW__ORDERS){if(KW__ORDERS[e].hasOwnProperty(d)){KW__ORDER_DISPATCHER[e](d,a,b);
break}}}else{if(KW__DEBUG.general){KW__log("Order or tab id not defined : "+b+"\n"+d+"\n"+dump(a),1)
}}},fromInjectedJsToExtension:function(f,a,b){if(f=="logOnline"){KW__logOnline(KWTabsController.getControllerById(b),a);
return}KWKwiftDebugger.logOrder(f,KWOrdersParser.treatOrder(a),"fromInjectedJsToExtension");
if(KW__CONFIG.browser==BROWSER_FIREFOX&&f=="oneClickDebuggerOrder"){KWKwiftDebugger.catchOneClickDebuggerOrderFromInjectedJs(b,a);
return}if(f==="DashlaneAPIRequest_webAccountCreation_accountCreated"){KWStorage.set("webAccountCreation_AccountCreated",true);
return}if(f==="DashlaneAPIRequest_webAccountCreation_createAccount"){KWController.sendInstallerLog("49.5.2");
KWController.openCurrentTabWithUrl("https://www.dashlane.com/webapp/preview/account/create");
return}if(f==="DashlaneAPIRequest_webAccountCreation_doNotShowReactivation"){KWController.sendInstallerLog("49.5.3");
KWStorage.set("webAccountCreation_doNotShowReactivation",true);KWController.removeTab(b);
return}if(f==="DashlaneAPIRequest_webAccountCreation_downloadApp"){KWController.sendInstallerLog("49.5.1");
KWController.openCurrentTabWithUrl("https://www.dashlane.com/"+_TR_.lang()+"/download");
return}if(f==="DashlaneAPIRequest_webAccountCreation_started"){if(a.content){var c;
try{c=JSON.parse(a.content)}catch(g){}if(c&&c.anonymouscomputerid){KWController.setWebInstallerId(c.anonymouscomputerid)
}}KWStorage.set("webAccountCreation_started",true);return}var d=KWTabsController.getControllerById(b);
if(!d){if(KW__DEBUG.general){KW__log("Tab controller is null, it shouldn't be !",1)
}return}if(f=="purchaseMessageFromWebpage"){d.purchaseController.catchPurchaseMessageFromWebpage(a);
return}if(f=="beforeunload"){if(KW__CONFIG.browser===BROWSER_CHROME&&a){d.catchBeforeUnloadEvent(a.offsetX,a.offsetY)
}else{d.catchBeforeUnloadEvent()}return}if(f=="unload"){d.catchUnloadEvent();return
}if(f=="uninstallExtension"){return KWController.uninstallExtension()}if(f=="killCws"){return KWController.onKillCwsMessageReceived()
}if(f=="logException"){return KWController.sendExceptionLog(a.funcName,a.fileName,a.code,a.message,a.type,a.legacy,a.precisions)
}if(f==="signalWebUIHidden"){return d.signalWebUIHidden(a.type)}},fromInjectedJsToCpp:function(f,a,b){var e=KWTabsController.getControllerById(b);
if(f=="documentComplete"){e.documentCompleteReceived(false)}else{if(f=="DOMInformations"||f=="signalNewDOMInformations"){if(KW__CONFIG.iFrameSupport){KWKwiftDebugger.logOrder(f,KWOrdersParser.treatOrder(a),"fromInjectedJsToExtension");
if(e&&a.domStructure){e.signalNewDOMInformationsSent();e._bufferedDOMInformations=a.domStructure;
e.sendNewDOMInformationsWithFrame(a)}else{if(KW__DEBUG.general){KW__log("DOMInformations or signalNewDOMInformations received but not forwarded: domStructure (empty) = "+a.domStructure,3)
}}}else{KW__SPECIAL_ORDERS.signalInputAndSelect(a,b)}}else{if(f=="signalAjaxDOMInformations"||f=="signalCssDOMInformations"){if(KW__CONFIG.iFrameSupport){KWKwiftDebugger.logOrder(f,KWOrdersParser.treatOrder(a),"fromInjectedJsToExtension");
if(e&&a.domStructure){e._bufferedDOMInformations=a.domStructure;e.refreshFramesRegistration()
}if(e.domNodeInsertEventActive&&e.documentCompleteSent){e.sendNewDOMInformationsWithFrame(a)
}else{if(KW__DEBUG.general){KW__log("signalAjaxDOMInformations or signalCssDOMInformations received but not forwarded: domNodeInsertedActive = "+e.domNodeInsertEventActive+", documentCompleteSent = "+e.documentCompleteSent,3)
}}}else{if(e.domNodeInsertEventActive&&e.documentCompleteSent){KW__SPECIAL_ORDERS.signalInputAndSelect(a,b)
}else{if(KW__DEBUG.general){KW__log("signalAjaxDOMInformations or signalCssDOMInformations received but not forwarded: domNodeInsertedActive = "+e.domNodeInsertEventActive+", documentCompleteSent = "+e.documentCompleteSent,3)
}}}}else{if(f=="domNodeInserted"){if(e.domNodeInsertEventActive&&e.documentCompleteSent){e.sendLoadEventToCpp("DOM_NODE_INSERTED",false);
e.refreshFramesRegistration()}else{if(KW__DEBUG.general){KW__log("domNodeInserted received but not forwarded: domNodeInsertedActive = "+e.domNodeInsertEventActive+", documentCompleteSent = "+e.documentCompleteSent,3)
}}}else{if(f=="focusDescriptionsForAutoFill"||f=="blurDescriptionsForAutoFill"||f=="valueDescriptionsForAutoFill"||f=="getDescriptionsForAutoFill"||f=="autoFillForm"||f=="changeDefaultAndAutoFillForm"||f=="eventOnOutFired"||f=="eventOnLogoutFired"||f=="signalXPathListForBasket"||f=="askWebAppAuthStatus"||f=="signalAutofillDone"||f=="browserMessage"||f=="signalStructurePerformance"||f=="signalPutputClickedForLog"||f=="signalSearchQueryForLog"||f=="signalContextDebugInfo"){if(f==="focusDescriptionsForAutoFill"){e.cacheInputPosition(a);
if(e.shouldBlockFocusOrder(a)){return}}else{if(f==="blurDescriptionsForAutoFill"){if(KWTabsController.hasWebUIPopover()){return
}}}KW__ORDER_SENDER.sendOrderToCpp(a,b,"fromInjectedJsToCpp")}else{if(f.indexOf("DashlaneAPIRequest_")===0){var c;
if(f==="DashlaneAPIRequest_doOnboardingSiteStep"){c=JSON.parse(a.content);var d=c.site.match(/:\/\/(.[^/]+)/)[1].replace("www.","");
KWController.deleteCookiesForDomain(d,function(){KW__ORDER_SENDER.sendOrderToCpp(a,b,"fromInjectedJsToCpp")
})}else{if(f==="DashlaneAPIRequest_signalSafeSearchActivation"){KWController.activateSafeSearch(function(g){var j=JSON.parse(a.content);
for(var i in g){j[i]=g[i]}a.content=JSON.stringify(j);KW__ORDER_SENDER.sendOrderToCpp(a,b,"fromInjectedJsToCpp");
if(g.added){var h={action:"DashlaneAPIResponse_signalSafeSearchActivation",content:JSON.stringify({success:true})};
KW__ORDER_SENDER.sendOrderToAllFrames(h,b,"fromCppToInjectedJs")}})}else{if(f==="DashlaneAPIRequest_disableSafeSearch"){c=JSON.parse(a.content);
KWController.disableSafeSearch(function(g){if(g){KW__ORDER_SENDER.sendOrderToCpp({action:"signalSafeSearchDisabled",from:c.from},KW__CONFIG.defaultTabId,"fromExtensionToCpp");
KWController.openNewTabWithUrl("https://www.dashlane.com/safesearch_uninstalled")
}var h={action:"DashlaneAPIResponse_disableSafeSearch",content:JSON.stringify({success:g})};
KW__ORDER_SENDER.sendOrderToAllFrames(h,b,"fromCppToInjectedJs")},"web")}else{KW__ORDER_SENDER.sendOrderToCpp(a,b,"fromInjectedJsToCpp")
}}}}}}}}}},fromCppToExtension:function(f,b,c){this.heardFromCpp=true;var e=KWOrdersParser.treatOrder(b);
if(f!="httpServerInfoResponse"&&f!="changeLanguage"){KWKwiftDebugger.logOrder(f,e,"fromCppToExtension")
}var a=KWTabsController.getControllerById(c).purchaseController;switch(f){case"httpServerInfoResponse":KWController.treatHttpServerInfoResponse(b.port,b.status);
break;case"forwardMessageFromPluginToPlugin":KW__ORDER_SENDER.sendOrderToCpp(b,c,"fromExtensionToCpp");
break;case"changeLanguage":_TR_.changeBundle(b.code);KWController.changeLangage(b.code);
break;case"takeScreenshot":KWTabsController.getControllerById(c).saveScreenshotForBuyProcedure(false);
break;case"takeScreenshotForLevelOne":KWTabsController.getControllerById(c).saveScreenshotForBuyProcedure(true);
break;case"startTakingScreenshotsForLevelOne":KWTabsController.getControllerById(c).startTakingScreenshotsForLevelOne();
break;case"stopTakingScreenshotsForLevelOne":KWTabsController.getControllerById(c).stopTakingScreenshotsForLevelOne();
break;case"setCookiesForCoupons":KWController.setCookiesForCoupons(b);break;case"switchBrowserMode":KWController.switchBrowserMode(b.type,b.text1,b.text2);
break;case"meaningDataResponse":if(KW__CONFIG.browser==BROWSER_FIREFOX){KWKwiftDebugger.orderReceived(b.content,c)
}break;case"loadUrl":KWController.openCurrentTabWithUrl(b.url);break;case"signalAuthStatusLoggedin":case"signalAuthStatusLoggedout":KWController.treatAuthStatus(f=="signalAuthStatusLoggedin",b.login,b.lastLogin);
break;case"autoFillStatus":KWTabsController.getControllerById(c).refreshAutoFillStatus(b.status);
if(KW__CONFIG.iFrameSupport){KW__ORDER_SENDER.sendOrderToAllFrames(b,c,"fromCppToInjectedJs")
}else{KW__ORDER_SENDER.sendOrderToJs(b,c,"fromCppToInjectedJs")}break;case"askForAutologinOnWebsite":KWController.autologinOnWebsite(b.Url);
break;case"popover_signalDataRefresh":case"popover_signalPasswordGenerated":case"popover_showLogoutConfirmation":var d=JSON.parse(b.content,function(g,h){return typeof h=="string"?h.replace(/--endl--/g,"\n"):h
});if(f==="popover_signalDataRefresh"&&d){KWController.signalSafeSearchCapability(d.hasOwnProperty("settings")&&d.settings.hasOwnProperty("safeSearchEnabled"))
}KWController.postMessageToPopover({action:b.action,data:d});break;case"changeNavStyle":break;
case"confirmBuyProcedure":a.confirmBuyProcedure();break;case"loadToolbar":case"deleteToolbar":switch(b.screen){case"nothing":case"informUserKwiftSaveFormData":case"informUserKwiftCantAutoLogin":case"autoLoginWarning":KW__ORDER_SENDER.sendOrderToJs(b,c,"fromCppToInjectedJs");
break;default:}if(a&&typeof(a[f])=="function"){a[f](b)}else{if(KW__DEBUG.general){KW__log("purchaseController not found on tabController",2)
}}break;case"disableSafeSearch":KWController.disableSafeSearch(function(g){if(g){KW__ORDER_SENDER.sendOrderToCpp({action:"signalSafeSearchDisabled",from:b.from||""},KW__CONFIG.defaultTabId,"fromExtensionToCpp");
KWController.openNewTabWithUrl("https://www.dashlane.com/safesearch_uninstalled")
}else{KW__ORDER_SENDER.sendOrderToCpp({action:"signalSafeSearchDisablingCanceled",from:b.from||""},KW__CONFIG.defaultTabId,"fromExtensionToCpp")
}},b.from||"");break;case"signalInstallerId":KWController.setInstallerId(b.installerId);
break;case"showWebUI":var d=JSON.parse(b.content);KWTabsController.getControllerById(c).showWebUI(d.uiInfos);
break;case"hideWebUI":var d=JSON.parse(b.content);KWTabsController.getControllerById(c).hideWebUI(d.type);
break;case"updateWebUI":var d=JSON.parse(b.content);KWTabsController.getControllerById(c).updateWebUI(d.uiInfos);
break;default:if(a&&typeof(a[f])=="function"){a[f](b)}else{if(KW__DEBUG.general){KW__log("purchaseController not found on tabController",2)
}}}},fromCppToInjectedJs:function(c,a,b){this.heardFromCpp=true;if(c=="fillElements"){a.isDuringBuyProcedure=KWTabsController.getControllerById(b).getIsDuringBuyProcedure()
}if(KW__CONFIG.iFrameSupport){if(c=="askForNewDOMInformations"){KWTabsController.getControllerById(b).signalWaitForNewDOMInformations()
}switch(c){case"highlightInputsForAutoComplete":case"fillElements":case"askForNewDOMInformations":case"putEventHandlers":case"putEventHandlersOnIns":case"putEventHandlersOnOutsToWatchForLogout":case"signalElementsToWatchValue":case"watchPutputForLog":case"showInput":KW__ORDER_SENDER.sendOrderToAllFrames(a,b,"fromCppToInjectedJs");
break;case"displayOnboardingSuccessOverlay":case"hideOnboardingSuccessOverlay":KW__ORDER_SENDER.sendOrderToJs(a,b,"fromCppToInjectedJs");
break;case"showFormOnPage":case"hideFormOnPage":KWTabsController.getControllerById(b).order.debug.sendOneClickDebuggerOrderToInjectedJs(c,a);
break;default:if(c.indexOf("DashlaneAPIResponse_")===0){KW__ORDER_SENDER.sendOrderToAllFrames(a,b,"fromCppToInjectedJs")
}else{KW__ORDER_SENDER.sendOrderToJs(a,b,"fromCppToInjectedJs")}break}}else{KW__ORDER_SENDER.sendOrderToJs(a,b,"fromCppToInjectedJs")
}},getOrderFromMessage:function(b){try{return KWOrdersParser.treatMessage(b)}catch(a){if(KW__DEBUG.general){KW__log("Unable to treat message :\n"+b,2)
}return false}},getActionFromOrder:function(a){if(typeof(a.action)=="string"&&a.action!==""){return a.action
}else{if(KW__DEBUG.general){KW__log("No action in message",1)}return false}}};var KW__SPECIAL_ORDERS={askForServerPort:function(a){var b={action:"askForHttpServerInfo"};
KW__ORDER_SENDER.sendOrderToCpp(b,a,"fromExtensionToCpp")}};KW__ORDER_SENDER.port=null;
KW__ORDER_SENDER.msgId=0;var _possibleChromeNativeMessagingErrors=["Failed to start native messaging host.","Invalid native messaging host name specified.","Native host has exited.","Specified native messaging host not found.","Access to the specified native messaging host is forbidden.","Error when communicating with the native messaging host."];
var _errorsForWhichWeWantToRetry=[true,false,true,false,false,true];var _shouldTryToRestartCommunication=function(a){var b=_possibleChromeNativeMessagingErrors.indexOf(a);
return b===-1?true:_errorsForWhichWeWantToRetry[b]};var MIN_RETRY_TIME=1000;var WAIT_FOR_ERROR=5000;
var _makeComTimeout=null;var _makeComInterval=MIN_RETRY_TIME;var _intervalBackoff=function(){_makeComTimeout=null;
_makeComInterval=Math.max(MIN_RETRY_TIME,_makeComInterval/2);if(_makeComInterval>MIN_RETRY_TIME){_makeComTimeout=setTimeout(_intervalBackoff,_makeComInterval)
}};var _relaunchCommuncation=function(){setTimeout(function(){_makeCommunication()
},_makeComInterval);if(_makeComTimeout){clearTimeout(_makeComTimeout)}_makeComTimeout=setTimeout(_intervalBackoff,_makeComInterval+WAIT_FOR_ERROR);
_makeComInterval*=2};var _makeCommunication=function(){if(!KW__ORDER_SENDER.port){if(KW__DEBUG.general){KW__log("Creating native messaging communication port",2)
}KW__ORDER_SENDER.port=chrome.runtime.connectNative(KW__CONFIG.nativeMessagingHost);
KW__ORDER_SENDER.port.onMessage.addListener(function(b){if(KW__DEBUG.general){KW__log(b.message,2)
}KW__ORDER_SENDER._lastReceivedMessageSize=b.message.length;lastOfnotB=b.message.length-1;
for(var a=b.message.length-1;a>=0;a--){if(b.message[a]!="B"){lastOfnotB=a;break}}b.message=b.message.substring(0,lastOfnotB+1);
KWTabsController.catchMessageFromCpp(b.tabId,b.message)});KW__ORDER_SENDER.port.onDisconnect.addListener(function(c){var b=chrome.runtime.lastError.message;
if(KW__DEBUG.general){KW__log(b,0)}if(KW__CONFIG.useWebsocketCom){return}var a=KW__ORDER_SENDER._lastSentMessageSize+", "+KW__ORDER_SENDER._lastReceivedMessageSize+", "+_makeComInterval/1000;
KWController.sendExceptionLog("_makeCommunication","KWCommunication.chrome.native.js",0,b,"",false,a);
KW__ORDER_SENDER.port=null;if(!_shouldTryToRestartCommunication(b)){}else{_relaunchCommuncation()
}})}};KW__ORDER_SENDER._lastSentMessageSize=-1;KW__ORDER_SENDER._lastReceivedMessageSize=-1;
KW__ORDER_SENDER.initCommunication=function(){if(KW__CONFIG.os===PLATFORM_WINDOWS){_makeCommunication()
}else{if(!KW__CONFIG.useWebsocketCom){}}};KW__ORDER_SENDER.killNativeMessagingHost=function(){if(_makeComTimeout){clearTimeout(_makeComTimeout);
_makeComTimeout=null}if(KW__ORDER_SENDER.port&&KW__ORDER_SENDER.port.disconnect){KW__ORDER_SENDER.port.disconnect()
}KW__ORDER_SENDER.msgId=0};var MAX_MSG_SIZE=1048576;KW__ORDER_SENDER.postMessage_GM=function(b){var e="{";
for(var c in b){if(c=="id"){e+='"'+c+'":'+b[c]+","}else{if(c=="message"){var d=b[c].replace(/\\/g,"\\\\");
d=d.replace(/\"/g,'\\"');d=d.replace(/\r/g,"\\r");d=d.replace(/\f/g,"\\f");e+='"'+c+'":"'+d+'"'
}else{e+='"'+c+'":"'+b[c]+'",'}}}e+="}";var a=utf8ByteCount(e);if(a>=MAX_MSG_SIZE){KW__ORDER_SENDER.msgId-=1;
KWController.sendExceptionLog("postMessage_GM","KWCommunication.chrome.native.js",0,"Message to be sent is too big","",false,""+a)
}else{KW__ORDER_SENDER._lastSentMessageSize=a;KW__ORDER_SENDER.port.postMessage(b)
}};KW__ORDER_SENDER.sendOrderToCpp=function sendOrderToCpp(a,b,c){var d=KWOrdersParser.treatOrder(a);
KWKwiftDebugger.logOrder(a.action,d,c);if(KW__CONFIG.useWebsocketCom){KWWebSocketController.send(JSON.stringify({id:KW__ORDER_SENDER.msgId++,tabId:b.toString(),message:d}),true)
}else{if(KW__DEBUG.linkWithCpp&&KW__ORDER_SENDER.port){KW__ORDER_SENDER.postMessage_GM({id:KW__ORDER_SENDER.msgId++,tabId:b.toString(),message:d});
KWKwiftDebugger.logOrderOk(c)}}};KW__ORDER_SENDER.sendOrderToJs=function(a,b,c,f){var d=KWOrdersParser.treatOrder(a);
KWKwiftDebugger.logOrder(a.action,d,c);var e=KWTabsController.getControllerById(b);
if(e&&e.tabPanel&&e.tabPanel.url){if(e.port){e.port.postMessage(d);if(typeof f==="function"){f()
}}}};KW__ORDER_SENDER.sendOrderToJsWithNoFailure=function sendOrderToJsWithNoFailure(a,b,c,d){return KW__ORDER_SENDER.sendOrderToJs(a,b,c,d)
};KW__ORDER_SENDER.sendOrderToAllFrames=function sendOrderToAllFrames(a,b,d){var f=KWOrdersParser.treatOrder(a);
KWKwiftDebugger.logOrder(a.action,f,d);var g=KWTabsController.getControllerById(b);
if(g&&g.port){try{g.port.postMessage(f);var h=g.getAllFrames();for(var c=0;c<h.length;
c++){if(h[c].port){h[c].port.postMessage(f)}}}catch(e){}}};KW__SPECIAL_ORDERS.documentComplete=function documentComplete(a,d,b){try{if(KW__CONFIG.useWebsocketCom){KWWebSocketController.send(JSON.stringify({id:KW__ORDER_SENDER.msgId++,tabId:b.toString(),message:d}),true)
}else{if(KW__DEBUG.linkWithCpp&&KW__ORDER_SENDER.port){KW__ORDER_SENDER.postMessage_GM({id:KW__ORDER_SENDER.msgId++,tabId:b.toString(),message:d});
KWKwiftDebugger.logOrderOk("fromExtensionToCpp")}}}catch(c){KWKwiftDebugger.logOrderFailed("fromExtensionToCpp");
if(KW__DEBUG.general){KW__log("KW__SPECIAL_ORDERS.documentComplete :\n"+dumpErr(c),1)
}}};KW__SPECIAL_ORDERS.signalInputAndSelect=function signalInputAndSelect(a,d){var c="",e="",f="";
if(typeof(a.domStructure)=="string"&&a.domStructure!==""){c=a.domStructure}else{KW__log("DOM Structure empty :\n"+a.domStructure,0)
}var b=function(){try{if(KWTabsController.getControllerById(d).documentCompleteSent){var i=KWTabsController.getControllerById(d);
var h=i&&i.tabPanel&&i.tabPanel.url||"";var l=i&&i.tabPanel&&i.tabPanel.title||"";
var g=a;g.pageTitle=l;var k=KWOrdersParser.treatOrder(g);if(KW__CONFIG.useWebsocketCom){KWWebSocketController.send(JSON.stringify({id:KW__ORDER_SENDER.msgId++,tabId:d.toString(),message:k}),true)
}else{if(KW__DEBUG.linkWithCpp&&KW__ORDER_SENDER.port){KW__ORDER_SENDER.postMessage_GM({id:KW__ORDER_SENDER.msgId++,tabId:d.toString(),message:k})
}}if(a.action=="DOMInformations"){KWKwiftDebugger.signalLoadEvent("DOM_INFORMATIONS",d)
}else{if(a.action=="signalNewDOMInformations"){KWKwiftDebugger.signalLoadEvent("NEW_DOM_INFORMATIONS",d)
}else{if(a.action=="signalAjaxDOMInformations"){KWKwiftDebugger.signalLoadEvent("AJAX_DOM_INFORMATIONS",d)
}}}KWKwiftDebugger.logOrderOk("fromInjectedJsToCpp")}else{setTimeout(b,10)}}catch(j){if(KW__DEBUG.general){}}};
b()};var KWController={INSTALLER_ID:"installerId",WEB_INSTALLER_ID:"web_installerId",userLoggedIn:false,userLogin:"",lastLogin:"",waitForInitSocket:true,_pluginCapabilities:0,wacReactivationMode:false,init:function init(){throw"KWController.init must be implemented by browser"
},reinit:function reinit(){throw"KWController.reinit must be implemented by browser"
},getServerPortIfEmpty:function getServerPortIfEmpty(){throw"KWController.getServerPortIfEmpty must be implemented by browser"
},treatHttpServerInfoResponse:function treatHttpServerInfoResponse(b,a){if(a){KW__CONFIG.serverPort=b
}else{if(KW__DEBUG.general){KW__log("Unable to load injected JS : the local server is not running : "+a,1)
}}},setInstallerId:function setInstallerId(a){KWStorage.set(this.INSTALLER_ID,a);
this._sendInstallerLogWithBothIds()},getInstallerId:function getInstallerId(){return KWStorage.get(this.INSTALLER_ID)
},setWebInstallerId:function setWebInstallerId(a){KWStorage.set(this.WEB_INSTALLER_ID,a);
this._sendInstallerLogWithBothIds()},getWebInstallerId:function getWebInstallerId(){return KWStorage.get(this.WEB_INSTALLER_ID)
},_sendInstallerLogWithBothIds:function _sendInstallerLogWithBothIds(){if(!(this.getInstallerId()&&this.getWebInstallerId())){return
}this.sendInstallerLogOnce("50.1",{anonymouswebid:this.getWebInstallerId()})},loadInstallerId:function loadInstallerId(){var a=function(){if(!KW__ORDER_DISPATCHER.heardFromCpp){return setTimeout(a,1000)
}KW__ORDER_SENDER.sendOrderToCpp({action:"getInstallerId"},KW__CONFIG.defaultTabId,"fromExtensionToCpp")
};a()},socketWorking:function socketWorking(){KWStorage.set("cppTalked",true);if(this.wacReactivationMode===true){this.wacReactivationMode=false;
this.deactivateWACReactivation()}if(this.waitForInitSocket){this.waitForInitSocket=false
}else{if(KW__CONFIG.useWebsocketCom){this.reinit()}}},socketClosed:function socketClosed(){if(KW__CONFIG.useWebsocketCom&&!this.waitForInitSocket){this.uninit(true);
KWWebUICache.clear();KW__ORDER_SENDER.msgId=0}},uninit:function uninit(a){if(KW__DEBUG.general){KW__log("KWController.uninit()",3)
}KWController.treatAuthStatus(false,"","");KWTabsController.closeAllWebUIs();KWTabsController.closeAll(true);
this._pluginCapabilities=0;if(!a){KW__ORDER_SENDER.sendOrderToCpp({action:"event",eventType:"UNINIT"},KW__CONFIG.defaultTabId,"fromExtensionToCpp")
}},signalNewVersionStarted:function signalNewVersionStarted(){throw"KWController.signalNewVersionStarted must be implemented by browser"
},sendInstallerLogOnce:function sendInstallerLogOnce(c,a){var b="installerLogSent_"+c;
if(KWStorage.get(b)){return}KWStorage.set(b,true);this.sendInstallerLog(c,a)},sendInstallerLog:function sendInstallerLog(d,b){var c="https://logs.dashlane.com/1/installerlog/";
var e={step:d,version:KW__CONFIG.build};var a=this.getInstallerId();var f=this.getWebInstallerId();
if(a||f){c+="create";KW$.extend(e,{anonymouscomputerid:f,desktopanonymouscomputerid:a,os:KW__CONFIG.os,platform:KW__CONFIG.platform})
}else{c+="createLight"}if(b&&typeof b==="object"){e.content=JSON.stringify(b)}KW$.ajax({type:"POST",url:c,data:e,success:function(){if(KW__DEBUG.general){KW__log("Successfully sent installer log. ",3)
}}})},logAutofillIssue:function logAutofillIssue(a){a.os=KW__CONFIG.os;a.browser=KW__CONFIG.browser;
a.build=KW__CONFIG.build;KW$.ajax({type:"POST",url:"https://logs.dashlane.com/1/crowdbugz/create",data:a,success:function(){}})
},logExceptionsCount:{},sendExceptionLog:function(e,b,a,j,f,h,g){try{if(this.logExceptionsCount.hasOwnProperty(e)&&this.logExceptionsCount[e]>=10){return
}if(!this.logExceptionsCount.hasOwnProperty(e)){this.logExceptionsCount[e]=0}var c={action:"logOnline",type:KW__CONFIG.extension+"_"+KW__CONFIG.os,version:KW__CONFIG.build,code:a,message:j,functionName:e,file:b,legacy:h!==undefined&&h,exceptiontype:f!==undefined&&f!==null&&f||"TYPE_KW_EX_NO_TYPE",stack:g!==undefined&&g||""};
if(KW__DEBUG.general){KW__log("Will send following exception log:\n"+dump(c),0)}var i=this;
KW$.ajax({type:"POST",url:"https://logs.dashlane.com/1/softwarelog/create",data:c,success:function(){++i.logExceptionsCount[e]
}})}catch(d){}},setCookiesForCoupons:function setCookiesForCoupons(a){throw"KWController.initOriginalsTabs must be implemented by browser"
},deleteCookiesForDomain:function deleteCookiesForDomain(a,b){throw"KWController.deleteCookiesForDomain must be implemented by browser"
},treatAuthStatus:function treatAuthStatus(b,a,d){var c=false;if(!this.userLoggedIn&&b){c=true;
if(KWController.isSafeSearchCapable()){KWController.retrieveSafeSearchRealState()
}}else{if(!b){c=true;KWWebUICache.clear();KWController.postMessageToPopover({action:"close"})
}}this.userLoggedIn=b;this.userLogin=a;this.lastLogin=d;this.updateToolbarButtonStyle(this.userLoggedIn);
if(c){if(this.userLoggedIn){KWTabsController.deleteToolbar()}KWTabsController.refreshStatusToolbar(this.userLoggedIn,this.userLogin)
}},switchBrowserMode:function switchBrowserMode(a,c,b){throw"KWController.switchBrowserMode must be implemented by browser"
},updateToolbarButtonStyle:function updateToolbarButtonStyle(a){throw"KWController.updateToolbarButtonStyle must be implemented by browser"
},changeLangage:function changeLangage(){},postMessageToPopover:function(a){throw"KWController.postMessageToPopover must be implemented by browser"
},askToLogin:function(c,a,e){if(KW__CONFIG.browser==KW__CONFIG.BROWSER_FIREFOX&&!KW__CONFIG.FIREFOX_JETPACK){var b=document.getElementById("dashlane-login-button");
if(b){if(b.getAttribute("status")=="update"){return}}}if(typeof(c)=="undefined"){c=false
}if(!this.userLoggedIn){KWTabsController.getCurrentTabId(function(f){KW__ORDER_SENDER.sendOrderToCpp({action:"askLoginPopup",status:"loggedout"},f,"fromExtensionToCpp")
})}else{if(c){var d={action:"askLogin",status:"logout"};if(typeof a!="undefined"){d.confirmation=a;
d.dontShowAgain=e||false}KW__ORDER_SENDER.sendOrderToCpp(d,KW__CONFIG.defaultTabId,"fromExtensionToCpp")
}}},autologinOnWebsite:function(a){this.openNewTabWithUrl(a)},goToApplication:function(){KW__ORDER_SENDER.sendOrderToCpp({action:"openApplicationKwift"},KW__CONFIG.defaultTabId,"fromExtensionToCpp")
},endOfPurchaseDebug:function endOfPurchaseDebug(){KWTabsController.getCurrentTabId(function(a){KWController.cppDebugCommand("EndOfPurchaseDebug",a)
})},endOfBuySuccessDebug:function endOfBuySuccessDebug(){KWTabsController.getCurrentTabId(function(a){KWController.cppDebugCommand("EndOfBuySucessDebug",a)
})},startOfPurchaseDebug:function startOfPurchaseDebug(){KWTabsController.getCurrentTabController(function(a){a.order.purchase.sendDeviceMessage("fingerPassed",true)
})},ctrlEnterPressed:function ctrlEnterPressed(){KWTabsController.getCurrentTabId(function(a){KWController.cppDebugCommand("CtrlEnter",a)
})},nextIsReviewOrderDebug:function nextIsReviewOrderDebug(){KWTabsController.getCurrentTabId(function(a){KWController.cppDebugCommand("NextIsReviewOrderDebug",a)
})},cppDebugCommand:function cppDebugCommand(b,a){if(typeof(a)=="undefined"){a=KW__CONFIG.defaultTabId
}KW__ORDER_SENDER.sendOrderToCpp({action:"debugCommand",command:b.toString()},a,"fromExtensionToCpp")
},_safeSearchCapable:false,signalSafeSearchCapability:function signalSafeSearchCapability(a){throw"KWController.signalSafeSearchCapability must be implemented by browser"
},isSafeSearchCapable:function isSafeSearchCapable(){return this._safeSearchCapable
},getSafeSearchState:function getSafeSearchState(a){throw"KWController.activateSafeSearch must be implemented by browser"
},activateSafeSearch:function activateSafeSearch(a){throw"KWController.activateSafeSearch must be implemented by browser"
},disableSafeSearch:function disableSafeSearch(a){throw"KWController.disableSafeSearch must be implemented by browser"
},retrieveSafeSearchRealState:function retrieveSafeSearchRealState(){this.getSafeSearchState(function(b){var a={action:"signalSafeSearchState",enabled:b.enabled,"default":b["default"]};
KW__ORDER_SENDER.sendOrderToCpp(a,KW__CONFIG.defaultTabId,"fromExtensionToCpp")})
},uninstallExtension:function uninstallExtension(){throw"KWController.uninstallExtension must be implemented by browser"
},setPluginCapabilities:function(a){this._pluginCapabilities=a},getPluginCapabilities:function(){return this._pluginCapabilities
},getWsInitMessage:function(){return JSON.stringify({wsExtensionInit:{capabilities:KW__CONFIG.capabilities}})
},activateWACReactivation:function activateWACReactivation(){throw"KWController.activateWACReactivation must be implemented by browser"
},deactivateWACReactivation:function deactivateWACReactivation(){throw"KWController.deactivateWACReactivation must be implemented by browser"
},handleWebAccountCreationReactivation:function handleWebAccountCreationReactivation(){if(KWStorage.get("webAccountCreation_started")!==true){return
}if(KWStorage.get("cppTalked")===true){KWController.sendInstallerLogOnce("49.5.4");
return}setTimeout(function(){if(KWStorage.get("cppTalked")===true){KWController.sendInstallerLogOnce("49.5.4");
return}KWController.sendInstallerLogOnce("49.5");KWController.wacReactivationMode=true;
KWController.activateWACReactivation();if(KWStorage.get("webAccountCreation_doNotShowReactivation")===true){return
}var a=KWStorage.get("webAccountCreation_numberTimesReactivationDisplayed")||0;if(a>2){KWController.sendInstallerLogOnce("49.5.8");
return}KWStorage.set("webAccountCreation_numberTimesReactivationDisplayed",a+1);if(KWStorage.get("webAccountCreation_AccountCreated")===true){KWController.sendInstallerLog("49.5.7");
KWController.openNewTabWithUrl("https://www.dashlane.com/"+_TR_.lang()+"/extension/no-application")
}else{KWController.sendInstallerLog("49.5.6");KWController.openNewTabWithUrl("https://www.dashlane.com/"+_TR_.lang()+"/extension/no-account")
}},5000)}};KWController.init=function init(){if(this.isWebstoreVersion()&&!this.platformInfosUpdated){return this.updatePlatformInfos(this.init.bind(this))
}this.quarantineMode=false;this.recoveryMode=false;this.recoveryModeDetails={};this.processWebAccountCreation();
this.initToolbarButtonHandlers();this.initOriginalsTabsFirstPart();this.initCommunication();
this.initOriginalsTabsSecondPart();this.initializeTabOpenCloseChangeHandlers();this.loadInstallerId();
this.disableBrowserAutofill();this.disableBrowserPasswordSaving();if(this.isNewVersion()){this.signalNewVersionStarted()
}this._safeSearchCapable=KWStorage.get("sscap")||false;if(KW__CONFIG.os===PLATFORM_OSX){if(true||!KWStorage.get("didMigrate")){this.handleOsxCwsMigration()
}else{KW__CONFIG.useWebsocketCom=true}}if(KW__ORDER_SENDER.initCommunication){KW__ORDER_SENDER.initCommunication()
}KW__ORDER_SENDER.sendOrderToCpp({action:"event",eventType:"INIT"},KW__CONFIG.defaultTabId,"fromExtensionToCpp");
try{KWWebSocketController.init()}catch(a){this.sendExceptionLog("init","KWController.chrome.js",0,a.toString())
}this.handleWebAccountCreationReactivation()};KWController.reinit=function reinit(){KWWebSocketController.clearBuffer();
this.quarantineMode=false;this.recoveryMode=false;this.recoveryModeDetails={};this.initOriginalsTabsFirstPart();
this.initOriginalsTabsSecondPart();KW__ORDER_SENDER.sendOrderToCpp({action:"event",eventType:"INIT"},KW__CONFIG.defaultTabId,"fromExtensionToCpp")
};KWController.getServerPortIfEmpty=function getServerPortIfEmpty(){if(!KW__CONFIG.serverPort){if(KWTabsController.registeredTabs.length>0){KW__SPECIAL_ORDERS.askForServerPort(KWTabsController.getCurrentTabId())
}else{var a=this;setTimeout(function(){a.getServerPortIfEmpty()},500)}}};(function(){var b=KWController.socketWorking;
KWController.socketWorking=function a(){if(KW__CONFIG.os===PLATFORM_WINDOWS&&this.isWebstoreVersion()){KW__CONFIG.useWebsocketCom=true;
KW__ORDER_SENDER.killNativeMessagingHost()}var c=this.waitForInitSocket;b.call(this);
if(KW__CONFIG.os===PLATFORM_WINDOWS&&this.isWebstoreVersion()){if(c){this.reinit()
}}}})();KWController.osxCwsInit=function osxCwsInit(){this.unloadRecoveryView();KWStorage.set("didMigrate","yess");
KW__CONFIG.useWebsocketCom=true};KWController._osxMigrationCwsSide=function(){chrome.management.get(KW__CONFIG.localId,function(b){if(chrome.runtime.lastError||!b){return this.osxCwsInit()
}this.loadRecoveryView("doubleExtension");var a=function(d){if(chrome.runtime.lastError){return
}KWStorage.set("didMigrate","yess");KW__CONFIG.useWebsocketCom=true}.bind(this);chrome.runtime.sendMessage(KW__CONFIG.localId,"doSuicide",a);
var c=function(f,e,d){if(e.id!==KW__CONFIG.localId){return}if(f==="doSuicide"){if(chrome.management&&chrome.management.uninstallSelf){return chrome.management.uninstallSelf({showConfirmDialog:false})
}else{if(chrome.management&&chrome.management.uninstall){if(chrome.runtime&&chrome.runtime.id){return chrome.management.uninstall(chrome.runtime.id)
}else{chrome.management.uninstall(KW__CONFIG.cwsId);chrome.management.uninstall(KW__CONFIG.cwsIdBeta)
}}}}}.bind(this);chrome.runtime.onMessageExternal.addListener(c)}.bind(this))};KWController._osxMigrationLocalSide=function(){var a=function(){this.openNewTabWithUrl(KW__CONFIG.osxCwsMigrationUrl);
chrome.runtime.onMessageExternal.addListener(d)}.bind(this);var c=null;var b=function(e){this.openNewTabWithUrl(KW__CONFIG.osxCwsMigrationUrl);
c=e.id}.bind(this);this.onKillCwsMessageReceived=function(){chrome.runtime.sendMessage(c,"doSuicide");
chrome.runtime.onMessageExternal.addListener(d)};var d=function(g,f,e){if(f.id!==KW__CONFIG.cwsId&&f.id!==KW__CONFIG.cwsIdBeta){return
}if(g!=="doSuicide"){return}e("goForIt!!");return chrome.management.uninstallSelf({showConfirmDialog:false})
}.bind(this);chrome.management.get(KW__CONFIG.cwsId,function(e){if(!chrome.runtime.lastError&&e){return b(e)
}chrome.management.get(KW__CONFIG.cwsIdBeta,function(f){if(!chrome.runtime.lastError&&f){return b(f)
}return a()})})};KWController.handleOsxCwsMigration=function handleOsxCwsMigration(){if(KW__CONFIG.os!==PLATFORM_OSX){return
}if(!chrome.management){return}if(this.isWebstoreVersion()){return this._osxMigrationCwsSide()
}else{return this._osxMigrationLocalSide()}};KWController.processWebAccountCreation=function processWebAccountCreation(){var d="*://*.dashlane.com/*?*postinstall-focus*";
var f=function(h,g){if(h.length===0){throw new Error("Assertion error")}chrome.windows.getCurrent(function(j){var k=j.id;
var i=h.filter(function(l){return l.windowId===k});g(i[0]||h[0])})};var e=function(g){chrome.tabs.query({url:d},function(h){if(h.length===0){return g()
}f(h,g)})};var c=function(g){if(!g.id){return}KWController.executeScriptInTab(g,'window.dashlaneExtensionInstalled = true;typeof window.onDashlaneExtensionInstall === "function" && window.onDashlaneExtensionInstall();')
};var b=function(){var g="https://chrome.google.com/webstore/*/"+chrome.runtime.id;
chrome.tabs.query({url:g},function(h){if(h.length===0){return}if(h.length>1){return
}chrome.tabs.remove(h[0].id)})};var a=function(g){if(!g.id){return}chrome.tabs.update(g.id,{active:true});
chrome.windows.update(g.windowId,{focused:true})};chrome.runtime.onInstalled.addListener(function(g){if(g.reason!=="install"){return
}e(function(h){if(!h){return}c(h);b();a(h)})})};KWController.isNewVersion=function isNewVersion(){var a=KWStorage.get("kwCurrentVersion");
return a!==KW__CONFIG.build};KWController.isWebstoreVersion=function isWebstoreVersion(){return KW__CONFIG.builtForCws
};KWController.signalNewVersionStarted=function signalNewVersionStarted(){KWStorage.set("kwCurrentVersion",KW__CONFIG.build);
this.sendInstallerLog("24.91")};KWController.initializeTabOpenCloseChangeHandlers=function initializeTabOpenCloseChangeHandlers(){chrome.tabs.onCreated.addListener(function(a){KWController.onTabOpen(a)
});chrome.tabs.onRemoved.addListener(function(b,a){KWController.onTabClose(KWTabsController.getControllerById(b))
});chrome.tabs.onSelectionChanged.addListener(function(a,b){KWController.onTabSelect(KWTabsController.getControllerById(a))
});chrome.tabs.onUpdated.addListener(function(a,c,b){var d=KWTabsController.getControllerById(a);
if(d===null){return}d.updateTab(b);if(c.status==="complete"){if(!d){}else{d.loadCompleteEnds()
}}else{if(c.status==="loading"){if(!d){}else{d.loadWorkableEnds()}}}})};KWController.initToolbarButtonHandlers=function initToolbarButtonHandlers(){chrome.browserAction.onClicked.addListener(function(a){KWController.askToLogin()
})};KWController.uninstallExtension=function uninstallExtension(){if(this.isWebstoreVersion()&&KW__CONFIG.debugMode!==DEBUG_CPP){KWController.disableSafeSearch(function(b){if(b){KW__ORDER_SENDER.sendOrderToCpp({action:"signalSafeSearchDisabled",from:"extensionUninstall"},KW__CONFIG.defaultTabId,"fromExtensionToCpp");
KWController.openNewTabWithUrl("https://www.dashlane.com/safesearch_uninstalled")
}return chrome.management.uninstallSelf({showConfirmDialog:true})},"web")}var a={action:"uninstallExtension"};
KW__ORDER_SENDER.sendOrderToCpp(a,KW__CONFIG.defaultTabId,"fromExtensionToCpp")};
KWController.updatePlatformInfos=function updatePlatformInfos(c){try{if(KWStorage.get("cachedPlatform")){KW__CONFIG.os=KWStorage.get("cachedPlatform");
this.platformInfosUpdated=true;return c()}if(chrome.runtime&&chrome.runtime.getPlatformInfo){return chrome.runtime.getPlatformInfo(function(e){if(e.os==="win"){KW__CONFIG.os=PLATFORM_WINDOWS
}else{if(e.os==="mac"){KW__CONFIG.os=PLATFORM_OSX}else{if(e.os==="linux"){KW__CONFIG.os=PLATFORM_LINUX
}}}this.platformInfosUpdated=true;KWStorage.set("cachedPlatform",KW__CONFIG.os);c()
}.bind(this))}else{var a=window.navigator.appVersion;if(a.indexOf("Win")>-1){KW__CONFIG.os=PLATFORM_WINDOWS
}else{if(a.indexOf("Mac")>-1){KW__CONFIG.os=PLATFORM_OSX}else{if(a.indexOf("X11")>-1||a.indexOf("Linux")>-1){KW__CONFIG.os=PLATFORM_LINUX
}else{var d="Could not determine platform infos.";this.sendExceptionLog("updatePlatformInfos","KWController.chrome.js",0,d,"",false,a);
KW__CONFIG.os=PLATFORM_WINDOWS}}}this.platformInfosUpdated=true;KWStorage.set("cachedPlatform",KW__CONFIG.os);
return c()}}catch(b){var d="Could not determine platform infos.";this.sendExceptionLog("updatePlatformInfos","KWController.chrome.js",0,d,"",false,a);
this.platformInfosUpdated=true;return c()}};KWController.onTabOpen=function onTabOpen(a){var b=KWTabsController.getControllerById(a.id);
if(b===null){b=new KWTabController(a.id,a)}b.open()};KWController.onTabClose=function onTabClose(a){if(a===null){return
}a.catchBeforeUnloadEvent(0,0,true);a.catchUnloadEvent();a.close()};KWController.onTabSelect=function onTabSelect(a){if(a===null){return
}KWTabsController.previousSelectedTabBecomeInactive(a);KWTabsController.newSelectedTabBecomeActive(a)
};KWController.onLoadCompleted=function onLoadCompleted(a){if(a===null){return}a.documentCompleteReceived(true)
};KWController.initOriginalsTabsFirstPart=function initOriginalsTabsFirstPart(){chrome.tabs.query({},function(b){for(var a=0;
a<b.length;a++){var c=b[a];new KWTabController(c.id,c).open()}})};KWController.initOriginalsTabsSecondPart=function initOriginalsTabsSecondPart(){var b=this.isNewVersion();
var a=this;chrome.tabs.query({},function(d){for(var c=0;c<d.length;c++){var e=d[c];
if(e.status==="complete"){var f=KWTabsController.getControllerById(e.id);if(f){f.documentCompleteReceived(true)
}}}if(d.length>0&&b){a.checkScriptInjectionOnTabs()}})};KWController.checkScriptInjectionOnTabs=function checkScriptInjectionOnTabs(){for(var c=0,a=KWTabsController.registeredTabs.length;
c<a;++c){var d=KWTabsController.registeredTabs[c];if(!d.scriptInjectedOnThePage){if(KW__DEBUG.general){KW__log("TabId: "+d.tabId+" - Manually injecting script since it was not done on launch.",1)
}if(d.tabPanel.url.match("^chrome://")!==null||d.tabPanel.url.match("^http[s]*://chrome.google.com/webstore")!==null){continue
}try{chrome.tabs.executeScript(d.tabId,{file:"content/contentScripts/kwift.CHROME.min.js",allFrames:true,runAt:"document_start"})
}catch(b){}}}};KWController.setCookiesForCoupons=function setCookiesForCoupons(c){try{console.log(c);
var h=c.content;h=JSON.parse(h);var a=h.Url;var l=h.Cookies;var k=function(i){console.error(i);
if(!i){console.error("Error in setting cookie");console.error(chrome.extension.lastError)
}};for(var d=0,e=l.length;d<e;d++){var b=l[d];var g={url:a};if(b.name){g.name=b.name
}if(b.value){g.value=b.value}if(b.domain){g.domain=b.domain}if(b.path){g.path=b.path
}if(b.secure){g.secure=(b.secure===true||b.secure==="true")?true:false}if(b.httpOnly){g.httpOnly=(b.httpOnly===true||b.httpOnly==="true")?true:false
}if(b.expirationDate){var f=parseInt(b.expirationDate,10);if(f>0){g.expirationDate=f
}}console.log(g);chrome.cookies.set(g,k)}}catch(j){console.warn("Error in setting cookie");
console.warn(chrome.extension.lastError)}};KWController.deleteCookiesForDomain=function(c,d){var b=this;
var a=function(j){for(var h=0,e=j.length;h<e;++h){var g=j[h];var f="http"+(g.secure?"s":"")+"://";
f+=(g.domain.charAt(0)==="."?"www":"")+g.domain+g.path;chrome.cookies.remove({url:f,name:g.name})
}d()};chrome.cookies.getAll({domain:c},a)};KWController.changeLangage=function(){if(KWController.popupPort){try{KWController.popupPort.postMessage({type:"changeLangage",lang:KW__CONFIG.selectedLanguage.substr(0,2)});
KWController.popupPort.postMessage({type:"restoreState",data:KW__CONFIG.popoverState})
}catch(a){}}};KWController.loadRecoveryView=function(b,a){if(this.recoveryMode&&this.recoveryModeDetails&&this.recoveryModeDetails.reason==="doubleExtension"){return
}if(KW__DEBUG.general){KW__log("RECOVERY: "+b,0)}chrome.browserAction.setIcon({path:{"19":"skin/icon/icon_update.png","38":"skin/icon/icon_update@2x.png"}});
chrome.browserAction.setBadgeText({text:""});chrome.browserAction.setPopup({popup:"popup_rich.html"});
if(a===undefined){a="other";if(/mac/gi.test(navigator.userAgent)){a="mac"}else{if(/win/gi.test(navigator.userAgent)){a="win"
}}}this.recoveryMode=true;this.recoveryModeDetails={reason:b,platform:a};if(KWController.popupPort){KWController.postMessageToPopover({action:"loadRecoveryView",reason:b,platform:a})
}};KWController.unloadRecoveryView=function(){this.recoveryMode=false;this.updateToolbarButtonStyle(this.userLoggedIn)
};KWController.postMessageToPopover=function(b,c){if(this.quarantineMode){return}if(c===undefined){c=0
}else{if(c>10){if(KW__DEBUG.general){KW__log("KWController.postMessageToPopover FAILED ["+c+"]: "+b.action,0)
}return}}if(KWController.popupPort){if(this.recoveryMode&&b.action=="popover_signalDataRefresh"){this.unloadRecoveryView()
}try{b.type=b.action;KWController.popupPort.postMessage(b)}catch(a){}}else{setTimeout(function(){KWController.postMessageToPopover(b,++c)
},50)}};var _GLOBAL_BROWSER_MODE_TEXT1="";var _GLOBAL_BROWSER_MODE_TEXT2="";KWController.refreshBrowserMode=function(){if(KWController.popupPort){try{KWController.popupPort.postMessage({type:"switchBrowserMode",text1:_GLOBAL_BROWSER_MODE_TEXT1,text2:_GLOBAL_BROWSER_MODE_TEXT2})
}catch(a){}}};KWController.switchBrowserMode=function switchBrowserMode(b,d,c){this.quarantineMode=true;
_GLOBAL_BROWSER_MODE_TEXT1=d;_GLOBAL_BROWSER_MODE_TEXT2=c;chrome.browserAction.setIcon({path:{"19":"skin/icon/icon_update.png","38":"skin/icon/icon_update@2x.png"}});
chrome.browserAction.setBadgeText({text:""});chrome.browserAction.setTitle({title:d});
chrome.browserAction.setPopup({popup:"popup_update.html"});if(KWController.popupPort){try{KWController.popupPort.postMessage({type:"switchBrowserMode",text1:d,text2:c})
}catch(a){}}};KWController.updateToolbarButtonStyle=function updateToolbarButtonStyle(a){if(this.quarantineMode){return
}if(KWController.popupPort){try{KWController.popupPort.postMessage({type:"loginsLists",userLoggedIn:KWController.userLoggedIn,logins:KWController.authUsers,userLogin:KWController.userLogin,lastLogin:KWController.lastLogin})
}catch(b){}}if(a){chrome.browserAction.setIcon({path:{"19":"skin/icon/icon_active.png","38":"skin/icon/icon_active@2x.png"}});
chrome.browserAction.setBadgeText({text:""});chrome.browserAction.setTitle({title:"Dashlane"});
chrome.browserAction.setPopup({popup:"popup_rich.html"})}else{chrome.browserAction.setIcon({path:{"19":"skin/icon/icon_unactive.png","38":"skin/icon/icon_unactive@2x.png"}});
chrome.browserAction.setBadgeText({text:""});chrome.browserAction.setTitle({title:"Dashlane"});
chrome.browserAction.setPopup({popup:""})}};KWController.openNewTabWithUrl=function openNewTabWithUrl(a){chrome.tabs.create({url:a})
};KWController.openCurrentTabWithUrl=function(a){KWTabsController.getCurrentTabController(function(c){if(c){var b=c.getTab();
chrome.tabs.update(b.id,{url:a})}})};KWController.removeTab=function removeTab(a){chrome.tabs.remove(a)
};KWController.openFeedbackWindow=function(){var a=KWTabsController.getCurrentTabController(function(b){if(b===null){}});
if(a){a.runFeedbackWindow()}};KWController.disableBrowserAutofill=function(){if(!this.isNewVersion()){return
}try{chrome.privacy.services.autofillEnabled.get({},function(c){if(c.levelOfControl==="controllable_by_this_extension"){try{chrome.privacy.services.autofillEnabled.set({value:false},function(){if(chrome.extension.lastError!==undefined){if(KW__DEBUG.general){KW__log("Error while disabling autofill: "+chrome.extension.lastError,0)
}}})}catch(b){if(KW__DEBUG.general){KW__log("Exception raised by autofillEnabled setter: "+b,0)
}}}else{if(KW__DEBUG.general){KW__log("Unsufficient control level to change autofill setting",0)
}}})}catch(a){if(KW__DEBUG.general){KW__log("Exception raised by autofillEnabled getter: "+a,0)
}}};KWController.disableBrowserPasswordSaving=function(){if(KWStorage.get("kwCurrentVersion")!==null&&KWStorage.get("disabledPasswordSave")!==null){return
}if(!chrome.privacy.services.hasOwnProperty("passwordSavingEnabled")){return}KWStorage.set("disabledPasswordSave","yes");
try{chrome.privacy.services.passwordSavingEnabled.get({},function(c){if(c.levelOfControl==="controllable_by_this_extension"){try{chrome.privacy.services.passwordSavingEnabled.set({value:false},function(){if(chrome.extension.lastError!==undefined){if(KW__DEBUG.general){KW__log("Error while disabling autofill: "+chrome.extension.lastError,0)
}}})}catch(b){if(KW__DEBUG.general){KW__log("Exception raised by passwordSavingEnabled setter: "+b,0)
}}}else{if(KW__DEBUG.general){KW__log("Unsufficient control level to change autofill setting",0)
}}})}catch(a){if(KW__DEBUG.general){KW__log("Exception raised by passwordSavingEnabled getter: "+a,0)
}}};KWController.executeScriptInTab=function(b,a){var c=function(f){var d={"\\":"\\\\",'"':'\\"',"'":"\\'","\n":"\\n","\r":"\\r","\u2028":"\\u2028","\u2029":"\\u2029"};
var e=new RegExp("["+Object.keys(d).join("")+"]","g");return f.replace(e,function(g){return d[g]
})};if(!b.id){throw new Error("A tab with an id expected")}chrome.tabs.executeScript(b.id,{code:"var s = document.createElement('script');s.textContent = '"+c(a)+"';document.head.appendChild(s);"})
};KWController.initCommunication=function initCommunication(){try{var b=function(d){if(d.name==="popup_update"){if(KWController.popupPort){if(KWController.popupPort.callback){KWController.popupPort.onDisconnect.removeListener(KWController.popupPort.callback)
}delete KWController.popupPort}KWController.popupPort=d;KWController.refreshBrowserMode();
KWController.popupPort.callback=function(i){delete KWController.popupPort};KWController.popupPort.onDisconnect.addListener(KWController.popupPort.callback)
}if(d.name.indexOf("wui_")===0){var j=KWTabsController.getControllerById(d.sender.tab.id);
if(j){j.initWebUICommunication(d)}}else{if(d.name==="popup"){if(KWController.popupPort){if(KWController.popupPort.callback){KWController.popupPort.onDisconnect.removeListener(KWController.popupPort.callback)
}delete KWController.popupPort}KWController.popupPort=d;KWController.changeLangage();
KWController.popupPort.callback=function(i){delete KWController.popupPort};KWController.popupPort.onDisconnect.addListener(KWController.popupPort.callback);
d.postMessage({type:"loginsLists",userLoggedIn:KWController.userLoggedIn,logins:KWController.authUsers,userLogin:KWController.userLogin,lastLogin:KWController.lastLogin});
d.onMessage.addListener(function(m){var l;switch(m.action){case"login":case"logout":KWController.askToLogin(true,m.confirmation,m.dontShowAgain);
break;case"openApp":KWController.goToApplication();break;case"invite":l={action:"popover_askForInviteYourFriends"};
KW__ORDER_SENDER.sendOrderToCpp(l,KW__CONFIG.defaultTabId,"fromExtensionToCpp");break;
case"feedback":var i="https://www.dashlane.com/"+_TR_.lang()+"/support";KWController.openNewTabWithUrl(i);
break;case"download":var i="https://www.dashlane.com/"+_TR_.lang()+"/download";KWController.openNewTabWithUrl(i);
break;case"support":var i=m.URL?m.URL:"https://www.dashlane.com/"+_TR_.lang()+"/support";
KWController.openNewTabWithUrl(i);break;case"refresh":d.postMessage({type:"loginsLists",userLoggedIn:KWController.userLoggedIn,logins:KWController.authUsers,userLogin:KWController.userLogin,lastLogin:KWController.lastLogin});
break;case"refreshTranslations":KWController.changeLangage();break;case"saveState":KW__CONFIG.popoverState=m.data;
break;case"endGettingStarted":l={action:"popover_askForEndGettingStarted"};KWTabsController.getCurrentTabId(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n,"fromExtensionToCpp")
});break;case"usageLog":l={action:"popover_usageLog",service:m.service,type:m.type,details:m.details};
KWTabsController.getCurrentTabId(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n,"fromExtensionToCpp")
});break;case"initialData":l={action:"popover_askForInitialData"};KWTabsController.getCurrentTabId(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n,"fromExtensionToCpp")
});if(KWController.recoveryMode===true){if(KWController.popupPort){KWController.postMessageToPopover({action:"loadRecoveryView",reason:KWController.recoveryModeDetails.reason,platform:KWController.recoveryModeDetails.platform})
}}if(!KW__DEBUG.linkWithCpp){return;setTimeout(function(){var n=Math.floor(Math.random()*20);
if(n===0){KWController.postMessageToPopover({action:"popover_signalDataRefresh",error:"unauthentified"})
}else{if(n==1){KWController.postMessageToPopover({action:"popover_signalDataRefresh",error:"unknown"})
}}KWController.postMessageToPopover({action:"popover_signalDataRefresh",data:{authentifiants:[{Domain:"facebook.com",Authentifiants:[{Url:"https://www.facebook.com",Email:"test@test.com",Login:"",Category:"{0002}",NumberUse:"1",LastUse:"4"},{Url:"https://www.facebook.com",Email:"",Login:"toto",Category:"{0001}",NumberUse:"2",LastUse:"3"}],DefaultId:""},{Domain:"dashlane.com",Authentifiants:[{Url:"https://www.dashlane.com/features",Email:"dupond@test.com",Login:"",Category:"",NumberUse:"3",LastUse:"2"},{Url:"https://www.dashlane.com/blog",Email:"jean@test.com",Login:"",Category:"{0002}",NumberUse:"4",LastUse:"1"}],DefaultId:""},{Domain:"dashlaneskdfkdsfkdjskfjskdfjkfdsjsf.com",Authentifiants:[{Url:"https://www.dashlaneskdfkdsfkdjskfjskdfjkfdsjsf.com/blog",Email:"jean@teskdsjfksjdgkjdfkgjdkjgdkt.com",Login:"",Category:"{0002}",NumberUse:"4",LastUse:"1"}],DefaultId:""}],authCategories:[{Id:"{0001}",CategoryName:"Shopping"},{Id:"{0002}",CategoryName:"Social"}],websites:[{Title:"facebook.com",Url:"facebook.com",Domain:"facebook.com",Icon:"{0F359609-135C-4A8B-B01E-7AFBB69894B0}.png"},{Title:"dashlane.com",Url:"dashlane.com",Domain:"dashlane.com",Icon:"{724B3948-D165-4E3F-B8A1-C28403EA4AD3}.png"},{Title:"dashlaneskdfkdsfkdjskfjskdfjkfdsjsf.com",Url:"dashlaneskdfkdsfkdjskfjskdfjkfdsjsf.com",Domain:"dashlaneskdfkdsfkdjskfjskdfjkfdsjsf.com",Icon:"{724B3948-D165-4E3F-B8A1-C28403EA4AD3}.png"}],gettingStarted:false,sorting:"lastused",server:"http://127.0.0.1:80",website:{disabledOnPage:false,disabledOnDomain:true,domain:"www.amazon.com"},generatePassword:true,generator:{digits:true,letters:true,symbols:true,pronounceable:false,size:12}}})
},400)}break;case"openCredential":case"openCredentialCourier":l={action:"popover_askForOpenCredential",identifier:m.identifier,courier:(m.action=="openCredentialCourier")};
KW__ORDER_SENDER.sendOrderToCpp(l,KW__CONFIG.defaultTabId,"fromExtensionToCpp");break;
case"autologinCredential":l={action:"popover_askForAutologin",identifier:m.identifier};
KW__ORDER_SENDER.sendOrderToCpp(l,KW__CONFIG.defaultTabId,"fromExtensionToCpp");break;
case"openUrl":if(m.url){KWController.openNewTabWithUrl(m.url)}break;case"generatePassword":l={action:"popover_askForGeneratePassword",size:m.size,digits:m.digits,letters:m.letters,symbols:m.symbols,pronounceable:m.pronounceable};
KWTabsController.getCurrentTabId(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n,"fromExtensionToCpp")
});if(!KW__DEBUG.linkWithCpp){setTimeout(function(){var n=Math.floor(Math.random()*10);
var o=Math.floor(Math.random()*100);if(n===0){KWController.postMessageToPopover({action:"popover_signalPasswordGenerated",error:"unknown"})
}else{KWController.postMessageToPopover({action:"popover_signalPasswordGenerated",data:{password:o+"-DEBUG-"+o+"234567890123456789",strength:o}})
}},400)}break;case"copyPassword":l={action:"popover_askForCopyPassword",password:m.password};
KWTabsController.getCurrentTabId(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n,"fromExtensionToCpp")
});break;case"fillPassword":l={action:"popover_askForFillPassword",password:m.password};
KWTabsController.getCurrentTabId(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n,"fromExtensionToCpp")
});break;case"saveDefaults":l={action:"popover_askForGeneratorSaveDefaults",digits:m.digits,letters:m.letters,symbols:m.symbols,pronounceable:m.pronounceable,size:m.size};
KWTabsController.getCurrentTabId(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n,"fromExtensionToCpp")
});break;case"disableOnDomain":l={action:"popover_askForDisableOnDomain"};KWTabsController.getCurrentTabController(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n.tabId,"fromExtensionToCpp")
});break;case"disableOnPage":l={action:"popover_askForDisableOnPage"};KWTabsController.getCurrentTabController(function(n){KW__ORDER_SENDER.sendOrderToCpp(l,n.tabId,"fromExtensionToCpp")
});break;case"reportAutofillIssue":chrome.tabs.query({active:true,currentWindow:true},function(n){var o={url:n[0].url,type:m.type,description:m.description};
if(!m.detailled){return KWController.logAutofillIssue(o)}chrome.tabs.captureVisibleTab(null,{},function(p){o.screenshot=p;
chrome.pageCapture.saveAsMHTML({tabId:n[0].id},function(r){var q=new window.FileReader();
q.readAsBinaryString(r);q.onloadend=function(){o.pageDump=q.result;return KWController.logAutofillIssue(o)
}})})});break;case"uninstallExtension":return KWController.uninstallExtension();case"toggleSafeSearch":KWController.getSafeSearchState(function(n){if(n.enabled){KWController.disableSafeSearch(function(p){},"extension")
}else{var o=KW__CONFIG.selectedLanguage.substr(0,2);KWController.openNewTabWithUrl("http://www.dashlane.com/"+o+"/safesearch_activate?from=extension&uid="+KWController.getInstallerId())
}});break;default:}})}else{if(d.sender.tab&&d.sender.tab.id){if(KWController.recoveryMode===true){return d.postMessage("quarantine_mode")
}var e=d.sender.tab.id;var g={action:"controlMessageToWebpage",demand:"tabBecomeKey"};
var j=KWTabsController.getControllerById(e);if(j===null){if(d.name==="fromInjectedTo"){j=new KWTabController(e,d.sender.tab);
j.open();j.initCommunicationChannel(d);j.sendDocumentComplete();if(j.tabActive){j.sendOrderToAllFrames(g)
}}else{}return}else{if(d.name==="fromInjectedTo"){j.tabPanel=d.sender.tab;j.initCommunicationChannel(d);
if(!j.documentCompleteSent){j.sendDocumentComplete()}if(j.tabActive){j.sendOrderToAllFrames(g)
}}else{var k=d.name.split("_kw_");if(k.length<3){return}var h={frameUniqueId:k[0],frameUrl:k[1],frameName:k[2]};
var c;for(var f=0;f<j._frames.length;f++){c=j._frames[f];if(h.frameUniqueId===c.frameUniqueId){c.setInformations(h);
c.initCommunicationChannel(d);if(j.tabActive){d.postMessage(KWOrdersParser.treatOrder(g))
}return}}c=new KWFrameController(j,null,true);c.setInformations(h);c.initCommunicationChannel(d);
j._frames.push(c);if(j.tabActive){d.postMessage(KWOrdersParser.treatOrder(g))}}}}}}};
chrome.extension.onConnect.addListener(b)}catch(a){if(KW__DEBUG.general){KW__log("KWController.initCommunication: "+a,1)
}}};KWController.signalSafeSearchCapability=function(a){if(a&&this._safeSearchCapable!==a){this.retrieveSafeSearchRealState()
}this._safeSearchCapable=a;KWStorage.set("sscap",a)};KWController.getSafeSearchState=function(a){chrome.management.get(KW__CONFIG.safeSearchId35,function(b){if(chrome.runtime.lastError){return chrome.management.get(KW__CONFIG.safeSearchId,function(c){return a({enabled:!chrome.runtime.lastError&&c.enabled,"default":!chrome.runtime.lastError&&c.enabled})
})}return a({enabled:b.enabled,"default":b.enabled})})};KWController.activateSafeSearch=function(a){return a({})
};KWController.disableSafeSearch=function(b,a){if(a=="web"){chrome.management.uninstall(KW__CONFIG.safeSearchId35,{showConfirmDialog:true},function(){if(chrome.runtime.lastError){chrome.management.uninstall(KW__CONFIG.safeSearchId,{showConfirmDialog:true},function(){if(chrome.runtime.lastError){return b(false)
}if(KWStorage.get("searchedFromOmni")){KWStorage.set("searchedFromOmni",null)}return b(true)
})}else{if(KWStorage.get("searchedFromOmni")){KWStorage.set("searchedFromOmni",null)
}return b(true)}})}else{KWController.openNewTabWithUrl("https://www.dashlane.com/safesearch_uninstall?from="+a)
}};KWController.signalSafeSearchFromOmnibox=function(a){if(KWStorage.get("searchedFromOmni")){return
}KW__ORDER_SENDER.sendOrderToJs({action:"showSafeSearchArrow"},a,"fromExtensionToInjectedJs");
KWStorage.set("searchedFromOmni",true)};KWController.activateWACReactivation=function(a){chrome.browserAction.setIcon({path:{"19":"skin/icon/icon_update.png","38":"skin/icon/icon_update@2x.png"}});
this.wacReactivationListener=function(){KWController.sendInstallerLog("49.5.5");if(KWStorage.get("webAccountCreation_AccountCreated")===true){KWController.sendInstallerLog("49.5.7");
KWController.openNewTabWithUrl("https://www.dashlane.com/"+_TR_.lang()+"/extension/no-application")
}else{KWController.sendInstallerLog("49.5.6");KWController.openNewTabWithUrl("https://www.dashlane.com/"+_TR_.lang()+"/extension/no-account")
}};chrome.browserAction.onClicked.addListener(this.wacReactivationListener)};KWController.deactivateWACReactivation=function(a){if(this.wacReactivationListener){chrome.browserAction.onClicked.removeListener(this.wacReactivationListener)
}};setInterval(function(){if(KWController.recoveryMode===true){return}KWTabsController.getCurrentTabController(function(a){if(a&&a.activateDOMNodeInsertedEvents){a.activateDOMNodeInsertedEvents()
}})},2000);var KWFrameController=function(e,d,f){var c=this;this.tabController=e;
this.frameObject=d;this._bufferedDOMInformations=false;this._scriptInjected=false;
this._mustInjectScript=f;this.getDomWindow=function b(){return this.frameObject};
this.getDomDocument=function g(){return this.frameObject.document};this.initialize=function a(){this.initCommunicationChannel();
this.initUnloadEvent();this.initBeforeUnloadEvent()};this.initialize()};KWFrameController.prototype.destruct=function destruct(){};
KWFrameController.prototype.dispatchMessage=function dispatchMessage(c){try{var d=KWOrdersParser.splitMessage(c);
var a=this;KW$.each(d,function(e,f){if(f!==""){a.dispatchOrder(f)}})}catch(b){if(KW__DEBUG.general){KW__log("dispatchMessage :\n"+dumpErr(b),1)
}}};KWFrameController.prototype.dispatchOrder=function dispatchOrder(c){try{var a=KW__ORDER_DISPATCHER.getOrderFromMessage(c);
var d=KW__ORDER_DISPATCHER.getActionFromOrder(a);if(this.isNormalDispatchOrder(d,a)){KW__ORDER_DISPATCHER.dispatchOrder(c,this.tabController.tabId);
return}else{if(this.isNoDispatchOrder(d,a)){return}}KWKwiftDebugger.logOrder(d+" (frame)",c,"fromInjectedJsToExtension");
switch(d){case"purchaseMessageFromWebpage":return;case"domNodeInserted":if(this.tabController.domNodeInsertEventActive&&this.tabController.documentCompleteSent){this.tabController.sendLoadEventToCpp("DOM_NODE_INSERTED",false)
}else{if(KW__DEBUG.general){KW__log("domNodeInserted received but not forwarded: domNodeInsertedActive = "+this.tabController.domNodeInsertEventActive+", documentCompleteSent = "+this.tabController.documentCompleteSent,3)
}}break;case"DOMInformations":case"signalNewDOMInformations":if(this._bufferedDOMInformations==a.domStructure){return
}this._bufferedDOMInformations=a.domStructure;if(this.tabController.isWaitingForAnyDOMInformations()){}else{this.tabController.sendNewDOMInformationsFromFrame("signalAjaxDOMInformations")
}return;case"signalAjaxDOMInformations":case"signalCssDOMInformations":if(this._bufferedDOMInformations==a.domStructure){return
}this._bufferedDOMInformations=a.domStructure;this.tabController.sendNewDOMInformationsFromFrame(d);
return;default:if(KW__DEBUG.general){KW__log("dispatchOrder (frame) order type not treated: "+d,1)
}return}}catch(b){if(KW__DEBUG.general){KW__log("dispatchOrder (frame) :\n"+dumpErr(b),1)
}}};KWFrameController.prototype.isNormalDispatchOrder=function isNormalDispatchOrder(c,a){try{switch(c){case"logOnline":case"oneClickDebuggerOrder":return true;
case"getDescriptionsForAutoFill":case"focusDescriptionsForAutoFill":case"blurDescriptionsForAutoFill":case"valueDescriptionsForAutoFill":case"autoFillForm":case"changeDefaultAndAutoFillForm":case"eventOnOutFired":case"signalXPathListForBasket":case"signalContextDebugInfo":return true;
case"purchaseMessageFromWebpage":return(a.demand=="askIfWantsToBuyClicked");default:if(c.indexOf("DashlaneAPIRequest_")===0){return true
}return false}}catch(b){if(KW__DEBUG.general){KW__log("isNormalDispatchOrder (frame) :\n"+dumpErr(b),1)
}return false}};KWFrameController.prototype.isNoDispatchOrder=function(b,a){switch(b){case"documentComplete":case"signalStructurePerformance":return true
}return false};KWFrameController.prototype.isForbiddenInjectionInFrame=function(){var d=this.getDomWindow();
if(d&&d.location&&d.location.href){var b=d.location.href;var a=["//platform.twitter.com/widgets/","//www.facebook.com/plugins/","//plusone.google.com/_/+1/"];
for(var c=0;c<a.length;c++){if(b.indexOf(a[c])!==-1){return true}}}return false};
KWFrameController.prototype.catchLoadEvent=function(a){if(KW__DEBUG.general){KW__log("catchLoadEvent (frame) called. Reload injected script: "+this._scriptInjected,3)
}this._scriptInjected=true;this.tabController.loadFrameScript(this);this.initCommunicationChannel();
this.initUnloadEvent();this.initBeforeUnloadEvent()};KWFrameController.prototype.catchUnloadEvent=function(a){if(KW__DEBUG.general){KW__log("catchUnloadEvent (frame) called",3)
}this._bufferedDOMInformations=false;this._scriptInjected=false};KWFrameController.prototype.catchBeforeUnloadEvent=function(a){if(KW__DEBUG.general){KW__log("catchBeforeUnloadEvent (frame) called",3)
}};KWFrameController.prototype.setUID=function setUID(a){this.uID=a};KWFrameController.prototype.setInformations=function setInformations(a){this.frameUniqueId=a.frameUniqueId;
this.url=a.frameUrl;this.name=a.frameName};KWFrameController.prototype.setFramePosition=function setFramePosition(c){this.framePosition=c;
if(this.bufferedMessagesUntilPositionFound===undefined){return}tmpBufferedMessagesUntilPositionFound=this.bufferedMessagesUntilPositionFound;
this.bufferedMessagesUntilPositionFound=undefined;for(var b=0,a=tmpBufferedMessagesUntilPositionFound.length;
b<a;b++){this.dispatchMessage(tmpBufferedMessagesUntilPositionFound[b])}};KWFrameController.prototype.couldBeThatFrame=function couldBeThatFrame(a){if(this.kwframeid&&this.kwframeid!=="denied"&&this.kwframeid!=="unset"){return this.kwframeid===a.kwframeid
}return((this.url&&this.url!==""&&this.url===a.frameUrl)||(this.name&&this.name!==""&&this.name===a.frameName))
};KWFrameController.prototype.initCommunicationChannel=function initCommunicationChannel(b){if(!b){return
}try{if(this.port){delete this.port}this.port=b;if(this.bufferedMessagesUntilPositionFound===undefined){this.bufferedMessagesUntilPositionFound=[]
}var a=this;this.port.postMessage("tab_initialized");this.port.onMessage.addListener(function(d){if(d.type&&d.type==="kwFrameIdKnown"){a.kwframeid=d.kwframeid;
return}a.dispatchMessage(d)});this.port.onDisconnect.addListener(function(e){a.framePosition=undefined;
for(var d=0;d<a.tabController._frames.length;d++){if(a.frameUniqueId===a.tabController._frames[d].frameUniqueId){a.tabController._frames.splice(d,1);
break}}})}catch(c){if(KW__DEBUG.general){KW__log("initCommunicationChannel frame :\n"+dumpErr(c),0)
}}};KWFrameController.prototype.initLoadEvent=function(){return};KWFrameController.prototype.initUnloadEvent=function(){return
};KWFrameController.prototype.initBeforeUnloadEvent=function(){return};var KWPurchaseController=function(c){var b=this;
this.tabController=c;this._purchaseProcedureInProgress=false;this.screen={current:"nothing",set:function(f,g,e){this.current=f
},change:function(f,e){if(f==this.current){switch(f){case"buyInformation":case"buyProcedure":case"buyConfirmation":this.set("buyProcedure");
b.purchaseProcedureInProgress(f=="buyProcedure");break;case"nothing":this.set(f);
break;default:}}else{switch(f){case"askLogin":case"askIfWantsToBuy":case"buyFinished":this.set(f);
b.purchaseProcedureInProgress(false);break;case"buyRestart":case"buyWarning":case"buyConfirmationWarning":case"buyFailure":case"buyFailureDomainHasChanged":case"buyFailureCreationAccountNotMade":case"letUserChooseDeliveryType":case"letUserHandleDeliveryType":case"letUserHandleDeliveryAddress":case"letUserHandleBillingAddress":case"letUserHandlePaymentMean":case"waitPageIsLoading":case"letUserHandleAssisted":this.set("buyProcedure");
b.purchaseProcedureInProgress(false);break;case"buyInformation":this.set("buyProcedure");
b.purchaseProcedureInProgress(false);break;case"buyProcedure":this.set(f);b.purchaseProcedureInProgress(true);
break;case"buyConfirmation":this.set("buyProcedure");b.purchaseProcedureInProgress(false);
break;case"askSavePassword":case"askEditPassword":this.set(f);b.purchaseProcedureInProgress(false);
break;default:this.set(f);b.purchaseProcedureInProgress(false)}}}};this.interruptBuyProcedure=function(e){this.interruptNextStepInCpp();
this.tabController.releaseHideLayer("normal")};this.interruptNextStepInCpp=function d(){this.tabController.order.purchase.sendBrowserMessage("interruptNextStep")
};this.purchaseProcedureInProgress=function a(e){if(typeof(e)=="undefined"){return this._purchaseProcedureInProgress
}else{if(this._purchaseProcedureInProgress!==e&&KW__DEBUG.general){KW__log("KWPurchaseController.purchaseProcedureInProgress changed from "+this._purchaseProcedureInProgress+" to "+e,3)
}this._purchaseProcedureInProgress=e;if(this._purchaseProcedureInProgress){this.tabController.addHideLayer("normal")
}else{this.tabController.releaseHideLayer("normal")}}};this.documentComplete=function(){if(this.purchaseProcedureInProgress()){this.tabController.addHideLayer("start")
}};this.documentWorkable=function(){if(this.purchaseProcedureInProgress()){this.tabController.addHideLayer("start")
}};this.confirmBuyProcedure=function(){this.screen.change("buyProcedure")};this.catchPurchaseMessageFromWebpage=function(e){switch(e.demand){case"purchaseHideLayerFired":this.interruptBuyProcedure(false);
break;case"askIfWantsToBuyClicked":this.tabController.order.purchase.sendDeviceMessage("fingerPassed",(e.debug=="true"||e.debug===true));
break;default:alert("catchPurchaseMessageFromWebpage demand not recognized: "+e.demand)
}};this.loadToolbar=function(f){try{if(f.screen=="askIfWantsToBuy"){this.screen.change(f.screen,f.datas);
try{if(!f.datas){f.datas="[]"}var e=JSON.parse(f.datas,function(i,j){if(typeof(j)=="string"){j=j.replace(/--endl--/g,"\n")
}return j});this.tabController.order.purchase.sendMessageToWebpageToAllFrames("activateAskIfWantsToBuyHandlers",e)
}catch(h){if(KW__DEBUG.general){KW__log("KWPurchaseController.loadToolbar( buyInformation ) faild :\n"+dumpErr(h),0)
}}return}this.screen.change(f.screen,f.datas);if(f.screen=="buyWarning"||f.screen=="buyRestart"||f.screen=="buyConfirmationWarning"||f.screen=="buyFailure"||f.screen=="buyFailureDomainHasChanged"||f.screen=="buyFailureCreationAccountNotMade"||f.screen=="letUserChooseDeliveryType"||f.screen=="letUserHandleDeliveryType"||f.screen=="letUserHandleDeliveryAddress"||f.screen=="letUserHandleBillingAddress"||f.screen=="letUserHandlePaymentMean"||f.screen=="waitPageIsLoading"||f.screen=="letUserHandleAssisted"){this.interruptBuyProcedure(true)
}}catch(g){if(KW__DEBUG.general){if(typeof(g)=="string"){KW__log("KWPurchaseController.loadToolbar() faild :\n"+g,0)
}else{KW__log("KWPurchaseController.loadToolbar() faild :\n"+dumpErr(g),0)}}}};this.deleteToolbar=function(e){this.tabController.releaseHideLayer("end");
this.screen.change("nothing")};this.nextStep=function(e){this.screen.change("buyProcedure")
};this.missingInformation=function(e){this.screen.change("buyProcedure")}};var KWStorage={get:function get(a){throw"KWStorage.get must be implemented by browser"
},set:function set(a,b){throw"KWStorage.set must be implemented by browser"}};KWStorage.get=function get(c){var d=localStorage.getItem(c);
if(d===null){return null}var a;try{a=JSON.parse(d)}catch(b){if(typeof d==="string"){return d
}return null}return a};KWStorage.set=function set(a,b){if(b===undefined||b===null){localStorage.removeItem(a);
return true}localStorage.setItem(a,JSON.stringify(b));return true};var KWTabController=function(c,d){var b=this;
this.tabId=c;this.tabPanel=d;if(KW__CONFIG.browser==KW__CONFIG.BROWSER_FIREFOX){this.tabBrowser=d.linkedBrowser
}this.documentCompleteSent=false;this.documentCompleteReceivedFromExtension=false;
this.documentCompleteReceivedFromInjectedJs=false;this.documentWorkableSent=false;
this.documentWorkableReceivedFromExtension=false;this._aboutToUnload=false;this._tabControllerReady=false;
this.eventHandlersInitialized=false;this.scriptInjectedOnThePage=false;this.domNodeInsertEventActive=false;
this.tabActive=false;this._isDuringBuyProcedure=false;this._waitForNewDOMInformations=false;
this._bufferedDOMInformations=false;this._frames=[];this._framesLoadCounter=0;this._refreshStatusToolbarBuffered=false;
this._webUIControllers={};this._webUIHistory=[];this._inputsPosition={};this.order={global:{refreshStatusToolbar:function a(g,h){var i={action:"refreshStatusToolbar",userLoggedIn:g,userLogin:h};
if(!b._refreshStatusToolbarBuffered){b._refreshStatusToolbarBuffered=true;b.sendOrderToJsWithNoFailure(i,function(){b._refreshStatusToolbarBuffered=false
})}},tabSelected:function e(){},tabUnselected:function f(){}},auth:{sendAutoLoginMessage:function(g){var h={action:"autoLogin",demand:g};
b.sendOrder(h)}},purchase:{sendBrowserMessage:function(g){var h={action:"browserMessage",demand:g};
b.sendOrder(h)},sendDeviceMessage:function(g,h){var i={action:"deviceMessage",demand:g,debug:h?"true":"false"};
b.sendOrder(i)},sendMessageToWebpage:function(g,i){var h={action:"purchaseMessageToWebpage",demand:g,data:(typeof(i)=="undefined"?{}:i)};
b.sendOrderToJs(h)},sendMessageToWebpageToAllFrames:function(g,i){var h={action:"purchaseMessageToWebpage",demand:g,data:(typeof(i)=="undefined"?{}:i)};
b.sendOrderToAllFrames(h)},signalScreenshot:function(i,g){var h={action:"signalScreenshot",fileName:i,url:g};
b.sendOrder(h)},signalScreenshotDataUri:function(h,j,g,m,i,k){var l={action:k?"signalScreenshotDataUri":"signalLastScreenshotDataUri",dataUri:h,url:j};
if(g!==undefined){l.offsetX=g}if(m!==undefined){l.offsetY=m}if(i!==undefined){l.screenshotId=i
}b.sendOrder(l)},signalWaitingScreenshot:function(g){var h={action:"signalWaitingScreenshot",screenshotId:g};
b.sendOrder(h)}},debug:{askForOpenFeedbackWindow:function(h,g,j){var i={action:"askForOpenFeedbackWindow",screenshot:h,offsetX:g,offsetY:j};
b.sendOrder(i)},sendDebugMessage:function(g,h){h.action="meaningDataRequest";h.demand=g;
b.sendOrder(h)},sendMessageToJs:function(g,j){var k={};k.action=g;for(var h in j){k[h]=j[h]
}b.sendOrderToJs(k)},sendOneClickDebuggerOrderToInjectedJs:function(g,h){var i={action:"oneClickDebuggerOrder",demand:g,target:KWOrdersParser.toJSon(h)};
b.sendOrderToJs(i)},signalWarningMessage:function(g){data={action:"meaningDataRequest",demand:"signalWarningMessage",message:g};
b.sendOrder(data)}}}};KWTabController.prototype.bufferScrollPositionOnPage=function bufferScrollPositionOnPage(a,b){this._bufferOffset={x:a,y:b}
};KWTabController.prototype.saveScreenshotForBuyProcedure=function saveScreenshotForBuyProcedure(f){try{var a=this.dumpScreenshot();
if(typeof(a)!="undefined"&&typeof(this.getLocation())!="undefined"){var b=+(new Date());
this.order.purchase.signalWaitingScreenshot(b);var c=this;var d=this.getLocation();
this.order.purchase.signalScreenshotDataUri(a,d,this._bufferOffset?this._bufferOffset.x:0,this._bufferOffset?this._bufferOffset.y:0,b,f)
}else{if(KW__DEBUG.general){KW__log("Error occured on saveScreenshotForBuyProcedure: dataUri or getLocation is undefined",1)
}}}catch(e){if(KW__DEBUG.general){KW__log("Error occured on saveScreenshotForBuyProcedure: "+e,1)
}}};KWTabController.prototype.clearFramesAndDetectNewFrames=function clearFramesAndDetectNewFrames(){while(this._frames.length>0){this._frames[0].destruct();
this._frames.shift()}var c=this.getDomWindow();if(c.frames){for(var b=0,a=c.frames.length;
b<a;b++){var d=c.frames[b];this._frames.push(new KWFrameController(this,d,this._framesLoadCounter++<Math.max(KW__CONFIG.iFrameMaxLoadPerPage,a)))
}if(KW__DEBUG.general){KW__log("clearFramesAndDetectNewFrames frames detected: "+c.frames.length,3)
}}};KWTabController.prototype.refreshFramesRegistration=function refreshFramesRegistration(){try{var g=this.getDomWindow();
var c=0;if(g.frames){for(var a=g.frames.length;c<a;c++){var f=g.frames[c];if(this._frames.length<=c){if(KW__DEBUG.general){KW__log("refreshFramesRegistration: NEW FRAME DETECTED AT THE END position on page "+c+" / controller "+this._frames.length+" / on page "+g.frames.length,3)
}this._frames.push(new KWFrameController(this,f,this._framesLoadCounter++<Math.max(KW__CONFIG.iFrameMaxLoadPerPage,a)))
}else{var d=this._frames[c];if(d.frameObject==f){continue}var h=false;for(var b=c+1;
b<this._frames.length;b++){if(this._frames[b].frameObject==f){while(this._frames[c].frameObject!=f){if(KW__DEBUG.general){KW__log("refreshFramesRegistration: REMOVE FRAME AT POSITION "+c,3)
}this._frames[c].destruct();this._frames.splice(c,1)}h=true}}if(!h){if(KW__DEBUG.general){KW__log("refreshFramesRegistration: NEW FRAME DETECTED AT POSITION "+c,3)
}this._frames.splice(c,0,new KWFrameController(this,f,this._framesLoadCounter++<Math.max(KW__CONFIG.iFrameMaxLoadPerPage,a)))
}}}while(this._frames.length>(g.frames?g.frames.length:0)){if(KW__DEBUG.general){KW__log("refreshFramesRegistration: REMOVE FRAME AT THE END",3)
}this._frames.pop().destruct()}}}catch(e){if(KW__DEBUG.general){KW__log("refreshFramesRegistration failed with error: "+e,1)
}}};KWTabController.prototype.getFrames=function(){return this._frames};KWTabController.prototype.signalNewFrame=function signalNewFrame(c){for(var b=0,a=this._frames.length;
b<a;b++){if(this._frames[b].getDomDocument()==c){return}}this._frames.push(new KWFrameController(this,c,this._framesLoadCounter++<Math.max(KW__CONFIG.iFrameMaxLoadPerPage,windowTop.frames?windowTop.frames.length:0)))
};KWTabController.prototype.signalRemoveFrame=function signalRemoveFrame(c){for(var b=0,a=this._frames.length;
b<a;b++){if(this._frames[b].getDomDocument()==c){this._frames.splice(b,1);return}}};
KWTabController.prototype.frameExists=function(a){return(typeof(a)!="undefined")};
KWTabController.prototype.addHideLayer=function(a){this.order.purchase.sendMessageToWebpage("addHideLayer",{message:"",button:"",status:a})
};KWTabController.prototype.releaseHideLayer=function(a){this.order.purchase.sendMessageToWebpage("releaseHideLayer",{status:a})
};KWTabController.prototype.isCurrentTabController=function(a){if(a!==undefined){KWTabsController.isCurrentTabController(this,a)
}else{return KWTabsController.isCurrentTabController(this)}};KWTabController.prototype.tabControllerReady=function(a){if(typeof(a)=="undefined"){return this._tabControllerReady
}else{if(!this._tabControllerReady&&a){this.launchSuperASAPOperations()}this._tabControllerReady=a
}};KWTabController.prototype.launchSuperASAPOperations=function(){try{if(this.purchaseController.purchaseProcedureInProgress()){this.addHideLayer("start")
}this.order.debug.sendMessageToJs("autoFillStatus",{status:this._isDuringBuyProcedure?"BUYPROCEDURE":"IDLE"})
}catch(a){if(KW__DEBUG.general){KW__log("Error occured on launchSuperASAPOperations: "+a,1)
}}};KWTabController.prototype.launchDocumentCompleteOperations=function(){try{this.launchSuperASAPOperations()
}catch(a){if(KW__DEBUG.general){KW__log("Error occured on launchDocumentCompleteOperations: "+a,1)
}}};KWTabController.prototype.selected=function(){if(!this.eventHandlersInitialized){return
}if(!this.scriptInjectedOnThePage){if(this.documentWorkableReceivedFromExtension){this.documentCompleteReceived(false)
}this.communLoadScript()}if(!this.domNodeInsertEventActive){this.activateDOMNodeInsertedEvents()
}if(!this.tabActive){this.tabActive=true;this.order.global.tabSelected()}};KWTabController.prototype.unselected=function(){if(!this.getIsDuringBuyProcedure()&&this.domNodeInsertEventActive){this.unactivateDOMNodeInsertedEvents()
}if(this.tabActive){this.tabActive=false;this.order.global.tabUnselected()}};KWTabController.prototype.focusOnTabAndWindow=function(){};
KWTabController.prototype.activateDOMNodeInsertedEvents=function activateDOMNodeInsertedEvents(){this.domNodeInsertEventActive=true;
var a={action:"controlMessageToWebpage",demand:"tabBecomeKey"};this.sendOrderToAllFrames(a)
};KWTabController.prototype.unactivateDOMNodeInsertedEvents=function unactivateDOMNodeInsertedEvents(){this.domNodeInsertEventActive=false;
var a={action:"controlMessageToWebpage",demand:"tabResignKey"};this.sendOrderToAllFrames(a)
};KWTabController.prototype.signalWaitForNewDOMInformations=function signalWaitForNewDOMInformations(){this._waitForNewDOMInformations=true
};KWTabController.prototype.signalNewDOMInformationsSent=function signalNewDOMInformationsSent(){this._waitForNewDOMInformations=false
};KWTabController.prototype.isWaitingForAnyDOMInformations=function isWaitingForAnyDOMInformations(){return this._waitForNewDOMInformations
};KWTabController.prototype.sendNewDOMInformationsFromFrame=function sendNewDOMInformationsFromFrame(c){try{var a={action:c,domStructure:this.getFullDOMStructureWithFrames()};
KW__SPECIAL_ORDERS.signalInputAndSelect(a,this.tabId)}catch(b){if(KW__DEBUG.general){KW__log("sendNewDOMInformationsFromFrame failed with error: "+b,2)
}}};KWTabController.prototype.sendNewDOMInformationsWithFrame=function sendNewDOMInformationsWithFrame(a){try{a.domStructure=this.populateDOMStructureWithFrames(a.domStructure);
KW__SPECIAL_ORDERS.signalInputAndSelect(a,this.tabId)}catch(b){if(KW__DEBUG.general){KW__log("sendNewDOMInformationsWithFrame failed with error: "+b,2)
}}};KWTabController.prototype.getFullDOMStructureWithFrames=function getFullDOMStructureWithFrames(){return this.populateDOMStructureWithFrames(this._bufferedDOMInformations)
};KWTabController.prototype.populateDOMStructureWithFrames=function populateDOMStructureWithFrames(j){if(!j){throw new Error("getFullDOMStructureWithFrames or populateDOMStructureWithFrames failed because buffered DOM structure is empty. No DOM structure sent.")
}var d=">>>KWIFT_FRAME_CONTENT_PLACEHOLDER<<<";var f=d.length;var g=this.getFrames();
for(var b=0,e=g.length;b<e;b++){try{var c=g[b]._bufferedDOMInformations;if(c){var h=j.indexOf(d);
if(h!==-1){j=j.substring(0,h)+"["+c+"]"+j.substring(h+f)}else{if(KW__DEBUG.general){KW__log("Frame isn't in the general DOM Structure",2)
}var k=j.lastIndexOf("]");j=j.substring(0,k)+',{"0":"iframe","6":['+c+"]}"+j.substring(k)
}}else{j=j.replace(d,"[]")}}catch(a){if(KW__DEBUG.general){KW__log("getFullDOMStructureWithFrames just found a corrupted frame: skip!"+a,2)
}j=j.replace(d,"[]")}}j=j.replace(new RegExp(d,"g"),"[]");return j};KWTabController.prototype.refreshAutoFillStatus=function(a){this._isDuringBuyProcedure=(a=="BUYPROCEDURE")
};KWTabController.prototype.getIsDuringBuyProcedure=function(){return this._isDuringBuyProcedure
};KWTabController.prototype.canTakeScreenshotsForLevelOne=function(){return this._takeSscreenshotsForLevelOne
};KWTabController.prototype.startTakingScreenshotsForLevelOne=function(){this._takeSscreenshotsForLevelOne=true
};KWTabController.prototype.stopTakingScreenshotsForLevelOne=function(){this._takeSscreenshotsForLevelOne=false
};KWTabController.prototype.refreshStatusToolbar=function refreshStatusToolbar(a,b){this.order.global.refreshStatusToolbar(a,b)
};KWTabController.prototype.catchUnloadEvent=function(b){this.documentCompleteSent=false;
this.documentCompleteReceivedFromExtension=false;this.documentCompleteReceivedFromInjectedJs=false;
this.documentWorkableSent=false;this.documentWorkableReceivedFromExtension=false;
this.eventHandlersInitialized=false;this.scriptInjectedOnThePage=false;this.domNodeInsertEventActive=false;
this._waitForNewDOMInformations=false;this._bufferedDOMInformations=false;this._framesLoadCounter=0;
this._inputsPosition={};this._aboutToUnload=false;try{this.sendLoadEventToCpp("UNLOAD",true);
KWKwiftDebugger.signalLoadEvent("UNLOAD",this.tabId)}catch(a){if(KW__DEBUG.general){KW__log("catchUnloadEvent :\n"+dumpErr(a),1)
}}};KWTabController.prototype.catchBeforeUnloadEvent=function(b){try{if(this.getIsDuringBuyProcedure()){this.saveScreenshotForBuyProcedure(true)
}if(this.canTakeScreenshotsForLevelOne()){this.saveScreenshotForBuyProcedure(true)
}this._aboutToUnload=true;this.sendLoadEventToCpp("BEFORE_UNLOAD",true);KWKwiftDebugger.signalLoadEvent("BEFORE_UNLOAD",this.tabId)
}catch(a){if(KW__DEBUG.general){KW__log("catchBeforeUnloadEvent :\n"+dumpErr(a),1)
}}};KWTabController.prototype.loadStarts=function(){this.sendLoadEventToCpp("LOAD_STARTS",true);
KWKwiftDebugger.signalLoadEvent("LOAD_STARTS",this.tabId);this.signalWaitForNewDOMInformations()
};KWTabController.prototype.loadWorkableEnds=function(){KWKwiftDebugger.loadWorkableEnds(this);
this.communLoadEnds();this.documentWorkableReceived(true)};KWTabController.prototype.loadCompleteEnds=function(){KWKwiftDebugger.loadCompleteEnds(this);
this.communLoadEnds();this.documentCompleteReceived(true);if(this.getLocation().match(/https:\/\/[www.]*\.dashlane\.com\/\w{2}\/gettingstarted/)!==null){this.focusOnTabAndWindow();
var a={action:"signalWebOnboardingStarted"};KW__ORDER_SENDER.sendOrderToCpp(a,this.tabId,"fromExtensionToCpp")
}};KWTabController.prototype.communLoadEnds=function(){if(!this.eventHandlersInitialized){if(KW__DEBUG.asapEvents){KW__log("Initializing event handlers on the page",3)
}this.eventHandlersInitialized=true;if(KW__CONFIG.browser!==BROWSER_CHROME&&!KW__CONFIG.FIREFOX_JETPACK){this.initCommunicationChannel()
}this.initUnloadEvent();this.initBeforeUnloadEvent();if(KW__CONFIG.browser!==BROWSER_CHROME&&!KW__CONFIG.FIREFOX_JETPACK){if(this.getIsDuringBuyProcedure()||this.isCurrentTabController()){this.communLoadScript();
this.activateDOMNodeInsertedEvents()}}else{if(this.getIsDuringBuyProcedure()){this.communLoadScript();
this.activateDOMNodeInsertedEvents()}else{var a=this;this.isCurrentTabController(function(b){if(b){a.communLoadScript();
a.activateDOMNodeInsertedEvents()}})}}}};KWTabController.prototype.documentWorkableReceived=function(a){if(KW__DEBUG.asapEvents){if(a){KW__log("Document workable received from EXT in "+(new Date().getTime()-KW__localTime),3)
}else{KW__log("Document workable received from JS in "+(new Date().getTime()-KW__localTime),3)
}}if(a){this.documentWorkableReceivedFromExtension=true;KWKwiftDebugger.signalLoadEvent("DOCUMENT_WORKABLE_EXTENSION",this.tabId)
}};KWTabController.prototype.documentCompleteReceived=function(b){if(KW__DEBUG.asapEvents){if(b){KW__log("Document complete received from EXT in "+(new Date().getTime()-KW__localTime),3)
}else{KW__log("Document complete received from JS in "+(new Date().getTime()-KW__localTime),3)
}}if(b){this.documentCompleteReceivedFromExtension=true;KWKwiftDebugger.signalLoadEvent("DOCUMENT_COMPLETE_EXTENSION",this.tabId);
if(!this.documentCompleteReceivedFromInjectedJs&&this.scriptInjectedOnThePage){var a=this;
setTimeout(function(){if(!a.documentCompleteReceivedFromInjectedJs&&a.scriptInjectedOnThePage){KW__log("script not injected ! "+a.getLocation(),2)
}},2000)}}else{this.documentCompleteReceivedFromInjectedJs=true;KWKwiftDebugger.signalLoadEvent("DOCUMENT_COMPLETE_INJECTEDJS",this.tabId)
}if(this.documentCompleteReceivedFromInjectedJs&&(this.documentCompleteReceivedFromExtension||this.documentWorkableReceivedFromExtension)&&!this.documentCompleteSent){this.sendDocumentComplete()
}};KWTabController.prototype.sendDocumentComplete=function(){try{KWKwiftDebugger.signalLoadEvent("DOCUMENT_COMPLETE",this.tabId);
var a=this.getLocation().replace(/&/g,"--amp--").replace(/\/\//g,"--dbsl--").replace(/\=/g,"--equ--");
KW__SPECIAL_ORDERS.documentComplete(this.getDomWindow(),"action=documentComplete&url="+a+"&",this.tabId);
this.documentCompleteSent=true;this.purchaseController.documentComplete();this.launchDocumentCompleteOperations();
this.restoreWebUI()}catch(b){if(KW__DEBUG.general){KW__log("An error occured when sending documentComplete event :\n"+b,1)
}}};KWTabController.prototype.getDomain=function(){try{return KW__getDomain(this.getLocation())
}catch(a){if(KW__DEBUG.general){KW__log("Error in getDomain : "+a,1)}return false
}};KWTabController.prototype.checkServerStatus=function(){var a=this;try{var c=KW__CONFIG.serverTestFile();
KW$.ajaxSetup({cache:false,dataType:"text",type:"GET"});KW$.ajax({url:c,data:{},success:function(d,f){try{if(d.replace(/^\s+/,"").replace(/\s+$/,"")=="OK"){}else{if(KW__DEBUG.general){KW__log("RETRY checkServerStatus IN 1s (success, no file): "+d,1)
}setTimeout(function(){KW__CONFIG.serverPort=false;a.tabControllerReady(false);a.tryToLoadMainScript();
a.checkServerStatus()},1000)}}catch(e){if(KW__DEBUG.general){KW__log("RETRY checkServerStatus IN 1s (exception):\n"+e,1)
}setTimeout(function(){KW__CONFIG.serverPort=false;a.tabControllerReady(false);a.tryToLoadMainScript();
a.checkServerStatus()},1000)}},error:function(d,f,e){if(KW__DEBUG.general){KW__log("RETRY checkServerStatus IN 1s (error): "+f+" / "+e+"\nStatus: "+d.status+"\nURL: "+c,1)
}}})}catch(b){KW__log("RETRY checkServerStatus IN 1s (no port): "+b,3);setTimeout(function(){a.checkServerStatus()
},1000)}};KWTabController.prototype.catchMessageFromCpp=function catchMessageFromCpp(b){try{this.dispatchMessage(b)
}catch(a){if(KW__DEBUG.general){KW__log("catchMessageFromCpp :\n"+dumpErr(a),1)}}};
KWTabController.prototype.dispatchMessage=function dispatchMessage(c){try{var d=KWOrdersParser.splitMessage(c);
var a=this;KW$.each(d,function(e,f){if(f!==""){KW__ORDER_DISPATCHER.dispatchOrder(f,a.tabId)
}})}catch(b){if(KW__DEBUG.general){KW__log("dispatchMessage :\n"+dumpErr(b),1)}}};
KWTabController.prototype.sendOrder=function(a){KW__ORDER_SENDER.sendOrderToCpp(a,this.tabId,"fromExtensionToCpp")
};KWTabController.prototype.sendOrderToJs=function(a){KW__ORDER_SENDER.sendOrderToJs(a,this.tabId,"fromExtensionToJs")
};KWTabController.prototype.sendOrderToAllFrames=function(a){KW__ORDER_SENDER.sendOrderToAllFrames(a,this.tabId,"fromExtensionToJs")
};KWTabController.prototype.sendOrderToJsWithNoFailure=function(a,b){KW__ORDER_SENDER.sendOrderToJsWithNoFailure(a,this.tabId,"fromExtensionToJs",b)
};KWTabController.prototype.sendLoadEventToCpp=function(b,a){if(typeof(a)==="undefined"||a===true){this.sendOrder({action:"event",eventType:b,location:this.getLocation()})
}else{this.sendOrder({action:"event",eventType:b})}};KWTabController.prototype.showWebUI=function(a){var b=new KWWebUIController(this.tabId,a);
this._webUIControllers[b.getId()]=b;b.show()};KWTabController.prototype._saveWebUIHistory=function(a){this._webUIHistory.push({type:a.getType(),elemId:a.getSrcElementId(),when:Date.now()});
if(this._webUIHistory.length>10){this._webUIHistory.shift()}};KWTabController.prototype.hideWebUI=function(a){for(var b in this._webUIControllers){if(!this._webUIControllers.hasOwnProperty(b)){continue
}if(this._webUIControllers[b].getType()===a){return this._webUIControllers[b].hide(true,function(){this._saveWebUIHistory(this._webUIControllers[b]);
delete this._webUIControllers[b]}.bind(this))}}};KWTabController.prototype.hideAllWebUIs=function(){Object.keys(this._webUIControllers).forEach(function(a){this._webUIControllers[a].hide(false);
delete this._webUIControllers[a]}.bind(this));this._webUIHistory=[]};KWTabController.prototype.signalWebUIHidden=function(a){for(var b in this._webUIControllers){if(!this._webUIControllers.hasOwnProperty(b)){continue
}if(this._webUIControllers[b].getType()===a){this._saveWebUIHistory(this._webUIControllers[b]);
delete this._webUIControllers[b];KW__ORDER_SENDER.sendOrderToCpp({action:"signalWebUIHidden",type:a},this.tabId,"fromExtensionToCpp");
return}}};KWTabController.prototype.updateWebUI=function(a){for(var b in this._webUIControllers){if(!this._webUIControllers.hasOwnProperty(b)){continue
}if(this._webUIControllers[b].getType()===a.type){return this._webUIControllers[b].update(a)
}}};KWTabController.prototype.restoreWebUI=function(){for(var a in this._webUIControllers){if(!this._webUIControllers.hasOwnProperty(a)){continue
}this._webUIControllers[a].restore()}};KWTabController.prototype.hasWebUIPopover=function(){for(var a in this._webUIControllers){if(!this._webUIControllers.hasOwnProperty(a)){continue
}if(this._webUIControllers[a].isPopover()){return true}}return false};KWTabController.prototype.shouldBlockFocusOrder=function(a){if(!KWWebUIController.willUsePopover(this.getLocation())){return false
}if(!this._webUIHistory.length){return false}var b=this._webUIHistory[this._webUIHistory.length-1];
if(b.type==="autofill-dropdown"&&b.elemId==a.srcElementId){return b.when>Date.now()-5000
}return false};KWTabController.prototype.cacheInputPosition=function(a){this._inputsPosition[a.srcElementId]={clientX:parseFloat(a.clientX),clientY:parseFloat(a.clientY),offsetX:parseFloat(a.offsetX),offsetY:parseFloat(a.offsetY),width:parseFloat(a.srcElementWidth),height:parseFloat(a.srcElementHeight)}
};KWTabController.prototype.getInputPosition=function(a){if(!this._inputsPosition.hasOwnProperty(a)){return null
}return this._inputsPosition[a]};KWTabController.prototype.open=function open(){if(this.isDevTool){return
}var b=this;KWTabsController.registerTab(this);this.sendLoadEventToCpp("TAB_OPENED",false);
this.purchaseController=new KWPurchaseController(this);var c=this.tabId;var a=KWTabsController.bufferizedPorts[c];
if(a){this.initCommunicationChannel(a)}var g={"https://www.dashlane.com/en/chrome_getstarted":"https://www.dashlane.com/en/chrome_welcome","https://www.dashlane.com/fr/chrome_getstarted":"https://www.dashlane.com/fr/chrome_welcome","https://www.dashlane.com/en/chrome_update":"https://www.dashlane.com/en/chrome_welcomeback","https://www.dashlane.com/fr/chrome_update":"https://www.dashlane.com/fr/chrome_welcomeback"};
if(g.hasOwnProperty(this.tabPanel.url)){chrome.tabs.update(this.tabId,{url:g[this.tabPanel.url]})
}if(this.tabPanel.url.match(/https:\/\/[www.]*\.dashlane\.com\/\w{2}\/gettingstarted/)!==null){this.focusOnTabAndWindow()
}if(this.tabPanel.url.match(/dashlane\.com\/\w{0,2}\/{0,1}search.*(?=#omni)/)!=null){KWController.signalSafeSearchFromOmnibox(this.tabId)
}var f=KWTabsController.bufferizedMessages[c];function h(k){if(k.content){k=k.content
}if(k.type&&k.type==="framesReport"){var t,n,l,r;var o=[];for(n=0;n<b._frames.length;
n++){t=b._frames[n];var s=false;for(l=0;l<k.framesReport.length;l++){r=k.framesReport[l];
if(r.alreadySet===true){continue}if(t.couldBeThatFrame(r)){t.setFramePosition(l);
r.alreadySet=true;s=true;break}}if(!s){o.push(n)}}for(n=0;n<o.length;n++){var q=o[n];
t=b._frames[q];for(l=0;l<k.framesReport.length;l++){r=k.framesReport[l];if(r.alreadySet===true){continue
}t.setFramePosition(l);r.alreadySet=true;break}}return}if(k.type&&k.type==="feedbackOffsets"){var p=k.offsetX;
var m=k.offsetY;KWTabsController.getCurrentTabId(function(i){chrome.tabs.captureVisibleTab(null,{format:"png"},function(j){data={action:"askForOpenFeedbackWindow",screenshot:j,offsetX:p,offsetY:m};
KW__ORDER_SENDER.sendOrderToCpp(data,i,"fromExtensionToCpp")})});return}if(k.type&&k.type==="endOfPurchaseDebug"){KWController.endOfPurchaseDebug();
return}b.dispatchMessage(k)}if(f&&f.length&&f.length>0){for(var d=0;d<f.length;d++){var e=f[d];
if(e){h(e)}}}return this};KWTabController.prototype.close=function close(a){if(!a){this.sendLoadEventToCpp("TAB_CLOSED",false)
}KWTabsController.unregisterTab(this);clearInterval(this.loopTimer);return this};
KWTabController.prototype.updateTab=function updateTab(a){this.tabPanel=a};KWTabController.prototype.saveScreenshot=function saveScreenshot(){};
KWTabController.prototype.dumpScreenshot=function dumpScreenshot(){};KWTabController.prototype.saveScreenshotForBuyProcedure=function saveScreenshotForBuyProcedure(g,b,h){try{var e=this;
var d=this.getLocation();var c=+(new Date());e.order.purchase.signalWaitingScreenshot(c);
b=b||0;h=h||0;var a=function(i){if(i){e.order.purchase.signalScreenshotDataUri(i,d,b,h,c,g)
}else{e.order.purchase.signalScreenshotDataUri("",d,b,h,c,g)}};if(this.getLocation().indexOf("http")===0){chrome.tabs.captureVisibleTab(null,{format:"png"},a)
}else{a(null)}}catch(f){if(KW__DEBUG.general){KW__log("Error occured on saveScreenshotForBuyProcedure: "+f,1)
}}};KWTabController.prototype.getBrowser=function getBrowser(){return};KWTabController.prototype.getTab=function getTab(){return this.tabPanel
};KWTabController.prototype.getLocation=function(){return this.tabPanel.url};KWTabController.prototype.getHostName=function(){return this.tabPanel.url
};KWTabController.prototype.communLoadScript=function communLoadScript(){this.scriptInjectedOnThePage=true
};KWTabController.prototype.getDomWindow=function getDomWindow(){return this.tabPanel.page
};KWTabController.prototype.getDomDocument=function getDomDocument(){return this.tabPanel.page.document
};KWTabController.prototype.tryToLoadMainScript=function tryToLoadMainScript(a){};
KWTabController.prototype.launchDocumentCompleteOperations=function(){try{this.launchSuperASAPOperations();
if(this.tabPanel.url.match(/dashlane\.com\/\w{0,2}\/{0,1}search.*(?=#omni)/)!=null){KWController.signalSafeSearchFromOmnibox(this.tabId)
}}catch(a){if(KW__DEBUG.general){KW__log("Error occured on launchDocumentCompleteOperations: "+a,1)
}}};KWTabController.prototype.initCommunicationChannel=function initCommunicationChannel(b){try{if(this.port){if(this.onMessageListener){this.port.onMessage.removeListener(this.onMessageListener)
}if(this.onDisconnectListener){this.port.onDisconnect.removeListener(this.onDisconnectListener)
}}this.port=b;var a=this;this.port.postMessage("tab_initialized");this.onMessageListener=function(d){if(d.content){d=d.content
}if(d.type&&d.type==="framesReport"){var o,g,e,m;var h=[];for(g=0;g<a._frames.length;
g++){o=a._frames[g];var n=false;for(e=0;e<d.framesReport.length;e++){m=d.framesReport[e];
if(m.alreadySet===true){continue}if(o.couldBeThatFrame(m)){o.setFramePosition(e);
m.alreadySet=true;n=true;break}}if(!n){h.push(g)}}for(g=0;g<h.length;g++){var l=h[g];
o=a._frames[l];for(e=0;e<d.framesReport.length;e++){m=d.framesReport[e];if(m.alreadySet===true){continue
}o.setFramePosition(e);m.alreadySet=true;break}}return}if(d.type&&d.type==="feedbackOffsets"){var k=d.offsetX;
var f=d.offsetY;KWTabsController.getCurrentTabId(function(i){chrome.tabs.captureVisibleTab(null,{format:"png"},function(j){data={action:"askForOpenFeedbackWindow",screenshot:j,offsetX:k,offsetY:f};
KW__ORDER_SENDER.sendOrderToCpp(data,i,"fromExtensionToCpp")})});return}if(d.type&&d.type==="endOfPurchaseDebug"){KWController.endOfPurchaseDebug();
return}a.dispatchMessage(d)};this.port.onMessage.addListener(this.onMessageListener);
this.onDisconnectListener=function(d){if(a.hasOwnProperty("port")){delete a.port;
a.sendLoadEventToCpp("BEFORE_UNLOAD",true);a.catchUnloadEvent()}};this.port.onDisconnect.addListener(this.onDisconnectListener)
}catch(c){if(KW__DEBUG.general){KW__log("initCommunicationChannel :\n"+dumpErr(c),0)
}}};KWTabController.prototype.initUnloadEvent=function(){};KWTabController.prototype.initBeforeUnloadEvent=function(){};
KWTabController.prototype.initDOMNodeInsertedEvent=function(){};KWTabController.prototype.refreshFramesRegistration=function(){};
KWTabController.prototype.runFeedbackWindow=function(){};KWTabController.prototype.focusOnTabAndWindow=function(){var a=this;
chrome.tabs.getSelected(null,function(b){if(b.id!==a.tabId){chrome.tabs.update(a.tabId,{selected:true})
}if(a.tabPanel.windowId!==chrome.windows.WINDOW_ID_CURRENT){chrome.windows.update(a.tabPanel.windowId,{focused:true})
}})};KWTabController.prototype.catchBeforeUnloadEvent=function(a,d,b){if(this.isDevTool){return
}try{KWKwiftDebugger.signalLoadEvent("BEFORE_UNLOAD",this.tabId);if(this.getIsDuringBuyProcedure()&&b!==true){this.saveScreenshotForBuyProcedure(true,a,d)
}if(this.canTakeScreenshotsForLevelOne()&&b!==true){this.saveScreenshotForBuyProcedure(true,a,d)
}this._aboutToUnload=true}catch(c){if(KW__DEBUG.general){KW__log("catchBeforeUnloadEvent :\n"+dumpErr(c),1)
}}};KWTabController.prototype.getFrames=function(){var a=[];if(this._frames&&this._frames.length){for(var b=0;
b<this._frames.length;b++){if(this._frames[b].framePosition!==undefined){a.push(this._frames[b])
}}}return a};KWTabController.prototype.getUnknownFrames=function(){var a=[];if(this._frames&&this._frames.length){for(var b=0;
b<this._frames.length;b++){if(this._frames[b].framePosition===undefined){a.push(this._frames[b])
}}}return a};KWTabController.prototype.getAllFrames=function(){return this._frames
};KWTabController.prototype.populateDOMStructureWithFrames=function populateDOMStructureWithFrames(o){if(!o){throw new Error("getFullDOMStructureWithFrames or populateDOMStructureWithFrames failed because buffered DOM structure is empty. No DOM structure sent.")
}var g=">>>KWIFT_FRAME_CONTENT_PLACEHOLDER<<<";var l=g.length;var m=this.getFrames();
for(var e=0,h=m.length;e<h;e++){try{var f=m[e]._bufferedDOMInformations;if(f){var n=o.indexOf(g);
if(n!==-1){o=o.substring(0,n)+"["+f+"]"+o.substring(n+l)}else{if(KW__DEBUG.general){KW__log("Frame isn't in the general DOM Structure, possible in Chrome, less in FF",2)
}var q=o.lastIndexOf("]");o=o.substring(0,q)+',{"0":"iframe","6":['+f+"]}"+o.substring(q)
}}else{o=o.replace(g,"[]")}}catch(c){if(KW__DEBUG.general){KW__log("getFullDOMStructureWithFrames just found a corrupted frame: skip!"+c,2)
}o=o.replace(g,"[]")}}var a=this.getUnknownFrames();for(var d=0,b=a.length;d<b;d++){try{var r=a[d]._bufferedDOMInformations;
if(r){var p=o.indexOf(g);if(p!==-1){o=o.substring(0,p)+"["+r+"]"+o.substring(p+l)
}else{if(KW__DEBUG.general){KW__log("Frame isn't in the general DOM Structure, possible in Chrome, less in FF",2)
}var q=o.lastIndexOf("]");o=o.substring(0,q)+',{"0":"iframe","6":['+r+"]}"+o.substring(q)
}}else{o=o.replace(g,"[]")}}catch(k){if(KW__DEBUG.general){KW__log("getFullDOMStructureWithFrames just found a corrupted frame 2: skip!"+k,2)
}o=o.replace(g,"[]")}}o=o.replace(new RegExp(g,"g"),"[]");return o};KWTabController.prototype.initWebUICommunication=function(b){var a=b.name.split("wui_")[1];
if(a&&this._webUIControllers.hasOwnProperty(a)){this._webUIControllers[a].initCommunication(b)
}else{if(a){b.postMessage({action:"rejectToken"});b.disconnect()}}};var KWTabsController={registeredTabs:[],registerTab:function(b){for(var a=0;
a<this.registeredTabs.length;a++){if(this.registeredTabs[a].tabId==b.tabId){return
}}this.registeredTabs.push(b)},unregisterTab:function(b){var a=this.registeredTabs.indexOf(b);
if(a>-1){this.registeredTabs.splice(a,1)}},closeAll:function(a){while(this.registeredTabs.length>0){this.registeredTabs[0].close(a)
}},closeAllWebUIs:function(){for(var b=0,a=this.registeredTabs.length;b<a;b++){this.registeredTabs[b].hideAllWebUIs()
}},refreshStatusToolbar:function refreshStatusToolbar(b,e){for(var d=0,a=this.registeredTabs.length;
d<a;d++){var c=this.registeredTabs[d].tabId;try{this.registeredTabs[d].refreshStatusToolbar(b,e)
}catch(f){if(KW__DEBUG.general){KW__log("KWTabsController.refreshStatusToolbar (tabId: "+this.registeredTabs[d].tabId+"):\n"+dumpErr(f),1)
}}}},deleteToolbar:function deleteToolbar(){for(var b=0,a=this.registeredTabs.length;
b<a;b++){this.registeredTabs[b].purchaseController.deleteToolbar()}},previousSelectedTabBecomeInactive:function previousSelectedTabBecomeInactive(b){for(var a=0;
a<this.registeredTabs.length;a++){if(this.registeredTabs[a].tabId!=b.tabId){this.registeredTabs[a].unselected()
}}},newSelectedTabBecomeActive:function newSelectedTabBecomeActive(a){a.selected()
},getControllerById:function(a){for(var b=0;b<this.registeredTabs.length;b++){if(this.registeredTabs[b].tabId==a){return this.registeredTabs[b]
}}return null},sendAnonymousMessageToCpp:function(a){KW__ORDER_SENDER.sendOrderToCpp(a,KW__CONFIG.defaultTabId,"fromExtensionToCpp")
},catchMessageFromCpp:function(a,c){try{if(a==KW__CONFIG.defaultTabId||a==KW__CONFIG.defaultTabIdString){this.getCurrentTabController(function(e){if(e){e.catchMessageFromCpp(c)
}else{if(KW__DEBUG.general){KW__log("KWTabsController.catchMessageFromCpp (tabId: "+a+"): no tabController!",1)
}}});return}else{var d=this.getControllerById(a);if(d){return d.catchMessageFromCpp(c)
}else{if(c.indexOf("changeLanguage")>0||c.indexOf("signalAuthStatus")>0||c.indexOf("httpServerInfoResponse")>0){if(KW__DEBUG.general){KW__log("KWTabsController.catchMessageFromCpp (tabId: "+a+"): tabController not found, message delivered to first tab",3)
}this.getCurrentTabController(function(e){if(e){e.catchMessageFromCpp(c)}else{if(KW__DEBUG.general){KW__log("KWTabsController.catchMessageFromCpp (tabId: "+a+"): no tabController! [2]",1)
}}})}else{if(KW__DEBUG.general){KW__log("KWTabsController.catchMessageFromCpp (tabId: "+a+"): tabController not found, message not delivered",3)
}}}}}catch(b){if(KW__DEBUG.general){KW__log("KWTabsController.catchMessageFromCpp (tabId: "+a+"):\n"+dumpErr(b),1)
}}},getTabWindow:function(a){var b=this.getControllerById(a);return b.getDomWindow()
},hasWebUIPopover:function(){for(var b=0,a=this.registeredTabs.length;b<a;++b){if(this.registeredTabs[b].hasWebUIPopover()){return true
}}return false}};KWTabsController.bufferizedPorts=[];KWTabsController.bufferizedMessages=[];
KWTabsController.getCurrentTabController=function getCurrentTabController(b){if(this.registeredTabs.length>0){var a=this;
chrome.tabs.getSelected(null,function(e){if(e){for(var d=0,c=a.registeredTabs.length;
d<c;d++){if(e.id==a.registeredTabs[d].tabId){b(a.registeredTabs[d]);return}}}b(null)
})}else{b(null)}};KWTabsController.isCurrentTabController=function isCurrentTabController(a,b){this.getCurrentTabController(function(c){b(c===a)
})};KWTabsController.isCurrentTabId=function isCurrentTabId(a){return this.isCurrentTabController(this.getControllerById(a))
};KWTabsController.getCurrentTabId=function getCurrentTabId(a){this.getCurrentTabController(function(b){if(b){a(b.tabId)
}else{a(KW__CONFIG.defaultTabId)}})};KWTabsController.canonizeTabId=function canonizeTabId(a){return a.toString()
};KWTabsController.tabControllerIsRegistered=function tabControllerIsRegistered(c){for(var b=0,a=this.registeredTabs.length;
b<a;b++){if(this.registeredTabs[b].tabPanel==c){return true}}return false};KWTabsController.getDeadTabController=function getDeadTabController(){for(var b=0,a=this.registeredTabs.length;
b<a;b++){if(this.registeredTabs[b].tabPanel.browserWindow===undefined){return this.registeredTabs[b]
}}return false};KWTabsController.checkTabOpenTabCloseTabChange=function checkTabOpenTabCloseTabChange(){throw"NOT IMPLEMENTED IN CHROME"
};var KWWebUICache=(function(){var f={};var d=[];var b={"autofill-dropdown":function(m){var k=m.configuration+"@"+m.showCloseBox+"@";
for(var j=0,g=m.webcards.length;j<g;++j){var h=m.webcards[j];k+=h.type+"@"+h.data+"@"+h.extra
}return k}};var a=function(g,i){var h=g+"@"+_TR_.lang()+"@";if(b.hasOwnProperty(g)){h+=b[g](i)
}return h};var e=function(){var g=d.shift();if(!g){return}this.buildHTML(g,function(h){f[g.hash]={html:h,sensitive:g.sensitive}
})};var c=function(g,h){if(g==="autofill-dropdown"){return h.configuration==="classic"
}return true};this.buildHTML=function(){throw"KWWebUICache.buildHTML must be implemented by browser."
};this.get=function(g,j){if(g!=="autofill-dropdown"){return""}var h=a(g,j);if(f.hasOwnProperty(h)){return f[h]
}var i=KW$.extend({},j);d.push({hash:h,type:g,state:i,sensitive:c(g,i)});setTimeout(e.bind(this),1);
return""};this.setGeometry=function(g,j,i){var h=a(g,j);if(!f.hasOwnProperty(h)){return
}f[h].geometry=i};this.clear=function(g){for(var h in f){if(f.hasOwnProperty(h)&&(g||f[h].sensitive)){delete f[h]
}}};return this})();KWWebUICache.buildHTML=function(d,c){var b=wUiBase.extend(wUiComponents[d.type]());
var a=new b({data:d.state});return c(a.toHTML())};var KWWebUIController=function(b,a){this._tabId=b;
this._uiId=parseInt(Math.random()*100000000);this._type=a.type;this._uiState=a.uiData;
this._shown=0;this._showTimeout=null;this._srcElementId=a.srcElementId||-1;this._inPopover=false;
this._hiddenCallback=null;if(wUiTranslations.hasOwnProperty(_TR_.lang())){this._uiState.__tr=wUiTranslations[_TR_.lang()][this._type]
}else{this._uiState.__tr=wUiTranslations.en[this._type]}this._uiState.__extensionCapabilities=KW__CONFIG.capabilities;
this._uiState.__pluginCapabilities=KWController.getPluginCapabilities();var c=KWWebUICache.get(this._type,this._uiState);
this._html=c.html||"";this._geometry=c.geometry||null};KWWebUIController.prototype.getId=function(){return this._uiId
};KWWebUIController.prototype.getType=function(){return this._type};KWWebUIController.prototype.getSrcElementId=function(){return this._srcElementId
};KWWebUIController.prototype.isPopover=function(){return this._inPopover};KWWebUIController.willUsePopover=function(a){return false
};KWWebUIController.prototype._tryToShow=function(){this._showTimeout=null;tabController=KWTabsController.getControllerById(this._tabId);
if(!tabController){return}if(tabController._aboutToUnload){return}if(!tabController.documentCompleteReceivedFromInjectedJs&&!tabController.documentCompleteReceivedFromExtension){return(this._showTimeout=setTimeout(this._tryToShow.bind(this),100))
}this._shown+=1;var a={type:this._type,uiId:this._uiId,srcElementId:this._srcElementId};
if(this._type==="autofill-dropdown"){a.srcElementPos=tabController.getInputPosition(this._srcElementId);
if(this._geometry){a.geometry=this._geometry}}KW__ORDER_SENDER.sendOrderToJs({action:"showWebUI",infos:JSON.stringify(a)},this._tabId,"fromExtensionToJs")
};KWWebUIController.prototype._popupsNoDelay=["autofill-dropdown","master-password","purchase-receipt","autologin-selection"];
KWWebUIController.prototype._hasShowDelay=function(){return this._popupsNoDelay.indexOf(this._type)===-1
};KWWebUIController.prototype.show=function(){if(!this._canShowInPage()){this._inPopover=true;
this._showPopover()}else{if(!this._hasShowDelay()){this._tryToShow()}else{this._showTimeout=setTimeout(this._tryToShow.bind(this),1234)
}}};KWWebUIController.prototype._canShowInPage=function(){throw new Error("KWWebUIController.canShowInpage must be implemented by browser")
};KWWebUIController.prototype._showPopover=function(){throw new Error("KWWebUIController._showPopover must be implemented by browser")
};KWWebUIController.prototype._hidePopover=function(){throw new Error("KWWebUIController._hidePopover must be implemented by browser")
};KWWebUIController.prototype._popupsNoRestore=["autofill-dropdown","master-password","autologin-selection"];
KWWebUIController.prototype._shouldRestore=function(){return this._popupsNoRestore.indexOf(this._type)===-1
};KWWebUIController.prototype.restore=function(){if(this._inPopover){return}if(this._shouldRestore()){this._uiState.noIntro=this._shown>0;
if(this._showTimeout!==null){clearTimeout(this._showTimeout);this._showTimeout=null
}this._tryToShow()}else{if(this._type==="master-password"||this._type==="autologin-selection"){this._suicide()
}}};KWWebUIController.prototype.hide=function(a,b){if(this._inPopover){this._hidePopover()
}else{if(this._type==="autofill-dropdown"){KW__ORDER_SENDER.sendOrderToJs({action:"hideWebUI",uiId:this._uiId},this._tabId,"fromExtensionToJs")
}}if(this._inPopover||this._type==="autofill-dropdown"){if(a){return b()}return}if(!a){return this.signalCloseEvent()
}this._hiddenCallback=b;this.postMessage({action:"close",content:{sendResult:a}})
};KWWebUIController.prototype.update=function(a){this.postMessage({action:"updateState",content:a.uiData})
};KWWebUIController.prototype.initCommunication=function(){throw new Error("KWWebUIController.initCommunication must be implemented by browser")
};KWWebUIController.prototype.postMessage=function(a){throw new Error("KWWebUIController.postMessage must be implemented by browser")
};KWWebUIController.prototype.onMessage=function(b){var a=b.action;if(a==="getInitialState"){this.sendInitialState()
}else{if(a==="setState"){this.treatStateUpdate(b.content)}else{if(a==="sendResult"){this.sendResult(b.content)
}else{if(a==="signalGeometry"){this.signalGeometry(b.content)}else{if(a==="signalCloseEvent"){this.signalCloseEvent()
}}}}}};KWWebUIController.prototype.sendInitialState=function(){this.postMessage({action:"initialState",content:{html:this._html,data:this._uiState}})
};KWWebUIController.prototype.treatStateUpdate=function(a){if(this._type!=="save-password"){this._uiState=a;
return}if(this._uiState.emailOrLogin===a.emailOrLogin){this._uiState=a;return}this._uiState=a;
var b={emailOrLogin:this._uiState.emailOrLogin};KW__ORDER_SENDER.sendOrderToCpp({action:"webUIStateUpdate",type:this._type,uiState:JSON.stringify(b)},this._tabId,"fromExtensionToCpp")
};KWWebUIController.prototype.sendResult=function(a){var b={};if(this._type==="save-password"){b.button=a;
if(a!=="cancel"){b.emailOrLogin=this._uiState.emailOrLogin;b.checkProtectedOpt=this._uiState.checkProtectedOpt;
b.checkSubdomainOpt=this._uiState.checkSubdomainOpt;b.category=this._uiState.category;
b.space=this._uiState.space}}else{if(this._type==="autofill-dropdown"){b={button:a.button,id:a.id,altOption:(a.altOption||0)+""}
}else{if(this._type==="data-capture"){b.button=a;if(a!=="cancel"&&a!=="never"){b.selectedIds=this._uiState.data.filter(function(c){return c.checked
}).map(function(c){return c.id})}}else{if(this._type==="purchase-receipt"){b.button=a;
if(a!=="cancel"){b.merchand=this._uiState.merchand;b.currency=this._uiState.currency;
b.total=this._uiState.total;b.articles=this._uiState.articles;b.space=this._uiState.space
}}else{if(this._type==="master-password"){b.button=a;if(a!=="cancel"){b.alwaysAuthorized=this._uiState.alwaysAuthorized;
b.password=this._uiState.password;if(KWController.getPluginCapabilities()>0){return KW__cryptHashPassword(b.password,function(c,d){b.password=d;
KW__ORDER_SENDER.sendOrderToCpp({action:"webUIAction",type:this._type,uiResult:JSON.stringify(b)},this._tabId,"fromExtensionToCpp")
}.bind(this))}}}else{if(this._type==="autologin-selection"){b={button:a.button,id:a.id}
}}}}}}if(this._uiState.stateUI&&this._uiState.stateUI.loggingIn&&a==="save"){b.login=this._uiState.login;
b.password=this._uiState.password}if(this._type==="autofill-dropdown"&&this._inPopover){this._hidePopover(true)
}KW__ORDER_SENDER.sendOrderToCpp({action:"webUIAction",type:this._type,uiResult:JSON.stringify(b)},this._tabId,"fromExtensionToCpp")
};KWWebUIController.prototype.signalGeometry=function(a){KWWebUICache.setGeometry(this._type,this._uiState,a);
KW__ORDER_SENDER.sendOrderToJs({action:"signalWebUIGeometry",uiId:this._uiId,geometry:JSON.stringify(a)},this._tabId,"fromExtensionToJs")
};KWWebUIController.prototype.signalCloseEvent=function(){KW__ORDER_SENDER.sendOrderToJs({action:"hideWebUI",uiId:this._uiId},this._tabId,"fromExtensionToJs");
if(this._hiddenCallback&&typeof this._hiddenCallback==="function"){this._hiddenCallback()
}};KWWebUIController.prototype._suicide=function(){var a=KWTabsController.getControllerById(this._tabId);
if(!a){return}a.signalWebUIHidden(this._type)};KWWebUIController.prototype.initCommunication=function(a){a.onMessage.addListener(function(b){this.onMessage(JSON.parse(b))
}.bind(this));a.onDisconnect.addListener(function(){this._port=null}.bind(this));
this._port=a};KWWebUIController.prototype.postMessage=function(a){if(!this._port){return
}this._port.postMessage(JSON.stringify(a))};KWWebUIController.prototype._canShowInPage=function(){return true
};KWWebUIController.prototype._showPopover=function(){};KWWebUIController.prototype._hidePopover=function(){};