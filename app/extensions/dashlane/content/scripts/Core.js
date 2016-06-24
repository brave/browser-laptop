if(typeof(KW$)=="undefined"){(function(){var W=this,ab,F=W.jQuery,S=W.$,T=W.jQuery=W.KW$=function(b,a){return new T.fn.init(b,a)
},M=/^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/,ac=/^.[^:#\[\.,]*$/;T.fn=T.prototype={init:function(e,b){e=e||document;
if(e.nodeType){this[0]=e;this.length=1;this.context=e;return this}if(typeof e==="string"){var c=M.exec(e);
if(c&&(c[1]||!b)){if(c[1]){e=T.clean([c[1]],b)}else{var a=document.getElementById(c[3]);
if(a&&a.id!=c[3]){return T().find(e)}var d=T(a||[]);d.context=document;d.selector=e;
return d}}else{return T(b).find(e)}}else{if(T.isFunction(e)){return T(document).ready(e)
}}if(e.selector&&e.context){this.selector=e.selector;this.context=e.context}return this.setArray(T.isArray(e)?e:T.makeArray(e))
},selector:"",jquery:"1.3.2",size:function(){return this.length},get:function(a){return a===ab?Array.prototype.slice.call(this):this[a]
},pushStack:function(c,a,d){var b=T(c);b.prevObject=this;b.context=this.context;if(a==="find"){b.selector=this.selector+(this.selector?" ":"")+d
}else{if(a){b.selector=this.selector+"."+a+"("+d+")"}}return b},setArray:function(a){this.length=0;
Array.prototype.push.apply(this,a);return this},each:function(a,b){return T.each(this,a,b)
},index:function(a){return T.inArray(a&&a.jquery?a[0]:a,this)},attr:function(c,a,b){var d=c;
if(typeof c==="string"){if(a===ab){return this[0]&&T[b||"attr"](this[0],c)}else{d={};
d[c]=a}}return this.each(function(e){for(c in d){T.attr(b?this.style:this,c,T.prop(this,d[c],b,e,c))
}})},css:function(b,a){if((b=="width"||b=="height")&&parseFloat(a)<0){a=ab}return this.attr(b,a,"curCSS")
},text:function(a){if(typeof a!=="object"&&a!=null){return this.empty().append((this[0]&&this[0].ownerDocument||document).createTextNode(a))
}var b="";T.each(a||this,function(){T.each(this.childNodes,function(){if(this.nodeType!=8){b+=this.nodeType!=1?this.nodeValue:T.fn.text([this])
}})});return b},wrapAll:function(b){if(this[0]){var a=T(b,this[0].ownerDocument).clone();
if(this[0].parentNode){a.insertBefore(this[0])}a.map(function(){var c=this;while(c.firstChild){c=c.firstChild
}return c}).append(this)}return this},wrapInner:function(a){return this.each(function(){T(this).contents().wrapAll(a)
})},wrap:function(a){return this.each(function(){T(this).wrapAll(a)})},append:function(){return this.domManip(arguments,true,function(a){if(this.nodeType==1){this.appendChild(a)
}})},prepend:function(){return this.domManip(arguments,true,function(a){if(this.nodeType==1){this.insertBefore(a,this.firstChild)
}})},before:function(){return this.domManip(arguments,false,function(a){this.parentNode.insertBefore(a,this)
})},after:function(){return this.domManip(arguments,false,function(a){this.parentNode.insertBefore(a,this.nextSibling)
})},end:function(){return this.prevObject||T([])},push:[].push,sort:[].sort,splice:[].splice,find:function(b){if(this.length===1){var a=this.pushStack([],"find",b);
a.length=0;T.find(b,this[0],a);return a}else{return this.pushStack(T.unique(T.map(this,function(c){return T.find(b,c)
})),"find",b)}},clone:function(b){var d=this.map(function(){if(!T.support.noCloneEvent&&!T.isXMLDoc(this)){var f=this.outerHTML;
if(!f){var e=this.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","div");
e.appendChild(this.cloneNode(true));f=e.innerHTML}return T.clean([f.replace(/ jQuery\d+="(?:\d+|null)"/g,"").replace(/^\s*/,"")])[0]
}else{return this.cloneNode(true)}});if(b===true){var a=this.find("*").andSelf(),c=0;
d.find("*").andSelf().each(function(){if(this.nodeName!==a[c].nodeName){return}var g=T.data(a[c],"events");
for(var e in g){for(var f in g[e]){T.event.add(this,e,g[e][f],g[e][f].data)}}c++})
}return d},filter:function(a){return this.pushStack(T.isFunction(a)&&T.grep(this,function(b,c){return a.call(b,c)
})||T.multiFilter(a,T.grep(this,function(b){return b.nodeType===1})),"filter",a)},closest:function(c){var a=T.expr.match.POS.test(c)?T(c):null,b=0;
return this.map(function(){var d=this;while(d&&d.ownerDocument){if(a?a.index(d)>-1:T(d).is(c)){T.data(d,"closest",b);
return d}d=d.parentNode;b++}})},not:function(b){if(typeof b==="string"){if(ac.test(b)){return this.pushStack(T.multiFilter(b,this,true),"not",b)
}else{b=T.multiFilter(b,this)}}var a=b.length&&b[b.length-1]!==ab&&!b.nodeType;return this.filter(function(){return a?T.inArray(this,b)<0:this!=b
})},add:function(a){return this.pushStack(T.unique(T.merge(this.get(),typeof a==="string"?T(a):T.makeArray(a))))
},is:function(a){return !!a&&T.multiFilter(a,this).length>0},hasClass:function(a){return !!a&&this.is("."+a)
},val:function(c){if(c===ab){var j=this[0];if(j){if(T.nodeName(j,"option")){return(j.attributes.value||{}).specified?j.value:j.text
}if(T.nodeName(j,"select")){var e=j.selectedIndex,b=[],a=j.options,f=j.type=="select-one";
if(e<0){return null}for(var h=f?e:0,d=f?e+1:a.length;h<d;h++){var g=a[h];if(g.selected){c=T(g).val();
if(f){return c}b.push(c)}}return b}return(j.value||"").replace(/\r/g,"")}return ab
}if(typeof c==="number"){c+=""}return this.each(function(){if(this.nodeType!=1){return
}if(T.isArray(c)&&/radio|checkbox/.test(this.type)){this.checked=(T.inArray(this.value,c)>=0||T.inArray(this.name,c)>=0)
}else{if(T.nodeName(this,"select")){var k=T.makeArray(c);T("option",this).each(function(){this.selected=(T.inArray(this.value,k)>=0||T.inArray(this.text,k)>=0)
});if(!k.length){this.selectedIndex=-1}}else{this.value=c}}})},html:function(a){return a===ab?(this[0]?this[0].innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g,""):null):this.empty().append(a)
},replaceWith:function(a){return this.after(a).remove()},eq:function(a){return this.slice(a,+a+1)
},slice:function(){return this.pushStack(Array.prototype.slice.apply(this,arguments),"slice",Array.prototype.slice.call(arguments).join(","))
},map:function(a){return this.pushStack(T.map(this,function(b,c){return a.call(b,c,b)
}))},andSelf:function(){return this.add(this.prevObject)},domManip:function(d,a,b){if(this[0]){var e=(this[0].ownerDocument||this[0]).createDocumentFragment(),h=T.clean(d,(this[0].ownerDocument||this[0]),e),f=e.firstChild;
if(f){for(var g=0,j=this.length;g<j;g++){b.call(c(this[g],f),this.length>1||g>0?e.cloneNode(true):e)
}}if(h){T.each(h,E)}}return this;function c(l,k){return a&&T.nodeName(l,"table")&&T.nodeName(k,"tr")?(l.getElementsByTagName("tbody")[0]||l.appendChild(l.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","tbody"))):l
}}};T.fn.init.prototype=T.fn;function E(b,a){if(a.src){T.ajax({url:a.src,async:false,dataType:"script"})
}else{T.globalEval(a.text||a.textContent||a.innerHTML||"")}if(a.parentNode){a.parentNode.removeChild(a)
}}function ad(){return +new Date}T.extend=T.fn.extend=function(){var c=arguments[0]||{},e=1,d=arguments.length,h=false,f;
if(typeof c==="boolean"){h=c;c=arguments[1]||{};e=2}if(typeof c!=="object"&&!T.isFunction(c)){c={}
}if(d==e){c=this;--e}for(;e<d;e++){if((f=arguments[e])!=null){for(var g in f){var b=c[g],a=f[g];
if(c===a){continue}if(h&&a&&typeof a==="object"&&!a.nodeType){c[g]=T.extend(h,b||(a.length!=null?[]:{}),a)
}else{if(a!==ab){c[g]=a}}}}}return c};var ag=/z-?index|font-?weight|opacity|zoom|line-?height/i,Q=document.defaultView||{},L=Object.prototype.toString;
T.extend({noConflict:function(a){W.KW$=S;if(a){W.jQuery=F}return T},isFunction:function(a){return L.call(a)==="[object Function]"
},isArray:function(a){return L.call(a)==="[object Array]"},isXMLDoc:function(a){return a.nodeType===9&&a.documentElement.nodeName!=="HTML"||!!a.ownerDocument&&T.isXMLDoc(a.ownerDocument)
},globalEval:function(a){if(a&&/\S/.test(a)){var b=document.getElementsByTagName("head")[0]||document.documentElement,c=document.createElementNS("http://www.w3.org/1999/xhtml","script");
c.type="text/javascript";if(T.support.scriptEval){c.appendChild(document.createTextNode(a))
}else{c.text=a}b.insertBefore(c,b.firstChild);b.removeChild(c)}},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()==b.toUpperCase()
},each:function(e,a,f){var g,d=0,c=e.length;if(f){if(c===ab){for(g in e){if(a.apply(e[g],f)===false){break
}}}else{for(;d<c;){if(a.apply(e[d++],f)===false){break}}}}else{if(c===ab){for(g in e){if(a.call(e[g],g,e[g])===false){break
}}}else{for(var b=e[0];d<c&&a.call(b,d,b)!==false;b=e[++d]){}}}return e},prop:function(b,a,c,d,e){if(T.isFunction(a)){a=a.call(b,d)
}return typeof a==="number"&&c=="curCSS"&&!ag.test(e)?a+"px":a},className:{add:function(b,a){T.each((a||"").split(/\s+/),function(d,c){if(b.nodeType==1&&!T.className.has(b.className,c)){b.className+=(b.className?" ":"")+c
}})},remove:function(b,a){if(b.nodeType==1){b.className=a!==ab?T.grep(b.className.split(/\s+/),function(c){return !T.className.has(a,c)
}).join(" "):""}},has:function(a,b){return a&&T.inArray(b,(a.className||a).toString().split(/\s+/))>-1
}},swap:function(b,c,a){var e={};for(var d in c){e[d]=b.style[d];b.style[d]=c[d]}a.call(b);
for(var d in c){b.style[d]=e[d]}},css:function(e,g,c,h){if(g=="width"||g=="height"){var a,f={position:"absolute",visibility:"hidden",display:"block"},b=g=="width"?["Left","Right"]:["Top","Bottom"];
function d(){a=g=="width"?e.offsetWidth:e.offsetHeight;if(h==="border"){return}T.each(b,function(){if(!h){a-=parseFloat(T.curCSS(e,"padding"+this,true))||0
}if(h==="margin"){a+=parseFloat(T.curCSS(e,"margin"+this,true))||0}else{a-=parseFloat(T.curCSS(e,"border"+this+"Width",true))||0
}})}if(e.offsetWidth!==0){d()}else{T.swap(e,f,d)}return Math.max(0,Math.round(a))
}return T.curCSS(e,g,c)},curCSS:function(e,h,g){var b,j=e.style;if(h=="opacity"&&!T.support.opacity){b=T.attr(j,"opacity");
return b==""?"1":b}if(h.match(/float/i)){h=H}if(!g&&j&&j[h]){b=j[h]}else{if(Q.getComputedStyle){if(h.match(/float/i)){h="float"
}h=h.replace(/([A-Z])/g,"-$1").toLowerCase();var a=Q.getComputedStyle(e,null);if(a){b=a.getPropertyValue(h)
}if(h=="opacity"&&b==""){b="1"}}else{if(e.currentStyle){var d=h.replace(/\-(\w)/g,function(l,k){return k.toUpperCase()
});b=e.currentStyle[h]||e.currentStyle[d];if(!/^\d+(px)?$/i.test(b)&&/^\d/.test(b)){var f=j.left,c=e.runtimeStyle.left;
e.runtimeStyle.left=e.currentStyle.left;j.left=b||0;b=j.pixelLeft+"px";j.left=f;e.runtimeStyle.left=c
}}}}return b},clean:function(g,b,d){b=b||document;if(typeof b.createElementNS==="undefined"){b=b.ownerDocument||b[0]&&b[0].ownerDocument||document
}if(!d&&g.length===1&&typeof g[0]==="string"){var e=/^<(\w+)\s*\/?>$/.exec(g[0]);
if(e){return[b.createElementNS("http://www.w3.org/1999/xhtml",e[1])]}}var f=[],h=[],a=b.createElementNS("http://www.w3.org/1999/xhtml","div");
T.each(g,function(m,j){if(typeof j==="number"){j+=""}if(!j){return}if(typeof j==="string"){j=j.replace(/(<(\w+)[^>]*?)\/>/g,function(r,q,s){return s.match(/^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i)?r:q+"></"+s+">"
});var n=j.replace(/^\s+/,"").substring(0,10).toLowerCase();var l=!n.indexOf("<opt")&&[1,"<select multiple='multiple'>","</select>"]||!n.indexOf("<leg")&&[1,"<fieldset>","</fieldset>"]||n.match(/^<(thead|tbody|tfoot|colg|cap)/)&&[1,"<table>","</table>"]||!n.indexOf("<tr")&&[2,"<table><tbody>","</tbody></table>"]||(!n.indexOf("<td")||!n.indexOf("<th"))&&[3,"<table><tbody><tr>","</tr></tbody></table>"]||!n.indexOf("<col")&&[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"]||!T.support.htmlSerialize&&[1,"div<div>","</div>"]||[0,"",""];
a.innerHTML=l[1]+j+l[2];while(l[0]--){a=a.lastChild}if(!T.support.tbody){var k=/<tbody/i.test(j),o=!n.indexOf("<table")&&!k?a.firstChild&&a.firstChild.childNodes:l[1]=="<table>"&&!k?a.childNodes:[];
for(var p=o.length-1;p>=0;--p){if(T.nodeName(o[p],"tbody")&&!o[p].childNodes.length){o[p].parentNode.removeChild(o[p])
}}}if(!T.support.leadingWhitespace&&/^\s/.test(j)){a.insertBefore(b.createTextNode(j.match(/^\s*/)[0]),a.firstChild)
}j=T.makeArray(a.childNodes)}if(j.nodeType){f.push(j)}else{f=T.merge(f,j)}});if(d){for(var c=0;
f[c];c++){if(T.nodeName(f[c],"script")&&(!f[c].type||f[c].type.toLowerCase()==="text/javascript")){h.push(f[c].parentNode?f[c].parentNode.removeChild(f[c]):f[c])
}else{if(f[c].nodeType===1){f.splice.apply(f,[c+1,0].concat(T.makeArray(f[c].getElementsByTagName("script"))))
}d.appendChild(f[c])}}return h}return f},attr:function(c,f,b){if(!c||c.nodeType==3||c.nodeType==8){return ab
}var e=!T.isXMLDoc(c),a=b!==ab;f=e&&T.props[f]||f;if(c.tagName){var g=/href|src|style/.test(f);
if(f=="selected"&&c.parentNode){c.parentNode.selectedIndex}if(f in c&&e&&!g){if(a){if(f=="type"&&T.nodeName(c,"input")&&c.parentNode){throw"type property can't be changed"
}c[f]=b}if(T.nodeName(c,"form")&&c.getAttributeNode(f)){return c.getAttributeNode(f).nodeValue
}if(f=="tabIndex"){var d=c.getAttributeNode("tabIndex");return d&&d.specified?d.value:c.nodeName.match(/(button|input|object|select|textarea)/i)?0:c.nodeName.match(/^(a|area)$/i)&&c.href?0:ab
}return c[f]}if(!T.support.style&&e&&f=="style"){return T.attr(c.style,"cssText",b)
}if(a){c.setAttribute(f,""+b)}var h=!T.support.hrefNormalized&&e&&g?c.getAttribute(f,2):c.getAttribute(f);
return h===null?ab:h}if(!T.support.opacity&&f=="opacity"){if(a){c.zoom=1;c.filter=(c.filter||"").replace(/alpha\([^)]*\)/,"")+(parseInt(b)+""=="NaN"?"":"alpha(opacity="+b*100+")")
}return c.filter&&c.filter.indexOf("opacity=")>=0?(parseFloat(c.filter.match(/opacity=([^)]*)/)[1])/100)+"":""
}f=f.replace(/-([a-z])/ig,function(k,j){return j.toUpperCase()});if(a){c[f]=b}return c[f]
},trim:function(a){return(a||"").replace(/^\s+|\s+$/g,"")},makeArray:function(a){var c=[];
if(a!=null){var b=a.length;if(b==null||typeof a==="string"||T.isFunction(a)||a.setInterval){c[0]=a
}else{while(b){c[--b]=a[b]}}}return c},inArray:function(b,a){for(var d=0,c=a.length;
d<c;d++){if(a[d]===b){return d}}return -1},merge:function(b,e){var d=0,c,a=b.length;
if(!T.support.getAll){while((c=e[d++])!=null){if(c.nodeType!=8){b[a++]=c}}}else{while((c=e[d++])!=null){b[a++]=c
}}return b},unique:function(a){var f=[],g={};try{for(var e=0,d=a.length;e<d;e++){var b=T.data(a[e]);
if(!g[b]){g[b]=true;f.push(a[e])}}}catch(c){f=a}return f},grep:function(e,a,f){var d=[];
for(var c=0,b=e.length;c<b;c++){if(!f!=!a(e[c],c)){d.push(e[c])}}return d},map:function(f,a){var e=[];
for(var d=0,c=f.length;d<c;d++){var b=a(f[d],d);if(b!=null){e[e.length]=b}}return e.concat.apply([],e)
}});var O=navigator.userAgent.toLowerCase();T.browser={version:(O.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)||[0,"0"])[1],safari:/webkit/.test(O),opera:/opera/.test(O),msie:/msie/.test(O)&&!/opera/.test(O),mozilla:/mozilla/.test(O)&&!/(compatible|webkit)/.test(O)};
T.each({parent:function(a){return a.parentNode},parents:function(a){return T.dir(a,"parentNode")
},next:function(a){return T.nth(a,2,"nextSibling")},prev:function(a){return T.nth(a,2,"previousSibling")
},nextAll:function(a){return T.dir(a,"nextSibling")},prevAll:function(a){return T.dir(a,"previousSibling")
},siblings:function(a){return T.sibling(a.parentNode.firstChild,a)},children:function(a){return T.sibling(a.firstChild)
},contents:function(a){return T.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:T.makeArray(a.childNodes)
}},function(b,a){T.fn[b]=function(d){var c=T.map(this,a);if(d&&typeof d=="string"){c=T.multiFilter(d,c)
}return this.pushStack(T.unique(c),b,d)}});T.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(b,a){T.fn[b]=function(h){var e=[],c=T(h);
for(var d=0,g=c.length;d<g;d++){var f=(d>0?this.clone(true):this).get();T.fn[a].apply(T(c[d]),f);
e=e.concat(f)}return this.pushStack(e,b,h)}});T.each({removeAttr:function(a){T.attr(this,a,"");
if(this.nodeType==1){this.removeAttribute(a)}},addClass:function(a){T.className.add(this,a)
},removeClass:function(a){T.className.remove(this,a)},toggleClass:function(a,b){if(typeof b!=="boolean"){b=!T.className.has(this,a)
}T.className[b?"add":"remove"](this,a)},remove:function(a){if(!a||T.filter(a,[this]).length){T("*",this).add([this]).each(function(){T.event.remove(this);
T.removeData(this)});if(this.parentNode){this.parentNode.removeChild(this)}}},empty:function(){T(this).children().remove();
while(this.firstChild){this.removeChild(this.firstChild)}}},function(b,a){T.fn[b]=function(){return this.each(a,arguments)
}});function Y(b,a){return b[0]&&parseInt(T.curCSS(b[0],a,true),10)||0}var aa="jQuery"+ad(),I=0,R={};
T.extend({cache:{},data:function(c,d,b){c=c==W?R:c;var a=c[aa];if(!a){a=c[aa]=++I
}if(d&&!T.cache[a]){T.cache[a]={}}if(b!==ab){T.cache[a][d]=b}return d?T.cache[a][d]:a
},removeData:function(c,d){c=c==W?R:c;var a=c[aa];if(d){if(T.cache[a]){delete T.cache[a][d];
d="";for(d in T.cache[a]){break}if(!d){T.removeData(c)}}}else{try{delete c[aa]}catch(b){if(c.removeAttribute){c.removeAttribute(aa)
}}delete T.cache[a]}},queue:function(c,d,a){if(c){d=(d||"fx")+"queue";var b=T.data(c,d);
if(!b||T.isArray(a)){b=T.data(c,d,T.makeArray(a))}else{if(a){b.push(a)}}}return b
},dequeue:function(a,b){var d=T.queue(a,b),c=d.shift();if(!b||b==="fx"){c=d[0]}if(c!==ab){c.call(a)
}}});T.fn.extend({data:function(d,b){var a=d.split(".");a[1]=a[1]?"."+a[1]:"";if(b===ab){var c=this.triggerHandler("getData"+a[1]+"!",[a[0]]);
if(c===ab&&this.length){c=T.data(this[0],d)}return c===ab&&a[1]?this.data(a[0]):c
}else{return this.trigger("setData"+a[1]+"!",[a[0],b]).each(function(){T.data(this,d,b)
})}},removeData:function(a){return this.each(function(){T.removeData(this,a)})},queue:function(b,a){if(typeof b!=="string"){a=b;
b="fx"}if(a===ab){return T.queue(this[0],b)}return this.each(function(){var c=T.queue(this,b,a);
if(b=="fx"&&c.length==1){c[0].call(this)}})},dequeue:function(a){return this.each(function(){T.dequeue(this,a)
})}});(function(){var b=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g,h=0,m=Object.prototype.toString;
var o=function(s,w,aj,ai){aj=aj||[];w=w||document;if(w.nodeType!==1&&w.nodeType!==9){return[]
}if(!s||typeof s!=="string"){return aj}var r=[],u,B,y,x,D,v,t=true;b.lastIndex=0;
while((u=b.exec(s))!==null){r.push(u[1]);if(u[2]){v=RegExp.rightContext;break}}if(r.length>1&&g.exec(s)){if(r.length===2&&l.relative[r[0]]){B=k(r[0]+r[1],w)
}else{B=l.relative[r[0]]?[w]:o(r.shift(),w);while(r.length){s=r.shift();if(l.relative[s]){s+=r.shift()
}B=k(s,B)}}}else{var C=ai?{expr:r.pop(),set:p(ai)}:o.find(r.pop(),r.length===1&&w.parentNode?w.parentNode:w,c(w));
B=o.filter(C.expr,C.set);if(r.length>0){y=p(B)}else{t=false}while(r.length){var z=r.pop(),A=z;
if(!l.relative[z]){z=""}else{A=r.pop()}if(A==null){A=w}l.relative[z](y,A,c(w))}}if(!y){y=B
}if(!y){throw"Syntax error, unrecognized expression: "+(z||s)}if(m.call(y)==="[object Array]"){if(!t){aj.push.apply(aj,y)
}else{if(w.nodeType===1){for(var q=0;y[q]!=null;q++){if(y[q]&&(y[q]===true||y[q].nodeType===1&&j(w,y[q]))){aj.push(B[q])
}}}else{for(var q=0;y[q]!=null;q++){if(y[q]&&y[q].nodeType===1){aj.push(B[q])}}}}}else{p(y,aj)
}if(v){o(v,w,aj,ai);if(n){hasDuplicate=false;aj.sort(n);if(hasDuplicate){for(var q=1;
q<aj.length;q++){if(aj[q]===aj[q-1]){aj.splice(q--,1)}}}}}return aj};o.matches=function(r,q){return o(r,null,null,q)
};o.find=function(q,x,y){var r,t;if(!q){return[]}for(var u=0,v=l.order.length;u<v;
u++){var s=l.order[u],t;if((t=l.match[s].exec(q))){var w=RegExp.leftContext;if(w.substr(w.length-1)!=="\\"){t[1]=(t[1]||"").replace(/\\/g,"");
r=l.find[s](t,x,y);if(r!=null){q=q.replace(l.match[s],"");break}}}}if(!r){r=x.getElementsByTagName("*")
}return{set:r,expr:q}};o.filter=function(D,ai,A,u){var v=D,y=[],q=ai,s,x,r=ai&&ai[0]&&c(ai[0]);
while(D&&ai.length){for(var aj in l.filter){if((s=l.match[aj].exec(D))!=null){var w=l.filter[aj],z,B;
x=false;if(q==y){y=[]}if(l.preFilter[aj]){s=l.preFilter[aj](s,q,A,y,u,r);if(!s){x=z=true
}else{if(s===true){continue}}}if(s){for(var t=0;(B=q[t])!=null;t++){if(B){z=w(B,s,t,q);
var C=u^!!z;if(A&&z!=null){if(C){x=true}else{q[t]=false}}else{if(C){y.push(B);x=true
}}}}}if(z!==ab){if(!A){q=y}D=D.replace(l.match[aj],"");if(!x){return[]}break}}}if(D==v){if(x==null){throw"Syntax error, unrecognized expression: "+D
}else{break}}v=D}return q};var l=o.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF_-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(q){return q.getAttribute("href")
}},relative:{"+":function(q,x,r){var t=typeof x==="string",y=t&&!/\W/.test(x),s=t&&!y;
if(y&&!r){x=x.toUpperCase()}for(var u=0,v=q.length,w;u<v;u++){if((w=q[u])){while((w=w.previousSibling)&&w.nodeType!==1){}q[u]=s||w&&w.nodeName===x?w||false:w===x
}}if(s){o.filter(x,q,true)}},">":function(v,s,u){var x=typeof s==="string";if(x&&!/\W/.test(s)){s=u?s:s.toUpperCase();
for(var r=0,t=v.length;r<t;r++){var w=v[r];if(w){var q=w.parentNode;v[r]=q.nodeName===s?q:false
}}}else{for(var r=0,t=v.length;r<t;r++){var w=v[r];if(w){v[r]=x?w.parentNode:w.parentNode===s
}}if(x){o.filter(s,v,true)}}},"":function(q,s,u){var r=h++,t=a;if(!s.match(/\W/)){var v=s=u?s:s.toUpperCase();
t=d}t("parentNode",s,r,q,v,u)},"~":function(q,s,u){var r=h++,t=a;if(typeof s==="string"&&!s.match(/\W/)){var v=s=u?s:s.toUpperCase();
t=d}t("previousSibling",s,r,q,v,u)}},find:{ID:function(s,r,q){if(typeof r.getElementById!=="undefined"&&!q){var t=r.getElementById(s[1]);
return t?[t]:[]}},NAME:function(r,v,u){if(typeof v.getElementsByName!=="undefined"){var s=[],w=v.getElementsByName(r[1]);
for(var q=0,t=w.length;q<t;q++){if(w[q].getAttribute("name")===r[1]){s.push(w[q])
}}return s.length===0?null:s}},TAG:function(r,q){return q.getElementsByTagName(r[1])
}},preFilter:{CLASS:function(q,s,r,t,v,u){q=" "+q[1].replace(/\\/g,"")+" ";if(u){return q
}for(var x=0,w;(w=s[x])!=null;x++){if(w){if(v^(w.className&&(" "+w.className+" ").indexOf(q)>=0)){if(!r){t.push(w)
}}else{if(r){s[x]=false}}}}return false},ID:function(q){return q[1].replace(/\\/g,"")
},TAG:function(r,s){for(var q=0;s[q]===false;q++){}return s[q]&&c(s[q])?r[1]:r[1].toUpperCase()
},CHILD:function(r){if(r[1]=="nth"){var q=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(r[2]=="even"&&"2n"||r[2]=="odd"&&"2n+1"||!/\D/.test(r[2])&&"0n+"+r[2]||r[2]);
r[2]=(q[1]+(q[2]||1))-0;r[3]=q[3]-0}r[0]=h++;return r},ATTR:function(w,s,r,t,v,u){var q=w[1].replace(/\\/g,"");
if(!u&&l.attrMap[q]){w[1]=l.attrMap[q]}if(w[2]==="~="){w[4]=" "+w[4]+" "}return w
},PSEUDO:function(v,s,r,t,u){if(v[1]==="not"){if(v[3].match(b).length>1||/^\w/.test(v[3])){v[3]=o(v[3],null,null,s)
}else{var q=o.filter(v[3],s,r,true^u);if(!r){t.push.apply(t,q)}return false}}else{if(l.match.POS.test(v[0])||l.match.CHILD.test(v[0])){return true
}}return v},POS:function(q){q.unshift(true);return q}},filters:{enabled:function(q){return q.disabled===false&&q.type!=="hidden"
},disabled:function(q){return q.disabled===true},checked:function(q){return q.checked===true
},selected:function(q){q.parentNode.selectedIndex;return q.selected===true},parent:function(q){return !!q.firstChild
},empty:function(q){return !q.firstChild},has:function(q,r,s){return !!o(s[3],q).length
},header:function(q){return/h\d/i.test(q.nodeName)},text:function(q){return"text"===q.type
},radio:function(q){return"radio"===q.type},checkbox:function(q){return"checkbox"===q.type
},file:function(q){return"file"===q.type},password:function(q){return"password"===q.type
},submit:function(q){return"submit"===q.type},image:function(q){return"image"===q.type
},reset:function(q){return"reset"===q.type},button:function(q){return"button"===q.type||q.nodeName.toUpperCase()==="BUTTON"
},input:function(q){return/input|select|textarea|button/i.test(q.nodeName)}},setFilters:{first:function(q,r){return r===0
},last:function(r,s,t,q){return s===q.length-1},even:function(q,r){return r%2===0
},odd:function(q,r){return r%2===1},lt:function(q,r,s){return r<s[3]-0},gt:function(q,r,s){return r>s[3]-0
},nth:function(q,r,s){return s[3]-0==r},eq:function(q,r,s){return s[3]-0==r}},filter:{PSEUDO:function(v,r,q,u){var s=r[1],x=l.filters[s];
if(x){return x(v,q,r,u)}else{if(s==="contains"){return(v.textContent||v.innerText||"").indexOf(r[3])>=0
}else{if(s==="not"){var w=r[3];for(var q=0,t=w.length;q<t;q++){if(w[q]===v){return false
}}return true}}}},CHILD:function(x,u){var r=u[1],w=x;switch(r){case"only":case"first":while(w=w.previousSibling){if(w.nodeType===1){return false
}}if(r=="first"){return true}w=x;case"last":while(w=w.nextSibling){if(w.nodeType===1){return false
}}return true;case"nth":var v=u[2],y=u[3];if(v==1&&y==0){return true}var s=u[0],z=x.parentNode;
if(z&&(z.sizcache!==s||!x.nodeIndex)){var t=0;for(w=z.firstChild;w;w=w.nextSibling){if(w.nodeType===1){w.nodeIndex=++t
}}z.sizcache=s}var q=x.nodeIndex-y;if(v==0){return q==0}else{return(q%v==0&&q/v>=0)
}}},ID:function(q,r){return q.nodeType===1&&q.getAttribute("id")===r},TAG:function(q,r){return(r==="*"&&q.nodeType===1)||q.nodeName===r
},CLASS:function(q,r){return(" "+(q.className||q.getAttribute("class"))+" ").indexOf(r)>-1
},ATTR:function(v,q){var r=q[1],t=l.attrHandle[r]?l.attrHandle[r](v):v[r]!=null?v[r]:v.getAttribute(r),u=t+"",w=q[2],s=q[4];
return t==null?w==="!=":w==="="?u===s:w==="*="?u.indexOf(s)>=0:w==="~="?(" "+u+" ").indexOf(s)>=0:!s?u&&t!==false:w==="!="?u!=s:w==="^="?u.indexOf(s)===0:w==="$="?u.substr(u.length-s.length)===s:w==="|="?u===s||u.substr(0,s.length+1)===s+"-":false
},POS:function(v,s,r,u){var t=s[2],q=l.setFilters[t];if(q){return q(v,r,s,u)}}}};
var g=l.match.POS;for(var e in l.match){l.match[e]=RegExp(l.match[e].source+/(?![^\[]*\])(?![^\(]*\))/.source)
}var p=function(q,r){q=Array.prototype.slice.call(q);if(r){r.push.apply(r,q);return r
}return q};try{Array.prototype.slice.call(document.documentElement.childNodes)}catch(f){p=function(u,q){var s=q||[];
if(m.call(u)==="[object Array]"){Array.prototype.push.apply(s,u)}else{if(typeof u.length==="number"){for(var r=0,t=u.length;
r<t;r++){s.push(u[r])}}else{for(var r=0;u[r];r++){s.push(u[r])}}}return s}}var n;
if(document.documentElement.compareDocumentPosition){n=function(r,s){var q=r.compareDocumentPosition(s)&4?-1:r===s?0:1;
if(q===0){hasDuplicate=true}return q}}else{if("sourceIndex" in document.documentElement){n=function(r,s){var q=r.sourceIndex-s.sourceIndex;
if(q===0){hasDuplicate=true}return q}}else{if(document.createRange){n=function(q,s){var r=q.ownerDocument.createRange(),t=s.ownerDocument.createRange();
r.selectNode(q);r.collapse(true);t.selectNode(s);t.collapse(true);var u=r.compareBoundaryPoints(Range.START_TO_END,t);
if(u===0){hasDuplicate=true}return u}}}}(function(){var r=document.createElementNS("http://www.w3.org/1999/xhtml","form"),q="script"+(new Date).getTime();
r.innerHTML="<input name='"+q+"'/>";var s=document.documentElement;s.insertBefore(r,s.firstChild);
if(!!document.getElementById(q)){l.find.ID=function(w,v,u){if(typeof v.getElementById!=="undefined"&&!u){var t=v.getElementById(w[1]);
return t?t.id===w[1]||typeof t.getAttributeNode!=="undefined"&&t.getAttributeNode("id").nodeValue===w[1]?[t]:ab:[]
}};l.filter.ID=function(u,t){var v=typeof u.getAttributeNode!=="undefined"&&u.getAttributeNode("id");
return u.nodeType===1&&v&&v.nodeValue===t}}s.removeChild(r)})();(function(){var q=document.createElementNS("http://www.w3.org/1999/xhtml","div");
q.appendChild(document.createComment(""));if(q.getElementsByTagName("*").length>0){l.find.TAG=function(t,u){var v=u.getElementsByTagName(t[1]);
if(t[1]==="*"){var r=[];for(var s=0;v[s];s++){if(v[s].nodeType===1){r.push(v[s])}}v=r
}return v}}q.innerHTML="<a href='#'></a>";if(q.firstChild&&typeof q.firstChild.getAttribute!=="undefined"&&q.firstChild.getAttribute("href")!=="#"){l.attrHandle.href=function(r){return r.getAttribute("href",2)
}}})();if(document.querySelectorAll){(function(){var r=o,q=document.createElementNS("http://www.w3.org/1999/xhtml","div");
q.innerHTML="<p class='TEST'></p>";if(q.querySelectorAll&&q.querySelectorAll(".TEST").length===0){return
}o=function(v,w,t,s){w=w||document;if(!s&&w.nodeType===9&&!c(w)){try{return p(w.querySelectorAll(v),t)
}catch(u){}}return r(v,w,t,s)};o.find=r.find;o.filter=r.filter;o.selectors=r.selectors;
o.matches=r.matches})()}if(document.getElementsByClassName&&document.documentElement.getElementsByClassName){(function(){var q=document.createElementNS("http://www.w3.org/1999/xhtml","div");
q.innerHTML="<div class='test e'></div><div class='test'></div>";if(q.getElementsByClassName("e").length===0){return
}q.lastChild.className="e";if(q.getElementsByClassName("e").length===1){return}l.order.splice(1,0,"CLASS");
l.find.CLASS=function(t,s,r){if(typeof s.getElementsByClassName!=="undefined"&&!r){return s.getElementsByClassName(t[1])
}}})()}function d(w,r,s,y,q,z){var A=w=="previousSibling"&&!z;for(var u=0,v=y.length;
u<v;u++){var x=y[u];if(x){if(A&&x.nodeType===1){x.sizcache=s;x.sizset=u}x=x[w];var t=false;
while(x){if(x.sizcache===s){t=y[x.sizset];break}if(x.nodeType===1&&!z){x.sizcache=s;
x.sizset=u}if(x.nodeName===r){t=x;break}x=x[w]}y[u]=t}}}function a(w,r,s,y,q,z){var A=w=="previousSibling"&&!z;
for(var u=0,v=y.length;u<v;u++){var x=y[u];if(x){if(A&&x.nodeType===1){x.sizcache=s;
x.sizset=u}x=x[w];var t=false;while(x){if(x.sizcache===s){t=y[x.sizset];break}if(x.nodeType===1){if(!z){x.sizcache=s;
x.sizset=u}if(typeof r!=="string"){if(x===r){t=true;break}}else{if(o.filter(r,[x]).length>0){t=x;
break}}}x=x[w]}y[u]=t}}}var j=document.compareDocumentPosition?function(q,r){return q.compareDocumentPosition(r)&16
}:function(q,r){return q!==r&&(q.contains?q.contains(r):true)};var c=function(q){return q.nodeType===9&&q.documentElement.nodeName!=="HTML"||!!q.ownerDocument&&c(q.ownerDocument)
};var k=function(t,v){var q=[],x="",w,r=v.nodeType?[v]:v;while((w=l.match.PSEUDO.exec(t))){x+=w[0];
t=t.replace(l.match.PSEUDO,"")}t=l.relative[t]?t+"*":t;for(var u=0,s=r.length;u<s;
u++){o(t,r[u],q)}return o.filter(x,q)};T.find=o;T.filter=o.filter;T.expr=o.selectors;
T.expr[":"]=T.expr.filters;o.selectors.filters.hidden=function(q){return q.offsetWidth===0||q.offsetHeight===0
};o.selectors.filters.visible=function(q){return q.offsetWidth>0||q.offsetHeight>0
};o.selectors.filters.animated=function(q){return T.grep(T.timers,function(r){return q===r.elem
}).length};T.multiFilter=function(q,s,r){if(r){q=":not("+q+")"}return o.matches(q,s)
};T.dir=function(r,s){var t=[],q=r[s];while(q&&q!=document){if(q.nodeType==1){t.push(q)
}q=q[s]}return t};T.nth=function(u,t,r,q){t=t||1;var s=0;for(;u;u=u[r]){if(u.nodeType==1&&++s==t){break
}}return u};T.sibling=function(q,r){var s=[];for(;q;q=q.nextSibling){if(q.nodeType==1&&q!=r){s.push(q)
}}return s};return;W.Sizzle=o})();T.event={add:function(c,f,d,a){if(c.nodeType==3||c.nodeType==8){return
}if(c.setInterval&&c!=W){c=W}if(!d.guid){d.guid=this.guid++}if(a!==ab){var e=d;d=this.proxy(e);
d.data=a}var g=T.data(c,"events")||T.data(c,"events",{}),b=T.data(c,"handle")||T.data(c,"handle",function(){return typeof T!=="undefined"&&!T.event.triggered?T.event.handle.apply(arguments.callee.elem,arguments):ab
});b.elem=c;T.each(f.split(/\s+/),function(l,k){var j=k.split(".");k=j.shift();d.type=j.slice().sort().join(".");
var h=g[k];if(T.event.specialAll[k]){T.event.specialAll[k].setup.call(c,a,j)}if(!h){h=g[k]={};
if(!T.event.special[k]||T.event.special[k].setup.call(c,a,j)===false){if(c.addEventListener){c.addEventListener(k,b,false)
}else{if(c.attachEvent){c.attachEvent("on"+k,b)}}}}h[d.guid]=d;T.event.global[k]=true
});c=null},guid:1,global:{},remove:function(b,e,c){if(b.nodeType==3||b.nodeType==8){return
}var f=T.data(b,"events"),g,h;if(f){if(e===ab||(typeof e==="string"&&e.charAt(0)==".")){for(var d in f){this.remove(b,d+(e||""))
}}else{if(e.type){c=e.handler;e=e.type}T.each(e.split(/\s+/),function(n,l){var j=l.split(".");
l=j.shift();var m=RegExp("(^|\\.)"+j.slice().sort().join(".*\\.")+"(\\.|$)");if(f[l]){if(c){delete f[l][c.guid]
}else{for(var k in f[l]){if(m.test(f[l][k].type)){delete f[l][k]}}}if(T.event.specialAll[l]){T.event.specialAll[l].teardown.call(b,j)
}for(g in f[l]){break}if(!g){if(!T.event.special[l]||T.event.special[l].teardown.call(b,j)===false){if(b.removeEventListener){b.removeEventListener(l,T.data(b,"handle"),false)
}else{if(b.detachEvent){b.detachEvent("on"+l,T.data(b,"handle"))}}}g=null;delete f[l]
}}})}for(g in f){break}if(!g){var a=T.data(b,"handle");if(a){a.elem=null}T.removeData(b,"events");
T.removeData(b,"handle")}}},trigger:function(d,b,e,h){var f=d.type||d;if(!h){d=typeof d==="object"?d[aa]?d:T.extend(T.Event(f),d):T.Event(f);
if(f.indexOf("!")>=0){d.type=f=f.slice(0,-1);d.exclusive=true}if(!e){d.stopPropagation();
if(this.global[f]){T.each(T.cache,function(){if(this.events&&this.events[f]){T.event.trigger(d,b,this.handle.elem)
}})}}if(!e||e.nodeType==3||e.nodeType==8){return ab}d.result=ab;d.target=e;b=T.makeArray(b);
b.unshift(d)}d.currentTarget=e;var c=T.data(e,"handle");if(c){c.apply(e,b)}if((!e[f]||(T.nodeName(e,"a")&&f=="click"))&&e["on"+f]&&e["on"+f].apply(e,b)===false){d.result=false
}if(!h&&e[f]&&!d.isDefaultPrevented()&&!(T.nodeName(e,"a")&&f=="click")){this.triggered=true;
try{e[f]()}catch(a){}}this.triggered=false;if(!d.isPropagationStopped()){var g=e.parentNode||e.ownerDocument;
if(g){T.event.trigger(d,b,g,true)}}},handle:function(b){var c,h;b=arguments[0]=T.event.fix(b||W.event);
b.currentTarget=this;var a=b.type.split(".");b.type=a.shift();c=!a.length&&!b.exclusive;
var d=RegExp("(^|\\.)"+a.slice().sort().join(".*\\.")+"(\\.|$)");h=(T.data(this,"events")||{})[b.type];
for(var f in h){var e=h[f];if(c||d.test(e.type)){b.handler=e;b.data=e.data;var g=e.apply(this,arguments);
if(g!==ab){b.result=g;if(g===false){b.preventDefault();b.stopPropagation()}}if(b.isImmediatePropagationStopped()){break
}}}},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),fix:function(c){if(c[aa]){return c
}var e=c;c=T.Event(e);for(var d=this.props.length,a;d;){a=this.props[--d];c[a]=e[a]
}if(!c.target){c.target=c.srcElement||document}if(c.target.nodeType==3){c.target=c.target.parentNode
}if(!c.relatedTarget&&c.fromElement){c.relatedTarget=c.fromElement==c.target?c.toElement:c.fromElement
}if(c.pageX==null&&c.clientX!=null){var b=document.documentElement,f=document.body;
c.pageX=c.clientX+(b&&b.scrollLeft||f&&f.scrollLeft||0)-(b.clientLeft||0);c.pageY=c.clientY+(b&&b.scrollTop||f&&f.scrollTop||0)-(b.clientTop||0)
}if(!c.which&&((c.charCode||c.charCode===0)?c.charCode:c.keyCode)){c.which=c.charCode||c.keyCode
}if(!c.metaKey&&c.ctrlKey){c.metaKey=c.ctrlKey}if(!c.which&&c.button){c.which=(c.button&1?1:(c.button&2?3:(c.button&4?2:0)))
}return c},proxy:function(a,b){b=b||function(){return a.apply(this,arguments)};b.guid=a.guid=a.guid||b.guid||this.guid++;
return b},special:{ready:{setup:P,teardown:function(){}}},specialAll:{live:{setup:function(b,a){T.event.add(this,a[0],af)
},teardown:function(a){if(a.length){var c=0,b=RegExp("(^|\\.)"+a[0]+"(\\.|$)");T.each((T.data(this,"events").live||{}),function(){if(b.test(this.type)){c++
}});if(c<1){T.event.remove(this,a[0],af)}}}}}};T.Event=function(a){if(!this.preventDefault){return new T.Event(a)
}if(a&&a.type){this.originalEvent=a;this.type=a.type}else{this.type=a}this.timeStamp=ad();
this[aa]=true};function X(){return false}function J(){return true}T.Event.prototype={preventDefault:function(){this.isDefaultPrevented=J;
var a=this.originalEvent;if(!a){return}if(a.preventDefault){a.preventDefault()}a.returnValue=false
},stopPropagation:function(){this.isPropagationStopped=J;var a=this.originalEvent;
if(!a){return}if(a.stopPropagation){a.stopPropagation()}a.cancelBubble=true},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=J;
this.stopPropagation()},isDefaultPrevented:X,isPropagationStopped:X,isImmediatePropagationStopped:X};
var ah=function(b){var c=b.relatedTarget;while(c&&c!=this){try{c=c.parentNode}catch(a){c=this
}}if(c!=this){b.type=b.data;T.event.handle.apply(this,arguments)}};T.each({mouseover:"mouseenter",mouseout:"mouseleave"},function(a,b){T.event.special[b]={setup:function(){T.event.add(this,a,ah,b)
},teardown:function(){T.event.remove(this,a,ah)}}});T.fn.extend({bind:function(b,a,c){return b=="unload"?this.one(b,a,c):this.each(function(){T.event.add(this,b,c||a,c&&a)
})},one:function(b,a,c){var d=T.event.proxy(c||a,function(e){T(this).unbind(e,d);
return(c||a).apply(this,arguments)});return this.each(function(){T.event.add(this,b,d,c&&a)
})},unbind:function(a,b){return this.each(function(){T.event.remove(this,a,b)})},trigger:function(b,a){return this.each(function(){T.event.trigger(b,a,this)
})},triggerHandler:function(c,a){if(this[0]){var b=T.Event(c);b.preventDefault();
b.stopPropagation();T.event.trigger(b,a,this[0]);return b.result}},toggle:function(a){var c=arguments,b=1;
while(b<c.length){T.event.proxy(a,c[b++])}return this.click(T.event.proxy(a,function(d){this.lastToggle=(this.lastToggle||0)%b;
d.preventDefault();return c[this.lastToggle++].apply(this,arguments)||false}))},hover:function(b,a){return this.mouseenter(b).mouseleave(a)
},ready:function(a){P();if(T.isReady){a.call(document,T)}else{T.readyList.push(a)
}return this},live:function(a,b){var c=T.event.proxy(b);c.guid+=this.selector+a;T(document).bind(Z(a,this.selector),this.selector,c);
return this},die:function(a,b){T(document).unbind(Z(a,this.selector),b?{guid:b.guid+this.selector+a}:null);
return this}});function af(a){var d=RegExp("(^|\\.)"+a.type+"(\\.|$)"),b=true,c=[];
T.each(T.data(this,"events").live||[],function(g,f){if(d.test(f.type)){var e=T(a.target).closest(f.data)[0];
if(e){c.push({elem:e,fn:f})}}});c.sort(function(e,f){return T.data(e.elem,"closest")-T.data(f.elem,"closest")
});T.each(c,function(){if(this.fn.call(this.elem,a,this.fn.data)===false){return(b=false)
}});return b}function Z(a,b){return["live",a,b.replace(/\./g,"`").replace(/ /g,"|")].join(".")
}T.extend({isReady:false,readyList:[],ready:function(){if(!T.isReady){T.isReady=true;
if(T.readyList){T.each(T.readyList,function(){this.call(document,T)});T.readyList=null
}T(document).triggerHandler("ready")}}});var G=false;function P(){if(G){return}G=true;
if(document.addEventListener){document.addEventListener("DOMContentLoaded",function(){document.removeEventListener("DOMContentLoaded",arguments.callee,false);
T.ready()},false)}else{if(document.attachEvent){document.attachEvent("onreadystatechange",function(){if(document.readyState==="complete"){document.detachEvent("onreadystatechange",arguments.callee);
T.ready()}});if(document.documentElement.doScroll&&W==W.top){(function(){if(T.isReady){return
}try{document.documentElement.doScroll("left")}catch(a){setTimeout(arguments.callee,0);
return}T.ready()})()}}}T.event.add(W,"load",T.ready)}T.each(("blur,focus,load,resize,scroll,unload,click,dblclick,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,change,select,submit,keydown,keypress,keyup,error").split(","),function(a,b){T.fn[b]=function(c){return c?this.bind(b,c):this.trigger(b)
}});T(W).bind("unload",function(){for(var a in T.cache){if(a!=1&&T.cache[a].handle){T.event.remove(T.cache[a].handle.elem)
}}});(function(){T.support={};var e=document.documentElement,d=document.createElementNS("http://www.w3.org/1999/xhtml","script"),a=document.createElementNS("http://www.w3.org/1999/xhtml","div"),b="script"+(new Date).getTime();
a.style.display="none";a.innerHTML='   <link/><table></table><a href="/a">a</a><select><option>text</option></select><object><param/></object>';
var c=a.getElementsByTagName("*"),f=a.getElementsByTagName("a")[0];f.style.cssText="color:red;float:left;opacity:.5";
if(!c||!c.length||!f){return}T.support={leadingWhitespace:a.firstChild.nodeType==3,tbody:!a.getElementsByTagName("tbody").length,objectAll:!!a.getElementsByTagName("object")[0].getElementsByTagName("*").length,htmlSerialize:!!a.getElementsByTagName("link").length,style:/red/.test(f.getAttribute("style")),hrefNormalized:f.getAttribute("href")==="/a",opacity:f.style.opacity==="0.5",cssFloat:!!f.style.cssFloat,scriptEval:false,noCloneEvent:true,boxModel:null};
T.support.scriptEval=true;if(a.attachEvent&&a.fireEvent){a.attachEvent("onclick",function(){T.support.noCloneEvent=false;
a.detachEvent("onclick",arguments.callee)});a.cloneNode(true).fireEvent("onclick")
}T(function(){var g=document.createElementNS("http://www.w3.org/1999/xhtml","div");
g.style.width=g.style.paddingLeft="1px";document.body.appendChild(g);T.boxModel=T.support.boxModel=g.offsetWidth===2;
document.body.removeChild(g).style.display="none"})})();var H=T.support.cssFloat?"cssFloat":"styleFloat";
T.props={"for":"htmlFor","class":"className","float":H,cssFloat:H,styleFloat:H,readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",tabindex:"tabIndex"};
T.fn.extend({_load:T.fn.load,load:function(e,b,a){if(typeof e!=="string"){return this._load(e)
}var c=e.indexOf(" ");if(c>=0){var g=e.slice(c,e.length);e=e.slice(0,c)}var d="GET";
if(b){if(T.isFunction(b)){a=b;b=null}else{if(typeof b==="object"){b=T.param(b);d="POST"
}}}var f=this;T.ajax({url:e,type:d,dataType:"html",data:b,complete:function(j,h){if(h=="success"||h=="notmodified"){f.html(g?T("<div/>").append(j.responseText.replace(/<script(.|\s)*?\/script>/g,"")).find(g):j.responseText)
}if(a){f.each(a,[j.responseText,h,j])}}});return this},serialize:function(){return T.param(this.serializeArray())
},serializeArray:function(){return this.map(function(){return this.elements?T.makeArray(this.elements):this
}).filter(function(){return this.name&&!this.disabled&&(this.checked||/select|textarea/i.test(this.nodeName)||/text|hidden|password|search/i.test(this.type))
}).map(function(c,b){var a=T(this).val();return a==null?null:T.isArray(a)?T.map(a,function(d,e){return{name:b.name,value:d}
}):{name:b.name,value:a}}).get()}});T.each("ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend".split(","),function(b,a){T.fn[a]=function(c){return this.bind(a,c)
}});var N=ad();T.extend({get:function(d,b,a,c){if(T.isFunction(b)){a=b;b=null}return T.ajax({type:"GET",url:d,data:b,success:a,dataType:c})
},getScript:function(b,a){return T.get(b,null,a,"script")},getJSON:function(c,b,a){return T.get(c,b,a,"json")
},post:function(d,b,a,c){if(T.isFunction(b)){a=b;b={}}return T.ajax({type:"POST",url:d,data:b,success:a,dataType:c})
},ajaxSetup:function(a){T.extend(T.ajaxSettings,a)},ajaxSettings:{url:location.href,global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:function(){return W.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest()
},accepts:{xml:"application/xml, text/xml",html:"text/html",script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},lastModified:{},ajax:function(l){l=T.extend(true,l,T.extend(true,{},T.ajaxSettings,l));
var a,s=/=\?(&|$)/g,f,b,r=l.type.toUpperCase();if(l.data&&l.processData&&typeof l.data!=="string"){l.data=T.param(l.data)
}if(l.dataType=="jsonp"){if(r=="GET"){if(!l.url.match(s)){l.url+=(l.url.match(/\?/)?"&":"?")+(l.jsonp||"callback")+"=?"
}}else{if(!l.data||!l.data.match(s)){l.data=(l.data?l.data+"&":"")+(l.jsonp||"callback")+"=?"
}}l.dataType="json"}if(l.dataType=="json"&&(l.data&&l.data.match(s)||l.url.match(s))){a="jsonp"+N++;
if(l.data){l.data=(l.data+"").replace(s,"="+a+"$1")}l.url=l.url.replace(s,"="+a+"$1");
l.dataType="script";W[a]=function(v){b=v;p();m();W[a]=ab;try{delete W[a]}catch(u){}if(q){q.removeChild(d)
}}}if(l.dataType=="script"&&l.cache==null){l.cache=false}if(l.cache===false&&r=="GET"){var t=ad();
var c=l.url.replace(/(\?|&)_=.*?(&|$)/,"$1_="+t+"$2");l.url=c+((c==l.url)?(l.url.match(/\?/)?"&":"?")+"_="+t:"")
}if(l.data&&r=="GET"){l.url+=(l.url.match(/\?/)?"&":"?")+l.data;l.data=null}if(l.global&&!T.active++){T.event.trigger("ajaxStart")
}var g=/^(\w+:)?\/\/([^\/?#]+)/.exec(l.url);if(l.dataType=="script"&&r=="GET"&&g&&(g[1]&&g[1]!=location.protocol||g[2]!=location.host)){var q=document.getElementsByTagName("head")[0];
var d=document.createElementNS("http://www.w3.org/1999/xhtml","script");d.src=l.url;
if(l.scriptCharset){d.charset=l.scriptCharset}if(!a){var j=false;d.onload=d.onreadystatechange=function(){if(!j&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){j=true;
p();m();d.onload=d.onreadystatechange=null;q.removeChild(d)}}}q.appendChild(d);return ab
}var n=false;var o=l.xhr();if(l.username){o.open(r,l.url,l.async,l.username,l.password)
}else{o.open(r,l.url,l.async)}try{if(l.data){o.setRequestHeader("Content-Type",l.contentType)
}if(l.ifModified){o.setRequestHeader("If-Modified-Since",T.lastModified[l.url]||"Thu, 01 Jan 1970 00:00:00 GMT")
}o.setRequestHeader("X-Requested-With","XMLHttpRequest");o.setRequestHeader("Accept",l.dataType&&l.accepts[l.dataType]?l.accepts[l.dataType]+", */*":l.accepts._default)
}catch(e){}if(l.beforeSend&&l.beforeSend(o,l)===false){if(l.global&&!--T.active){T.event.trigger("ajaxStop")
}o.abort();return false}if(l.global){T.event.trigger("ajaxSend",[o,l])}var k=function(w){if(o.readyState==0){if(h){clearInterval(h);
h=null;if(l.global&&!--T.active){T.event.trigger("ajaxStop")}}}else{if(!n&&o&&(o.readyState==4||w=="timeout")){n=true;
if(h){clearInterval(h);h=null}f=w=="timeout"?"timeout":!T.httpSuccess(o)?"error":l.ifModified&&T.httpNotModified(o,l.url)?"notmodified":"success";
if(f=="success"){try{b=T.httpData(o,l.dataType,l)}catch(u){f="parsererror"}}if(f=="success"){var v;
try{v=o.getResponseHeader("Last-Modified")}catch(u){}if(l.ifModified&&v){T.lastModified[l.url]=v
}if(!a){p()}}else{T.handleError(l,o,f)}m();if(w){o.abort()}if(l.async){o=null}}}};
if(l.async){var h=setInterval(k,13);if(l.timeout>0){setTimeout(function(){if(o&&!n){k("timeout")
}},l.timeout)}}try{o.send(l.data)}catch(e){T.handleError(l,o,null,e)}if(!l.async){k()
}function p(){if(l.success){l.success(b,f)}if(l.global){T.event.trigger("ajaxSuccess",[o,l])
}}function m(){if(l.complete){l.complete(o,f)}if(l.global){T.event.trigger("ajaxComplete",[o,l])
}if(l.global&&!--T.active){T.event.trigger("ajaxStop")}}return o},handleError:function(c,a,d,b){if(c.error){c.error(a,d,b)
}if(c.global){T.event.trigger("ajaxError",[a,c,b])}},active:0,httpSuccess:function(a){try{return !a.status&&location.protocol=="file:"||(a.status>=200&&a.status<300)||a.status==304||a.status==1223
}catch(b){}return false},httpNotModified:function(b,d){try{var a=b.getResponseHeader("Last-Modified");
return b.status==304||a==T.lastModified[d]}catch(c){}return false},httpData:function(a,c,d){var e=a.getResponseHeader("content-type"),f=c=="xml"||!c&&e&&e.indexOf("xml")>=0,b=f?a.responseXML:a.responseText;
if(f&&b.documentElement.tagName=="parsererror"){throw"parsererror"}if(d&&d.dataFilter){b=d.dataFilter(b,c)
}if(typeof b==="string"){if(c=="script"){T.globalEval(b)}if(c=="json"){b=W["eval"]("("+b+")")
}}return b},param:function(d){var b=[];function a(f,e){b[b.length]=encodeURIComponent(f)+"="+encodeURIComponent(e)
}if(T.isArray(d)||d.jquery){T.each(d,function(){a(this.name,this.value)})}else{for(var c in d){if(T.isArray(d[c])){T.each(d[c],function(){a(c,this)
})}else{a(c,T.isFunction(d[c])?d[c]():d[c])}}}return b.join("&").replace(/%20/g,"+")
}});var V={},U,ae=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];
function K(b,c){var a={};T.each(ae.concat.apply([],ae.slice(0,c)),function(){a[this]=b
});return a}T.fn.extend({show:function(c,a){if(c){return this.animate(K("show",3),c,a)
}else{for(var e=0,g=this.length;e<g;e++){var h=T.data(this[e],"olddisplay");this[e].style.display=h||"";
if(T.css(this[e],"display")==="none"){var f=this[e].tagName,b;if(V[f]){b=V[f]}else{var d=T("<"+f+" />").appendTo("body");
b=d.css("display");if(b==="none"){b="block"}d.remove();V[f]=b}T.data(this[e],"olddisplay",b)
}}for(var e=0,g=this.length;e<g;e++){this[e].style.display=T.data(this[e],"olddisplay")||""
}return this}},hide:function(b,a){if(b){return this.animate(K("hide",3),b,a)}else{for(var c=0,d=this.length;
c<d;c++){var e=T.data(this[c],"olddisplay");if(!e&&e!=="none"){T.data(this[c],"olddisplay",T.css(this[c],"display"))
}}for(var c=0,d=this.length;c<d;c++){this[c].style.display="none"}return this}},_toggle:T.fn.toggle,toggle:function(a,b){var c=typeof a==="boolean";
return T.isFunction(a)&&T.isFunction(b)?this._toggle.apply(this,arguments):a==null||c?this.each(function(){var d=c?a:T(this).is(":hidden");
T(this)[d?"show":"hide"]()}):this.animate(K("toggle",3),a,b)},fadeTo:function(c,a,b){return this.animate({opacity:a},c,b)
},animate:function(a,d,b,c){var e=T.speed(d,b,c);return this[e.queue===false?"each":"queue"](function(){var g=T.extend({},e),j,f=this.nodeType==1&&T(this).is(":hidden"),h=this;
for(j in a){if(a[j]=="hide"&&f||a[j]=="show"&&!f){return g.complete.call(this)}if((j=="height"||j=="width")&&this.style){g.display=T.css(this,"display");
g.overflow=this.style.overflow}}if(g.overflow!=null){this.style.overflow="hidden"
}g.curAnim=T.extend({},a);T.each(a,function(p,l){var m=new T.fx(h,g,p);if(/toggle|show|hide/.test(l)){m[l=="toggle"?f?"show":"hide":l](a)
}else{var n=l.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),k=m.cur(true)||0;if(n){var q=parseFloat(n[2]),o=n[3]||"px";
if(o!="px"){h.style[p]=(q||1)+o;k=((q||1)/m.cur(true))*k;h.style[p]=k+o}if(n[1]){q=((n[1]=="-="?-1:1)*q)+k
}m.custom(k,q,o)}else{m.custom(k,l,"")}}});return true})},stop:function(b,c){var a=T.timers;
if(b){this.queue([])}this.each(function(){for(var d=a.length-1;d>=0;d--){if(a[d].elem==this){if(c){a[d](true)
}a.splice(d,1)}}});if(!c){this.dequeue()}return this}});T.each({slideDown:K("show",1),slideUp:K("hide",1),slideToggle:K("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"}},function(b,a){T.fn[b]=function(d,c){return this.animate(a,d,c)
}});T.extend({speed:function(b,a,c){var d=typeof b==="object"?b:{complete:c||!c&&a||T.isFunction(b)&&b,duration:b,easing:c&&a||a&&!T.isFunction(a)&&a};
d.duration=T.fx.off?0:typeof d.duration==="number"?d.duration:T.fx.speeds[d.duration]||T.fx.speeds._default;
d.old=d.complete;d.complete=function(){if(d.queue!==false){T(this).dequeue()}if(T.isFunction(d.old)){d.old.call(this)
}};return d},easing:{linear:function(b,a,d,c){return d+c*b},swing:function(b,a,d,c){return((-Math.cos(b*Math.PI)/2)+0.5)*c+d
}},timers:[],fx:function(b,c,a){this.options=c;this.elem=b;this.prop=a;if(!c.orig){c.orig={}
}}});T.fx.prototype={update:function(){if(this.options.step){this.options.step.call(this.elem,this.now,this)
}(T.fx.step[this.prop]||T.fx.step._default)(this);if((this.prop=="height"||this.prop=="width")&&this.elem.style){this.elem.style.display="block"
}},cur:function(a){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null)){return this.elem[this.prop]
}var b=parseFloat(T.css(this.elem,this.prop,a));return b&&b>-10000?b:parseFloat(T.curCSS(this.elem,this.prop))||0
},custom:function(a,b,c){this.startTime=ad();this.start=a;this.end=b;this.unit=c||this.unit||"px";
this.now=this.start;this.pos=this.state=0;var e=this;function d(f){return e.step(f)
}d.elem=this.elem;if(d()&&T.timers.push(d)&&!U){U=setInterval(function(){var f=T.timers;
for(var g=0;g<f.length;g++){if(!f[g]()){f.splice(g--,1)}}if(!f.length){clearInterval(U);
U=ab}},13)}},show:function(){this.options.orig[this.prop]=T.attr(this.elem.style,this.prop);
this.options.show=true;this.custom(this.prop=="width"||this.prop=="height"?1:0,this.cur());
T(this.elem).show()},hide:function(){this.options.orig[this.prop]=T.attr(this.elem.style,this.prop);
this.options.hide=true;this.custom(this.cur(),0)},step:function(c){var d=ad();if(c||d>=this.options.duration+this.startTime){this.now=this.end;
this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;var f=true;
for(var e in this.options.curAnim){if(this.options.curAnim[e]!==true){f=false}}if(f){if(this.options.display!=null){this.elem.style.overflow=this.options.overflow;
this.elem.style.display=this.options.display;if(T.css(this.elem,"display")=="none"){this.elem.style.display="block"
}}if(this.options.hide){T(this.elem).hide()}if(this.options.hide||this.options.show){for(var b in this.options.curAnim){T.attr(this.elem.style,b,this.options.orig[b])
}}this.options.complete.call(this.elem)}return false}else{var a=d-this.startTime;
this.state=a/this.options.duration;this.pos=T.easing[this.options.easing||(T.easing.swing?"swing":"linear")](this.state,a,0,1,this.options.duration);
this.now=this.start+((this.end-this.start)*this.pos);this.update()}return true}};
T.extend(T.fx,{speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){T.attr(a.elem.style,"opacity",a.now)
},_default:function(a){if(a.elem.style&&a.elem.style[a.prop]!=null){a.elem.style[a.prop]=a.now+a.unit
}else{a.elem[a.prop]=a.now}}}});if(document.documentElement.getBoundingClientRect){T.fn.offset=function(){if(!this[0]){return{top:0,left:0}
}if(this[0]===this[0].ownerDocument.body){return T.offset.bodyOffset(this[0])}var f=this[0].getBoundingClientRect(),c=this[0].ownerDocument,g=c.body,h=c.documentElement,a=h.clientTop||g.clientTop||0,b=h.clientLeft||g.clientLeft||0,d=f.top+(self.pageYOffset||T.boxModel&&h.scrollTop||g.scrollTop)-a,e=f.left+(self.pageXOffset||T.boxModel&&h.scrollLeft||g.scrollLeft)-b;
return{top:d,left:e}}}else{T.fn.offset=function(){if(!this[0]){return{top:0,left:0}
}if(this[0]===this[0].ownerDocument.body){return T.offset.bodyOffset(this[0])}T.offset.initialized||T.offset.initialize();
var f=this[0],j=f.offsetParent,k=f,a=f.ownerDocument,c,h=a.documentElement,e=a.body,d=a.defaultView,l=d.getComputedStyle(f,null),b=f.offsetTop,g=f.offsetLeft;
while((f=f.parentNode)&&f!==e&&f!==h){c=d.getComputedStyle(f,null);b-=f.scrollTop,g-=f.scrollLeft;
if(f===j){b+=f.offsetTop,g+=f.offsetLeft;if(T.offset.doesNotAddBorder&&!(T.offset.doesAddBorderForTableAndCells&&/^t(able|d|h)$/i.test(f.tagName))){b+=parseInt(c.borderTopWidth,10)||0,g+=parseInt(c.borderLeftWidth,10)||0
}k=j,j=f.offsetParent}if(T.offset.subtractsBorderForOverflowNotVisible&&c.overflow!=="visible"){b+=parseInt(c.borderTopWidth,10)||0,g+=parseInt(c.borderLeftWidth,10)||0
}l=c}if(l.position==="relative"||l.position==="static"){b+=e.offsetTop,g+=e.offsetLeft
}if(l.position==="fixed"){b+=Math.max(h.scrollTop,e.scrollTop),g+=Math.max(h.scrollLeft,e.scrollLeft)
}return{top:b,left:g}}}T.offset={initialize:function(){if(this.initialized){return
}var d=document.body,k=document.createElementNS("http://www.w3.org/1999/xhtml","div"),h,j,b,g,c,l,f=d.style.marginTop,e=document.createElement("div"),a=document.createElement("table");
e.innerHTML="<div></div>";e.style.cssText="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;";
a.innerHTML="<tr><td></td></tr>";a.cellPadding=a.cellSpacing=0;a.style.cssText="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;";
c={position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"};
for(l in c){k.style[l]=c[l]}k.appendChild(e);k.appendChild(a);d.insertBefore(k,d.firstChild);
h=k.firstChild,j=h.firstChild,g=h.nextSibling.firstChild.firstChild;this.doesNotAddBorder=(j.offsetTop!==5);
this.doesAddBorderForTableAndCells=(g.offsetTop===5);h.style.overflow="hidden",h.style.position="relative";
this.subtractsBorderForOverflowNotVisible=(j.offsetTop===-5);d.style.marginTop="1px";
this.doesNotIncludeMarginInBodyOffset=(d.offsetTop===0);d.style.marginTop=f;d.removeChild(k);
this.initialized=true},bodyOffset:function(c){T.offset.initialized||T.offset.initialize();
var a=c.offsetTop,b=c.offsetLeft;if(T.offset.doesNotIncludeMarginInBodyOffset){a+=parseInt(T.curCSS(c,"marginTop",true),10)||0,b+=parseInt(T.curCSS(c,"marginLeft",true),10)||0
}return{top:a,left:b}}};T.fn.extend({position:function(){var b=0,c=0,e;if(this[0]){var d=this.offsetParent(),a=this.offset(),f=/^body|html$/i.test(d[0].tagName)?{top:0,left:0}:d.offset();
a.top-=Y(this,"marginTop");a.left-=Y(this,"marginLeft");f.top+=Y(d,"borderTopWidth");
f.left+=Y(d,"borderLeftWidth");e={top:a.top-f.top,left:a.left-f.left}}return e},offsetParent:function(){var a=this[0].offsetParent||document.body;
while(a&&(!/^body|html$/i.test(a.tagName)&&T.css(a,"position")=="static")){a=a.offsetParent
}return T(a)}});T.each(["Left","Top"],function(b,c){var a="scroll"+c;T.fn[a]=function(d){if(!this[0]){return null
}return d!==ab?this.each(function(){this==W||this==document?W.scrollTo(!b?d:T(W).scrollLeft(),b?d:T(W).scrollTop()):this[a]=d
}):this[0]==W||this[0]==document?self[b?"pageYOffset":"pageXOffset"]||T.boxModel&&document.documentElement[a]||document.body[a]:this[0][a]
}});T.each(["Height","Width"],function(b,d){var f=b?"Left":"Top",c=b?"Right":"Bottom",e=d.toLowerCase();
T.fn["inner"+d]=function(){return this[0]?T.css(this[0],e,false,"padding"):null};
T.fn["outer"+d]=function(g){return this[0]?T.css(this[0],e,false,g?"margin":"border"):null
};var a=d.toLowerCase();T.fn[a]=function(g){return this[0]==W?document.compatMode=="CSS1Compat"&&document.documentElement["client"+d]||document.body["client"+d]:this[0]==document?Math.max(document.documentElement["client"+d],document.body["scroll"+d],document.documentElement["scroll"+d],document.body["offset"+d],document.documentElement["offset"+d]):g===ab?(this.length?T.css(this[0],a):null):this.css(a,typeof g==="string"?g:g+"px")
}})})()}KW$.fn.wait=function(b,a){b=b||1000;a=a||"fx";return this.queue(a,function(){var c=this;
setTimeout(function(){KW$(c).dequeue()},b)})};KW$.fn.isNumeric=function(b){var d="0123456789";
var a;for(var c=0;c<b.length;c++){a=b.charAt(c);if(d.indexOf(a)==-1){return false
}}return true};KW$.fn.isFloat=function(b){var c="0123456789.,";var a;for(i=0;i<b.length;
i++){a=b.charAt(i);if(c.indexOf(a)==-1){return false}}return true};KW$.fn.isBoolean=function(a){return(a=="true"||a=="false")
};KW$.fn.treatVar=function(a){if(typeof(a)=="undefined"){return a}if(KW$.fn.isNumeric(a)){if(Number.MAX_VALUE<parseInt(a)){return parseInt(a)
}}if(KW$.fn.isFloat(a)){if(Number.MAX_VALUE<parseFloat(a)){return parseFloat(a)}}if(KW$.fn.isBoolean(a)){return a=="true"?true:false
}return a};KW$.fn.getNumeric=function(b){var a,c=/([0-9\.]*)/;if(a=c.exec(b)){return parseInt(a[1])
}else{return 0}};var KWOrdersParser={splitMessage:function(c){var d,a,b;if(!c.split){if(KW__DEBUG.general){KW__log("KWOrdersParser.splitMessage : could not split message : "+typeof(c),2)
}return[]}d=c.split("//");KW$.each(d,function(f,e){if(e!==""){d[f]=e.replace(/--dbsl--/g,"//")
}});return d},treatMessage:function(d){var c,a;if(d!==""){c=d.split("&");KW$.each(c,function(f,e){e=e.replace(/--amp--/g,"&");
c[f]=e.split("=");KW$.each(c[f],function(g,h){c[f][g]=c[f][g].replace(/--equ--/g,"=")
})})}function b(g,j,e){var h=/^\[([^\]]*)\](.*)$/;var f;if(typeof(e)=="undefined"){e=new Array()
}if(f=h.exec(g)){var k=b(f[2],j,e[f[1]]);if(f[1]===""){e.push(k)}else{e[f[1]]=k}}else{e=KW$.fn.treatVar(j)
}return e}KW$.each(c,function(g,e){var h=/([^\[]*)(\[.*\])$/;var f;if(e[0]=="action"){a={}
}if(e[0]!==""){if(f=h.exec(e[0])){a[f[1]]=b(f[2],e[1],a[f[1]])}else{if(e[1]!==""){a[e[0]]=KW$.fn.treatVar(e[1])
}else{a[e[0]]=""}}}});return a},joinOrder:function(a){var c="";for(var b in a){c+=KW__treatOrder(a[b])
}return c},treatOrder:function(a){var d="";function b(j,e){var g="";if(typeof(e)=="object"){if(e!==null){for(var f in e){g+=b(j+"["+f+"]",e[f])
}}else{g+=j+"=&"}}else{if(typeof(e)=="string"||typeof(e)=="number"){var h=e.toString();
h=h.replace(/&/g,"--amp--");h=h.replace(/\/\//g,"--dbsl--");h=h.replace(/=/g,"--equ--");
g+=j+"="+h+"&"}else{if(typeof(e)=="boolean"){g+=j+"="+(e?"true":"false")+"&"}else{g+=j+"=&"
}}}return g}for(var c in a){d+=b(c,a[c])}d+="//";return d},toJSon:function(f){if(KW$.isArray(f)){var c=new Array();
for(var b=0;b<f.length;b++){c.push(KWOrdersParser.toJSon(f[b]))}return"["+c.join(",")+"]"
}if(typeof(f)=="string"||typeof(f)=="boolean"||typeof(f)=="number"){var a=f.toString();
a=a.replace(/'/g,"\\'");a=a.replace(/"/g,'\\"');a=a.replace(/\n/g," ");return'"'+a+'"'
}if(typeof(f)=="undefined"){return'""'}var h;h="{";var e=new Array();for(var d in f){var g="";
if(KW$.isArray(f[d])){g+='"'+d+'":[';var c=new Array();for(var b=0;b<f[d].length;
b++){c.push(KWOrdersParser.toJSon(f[d][b]))}g+=c.join(",");g+="]"}else{if(typeof(f[d])=="string"||typeof(f[d])=="boolean"||typeof(f[d])=="number"){var a=f[d].toString();
a=a.replace(/'/g,"\\'");a=a.replace(/"/g,'\\"');a=a.replace(/\n/g," ");g+='"'+d+'":"'+a+'"'
}else{if(typeof(f[d])=="undefined"){g+='"'+d+'":""'}else{if(typeof(f[d])=="object"){g+='"'+d+'":'+KWOrdersParser.toJSon(f[d])
}else{if(KW__DEBUG.general){KW__log("KWOrdersParser.toJSon : can not found element typeof : "+typeof(f[d]),2)
}}}}}e.push(g)}h+=e.join(",");h+="}";return h}};function dump(d,g){var f="";if(!g){g=0
}var e="";for(var a=0;a<g+1;a++){e+="    "}if(typeof(d)=="object"){for(var b in d){var c=d[b];
if(typeof(c)=="object"){f+=e+"'"+b+"' =>\n";if(g<10){f+=dump(c,g+1)}else{f+="..."
}}else{if(typeof(c)!="function"){f+=e+"'"+b+"' => \""+c+'" ('+typeof(c)+")\n"}else{f+=e+"'"+b+"' => FUNCTION\n"
}}}}else{f="===>"+d+"<=== ("+typeof(d)+")"}return f}function dumpErr(a){var b="Message : "+a.message+"\nFile : "+a.fileName+"\nLine : "+a.lineNumber+"\nName : "+a.name;
return b}function KW__getDomain(b){var c=/^https?:\/\/((?:[a-z0-9\-_]{1,63}\.)*)([a-z0-9\-_]{1,63}\.)([a-z0-9]{1,63})(?:\/.*)?$/i;
b=String(b);var d="default";var e="*.";var f="*";var a=c.exec(b);if(a&&a.length>=4){if(typeof(a[3])!="undefined"){f=a[3]
}if(typeof(a[2])!="undefined"){d=a[2]}if(typeof(a[1])!="undefined"){e=a[1]}if(d=="co."||d=="com."||d=="fr."){c=/^https?:\/\/((?:[a-z0-9\-_]{1,63}\.)*)([a-z0-9\-_]{1,63}\.)([a-z0-9\-_]{1,63}\.)([a-z0-9]{1,63})(?:\/.*)?$/i;
a=c.exec(b);if(a&&a.length>=5){return a[2]+d+f}else{return d+f}}else{return d+f}}else{return d
}}function KW__str2ab(b){var a=new TextEncoder("utf-8");return a.encode(b).buffer
}function KW__ab2str(c){var d=new Uint8Array(c);var b=d.byteLength;while(d[b-1]===0&&--b){}if(!b){return""
}var a=d.subarray(0,b);var e=new TextDecoder("utf-8");return e.decode(a)}function KW_CHROME_scriptShouldBeInjected(a){return(a.indexOf("http://")===0||a.indexOf("https://")===0)
}var BROWSER_FIREFOX="FIREFOX";var BROWSER_SAFARI="SAFARI";var BROWSER_CHROME="CHROME";
var BROWSER_IE="IE";var PLATFORM_WINDOWS="WINDOWS";var PLATFORM_OSX="OSX";var PLATFORM_LINUX="LINUX";
var DEBUG_GENERAL=1;var DEBUG_NOCPP=2;var DEBUG_DEBUGGER=4;var DEBUG_ONECLICKDEBUGGER=8;
var DEBUG_DEV=16;var DEBUG_RELEASE=DEBUG_GENERAL;var DEBUG_CPP=DEBUG_RELEASE|DEBUG_DEV;
var DEBUG_SIMULATED=DEBUG_CPP|DEBUG_NOCPP;var DEBUG_FIREFOX_CPP=DEBUG_CPP|DEBUG_DEBUGGER;
var DEBUG_FIREFOX_SIMULATED=DEBUG_SIMULATED|DEBUG_DEBUGGER;var KW__CONFIG={};KW__CONFIG.browserActivityTimeout=60*5;
KW__CONFIG.iFrameSupport=true;KW__CONFIG.iFrameMaxLoadPerPage=50;KW__CONFIG.BROWSER_FIREFOX=BROWSER_FIREFOX;
KW__CONFIG.BROWSER_SAFARI=BROWSER_SAFARI;KW__CONFIG.BROWSER_CHROME=BROWSER_CHROME;
KW__CONFIG.BROWSER_IE=BROWSER_IE;KW__CONFIG.PLATFORM_WINDOWS=PLATFORM_WINDOWS;KW__CONFIG.PLATFORM_OSX=PLATFORM_OSX;
KW__CONFIG.PLATFORM_LINUX=PLATFORM_LINUX;KW__CONFIG.DEBUG_GENERAL=DEBUG_GENERAL;KW__CONFIG.DEBUG_NOCPP=DEBUG_NOCPP;
KW__CONFIG.DEBUG_DEBUGGER=DEBUG_DEBUGGER;KW__CONFIG.DEBUG_ONECLICKDEBUGGER=DEBUG_ONECLICKDEBUGGER;
KW__CONFIG.DEBUG_DEV=DEBUG_DEV;KW__CONFIG.DEBUG_RELEASE=DEBUG_GENERAL;KW__CONFIG.DEBUG_CPP=DEBUG_CPP;
KW__CONFIG.DEBUG_SIMULATED=DEBUG_SIMULATED;KW__CONFIG.DEBUG_FIREFOX_CPP=DEBUG_FIREFOX_CPP;
KW__CONFIG.DEBUG_FIREFOX_SIMULATED=DEBUG_FIREFOX_SIMULATED;KW__CONFIG.supportedLanguages=["en","fr","es","ja","de","pt","it"];
var KWTranslations={};KW__CONFIG.version="4.0";KW__CONFIG.build="4.0.0";KW__CONFIG.os=PLATFORM_WINDOWS;
KW__CONFIG.platform="extension";KW__CONFIG.debugMode=DEBUG_RELEASE;KW__CONFIG.serverRoot="http://127.0.0.1:";
KW__CONFIG.serverPort=(KW__CONFIG.debugMode&DEBUG_NOCPP)?"80":false;KW__CONFIG.jsScriptsFolder=(KW__CONFIG.debugMode&DEBUG_DEV)?"/exports":"/min";
KW__CONFIG.serverTestFile=function(){if(!KW__CONFIG.serverPort){throw"Local server not ready : waiting for port number from plugin."
}return KW__CONFIG.serverRoot+KW__CONFIG.serverPort+"/test.txt"};KW__CONFIG.logOnlineAjaxUrl="http://logs.dashlane.com/1/softwarelog/create";
KW__CONFIG.useWebsocketCom=false;KW__CONFIG.capabilities=2;KW__CONFIG.defaultLanguage=function(){for(var b=0,a=KW__CONFIG.supportedLanguages.length;
b<a;b++){if(KW__CONFIG.supportedLanguages[b]==navigator.language){return navigator.language+"-US"
}}return"en-US"}();KW__CONFIG.selectedLanguage=KW__CONFIG.defaultLanguage;KW__CONFIG.browser=BROWSER_CHROME;
KW__CONFIG.extension="extensionChrome";KW__CONFIG.newExtension=false;KW__CONFIG.messagesLoopTimer=500;
var KWTranslations=[];KW__CONFIG.defaultTabId=-1;KW__CONFIG.defaultTabIdString="-1";
KW__CONFIG.cwsId="fdjamakpfbbddfjaooikfcpapjohcfmg";KW__CONFIG.cwsIdBeta="ogjkhhencdccfcnjblkhaonkjhepbfgf";
KW__CONFIG.localId="mkjojgglmmcghgaiknnpgjgldgaocjfd";KW__CONFIG.safeSearchId="olhjfpcaneifdggjionmkignijciegih";
KW__CONFIG.safeSearchId35="nnimjdijgakingbgempmgkdgfhmmogah";KW__CONFIG.nativeMessagingHost="com.dashlane.dashlane";
KW__CONFIG.osxCwsMigrationUrl="https://www.dashlane.com/chrome_migration";KW__CONFIG.builtForCws=true;
var KW__DEBUG={};KW__DEBUG.general=(KW__CONFIG.debugMode&KW__CONFIG.DEBUG_GENERAL);
KW__DEBUG.events=false;KW__DEBUG.asapEvents=(KW__CONFIG.debugMode&KW__CONFIG.DEBUG_DEV);
KW__DEBUG.maxLogsBySession=100;KW__DEBUG.counterLogsSent=0;KW__DEBUG.linkWithCpp=!(KW__CONFIG.debugMode&KW__CONFIG.DEBUG_NOCPP);
function KW__logOnline(c,b){if(parseInt(b.code)>3){return}var a={};a.action=b.action;
a.type="injectedJs";a.version=KW__CONFIG.version;a.url=c.getLocation();a.host=c.getHostName();
a.code=b.code;a.message=b.message;KWKwiftDebugger.logError(a.code,a.message,"fromInjectedJS")
}function KW__logOnlineExt(b){if(parseInt(b.code)>3){return}var a={};a.action=b.action;
a.type=KW__CONFIG.extension;a.version=KW__CONFIG.version;a.code=b.code;a.message=b.message;
KWKwiftDebugger.logError(a.code,a.message,"fromExtensionFF")}function KW__log(a,b){var c={action:"logOnline",message:a.replace(/(\n|\r)/g,"--endl--"),code:b.toString()};
KW__logOnlineExt(c)}KW__DEBUG.showTabCommunicationNotInitialized=true;KW__DEBUG.showAuthStatusLogs=false;
var KWKwiftDebugger={signalLoadEvent:function(b,a){},logOrder:function(c,a,b){},logOrderOk:function(a){},logOrderFailed:function(a){},logError:function(c,b,a){},loadWorkableEnds:function(a){},loadCompleteEnds:function(a){},logExceptionsCount:{},logException:function(f,e,d,a){try{var h=arguments.callee.caller.name;
if(this.logExceptionsCount.hasOwnProperty(h)&&this.logExceptionsCount[h]>=10){return
}if(!this.logExceptionsCount.hasOwnProperty(h)){this.logExceptionsCount[h]=0}var g={action:"logOnline",type:KW__CONFIG.extension+"_"+KW__CONFIG.os,version:KW__CONFIG.build,code:f,message:e,functionName:h,legacy:a!==undefined&&a,exceptiontype:d!==undefined&&d!==null&&d||"TYPE_KW_EX_NO_TYPE"};
if(KW__DEBUG.general){KW__log("Will send following exception log:\n"+dump(g),0)}var b=this;
KW$.ajax({type:"POST",url:"https://logs.dashlane.com/1/softwarelog/create",data:g,success:function(){++b.logExceptionsCount[h]
}})}catch(c){}}};var _TR_={lang:function(){return KW__CONFIG.selectedLanguage.substr(0,2)
},changeBundle:function(b){try{KW__CONFIG.selectedLanguage=b}catch(a){if(KW__DEBUG.general){KW__log("_TR_.changeBundle faild with language : "+b+"\n"+dumpErr(a),0)
}}},escapeChars:function(a){try{return a.replace(/é/g,"&eacute;")}catch(b){if(KW__DEBUG.general){KW__log("_TR_.escapeChars faild with string : "+a+"\n"+dumpErr(b),0)
}return a}}};(function(g){var d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var k=(typeof Uint8Array!=="undefined")?Uint8Array:Array;var j="+".charCodeAt(0);
var b="/".charCodeAt(0);var f="0".charCodeAt(0);var c="a".charCodeAt(0);var l="A".charCodeAt(0);
var n="-".charCodeAt(0);var e="_".charCodeAt(0);function a(o){var p=o.charCodeAt(0);
if(p===j||p===n){return 62}if(p===b||p===e){return 63}if(p<f){return -1}if(p<f+10){return p-f+26+26
}if(p<l+26){return p-l}if(p<c+26){return p-c+26}}function h(o){var s,r,p,t,q,u;if(o.length%4>0){throw new Error("Invalid string. Length must be a multiple of 4")
}var v=o.length;q=o.charAt(v-2)==="="?2:o.charAt(v-1)==="="?1:0;u=new k(o.length*3/4-q);
p=q>0?o.length-4:o.length;var x=0;function w(y){u[x++]=y}for(s=0,r=0;s<p;s+=4,r+=3){t=(a(o.charAt(s))<<18)|(a(o.charAt(s+1))<<12)|(a(o.charAt(s+2))<<6)|a(o.charAt(s+3));
w((t&16711680)>>16);w((t&65280)>>8);w(t&255)}if(q===2){t=(a(o.charAt(s))<<2)|(a(o.charAt(s+1))>>4);
w(t&255)}else{if(q===1){t=(a(o.charAt(s))<<10)|(a(o.charAt(s+1))<<4)|(a(o.charAt(s+2))>>2);
w((t>>8)&255);w(t&255)}}return u}function m(o){var s;var r=o.length%3;var q="";var p,u;
function t(w){return d.charAt(w)}function v(w){return t(w>>18&63)+t(w>>12&63)+t(w>>6&63)+t(w&63)
}for(s=0,u=o.length-r;s<u;s+=3){p=(o[s]<<16)+(o[s+1]<<8)+(o[s+2]);q+=v(p)}switch(r){case 1:p=o[o.length-1];
q+=t(p>>2);q+=t((p<<4)&63);q+="==";break;case 2:p=(o[o.length-2]<<8)+(o[o.length-1]);
q+=t(p>>10);q+=t((p>>4)&63);q+=t((p<<2)&63);q+="=";break;default:break}return q}g.toByteArray=h;
g.fromByteArray=m}(typeof exports==="undefined"?(this.base64js={}):exports));"use strict";
var sjcl={cipher:{},hash:{},keyexchange:{},mode:{},misc:{},codec:{},exception:{corrupt:function(b){this.toString=function(){return"CORRUPT: "+this.message
};this.message=b},invalid:function(b){this.toString=function(){return"INVALID: "+this.message
};this.message=b},bug:function(b){this.toString=function(){return"BUG: "+this.message
};this.message=b},notReady:function(b){this.toString=function(){return"NOT READY: "+this.message
};this.message=b}}};if(typeof module!=="undefined"&&module.exports){module.exports=sjcl
}if(typeof define==="function"){define([],function(){return sjcl})}sjcl.cipher.aes=function(n){if(!this._tables[0][0][0]){this._precompute()
}var r,s,q,o,j,p=this._tables[0][4],m=this._tables[1],u=n.length,t=1;if(u!==4&&u!==6&&u!==8){throw new sjcl.exception.invalid("invalid aes key size")
}this._key=[o=n.slice(0),j=[]];for(r=u;r<4*u+28;r++){q=o[r-1];if(r%u===0||(u===8&&r%u===4)){q=p[q>>>24]<<24^p[q>>16&255]<<16^p[q>>8&255]<<8^p[q&255];
if(r%u===0){q=q<<8^q>>>24^t<<24;t=t<<1^(t>>7)*283}}o[r]=o[r-u]^q}for(s=0;r;s++,r--){q=o[s&3?r:r-4];
if(r<=4||s<4){j[s]=q}else{j[s]=m[0][p[q>>>24]]^m[1][p[q>>16&255]]^m[2][p[q>>8&255]]^m[3][p[q&255]]
}}};sjcl.cipher.aes.prototype={encrypt:function(b){return this._crypt(b,0)},decrypt:function(b){return this._crypt(b,1)
},_tables:[[[],[],[],[],[]],[[],[],[],[],[]]],_precompute:function(){var x=this._tables[0],d=this._tables[1],y=x[4],t=d[4],z,v,A,w=[],C=[],D,r,u,s,B,E;
for(z=0;z<256;z++){C[(w[z]=z<<1^(z>>7)*283)^z]=z}for(v=A=0;!y[v];v^=D||1,A=C[A]||1){s=A^A<<1^A<<2^A<<3^A<<4;
s=s>>8^s&255^99;y[v]=s;t[s]=v;u=w[r=w[D=w[v]]];E=u*16843009^r*65537^D*257^v*16843008;
B=w[s]*257^s*16843008;for(z=0;z<4;z++){x[z][v]=B=B<<24^B>>>8;d[z][s]=E=E<<24^E>>>8
}}for(z=0;z<5;z++){x[z]=x[z].slice(0);d[z]=d[z].slice(0)}},_crypt:function(J,G){if(J.length!==4){throw new sjcl.exception.invalid("invalid aes block size")
}var a=this._key[G],d=J[0]^a[0],z=J[G?3:1]^a[1],A=J[2]^a[2],B=J[G?1:3]^a[3],c,O,H,b=a.length/4-2,E,F=4,D=[0,0,0,0],C=this._tables[G],K=C[0],L=C[1],M=C[2],N=C[3],I=C[4];
for(E=0;E<b;E++){c=K[d>>>24]^L[z>>16&255]^M[A>>8&255]^N[B&255]^a[F];O=K[z>>>24]^L[A>>16&255]^M[B>>8&255]^N[d&255]^a[F+1];
H=K[A>>>24]^L[B>>16&255]^M[d>>8&255]^N[z&255]^a[F+2];B=K[B>>>24]^L[d>>16&255]^M[z>>8&255]^N[A&255]^a[F+3];
F+=4;d=c;z=O;A=H}for(E=0;E<4;E++){D[G?3&-E:E]=I[d>>>24]<<24^I[z>>16&255]<<16^I[A>>8&255]<<8^I[B&255]^a[F++];
c=d;d=z;z=A;A=B;B=c}return D}};sjcl.bitArray={bitSlice:function(a,f,e){a=sjcl.bitArray._shiftRight(a.slice(f/32),32-(f&31)).slice(1);
return(e===undefined)?a:sjcl.bitArray.clamp(a,e-f)},extract:function(k,j,g){var a,h=Math.floor((-j-g)&31);
if((j+g-1^j)&-32){a=(k[j/32|0]<<(32-h))^(k[j/32+1|0]>>>h)}else{a=k[j/32|0]>>>h}return a&((1<<g)-1)
},concat:function(h,f){if(h.length===0||f.length===0){return h.concat(f)}var g=h[h.length-1],e=sjcl.bitArray.getPartial(g);
if(e===32){return h.concat(f)}else{return sjcl.bitArray._shiftRight(f,e,g|0,h.slice(0,h.length-1))
}},bitLength:function(e){var f=e.length,a;if(f===0){return 0}a=e[f-1];return(f-1)*32+sjcl.bitArray.getPartial(a)
},clamp:function(e,a){if(e.length*32<a){return e}e=e.slice(0,Math.ceil(a/32));var f=e.length;
a=a&31;if(f>0&&a){e[f-1]=sjcl.bitArray.partial(a,e[f-1]&2147483648>>(a-1),1)}return e
},partial:function(d,e,f){if(d===32){return e}return(f?e|0:e<<(32-d))+d*1099511627776
},getPartial:function(b){return Math.round(b/1099511627776)||32},equal:function(b,g){if(sjcl.bitArray.bitLength(b)!==sjcl.bitArray.bitLength(g)){return false
}var h=0,a;for(a=0;a<b.length;a++){h|=b[a]^g[a]}return(h===0)},_shiftRight:function(n,o,j,l){var k,a=0,m;
if(l===undefined){l=[]}for(;o>=32;o-=32){l.push(j);j=0}if(o===0){return l.concat(n)
}for(k=0;k<n.length;k++){l.push(j|n[k]>>>o);j=n[k]<<(32-o)}a=n.length?n[n.length-1]:0;
m=sjcl.bitArray.getPartial(a);l.push(sjcl.bitArray.partial(o+m&31,(o+m>32)?j:l.pop(),1));
return l},_xor4:function(d,c){return[d[0]^c[0],d[1]^c[1],d[2]^c[2],d[3]^c[3]]},byteswapM:function(h){var f,g,a=65280;
for(f=0;f<h.length;++f){g=h[f];h[f]=(g>>>24)|((g>>>8)&a)|((g&a)<<8)|(g<<24)}return h
}};sjcl.codec.utf8String={fromBits:function(g){var f="",h=sjcl.bitArray.bitLength(g),j,k;
for(j=0;j<h/8;j++){if((j&3)===0){k=g[j/4]}f+=String.fromCharCode(k>>>24);k<<=8}return decodeURIComponent(escape(f))
},toBits:function(g){g=unescape(encodeURIComponent(g));var f=[],h,e=0;for(h=0;h<g.length;
h++){e=e<<8|g.charCodeAt(h);if((h&3)===3){f.push(e);e=0}}if(h&3){f.push(sjcl.bitArray.partial(8*(h&3),e))
}return f}};sjcl.codec.hex={fromBits:function(e){var d="",f;for(f=0;f<e.length;f++){d+=((e[f]|0)+263882790666240).toString(16).substr(4)
}return d.substr(0,sjcl.bitArray.bitLength(e)/4)},toBits:function(g){var h,e=[],f;
g=g.replace(/\s|0x/g,"");f=g.length;g=g+"00000000";for(h=0;h<g.length;h+=8){e.push(parseInt(g.substr(h,8),16)^0)
}return sjcl.bitArray.clamp(e,f*4)}};if(typeof(ArrayBuffer)==="undefined"){(function(b){b.ArrayBuffer=function(){};
b.DataView=function(){}}(this))}sjcl.codec.arrayBuffer={fromBits:function(k,l,m){var q,n,j,o,p;
l=l==undefined?true:l;m=m||8;if(k.length===0){return new ArrayBuffer(0)}j=sjcl.bitArray.bitLength(k)/8;
if(sjcl.bitArray.bitLength(k)%8!==0){throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly")
}if(l&&j%m!==0){j+=m-(j%m)}o=new DataView(new ArrayBuffer(k.length*4));for(n=0;n<k.length;
n++){o.setUint32(n*4,(k[n]<<32))}q=new DataView(new ArrayBuffer(j));if(q.byteLength===o.byteLength){return o.buffer
}p=o.byteLength<q.byteLength?o.byteLength:q.byteLength;for(n=0;n<p;n++){q.setUint8(n,o.getUint8(n))
}return q.buffer},toBits:function(o){var l,n=[],j,k,m;if(o.byteLength===0){return[]
}k=new DataView(o);j=k.byteLength-k.byteLength%4;for(var l=0;l<j;l+=4){n.push(k.getUint32(l))
}if(k.byteLength%4!=0){m=new DataView(new ArrayBuffer(4));for(var l=0,h=k.byteLength%4;
l<h;l++){m.setUint8(l+4-h,k.getUint8(j+l))}n.push(sjcl.bitArray.partial((k.byteLength%4)*8,m.getUint32(0)))
}return n},hexDumpBuffer:function(g){var h=new DataView(g);var f="";var j=function(a,b){a=a+"";
return a.length>=b?a:new Array(b-a.length+1).join("0")+a};for(var k=0;k<h.byteLength;
k+=2){if(k%16==0){f+=("\n"+(k).toString(16)+"\t")}f+=(j(h.getUint16(k).toString(16),4)+" ")
}if(typeof console===undefined){console=console||{log:function(){}}}console.log(f.toUpperCase())
}};sjcl.codec.base64={_chars:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",fromBits:function(n,c,r){var q="",p,l=0,m=sjcl.codec.base64._chars,o=0,s=sjcl.bitArray.bitLength(n);
if(r){m=m.substr(0,62)+"-_"}for(p=0;q.length*6<s;){q+=m.charAt((o^n[p]>>>l)>>>26);
if(l<6){o=n[p]<<(6-l);l+=26;p++}else{o<<=6;l-=6}}while((q.length&3)&&!c){q+="="}return q
},toBits:function(m,o){m=m.replace(/\s|=/g,"");var q=[],p,n=0,l=sjcl.codec.base64._chars,c=0,k;
if(o){l=l.substr(0,62)+"-_"}for(p=0;p<m.length;p++){k=l.indexOf(m.charAt(p));if(k<0){throw new sjcl.exception.invalid("this isn't base64!")
}if(n>26){n-=26;q.push(c^k>>>n);c=k<<(32-n)}else{n+=6;c^=k<<(32-n)}}if(n&56){q.push(sjcl.bitArray.partial(n&56,c,1))
}return q}};sjcl.codec.base64url={fromBits:function(b){return sjcl.codec.base64.fromBits(b,1,1)
},toBits:function(b){return sjcl.codec.base64.toBits(b,1)}};sjcl.hash.sha256=function(b){if(!this._key[0]){this._precompute()
}if(b){this._h=b._h.slice(0);this._buffer=b._buffer.slice(0);this._length=b._length
}else{this.reset()}};sjcl.hash.sha256.hash=function(b){return(new sjcl.hash.sha256()).update(b).finalize()
};sjcl.hash.sha256.prototype={blockSize:512,reset:function(){this._h=this._init.slice(0);
this._buffer=[];this._length=0;return this},update:function(g){if(typeof g==="string"){g=sjcl.codec.utf8String.toBits(g)
}var h,b=this._buffer=sjcl.bitArray.concat(this._buffer,g),j=this._length,k=this._length=j+sjcl.bitArray.bitLength(g);
for(h=512+j&-512;h<=k;h+=512){this._block(b.splice(0,16))}return this},finalize:function(){var f,b=this._buffer,e=this._h;
b=sjcl.bitArray.concat(b,[sjcl.bitArray.partial(1,1)]);for(f=b.length+2;f&15;f++){b.push(0)
}b.push(Math.floor(this._length/4294967296));b.push(this._length|0);while(b.length){this._block(b.splice(0,16))
}this.reset();return e},_init:[],_key:[],_precompute:function(){var g=0,h=2,e;function f(a){return(a-Math.floor(a))*4294967296|0
}outer:for(;g<64;h++){for(e=2;e*e<=h;e++){if(h%e===0){continue outer}}if(g<8){this._init[g]=f(Math.pow(h,1/2))
}this._key[g]=f(Math.pow(h,1/3));g++}},_block:function(b){var B,A,F,G,E=b.slice(0),y=this._h,D=this._key,a=y[0],h=y[1],k=y[2],v=y[3],w=y[4],x=y[5],z=y[6],C=y[7];
for(B=0;B<64;B++){if(B<16){A=E[B]}else{F=E[(B+1)&15];G=E[(B+14)&15];A=E[B&15]=((F>>>7^F>>>18^F>>>3^F<<25^F<<14)+(G>>>17^G>>>19^G>>>10^G<<15^G<<13)+E[B&15]+E[(B+9)&15])|0
}A=(A+C+(w>>>6^w>>>11^w>>>25^w<<26^w<<21^w<<7)+(z^w&(x^z))+D[B]);C=z;z=x;x=w;w=v+A|0;
v=k;k=h;h=a;a=(A+((h&k)^(v&(h^k)))+(h>>>2^h>>>13^h>>>22^h<<30^h<<19^h<<10))|0}y[0]=y[0]+a|0;
y[1]=y[1]+h|0;y[2]=y[2]+k|0;y[3]=y[3]+v|0;y[4]=y[4]+w|0;y[5]=y[5]+x|0;y[6]=y[6]+z|0;
y[7]=y[7]+C|0}};sjcl.mode.ccm={name:"ccm",_progressListeners:[],listenProgress:function(b){sjcl.mode.ccm._progressListeners.push(b)
},unListenProgress:function(d){var c=sjcl.mode.ccm._progressListeners.indexOf(d);
if(c>-1){sjcl.mode.ccm._progressListeners.splice(c,1)}},_callProgressListener:function(f){var d=sjcl.mode.ccm._progressListeners.slice(),e;
for(e=0;e<d.length;e+=1){d[e](f)}},encrypt:function(t,u,r,m,s){var o,q=u.slice(0),l,n=sjcl.bitArray,v=n.bitLength(r)/8,p=n.bitLength(q)/8;
s=s||64;m=m||[];if(v<7){throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes")
}for(o=2;o<4&&p>>>8*o;o++){}if(o<15-v){o=15-v}r=n.clamp(r,8*(15-o));l=sjcl.mode.ccm._computeTag(t,u,r,m,s,o);
q=sjcl.mode.ccm._ctrMode(t,q,r,l,s,o);return n.concat(q.data,q.tag)},decrypt:function(w,v,t,m,u){u=u||64;
m=m||[];var q,o=sjcl.bitArray,x=o.bitLength(t)/8,r=o.bitLength(v),s=o.clamp(v,r-u),n=o.bitSlice(v,r-u),p;
r=(r-u)/8;if(x<7){throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes")
}for(q=2;q<4&&r>>>8*q;q++){}if(q<15-x){q=15-x}t=o.clamp(t,8*(15-q));s=sjcl.mode.ccm._ctrMode(w,s,t,n,u,q);
p=sjcl.mode.ccm._computeTag(w,s.data,t,m,u,q);if(!o.equal(s.tag,p)){throw new sjcl.exception.corrupt("ccm: tag doesn't match")
}return s.data},_macAdditionalData:function(x,n,v,w,q,p){var r,t,u,y=[],o=sjcl.bitArray,s=o._xor4;
r=[o.partial(8,(n.length?1<<6:0)|(w-2)<<2|p-1)];r=o.concat(r,v);r[3]|=q;r=x.encrypt(r);
if(n.length){t=o.bitLength(n)/8;if(t<=65279){y=[o.partial(16,t)]}else{if(t<=4294967295){y=o.concat([o.partial(16,65534)],[t])
}}y=o.concat(y,n);for(u=0;u<y.length;u+=4){r=x.encrypt(s(r,y.slice(u,u+4).concat([0,0,0])))
}}return r},_computeTag:function(t,u,r,l,s,n){var o,q,m=sjcl.bitArray,p=m._xor4;s/=8;
if(s%2||s<4||s>16){throw new sjcl.exception.invalid("ccm: invalid tag length")}if(l.length>4294967295||u.length>4294967295){throw new sjcl.exception.bug("ccm: can't deal with 4GiB or more data")
}o=sjcl.mode.ccm._macAdditionalData(t,l,r,s,m.bitLength(u)/8,n);for(q=0;q<u.length;
q+=4){o=t.encrypt(p(o,u.slice(q,q+4).concat([0,0,0])))}return m.clamp(o,s*8)},_ctrMode:function(z,u,w,E,x,n){var v,t,l=sjcl.bitArray,p=l._xor4,A,y=u.length,B=l.bitLength(u),C=y/50,D=C;
A=l.concat([l.partial(8,n-1)],w).concat([0,0,0]).slice(0,4);E=l.bitSlice(p(E,z.encrypt(A)),0,x);
if(!y){return{tag:E,data:[]}}for(t=0;t<y;t+=4){if(t>C){sjcl.mode.ccm._callProgressListener(t/y);
C+=D}A[3]++;v=z.encrypt(A);u[t]^=v[0];u[t+1]^=v[1];u[t+2]^=v[2];u[t+3]^=v[3]}return{tag:E,data:l.clamp(u,B)}
}};sjcl.arrayBuffer=sjcl.arrayBuffer||{};if(typeof(ArrayBuffer)==="undefined"){(function(b){b.ArrayBuffer=function(){};
b.DataView=function(){}}(this))}sjcl.arrayBuffer.ccm={mode:"ccm",defaults:{tlen:128},compat_encrypt:function(s,t,p,l,q){var r=sjcl.codec.arrayBuffer.fromBits(t,true,16),n=sjcl.bitArray.bitLength(t)/8,k,o,m;
q=q||64;l=l||[];k=sjcl.arrayBuffer.ccm.encrypt(s,r,p,l,q,n);o=sjcl.codec.arrayBuffer.toBits(k.ciphertext_buffer);
o=sjcl.bitArray.clamp(o,n*8);return sjcl.bitArray.concat(o,k.tag)},compat_decrypt:function(B,A,y,p,z){z=z||64;
p=p||[];var u,w,s=sjcl.bitArray,v=s.bitLength(A),x=s.clamp(A,v-z),q=s.bitSlice(A,v-z),t,r=sjcl.codec.arrayBuffer.fromBits(x,true,16);
var C=sjcl.arrayBuffer.ccm.decrypt(B,r,y,q,p,z,(v-z)/8);return sjcl.bitArray.clamp(sjcl.codec.arrayBuffer.toBits(C),v-z)
},encrypt:function(u,t,r,l,s,o){var n,q,p,m=sjcl.bitArray,v=m.bitLength(r)/8;l=l||[];
s=s||sjcl.arrayBuffer.ccm.defaults.tlen;o=o||t.byteLength;s=Math.ceil(s/8);for(p=2;
p<4&&o>>>8*p;p++){}if(p<15-v){p=15-v}r=m.clamp(r,8*(15-p));q=sjcl.arrayBuffer.ccm._computeTag(u,t,r,l,s,o,p);
q=sjcl.arrayBuffer.ccm._ctrMode(u,t,r,q,s,p);return{ciphertext_buffer:t,tag:q}},decrypt:function(y,p,w,o,q,x,s){var u,A,v,t,r=sjcl.bitArray,z=r.bitLength(w)/8;
q=q||[];x=x||sjcl.arrayBuffer.ccm.defaults.tlen;s=s||p.byteLength;x=Math.ceil(x/8);
for(t=2;t<4&&s>>>8*t;t++){}if(t<15-z){t=15-z}w=r.clamp(w,8*(15-t));u=sjcl.arrayBuffer.ccm._ctrMode(y,p,w,o,x,t);
A=sjcl.arrayBuffer.ccm._computeTag(y,p,w,q,x,s,t);if(!sjcl.bitArray.equal(u,A)){throw new sjcl.exception.corrupt("ccm: tag doesn't match")
}return p},_computeTag:function(C,x,A,r,B,u,t){var w,E,v,y,D,F,s=sjcl.bitArray,z,G;
v=sjcl.mode.ccm._macAdditionalData(C,r,A,B,u,t);if(x.byteLength!==0){y=new DataView(x);
for(w=u;w<x.byteLength;w++){y.setUint8(w,0)}for(w=0;w<y.byteLength;w+=16){v[0]^=y.getUint32(w);
v[1]^=y.getUint32(w+4);v[2]^=y.getUint32(w+8);v[3]^=y.getUint32(w+12);v=C.encrypt(v)
}}return sjcl.bitArray.clamp(v,B*8)},_ctrMode:function(B,E,F,G,I,D){var p,w,J,K,n,v,H,x,C=sjcl.bitArray,y=C._xor4,z=E.byteLength/50,A=z;
w=new DataView(new ArrayBuffer(16));w=C.concat([C.partial(8,D-1)],F).concat([0,0,0]).slice(0,4);
G=C.bitSlice(y(G,B.encrypt(w)),0,I*8);w[3]++;if(w[3]===0){w[2]++}if(E.byteLength!==0){p=new DataView(E);
for(x=0;x<p.byteLength;x+=16){if(x>z){sjcl.mode.ccm._callProgressListener(x/E.byteLength);
z+=A}H=B.encrypt(w);J=p.getUint32(x);K=p.getUint32(x+4);n=p.getUint32(x+8);v=p.getUint32(x+12);
p.setUint32(x,J^H[0]);p.setUint32(x+4,K^H[1]);p.setUint32(x+8,n^H[2]);p.setUint32(x+12,v^H[3]);
w[3]++;if(w[3]===0){w[2]++}}}return G}};sjcl.mode.ocb2={name:"ocb2",encrypt:function(t,G,A,r,C,w){if(sjcl.bitArray.bitLength(A)!==128){throw new sjcl.exception.invalid("ocb iv must be 128 bits")
}var z,v=sjcl.mode.ocb2._times2,u=sjcl.bitArray,y=u._xor4,x=[0,0,0,0],s=v(t.encrypt(A)),B,E,F=[],D;
r=r||[];C=C||64;for(z=0;z+4<G.length;z+=4){B=G.slice(z,z+4);x=y(x,B);F=F.concat(y(s,t.encrypt(y(s,B))));
s=v(s)}B=G.slice(z);E=u.bitLength(B);D=t.encrypt(y(s,[0,0,0,E]));B=u.clamp(y(B.concat([0,0,0]),D),E);
x=y(x,y(B.concat([0,0,0]),D));x=t.encrypt(y(x,y(s,v(s))));if(r.length){x=y(x,w?r:sjcl.mode.ocb2.pmac(t,r))
}return F.concat(u.concat(B,u.clamp(x,C)))},decrypt:function(u,F,C,s,E,x){if(sjcl.bitArray.bitLength(C)!==128){throw new sjcl.exception.invalid("ocb iv must be 128 bits")
}E=E||64;var B,w=sjcl.mode.ocb2._times2,v=sjcl.bitArray,A=v._xor4,y=[0,0,0,0],t=w(u.encrypt(C)),D,H,z=sjcl.bitArray.bitLength(F)-E,I=[],G;
s=s||[];for(B=0;B+4<z/32;B+=4){D=A(t,u.decrypt(A(t,F.slice(B,B+4))));y=A(y,D);I=I.concat(D);
t=w(t)}H=z-B*32;G=u.encrypt(A(t,[0,0,0,H]));D=A(G,v.clamp(F.slice(B),H).concat([0,0,0]));
y=A(y,D);y=u.encrypt(A(y,A(t,w(t))));if(s.length){y=A(y,x?s:sjcl.mode.ocb2.pmac(u,s))
}if(!v.equal(v.clamp(y,E),v.bitSlice(F,z))){throw new sjcl.exception.corrupt("ocb: tag doesn't match")
}return I.concat(v.clamp(D,H))},pmac:function(n,k){var r,o=sjcl.mode.ocb2._times2,m=sjcl.bitArray,q=m._xor4,p=[0,0,0,0],l=n.encrypt([0,0,0,0]),s;
l=q(l,o(o(l)));for(r=0;r+4<k.length;r+=4){l=o(l);p=q(p,n.encrypt(q(l,k.slice(r,r+4))))
}s=k.slice(r);if(m.bitLength(s)<128){l=q(l,o(l));s=m.concat(s,[2147483648|0,0,0,0])
}p=q(p,s);return n.encrypt(q(o(q(l,o(l))),p))},_times2:function(b){return[b[0]<<1^b[1]>>>31,b[1]<<1^b[2]>>>31,b[2]<<1^b[3]>>>31,b[3]<<1^(b[0]>>>31)*135]
}};sjcl.mode.gcm={name:"gcm",encrypt:function(l,m,q,o,p){var j,n=m.slice(0),k=sjcl.bitArray;
p=p||128;o=o||[];j=sjcl.mode.gcm._ctrMode(true,l,n,o,q,p);return k.concat(j.data,j.tag)
},decrypt:function(t,r,p,l,q){var o,n=r.slice(0),k,m=sjcl.bitArray,s=m.bitLength(n);
q=q||128;l=l||[];if(q<=s){k=m.bitSlice(n,s-q);n=m.bitSlice(n,0,s-q)}else{k=n;n=[]
}o=sjcl.mode.gcm._ctrMode(false,t,n,l,p,q);if(!m.equal(o.tag,k)){throw new sjcl.exception.corrupt("gcm: tag doesn't match")
}return o.data},_galoisMultiply:function(m,o){var s,t,p,u,q,n,j=sjcl.bitArray,r=j._xor4;
u=[0,0,0,0];q=o.slice(0);for(s=0;s<128;s++){p=(m[Math.floor(s/32)]&(1<<(31-s%32)))!==0;
if(p){u=r(u,q)}n=(q[3]&1)!==0;for(t=3;t>0;t--){q[t]=(q[t]>>>1)|((q[t-1]&1)<<31)}q[0]=q[0]>>>1;
if(n){q[0]=q[0]^(225<<24)}}return u},_ghash:function(m,j,k){var l,g,h=k.length;l=j.slice(0);
for(g=0;g<h;g+=4){l[0]^=4294967295&k[g];l[1]^=4294967295&k[g+1];l[2]^=4294967295&k[g+2];
l[3]^=4294967295&k[g+3];l=sjcl.mode.gcm._galoisMultiply(l,m)}return l},_ctrMode:function(C,D,v,y,I,M){var E,K,H,J,z,x,l,G,B,L,A,w,F=sjcl.bitArray;
B=v.length;L=F.bitLength(v);A=F.bitLength(y);w=F.bitLength(I);E=D.encrypt([0,0,0,0]);
if(w===96){K=I.slice(0);K=F.concat(K,[1])}else{K=sjcl.mode.gcm._ghash(E,[0,0,0,0],I);
K=sjcl.mode.gcm._ghash(E,K,[0,0,Math.floor(w/4294967296),w&4294967295])}H=sjcl.mode.gcm._ghash(E,[0,0,0,0],y);
x=K.slice(0);l=H.slice(0);if(!C){l=sjcl.mode.gcm._ghash(E,H,v)}for(z=0;z<B;z+=4){x[3]++;
J=D.encrypt(x);v[z]^=J[0];v[z+1]^=J[1];v[z+2]^=J[2];v[z+3]^=J[3]}v=F.clamp(v,L);if(C){l=sjcl.mode.gcm._ghash(E,H,v)
}G=[Math.floor(A/4294967296),A&4294967295,Math.floor(L/4294967296),L&4294967295];
l=sjcl.mode.gcm._ghash(E,l,G);J=D.encrypt(K);l[0]^=J[0];l[1]^=J[1];l[2]^=J[2];l[3]^=J[3];
return{tag:F.bitSlice(l,0,M),data:v}}};sjcl.misc.hmac=function(j,h){this._hash=h=h||sjcl.hash.sha256;
var k=[[],[]],f,g=h.prototype.blockSize/32;this._baseHash=[new h(),new h()];if(j.length>g){j=h.hash(j)
}for(f=0;f<g;f++){k[0][f]=j[f]^909522486;k[1][f]=j[f]^1549556828}this._baseHash[0].update(k[0]);
this._baseHash[1].update(k[1]);this._resultHash=new h(this._baseHash[0])};sjcl.misc.hmac.prototype.encrypt=sjcl.misc.hmac.prototype.mac=function(b){if(!this._updated){this.update(b);
return this.digest(b)}else{throw new sjcl.exception.invalid("encrypt on already updated hmac called!")
}};sjcl.misc.hmac.prototype.reset=function(){this._resultHash=new this._hash(this._baseHash[0]);
this._updated=false};sjcl.misc.hmac.prototype.update=function(b){this._updated=true;
this._resultHash.update(b)};sjcl.misc.hmac.prototype.digest=function(){var c=this._resultHash.finalize(),d=new (this._hash)(this._baseHash[1]).update(c).finalize();
this.reset();return d};sjcl.misc.pbkdf2=function(k,u,t,A,b){t=t||1000;if(A<0||t<0){throw sjcl.exception.invalid("invalid params to pbkdf2")
}if(typeof k==="string"){k=sjcl.codec.utf8String.toBits(k)}if(typeof u==="string"){u=sjcl.codec.utf8String.toBits(u)
}b=b||sjcl.misc.hmac;var z=new b(k),j,r,v,w,y,x=[],s=sjcl.bitArray;for(y=1;32*x.length<(A||1);
y++){j=r=z.encrypt(s.concat(u,[y]));for(v=1;v<t;v++){r=z.encrypt(r);for(w=0;w<r.length;
w++){j[w]^=r[w]}}x=x.concat(j)}if(A){x=s.clamp(x,A)}return x};sjcl.prng=function(b){this._pools=[new sjcl.hash.sha256()];
this._poolEntropy=[0];this._reseedCount=0;this._robins={};this._eventId=0;this._collectorIds={};
this._collectorIdNext=0;this._strength=0;this._poolStrength=0;this._nextReseed=0;
this._key=[0,0,0,0,0,0,0,0];this._counter=[0,0,0,0];this._cipher=undefined;this._defaultParanoia=b;
this._collectorsStarted=false;this._callbacks={progress:{},seeded:{}};this._callbackI=0;
this._NOT_READY=0;this._READY=1;this._REQUIRES_RESEED=2;this._MAX_WORDS_PER_BURST=65536;
this._PARANOIA_LEVELS=[0,48,64,96,128,192,256,384,512,768,1024];this._MILLISECONDS_PER_RESEED=30000;
this._BITS_PER_RESEED=80};sjcl.prng.prototype={randomWords:function(h,j){var g=[],l,m=this.isReady(j),k;
if(m===this._NOT_READY){throw new sjcl.exception.notReady("generator isn't seeded")
}else{if(m&this._REQUIRES_RESEED){this._reseedFromPools(!(m&this._READY))}}for(l=0;
l<h;l+=4){if((l+1)%this._MAX_WORDS_PER_BURST===0){this._gate()}k=this._gen4words();
g.push(k[0],k[1],k[2],k[3])}this._gate();return g.slice(0,h)},setDefaultParanoia:function(c,d){if(c===0&&d!=="Setting paranoia=0 will ruin your security; use it only for testing"){throw"Setting paranoia=0 will ruin your security; use it only for testing"
}this._defaultParanoia=c},addEntropy:function(s,m,w){w=w||"user";var v,r,q,o=(new Date()).valueOf(),u=this._robins[w],n=this.isReady(),t=0,p;
v=this._collectorIds[w];if(v===undefined){v=this._collectorIds[w]=this._collectorIdNext++
}if(u===undefined){u=this._robins[w]=0}this._robins[w]=(this._robins[w]+1)%this._pools.length;
switch(typeof(s)){case"number":if(m===undefined){m=1}this._pools[u].update([v,this._eventId++,1,m,o,1,s|0]);
break;case"object":p=Object.prototype.toString.call(s);if(p==="[object Uint32Array]"){q=[];
for(r=0;r<s.length;r++){q.push(s[r])}s=q}else{if(p!=="[object Array]"){t=1}for(r=0;
r<s.length&&!t;r++){if(typeof(s[r])!=="number"){t=1}}}if(!t){if(m===undefined){m=0;
for(r=0;r<s.length;r++){q=s[r];while(q>0){m++;q=q>>>1}}}this._pools[u].update([v,this._eventId++,2,m,o,s.length].concat(s))
}break;case"string":if(m===undefined){m=s.length}this._pools[u].update([v,this._eventId++,3,m,o,s.length]);
this._pools[u].update(s);break;default:t=1}if(t){throw new sjcl.exception.bug("random: addEntropy only supports number, array of numbers or string")
}this._poolEntropy[u]+=m;this._poolStrength+=m;if(n===this._NOT_READY){if(this.isReady()!==this._NOT_READY){this._fireEvent("seeded",Math.max(this._strength,this._poolStrength))
}this._fireEvent("progress",this.getProgress())}},isReady:function(c){var d=this._PARANOIA_LEVELS[(c!==undefined)?c:this._defaultParanoia];
if(this._strength&&this._strength>=d){return(this._poolEntropy[0]>this._BITS_PER_RESEED&&(new Date()).valueOf()>this._nextReseed)?this._REQUIRES_RESEED|this._READY:this._READY
}else{return(this._poolStrength>=d)?this._REQUIRES_RESEED|this._NOT_READY:this._NOT_READY
}},getProgress:function(c){var d=this._PARANOIA_LEVELS[c?c:this._defaultParanoia];
if(this._strength>=d){return 1}else{return(this._poolStrength>d)?1:this._poolStrength/d
}},startCollectors:function(){if(this._collectorsStarted){return}this._eventListener={loadTimeCollector:this._bind(this._loadTimeCollector),mouseCollector:this._bind(this._mouseCollector),keyboardCollector:this._bind(this._keyboardCollector),accelerometerCollector:this._bind(this._accelerometerCollector),touchCollector:this._bind(this._touchCollector)};
if(window.addEventListener){window.addEventListener("load",this._eventListener.loadTimeCollector,false);
window.addEventListener("mousemove",this._eventListener.mouseCollector,false);window.addEventListener("keypress",this._eventListener.keyboardCollector,false);
window.addEventListener("devicemotion",this._eventListener.accelerometerCollector,false);
window.addEventListener("touchmove",this._eventListener.touchCollector,false)}else{if(document.attachEvent){document.attachEvent("onload",this._eventListener.loadTimeCollector);
document.attachEvent("onmousemove",this._eventListener.mouseCollector);document.attachEvent("keypress",this._eventListener.keyboardCollector)
}else{throw new sjcl.exception.bug("can't attach event")}}this._collectorsStarted=true
},stopCollectors:function(){if(!this._collectorsStarted){return}if(window.removeEventListener){window.removeEventListener("load",this._eventListener.loadTimeCollector,false);
window.removeEventListener("mousemove",this._eventListener.mouseCollector,false);
window.removeEventListener("keypress",this._eventListener.keyboardCollector,false);
window.removeEventListener("devicemotion",this._eventListener.accelerometerCollector,false);
window.removeEventListener("touchmove",this._eventListener.touchCollector,false)}else{if(document.detachEvent){document.detachEvent("onload",this._eventListener.loadTimeCollector);
document.detachEvent("onmousemove",this._eventListener.mouseCollector);document.detachEvent("keypress",this._eventListener.keyboardCollector)
}}this._collectorsStarted=false},addEventListener:function(d,c){this._callbacks[d][this._callbackI++]=c
},removeEventListener:function(k,h){var j,l,m=this._callbacks[k],g=[];for(l in m){if(m.hasOwnProperty(l)&&m[l]===h){g.push(l)
}}for(j=0;j<g.length;j++){l=g[j];delete m[l]}},_bind:function(c){var d=this;return function(){c.apply(d,arguments)
}},_gen4words:function(){for(var b=0;b<4;b++){this._counter[b]=this._counter[b]+1|0;
if(this._counter[b]){break}}return this._cipher.encrypt(this._counter)},_gate:function(){this._key=this._gen4words().concat(this._gen4words());
this._cipher=new sjcl.cipher.aes(this._key)},_reseed:function(c){this._key=sjcl.hash.sha256.hash(this._key.concat(c));
this._cipher=new sjcl.cipher.aes(this._key);for(var d=0;d<4;d++){this._counter[d]=this._counter[d]+1|0;
if(this._counter[d]){break}}},_reseedFromPools:function(h){var f=[],g=0,e;this._nextReseed=f[0]=(new Date()).valueOf()+this._MILLISECONDS_PER_RESEED;
for(e=0;e<16;e++){f.push(Math.random()*4294967296|0)}for(e=0;e<this._pools.length;
e++){f=f.concat(this._pools[e].finalize());g+=this._poolEntropy[e];this._poolEntropy[e]=0;
if(!h&&(this._reseedCount&(1<<e))){break}}if(this._reseedCount>=1<<this._pools.length){this._pools.push(new sjcl.hash.sha256());
this._poolEntropy.push(0)}this._poolStrength-=g;if(g>this._strength){this._strength=g
}this._reseedCount++;this._reseed(f)},_keyboardCollector:function(){this._addCurrentTimeToEntropy(1)
},_mouseCollector:function(h){var f,g;try{f=h.x||h.clientX||h.offsetX||0;g=h.y||h.clientY||h.offsetY||0
}catch(e){f=0;g=0}if(f!=0&&g!=0){sjcl.random.addEntropy([f,g],2,"mouse")}this._addCurrentTimeToEntropy(0)
},_touchCollector:function(e){var g=e.touches[0]||e.changedTouches[0];var f=g.pageX||g.clientX,h=g.pageY||g.clientY;
sjcl.random.addEntropy([f,h],1,"touch");this._addCurrentTimeToEntropy(0)},_loadTimeCollector:function(){this._addCurrentTimeToEntropy(2)
},_addCurrentTimeToEntropy:function(b){if(typeof window!=="undefined"&&window.performance&&typeof window.performance.now==="function"){sjcl.random.addEntropy(window.performance.now(),b,"loadtime")
}else{sjcl.random.addEntropy((new Date()).valueOf(),b,"loadtime")}},_accelerometerCollector:function(d){var e=d.accelerationIncludingGravity.x||d.accelerationIncludingGravity.y||d.accelerationIncludingGravity.z;
if(window.orientation){var f=window.orientation;if(typeof f==="number"){sjcl.random.addEntropy(f,1,"accelerometer")
}}if(e){sjcl.random.addEntropy(e,2,"accelerometer")}this._addCurrentTimeToEntropy(0)
},_fireEvent:function(j,g){var k,f=sjcl.random._callbacks[j],h=[];for(k in f){if(f.hasOwnProperty(k)){h.push(f[k])
}}for(k=0;k<h.length;k++){h[k](g)}}};sjcl.random=new sjcl.prng(6);(function(){function e(){try{return require("crypto")
}catch(a){return null}}try{var g,j,k;if(typeof module!=="undefined"&&module.exports&&(j=e())&&j.randomBytes){g=j.randomBytes(1024/8);
g=new Uint32Array(new Uint8Array(g).buffer);sjcl.random.addEntropy(g,1024,"crypto.randomBytes")
}else{if(typeof window!=="undefined"&&typeof Uint32Array!=="undefined"){k=new Uint32Array(32);
if(window.crypto&&window.crypto.getRandomValues){window.crypto.getRandomValues(k)
}else{if(window.msCrypto&&window.msCrypto.getRandomValues){window.msCrypto.getRandomValues(k)
}else{return}}sjcl.random.addEntropy(k,1024,"crypto.getRandomValues")}else{}}}catch(h){if(typeof window!=="undefined"&&window.console){console.log("There was an error collecting entropy from the browser:");
console.log(h)}}}());sjcl.json={defaults:{v:1,iter:1000,ks:128,ts:64,mode:"ccm",adata:"",cipher:"aes"},_encrypt:function(k,q,p,m){p=p||{};
m=m||{};var o=sjcl.json,r=o._add({iv:sjcl.random.randomWords(4,0)},o.defaults),n,l,j;
o._add(r,p);j=r.adata;if(typeof r.salt==="string"){r.salt=sjcl.codec.base64.toBits(r.salt)
}if(typeof r.iv==="string"){r.iv=sjcl.codec.base64.toBits(r.iv)}if(!sjcl.mode[r.mode]||!sjcl.cipher[r.cipher]||(typeof k==="string"&&r.iter<=100)||(r.ts!==64&&r.ts!==96&&r.ts!==128)||(r.ks!==128&&r.ks!==192&&r.ks!==256)||(r.iv.length<2||r.iv.length>4)){throw new sjcl.exception.invalid("json encrypt: invalid parameters")
}if(typeof k==="string"){n=sjcl.misc.cachedPbkdf2(k,r);k=n.key.slice(0,r.ks/32);r.salt=n.salt
}else{if(sjcl.ecc&&k instanceof sjcl.ecc.elGamal.publicKey){n=k.kem();r.kemtag=n.tag;
k=n.key.slice(0,r.ks/32)}}if(typeof q==="string"){q=sjcl.codec.utf8String.toBits(q)
}if(typeof j==="string"){r.adata=j=sjcl.codec.utf8String.toBits(j)}l=new sjcl.cipher[r.cipher](k);
o._add(m,r);m.key=k;if(r.mode==="ccm"&&sjcl.arrayBuffer&&sjcl.arrayBuffer.ccm&&q instanceof ArrayBuffer){r.ct=sjcl.arrayBuffer.ccm.encrypt(l,q,r.iv,j,r.ts)
}else{r.ct=sjcl.mode[r.mode].encrypt(l,q,r.iv,j,r.ts)}return r},encrypt:function(g,l,j,m){var h=sjcl.json,k=h._encrypt.apply(h,arguments);
return h.encode(k)},_decrypt:function(l,s,r,o){r=r||{};o=o||{};var q=sjcl.json,t=q._add(q._add(q._add({},q.defaults),s),r,true),n,p,m,j=t.adata;
if(typeof t.salt==="string"){t.salt=sjcl.codec.base64.toBits(t.salt)}if(typeof t.iv==="string"){t.iv=sjcl.codec.base64.toBits(t.iv)
}if(!sjcl.mode[t.mode]||!sjcl.cipher[t.cipher]||(typeof l==="string"&&t.iter<=100)||(t.ts!==64&&t.ts!==96&&t.ts!==128)||(t.ks!==128&&t.ks!==192&&t.ks!==256)||(!t.iv)||(t.iv.length<2||t.iv.length>4)){throw new sjcl.exception.invalid("json decrypt: invalid parameters")
}if(typeof l==="string"){p=sjcl.misc.cachedPbkdf2(l,t);l=p.key.slice(0,t.ks/32);t.salt=p.salt
}else{if(sjcl.ecc&&l instanceof sjcl.ecc.elGamal.secretKey){l=l.unkem(sjcl.codec.base64.toBits(t.kemtag)).slice(0,t.ks/32)
}}if(typeof j==="string"){j=sjcl.codec.utf8String.toBits(j)}m=new sjcl.cipher[t.cipher](l);
if(t.mode==="ccm"&&sjcl.arrayBuffer&&sjcl.arrayBuffer.ccm&&t.ct instanceof ArrayBuffer){n=sjcl.arrayBuffer.ccm.decrypt(m,t.ct,t.iv,t.tag,j,t.ts)
}else{n=sjcl.mode[t.mode].decrypt(m,t.ct,t.iv,j,t.ts)}q._add(o,t);o.key=l;if(r.raw===1){return n
}else{return sjcl.codec.utf8String.fromBits(n)}},decrypt:function(f,j,h,k){var g=sjcl.json;
return g._decrypt(f,g.decode(j),h,k)},encode:function(g){var h,e="{",f="";for(h in g){if(g.hasOwnProperty(h)){if(!h.match(/^[a-z0-9]+$/i)){throw new sjcl.exception.invalid("json encode: invalid property name")
}e+=f+'"'+h+'":';f=",";switch(typeof g[h]){case"number":case"boolean":e+=g[h];break;
case"string":e+='"'+escape(g[h])+'"';break;case"object":e+='"'+sjcl.codec.base64.fromBits(g[h],0)+'"';
break;default:throw new sjcl.exception.bug("json encode: unsupported type")}}}return e+"}"
},decode:function(g){g=g.replace(/\s/g,"");if(!g.match(/^\{.*\}$/)){throw new sjcl.exception.invalid("json decode: this isn't json!")
}var k=g.replace(/^\{|\}$/g,"").split(/,/),j={},h,a;for(h=0;h<k.length;h++){if(!(a=k[h].match(/^\s*(?:(["']?)([a-z][a-z0-9]*)\1)\s*:\s*(?:(-?\d+)|"([a-z0-9+\/%*_.@=\-]*)"|(true|false))$/i))){throw new sjcl.exception.invalid("json decode: this isn't json!")
}if(a[3]!=null){j[a[2]]=parseInt(a[3],10)}else{if(a[4]!=null){j[a[2]]=a[2].match(/^(ct|adata|salt|iv)$/)?sjcl.codec.base64.toBits(a[4]):unescape(a[4])
}else{if(a[5]!=null){j[a[2]]=a[5]==="true"}}}}return j},_add:function(h,g,e){if(h===undefined){h={}
}if(g===undefined){return h}var f;for(f in g){if(g.hasOwnProperty(f)){if(e&&h[f]!==undefined&&h[f]!==g[f]){throw new sjcl.exception.invalid("required parameter overridden")
}h[f]=g[f]}}return h},_subtract:function(g,h){var f={},e;for(e in g){if(g.hasOwnProperty(e)&&g[e]!==h[e]){f[e]=g[e]
}}return f},_filter:function(g,h){var f={},e;for(e=0;e<h.length;e++){if(g[h[e]]!==undefined){f[h[e]]=g[h[e]]
}}return f}};sjcl.encrypt=sjcl.json.encrypt;sjcl.decrypt=sjcl.json.decrypt;sjcl.misc._pbkdf2Cache={};
sjcl.misc.cachedPbkdf2=function(p,m){var c=sjcl.misc._pbkdf2Cache,k,n,l,o,j;m=m||{};
j=m.iter||1000;n=c[p]=c[p]||{};k=n[j]=n[j]||{firstSalt:(m.salt&&m.salt.length)?m.salt.slice(0):sjcl.random.randomWords(2,0)};
o=(m.salt===undefined)?k.firstSalt:m.salt;k[o]=k[o]||sjcl.misc.pbkdf2(p,o,m.iter);
return{key:k[o].slice(0),salt:o.slice(0)}};sjcl.hash.sha1=function(b){if(b){this._h=b._h.slice(0);
this._buffer=b._buffer.slice(0);this._length=b._length}else{this.reset()}};sjcl.hash.sha1.hash=function(b){return(new sjcl.hash.sha1()).update(b).finalize()
};sjcl.hash.sha1.prototype={blockSize:512,reset:function(){this._h=this._init.slice(0);
this._buffer=[];this._length=0;return this},update:function(g){if(typeof g==="string"){g=sjcl.codec.utf8String.toBits(g)
}var h,b=this._buffer=sjcl.bitArray.concat(this._buffer,g),j=this._length,k=this._length=j+sjcl.bitArray.bitLength(g);
for(h=this.blockSize+j&-this.blockSize;h<=k;h+=this.blockSize){this._block(b.splice(0,16))
}return this},finalize:function(){var f,b=this._buffer,e=this._h;b=sjcl.bitArray.concat(b,[sjcl.bitArray.partial(1,1)]);
for(f=b.length+2;f&15;f++){b.push(0)}b.push(Math.floor(this._length/4294967296));
b.push(this._length|0);while(b.length){this._block(b.splice(0,16))}this.reset();return e
},_init:[1732584193,4023233417,2562383102,271733878,3285377520],_key:[1518500249,1859775393,2400959708,3395469782],_f:function(h,b,c,d){if(h<=19){return(b&c)|(~b&d)
}else{if(h<=39){return b^c^d}else{if(h<=59){return(b&c)|(b&d)|(c&d)}else{if(h<=79){return b^c^d
}}}}},_S:function(c,d){return(d<<c)|(d>>>32-c)},_block:function(e){var a,t,c,d,h,q,r,b=e.slice(0),s=this._h;
c=s[0];d=s[1];h=s[2];q=s[3];r=s[4];for(a=0;a<=79;a++){if(a>=16){b[a]=this._S(1,b[a-3]^b[a-8]^b[a-14]^b[a-16])
}t=(this._S(5,c)+this._f(a,d,h,q)+r+b[a]+this._key[Math.floor(a/20)])|0;r=q;q=h;h=this._S(30,d);
d=c;c=t}s[0]=(s[0]+c)|0;s[1]=(s[1]+d)|0;s[2]=(s[2]+h)|0;s[3]=(s[3]+q)|0;s[4]=(s[4]+r)|0
}};sjcl.hash.sha512=function(b){if(!this._key[0]){this._precompute()}if(b){this._h=b._h.slice(0);
this._buffer=b._buffer.slice(0);this._length=b._length}else{this.reset()}};sjcl.hash.sha512.hash=function(b){return(new sjcl.hash.sha512()).update(b).finalize()
};sjcl.hash.sha512.prototype={blockSize:1024,reset:function(){this._h=this._init.slice(0);
this._buffer=[];this._length=0;return this},update:function(g){if(typeof g==="string"){g=sjcl.codec.utf8String.toBits(g)
}var h,b=this._buffer=sjcl.bitArray.concat(this._buffer,g),j=this._length,k=this._length=j+sjcl.bitArray.bitLength(g);
for(h=1024+j&-1024;h<=k;h+=1024){this._block(b.splice(0,32))}return this},finalize:function(){var f,b=this._buffer,e=this._h;
b=sjcl.bitArray.concat(b,[sjcl.bitArray.partial(1,1)]);for(f=b.length+4;f&31;f++){b.push(0)
}b.push(0);b.push(0);b.push(Math.floor(this._length/4294967296));b.push(this._length|0);
while(b.length){this._block(b.splice(0,32))}this.reset();return e},_init:[],_initr:[12372232,13281083,9762859,1914609,15106769,4090911,4308331,8266105],_key:[],_keyr:[2666018,15689165,5061423,9034684,4764984,380953,1658779,7176472,197186,7368638,14987916,16757986,8096111,1480369,13046325,6891156,15813330,5187043,9229749,11312229,2818677,10937475,4324308,1135541,6741931,11809296,16458047,15666916,11046850,698149,229999,945776,13774844,2541862,12856045,9810911,11494366,7844520,15576806,8533307,15795044,4337665,16291729,5553712,15684120,6662416,7413802,12308920,13816008,4303699,9366425,10176680,13195875,4295371,6546291,11712675,15708924,1519456,15772530,6568428,6495784,8568297,13007125,7492395,2515356,12632583,14740254,7262584,1535930,13146278,16321966,1853211,294276,13051027,13221564,1051980,4080310,6651434,14088940,4675607],_precompute:function(){var j=0,k=2,f;
function g(a){return(a-Math.floor(a))*4294967296|0}function h(a){return(a-Math.floor(a))*1099511627776&255
}outer:for(;j<80;k++){for(f=2;f*f<=k;f++){if(k%f===0){continue outer}}if(j<8){this._init[j*2]=g(Math.pow(k,1/2));
this._init[j*2+1]=(h(Math.pow(k,1/2))<<24)|this._initr[j]}this._key[j*2]=g(Math.pow(k,1/3));
this._key[j*2+1]=(h(Math.pow(k,1/3))<<24)|this._keyr[j];j++}},_block:function(aE){var aX,aK,a1,ax=aE.slice(0),aR=this._h,a4=this._key,bl=aR[0],bo=aR[1],h=aR[2],at=aR[3],aY=aR[4],a2=aR[5],bi=aR[6],bn=aR[7],aV=aR[8],w=aR[9],aS=aR[10],a0=aR[11],bf=aR[12],bk=aR[13],aO=aR[14],a5=aR[15];
var bd=bl,bj=bo,aH=h,aZ=at,aM=aY,aW=a2,bb=bi,bg=bn,aG=aV,aP=w,aI=aS,aQ=a0,ba=bf,be=bk,aC=aO,aL=a5;
for(aX=0;aX<80;aX++){if(aX<16){aK=ax[aX*2];a1=ax[aX*2+1]}else{var ay=ax[(aX-15)*2];
var aA=ax[(aX-15)*2+1];var bh=((aA<<31)|(ay>>>1))^((aA<<24)|(ay>>>8))^(ay>>>7);var bm=((ay<<31)|(aA>>>1))^((ay<<24)|(aA>>>8))^((ay<<25)|(aA>>>7));
var aF=ax[(aX-2)*2];var aN=ax[(aX-2)*2+1];var aU=((aN<<13)|(aF>>>19))^((aF<<3)|(aN>>>29))^(aF>>>6);
var k=((aF<<13)|(aN>>>19))^((aN<<3)|(aF>>>29))^((aF<<26)|(aN>>>6));var aJ=ax[(aX-7)*2];
var aT=ax[(aX-7)*2+1];var ar=ax[(aX-16)*2];var av=ax[(aX-16)*2+1];a1=bm+aT;aK=bh+aJ+((a1>>>0)<(bm>>>0)?1:0);
a1+=k;aK+=aU+((a1>>>0)<(k>>>0)?1:0);a1+=av;aK+=ar+((a1>>>0)<(av>>>0)?1:0)}ax[aX*2]=aK|=0;
ax[aX*2+1]=a1|=0;var a3=(aG&aI)^(~aG&ba);var a7=(aP&aQ)^(~aP&be);var au=(bd&aH)^(bd&aM)^(aH&aM);
var aw=(bj&aZ)^(bj&aW)^(aZ&aW);var br=((bj<<4)|(bd>>>28))^((bd<<30)|(bj>>>2))^((bd<<25)|(bj>>>7));
var az=((bd<<4)|(bj>>>28))^((bj<<30)|(bd>>>2))^((bj<<25)|(bd>>>7));var aB=((aP<<18)|(aG>>>14))^((aP<<14)|(aG>>>18))^((aG<<23)|(aP>>>9));
var aD=((aG<<18)|(aP>>>14))^((aG<<14)|(aP>>>18))^((aP<<23)|(aG>>>9));var a9=a4[aX*2];
var bc=a4[aX*2+1];var a8=aL+aD;var a6=aC+aB+((a8>>>0)<(aL>>>0)?1:0);a8+=a7;a6+=a3+((a8>>>0)<(a7>>>0)?1:0);
a8+=bc;a6+=a9+((a8>>>0)<(bc>>>0)?1:0);a8=a8+a1|0;a6+=aK+((a8>>>0)<(a1>>>0)?1:0);var bq=az+aw;
var bp=br+au+((bq>>>0)<(az>>>0)?1:0);aC=ba;aL=be;ba=aI;be=aQ;aI=aG;aQ=aP;aP=(bg+a8)|0;
aG=(bb+a6+((aP>>>0)<(bg>>>0)?1:0))|0;bb=aM;bg=aW;aM=aH;aW=aZ;aH=bd;aZ=bj;bj=(a8+bq)|0;
bd=(a6+bp+((bj>>>0)<(a8>>>0)?1:0))|0}bo=aR[1]=(bo+bj)|0;aR[0]=(bl+bd+((bo>>>0)<(bj>>>0)?1:0))|0;
at=aR[3]=(at+aZ)|0;aR[2]=(h+aH+((at>>>0)<(aZ>>>0)?1:0))|0;a2=aR[5]=(a2+aW)|0;aR[4]=(aY+aM+((a2>>>0)<(aW>>>0)?1:0))|0;
bn=aR[7]=(bn+bg)|0;aR[6]=(bi+bb+((bn>>>0)<(bg>>>0)?1:0))|0;w=aR[9]=(w+aP)|0;aR[8]=(aV+aG+((w>>>0)<(aP>>>0)?1:0))|0;
a0=aR[11]=(a0+aQ)|0;aR[10]=(aS+aI+((a0>>>0)<(aQ>>>0)?1:0))|0;bk=aR[13]=(bk+be)|0;
aR[12]=(bf+ba+((bk>>>0)<(be>>>0)?1:0))|0;a5=aR[15]=(a5+aL)|0;aR[14]=(aO+aC+((a5>>>0)<(aL>>>0)?1:0))|0
}};if(sjcl.beware===undefined){sjcl.beware={}}sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]=function(){sjcl.mode.cbc={name:"cbc",encrypt:function(n,t,q,l){if(l&&l.length){throw new sjcl.exception.invalid("cbc can't authenticate data")
}if(sjcl.bitArray.bitLength(q)!==128){throw new sjcl.exception.invalid("cbc iv must be 128 bits")
}var p,m=sjcl.bitArray,o=m._xor4,r=m.bitLength(t),u=0,s=[];if(r&7){throw new sjcl.exception.invalid("pkcs#5 padding only works for multiples of a byte")
}for(p=0;u+128<=r;p+=4,u+=128){q=n.encrypt(o(q,t.slice(p,p+4)));s.splice(p,0,q[0],q[1],q[2],q[3])
}r=(16-((r>>3)&15))*16843009;q=n.encrypt(o(q,m.concat(t,[r,r,r,r]).slice(p,p+4)));
s.splice(p,0,q[0],q[1],q[2],q[3]);return s},decrypt:function(n,s,r,l){if(l&&l.length){throw new sjcl.exception.invalid("cbc can't authenticate data")
}if(sjcl.bitArray.bitLength(r)!==128){throw new sjcl.exception.invalid("cbc iv must be 128 bits")
}if((sjcl.bitArray.bitLength(s)&127)||!s.length){throw new sjcl.exception.corrupt("cbc ciphertext must be a positive multiple of the block size")
}var p,m=sjcl.bitArray,o=m._xor4,q,u,t=[];l=l||[];for(p=0;p<s.length;p+=4){q=s.slice(p,p+4);
u=o(r,n.decrypt(q));t.splice(p,0,u[0],u[1],u[2],u[3]);r=q}q=t[p-1]&255;if(q===0||q>16){throw new sjcl.exception.corrupt("pkcs#5 padding corrupt")
}u=q*16843009;if(!m.equal(m.bitSlice([u,u,u,u],0,q*8),m.bitSlice(t,t.length*32-q*8,t.length*32))){throw new sjcl.exception.corrupt("pkcs#5 padding corrupt")
}return m.bitSlice(t,0,t.length*32-q*8)}}};sjcl.bitArray._xor4=function(d,c){return[d[0]^c[0],d[1]^c[1],d[2]^c[2],d[3]^c[3]]
};(function(c){function Y(aa,ab,Z){return ab<=aa&&aa<=Z}function X(aa,Z){return Math.floor(aa/Z)
}function V(Z){if(Z===undefined){return{}}if(Z===Object(Z)){return Z}throw TypeError("Could not convert argument to dictionary")
}function p(ab){var ah=String(ab);var Z=ah.length;var aa=0;var ag=[];while(aa<Z){var ad=ah.charCodeAt(aa);
if(ad<55296||ad>57343){ag.push(ad)}else{if(56320<=ad&&ad<=57343){ag.push(65533)}else{if(55296<=ad&&ad<=56319){if(aa===Z-1){ag.push(65533)
}else{var ac=ab.charCodeAt(aa+1);if(56320<=ac&&ac<=57343){var af=ad&1023;var ae=ac&1023;
ag.push(65536+(af<<10)+ae);aa+=1}else{ag.push(65533)}}}}}aa+=1}return ag}function n(aa){var ab="";
for(var Z=0;Z<aa.length;++Z){var ac=aa[Z];if(ac<=65535){ab+=String.fromCharCode(ac)
}else{ac-=65536;ab+=String.fromCharCode((ac>>10)+55296,(ac&1023)+56320)}}return ab
}var U=-1;function w(Z){this.tokens=[].slice.call(Z)}w.prototype={endOfStream:function(){return !this.tokens.length
},read:function(){if(!this.tokens.length){return U}return this.tokens.shift()},prepend:function(Z){if(Array.isArray(Z)){var aa=(Z);
while(aa.length){this.tokens.unshift(aa.pop())}}else{this.tokens.unshift(Z)}},push:function(Z){if(Array.isArray(Z)){var aa=(Z);
while(aa.length){this.tokens.push(aa.shift())}}else{this.tokens.push(Z)}}};var x=-1;
function e(aa,Z){if(aa){throw TypeError("Decoder error")}return Z||65533}function B(Z){throw TypeError("The code point "+Z+" could not be encoded.")
}function b(){}b.prototype={handler:function(Z,aa){}};function L(){}L.prototype={handler:function(aa,Z){}};
function J(Z){Z=String(Z).trim().toLowerCase();if(Object.prototype.hasOwnProperty.call(Q,Z)){return Q[Z]
}return null}var t=[{encodings:[{labels:["unicode-1-1-utf-8","utf-8","utf8"],name:"utf-8"}],heading:"The Encoding"},{encodings:[{labels:["866","cp866","csibm866","ibm866"],name:"ibm866"},{labels:["csisolatin2","iso-8859-2","iso-ir-101","iso8859-2","iso88592","iso_8859-2","iso_8859-2:1987","l2","latin2"],name:"iso-8859-2"},{labels:["csisolatin3","iso-8859-3","iso-ir-109","iso8859-3","iso88593","iso_8859-3","iso_8859-3:1988","l3","latin3"],name:"iso-8859-3"},{labels:["csisolatin4","iso-8859-4","iso-ir-110","iso8859-4","iso88594","iso_8859-4","iso_8859-4:1988","l4","latin4"],name:"iso-8859-4"},{labels:["csisolatincyrillic","cyrillic","iso-8859-5","iso-ir-144","iso8859-5","iso88595","iso_8859-5","iso_8859-5:1988"],name:"iso-8859-5"},{labels:["arabic","asmo-708","csiso88596e","csiso88596i","csisolatinarabic","ecma-114","iso-8859-6","iso-8859-6-e","iso-8859-6-i","iso-ir-127","iso8859-6","iso88596","iso_8859-6","iso_8859-6:1987"],name:"iso-8859-6"},{labels:["csisolatingreek","ecma-118","elot_928","greek","greek8","iso-8859-7","iso-ir-126","iso8859-7","iso88597","iso_8859-7","iso_8859-7:1987","sun_eu_greek"],name:"iso-8859-7"},{labels:["csiso88598e","csisolatinhebrew","hebrew","iso-8859-8","iso-8859-8-e","iso-ir-138","iso8859-8","iso88598","iso_8859-8","iso_8859-8:1988","visual"],name:"iso-8859-8"},{labels:["csiso88598i","iso-8859-8-i","logical"],name:"iso-8859-8-i"},{labels:["csisolatin6","iso-8859-10","iso-ir-157","iso8859-10","iso885910","l6","latin6"],name:"iso-8859-10"},{labels:["iso-8859-13","iso8859-13","iso885913"],name:"iso-8859-13"},{labels:["iso-8859-14","iso8859-14","iso885914"],name:"iso-8859-14"},{labels:["csisolatin9","iso-8859-15","iso8859-15","iso885915","iso_8859-15","l9"],name:"iso-8859-15"},{labels:["iso-8859-16"],name:"iso-8859-16"},{labels:["cskoi8r","koi","koi8","koi8-r","koi8_r"],name:"koi8-r"},{labels:["koi8-u"],name:"koi8-u"},{labels:["csmacintosh","mac","macintosh","x-mac-roman"],name:"macintosh"},{labels:["dos-874","iso-8859-11","iso8859-11","iso885911","tis-620","windows-874"],name:"windows-874"},{labels:["cp1250","windows-1250","x-cp1250"],name:"windows-1250"},{labels:["cp1251","windows-1251","x-cp1251"],name:"windows-1251"},{labels:["ansi_x3.4-1968","ascii","cp1252","cp819","csisolatin1","ibm819","iso-8859-1","iso-ir-100","iso8859-1","iso88591","iso_8859-1","iso_8859-1:1987","l1","latin1","us-ascii","windows-1252","x-cp1252"],name:"windows-1252"},{labels:["cp1253","windows-1253","x-cp1253"],name:"windows-1253"},{labels:["cp1254","csisolatin5","iso-8859-9","iso-ir-148","iso8859-9","iso88599","iso_8859-9","iso_8859-9:1989","l5","latin5","windows-1254","x-cp1254"],name:"windows-1254"},{labels:["cp1255","windows-1255","x-cp1255"],name:"windows-1255"},{labels:["cp1256","windows-1256","x-cp1256"],name:"windows-1256"},{labels:["cp1257","windows-1257","x-cp1257"],name:"windows-1257"},{labels:["cp1258","windows-1258","x-cp1258"],name:"windows-1258"},{labels:["x-mac-cyrillic","x-mac-ukrainian"],name:"x-mac-cyrillic"}],heading:"Legacy single-byte encodings"},{encodings:[{labels:["chinese","csgb2312","csiso58gb231280","gb2312","gb_2312","gb_2312-80","gbk","iso-ir-58","x-gbk"],name:"gbk"},{labels:["gb18030"],name:"gb18030"}],heading:"Legacy multi-byte Chinese (simplified) encodings"},{encodings:[{labels:["big5","big5-hkscs","cn-big5","csbig5","x-x-big5"],name:"big5"}],heading:"Legacy multi-byte Chinese (traditional) encodings"},{encodings:[{labels:["cseucpkdfmtjapanese","euc-jp","x-euc-jp"],name:"euc-jp"},{labels:["csiso2022jp","iso-2022-jp"],name:"iso-2022-jp"},{labels:["csshiftjis","ms_kanji","shift-jis","shift_jis","sjis","windows-31j","x-sjis"],name:"shift_jis"}],heading:"Legacy multi-byte Japanese encodings"},{encodings:[{labels:["cseuckr","csksc56011987","euc-kr","iso-ir-149","korean","ks_c_5601-1987","ks_c_5601-1989","ksc5601","ksc_5601","windows-949"],name:"euc-kr"}],heading:"Legacy multi-byte Korean encodings"},{encodings:[{labels:["csiso2022kr","hz-gb-2312","iso-2022-cn","iso-2022-cn-ext","iso-2022-kr"],name:"replacement"},{labels:["utf-16be"],name:"utf-16be"},{labels:["utf-16","utf-16le"],name:"utf-16le"},{labels:["x-user-defined"],name:"x-user-defined"}],heading:"Legacy miscellaneous encodings"}];
var Q={};t.forEach(function(Z){Z.encodings.forEach(function(aa){aa.labels.forEach(function(ab){Q[ab]=aa
})})});var R={};var M={};function C(aa,Z){if(!Z){return null}return Z[aa]||null}function r(aa,Z){var ab=Z.indexOf(aa);
return ab===-1?null:ab}function G(Z){if(!("encoding-indexes" in c)){throw Error("Indexes missing. Did you forget to include encoding-indexes.js?")
}return c["encoding-indexes"][Z]}function g(ae){if((ae>39419&&ae<189000)||(ae>1237575)){return null
}var ad=0;var ab=0;var Z=G("gb18030");var aa;for(aa=0;aa<Z.length;++aa){var ac=Z[aa];
if(ac[0]<=ae){ad=ac[0];ab=ac[1]}else{break}}return ab+ae-ad}function o(ac){var ae=0;
var ab=0;var Z=G("gb18030");var aa;for(aa=0;aa<Z.length;++aa){var ad=Z[aa];if(ad[1]<=ac){ae=ad[1];
ab=ad[0]}else{break}}return ab+ac-ae}function E(Z){var aa=r(Z,G("jis0208"));if(aa===null||Y(aa,8272,8835)){return null
}return aa}var T="utf-8";function W(aa,Z){if(!(this instanceof W)){return new W(aa,Z)
}aa=aa!==undefined?String(aa):T;Z=V(Z);this._encoding=J(aa);if(this._encoding===null||this._encoding.name==="replacement"){throw RangeError("Unknown encoding: "+aa)
}if(!M[this._encoding.name]){throw Error("Decoder not present. Did you forget to include encoding-indexes.js?")
}this._streaming=false;this._BOMseen=false;this._decoder=null;this._fatal=Boolean(Z.fatal);
this._ignoreBOM=Boolean(Z.ignoreBOM);if(Object.defineProperty){Object.defineProperty(this,"encoding",{value:this._encoding.name});
Object.defineProperty(this,"fatal",{value:this._fatal});Object.defineProperty(this,"ignoreBOM",{value:this._ignoreBOM})
}else{this.encoding=this._encoding.name;this.fatal=this._fatal;this.ignoreBOM=this._ignoreBOM
}return this}W.prototype={decode:function h(ab,ac){var aa;if(typeof ab==="object"&&ab instanceof ArrayBuffer){aa=new Uint8Array(ab)
}else{if(typeof ab==="object"&&"buffer" in ab&&ab.buffer instanceof ArrayBuffer){aa=new Uint8Array(ab.buffer,ab.byteOffset,ab.byteLength)
}else{aa=new Uint8Array(0)}}ac=V(ac);if(!this._streaming){this._decoder=M[this._encoding.name]({fatal:this._fatal});
this._BOMseen=false}this._streaming=Boolean(ac.stream);var ae=new w(aa);var ad=[];
var Z;while(!ae.endOfStream()){Z=this._decoder.handler(ae,ae.read());if(Z===x){break
}if(Z===null){continue}if(Array.isArray(Z)){ad.push.apply(ad,(Z))}else{ad.push(Z)
}}if(!this._streaming){do{Z=this._decoder.handler(ae,ae.read());if(Z===x){break}if(Z===null){continue
}if(Array.isArray(Z)){ad.push.apply(ad,(Z))}else{ad.push(Z)}}while(!ae.endOfStream());
this._decoder=null}if(ad.length){if(["utf-8","utf-16le","utf-16be"].indexOf(this.encoding)!==-1&&!this._ignoreBOM&&!this._BOMseen){if(ad[0]===65279){this._BOMseen=true;
ad.shift()}else{this._BOMseen=true}}}return n(ad)}};function D(ac,Z){if(!(this instanceof D)){return new D(ac,Z)
}ac=ac!==undefined?String(ac):T;Z=V(Z);this._encoding=J(ac);if(this._encoding===null||this._encoding.name==="replacement"){throw RangeError("Unknown encoding: "+ac)
}var ab=Boolean(Z.NONSTANDARD_allowLegacyEncoding);var aa=(this._encoding.name!=="utf-8"&&this._encoding.name!=="utf-16le"&&this._encoding.name!=="utf-16be");
if(this._encoding===null||(aa&&!ab)){throw RangeError("Unknown encoding: "+ac)}if(!R[this._encoding.name]){throw Error("Encoder not present. Did you forget to include encoding-indexes.js?")
}this._streaming=false;this._encoder=null;this._options={fatal:Boolean(Z.fatal)};
if(Object.defineProperty){Object.defineProperty(this,"encoding",{value:this._encoding.name})
}else{this.encoding=this._encoding.name}return this}D.prototype={encode:function j(aa,ac){aa=aa?String(aa):"";
ac=V(ac);if(!this._streaming){this._encoder=R[this._encoding.name](this._options)
}this._streaming=Boolean(ac.stream);var ab=[];var ad=new w(p(aa));var Z;while(!ad.endOfStream()){Z=this._encoder.handler(ad,ad.read());
if(Z===x){break}if(Array.isArray(Z)){ab.push.apply(ab,(Z))}else{ab.push(Z)}}if(!this._streaming){while(true){Z=this._encoder.handler(ad,ad.read());
if(Z===x){break}if(Array.isArray(Z)){ab.push.apply(ab,(Z))}else{ab.push(Z)}}this._encoder=null
}return new Uint8Array(ab)}};function P(aa){var ae=aa.fatal;var ac=0,ab=0,af=0,ad=128,Z=191;
this.handler=function(ah,ai){if(ai===U&&af!==0){af=0;return e(ae)}if(ai===U){return x
}if(af===0){if(Y(ai,0,127)){return ai}if(Y(ai,194,223)){af=1;ac=ai-192}else{if(Y(ai,224,239)){if(ai===224){ad=160
}if(ai===237){Z=159}af=2;ac=ai-224}else{if(Y(ai,240,244)){if(ai===240){ad=144}if(ai===244){Z=143
}af=3;ac=ai-240}else{return e(ae)}}}ac=ac<<(6*af);return null}if(!Y(ai,ad,Z)){ac=af=ab=0;
ad=128;Z=191;ah.prepend(ai);return e(ae)}ad=128;Z=191;ab+=1;ac+=(ai-128)<<(6*(af-ab));
if(ab!==af){return null}var ag=ac;ac=af=ab=0;return ag}}function y(Z){var aa=Z.fatal;
this.handler=function(ag,ad){if(ad===U){return x}if(Y(ad,0,127)){return ad}var ae,af;
if(Y(ad,128,2047)){ae=1;af=192}else{if(Y(ad,2048,65535)){ae=2;af=224}else{if(Y(ad,65536,1114111)){ae=3;
af=240}}}var ab=[(ad>>(6*ae))+af];while(ae>0){var ac=ad>>(6*(ae-1));ab.push(128|(ac&63));
ae-=1}return ab}}R["utf-8"]=function(Z){return new y(Z)};M["utf-8"]=function(Z){return new P(Z)
};function m(aa,Z){var ab=Z.fatal;this.handler=function(ad,ae){if(ae===U){return x
}if(Y(ae,0,127)){return ae}var ac=aa[ae-128];if(ac===null){return e(ab)}return ac
}}function N(aa,Z){var ab=Z.fatal;this.handler=function(ae,ac){if(ac===U){return x
}if(Y(ac,0,127)){return ac}var ad=r(ac,aa);if(ad===null){B(ac)}return ad+128}}(function(){if(!("encoding-indexes" in c)){return
}t.forEach(function(Z){if(Z.heading!=="Legacy single-byte encodings"){return}Z.encodings.forEach(function(ac){var ab=ac.name;
var aa=G(ab);M[ab]=function(ad){return new m(aa,ad)};R[ab]=function(ad){return new N(aa,ad)
}})})}());M.gbk=function(Z){return new v(Z)};R.gbk=function(Z){return new f(Z,true)
};function v(ab){var ad=ab.fatal;var ac=0,aa=0,Z=0;this.handler=function(aj,ak){if(ak===U&&ac===0&&aa===0&&Z===0){return x
}if(ak===U&&(ac!==0||aa!==0||Z!==0)){ac=0;aa=0;Z=0;e(ad)}var ag;if(Z!==0){ag=null;
if(Y(ak,48,57)){ag=g((((ac-129)*10+(aa-48))*126+(Z-129))*10+ak-48)}var ae=[aa,Z,ak];
ac=0;aa=0;Z=0;if(ag===null){aj.prepend(ae);return e(ad)}return ag}if(aa!==0){if(Y(ak,129,254)){Z=ak;
return null}aj.prepend([aa,ak]);ac=0;aa=0;return e(ad)}if(ac!==0){if(Y(ak,48,57)){aa=ak;
return null}var af=ac;var ai=null;ac=0;var ah=ak<127?64:65;if(Y(ak,64,126)||Y(ak,128,254)){ai=(af-129)*190+(ak-ah)
}ag=ai===null?null:C(ai,G("gb18030"));if(ai===null){aj.prepend(ak)}if(ag===null){return e(ad)
}return ag}if(Y(ak,0,127)){return ak}if(ak===128){return 8364}if(Y(ak,129,254)){ac=ak;
return null}return e(ad)}}function f(aa,Z){var ab=aa.fatal;this.handler=function(al,af){if(af===U){return x
}if(Y(af,0,127)){return af}if(Z&&af===8364){return 128}var ac=r(af,G("gb18030"));
if(ac!==null){var ag=X(ac,190)+129;var ad=ac%190;var ae=ad<63?64:65;return[ag,ad+ae]
}if(Z){return B(af)}ac=o(af);var ak=X(X(X(ac,10),126),10);ac=ac-ak*10*126*10;var aj=X(X(ac,10),126);
ac=ac-aj*10*126;var ai=X(ac,10);var ah=ac-ai*10;return[ak+129,aj+48,ai+129,ah+48]
}}R.gb18030=function(Z){return new f(Z)};M.gb18030=function(Z){return new v(Z)};function I(aa){var ab=aa.fatal;
var Z=0;this.handler=function(ag,ah){if(ah===U&&Z!==0){Z=0;return e(ab)}if(ah===U&&Z===0){return x
}if(Z!==0){var ac=Z;var af=null;Z=0;var ae=ah<127?64:98;if(Y(ah,64,126)||Y(ah,161,254)){af=(ac-129)*157+(ah-ae)
}switch(af){case 1133:return[202,772];case 1135:return[202,780];case 1164:return[234,772];
case 1166:return[234,780]}var ad=(af===null)?null:C(af,G("big5"));if(ad===null&&Y(ah,0,127)){ag.prepend(ah)
}if(ad===null){return e(ab)}return ad}if(Y(ah,0,127)){return ah}if(Y(ah,129,254)){Z=ah;
return null}return e(ab)}}function s(Z){var aa=Z.fatal;this.handler=function(ag,ad){if(ad===U){return x
}if(Y(ad,0,127)){return ad}var af=r(ad,G("big5"));if(af===null){return B(ad)}var ac=X(af,157)+129;
if(ac<161){return B(ad)}var ab=af%157;var ae=ab<63?64:98;return[ac,ab+ae]}}R.big5=function(Z){return new s(Z)
};M.big5=function(Z){return new I(Z)};function d(ab){var ac=ab.fatal;var Z=false,aa=0;
this.handler=function(af,ag){if(ag===U&&aa!==0){aa=0;return e(ac)}if(ag===U&&aa===0){return x
}if(aa===142&&Y(ag,161,223)){aa=0;return 65377+ag-161}if(aa===143&&Y(ag,161,254)){Z=true;
aa=ag;return null}if(aa!==0){var ad=aa;aa=0;var ae=null;if(Y(ad,161,254)&&Y(ag,161,254)){ae=C((ad-161)*94+(ag-161),G(!Z?"jis0208":"jis0212"))
}Z=false;if(!Y(ag,161,254)){af.prepend(ag)}if(ae===null){return e(ac)}return ae}if(Y(ag,0,127)){return ag
}if(ag===142||ag===143||Y(ag,161,254)){aa=ag;return null}return e(ac)}}function H(Z){var aa=Z.fatal;
this.handler=function(af,ad){if(ad===U){return x}if(Y(ad,0,127)){return ad}if(ad===165){return 92
}if(ad===8254){return 126}if(Y(ad,65377,65439)){return[142,ad-65377+161]}var ae=r(ad,G("jis0208"));
if(ae===null){return B(ad)}var ac=X(ae,94)+161;var ab=ae%94+161;return[ac,ab]}}R["euc-jp"]=function(Z){return new H(Z)
};M["euc-jp"]=function(Z){return new d(Z)};function A(ac){var af=ac.fatal;var ab={ASCII:0,Roman:1,Katakana:2,LeadByte:3,TrailByte:4,EscapeStart:5,Escape:6};
var aa=ab.ASCII,Z=ab.ASCII,ad=0,ae=false;this.handler=function(al,am){switch(aa){default:case ab.ASCII:if(am===27){aa=ab.EscapeStart;
return null}if(Y(am,0,127)&&am!==14&&am!==15&&am!==27){ae=false;return am}if(am===U){return x
}ae=false;return e(af);case ab.Roman:if(am===27){aa=ab.EscapeStart;return null}if(am===92){ae=false;
return 165}if(am===126){ae=false;return 8254}if(Y(am,0,127)&&am!==14&&am!==15&&am!==27&&am!==92&&am!==126){ae=false;
return am}if(am===U){return x}ae=false;return e(af);case ab.Katakana:if(am===27){aa=ab.EscapeStart;
return null}if(Y(am,33,95)){ae=false;return 65377+am-33}if(am===U){return x}ae=false;
return e(af);case ab.LeadByte:if(am===27){aa=ab.EscapeStart;return null}if(Y(am,33,126)){ae=false;
ad=am;aa=ab.TrailByte;return null}if(am===U){return x}ae=false;return e(af);case ab.TrailByte:if(am===27){aa=ab.EscapeStart;
return e(af)}if(Y(am,33,126)){aa=ab.LeadByte;var ak=(ad-33)*94+am-33;var ah=C(ak,G("jis0208"));
if(ah===null){return e(af)}return ah}if(am===U){aa=ab.LeadByte;al.prepend(am);return e(af)
}aa=ab.LeadByte;return e(af);case ab.EscapeStart:if(am===36||am===40){ad=am;aa=ab.Escape;
return null}al.prepend(am);ae=false;aa=Z;return e(af);case ab.Escape:var ag=ad;ad=0;
var ai=null;if(ag===40&&am===66){ai=ab.ASCII}if(ag===40&&am===74){ai=ab.Roman}if(ag===40&&am===73){ai=ab.Katakana
}if(ag===36&&(am===64||am===66)){ai=ab.LeadByte}if(ai!==null){aa=aa=ai;var aj=ae;
ae=true;return !aj?null:e(af)}al.prepend([ag,am]);ae=false;aa=Z;return e(af)}}}function k(aa){var ab=aa.fatal;
var Z={ASCII:0,Roman:1,jis0208:2};var ac=Z.ASCII;this.handler=function(ah,af){if(af===U&&ac!==Z.ASCII){ah.prepend(af);
return[27,40,66]}if(af===U&&ac===Z.ASCII){return x}if(ac===Z.ASCII&&Y(af,0,127)){return af
}if(ac===Z.Roman&&Y(af,0,127)&&af!==92&&af!==126){if(Y(af,0,127)){return af}if(af===165){return 92
}if(af===8254){return 126}}if(Y(af,0,127)&&ac!==Z.ASCII){ah.prepend(af);ac=Z.ASCII;
return[27,40,66]}if((af===165||af===8254)&&ac!==Z.Roman){ah.prepend(af);ac=Z.Roman;
return[27,40,74]}var ag=r(af,G("jis0208"));if(ag===null){return B(af)}if(ac!==Z.jis0208){ah.prepend(af);
ac=Z.jis0208;return[27,36,66]}var ae=X(ag,94)+33;var ad=ag%94+33;return[ae,ad]}}R["iso-2022-jp"]=function(Z){return new k(Z)
};M["iso-2022-jp"]=function(Z){return new A(Z)};function S(Z){var ab=Z.fatal;var aa=0;
this.handler=function(ag,ai){if(ai===U&&aa!==0){aa=0;return e(ab)}if(ai===U&&aa===0){return x
}if(aa!==0){var ac=aa;var af=null;aa=0;var ae=(ai<127)?64:65;var ah=(ac<160)?129:193;
if(Y(ai,64,126)||Y(ai,128,252)){af=(ac-ah)*188+ai-ae}var ad=(af===null)?null:C(af,G("jis0208"));
if(ad===null&&af!==null&&Y(af,8836,10528)){return 57344+af-8836}if(af===null){ag.prepend(ai)
}if(ad===null){return e(ab)}return ad}if(Y(ai,0,128)){return ai}if(Y(ai,161,223)){return 65377+ai-161
}if(Y(ai,129,159)||Y(ai,224,252)){aa=ai;return null}return e(ab)}}function z(Z){var aa=Z.fatal;
this.handler=function(ag,ad){if(ad===U){return x}if(Y(ad,0,128)){return ad}if(ad===165){return 92
}if(ad===8254){return 126}if(Y(ad,65377,65439)){return ad-65377+161}var af=E(ad);
if(af===null){return B(ad)}var ac=X(af,188);var ah=(ac<31)?129:193;var ab=af%188;
var ae=(ab<63)?64:65;return[ac+ah,ab+ae]}}R.shift_jis=function(Z){return new z(Z)
};M.shift_jis=function(Z){return new S(Z)};function F(aa){var ab=aa.fatal;var Z=0;
this.handler=function(af,ag){if(ag===U&&Z!==0){Z=0;return e(ab)}if(ag===U&&Z===0){return x
}if(Z!==0){var ac=Z;var ae=null;Z=0;if(Y(ag,65,254)){ae=(ac-129)*190+(ag-65)}var ad=(ae===null)?null:C(ae,G("euc-kr"));
if(ae===null&&Y(ag,0,127)){af.prepend(ag)}if(ad===null){return e(ab)}return ad}if(Y(ag,0,127)){return ag
}if(Y(ag,129,254)){Z=ag;return null}return e(ab)}}function q(Z){var aa=Z.fatal;this.handler=function(af,ad){if(ad===U){return x
}if(Y(ad,0,127)){return ad}var ae=r(ad,G("euc-kr"));if(ae===null){return B(ad)}var ac=X(ae,190)+129;
var ab=(ae%190)+65;return[ac,ab]}}R["euc-kr"]=function(Z){return new q(Z)};M["euc-kr"]=function(Z){return new F(Z)
};function K(ab,ac){var aa=ab>>8;var Z=ab&255;if(ac){return[aa,Z]}return[Z,aa]}function l(ad,aa){var ac=aa.fatal;
var ab=null,Z=null;this.handler=function(ag,ah){if(ah===U&&(ab!==null||Z!==null)){return e(ac)
}if(ah===U&&ab===null&&Z===null){return x}if(ab===null){ab=ah;return null}var ae;
if(ad){ae=(ab<<8)+ah}else{ae=(ah<<8)+ab}ab=null;if(Z!==null){var af=Z;Z=null;if(Y(ae,56320,57343)){return 65536+(af-55296)*1024+(ae-56320)
}ag.prepend(K(ae,ad));return e(ac)}if(Y(ae,55296,56319)){Z=ae;return null}if(Y(ae,56320,57343)){return e(ac)
}return ae}}function O(ab,Z){var aa=Z.fatal;this.handler=function(af,ae){if(ae===U){return x
}if(Y(ae,0,65535)){return K(ae,ab)}var ad=K(((ae-65536)>>10)+55296,ab);var ac=K(((ae-65536)&1023)+56320,ab);
return ad.concat(ac)}}R["utf-16be"]=function(Z){return new O(true,Z)};M["utf-16be"]=function(Z){return new l(true,Z)
};R["utf-16le"]=function(Z){return new O(false,Z)};M["utf-16le"]=function(Z){return new l(false,Z)
};function u(Z){var aa=Z.fatal;this.handler=function(ab,ac){if(ac===U){return x}if(Y(ac,0,127)){return ac
}return 63360+ac-128}}function a(Z){var aa=Z.fatal;this.handler=function(ac,ab){if(ab===U){return x
}if(Y(ab,0,127)){return ab}if(Y(ab,63360,63487)){return ab-63360+128}return B(ab)
}}R["x-user-defined"]=function(Z){return new a(Z)};M["x-user-defined"]=function(Z){return new u(Z)
};if(!("TextEncoder" in c)){c.TextEncoder=D}if(!("TextDecoder" in c)){c.TextDecoder=W
}}(this));