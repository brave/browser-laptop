function UpdateToolbar_Communication(){if(!chrome.extension.connect){return}this.port=chrome.extension.connect({name:"popup_update"});
this.port.onMessage.addListener(function(a){if(a.type=="switchBrowserMode"){updateToolbar.refreshBrowserMode(a.text1,a.text2)
}})}var updateToolbar_Communication=new UpdateToolbar_Communication();function UpdateToolbar(){this.refreshBrowserMode=function(c,b){try{document.getElementById("text1").innerText=c;
document.getElementById("text2").innerText=b}catch(a){console.log(a)}}}var updateToolbar=new UpdateToolbar();