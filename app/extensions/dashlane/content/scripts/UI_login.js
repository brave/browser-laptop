function LoginToolbar_Communication(){this.port=chrome.extension.connect({name:"popup"});
this.sendMessage=function(a){this.port.postMessage(a)};this.port.onMessage.addListener(function(a){if(a.type=="changeLangage"){loginToolbar.refreshTranslations(a.tr1,a.tr2,a.tr3)
}})}var loginToolbar_Communication=new LoginToolbar_Communication();function LoginToolbar(){this.initHandlers=function(){try{document.getElementById("logoutSubmit").onclick=this.askLogout;
document.getElementById("openAppSubmit").onclick=this.askOpenApp;document.getElementById("feedbackSubmit").onclick=this.askFeedback
}catch(a){console.log(a)}};this.askFeedback=function(){loginToolbar_Communication.sendMessage({action:"feedback"});
window.close()};this.askOpenApp=function(){loginToolbar_Communication.sendMessage({action:"openApp"});
window.close()};this.askLogout=function(){loginToolbar_Communication.sendMessage({action:"logout"});
window.close()};this.refreshTranslations=function(a,d,c){try{document.getElementById("logoutSubmit").value=a;
document.getElementById("openAppSubmit").value=d;document.getElementById("feedbackSubmit").value=c
}catch(b){console.log(b)}}}var loginToolbar=new LoginToolbar();loginToolbar.initHandlers();
loginToolbar_Communication.sendMessage({action:"refreshTranslations"});