var KWStorage={get:function get(a){throw"KWStorage.get must be implemented by browser"
},set:function set(a,b){throw"KWStorage.set must be implemented by browser"}};KWStorage.get=function get(c){var d=localStorage.getItem(c);
if(d===null){return null}var a;try{a=JSON.parse(d)}catch(b){if(typeof d==="string"){return d
}return null}return a};KWStorage.set=function set(a,b){if(b===undefined||b===null){localStorage.removeItem(a);
return true}localStorage.setItem(a,JSON.stringify(b));return true};(function(a){a.fn.retina=function(c){var d={dataRetina:true,enabledForMobile:false,suffix:"",checkIfImageExists:false,customFileNameCallback:"",overridePixelRatio:false};
var e=function(){var f=false;(function(h,g){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(h)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(h.substr(0,4))){f=true
}})(navigator.userAgent||navigator.vendor||window.opera);return f};if(c){jQuery.extend(d,c)
}var b=false;if(d.overridePixelRatio||window.devicePixelRatio>=1.2){if(!d.enabledForMobile&&e()){b=false
}else{b=true}}return this.each(function(){var h=a(this);h.addClass("retina-off");
if(!b){return false}var g="";if(d.dataRetina&&h.attr("data-retina")){g=h.attr("data-retina")
}if(d.suffix){if(!g){g=h.attr("src")}}if(d.suffix){var f=g.replace(/.[^.]+$/,"");
var i=g.replace(/^.*\./,"");g=f+d.suffix+"."+i}if(d.customFileNameCallback){g=d.customFileNameCallback(h)
}if(d.checkIfImageExists&&g){a.ajax({url:g,type:"HEAD",success:function(){h.attr("src",g);
h.removeClass("retina-off");h.addClass("retina-on")}})}else{if(g){h.attr("src",g);
h.removeClass("retina-off");h.addClass("retina-on")}}})}}(jQuery));var Popover_Specific={initializeOnLoad:function(){popover.action.setSafeSearchCapability(this.isSafeSearchCapable());
popover.action.refreshTranslations();popover.action.initialData()},initializeOnDisplay:function(){},closePopover:function(){window.close()
},isSafeSearchCapable:function(){return KWStorage.get("sscap")||false},_parseRssFeed:function(d){var e=$("channel>title",d).text();
var b=$("channel>link",d).text();var a=$("channel>item",d);var c={title:e,link:b,articles:[]};
a.each(function(f,g){c.articles.push({title:$("title",this).text(),link:$("link",this).text(),date:$("pubDate",this).text(),description:$("description",this).text()})
});return c},loadRssFeed:function(a){$.ajax({url:"http://www.dashlane.com/blog/category/dashlane-tips-tricks/feed/",dataType:"xml",success:function(b){return a(null,this._parseRssFeed(b))
}.bind(this),error:function(){return a(new Error("Error loading rss feed"))}})}};
function Popover_Communication(){this.port=chrome.extension.connect({name:"popup"});
this.sendMessage=function(a){this.port.postMessage(a)};this.port.onMessage.addListener(function(a){switch(a.type){case"changeLangage":popover.communication.refreshTranslations(a.lang);
break;case"loadRecoveryView":popover.communication.loadRecoveryView(a.reason,a.platform);
break;case"restoreState":popover.communication.restoreState(a.data);break;case"popover_signalDataRefresh":if(!a.data||a.data.error){popover.communication.signalDataRefreshError(a.data.error);
return}popover.communication.signalDataRefresh(a.data);break;case"popover_signalPasswordGenerated":if(!a.data||a.error){popover.communication.signalPasswordGeneratedError(a.error);
return}popover.communication.signalPasswordGenerated(a.data);break;case"loginsLists":break;
case"popover_showLogoutConfirmation":popover.communication.showLogoutConfirmation();
break;default:console.error("Message not treated: "+a.type)}})}var popover_Communication=new Popover_Communication();
var SORT_CATEGORY="category";var SORT_NAME="name";var SORT_MOSTUSED="mostused";var SORT_LASTUSED="lastused";
var VIEW_NODATA="nodata";var VIEW_CREDENTIALS="credentials";var VIEW_CATEGORIES="categories";
var VIEW_LISTDETAILS="listdetails";var DEFAULT_VIEW=VIEW_CREDENTIALS;var DEFAULT_SORT=SORT_NAME;
var PopoverCredentialsView=function(j,g){var o=this;this.controller=j;this.el=g;var m=[];
var e=[];var f=[];var n={};var i={};var a={};var d={};var l=null;var c=null;var k=null;
var b=null;var h=null;this.tr=function(p){return this.controller.tr(p)};this.allowReverseAction=function(){return false
};this.rendered=function(){return this.el.children().size()!==0};this.restoreState=function(q){var p=this;
var r=p.currentState();if(q){c=q.view;l=q.sort;k=q.selection}};this.currentState=function(){return{view:c,sort:l,selection:k}
};this.render=function(){var p=this;var q=p.currentState();if(!p.existingData()){if(p.rendered()&&q.view==VIEW_NODATA){return p
}p.el.children().remove();c=VIEW_NODATA;l=null;k=null;h=new PopoverCredentialsListView(p.currentState(),p).render().show();
return p.renderNoData()}if(!p.rendered()||q.view==VIEW_NODATA||h===null){p.el.children().remove();
if(c==VIEW_NODATA){c=DEFAULT_VIEW}c=c||DEFAULT_VIEW;l=l||DEFAULT_SORT;k=k||null;h=new PopoverCredentialsListView(p.currentState(),p).render().show();
return p}p.el.removeClass("default");h.refreshRendering(q);return this};this.renderNoData=function(){this.el.addClass("default");
return this};this.sortBy=function(q,p){if(p!==true){b=null}if(h===null){return}if(l==SORT_CATEGORY&&q!=SORT_CATEGORY){o.el.children().remove();
c=VIEW_CREDENTIALS;l=q;k=null;h=new PopoverCredentialsListView(o.currentState(),o).render().show()
}else{if(l!=SORT_CATEGORY&&q==SORT_CATEGORY){o.el.children().remove();c=VIEW_CATEGORIES;
l=q;k=null;h=new PopoverCredentialsListView(o.currentState(),o).render().show()}else{l=q;
h.refreshSorting(this.currentState())}}this.controller.action.saveState("credentials",this.currentState());
this.controller.action.usageLog("credentials","sortBy_"+q)};this.goToCredentialDetails=function(q){var p=this.getCredentialDomainWithIdentifier(q);
this.controller.action.openCredential(q,p)};this.goToCredentialCourier=function(q){var p=this.getCredentialDomainWithIdentifier(q);
this.controller.action.openCredentialCourier(q,p)};this.goToCredentialWebsite=function(r){var q=this.getCredentialDomainWithIdentifier(r);
var p=this.getCredentialURLWithIdentifier(r);this.controller.action.autologinCredential(r,q,p)
};this.openDetails=function(q){if(h===null){return}if(c===VIEW_LISTDETAILS){return
}c=VIEW_LISTDETAILS;l=SORT_NAME;k=q;var p=h;h=new PopoverCredentialsListView(o.currentState(),o).render();
h.placeOnRight().show();p.moveToLeft(function(){p.el.remove()});h.moveToLeft();this.controller.action.saveState("credentials",this.currentState())
};this.closeDetails=function(){if(h===null){return}if(c!==VIEW_LISTDETAILS){return
}c=VIEW_CATEGORIES;l=SORT_CATEGORY;k=null;var p=h;h=new PopoverCredentialsListView(o.currentState(),o,false).render();
h.placeOnLeft().show();p.moveToRight(function(){p.el.remove()});h.moveToRight();this.controller.action.saveState("credentials",this.currentState())
};this.search=function(p){if(h===null){return}var q=p.replace(/\s*/g,"");if(q.length){if(!b&&l==SORT_CATEGORY){b=l;
this.sortBy(SORT_NAME,true);this.focusOnSearch(q)}}else{if(b&&b!=l){this.sortBy(b,true);
b=null;this.focusOnSearch()}}h.search(p)};this.focusOnSearch=function(p){if(h){h.focusOnSearch(p)
}};this.refreshScrolling=function(){if(h){h.refreshScrolling()}};this.show=function(p){this.el.show();
if(h){h.refreshScrolling();h.focusOnSearch()}p()};this.hide=function(){this.el.hide()
};this.refreshTranslations=function(p){if(h){h.refreshTranslations(p)}};this.signalDataRefresh=function(y){var D=this;
var z,A;m=[];e=[];f=[];n={};i={};a={};d={};switch(y.sorting){case SORT_NAME:case SORT_MOSTUSED:case SORT_LASTUSED:DEFAULT_SORT=y.sorting;
DEFAULT_VIEW=VIEW_CREDENTIALS;break;case"nameDesc":DEFAULT_SORT=SORT_NAME;DEFAULT_VIEW=VIEW_CREDENTIALS;
break;case SORT_CATEGORY:case"categoryDesc":DEFAULT_SORT=SORT_CATEGORY;DEFAULT_VIEW=VIEW_CATEGORIES;
break;default:}if(y.authentifiants){for(z=0,A=y.authentifiants.length;z<A;++z){var w=y.authentifiants[z].Domain;
var q=y.authentifiants[z].Authentifiants;for(var x=0,u=q.length;x<u;++x){var s=q[x];
s.Domain=w;m.push(s);n[s.Id]=s;var t=s.Category;if(!t){t="__NONE__"}if(d.hasOwnProperty(t)){d[t]++
}else{d[t]=1}}}}if(y.authCategories){for(z=0,A=y.authCategories.length;z<A;++z){var r=y.authCategories[z];
e.push(r);i[r.Id]=r}}var C={Id:"",CategoryName:this.tr("NO_CATEGORY")};e.push(C);
if(y.websites){for(z=0,A=y.websites.length;z<A;++z){var p=y.websites[z];f.push(p);
if(a.hasOwnProperty(p.Domain)){var v=a[p.Domain].Icon;var B=p.Icon;if((!v||v=="default.png")&&(B&&B!="default.png")){a[p.Domain]=p
}}else{a[p.Domain]=p}}}};this.existingData=function(){return m.length>0};this.getAllCredentialsSortedBy=function(p){return m
};this.getAllCategoriesSorted=function(){return e};this.getCredentialsForCategorySorted=function(s){var q=[];
for(var r=0,p=m.length;r<p;++r){if(!s&&!m[r].Category){q.push(m[r])}else{if(s&&m[r].Category==s){q.push(m[r])
}}}return q};this.getNumberAuthsWithCategory=function(p){var q=p.Id;if(!q){q="__NONE__"
}if(d.hasOwnProperty(q)){return d[q]}return 0};this.getCredentialWithIdentifier=function(p){if(n.hasOwnProperty(p)){return n[p]
}return null};this.getCredentialDomainWithIdentifier=function(p){if(n.hasOwnProperty(p)){return n[p].Domain
}return""};this.getCredentialURLWithIdentifier=function(q){if(n.hasOwnProperty(q)){var t=n[q];
var r="";if((t.UseFixedUrl===true||t.UseFixedUrl=="true")&&t.UserSelectedUrl){r=t.UserSelectedUrl
}else{var s=/^(https?:\/\/[^\/]+).*/i;var p=s.exec(t.Url);if(p){r=p[1]}else{r=t.Url
}}if(r.length>=7&&r.substr(0,7)!="http://"&&r.substr(0,8)!="https://"){r="http://"+r
}return r}return""};this.getCategoryWithIdentifier=function(p){if(i.hasOwnProperty(p)){return i[p]
}return null};this.getWebsiteLogo=function(r){var s="/Websites/default-passwords.png";
if(!r){return this.controller.localServerUrl()+s}var q=r.Domain;if(!q||!a.hasOwnProperty(q)){return this.controller.localServerUrl()+s
}var p=a[q];if(!p||!p.Icon){return this.controller.localServerUrl()+s}return this.controller.localServerUrl()+"/Websites/"+p.Icon
}};var PopoverCredentialsListView=function(b,g,c){this.el=null;this.parent=g.el;var e=b;
var i=(c===false)?false:true;var k=null;var j=null;var m=null;var l=null;var d=null;
var h=null;var f=null;var a=null;this.categoryTitle=function(){if(e.selection){var n=g.getCategoryWithIdentifier(e.selection);
if(n){return n.CategoryName}}return this.tr("NO_CATEGORY")};this.tr=function(n){return g.tr(n)
};this.render=function(){var x=this;var v=(e.view==VIEW_LISTDETAILS)?"menusmall":"menularge";
var y=(e.view==VIEW_CATEGORIES)?"listsmall":"listlarge";x.el=$("<div>",{"class":"navigator "+v});
if(i){x.parent.append(x.el)}else{x.parent.prepend(x.el)}l=$("<div>",{"class":"menu"});
k=$("<div>",{"class":"list"});j=$("<div>",{"class":"nodata"}).append($("<h3>",{text:x.tr("NO_CREDENTIALS")})).append($("<p>",{text:x.tr("NO_CREDENTIALS_TIP")}));
m=$("<div>",{"class":"scrollbar"}).append($("<div>",{"class":"track"}).append($("<div>",{"class":"thumb"}).append($("<div>",{"class":"start"})).append($("<div>",{"class":"middle"})).append($("<div>",{"class":"end"}))));
d=$("<div>");f=$("<ul>",{"class":y});x.el.append(l);x.el.append(k);x.el.append(j);
k.append(d);d.append(f);if(true){k.addClass("tinyscrollbar");k.prepend(m);d.addClass("viewport");
f.addClass("overview");k.tinyscrollbar({size:"auto",minsizethumb:20})}else{k.addClass("nativescrollbar")
}if(e.view==VIEW_LISTDETAILS){l.append($("<span>",{"class":"button back",text:"Back"})).append($("<span>",{"class":"title",text:this.categoryTitle()}))
}else{l.append($("<input>",{type:"search",placeholder:this.tr("SEARCH")})).append($("<select>"));
$("select",l).append($("<option>",{value:SORT_CATEGORY,text:x.tr("SORT_CATEGORY")})).append($("<option>",{value:SORT_NAME,text:x.tr("SORT_NAME")})).append($("<option>",{value:SORT_MOSTUSED,text:x.tr("SORT_MOSTUSED")})).append($("<option>",{value:SORT_LASTUSED,text:x.tr("SORT_LASTUSED")}));
$("select",l).val(e.sort)}$("select",l).dropkick({width:250,change:function(){g.sortBy($("select",l).val(),false)
}});var s=null;switch(e.view){case VIEW_CREDENTIALS:s=g.getAllCredentialsSortedBy(e.sort);
break;case VIEW_CATEGORIES:s=g.getAllCategoriesSorted();break;case VIEW_LISTDETAILS:s=g.getCredentialsForCategorySorted(e.selection);
break;default:s=[];break}var w=function(){g.openDetails($(this).attr("alt"))};var n=function(z){z.stopPropagation();
g.goToCredentialDetails($(this).attr("alt"))};var t=function(z){z.stopPropagation();
g.goToCredentialCourier($(this).attr("alt"))};var o=function(z){z.stopPropagation();
g.goToCredentialWebsite($(this).attr("alt"))};for(var r=0,u=s.length;r<u;++r){var q=null;
if(e.view==VIEW_CATEGORIES){var p=g.getNumberAuthsWithCategory(s[r]);if(p>0){q=x.smallListItem(s[r]);
f.append(q);q.click(w)}}else{q=x.largeListItem(s[r]);f.append(q);$(".options",q).click(n);
q.click(o)}}this.refreshSorting();this.refreshScrolling();$(".back",l).click(function(){g.closeDetails()
});$("input",l).keyup(function(){g.search($(this).val())});$("input",l).click(function(){g.search($(this).val())
});return this};this.show=function(){this.el.show();this.refreshScrolling();return this
};this.hide=function(){this.el.hide();return this};this.focusOnSearch=function(n){$("input",l).focus();
if(n){$("input",l).val(n)}$("input",l).caretToEnd()};this.refreshTranslations=function(n){};
this.refreshRendering=function(o){var u,w;var z=this;e=o;var t=null;switch(e.view){case VIEW_CREDENTIALS:t=g.getAllCredentialsSortedBy(e.sort);
break;case VIEW_CATEGORIES:t=g.getAllCategoriesSorted();break;case VIEW_LISTDETAILS:t=g.getCredentialsForCategorySorted(e.selection);
break;default:return this}if(t.length===0&&e.view==VIEW_LISTDETAILS){g.closeDetails();
return this}var x={};for(u=0,w=t.length;u<w;++u){x[t[u].Id]=t[u]}var n=$("li",f);
n.each(function(G){var B=$(this).attr("alt");if(!x.hasOwnProperty(B)){$(this).remove()
}else{var F,J,H;var C,I,A,E;if(e.view==VIEW_CATEGORIES){var D=g.getNumberAuthsWithCategory(x[B]);
if(D===0){$(this).remove()}else{J=$(".title",this).text();H=$(".details",this).text();
I=x[B].CategoryName?x[B].CategoryName:this.tr("NO_CATEGORY");A="("+D+")";if(J!=I||H!=A){$(".title",this).text(I);
$(".details",this).text(A);E={};E[SORT_NAME]=I.toLowerCase();$(this).data("sort",E)
}}}else{F=$("img",this).attr("src");J=$(".title",this).text();H=$(".details",this).text();
C=z.getWebsiteLogo(x[B]);I=x[B].Title?x[B].Title:x[B].Domain;A=x[B].Email?x[B].Email:x[B].Login;
if(F!=C||J!=I||H!=A){$("img",this).attr("src",C);$(".title span",this).text(I);$(".details",this).text(A)
}E={};E[SORT_NAME]=I.toLowerCase();E[SORT_LASTUSED]=-parseInt(x[B].LastUse,10);E[SORT_MOSTUSED]=-parseInt(x[B].NumberUse,10);
$(this).data("sort",E)}}});var y=function(){g.openDetails($(this).attr("alt"))};var q=function(A){A.stopPropagation();
g.goToCredentialDetails($(this).attr("alt"))};var v=function(A){A.stopPropagation();
g.goToCredentialCourier($(this).attr("alt"))};var p=function(A){A.stopPropagation();
g.goToCredentialWebsite($(this).attr("alt"))};for(u=0,w=t.length;u<w;++u){var s=$('li[alt="'+t[u].Id+'"]',f);
if(s.size()===0){if(e.view==VIEW_CATEGORIES){var r=g.getNumberAuthsWithCategory(t[u]);
if(r>0){s=z.smallListItem(t[u]);f.append(s);s.click(y)}}else{s=z.largeListItem(t[u]);
f.append(s);$(".options",s).unbind("click");$(".options",s).click(q);s.unbind("click");
s.click(p)}}}this.refreshSorting();this.refreshScrolling();return this};this.refreshScrolling=function(){k.tinyscrollbar_update()
};this.refreshSorting=function(o){if(o&&e.sort==o.sort){e=o;return}if(o){e=o}var n=$("li",f);
var p=function(s,t){var r=$(s).data("sort")[e.sort];var q=$(t).data("sort")[e.sort];
if(r>q){return 1}else{if(r<q){return -1}else{return 0}}};n.sortElements(p);return this
};this.search=function(o){var p=trim(o).replace(/\s+/g," ").toLowerCase().split(" ");
var n=p.length;if(!n||!p[0]){$("li",f).show();if(h){this.el.removeClass("web-search");
h.hide()}}else{if(h){this.el.addClass("web-search");h.show()}$("#search-keyword").text(o);
$("li",f).each(function(r){var q=$(this);var t=q.text().toLowerCase();for(var s=0;
s<n;++s){if(t.indexOf(p[s])<0){q.hide();return}}q.show()})}this.refreshScrolling();
return this};this.placeOnLeft=function(){var n=this.el.width();this.el.css({left:"-"+n+"px"});
return this};this.placeOnRight=function(){var n=this.el.width();this.el.css({left:n+"px"});
return this};this.moveToLeft=function(p){var n=this;var o=this.el.width();this.el.animate({left:"-="+o},"fast",function(){if(typeof(p)=="function"){p()
}});return this};this.moveToRight=function(p){var n=this;var o=this.el.width();this.el.animate({left:"+="+o},"fast",function(){if(typeof(p)=="function"){p()
}});return this};this.getWebsiteLogo=function(n){return g.getWebsiteLogo(n)};this.largeListItem=function(r){var q=this.getWebsiteLogo(r);
var s=r.Title?r.Title:r.Domain;var o=r.Email?r.Email:r.Login;var n={};n[SORT_NAME]=s.toLowerCase();
n[SORT_LASTUSED]=-parseInt(r.LastUse,10);n[SORT_MOSTUSED]=-parseInt(r.NumberUse,10);
var p=$("<li>",{alt:r.Id}).append($("<span>",{"class":"button options",alt:r.Id,text:"Details"})).append($("<span>",{"class":"image"}).append($("<img>",{src:q}))).append($("<span>",{"class":"title",alt:r.Id}).append($("<span>",{text:s}))).append($("<span>",{"class":"details",text:o}));
p.data("sort",n);$("img",p).retina({checkIfImageExists:true,suffix:"@2x"});return p
};this.smallListItem=function(n){var r=n.CategoryName?n.CategoryName:this.tr("NO_CATEGORY");
var p=g.getNumberAuthsWithCategory(n);var o={};o[SORT_CATEGORY]=r.toLowerCase();var q=$("<li>",{alt:n.Id}).append($("<span>",{"class":"title",text:r})).append($("<span>",{"class":"details",text:"("+p+")"}));
q.data("sort",o);return q}};var PopoverGeneratorView=function(e,b){var j=this;this.controller=e;
this.el=b;var i=null;var d=null;var g;var f;var c=false;var h=5;this.tr=function(k){return this.controller.tr(k)
};this.allowReverseAction=function(){return false};this.restoreState=function(k){if(k){f=k
}else{f=null}};this.rendered=function(){return this.el.children().size()!==0};this.render=function(){var l=this;
l.el.children().remove();l.el.addClass("navigator").addClass("menusmall");i=$("<div>",{"class":"menu"}).append($("<span>",{"class":"title",text:this.tr("PASSWORD_GENERATOR")}));
d=$("<div>",{"class":"list"});l.el.append(i);l.el.append(d);this.fillPasswordButton=$("<div>",{"class":"button fillPasswordButton small",text:this.tr("FILL")});
this.copyPasswordButton=$("<div>",{"class":"button copyPasswordButton small",text:this.tr("COPY")});
this.generatePasswordButton=$("<div>",{"class":"button generatePasswordButton small",text:this.tr("NEW")});
this.useAsDefaultsButton=$("<div>",{"class":"button useAsDefaultsButton small",text:this.tr("USE_AS_DEFAULTS")});
this.generatedPasswordInput=$("<input>",{type:"text","class":"generatedPasswordInput spinner"});
if(!/firefox/gi.test(navigator.userAgent)){this.generatedPasswordInput.attr("disabled","disabled")
}this.useAsDefaultsButton.addClass("disabled");d.append(this.fillPasswordButton);
d.append(this.copyPasswordButton);d.append(this.generatePasswordButton);d.append(this.generatedPasswordInput);
var k=function(q,p){var r=$("<label>",{text:p}).append($("<div>",{"class":q+"Container"}).append($("<div>",{"class":q}).append($("<div>",{"class":"indicator"}).css({width:"0%"})))).append($("<span>",{"class":q}));
return r};var o=function(q,p){var r=$("<div>",{"class":"box"}).append($("<input>",{type:"checkbox",id:q,name:q,value:q})).append($("<label>",{"for":q,text:p}));
return r};d.append(k("strengthIndicator",this.tr("STRENGTH")));d.append($("<hr>"));
d.append(k("lengthIndicator",this.tr("LENGTH")));d.append(o("digits",this.tr("DIGITS")));
d.append(o("symbols",this.tr("SYMBOLS")));d.append(o("letters",this.tr("LETTERS")));
d.append(o("pronounceable",this.tr("PRONOUNCEABLE")));d.append($("<hr>").css({clear:"both",marginTop:"68px"}));
d.append(this.useAsDefaultsButton);this.strengthIndicator=$("div.strengthIndicator",d);
this.lengthIndicator=$("div.lengthIndicator",d);this.digitsCheckbox=$('input[name="digits"]',d).button();
this.lettersCheckbox=$('input[name="letters"]',d).button();this.symbolsCheckbox=$('input[name="symbols"]',d).button();
this.pronounceableCheckbox=$('input[name="pronounceable"]',d).button();var m=f?f.size:8;
this.lengthIndicator.slider({value:m*h,max:28*h,min:4*h});this.lengthIndicator.parent().next().text(m);
$("a",this.lengthIndicator).append($("<span>",{"class":"grip"}));this.lengthIndicator.bind("slide",function(q){var p=Math.round($(this).slider("option","value")/h);
$(this).parent().next().text(p)});this.lengthIndicator.bind("slidechange",function(q){l.controller.action.usageLog("generator","changeLength");
var p=Math.round($(this).slider("option","value")/h);if(m!=p){m=p;$(this).parent().next().text(p);
l.checkConfig();l.generatePassword()}});this.fillPasswordButton.click(function(){l.controller.action.usageLog("generator","fill");
l.fillPassword()});this.copyPasswordButton.click(function(){l.controller.action.usageLog("generator","copy");
l.copyPassword()});this.generatePasswordButton.click(function(){l.controller.action.usageLog("generator","generate");
l.generatePassword()});this.useAsDefaultsButton.click(function(){l.controller.action.usageLog("generator","defaults");
l.saveDefaults()});var n=function(s,p,q){if(l.spinner()){if(p.is(":checked")){p.removeAttr("checked")
}else{p.attr("checked",true)}p.button("refresh");s.stopPropagation();return}l.checkConfig();
var r=p.is(":checked");l.controller.action.usageLog("generator",(r?"tick_":"untick_")+q)
};this.digitsCheckbox.click(function(p){n(p,l.digitsCheckbox,"digits")});this.lettersCheckbox.click(function(p){n(p,l.lettersCheckbox,"letters")
});this.symbolsCheckbox.click(function(p){n(p,l.symbolsCheckbox,"symbols")});this.pronounceableCheckbox.click(function(p){n(p,l.pronounceableCheckbox,"pronounceable")
});this.restoreDefaultConfig();this.signalDataRefresh(c);return this};this.show=function(k){this.el.show();
k()};this.hide=function(){this.el.hide()};this.refreshTranslations=function(k){};
this.signalDataRefresh=function(k,l){if(k===true||k=="true"){c=true;if(this.copyPasswordButton&&this.fillPasswordButton){this.copyPasswordButton.hide();
this.fillPasswordButton.show()}}else{c=false;if(this.copyPasswordButton&&this.fillPasswordButton){this.fillPasswordButton.hide();
this.copyPasswordButton.show()}}if(l){f={digits:(l.digits===true||l.digits=="true"),letters:(l.letters===true||l.letters=="true"),symbols:(l.symbols===true||l.symbols=="true"),pronounceable:(l.pronounceable===true||l.pronounceable=="true"),size:parseInt(l.size,10)}
}if(this.rendered()){this.checkConfig()}};this.restoreDefaultConfig=function(){if(!f){f={digits:true,letters:true,symbols:false,pronounceable:false,size:8}
}if(f.digits){this.digitsCheckbox.attr("checked",true)}else{this.digitsCheckbox.removeAttr("checked")
}if(f.letters){this.lettersCheckbox.attr("checked",true)}else{this.lettersCheckbox.removeAttr("checked")
}if(f.symbols){this.symbolsCheckbox.attr("checked",true)}else{this.symbolsCheckbox.removeAttr("checked")
}if(f.pronounceable){this.pronounceableCheckbox.attr("checked",true)}else{this.pronounceableCheckbox.removeAttr("checked")
}this.checkConfig()};this.checkConfig=function(n){if(n!==false){n=true}var p=this.pronounceableCheckbox.is(":checked");
if(p){this.lettersCheckbox.attr("checked",true).attr("disabled",true);this.symbolsCheckbox.removeAttr("checked").attr("disabled",true)
}else{this.lettersCheckbox.attr("disabled",false);this.symbolsCheckbox.attr("disabled",false)
}var o=this.digitsCheckbox.is(":checked");var q=this.lettersCheckbox.is(":checked");
var k=this.symbolsCheckbox.is(":checked");if(!(o||q||k)){this.lettersCheckbox.attr("checked",true);
q=true}if(k&&!(o||q)){this.lettersCheckbox.attr("checked",true);q=true}this.lettersCheckbox.attr("disabled",!(o)||p);
this.digitsCheckbox.attr("disabled",!(q||k));this.symbolsCheckbox.attr("disabled",!(o||q)||p);
this.lettersCheckbox.button("refresh");this.digitsCheckbox.button("refresh");this.symbolsCheckbox.button("refresh");
this.pronounceableCheckbox.button("refresh");if(n){this.generatePassword()}var m=Math.round(this.lengthIndicator.slider("option","value")/h);
var l=(f.size==m&&f.digits==o&&f.letters==q&&f.symbols==k&&f.pronounceable==p);if(l){this.useAsDefaultsButton.addClass("disabled")
}else{this.useAsDefaultsButton.removeClass("disabled")}};this.saveDefaults=function(){var m=Math.round(this.lengthIndicator.slider("option","value")/h);
var n=this.digitsCheckbox.is(":checked");var p=this.lettersCheckbox.is(":checked");
var l=this.symbolsCheckbox.is(":checked");var o=this.pronounceableCheckbox.is(":checked");
var k={size:m,digits:n,letters:p,symbols:l,pronounceable:o};this.controller.action.saveDefaults(k);
f=k;this.checkConfig()};this.generatePassword=function(){var k=this;if(this.spinner()===true){return
}if(this.spinner()!==false){g=false;setTimeout(function(){k.generatePassword()},1000);
return}var n=Math.round(this.lengthIndicator.slider("option","value")/h);var o=this.digitsCheckbox.is(":checked");
var q=this.lettersCheckbox.is(":checked");var m=this.symbolsCheckbox.is(":checked");
var p=this.pronounceableCheckbox.is(":checked");var l={size:n,digits:o,letters:q,symbols:m,pronounceable:p};
this.spinner(true);this.controller.action.generatePassword(l);this.controller.action.saveState("generator",l)
};this.copyPassword=function(){var k=this.generatedPasswordInput.val();if(k){this.controller.action.copyPassword(k)
}};this.fillPassword=function(){var k=this.generatedPasswordInput.val();if(k){this.controller.action.fillPassword(k)
}};this.spinner=function(k){if(k===true){this.generatedPasswordInput.val("").addClass("spinner");
g=true}else{if(k===false){this.generatedPasswordInput.removeClass("spinner");this.lettersCheckbox.button("refresh");
this.digitsCheckbox.button("refresh");this.symbolsCheckbox.button("refresh");this.pronounceableCheckbox.button("refresh");
g=false}else{return g}}};this.signalPasswordGenerated=function(l){this.spinner(false);
this.generatedPasswordInput.val(l.password);var k=parseInt(l.strength,10)+"%";$(".indicator",this.strengthIndicator).css({width:k});
this.strengthIndicator.parent().next().text(k)};this.signalPasswordGeneratedError=function(k){this.spinner(false);
this.generatedPasswordInput.val("");var l="0%";$(".indicator",this.strengthIndicator).css({width:l});
this.strengthIndicator.parent().next().text("")};this.toHexa=function a(l){l=Math.min(Math.max(0,Number(l)),255);
var k=new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F");
return k[Math.floor(l/16)]+k[l%16]}};var PopoverHelpView=function(d,a){var j=this;
this.controller=d;this.el=a;var g=null;var f=null;var i=null;var h=null;var b=null;
var c=null;var e=null;this.tr=function(k){return this.controller.tr(k)};this.allowReverseAction=function(){return false
};this.restoreState=function(k){};this.rendered=function(){return this.el.children().size()!==0
};this.render=function(){var k=this;this.el.children().remove();k.el.addClass("navigator").addClass("menusmall");
h=$("<div>",{"class":"menu"}).append($("<span>",{"class":"title",text:this.tr("TIPS")}));
g=$("<div>",{"class":"list"});f=$("<div>",{"class":"nodata"}).append($("<h3>",{text:k.tr("NETWORK_ERROR")})).append($("<p>",{text:k.tr("NETWORK_ERROR_TIP")}));
i=$("<div>",{"class":"scrollbar"}).append($("<div>",{"class":"track"}).append($("<div>",{"class":"thumb"}).append($("<div>",{"class":"start"})).append($("<div>",{"class":"end"}))));
b=$("<div>");c=$("<ul>",{"class":"listtext"});k.el.append(h);k.el.append(g);k.el.append(f);
g.append(b);b.append(c);if(true){g.addClass("tinyscrollbar");g.prepend(i);b.addClass("viewport");
c.addClass("overview");g.tinyscrollbar({size:"auto",minsizethumb:20})}else{g.addClass("nativescrollbar")
}this.renderRssLoading();this.refreshScrolling();return this};this.refreshScrolling=function(){g.tinyscrollbar_update()
};this.renderRssLoading=function(){g.hide()};this.renderRssError=function(){this.el.addClass("default");
this.refreshScrolling()};this.renderRssFeed=function(){var l=this;g.show();this.el.removeClass("default");
var o=function(){var p=$(this).attr("alt");l.controller.action.usageLog("help","openLink");
l.controller.action.openBlogUrl(p)};for(var m=0,k=e.articles.length;m<k;m++){var n=$("<li>",{alt:e.articles[m].link}).append($("<span>",{"class":"title",text:e.articles[m].title}));
c.append(n);n.click(o)}this.refreshScrolling()};this.show=function(k){this.el.show();
this.loadRssFeed(function(){this.refreshScrolling();return k()}.bind(this))};this.hide=function(){this.el.hide()
};this.refreshTranslations=function(k){};this.loadRssFeed=function(k){if(e){return k()
}Popover_Specific.loadRssFeed(function(l,m){if(l){this.renderRssError()}else{e=m;
this.renderRssFeed()}return k()}.bind(this))}};var PopoverGettingStartedView=function(a,e){var b=this;
this.controller=a;this.el=e;var f=null;var c=null;var d=null;this.tr=function(g){return this.controller.tr(g)
};this.allowReverseAction=function(){return true};this.restoreState=function(g){};
this.rendered=function(){return this.el.children().size()!==0};this.render=function(){var g=this;
this.el.children().remove();g.el.addClass("default");g.el.append($("<div>",{"class":"welcome",text:g.tr("WELCOME_TO_DASHLANE_IN_YOUR_BROWSER")}));
g.exploreButton=$("<div>",{"class":"button explore large",text:this.tr("EXPLORE")}).append($("<span>",{"class":"arrow"}));
g.el.append(g.exploreButton);g.slide1=$("<div>",{"class":"slide slide1"}).append($("<span>",{"class":"close"})).append($("<div>",{"class":"artwork"})).append($("<div>",{"class":"button next large",text:this.tr("NEXT")}).append($("<span>",{"class":"arrow"})));
g.slide2=$("<div>",{"class":"slide slide2"}).append($("<span>",{"class":"close"})).append($("<div>",{"class":"artwork"})).append($("<div>",{"class":"button next large",text:this.tr("NEXT")}).append($("<span>",{"class":"arrow"})));
g.slide3=$("<div>",{"class":"slide slide3"}).append($("<span>",{"class":"close"})).append($("<div>",{"class":"artwork"})).append($("<div>",{"class":"button next large",text:this.tr("NEXT")}).append($("<span>",{"class":"arrow"})));
g.slide4=$("<div>",{"class":"slide slide4"}).append($("<span>",{"class":"close"})).append($("<div>",{"class":"artwork"})).append($("<div>",{"class":"button next large",text:this.tr("START_USING_DASHLANE")}));
g.el.append(g.slide1);g.el.append(g.slide2);g.el.append(g.slide3);g.el.append(g.slide4);
g.exploreButton.click(function(){g.explore();d=g.slide1;g.controller.action.usageLog("gettingstarted","explore")
});$(".close",g.el).click(function(){if(d==g.slide1){g.controller.action.usageLog("gettingstarted","closeCredentials")
}else{if(d==g.slide2){g.controller.action.usageLog("gettingstarted","closeGenerator")
}else{if(d==g.slide3){g.controller.action.usageLog("gettingstarted","closeOpenApp")
}else{if(d==g.slide4){g.controller.action.usageLog("gettingstarted","closeLogout")
}}}}d=null;g.end()});$(".next",g.slide1).click(function(){d=g.slide2;g.slideLeft(g.slide1,g.slide2,function(){});
g.controller.action.usageLog("gettingstarted","nextCredentials")});$(".next",g.slide2).click(function(){d=g.slide3;
g.slideLeft(g.slide2,g.slide3,function(){});g.controller.action.usageLog("gettingstarted","nextGenerator")
});$(".next",g.slide3).click(function(){d=g.slide4;g.slideLeft(g.slide3,g.slide4,function(){});
g.controller.action.usageLog("gettingstarted","nextOpenApp")});$(".next",g.slide4).click(function(){d=null;
g.end();g.controller.action.usageLog("gettingstarted","nextLogout")});return this
};this.show=function(h){var g=this;g.el.css({top:"-100%",display:"block"});g.el.animate({top:"0"},"fast",function(){h()
})};this.hide=function(){var g=this;g.el.css({top:"0",display:"block"});g.el.animate({top:"-100%"},"fast",function(){g.el.hide()
})};this.refreshTranslations=function(g){};this.animateButton=function(){var g=this;
var h=d?$(".next",d):$(".explore",this.el);h.addClass("shake").addClass("animated");
setTimeout(function(){h.removeClass("animated").removeClass("shake")},1000)};this.explore=function(){this.slideLeft(null,this.slide1,function(){})
};this.end=function(){this.controller.action.endGettingStarted()};this.slideLeft=function(g,h,i){if(h){h.css({left:"100%",display:"block"});
h.animate({left:"0"},"fast",function(){i()})}if(g){g.css({left:"0",display:"block"});
g.animate({left:"-100%"},"fast",function(){g.hide();if(!h){i()}})}if(!g&&!h){i()}}
};var PopoverWebsiteView=function(a,e){var b=this;this.controller=a;this.el=e;var f=null;
var d=null;var c;var g=null;this.tr=function(h){return this.controller.tr(h)};this.allowReverseAction=function(){return false
};this.restoreState=function(h){if(h){c=h}else{c=null}};this.rendered=function(){return this.el.children().size()!==0
};this.render=function(){var h=this;h.el.children().remove();h.el.addClass("navigator").addClass("menusmall");
f=$("<div>",{"class":"menu"}).append($("<span>",{"class":"title",text:this.tr("WEBSITE_SPECIFIC")}));
d=$("<div>",{"class":"list"});h.el.append(f);h.el.append(d);var k=function(m,l){var n=$("<div>",{"class":"switch"}).append($("<input>",{type:"checkbox",id:m,name:m,value:m})).append($("<label>",{"for":m,text:l}));
return n};d.append(k("disableOnPage",this.tr("DISABLE_ON_THIS_PAGE")));d.append($("<hr>"));
d.append(k("disableOnDomain",this.tr("DISABLE_ON_THIS_DOMAIN")));d.append($("<hr>"));
var i=$("<div>",{"class":"report"}).append($("<label>",{"for":"report-btn",text:this.tr("REPORT_AUTOFILL_ISSUE")})).append($("<span>",{"class":"button small",id:"report-btn",name:"report-btn",text:this.tr("REPORT")}));
d.append(i);this.disableOnDomainCheckbox=$('input[name="disableOnDomain"]',d).button();
this.disableOnPageCheckbox=$('input[name="disableOnPage"]',d).button();this.reportAutofillIssue=$("#report-btn",d);
var j=function(o,l,n){l.button("refresh");h.controller.action[n]();var m=l.is(":checked");
h.controller.action.usageLog("website",(m?"tick_":"untick_")+n)};this.disableOnDomainCheckbox.click(function(l){j(l,h.disableOnDomainCheckbox,"disableOnDomain")
});this.disableOnPageCheckbox.click(function(l){j(l,h.disableOnPageCheckbox,"disableOnPage")
});this.reportAutofillIssue.click(function(l){h.controller.action.showReportIssueView(l)
});this.signalDataRefresh(g);return this};this.show=function(h){this.el.show();h()
};this.hide=function(){this.el.hide()};this.refreshTranslations=function(i){var h=this
};this.signalDataRefresh=function(h){g=h;if(!this.disableOnDomainCheckbox||!this.disableOnPageCheckbox){return
}if(h.disabledOnDomain&&(h.disabledOnDomain===true||h.disabledOnDomain=="true")){var i=this.tr("ENABLE_ON_THIS_DOMAIN_NOHTML").replace(/\^[1-9]/g,h.domain);
this.disableOnDomainCheckbox.attr("checked",true).button("refresh");this.disableOnDomainCheckbox.next().text(i)
}else{var i=this.tr("DISABLE_ON_THIS_DOMAIN_NOHTML").replace(/\^[1-9]/g,h.domain);
this.disableOnDomainCheckbox.removeAttr("checked").button("refresh");this.disableOnDomainCheckbox.next().text(i)
}if(h.disabledOnPage&&(h.disabledOnPage===true||h.disabledOnPage=="true")){this.disableOnPageCheckbox.attr("checked",true).button("refresh");
this.disableOnPageCheckbox.next().text(this.tr("ENABLE_ON_THIS_PAGE"))}else{this.disableOnPageCheckbox.removeAttr("checked").button("refresh");
this.disableOnPageCheckbox.next().text(this.tr("DISABLE_ON_THIS_PAGE"))}}};var PopoverReportIssueView=function(a,e){var b=this;
this.controller=a;this.el=e;var f=null;var d=null;var c;var g=null;this.tr=function(h){return this.controller.tr(h)
};this.allowReverseAction=function(){return false};this.restoreState=function(h){if(h){c=h
}else{c=null}};this.rendered=function(){return this.el.children().size()!==0};this.render=function(){var i=this;
i.el.children().remove();i.el.addClass("navigator").addClass("menusmall");f=$("<div>",{"class":"menu"}).append($("<span>",{"class":"back"})).append($("<span>",{"class":"title",text:this.tr("WEBSITE_SPECIFIC")}));
d=$("<div>",{"class":"list"});i.el.append(f);i.el.append(d);$(".back",f).click(function(n){i.controller.action.website(n)
});var h=$("<div>",{"class":"report-field"}).append($("<label>",{"for":"issue-type",text:this.tr("TYPE")})).append($("<select>",{name:"issue-type"}).append($("<option>",{value:"none",text:this.tr("SELECT_AN_ISSUE")})).append($("<option>",{value:"no_impala",text:this.tr("NO_IMPALA")})).append($("<option>",{value:"no_impalas",text:this.tr("NO_IMPALAS")})).append($("<option>",{value:"grey_impala",text:this.tr("GREY_IMPALA")})).append($("<option>",{value:"bad_autofill",text:this.tr("BAD_AUTOFILL")})).append($("<option>",{value:"no_autologin",text:this.tr("NO_AUTOLOGIN")})).append($("<option>",{value:"pwd_gen_issue",text:this.tr("PWD_GEN_ISSUE")})).append($("<option>",{value:"pwd_save_issue",text:this.tr("PWD_SAVE_ISSUE")})).append($("<option>",{value:"popup_issue",text:this.tr("POPUP_ISSUE")})).append($("<option>",{value:"other",text:this.tr("OTHER")})));
d.append(h);var m=$("<div>",{"class":"report-field"}).append($("<label>",{"for":"description",text:this.tr("DESCRIPTION")})).append($("<textarea>",{name:"description"}));
d.append(m);var l=function(o,n){var p=$("<div>",{"class":"box"}).append($("<input>",{type:"checkbox",checked:"checked",id:o,name:o,value:o})).append($("<label>",{"for":o,text:n}));
return p};var k=l("detailed",this.tr("SEND_DETAILS"));d.append(k);$('input[name="detailed"]',d).button();
var j=$("<span>",{"class":"button small",text:this.tr("SEND")});d.append(j);$("select",d).change(function(n){$(this).removeClass("none-selected")
});$("span.button",d).click(function(q){var o=$("select",d).val();if(o==="none"){return $("select",d).addClass("none-selected")
}var r=$("textarea",d).val();var n=$("input[type=checkbox]",d).is(":checked");i.controller.action.reportAutofillIssue(o,r,n);
$("textarea",d).val("");$("input[type=checkbox]",d).attr("checked","checked");if($("#thanks",d).length){$("#thanks",d).show()
}else{var p=$("<div>",{id:"thanks"}).append($("<span>",{id:"thanks-icon"})).append($("<h2>",{text:i.tr("THANKS")})).append($("<h3>",{text:i.tr("LOOK_INTO_IT")}));
d.append(p)}setTimeout(function(){i.controller.action.website(q);$("#thanks",d).hide()
},5000)});return this};this.show=function(h){this.el.show();h()};this.hide=function(){this.el.hide()
};this.refreshTranslations=function(i){var h=this}};var PopoverSettingsView=function(a,f){var b=this;
this.controller=a;this.el=f;var g=null;var e=null;var c;var d=null;this.tr=function(h){return this.controller.tr(h)
};this.allowReverseAction=function(){return false};this.restoreState=function(h){if(h){c=h
}else{c=null}};this.rendered=function(){return this.el.children().size()!==0};this.render=function(){var h=this;
h.el.children().remove();h.el.addClass("navigator").addClass("menusmall");g=$("<div>",{"class":"menu"}).append($("<span>",{"class":"title",text:this.tr("SETTINGS")}));
e=$("<div>",{"class":"list"});h.el.append(g);h.el.append(e);var i=function(l,k){var m=$("<div>",{"class":"switch"}).append($("<input>",{type:"checkbox",id:l,name:l,value:l})).append($("<label>",{"for":l,text:k}));
return m};e.append(i("toggleSafeSearch",this.tr("DISABLE_SAFE_SEARCH")));e.append($("<hr>"));
var j=$("<div>",{"class":"uninstall-extension"}).append($("<label>",{"for":"uninstall-extension-btn",text:this.tr("UNINSTALL_EXTENSION")})).append($("<span>",{"class":"button small",id:"uninstall-extension-btn",name:"uninstall-extension-btn",text:this.tr("UNINSTALL")}));
e.append(j);this.toggleSafeSearch=$('input[name="toggleSafeSearch"]',e).button();
this.uninstallExtension=$("#uninstall-extension-btn",e);this.toggleSafeSearch.click(function(m){h.toggleSafeSearch.button("refresh");
var k=d&&(d.safeSearchEnabled===true||d.safeSearchEnabled==="true")||false;h.controller.action.toggleSafeSearch(k);
var l=h.toggleSafeSearch.is(":checked");h.controller.action.usageLog("settings",(l?"tick_":"untick_")+"toggleSafeSearch")
});this.uninstallExtension.click(function(k){h.controller.action.uninstallExtension(k)
});this.signalDataRefresh(d);return this};this.show=function(h){this.el.show();h()
};this.hide=function(){this.el.hide()};this.refreshTranslations=function(i){var h=this
};this.signalDataRefresh=function(h){d=h;if(!this.toggleSafeSearch||!h){return}if(h.safeSearchEnabled&&(h.safeSearchEnabled===true||h.safeSearchEnabled==="true")){this.toggleSafeSearch.removeAttr("checked").button("refresh");
this.toggleSafeSearch.next().text(this.tr("DISABLE_SAFE_SEARCH"))}else{this.toggleSafeSearch.attr("checked",true).button("refresh");
this.toggleSafeSearch.next().text(this.tr("ENABLE_SAFE_SEARCH"))}}};var PopoverRecoveryView=function(c,g){var d=this;
this.controller=c;this.el=g;var h=null;var e=null;var f=null;var b="noPlugin";var a="win";
this.tr=function(i){return this.controller.tr(i)};this.allowReverseAction=function(){return true
};this.restoreState=function(i){};this.rendered=function(){return this.el.children().size()!==0
};this.setupDetails=function(j,i){b=j;a=i};this.render=function(){var i=this;this.el.children().remove();
i.el.addClass("default");if(b=="doubleExtension"){i.supportButton=$("<div>",{"class":"button support small",text:this.tr("CONTACT_SUPPORT")}).append($("<span>",{"class":"arrow"}));
i.el.append($("<div>",{"class":"welcome",text:i.tr("YOU_ALREADY_HAVE_DASHLANE_EXTENSION")}).css({fontSize:"11px",paddingBottom:"0"}));
i.el.append(i.supportButton);i.supportButton.click(function(){i.controller.action.support("1407849")
})}else{if(a=="other"){i.supportButton=$("<div>",{"class":"button support small",text:this.tr("CONTACT_SUPPORT")}).append($("<span>",{"class":"arrow"}));
i.el.append($("<div>",{"class":"welcome",text:i.tr("DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER")}).css({fontSize:"11px",paddingBottom:"0"}));
i.el.append(i.supportButton);i.supportButton.click(function(){i.controller.action.support("1407849")
})}else{i.donwloadButton=$("<div>",{"class":"button download large",text:this.tr("INSTALL_DASHLANE")}).append($("<span>",{"class":"arrow"}));
i.el.append($("<div>",{"class":"welcome",text:i.tr("DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER")}));
i.el.append(i.donwloadButton);i.donwloadButton.click(function(){i.controller.action.download()
})}}return this};this.show=function(i){this.el.show();i()};this.hide=function(){this.el.hide()
};this.refreshTranslations=function(i){};this.animateButton=function(){var i=this;
var j=$(".download, .support, .welcome",this.el);j.addClass("shake").addClass("animated");
setTimeout(function(){j.removeClass("animated").removeClass("shake")},1000)}};var PopoverLogoutConfirmationView=function(a,e){var b=this;
this.controller=a;this.el=e;var c;var d=null;this.tr=function(f){return this.controller.tr(f)
};this.allowReverseAction=function(){return false};this.restoreState=function(f){if(f){c=f
}else{c=null}};this.rendered=function(){return this.el.children().size()!==0};this.render=function(){var g=this;
g.el.children().remove();g.el.addClass("navigator").addClass("menusmall");var h=function(k,j){var l=$("<div>",{"class":"box"}).append($("<input>",{type:"checkbox",id:k,name:k,value:k})).append($("<label>",{"for":k,text:j}));
return l};var i=function(k,j){return $("<span>",{"class":"new-button",id:k,text:j})
};g.el.append($("<div>",{id:"dashlane-desktop-icon"}));g.el.append($("<div>",{id:"logout-conf-text",text:this.tr("LOGOUT_CONFIRMATION_TEXT")}));
g.el.append($("<span>",{"class":"new-button",id:"logout-ok",text:this.tr("LOGOUT_CONFIRMATION_OK")}).append("<span>",{"class":"logout-icon"}));
var f=$("<div>",{"class":"logout-conf-bottom"});f.append(i("logout-cancel",this.tr("LOGOUT_CONFIRMATION_CANCEL")));
f.append(h("dont-ask",this.tr("LOGOUT_CONFIRMATION_DONTASK")));g.el.append(f);this.toggleDontAsk=$('input[name="dont-ask"]',g.el).button();
$("#logout-ok",g.el).click(function(j){var k=g.toggleDontAsk.is(":checked");g.controller.action.signalLogoutConfirmation(true,k)
});$("#logout-cancel",g.el).click(function(j){var k=g.toggleDontAsk.is(":checked");
g.controller.action.signalLogoutConfirmation(false,k)});return this};this.show=function(f){this.el.show();
f()};this.hide=function(){this.el.hide()};this.refreshTranslations=function(f){}};
var trim=function(b){return(b||"").replace(/^\s+|\s+$/g,"")};jQuery.fn.sortElements=(function(){var a=[].sort;
return function(c,d){d=d||function(){return this};var b=this.map(function(){var f=d.call(this),e=f.parentNode,g=e.insertBefore(document.createTextNode(""),f.nextSibling);
return function(){if(e===this){throw new Error("You can't sort elements if any one is a descendant of another.")
}e.insertBefore(this,g);e.removeChild(g)}});return a.call(this,c).each(function(e){b[e].call(d.call(this))
})}})();var SUPPORTED_LANGUAGES=["en","fr","es","ja","de","pt","it"];var DEFAULT_LANGUAGE=function(){for(var b=0,a=SUPPORTED_LANGUAGES.length;
b<a;b++){if(SUPPORTED_LANGUAGES[b]==navigator.language){return navigator.language
}}return"en"}();var TRANSLATIONS={};var Popover=function(g){var i=this;var a=g;var f=true;
var c=false;var j=false;var b=DEFAULT_LANGUAGE;var h=null;var d=false;this.initHandlers=function(){try{document.getElementById("helpButton").onclick=this.action.help;
document.getElementById("openAppButton").onclick=this.action.openApp;document.getElementById("credentialsButton").onclick=this.action.credentials;
document.getElementById("generatorButton").onclick=this.action.generator;document.getElementById("websiteButton").onclick=this.action.website;
document.getElementById("settingsButton").onclick=this.action.settings;document.getElementById("logoutButton").onclick=this.action.logout;
document.getElementById("feedbackButton").onclick=this.action.feedback;document.getElementById("inviteButton").onclick=this.action.invite
}catch(k){console.log(k)}};var e=null;this.defaultView=function(k){if(j){return"recovery"
}if(c){return"gettingstarted"}if(e&&e.selectedView&&e.selectedView!=="logout"){return e.selectedView
}if(k){return"credentials"}return"credentials"};this.localServerUrl=function(){return h
};this.communication={restoreState:function(k){e=k;if(!e){return}if(e.credentials){i.view.credentials.restoreState(e.credentials)
}if(e.generator){i.view.generator.restoreState(e.generator)}if(e.help){i.view.help.restoreState(e.help)
}},refreshTranslations:function(m){try{i.refreshTranslations(m);for(var k in i.view){try{i.view[k].refreshTranslations(m)
}catch(l){console.error(k);console.error(l)}}}catch(l){console.error(l)}},loadRecoveryView:function(l,k){j=true;
i.view.recovery.setupDetails(l,k);i.loadView("recovery")},signalDataRefresh:function(l){try{j=false;
c=false;h=l.server;i.view.credentials.signalDataRefresh(l);i.view.generator.signalDataRefresh(l.generatePassword,l.generator);
i.view.website.signalDataRefresh(l.website);d=Popover_Specific.isSafeSearchCapable();
if(d&&l.settings){i.view.settings.signalDataRefresh(l.settings)}if(f){i.loadView(i.defaultView(i.view.credentials.existingData()));
f=false}else{if(i.view.credentials.rendered()){i.view.credentials.render()}}}catch(k){console.error(k)
}},signalDataRefreshError:function(k){console.error(k);setTimeout(function(){i.action.initialData()
},1000)},signalPasswordGenerated:function(l){try{i.view.generator.signalPasswordGenerated(l)
}catch(k){console.error(k)}},signalPasswordGeneratedError:function(k){try{console.error(k);
i.view.generator.signalPasswordGeneratedError(k)}catch(l){console.error(l)}},showLogoutConfirmation:function(){i.adaptLayoutForLogout();
i.loadView("logout")},close:function(){Popover_Specific.closePopover()}};this.action={refreshTranslations:function(){a.sendMessage({action:"refreshTranslations"})
},saveState:function(k,l){if(!e){e={}}e[k]=l;a.sendMessage({action:"saveState",data:e})
},endGettingStarted:function(){c=false;i.loadView(i.defaultView(i.view.credentials.existingData()));
a.sendMessage({action:"endGettingStarted"})},usageLog:function(k,m,l){a.sendMessage({action:"usageLog",service:k||"",type:m||"",details:l||""})
},reportAutofillIssue:function(l,m,k){a.sendMessage({action:"reportAutofillIssue",type:l,description:m||"",detailled:k})
},openApp:function(){if(j){i.view.recovery.animateButton();return}i.sendMessageAndClose("openApp");
i.action.usageLog("menu","openApp")},help:function(k){if(f||c){i.view.gettingstarted.animateButton();
return}if(j){i.view.recovery.animateButton();return}i.loadView("help");i.action.usageLog("menu","help")
},credentials:function(k){if(f||c){i.view.gettingstarted.animateButton();return}if(j){i.view.recovery.animateButton();
return}i.loadView("credentials");i.action.usageLog("menu","credentials")},generator:function(k){if(f||c){i.view.gettingstarted.animateButton();
return}if(j){i.view.recovery.animateButton();return}i.loadView("generator");i.action.usageLog("menu","generator")
},website:function(k){if(f||c){i.view.gettingstarted.animateButton();return}if(j){i.view.recovery.animateButton();
return}i.loadView("website");i.action.usageLog("menu","website")},settings:function(k){if(f||c){i.view.gettingstarted.animateButton();
return}if(j){i.view.recovery.animateButton();return}i.loadView("settings");i.action.usageLog("menu","settings")
},logout:function(){if(j){i.view.recovery.animateButton();return}a.sendMessage({action:"logout"})
},signalLogoutConfirmation:function(k,l){a.sendMessage({action:"logout",confirmation:k,dontShowAgain:l});
i.adaptLayoutFromLogout();i.loadView(i.lastSelectedView);if(k){Popover_Specific.closePopover()
}},feedback:function(){i.sendMessageAndClose("feedback");i.action.usageLog("menu","openFAQ")
},invite:function(){if(j){i.view.recovery.animateButton();return}i.sendMessageAndClose("invite");
i.action.usageLog("menu","invite")},download:function(){i.sendMessageAndClose("download")
},support:function(l){if(l){var k="http://support.dashlane.com/customer/"+b+"_"+b+"/portal/articles/"+l;
a.sendMessage({action:"support",URL:k});Popover_Specific.closePopover()}else{i.sendMessageAndClose("support")
}},initialData:function(){a.sendMessage({action:"initialData"})},openCredential:function(k,l){i.action.usageLog("credentials","editCredential",l);
a.sendMessage({action:"openCredential",identifier:k});Popover_Specific.closePopover()
},openCredentialCourier:function(k,l){i.action.usageLog("credentials","shareCredential",l);
a.sendMessage({action:"openCredentialCourier",identifier:k});Popover_Specific.closePopover()
},autologinCredential:function(k,m,l){i.action.usageLog("credentials","loginFromExtension",m);
a.sendMessage({action:"autologinCredential",identifier:k});a.sendMessage({action:"openUrl",url:l});
Popover_Specific.closePopover()},generatePassword:function(k){a.sendMessage({action:"generatePassword",size:k.size,digits:k.digits,letters:k.letters,symbols:k.symbols,pronounceable:k.pronounceable})
},copyPassword:function(k){a.sendMessage({action:"copyPassword",password:k})},fillPassword:function(k){a.sendMessage({action:"fillPassword",password:k})
},saveDefaults:function(k){a.sendMessage({action:"saveDefaults",size:k.size,digits:k.digits,letters:k.letters,symbols:k.symbols,pronounceable:k.pronounceable})
},openBlogUrl:function(k){a.sendMessage({action:"openUrl",url:k});Popover_Specific.closePopover()
},disableOnDomain:function(){a.sendMessage({action:"disableOnDomain"})},disableOnPage:function(){a.sendMessage({action:"disableOnPage"})
},showReportIssueView:function(){i.loadView("report");i.action.usageLog("menu","report")
},setSafeSearchCapability:function(k){if(k){$("#settingsButton").show()}d=k},toggleSafeSearch:function(k){i.action.usageLog("settings",k?"deactivateSafeSearch":"activateSafeSearch");
a.sendMessage({action:"toggleSafeSearch"})},uninstallExtension:function(){i.action.usageLog("settings","uninstallExtension");
a.sendMessage({action:"uninstallExtension"})}};this.selectedView=null;this.lastSelectedView="credentials";
this.loadView=function(k){if(!i.view.hasOwnProperty(k)){console.error("view not recognized: "+k);
return}if(i.selectedView==k){if(!i.view[k].allowReverseAction()){return}k=i.lastSelectedView==="logout"?"credentials":i.lastSelectedView
}var m=i.selectedView?i.view[i.selectedView]:null;var l=i.view[k];if(i.selectedView){i.lastSelectedView=i.selectedView
}i.selectedView=k;i.action.saveState("selectedView",i.selectedView);if(!l.rendered()){l.render()
}$(".button").removeClass("selected");l.show(function(){if(m){m.hide()}$(".button."+k).addClass("selected")
})};this.view={help:new PopoverHelpView(i,$("#mainContent .help")),credentials:new PopoverCredentialsView(i,$("#mainContent .credentials")),generator:new PopoverGeneratorView(i,$("#mainContent .generator")),gettingstarted:new PopoverGettingStartedView(i,$("#mainContent .gettingstarted")),website:new PopoverWebsiteView(i,$("#mainContent .website")),settings:new PopoverSettingsView(i,$("#mainContent .settings")),report:new PopoverReportIssueView(i,$("#mainContent .report")),recovery:new PopoverRecoveryView(i,$("#mainContent .recovery")),logout:new PopoverLogoutConfirmationView(i,$("#mainContent .logout"))};
this.sendMessageAndClose=function(k){a.sendMessage({action:k});Popover_Specific.closePopover()
};this.onShow=function(){if(this.selectedView==="logout"){this.adaptLayoutFromLogout();
this.loadView(this.defaultView(this.view.credentials.existingData()))}if(this.selectedView=="credentials"){this.view.credentials.focusOnSearch();
this.view.credentials.refreshScrolling()}};this.onHide=function(){if(this.selectedView==="logout"){this.adaptLayoutFromLogout();
this.loadView(this.defaultView(this.view.credentials.existingData()))}};this.refreshTranslations=function(l){b=l;
for(var k=0;k<SUPPORTED_LANGUAGES.length;++k){$("body").removeClass(SUPPORTED_LANGUAGES[k])
}$("body").addClass(b);$("#openAppButton").attr("title",this.tr("OPEN_APP"));$("#credentialsButton").attr("title",this.tr("LOGINS_AND_PASSWORDS"));
$("#generatorButton").attr("title",this.tr("PASSWORD_GENERATOR"));$("#websiteButton").attr("title",this.tr("WEBSITE"));
$("#settingsButton").attr("title",this.tr("SETTINGS"));$("#helpButton").attr("title",this.tr("HELP"));
$("#logoutButton").attr("title",this.tr("LOGOUT"));$("#inviteButton").text(this.tr("INVITE_YOUR_FRIENDS"));
$("#feedbackButton .tr_content").text(this.tr("HELP"))};this.adaptLayoutForLogout=function(){$("body").addClass("logout-conf-layout")
};this.adaptLayoutFromLogout=function(){$("body").removeClass("logout-conf-layout")
};this.lang=function(){return b};this.tr=function(k){if(TRANSLATIONS.hasOwnProperty(b)){if(TRANSLATIONS[b].hasOwnProperty(k)){return TRANSLATIONS[b][k]
}else{return""}}else{if(TRANSLATIONS[DEFAULT_LANGUAGE].hasOwnProperty(k)){return TRANSLATIONS[DEFAULT_LANGUAGE][k]
}else{return""}}};this.initHandlers();if(window.navigator.platform.search(/mac/i)>=0){$("body").addClass("mac")
}else{$("body").addClass("win")}return this};var popover=new Popover(popover_Communication);
Popover_Specific.initializeOnLoad();TRANSLATIONS.en={BAD_AUTOFILL:"Incorrect autofill of my data",CONTACT_SUPPORT:"Learn more",COPY:"Copy",DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER:"Dashlane is not compatible with this device’s operating system (It still works on your other devices). Right-click to hide the extension on this device.<br/><br/>NOTE: DO NOT REMOVE this extension; if you do, it will be deleted from your other devices.",DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER:"This device has the Dashlane Chrome extension but not the Dashlane app. Please install the app on this device for Dashlane to work.",DESCRIPTION:"Description",DIGITS:"Digits",DISABLE_ON_THIS_DOMAIN:'Switch off to disable autofill on the entire <span class="domain"></span> website',DISABLE_ON_THIS_DOMAIN_NOHTML:"Switch off to disable autofill on the entire ^1 website",DISABLE_ON_THIS_PAGE:"Switch off to disable autofill on this web page only",DISABLE_SAFE_SEARCH:"Switch off to disable Safe Search",ENABLE_ON_THIS_DOMAIN:'Switch on to enable autofill on <span class="domain"></span>',ENABLE_ON_THIS_DOMAIN_NOHTML:"Switch on to enable autofill on ^1",ENABLE_ON_THIS_PAGE:"Switch on to enable autofill on this web page",ENABLE_SAFE_SEARCH:"Switch on to enable Safe Search",EXPLORE:"Start",FILL:"Fill",GREY_IMPALA:"Greyed-out logo in the field",HELP:"Help",INSTALL_DASHLANE:"Get the app",INVITE_YOUR_FRIENDS:"Invite your friends",LENGTH:"Length",LETTERS:"Letters",LOGINS_AND_PASSWORDS:"Logins and passwords",LOGOUT:"Logout",LOGOUT_CONFIRMATION_CANCEL:"Cancel",LOGOUT_CONFIRMATION_DONTASK:"Don't ask me again",LOGOUT_CONFIRMATION_OK:"Log out",LOGOUT_CONFIRMATION_TEXT:"Are you sure you want to log out of Dashlane?",LOOK_INTO_IT:"Our team will have a look at the issue as soon as possible.",NEW:"Refresh",NEXT:"Next",NO_AUTOLOGIN:"No auto-login",NO_CATEGORY:"No category",NO_CREDENTIALS:"No passwords saved",NO_CREDENTIALS_TIP:"<strong>Tip:</strong> As you log in to websites, Dashlane will ask to save your passwords for future auto-logins.",NO_IMPALA:"No Dashlane logo in a field",NO_IMPALAS:"No Dashlane logos on the whole page",OPEN_APP:"Open Dashlane app",OTHER:"Other",PASSWORD_GENERATOR:"Password generator",POPUP_ISSUE:"Irrelevant password save popup",PRONOUNCEABLE:"Pronounceable",PWD_GEN_ISSUE:"Cannot generate a password",PWD_SAVE_ISSUE:"Password not automatically saved",REPORT:"Report",REPORT_AUTOFILL_ISSUE:"Report form filling issue on this page",SEARCH:"Search",SELECT_AN_ISSUE:"Select issue type",SEND:"Send",SEND_DETAILS:"Send a screenshot and the HTML code to help debugging (be careful that no private information is present on this page before sending)",SETTINGS:"Settings",SORT_CATEGORY:"Sort by category",SORT_LASTUSED:"Sort by last used",SORT_MOSTUSED:"Sort by most used",SORT_NAME:"Sort by name",START_USING_DASHLANE:"Go!",STRENGTH:"Strength",SUBJECT:"Subject",SYMBOLS:"Symbols",THANKS:"Thank you!",TIPS:"Tips",TYPE:"Type",UNINSTALL:"Uninstall",UNINSTALL_EXTENSION:"Uninstall this extension",USE_AS_DEFAULTS:"Use as Defaults",WEBSITE_SPECIFIC:"Website Settings",WELCOME_TO_DASHLANE_IN_YOUR_BROWSER:"Welcome to Dashlane!",WORK_IN_PROGRESS:"Work in progress",YOU_ALREADY_HAVE_DASHLANE_EXTENSION:"This Dashlane extension is not active. To hide it, please update Chrome or right-click on the extension and hide.<br/><br/>NOTE: DO NOT REMOVE this extension; if you do, it will be deleted from your other devices."};
TRANSLATIONS.fr={BAD_AUTOFILL:"Remplissage incorrect de mes informations",CONTACT_SUPPORT:"En savoir plus",COPY:"Copier",DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER:"Dashlane n'est pas compatible avec le système d'exploitation de cet ordinateur (Cela n'impacte pas le fonctionnement de Dashlane sur vos autres appareils). Pour masquer l'extension, faites un clic droit + &quot;Masquer le bouton&quot;.<br/><br/>ATTENTION : Si vous supprimez l'extension au lieu de la masquer, elle sera également supprimée sur vos autres ordinateurs.",DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER:"Cette extension fonctionne correctement, mais le logiciel Dashlane n'est pas installé sur cet ordinateur. Pour utiliser Dashlane, installez le logiciel.",DESCRIPTION:"Description",DIGITS:"Chiffres",DISABLE_ON_THIS_DOMAIN:'Activer la saisie automatique sur le site <span class="domain"></span>',DISABLE_ON_THIS_DOMAIN_NOHTML:"Saisie automatique sur l'ensemble du site (^1)",DISABLE_ON_THIS_PAGE:"Activer la saisie automatique sur cette page",DISABLE_SAFE_SEARCH:"Switch off to disable Safe Search",ENABLE_ON_THIS_DOMAIN:'Activer la saisie automatique sur le site <span class="domain"></span>',ENABLE_ON_THIS_DOMAIN_NOHTML:"Saisie automatique sur l'ensemble du site (^1)",ENABLE_ON_THIS_PAGE:"Activer la saisie automatique sur cette page",ENABLE_SAFE_SEARCH:"Switch on to enable Safe Search",EXPLORE:"Commencer",FILL:"Remplir",GREY_IMPALA:"Logo Dashlane gris dans un champ",HELP:"Aide",INSTALL_DASHLANE:"Installer",INVITE_YOUR_FRIENDS:"Invitez vos amis",LENGTH:"Longueur",LETTERS:"Lettres",LOGINS_AND_PASSWORDS:"Logins et mots de passe",LOGOUT:"Déconnexion",LOGOUT_CONFIRMATION_CANCEL:"Non",LOGOUT_CONFIRMATION_DONTASK:"Ne plus me demander",LOGOUT_CONFIRMATION_OK:"Oui",LOGOUT_CONFIRMATION_TEXT:"Souhaitez-vous vraiment vous déconnecter de Dashlane ?",LOOK_INTO_IT:"Notre équipe va se pencher sur le problème.",NEW:"Régénérer",NEXT:"Suivant",NO_AUTOLOGIN:"Pas de connexion automatique",NO_CATEGORY:"Aucune catégorie",NO_CREDENTIALS:"Aucun mot de passe sauvé",NO_CREDENTIALS_TIP:"<strong>Astuce :</strong> Lorsque vous vous connectez à des sites, Dashlane vous propose de sauver vos mots de passe pour vous connecter automatiquement par la suite.",NO_IMPALA:"Pas de logo Dashlane dans un champ",NO_IMPALAS:"Pas de logo Dashlane sur la page",OPEN_APP:"Ouvrir l'application Dashlane",OTHER:"Autre",PASSWORD_GENERATOR:"Générateur de mot de passe",POPUP_ISSUE:"Sauvegarde intempestive ou erronée d'identifiants",PRONOUNCEABLE:"Prononçable",PWD_GEN_ISSUE:"Impossible de générer un mot de passe",PWD_SAVE_ISSUE:"Pas de sauvegarde automatique du mot de passe",REPORT:"Signaler",REPORT_AUTOFILL_ISSUE:"Signaler un problème de saisie automatique sur cette page",SEARCH:"Rechercher",SELECT_AN_ISSUE:"Sélectionnez un type de problème",SEND:"Envoyer",SEND_DETAILS:"Envoyer une copie de la page pour aider à la résolution du problème. (Assurez-vous de ne laisser aucune info perso sur la page.)",SETTINGS:"Paramètres",SORT_CATEGORY:"Trier par catégorie",SORT_LASTUSED:"Utilisés récemment",SORT_MOSTUSED:"Les plus utilisés",SORT_NAME:"Trier par nom",START_USING_DASHLANE:"OK !",STRENGTH:"Complexité",SUBJECT:"Objet",SYMBOLS:"Symboles",THANKS:"Merci !",TIPS:"Tips",TYPE:"Type",UNINSTALL:"Désinstaller",UNINSTALL_EXTENSION:"Désinstaller cette extension",USE_AS_DEFAULTS:"Utiliser comme valeurs par défaut",WEBSITE_SPECIFIC:"Réglages du site",WELCOME_TO_DASHLANE_IN_YOUR_BROWSER:"Bienvenue dans Dashlane",WORK_IN_PROGRESS:"En cours de développement",YOU_ALREADY_HAVE_DASHLANE_EXTENSION:"Cette extension Dashlane est désactivée. Pour la masquer, veuillez mettre à jour Google Chrome ou effectuer un clic droit et choisir l'option &quot;Masquer le bouton&quot;.<br/><br/>ATTENTION : NE SUPPRIMEZ PAS l'extension, vous la supprimeriez du même coup sur vos autres appareils."};
TRANSLATIONS.es={BAD_AUTOFILL:"Datos autocompletados incorrectamente",CONTACT_SUPPORT:"Más información",COPY:"Copiar",DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER:"Dashlane no es compatible con el sistema operativo de este dispositivo (pero seguirá funcionando en otros dispositivos). Haga clic con el botón derecho para ocultar la extensión en este dispositivo.<br/><br/>NOTA: NO ELIMINE esta extensión; si lo hace, se eliminará de otros dispositivos.",DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER:"Este dispositivo tiene la extensión Dashlane Chrome pero no la aplicación Dashlane. Instale la aplicación en este dispositivo para que pueda funcionar Dashlane.",DESCRIPTION:"Descripción",DIGITS:"Dígitos",DISABLE_ON_THIS_DOMAIN:'Desactivar para deshabilitar autocompletar en todo el <span class="domain"></span> sitio web',DISABLE_ON_THIS_DOMAIN_NOHTML:"Desactivar para deshabilitar autocompletar en todo el sitio web ^1",DISABLE_ON_THIS_PAGE:"Desactivar para deshabilitar autocompletar en esta página web solamente",DISABLE_SAFE_SEARCH:"Desactivar para inhabilitar la Búsqueda segura",ENABLE_ON_THIS_DOMAIN:'Activar para habilitar autocompletar <span class="domain"></span>',ENABLE_ON_THIS_DOMAIN_NOHTML:"Activar para habilitar autocompletar en ^1",ENABLE_ON_THIS_PAGE:"Activar para habilitar autocompletar en esta página web",ENABLE_SAFE_SEARCH:"Activar para habilitar la Búsqueda segura",EXPLORE:"Inicio",FILL:"Completar",GREY_IMPALA:"El logotipo se muestra de color gris en el campo",HELP:"Ayuda",INSTALL_DASHLANE:"Obtener la aplicación",INVITE_YOUR_FRIENDS:"Invitar a sus amigos",LENGTH:"Longitud",LETTERS:"Letras",LOGINS_AND_PASSWORDS:"Ingresos y contraseñas",LOGOUT:"Cerrar sesión",LOGOUT_CONFIRMATION_CANCEL:"Cancelar",LOGOUT_CONFIRMATION_DONTASK:"No preguntarme nuevamente",LOGOUT_CONFIRMATION_OK:"Cerrar sesión",LOGOUT_CONFIRMATION_TEXT:"¿Seguro que quiere cerrar sesión en Dashlane?",LOOK_INTO_IT:"Nuestro equipo examinará el problema lo antes posible.",NEW:"Actualizar",NEXT:"Siguiente",NO_AUTOLOGIN:"No hay ingreso automático",NO_CATEGORY:"Sin categoría",NO_CREDENTIALS:"No se guardaron contraseñas",NO_CREDENTIALS_TIP:"<strong>Sugerencia:</strong> Cuando ingresa a los sitios web, Dashlane le preguntará si desea guardar sus contraseñas para futuros ingresos automáticos.",NO_IMPALA:"No mostrar el logotipo de Dashlane en un campo",NO_IMPALAS:"No hay logotipos de Dashlane en toda la página",OPEN_APP:"Abrir la aplicación Dashlane",OTHER:"Otro",PASSWORD_GENERATOR:"Generador de contraseñas",POPUP_ISSUE:"Mensaje emergente de contraseña irrelevante",PRONOUNCEABLE:"Pronunciable",PWD_GEN_ISSUE:"Problema con el botón Generar contraseñas",PWD_SAVE_ISSUE:"Contraseña no guardada automáticamente",REPORT:"Informar",REPORT_AUTOFILL_ISSUE:"Problemas para completar informes en esta página",SEARCH:"Buscar",SELECT_AN_ISSUE:"Seleccionar tipo de problema",SEND:"Enviar",SEND_DETAILS:"Envíe una captura de pantalla y el código HTML para ayudarnos a solucionar errores (tenga cuidado de que no haya información privada en esta página antes de enviarla)",SETTINGS:"Opciones",SORT_CATEGORY:"Ordenar por categoría",SORT_LASTUSED:"Ordenar por último uso",SORT_MOSTUSED:"Ordenar por frecuencia de uso",SORT_NAME:"Ordenar por nombre",START_USING_DASHLANE:"¡Vamos!",STRENGTH:"Fortaleza",SUBJECT:"Asunto",SYMBOLS:"Símbolos",THANKS:"¡Gracias!",TIPS:"Consejos",TYPE:"Tipo",UNINSTALL:"Desinstalar",UNINSTALL_EXTENSION:"Desinstalar esta extensión",USE_AS_DEFAULTS:"Usar como predeterminados",WEBSITE_SPECIFIC:"Opciones del sitio web",WELCOME_TO_DASHLANE_IN_YOUR_BROWSER:"¡Bienvenido a Dashlane!",WORK_IN_PROGRESS:"Trabajo en curso",YOU_ALREADY_HAVE_DASHLANE_EXTENSION:"Esta extensión de Dashlane no está activa. Para ocultarla, actualice Chrome o haga clic con el botón derecho en la extensión y ocúltela.<br/><br/>NOTA: NO ELIMINE esta extensión; si lo hace, se eliminará de otros dispositivos."};
TRANSLATIONS.ja={BAD_AUTOFILL:"自分のデータ自動入力に誤りがある",CONTACT_SUPPORT:"もっと詳しく",COPY:"コピー",DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER:"Dashlane はこのデバイスの OS と互換性がありません（他のデバイス上ではお使いいただけます）。このデバイス上で拡張機能を非表示にするには右クリックしてください。<br><br>ご注意：この拡張機能を決して削除しないでください。削除された場合、他のデバイスからも削除されてしまいます。",DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER:"このデバイスにはDashlane の Chrome 拡張機能はありますが、Dashlane のアプリはありません。このデバイス上で Dashlane をお使いいただけるよう、アプリをインストールしてください。",DESCRIPTION:"説明",DIGITS:"桁数",DISABLE_ON_THIS_DOMAIN:'オフにしてウェブサイト全体で自動入力を無効化<span class="domain"></span>',DISABLE_ON_THIS_DOMAIN_NOHTML:"オフにして ^1 のウェブサイト全体で自動入力を無効化",DISABLE_ON_THIS_PAGE:"オフにしてこのウェブページのみ自動入力を無効化",DISABLE_SAFE_SEARCH:"オフにしてセーフサーチを無効化",ENABLE_ON_THIS_DOMAIN:'オンにして自動入力を有効化：<span class="domain"></span>',ENABLE_ON_THIS_DOMAIN_NOHTML:"オンにして ^1 への自動入力を有効化",ENABLE_ON_THIS_PAGE:"オンにしてこのウェブページへの自動入力を有効化",ENABLE_SAFE_SEARCH:"オンにしてセーフサーチを有効化",EXPLORE:"開始",FILL:"入力",GREY_IMPALA:"フィールド内のグレイの影がかかったロゴ",HELP:"ヘルプ",INSTALL_DASHLANE:"アプリを入手",INVITE_YOUR_FRIENDS:"友達を招待",LENGTH:"長さ",LETTERS:"文字",LOGINS_AND_PASSWORDS:"ログインとパスワード",LOGOUT:"ログアウト",LOGOUT_CONFIRMATION_CANCEL:"キャンセル",LOGOUT_CONFIRMATION_DONTASK:"今後表示しない",LOGOUT_CONFIRMATION_OK:"ログアウト",LOGOUT_CONFIRMATION_TEXT:"Dashlane をログアウトしてもよろしいですか？",LOOK_INTO_IT:"弊社のチームが問題点を早急に確認いたします。",NEW:"リフレッシュ",NEXT:"次へ",NO_AUTOLOGIN:"自動ログインなし",NO_CATEGORY:"カテゴリなし",NO_CREDENTIALS:"保存されたパスワードはありません",NO_CREDENTIALS_TIP:"<strong>ヒント：</strong>ウェブサイトにログインする際、今後の自動ログイン用にパスワードを保存をすることを求められます。",NO_IMPALA:"Dashlane のロゴがフィールドにありません",NO_IMPALAS:"ページ全体に Dashlane のロゴがありません",OPEN_APP:"Dashlane アプリを開く",OTHER:"その他",PASSWORD_GENERATOR:"パスワード生成機",POPUP_ISSUE:"適切でないパスワード保存のポップアップ",PRONOUNCEABLE:"発音可能",PWD_GEN_ISSUE:"パスワードを生成できません",PWD_SAVE_ISSUE:"パスワードが自動保存されませんでした",REPORT:"レポート",REPORT_AUTOFILL_ISSUE:"このページのフォーム入力の問題を報告",SEARCH:"検索",SELECT_AN_ISSUE:"問題の種類を選択",SEND:"送信",SEND_DETAILS:"スクリーンショットと HTML コードを送信して、デバッグにご協力ください（このページに個人情報がないことを確認してから送信してください）",SETTINGS:"設定",SORT_CATEGORY:"カテゴリごとにソート",SORT_LASTUSED:"最後に使用した順にソート",SORT_MOSTUSED:"利用頻度が高い順にソート",SORT_NAME:"名称順でソート",START_USING_DASHLANE:"始めましょう",STRENGTH:"強度",SUBJECT:"件名",SYMBOLS:"シンボル",THANKS:"ありがとうございます。",TIPS:"ヒント",TYPE:"種類",UNINSTALL:"アンインストール",UNINSTALL_EXTENSION:"この拡張機能をアンインストール",USE_AS_DEFAULTS:"初期設定として使用",WEBSITE_SPECIFIC:"ウェブサイト設定",WELCOME_TO_DASHLANE_IN_YOUR_BROWSER:"Dashlane にようこそ！",WORK_IN_PROGRESS:"進行中です",YOU_ALREADY_HAVE_DASHLANE_EXTENSION:"この Dashlane の拡張機能は無効です。非表示にするには Chrome をアップデートするか、拡張機能を右クリックして非表示にしてください。<br><br>ご注意：この拡張機能を決して削除しないでください。削除された場合、他のデバイスからも削除されてしまいます。"};
TRANSLATIONS.de={BAD_AUTOFILL:"Falsches Auto-Vervollständigen meiner Daten",CONTACT_SUPPORT:"Mehr erfahren",COPY:"Kopieren",DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER:"Dashlane ist nicht mit dem Betriebssystem dieses Geräts kompatibel (auf Ihren anderen Geräten funktioniert die App trotzdem). Mit Rechtsklick blenden Sie die Erweiterung auf diesem Gerät aus.<br/><br/>HINWEIS: ENTFERNEN Sie diese Erweiterung NICHT! Falls Sie es doch tun, wird sie auch von Ihren anderen Geräten gelöscht.",DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER:"Dieses Gerät hat die Dashlane Chrome-Erweiterung, aber nicht die Dashlane App. Bitte installieren Sie die App auf diesem Gerät, damit Dashlane funktioniert.",DESCRIPTION:"Beschreibung",DIGITS:"Ziffern",DISABLE_ON_THIS_DOMAIN:'Abschalten, um Auto-Vervollständigen auf der gesamten <span class="domain"></span> Website zu deaktivieren',DISABLE_ON_THIS_DOMAIN_NOHTML:"Abschalten, um Auto-Vervollständigen auf der gesamten ^1-Website zu deaktivieren",DISABLE_ON_THIS_PAGE:"Abschalten, um Auto-Vervollständigen nur auf dieser Webseite zu deaktivieren",DISABLE_SAFE_SEARCH:"Abschalten, um Safe Search zu deaktivieren",ENABLE_ON_THIS_DOMAIN:'Anschalten, um Auto-Vervollständigen zu aktivieren auf <span class="domain"></span>',ENABLE_ON_THIS_DOMAIN_NOHTML:"Anschalten, um Auto-Vervollständigen auf ^1 zu aktivieren",ENABLE_ON_THIS_PAGE:"Anschalten, um Auto-Vervollständigen auf dieser Webseite zu aktivieren",ENABLE_SAFE_SEARCH:"Anschalten, um Safe Search zu aktivieren",EXPLORE:"Start",FILL:"Ausfüllen",GREY_IMPALA:"Ausgegrautes Logo im Feld",HELP:"Hilfe",INSTALL_DASHLANE:"Holen Sie sich die App",INVITE_YOUR_FRIENDS:"Laden Sie Ihre Freunde ein",LENGTH:"Länge",LETTERS:"Buchstaben",LOGINS_AND_PASSWORDS:"Logins und Passwörter",LOGOUT:"Abmelden",LOGOUT_CONFIRMATION_CANCEL:"Abbrehen",LOGOUT_CONFIRMATION_DONTASK:"Nicht nochmals fragen",LOGOUT_CONFIRMATION_OK:"Abmelden",LOGOUT_CONFIRMATION_TEXT:"Möchten Sie sich wirklich bei Dashlane abmelden?",LOOK_INTO_IT:"Unser Team wird sich des Problems so schnell wie möglich annehmen.",NEW:"Aktualisieren",NEXT:"Weiter",NO_AUTOLOGIN:"Kein Auto-Anmelden",NO_CATEGORY:"Keine Kategorie",NO_CREDENTIALS:"Keine Passwörter gespeichert",NO_CREDENTIALS_TIP:"<strong>Tipp:</strong> Wenn Sie sich bei Websites anmelden, wird Dashlane Ihnen anbieten, Ihre Passwörter für das automatische Anmelden zu speichern.",NO_IMPALA:"Kein Dashlane-Logo in einem Feld",NO_IMPALAS:"Keine Dashlane-Logos auf der gesamten Seite",OPEN_APP:"Dashlane App öffnen",OTHER:"Sonstige",PASSWORD_GENERATOR:"Passwortgenerator",POPUP_ISSUE:"Irrelevantes Passwort speichern-Popup",PRONOUNCEABLE:"Aussprechbar",PWD_GEN_ISSUE:"Passwort erzeugen nicht möglich",PWD_SAVE_ISSUE:"Passwort nicht automatisch gespeichert",REPORT:"Bericht",REPORT_AUTOFILL_ISSUE:"Problem beim Ausfüllen des Berichtsformulars auf dieser Seite",SEARCH:"Suche",SELECT_AN_ISSUE:"Problemtyp auswählen",SEND:"Abschicken",SEND_DETAILS:"Senden Sie einen Screenshot und den HTML-Code, um beim Debugging zu helfen (passen Sie auf, dass auf dieser Seite keine privaten Daten zu sehen sind)",SETTINGS:"Einstellungen",SORT_CATEGORY:"Nach Kategorie sortieren",SORT_LASTUSED:"Nach letzter Verwendung sortieren",SORT_MOSTUSED:"Nach Verwendungshäufigkeit sortieren",SORT_NAME:"Nach Name sortieren",START_USING_DASHLANE:"Los!",STRENGTH:"Stärke",SUBJECT:"Betreff",SYMBOLS:"Symbole",THANKS:"Vielen Dank!",TIPS:"Tipps",TYPE:"Typ",UNINSTALL:"Deinstallieren",UNINSTALL_EXTENSION:"Diese Erweiterung deinstallieren",USE_AS_DEFAULTS:"Als Standard benutzen",WEBSITE_SPECIFIC:"Website-Einstellungen",WELCOME_TO_DASHLANE_IN_YOUR_BROWSER:"Willkommen bei Dashlane!",WORK_IN_PROGRESS:"Vorgang läuft",YOU_ALREADY_HAVE_DASHLANE_EXTENSION:"Diese Dashlane-Erweiterung ist nicht aktiv. Zum Ausblenden aktualisieren Sie Chrome oder führen Sie einen Rechtsklick auf die Erweiterung aus und klicken Sie auf Ausblenden.<br/><br/>HINWEIS: ENTFERNEN Sie diese Erweiterung NICHT! Falls Sie es doch tun, wird sie auch von Ihren anderen Geräten gelöscht."};
TRANSLATIONS.it={BAD_AUTOFILL:"Compilaziona automatica errata dei miei dati",CONTACT_SUPPORT:"Scopri di più",COPY:"Copia",DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER:"Dashlane non è compatibile per il sistema operativo di questo dispositivo (Ma funziona sugli altri tuoi dispositivi). Fai clic con il tasto destro per nascondere l'estensione su questo dispositivo.<br/><br/>NOTA: NON ELIMINARE questa estensione; se lo fai, sarà eliminata dagli altri tuoi dispositivi.",DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER:"Questo dispositivo ha l'estensione Chrome Dashlane ma non ha l'app Dashlane. Installa l'app sul dispositivo per far funzionare Dashlane.",DESCRIPTION:"Descrizione",DIGITS:"Cifre",DISABLE_ON_THIS_DOMAIN:'Diaattiva per disabilitare la compilazione automatica sull\'intero <span class="domain"></span> sito web',DISABLE_ON_THIS_DOMAIN_NOHTML:"Disattiva per disabilitare la compilazione automatica sull'intero  sito web ^1",DISABLE_ON_THIS_PAGE:"Disattiva per disabilitare la compilazione automatica solo in questa pagina web",DISABLE_SAFE_SEARCH:"Disattiva per disabilitare Safe Search",ENABLE_ON_THIS_DOMAIN:'Attiva per abilitare la compilazione automatica <span class="domain"></span>',ENABLE_ON_THIS_DOMAIN_NOHTML:"Attiva per abilitare la compilazione automatica su ^1",ENABLE_ON_THIS_PAGE:"Attiva per abilitare la compilazione automatica in questa pagina web",ENABLE_SAFE_SEARCH:"Attiva per abilitare Safe Search",EXPLORE:"Avvia",FILL:"Compila",GREY_IMPALA:"Logo oscurato nel campo",HELP:"Aiuto",INSTALL_DASHLANE:"Scarica l'app",INVITE_YOUR_FRIENDS:"Invita i tuoi amici",LENGTH:"Lunghezza",LETTERS:"Lettere",LOGINS_AND_PASSWORDS:"Dati di accesso e password",LOGOUT:"Esci",LOGOUT_CONFIRMATION_CANCEL:"Annulla",LOGOUT_CONFIRMATION_DONTASK:"Non chiedermelo più",LOGOUT_CONFIRMATION_OK:"Esci",LOGOUT_CONFIRMATION_TEXT:"Sei sicuro di voler uscire da Dashlane? ",LOOK_INTO_IT:"Il nostro team lavorerà a questo problema quanto prima",NEW:"Aggiorna",NEXT:"Avanti",NO_AUTOLOGIN:"Nessun accesso automatico",NO_CATEGORY:"Senza categoria",NO_CREDENTIALS:"Nessuna password salvata",NO_CREDENTIALS_TIP:"<strong>Suggerimento:</strong> quando accedi ai siti web, Dashlane ti chiederà di salvare le password per gli accessi automatici futuri.",NO_IMPALA:"Nessun logo Dashlane in un campo",NO_IMPALAS:"Nessun logo Dashlane sull'intera pagina",OPEN_APP:"Apri l'app Dashlane",OTHER:"Altro",PASSWORD_GENERATOR:"Generatore di password",POPUP_ISSUE:"Pop up irrilevante per il salvataggio della password",PRONOUNCEABLE:"Pronunciabile",PWD_GEN_ISSUE:"Impossibile generare una password",PWD_SAVE_ISSUE:"Password non salvata automaticamente",REPORT:"Segnala",REPORT_AUTOFILL_ISSUE:"Segnala problema di compilazione del modulo in questa pagina",SEARCH:"Cerca",SELECT_AN_ISSUE:"Seleziona il tipo di problema",SEND:"Invia",SEND_DETAILS:"Invia uno screenshot e un codice HTML per contribuire al debugging (prima di inviare, verifica che sulla pagina non ci siano informazioni private)",SETTINGS:"Impostazioni",SORT_CATEGORY:"Ordina per categoria",SORT_LASTUSED:"Ordina per ultimo utilizzo",SORT_MOSTUSED:"Ordina per più utilizzato",SORT_NAME:"Ordina per nome",START_USING_DASHLANE:"Vai!",STRENGTH:"Forza",SUBJECT:"Oggetto",SYMBOLS:"Simboli",THANKS:"Grazie!",TIPS:"Suggerimenti",TYPE:"Tipo",UNINSTALL:"Disinstalla",UNINSTALL_EXTENSION:"Disinstalla questa estensione",USE_AS_DEFAULTS:"Usa come predefiniti",WEBSITE_SPECIFIC:"Impostazioni del sito web",WELCOME_TO_DASHLANE_IN_YOUR_BROWSER:"Benvenuto in Dashlane!",WORK_IN_PROGRESS:"Lavori in corso",YOU_ALREADY_HAVE_DASHLANE_EXTENSION:"Questa estensione Dashlane non è attiva. Per nasconderla, aggiorna Chrome o fai clic con il tasto destro sull'estensione e nascondila.<br/><br/>NOTA: NON ELIMINARE questa estensione; se lo fai, sarà eliminata dagli altri tuoi dispositivi."};
TRANSLATIONS.pt={BAD_AUTOFILL:"Preenchimento automático incorreto de meus dados",CONTACT_SUPPORT:"Saiba mais",COPY:"Copiar",DASHLANE_IS_NOT_COMPATIBLE_WITH_THE_COMPUTER:"O Dashlane não é compatível com o sistema operacional deste dispositivo, mas ainda funcionará em seus outros dispositivos. Clique com o botão direito para ocultar a extensão neste dispositivo.<br/><br/>AVISO: NÃO REMOVA esta extensão para que não seja excluída de seus outros dispositivos.",DASHLANE_IS_NOT_INSTALLED_ON_THE_COMPUTER:"Este dispositivo tem a extensão do Chrome para o Dashlane, mas não o aplicativo Dashlane. Instale o aplicativo neste dispositivo para que o Dashlane funcione.",DESCRIPTION:"Descrição",DIGITS:"Dígitos",DISABLE_ON_THIS_DOMAIN:'Desative para desabilitar o preenchimento automático em todo o <span class="domain"></span> site',DISABLE_ON_THIS_DOMAIN_NOHTML:"Desative para desabilitar o preenchimento automático em todo o site ^1",DISABLE_ON_THIS_PAGE:"Desative para desabilitar o preenchimento automático apenas nesta página da Web",DISABLE_SAFE_SEARCH:"Desative para desabilitar a pesquisa segura",ENABLE_ON_THIS_DOMAIN:'Ative para habilitar o preenchimento automático em <span class="domain"></span>',ENABLE_ON_THIS_DOMAIN_NOHTML:"Ative para habilitar o preenchimento automático em ^1",ENABLE_ON_THIS_PAGE:"Ative para habilitar o preenchimento automático nesta página da Web",ENABLE_SAFE_SEARCH:"Ative para habilitar a pesquisa segura",EXPLORE:"Iniciar",FILL:"Preencher",GREY_IMPALA:"Logo acinzentado no campo",HELP:"Ajuda",INSTALL_DASHLANE:"Obter o aplicativo",INVITE_YOUR_FRIENDS:"Convide seus amigos",LENGTH:"Tamanho",LETTERS:"Letras",LOGINS_AND_PASSWORDS:"Logins e senhas",LOGOUT:"Sair",LOGOUT_CONFIRMATION_CANCEL:"Cancelar",LOGOUT_CONFIRMATION_DONTASK:"Não me perguntar novamente",LOGOUT_CONFIRMATION_OK:"Sair",LOGOUT_CONFIRMATION_TEXT:"Tem certeza que deseja sair do Dashlane? ",LOOK_INTO_IT:"Nossa equipe analisará o problema o mais rápido possível.",NEW:"Atualizar",NEXT:"Próximo",NO_AUTOLOGIN:"Nenhum login automático",NO_CATEGORY:"Sem categoria",NO_CREDENTIALS:"Nenhuma senha salva",NO_CREDENTIALS_TIP:"<strong>Dica:</strong> durante o login em sites, o Dashlane pedirá para salvar suas senhas para logins automáticos futuros.",NO_IMPALA:"Sem logo do Dashlane em um campo",NO_IMPALAS:"Sem logo do Dashlane na página toda",OPEN_APP:"Abrir o aplicativo Dashlane",OTHER:"Outro",PASSWORD_GENERATOR:"Gerador de senhas",POPUP_ISSUE:"Pop-up para salvar senha irrelevante",PRONOUNCEABLE:"Pronunciável",PWD_GEN_ISSUE:"Não foi possível gerar uma senha",PWD_SAVE_ISSUE:"Senha não salva automaticamente",REPORT:"Relatar",REPORT_AUTOFILL_ISSUE:"Relatar problema com preenchimento de formulário nesta página",SEARCH:"Pesquisar",SELECT_AN_ISSUE:"Selecionar tipo de problema",SEND:"Enviar",SEND_DETAILS:"Envie uma captura de tela e um código HTML para ajudar na depuração (verifique se não há informações pessoais nesta página antes de enviar)",SETTINGS:"Configurações",SORT_CATEGORY:"Classificar por categoria",SORT_LASTUSED:"Classificar por último utilizado",SORT_MOSTUSED:"Classificar por mais utilizado",SORT_NAME:"Classificar por nome",START_USING_DASHLANE:"Começar!",STRENGTH:"Força",SUBJECT:"Assunto",SYMBOLS:"Símbolos",THANKS:"Obrigado!",TIPS:"Dicas",TYPE:"Tipo",UNINSTALL:"Desinstalar",UNINSTALL_EXTENSION:"Desinstalar esta extensão",USE_AS_DEFAULTS:"Utilizar como padrões",WEBSITE_SPECIFIC:"Configurações do site",WELCOME_TO_DASHLANE_IN_YOUR_BROWSER:"Bem-vindo ao Dashlane!",WORK_IN_PROGRESS:"Trabalho em andamento",YOU_ALREADY_HAVE_DASHLANE_EXTENSION:"Esta extensão do Dashlane não está ativa. Para ocultá-la, atualize o Chrome ou clique com o botão direito na extensão e oculte-a.<br/><br/>AVISO: NÃO REMOVA esta extensão para que não seja excluída de seus outros dispositivos."};