/*! jQuery v1.8.2 jquery.com | jquery.org/license */
(function(a,b){function G(a){var b=F[a]={};
return p.each(a.split(s),function(a,c){b[c]=!0}),b}function J(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(I,"-$1").toLowerCase();
d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:+d+""===d?+d:H.test(d)?p.parseJSON(d):d
}catch(f){}p.data(a,c,d)}else{d=b}}return d}function K(a){var b;for(b in a){if(b==="data"&&p.isEmptyObject(a[b])){continue
}if(b!=="toJSON"){return !1}}return !0}function ba(){return !1}function bb(){return !0
}function bh(a){return !a||!a.parentNode||a.parentNode.nodeType===11}function bi(a,b){do{a=a[b]
}while(a&&a.nodeType!==1);return a}function bj(a,b,c){b=b||0;if(p.isFunction(b)){return p.grep(a,function(a,d){var e=!!b.call(a,d,a);
return e===c})}if(b.nodeType){return p.grep(a,function(a,d){return a===b===c})}if(typeof b=="string"){var d=p.grep(a,function(a){return a.nodeType===1
});if(be.test(b)){return p.filter(b,d,!c)}b=p.filter(b,d)}return p.grep(a,function(a,d){return p.inArray(a,b)>=0===c
})}function bk(a){var b=bl.split("|"),c=a.createDocumentFragment();if(c.createElement){while(b.length){c.createElement(b.pop())
}}return c}function bC(a,b){return a.getElementsByTagName(b)[0]||a.appendChild(a.ownerDocument.createElement(b))
}function bD(a,b){if(b.nodeType!==1||!p.hasData(a)){return}var c,d,e,f=p._data(a),g=p._data(b,f),h=f.events;
if(h){delete g.handle,g.events={};for(c in h){for(d=0,e=h[c].length;d<e;d++){p.event.add(b,c,h[c][d])
}}}g.data&&(g.data=p.extend({},g.data))}function bE(a,b){var c;if(b.nodeType!==1){return
}b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase(),c==="object"?(b.parentNode&&(b.outerHTML=a.outerHTML),p.support.html5Clone&&a.innerHTML&&!p.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):c==="input"&&bv.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text),b.removeAttribute(p.expando)
}function bF(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]
}function bG(a){bv.test(a.type)&&(a.defaultChecked=a.checked)}function bY(a,b){if(b in a){return b
}var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=bW.length;while(e--){b=bW[e]+c;
if(b in a){return b}}return d}function bZ(a,b){return a=b||a,p.css(a,"display")==="none"||!p.contains(a.ownerDocument,a)
}function b$(a,b){var c,d,e=[],f=0,g=a.length;for(;f<g;f++){c=a[f];if(!c.style){continue
}e[f]=p._data(c,"olddisplay"),b?(!e[f]&&c.style.display==="none"&&(c.style.display=""),c.style.display===""&&bZ(c)&&(e[f]=p._data(c,"olddisplay",cc(c.nodeName)))):(d=bH(c,"display"),!e[f]&&d!=="none"&&p._data(c,"olddisplay",d))
}for(f=0;f<g;f++){c=a[f];if(!c.style){continue}if(!b||c.style.display==="none"||c.style.display===""){c.style.display=b?e[f]||"":"none"
}}return a}function b_(a,b,c){var d=bP.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b
}function ca(a,b,c,d){var e=c===(d?"border":"content")?4:b==="width"?1:0,f=0;for(;
e<4;e+=2){c==="margin"&&(f+=p.css(a,c+bV[e],!0)),d?(c==="content"&&(f-=parseFloat(bH(a,"padding"+bV[e]))||0),c!=="margin"&&(f-=parseFloat(bH(a,"border"+bV[e]+"Width"))||0)):(f+=parseFloat(bH(a,"padding"+bV[e]))||0,c!=="padding"&&(f+=parseFloat(bH(a,"border"+bV[e]+"Width"))||0))
}return f}function cb(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=!0,f=p.support.boxSizing&&p.css(a,"boxSizing")==="border-box";
if(d<=0||d==null){d=bH(a,b);if(d<0||d==null){d=a.style[b]}if(bQ.test(d)){return d
}e=f&&(p.support.boxSizingReliable||d===a.style[b]),d=parseFloat(d)||0}return d+ca(a,b,c||(f?"border":"content"),e)+"px"
}function cc(a){if(bS[a]){return bS[a]}var b=p("<"+a+">").appendTo(e.body),c=b.css("display");
b.remove();if(c==="none"||c===""){bI=e.body.appendChild(bI||p.extend(e.createElement("iframe"),{frameBorder:0,width:0,height:0}));
if(!bJ||!bI.createElement){bJ=(bI.contentWindow||bI.contentDocument).document,bJ.write("<!doctype html><html><body>"),bJ.close()
}b=bJ.body.appendChild(bJ.createElement(a)),c=bH(b,"display"),e.body.removeChild(bI)
}return bS[a]=c,c}function ci(a,b,c,d){var e;if(p.isArray(b)){p.each(b,function(b,e){c||ce.test(a)?d(a,e):ci(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)
})}else{if(!c&&p.type(b)==="object"){for(e in b){ci(a+"["+e+"]",b[e],c,d)}}else{d(a,b)
}}}function cz(a){return function(b,c){typeof b!="string"&&(c=b,b="*");var d,e,f,g=b.toLowerCase().split(s),h=0,i=g.length;
if(p.isFunction(c)){for(;h<i;h++){d=g[h],f=/^\+/.test(d),f&&(d=d.substr(1)||"*"),e=a[d]=a[d]||[],e[f?"unshift":"push"](c)
}}}}function cA(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h,i=a[f],j=0,k=i?i.length:0,l=a===cv;
for(;j<k&&(l||!h);j++){h=i[j](c,d,e),typeof h=="string"&&(!l||g[h]?h=b:(c.dataTypes.unshift(h),h=cA(a,c,d,e,h,g)))
}return(l||!h)&&!g["*"]&&(h=cA(a,c,d,e,"*",g)),h}function cB(a,c){var d,e,f=p.ajaxSettings.flatOptions||{};
for(d in c){c[d]!==b&&((f[d]?a:e||(e={}))[d]=c[d])}e&&p.extend(!0,a,e)}function cC(a,c,d){var e,f,g,h,i=a.contents,j=a.dataTypes,k=a.responseFields;
for(f in k){f in d&&(c[k[f]]=d[f])}while(j[0]==="*"){j.shift(),e===b&&(e=a.mimeType||c.getResponseHeader("content-type"))
}if(e){for(f in i){if(i[f]&&i[f].test(e)){j.unshift(f);break}}}if(j[0] in d){g=j[0]
}else{for(f in d){if(!j[0]||a.converters[f+" "+j[0]]){g=f;break}h||(h=f)}g=g||h}if(g){return g!==j[0]&&j.unshift(g),d[g]
}}function cD(a,b){var c,d,e,f,g=a.dataTypes.slice(),h=g[0],i={},j=0;a.dataFilter&&(b=a.dataFilter(b,a.dataType));
if(g[1]){for(c in a.converters){i[c.toLowerCase()]=a.converters[c]}}for(;e=g[++j];
){if(e!=="*"){if(h!=="*"&&h!==e){c=i[h+" "+e]||i["* "+e];if(!c){for(d in i){f=d.split(" ");
if(f[1]===e){c=i[h+" "+f[0]]||i["* "+f[0]];if(c){c===!0?c=i[d]:i[d]!==!0&&(e=f[0],g.splice(j--,0,e));
break}}}}if(c!==!0){if(c&&a["throws"]){b=c(b)}else{try{b=c(b)}catch(k){return{state:"parsererror",error:c?k:"No conversion from "+h+" to "+e}
}}}}h=e}}return{state:"success",data:b}}function cL(){try{return new a.XMLHttpRequest
}catch(b){}}function cM(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function cU(){return setTimeout(function(){cN=b
},0),cN=p.now()}function cV(a,b){p.each(b,function(b,c){var d=(cT[b]||[]).concat(cT["*"]),e=0,f=d.length;
for(;e<f;e++){if(d[e].call(a,b,c)){return}}})}function cW(a,b,c){var d,e=0,f=0,g=cS.length,h=p.Deferred().always(function(){delete i.elem
}),i=function(){var b=cN||cU(),c=Math.max(0,j.startTime+j.duration-b),d=1-(c/j.duration||0),e=0,f=j.tweens.length;
for(;e<f;e++){j.tweens[e].run(d)}return h.notifyWith(a,[j,d,c]),d<1&&f?c:(h.resolveWith(a,[j]),!1)
},j=h.promise({elem:a,props:p.extend({},b),opts:p.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:cN||cU(),duration:c.duration,tweens:[],createTween:function(b,c,d){var e=p.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);
return j.tweens.push(e),e},stop:function(b){var c=0,d=b?j.tweens.length:0;for(;c<d;
c++){j.tweens[c].run(1)}return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this
}}),k=j.props;cX(k,j.opts.specialEasing);for(;e<g;e++){d=cS[e].call(j,a,k,j.opts);
if(d){return d}}return cV(j,k),p.isFunction(j.opts.start)&&j.opts.start.call(a,j),p.fx.timer(p.extend(i,{anim:j,queue:j.opts.queue,elem:a})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)
}function cX(a,b){var c,d,e,f,g;for(c in a){d=p.camelCase(c),e=b[d],f=a[c],p.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=p.cssHooks[d];
if(g&&"expand" in g){f=g.expand(f),delete a[d];for(c in f){c in a||(a[c]=f[c],b[c]=e)
}}else{b[d]=e}}}function cY(a,b,c){var d,e,f,g,h,i,j,k,l=this,m=a.style,n={},o=[],q=a.nodeType&&bZ(a);
c.queue||(j=p._queueHooks(a,"fx"),j.unqueued==null&&(j.unqueued=0,k=j.empty.fire,j.empty.fire=function(){j.unqueued||k()
}),j.unqueued++,l.always(function(){l.always(function(){j.unqueued--,p.queue(a,"fx").length||j.empty.fire()
})})),a.nodeType===1&&("height" in b||"width" in b)&&(c.overflow=[m.overflow,m.overflowX,m.overflowY],p.css(a,"display")==="inline"&&p.css(a,"float")==="none"&&(!p.support.inlineBlockNeedsLayout||cc(a.nodeName)==="inline"?m.display="inline-block":m.zoom=1)),c.overflow&&(m.overflow="hidden",p.support.shrinkWrapBlocks||l.done(function(){m.overflow=c.overflow[0],m.overflowX=c.overflow[1],m.overflowY=c.overflow[2]
}));for(d in b){f=b[d];if(cP.exec(f)){delete b[d];if(f===(q?"hide":"show")){continue
}o.push(d)}}g=o.length;if(g){h=p._data(a,"fxshow")||p._data(a,"fxshow",{}),q?p(a).show():l.done(function(){p(a).hide()
}),l.done(function(){var b;p.removeData(a,"fxshow",!0);for(b in n){p.style(a,b,n[b])
}});for(d=0;d<g;d++){e=o[d],i=l.createTween(e,q?h[e]:0),n[e]=h[e]||p.style(a,e),e in h||(h[e]=i.start,q&&(i.end=i.start,i.start=e==="width"||e==="height"?1:0))
}}}function cZ(a,b,c,d,e){return new cZ.prototype.init(a,b,c,d,e)}function c$(a,b){var c,d={height:a},e=0;
b=b?1:0;for(;e<4;e+=2-b){c=bV[e],d["margin"+c]=d["padding"+c]=a}return b&&(d.opacity=d.width=a),d
}function da(a){return p.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1
}var c,d,e=a.document,f=a.location,g=a.navigator,h=a.jQuery,i=a.$,j=Array.prototype.push,k=Array.prototype.slice,l=Array.prototype.indexOf,m=Object.prototype.toString,n=Object.prototype.hasOwnProperty,o=String.prototype.trim,p=function(a,b){return new p.fn.init(a,b,c)
},q=/[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,r=/\S/,s=/\s+/,t=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,u=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^[\],:{}\s]*$/,x=/(?:^|:|,)(?:\s*\[)+/g,y=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,z=/"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,A=/^-ms-/,B=/-([\da-z])/gi,C=function(a,b){return(b+"").toUpperCase()
},D=function(){e.addEventListener?(e.removeEventListener("DOMContentLoaded",D,!1),p.ready()):e.readyState==="complete"&&(e.detachEvent("onreadystatechange",D),p.ready())
},E={};p.fn=p.prototype={constructor:p,init:function(a,c,d){var f,g,h,i;if(!a){return this
}if(a.nodeType){return this.context=this[0]=a,this.length=1,this}if(typeof a=="string"){a.charAt(0)==="<"&&a.charAt(a.length-1)===">"&&a.length>=3?f=[null,a,null]:f=u.exec(a);
if(f&&(f[1]||!c)){if(f[1]){return c=c instanceof p?c[0]:c,i=c&&c.nodeType?c.ownerDocument||c:e,a=p.parseHTML(f[1],i,!0),v.test(f[1])&&p.isPlainObject(c)&&this.attr.call(a,c,!0),p.merge(this,a)
}g=e.getElementById(f[2]);if(g&&g.parentNode){if(g.id!==f[2]){return d.find(a)}this.length=1,this[0]=g
}return this.context=e,this.selector=a,this}return !c||c.jquery?(c||d).find(a):this.constructor(c).find(a)
}return p.isFunction(a)?d.ready(a):(a.selector!==b&&(this.selector=a.selector,this.context=a.context),p.makeArray(a,this))
},selector:"",jquery:"1.8.2",length:0,size:function(){return this.length},toArray:function(){return k.call(this)
},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=p.merge(this.constructor(),a);
return d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")"),d
},each:function(a,b){return p.each(this,a,b)},ready:function(a){return p.ready.promise().done(a),this
},eq:function(a){return a=+a,a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)
},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(k.apply(this,arguments),"slice",k.call(arguments).join(","))
},map:function(a){return this.pushStack(p.map(this,function(b,c){return a.call(b,c,b)
}))},end:function(){return this.prevObject||this.constructor(null)},push:j,sort:[].sort,splice:[].splice},p.fn.init.prototype=p.fn,p.extend=p.fn.extend=function(){var a,c,d,e,f,g,h=arguments[0]||{},i=1,j=arguments.length,k=!1;
typeof h=="boolean"&&(k=h,h=arguments[1]||{},i=2),typeof h!="object"&&!p.isFunction(h)&&(h={}),j===i&&(h=this,--i);
for(;i<j;i++){if((a=arguments[i])!=null){for(c in a){d=h[c],e=a[c];if(h===e){continue
}k&&e&&(p.isPlainObject(e)||(f=p.isArray(e)))?(f?(f=!1,g=d&&p.isArray(d)?d:[]):g=d&&p.isPlainObject(d)?d:{},h[c]=p.extend(k,g,e)):e!==b&&(h[c]=e)
}}}return h},p.extend({noConflict:function(b){return a.$===p&&(a.$=i),b&&a.jQuery===p&&(a.jQuery=h),p
},isReady:!1,readyWait:1,holdReady:function(a){a?p.readyWait++:p.ready(!0)},ready:function(a){if(a===!0?--p.readyWait:p.isReady){return
}if(!e.body){return setTimeout(p.ready,1)}p.isReady=!0;if(a!==!0&&--p.readyWait>0){return
}d.resolveWith(e,[p]),p.fn.trigger&&p(e).trigger("ready").off("ready")},isFunction:function(a){return p.type(a)==="function"
},isArray:Array.isArray||function(a){return p.type(a)==="array"},isWindow:function(a){return a!=null&&a==a.window
},isNumeric:function(a){return !isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):E[m.call(a)]||"object"
},isPlainObject:function(a){if(!a||p.type(a)!=="object"||a.nodeType||p.isWindow(a)){return !1
}try{if(a.constructor&&!n.call(a,"constructor")&&!n.call(a.constructor.prototype,"isPrototypeOf")){return !1
}}catch(c){return !1}var d;for(d in a){}return d===b||n.call(a,d)},isEmptyObject:function(a){var b;
for(b in a){return !1}return !0},error:function(a){throw new Error(a)},parseHTML:function(a,b,c){var d;
return !a||typeof a!="string"?null:(typeof b=="boolean"&&(c=b,b=0),b=b||e,(d=v.exec(a))?[b.createElement(d[1])]:(d=p.buildFragment([a],b,c?null:[]),p.merge([],(d.cacheable?p.clone(d.fragment):d.fragment).childNodes)))
},parseJSON:function(b){if(!b||typeof b!="string"){return null}b=p.trim(b);if(a.JSON&&a.JSON.parse){return a.JSON.parse(b)
}if(w.test(b.replace(y,"@").replace(z,"]").replace(x,""))){return(new Function("return "+b))()
}p.error("Invalid JSON: "+b)},parseXML:function(c){var d,e;if(!c||typeof c!="string"){return null
}try{a.DOMParser?(e=new DOMParser,d=e.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))
}catch(f){d=b}return(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&p.error("Invalid XML: "+c),d
},noop:function(){},globalEval:function(b){b&&r.test(b)&&(a.execScript||function(b){a.eval.call(a,b)
})(b)},camelCase:function(a){return a.replace(A,"ms-").replace(B,C)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()
},each:function(a,c,d){var e,f=0,g=a.length,h=g===b||p.isFunction(a);if(d){if(h){for(e in a){if(c.apply(a[e],d)===!1){break
}}}else{for(;f<g;){if(c.apply(a[f++],d)===!1){break}}}}else{if(h){for(e in a){if(c.call(a[e],e,a[e])===!1){break
}}}else{for(;f<g;){if(c.call(a[f],f,a[f++])===!1){break}}}}return a},trim:o&&!o.call(" ")?function(a){return a==null?"":o.call(a)
}:function(a){return a==null?"":(a+"").replace(t,"")},makeArray:function(a,b){var c,d=b||[];
return a!=null&&(c=p.type(a),a.length==null||c==="string"||c==="function"||c==="regexp"||p.isWindow(a)?j.call(d,a):p.merge(d,a)),d
},inArray:function(a,b,c){var d;if(b){if(l){return l.call(b,a,c)}d=b.length,c=c?c<0?Math.max(0,d+c):c:0;
for(;c<d;c++){if(c in b&&b[c]===a){return c}}}return -1},merge:function(a,c){var d=c.length,e=a.length,f=0;
if(typeof d=="number"){for(;f<d;f++){a[e++]=c[f]}}else{while(c[f]!==b){a[e++]=c[f++]
}}return a.length=e,a},grep:function(a,b,c){var d,e=[],f=0,g=a.length;c=!!c;for(;
f<g;f++){d=!!b(a[f],f),c!==d&&e.push(a[f])}return e},map:function(a,c,d){var e,f,g=[],h=0,i=a.length,j=a instanceof p||i!==b&&typeof i=="number"&&(i>0&&a[0]&&a[i-1]||i===0||p.isArray(a));
if(j){for(;h<i;h++){e=c(a[h],h,d),e!=null&&(g[g.length]=e)}}else{for(f in a){e=c(a[f],f,d),e!=null&&(g[g.length]=e)
}}return g.concat.apply([],g)},guid:1,proxy:function(a,c){var d,e,f;return typeof c=="string"&&(d=a[c],c=a,a=d),p.isFunction(a)?(e=k.call(arguments,2),f=function(){return a.apply(c,e.concat(k.call(arguments)))
},f.guid=a.guid=a.guid||p.guid++,f):b},access:function(a,c,d,e,f,g,h){var i,j=d==null,k=0,l=a.length;
if(d&&typeof d=="object"){for(k in d){p.access(a,c,k,d[k],1,g,e)}f=1}else{if(e!==b){i=h===b&&p.isFunction(e),j&&(i?(i=c,c=function(a,b,c){return i.call(p(a),c)
}):(c.call(a,e),c=null));if(c){for(;k<l;k++){c(a[k],d,i?e.call(a[k],k,c(a[k],d)):e,h)
}}f=1}}return f?a:j?c.call(a):l?c(a[0],d):g},now:function(){return(new Date).getTime()
}}),p.ready.promise=function(b){if(!d){d=p.Deferred();if(e.readyState==="complete"){setTimeout(p.ready,1)
}else{if(e.addEventListener){e.addEventListener("DOMContentLoaded",D,!1),a.addEventListener("load",p.ready,!1)
}else{e.attachEvent("onreadystatechange",D),a.attachEvent("onload",p.ready);var c=!1;
try{c=a.frameElement==null&&e.documentElement}catch(f){}c&&c.doScroll&&function g(){if(!p.isReady){try{c.doScroll("left")
}catch(a){return setTimeout(g,50)}p.ready()}}()}}}return d.promise(b)},p.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){E["[object "+b+"]"]=b.toLowerCase()
}),c=p(e);var F={};p.Callbacks=function(a){a=typeof a=="string"?F[a]||G(a):p.extend({},a);
var c,d,e,f,g,h,i=[],j=!a.once&&[],k=function(b){c=a.memory&&b,d=!0,h=f||0,f=0,g=i.length,e=!0;
for(;i&&h<g;h++){if(i[h].apply(b[0],b[1])===!1&&a.stopOnFalse){c=!1;break}}e=!1,i&&(j?j.length&&k(j.shift()):c?i=[]:l.disable())
},l={add:function(){if(i){var b=i.length;(function d(b){p.each(b,function(b,c){var e=p.type(c);
e==="function"&&(!a.unique||!l.has(c))?i.push(c):c&&c.length&&e!=="string"&&d(c)})
})(arguments),e?g=i.length:c&&(f=b,k(c))}return this},remove:function(){return i&&p.each(arguments,function(a,b){var c;
while((c=p.inArray(b,i,c))>-1){i.splice(c,1),e&&(c<=g&&g--,c<=h&&h--)}}),this},has:function(a){return p.inArray(a,i)>-1
},empty:function(){return i=[],this},disable:function(){return i=j=c=b,this},disabled:function(){return !i
},lock:function(){return j=b,c||l.disable(),this},locked:function(){return !j},fireWith:function(a,b){return b=b||[],b=[a,b.slice?b.slice():b],i&&(!d||j)&&(e?j.push(b):k(b)),this
},fire:function(){return l.fireWith(this,arguments),this},fired:function(){return !!d
}};return l},p.extend({Deferred:function(a){var b=[["resolve","done",p.Callbacks("once memory"),"resolved"],["reject","fail",p.Callbacks("once memory"),"rejected"],["notify","progress",p.Callbacks("memory")]],c="pending",d={state:function(){return c
},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;
return p.Deferred(function(c){p.each(b,function(b,d){var f=d[0],g=a[b];e[d[1]](p.isFunction(g)?function(){var a=g.apply(this,arguments);
a&&p.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f+"With"](this===e?c:this,[a])
}:c[f])}),a=null}).promise()},promise:function(a){return a!=null?p.extend(a,d):d}},e={};
return d.pipe=d.then,p.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h
},b[a^1][2].disable,b[2][2].lock),e[f[0]]=g.fire,e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e
},when:function(a){var b=0,c=k.call(arguments),d=c.length,e=d!==1||a&&p.isFunction(a.promise)?d:0,f=e===1?a:p.Deferred(),g=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?k.call(arguments):d,c===h?f.notifyWith(b,c):--e||f.resolveWith(b,c)
}},h,i,j;if(d>1){h=new Array(d),i=new Array(d),j=new Array(d);for(;b<d;b++){c[b]&&p.isFunction(c[b].promise)?c[b].promise().done(g(b,j,c)).fail(f.reject).progress(g(b,i,h)):--e
}}return e||f.resolveWith(j,c),f.promise()}}),p.support=function(){var b,c,d,f,g,h,i,j,k,l,m,n=e.createElement("div");
n.setAttribute("className","t"),n.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",c=n.getElementsByTagName("*"),d=n.getElementsByTagName("a")[0],d.style.cssText="top:1px;float:left;opacity:.5";
if(!c||!c.length){return{}}f=e.createElement("select"),g=f.appendChild(e.createElement("option")),h=n.getElementsByTagName("input")[0],b={leadingWhitespace:n.firstChild.nodeType===3,tbody:!n.getElementsByTagName("tbody").length,htmlSerialize:!!n.getElementsByTagName("link").length,style:/top/.test(d.getAttribute("style")),hrefNormalized:d.getAttribute("href")==="/a",opacity:/^0.5/.test(d.style.opacity),cssFloat:!!d.style.cssFloat,checkOn:h.value==="on",optSelected:g.selected,getSetAttribute:n.className!=="t",enctype:!!e.createElement("form").enctype,html5Clone:e.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",boxModel:e.compatMode==="CSS1Compat",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},h.checked=!0,b.noCloneChecked=h.cloneNode(!0).checked,f.disabled=!0,b.optDisabled=!g.disabled;
try{delete n.test}catch(o){b.deleteExpando=!1}!n.addEventListener&&n.attachEvent&&n.fireEvent&&(n.attachEvent("onclick",m=function(){b.noCloneEvent=!1
}),n.cloneNode(!0).fireEvent("onclick"),n.detachEvent("onclick",m)),h=e.createElement("input"),h.value="t",h.setAttribute("type","radio"),b.radioValue=h.value==="t",h.setAttribute("checked","checked"),h.setAttribute("name","t"),n.appendChild(h),i=e.createDocumentFragment(),i.appendChild(n.lastChild),b.checkClone=i.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=h.checked,i.removeChild(h),i.appendChild(n);
if(n.attachEvent){for(k in {submit:!0,change:!0,focusin:!0}){j="on"+k,l=j in n,l||(n.setAttribute(j,"return;"),l=typeof n[j]=="function"),b[k+"Bubbles"]=l
}}return p(function(){var c,d,f,g,h="padding:0;margin:0;border:0;display:block;overflow:hidden;",i=e.getElementsByTagName("body")[0];
if(!i){return}c=e.createElement("div"),c.style.cssText="visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px",i.insertBefore(c,i.firstChild),d=e.createElement("div"),c.appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",f=d.getElementsByTagName("td"),f[0].style.cssText="padding:0;margin:0;border:0;display:none",l=f[0].offsetHeight===0,f[0].style.display="",f[1].style.display="none",b.reliableHiddenOffsets=l&&f[0].offsetHeight===0,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",b.boxSizing=d.offsetWidth===4,b.doesNotIncludeMarginInBodyOffset=i.offsetTop!==1,a.getComputedStyle&&(b.pixelPosition=(a.getComputedStyle(d,null)||{}).top!=="1%",b.boxSizingReliable=(a.getComputedStyle(d,null)||{width:"4px"}).width==="4px",g=e.createElement("div"),g.style.cssText=d.style.cssText=h,g.style.marginRight=g.style.width="0",d.style.width="1px",d.appendChild(g),b.reliableMarginRight=!parseFloat((a.getComputedStyle(g,null)||{}).marginRight)),typeof d.style.zoom!="undefined"&&(d.innerHTML="",d.style.cssText=h+"width:1px;padding:1px;display:inline;zoom:1",b.inlineBlockNeedsLayout=d.offsetWidth===3,d.style.display="block",d.style.overflow="visible",d.innerHTML="<div></div>",d.firstChild.style.width="5px",b.shrinkWrapBlocks=d.offsetWidth!==3,c.style.zoom=1),i.removeChild(c),c=d=f=g=null
}),i.removeChild(n),c=d=f=g=h=i=n=null,b}();var H=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,I=/([A-Z])/g;
p.extend({cache:{},deletedIds:[],uuid:0,expando:"jQuery"+(p.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){return a=a.nodeType?p.cache[a[p.expando]]:a[p.expando],!!a&&!K(a)
},data:function(a,c,d,e){if(!p.acceptData(a)){return}var f,g,h=p.expando,i=typeof c=="string",j=a.nodeType,k=j?p.cache:a,l=j?a[h]:a[h]&&h;
if((!l||!k[l]||!e&&!k[l].data)&&i&&d===b){return}l||(j?a[h]=l=p.deletedIds.pop()||p.guid++:l=h),k[l]||(k[l]={},j||(k[l].toJSON=p.noop));
if(typeof c=="object"||typeof c=="function"){e?k[l]=p.extend(k[l],c):k[l].data=p.extend(k[l].data,c)
}return f=k[l],e||(f.data||(f.data={}),f=f.data),d!==b&&(f[p.camelCase(c)]=d),i?(g=f[c],g==null&&(g=f[p.camelCase(c)])):g=f,g
},removeData:function(a,b,c){if(!p.acceptData(a)){return}var d,e,f,g=a.nodeType,h=g?p.cache:a,i=g?a[p.expando]:p.expando;
if(!h[i]){return}if(b){d=c?h[i]:h[i].data;if(d){p.isArray(b)||(b in d?b=[b]:(b=p.camelCase(b),b in d?b=[b]:b=b.split(" ")));
for(e=0,f=b.length;e<f;e++){delete d[b[e]]}if(!(c?K:p.isEmptyObject)(d)){return}}}if(!c){delete h[i].data;
if(!K(h[i])){return}}g?p.cleanData([a],!0):p.support.deleteExpando||h!=h.window?delete h[i]:h[i]=null
},_data:function(a,b,c){return p.data(a,b,c,!0)},acceptData:function(a){var b=a.nodeName&&p.noData[a.nodeName.toLowerCase()];
return !b||b!==!0&&a.getAttribute("classid")===b}}),p.fn.extend({data:function(a,c){var d,e,f,g,h,i=this[0],j=0,k=null;
if(a===b){if(this.length){k=p.data(i);if(i.nodeType===1&&!p._data(i,"parsedAttrs")){f=i.attributes;
for(h=f.length;j<h;j++){g=f[j].name,g.indexOf("data-")||(g=p.camelCase(g.substring(5)),J(i,g,k[g]))
}p._data(i,"parsedAttrs",!0)}}return k}return typeof a=="object"?this.each(function(){p.data(this,a)
}):(d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",e=d[1]+"!",p.access(this,function(c){if(c===b){return k=this.triggerHandler("getData"+e,[d[0]]),k===b&&i&&(k=p.data(i,a),k=J(i,a,k)),k===b&&d[1]?this.data(d[0]):k
}d[1]=c,this.each(function(){var b=p(this);b.triggerHandler("setData"+e,d),p.data(this,a,c),b.triggerHandler("changeData"+e,d)
})},null,c,arguments.length>1,null,!1))},removeData:function(a){return this.each(function(){p.removeData(this,a)
})}}),p.extend({queue:function(a,b,c){var d;if(a){return b=(b||"fx")+"queue",d=p._data(a,b),c&&(!d||p.isArray(c)?d=p._data(a,b,p.makeArray(c)):d.push(c)),d||[]
}},dequeue:function(a,b){b=b||"fx";var c=p.queue(a,b),d=c.length,e=c.shift(),f=p._queueHooks(a,b),g=function(){p.dequeue(a,b)
};e==="inprogress"&&(e=c.shift(),d--),e&&(b==="fx"&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()
},_queueHooks:function(a,b){var c=b+"queueHooks";return p._data(a,c)||p._data(a,c,{empty:p.Callbacks("once memory").add(function(){p.removeData(a,b+"queue",!0),p.removeData(a,c,!0)
})})}}),p.fn.extend({queue:function(a,c){var d=2;return typeof a!="string"&&(c=a,a="fx",d--),arguments.length<d?p.queue(this[0],a):c===b?this:this.each(function(){var b=p.queue(this,a,c);
p._queueHooks(this,a),a==="fx"&&b[0]!=="inprogress"&&p.dequeue(this,a)})},dequeue:function(a){return this.each(function(){p.dequeue(this,a)
})},delay:function(a,b){return a=p.fx?p.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);
c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])
},promise:function(a,c){var d,e=1,f=p.Deferred(),g=this,h=this.length,i=function(){--e||f.resolveWith(g,[g])
};typeof a!="string"&&(c=a,a=b),a=a||"fx";while(h--){d=p._data(g[h],a+"queueHooks"),d&&d.empty&&(e++,d.empty.add(i))
}return i(),f.promise(c)}});var L,M,N,O=/[\t\r\n]/g,P=/\r/g,Q=/^(?:button|input)$/i,R=/^(?:button|input|object|select|textarea)$/i,S=/^a(?:rea|)$/i,T=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,U=p.support.getSetAttribute;
p.fn.extend({attr:function(a,b){return p.access(this,p.attr,a,b,arguments.length>1)
},removeAttr:function(a){return this.each(function(){p.removeAttr(this,a)})},prop:function(a,b){return p.access(this,p.prop,a,b,arguments.length>1)
},removeProp:function(a){return a=p.propFix[a]||a,this.each(function(){try{this[a]=b,delete this[a]
}catch(c){}})},addClass:function(a){var b,c,d,e,f,g,h;if(p.isFunction(a)){return this.each(function(b){p(this).addClass(a.call(this,b,this.className))
})}if(a&&typeof a=="string"){b=a.split(s);for(c=0,d=this.length;c<d;c++){e=this[c];
if(e.nodeType===1){if(!e.className&&b.length===1){e.className=a}else{f=" "+e.className+" ";
for(g=0,h=b.length;g<h;g++){f.indexOf(" "+b[g]+" ")<0&&(f+=b[g]+" ")}e.className=p.trim(f)
}}}}return this},removeClass:function(a){var c,d,e,f,g,h,i;if(p.isFunction(a)){return this.each(function(b){p(this).removeClass(a.call(this,b,this.className))
})}if(a&&typeof a=="string"||a===b){c=(a||"").split(s);for(h=0,i=this.length;h<i;
h++){e=this[h];if(e.nodeType===1&&e.className){d=(" "+e.className+" ").replace(O," ");
for(f=0,g=c.length;f<g;f++){while(d.indexOf(" "+c[f]+" ")>=0){d=d.replace(" "+c[f]+" "," ")
}}e.className=a?p.trim(d):""}}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";
return p.isFunction(a)?this.each(function(c){p(this).toggleClass(a.call(this,c,this.className,b),b)
}):this.each(function(){if(c==="string"){var e,f=0,g=p(this),h=b,i=a.split(s);while(e=i[f++]){h=d?h:!g.hasClass(e),g[h?"addClass":"removeClass"](e)
}}else{if(c==="undefined"||c==="boolean"){this.className&&p._data(this,"__className__",this.className),this.className=this.className||a===!1?"":p._data(this,"__className__")||""
}}})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++){if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(O," ").indexOf(b)>=0){return !0
}}return !1},val:function(a){var c,d,e,f=this[0];if(!arguments.length){if(f){return c=p.valHooks[f.type]||p.valHooks[f.nodeName.toLowerCase()],c&&"get" in c&&(d=c.get(f,"value"))!==b?d:(d=f.value,typeof d=="string"?d.replace(P,""):d==null?"":d)
}return}return e=p.isFunction(a),this.each(function(d){var f,g=p(this);if(this.nodeType!==1){return
}e?f=a.call(this,d,g.val()):f=a,f==null?f="":typeof f=="number"?f+="":p.isArray(f)&&(f=p.map(f,function(a){return a==null?"":a+""
})),c=p.valHooks[this.type]||p.valHooks[this.nodeName.toLowerCase()];if(!c||!("set" in c)||c.set(this,f,"value")===b){this.value=f
}})}}),p.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return !b||b.specified?a.value:a.text
}},select:{get:function(a){var b,c,d,e,f=a.selectedIndex,g=[],h=a.options,i=a.type==="select-one";
if(f<0){return null}c=i?f:0,d=i?f+1:h.length;for(;c<d;c++){e=h[c];if(e.selected&&(p.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!p.nodeName(e.parentNode,"optgroup"))){b=p(e).val();
if(i){return b}g.push(b)}}return i&&!g.length&&h.length?p(h[f]).val():g},set:function(a,b){var c=p.makeArray(b);
return p(a).find("option").each(function(){this.selected=p.inArray(p(this).val(),c)>=0
}),c.length||(a.selectedIndex=-1),c}}},attrFn:{},attr:function(a,c,d,e){var f,g,h,i=a.nodeType;
if(!a||i===3||i===8||i===2){return}if(e&&p.isFunction(p.fn[c])){return p(a)[c](d)
}if(typeof a.getAttribute=="undefined"){return p.prop(a,c,d)}h=i!==1||!p.isXMLDoc(a),h&&(c=c.toLowerCase(),g=p.attrHooks[c]||(T.test(c)?M:L));
if(d!==b){if(d===null){p.removeAttr(a,c);return}return g&&"set" in g&&h&&(f=g.set(a,d,c))!==b?f:(a.setAttribute(c,d+""),d)
}return g&&"get" in g&&h&&(f=g.get(a,c))!==null?f:(f=a.getAttribute(c),f===null?b:f)
},removeAttr:function(a,b){var c,d,e,f,g=0;if(b&&a.nodeType===1){d=b.split(s);for(;
g<d.length;g++){e=d[g],e&&(c=p.propFix[e]||e,f=T.test(e),f||p.attr(a,e,""),a.removeAttribute(U?e:c),f&&c in a&&(a[c]=!1))
}}},attrHooks:{type:{set:function(a,b){if(Q.test(a.nodeName)&&a.parentNode){p.error("type property can't be changed")
}else{if(!p.support.radioValue&&b==="radio"&&p.nodeName(a,"input")){var c=a.value;
return a.setAttribute("type",b),c&&(a.value=c),b}}}},value:{get:function(a,b){return L&&p.nodeName(a,"button")?L.get(a,b):b in a?a.value:null
},set:function(a,b,c){if(L&&p.nodeName(a,"button")){return L.set(a,b,c)}a.value=b
}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,f,g,h=a.nodeType;
if(!a||h===3||h===8||h===2){return}return g=h!==1||!p.isXMLDoc(a),g&&(c=p.propFix[c]||c,f=p.propHooks[c]),d!==b?f&&"set" in f&&(e=f.set(a,d,c))!==b?e:a[c]=d:f&&"get" in f&&(e=f.get(a,c))!==null?e:a[c]
},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):R.test(a.nodeName)||S.test(a.nodeName)&&a.href?0:b
}}}}),M={get:function(a,c){var d,e=p.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b
},set:function(a,b,c){var d;return b===!1?p.removeAttr(a,c):(d=p.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase())),c
}},U||(N={name:!0,id:!0,coords:!0},L=p.valHooks.button={get:function(a,c){var d;return d=a.getAttributeNode(c),d&&(N[c]?d.value!=="":d.specified)?d.value:b
},set:function(a,b,c){var d=a.getAttributeNode(c);return d||(d=e.createAttribute(c),a.setAttributeNode(d)),d.value=b+""
}},p.each(["width","height"],function(a,b){p.attrHooks[b]=p.extend(p.attrHooks[b],{set:function(a,c){if(c===""){return a.setAttribute(b,"auto"),c
}}})}),p.attrHooks.contenteditable={get:L.get,set:function(a,b,c){b===""&&(b="false"),L.set(a,b,c)
}}),p.support.hrefNormalized||p.each(["href","src","width","height"],function(a,c){p.attrHooks[c]=p.extend(p.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);
return d===null?b:d}})}),p.support.style||(p.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b
},set:function(a,b){return a.style.cssText=b+""}}),p.support.optSelected||(p.propHooks.selected=p.extend(p.propHooks.selected,{get:function(a){var b=a.parentNode;
return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}})),p.support.enctype||(p.propFix.enctype="encoding"),p.support.checkOn||p.each(["radio","checkbox"],function(){p.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value
}}}),p.each(["radio","checkbox"],function(){p.valHooks[this]=p.extend(p.valHooks[this],{set:function(a,b){if(p.isArray(b)){return a.checked=p.inArray(p(a).val(),b)>=0
}}})});var V=/^(?:textarea|input|select)$/i,W=/^([^\.]*|)(?:\.(.+)|)$/,X=/(?:^|\s)hover(\.\S+|)\b/,Y=/^key/,Z=/^(?:mouse|contextmenu)|click/,$=/^(?:focusinfocus|focusoutblur)$/,_=function(a){return p.event.special.hover?a:a.replace(X,"mouseenter$1 mouseleave$1")
};p.event={add:function(a,c,d,e,f){var g,h,i,j,k,l,m,n,o,q,r;if(a.nodeType===3||a.nodeType===8||!c||!d||!(g=p._data(a))){return
}d.handler&&(o=d,d=o.handler,f=o.selector),d.guid||(d.guid=p.guid++),i=g.events,i||(g.events=i={}),h=g.handle,h||(g.handle=h=function(a){return typeof p!="undefined"&&(!a||p.event.triggered!==a.type)?p.event.dispatch.apply(h.elem,arguments):b
},h.elem=a),c=p.trim(_(c)).split(" ");for(j=0;j<c.length;j++){k=W.exec(c[j])||[],l=k[1],m=(k[2]||"").split(".").sort(),r=p.event.special[l]||{},l=(f?r.delegateType:r.bindType)||l,r=p.event.special[l]||{},n=p.extend({type:l,origType:k[1],data:e,handler:d,guid:d.guid,selector:f,needsContext:f&&p.expr.match.needsContext.test(f),namespace:m.join(".")},o),q=i[l];
if(!q){q=i[l]=[],q.delegateCount=0;if(!r.setup||r.setup.call(a,e,m,h)===!1){a.addEventListener?a.addEventListener(l,h,!1):a.attachEvent&&a.attachEvent("on"+l,h)
}}r.add&&(r.add.call(a,n),n.handler.guid||(n.handler.guid=d.guid)),f?q.splice(q.delegateCount++,0,n):q.push(n),p.event.global[l]=!0
}a=null},global:{},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,q,r=p.hasData(a)&&p._data(a);
if(!r||!(m=r.events)){return}b=p.trim(_(b||"")).split(" ");for(f=0;f<b.length;f++){g=W.exec(b[f])||[],h=i=g[1],j=g[2];
if(!h){for(h in m){p.event.remove(a,h+b[f],c,d,!0)}continue}n=p.event.special[h]||{},h=(d?n.delegateType:n.bindType)||h,o=m[h]||[],k=o.length,j=j?new RegExp("(^|\\.)"+j.split(".").sort().join("\\.(?:.*\\.|)")+"(\\.|$)"):null;
for(l=0;l<o.length;l++){q=o[l],(e||i===q.origType)&&(!c||c.guid===q.guid)&&(!j||j.test(q.namespace))&&(!d||d===q.selector||d==="**"&&q.selector)&&(o.splice(l--,1),q.selector&&o.delegateCount--,n.remove&&n.remove.call(a,q))
}o.length===0&&k!==o.length&&((!n.teardown||n.teardown.call(a,j,r.handle)===!1)&&p.removeEvent(a,h,r.handle),delete m[h])
}p.isEmptyObject(m)&&(delete r.handle,p.removeData(a,"events",!0))},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,f,g){if(!f||f.nodeType!==3&&f.nodeType!==8){var h,i,j,k,l,m,n,o,q,r,s=c.type||c,t=[];
if($.test(s+p.event.triggered)){return}s.indexOf("!")>=0&&(s=s.slice(0,-1),i=!0),s.indexOf(".")>=0&&(t=s.split("."),s=t.shift(),t.sort());
if((!f||p.event.customEvent[s])&&!p.event.global[s]){return}c=typeof c=="object"?c[p.expando]?c:new p.Event(s,c):new p.Event(s),c.type=s,c.isTrigger=!0,c.exclusive=i,c.namespace=t.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+t.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,m=s.indexOf(":")<0?"on"+s:"";
if(!f){h=p.cache;for(j in h){h[j].events&&h[j].events[s]&&p.event.trigger(c,d,h[j].handle.elem,!0)
}return}c.result=b,c.target||(c.target=f),d=d!=null?p.makeArray(d):[],d.unshift(c),n=p.event.special[s]||{};
if(n.trigger&&n.trigger.apply(f,d)===!1){return}q=[[f,n.bindType||s]];if(!g&&!n.noBubble&&!p.isWindow(f)){r=n.delegateType||s,k=$.test(r+s)?f:f.parentNode;
for(l=f;k;k=k.parentNode){q.push([k,r]),l=k}l===(f.ownerDocument||e)&&q.push([l.defaultView||l.parentWindow||a,r])
}for(j=0;j<q.length&&!c.isPropagationStopped();j++){k=q[j][0],c.type=q[j][1],o=(p._data(k,"events")||{})[c.type]&&p._data(k,"handle"),o&&o.apply(k,d),o=m&&k[m],o&&p.acceptData(k)&&o.apply&&o.apply(k,d)===!1&&c.preventDefault()
}return c.type=s,!g&&!c.isDefaultPrevented()&&(!n._default||n._default.apply(f.ownerDocument,d)===!1)&&(s!=="click"||!p.nodeName(f,"a"))&&p.acceptData(f)&&m&&f[s]&&(s!=="focus"&&s!=="blur"||c.target.offsetWidth!==0)&&!p.isWindow(f)&&(l=f[m],l&&(f[m]=null),p.event.triggered=s,f[s](),p.event.triggered=b,l&&(f[m]=l)),c.result
}return},dispatch:function(c){c=p.event.fix(c||a.event);var d,e,f,g,h,i,j,l,m,n,o=(p._data(this,"events")||{})[c.type]||[],q=o.delegateCount,r=k.call(arguments),s=!c.exclusive&&!c.namespace,t=p.event.special[c.type]||{},u=[];
r[0]=c,c.delegateTarget=this;if(t.preDispatch&&t.preDispatch.call(this,c)===!1){return
}if(q&&(!c.button||c.type!=="click")){for(f=c.target;f!=this;f=f.parentNode||this){if(f.disabled!==!0||c.type!=="click"){h={},j=[];
for(d=0;d<q;d++){l=o[d],m=l.selector,h[m]===b&&(h[m]=l.needsContext?p(m,this).index(f)>=0:p.find(m,this,null,[f]).length),h[m]&&j.push(l)
}j.length&&u.push({elem:f,matches:j})}}}o.length>q&&u.push({elem:this,matches:o.slice(q)});
for(d=0;d<u.length&&!c.isPropagationStopped();d++){i=u[d],c.currentTarget=i.elem;
for(e=0;e<i.matches.length&&!c.isImmediatePropagationStopped();e++){l=i.matches[e];
if(s||!c.namespace&&!l.namespace||c.namespace_re&&c.namespace_re.test(l.namespace)){c.data=l.data,c.handleObj=l,g=((p.event.special[l.origType]||{}).handle||l.handler).apply(i.elem,r),g!==b&&(c.result=g,g===!1&&(c.preventDefault(),c.stopPropagation()))
}}}return t.postDispatch&&t.postDispatch.call(this,c),c.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode),a
}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,c){var d,f,g,h=c.button,i=c.fromElement;
return a.pageX==null&&c.clientX!=null&&(d=a.target.ownerDocument||e,f=d.documentElement,g=d.body,a.pageX=c.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=c.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?c.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0),a
}},fix:function(a){if(a[p.expando]){return a}var b,c,d=a,f=p.event.fixHooks[a.type]||{},g=f.props?this.props.concat(f.props):this.props;
a=p.Event(d);for(b=g.length;b;){c=g[--b],a[c]=d[c]}return a.target||(a.target=d.srcElement||e),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,f.filter?f.filter(a,d):a
},special:{load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){p.isWindow(this)&&(this.onbeforeunload=c)
},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=p.extend(new p.Event,c,{type:a,isSimulated:!0,originalEvent:{}});
d?p.event.trigger(e,null,b):p.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()
}},p.event.handle=p.event.dispatch,p.removeEvent=e.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)
}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]=="undefined"&&(a[d]=null),a.detachEvent(d,c))
},p.Event=function(a,b){if(this instanceof p.Event){a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?bb:ba):this.type=a,b&&p.extend(this,b),this.timeStamp=a&&a.timeStamp||p.now(),this[p.expando]=!0
}else{return new p.Event(a,b)}},p.Event.prototype={preventDefault:function(){this.isDefaultPrevented=bb;
var a=this.originalEvent;if(!a){return}a.preventDefault?a.preventDefault():a.returnValue=!1
},stopPropagation:function(){this.isPropagationStopped=bb;var a=this.originalEvent;
if(!a){return}a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=bb,this.stopPropagation()
},isDefaultPrevented:ba,isPropagationStopped:ba,isImmediatePropagationStopped:ba},p.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){p.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj,g=f.selector;
if(!e||e!==d&&!p.contains(d,e)){a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b
}return c}}}),p.support.submitBubbles||(p.event.special.submit={setup:function(){if(p.nodeName(this,"form")){return !1
}p.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=p.nodeName(c,"input")||p.nodeName(c,"button")?c.form:b;
d&&!p._data(d,"_submit_attached")&&(p.event.add(d,"submit._submit",function(a){a._submit_bubble=!0
}),p._data(d,"_submit_attached",!0))})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&p.event.simulate("submit",this.parentNode,a,!0))
},teardown:function(){if(p.nodeName(this,"form")){return !1}p.event.remove(this,"._submit")
}}),p.support.changeBubbles||(p.event.special.change={setup:function(){if(V.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio"){p.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)
}),p.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),p.event.simulate("change",this,a,!0)
})}return !1}p.event.add(this,"beforeactivate._change",function(a){var b=a.target;
V.test(b.nodeName)&&!p._data(b,"_change_attached")&&(p.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&p.event.simulate("change",this.parentNode,a,!0)
}),p._data(b,"_change_attached",!0))})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox"){return a.handleObj.handler.apply(this,arguments)
}},teardown:function(){return p.event.remove(this,"._change"),!V.test(this.nodeName)
}}),p.support.focusinBubbles||p.each({focus:"focusin",blur:"focusout"},function(a,b){var c=0,d=function(a){p.event.simulate(b,a.target,p.event.fix(a),!0)
};p.event.special[b]={setup:function(){c++===0&&e.addEventListener(a,d,!0)},teardown:function(){--c===0&&e.removeEventListener(a,d,!0)
}}}),p.fn.extend({on:function(a,c,d,e,f){var g,h;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);
for(h in a){this.on(h,c,d,a[h],f)}return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));
if(e===!1){e=ba}else{if(!e){return this}}return f===1&&(g=e,e=function(a){return p().off(a),g.apply(this,arguments)
},e.guid=g.guid||(g.guid=p.guid++)),this.each(function(){p.event.add(this,a,e,d,c)
})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){var e,f;
if(a&&a.preventDefault&&a.handleObj){return e=a.handleObj,p(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler),this
}if(typeof a=="object"){for(f in a){this.off(f,c,a[f])}return this}if(c===!1||typeof c=="function"){d=c,c=b
}return d===!1&&(d=ba),this.each(function(){p.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)
},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){return p(this.context).on(a,this.selector,b,c),this
},die:function(a,b){return p(this.context).off(a,this.selector||"**",b),this},delegate:function(a,b,c,d){return this.on(b,a,c,d)
},undelegate:function(a,b,c){return arguments.length===1?this.off(a,"**"):this.off(b,a||"**",c)
},trigger:function(a,b){return this.each(function(){p.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0]){return p.event.trigger(a,b,this[0],!0)
}},toggle:function(a){var b=arguments,c=a.guid||p.guid++,d=0,e=function(c){var e=(p._data(this,"lastToggle"+a.guid)||0)%d;
return p._data(this,"lastToggle"+a.guid,e+1),c.preventDefault(),b[e].apply(this,arguments)||!1
};e.guid=c;while(d<b.length){b[d++].guid=c}return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)
}}),p.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){p.fn[b]=function(a,c){return c==null&&(c=a,a=null),arguments.length>0?this.on(b,null,a,c):this.trigger(b)
},Y.test(b)&&(p.event.fixHooks[b]=p.event.keyHooks),Z.test(b)&&(p.event.fixHooks[b]=p.event.mouseHooks)
}),function(a,b){function bc(a,b,c,d){c=c||[],b=b||r;var e,f,i,j,k=b.nodeType;if(!a||typeof a!="string"){return c
}if(k!==1&&k!==9){return[]}i=g(b);if(!i&&!d){if(e=P.exec(a)){if(j=e[1]){if(k===9){f=b.getElementById(j);
if(!f||!f.parentNode){return c}if(f.id===j){return c.push(f),c}}else{if(b.ownerDocument&&(f=b.ownerDocument.getElementById(j))&&h(b,f)&&f.id===j){return c.push(f),c
}}}else{if(e[2]){return w.apply(c,x.call(b.getElementsByTagName(a),0)),c}if((j=e[3])&&_&&b.getElementsByClassName){return w.apply(c,x.call(b.getElementsByClassName(j),0)),c
}}}}return bp(a.replace(L,"$1"),b,c,d,i)}function bd(a){return function(b){var c=b.nodeName.toLowerCase();
return c==="input"&&b.type===a}}function be(a){return function(b){var c=b.nodeName.toLowerCase();
return(c==="input"||c==="button")&&b.type===a}}function bf(a){return z(function(b){return b=+b,z(function(c,d){var e,f=a([],c.length,b),g=f.length;
while(g--){c[e=f[g]]&&(c[e]=!(d[e]=c[e]))}})})}function bg(a,b,c){if(a===b){return c
}var d=a.nextSibling;while(d){if(d===b){return -1}d=d.nextSibling}return 1}function bh(a,b){var c,d,f,g,h,i,j,k=C[o][a];
if(k){return b?0:k.slice(0)}h=a,i=[],j=e.preFilter;while(h){if(!c||(d=M.exec(h))){d&&(h=h.slice(d[0].length)),i.push(f=[])
}c=!1;if(d=N.exec(h)){f.push(c=new q(d.shift())),h=h.slice(c.length),c.type=d[0].replace(L," ")
}for(g in e.filter){(d=W[g].exec(h))&&(!j[g]||(d=j[g](d,r,!0)))&&(f.push(c=new q(d.shift())),h=h.slice(c.length),c.type=g,c.matches=d)
}if(!c){break}}return b?h.length:h?bc.error(a):C(a,i).slice(0)}function bi(a,b,d){var e=b.dir,f=d&&b.dir==="parentNode",g=u++;
return b.first?function(b,c,d){while(b=b[e]){if(f||b.nodeType===1){return a(b,c,d)
}}}:function(b,d,h){if(!h){var i,j=t+" "+g+" ",k=j+c;while(b=b[e]){if(f||b.nodeType===1){if((i=b[o])===k){return b.sizset
}if(typeof i=="string"&&i.indexOf(j)===0){if(b.sizset){return b}}else{b[o]=k;if(a(b,d,h)){return b.sizset=!0,b
}b.sizset=!1}}}}else{while(b=b[e]){if(f||b.nodeType===1){if(a(b,d,h)){return b}}}}}
}function bj(a){return a.length>1?function(b,c,d){var e=a.length;while(e--){if(!a[e](b,c,d)){return !1
}}return !0}:a[0]}function bk(a,b,c,d,e){var f,g=[],h=0,i=a.length,j=b!=null;for(;
h<i;h++){if(f=a[h]){if(!c||c(f,d,e)){g.push(f),j&&b.push(h)}}}return g}function bl(a,b,c,d,e,f){return d&&!d[o]&&(d=bl(d)),e&&!e[o]&&(e=bl(e,f)),z(function(f,g,h,i){if(f&&e){return
}var j,k,l,m=[],n=[],o=g.length,p=f||bo(b||"*",h.nodeType?[h]:h,[],f),q=a&&(f||!b)?bk(p,m,a,h,i):p,r=c?e||(f?a:o||d)?[]:g:q;
c&&c(q,r,h,i);if(d){l=bk(r,n),d(l,[],h,i),j=l.length;while(j--){if(k=l[j]){r[n[j]]=!(q[n[j]]=k)
}}}if(f){j=a&&r.length;while(j--){if(k=r[j]){f[m[j]]=!(g[m[j]]=k)}}}else{r=bk(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):w.apply(g,r)
}})}function bm(a){var b,c,d,f=a.length,g=e.relative[a[0].type],h=g||e.relative[" "],i=g?1:0,j=bi(function(a){return a===b
},h,!0),k=bi(function(a){return y.call(b,a)>-1},h,!0),m=[function(a,c,d){return !g&&(d||c!==l)||((b=c).nodeType?j(a,c,d):k(a,c,d))
}];for(;i<f;i++){if(c=e.relative[a[i].type]){m=[bi(bj(m),c)]}else{c=e.filter[a[i].type].apply(null,a[i].matches);
if(c[o]){d=++i;for(;d<f;d++){if(e.relative[a[d].type]){break}}return bl(i>1&&bj(m),i>1&&a.slice(0,i-1).join("").replace(L,"$1"),c,i<d&&bm(a.slice(i,d)),d<f&&bm(a=a.slice(d)),d<f&&a.join(""))
}m.push(c)}}return bj(m)}function bn(a,b){var d=b.length>0,f=a.length>0,g=function(h,i,j,k,m){var n,o,p,q=[],s=0,u="0",x=h&&[],y=m!=null,z=l,A=h||f&&e.find.TAG("*",m&&i.parentNode||i),B=t+=z==null?1:Math.E;
y&&(l=i!==r&&i,c=g.el);for(;(n=A[u])!=null;u++){if(f&&n){for(o=0;p=a[o];o++){if(p(n,i,j)){k.push(n);
break}}y&&(t=B,c=++g.el)}d&&((n=!p&&n)&&s--,h&&x.push(n))}s+=u;if(d&&u!==s){for(o=0;
p=b[o];o++){p(x,q,i,j)}if(h){if(s>0){while(u--){!x[u]&&!q[u]&&(q[u]=v.call(k))}}q=bk(q)
}w.apply(k,q),y&&!h&&q.length>0&&s+b.length>1&&bc.uniqueSort(k)}return y&&(t=B,l=z),x
};return g.el=0,d?z(g):g}function bo(a,b,c,d){var e=0,f=b.length;for(;e<f;e++){bc(a,b[e],c,d)
}return c}function bp(a,b,c,d,f){var g,h,j,k,l,m=bh(a),n=m.length;if(!d&&m.length===1){h=m[0]=m[0].slice(0);
if(h.length>2&&(j=h[0]).type==="ID"&&b.nodeType===9&&!f&&e.relative[h[1].type]){b=e.find.ID(j.matches[0].replace(V,""),b,f)[0];
if(!b){return c}a=a.slice(h.shift().length)}for(g=W.POS.test(a)?-1:h.length-1;g>=0;
g--){j=h[g];if(e.relative[k=j.type]){break}if(l=e.find[k]){if(d=l(j.matches[0].replace(V,""),R.test(h[0].type)&&b.parentNode||b,f)){h.splice(g,1),a=d.length&&h.join("");
if(!a){return w.apply(c,x.call(d,0)),c}break}}}}return i(a,m)(d,b,f,c,R.test(a)),c
}function bq(){}var c,d,e,f,g,h,i,j,k,l,m=!0,n="undefined",o=("sizcache"+Math.random()).replace(".",""),q=String,r=a.document,s=r.documentElement,t=0,u=0,v=[].pop,w=[].push,x=[].slice,y=[].indexOf||function(a){var b=0,c=this.length;
for(;b<c;b++){if(this[b]===a){return b}}return -1},z=function(a,b){return a[o]=b==null||b,a
},A=function(){var a={},b=[];return z(function(c,d){return b.push(c)>e.cacheLength&&delete a[b.shift()],a[c]=d
},a)},B=A(),C=A(),D=A(),E="[\\x20\\t\\r\\n\\f]",F="(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",G=F.replace("w","w#"),H="([*^$|!~]?=)",I="\\["+E+"*("+F+")"+E+"*(?:"+H+E+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+G+")|)|)"+E+"*\\]",J=":("+F+")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:"+I+")|[^:]|\\\\.)*|.*))\\)|)",K=":(even|odd|eq|gt|lt|nth|first|last)(?:\\("+E+"*((?:-\\d)?\\d*)"+E+"*\\)|)(?=[^-]|$)",L=new RegExp("^"+E+"+|((?:^|[^\\\\])(?:\\\\.)*)"+E+"+$","g"),M=new RegExp("^"+E+"*,"+E+"*"),N=new RegExp("^"+E+"*([\\x20\\t\\r\\n\\f>+~])"+E+"*"),O=new RegExp(J),P=/^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,Q=/^:not/,R=/[\x20\t\r\n\f]*[+~]/,S=/:not\($/,T=/h\d/i,U=/input|select|textarea|button/i,V=/\\(?!\\)/g,W={ID:new RegExp("^#("+F+")"),CLASS:new RegExp("^\\.("+F+")"),NAME:new RegExp("^\\[name=['\"]?("+F+")['\"]?\\]"),TAG:new RegExp("^("+F.replace("w","w*")+")"),ATTR:new RegExp("^"+I),PSEUDO:new RegExp("^"+J),POS:new RegExp(K,"i"),CHILD:new RegExp("^:(only|nth|first|last)-child(?:\\("+E+"*(even|odd|(([+-]|)(\\d*)n|)"+E+"*(?:([+-]|)"+E+"*(\\d+)|))"+E+"*\\)|)","i"),needsContext:new RegExp("^"+E+"*[>+~]|"+K,"i")},X=function(a){var b=r.createElement("div");
try{return a(b)}catch(c){return !1}finally{b=null}},Y=X(function(a){return a.appendChild(r.createComment("")),!a.getElementsByTagName("*").length
}),Z=X(function(a){return a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!==n&&a.firstChild.getAttribute("href")==="#"
}),$=X(function(a){a.innerHTML="<select></select>";var b=typeof a.lastChild.getAttribute("multiple");
return b!=="boolean"&&b!=="string"}),_=X(function(a){return a.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",!a.getElementsByClassName||!a.getElementsByClassName("e").length?!1:(a.lastChild.className="e",a.getElementsByClassName("e").length===2)
}),ba=X(function(a){a.id=o+0,a.innerHTML="<a name='"+o+"'></a><div name='"+o+"'></div>",s.insertBefore(a,s.firstChild);
var b=r.getElementsByName&&r.getElementsByName(o).length===2+r.getElementsByName(o+0).length;
return d=!r.getElementById(o),s.removeChild(a),b});try{x.call(s.childNodes,0)[0].nodeType
}catch(bb){x=function(a){var b,c=[];for(;b=this[a];a++){c.push(b)}return c}}bc.matches=function(a,b){return bc(a,null,null,b)
},bc.matchesSelector=function(a,b){return bc(b,null,null,[a]).length>0},f=bc.getText=function(a){var b,c="",d=0,e=a.nodeType;
if(e){if(e===1||e===9||e===11){if(typeof a.textContent=="string"){return a.textContent
}for(a=a.firstChild;a;a=a.nextSibling){c+=f(a)}}else{if(e===3||e===4){return a.nodeValue
}}}else{for(;b=a[d];d++){c+=f(b)}}return c},g=bc.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;
return b?b.nodeName!=="HTML":!1},h=bc.contains=s.contains?function(a,b){var c=a.nodeType===9?a.documentElement:a,d=b&&b.parentNode;
return a===d||!!(d&&d.nodeType===1&&c.contains&&c.contains(d))}:s.compareDocumentPosition?function(a,b){return b&&!!(a.compareDocumentPosition(b)&16)
}:function(a,b){while(b=b.parentNode){if(b===a){return !0}}return !1},bc.attr=function(a,b){var c,d=g(a);
return d||(b=b.toLowerCase()),(c=e.attrHandle[b])?c(a):d||$?a.getAttribute(b):(c=a.getAttributeNode(b),c?typeof a[b]=="boolean"?a[b]?b:null:c.specified?c.value:null:null)
},e=bc.selectors={cacheLength:50,createPseudo:z,match:W,attrHandle:Z?{}:{href:function(a){return a.getAttribute("href",2)
},type:function(a){return a.getAttribute("type")}},find:{ID:d?function(a,b,c){if(typeof b.getElementById!==n&&!c){var d=b.getElementById(a);
return d&&d.parentNode?[d]:[]}}:function(a,c,d){if(typeof c.getElementById!==n&&!d){var e=c.getElementById(a);
return e?e.id===a||typeof e.getAttributeNode!==n&&e.getAttributeNode("id").value===a?[e]:b:[]
}},TAG:Y?function(a,b){if(typeof b.getElementsByTagName!==n){return b.getElementsByTagName(a)
}}:function(a,b){var c=b.getElementsByTagName(a);if(a==="*"){var d,e=[],f=0;for(;
d=c[f];f++){d.nodeType===1&&e.push(d)}return e}return c},NAME:ba&&function(a,b){if(typeof b.getElementsByName!==n){return b.getElementsByName(name)
}},CLASS:_&&function(a,b,c){if(typeof b.getElementsByClassName!==n&&!c){return b.getElementsByClassName(a)
}}},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(V,""),a[3]=(a[4]||a[5]||"").replace(V,""),a[2]==="~="&&(a[3]=" "+a[3]+" "),a.slice(0,4)
},CHILD:function(a){return a[1]=a[1].toLowerCase(),a[1]==="nth"?(a[2]||bc.error(a[0]),a[3]=+(a[3]?a[4]+(a[5]||1):2*(a[2]==="even"||a[2]==="odd")),a[4]=+(a[6]+a[7]||a[2]==="odd")):a[2]&&bc.error(a[0]),a
},PSEUDO:function(a){var b,c;if(W.CHILD.test(a[0])){return null}if(a[3]){a[2]=a[3]
}else{if(b=a[4]){O.test(b)&&(c=bh(b,!0))&&(c=b.indexOf(")",b.length-c)-b.length)&&(b=b.slice(0,c),a[0]=a[0].slice(0,c)),a[2]=b
}}return a.slice(0,3)}},filter:{ID:d?function(a){return a=a.replace(V,""),function(b){return b.getAttribute("id")===a
}}:function(a){return a=a.replace(V,""),function(b){var c=typeof b.getAttributeNode!==n&&b.getAttributeNode("id");
return c&&c.value===a}},TAG:function(a){return a==="*"?function(){return !0}:(a=a.replace(V,"").toLowerCase(),function(b){return b.nodeName&&b.nodeName.toLowerCase()===a
})},CLASS:function(a){var b=B[o][a];return b||(b=B(a,new RegExp("(^|"+E+")"+a+"("+E+"|$)"))),function(a){return b.test(a.className||typeof a.getAttribute!==n&&a.getAttribute("class")||"")
}},ATTR:function(a,b,c){return function(d,e){var f=bc.attr(d,a);return f==null?b==="!=":b?(f+="",b==="="?f===c:b==="!="?f!==c:b==="^="?c&&f.indexOf(c)===0:b==="*="?c&&f.indexOf(c)>-1:b==="$="?c&&f.substr(f.length-c.length)===c:b==="~="?(" "+f+" ").indexOf(c)>-1:b==="|="?f===c||f.substr(0,c.length+1)===c+"-":!1):!0
}},CHILD:function(a,b,c,d){return a==="nth"?function(a){var b,e,f=a.parentNode;if(c===1&&d===0){return !0
}if(f){e=0;for(b=f.firstChild;b;b=b.nextSibling){if(b.nodeType===1){e++;if(a===b){break
}}}}return e-=d,e===c||e%c===0&&e/c>=0}:function(b){var c=b;switch(a){case"only":case"first":while(c=c.previousSibling){if(c.nodeType===1){return !1
}}if(a==="first"){return !0}c=b;case"last":while(c=c.nextSibling){if(c.nodeType===1){return !1
}}return !0}}},PSEUDO:function(a,b){var c,d=e.pseudos[a]||e.setFilters[a.toLowerCase()]||bc.error("unsupported pseudo: "+a);
return d[o]?d(b):d.length>1?(c=[a,a,"",b],e.setFilters.hasOwnProperty(a.toLowerCase())?z(function(a,c){var e,f=d(a,b),g=f.length;
while(g--){e=y.call(a,f[g]),a[e]=!(c[e]=f[g])}}):function(a){return d(a,0,c)}):d}},pseudos:{not:z(function(a){var b=[],c=[],d=i(a.replace(L,"$1"));
return d[o]?z(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--){if(f=g[h]){a[h]=!(b[h]=f)
}}}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:z(function(a){return function(b){return bc(a,b).length>0
}}),contains:z(function(a){return function(b){return(b.textContent||b.innerText||f(b)).indexOf(a)>-1
}}),enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0
},checked:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&!!a.checked||b==="option"&&!!a.selected
},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0
},parent:function(a){return !e.pseudos.empty(a)},empty:function(a){var b;a=a.firstChild;
while(a){if(a.nodeName>"@"||(b=a.nodeType)===3||b===4){return !1}a=a.nextSibling}return !0
},header:function(a){return T.test(a.nodeName)},text:function(a){var b,c;return a.nodeName.toLowerCase()==="input"&&(b=a.type)==="text"&&((c=a.getAttribute("type"))==null||c.toLowerCase()===b)
},radio:bd("radio"),checkbox:bd("checkbox"),file:bd("file"),password:bd("password"),image:bd("image"),submit:be("submit"),reset:be("reset"),button:function(a){var b=a.nodeName.toLowerCase();
return b==="input"&&a.type==="button"||b==="button"},input:function(a){return U.test(a.nodeName)
},focus:function(a){var b=a.ownerDocument;return a===b.activeElement&&(!b.hasFocus||b.hasFocus())&&(!!a.type||!!a.href)
},active:function(a){return a===a.ownerDocument.activeElement},first:bf(function(a,b,c){return[0]
}),last:bf(function(a,b,c){return[b-1]}),eq:bf(function(a,b,c){return[c<0?c+b:c]}),even:bf(function(a,b,c){for(var d=0;
d<b;d+=2){a.push(d)}return a}),odd:bf(function(a,b,c){for(var d=1;d<b;d+=2){a.push(d)
}return a}),lt:bf(function(a,b,c){for(var d=c<0?c+b:c;--d>=0;){a.push(d)}return a
}),gt:bf(function(a,b,c){for(var d=c<0?c+b:c;++d<b;){a.push(d)}return a})}},j=s.compareDocumentPosition?function(a,b){return a===b?(k=!0,0):(!a.compareDocumentPosition||!b.compareDocumentPosition?a.compareDocumentPosition:a.compareDocumentPosition(b)&4)?-1:1
}:function(a,b){if(a===b){return k=!0,0}if(a.sourceIndex&&b.sourceIndex){return a.sourceIndex-b.sourceIndex
}var c,d,e=[],f=[],g=a.parentNode,h=b.parentNode,i=g;if(g===h){return bg(a,b)}if(!g){return -1
}if(!h){return 1}while(i){e.unshift(i),i=i.parentNode}i=h;while(i){f.unshift(i),i=i.parentNode
}c=e.length,d=f.length;for(var j=0;j<c&&j<d;j++){if(e[j]!==f[j]){return bg(e[j],f[j])
}}return j===c?bg(a,f[j],-1):bg(e[j],b,1)},[0,0].sort(j),m=!k,bc.uniqueSort=function(a){var b,c=1;
k=m,a.sort(j);if(k){for(;b=a[c];c++){b===a[c-1]&&a.splice(c--,1)}}return a},bc.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)
},i=bc.compile=function(a,b){var c,d=[],e=[],f=D[o][a];if(!f){b||(b=bh(a)),c=b.length;
while(c--){f=bm(b[c]),f[o]?d.push(f):e.push(f)}f=D(a,bn(e,d))}return f},r.querySelectorAll&&function(){var a,b=bp,c=/'|\\/g,d=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,e=[":focus"],f=[":active",":focus"],h=s.matchesSelector||s.mozMatchesSelector||s.webkitMatchesSelector||s.oMatchesSelector||s.msMatchesSelector;
X(function(a){a.innerHTML="<select><option selected=''></option></select>",a.querySelectorAll("[selected]").length||e.push("\\["+E+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),a.querySelectorAll(":checked").length||e.push(":checked")
}),X(function(a){a.innerHTML="<p test=''></p>",a.querySelectorAll("[test^='']").length&&e.push("[*^$]="+E+"*(?:\"\"|'')"),a.innerHTML="<input type='hidden'/>",a.querySelectorAll(":enabled").length||e.push(":enabled",":disabled")
}),e=new RegExp(e.join("|")),bp=function(a,d,f,g,h){if(!g&&!h&&(!e||!e.test(a))){var i,j,k=!0,l=o,m=d,n=d.nodeType===9&&a;
if(d.nodeType===1&&d.nodeName.toLowerCase()!=="object"){i=bh(a),(k=d.getAttribute("id"))?l=k.replace(c,"\\$&"):d.setAttribute("id",l),l="[id='"+l+"'] ",j=i.length;
while(j--){i[j]=l+i[j].join("")}m=R.test(a)&&d.parentNode||d,n=i.join(",")}if(n){try{return w.apply(f,x.call(m.querySelectorAll(n),0)),f
}catch(p){}finally{k||d.removeAttribute("id")}}}return b(a,d,f,g,h)},h&&(X(function(b){a=h.call(b,"div");
try{h.call(b,"[test!='']:sizzle"),f.push("!=",J)}catch(c){}}),f=new RegExp(f.join("|")),bc.matchesSelector=function(b,c){c=c.replace(d,"='$1']");
if(!g(b)&&!f.test(c)&&(!e||!e.test(c))){try{var i=h.call(b,c);if(i||a||b.document&&b.document.nodeType!==11){return i
}}catch(j){}}return bc(c,null,null,[b]).length>0})}(),e.pseudos.nth=e.pseudos.eq,e.filters=bq.prototype=e.pseudos,e.setFilters=new bq,bc.attr=p.attr,p.find=bc,p.expr=bc.selectors,p.expr[":"]=p.expr.pseudos,p.unique=bc.uniqueSort,p.text=bc.getText,p.isXMLDoc=bc.isXML,p.contains=bc.contains
}(a);var bc=/Until$/,bd=/^(?:parents|prev(?:Until|All))/,be=/^.[^:#\[\.,]*$/,bf=p.expr.match.needsContext,bg={children:!0,contents:!0,next:!0,prev:!0};
p.fn.extend({find:function(a){var b,c,d,e,f,g,h=this;if(typeof a!="string"){return p(a).filter(function(){for(b=0,c=h.length;
b<c;b++){if(p.contains(h[b],this)){return !0}}})}g=this.pushStack("","find",a);for(b=0,c=this.length;
b<c;b++){d=g.length,p.find(a,this[b],g);if(b>0){for(e=d;e<g.length;e++){for(f=0;f<d;
f++){if(g[f]===g[e]){g.splice(e--,1);break}}}}}return g},has:function(a){var b,c=p(a,this),d=c.length;
return this.filter(function(){for(b=0;b<d;b++){if(p.contains(this,c[b])){return !0
}}})},not:function(a){return this.pushStack(bj(this,a,!1),"not",a)},filter:function(a){return this.pushStack(bj(this,a,!0),"filter",a)
},is:function(a){return !!a&&(typeof a=="string"?bf.test(a)?p(a,this.context).index(this[0])>=0:p.filter(a,this).length>0:this.filter(a).length>0)
},closest:function(a,b){var c,d=0,e=this.length,f=[],g=bf.test(a)||typeof a!="string"?p(a,b||this.context):0;
for(;d<e;d++){c=this[d];while(c&&c.ownerDocument&&c!==b&&c.nodeType!==11){if(g?g.index(c)>-1:p.find.matchesSelector(c,a)){f.push(c);
break}c=c.parentNode}}return f=f.length>1?p.unique(f):f,this.pushStack(f,"closest",a)
},index:function(a){return a?typeof a=="string"?p.inArray(this[0],p(a)):p.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.prevAll().length:-1
},add:function(a,b){var c=typeof a=="string"?p(a,b):p.makeArray(a&&a.nodeType?[a]:a),d=p.merge(this.get(),c);
return this.pushStack(bh(c[0])||bh(d[0])?d:p.unique(d))},addBack:function(a){return this.add(a==null?this.prevObject:this.prevObject.filter(a))
}}),p.fn.andSelf=p.fn.addBack,p.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null
},parents:function(a){return p.dir(a,"parentNode")},parentsUntil:function(a,b,c){return p.dir(a,"parentNode",c)
},next:function(a){return bi(a,"nextSibling")},prev:function(a){return bi(a,"previousSibling")
},nextAll:function(a){return p.dir(a,"nextSibling")},prevAll:function(a){return p.dir(a,"previousSibling")
},nextUntil:function(a,b,c){return p.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return p.dir(a,"previousSibling",c)
},siblings:function(a){return p.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return p.sibling(a.firstChild)
},contents:function(a){return p.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:p.merge([],a.childNodes)
}},function(a,b){p.fn[a]=function(c,d){var e=p.map(this,b,c);return bc.test(a)||(d=c),d&&typeof d=="string"&&(e=p.filter(d,e)),e=this.length>1&&!bg[a]?p.unique(e):e,this.length>1&&bd.test(a)&&(e=e.reverse()),this.pushStack(e,a,k.call(arguments).join(","))
}}),p.extend({filter:function(a,b,c){return c&&(a=":not("+a+")"),b.length===1?p.find.matchesSelector(b[0],a)?[b[0]]:[]:p.find.matches(a,b)
},dir:function(a,c,d){var e=[],f=a[c];while(f&&f.nodeType!==9&&(d===b||f.nodeType!==1||!p(f).is(d))){f.nodeType===1&&e.push(f),f=f[c]
}return e},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling){a.nodeType===1&&a!==b&&c.push(a)
}return c}});var bl="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",bm=/ jQuery\d+="(?:null|\d+)"/g,bn=/^\s+/,bo=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bp=/<([\w:]+)/,bq=/<tbody/i,br=/<|&#?\w+;/,bs=/<(?:script|style|link)/i,bt=/<(?:script|object|embed|option|style)/i,bu=new RegExp("<(?:"+bl+")[\\s/>]","i"),bv=/^(?:checkbox|radio)$/,bw=/checked\s*(?:[^=]|=\s*.checked.)/i,bx=/\/(java|ecma)script/i,by=/^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,bz={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bA=bk(e),bB=bA.appendChild(e.createElement("div"));
bz.optgroup=bz.option,bz.tbody=bz.tfoot=bz.colgroup=bz.caption=bz.thead,bz.th=bz.td,p.support.htmlSerialize||(bz._default=[1,"X<div>","</div>"]),p.fn.extend({text:function(a){return p.access(this,function(a){return a===b?p.text(this):this.empty().append((this[0]&&this[0].ownerDocument||e).createTextNode(a))
},null,a,arguments.length)},wrapAll:function(a){if(p.isFunction(a)){return this.each(function(b){p(this).wrapAll(a.call(this,b))
})}if(this[0]){var b=p(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;
while(a.firstChild&&a.firstChild.nodeType===1){a=a.firstChild}return a}).append(this)
}return this},wrapInner:function(a){return p.isFunction(a)?this.each(function(b){p(this).wrapInner(a.call(this,b))
}):this.each(function(){var b=p(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)
})},wrap:function(a){var b=p.isFunction(a);return this.each(function(c){p(this).wrapAll(b?a.call(this,c):a)
})},unwrap:function(){return this.parent().each(function(){p.nodeName(this,"body")||p(this).replaceWith(this.childNodes)
}).end()},append:function(){return this.domManip(arguments,!0,function(a){(this.nodeType===1||this.nodeType===11)&&this.appendChild(a)
})},prepend:function(){return this.domManip(arguments,!0,function(a){(this.nodeType===1||this.nodeType===11)&&this.insertBefore(a,this.firstChild)
})},before:function(){if(!bh(this[0])){return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)
})}if(arguments.length){var a=p.clean(arguments);return this.pushStack(p.merge(a,this),"before",this.selector)
}},after:function(){if(!bh(this[0])){return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)
})}if(arguments.length){var a=p.clean(arguments);return this.pushStack(p.merge(this,a),"after",this.selector)
}},remove:function(a,b){var c,d=0;for(;(c=this[d])!=null;d++){if(!a||p.filter(a,[c]).length){!b&&c.nodeType===1&&(p.cleanData(c.getElementsByTagName("*")),p.cleanData([c])),c.parentNode&&c.parentNode.removeChild(c)
}}return this},empty:function(){var a,b=0;for(;(a=this[b])!=null;b++){a.nodeType===1&&p.cleanData(a.getElementsByTagName("*"));
while(a.firstChild){a.removeChild(a.firstChild)}}return this},clone:function(a,b){return a=a==null?!1:a,b=b==null?a:b,this.map(function(){return p.clone(this,a,b)
})},html:function(a){return p.access(this,function(a){var c=this[0]||{},d=0,e=this.length;
if(a===b){return c.nodeType===1?c.innerHTML.replace(bm,""):b}if(typeof a=="string"&&!bs.test(a)&&(p.support.htmlSerialize||!bu.test(a))&&(p.support.leadingWhitespace||!bn.test(a))&&!bz[(bp.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(bo,"<$1></$2>");
try{for(;d<e;d++){c=this[d]||{},c.nodeType===1&&(p.cleanData(c.getElementsByTagName("*")),c.innerHTML=a)
}c=0}catch(f){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){return bh(this[0])?this.length?this.pushStack(p(p.isFunction(a)?a():a),"replaceWith",a):this:p.isFunction(a)?this.each(function(b){var c=p(this),d=c.html();
c.replaceWith(a.call(this,b,d))}):(typeof a!="string"&&(a=p(a).detach()),this.each(function(){var b=this.nextSibling,c=this.parentNode;
p(this).remove(),b?p(b).before(a):p(c).append(a)}))},detach:function(a){return this.remove(a,!0)
},domManip:function(a,c,d){a=[].concat.apply([],a);var e,f,g,h,i=0,j=a[0],k=[],l=this.length;
if(!p.support.checkClone&&l>1&&typeof j=="string"&&bw.test(j)){return this.each(function(){p(this).domManip(a,c,d)
})}if(p.isFunction(j)){return this.each(function(e){var f=p(this);a[0]=j.call(this,e,c?f.html():b),f.domManip(a,c,d)
})}if(this[0]){e=p.buildFragment(a,this,k),g=e.fragment,f=g.firstChild,g.childNodes.length===1&&(g=f);
if(f){c=c&&p.nodeName(f,"tr");for(h=e.cacheable||l-1;i<l;i++){d.call(c&&p.nodeName(this[i],"table")?bC(this[i],"tbody"):this[i],i===h?g:p.clone(g,!0,!0))
}}g=f=null,k.length&&p.each(k,function(a,b){b.src?p.ajax?p.ajax({url:b.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):p.error("no ajax"):p.globalEval((b.text||b.textContent||b.innerHTML||"").replace(by,"")),b.parentNode&&b.parentNode.removeChild(b)
})}return this}}),p.buildFragment=function(a,c,d){var f,g,h,i=a[0];return c=c||e,c=!c.nodeType&&c[0]||c,c=c.ownerDocument||c,a.length===1&&typeof i=="string"&&i.length<512&&c===e&&i.charAt(0)==="<"&&!bt.test(i)&&(p.support.checkClone||!bw.test(i))&&(p.support.html5Clone||!bu.test(i))&&(g=!0,f=p.fragments[i],h=f!==b),f||(f=c.createDocumentFragment(),p.clean(a,c,f,d),g&&(p.fragments[i]=h&&f)),{fragment:f,cacheable:g}
},p.fragments={},p.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){p.fn[a]=function(c){var d,e=0,f=[],g=p(c),h=g.length,i=this.length===1&&this[0].parentNode;
if((i==null||i&&i.nodeType===11&&i.childNodes.length===1)&&h===1){return g[b](this[0]),this
}for(;e<h;e++){d=(e>0?this.clone(!0):this).get(),p(g[e])[b](d),f=f.concat(d)}return this.pushStack(f,a,g.selector)
}}),p.extend({clone:function(a,b,c){var d,e,f,g;p.support.html5Clone||p.isXMLDoc(a)||!bu.test("<"+a.nodeName+">")?g=a.cloneNode(!0):(bB.innerHTML=a.outerHTML,bB.removeChild(g=bB.firstChild));
if((!p.support.noCloneEvent||!p.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!p.isXMLDoc(a)){bE(a,g),d=bF(a),e=bF(g);
for(f=0;d[f];++f){e[f]&&bE(d[f],e[f])}}if(b){bD(a,g);if(c){d=bF(a),e=bF(g);for(f=0;
d[f];++f){bD(d[f],e[f])}}}return d=e=null,g},clean:function(a,b,c,d){var f,g,h,i,j,k,l,m,n,o,q,r,s=b===e&&bA,t=[];
if(!b||typeof b.createDocumentFragment=="undefined"){b=e}for(f=0;(h=a[f])!=null;f++){typeof h=="number"&&(h+="");
if(!h){continue}if(typeof h=="string"){if(!br.test(h)){h=b.createTextNode(h)}else{s=s||bk(b),l=b.createElement("div"),s.appendChild(l),h=h.replace(bo,"<$1></$2>"),i=(bp.exec(h)||["",""])[1].toLowerCase(),j=bz[i]||bz._default,k=j[0],l.innerHTML=j[1]+h+j[2];
while(k--){l=l.lastChild}if(!p.support.tbody){m=bq.test(h),n=i==="table"&&!m?l.firstChild&&l.firstChild.childNodes:j[1]==="<table>"&&!m?l.childNodes:[];
for(g=n.length-1;g>=0;--g){p.nodeName(n[g],"tbody")&&!n[g].childNodes.length&&n[g].parentNode.removeChild(n[g])
}}!p.support.leadingWhitespace&&bn.test(h)&&l.insertBefore(b.createTextNode(bn.exec(h)[0]),l.firstChild),h=l.childNodes,l.parentNode.removeChild(l)
}}h.nodeType?t.push(h):p.merge(t,h)}l&&(h=l=s=null);if(!p.support.appendChecked){for(f=0;
(h=t[f])!=null;f++){p.nodeName(h,"input")?bG(h):typeof h.getElementsByTagName!="undefined"&&p.grep(h.getElementsByTagName("input"),bG)
}}if(c){q=function(a){if(!a.type||bx.test(a.type)){return d?d.push(a.parentNode?a.parentNode.removeChild(a):a):c.appendChild(a)
}};for(f=0;(h=t[f])!=null;f++){if(!p.nodeName(h,"script")||!q(h)){c.appendChild(h),typeof h.getElementsByTagName!="undefined"&&(r=p.grep(p.merge([],h.getElementsByTagName("script")),q),t.splice.apply(t,[f+1,0].concat(r)),f+=r.length)
}}}return t},cleanData:function(a,b){var c,d,e,f,g=0,h=p.expando,i=p.cache,j=p.support.deleteExpando,k=p.event.special;
for(;(e=a[g])!=null;g++){if(b||p.acceptData(e)){d=e[h],c=d&&i[d];if(c){if(c.events){for(f in c.events){k[f]?p.event.remove(e,f):p.removeEvent(e,f,c.handle)
}}i[d]&&(delete i[d],j?delete e[h]:e.removeAttribute?e.removeAttribute(h):e[h]=null,p.deletedIds.push(d))
}}}}}),function(){var a,b;p.uaMatch=function(a){a=a.toLowerCase();var b=/(chrome)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||a.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a)||[];
return{browser:b[1]||"",version:b[2]||"0"}},a=p.uaMatch(g.userAgent),b={},a.browser&&(b[a.browser]=!0,b.version=a.version),b.chrome?b.webkit=!0:b.webkit&&(b.safari=!0),p.browser=b,p.sub=function(){function a(b,c){return new a.fn.init(b,c)
}p.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function c(c,d){return d&&d instanceof p&&!(d instanceof a)&&(d=a(d)),p.fn.init.call(this,c,d,b)
},a.fn.init.prototype=a.fn;var b=a(e);return a}}();var bH,bI,bJ,bK=/alpha\([^)]*\)/i,bL=/opacity=([^)]*)/,bM=/^(top|right|bottom|left)$/,bN=/^(none|table(?!-c[ea]).+)/,bO=/^margin/,bP=new RegExp("^("+q+")(.*)$","i"),bQ=new RegExp("^("+q+")(?!px)[a-z%]+$","i"),bR=new RegExp("^([-+])=("+q+")","i"),bS={},bT={position:"absolute",visibility:"hidden",display:"block"},bU={letterSpacing:0,fontWeight:400},bV=["Top","Right","Bottom","Left"],bW=["Webkit","O","Moz","ms"],bX=p.fn.toggle;
p.fn.extend({css:function(a,c){return p.access(this,function(a,c,d){return d!==b?p.style(a,c,d):p.css(a,c)
},a,c,arguments.length>1)},show:function(){return b$(this,!0)},hide:function(){return b$(this)
},toggle:function(a,b){var c=typeof a=="boolean";return p.isFunction(a)&&p.isFunction(b)?bX.apply(this,arguments):this.each(function(){(c?a:bZ(this))?p(this).show():p(this).hide()
})}}),p.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=bH(a,"opacity");
return c===""?"1":c}}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":p.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!a||a.nodeType===3||a.nodeType===8||!a.style){return
}var f,g,h,i=p.camelCase(c),j=a.style;c=p.cssProps[i]||(p.cssProps[i]=bY(j,i)),h=p.cssHooks[c]||p.cssHooks[i];
if(d===b){return h&&"get" in h&&(f=h.get(a,!1,e))!==b?f:j[c]}g=typeof d,g==="string"&&(f=bR.exec(d))&&(d=(f[1]+1)*f[2]+parseFloat(p.css(a,c)),g="number");
if(d==null||g==="number"&&isNaN(d)){return}g==="number"&&!p.cssNumber[i]&&(d+="px");
if(!h||!("set" in h)||(d=h.set(a,d,e))!==b){try{j[c]=d}catch(k){}}},css:function(a,c,d,e){var f,g,h,i=p.camelCase(c);
return c=p.cssProps[i]||(p.cssProps[i]=bY(a.style,i)),h=p.cssHooks[c]||p.cssHooks[i],h&&"get" in h&&(f=h.get(a,!0,e)),f===b&&(f=bH(a,c)),f==="normal"&&c in bU&&(f=bU[c]),d||e!==b?(g=parseFloat(f),d||p.isNumeric(g)?g||0:f):f
},swap:function(a,b,c){var d,e,f={};for(e in b){f[e]=a.style[e],a.style[e]=b[e]}d=c.call(a);
for(e in b){a.style[e]=f[e]}return d}}),a.getComputedStyle?bH=function(b,c){var d,e,f,g,h=a.getComputedStyle(b,null),i=b.style;
return h&&(d=h[c],d===""&&!p.contains(b.ownerDocument,b)&&(d=p.style(b,c)),bQ.test(d)&&bO.test(c)&&(e=i.width,f=i.minWidth,g=i.maxWidth,i.minWidth=i.maxWidth=i.width=d,d=h.width,i.width=e,i.minWidth=f,i.maxWidth=g)),d
}:e.documentElement.currentStyle&&(bH=function(a,b){var c,d,e=a.currentStyle&&a.currentStyle[b],f=a.style;
return e==null&&f&&f[b]&&(e=f[b]),bQ.test(e)&&!bM.test(b)&&(c=f.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),f.left=b==="fontSize"?"1em":e,e=f.pixelLeft+"px",f.left=c,d&&(a.runtimeStyle.left=d)),e===""?"auto":e
}),p.each(["height","width"],function(a,b){p.cssHooks[b]={get:function(a,c,d){if(c){return a.offsetWidth===0&&bN.test(bH(a,"display"))?p.swap(a,bT,function(){return cb(a,b,d)
}):cb(a,b,d)}},set:function(a,c,d){return b_(a,c,d?ca(a,b,d,p.support.boxSizing&&p.css(a,"boxSizing")==="border-box"):0)
}}}),p.support.opacity||(p.cssHooks.opacity={get:function(a,b){return bL.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?0.01*parseFloat(RegExp.$1)+"":b?"1":""
},set:function(a,b){var c=a.style,d=a.currentStyle,e=p.isNumeric(b)?"alpha(opacity="+b*100+")":"",f=d&&d.filter||c.filter||"";
c.zoom=1;if(b>=1&&p.trim(f.replace(bK,""))===""&&c.removeAttribute){c.removeAttribute("filter");
if(d&&!d.filter){return}}c.filter=bK.test(f)?f.replace(bK,e):f+" "+e}}),p(function(){p.support.reliableMarginRight||(p.cssHooks.marginRight={get:function(a,b){return p.swap(a,{display:"inline-block"},function(){if(b){return bH(a,"marginRight")
}})}}),!p.support.pixelPosition&&p.fn.position&&p.each(["top","left"],function(a,b){p.cssHooks[b]={get:function(a,c){if(c){var d=bH(a,b);
return bQ.test(d)?p(a).position()[b]+"px":d}}}})}),p.expr&&p.expr.filters&&(p.expr.filters.hidden=function(a){return a.offsetWidth===0&&a.offsetHeight===0||!p.support.reliableHiddenOffsets&&(a.style&&a.style.display||bH(a,"display"))==="none"
},p.expr.filters.visible=function(a){return !p.expr.filters.hidden(a)}),p.each({margin:"",padding:"",border:"Width"},function(a,b){p.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};
for(d=0;d<4;d++){f[a+bV[d]+b]=e[d]||e[d-2]||e[0]}return f}},bO.test(a)||(p.cssHooks[a+b].set=b_)
});var cd=/%20/g,ce=/\[\]$/,cf=/\r?\n/g,cg=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,ch=/^(?:select|textarea)/i;
p.fn.extend({serialize:function(){return p.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?p.makeArray(this.elements):this
}).filter(function(){return this.name&&!this.disabled&&(this.checked||ch.test(this.nodeName)||cg.test(this.type))
}).map(function(a,b){var c=p(this).val();return c==null?null:p.isArray(c)?p.map(c,function(a,c){return{name:b.name,value:a.replace(cf,"\r\n")}
}):{name:b.name,value:c.replace(cf,"\r\n")}}).get()}}),p.param=function(a,c){var d,e=[],f=function(a,b){b=p.isFunction(b)?b():b==null?"":b,e[e.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)
};c===b&&(c=p.ajaxSettings&&p.ajaxSettings.traditional);if(p.isArray(a)||a.jquery&&!p.isPlainObject(a)){p.each(a,function(){f(this.name,this.value)
})}else{for(d in a){ci(d,a[d],c,f)}}return e.join("&").replace(cd,"+")};var cj,ck,cl=/#.*$/,cm=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,cn=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,co=/^(?:GET|HEAD)$/,cp=/^\/\//,cq=/\?/,cr=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,cs=/([?&])_=[^&]*/,ct=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,cu=p.fn.load,cv={},cw={},cx=["*/"]+["*"];
try{ck=f.href}catch(cy){ck=e.createElement("a"),ck.href="",ck=ck.href}cj=ct.exec(ck.toLowerCase())||[],p.fn.load=function(a,c,d){if(typeof a!="string"&&cu){return cu.apply(this,arguments)
}if(!this.length){return this}var e,f,g,h=this,i=a.indexOf(" ");return i>=0&&(e=a.slice(i,a.length),a=a.slice(0,i)),p.isFunction(c)?(d=c,c=b):c&&typeof c=="object"&&(f="POST"),p.ajax({url:a,type:f,dataType:"html",data:c,complete:function(a,b){d&&h.each(d,g||[a.responseText,b,a])
}}).done(function(a){g=arguments,h.html(e?p("<div>").append(a.replace(cr,"")).find(e):a)
}),this},p.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){p.fn[b]=function(a){return this.on(b,a)
}}),p.each(["get","post"],function(a,c){p[c]=function(a,d,e,f){return p.isFunction(d)&&(f=f||e,e=d,d=b),p.ajax({type:c,url:a,data:d,success:e,dataType:f})
}}),p.extend({getScript:function(a,c){return p.get(a,b,c,"script")},getJSON:function(a,b,c){return p.get(a,b,c,"json")
},ajaxSetup:function(a,b){return b?cB(a,p.ajaxSettings):(b=a,a=p.ajaxSettings),cB(a,b),a
},ajaxSettings:{url:ck,isLocal:cn.test(cj[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":cx},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":p.parseJSON,"text xml":p.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:cz(cv),ajaxTransport:cz(cw),ajax:function(a,c){function y(a,c,f,i){var k,s,t,u,w,y=c;
if(v===2){return}v=2,h&&clearTimeout(h),g=b,e=i||"",x.readyState=a>0?4:0,f&&(u=cC(l,x,f));
if(a>=200&&a<300||a===304){l.ifModified&&(w=x.getResponseHeader("Last-Modified"),w&&(p.lastModified[d]=w),w=x.getResponseHeader("Etag"),w&&(p.etag[d]=w)),a===304?(y="notmodified",k=!0):(k=cD(l,u),y=k.state,s=k.data,t=k.error,k=!t)
}else{t=y;if(!y||a){y="error",a<0&&(a=0)}}x.status=a,x.statusText=(c||y)+"",k?o.resolveWith(m,[s,y,x]):o.rejectWith(m,[x,y,t]),x.statusCode(r),r=b,j&&n.trigger("ajax"+(k?"Success":"Error"),[x,l,k?s:t]),q.fireWith(m,[x,y]),j&&(n.trigger("ajaxComplete",[x,l]),--p.active||p.event.trigger("ajaxStop"))
}typeof a=="object"&&(c=a,a=b),c=c||{};var d,e,f,g,h,i,j,k,l=p.ajaxSetup({},c),m=l.context||l,n=m!==l&&(m.nodeType||m instanceof p)?p(m):p.event,o=p.Deferred(),q=p.Callbacks("once memory"),r=l.statusCode||{},t={},u={},v=0,w="canceled",x={readyState:0,setRequestHeader:function(a,b){if(!v){var c=a.toLowerCase();
a=u[c]=u[c]||a,t[a]=b}return this},getAllResponseHeaders:function(){return v===2?e:null
},getResponseHeader:function(a){var c;if(v===2){if(!f){f={};while(c=cm.exec(e)){f[c[1].toLowerCase()]=c[2]
}}c=f[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){return v||(l.mimeType=a),this
},abort:function(a){return a=a||w,g&&g.abort(a),y(0,a),this}};o.promise(x),x.success=x.done,x.error=x.fail,x.complete=q.add,x.statusCode=function(a){if(a){var b;
if(v<2){for(b in a){r[b]=[r[b],a[b]]}}else{b=a[x.status],x.always(b)}}return this
},l.url=((a||l.url)+"").replace(cl,"").replace(cp,cj[1]+"//"),l.dataTypes=p.trim(l.dataType||"*").toLowerCase().split(s),l.crossDomain==null&&(i=ct.exec(l.url.toLowerCase())||!1,l.crossDomain=i&&i.join(":")+(i[3]?"":i[1]==="http:"?80:443)!==cj.join(":")+(cj[3]?"":cj[1]==="http:"?80:443)),l.data&&l.processData&&typeof l.data!="string"&&(l.data=p.param(l.data,l.traditional)),cA(cv,l,c,x);
if(v===2){return x}j=l.global,l.type=l.type.toUpperCase(),l.hasContent=!co.test(l.type),j&&p.active++===0&&p.event.trigger("ajaxStart");
if(!l.hasContent){l.data&&(l.url+=(cq.test(l.url)?"&":"?")+l.data,delete l.data),d=l.url;
if(l.cache===!1){var z=p.now(),A=l.url.replace(cs,"$1_="+z);l.url=A+(A===l.url?(cq.test(l.url)?"&":"?")+"_="+z:"")
}}(l.data&&l.hasContent&&l.contentType!==!1||c.contentType)&&x.setRequestHeader("Content-Type",l.contentType),l.ifModified&&(d=d||l.url,p.lastModified[d]&&x.setRequestHeader("If-Modified-Since",p.lastModified[d]),p.etag[d]&&x.setRequestHeader("If-None-Match",p.etag[d])),x.setRequestHeader("Accept",l.dataTypes[0]&&l.accepts[l.dataTypes[0]]?l.accepts[l.dataTypes[0]]+(l.dataTypes[0]!=="*"?", "+cx+"; q=0.01":""):l.accepts["*"]);
for(k in l.headers){x.setRequestHeader(k,l.headers[k])}if(!l.beforeSend||l.beforeSend.call(m,x,l)!==!1&&v!==2){w="abort";
for(k in {success:1,error:1,complete:1}){x[k](l[k])}g=cA(cw,l,c,x);if(!g){y(-1,"No Transport")
}else{x.readyState=1,j&&n.trigger("ajaxSend",[x,l]),l.async&&l.timeout>0&&(h=setTimeout(function(){x.abort("timeout")
},l.timeout));try{v=1,g.send(t,y)}catch(B){if(v<2){y(-1,B)}else{throw B}}}return x
}return x.abort()},active:0,lastModified:{},etag:{}});var cE=[],cF=/\?/,cG=/(=)\?(?=&|$)|\?\?/,cH=p.now();
p.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=cE.pop()||p.expando+"_"+cH++;
return this[a]=!0,a}}),p.ajaxPrefilter("json jsonp",function(c,d,e){var f,g,h,i=c.data,j=c.url,k=c.jsonp!==!1,l=k&&cG.test(j),m=k&&!l&&typeof i=="string"&&!(c.contentType||"").indexOf("application/x-www-form-urlencoded")&&cG.test(i);
if(c.dataTypes[0]==="jsonp"||l||m){return f=c.jsonpCallback=p.isFunction(c.jsonpCallback)?c.jsonpCallback():c.jsonpCallback,g=a[f],l?c.url=j.replace(cG,"$1"+f):m?c.data=i.replace(cG,"$1"+f):k&&(c.url+=(cF.test(j)?"&":"?")+c.jsonp+"="+f),c.converters["script json"]=function(){return h||p.error(f+" was not called"),h[0]
},c.dataTypes[0]="json",a[f]=function(){h=arguments},e.always(function(){a[f]=g,c[f]&&(c.jsonpCallback=d.jsonpCallback,cE.push(f)),h&&p.isFunction(g)&&g(h[0]),h=g=b
}),"script"}}),p.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){return p.globalEval(a),a
}}}),p.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)
}),p.ajaxTransport("script",function(a){if(a.crossDomain){var c,d=e.head||e.getElementsByTagName("head")[0]||e.documentElement;
return{send:function(f,g){c=e.createElement("script"),c.async="async",a.scriptCharset&&(c.charset=a.scriptCharset),c.src=a.url,c.onload=c.onreadystatechange=function(a,e){if(e||!c.readyState||/loaded|complete/.test(c.readyState)){c.onload=c.onreadystatechange=null,d&&c.parentNode&&d.removeChild(c),c=b,e||g(200,"success")
}},d.insertBefore(c,d.firstChild)},abort:function(){c&&c.onload(0,1)}}}});var cI,cJ=a.ActiveXObject?function(){for(var a in cI){cI[a](0,1)
}}:!1,cK=0;p.ajaxSettings.xhr=a.ActiveXObject?function(){return !this.isLocal&&cL()||cM()
}:cL,function(a){p.extend(p.support,{ajax:!!a,cors:!!a&&"withCredentials" in a})}(p.ajaxSettings.xhr()),p.support.ajax&&p.ajaxTransport(function(c){if(!c.crossDomain||p.support.cors){var d;
return{send:function(e,f){var g,h,i=c.xhr();c.username?i.open(c.type,c.url,c.async,c.username,c.password):i.open(c.type,c.url,c.async);
if(c.xhrFields){for(h in c.xhrFields){i[h]=c.xhrFields[h]}}c.mimeType&&i.overrideMimeType&&i.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");
try{for(h in e){i.setRequestHeader(h,e[h])}}catch(j){}i.send(c.hasContent&&c.data||null),d=function(a,e){var h,j,k,l,m;
try{if(d&&(e||i.readyState===4)){d=b,g&&(i.onreadystatechange=p.noop,cJ&&delete cI[g]);
if(e){i.readyState!==4&&i.abort()}else{h=i.status,k=i.getAllResponseHeaders(),l={},m=i.responseXML,m&&m.documentElement&&(l.xml=m);
try{l.text=i.responseText}catch(a){}try{j=i.statusText}catch(n){j=""}!h&&c.isLocal&&!c.crossDomain?h=l.text?200:404:h===1223&&(h=204)
}}}catch(o){e||f(-1,o)}l&&f(h,j,l,k)},c.async?i.readyState===4?setTimeout(d,0):(g=++cK,cJ&&(cI||(cI={},p(a).unload(cJ)),cI[g]=d),i.onreadystatechange=d):d()
},abort:function(){d&&d(0,1)}}}});var cN,cO,cP=/^(?:toggle|show|hide)$/,cQ=new RegExp("^(?:([-+])=|)("+q+")([a-z%]*)$","i"),cR=/queueHooks$/,cS=[cY],cT={"*":[function(a,b){var c,d,e=this.createTween(a,b),f=cQ.exec(b),g=e.cur(),h=+g||0,i=1,j=20;
if(f){c=+f[2],d=f[3]||(p.cssNumber[a]?"":"px");if(d!=="px"&&h){h=p.css(e.elem,a,!0)||c||1;
do{i=i||".5",h=h/i,p.style(e.elem,a,h+d)}while(i!==(i=e.cur()/g)&&i!==1&&--j)}e.unit=d,e.start=h,e.end=f[1]?h+(f[1]+1)*c:c
}return e}]};p.Animation=p.extend(cW,{tweener:function(a,b){p.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");
var c,d=0,e=a.length;for(;d<e;d++){c=a[d],cT[c]=cT[c]||[],cT[c].unshift(b)}},prefilter:function(a,b){b?cS.unshift(a):cS.push(a)
}}),p.Tween=cZ,cZ.prototype={constructor:cZ,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(p.cssNumber[c]?"":"px")
},cur:function(){var a=cZ.propHooks[this.prop];return a&&a.get?a.get(this):cZ.propHooks._default.get(this)
},run:function(a){var b,c=cZ.propHooks[this.prop];return this.options.duration?this.pos=b=p.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):cZ.propHooks._default.set(this),this
}},cZ.prototype.init.prototype=cZ.prototype,cZ.propHooks={_default:{get:function(a){var b;
return a.elem[a.prop]==null||!!a.elem.style&&a.elem.style[a.prop]!=null?(b=p.css(a.elem,a.prop,!1,""),!b||b==="auto"?0:b):a.elem[a.prop]
},set:function(a){p.fx.step[a.prop]?p.fx.step[a.prop](a):a.elem.style&&(a.elem.style[p.cssProps[a.prop]]!=null||p.cssHooks[a.prop])?p.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now
}}},cZ.propHooks.scrollTop=cZ.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)
}},p.each(["toggle","show","hide"],function(a,b){var c=p.fn[b];p.fn[b]=function(d,e,f){return d==null||typeof d=="boolean"||!a&&p.isFunction(d)&&p.isFunction(e)?c.apply(this,arguments):this.animate(c$(b,!0),d,e,f)
}}),p.fn.extend({fadeTo:function(a,b,c,d){return this.filter(bZ).css("opacity",0).show().end().animate({opacity:b},a,c,d)
},animate:function(a,b,c,d){var e=p.isEmptyObject(a),f=p.speed(b,c,d),g=function(){var b=cW(this,p.extend({},a),f);
e&&b.stop(!0)};return e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,c,d){var e=function(a){var b=a.stop;
delete a.stop,b(d)};return typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,c=a!=null&&a+"queueHooks",f=p.timers,g=p._data(this);
if(c){g[c]&&g[c].stop&&e(g[c])}else{for(c in g){g[c]&&g[c].stop&&cR.test(c)&&e(g[c])
}}for(c=f.length;c--;){f[c].elem===this&&(a==null||f[c].queue===a)&&(f[c].anim.stop(d),b=!1,f.splice(c,1))
}(b||!d)&&p.dequeue(this,a)})}}),p.each({slideDown:c$("show"),slideUp:c$("hide"),slideToggle:c$("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){p.fn[a]=function(a,c,d){return this.animate(b,a,c,d)
}}),p.speed=function(a,b,c){var d=a&&typeof a=="object"?p.extend({},a):{complete:c||!c&&b||p.isFunction(a)&&a,duration:a,easing:c&&b||b&&!p.isFunction(b)&&b};
d.duration=p.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in p.fx.speeds?p.fx.speeds[d.duration]:p.fx.speeds._default;
if(d.queue==null||d.queue===!0){d.queue="fx"}return d.old=d.complete,d.complete=function(){p.isFunction(d.old)&&d.old.call(this),d.queue&&p.dequeue(this,d.queue)
},d},p.easing={linear:function(a){return a},swing:function(a){return 0.5-Math.cos(a*Math.PI)/2
}},p.timers=[],p.fx=cZ.prototype.init,p.fx.tick=function(){var a,b=p.timers,c=0;for(;
c<b.length;c++){a=b[c],!a()&&b[c]===a&&b.splice(c--,1)}b.length||p.fx.stop()},p.fx.timer=function(a){a()&&p.timers.push(a)&&!cO&&(cO=setInterval(p.fx.tick,p.fx.interval))
},p.fx.interval=13,p.fx.stop=function(){clearInterval(cO),cO=null},p.fx.speeds={slow:600,fast:200,_default:400},p.fx.step={},p.expr&&p.expr.filters&&(p.expr.filters.animated=function(a){return p.grep(p.timers,function(b){return a===b.elem
}).length});var c_=/^(?:body|html)$/i;p.fn.offset=function(a){if(arguments.length){return a===b?this:this.each(function(b){p.offset.setOffset(this,a,b)
})}var c,d,e,f,g,h,i,j={top:0,left:0},k=this[0],l=k&&k.ownerDocument;if(!l){return
}return(d=l.body)===k?p.offset.bodyOffset(k):(c=l.documentElement,p.contains(c,k)?(typeof k.getBoundingClientRect!="undefined"&&(j=k.getBoundingClientRect()),e=da(l),f=c.clientTop||d.clientTop||0,g=c.clientLeft||d.clientLeft||0,h=e.pageYOffset||c.scrollTop,i=e.pageXOffset||c.scrollLeft,{top:j.top+h-f,left:j.left+i-g}):j)
},p.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;return p.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(p.css(a,"marginTop"))||0,c+=parseFloat(p.css(a,"marginLeft"))||0),{top:b,left:c}
},setOffset:function(a,b,c){var d=p.css(a,"position");d==="static"&&(a.style.position="relative");
var e=p(a),f=e.offset(),g=p.css(a,"top"),h=p.css(a,"left"),i=(d==="absolute"||d==="fixed")&&p.inArray("auto",[g,h])>-1,j={},k={},l,m;
i?(k=e.position(),l=k.top,m=k.left):(l=parseFloat(g)||0,m=parseFloat(h)||0),p.isFunction(b)&&(b=b.call(a,c,f)),b.top!=null&&(j.top=b.top-f.top+l),b.left!=null&&(j.left=b.left-f.left+m),"using" in b?b.using.call(a,j):e.css(j)
}},p.fn.extend({position:function(){if(!this[0]){return}var a=this[0],b=this.offsetParent(),c=this.offset(),d=c_.test(b[0].nodeName)?{top:0,left:0}:b.offset();
return c.top-=parseFloat(p.css(a,"marginTop"))||0,c.left-=parseFloat(p.css(a,"marginLeft"))||0,d.top+=parseFloat(p.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(p.css(b[0],"borderLeftWidth"))||0,{top:c.top-d.top,left:c.left-d.left}
},offsetParent:function(){return this.map(function(){var a=this.offsetParent||e.body;
while(a&&!c_.test(a.nodeName)&&p.css(a,"position")==="static"){a=a.offsetParent}return a||e.body
})}}),p.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);
p.fn[a]=function(e){return p.access(this,function(a,e,f){var g=da(a);if(f===b){return g?c in g?g[c]:g.document.documentElement[e]:a[e]
}g?g.scrollTo(d?p(g).scrollLeft():f,d?f:p(g).scrollTop()):a[e]=f},a,e,arguments.length,null)
}}),p.each({Height:"height",Width:"width"},function(a,c){p.each({padding:"inner"+a,content:c,"":"outer"+a},function(d,e){p.fn[e]=function(e,f){var g=arguments.length&&(d||typeof e!="boolean"),h=d||(e===!0||f===!0?"margin":"border");
return p.access(this,function(c,d,e){var f;return p.isWindow(c)?c.document.documentElement["client"+a]:c.nodeType===9?(f=c.documentElement,Math.max(c.body["scroll"+a],f["scroll"+a],c.body["offset"+a],f["offset"+a],f["client"+a])):e===b?p.css(c,d,e,h):p.style(c,d,e,h)
},c,g?e:b,g,null)}})}),a.jQuery=a.$=p,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return p
})})(window);
/*! jQuery UI - v1.9.2 - 2012-11-23
* http://jqueryui.com
* Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.mouse.js, jquery.ui.draggable.js, jquery.ui.droppable.js, jquery.ui.resizable.js, jquery.ui.selectable.js, jquery.ui.sortable.js, jquery.ui.effect.js, jquery.ui.accordion.js, jquery.ui.autocomplete.js, jquery.ui.button.js, jquery.ui.datepicker.js, jquery.ui.dialog.js, jquery.ui.effect-blind.js, jquery.ui.effect-bounce.js, jquery.ui.effect-clip.js, jquery.ui.effect-drop.js, jquery.ui.effect-explode.js, jquery.ui.effect-fade.js, jquery.ui.effect-fold.js, jquery.ui.effect-highlight.js, jquery.ui.effect-pulsate.js, jquery.ui.effect-scale.js, jquery.ui.effect-shake.js, jquery.ui.effect-slide.js, jquery.ui.effect-transfer.js, jquery.ui.menu.js, jquery.ui.position.js, jquery.ui.progressbar.js, jquery.ui.slider.js, jquery.ui.spinner.js, jquery.ui.tabs.js, jquery.ui.tooltip.js
* Copyright 2012 jQuery Foundation and other contributors; Licensed MIT */
(function(f,b){function a(j,m){var k,h,l,e=j.nodeName.toLowerCase();
return"area"===e?(k=j.parentNode,h=k.name,!j.href||!h||k.nodeName.toLowerCase()!=="map"?!1:(l=f("img[usemap=#"+h+"]")[0],!!l&&c(l))):(/input|select|textarea|button|object/.test(e)?!j.disabled:"a"===e?j.href||m:m)&&c(j)
}function c(e){return f.expr.filters.visible(e)&&!f(e).parents().andSelf().filter(function(){return f.css(this,"visibility")==="hidden"
}).length}var g=0,d=/^ui-id-\d+$/;f.ui=f.ui||{};if(f.ui.version){return}f.extend(f.ui,{version:"1.9.2",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),f.fn.extend({_focus:f.fn.focus,focus:function(e,h){return typeof e=="number"?this.each(function(){var i=this;
setTimeout(function(){f(i).focus(),h&&h.call(i)},e)}):this._focus.apply(this,arguments)
},scrollParent:function(){var e;return f.ui.ie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?e=this.parents().filter(function(){return/(relative|absolute|fixed)/.test(f.css(this,"position"))&&/(auto|scroll)/.test(f.css(this,"overflow")+f.css(this,"overflow-y")+f.css(this,"overflow-x"))
}).eq(0):e=this.parents().filter(function(){return/(auto|scroll)/.test(f.css(this,"overflow")+f.css(this,"overflow-y")+f.css(this,"overflow-x"))
}).eq(0),/fixed/.test(this.css("position"))||!e.length?f(document):e},zIndex:function(k){if(k!==b){return this.css("zIndex",k)
}if(this.length){var j=f(this[0]),e,h;while(j.length&&j[0]!==document){e=j.css("position");
if(e==="absolute"||e==="relative"||e==="fixed"){h=parseInt(j.css("zIndex"),10);if(!isNaN(h)&&h!==0){return h
}}j=j.parent()}}return 0},uniqueId:function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++g)
})},removeUniqueId:function(){return this.each(function(){d.test(this.id)&&f(this).removeAttr("id")
})}}),f.extend(f.expr[":"],{data:f.expr.createPseudo?f.expr.createPseudo(function(e){return function(h){return !!f.data(h,e)
}}):function(e,i,h){return !!f.data(e,h[3])},focusable:function(e){return a(e,!isNaN(f.attr(e,"tabindex")))
},tabbable:function(e){var i=f.attr(e,"tabindex"),h=isNaN(i);return(h||i>=0)&&a(e,!h)
}}),f(function(){var e=document.body,h=e.appendChild(h=document.createElement("div"));
h.offsetHeight,f.extend(h.style,{minHeight:"100px",height:"auto",padding:0,borderWidth:0}),f.support.minHeight=h.offsetHeight===100,f.support.selectstart="onselectstart" in h,e.removeChild(h).style.display="none"
}),f("<a>").outerWidth(1).jquery||f.each(["Width","Height"],function(m,k){function e(i,q,p,o){return f.each(h,function(){q-=parseFloat(f.css(i,"padding"+this))||0,p&&(q-=parseFloat(f.css(i,"border"+this+"Width"))||0),o&&(q-=parseFloat(f.css(i,"margin"+this))||0)
}),q}var h=k==="Width"?["Left","Right"]:["Top","Bottom"],j=k.toLowerCase(),l={innerWidth:f.fn.innerWidth,innerHeight:f.fn.innerHeight,outerWidth:f.fn.outerWidth,outerHeight:f.fn.outerHeight};
f.fn["inner"+k]=function(i){return i===b?l["inner"+k].call(this):this.each(function(){f(this).css(j,e(this,i)+"px")
})},f.fn["outer"+k]=function(i,o){return typeof i!="number"?l["outer"+k].call(this,i):this.each(function(){f(this).css(j,e(this,i,!0,o)+"px")
})}}),f("<a>").data("a-b","a").removeData("a-b").data("a-b")&&(f.fn.removeData=function(e){return function(h){return arguments.length?e.call(this,f.camelCase(h)):e.call(this)
}}(f.fn.removeData)),function(){var e=/msie ([\w.]+)/.exec(navigator.userAgent.toLowerCase())||[];
f.ui.ie=e.length?!0:!1,f.ui.ie6=parseFloat(e[1],10)===6}(),f.fn.extend({disableSelection:function(){return this.bind((f.support.selectstart?"selectstart":"mousedown")+".ui-disableSelection",function(h){h.preventDefault()
})},enableSelection:function(){return this.unbind(".ui-disableSelection")}}),f.extend(f.ui,{plugin:{add:function(h,l,k){var e,j=f.ui[h].prototype;
for(e in k){j.plugins[e]=j.plugins[e]||[],j.plugins[e].push([l,k[e]])}},call:function(l,j,m){var k,h=l.plugins[j];
if(!h||!l.element[0].parentNode||l.element[0].parentNode.nodeType===11){return}for(k=0;
k<h.length;k++){l.options[h[k][0]]&&h[k][1].apply(l.element,m)}}},contains:f.contains,hasScroll:function(h,k){if(f(h).css("overflow")==="hidden"){return !1
}var j=k&&k==="left"?"scrollLeft":"scrollTop",e=!1;return h[j]>0?!0:(h[j]=1,e=h[j]>0,h[j]=0,e)
},isOverAxis:function(i,h,j){return i>h&&i<h+j},isOver:function(h,m,k,e,j,l){return f.ui.isOverAxis(h,k,j)&&f.ui.isOverAxis(m,e,l)
}})})(jQuery),function(d,b){var f=0,c=Array.prototype.slice,a=d.cleanData;d.cleanData=function(e){for(var i=0,h;
(h=e[i])!=null;i++){try{d(h).triggerHandler("remove")}catch(g){}}a(e)},d.widget=function(j,p,l){var h,k,m,g,e=j.split(".")[0];
j=j.split(".")[1],h=e+"-"+j,l||(l=p,p=d.Widget),d.expr[":"][h.toLowerCase()]=function(i){return !!d.data(i,h)
},d[e]=d[e]||{},k=d[e][j],m=d[e][j]=function(n,i){if(!this._createWidget){return new m(n,i)
}arguments.length&&this._createWidget(n,i)},d.extend(m,k,{version:l.version,_proto:d.extend({},l),_childConstructors:[]}),g=new p,g.options=d.widget.extend({},g.options),d.each(l,function(o,n){d.isFunction(n)&&(l[o]=function(){var q=function(){return p.prototype[o].apply(this,arguments)
},i=function(r){return p.prototype[o].apply(this,r)};return function(){var r=this._super,v=this._superApply,u;
return this._super=q,this._superApply=i,u=n.apply(this,arguments),this._super=r,this._superApply=v,u
}}())}),m.prototype=d.widget.extend(g,{widgetEventPrefix:k?g.widgetEventPrefix:j},l,{constructor:m,namespace:e,widgetName:j,widgetBaseClass:h,widgetFullName:h}),k?(d.each(k._childConstructors,function(i,q){var o=q.prototype;
d.widget(o.namespace+"."+o.widgetName,m,q._proto)}),delete k._childConstructors):p._childConstructors.push(m),d.widget.bridge(j,m)
},d.widget.extend=function(l){var h=c.call(arguments,1),j=0,k=h.length,g,e;for(;j<k;
j++){for(g in h[j]){e=h[j][g],h[j].hasOwnProperty(g)&&e!==b&&(d.isPlainObject(e)?l[g]=d.isPlainObject(l[g])?d.widget.extend({},l[g],e):d.widget.extend({},e):l[g]=e)
}}return l},d.widget.bridge=function(h,e){var g=e.prototype.widgetFullName||h;d.fn[h]=function(l){var j=typeof l=="string",i=c.call(arguments,1),k=this;
return l=!j&&i.length?d.widget.extend.apply(null,[l].concat(i)):l,j?this.each(function(){var n,m=d.data(this,g);
if(!m){return d.error("cannot call methods on "+h+" prior to initialization; attempted to call method '"+l+"'")
}if(!d.isFunction(m[l])||l.charAt(0)==="_"){return d.error("no such method '"+l+"' for "+h+" widget instance")
}n=m[l].apply(m,i);if(n!==m&&n!==b){return k=n&&n.jquery?k.pushStack(n.get()):n,!1
}}):this.each(function(){var m=d.data(this,g);m?m.option(l||{})._init():d.data(this,g,new e(l,this))
}),k}},d.Widget=function(){},d.Widget._childConstructors=[],d.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{disabled:!1,create:null},_createWidget:function(e,g){g=d(g||this.defaultElement||this)[0],this.element=d(g),this.uuid=f++,this.eventNamespace="."+this.widgetName+this.uuid,this.options=d.widget.extend({},this.options,this._getCreateOptions(),e),this.bindings=d(),this.hoverable=d(),this.focusable=d(),g!==this&&(d.data(g,this.widgetName,this),d.data(g,this.widgetFullName,this),this._on(!0,this.element,{remove:function(h){h.target===g&&this.destroy()
}}),this.document=d(g.style?g.ownerDocument:g.document||g),this.window=d(this.document[0].defaultView||this.document[0].parentWindow)),this._create(),this._trigger("create",null,this._getCreateEventData()),this._init()
},_getCreateOptions:d.noop,_getCreateEventData:d.noop,_create:d.noop,_init:d.noop,destroy:function(){this._destroy(),this.element.unbind(this.eventNamespace).removeData(this.widgetName).removeData(this.widgetFullName).removeData(d.camelCase(this.widgetFullName)),this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName+"-disabled ui-state-disabled"),this.bindings.unbind(this.eventNamespace),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")
},_destroy:d.noop,widget:function(){return this.element},option:function(l,j){var g=l,h,k,e;
if(arguments.length===0){return d.widget.extend({},this.options)}if(typeof l=="string"){g={},h=l.split("."),l=h.shift();
if(h.length){k=g[l]=d.widget.extend({},this.options[l]);for(e=0;e<h.length-1;e++){k[h[e]]=k[h[e]]||{},k=k[h[e]]
}l=h.pop();if(j===b){return k[l]===b?null:k[l]}k[l]=j}else{if(j===b){return this.options[l]===b?null:this.options[l]
}g[l]=j}}return this._setOptions(g),this},_setOptions:function(h){var g;for(g in h){this._setOption(g,h[g])
}return this},_setOption:function(h,g){return this.options[h]=g,h==="disabled"&&(this.widget().toggleClass(this.widgetFullName+"-disabled ui-state-disabled",!!g).attr("aria-disabled",g),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")),this
},enable:function(){return this._setOption("disabled",!1)},disable:function(){return this._setOption("disabled",!0)
},_on:function(g,k,j){var e,h=this;typeof g!="boolean"&&(j=k,k=g,g=!1),j?(k=e=d(k),this.bindings=this.bindings.add(k)):(j=k,k=this.element,e=this.widget()),d.each(j,function(p,s){function n(){if(!g&&(h.options.disabled===!0||d(this).hasClass("ui-state-disabled"))){return
}return(typeof s=="string"?h[s]:s).apply(h,arguments)}typeof s!="string"&&(n.guid=s.guid=s.guid||n.guid||d.guid++);
var m=p.match(/^(\w+)\s*(.*)$/),q=m[1]+h.eventNamespace,i=m[2];i?e.delegate(i,q,n):k.bind(q,n)
})},_off:function(h,g){g=(g||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,h.unbind(g).undelegate(g)
},_delay:function(i,g){function j(){return(typeof i=="string"?h[i]:i).apply(h,arguments)
}var h=this;return setTimeout(j,g||0)},_hoverable:function(e){this.hoverable=this.hoverable.add(e),this._on(e,{mouseenter:function(g){d(g.currentTarget).addClass("ui-state-hover")
},mouseleave:function(g){d(g.currentTarget).removeClass("ui-state-hover")}})},_focusable:function(e){this.focusable=this.focusable.add(e),this._on(e,{focusin:function(g){d(g.currentTarget).addClass("ui-state-focus")
},focusout:function(g){d(g.currentTarget).removeClass("ui-state-focus")}})},_trigger:function(g,l,j){var e,h,k=this.options[g];
j=j||{},l=d.Event(l),l.type=(g===this.widgetEventPrefix?g:this.widgetEventPrefix+g).toLowerCase(),l.target=this.element[0],h=l.originalEvent;
if(h){for(e in h){e in l||(l[e]=h[e])}}return this.element.trigger(l,j),!(d.isFunction(k)&&k.apply(this.element[0],[l].concat(j))===!1||l.isDefaultPrevented())
}},d.each({show:"fadeIn",hide:"fadeOut"},function(e,g){d.Widget.prototype["_"+e]=function(l,j,k){typeof j=="string"&&(j={effect:j});
var m,h=j?j===!0||typeof j=="number"?g:j.effect||g:e;j=j||{},typeof j=="number"&&(j={duration:j}),m=!d.isEmptyObject(j),j.complete=k,j.delay&&l.delay(j.delay),m&&d.effects&&(d.effects.effect[h]||d.uiBackCompat!==!1&&d.effects[h])?l[e](j):h!==e&&l[h]?l[h](j.duration,j.easing,k):l.queue(function(i){d(this)[e](),k&&k.call(l[0]),i()
})}}),d.uiBackCompat!==!1&&(d.Widget.prototype._getCreateOptions=function(){return d.metadata&&d.metadata.get(this.element[0])[this.widgetName]
})}(jQuery),function(b,a){var c=!1;b(document).mouseup(function(d){c=!1}),b.widget("ui.mouse",{version:"1.9.2",options:{cancel:"input,textarea,button,select,option",distance:1,delay:0},_mouseInit:function(){var d=this;
this.element.bind("mousedown."+this.widgetName,function(f){return d._mouseDown(f)
}).bind("click."+this.widgetName,function(e){if(!0===b.data(e.target,d.widgetName+".preventClickEvent")){return b.removeData(e.target,d.widgetName+".preventClickEvent"),e.stopImmediatePropagation(),!1
}}),this.started=!1},_mouseDestroy:function(){this.element.unbind("."+this.widgetName),this._mouseMoveDelegate&&b(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate)
},_mouseDown:function(e){if(c){return}this._mouseStarted&&this._mouseUp(e),this._mouseDownEvent=e;
var g=this,d=e.which===1,f=typeof this.options.cancel=="string"&&e.target.nodeName?b(e.target).closest(this.options.cancel).length:!1;
if(!d||f||!this._mouseCapture(e)){return !0}this.mouseDelayMet=!this.options.delay,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){g.mouseDelayMet=!0
},this.options.delay));if(this._mouseDistanceMet(e)&&this._mouseDelayMet(e)){this._mouseStarted=this._mouseStart(e)!==!1;
if(!this._mouseStarted){return e.preventDefault(),!0}}return !0===b.data(e.target,this.widgetName+".preventClickEvent")&&b.removeData(e.target,this.widgetName+".preventClickEvent"),this._mouseMoveDelegate=function(h){return g._mouseMove(h)
},this._mouseUpDelegate=function(h){return g._mouseUp(h)},b(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate),e.preventDefault(),c=!0,!0
},_mouseMove:function(d){return !b.ui.ie||document.documentMode>=9||!!d.button?this._mouseStarted?(this._mouseDrag(d),d.preventDefault()):(this._mouseDistanceMet(d)&&this._mouseDelayMet(d)&&(this._mouseStarted=this._mouseStart(this._mouseDownEvent,d)!==!1,this._mouseStarted?this._mouseDrag(d):this._mouseUp(d)),!this._mouseStarted):this._mouseUp(d)
},_mouseUp:function(d){return b(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(this._mouseStarted=!1,d.target===this._mouseDownEvent.target&&b.data(d.target,this.widgetName+".preventClickEvent",!0),this._mouseStop(d)),!1
},_mouseDistanceMet:function(d){return Math.max(Math.abs(this._mouseDownEvent.pageX-d.pageX),Math.abs(this._mouseDownEvent.pageY-d.pageY))>=this.options.distance
},_mouseDelayMet:function(d){return this.mouseDelayMet},_mouseStart:function(d){},_mouseDrag:function(d){},_mouseStop:function(d){},_mouseCapture:function(d){return !0
}})}(jQuery),function(b,a){b.widget("ui.draggable",b.ui.mouse,{version:"1.9.2",widgetEventPrefix:"drag",options:{addClasses:!0,appendTo:"parent",axis:!1,connectToSortable:!1,containment:!1,cursor:"auto",cursorAt:!1,grid:!1,handle:!1,helper:"original",iframeFix:!1,opacity:!1,refreshPositions:!1,revert:!1,revertDuration:500,scope:"default",scroll:!0,scrollSensitivity:20,scrollSpeed:20,snap:!1,snapMode:"both",snapTolerance:20,stack:!1,zIndex:!1},_create:function(){this.options.helper=="original"&&!/^(?:r|a|f)/.test(this.element.css("position"))&&(this.element[0].style.position="relative"),this.options.addClasses&&this.element.addClass("ui-draggable"),this.options.disabled&&this.element.addClass("ui-draggable-disabled"),this._mouseInit()
},_destroy:function(){this.element.removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled"),this._mouseDestroy()
},_mouseCapture:function(c){var d=this.options;return this.helper||d.disabled||b(c.target).is(".ui-resizable-handle")?!1:(this.handle=this._getHandle(c),this.handle?(b(d.iframeFix===!0?"iframe":d.iframeFix).each(function(){b('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').css({width:this.offsetWidth+"px",height:this.offsetHeight+"px",position:"absolute",opacity:"0.001",zIndex:1000}).css(b(this).offset()).appendTo("body")
}),!0):!1)},_mouseStart:function(c){var d=this.options;return this.helper=this._createHelper(c),this.helper.addClass("ui-draggable-dragging"),this._cacheHelperProportions(),b.ui.ddmanager&&(b.ui.ddmanager.current=this),this._cacheMargins(),this.cssPosition=this.helper.css("position"),this.scrollParent=this.helper.scrollParent(),this.offset=this.positionAbs=this.element.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},b.extend(this.offset,{click:{left:c.pageX-this.offset.left,top:c.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.originalPosition=this.position=this._generatePosition(c),this.originalPageX=c.pageX,this.originalPageY=c.pageY,d.cursorAt&&this._adjustOffsetFromHelper(d.cursorAt),d.containment&&this._setContainment(),this._trigger("start",c)===!1?(this._clear(),!1):(this._cacheHelperProportions(),b.ui.ddmanager&&!d.dropBehaviour&&b.ui.ddmanager.prepareOffsets(this,c),this._mouseDrag(c,!0),b.ui.ddmanager&&b.ui.ddmanager.dragStart(this,c),!0)
},_mouseDrag:function(c,e){this.position=this._generatePosition(c),this.positionAbs=this._convertPositionTo("absolute");
if(!e){var d=this._uiHash();if(this._trigger("drag",c,d)===!1){return this._mouseUp({}),!1
}this.position=d.position}if(!this.options.axis||this.options.axis!="y"){this.helper[0].style.left=this.position.left+"px"
}if(!this.options.axis||this.options.axis!="x"){this.helper[0].style.top=this.position.top+"px"
}return b.ui.ddmanager&&b.ui.ddmanager.drag(this,c),!1},_mouseStop:function(d){var g=!1;
b.ui.ddmanager&&!this.options.dropBehaviour&&(g=b.ui.ddmanager.drop(this,d)),this.dropped&&(g=this.dropped,this.dropped=!1);
var f=this.element[0],c=!1;while(f&&(f=f.parentNode)){f==document&&(c=!0)}if(!c&&this.options.helper==="original"){return !1
}if(this.options.revert=="invalid"&&!g||this.options.revert=="valid"&&g||this.options.revert===!0||b.isFunction(this.options.revert)&&this.options.revert.call(this.element,g)){var e=this;
b(this.helper).animate(this.originalPosition,parseInt(this.options.revertDuration,10),function(){e._trigger("stop",d)!==!1&&e._clear()
})}else{this._trigger("stop",d)!==!1&&this._clear()}return !1},_mouseUp:function(c){return b("div.ui-draggable-iframeFix").each(function(){this.parentNode.removeChild(this)
}),b.ui.ddmanager&&b.ui.ddmanager.dragStop(this,c),b.ui.mouse.prototype._mouseUp.call(this,c)
},cancel:function(){return this.helper.is(".ui-draggable-dragging")?this._mouseUp({}):this._clear(),this
},_getHandle:function(c){var d=!this.options.handle||!b(this.options.handle,this.element).length?!0:!1;
return b(this.options.handle,this.element).find("*").andSelf().each(function(){this==c.target&&(d=!0)
}),d},_createHelper:function(c){var e=this.options,d=b.isFunction(e.helper)?b(e.helper.apply(this.element[0],[c])):e.helper=="clone"?this.element.clone().removeAttr("id"):this.element;
return d.parents("body").length||d.appendTo(e.appendTo=="parent"?this.element[0].parentNode:e.appendTo),d[0]!=this.element[0]&&!/(fixed|absolute)/.test(d.css("position"))&&d.css("position","absolute"),d
},_adjustOffsetFromHelper:function(c){typeof c=="string"&&(c=c.split(" ")),b.isArray(c)&&(c={left:+c[0],top:+c[1]||0}),"left" in c&&(this.offset.click.left=c.left+this.margins.left),"right" in c&&(this.offset.click.left=this.helperProportions.width-c.right+this.margins.left),"top" in c&&(this.offset.click.top=c.top+this.margins.top),"bottom" in c&&(this.offset.click.top=this.helperProportions.height-c.bottom+this.margins.top)
},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var c=this.offsetParent.offset();
this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&b.contains(this.scrollParent[0],this.offsetParent[0])&&(c.left+=this.scrollParent.scrollLeft(),c.top+=this.scrollParent.scrollTop());
if(this.offsetParent[0]==document.body||this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&b.ui.ie){c={top:0,left:0}
}return{top:c.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:c.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}
},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var c=this.element.position();
return{top:c.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:c.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}
}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.element.css("marginLeft"),10)||0,top:parseInt(this.element.css("marginTop"),10)||0,right:parseInt(this.element.css("marginRight"),10)||0,bottom:parseInt(this.element.css("marginBottom"),10)||0}
},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}
},_setContainment:function(){var d=this.options;d.containment=="parent"&&(d.containment=this.helper[0].parentNode);
if(d.containment=="document"||d.containment=="window"){this.containment=[d.containment=="document"?0:b(window).scrollLeft()-this.offset.relative.left-this.offset.parent.left,d.containment=="document"?0:b(window).scrollTop()-this.offset.relative.top-this.offset.parent.top,(d.containment=="document"?0:b(window).scrollLeft())+b(d.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(d.containment=="document"?0:b(window).scrollTop())+(b(d.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]
}if(!/^(document|window|parent)$/.test(d.containment)&&d.containment.constructor!=Array){var g=b(d.containment),f=g[0];
if(!f){return}var c=g.offset(),e=b(f).css("overflow")!="hidden";this.containment=[(parseInt(b(f).css("borderLeftWidth"),10)||0)+(parseInt(b(f).css("paddingLeft"),10)||0),(parseInt(b(f).css("borderTopWidth"),10)||0)+(parseInt(b(f).css("paddingTop"),10)||0),(e?Math.max(f.scrollWidth,f.offsetWidth):f.offsetWidth)-(parseInt(b(f).css("borderLeftWidth"),10)||0)-(parseInt(b(f).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left-this.margins.right,(e?Math.max(f.scrollHeight,f.offsetHeight):f.offsetHeight)-(parseInt(b(f).css("borderTopWidth"),10)||0)-(parseInt(b(f).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top-this.margins.bottom],this.relative_container=g
}else{d.containment.constructor==Array&&(this.containment=d.containment)}},_convertPositionTo:function(d,h){h||(h=this.position);
var f=d=="absolute"?1:-1,c=this.options,e=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!b.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,g=/(html|body)/i.test(e[0].tagName);
return{top:h.top+this.offset.relative.top*f+this.offset.parent.top*f-(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():g?0:e.scrollTop())*f,left:h.left+this.offset.relative.left*f+this.offset.parent.left*f-(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():g?0:e.scrollLeft())*f}
},_generatePosition:function(p){var e=this.options,c=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!b.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,h=/(html|body)/i.test(c[0].tagName),q=p.pageX,d=p.pageY;
if(this.originalPosition){var m;if(this.containment){if(this.relative_container){var k=this.relative_container.offset();
m=[this.containment[0]+k.left,this.containment[1]+k.top,this.containment[2]+k.left,this.containment[3]+k.top]
}else{m=this.containment}p.pageX-this.offset.click.left<m[0]&&(q=m[0]+this.offset.click.left),p.pageY-this.offset.click.top<m[1]&&(d=m[1]+this.offset.click.top),p.pageX-this.offset.click.left>m[2]&&(q=m[2]+this.offset.click.left),p.pageY-this.offset.click.top>m[3]&&(d=m[3]+this.offset.click.top)
}if(e.grid){var j=e.grid[1]?this.originalPageY+Math.round((d-this.originalPageY)/e.grid[1])*e.grid[1]:this.originalPageY;
d=m?j-this.offset.click.top<m[1]||j-this.offset.click.top>m[3]?j-this.offset.click.top<m[1]?j+e.grid[1]:j-e.grid[1]:j:j;
var g=e.grid[0]?this.originalPageX+Math.round((q-this.originalPageX)/e.grid[0])*e.grid[0]:this.originalPageX;
q=m?g-this.offset.click.left<m[0]||g-this.offset.click.left>m[2]?g-this.offset.click.left<m[0]?g+e.grid[0]:g-e.grid[0]:g:g
}}return{top:d-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():h?0:c.scrollTop()),left:q-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():h?0:c.scrollLeft())}
},_clear:function(){this.helper.removeClass("ui-draggable-dragging"),this.helper[0]!=this.element[0]&&!this.cancelHelperRemoval&&this.helper.remove(),this.helper=null,this.cancelHelperRemoval=!1
},_trigger:function(c,e,d){return d=d||this._uiHash(),b.ui.plugin.call(this,c,[e,d]),c=="drag"&&(this.positionAbs=this._convertPositionTo("absolute")),b.Widget.prototype._trigger.call(this,c,e,d)
},plugins:{},_uiHash:function(c){return{helper:this.helper,position:this.position,originalPosition:this.originalPosition,offset:this.positionAbs}
}}),b.ui.plugin.add("draggable","connectToSortable",{start:function(d,g){var f=b(this).data("draggable"),c=f.options,e=b.extend({},g,{item:f.element});
f.sortables=[],b(c.connectToSortable).each(function(){var h=b.data(this,"sortable");
h&&!h.options.disabled&&(f.sortables.push({instance:h,shouldRevert:h.options.revert}),h.refreshPositions(),h._trigger("activate",d,e))
})},stop:function(d,f){var e=b(this).data("draggable"),c=b.extend({},f,{item:e.element});
b.each(e.sortables,function(){this.instance.isOver?(this.instance.isOver=0,e.cancelHelperRemoval=!0,this.instance.cancelHelperRemoval=!1,this.shouldRevert&&(this.instance.options.revert=!0),this.instance._mouseStop(d),this.instance.options.helper=this.instance.options._helper,e.options.helper=="original"&&this.instance.currentItem.css({top:"auto",left:"auto"})):(this.instance.cancelHelperRemoval=!1,this.instance._trigger("deactivate",d,c))
})},drag:function(d,g){var f=b(this).data("draggable"),c=this,e=function(v){var k=this.offset.click.top,h=this.offset.click.left,l=this.positionAbs.top,w=this.positionAbs.left,j=v.height,q=v.width,p=v.top,m=v.left;
return b.ui.isOver(l+k,w+h,p,m,j,q)};b.each(f.sortables,function(i){var j=!1,h=this;
this.instance.positionAbs=f.positionAbs,this.instance.helperProportions=f.helperProportions,this.instance.offset.click=f.offset.click,this.instance._intersectsWith(this.instance.containerCache)&&(j=!0,b.each(f.sortables,function(){return this.instance.positionAbs=f.positionAbs,this.instance.helperProportions=f.helperProportions,this.instance.offset.click=f.offset.click,this!=h&&this.instance._intersectsWith(this.instance.containerCache)&&b.ui.contains(h.instance.element[0],this.instance.element[0])&&(j=!1),j
})),j?(this.instance.isOver||(this.instance.isOver=1,this.instance.currentItem=b(c).clone().removeAttr("id").appendTo(this.instance.element).data("sortable-item",!0),this.instance.options._helper=this.instance.options.helper,this.instance.options.helper=function(){return g.helper[0]
},d.target=this.instance.currentItem[0],this.instance._mouseCapture(d,!0),this.instance._mouseStart(d,!0,!0),this.instance.offset.click.top=f.offset.click.top,this.instance.offset.click.left=f.offset.click.left,this.instance.offset.parent.left-=f.offset.parent.left-this.instance.offset.parent.left,this.instance.offset.parent.top-=f.offset.parent.top-this.instance.offset.parent.top,f._trigger("toSortable",d),f.dropped=this.instance.element,f.currentItem=f.element,this.instance.fromOutside=f),this.instance.currentItem&&this.instance._mouseDrag(d)):this.instance.isOver&&(this.instance.isOver=0,this.instance.cancelHelperRemoval=!0,this.instance.options.revert=!1,this.instance._trigger("out",d,this.instance._uiHash(this.instance)),this.instance._mouseStop(d,!0),this.instance.options.helper=this.instance.options._helper,this.instance.currentItem.remove(),this.instance.placeholder&&this.instance.placeholder.remove(),f._trigger("fromSortable",d),f.dropped=!1)
})}}),b.ui.plugin.add("draggable","cursor",{start:function(d,f){var e=b("body"),c=b(this).data("draggable").options;
e.css("cursor")&&(c._cursor=e.css("cursor")),e.css("cursor",c.cursor)},stop:function(c,e){var d=b(this).data("draggable").options;
d._cursor&&b("body").css("cursor",d._cursor)}}),b.ui.plugin.add("draggable","opacity",{start:function(d,f){var e=b(f.helper),c=b(this).data("draggable").options;
e.css("opacity")&&(c._opacity=e.css("opacity")),e.css("opacity",c.opacity)},stop:function(c,e){var d=b(this).data("draggable").options;
d._opacity&&b(e.helper).css("opacity",d._opacity)}}),b.ui.plugin.add("draggable","scroll",{start:function(c,e){var d=b(this).data("draggable");
d.scrollParent[0]!=document&&d.scrollParent[0].tagName!="HTML"&&(d.overflowOffset=d.scrollParent.offset())
},drag:function(d,g){var f=b(this).data("draggable"),c=f.options,e=!1;if(f.scrollParent[0]!=document&&f.scrollParent[0].tagName!="HTML"){if(!c.axis||c.axis!="x"){f.overflowOffset.top+f.scrollParent[0].offsetHeight-d.pageY<c.scrollSensitivity?f.scrollParent[0].scrollTop=e=f.scrollParent[0].scrollTop+c.scrollSpeed:d.pageY-f.overflowOffset.top<c.scrollSensitivity&&(f.scrollParent[0].scrollTop=e=f.scrollParent[0].scrollTop-c.scrollSpeed)
}if(!c.axis||c.axis!="y"){f.overflowOffset.left+f.scrollParent[0].offsetWidth-d.pageX<c.scrollSensitivity?f.scrollParent[0].scrollLeft=e=f.scrollParent[0].scrollLeft+c.scrollSpeed:d.pageX-f.overflowOffset.left<c.scrollSensitivity&&(f.scrollParent[0].scrollLeft=e=f.scrollParent[0].scrollLeft-c.scrollSpeed)
}}else{if(!c.axis||c.axis!="x"){d.pageY-b(document).scrollTop()<c.scrollSensitivity?e=b(document).scrollTop(b(document).scrollTop()-c.scrollSpeed):b(window).height()-(d.pageY-b(document).scrollTop())<c.scrollSensitivity&&(e=b(document).scrollTop(b(document).scrollTop()+c.scrollSpeed))
}if(!c.axis||c.axis!="y"){d.pageX-b(document).scrollLeft()<c.scrollSensitivity?e=b(document).scrollLeft(b(document).scrollLeft()-c.scrollSpeed):b(window).width()-(d.pageX-b(document).scrollLeft())<c.scrollSensitivity&&(e=b(document).scrollLeft(b(document).scrollLeft()+c.scrollSpeed))
}}e!==!1&&b.ui.ddmanager&&!c.dropBehaviour&&b.ui.ddmanager.prepareOffsets(f,d)}}),b.ui.plugin.add("draggable","snap",{start:function(d,f){var e=b(this).data("draggable"),c=e.options;
e.snapElements=[],b(c.snap.constructor!=String?c.snap.items||":data(draggable)":c.snap).each(function(){var g=b(this),h=g.offset();
this!=e.element[0]&&e.snapElements.push({item:this,width:g.outerWidth(),height:g.outerHeight(),top:h.top,left:h.left})
})},drag:function(q,B){var x=b(this).data("draggable"),E=x.options,w=E.snapTolerance,A=B.offset.left,k=A+x.helperProportions.width,L=B.offset.top,H=L+x.helperProportions.height;
for(var D=x.snapElements.length-1;D>=0;D--){var J=x.snapElements[D].left,F=J+x.snapElements[D].width,z=x.snapElements[D].top,I=z+x.snapElements[D].height;
if(!(J-w<A&&A<F+w&&z-w<L&&L<I+w||J-w<A&&A<F+w&&z-w<H&&H<I+w||J-w<k&&k<F+w&&z-w<L&&L<I+w||J-w<k&&k<F+w&&z-w<H&&H<I+w)){x.snapElements[D].snapping&&x.options.snap.release&&x.options.snap.release.call(x.element,q,b.extend(x._uiHash(),{snapItem:x.snapElements[D].item})),x.snapElements[D].snapping=!1;
continue}if(E.snapMode!="inner"){var j=Math.abs(z-H)<=w,C=Math.abs(I-L)<=w,G=Math.abs(J-k)<=w,e=Math.abs(F-A)<=w;
j&&(B.position.top=x._convertPositionTo("relative",{top:z-x.helperProportions.height,left:0}).top-x.margins.top),C&&(B.position.top=x._convertPositionTo("relative",{top:I,left:0}).top-x.margins.top),G&&(B.position.left=x._convertPositionTo("relative",{top:0,left:J-x.helperProportions.width}).left-x.margins.left),e&&(B.position.left=x._convertPositionTo("relative",{top:0,left:F}).left-x.margins.left)
}var K=j||C||G||e;if(E.snapMode!="outer"){var j=Math.abs(z-L)<=w,C=Math.abs(I-H)<=w,G=Math.abs(J-A)<=w,e=Math.abs(F-k)<=w;
j&&(B.position.top=x._convertPositionTo("relative",{top:z,left:0}).top-x.margins.top),C&&(B.position.top=x._convertPositionTo("relative",{top:I-x.helperProportions.height,left:0}).top-x.margins.top),G&&(B.position.left=x._convertPositionTo("relative",{top:0,left:J}).left-x.margins.left),e&&(B.position.left=x._convertPositionTo("relative",{top:0,left:F-x.helperProportions.width}).left-x.margins.left)
}!x.snapElements[D].snapping&&(j||C||G||e||K)&&x.options.snap.snap&&x.options.snap.snap.call(x.element,q,b.extend(x._uiHash(),{snapItem:x.snapElements[D].item})),x.snapElements[D].snapping=j||C||G||e||K
}}}),b.ui.plugin.add("draggable","stack",{start:function(d,g){var f=b(this).data("draggable").options,c=b.makeArray(b(f.stack)).sort(function(h,i){return(parseInt(b(h).css("zIndex"),10)||0)-(parseInt(b(i).css("zIndex"),10)||0)
});if(!c.length){return}var e=parseInt(c[0].style.zIndex)||0;b(c).each(function(h){this.style.zIndex=e+h
}),this[0].style.zIndex=e+c.length}}),b.ui.plugin.add("draggable","zIndex",{start:function(d,f){var e=b(f.helper),c=b(this).data("draggable").options;
e.css("zIndex")&&(c._zIndex=e.css("zIndex")),e.css("zIndex",c.zIndex)},stop:function(c,e){var d=b(this).data("draggable").options;
d._zIndex&&b(e.helper).css("zIndex",d._zIndex)}})}(jQuery),function(b,a){b.widget("ui.droppable",{version:"1.9.2",widgetEventPrefix:"drop",options:{accept:"*",activeClass:!1,addClasses:!0,greedy:!1,hoverClass:!1,scope:"default",tolerance:"intersect"},_create:function(){var c=this.options,d=c.accept;
this.isover=0,this.isout=1,this.accept=b.isFunction(d)?d:function(f){return f.is(d)
},this.proportions={width:this.element[0].offsetWidth,height:this.element[0].offsetHeight},b.ui.ddmanager.droppables[c.scope]=b.ui.ddmanager.droppables[c.scope]||[],b.ui.ddmanager.droppables[c.scope].push(this),c.addClasses&&this.element.addClass("ui-droppable")
},_destroy:function(){var c=b.ui.ddmanager.droppables[this.options.scope];for(var d=0;
d<c.length;d++){c[d]==this&&c.splice(d,1)}this.element.removeClass("ui-droppable ui-droppable-disabled")
},_setOption:function(c,d){c=="accept"&&(this.accept=b.isFunction(d)?d:function(f){return f.is(d)
}),b.Widget.prototype._setOption.apply(this,arguments)},_activate:function(c){var d=b.ui.ddmanager.current;
this.options.activeClass&&this.element.addClass(this.options.activeClass),d&&this._trigger("activate",c,this.ui(d))
},_deactivate:function(c){var d=b.ui.ddmanager.current;this.options.activeClass&&this.element.removeClass(this.options.activeClass),d&&this._trigger("deactivate",c,this.ui(d))
},_over:function(c){var d=b.ui.ddmanager.current;if(!d||(d.currentItem||d.element)[0]==this.element[0]){return
}this.accept.call(this.element[0],d.currentItem||d.element)&&(this.options.hoverClass&&this.element.addClass(this.options.hoverClass),this._trigger("over",c,this.ui(d)))
},_out:function(c){var d=b.ui.ddmanager.current;if(!d||(d.currentItem||d.element)[0]==this.element[0]){return
}this.accept.call(this.element[0],d.currentItem||d.element)&&(this.options.hoverClass&&this.element.removeClass(this.options.hoverClass),this._trigger("out",c,this.ui(d)))
},_drop:function(d,f){var e=f||b.ui.ddmanager.current;if(!e||(e.currentItem||e.element)[0]==this.element[0]){return !1
}var c=!1;return this.element.find(":data(droppable)").not(".ui-draggable-dragging").each(function(){var g=b.data(this,"droppable");
if(g.options.greedy&&!g.options.disabled&&g.options.scope==e.options.scope&&g.accept.call(g.element[0],e.currentItem||e.element)&&b.ui.intersect(e,b.extend(g,{offset:g.element.offset()}),g.options.tolerance)){return c=!0,!1
}}),c?!1:this.accept.call(this.element[0],e.currentItem||e.element)?(this.options.activeClass&&this.element.removeClass(this.options.activeClass),this.options.hoverClass&&this.element.removeClass(this.options.hoverClass),this._trigger("drop",d,this.ui(e)),this.element):!1
},ui:function(c){return{draggable:c.currentItem||c.element,helper:c.helper,position:c.position,offset:c.positionAbs}
}}),b.ui.intersect=function(B,k,e){if(!k.offset){return !1}var q=(B.positionAbs||B.position.absolute).left,C=q+B.helperProportions.width,j=(B.positionAbs||B.position.absolute).top,A=j+B.helperProportions.height,z=k.offset.left,w=z+k.proportions.width,m=k.offset.top,y=m+k.proportions.height;
switch(e){case"fit":return z<=q&&C<=w&&m<=j&&A<=y;case"intersect":return z<q+B.helperProportions.width/2&&C-B.helperProportions.width/2<w&&m<j+B.helperProportions.height/2&&A-B.helperProportions.height/2<y;
case"pointer":var v=(B.positionAbs||B.position.absolute).left+(B.clickOffset||B.offset.click).left,g=(B.positionAbs||B.position.absolute).top+(B.clickOffset||B.offset.click).top,x=b.ui.isOver(g,v,m,z,k.proportions.height,k.proportions.width);
return x;case"touch":return(j>=m&&j<=y||A>=m&&A<=y||j<m&&A>y)&&(q>=z&&q<=w||C>=z&&C<=w||q<z&&C>w);
default:return !1}},b.ui.ddmanager={current:null,droppables:{"default":[]},prepareOffsets:function(e,j){var g=b.ui.ddmanager.droppables[e.options.scope]||[],d=j?j.type:null,f=(e.currentItem||e.element).find(":data(droppable)").andSelf();
b:for(var h=0;h<g.length;h++){if(g[h].options.disabled||e&&!g[h].accept.call(g[h].element[0],e.currentItem||e.element)){continue
}for(var c=0;c<f.length;c++){if(f[c]==g[h].element[0]){g[h].proportions.height=0;
continue b}}g[h].visible=g[h].element.css("display")!="none";if(!g[h].visible){continue
}d=="mousedown"&&g[h]._activate.call(g[h],j),g[h].offset=g[h].element.offset(),g[h].proportions={width:g[h].element[0].offsetWidth,height:g[h].element[0].offsetHeight}
}},drop:function(c,e){var d=!1;return b.each(b.ui.ddmanager.droppables[c.options.scope]||[],function(){if(!this.options){return
}!this.options.disabled&&this.visible&&b.ui.intersect(c,this,this.options.tolerance)&&(d=this._drop.call(this,e)||d),!this.options.disabled&&this.visible&&this.accept.call(this.element[0],c.currentItem||c.element)&&(this.isout=1,this.isover=0,this._deactivate.call(this,e))
}),d},dragStart:function(c,d){c.element.parentsUntil("body").bind("scroll.droppable",function(){c.options.refreshPositions||b.ui.ddmanager.prepareOffsets(c,d)
})},drag:function(c,d){c.options.refreshPositions&&b.ui.ddmanager.prepareOffsets(c,d),b.each(b.ui.ddmanager.droppables[c.options.scope]||[],function(){if(this.options.disabled||this.greedyChild||!this.visible){return
}var h=b.ui.intersect(c,this,this.options.tolerance),f=!h&&this.isover==1?"isout":h&&this.isover==0?"isover":null;
if(!f){return}var g;if(this.options.greedy){var j=this.options.scope,e=this.element.parents(":data(droppable)").filter(function(){return b.data(this,"droppable").options.scope===j
});e.length&&(g=b.data(e[0],"droppable"),g.greedyChild=f=="isover"?1:0)}g&&f=="isover"&&(g.isover=0,g.isout=1,g._out.call(g,d)),this[f]=1,this[f=="isout"?"isover":"isout"]=0,this[f=="isover"?"_over":"_out"].call(this,d),g&&f=="isout"&&(g.isout=0,g.isover=1,g._over.call(g,d))
})},dragStop:function(c,d){c.element.parentsUntil("body").unbind("scroll.droppable"),c.options.refreshPositions||b.ui.ddmanager.prepareOffsets(c,d)
}}}(jQuery),function(c,a){c.widget("ui.resizable",c.ui.mouse,{version:"1.9.2",widgetEventPrefix:"resize",options:{alsoResize:!1,animate:!1,animateDuration:"slow",animateEasing:"swing",aspectRatio:!1,autoHide:!1,containment:!1,ghost:!1,grid:!1,handles:"e,s,se",helper:!1,maxHeight:null,maxWidth:null,minHeight:10,minWidth:10,zIndex:1000},_create:function(){var g=this,l=this.options;
this.element.addClass("ui-resizable"),c.extend(this,{_aspectRatio:!!l.aspectRatio,aspectRatio:l.aspectRatio,originalElement:this.element,_proportionallyResizeElements:[],_helper:l.helper||l.ghost||l.animate?l.helper||"ui-resizable-helper":null}),this.element[0].nodeName.match(/canvas|textarea|input|select|button|img/i)&&(this.element.wrap(c('<div class="ui-wrapper" style="overflow: hidden;"></div>').css({position:this.element.css("position"),width:this.element.outerWidth(),height:this.element.outerHeight(),top:this.element.css("top"),left:this.element.css("left")})),this.element=this.element.parent().data("resizable",this.element.data("resizable")),this.elementIsWrapper=!0,this.element.css({marginLeft:this.originalElement.css("marginLeft"),marginTop:this.originalElement.css("marginTop"),marginRight:this.originalElement.css("marginRight"),marginBottom:this.originalElement.css("marginBottom")}),this.originalElement.css({marginLeft:0,marginTop:0,marginRight:0,marginBottom:0}),this.originalResizeStyle=this.originalElement.css("resize"),this.originalElement.css("resize","none"),this._proportionallyResizeElements.push(this.originalElement.css({position:"static",zoom:1,display:"block"})),this.originalElement.css({margin:this.originalElement.css("margin")}),this._proportionallyResize()),this.handles=l.handles||(c(".ui-resizable-handle",this.element).length?{n:".ui-resizable-n",e:".ui-resizable-e",s:".ui-resizable-s",w:".ui-resizable-w",se:".ui-resizable-se",sw:".ui-resizable-sw",ne:".ui-resizable-ne",nw:".ui-resizable-nw"}:"e,s,se");
if(this.handles.constructor==String){this.handles=="all"&&(this.handles="n,e,s,w,se,sw,ne,nw");
var j=this.handles.split(",");this.handles={};for(var f=0;f<j.length;f++){var h=c.trim(j[f]),k="ui-resizable-"+h,e=c('<div class="ui-resizable-handle '+k+'"></div>');
e.css({zIndex:l.zIndex}),"se"==h&&e.addClass("ui-icon ui-icon-gripsmall-diagonal-se"),this.handles[h]=".ui-resizable-"+h,this.element.append(e)
}}this._renderAxis=function(o){o=o||this.element;for(var u in this.handles){this.handles[u].constructor==String&&(this.handles[u]=c(this.handles[u],this.element).show());
if(this.elementIsWrapper&&this.originalElement[0].nodeName.match(/textarea|input|select|button/i)){var q=c(this.handles[u],this.element),m=0;
m=/sw|ne|nw|se|n|s/.test(u)?q.outerHeight():q.outerWidth();var p=["padding",/ne|nw|n/.test(u)?"Top":/se|sw|s/.test(u)?"Bottom":/^e$/.test(u)?"Right":"Left"].join("");
o.css(p,m),this._proportionallyResize()}if(!c(this.handles[u]).length){continue}}},this._renderAxis(this.element),this._handles=c(".ui-resizable-handle",this.element).disableSelection(),this._handles.mouseover(function(){if(!g.resizing){if(this.className){var i=this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i)
}g.axis=i&&i[1]?i[1]:"se"}}),l.autoHide&&(this._handles.hide(),c(this.element).addClass("ui-resizable-autohide").mouseenter(function(){if(l.disabled){return
}c(this).removeClass("ui-resizable-autohide"),g._handles.show()}).mouseleave(function(){if(l.disabled){return
}g.resizing||(c(this).addClass("ui-resizable-autohide"),g._handles.hide())})),this._mouseInit()
},_destroy:function(){this._mouseDestroy();var e=function(g){c(g).removeClass("ui-resizable ui-resizable-disabled ui-resizable-resizing").removeData("resizable").removeData("ui-resizable").unbind(".resizable").find(".ui-resizable-handle").remove()
};if(this.elementIsWrapper){e(this.element);var f=this.element;this.originalElement.css({position:f.css("position"),width:f.outerWidth(),height:f.outerHeight(),top:f.css("top"),left:f.css("left")}).insertAfter(f),f.remove()
}return this.originalElement.css("resize",this.originalResizeStyle),e(this.originalElement),this
},_mouseCapture:function(e){var g=!1;for(var f in this.handles){c(this.handles[f])[0]==e.target&&(g=!0)
}return !this.options.disabled&&g},_mouseStart:function(h){var k=this.options,g=this.element.position(),j=this.element;
this.resizing=!0,this.documentScroll={top:c(document).scrollTop(),left:c(document).scrollLeft()},(j.is(".ui-draggable")||/absolute/.test(j.css("position")))&&j.css({position:"absolute",top:g.top,left:g.left}),this._renderProxy();
var l=d(this.helper.css("left")),f=d(this.helper.css("top"));k.containment&&(l+=c(k.containment).scrollLeft()||0,f+=c(k.containment).scrollTop()||0),this.offset=this.helper.offset(),this.position={left:l,top:f},this.size=this._helper?{width:j.outerWidth(),height:j.outerHeight()}:{width:j.width(),height:j.height()},this.originalSize=this._helper?{width:j.outerWidth(),height:j.outerHeight()}:{width:j.width(),height:j.height()},this.originalPosition={left:l,top:f},this.sizeDiff={width:j.outerWidth()-j.width(),height:j.outerHeight()-j.height()},this.originalMousePosition={left:h.pageX,top:h.pageY},this.aspectRatio=typeof k.aspectRatio=="number"?k.aspectRatio:this.originalSize.width/this.originalSize.height||1;
var e=c(".ui-resizable-"+this.axis).css("cursor");return c("body").css("cursor",e=="auto"?this.axis+"-resize":e),j.addClass("ui-resizable-resizing"),this._propagate("start",h),!0
},_mouseDrag:function(q){var x=this.helper,j=this.options,g={},m=this,y=this.originalMousePosition,h=this.axis,w=q.pageX-y.left||0,v=q.pageY-y.top||0,p=this._change[h];
if(!p){return !1}var k=p.apply(this,[q,w,v]);this._updateVirtualBoundaries(q.shiftKey);
if(this._aspectRatio||q.shiftKey){k=this._updateRatio(k,q)}return k=this._respectSize(k,q),this._propagate("resize",q),x.css({top:this.position.top+"px",left:this.position.left+"px",width:this.size.width+"px",height:this.size.height+"px"}),!this._helper&&this._proportionallyResizeElements.length&&this._proportionallyResize(),this._updateCache(k),this._trigger("resize",q,this.ui()),!1
},_mouseStop:function(v){this.resizing=!1;var h=this.options,e=this;if(this._helper){var k=this._proportionallyResizeElements,w=k.length&&/textarea/i.test(k[0].nodeName),g=w&&c.ui.hasScroll(k[0],"left")?0:e.sizeDiff.height,q=w?0:e.sizeDiff.width,p={width:e.helper.width()-q,height:e.helper.height()-g},m=parseInt(e.element.css("left"),10)+(e.position.left-e.originalPosition.left)||null,j=parseInt(e.element.css("top"),10)+(e.position.top-e.originalPosition.top)||null;
h.animate||this.element.css(c.extend(p,{top:j,left:m})),e.helper.height(e.size.height),e.helper.width(e.size.width),this._helper&&!h.animate&&this._proportionallyResize()
}return c("body").css("cursor","auto"),this.element.removeClass("ui-resizable-resizing"),this._propagate("stop",v),this._helper&&this.helper.remove(),!1
},_updateVirtualBoundaries:function(k){var h=this.options,m,g,j,l,f;f={minWidth:b(h.minWidth)?h.minWidth:0,maxWidth:b(h.maxWidth)?h.maxWidth:Infinity,minHeight:b(h.minHeight)?h.minHeight:0,maxHeight:b(h.maxHeight)?h.maxHeight:Infinity};
if(this._aspectRatio||k){m=f.minHeight*this.aspectRatio,j=f.minWidth/this.aspectRatio,g=f.maxHeight*this.aspectRatio,l=f.maxWidth/this.aspectRatio,m>f.minWidth&&(f.minWidth=m),j>f.minHeight&&(f.minHeight=j),g<f.maxWidth&&(f.maxWidth=g),l<f.maxHeight&&(f.maxHeight=l)
}this._vBoundaries=f},_updateCache:function(g){var f=this.options;this.offset=this.helper.offset(),b(g.left)&&(this.position.left=g.left),b(g.top)&&(this.position.top=g.top),b(g.height)&&(this.size.height=g.height),b(g.width)&&(this.size.width=g.width)
},_updateRatio:function(j,g){var l=this.options,f=this.position,h=this.size,k=this.axis;
return b(j.height)?j.width=j.height*this.aspectRatio:b(j.width)&&(j.height=j.width/this.aspectRatio),k=="sw"&&(j.left=f.left+(h.width-j.width),j.top=null),k=="nw"&&(j.top=f.top+(h.height-j.height),j.left=f.left+(h.width-j.width)),j
},_respectSize:function(x,D){var k=this.helper,q=this._vBoundaries,E=this._aspectRatio||D.shiftKey,j=this.axis,C=b(x.width)&&q.maxWidth&&q.maxWidth<x.width,A=b(x.height)&&q.maxHeight&&q.maxHeight<x.height,w=b(x.width)&&q.minWidth&&q.minWidth>x.width,m=b(x.height)&&q.minHeight&&q.minHeight>x.height;
w&&(x.width=q.minWidth),m&&(x.height=q.minHeight),C&&(x.width=q.maxWidth),A&&(x.height=q.maxHeight);
var z=this.originalPosition.left+this.originalSize.width,r=this.position.top+this.size.height,g=/sw|nw|w/.test(j),y=/nw|ne|n/.test(j);
w&&g&&(x.left=z-q.minWidth),C&&g&&(x.left=z-q.maxWidth),m&&y&&(x.top=r-q.minHeight),A&&y&&(x.top=r-q.maxHeight);
var B=!x.width&&!x.height;return B&&!x.left&&x.top?x.top=null:B&&!x.top&&x.left&&(x.left=null),x
},_proportionallyResize:function(){var f=this.options;if(!this._proportionallyResizeElements.length){return
}var k=this.helper||this.element;for(var h=0;h<this._proportionallyResizeElements.length;
h++){var e=this._proportionallyResizeElements[h];if(!this.borderDif){var g=[e.css("borderTopWidth"),e.css("borderRightWidth"),e.css("borderBottomWidth"),e.css("borderLeftWidth")],j=[e.css("paddingTop"),e.css("paddingRight"),e.css("paddingBottom"),e.css("paddingLeft")];
this.borderDif=c.map(g,function(m,i){var o=parseInt(m,10)||0,l=parseInt(j[i],10)||0;
return o+l})}e.css({height:k.height()-this.borderDif[0]-this.borderDif[2]||0,width:k.width()-this.borderDif[1]-this.borderDif[3]||0})
}},_renderProxy:function(){var f=this.element,h=this.options;this.elementOffset=f.offset();
if(this._helper){this.helper=this.helper||c('<div style="overflow:hidden;"></div>');
var g=c.ui.ie6?1:0,e=c.ui.ie6?2:-1;this.helper.addClass(this._helper).css({width:this.element.outerWidth()+e,height:this.element.outerHeight()+e,position:"absolute",left:this.elementOffset.left-g+"px",top:this.elementOffset.top-g+"px",zIndex:++h.zIndex}),this.helper.appendTo("body").disableSelection()
}else{this.helper=this.element}},_change:{e:function(g,f,h){return{width:this.originalSize.width+f}
},w:function(k,g,l){var j=this.options,f=this.originalSize,h=this.originalPosition;
return{left:h.left+g,width:f.width-g}},n:function(k,g,l){var j=this.options,f=this.originalSize,h=this.originalPosition;
return{top:h.top+l,height:f.height-l}},s:function(g,f,h){return{height:this.originalSize.height+h}
},se:function(e,g,f){return c.extend(this._change.s.apply(this,arguments),this._change.e.apply(this,[e,g,f]))
},sw:function(e,g,f){return c.extend(this._change.s.apply(this,arguments),this._change.w.apply(this,[e,g,f]))
},ne:function(e,g,f){return c.extend(this._change.n.apply(this,arguments),this._change.e.apply(this,[e,g,f]))
},nw:function(e,g,f){return c.extend(this._change.n.apply(this,arguments),this._change.w.apply(this,[e,g,f]))
}},_propagate:function(e,f){c.ui.plugin.call(this,e,[f,this.ui()]),e!="resize"&&this._trigger(e,f,this.ui())
},plugins:{},ui:function(){return{originalElement:this.originalElement,element:this.element,helper:this.helper,position:this.position,size:this.size,originalSize:this.originalSize,originalPosition:this.originalPosition}
}}),c.ui.plugin.add("resizable","alsoResize",{start:function(f,j){var h=c(this).data("resizable"),e=h.options,g=function(i){c(i).each(function(){var k=c(this);
k.data("resizable-alsoresize",{width:parseInt(k.width(),10),height:parseInt(k.height(),10),left:parseInt(k.css("left"),10),top:parseInt(k.css("top"),10)})
})};typeof e.alsoResize=="object"&&!e.alsoResize.parentNode?e.alsoResize.length?(e.alsoResize=e.alsoResize[0],g(e.alsoResize)):c.each(e.alsoResize,function(i){g(i)
}):g(e.alsoResize)},resize:function(h,m){var k=c(this).data("resizable"),g=k.options,j=k.originalSize,l=k.originalPosition,f={height:k.size.height-j.height||0,width:k.size.width-j.width||0,top:k.position.top-l.top||0,left:k.position.left-l.left||0},e=function(i,n){c(i).each(function(){var q=c(this),p=c(this).data("resizable-alsoresize"),r={},u=n&&n.length?n:q.parents(m.originalElement[0]).length?["width","height"]:["width","height","top","left"];
c.each(u,function(s,o){var v=(p[o]||0)+(f[o]||0);v&&v>=0&&(r[o]=v||null)}),q.css(r)
})};typeof g.alsoResize=="object"&&!g.alsoResize.nodeType?c.each(g.alsoResize,function(n,i){e(n,i)
}):e(g.alsoResize)},stop:function(e,f){c(this).removeData("resizable-alsoresize")
}}),c.ui.plugin.add("resizable","animate",{stop:function(w,h){var e=c(this).data("resizable"),k=e.options,x=e._proportionallyResizeElements,g=x.length&&/textarea/i.test(x[0].nodeName),v=g&&c.ui.hasScroll(x[0],"left")?0:e.sizeDiff.height,q=g?0:e.sizeDiff.width,m={width:e.size.width-q,height:e.size.height-v},j=parseInt(e.element.css("left"),10)+(e.position.left-e.originalPosition.left)||null,p=parseInt(e.element.css("top"),10)+(e.position.top-e.originalPosition.top)||null;
e.element.animate(c.extend(m,p&&j?{top:p,left:j}:{}),{duration:k.animateDuration,easing:k.animateEasing,step:function(){var f={width:parseInt(e.element.css("width"),10),height:parseInt(e.element.css("height"),10),top:parseInt(e.element.css("top"),10),left:parseInt(e.element.css("left"),10)};
x&&x.length&&c(x[0]).css({width:f.width,height:f.height}),e._updateCache(f),e._propagate("resize",w)
}})}}),c.ui.plugin.add("resizable","containment",{start:function(B,e){var m=c(this).data("resizable"),C=m.options,j=m.element,A=C.containment,y=A instanceof c?A.get(0):/parent/.test(A)?j.parent().get(0):A;
if(!y){return}m.containerElement=c(y);if(/document/.test(A)||A==document){m.containerOffset={left:0,top:0},m.containerPosition={left:0,top:0},m.parentData={element:c(document),left:0,top:0,width:c(document).width(),height:c(document).height()||document.body.parentNode.scrollHeight}
}else{var q=c(y),k=[];c(["Top","Right","Left","Bottom"]).each(function(h,f){k[h]=d(q.css("padding"+f))
}),m.containerOffset=q.offset(),m.containerPosition=q.position(),m.containerSize={height:q.innerHeight()-k[3],width:q.innerWidth()-k[1]};
var x=m.containerOffset,n=m.containerSize.height,g=m.containerSize.width,w=c.ui.hasScroll(y,"left")?y.scrollWidth:g,z=c.ui.hasScroll(y)?y.scrollHeight:n;
m.parentData={element:y,left:x.left,top:x.top,width:w,height:z}}},resize:function(D,k){var e=c(this).data("resizable"),q=e.options,E=e.containerSize,j=e.containerOffset,C=e.size,A=e.position,x=e._aspectRatio||D.shiftKey,m={top:0,left:0},z=e.containerElement;
z[0]!=document&&/static/.test(z.css("position"))&&(m=j),A.left<(e._helper?j.left:0)&&(e.size.width=e.size.width+(e._helper?e.position.left-j.left:e.position.left-m.left),x&&(e.size.height=e.size.width/e.aspectRatio),e.position.left=q.helper?j.left:0),A.top<(e._helper?j.top:0)&&(e.size.height=e.size.height+(e._helper?e.position.top-j.top:e.position.top),x&&(e.size.width=e.size.height*e.aspectRatio),e.position.top=e._helper?j.top:0),e.offset.left=e.parentData.left+e.position.left,e.offset.top=e.parentData.top+e.position.top;
var w=Math.abs((e._helper?e.offset.left-m.left:e.offset.left-m.left)+e.sizeDiff.width),g=Math.abs((e._helper?e.offset.top-m.top:e.offset.top-j.top)+e.sizeDiff.height),y=e.containerElement.get(0)==e.element.parent().get(0),B=/relative|absolute/.test(e.containerElement.css("position"));
y&&B&&(w-=e.parentData.left),w+e.size.width>=e.parentData.width&&(e.size.width=e.parentData.width-w,x&&(e.size.height=e.size.width/e.aspectRatio)),g+e.size.height>=e.parentData.height&&(e.size.height=e.parentData.height-g,x&&(e.size.width=e.size.height*e.aspectRatio))
},stop:function(y,j){var e=c(this).data("resizable"),m=e.options,z=e.position,g=e.containerOffset,x=e.containerPosition,w=e.containerElement,q=c(e.helper),k=q.offset(),v=q.outerWidth()-e.sizeDiff.width,p=q.outerHeight()-e.sizeDiff.height;
e._helper&&!m.animate&&/relative/.test(w.css("position"))&&c(this).css({left:k.left-x.left-g.left,width:v,height:p}),e._helper&&!m.animate&&/static/.test(w.css("position"))&&c(this).css({left:k.left-x.left-g.left,width:v,height:p})
}}),c.ui.plugin.add("resizable","ghost",{start:function(f,j){var h=c(this).data("resizable"),e=h.options,g=h.size;
h.ghost=h.originalElement.clone(),h.ghost.css({opacity:0.25,display:"block",position:"relative",height:g.height,width:g.width,margin:0,left:0,top:0}).addClass("ui-resizable-ghost").addClass(typeof e.ghost=="string"?e.ghost:""),h.ghost.appendTo(h.helper)
},resize:function(f,h){var g=c(this).data("resizable"),e=g.options;g.ghost&&g.ghost.css({position:"relative",height:g.size.height,width:g.size.width})
},stop:function(f,h){var g=c(this).data("resizable"),e=g.options;g.ghost&&g.helper&&g.helper.get(0).removeChild(g.ghost.get(0))
}}),c.ui.plugin.add("resizable","grid",{resize:function(w,h){var e=c(this).data("resizable"),k=e.options,x=e.size,g=e.originalSize,v=e.originalPosition,q=e.axis,m=k._aspectRatio||w.shiftKey;
k.grid=typeof k.grid=="number"?[k.grid,k.grid]:k.grid;var j=Math.round((x.width-g.width)/(k.grid[0]||1))*(k.grid[0]||1),p=Math.round((x.height-g.height)/(k.grid[1]||1))*(k.grid[1]||1);
/^(se|s|e)$/.test(q)?(e.size.width=g.width+j,e.size.height=g.height+p):/^(ne)$/.test(q)?(e.size.width=g.width+j,e.size.height=g.height+p,e.position.top=v.top-p):/^(sw)$/.test(q)?(e.size.width=g.width+j,e.size.height=g.height+p,e.position.left=v.left-j):(e.size.width=g.width+j,e.size.height=g.height+p,e.position.top=v.top-p,e.position.left=v.left-j)
}});var d=function(f){return parseInt(f,10)||0},b=function(f){return !isNaN(parseInt(f,10))
}}(jQuery),function(b,a){b.widget("ui.selectable",b.ui.mouse,{version:"1.9.2",options:{appendTo:"body",autoRefresh:!0,distance:0,filter:"*",tolerance:"touch"},_create:function(){var c=this;
this.element.addClass("ui-selectable"),this.dragged=!1;var d;this.refresh=function(){d=b(c.options.filter,c.element[0]),d.addClass("ui-selectee"),d.each(function(){var e=b(this),f=e.offset();
b.data(this,"selectable-item",{element:this,$element:e,left:f.left,top:f.top,right:f.left+e.outerWidth(),bottom:f.top+e.outerHeight(),startselected:!1,selected:e.hasClass("ui-selected"),selecting:e.hasClass("ui-selecting"),unselecting:e.hasClass("ui-unselecting")})
})},this.refresh(),this.selectees=d.addClass("ui-selectee"),this._mouseInit(),this.helper=b("<div class='ui-selectable-helper'></div>")
},_destroy:function(){this.selectees.removeClass("ui-selectee").removeData("selectable-item"),this.element.removeClass("ui-selectable ui-selectable-disabled"),this._mouseDestroy()
},_mouseStart:function(c){var e=this;this.opos=[c.pageX,c.pageY];if(this.options.disabled){return
}var d=this.options;this.selectees=b(d.filter,this.element[0]),this._trigger("start",c),b(d.appendTo).append(this.helper),this.helper.css({left:c.clientX,top:c.clientY,width:0,height:0}),d.autoRefresh&&this.refresh(),this.selectees.filter(".ui-selected").each(function(){var f=b.data(this,"selectable-item");
f.startselected=!0,!c.metaKey&&!c.ctrlKey&&(f.$element.removeClass("ui-selected"),f.selected=!1,f.$element.addClass("ui-unselecting"),f.unselecting=!0,e._trigger("unselecting",c,{unselecting:f.element}))
}),b(c.target).parents().andSelf().each(function(){var g=b.data(this,"selectable-item");
if(g){var f=!c.metaKey&&!c.ctrlKey||!g.$element.hasClass("ui-selected");return g.$element.removeClass(f?"ui-unselecting":"ui-selected").addClass(f?"ui-selecting":"ui-unselecting"),g.unselecting=!f,g.selecting=f,g.selected=f,f?e._trigger("selecting",c,{selecting:g.element}):e._trigger("unselecting",c,{unselecting:g.element}),!1
}})},_mouseDrag:function(f){var k=this;this.dragged=!0;if(this.options.disabled){return
}var h=this.options,e=this.opos[0],g=this.opos[1],j=f.pageX,d=f.pageY;if(e>j){var c=j;
j=e,e=c}if(g>d){var c=d;d=g,g=c}return this.helper.css({left:e,top:g,width:j-e,height:d-g}),this.selectees.each(function(){var i=b.data(this,"selectable-item");
if(!i||i.element==k.element[0]){return}var l=!1;h.tolerance=="touch"?l=!(i.left>j||i.right<e||i.top>d||i.bottom<g):h.tolerance=="fit"&&(l=i.left>e&&i.right<j&&i.top>g&&i.bottom<d),l?(i.selected&&(i.$element.removeClass("ui-selected"),i.selected=!1),i.unselecting&&(i.$element.removeClass("ui-unselecting"),i.unselecting=!1),i.selecting||(i.$element.addClass("ui-selecting"),i.selecting=!0,k._trigger("selecting",f,{selecting:i.element}))):(i.selecting&&((f.metaKey||f.ctrlKey)&&i.startselected?(i.$element.removeClass("ui-selecting"),i.selecting=!1,i.$element.addClass("ui-selected"),i.selected=!0):(i.$element.removeClass("ui-selecting"),i.selecting=!1,i.startselected&&(i.$element.addClass("ui-unselecting"),i.unselecting=!0),k._trigger("unselecting",f,{unselecting:i.element}))),i.selected&&!f.metaKey&&!f.ctrlKey&&!i.startselected&&(i.$element.removeClass("ui-selected"),i.selected=!1,i.$element.addClass("ui-unselecting"),i.unselecting=!0,k._trigger("unselecting",f,{unselecting:i.element})))
}),!1},_mouseStop:function(c){var e=this;this.dragged=!1;var d=this.options;return b(".ui-unselecting",this.element[0]).each(function(){var f=b.data(this,"selectable-item");
f.$element.removeClass("ui-unselecting"),f.unselecting=!1,f.startselected=!1,e._trigger("unselected",c,{unselected:f.element})
}),b(".ui-selecting",this.element[0]).each(function(){var f=b.data(this,"selectable-item");
f.$element.removeClass("ui-selecting").addClass("ui-selected"),f.selecting=!1,f.selected=!0,f.startselected=!0,e._trigger("selected",c,{selected:f.element})
}),this._trigger("stop",c),this.helper.remove(),!1}})}(jQuery),function(b,a){b.widget("ui.sortable",b.ui.mouse,{version:"1.9.2",widgetEventPrefix:"sort",ready:!1,options:{appendTo:"parent",axis:!1,connectWith:!1,containment:!1,cursor:"auto",cursorAt:!1,dropOnEmpty:!0,forcePlaceholderSize:!1,forceHelperSize:!1,grid:!1,handle:!1,helper:"original",items:"> *",opacity:!1,placeholder:!1,revert:!1,scroll:!0,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1000},_create:function(){var c=this.options;
this.containerCache={},this.element.addClass("ui-sortable"),this.refresh(),this.floating=this.items.length?c.axis==="x"||/left|right/.test(this.items[0].item.css("float"))||/inline|table-cell/.test(this.items[0].item.css("display")):!1,this.offset=this.element.offset(),this._mouseInit(),this.ready=!0
},_destroy:function(){this.element.removeClass("ui-sortable ui-sortable-disabled"),this._mouseDestroy();
for(var c=this.items.length-1;c>=0;c--){this.items[c].item.removeData(this.widgetName+"-item")
}return this},_setOption:function(c,d){c==="disabled"?(this.options[c]=d,this.widget().toggleClass("ui-sortable-disabled",!!d)):b.Widget.prototype._setOption.apply(this,arguments)
},_mouseCapture:function(d,h){var f=this;if(this.reverting){return !1}if(this.options.disabled||this.options.type=="static"){return !1
}this._refreshItems(d);var c=null,e=b(d.target).parents().each(function(){if(b.data(this,f.widgetName+"-item")==f){return c=b(this),!1
}});b.data(d.target,f.widgetName+"-item")==f&&(c=b(d.target));if(!c){return !1}if(this.options.handle&&!h){var g=!1;
b(this.options.handle,c).find("*").andSelf().each(function(){this==d.target&&(g=!0)
});if(!g){return !1}}return this.currentItem=c,this._removeCurrentsFromItems(),!0
},_mouseStart:function(d,g,f){var c=this.options;this.currentContainer=this,this.refreshPositions(),this.helper=this._createHelper(d),this._cacheHelperProportions(),this._cacheMargins(),this.scrollParent=this.helper.scrollParent(),this.offset=this.currentItem.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},b.extend(this.offset,{click:{left:d.pageX-this.offset.left,top:d.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.helper.css("position","absolute"),this.cssPosition=this.helper.css("position"),this.originalPosition=this._generatePosition(d),this.originalPageX=d.pageX,this.originalPageY=d.pageY,c.cursorAt&&this._adjustOffsetFromHelper(c.cursorAt),this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]},this.helper[0]!=this.currentItem[0]&&this.currentItem.hide(),this._createPlaceholder(),c.containment&&this._setContainment(),c.cursor&&(b("body").css("cursor")&&(this._storedCursor=b("body").css("cursor")),b("body").css("cursor",c.cursor)),c.opacity&&(this.helper.css("opacity")&&(this._storedOpacity=this.helper.css("opacity")),this.helper.css("opacity",c.opacity)),c.zIndex&&(this.helper.css("zIndex")&&(this._storedZIndex=this.helper.css("zIndex")),this.helper.css("zIndex",c.zIndex)),this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"&&(this.overflowOffset=this.scrollParent.offset()),this._trigger("start",d,this._uiHash()),this._preserveHelperProportions||this._cacheHelperProportions();
if(!f){for(var e=this.containers.length-1;e>=0;e--){this.containers[e]._trigger("activate",d,this._uiHash(this))
}}return b.ui.ddmanager&&(b.ui.ddmanager.current=this),b.ui.ddmanager&&!c.dropBehaviour&&b.ui.ddmanager.prepareOffsets(this,d),this.dragging=!0,this.helper.addClass("ui-sortable-helper"),this._mouseDrag(d),!0
},_mouseDrag:function(e){this.position=this._generatePosition(e),this.positionAbs=this._convertPositionTo("absolute"),this.lastPositionAbs||(this.lastPositionAbs=this.positionAbs);
if(this.options.scroll){var j=this.options,g=!1;this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"?(this.overflowOffset.top+this.scrollParent[0].offsetHeight-e.pageY<j.scrollSensitivity?this.scrollParent[0].scrollTop=g=this.scrollParent[0].scrollTop+j.scrollSpeed:e.pageY-this.overflowOffset.top<j.scrollSensitivity&&(this.scrollParent[0].scrollTop=g=this.scrollParent[0].scrollTop-j.scrollSpeed),this.overflowOffset.left+this.scrollParent[0].offsetWidth-e.pageX<j.scrollSensitivity?this.scrollParent[0].scrollLeft=g=this.scrollParent[0].scrollLeft+j.scrollSpeed:e.pageX-this.overflowOffset.left<j.scrollSensitivity&&(this.scrollParent[0].scrollLeft=g=this.scrollParent[0].scrollLeft-j.scrollSpeed)):(e.pageY-b(document).scrollTop()<j.scrollSensitivity?g=b(document).scrollTop(b(document).scrollTop()-j.scrollSpeed):b(window).height()-(e.pageY-b(document).scrollTop())<j.scrollSensitivity&&(g=b(document).scrollTop(b(document).scrollTop()+j.scrollSpeed)),e.pageX-b(document).scrollLeft()<j.scrollSensitivity?g=b(document).scrollLeft(b(document).scrollLeft()-j.scrollSpeed):b(window).width()-(e.pageX-b(document).scrollLeft())<j.scrollSensitivity&&(g=b(document).scrollLeft(b(document).scrollLeft()+j.scrollSpeed))),g!==!1&&b.ui.ddmanager&&!j.dropBehaviour&&b.ui.ddmanager.prepareOffsets(this,e)
}this.positionAbs=this._convertPositionTo("absolute");if(!this.options.axis||this.options.axis!="y"){this.helper[0].style.left=this.position.left+"px"
}if(!this.options.axis||this.options.axis!="x"){this.helper[0].style.top=this.position.top+"px"
}for(var d=this.items.length-1;d>=0;d--){var f=this.items[d],h=f.item[0],c=this._intersectsWithPointer(f);
if(!c){continue}if(f.instance!==this.currentContainer){continue}if(h!=this.currentItem[0]&&this.placeholder[c==1?"next":"prev"]()[0]!=h&&!b.contains(this.placeholder[0],h)&&(this.options.type=="semi-dynamic"?!b.contains(this.element[0],h):!0)){this.direction=c==1?"down":"up";
if(this.options.tolerance!="pointer"&&!this._intersectsWithSides(f)){break}this._rearrange(e,f),this._trigger("change",e,this._uiHash());
break}}return this._contactContainers(e),b.ui.ddmanager&&b.ui.ddmanager.drag(this,e),this._trigger("sort",e,this._uiHash()),this.lastPositionAbs=this.positionAbs,!1
},_mouseStop:function(d,f){if(!d){return}b.ui.ddmanager&&!this.options.dropBehaviour&&b.ui.ddmanager.drop(this,d);
if(this.options.revert){var e=this,c=this.placeholder.offset();this.reverting=!0,b(this.helper).animate({left:c.left-this.offset.parent.left-this.margins.left+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollLeft),top:c.top-this.offset.parent.top-this.margins.top+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollTop)},parseInt(this.options.revert,10)||500,function(){e._clear(d)
})}else{this._clear(d,f)}return !1},cancel:function(){if(this.dragging){this._mouseUp({target:null}),this.options.helper=="original"?this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper"):this.currentItem.show();
for(var c=this.containers.length-1;c>=0;c--){this.containers[c]._trigger("deactivate",null,this._uiHash(this)),this.containers[c].containerCache.over&&(this.containers[c]._trigger("out",null,this._uiHash(this)),this.containers[c].containerCache.over=0)
}}return this.placeholder&&(this.placeholder[0].parentNode&&this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.options.helper!="original"&&this.helper&&this.helper[0].parentNode&&this.helper.remove(),b.extend(this,{helper:null,dragging:!1,reverting:!1,_noFinalSort:null}),this.domPosition.prev?b(this.domPosition.prev).after(this.currentItem):b(this.domPosition.parent).prepend(this.currentItem)),this
},serialize:function(c){var e=this._getItemsAsjQuery(c&&c.connected),d=[];return c=c||{},b(e).each(function(){var f=(b(c.item||this).attr(c.attribute||"id")||"").match(c.expression||/(.+)[-=_](.+)/);
f&&d.push((c.key||f[1]+"[]")+"="+(c.key&&c.expression?f[1]:f[2]))}),!d.length&&c.key&&d.push(c.key+"="),d.join("&")
},toArray:function(c){var e=this._getItemsAsjQuery(c&&c.connected),d=[];return c=c||{},e.each(function(){d.push(b(c.item||this).attr(c.attribute||"id")||"")
}),d},_intersectsWith:function(p){var x=this.positionAbs.left,h=x+this.helperProportions.width,d=this.positionAbs.top,k=d+this.helperProportions.height,y=p.left,g=y+p.width,w=p.top,v=w+p.height,m=this.offset.click.top,j=this.offset.click.left,q=d+m>w&&d+m<v&&x+j>y&&x+j<g;
return this.options.tolerance=="pointer"||this.options.forcePointerForContainers||this.options.tolerance!="pointer"&&this.helperProportions[this.floating?"width":"height"]>p[this.floating?"width":"height"]?q:y<x+this.helperProportions.width/2&&h-this.helperProportions.width/2<g&&w<d+this.helperProportions.height/2&&k-this.helperProportions.height/2<v
},_intersectsWithPointer:function(d){var h=this.options.axis==="x"||b.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,d.top,d.height),f=this.options.axis==="y"||b.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,d.left,d.width),c=h&&f,e=this._getDragVerticalDirection(),g=this._getDragHorizontalDirection();
return c?this.floating?g&&g=="right"||e=="down"?2:1:e&&(e=="down"?2:1):!1},_intersectsWithSides:function(d){var g=b.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,d.top+d.height/2,d.height),f=b.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,d.left+d.width/2,d.width),c=this._getDragVerticalDirection(),e=this._getDragHorizontalDirection();
return this.floating&&e?e=="right"&&f||e=="left"&&!f:c&&(c=="down"&&g||c=="up"&&!g)
},_getDragVerticalDirection:function(){var c=this.positionAbs.top-this.lastPositionAbs.top;
return c!=0&&(c>0?"down":"up")},_getDragHorizontalDirection:function(){var c=this.positionAbs.left-this.lastPositionAbs.left;
return c!=0&&(c>0?"right":"left")},refresh:function(c){return this._refreshItems(c),this.refreshPositions(),this
},_connectWith:function(){var c=this.options;return c.connectWith.constructor==String?[c.connectWith]:c.connectWith
},_getItemsAsjQuery:function(f){var k=[],h=[],e=this._connectWith();if(e&&f){for(var g=e.length-1;
g>=0;g--){var j=b(e[g]);for(var d=j.length-1;d>=0;d--){var c=b.data(j[d],this.widgetName);
c&&c!=this&&!c.options.disabled&&h.push([b.isFunction(c.options.items)?c.options.items.call(c.element):b(c.options.items,c.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),c])
}}}h.push([b.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):b(this.options.items,this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),this]);
for(var g=h.length-1;g>=0;g--){h[g][0].each(function(){k.push(this)})}return b(k)
},_removeCurrentsFromItems:function(){var c=this.currentItem.find(":data("+this.widgetName+"-item)");
this.items=b.grep(this.items,function(d){for(var f=0;f<c.length;f++){if(c[f]==d.item[0]){return !1
}}return !0})},_refreshItems:function(x){this.items=[],this.containers=[this];var g=this.items,d=[[b.isFunction(this.options.items)?this.options.items.call(this.element[0],x,{item:this.currentItem}):b(this.options.items,this.element),this]],k=this._connectWith();
if(k&&this.ready){for(var y=k.length-1;y>=0;y--){var e=b(k[y]);for(var w=e.length-1;
w>=0;w--){var v=b.data(e[w],this.widgetName);v&&v!=this&&!v.options.disabled&&(d.push([b.isFunction(v.options.items)?v.options.items.call(v.element[0],x,{item:this.currentItem}):b(v.options.items,v.element),v]),this.containers.push(v))
}}}for(var y=d.length-1;y>=0;y--){var p=d[y][1],j=d[y][0];for(var w=0,q=j.length;
w<q;w++){var m=b(j[w]);m.data(this.widgetName+"-item",p),g.push({item:m,instance:p,width:0,height:0,left:0,top:0})
}}},refreshPositions:function(d){this.offsetParent&&this.helper&&(this.offset.parent=this._getParentOffset());
for(var g=this.items.length-1;g>=0;g--){var f=this.items[g];if(f.instance!=this.currentContainer&&this.currentContainer&&f.item[0]!=this.currentItem[0]){continue
}var c=this.options.toleranceElement?b(this.options.toleranceElement,f.item):f.item;
d||(f.width=c.outerWidth(),f.height=c.outerHeight());var e=c.offset();f.left=e.left,f.top=e.top
}if(this.options.custom&&this.options.custom.refreshContainers){this.options.custom.refreshContainers.call(this)
}else{for(var g=this.containers.length-1;g>=0;g--){var e=this.containers[g].element.offset();
this.containers[g].containerCache.left=e.left,this.containers[g].containerCache.top=e.top,this.containers[g].containerCache.width=this.containers[g].element.outerWidth(),this.containers[g].containerCache.height=this.containers[g].element.outerHeight()
}}return this},_createPlaceholder:function(c){c=c||this;var e=c.options;if(!e.placeholder||e.placeholder.constructor==String){var d=e.placeholder;
e.placeholder={element:function(){var f=b(document.createElement(c.currentItem[0].nodeName)).addClass(d||c.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper")[0];
return d||(f.style.visibility="hidden"),f},update:function(g,f){if(d&&!e.forcePlaceholderSize){return
}f.height()||f.height(c.currentItem.innerHeight()-parseInt(c.currentItem.css("paddingTop")||0,10)-parseInt(c.currentItem.css("paddingBottom")||0,10)),f.width()||f.width(c.currentItem.innerWidth()-parseInt(c.currentItem.css("paddingLeft")||0,10)-parseInt(c.currentItem.css("paddingRight")||0,10))
}}}c.placeholder=b(e.placeholder.element.call(c.element,c.currentItem)),c.currentItem.after(c.placeholder),e.placeholder.update(c,c.placeholder)
},_contactContainers:function(x){var g=null,d=null;for(var k=this.containers.length-1;
k>=0;k--){if(b.contains(this.currentItem[0],this.containers[k].element[0])){continue
}if(this._intersectsWith(this.containers[k].containerCache)){if(g&&b.contains(this.containers[k].element[0],g.element[0])){continue
}g=this.containers[k],d=k}else{this.containers[k].containerCache.over&&(this.containers[k]._trigger("out",x,this._uiHash(this)),this.containers[k].containerCache.over=0)
}}if(!g){return}if(this.containers.length===1){this.containers[d]._trigger("over",x,this._uiHash(this)),this.containers[d].containerCache.over=1
}else{var y=10000,e=null,w=this.containers[d].floating?"left":"top",v=this.containers[d].floating?"width":"height",p=this.positionAbs[w]+this.offset.click[w];
for(var j=this.items.length-1;j>=0;j--){if(!b.contains(this.containers[d].element[0],this.items[j].item[0])){continue
}if(this.items[j].item[0]==this.currentItem[0]){continue}var q=this.items[j].item.offset()[w],m=!1;
Math.abs(q-p)>Math.abs(q+this.items[j][v]-p)&&(m=!0,q+=this.items[j][v]),Math.abs(q-p)<y&&(y=Math.abs(q-p),e=this.items[j],this.direction=m?"up":"down")
}if(!e&&!this.options.dropOnEmpty){return}this.currentContainer=this.containers[d],e?this._rearrange(x,e,null,!0):this._rearrange(x,null,this.containers[d].element,!0),this._trigger("change",x,this._uiHash()),this.containers[d]._trigger("change",x,this._uiHash(this)),this.options.placeholder.update(this.currentContainer,this.placeholder),this.containers[d]._trigger("over",x,this._uiHash(this)),this.containers[d].containerCache.over=1
}},_createHelper:function(c){var e=this.options,d=b.isFunction(e.helper)?b(e.helper.apply(this.element[0],[c,this.currentItem])):e.helper=="clone"?this.currentItem.clone():this.currentItem;
return d.parents("body").length||b(e.appendTo!="parent"?e.appendTo:this.currentItem[0].parentNode)[0].appendChild(d[0]),d[0]==this.currentItem[0]&&(this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}),(d[0].style.width==""||e.forceHelperSize)&&d.width(this.currentItem.width()),(d[0].style.height==""||e.forceHelperSize)&&d.height(this.currentItem.height()),d
},_adjustOffsetFromHelper:function(c){typeof c=="string"&&(c=c.split(" ")),b.isArray(c)&&(c={left:+c[0],top:+c[1]||0}),"left" in c&&(this.offset.click.left=c.left+this.margins.left),"right" in c&&(this.offset.click.left=this.helperProportions.width-c.right+this.margins.left),"top" in c&&(this.offset.click.top=c.top+this.margins.top),"bottom" in c&&(this.offset.click.top=this.helperProportions.height-c.bottom+this.margins.top)
},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var c=this.offsetParent.offset();
this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&b.contains(this.scrollParent[0],this.offsetParent[0])&&(c.left+=this.scrollParent.scrollLeft(),c.top+=this.scrollParent.scrollTop());
if(this.offsetParent[0]==document.body||this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&b.ui.ie){c={top:0,left:0}
}return{top:c.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:c.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}
},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var c=this.currentItem.position();
return{top:c.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:c.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}
}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.currentItem.css("marginLeft"),10)||0,top:parseInt(this.currentItem.css("marginTop"),10)||0}
},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}
},_setContainment:function(){var d=this.options;d.containment=="parent"&&(d.containment=this.helper[0].parentNode);
if(d.containment=="document"||d.containment=="window"){this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,b(d.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(b(d.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]
}if(!/^(document|window|parent)$/.test(d.containment)){var f=b(d.containment)[0],e=b(d.containment).offset(),c=b(f).css("overflow")!="hidden";
this.containment=[e.left+(parseInt(b(f).css("borderLeftWidth"),10)||0)+(parseInt(b(f).css("paddingLeft"),10)||0)-this.margins.left,e.top+(parseInt(b(f).css("borderTopWidth"),10)||0)+(parseInt(b(f).css("paddingTop"),10)||0)-this.margins.top,e.left+(c?Math.max(f.scrollWidth,f.offsetWidth):f.offsetWidth)-(parseInt(b(f).css("borderLeftWidth"),10)||0)-(parseInt(b(f).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,e.top+(c?Math.max(f.scrollHeight,f.offsetHeight):f.offsetHeight)-(parseInt(b(f).css("borderTopWidth"),10)||0)-(parseInt(b(f).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top]
}},_convertPositionTo:function(d,h){h||(h=this.position);var f=d=="absolute"?1:-1,c=this.options,e=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!b.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,g=/(html|body)/i.test(e[0].tagName);
return{top:h.top+this.offset.relative.top*f+this.offset.parent.top*f-(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():g?0:e.scrollTop())*f,left:h.left+this.offset.relative.left*f+this.offset.parent.left*f-(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():g?0:e.scrollLeft())*f}
},_generatePosition:function(f){var k=this.options,h=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!b.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,e=/(html|body)/i.test(h[0].tagName);
this.cssPosition=="relative"&&(this.scrollParent[0]==document||this.scrollParent[0]==this.offsetParent[0])&&(this.offset.relative=this._getRelativeOffset());
var g=f.pageX,j=f.pageY;if(this.originalPosition){this.containment&&(f.pageX-this.offset.click.left<this.containment[0]&&(g=this.containment[0]+this.offset.click.left),f.pageY-this.offset.click.top<this.containment[1]&&(j=this.containment[1]+this.offset.click.top),f.pageX-this.offset.click.left>this.containment[2]&&(g=this.containment[2]+this.offset.click.left),f.pageY-this.offset.click.top>this.containment[3]&&(j=this.containment[3]+this.offset.click.top));
if(k.grid){var d=this.originalPageY+Math.round((j-this.originalPageY)/k.grid[1])*k.grid[1];
j=this.containment?d-this.offset.click.top<this.containment[1]||d-this.offset.click.top>this.containment[3]?d-this.offset.click.top<this.containment[1]?d+k.grid[1]:d-k.grid[1]:d:d;
var c=this.originalPageX+Math.round((g-this.originalPageX)/k.grid[0])*k.grid[0];g=this.containment?c-this.offset.click.left<this.containment[0]||c-this.offset.click.left>this.containment[2]?c-this.offset.click.left<this.containment[0]?c+k.grid[0]:c-k.grid[0]:c:c
}}return{top:j-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():e?0:h.scrollTop()),left:g-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():e?0:h.scrollLeft())}
},_rearrange:function(g,d,h,f){h?h[0].appendChild(this.placeholder[0]):d.item[0].parentNode.insertBefore(this.placeholder[0],this.direction=="down"?d.item[0]:d.item[0].nextSibling),this.counter=this.counter?++this.counter:1;
var c=this.counter;this._delay(function(){c==this.counter&&this.refreshPositions(!f)
})},_clear:function(d,f){this.reverting=!1;var e=[];!this._noFinalSort&&this.currentItem.parent().length&&this.placeholder.before(this.currentItem),this._noFinalSort=null;
if(this.helper[0]==this.currentItem[0]){for(var c in this._storedCSS){if(this._storedCSS[c]=="auto"||this._storedCSS[c]=="static"){this._storedCSS[c]=""
}}this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else{this.currentItem.show()
}this.fromOutside&&!f&&e.push(function(g){this._trigger("receive",g,this._uiHash(this.fromOutside))
}),(this.fromOutside||this.domPosition.prev!=this.currentItem.prev().not(".ui-sortable-helper")[0]||this.domPosition.parent!=this.currentItem.parent()[0])&&!f&&e.push(function(g){this._trigger("update",g,this._uiHash())
}),this!==this.currentContainer&&(f||(e.push(function(g){this._trigger("remove",g,this._uiHash())
}),e.push(function(g){return function(h){g._trigger("receive",h,this._uiHash(this))
}}.call(this,this.currentContainer)),e.push(function(g){return function(h){g._trigger("update",h,this._uiHash(this))
}}.call(this,this.currentContainer))));for(var c=this.containers.length-1;c>=0;c--){f||e.push(function(g){return function(h){g._trigger("deactivate",h,this._uiHash(this))
}}.call(this,this.containers[c])),this.containers[c].containerCache.over&&(e.push(function(g){return function(h){g._trigger("out",h,this._uiHash(this))
}}.call(this,this.containers[c])),this.containers[c].containerCache.over=0)}this._storedCursor&&b("body").css("cursor",this._storedCursor),this._storedOpacity&&this.helper.css("opacity",this._storedOpacity),this._storedZIndex&&this.helper.css("zIndex",this._storedZIndex=="auto"?"":this._storedZIndex),this.dragging=!1;
if(this.cancelHelperRemoval){if(!f){this._trigger("beforeStop",d,this._uiHash());
for(var c=0;c<e.length;c++){e[c].call(this,d)}this._trigger("stop",d,this._uiHash())
}return this.fromOutside=!1,!1}f||this._trigger("beforeStop",d,this._uiHash()),this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.helper[0]!=this.currentItem[0]&&this.helper.remove(),this.helper=null;
if(!f){for(var c=0;c<e.length;c++){e[c].call(this,d)}this._trigger("stop",d,this._uiHash())
}return this.fromOutside=!1,!0},_trigger:function(){b.Widget.prototype._trigger.apply(this,arguments)===!1&&this.cancel()
},_uiHash:function(c){var d=c||this;return{helper:d.helper,placeholder:d.placeholder||b([]),position:d.position,originalPosition:d.originalPosition,offset:d.positionAbs,item:d.currentItem,sender:c?c.element:null}
}})}(jQuery),jQuery.effects||function(c,a){var d=c.uiBackCompat!==!1,b="ui-effects-";
c.effects={effect:{}},function(D,k){function g(i,f,l){var h=A[f.type]||{};return i==null?l||!f.def?null:f.def:(i=h.floor?~~i:parseFloat(i),isNaN(i)?f.def:h.mod?(i+h.mod)%h.mod:0>i?0:h.max<i?h.max:i)
}function y(h){var i=j(),f=i._rgba=[];return h=h.toLowerCase(),w(E,function(p,n){var r,v=n.re.exec(h),l=v&&n.parse(v),u=n.space||"rgba";
if(l){return r=i[u](l),i[C[u].cache]=r[C[u].cache],f=i._rgba=r._rgba,!1}}),f.length?(f.join()==="0,0,0,0"&&D.extend(f,z.transparent),i):z[h]
}function B(h,f,i){return i=(i+1)%1,i*6<1?h+(f-h)*i*6:i*2<1?f:i*3<2?h+(f-h)*(2/3-i)*6:h
}var e="backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor".split(" "),q=/^([\-+])=\s*(\d+\.?\d*)/,E=[{re:/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,parse:function(f){return[f[1],f[2],f[3],f[4]]
}},{re:/rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,parse:function(f){return[f[1]*2.55,f[2]*2.55,f[3]*2.55,f[4]]
}},{re:/#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,parse:function(f){return[parseInt(f[1],16),parseInt(f[2],16),parseInt(f[3],16)]
}},{re:/#([a-f0-9])([a-f0-9])([a-f0-9])/,parse:function(f){return[parseInt(f[1]+f[1],16),parseInt(f[2]+f[2],16),parseInt(f[3]+f[3],16)]
}},{re:/hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,space:"hsla",parse:function(f){return[f[1],f[2]/100,f[3]/100,f[4]]
}}],j=D.Color=function(l,o,h,f){return new D.Color.fn.parse(l,o,h,f)},C={rgba:{props:{red:{idx:0,type:"byte"},green:{idx:1,type:"byte"},blue:{idx:2,type:"byte"}}},hsla:{props:{hue:{idx:0,type:"degrees"},saturation:{idx:1,type:"percent"},lightness:{idx:2,type:"percent"}}}},A={"byte":{floor:!0,max:255},percent:{max:1},degrees:{mod:360,floor:!0}},x=j.support={},m=D("<p>")[0],z,w=D.each;
m.style.cssText="background-color:rgba(1,1,1,.5)",x.rgba=m.style.backgroundColor.indexOf("rgba")>-1,w(C,function(h,f){f.cache="_"+h,f.props.alpha={idx:3,type:"percent",def:1}
}),j.fn=D.extend(j.prototype,{parse:function(u,p,t,n){if(u===k){return this._rgba=[null,null,null,null],this
}if(u.jquery||u.nodeType){u=D(u).css(p),p=k}var F=this,h=D.type(u),o=this._rgba=[];
p!==k&&(u=[u,p,t,n],h="array");if(h==="string"){return this.parse(y(u)||z._default)
}if(h==="array"){return w(C.rgba.props,function(i,f){o[f.idx]=g(u[f.idx],f)}),this
}if(h==="object"){return u instanceof j?w(C,function(i,f){u[f.cache]&&(F[f.cache]=u[f.cache].slice())
}):w(C,function(l,r){var f=r.cache;w(r.props,function(s,i){if(!F[f]&&r.to){if(s==="alpha"||u[s]==null){return
}F[f]=r.to(F._rgba)}F[f][i.idx]=g(u[s],i,!0)}),F[f]&&c.inArray(null,F[f].slice(0,3))<0&&(F[f][3]=1,r.from&&(F._rgba=r.from(F[f])))
}),this}},is:function(i){var f=j(i),l=!0,h=this;return w(C,function(r,n){var p,t=f[n.cache];
return t&&(p=h[n.cache]||n.to&&n.to(h._rgba)||[],w(n.props,function(s,o){if(t[o.idx]!=null){return l=t[o.idx]===p[o.idx],l
}})),l}),l},_space:function(){var h=[],f=this;return w(C,function(l,i){f[i.cache]&&h.push(l)
}),h.pop()},transition:function(G,p){var H=j(G),v=H._space(),o=C[v],u=this.alpha()===0?j("transparent"):this,F=u[o.cache]||o.to(u._rgba),h=F.slice();
return H=H[o.cache],w(o.props,function(I,t){var l=t.idx,n=F[l],J=H[l],f=A[t.type]||{};
if(J===null){return}n===null?h[l]=J:(f.mod&&(J-n>f.mod/2?n+=f.mod:n-J>f.mod/2&&(n-=f.mod)),h[l]=g((J-n)*p+n,t))
}),this[v](h)},blend:function(l){if(this._rgba[3]===1){return this}var o=this._rgba.slice(),h=o.pop(),f=j(l)._rgba;
return j(D.map(o,function(n,i){return(1-h)*f[i]+h*n}))},toRgbaString:function(){var f="rgba(",h=D.map(this._rgba,function(l,i){return l==null?i>2?1:0:l
});return h[3]===1&&(h.pop(),f="rgb("),f+h.join()+")"},toHslaString:function(){var f="hsla(",h=D.map(this.hsla(),function(l,i){return l==null&&(l=i>2?1:0),i&&i<3&&(l=Math.round(l*100)+"%"),l
});return h[3]===1&&(h.pop(),f="hsl("),f+h.join()+")"},toHexString:function(h){var i=this._rgba.slice(),f=i.pop();
return h&&i.push(~~(f*255)),"#"+D.map(i,function(l){return l=(l||0).toString(16),l.length===1?"0"+l:l
}).join("")},toString:function(){return this._rgba[3]===0?"transparent":this.toRgbaString()
}}),j.fn.parse.prototype=j.fn,C.hsla.to=function(I){if(I[0]==null||I[1]==null||I[2]==null){return[null,null,null,I[3]]
}var M=I[0]/255,v=I[1]/255,h=I[2]/255,G=I[3],N=Math.max(M,v,h),p=Math.min(M,v,h),L=N-p,K=N+p,H=K*0.5,F,J;
return p===N?F=0:M===N?F=60*(v-h)/L+360:v===N?F=60*(h-M)/L+120:F=60*(M-v)/L+240,H===0||H===1?J=H:H<=0.5?J=L/K:J=L/(2-K),[Math.round(F)%360,J,H,G==null?1:G]
},C.hsla.from=function(u){if(u[0]==null||u[1]==null||u[2]==null){return[null,null,null,u[3]]
}var h=u[0]/360,F=u[1],p=u[2],f=u[3],l=p<=0.5?p*(1+F):p+F-p*F,v=2*p-l;return[Math.round(B(v,l,h+1/3)*255),Math.round(B(v,l,h)*255),Math.round(B(v,l,h-1/3)*255),f]
},w(C,function(p,n){var l=n.props,i=n.cache,h=n.to,o=n.from;j.fn[p]=function(u){h&&!this[i]&&(this[i]=h(this._rgba));
if(u===k){return this[i].slice()}var t,s=D.type(u),f=s==="array"||s==="object"?u:arguments,v=this[i].slice();
return w(l,function(F,r){var G=f[s==="object"?F:r.idx];G==null&&(G=v[r.idx]),v[r.idx]=g(G,r)
}),o?(t=j(o(v)),t[i]=v,t):j(v)},w(l,function(s,f){if(j.fn[s]){return}j.fn[s]=function(F){var H=D.type(F),v=s==="alpha"?this._hsla?"hsla":"rgba":p,t=this[v](),G=t[f.idx],r;
return H==="undefined"?G:(H==="function"&&(F=F.call(this,G),H=D.type(F)),F==null&&f.empty?this:(H==="string"&&(r=q.exec(F),r&&(F=G+parseFloat(r[2])*(r[1]==="+"?1:-1))),t[f.idx]=F,this[v](t)))
}})}),w(e,function(f,h){D.cssHooks[h]={set:function(G,F){var t,v,p="";if(D.type(F)!=="string"||(t=y(F))){F=j(t||F);
if(!x.rgba&&F._rgba[3]!==1){v=h==="backgroundColor"?G.parentNode:G;while((p===""||p==="transparent")&&v&&v.style){try{p=D.css(v,"backgroundColor"),v=v.parentNode
}catch(o){}}F=F.blend(p&&p!=="transparent"?p:"_default")}F=F.toRgbaString()}try{G.style[h]=F
}catch(n){}}},D.fx.step[h]=function(i){i.colorInit||(i.start=j(i.elem,h),i.end=j(i.end),i.colorInit=!0),D.cssHooks[h].set(i.elem,i.start.transition(i.end,i.pos))
}}),D.cssHooks.borderColor={expand:function(h){var f={};return w(["Top","Right","Bottom","Left"],function(l,i){f["border"+i+"Color"]=h
}),f}},z=D.Color.names={aqua:"#00ffff",black:"#000000",blue:"#0000ff",fuchsia:"#ff00ff",gray:"#808080",green:"#008000",lime:"#00ff00",maroon:"#800000",navy:"#000080",olive:"#808000",purple:"#800080",red:"#ff0000",silver:"#c0c0c0",teal:"#008080",white:"#ffffff",yellow:"#ffff00",transparent:[null,null,null,0],_default:"#ffffff"}
}(jQuery),function(){function e(){var k=this.ownerDocument.defaultView?this.ownerDocument.defaultView.getComputedStyle(this,null):this.currentStyle,m={},l,j;
if(k&&k.length&&k[0]&&k[k[0]]){j=k.length;while(j--){l=k[j],typeof k[l]=="string"&&(m[c.camelCase(l)]=k[l])
}}else{for(l in k){typeof k[l]=="string"&&(m[l]=k[l])}}return m}function f(k,p){var j={},l,m;
for(l in p){m=p[l],k[l]!==m&&!g[l]&&(c.fx.step[l]||!isNaN(parseFloat(m)))&&(j[l]=m)
}return j}var h=["add","remove","toggle"],g={border:1,borderBottom:1,borderColor:1,borderLeft:1,borderRight:1,borderTop:1,borderWidth:1,margin:1,padding:1};
c.each(["borderLeftStyle","borderRightStyle","borderBottomStyle","borderTopStyle"],function(i,j){c.fx.step[j]=function(k){if(k.end!=="none"&&!k.setAttr||k.pos===1&&!k.setAttr){jQuery.style(k.elem,j,k.end),k.setAttr=!0
}}}),c.effects.animateClass=function(k,l,m,j){var i=c.speed(l,m,j);return this.queue(function(){var p=c(this),s=p.attr("class")||"",n,q=i.children?p.find("*").andSelf():p;
q=q.map(function(){var o=c(this);return{el:o,start:e.call(this)}}),n=function(){c.each(h,function(o,r){k[r]&&p[r+"Class"](k[r])
})},n(),q=q.map(function(){return this.end=e.call(this.el[0]),this.diff=f(this.start,this.end),this
}),p.attr("class",s),q=q.map(function(){var o=this,v=c.Deferred(),u=jQuery.extend({},i,{queue:!1,complete:function(){v.resolve(o)
}});return this.el.animate(this.diff,u),v.promise()}),c.when.apply(c,q.get()).done(function(){n(),c.each(arguments,function(){var o=this.el;
c.each(this.diff,function(r){o.css(r,"")})}),i.complete.call(p[0])})})},c.fn.extend({_addClass:c.fn.addClass,addClass:function(k,m,l,j){return m?c.effects.animateClass.call(this,{add:k},m,l,j):this._addClass(k)
},_removeClass:c.fn.removeClass,removeClass:function(k,m,l,j){return m?c.effects.animateClass.call(this,{remove:k},m,l,j):this._removeClass(k)
},_toggleClass:c.fn.toggleClass,toggleClass:function(p,l,j,k,m){return typeof l=="boolean"||l===a?j?c.effects.animateClass.call(this,l?{add:p}:{remove:p},j,k,m):this._toggleClass(p,l):c.effects.animateClass.call(this,{toggle:p},l,j,k)
},switchClass:function(k,o,m,j,l){return c.effects.animateClass.call(this,{add:o,remove:k},m,j,l)
}})}(),function(){function e(h,k,j,g){c.isPlainObject(h)&&(k=h,h=h.effect),h={effect:h},k==null&&(k={}),c.isFunction(k)&&(g=k,j=null,k={});
if(typeof k=="number"||c.fx.speeds[k]){g=j,j=k,k={}}return c.isFunction(j)&&(g=j,j=null),k&&c.extend(h,k),j=j||k.duration,h.duration=c.fx.off?0:typeof j=="number"?j:j in c.fx.speeds?c.fx.speeds[j]:c.fx.speeds._default,h.complete=g||k.complete,h
}function f(g){return !g||typeof g=="number"||c.fx.speeds[g]?!0:typeof g=="string"&&!c.effects.effect[g]?d&&c.effects[g]?!1:!0:!1
}c.extend(c.effects,{version:"1.9.2",save:function(h,g){for(var i=0;i<g.length;i++){g[i]!==null&&h.data(b+g[i],h[0].style[g[i]])
}},restore:function(j,k){var g,h;for(h=0;h<k.length;h++){k[h]!==null&&(g=j.data(b+k[h]),g===a&&(g=""),j.css(k[h],g))
}},setMode:function(h,g){return g==="toggle"&&(g=h.is(":hidden")?"show":"hide"),g
},getBaseline:function(i,g){var j,h;switch(i[0]){case"top":j=0;break;case"middle":j=0.5;
break;case"bottom":j=1;break;default:j=i[0]/g.height}switch(i[1]){case"left":h=0;
break;case"center":h=0.5;break;case"right":h=1;break;default:h=i[1]/g.width}return{x:h,y:j}
},createWrapper:function(h){if(h.parent().is(".ui-effects-wrapper")){return h.parent()
}var m={width:h.outerWidth(!0),height:h.outerHeight(!0),"float":h.css("float")},k=c("<div></div>").addClass("ui-effects-wrapper").css({fontSize:"100%",background:"transparent",border:"none",margin:0,padding:0}),g={width:h.width(),height:h.height()},j=document.activeElement;
try{j.id}catch(l){j=document.body}return h.wrap(k),(h[0]===j||c.contains(h[0],j))&&c(j).focus(),k=h.parent(),h.css("position")==="static"?(k.css({position:"relative"}),h.css({position:"relative"})):(c.extend(m,{position:h.css("position"),zIndex:h.css("z-index")}),c.each(["top","left","bottom","right"],function(n,i){m[i]=h.css(i),isNaN(parseInt(m[i],10))&&(m[i]="auto")
}),h.css({position:"relative",top:0,left:0,right:"auto",bottom:"auto"})),h.css(g),k.css(m).show()
},removeWrapper:function(g){var h=document.activeElement;return g.parent().is(".ui-effects-wrapper")&&(g.parent().replaceWith(g),(g[0]===h||c.contains(g[0],h))&&c(h).focus()),g
},setTransition:function(h,k,j,g){return g=g||{},c.each(k,function(l,m){var i=h.cssUnit(m);
i[0]>0&&(g[m]=i[0]*j+i[1])}),g}}),c.fn.extend({effect:function(){function g(t){function m(){c.isFunction(o)&&o.call(q[0]),c.isFunction(t)&&t()
}var q=c(this),o=i.complete,p=i.mode;(q.is(":hidden")?p==="hide":p==="show")?m():l.call(q[0],i,m)
}var i=e.apply(this,arguments),k=i.mode,j=i.queue,l=c.effects.effect[i.effect],h=!l&&d&&c.effects[i.effect];
return c.fx.off||!l&&!h?k?this[k](i.duration,i.complete):this.each(function(){i.complete&&i.complete.call(this)
}):l?j===!1?this.each(g):this.queue(j||"fx",g):h.call(this,{options:i,duration:i.duration,callback:i.complete,mode:i.mode})
},_show:c.fn.show,show:function(h){if(f(h)){return this._show.apply(this,arguments)
}var g=e.apply(this,arguments);return g.mode="show",this.effect.call(this,g)},_hide:c.fn.hide,hide:function(h){if(f(h)){return this._hide.apply(this,arguments)
}var g=e.apply(this,arguments);return g.mode="hide",this.effect.call(this,g)},__toggle:c.fn.toggle,toggle:function(g){if(f(g)||typeof g=="boolean"||c.isFunction(g)){return this.__toggle.apply(this,arguments)
}var h=e.apply(this,arguments);return h.mode="toggle",this.effect.call(this,h)},cssUnit:function(g){var i=this.css(g),h=[];
return c.each(["em","px","%","pt"],function(k,j){i.indexOf(j)>0&&(h=[parseFloat(i),j])
}),h}})}(),function(){var e={};c.each(["Quad","Cubic","Quart","Quint","Expo"],function(f,g){e[g]=function(h){return Math.pow(h,f+2)
}}),c.extend(e,{Sine:function(f){return 1-Math.cos(f*Math.PI/2)},Circ:function(f){return 1-Math.sqrt(1-f*f)
},Elastic:function(f){return f===0||f===1?f:-Math.pow(2,8*(f-1))*Math.sin(((f-1)*80-7.5)*Math.PI/15)
},Back:function(f){return f*f*(3*f-2)},Bounce:function(g){var f,h=4;while(g<((f=Math.pow(2,--h))-1)/11){}return 1/Math.pow(4,3-h)-7.5625*Math.pow((f*3-2)/22-g,2)
}}),c.each(e,function(f,g){c.easing["easeIn"+f]=g,c.easing["easeOut"+f]=function(h){return 1-g(1-h)
},c.easing["easeInOut"+f]=function(h){return h<0.5?g(h*2)/2:1-g(h*-2+2)/2}})}()}(jQuery),function(d,b){var f=0,c={},a={};
c.height=c.paddingTop=c.paddingBottom=c.borderTopWidth=c.borderBottomWidth="hide",a.height=a.paddingTop=a.paddingBottom=a.borderTopWidth=a.borderBottomWidth="show",d.widget("ui.accordion",{version:"1.9.2",options:{active:0,animate:{},collapsible:!1,event:"click",header:"> li > :first-child,> :not(li):even",heightStyle:"auto",icons:{activeHeader:"ui-icon-triangle-1-s",header:"ui-icon-triangle-1-e"},activate:null,beforeActivate:null},_create:function(){var e=this.accordionId="ui-accordion-"+(this.element.attr("id")||++f),g=this.options;
this.prevShow=this.prevHide=d(),this.element.addClass("ui-accordion ui-widget ui-helper-reset"),this.headers=this.element.find(g.header).addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all"),this._hoverable(this.headers),this._focusable(this.headers),this.headers.next().addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").hide(),!g.collapsible&&(g.active===!1||g.active==null)&&(g.active=0),g.active<0&&(g.active+=this.headers.length),this.active=this._findActive(g.active).addClass("ui-accordion-header-active ui-state-active").toggleClass("ui-corner-all ui-corner-top"),this.active.next().addClass("ui-accordion-content-active").show(),this._createIcons(),this.refresh(),this.element.attr("role","tablist"),this.headers.attr("role","tab").each(function(m){var k=d(this),h=k.attr("id"),j=k.next(),l=j.attr("id");
h||(h=e+"-header-"+m,k.attr("id",h)),l||(l=e+"-panel-"+m,j.attr("id",l)),k.attr("aria-controls",l),j.attr("aria-labelledby",h)
}).next().attr("role","tabpanel"),this.headers.not(this.active).attr({"aria-selected":"false",tabIndex:-1}).next().attr({"aria-expanded":"false","aria-hidden":"true"}).hide(),this.active.length?this.active.attr({"aria-selected":"true",tabIndex:0}).next().attr({"aria-expanded":"true","aria-hidden":"false"}):this.headers.eq(0).attr("tabIndex",0),this._on(this.headers,{keydown:"_keydown"}),this._on(this.headers.next(),{keydown:"_panelKeyDown"}),this._setupEvents(g.event)
},_getCreateEventData:function(){return{header:this.active,content:this.active.length?this.active.next():d()}
},_createIcons:function(){var e=this.options.icons;e&&(d("<span>").addClass("ui-accordion-header-icon ui-icon "+e.header).prependTo(this.headers),this.active.children(".ui-accordion-header-icon").removeClass(e.header).addClass(e.activeHeader),this.headers.addClass("ui-accordion-icons"))
},_destroyIcons:function(){this.headers.removeClass("ui-accordion-icons").children(".ui-accordion-header-icon").remove()
},_destroy:function(){var g;this.element.removeClass("ui-accordion ui-widget ui-helper-reset").removeAttr("role"),this.headers.removeClass("ui-accordion-header ui-accordion-header-active ui-helper-reset ui-state-default ui-corner-all ui-state-active ui-state-disabled ui-corner-top").removeAttr("role").removeAttr("aria-selected").removeAttr("aria-controls").removeAttr("tabIndex").each(function(){/^ui-accordion/.test(this.id)&&this.removeAttribute("id")
}),this._destroyIcons(),g=this.headers.next().css("display","").removeAttr("role").removeAttr("aria-expanded").removeAttr("aria-hidden").removeAttr("aria-labelledby").removeClass("ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content ui-accordion-content-active ui-state-disabled").each(function(){/^ui-accordion/.test(this.id)&&this.removeAttribute("id")
}),this.options.heightStyle!=="content"&&g.css("height","")},_setOption:function(h,g){if(h==="active"){this._activate(g);
return}h==="event"&&(this.options.event&&this._off(this.headers,this.options.event),this._setupEvents(g)),this._super(h,g),h==="collapsible"&&!g&&this.options.active===!1&&this._activate(0),h==="icons"&&(this._destroyIcons(),g&&this._createIcons()),h==="disabled"&&this.headers.add(this.headers.next()).toggleClass("ui-state-disabled",!!g)
},_keydown:function(g){if(g.altKey||g.ctrlKey){return}var k=d.ui.keyCode,j=this.headers.length,e=this.headers.index(g.target),h=!1;
switch(g.keyCode){case k.RIGHT:case k.DOWN:h=this.headers[(e+1)%j];break;case k.LEFT:case k.UP:h=this.headers[(e-1+j)%j];
break;case k.SPACE:case k.ENTER:this._eventHandler(g);break;case k.HOME:h=this.headers[0];
break;case k.END:h=this.headers[j-1]}h&&(d(g.target).attr("tabIndex",-1),d(h).attr("tabIndex",0),h.focus(),g.preventDefault())
},_panelKeyDown:function(e){e.keyCode===d.ui.keyCode.UP&&e.ctrlKey&&d(e.currentTarget).prev().focus()
},refresh:function(){var g,j,h=this.options.heightStyle,e=this.element.parent();h==="fill"?(d.support.minHeight||(j=e.css("overflow"),e.css("overflow","hidden")),g=e.height(),this.element.siblings(":visible").each(function(){var k=d(this),i=k.css("position");
if(i==="absolute"||i==="fixed"){return}g-=k.outerHeight(!0)}),j&&e.css("overflow",j),this.headers.each(function(){g-=d(this).outerHeight(!0)
}),this.headers.next().each(function(){d(this).height(Math.max(0,g-d(this).innerHeight()+d(this).height()))
}).css("overflow","auto")):h==="auto"&&(g=0,this.headers.next().each(function(){g=Math.max(g,d(this).css("height","").height())
}).height(g))},_activate:function(e){var g=this._findActive(e)[0];if(g===this.active[0]){return
}g=g||this.active[0],this._eventHandler({target:g,currentTarget:g,preventDefault:d.noop})
},_findActive:function(e){return typeof e=="number"?this.headers.eq(e):d()},_setupEvents:function(e){var g={};
if(!e){return}d.each(e.split(" "),function(i,h){g[h]="_eventHandler"}),this._on(this.headers,g)
},_eventHandler:function(p){var h=this.options,e=this.active,j=d(p.currentTarget),q=j[0]===e[0],g=q&&h.collapsible,m=g?d():j.next(),l=e.next(),k={oldHeader:e,oldPanel:l,newHeader:g?d():j,newPanel:m};
p.preventDefault();if(q&&!h.collapsible||this._trigger("beforeActivate",p,k)===!1){return
}h.active=g?!1:this.headers.index(j),this.active=q?d():j,this._toggle(k),e.removeClass("ui-accordion-header-active ui-state-active"),h.icons&&e.children(".ui-accordion-header-icon").removeClass(h.icons.activeHeader).addClass(h.icons.header),q||(j.removeClass("ui-corner-all").addClass("ui-accordion-header-active ui-state-active ui-corner-top"),h.icons&&j.children(".ui-accordion-header-icon").removeClass(h.icons.header).addClass(h.icons.activeHeader),j.next().addClass("ui-accordion-content-active"))
},_toggle:function(e){var h=e.newPanel,g=this.prevShow.length?this.prevShow:e.oldPanel;
this.prevShow.add(this.prevHide).stop(!0,!0),this.prevShow=h,this.prevHide=g,this.options.animate?this._animate(h,g,e):(g.hide(),h.show(),this._toggleComplete(e)),g.attr({"aria-expanded":"false","aria-hidden":"true"}),g.prev().attr("aria-selected","false"),h.length&&g.length?g.prev().attr("tabIndex",-1):h.length&&this.headers.filter(function(){return d(this).attr("tabIndex")===0
}).attr("tabIndex",-1),h.attr({"aria-expanded":"true","aria-hidden":"false"}).prev().attr({"aria-selected":"true",tabIndex:0})
},_animate:function(r,y,j){var z,i,x,w=this,q=0,k=r.length&&(!y.length||r.index()<y.index()),v=this.options.animate||{},m=k&&v.down||v,g=function(){w._toggleComplete(j)
};typeof m=="number"&&(x=m),typeof m=="string"&&(i=m),i=i||m.easing||v.easing,x=x||m.duration||v.duration;
if(!y.length){return r.animate(a,x,i,g)}if(!r.length){return y.animate(c,x,i,g)}z=r.show().outerHeight(),y.animate(c,{duration:x,easing:i,step:function(l,h){h.now=Math.round(l)
}}),r.hide().animate(a,{duration:x,easing:i,complete:g,step:function(h,l){l.now=Math.round(h),l.prop!=="height"?q+=l.now:w.options.heightStyle!=="content"&&(l.now=Math.round(z-y.outerHeight()-q),q=0)
}})},_toggleComplete:function(h){var g=h.oldPanel;g.removeClass("ui-accordion-content-active").prev().removeClass("ui-corner-top").addClass("ui-corner-all"),g.length&&(g.parent()[0].className=g.parent()[0].className),this._trigger("activate",null,h)
}}),d.uiBackCompat!==!1&&(function(h,g){h.extend(g.options,{navigation:!1,navigationFilter:function(){return this.href.toLowerCase()===location.href.toLowerCase()
}});var i=g._create;g._create=function(){if(this.options.navigation){var j=this,l=this.element.find(this.options.header),e=l.next(),k=l.add(e).find("a").filter(this.options.navigationFilter)[0];
k&&l.add(e).each(function(m){if(h.contains(this,k)){return j.options.active=Math.floor(m/2),!1
}})}i.call(this)}}(jQuery,jQuery.ui.accordion.prototype),function(i,g){i.extend(g.options,{heightStyle:null,autoHeight:!0,clearStyle:!1,fillSpace:!1});
var j=g._create,h=g._setOption;i.extend(g,{_create:function(){this.options.heightStyle=this.options.heightStyle||this._mergeHeightStyle(),j.call(this)
},_setOption:function(k){if(k==="autoHeight"||k==="clearStyle"||k==="fillSpace"){this.options.heightStyle=this._mergeHeightStyle()
}h.apply(this,arguments)},_mergeHeightStyle:function(){var k=this.options;if(k.fillSpace){return"fill"
}if(k.clearStyle){return"content"}if(k.autoHeight){return"auto"}}})}(jQuery,jQuery.ui.accordion.prototype),function(h,g){h.extend(g.options.icons,{activeHeader:null,headerSelected:"ui-icon-triangle-1-s"});
var i=g._createIcons;g._createIcons=function(){this.options.icons&&(this.options.icons.activeHeader=this.options.icons.activeHeader||this.options.icons.headerSelected),i.call(this)
}}(jQuery,jQuery.ui.accordion.prototype),function(h,g){g.activate=g._activate;var i=g._findActive;
g._findActive=function(j){return j===-1&&(j=!1),j&&typeof j!="number"&&(j=this.headers.index(this.headers.filter(j)),j===-1&&(j=!1)),i.call(this,j)
}}(jQuery,jQuery.ui.accordion.prototype),jQuery.ui.accordion.prototype.resize=jQuery.ui.accordion.prototype.refresh,function(h,g){h.extend(g.options,{change:null,changestart:null});
var i=g._trigger;g._trigger=function(m,k,l){var j=i.apply(this,arguments);return j?(m==="beforeActivate"?j=i.call(this,"changestart",k,{oldHeader:l.oldHeader,oldContent:l.oldPanel,newHeader:l.newHeader,newContent:l.newPanel}):m==="activate"&&(j=i.call(this,"change",k,{oldHeader:l.oldHeader,oldContent:l.oldPanel,newHeader:l.newHeader,newContent:l.newPanel})),j):!1
}}(jQuery,jQuery.ui.accordion.prototype),function(h,g){h.extend(g.options,{animate:null,animated:"slide"});
var i=g._create;g._create=function(){var j=this.options;j.animate===null&&(j.animated?j.animated==="slide"?j.animate=300:j.animated==="bounceslide"?j.animate={duration:200,down:{easing:"easeOutBounce",duration:1000}}:j.animate=j.animated:j.animate=!1),i.call(this)
}}(jQuery,jQuery.ui.accordion.prototype))}(jQuery),function(b,a){var c=0;b.widget("ui.autocomplete",{version:"1.9.2",defaultElement:"<input>",options:{appendTo:"body",autoFocus:!1,delay:300,minLength:1,position:{my:"left top",at:"left bottom",collision:"none"},source:null,change:null,close:null,focus:null,open:null,response:null,search:null,select:null},pending:0,_create:function(){var d,f,e;
this.isMultiLine=this._isMultiLine(),this.valueMethod=this.element[this.element.is("input,textarea")?"val":"text"],this.isNewMenu=!0,this.element.addClass("ui-autocomplete-input").attr("autocomplete","off"),this._on(this.element,{keydown:function(g){if(this.element.prop("readOnly")){d=!0,e=!0,f=!0;
return}d=!1,e=!1,f=!1;var h=b.ui.keyCode;switch(g.keyCode){case h.PAGE_UP:d=!0,this._move("previousPage",g);
break;case h.PAGE_DOWN:d=!0,this._move("nextPage",g);break;case h.UP:d=!0,this._keyEvent("previous",g);
break;case h.DOWN:d=!0,this._keyEvent("next",g);break;case h.ENTER:case h.NUMPAD_ENTER:this.menu.active&&(d=!0,g.preventDefault(),this.menu.select(g));
break;case h.TAB:this.menu.active&&this.menu.select(g);break;case h.ESCAPE:this.menu.element.is(":visible")&&(this._value(this.term),this.close(g),g.preventDefault());
break;default:f=!0,this._searchTimeout(g)}},keypress:function(h){if(d){d=!1,h.preventDefault();
return}if(f){return}var g=b.ui.keyCode;switch(h.keyCode){case g.PAGE_UP:this._move("previousPage",h);
break;case g.PAGE_DOWN:this._move("nextPage",h);break;case g.UP:this._keyEvent("previous",h);
break;case g.DOWN:this._keyEvent("next",h)}},input:function(g){if(e){e=!1,g.preventDefault();
return}this._searchTimeout(g)},focus:function(){this.selectedItem=null,this.previous=this._value()
},blur:function(g){if(this.cancelBlur){delete this.cancelBlur;return}clearTimeout(this.searching),this.close(g),this._change(g)
}}),this._initSource(),this.menu=b("<ul>").addClass("ui-autocomplete").appendTo(this.document.find(this.options.appendTo||"body")[0]).menu({input:b(),role:null}).zIndex(this.element.zIndex()+1).hide().data("menu"),this._on(this.menu.element,{mousedown:function(g){g.preventDefault(),this.cancelBlur=!0,this._delay(function(){delete this.cancelBlur
});var h=this.menu.element[0];b(g.target).closest(".ui-menu-item").length||this._delay(function(){var i=this;
this.document.one("mousedown",function(j){j.target!==i.element[0]&&j.target!==h&&!b.contains(h,j.target)&&i.close()
})})},menufocus:function(g,i){if(this.isNewMenu){this.isNewMenu=!1;if(g.originalEvent&&/^mouse/.test(g.originalEvent.type)){this.menu.blur(),this.document.one("mousemove",function(){b(g.target).trigger(g.originalEvent)
});return}}var h=i.item.data("ui-autocomplete-item")||i.item.data("item.autocomplete");
!1!==this._trigger("focus",g,{item:h})?g.originalEvent&&/^key/.test(g.originalEvent.type)&&this._value(h.value):this.liveRegion.text(h.value)
},menuselect:function(i,g){var j=g.item.data("ui-autocomplete-item")||g.item.data("item.autocomplete"),h=this.previous;
this.element[0]!==this.document[0].activeElement&&(this.element.focus(),this.previous=h,this._delay(function(){this.previous=h,this.selectedItem=j
})),!1!==this._trigger("select",i,{item:j})&&this._value(j.value),this.term=this._value(),this.close(i),this.selectedItem=j
}}),this.liveRegion=b("<span>",{role:"status","aria-live":"polite"}).addClass("ui-helper-hidden-accessible").insertAfter(this.element),b.fn.bgiframe&&this.menu.element.bgiframe(),this._on(this.window,{beforeunload:function(){this.element.removeAttr("autocomplete")
}})},_destroy:function(){clearTimeout(this.searching),this.element.removeClass("ui-autocomplete-input").removeAttr("autocomplete"),this.menu.element.remove(),this.liveRegion.remove()
},_setOption:function(f,d){this._super(f,d),f==="source"&&this._initSource(),f==="appendTo"&&this.menu.element.appendTo(this.document.find(d||"body")[0]),f==="disabled"&&d&&this.xhr&&this.xhr.abort()
},_isMultiLine:function(){return this.element.is("textarea")?!0:this.element.is("input")?!1:this.element.prop("isContentEditable")
},_initSource:function(){var d,f,e=this;b.isArray(this.options.source)?(d=this.options.source,this.source=function(h,g){g(b.ui.autocomplete.filter(d,h.term))
}):typeof this.options.source=="string"?(f=this.options.source,this.source=function(h,g){e.xhr&&e.xhr.abort(),e.xhr=b.ajax({url:f,data:h,dataType:"json",success:function(i){g(i)
},error:function(){g([])}})}):this.source=this.options.source},_searchTimeout:function(d){clearTimeout(this.searching),this.searching=this._delay(function(){this.term!==this._value()&&(this.selectedItem=null,this.search(null,d))
},this.options.delay)},search:function(f,d){f=f!=null?f:this._value(),this.term=this._value();
if(f.length<this.options.minLength){return this.close(d)}if(this._trigger("search",d)===!1){return
}return this._search(f)},_search:function(d){this.pending++,this.element.addClass("ui-autocomplete-loading"),this.cancelSearch=!1,this.source({term:d},this._response())
},_response:function(){var f=this,d=++c;return function(e){d===c&&f.__response(e),f.pending--,f.pending||f.element.removeClass("ui-autocomplete-loading")
}},__response:function(d){d&&(d=this._normalize(d)),this._trigger("response",null,{content:d}),!this.options.disabled&&d&&d.length&&!this.cancelSearch?(this._suggest(d),this._trigger("open")):this._close()
},close:function(d){this.cancelSearch=!0,this._close(d)},_close:function(d){this.menu.element.is(":visible")&&(this.menu.element.hide(),this.menu.blur(),this.isNewMenu=!0,this._trigger("close",d))
},_change:function(d){this.previous!==this._value()&&this._trigger("change",d,{item:this.selectedItem})
},_normalize:function(d){return d.length&&d[0].label&&d[0].value?d:b.map(d,function(e){return typeof e=="string"?{label:e,value:e}:b.extend({label:e.label||e.value,value:e.value||e.label},e)
})},_suggest:function(d){var e=this.menu.element.empty().zIndex(this.element.zIndex()+1);
this._renderMenu(e,d),this.menu.refresh(),e.show(),this._resizeMenu(),e.position(b.extend({of:this.element},this.options.position)),this.options.autoFocus&&this.menu.next()
},_resizeMenu:function(){var d=this.menu.element;d.outerWidth(Math.max(d.width("").outerWidth()+1,this.element.outerWidth()))
},_renderMenu:function(d,f){var e=this;b.each(f,function(g,h){e._renderItemData(d,h)
})},_renderItemData:function(f,d){return this._renderItem(f,d).data("ui-autocomplete-item",d)
},_renderItem:function(d,e){return b("<li>").append(b("<a>").text(e.label)).appendTo(d)
},_move:function(f,d){if(!this.menu.element.is(":visible")){this.search(null,d);return
}if(this.menu.isFirstItem()&&/^previous/.test(f)||this.menu.isLastItem()&&/^next/.test(f)){this._value(this.term),this.menu.blur();
return}this.menu[f](d)},widget:function(){return this.menu.element},_value:function(){return this.valueMethod.apply(this.element,arguments)
},_keyEvent:function(f,d){if(!this.isMultiLine||this.menu.element.is(":visible")){this._move(f,d),d.preventDefault()
}}}),b.extend(b.ui.autocomplete,{escapeRegex:function(d){return d.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")
},filter:function(d,f){var e=new RegExp(b.ui.autocomplete.escapeRegex(f),"i");return b.grep(d,function(g){return e.test(g.label||g.value||g)
})}}),b.widget("ui.autocomplete",b.ui.autocomplete,{options:{messages:{noResults:"No search results.",results:function(d){return d+(d>1?" results are":" result is")+" available, use up and down arrow keys to navigate."
}}},__response:function(f){var d;this._superApply(arguments);if(this.options.disabled||this.cancelSearch){return
}f&&f.length?d=this.options.messages.results(f.length):d=this.options.messages.noResults,this.liveRegion.text(d)
}})}(jQuery),function(k,q){var d,b,h,v,c="ui-button ui-widget ui-state-default ui-corner-all",p="ui-state-hover ui-state-active ",m="ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only",j=function(){var a=k(this).find(":ui-button");
setTimeout(function(){a.button("refresh")},1)},g=function(e){var l=e.name,f=e.form,a=k([]);
return l&&(f?a=k(f).find("[name='"+l+"']"):a=k("[name='"+l+"']",e.ownerDocument).filter(function(){return !this.form
})),a};k.widget("ui.button",{version:"1.9.2",defaultElement:"<button>",options:{disabled:null,text:!0,label:null,icons:{primary:null,secondary:null}},_create:function(){this.element.closest("form").unbind("reset"+this.eventNamespace).bind("reset"+this.eventNamespace,j),typeof this.options.disabled!="boolean"?this.options.disabled=!!this.element.prop("disabled"):this.element.prop("disabled",this.options.disabled),this._determineButtonType(),this.hasTitle=!!this.buttonElement.attr("title");
var i=this,f=this.options,e=this.type==="checkbox"||this.type==="radio",n=e?"":"ui-state-active",l="ui-state-focus";
f.label===null&&(f.label=this.type==="input"?this.buttonElement.val():this.buttonElement.html()),this._hoverable(this.buttonElement),this.buttonElement.addClass(c).attr("role","button").bind("mouseenter"+this.eventNamespace,function(){if(f.disabled){return
}this===d&&k(this).addClass("ui-state-active")}).bind("mouseleave"+this.eventNamespace,function(){if(f.disabled){return
}k(this).removeClass(n)}).bind("click"+this.eventNamespace,function(a){f.disabled&&(a.preventDefault(),a.stopImmediatePropagation())
}),this.element.bind("focus"+this.eventNamespace,function(){i.buttonElement.addClass(l)
}).bind("blur"+this.eventNamespace,function(){i.buttonElement.removeClass(l)}),e&&(this.element.bind("change"+this.eventNamespace,function(){if(v){return
}i.refresh()}),this.buttonElement.bind("mousedown"+this.eventNamespace,function(a){if(f.disabled){return
}v=!1,b=a.pageX,h=a.pageY}).bind("mouseup"+this.eventNamespace,function(a){if(f.disabled){return
}if(b!==a.pageX||h!==a.pageY){v=!0}})),this.type==="checkbox"?this.buttonElement.bind("click"+this.eventNamespace,function(){if(f.disabled||v){return !1
}k(this).toggleClass("ui-state-active"),i.buttonElement.attr("aria-pressed",i.element[0].checked)
}):this.type==="radio"?this.buttonElement.bind("click"+this.eventNamespace,function(){if(f.disabled||v){return !1
}k(this).addClass("ui-state-active"),i.buttonElement.attr("aria-pressed","true");
var a=i.element[0];g(a).not(a).map(function(){return k(this).button("widget")[0]}).removeClass("ui-state-active").attr("aria-pressed","false")
}):(this.buttonElement.bind("mousedown"+this.eventNamespace,function(){if(f.disabled){return !1
}k(this).addClass("ui-state-active"),d=this,i.document.one("mouseup",function(){d=null
})}).bind("mouseup"+this.eventNamespace,function(){if(f.disabled){return !1}k(this).removeClass("ui-state-active")
}).bind("keydown"+this.eventNamespace,function(a){if(f.disabled){return !1}(a.keyCode===k.ui.keyCode.SPACE||a.keyCode===k.ui.keyCode.ENTER)&&k(this).addClass("ui-state-active")
}).bind("keyup"+this.eventNamespace,function(){k(this).removeClass("ui-state-active")
}),this.buttonElement.is("a")&&this.buttonElement.keyup(function(a){a.keyCode===k.ui.keyCode.SPACE&&k(this).click()
})),this._setOption("disabled",f.disabled),this._resetButton()},_determineButtonType:function(){var f,a,i;
this.element.is("[type=checkbox]")?this.type="checkbox":this.element.is("[type=radio]")?this.type="radio":this.element.is("input")?this.type="input":this.type="button",this.type==="checkbox"||this.type==="radio"?(f=this.element.parents().last(),a="label[for='"+this.element.attr("id")+"']",this.buttonElement=f.find(a),this.buttonElement.length||(f=f.length?f.siblings():this.element.siblings(),this.buttonElement=f.filter(a),this.buttonElement.length||(this.buttonElement=f.find(a))),this.element.addClass("ui-helper-hidden-accessible"),i=this.element.is(":checked"),i&&this.buttonElement.addClass("ui-state-active"),this.buttonElement.prop("aria-pressed",i)):this.buttonElement=this.element
},widget:function(){return this.buttonElement},_destroy:function(){this.element.removeClass("ui-helper-hidden-accessible"),this.buttonElement.removeClass(c+" "+p+" "+m).removeAttr("role").removeAttr("aria-pressed").html(this.buttonElement.find(".ui-button-text").html()),this.hasTitle||this.buttonElement.removeAttr("title")
},_setOption:function(f,a){this._super(f,a);if(f==="disabled"){a?this.element.prop("disabled",!0):this.element.prop("disabled",!1);
return}this._resetButton()},refresh:function(){var a=this.element.is("input, button")?this.element.is(":disabled"):this.element.hasClass("ui-button-disabled");
a!==this.options.disabled&&this._setOption("disabled",a),this.type==="radio"?g(this.element[0]).each(function(){k(this).is(":checked")?k(this).button("widget").addClass("ui-state-active").attr("aria-pressed","true"):k(this).button("widget").removeClass("ui-state-active").attr("aria-pressed","false")
}):this.type==="checkbox"&&(this.element.is(":checked")?this.buttonElement.addClass("ui-state-active").attr("aria-pressed","true"):this.buttonElement.removeClass("ui-state-active").attr("aria-pressed","false"))
},_resetButton:function(){if(this.type==="input"){this.options.label&&this.element.val(this.options.label);
return}var e=this.buttonElement.removeClass(m),o=k("<span></span>",this.document[0]).addClass("ui-button-text").html(this.options.label).appendTo(e.empty()).text(),l=this.options.icons,a=l.primary&&l.secondary,f=[];
l.primary||l.secondary?(this.options.text&&f.push("ui-button-text-icon"+(a?"s":l.primary?"-primary":"-secondary")),l.primary&&e.prepend("<span class='ui-button-icon-primary ui-icon "+l.primary+"'></span>"),l.secondary&&e.append("<span class='ui-button-icon-secondary ui-icon "+l.secondary+"'></span>"),this.options.text||(f.push(a?"ui-button-icons-only":"ui-button-icon-only"),this.hasTitle||e.attr("title",k.trim(o)))):f.push("ui-button-text-only"),e.addClass(f.join(" "))
}}),k.widget("ui.buttonset",{version:"1.9.2",options:{items:"button, input[type=button], input[type=submit], input[type=reset], input[type=checkbox], input[type=radio], a, :data(button)"},_create:function(){this.element.addClass("ui-buttonset")
},_init:function(){this.refresh()},_setOption:function(f,a){f==="disabled"&&this.buttons.button("option",f,a),this._super(f,a)
},refresh:function(){var a=this.element.css("direction")==="rtl";this.buttons=this.element.find(this.options.items).filter(":ui-button").button("refresh").end().not(":ui-button").button().end().map(function(){return k(this).button("widget")[0]
}).removeClass("ui-corner-all ui-corner-left ui-corner-right").filter(":first").addClass(a?"ui-corner-right":"ui-corner-left").end().filter(":last").addClass(a?"ui-corner-left":"ui-corner-right").end().end()
},_destroy:function(){this.element.removeClass("ui-buttonset"),this.buttons.map(function(){return k(this).button("widget")[0]
}).removeClass("ui-corner-left ui-corner-right").end().button("destroy")}})}(jQuery),function($,undefined){function Datepicker(){this.debug=!1,this._curInst=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datepicker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-datepicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectableClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-days-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYear:!1,yearSuffix:""},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMonth:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},$.extend(this._defaults,this.regional[""]),this.dpDiv=bindHover($('<div id="'+this._mainDivId+'" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>'))
}function bindHover(e){var t="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";
return e.delegate(t,"mouseout",function(){$(this).removeClass("ui-state-hover"),this.className.indexOf("ui-datepicker-prev")!=-1&&$(this).removeClass("ui-datepicker-prev-hover"),this.className.indexOf("ui-datepicker-next")!=-1&&$(this).removeClass("ui-datepicker-next-hover")
}).delegate(t,"mouseover",function(){$.datepicker._isDisabledDatepicker(instActive.inline?e.parent()[0]:instActive.input[0])||($(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover"),$(this).addClass("ui-state-hover"),this.className.indexOf("ui-datepicker-prev")!=-1&&$(this).addClass("ui-datepicker-prev-hover"),this.className.indexOf("ui-datepicker-next")!=-1&&$(this).addClass("ui-datepicker-next-hover"))
})}function extendRemove(e,t){$.extend(e,t);for(var n in t){if(t[n]==null||t[n]==undefined){e[n]=t[n]
}}return e}$.extend($.ui,{datepicker:{version:"1.9.2"}});var PROP_NAME="datepicker",dpuuid=(new Date).getTime(),instActive;
$.extend(Datepicker.prototype,{markerClassName:"hasDatepicker",maxRows:4,log:function(){this.debug&&console.log.apply("",arguments)
},_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(e){return extendRemove(this._defaults,e||{}),this
},_attachDatepicker:function(target,settings){var inlineSettings=null;for(var attrName in this._defaults){var attrValue=target.getAttribute("date:"+attrName);
if(attrValue){inlineSettings=inlineSettings||{};try{inlineSettings[attrName]=eval(attrValue)
}catch(err){inlineSettings[attrName]=attrValue}}}var nodeName=target.nodeName.toLowerCase(),inline=nodeName=="div"||nodeName=="span";
target.id||(this.uuid+=1,target.id="dp"+this.uuid);var inst=this._newInst($(target),inline);
inst.settings=$.extend({},settings||{},inlineSettings||{}),nodeName=="input"?this._connectDatepicker(target,inst):inline&&this._inlineDatepicker(target,inst)
},_newInst:function(e,t){var n=e[0].id.replace(/([^A-Za-z0-9_-])/g,"\\\\$1");return{id:n,input:e,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:t,dpDiv:t?bindHover($('<div class="'+this._inlineClass+' ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>')):this.dpDiv}
},_connectDatepicker:function(e,t){var n=$(e);t.append=$([]),t.trigger=$([]);if(n.hasClass(this.markerClassName)){return
}this._attachments(n,t),n.addClass(this.markerClassName).keydown(this._doKeyDown).keypress(this._doKeyPress).keyup(this._doKeyUp).bind("setData.datepicker",function(e,n,r){t.settings[n]=r
}).bind("getData.datepicker",function(e,n){return this._get(t,n)}),this._autoSize(t),$.data(e,PROP_NAME,t),t.settings.disabled&&this._disableDatepicker(e)
},_attachments:function(e,t){var n=this._get(t,"appendText"),r=this._get(t,"isRTL");
t.append&&t.append.remove(),n&&(t.append=$('<span class="'+this._appendClass+'">'+n+"</span>"),e[r?"before":"after"](t.append)),e.unbind("focus",this._showDatepicker),t.trigger&&t.trigger.remove();
var i=this._get(t,"showOn");(i=="focus"||i=="both")&&e.focus(this._showDatepicker);
if(i=="button"||i=="both"){var s=this._get(t,"buttonText"),o=this._get(t,"buttonImage");
t.trigger=$(this._get(t,"buttonImageOnly")?$("<img/>").addClass(this._triggerClass).attr({src:o,alt:s,title:s}):$('<button type="button"></button>').addClass(this._triggerClass).html(o==""?s:$("<img/>").attr({src:o,alt:s,title:s}))),e[r?"before":"after"](t.trigger),t.trigger.click(function(){return $.datepicker._datepickerShowing&&$.datepicker._lastInput==e[0]?$.datepicker._hideDatepicker():$.datepicker._datepickerShowing&&$.datepicker._lastInput!=e[0]?($.datepicker._hideDatepicker(),$.datepicker._showDatepicker(e[0])):$.datepicker._showDatepicker(e[0]),!1
})}},_autoSize:function(e){if(this._get(e,"autoSize")&&!e.inline){var t=new Date(2009,11,20),n=this._get(e,"dateFormat");
if(n.match(/[DM]/)){var r=function(e){var t=0,n=0;for(var r=0;r<e.length;r++){e[r].length>t&&(t=e[r].length,n=r)
}return n};t.setMonth(r(this._get(e,n.match(/MM/)?"monthNames":"monthNamesShort"))),t.setDate(r(this._get(e,n.match(/DD/)?"dayNames":"dayNamesShort"))+20-t.getDay())
}e.input.attr("size",this._formatDate(e,t).length)}},_inlineDatepicker:function(e,t){var n=$(e);
if(n.hasClass(this.markerClassName)){return}n.addClass(this.markerClassName).append(t.dpDiv).bind("setData.datepicker",function(e,n,r){t.settings[n]=r
}).bind("getData.datepicker",function(e,n){return this._get(t,n)}),$.data(e,PROP_NAME,t),this._setDate(t,this._getDefaultDate(t),!0),this._updateDatepicker(t),this._updateAlternate(t),t.settings.disabled&&this._disableDatepicker(e),t.dpDiv.css("display","block")
},_dialogDatepicker:function(e,t,n,r,i){var s=this._dialogInst;if(!s){this.uuid+=1;
var o="dp"+this.uuid;this._dialogInput=$('<input type="text" id="'+o+'" style="position: absolute; top: -100px; width: 0px;"/>'),this._dialogInput.keydown(this._doKeyDown),$("body").append(this._dialogInput),s=this._dialogInst=this._newInst(this._dialogInput,!1),s.settings={},$.data(this._dialogInput[0],PROP_NAME,s)
}extendRemove(s.settings,r||{}),t=t&&t.constructor==Date?this._formatDate(s,t):t,this._dialogInput.val(t),this._pos=i?i.length?i:[i.pageX,i.pageY]:null;
if(!this._pos){var u=document.documentElement.clientWidth,a=document.documentElement.clientHeight,f=document.documentElement.scrollLeft||document.body.scrollLeft,l=document.documentElement.scrollTop||document.body.scrollTop;
this._pos=[u/2-100+f,a/2-150+l]}return this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),s.settings.onSelect=n,this._inDialog=!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),$.blockUI&&$.blockUI(this.dpDiv),$.data(this._dialogInput[0],PROP_NAME,s),this
},_destroyDatepicker:function(e){var t=$(e),n=$.data(e,PROP_NAME);if(!t.hasClass(this.markerClassName)){return
}var r=e.nodeName.toLowerCase();$.removeData(e,PROP_NAME),r=="input"?(n.append.remove(),n.trigger.remove(),t.removeClass(this.markerClassName).unbind("focus",this._showDatepicker).unbind("keydown",this._doKeyDown).unbind("keypress",this._doKeyPress).unbind("keyup",this._doKeyUp)):(r=="div"||r=="span")&&t.removeClass(this.markerClassName).empty()
},_enableDatepicker:function(e){var t=$(e),n=$.data(e,PROP_NAME);if(!t.hasClass(this.markerClassName)){return
}var r=e.nodeName.toLowerCase();if(r=="input"){e.disabled=!1,n.trigger.filter("button").each(function(){this.disabled=!1
}).end().filter("img").css({opacity:"1.0",cursor:""})}else{if(r=="div"||r=="span"){var i=t.children("."+this._inlineClass);
i.children().removeClass("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!1)
}}this._disabledInputs=$.map(this._disabledInputs,function(t){return t==e?null:t})
},_disableDatepicker:function(e){var t=$(e),n=$.data(e,PROP_NAME);if(!t.hasClass(this.markerClassName)){return
}var r=e.nodeName.toLowerCase();if(r=="input"){e.disabled=!0,n.trigger.filter("button").each(function(){this.disabled=!0
}).end().filter("img").css({opacity:"0.5",cursor:"default"})}else{if(r=="div"||r=="span"){var i=t.children("."+this._inlineClass);
i.children().addClass("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!0)
}}this._disabledInputs=$.map(this._disabledInputs,function(t){return t==e?null:t}),this._disabledInputs[this._disabledInputs.length]=e
},_isDisabledDatepicker:function(e){if(!e){return !1}for(var t=0;t<this._disabledInputs.length;
t++){if(this._disabledInputs[t]==e){return !0}}return !1},_getInst:function(e){try{return $.data(e,PROP_NAME)
}catch(t){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(e,t,n){var r=this._getInst(e);
if(arguments.length==2&&typeof t=="string"){return t=="defaults"?$.extend({},$.datepicker._defaults):r?t=="all"?$.extend({},r.settings):this._get(r,t):null
}var i=t||{};typeof t=="string"&&(i={},i[t]=n);if(r){this._curInst==r&&this._hideDatepicker();
var s=this._getDateDatepicker(e,!0),o=this._getMinMaxDate(r,"min"),u=this._getMinMaxDate(r,"max");
extendRemove(r.settings,i),o!==null&&i.dateFormat!==undefined&&i.minDate===undefined&&(r.settings.minDate=this._formatDate(r,o)),u!==null&&i.dateFormat!==undefined&&i.maxDate===undefined&&(r.settings.maxDate=this._formatDate(r,u)),this._attachments($(e),r),this._autoSize(r),this._setDate(r,s),this._updateAlternate(r),this._updateDatepicker(r)
}},_changeDatepicker:function(e,t,n){this._optionDatepicker(e,t,n)},_refreshDatepicker:function(e){var t=this._getInst(e);
t&&this._updateDatepicker(t)},_setDateDatepicker:function(e,t){var n=this._getInst(e);
n&&(this._setDate(n,t),this._updateDatepicker(n),this._updateAlternate(n))},_getDateDatepicker:function(e,t){var n=this._getInst(e);
return n&&!n.inline&&this._setDateFromField(n,t),n?this._getDate(n):null},_doKeyDown:function(e){var t=$.datepicker._getInst(e.target),n=!0,r=t.dpDiv.is(".ui-datepicker-rtl");
t._keyEvent=!0;if($.datepicker._datepickerShowing){switch(e.keyCode){case 9:$.datepicker._hideDatepicker(),n=!1;
break;case 13:var i=$("td."+$.datepicker._dayOverClass+":not(."+$.datepicker._currentClass+")",t.dpDiv);
i[0]&&$.datepicker._selectDay(e.target,t.selectedMonth,t.selectedYear,i[0]);var s=$.datepicker._get(t,"onSelect");
if(s){var o=$.datepicker._formatDate(t);s.apply(t.input?t.input[0]:null,[o,t])}else{$.datepicker._hideDatepicker()
}return !1;case 27:$.datepicker._hideDatepicker();break;case 33:$.datepicker._adjustDate(e.target,e.ctrlKey?-$.datepicker._get(t,"stepBigMonths"):-$.datepicker._get(t,"stepMonths"),"M");
break;case 34:$.datepicker._adjustDate(e.target,e.ctrlKey?+$.datepicker._get(t,"stepBigMonths"):+$.datepicker._get(t,"stepMonths"),"M");
break;case 35:(e.ctrlKey||e.metaKey)&&$.datepicker._clearDate(e.target),n=e.ctrlKey||e.metaKey;
break;case 36:(e.ctrlKey||e.metaKey)&&$.datepicker._gotoToday(e.target),n=e.ctrlKey||e.metaKey;
break;case 37:(e.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,r?1:-1,"D"),n=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&$.datepicker._adjustDate(e.target,e.ctrlKey?-$.datepicker._get(t,"stepBigMonths"):-$.datepicker._get(t,"stepMonths"),"M");
break;case 38:(e.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,-7,"D"),n=e.ctrlKey||e.metaKey;
break;case 39:(e.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,r?-1:1,"D"),n=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&$.datepicker._adjustDate(e.target,e.ctrlKey?+$.datepicker._get(t,"stepBigMonths"):+$.datepicker._get(t,"stepMonths"),"M");
break;case 40:(e.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,7,"D"),n=e.ctrlKey||e.metaKey;
break;default:n=!1}}else{e.keyCode==36&&e.ctrlKey?$.datepicker._showDatepicker(this):n=!1
}n&&(e.preventDefault(),e.stopPropagation())},_doKeyPress:function(e){var t=$.datepicker._getInst(e.target);
if($.datepicker._get(t,"constrainInput")){var n=$.datepicker._possibleChars($.datepicker._get(t,"dateFormat")),r=String.fromCharCode(e.charCode==undefined?e.keyCode:e.charCode);
return e.ctrlKey||e.metaKey||r<" "||!n||n.indexOf(r)>-1}},_doKeyUp:function(e){var t=$.datepicker._getInst(e.target);
if(t.input.val()!=t.lastVal){try{var n=$.datepicker.parseDate($.datepicker._get(t,"dateFormat"),t.input?t.input.val():null,$.datepicker._getFormatConfig(t));
n&&($.datepicker._setDateFromField(t),$.datepicker._updateAlternate(t),$.datepicker._updateDatepicker(t))
}catch(r){$.datepicker.log(r)}}return !0},_showDatepicker:function(e){e=e.target||e,e.nodeName.toLowerCase()!="input"&&(e=$("input",e.parentNode)[0]);
if($.datepicker._isDisabledDatepicker(e)||$.datepicker._lastInput==e){return}var t=$.datepicker._getInst(e);
$.datepicker._curInst&&$.datepicker._curInst!=t&&($.datepicker._curInst.dpDiv.stop(!0,!0),t&&$.datepicker._datepickerShowing&&$.datepicker._hideDatepicker($.datepicker._curInst.input[0]));
var n=$.datepicker._get(t,"beforeShow"),r=n?n.apply(e,[e,t]):{};if(r===!1){return
}extendRemove(t.settings,r),t.lastVal=null,$.datepicker._lastInput=e,$.datepicker._setDateFromField(t),$.datepicker._inDialog&&(e.value=""),$.datepicker._pos||($.datepicker._pos=$.datepicker._findPos(e),$.datepicker._pos[1]+=e.offsetHeight);
var i=!1;$(e).parents().each(function(){return i|=$(this).css("position")=="fixed",!i
});var s={left:$.datepicker._pos[0],top:$.datepicker._pos[1]};$.datepicker._pos=null,t.dpDiv.empty(),t.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),$.datepicker._updateDatepicker(t),s=$.datepicker._checkOffset(t,s,i),t.dpDiv.css({position:$.datepicker._inDialog&&$.blockUI?"static":i?"fixed":"absolute",display:"none",left:s.left+"px",top:s.top+"px"});
if(!t.inline){var o=$.datepicker._get(t,"showAnim"),u=$.datepicker._get(t,"duration"),a=function(){var e=t.dpDiv.find("iframe.ui-datepicker-cover");
if(!!e.length){var n=$.datepicker._getBorders(t.dpDiv);e.css({left:-n[0],top:-n[1],width:t.dpDiv.outerWidth(),height:t.dpDiv.outerHeight()})
}};t.dpDiv.zIndex($(e).zIndex()+1),$.datepicker._datepickerShowing=!0,$.effects&&($.effects.effect[o]||$.effects[o])?t.dpDiv.show(o,$.datepicker._get(t,"showOptions"),u,a):t.dpDiv[o||"show"](o?u:null,a),(!o||!u)&&a(),t.input.is(":visible")&&!t.input.is(":disabled")&&t.input.focus(),$.datepicker._curInst=t
}},_updateDatepicker:function(e){this.maxRows=4;var t=$.datepicker._getBorders(e.dpDiv);
instActive=e,e.dpDiv.empty().append(this._generateHTML(e)),this._attachHandlers(e);
var n=e.dpDiv.find("iframe.ui-datepicker-cover");!n.length||n.css({left:-t[0],top:-t[1],width:e.dpDiv.outerWidth(),height:e.dpDiv.outerHeight()}),e.dpDiv.find("."+this._dayOverClass+" a").mouseover();
var r=this._getNumberOfMonths(e),i=r[1],s=17;e.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),i>1&&e.dpDiv.addClass("ui-datepicker-multi-"+i).css("width",s*i+"em"),e.dpDiv[(r[0]!=1||r[1]!=1?"add":"remove")+"Class"]("ui-datepicker-multi"),e.dpDiv[(this._get(e,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl"),e==$.datepicker._curInst&&$.datepicker._datepickerShowing&&e.input&&e.input.is(":visible")&&!e.input.is(":disabled")&&e.input[0]!=document.activeElement&&e.input.focus();
if(e.yearshtml){var o=e.yearshtml;setTimeout(function(){o===e.yearshtml&&e.yearshtml&&e.dpDiv.find("select.ui-datepicker-year:first").replaceWith(e.yearshtml),o=e.yearshtml=null
},0)}},_getBorders:function(e){var t=function(e){return{thin:1,medium:2,thick:3}[e]||e
};return[parseFloat(t(e.css("border-left-width"))),parseFloat(t(e.css("border-top-width")))]
},_checkOffset:function(e,t,n){var r=e.dpDiv.outerWidth(),i=e.dpDiv.outerHeight(),s=e.input?e.input.outerWidth():0,o=e.input?e.input.outerHeight():0,u=document.documentElement.clientWidth+(n?0:$(document).scrollLeft()),a=document.documentElement.clientHeight+(n?0:$(document).scrollTop());
return t.left-=this._get(e,"isRTL")?r-s:0,t.left-=n&&t.left==e.input.offset().left?$(document).scrollLeft():0,t.top-=n&&t.top==e.input.offset().top+o?$(document).scrollTop():0,t.left-=Math.min(t.left,t.left+r>u&&u>r?Math.abs(t.left+r-u):0),t.top-=Math.min(t.top,t.top+i>a&&a>i?Math.abs(i+o):0),t
},_findPos:function(e){var t=this._getInst(e),n=this._get(t,"isRTL");while(e&&(e.type=="hidden"||e.nodeType!=1||$.expr.filters.hidden(e))){e=e[n?"previousSibling":"nextSibling"]
}var r=$(e).offset();return[r.left,r.top]},_hideDatepicker:function(e){var t=this._curInst;
if(!t||e&&t!=$.data(e,PROP_NAME)){return}if(this._datepickerShowing){var n=this._get(t,"showAnim"),r=this._get(t,"duration"),i=function(){$.datepicker._tidyDialog(t)
};$.effects&&($.effects.effect[n]||$.effects[n])?t.dpDiv.hide(n,$.datepicker._get(t,"showOptions"),r,i):t.dpDiv[n=="slideDown"?"slideUp":n=="fadeIn"?"fadeOut":"hide"](n?r:null,i),n||i(),this._datepickerShowing=!1;
var s=this._get(t,"onClose");s&&s.apply(t.input?t.input[0]:null,[t.input?t.input.val():"",t]),this._lastInput=null,this._inDialog&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),$.blockUI&&($.unblockUI(),$("body").append(this.dpDiv))),this._inDialog=!1
}},_tidyDialog:function(e){e.dpDiv.removeClass(this._dialogClass).unbind(".ui-datepicker-calendar")
},_checkExternalClick:function(e){if(!$.datepicker._curInst){return}var t=$(e.target),n=$.datepicker._getInst(t[0]);
(t[0].id!=$.datepicker._mainDivId&&t.parents("#"+$.datepicker._mainDivId).length==0&&!t.hasClass($.datepicker.markerClassName)&&!t.closest("."+$.datepicker._triggerClass).length&&$.datepicker._datepickerShowing&&(!$.datepicker._inDialog||!$.blockUI)||t.hasClass($.datepicker.markerClassName)&&$.datepicker._curInst!=n)&&$.datepicker._hideDatepicker()
},_adjustDate:function(e,t,n){var r=$(e),i=this._getInst(r[0]);if(this._isDisabledDatepicker(r[0])){return
}this._adjustInstDate(i,t+(n=="M"?this._get(i,"showCurrentAtPos"):0),n),this._updateDatepicker(i)
},_gotoToday:function(e){var t=$(e),n=this._getInst(t[0]);if(this._get(n,"gotoCurrent")&&n.currentDay){n.selectedDay=n.currentDay,n.drawMonth=n.selectedMonth=n.currentMonth,n.drawYear=n.selectedYear=n.currentYear
}else{var r=new Date;n.selectedDay=r.getDate(),n.drawMonth=n.selectedMonth=r.getMonth(),n.drawYear=n.selectedYear=r.getFullYear()
}this._notifyChange(n),this._adjustDate(t)},_selectMonthYear:function(e,t,n){var r=$(e),i=this._getInst(r[0]);
i["selected"+(n=="M"?"Month":"Year")]=i["draw"+(n=="M"?"Month":"Year")]=parseInt(t.options[t.selectedIndex].value,10),this._notifyChange(i),this._adjustDate(r)
},_selectDay:function(e,t,n,r){var i=$(e);if($(r).hasClass(this._unselectableClass)||this._isDisabledDatepicker(i[0])){return
}var s=this._getInst(i[0]);s.selectedDay=s.currentDay=$("a",r).html(),s.selectedMonth=s.currentMonth=t,s.selectedYear=s.currentYear=n,this._selectDate(e,this._formatDate(s,s.currentDay,s.currentMonth,s.currentYear))
},_clearDate:function(e){var t=$(e),n=this._getInst(t[0]);this._selectDate(t,"")},_selectDate:function(e,t){var n=$(e),r=this._getInst(n[0]);
t=t!=null?t:this._formatDate(r),r.input&&r.input.val(t),this._updateAlternate(r);
var i=this._get(r,"onSelect");i?i.apply(r.input?r.input[0]:null,[t,r]):r.input&&r.input.trigger("change"),r.inline?this._updateDatepicker(r):(this._hideDatepicker(),this._lastInput=r.input[0],typeof r.input[0]!="object"&&r.input.focus(),this._lastInput=null)
},_updateAlternate:function(e){var t=this._get(e,"altField");if(t){var n=this._get(e,"altFormat")||this._get(e,"dateFormat"),r=this._getDate(e),i=this.formatDate(n,r,this._getFormatConfig(e));
$(t).each(function(){$(this).val(i)})}},noWeekends:function(e){var t=e.getDay();return[t>0&&t<6,""]
},iso8601Week:function(e){var t=new Date(e.getTime());t.setDate(t.getDate()+4-(t.getDay()||7));
var n=t.getTime();return t.setMonth(0),t.setDate(1),Math.floor(Math.round((n-t)/86400000)/7)+1
},parseDate:function(e,t,n){if(e==null||t==null){throw"Invalid arguments"}t=typeof t=="object"?t.toString():t+"";
if(t==""){return null}var r=(n?n.shortYearCutoff:null)||this._defaults.shortYearCutoff;
r=typeof r!="string"?r:(new Date).getFullYear()%100+parseInt(r,10);var i=(n?n.dayNamesShort:null)||this._defaults.dayNamesShort,s=(n?n.dayNames:null)||this._defaults.dayNames,o=(n?n.monthNamesShort:null)||this._defaults.monthNamesShort,u=(n?n.monthNames:null)||this._defaults.monthNames,a=-1,f=-1,l=-1,c=-1,h=!1,p=function(t){var n=y+1<e.length&&e.charAt(y+1)==t;
return n&&y++,n},d=function(e){var n=p(e),r=e=="@"?14:e=="!"?20:e=="y"&&n?4:e=="o"?3:2,i=new RegExp("^\\d{1,"+r+"}"),s=t.substring(g).match(i);
if(!s){throw"Missing number at position "+g}return g+=s[0].length,parseInt(s[0],10)
},v=function(e,n,r){var i=$.map(p(e)?r:n,function(e,t){return[[t,e]]}).sort(function(e,t){return -(e[1].length-t[1].length)
}),s=-1;$.each(i,function(e,n){var r=n[1];if(t.substr(g,r.length).toLowerCase()==r.toLowerCase()){return s=n[0],g+=r.length,!1
}});if(s!=-1){return s+1}throw"Unknown name at position "+g},m=function(){if(t.charAt(g)!=e.charAt(y)){throw"Unexpected literal at position "+g
}g++},g=0;for(var y=0;y<e.length;y++){if(h){e.charAt(y)=="'"&&!p("'")?h=!1:m()}else{switch(e.charAt(y)){case"d":l=d("d");
break;case"D":v("D",i,s);break;case"o":c=d("o");break;case"m":f=d("m");break;case"M":f=v("M",o,u);
break;case"y":a=d("y");break;case"@":var b=new Date(d("@"));a=b.getFullYear(),f=b.getMonth()+1,l=b.getDate();
break;case"!":var b=new Date((d("!")-this._ticksTo1970)/10000);a=b.getFullYear(),f=b.getMonth()+1,l=b.getDate();
break;case"'":p("'")?m():h=!0;break;default:m()}}}if(g<t.length){var w=t.substr(g);
if(!/^\s+/.test(w)){throw"Extra/unparsed characters found in date: "+w}}a==-1?a=(new Date).getFullYear():a<100&&(a+=(new Date).getFullYear()-(new Date).getFullYear()%100+(a<=r?0:-100));
if(c>-1){f=1,l=c;do{var E=this._getDaysInMonth(a,f-1);if(l<=E){break}f++,l-=E}while(!0)
}var b=this._daylightSavingAdjust(new Date(a,f-1,l));if(b.getFullYear()!=a||b.getMonth()+1!=f||b.getDate()!=l){throw"Invalid date"
}return b},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:(718685+Math.floor(492.5)-Math.floor(19.7)+Math.floor(4.925))*24*60*60*10000000,formatDate:function(e,t,n){if(!t){return""
}var r=(n?n.dayNamesShort:null)||this._defaults.dayNamesShort,i=(n?n.dayNames:null)||this._defaults.dayNames,s=(n?n.monthNamesShort:null)||this._defaults.monthNamesShort,o=(n?n.monthNames:null)||this._defaults.monthNames,u=function(t){var n=h+1<e.length&&e.charAt(h+1)==t;
return n&&h++,n},a=function(e,t,n){var r=""+t;if(u(e)){while(r.length<n){r="0"+r}}return r
},f=function(e,t,n,r){return u(e)?r[t]:n[t]},l="",c=!1;if(t){for(var h=0;h<e.length;
h++){if(c){e.charAt(h)=="'"&&!u("'")?c=!1:l+=e.charAt(h)}else{switch(e.charAt(h)){case"d":l+=a("d",t.getDate(),2);
break;case"D":l+=f("D",t.getDay(),r,i);break;case"o":l+=a("o",Math.round(((new Date(t.getFullYear(),t.getMonth(),t.getDate())).getTime()-(new Date(t.getFullYear(),0,0)).getTime())/86400000),3);
break;case"m":l+=a("m",t.getMonth()+1,2);break;case"M":l+=f("M",t.getMonth(),s,o);
break;case"y":l+=u("y")?t.getFullYear():(t.getYear()%100<10?"0":"")+t.getYear()%100;
break;case"@":l+=t.getTime();break;case"!":l+=t.getTime()*10000+this._ticksTo1970;
break;case"'":u("'")?l+="'":c=!0;break;default:l+=e.charAt(h)}}}}return l},_possibleChars:function(e){var t="",n=!1,r=function(t){var n=i+1<e.length&&e.charAt(i+1)==t;
return n&&i++,n};for(var i=0;i<e.length;i++){if(n){e.charAt(i)=="'"&&!r("'")?n=!1:t+=e.charAt(i)
}else{switch(e.charAt(i)){case"d":case"m":case"y":case"@":t+="0123456789";break;case"D":case"M":return null;
case"'":r("'")?t+="'":n=!0;break;default:t+=e.charAt(i)}}}return t},_get:function(e,t){return e.settings[t]!==undefined?e.settings[t]:this._defaults[t]
},_setDateFromField:function(e,t){if(e.input.val()==e.lastVal){return}var n=this._get(e,"dateFormat"),r=e.lastVal=e.input?e.input.val():null,i,s;
i=s=this._getDefaultDate(e);var o=this._getFormatConfig(e);try{i=this.parseDate(n,r,o)||s
}catch(u){this.log(u),r=t?"":r}e.selectedDay=i.getDate(),e.drawMonth=e.selectedMonth=i.getMonth(),e.drawYear=e.selectedYear=i.getFullYear(),e.currentDay=r?i.getDate():0,e.currentMonth=r?i.getMonth():0,e.currentYear=r?i.getFullYear():0,this._adjustInstDate(e)
},_getDefaultDate:function(e){return this._restrictMinMax(e,this._determineDate(e,this._get(e,"defaultDate"),new Date))
},_determineDate:function(e,t,n){var r=function(e){var t=new Date;return t.setDate(t.getDate()+e),t
},i=function(t){try{return $.datepicker.parseDate($.datepicker._get(e,"dateFormat"),t,$.datepicker._getFormatConfig(e))
}catch(n){}var r=(t.toLowerCase().match(/^c/)?$.datepicker._getDate(e):null)||new Date,i=r.getFullYear(),s=r.getMonth(),o=r.getDate(),u=/([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,a=u.exec(t);
while(a){switch(a[2]||"d"){case"d":case"D":o+=parseInt(a[1],10);break;case"w":case"W":o+=parseInt(a[1],10)*7;
break;case"m":case"M":s+=parseInt(a[1],10),o=Math.min(o,$.datepicker._getDaysInMonth(i,s));
break;case"y":case"Y":i+=parseInt(a[1],10),o=Math.min(o,$.datepicker._getDaysInMonth(i,s))
}a=u.exec(t)}return new Date(i,s,o)},s=t==null||t===""?n:typeof t=="string"?i(t):typeof t=="number"?isNaN(t)?n:r(t):new Date(t.getTime());
return s=s&&s.toString()=="Invalid Date"?n:s,s&&(s.setHours(0),s.setMinutes(0),s.setSeconds(0),s.setMilliseconds(0)),this._daylightSavingAdjust(s)
},_daylightSavingAdjust:function(e){return e?(e.setHours(e.getHours()>12?e.getHours()+2:0),e):null
},_setDate:function(e,t,n){var r=!t,i=e.selectedMonth,s=e.selectedYear,o=this._restrictMinMax(e,this._determineDate(e,t,new Date));
e.selectedDay=e.currentDay=o.getDate(),e.drawMonth=e.selectedMonth=e.currentMonth=o.getMonth(),e.drawYear=e.selectedYear=e.currentYear=o.getFullYear(),(i!=e.selectedMonth||s!=e.selectedYear)&&!n&&this._notifyChange(e),this._adjustInstDate(e),e.input&&e.input.val(r?"":this._formatDate(e))
},_getDate:function(e){var t=!e.currentYear||e.input&&e.input.val()==""?null:this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));
return t},_attachHandlers:function(e){var t=this._get(e,"stepMonths"),n="#"+e.id.replace(/\\\\/g,"\\");
e.dpDiv.find("[data-handler]").map(function(){var e={prev:function(){window["DP_jQuery_"+dpuuid].datepicker._adjustDate(n,-t,"M")
},next:function(){window["DP_jQuery_"+dpuuid].datepicker._adjustDate(n,+t,"M")},hide:function(){window["DP_jQuery_"+dpuuid].datepicker._hideDatepicker()
},today:function(){window["DP_jQuery_"+dpuuid].datepicker._gotoToday(n)},selectDay:function(){return window["DP_jQuery_"+dpuuid].datepicker._selectDay(n,+this.getAttribute("data-month"),+this.getAttribute("data-year"),this),!1
},selectMonth:function(){return window["DP_jQuery_"+dpuuid].datepicker._selectMonthYear(n,this,"M"),!1
},selectYear:function(){return window["DP_jQuery_"+dpuuid].datepicker._selectMonthYear(n,this,"Y"),!1
}};$(this).bind(this.getAttribute("data-event"),e[this.getAttribute("data-handler")])
})},_generateHTML:function(e){var t=new Date;t=this._daylightSavingAdjust(new Date(t.getFullYear(),t.getMonth(),t.getDate()));
var n=this._get(e,"isRTL"),r=this._get(e,"showButtonPanel"),i=this._get(e,"hideIfNoPrevNext"),s=this._get(e,"navigationAsDateFormat"),o=this._getNumberOfMonths(e),u=this._get(e,"showCurrentAtPos"),a=this._get(e,"stepMonths"),f=o[0]!=1||o[1]!=1,l=this._daylightSavingAdjust(e.currentDay?new Date(e.currentYear,e.currentMonth,e.currentDay):new Date(9999,9,9)),c=this._getMinMaxDate(e,"min"),h=this._getMinMaxDate(e,"max"),p=e.drawMonth-u,d=e.drawYear;
p<0&&(p+=12,d--);if(h){var v=this._daylightSavingAdjust(new Date(h.getFullYear(),h.getMonth()-o[0]*o[1]+1,h.getDate()));
v=c&&v<c?c:v;while(this._daylightSavingAdjust(new Date(d,p,1))>v){p--,p<0&&(p=11,d--)
}}e.drawMonth=p,e.drawYear=d;var m=this._get(e,"prevText");m=s?this.formatDate(m,this._daylightSavingAdjust(new Date(d,p-a,1)),this._getFormatConfig(e)):m;
var g=this._canAdjustMonth(e,-1,d,p)?'<a class="ui-datepicker-prev ui-corner-all" data-handler="prev" data-event="click" title="'+m+'"><span class="ui-icon ui-icon-circle-triangle-'+(n?"e":"w")+'">'+m+"</span></a>":i?"":'<a class="ui-datepicker-prev ui-corner-all ui-state-disabled" title="'+m+'"><span class="ui-icon ui-icon-circle-triangle-'+(n?"e":"w")+'">'+m+"</span></a>",y=this._get(e,"nextText");
y=s?this.formatDate(y,this._daylightSavingAdjust(new Date(d,p+a,1)),this._getFormatConfig(e)):y;
var b=this._canAdjustMonth(e,1,d,p)?'<a class="ui-datepicker-next ui-corner-all" data-handler="next" data-event="click" title="'+y+'"><span class="ui-icon ui-icon-circle-triangle-'+(n?"w":"e")+'">'+y+"</span></a>":i?"":'<a class="ui-datepicker-next ui-corner-all ui-state-disabled" title="'+y+'"><span class="ui-icon ui-icon-circle-triangle-'+(n?"w":"e")+'">'+y+"</span></a>",w=this._get(e,"currentText"),E=this._get(e,"gotoCurrent")&&e.currentDay?l:t;
w=s?this.formatDate(w,E,this._getFormatConfig(e)):w;var S=e.inline?"":'<button type="button" class="ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all" data-handler="hide" data-event="click">'+this._get(e,"closeText")+"</button>",x=r?'<div class="ui-datepicker-buttonpane ui-widget-content">'+(n?S:"")+(this._isInRange(e,E)?'<button type="button" class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" data-handler="today" data-event="click">'+w+"</button>":"")+(n?"":S)+"</div>":"",T=parseInt(this._get(e,"firstDay"),10);
T=isNaN(T)?0:T;var N=this._get(e,"showWeek"),C=this._get(e,"dayNames"),k=this._get(e,"dayNamesShort"),L=this._get(e,"dayNamesMin"),A=this._get(e,"monthNames"),O=this._get(e,"monthNamesShort"),M=this._get(e,"beforeShowDay"),_=this._get(e,"showOtherMonths"),D=this._get(e,"selectOtherMonths"),P=this._get(e,"calculateWeek")||this.iso8601Week,H=this._getDefaultDate(e),B="";
for(var j=0;j<o[0];j++){var F="";this.maxRows=4;for(var I=0;I<o[1];I++){var q=this._daylightSavingAdjust(new Date(d,p,e.selectedDay)),R=" ui-corner-all",U="";
if(f){U+='<div class="ui-datepicker-group';if(o[1]>1){switch(I){case 0:U+=" ui-datepicker-group-first",R=" ui-corner-"+(n?"right":"left");
break;case o[1]-1:U+=" ui-datepicker-group-last",R=" ui-corner-"+(n?"left":"right");
break;default:U+=" ui-datepicker-group-middle",R=""}}U+='">'}U+='<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix'+R+'">'+(/all|left/.test(R)&&j==0?n?b:g:"")+(/all|right/.test(R)&&j==0?n?g:b:"")+this._generateMonthYearHeader(e,p,d,c,h,j>0||I>0,A,O)+'</div><table class="ui-datepicker-calendar"><thead><tr>';
var z=N?'<th class="ui-datepicker-week-col">'+this._get(e,"weekHeader")+"</th>":"";
for(var W=0;W<7;W++){var X=(W+T)%7;z+="<th"+((W+T+6)%7>=5?' class="ui-datepicker-week-end"':"")+'><span title="'+C[X]+'">'+L[X]+"</span></th>"
}U+=z+"</tr></thead><tbody>";var V=this._getDaysInMonth(d,p);d==e.selectedYear&&p==e.selectedMonth&&(e.selectedDay=Math.min(e.selectedDay,V));
var J=(this._getFirstDayOfMonth(d,p)-T+7)%7,K=Math.ceil((J+V)/7),Q=f?this.maxRows>K?this.maxRows:K:K;
this.maxRows=Q;var G=this._daylightSavingAdjust(new Date(d,p,1-J));for(var Y=0;Y<Q;
Y++){U+="<tr>";var Z=N?'<td class="ui-datepicker-week-col">'+this._get(e,"calculateWeek")(G)+"</td>":"";
for(var W=0;W<7;W++){var et=M?M.apply(e.input?e.input[0]:null,[G]):[!0,""],tt=G.getMonth()!=p,nt=tt&&!D||!et[0]||c&&G<c||h&&G>h;
Z+='<td class="'+((W+T+6)%7>=5?" ui-datepicker-week-end":"")+(tt?" ui-datepicker-other-month":"")+(G.getTime()==q.getTime()&&p==e.selectedMonth&&e._keyEvent||H.getTime()==G.getTime()&&H.getTime()==q.getTime()?" "+this._dayOverClass:"")+(nt?" "+this._unselectableClass+" ui-state-disabled":"")+(tt&&!_?"":" "+et[1]+(G.getTime()==l.getTime()?" "+this._currentClass:"")+(G.getTime()==t.getTime()?" ui-datepicker-today":""))+'"'+((!tt||_)&&et[2]?' title="'+et[2]+'"':"")+(nt?"":' data-handler="selectDay" data-event="click" data-month="'+G.getMonth()+'" data-year="'+G.getFullYear()+'"')+">"+(tt&&!_?"&#xa0;":nt?'<span class="ui-state-default">'+G.getDate()+"</span>":'<a class="ui-state-default'+(G.getTime()==t.getTime()?" ui-state-highlight":"")+(G.getTime()==l.getTime()?" ui-state-active":"")+(tt?" ui-priority-secondary":"")+'" href="#">'+G.getDate()+"</a>")+"</td>",G.setDate(G.getDate()+1),G=this._daylightSavingAdjust(G)
}U+=Z+"</tr>"}p++,p>11&&(p=0,d++),U+="</tbody></table>"+(f?"</div>"+(o[0]>0&&I==o[1]-1?'<div class="ui-datepicker-row-break"></div>':""):""),F+=U
}B+=F}return B+=x+($.ui.ie6&&!e.inline?'<iframe src="javascript:false;" class="ui-datepicker-cover" frameborder="0"></iframe>':""),e._keyEvent=!1,B
},_generateMonthYearHeader:function(e,t,n,r,i,s,o,u){var a=this._get(e,"changeMonth"),f=this._get(e,"changeYear"),l=this._get(e,"showMonthAfterYear"),c='<div class="ui-datepicker-title">',h="";
if(s||!a){h+='<span class="ui-datepicker-month">'+o[t]+"</span>"}else{var p=r&&r.getFullYear()==n,d=i&&i.getFullYear()==n;
h+='<select class="ui-datepicker-month" data-handler="selectMonth" data-event="change">';
for(var v=0;v<12;v++){(!p||v>=r.getMonth())&&(!d||v<=i.getMonth())&&(h+='<option value="'+v+'"'+(v==t?' selected="selected"':"")+">"+u[v]+"</option>")
}h+="</select>"}l||(c+=h+(s||!a||!f?"&#xa0;":""));if(!e.yearshtml){e.yearshtml="";
if(s||!f){c+='<span class="ui-datepicker-year">'+n+"</span>"}else{var m=this._get(e,"yearRange").split(":"),g=(new Date).getFullYear(),y=function(e){var t=e.match(/c[+-].*/)?n+parseInt(e.substring(1),10):e.match(/[+-].*/)?g+parseInt(e,10):parseInt(e,10);
return isNaN(t)?g:t},b=y(m[0]),w=Math.max(b,y(m[1]||""));b=r?Math.max(b,r.getFullYear()):b,w=i?Math.min(w,i.getFullYear()):w,e.yearshtml+='<select class="ui-datepicker-year" data-handler="selectYear" data-event="change">';
for(;b<=w;b++){e.yearshtml+='<option value="'+b+'"'+(b==n?' selected="selected"':"")+">"+b+"</option>"
}e.yearshtml+="</select>",c+=e.yearshtml,e.yearshtml=null}}return c+=this._get(e,"yearSuffix"),l&&(c+=(s||!a||!f?"&#xa0;":"")+h),c+="</div>",c
},_adjustInstDate:function(e,t,n){var r=e.drawYear+(n=="Y"?t:0),i=e.drawMonth+(n=="M"?t:0),s=Math.min(e.selectedDay,this._getDaysInMonth(r,i))+(n=="D"?t:0),o=this._restrictMinMax(e,this._daylightSavingAdjust(new Date(r,i,s)));
e.selectedDay=o.getDate(),e.drawMonth=e.selectedMonth=o.getMonth(),e.drawYear=e.selectedYear=o.getFullYear(),(n=="M"||n=="Y")&&this._notifyChange(e)
},_restrictMinMax:function(e,t){var n=this._getMinMaxDate(e,"min"),r=this._getMinMaxDate(e,"max"),i=n&&t<n?n:t;
return i=r&&i>r?r:i,i},_notifyChange:function(e){var t=this._get(e,"onChangeMonthYear");
t&&t.apply(e.input?e.input[0]:null,[e.selectedYear,e.selectedMonth+1,e])},_getNumberOfMonths:function(e){var t=this._get(e,"numberOfMonths");
return t==null?[1,1]:typeof t=="number"?[1,t]:t},_getMinMaxDate:function(e,t){return this._determineDate(e,this._get(e,t+"Date"),null)
},_getDaysInMonth:function(e,t){return 32-this._daylightSavingAdjust(new Date(e,t,32)).getDate()
},_getFirstDayOfMonth:function(e,t){return(new Date(e,t,1)).getDay()},_canAdjustMonth:function(e,t,n,r){var i=this._getNumberOfMonths(e),s=this._daylightSavingAdjust(new Date(n,r+(t<0?t:i[0]*i[1]),1));
return t<0&&s.setDate(this._getDaysInMonth(s.getFullYear(),s.getMonth())),this._isInRange(e,s)
},_isInRange:function(e,t){var n=this._getMinMaxDate(e,"min"),r=this._getMinMaxDate(e,"max");
return(!n||t.getTime()>=n.getTime())&&(!r||t.getTime()<=r.getTime())},_getFormatConfig:function(e){var t=this._get(e,"shortYearCutoff");
return t=typeof t!="string"?t:(new Date).getFullYear()%100+parseInt(t,10),{shortYearCutoff:t,dayNamesShort:this._get(e,"dayNamesShort"),dayNames:this._get(e,"dayNames"),monthNamesShort:this._get(e,"monthNamesShort"),monthNames:this._get(e,"monthNames")}
},_formatDate:function(e,t,n,r){t||(e.currentDay=e.selectedDay,e.currentMonth=e.selectedMonth,e.currentYear=e.selectedYear);
var i=t?typeof t=="object"?t:this._daylightSavingAdjust(new Date(r,n,t)):this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));
return this.formatDate(this._get(e,"dateFormat"),i,this._getFormatConfig(e))}}),$.fn.datepicker=function(e){if(!this.length){return this
}$.datepicker.initialized||($(document).mousedown($.datepicker._checkExternalClick).find(document.body).append($.datepicker.dpDiv),$.datepicker.initialized=!0);
var t=Array.prototype.slice.call(arguments,1);return typeof e!="string"||e!="isDisabled"&&e!="getDate"&&e!="widget"?e=="option"&&arguments.length==2&&typeof arguments[1]=="string"?$.datepicker["_"+e+"Datepicker"].apply($.datepicker,[this[0]].concat(t)):this.each(function(){typeof e=="string"?$.datepicker["_"+e+"Datepicker"].apply($.datepicker,[this].concat(t)):$.datepicker._attachDatepicker(this,e)
}):$.datepicker["_"+e+"Datepicker"].apply($.datepicker,[this[0]].concat(t))},$.datepicker=new Datepicker,$.datepicker.initialized=!1,$.datepicker.uuid=(new Date).getTime(),$.datepicker.version="1.9.2",window["DP_jQuery_"+dpuuid]=$
}(jQuery),function(d,b){var f="ui-dialog ui-widget ui-widget-content ui-corner-all ",c={buttons:!0,height:!0,maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!0,width:!0},a={maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!0};
d.widget("ui.dialog",{version:"1.9.2",options:{autoOpen:!0,buttons:{},closeOnEscape:!0,closeText:"close",dialogClass:"",draggable:!0,hide:null,height:"auto",maxHeight:!1,maxWidth:!1,minHeight:150,minWidth:150,modal:!1,position:{my:"center",at:"center",of:window,collision:"fit",using:function(e){var g=d(this).css(e).offset().top;
g<0&&d(this).css("top",e.top-g)}},resizable:!0,show:null,stack:!0,title:"",width:300,zIndex:1000},_create:function(){this.originalTitle=this.element.attr("title"),typeof this.originalTitle!="string"&&(this.originalTitle=""),this.oldPosition={parent:this.element.parent(),index:this.element.parent().children().index(this.element)},this.options.title=this.options.title||this.originalTitle;
var j=this,l=this.options,h=l.title||"&#160;",k,n,g,e,m;k=(this.uiDialog=d("<div>")).addClass(f+l.dialogClass).css({display:"none",outline:0,zIndex:l.zIndex}).attr("tabIndex",-1).keydown(function(i){l.closeOnEscape&&!i.isDefaultPrevented()&&i.keyCode&&i.keyCode===d.ui.keyCode.ESCAPE&&(j.close(i),i.preventDefault())
}).mousedown(function(i){j.moveToTop(!1,i)}).appendTo("body"),this.element.show().removeAttr("title").addClass("ui-dialog-content ui-widget-content").appendTo(k),n=(this.uiDialogTitlebar=d("<div>")).addClass("ui-dialog-titlebar  ui-widget-header  ui-corner-all  ui-helper-clearfix").bind("mousedown",function(){k.focus()
}).prependTo(k),g=d("<a href='#'></a>").addClass("ui-dialog-titlebar-close  ui-corner-all").attr("role","button").click(function(i){i.preventDefault(),j.close(i)
}).appendTo(n),(this.uiDialogTitlebarCloseText=d("<span>")).addClass("ui-icon ui-icon-closethick").text(l.closeText).appendTo(g),e=d("<span>").uniqueId().addClass("ui-dialog-title").html(h).prependTo(n),m=(this.uiDialogButtonPane=d("<div>")).addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"),(this.uiButtonSet=d("<div>")).addClass("ui-dialog-buttonset").appendTo(m),k.attr({role:"dialog","aria-labelledby":e.attr("id")}),n.find("*").add(n).disableSelection(),this._hoverable(g),this._focusable(g),l.draggable&&d.fn.draggable&&this._makeDraggable(),l.resizable&&d.fn.resizable&&this._makeResizable(),this._createButtons(l.buttons),this._isOpen=!1,d.fn.bgiframe&&k.bgiframe(),this._on(k,{keydown:function(q){if(!l.modal||q.keyCode!==d.ui.keyCode.TAB){return
}var s=d(":tabbable",k),p=s.filter(":first"),r=s.filter(":last");if(q.target===r[0]&&!q.shiftKey){return p.focus(1),!1
}if(q.target===p[0]&&q.shiftKey){return r.focus(1),!1}}})},_init:function(){this.options.autoOpen&&this.open()
},_destroy:function(){var h,g=this.oldPosition;this.overlay&&this.overlay.destroy(),this.uiDialog.hide(),this.element.removeClass("ui-dialog-content ui-widget-content").hide().appendTo("body"),this.uiDialog.remove(),this.originalTitle&&this.element.attr("title",this.originalTitle),h=g.parent.children().eq(g.index),h.length&&h[0]!==this.element[0]?h.before(this.element):g.parent.append(this.element)
},widget:function(){return this.uiDialog},close:function(g){var j=this,h,e;if(!this._isOpen){return
}if(!1===this._trigger("beforeClose",g)){return}return this._isOpen=!1,this.overlay&&this.overlay.destroy(),this.options.hide?this._hide(this.uiDialog,this.options.hide,function(){j._trigger("close",g)
}):(this.uiDialog.hide(),this._trigger("close",g)),d.ui.dialog.overlay.resize(),this.options.modal&&(h=0,d(".ui-dialog").each(function(){this!==j.uiDialog[0]&&(e=d(this).css("z-index"),isNaN(e)||(h=Math.max(h,e)))
}),d.ui.dialog.maxZ=h),this},isOpen:function(){return this._isOpen},moveToTop:function(g,j){var h=this.options,e;
return h.modal&&!g||!h.stack&&!h.modal?this._trigger("focus",j):(h.zIndex>d.ui.dialog.maxZ&&(d.ui.dialog.maxZ=h.zIndex),this.overlay&&(d.ui.dialog.maxZ+=1,d.ui.dialog.overlay.maxZ=d.ui.dialog.maxZ,this.overlay.$el.css("z-index",d.ui.dialog.overlay.maxZ)),e={scrollTop:this.element.scrollTop(),scrollLeft:this.element.scrollLeft()},d.ui.dialog.maxZ+=1,this.uiDialog.css("z-index",d.ui.dialog.maxZ),this.element.attr(e),this._trigger("focus",j),this)
},open:function(){if(this._isOpen){return}var e,h=this.options,g=this.uiDialog;return this._size(),this._position(h.position),g.show(h.show),this.overlay=h.modal?new d.ui.dialog.overlay(this):null,this.moveToTop(!0),e=this.element.find(":tabbable"),e.length||(e=this.uiDialogButtonPane.find(":tabbable"),e.length||(e=g)),e.eq(0).focus(),this._isOpen=!0,this._trigger("open"),this
},_createButtons:function(e){var h=this,g=!1;this.uiDialogButtonPane.remove(),this.uiButtonSet.empty(),typeof e=="object"&&e!==null&&d.each(e,function(){return !(g=!0)
}),g?(d.each(e,function(k,m){var j,l;m=d.isFunction(m)?{click:m,text:k}:m,m=d.extend({type:"button"},m),l=m.click,m.click=function(){l.apply(h.element[0],arguments)
},j=d("<button></button>",m).appendTo(h.uiButtonSet),d.fn.button&&j.button()}),this.uiDialog.addClass("ui-dialog-buttons"),this.uiDialogButtonPane.appendTo(this.uiDialog)):this.uiDialog.removeClass("ui-dialog-buttons")
},_makeDraggable:function(){function g(i){return{position:i.position,offset:i.offset}
}var e=this,h=this.options;this.uiDialog.draggable({cancel:".ui-dialog-content, .ui-dialog-titlebar-close",handle:".ui-dialog-titlebar",containment:"document",start:function(k,j){d(this).addClass("ui-dialog-dragging"),e._trigger("dragStart",k,g(j))
},drag:function(i,j){e._trigger("drag",i,g(j))},stop:function(j,k){h.position=[k.position.left-e.document.scrollLeft(),k.position.top-e.document.scrollTop()],d(this).removeClass("ui-dialog-dragging"),e._trigger("dragStop",j,g(k)),d.ui.dialog.overlay.resize()
}})},_makeResizable:function(l){function e(i){return{originalPosition:i.originalPosition,originalSize:i.originalSize,position:i.position,size:i.size}
}l=l===b?this.options.resizable:l;var j=this,g=this.options,h=this.uiDialog.css("position"),k=typeof l=="string"?l:"n,e,s,w,se,sw,ne,nw";
this.uiDialog.resizable({cancel:".ui-dialog-content",containment:"document",alsoResize:this.element,maxWidth:g.maxWidth,maxHeight:g.maxHeight,minWidth:g.minWidth,minHeight:this._minHeight(),handles:k,start:function(i,m){d(this).addClass("ui-dialog-resizing"),j._trigger("resizeStart",i,e(m))
},resize:function(m,i){j._trigger("resize",m,e(i))},stop:function(i,m){d(this).removeClass("ui-dialog-resizing"),g.height=d(this).height(),g.width=d(this).width(),j._trigger("resizeStop",i,e(m)),d.ui.dialog.overlay.resize()
}}).css("position",h).find(".ui-resizable-se").addClass("ui-icon ui-icon-grip-diagonal-se")
},_minHeight:function(){var g=this.options;return g.height==="auto"?g.minHeight:Math.min(g.minHeight,g.height)
},_position:function(g){var j=[],h=[0,0],e;if(g){if(typeof g=="string"||typeof g=="object"&&"0" in g){j=g.split?g.split(" "):[g[0],g[1]],j.length===1&&(j[1]=j[0]),d.each(["left","top"],function(k,i){+j[k]===j[k]&&(h[k]=j[k],j[k]=i)
}),g={my:j[0]+(h[0]<0?h[0]:"+"+h[0])+" "+j[1]+(h[1]<0?h[1]:"+"+h[1]),at:j.join(" ")}
}g=d.extend({},d.ui.dialog.prototype.options.position,g)}else{g=d.ui.dialog.prototype.options.position
}e=this.uiDialog.is(":visible"),e||this.uiDialog.show(),this.uiDialog.position(g),e||this.uiDialog.hide()
},_setOptions:function(e){var i=this,g={},h=!1;d.each(e,function(k,j){i._setOption(k,j),k in c&&(h=!0),k in a&&(g[k]=j)
}),h&&this._size(),this.uiDialog.is(":data(resizable)")&&this.uiDialog.resizable("option",g)
},_setOption:function(g,j){var e,h,k=this.uiDialog;switch(g){case"buttons":this._createButtons(j);
break;case"closeText":this.uiDialogTitlebarCloseText.text(""+j);break;case"dialogClass":k.removeClass(this.options.dialogClass).addClass(f+j);
break;case"disabled":j?k.addClass("ui-dialog-disabled"):k.removeClass("ui-dialog-disabled");
break;case"draggable":e=k.is(":data(draggable)"),e&&!j&&k.draggable("destroy"),!e&&j&&this._makeDraggable();
break;case"position":this._position(j);break;case"resizable":h=k.is(":data(resizable)"),h&&!j&&k.resizable("destroy"),h&&typeof j=="string"&&k.resizable("option","handles",j),!h&&j!==!1&&this._makeResizable(j);
break;case"title":d(".ui-dialog-title",this.uiDialogTitlebar).html(""+(j||"&#160;"))
}this._super(g,j)},_size:function(){var g,k,j,e=this.options,h=this.uiDialog.is(":visible");
this.element.show().css({width:"auto",minHeight:0,height:0}),e.minWidth>e.width&&(e.width=e.minWidth),g=this.uiDialog.css({height:"auto",width:e.width}).outerHeight(),k=Math.max(0,e.minHeight-g),e.height==="auto"?d.support.minHeight?this.element.css({minHeight:k,height:"auto"}):(this.uiDialog.show(),j=this.element.css("height","auto").height(),h||this.uiDialog.hide(),this.element.height(Math.max(j,k))):this.element.height(Math.max(e.height-g,0)),this.uiDialog.is(":data(resizable)")&&this.uiDialog.resizable("option","minHeight",this._minHeight())
}}),d.extend(d.ui.dialog,{uuid:0,maxZ:0,getTitleId:function(h){var g=h.attr("id");
return g||(this.uuid+=1,g=this.uuid),"ui-dialog-title-"+g},overlay:function(e){this.$el=d.ui.dialog.overlay.create(e)
}}),d.extend(d.ui.dialog.overlay,{instances:[],oldInstances:[],maxZ:0,events:d.map("focus,mousedown,mouseup,keydown,keypress,click".split(","),function(g){return g+".dialog-overlay"
}).join(" "),create:function(e){this.instances.length===0&&(setTimeout(function(){d.ui.dialog.overlay.instances.length&&d(document).bind(d.ui.dialog.overlay.events,function(h){if(d(h.target).zIndex()<d.ui.dialog.overlay.maxZ){return !1
}})},1),d(window).bind("resize.dialog-overlay",d.ui.dialog.overlay.resize));var g=this.oldInstances.pop()||d("<div>").addClass("ui-widget-overlay");
return d(document).bind("keydown.dialog-overlay",function(j){var h=d.ui.dialog.overlay.instances;
h.length!==0&&h[h.length-1]===g&&e.options.closeOnEscape&&!j.isDefaultPrevented()&&j.keyCode&&j.keyCode===d.ui.keyCode.ESCAPE&&(e.close(j),j.preventDefault())
}),g.appendTo(document.body).css({width:this.width(),height:this.height()}),d.fn.bgiframe&&g.bgiframe(),this.instances.push(g),g
},destroy:function(e){var h=d.inArray(e,this.instances),g=0;h!==-1&&this.oldInstances.push(this.instances.splice(h,1)[0]),this.instances.length===0&&d([document,window]).unbind(".dialog-overlay"),e.height(0).width(0).remove(),d.each(this.instances,function(){g=Math.max(g,this.css("z-index"))
}),this.maxZ=g},height:function(){var e,g;return d.ui.ie?(e=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight),g=Math.max(document.documentElement.offsetHeight,document.body.offsetHeight),e<g?d(window).height()+"px":e+"px"):d(document).height()+"px"
},width:function(){var e,g;return d.ui.ie?(e=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),g=Math.max(document.documentElement.offsetWidth,document.body.offsetWidth),e<g?d(window).width()+"px":e+"px"):d(document).width()+"px"
},resize:function(){var e=d([]);d.each(d.ui.dialog.overlay.instances,function(){e=e.add(this)
}),e.css({width:0,height:0}).css({width:d.ui.dialog.overlay.width(),height:d.ui.dialog.overlay.height()})
}}),d.extend(d.ui.dialog.overlay.prototype,{destroy:function(){d.ui.dialog.overlay.destroy(this.$el)
}})}(jQuery),function(c,a){var d=/up|down|vertical/,b=/up|left|vertical|horizontal/;
c.effects.effect.blind=function(D,q){var E=c(this),j=["position","top","bottom","left","right","height","width"],C=c.effects.setMode(E,D.mode||"hide"),A=D.direction||"up",x=d.test(A),n=x?"height":"width",z=x?"top":"left",r=b.test(A),e={},y=C==="show",B,k,w;
E.parent().is(".ui-effects-wrapper")?c.effects.save(E.parent(),j):c.effects.save(E,j),E.show(),B=c.effects.createWrapper(E).css({overflow:"hidden"}),k=B[n](),w=parseFloat(B.css(z))||0,e[n]=y?k:0,r||(E.css(x?"bottom":"right",0).css(x?"top":"left","auto").css({position:"absolute"}),e[z]=y?w:k+w),y&&(B.css(n,0),r||B.css(z,w+k)),B.animate(e,{duration:D.duration,easing:D.easing,queue:!1,complete:function(){C==="hide"&&E.hide(),c.effects.restore(E,j),c.effects.removeWrapper(E),q()
}})}}(jQuery),function(b,a){b.effects.effect.bounce=function(x,D){var A=b(this),G=["position","top","bottom","left","right","height","width"],z=b.effects.setMode(A,x.mode||"effect"),C=z==="hide",q=z==="show",N=x.direction||"up",J=x.distance,F=x.times||5,L=F*2+(q||C?1:0),H=x.duration/L,B=x.easing,K=N==="up"||N==="down"?"top":"left",k=N==="up"||N==="left",E,I,e,M=A.queue(),j=M.length;
(q||C)&&G.push("opacity"),b.effects.save(A,G),A.show(),b.effects.createWrapper(A),J||(J=A[K==="top"?"outerHeight":"outerWidth"]()/3),q&&(e={opacity:1},e[K]=0,A.css("opacity",0).css(K,k?-J*2:J*2).animate(e,H,B)),C&&(J/=Math.pow(2,F-1)),e={},e[K]=0;
for(E=0;E<F;E++){I={},I[K]=(k?"-=":"+=")+J,A.animate(I,H,B).animate(e,H,B),J=C?J*2:J/2
}C&&(I={opacity:0},I[K]=(k?"-=":"+=")+J,A.animate(I,H,B)),A.queue(function(){C&&A.hide(),b.effects.restore(A,G),b.effects.removeWrapper(A),D()
}),j>1&&M.splice.apply(M,[1,0].concat(M.splice(j,L+1))),A.dequeue()}}(jQuery),function(b,a){b.effects.effect.clip=function(B,k){var e=b(this),q=["position","top","bottom","left","right","height","width"],C=b.effects.setMode(e,B.mode||"hide"),j=C==="show",A=B.direction||"vertical",z=A==="vertical",w=z?"height":"width",m=z?"top":"left",y={},v,g,x;
b.effects.save(e,q),e.show(),v=b.effects.createWrapper(e).css({overflow:"hidden"}),g=e[0].tagName==="IMG"?v:e,x=g[w](),j&&(g.css(w,0),g.css(m,x/2)),y[w]=j?x:0,y[m]=j?0:x/2,g.animate(y,{queue:!1,duration:B.duration,easing:B.easing,complete:function(){j||e.hide(),b.effects.restore(e,q),b.effects.removeWrapper(e),k()
}})}}(jQuery),function(b,a){b.effects.effect.drop=function(v,g){var d=b(this),j=["position","top","bottom","left","right","opacity","height","width"],w=b.effects.setMode(d,v.mode||"hide"),e=w==="show",q=v.direction||"left",p=q==="up"||q==="down"?"top":"left",k=q==="up"||q==="left"?"pos":"neg",h={opacity:e?1:0},m;
b.effects.save(d,j),d.show(),b.effects.createWrapper(d),m=v.distance||d[p==="top"?"outerHeight":"outerWidth"](!0)/2,e&&d.css("opacity",0).css(p,k==="pos"?-m:m),h[p]=(e?k==="pos"?"+=":"-=":k==="pos"?"-=":"+=")+m,d.animate(h,{queue:!1,duration:v.duration,easing:v.easing,complete:function(){w==="hide"&&d.hide(),b.effects.restore(d,j),b.effects.removeWrapper(d),g()
}})}}(jQuery),function(b,a){b.effects.effect.explode=function(q,B){function e(){J.push(this),J.length===x*E&&K()
}function K(){w.css({visibility:"visible"}),b(J).remove(),k||w.hide(),B()}var x=q.pieces?Math.round(Math.sqrt(q.pieces)):3,E=x,w=b(this),A=b.effects.setMode(w,q.mode||"hide"),k=A==="show",L=w.show().css("visibility","hidden").offset(),H=Math.ceil(w.outerWidth()/E),D=Math.ceil(w.outerHeight()/x),J=[],F,z,I,j,C,G;
for(F=0;F<x;F++){j=L.top+F*D,G=F-(x-1)/2;for(z=0;z<E;z++){I=L.left+z*H,C=z-(E-1)/2,w.clone().appendTo("body").wrap("<div></div>").css({position:"absolute",visibility:"visible",left:-z*H,top:-F*D}).parent().addClass("ui-effects-explode").css({position:"absolute",overflow:"hidden",width:H,height:D,left:I+(k?C*H:0),top:j+(k?G*D:0),opacity:k?0:1}).animate({left:I+(k?0:C*H),top:j+(k?0:G*D),opacity:k?1:0},q.duration||500,q.easing,e)
}}}}(jQuery),function(b,a){b.effects.effect.fade=function(d,f){var e=b(this),c=b.effects.setMode(e,d.mode||"toggle");
e.animate({opacity:c},{queue:!1,duration:d.duration,easing:d.easing,complete:f})}
}(jQuery),function(b,a){b.effects.effect.fold=function(H,q){var e=b(this),y=["position","top","bottom","left","right","height","width"],I=b.effects.setMode(e,H.mode||"hide"),k=I==="show",G=I==="hide",E=H.size||15,B=/([0-9]+)%/.exec(E),x=!!H.horizFirst,D=k!==x,z=D?["width","height"]:["height","width"],j=H.duration/2,C,F,w={},A={};
b.effects.save(e,y),e.show(),C=b.effects.createWrapper(e).css({overflow:"hidden"}),F=D?[C.width(),C.height()]:[C.height(),C.width()],B&&(E=parseInt(B[1],10)/100*F[G?0:1]),k&&C.css(x?{height:0,width:E}:{height:E,width:0}),w[z[0]]=k?F[0]:E,A[z[1]]=k?F[1]:0,C.animate(w,j,H.easing).animate(A,j,H.easing,function(){G&&e.hide(),b.effects.restore(e,y),b.effects.removeWrapper(e),q()
})}}(jQuery),function(b,a){b.effects.effect.highlight=function(d,h){var f=b(this),c=["backgroundImage","backgroundColor","opacity"],e=b.effects.setMode(f,d.mode||"show"),g={backgroundColor:f.css("backgroundColor")};
e==="hide"&&(g.opacity=0),b.effects.save(f,c),f.show().css({backgroundImage:"none",backgroundColor:d.color||"#ffff99"}).animate(g,{queue:!1,duration:d.duration,easing:d.easing,complete:function(){e==="hide"&&f.hide(),b.effects.restore(f,c),h()
}})}}(jQuery),function(b,a){b.effects.effect.pulsate=function(z,j){var d=b(this),m=b.effects.setMode(d,z.mode||"show"),A=m==="show",g=m==="hide",y=A||m==="hide",x=(z.times||5)*2+(y?1:0),v=z.duration/x,k=0,w=d.queue(),q=w.length,e;
if(A||!d.is(":visible")){d.css("opacity",0).show(),k=1}for(e=1;e<x;e++){d.animate({opacity:k},v,z.easing),k=1-k
}d.animate({opacity:k},v,z.easing),d.queue(function(){g&&d.hide(),j()}),q>1&&w.splice.apply(w,[1,0].concat(w.splice(q,x+1))),d.dequeue()
}}(jQuery),function(b,a){b.effects.effect.puff=function(f,k){var h=b(this),e=b.effects.setMode(h,f.mode||"hide"),g=e==="hide",j=parseInt(f.percent,10)||150,d=j/100,c={height:h.height(),width:h.width(),outerHeight:h.outerHeight(),outerWidth:h.outerWidth()};
b.extend(f,{effect:"scale",queue:!1,fade:!0,mode:e,complete:k,percent:g?j:100,from:g?c:{height:c.height*d,width:c.width*d,outerHeight:c.outerHeight*d,outerWidth:c.outerWidth*d}}),h.effect(f)
},b.effects.effect.scale=function(p,e){var c=b(this),h=b.extend(!0,{},p),q=b.effects.setMode(c,p.mode||"effect"),d=parseInt(p.percent,10)||(parseInt(p.percent,10)===0?0:q==="hide"?0:100),m=p.direction||"both",k=p.origin,j={height:c.height(),width:c.width(),outerHeight:c.outerHeight(),outerWidth:c.outerWidth()},g={y:m!=="horizontal"?d/100:1,x:m!=="vertical"?d/100:1};
h.effect="size",h.queue=!1,h.complete=e,q!=="effect"&&(h.origin=k||["middle","center"],h.restore=!0),h.from=p.from||(q==="show"?{height:0,width:0,outerHeight:0,outerWidth:0}:j),h.to={height:j.height*g.y,width:j.width*g.x,outerHeight:j.outerHeight*g.y,outerWidth:j.outerWidth*g.x},h.fade&&(q==="show"&&(h.from.opacity=0,h.to.opacity=1),q==="hide"&&(h.from.opacity=1,h.to.opacity=0)),c.effect(h)
},b.effects.effect.size=function(q,B){var x,E,w,A=b(this),k=["position","top","bottom","left","right","width","height","overflow","opacity"],L=["position","top","bottom","left","right","overflow","opacity"],H=["width","height","overflow"],D=["fontSize"],J=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"],F=["borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"],z=b.effects.setMode(A,q.mode||"effect"),I=q.restore||z!=="effect",j=q.scale||"both",C=q.origin||["middle","center"],G=A.css("position"),e=I?k:L,K={height:0,width:0,outerHeight:0,outerWidth:0};
z==="show"&&A.show(),x={height:A.height(),width:A.width(),outerHeight:A.outerHeight(),outerWidth:A.outerWidth()},q.mode==="toggle"&&z==="show"?(A.from=q.to||K,A.to=q.from||x):(A.from=q.from||(z==="show"?K:x),A.to=q.to||(z==="hide"?K:x)),w={from:{y:A.from.height/x.height,x:A.from.width/x.width},to:{y:A.to.height/x.height,x:A.to.width/x.width}};
if(j==="box"||j==="both"){w.from.y!==w.to.y&&(e=e.concat(J),A.from=b.effects.setTransition(A,J,w.from.y,A.from),A.to=b.effects.setTransition(A,J,w.to.y,A.to)),w.from.x!==w.to.x&&(e=e.concat(F),A.from=b.effects.setTransition(A,F,w.from.x,A.from),A.to=b.effects.setTransition(A,F,w.to.x,A.to))
}(j==="content"||j==="both")&&w.from.y!==w.to.y&&(e=e.concat(D).concat(H),A.from=b.effects.setTransition(A,D,w.from.y,A.from),A.to=b.effects.setTransition(A,D,w.to.y,A.to)),b.effects.save(A,e),A.show(),b.effects.createWrapper(A),A.css("overflow","hidden").css(A.from),C&&(E=b.effects.getBaseline(C,x),A.from.top=(x.outerHeight-A.outerHeight())*E.y,A.from.left=(x.outerWidth-A.outerWidth())*E.x,A.to.top=(x.outerHeight-A.to.outerHeight)*E.y,A.to.left=(x.outerWidth-A.to.outerWidth)*E.x),A.css(A.from);
if(j==="content"||j==="both"){J=J.concat(["marginTop","marginBottom"]).concat(D),F=F.concat(["marginLeft","marginRight"]),H=k.concat(J).concat(F),A.find("*[width]").each(function(){var d=b(this),c={height:d.height(),width:d.width(),outerHeight:d.outerHeight(),outerWidth:d.outerWidth()};
I&&b.effects.save(d,H),d.from={height:c.height*w.from.y,width:c.width*w.from.x,outerHeight:c.outerHeight*w.from.y,outerWidth:c.outerWidth*w.from.x},d.to={height:c.height*w.to.y,width:c.width*w.to.x,outerHeight:c.height*w.to.y,outerWidth:c.width*w.to.x},w.from.y!==w.to.y&&(d.from=b.effects.setTransition(d,J,w.from.y,d.from),d.to=b.effects.setTransition(d,J,w.to.y,d.to)),w.from.x!==w.to.x&&(d.from=b.effects.setTransition(d,F,w.from.x,d.from),d.to=b.effects.setTransition(d,F,w.to.x,d.to)),d.css(d.from),d.animate(d.to,q.duration,q.easing,function(){I&&b.effects.restore(d,H)
})})}A.animate(A.to,{queue:!1,duration:q.duration,easing:q.easing,complete:function(){A.to.opacity===0&&A.css("opacity",A.from.opacity),z==="hide"&&A.hide(),b.effects.restore(A,e),I||(G==="static"?A.css({position:"relative",top:A.to.top,left:A.to.left}):b.each(["top","left"],function(d,c){A.css(c,function(g,l){var h=parseInt(l,10),f=d?A.to.left:A.to.top;
return l==="auto"?f+"px":h+f+"px"})})),b.effects.removeWrapper(A),B()}})}}(jQuery),function(b,a){b.effects.effect.shake=function(q,B){var x=b(this),E=["position","top","bottom","left","right","height","width"],w=b.effects.setMode(x,q.mode||"effect"),A=q.direction||"left",k=q.distance||20,K=q.times||3,H=K*2+1,D=Math.round(q.duration/H),J=A==="up"||A==="down"?"top":"left",F=A==="up"||A==="left",z={},I={},j={},C,G=x.queue(),e=G.length;
b.effects.save(x,E),x.show(),b.effects.createWrapper(x),z[J]=(F?"-=":"+=")+k,I[J]=(F?"+=":"-=")+k*2,j[J]=(F?"-=":"+=")+k*2,x.animate(z,D,q.easing);
for(C=1;C<K;C++){x.animate(I,D,q.easing).animate(j,D,q.easing)}x.animate(I,D,q.easing).animate(z,D/2,q.easing).queue(function(){w==="hide"&&x.hide(),b.effects.restore(x,E),b.effects.removeWrapper(x),B()
}),e>1&&G.splice.apply(G,[1,0].concat(G.splice(e,H+1))),x.dequeue()}}(jQuery),function(b,a){b.effects.effect.slide=function(v,g){var d=b(this),j=["position","top","bottom","left","right","width","height"],w=b.effects.setMode(d,v.mode||"show"),e=w==="show",q=v.direction||"left",p=q==="up"||q==="down"?"top":"left",k=q==="up"||q==="left",h,m={};
b.effects.save(d,j),d.show(),h=v.distance||d[p==="top"?"outerHeight":"outerWidth"](!0),b.effects.createWrapper(d).css({overflow:"hidden"}),e&&d.css(p,k?isNaN(h)?"-"+h:-h:h),m[p]=(e?k?"+=":"-=":k?"-=":"+=")+h,d.animate(m,{queue:!1,duration:v.duration,easing:v.easing,complete:function(){w==="hide"&&d.hide(),b.effects.restore(d,j),b.effects.removeWrapper(d),g()
}})}}(jQuery),function(b,a){b.effects.effect.transfer=function(x,g){var d=b(this),k=b(x.to),y=k.css("position")==="fixed",e=b("body"),w=y?e.scrollTop():0,v=y?e.scrollLeft():0,p=k.offset(),j={top:p.top-w,left:p.left-v,height:k.innerHeight(),width:k.innerWidth()},q=d.offset(),m=b('<div class="ui-effects-transfer"></div>').appendTo(document.body).addClass(x.className).css({top:q.top-w,left:q.left-v,height:d.innerHeight(),width:d.innerWidth(),position:y?"fixed":"absolute"}).animate(j,x.duration,x.easing,function(){m.remove(),g()
})}}(jQuery),function(b,a){var c=!1;b.widget("ui.menu",{version:"1.9.2",defaultElement:"<ul>",delay:300,options:{icons:{submenu:"ui-icon-carat-1-e"},menus:"ul",position:{my:"left top",at:"right top"},role:"menu",blur:null,focus:null,select:null},_create:function(){this.activeMenu=this.element,this.element.uniqueId().addClass("ui-menu ui-widget ui-widget-content ui-corner-all").toggleClass("ui-menu-icons",!!this.element.find(".ui-icon").length).attr({role:this.options.role,tabIndex:0}).bind("click"+this.eventNamespace,b.proxy(function(d){this.options.disabled&&d.preventDefault()
},this)),this.options.disabled&&this.element.addClass("ui-state-disabled").attr("aria-disabled","true"),this._on({"mousedown .ui-menu-item > a":function(d){d.preventDefault()
},"click .ui-state-disabled > a":function(d){d.preventDefault()},"click .ui-menu-item:has(a)":function(d){var e=b(d.target).closest(".ui-menu-item");
!c&&e.not(".ui-state-disabled").length&&(c=!0,this.select(d),e.has(".ui-menu").length?this.expand(d):this.element.is(":focus")||(this.element.trigger("focus",[!0]),this.active&&this.active.parents(".ui-menu").length===1&&clearTimeout(this.timer)))
},"mouseenter .ui-menu-item":function(d){var e=b(d.currentTarget);e.siblings().children(".ui-state-active").removeClass("ui-state-active"),this.focus(d,e)
},mouseleave:"collapseAll","mouseleave .ui-menu":"collapseAll",focus:function(f,d){var g=this.active||this.element.children(".ui-menu-item").eq(0);
d||this.focus(f,g)},blur:function(d){this._delay(function(){b.contains(this.element[0],this.document[0].activeElement)||this.collapseAll(d)
})},keydown:"_keydown"}),this.refresh(),this._on(this.document,{click:function(d){b(d.target).closest(".ui-menu").length||this.collapseAll(d),c=!1
}})},_destroy:function(){this.element.removeAttr("aria-activedescendant").find(".ui-menu").andSelf().removeClass("ui-menu ui-widget ui-widget-content ui-corner-all ui-menu-icons").removeAttr("role").removeAttr("tabIndex").removeAttr("aria-labelledby").removeAttr("aria-expanded").removeAttr("aria-hidden").removeAttr("aria-disabled").removeUniqueId().show(),this.element.find(".ui-menu-item").removeClass("ui-menu-item").removeAttr("role").removeAttr("aria-disabled").children("a").removeUniqueId().removeClass("ui-corner-all ui-state-hover").removeAttr("tabIndex").removeAttr("role").removeAttr("aria-haspopup").children().each(function(){var d=b(this);
d.data("ui-menu-submenu-carat")&&d.remove()}),this.element.find(".ui-menu-divider").removeClass("ui-menu-divider ui-widget-content")
},_keydown:function(g){function d(i){return i.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")
}var l,j,f,h,k,e=!0;switch(g.keyCode){case b.ui.keyCode.PAGE_UP:this.previousPage(g);
break;case b.ui.keyCode.PAGE_DOWN:this.nextPage(g);break;case b.ui.keyCode.HOME:this._move("first","first",g);
break;case b.ui.keyCode.END:this._move("last","last",g);break;case b.ui.keyCode.UP:this.previous(g);
break;case b.ui.keyCode.DOWN:this.next(g);break;case b.ui.keyCode.LEFT:this.collapse(g);
break;case b.ui.keyCode.RIGHT:this.active&&!this.active.is(".ui-state-disabled")&&this.expand(g);
break;case b.ui.keyCode.ENTER:case b.ui.keyCode.SPACE:this._activate(g);break;case b.ui.keyCode.ESCAPE:this.collapse(g);
break;default:e=!1,j=this.previousFilter||"",f=String.fromCharCode(g.keyCode),h=!1,clearTimeout(this.filterTimer),f===j?h=!0:f=j+f,k=new RegExp("^"+d(f),"i"),l=this.activeMenu.children(".ui-menu-item").filter(function(){return k.test(b(this).children("a").text())
}),l=h&&l.index(this.active.next())!==-1?this.active.nextAll(".ui-menu-item"):l,l.length||(f=String.fromCharCode(g.keyCode),k=new RegExp("^"+d(f),"i"),l=this.activeMenu.children(".ui-menu-item").filter(function(){return k.test(b(this).children("a").text())
})),l.length?(this.focus(g,l),l.length>1?(this.previousFilter=f,this.filterTimer=this._delay(function(){delete this.previousFilter
},1000)):delete this.previousFilter):delete this.previousFilter}e&&g.preventDefault()
},_activate:function(d){this.active.is(".ui-state-disabled")||(this.active.children("a[aria-haspopup='true']").length?this.expand(d):this.select(d))
},refresh:function(){var d,f=this.options.icons.submenu,e=this.element.find(this.options.menus);
e.filter(":not(.ui-menu)").addClass("ui-menu ui-widget ui-widget-content ui-corner-all").hide().attr({role:this.options.role,"aria-hidden":"true","aria-expanded":"false"}).each(function(){var h=b(this),j=h.prev("a"),g=b("<span>").addClass("ui-menu-icon ui-icon "+f).data("ui-menu-submenu-carat",!0);
j.attr("aria-haspopup","true").prepend(g),h.attr("aria-labelledby",j.attr("id"))}),d=e.add(this.element),d.children(":not(.ui-menu-item):has(a)").addClass("ui-menu-item").attr("role","presentation").children("a").uniqueId().addClass("ui-corner-all").attr({tabIndex:-1,role:this._itemRole()}),d.children(":not(.ui-menu-item)").each(function(){var g=b(this);
/[^\-—–\s]/.test(g.text())||g.addClass("ui-widget-content ui-menu-divider")}),d.children(".ui-state-disabled").attr("aria-disabled","true"),this.active&&!b.contains(this.element[0],this.active[0])&&this.blur()
},_itemRole:function(){return{menu:"menuitem",listbox:"option"}[this.options.role]
},focus:function(g,d){var h,f;this.blur(g,g&&g.type==="focus"),this._scrollIntoView(d),this.active=d.first(),f=this.active.children("a").addClass("ui-state-focus"),this.options.role&&this.element.attr("aria-activedescendant",f.attr("id")),this.active.parent().closest(".ui-menu-item").children("a:first").addClass("ui-state-active"),g&&g.type==="keydown"?this._close():this.timer=this._delay(function(){this._close()
},this.delay),h=d.children(".ui-menu"),h.length&&/^mouse/.test(g.type)&&this._startOpening(h),this.activeMenu=d.parent(),this._trigger("focus",g,{item:d})
},_scrollIntoView:function(f){var k,h,e,g,j,d;this._hasScroll()&&(k=parseFloat(b.css(this.activeMenu[0],"borderTopWidth"))||0,h=parseFloat(b.css(this.activeMenu[0],"paddingTop"))||0,e=f.offset().top-this.activeMenu.offset().top-k-h,g=this.activeMenu.scrollTop(),j=this.activeMenu.height(),d=f.height(),e<0?this.activeMenu.scrollTop(g+e):e+d>j&&this.activeMenu.scrollTop(g+e-j+d))
},blur:function(f,d){d||clearTimeout(this.timer);if(!this.active){return}this.active.children("a").removeClass("ui-state-focus"),this.active=null,this._trigger("blur",f,{item:this.active})
},_startOpening:function(d){clearTimeout(this.timer);if(d.attr("aria-hidden")!=="true"){return
}this.timer=this._delay(function(){this._close(),this._open(d)},this.delay)},_open:function(d){var e=b.extend({of:this.active},this.options.position);
clearTimeout(this.timer),this.element.find(".ui-menu").not(d.parents(".ui-menu")).hide().attr("aria-hidden","true"),d.show().removeAttr("aria-hidden").attr("aria-expanded","true").position(e)
},collapseAll:function(d,e){clearTimeout(this.timer),this.timer=this._delay(function(){var f=e?this.element:b(d&&d.target).closest(this.element.find(".ui-menu"));
f.length||(f=this.element),this._close(f),this.blur(d),this.activeMenu=f},this.delay)
},_close:function(d){d||(d=this.active?this.active.parent():this.element),d.find(".ui-menu").hide().attr("aria-hidden","true").attr("aria-expanded","false").end().find("a.ui-state-active").removeClass("ui-state-active")
},collapse:function(f){var d=this.active&&this.active.parent().closest(".ui-menu-item",this.element);
d&&d.length&&(this._close(),this.focus(f,d))},expand:function(f){var d=this.active&&this.active.children(".ui-menu ").children(".ui-menu-item").first();
d&&d.length&&(this._open(d.parent()),this._delay(function(){this.focus(f,d)}))},next:function(d){this._move("next","first",d)
},previous:function(d){this._move("prev","last",d)},isFirstItem:function(){return this.active&&!this.active.prevAll(".ui-menu-item").length
},isLastItem:function(){return this.active&&!this.active.nextAll(".ui-menu-item").length
},_move:function(g,d,h){var f;this.active&&(g==="first"||g==="last"?f=this.active[g==="first"?"prevAll":"nextAll"](".ui-menu-item").eq(-1):f=this.active[g+"All"](".ui-menu-item").eq(0));
if(!f||!f.length||!this.active){f=this.activeMenu.children(".ui-menu-item")[d]()}this.focus(h,f)
},nextPage:function(e){var g,f,d;if(!this.active){this.next(e);return}if(this.isLastItem()){return
}this._hasScroll()?(f=this.active.offset().top,d=this.element.height(),this.active.nextAll(".ui-menu-item").each(function(){return g=b(this),g.offset().top-f-d<0
}),this.focus(e,g)):this.focus(e,this.activeMenu.children(".ui-menu-item")[this.active?"last":"first"]())
},previousPage:function(e){var g,f,d;if(!this.active){this.next(e);return}if(this.isFirstItem()){return
}this._hasScroll()?(f=this.active.offset().top,d=this.element.height(),this.active.prevAll(".ui-menu-item").each(function(){return g=b(this),g.offset().top-f+d>0
}),this.focus(e,g)):this.focus(e,this.activeMenu.children(".ui-menu-item").first())
},_hasScroll:function(){return this.element.outerHeight()<this.element.prop("scrollHeight")
},select:function(d){this.active=this.active||b(d.target).closest(".ui-menu-item");
var e={item:this.active};this.active.has(".ui-menu").length||this.collapseAll(d,!0),this._trigger("select",d,e)
}})}(jQuery),function(w,A){function q(c,a,f){return[parseInt(c[0],10)*(k.test(c[0])?a/100:1),parseInt(c[1],10)*(k.test(c[1])?f/100:1)]
}function d(a,c){return parseInt(w.css(a,c),10)||0}w.ui=w.ui||{};var j,b=Math.max,m=Math.abs,B=Math.round,g=/left|center|right/,z=/top|center|bottom/,y=/[\+\-]\d+%?/,v=/^\w+/,k=/%$/,x=w.fn.position;
w.position={scrollbarWidth:function(){if(j!==A){return j}var e,a,c=w("<div style='display:block;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"),f=c.children()[0];
return w("body").append(c),e=f.offsetWidth,c.css("overflow","scroll"),a=f.offsetWidth,e===a&&(a=c[0].clientWidth),c.remove(),j=e-a
},getScrollInfo:function(c){var h=c.isWindow?"":c.element.css("overflow-x"),f=c.isWindow?"":c.element.css("overflow-y"),a=h==="scroll"||h==="auto"&&c.width<c.element[0].scrollWidth,e=f==="scroll"||f==="auto"&&c.height<c.element[0].scrollHeight;
return{width:a?w.position.scrollbarWidth():0,height:e?w.position.scrollbarWidth():0}
},getWithinInfo:function(a){var e=w(a||window),c=w.isWindow(e[0]);return{element:e,isWindow:c,offset:e.offset()||{left:0,top:0},scrollLeft:e.scrollLeft(),scrollTop:e.scrollTop(),width:c?e.width():e.outerWidth(),height:c?e.height():e.outerHeight()}
}},w.fn.position=function(u){if(!u||!u.of){return x.apply(this,arguments)}u=w.extend({},u);
var a,e,i,s,c,h=w(u.of),p=w.position.getWithinInfo(u.within),o=w.position.getScrollInfo(p),r=h[0],C=(u.collision||"flip").split(" "),f={};
return r.nodeType===9?(e=h.width(),i=h.height(),s={top:0,left:0}):w.isWindow(r)?(e=h.width(),i=h.height(),s={top:h.scrollTop(),left:h.scrollLeft()}):r.preventDefault?(u.at="left top",e=i=0,s={top:r.pageY,left:r.pageX}):(e=h.outerWidth(),i=h.outerHeight(),s=h.offset()),c=w.extend({},s),w.each(["my","at"],function(){var t=(u[this]||"").split(" "),D,l;
t.length===1&&(t=g.test(t[0])?t.concat(["center"]):z.test(t[0])?["center"].concat(t):["center","center"]),t[0]=g.test(t[0])?t[0]:"center",t[1]=z.test(t[1])?t[1]:"center",D=y.exec(t[0]),l=y.exec(t[1]),f[this]=[D?D[0]:0,l?l[0]:0],u[this]=[v.exec(t[0])[0],v.exec(t[1])[0]]
}),C.length===1&&(C[1]=C[0]),u.at[0]==="right"?c.left+=e:u.at[0]==="center"&&(c.left+=e/2),u.at[1]==="bottom"?c.top+=i:u.at[1]==="center"&&(c.top+=i/2),a=q(f.at,e,i),c.left+=a[0],c.top+=a[1],this.each(function(){var n,K,H=w(this),E=H.outerWidth(),G=H.outerHeight(),J=d(this,"marginLeft"),I=d(this,"marginTop"),D=E+J+d(this,"marginRight")+o.width,F=G+I+d(this,"marginBottom")+o.height,l=w.extend({},c),t=q(f.my,H.outerWidth(),H.outerHeight());
u.my[0]==="right"?l.left-=E:u.my[0]==="center"&&(l.left-=E/2),u.my[1]==="bottom"?l.top-=G:u.my[1]==="center"&&(l.top-=G/2),l.left+=t[0],l.top+=t[1],w.support.offsetFractions||(l.left=B(l.left),l.top=B(l.top)),n={marginLeft:J,marginTop:I},w.each(["left","top"],function(M,L){w.ui.position[C[M]]&&w.ui.position[C[M]][L](l,{targetWidth:e,targetHeight:i,elemWidth:E,elemHeight:G,collisionPosition:n,collisionWidth:D,collisionHeight:F,offset:[a[0]+t[0],a[1]+t[1]],my:u.my,at:u.at,within:p,elem:H})
}),w.fn.bgiframe&&H.bgiframe(),u.using&&(K=function(O){var Q=s.left-l.left,N=Q+e-E,P=s.top-l.top,L=P+i-G,M={target:{element:h,left:s.left,top:s.top,width:e,height:i},element:{element:H,left:l.left,top:l.top,width:E,height:G},horizontal:N<0?"left":Q>0?"right":"center",vertical:L<0?"top":P>0?"bottom":"middle"};
e<E&&m(Q+N)<e&&(M.horizontal="center"),i<G&&m(P+L)<i&&(M.vertical="middle"),b(m(Q),m(N))>b(m(P),m(L))?M.important="horizontal":M.important="vertical",u.using.call(this,O,M)
}),H.offset(w.extend(l,{using:K}))})},w.ui.position={fit:{left:function(r,E){var h=E.within,l=h.isWindow?h.scrollLeft:h.offset.left,F=h.width,c=r.left-E.collisionPosition.marginLeft,D=l-c,C=c+E.collisionWidth-F-l,p;
E.collisionWidth>F?D>0&&C<=0?(p=r.left+D+E.collisionWidth-F-l,r.left+=D-p):C>0&&D<=0?r.left=l:D>C?r.left=l+F-E.collisionWidth:r.left=l:D>0?r.left+=D:C>0?r.left-=C:r.left=b(r.left-c,r.left)
},top:function(r,E){var h=E.within,l=h.isWindow?h.scrollTop:h.offset.top,F=E.within.height,c=r.top-E.collisionPosition.marginTop,D=l-c,C=c+E.collisionHeight-F-l,p;
E.collisionHeight>F?D>0&&C<=0?(p=r.top+D+E.collisionHeight-F-l,r.top+=D-p):C>0&&D<=0?r.top=l:D>C?r.top=l+F-E.collisionHeight:r.top=l:D>0?r.top+=D:C>0?r.top-=C:r.top=b(r.top-c,r.top)
}},flip:{left:function(I,N){var E=N.within,i=E.offset.left+E.scrollLeft,O=E.width,D=E.isWindow?E.scrollLeft:E.offset.left,M=I.left-N.collisionPosition.marginLeft,L=M-D,H=M+N.collisionWidth-O-D,F=N.my[0]==="left"?-N.elemWidth:N.my[0]==="right"?N.elemWidth:0,K=N.at[0]==="left"?N.targetWidth:N.at[0]==="right"?-N.targetWidth:0,G=-2*N.offset[0],C,J;
if(L<0){C=I.left+F+K+G+N.collisionWidth-O-i;if(C<0||C<m(L)){I.left+=F+K+G}}else{if(H>0){J=I.left-N.collisionPosition.marginLeft+F+K+G-D;
if(J>0||m(J)<H){I.left+=F+K+G}}}},top:function(I,O){var E=O.within,i=E.offset.top+E.scrollTop,P=E.height,D=E.isWindow?E.scrollTop:E.offset.top,N=I.top-O.collisionPosition.marginTop,L=N-D,H=N+O.collisionHeight-P-D,F=O.my[1]==="top",K=F?-O.elemHeight:O.my[1]==="bottom"?O.elemHeight:0,G=O.at[1]==="top"?O.targetHeight:O.at[1]==="bottom"?-O.targetHeight:0,C=-2*O.offset[1],J,M;
L<0?(M=I.top+K+G+C+O.collisionHeight-P-i,I.top+K+G+C>L&&(M<0||M<m(L))&&(I.top+=K+G+C)):H>0&&(J=I.top-O.collisionPosition.marginTop+K+G+C-D,I.top+K+G+C>H&&(J>0||m(J)<H)&&(I.top+=K+G+C))
}},flipfit:{left:function(){w.ui.position.flip.left.apply(this,arguments),w.ui.position.fit.left.apply(this,arguments)
},top:function(){w.ui.position.flip.top.apply(this,arguments),w.ui.position.fit.top.apply(this,arguments)
}}},function(){var e,p,h,c,f,l=document.getElementsByTagName("body")[0],a=document.createElement("div");
e=document.createElement(l?"div":"body"),h={visibility:"hidden",width:0,height:0,border:0,margin:0,background:"none"},l&&w.extend(h,{position:"absolute",left:"-1000px",top:"-1000px"});
for(f in h){e.style[f]=h[f]}e.appendChild(a),p=l||document.documentElement,p.insertBefore(e,p.firstChild),a.style.cssText="position: absolute; left: 10.7432222px;",c=w(a).offset().left,w.support.offsetFractions=c>10&&c<11,e.innerHTML="",p.removeChild(e)
}(),w.uiBackCompat!==!1&&function(a){var c=a.fn.position;a.fn.position=function(h){if(!h||!h.offset){return c.call(this,h)
}var e=h.offset.split(" "),f=h.at.split(" ");return e.length===1&&(e[1]=e[0]),/^\d/.test(e[0])&&(e[0]="+"+e[0]),/^\d/.test(e[1])&&(e[1]="+"+e[1]),f.length===1&&(/left|center|right/.test(f[0])?f[1]="center":(f[1]=f[0],f[0]="center")),c.call(this,a.extend(h,{at:f[0]+e[0]+" "+f[1]+e[1],offset:A}))
}}(jQuery)}(jQuery),function(b,a){b.widget("ui.progressbar",{version:"1.9.2",options:{value:0,max:100},min:0,_create:function(){this.element.addClass("ui-progressbar ui-widget ui-widget-content ui-corner-all").attr({role:"progressbar","aria-valuemin":this.min,"aria-valuemax":this.options.max,"aria-valuenow":this._value()}),this.valueDiv=b("<div class='ui-progressbar-value ui-widget-header ui-corner-left'></div>").appendTo(this.element),this.oldValue=this._value(),this._refreshValue()
},_destroy:function(){this.element.removeClass("ui-progressbar ui-widget ui-widget-content ui-corner-all").removeAttr("role").removeAttr("aria-valuemin").removeAttr("aria-valuemax").removeAttr("aria-valuenow"),this.valueDiv.remove()
},value:function(c){return c===a?this._value():(this._setOption("value",c),this)},_setOption:function(d,c){d==="value"&&(this.options.value=c,this._refreshValue(),this._value()===this.options.max&&this._trigger("complete")),this._super(d,c)
},_value:function(){var c=this.options.value;return typeof c!="number"&&(c=0),Math.min(this.options.max,Math.max(this.min,c))
},_percentage:function(){return 100*this._value()/this.options.max},_refreshValue:function(){var d=this.value(),c=this._percentage();
this.oldValue!==d&&(this.oldValue=d,this._trigger("change")),this.valueDiv.toggle(d>this.min).toggleClass("ui-corner-right",d===this.options.max).width(c.toFixed(0)+"%"),this.element.attr("aria-valuenow",d)
}})}(jQuery),function(b,a){var c=5;b.widget("ui.slider",b.ui.mouse,{version:"1.9.2",widgetEventPrefix:"slide",options:{animate:!1,distance:0,max:100,min:0,orientation:"horizontal",range:!1,step:1,value:0,values:null},_create:function(){var f,h,e=this.options,g=this.element.find(".ui-slider-handle").addClass("ui-state-default ui-corner-all"),j="<a class='ui-slider-handle ui-state-default ui-corner-all' href='#'></a>",d=[];
this._keySliding=!1,this._mouseSliding=!1,this._animateOff=!0,this._handleIndex=null,this._detectOrientation(),this._mouseInit(),this.element.addClass("ui-slider ui-slider-"+this.orientation+" ui-widget ui-widget-content ui-corner-all"+(e.disabled?" ui-slider-disabled ui-disabled":"")),this.range=b([]),e.range&&(e.range===!0&&(e.values||(e.values=[this._valueMin(),this._valueMin()]),e.values.length&&e.values.length!==2&&(e.values=[e.values[0],e.values[0]])),this.range=b("<div></div>").appendTo(this.element).addClass("ui-slider-range ui-widget-header"+(e.range==="min"||e.range==="max"?" ui-slider-range-"+e.range:""))),h=e.values&&e.values.length||1;
for(f=g.length;f<h;f++){d.push(j)}this.handles=g.add(b(d.join("")).appendTo(this.element)),this.handle=this.handles.eq(0),this.handles.add(this.range).filter("a").click(function(i){i.preventDefault()
}).mouseenter(function(){e.disabled||b(this).addClass("ui-state-hover")}).mouseleave(function(){b(this).removeClass("ui-state-hover")
}).focus(function(){e.disabled?b(this).blur():(b(".ui-slider .ui-state-focus").removeClass("ui-state-focus"),b(this).addClass("ui-state-focus"))
}).blur(function(){b(this).removeClass("ui-state-focus")}),this.handles.each(function(i){b(this).data("ui-slider-handle-index",i)
}),this._on(this.handles,{keydown:function(m){var p,l,n,q,k=b(m.target).data("ui-slider-handle-index");
switch(m.keyCode){case b.ui.keyCode.HOME:case b.ui.keyCode.END:case b.ui.keyCode.PAGE_UP:case b.ui.keyCode.PAGE_DOWN:case b.ui.keyCode.UP:case b.ui.keyCode.RIGHT:case b.ui.keyCode.DOWN:case b.ui.keyCode.LEFT:m.preventDefault();
if(!this._keySliding){this._keySliding=!0,b(m.target).addClass("ui-state-active"),p=this._start(m,k);
if(p===!1){return}}}q=this.options.step,this.options.values&&this.options.values.length?l=n=this.values(k):l=n=this.value();
switch(m.keyCode){case b.ui.keyCode.HOME:n=this._valueMin();break;case b.ui.keyCode.END:n=this._valueMax();
break;case b.ui.keyCode.PAGE_UP:n=this._trimAlignValue(l+(this._valueMax()-this._valueMin())/c);
break;case b.ui.keyCode.PAGE_DOWN:n=this._trimAlignValue(l-(this._valueMax()-this._valueMin())/c);
break;case b.ui.keyCode.UP:case b.ui.keyCode.RIGHT:if(l===this._valueMax()){return
}n=this._trimAlignValue(l+q);break;case b.ui.keyCode.DOWN:case b.ui.keyCode.LEFT:if(l===this._valueMin()){return
}n=this._trimAlignValue(l-q)}this._slide(m,k,n)},keyup:function(i){var k=b(i.target).data("ui-slider-handle-index");
this._keySliding&&(this._keySliding=!1,this._stop(i,k),this._change(i,k),b(i.target).removeClass("ui-state-active"))
}}),this._refreshValue(),this._animateOff=!1},_destroy:function(){this.handles.remove(),this.range.remove(),this.element.removeClass("ui-slider ui-slider-horizontal ui-slider-vertical ui-slider-disabled ui-widget ui-widget-content ui-corner-all"),this._mouseDestroy()
},_mouseCapture:function(v){var g,d,j,w,e,q,p,k,h=this,m=this.options;return m.disabled?!1:(this.elementSize={width:this.element.outerWidth(),height:this.element.outerHeight()},this.elementOffset=this.element.offset(),g={x:v.pageX,y:v.pageY},d=this._normValueFromMouse(g),j=this._valueMax()-this._valueMin()+1,this.handles.each(function(f){var i=Math.abs(d-h.values(f));
j>i&&(j=i,w=b(this),e=f)}),m.range===!0&&this.values(1)===m.min&&(e+=1,w=b(this.handles[e])),q=this._start(v,e),q===!1?!1:(this._mouseSliding=!0,this._handleIndex=e,w.addClass("ui-state-active").focus(),p=w.offset(),k=!b(v.target).parents().andSelf().is(".ui-slider-handle"),this._clickOffset=k?{left:0,top:0}:{left:v.pageX-p.left-w.width()/2,top:v.pageY-p.top-w.height()/2-(parseInt(w.css("borderTopWidth"),10)||0)-(parseInt(w.css("borderBottomWidth"),10)||0)+(parseInt(w.css("marginTop"),10)||0)},this.handles.hasClass("ui-state-hover")||this._slide(v,e,d),this._animateOff=!0,!0))
},_mouseStart:function(){return !0},_mouseDrag:function(f){var d={x:f.pageX,y:f.pageY},g=this._normValueFromMouse(d);
return this._slide(f,this._handleIndex,g),!1},_mouseStop:function(d){return this.handles.removeClass("ui-state-active"),this._mouseSliding=!1,this._stop(d,this._handleIndex),this._change(d,this._handleIndex),this._handleIndex=null,this._clickOffset=null,this._animateOff=!1,!1
},_detectOrientation:function(){this.orientation=this.options.orientation==="vertical"?"vertical":"horizontal"
},_normValueFromMouse:function(j){var f,k,h,d,g;return this.orientation==="horizontal"?(f=this.elementSize.width,k=j.x-this.elementOffset.left-(this._clickOffset?this._clickOffset.left:0)):(f=this.elementSize.height,k=j.y-this.elementOffset.top-(this._clickOffset?this._clickOffset.top:0)),h=k/f,h>1&&(h=1),h<0&&(h=0),this.orientation==="vertical"&&(h=1-h),d=this._valueMax()-this._valueMin(),g=this._valueMin()+h*d,this._trimAlignValue(g)
},_start:function(f,d){var g={handle:this.handles[d],value:this.value()};return this.options.values&&this.options.values.length&&(g.value=this.values(d),g.values=this.values()),this._trigger("start",f,g)
},_slide:function(j,f,k){var h,d,g;this.options.values&&this.options.values.length?(h=this.values(f?0:1),this.options.values.length===2&&this.options.range===!0&&(f===0&&k>h||f===1&&k<h)&&(k=h),k!==this.values(f)&&(d=this.values(),d[f]=k,g=this._trigger("slide",j,{handle:this.handles[f],value:k,values:d}),h=this.values(f?0:1),g!==!1&&this.values(f,k,!0))):k!==this.value()&&(g=this._trigger("slide",j,{handle:this.handles[f],value:k}),g!==!1&&this.value(k))
},_stop:function(f,d){var g={handle:this.handles[d],value:this.value()};this.options.values&&this.options.values.length&&(g.value=this.values(d),g.values=this.values()),this._trigger("stop",f,g)
},_change:function(f,d){if(!this._keySliding&&!this._mouseSliding){var g={handle:this.handles[d],value:this.value()};
this.options.values&&this.options.values.length&&(g.value=this.values(d),g.values=this.values()),this._trigger("change",f,g)
}},value:function(d){if(arguments.length){this.options.value=this._trimAlignValue(d),this._refreshValue(),this._change(null,0);
return}return this._value()},values:function(e,h){var g,d,f;if(arguments.length>1){this.options.values[e]=this._trimAlignValue(h),this._refreshValue(),this._change(null,e);
return}if(!arguments.length){return this._values()}if(!b.isArray(arguments[0])){return this.options.values&&this.options.values.length?this._values(e):this.value()
}g=this.options.values,d=arguments[0];for(f=0;f<g.length;f+=1){g[f]=this._trimAlignValue(d[f]),this._change(null,f)
}this._refreshValue()},_setOption:function(e,g){var f,d=0;b.isArray(this.options.values)&&(d=this.options.values.length),b.Widget.prototype._setOption.apply(this,arguments);
switch(e){case"disabled":g?(this.handles.filter(".ui-state-focus").blur(),this.handles.removeClass("ui-state-hover"),this.handles.prop("disabled",!0),this.element.addClass("ui-disabled")):(this.handles.prop("disabled",!1),this.element.removeClass("ui-disabled"));
break;case"orientation":this._detectOrientation(),this.element.removeClass("ui-slider-horizontal ui-slider-vertical").addClass("ui-slider-"+this.orientation),this._refreshValue();
break;case"value":this._animateOff=!0,this._refreshValue(),this._change(null,0),this._animateOff=!1;
break;case"values":this._animateOff=!0,this._refreshValue();for(f=0;f<d;f+=1){this._change(null,f)
}this._animateOff=!1;break;case"min":case"max":this._animateOff=!0,this._refreshValue(),this._animateOff=!1
}},_value:function(){var d=this.options.value;return d=this._trimAlignValue(d),d},_values:function(g){var d,h,f;
if(arguments.length){return d=this.options.values[g],d=this._trimAlignValue(d),d}h=this.options.values.slice();
for(f=0;f<h.length;f+=1){h[f]=this._trimAlignValue(h[f])}return h},_trimAlignValue:function(g){if(g<=this._valueMin()){return this._valueMin()
}if(g>=this._valueMax()){return this._valueMax()}var d=this.options.step>0?this.options.step:1,h=(g-this._valueMin())%d,f=g-h;
return Math.abs(h)*2>=d&&(f+=h>0?d:-d),parseFloat(f.toFixed(5))},_valueMin:function(){return this.options.min
},_valueMax:function(){return this.options.max},_refreshValue:function(){var q,g,d,j,v,e=this.options.range,p=this.options,m=this,k=this._animateOff?!1:p.animate,h={};
this.options.values&&this.options.values.length?this.handles.each(function(f){g=(m.values(f)-m._valueMin())/(m._valueMax()-m._valueMin())*100,h[m.orientation==="horizontal"?"left":"bottom"]=g+"%",b(this).stop(1,1)[k?"animate":"css"](h,p.animate),m.options.range===!0&&(m.orientation==="horizontal"?(f===0&&m.range.stop(1,1)[k?"animate":"css"]({left:g+"%"},p.animate),f===1&&m.range[k?"animate":"css"]({width:g-q+"%"},{queue:!1,duration:p.animate})):(f===0&&m.range.stop(1,1)[k?"animate":"css"]({bottom:g+"%"},p.animate),f===1&&m.range[k?"animate":"css"]({height:g-q+"%"},{queue:!1,duration:p.animate}))),q=g
}):(d=this.value(),j=this._valueMin(),v=this._valueMax(),g=v!==j?(d-j)/(v-j)*100:0,h[this.orientation==="horizontal"?"left":"bottom"]=g+"%",this.handle.stop(1,1)[k?"animate":"css"](h,p.animate),e==="min"&&this.orientation==="horizontal"&&this.range.stop(1,1)[k?"animate":"css"]({width:g+"%"},p.animate),e==="max"&&this.orientation==="horizontal"&&this.range[k?"animate":"css"]({width:100-g+"%"},{queue:!1,duration:p.animate}),e==="min"&&this.orientation==="vertical"&&this.range.stop(1,1)[k?"animate":"css"]({height:g+"%"},p.animate),e==="max"&&this.orientation==="vertical"&&this.range[k?"animate":"css"]({height:100-g+"%"},{queue:!1,duration:p.animate}))
}})}(jQuery),function(b){function a(c){return function(){var d=this.element.val();
c.apply(this,arguments),this._refresh(),d!==this.element.val()&&this._trigger("change")
}}b.widget("ui.spinner",{version:"1.9.2",defaultElement:"<input>",widgetEventPrefix:"spin",options:{culture:null,icons:{down:"ui-icon-triangle-1-s",up:"ui-icon-triangle-1-n"},incremental:!0,max:null,min:null,numberFormat:null,page:10,step:1,change:null,spin:null,start:null,stop:null},_create:function(){this._setOption("max",this.options.max),this._setOption("min",this.options.min),this._setOption("step",this.options.step),this._value(this.element.val(),!0),this._draw(),this._on(this._events),this._refresh(),this._on(this.window,{beforeunload:function(){this.element.removeAttr("autocomplete")
}})},_getCreateOptions:function(){var c={},d=this.element;return b.each(["min","max","step"],function(h,g){var f=d.attr(g);
f!==undefined&&f.length&&(c[g]=f)}),c},_events:{keydown:function(c){this._start(c)&&this._keydown(c)&&c.preventDefault()
},keyup:"_stop",focus:function(){this.previous=this.element.val()},blur:function(c){if(this.cancelBlur){delete this.cancelBlur;
return}this._refresh(),this.previous!==this.element.val()&&this._trigger("change",c)
},mousewheel:function(d,c){if(!c){return}if(!this.spinning&&!this._start(d)){return !1
}this._spin((c>0?1:-1)*this.options.step,d),clearTimeout(this.mousewheelTimer),this.mousewheelTimer=this._delay(function(){this.spinning&&this._stop(d)
},100),d.preventDefault()},"mousedown .ui-spinner-button":function(c){function d(){var f=this.element[0]===this.document[0].activeElement;
f||(this.element.focus(),this.previous=e,this._delay(function(){this.previous=e}))
}var e;e=this.element[0]===this.document[0].activeElement?this.previous:this.element.val(),c.preventDefault(),d.call(this),this.cancelBlur=!0,this._delay(function(){delete this.cancelBlur,d.call(this)
});if(this._start(c)===!1){return}this._repeat(null,b(c.currentTarget).hasClass("ui-spinner-up")?1:-1,c)
},"mouseup .ui-spinner-button":"_stop","mouseenter .ui-spinner-button":function(c){if(!b(c.currentTarget).hasClass("ui-state-active")){return
}if(this._start(c)===!1){return !1}this._repeat(null,b(c.currentTarget).hasClass("ui-spinner-up")?1:-1,c)
},"mouseleave .ui-spinner-button":"_stop"},_draw:function(){var c=this.uiSpinner=this.element.addClass("ui-spinner-input").attr("autocomplete","off").wrap(this._uiSpinnerHtml()).parent().append(this._buttonHtml());
this.element.attr("role","spinbutton"),this.buttons=c.find(".ui-spinner-button").attr("tabIndex",-1).button().removeClass("ui-corner-all"),this.buttons.height()>Math.ceil(c.height()*0.5)&&c.height()>0&&c.height(c.height()),this.options.disabled&&this.disable()
},_keydown:function(c){var e=this.options,d=b.ui.keyCode;switch(c.keyCode){case d.UP:return this._repeat(null,1,c),!0;
case d.DOWN:return this._repeat(null,-1,c),!0;case d.PAGE_UP:return this._repeat(null,e.page,c),!0;
case d.PAGE_DOWN:return this._repeat(null,-e.page,c),!0}return !1},_uiSpinnerHtml:function(){return"<span class='ui-spinner ui-widget ui-widget-content ui-corner-all'></span>"
},_buttonHtml:function(){return"<a class='ui-spinner-button ui-spinner-up ui-corner-tr'><span class='ui-icon "+this.options.icons.up+"'>&#9650;</span></a><a class='ui-spinner-button ui-spinner-down ui-corner-br'><span class='ui-icon "+this.options.icons.down+"'>&#9660;</span></a>"
},_start:function(c){return !this.spinning&&this._trigger("start",c)===!1?!1:(this.counter||(this.counter=1),this.spinning=!0,!0)
},_repeat:function(d,c,f){d=d||500,clearTimeout(this.timer),this.timer=this._delay(function(){this._repeat(40,c,f)
},d),this._spin(c*this.options.step,f)},_spin:function(d,c){var f=this.value()||0;
this.counter||(this.counter=1),f=this._adjustValue(f+d*this._increment(this.counter));
if(!this.spinning||this._trigger("spin",c,{value:f})!==!1){this._value(f),this.counter++
}},_increment:function(c){var d=this.options.incremental;return d?b.isFunction(d)?d(c):Math.floor(c*c*c/50000-c*c/500+17*c/200+1):1
},_precision:function(){var c=this._precisionOf(this.options.step);return this.options.min!==null&&(c=Math.max(c,this._precisionOf(this.options.min))),c
},_precisionOf:function(d){var c=d.toString(),f=c.indexOf(".");return f===-1?0:c.length-f-1
},_adjustValue:function(f){var c,g,d=this.options;return c=d.min!==null?d.min:0,g=f-c,g=Math.round(g/d.step)*d.step,f=c+g,f=parseFloat(f.toFixed(this._precision())),d.max!==null&&f>d.max?d.max:d.min!==null&&f<d.min?d.min:f
},_stop:function(c){if(!this.spinning){return}clearTimeout(this.timer),clearTimeout(this.mousewheelTimer),this.counter=0,this.spinning=!1,this._trigger("stop",c)
},_setOption:function(d,c){if(d==="culture"||d==="numberFormat"){var f=this._parse(this.element.val());
this.options[d]=c,this.element.val(this._format(f));return}(d==="max"||d==="min"||d==="step")&&typeof c=="string"&&(c=this._parse(c)),this._super(d,c),d==="disabled"&&(c?(this.element.prop("disabled",!0),this.buttons.button("disable")):(this.element.prop("disabled",!1),this.buttons.button("enable")))
},_setOptions:a(function(c){this._super(c),this._value(this.element.val())}),_parse:function(c){return typeof c=="string"&&c!==""&&(c=window.Globalize&&this.options.numberFormat?Globalize.parseFloat(c,10,this.options.culture):+c),c===""||isNaN(c)?null:c
},_format:function(c){return c===""?"":window.Globalize&&this.options.numberFormat?Globalize.format(c,this.options.numberFormat,this.options.culture):c
},_refresh:function(){this.element.attr({"aria-valuemin":this.options.min,"aria-valuemax":this.options.max,"aria-valuenow":this._parse(this.element.val())})
},_value:function(d,c){var f;d!==""&&(f=this._parse(d),f!==null&&(c||(f=this._adjustValue(f)),d=this._format(f))),this.element.val(d),this._refresh()
},_destroy:function(){this.element.removeClass("ui-spinner-input").prop("disabled",!1).removeAttr("autocomplete").removeAttr("role").removeAttr("aria-valuemin").removeAttr("aria-valuemax").removeAttr("aria-valuenow"),this.uiSpinner.replaceWith(this.element)
},stepUp:a(function(c){this._stepUp(c)}),_stepUp:function(c){this._spin((c||1)*this.options.step)
},stepDown:a(function(c){this._stepDown(c)}),_stepDown:function(c){this._spin((c||1)*-this.options.step)
},pageUp:a(function(c){this._stepUp((c||1)*this.options.page)}),pageDown:a(function(c){this._stepDown((c||1)*this.options.page)
}),value:function(c){if(!arguments.length){return this._parse(this.element.val())
}a(this._value).call(this,c)},widget:function(){return this.uiSpinner}})}(jQuery),function(f,b){function a(){return ++g
}function c(h){return h.hash.length>1&&h.href.replace(d,"")===location.href.replace(d,"").replace(/\s/g,"%20")
}var g=0,d=/#.*$/;f.widget("ui.tabs",{version:"1.9.2",delay:300,options:{active:null,collapsible:!1,event:"click",heightStyle:"content",hide:null,show:null,activate:null,beforeActivate:null,beforeLoad:null,load:null},_create:function(){var h=this,k=this.options,j=k.active,e=location.hash.substring(1);
this.running=!1,this.element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all").toggleClass("ui-tabs-collapsible",k.collapsible).delegate(".ui-tabs-nav > li","mousedown"+this.eventNamespace,function(i){f(this).is(".ui-state-disabled")&&i.preventDefault()
}).delegate(".ui-tabs-anchor","focus"+this.eventNamespace,function(){f(this).closest("li").is(".ui-state-disabled")&&this.blur()
}),this._processTabs();if(j===null){e&&this.tabs.each(function(i,l){if(f(l).attr("aria-controls")===e){return j=i,!1
}}),j===null&&(j=this.tabs.index(this.tabs.filter(".ui-tabs-active")));if(j===null||j===-1){j=this.tabs.length?0:!1
}}j!==!1&&(j=this.tabs.index(this.tabs.eq(j)),j===-1&&(j=k.collapsible?!1:0)),k.active=j,!k.collapsible&&k.active===!1&&this.anchors.length&&(k.active=0),f.isArray(k.disabled)&&(k.disabled=f.unique(k.disabled.concat(f.map(this.tabs.filter(".ui-state-disabled"),function(i){return h.tabs.index(i)
}))).sort()),this.options.active!==!1&&this.anchors.length?this.active=this._findActive(this.options.active):this.active=f(),this._refresh(),this.active.length&&this.load(k.active)
},_getCreateEventData:function(){return{tab:this.active,panel:this.active.length?this._getPanelForTab(this.active):f()}
},_tabKeydown:function(h){var k=f(this.document[0].activeElement).closest("li"),j=this.tabs.index(k),e=!0;
if(this._handlePageNav(h)){return}switch(h.keyCode){case f.ui.keyCode.RIGHT:case f.ui.keyCode.DOWN:j++;
break;case f.ui.keyCode.UP:case f.ui.keyCode.LEFT:e=!1,j--;break;case f.ui.keyCode.END:j=this.anchors.length-1;
break;case f.ui.keyCode.HOME:j=0;break;case f.ui.keyCode.SPACE:h.preventDefault(),clearTimeout(this.activating),this._activate(j);
return;case f.ui.keyCode.ENTER:h.preventDefault(),clearTimeout(this.activating),this._activate(j===this.options.active?!1:j);
return;default:return}h.preventDefault(),clearTimeout(this.activating),j=this._focusNextTab(j,e),h.ctrlKey||(k.attr("aria-selected","false"),this.tabs.eq(j).attr("aria-selected","true"),this.activating=this._delay(function(){this.option("active",j)
},this.delay))},_panelKeydown:function(e){if(this._handlePageNav(e)){return}e.ctrlKey&&e.keyCode===f.ui.keyCode.UP&&(e.preventDefault(),this.active.focus())
},_handlePageNav:function(e){if(e.altKey&&e.keyCode===f.ui.keyCode.PAGE_UP){return this._activate(this._focusNextTab(this.options.active-1,!1)),!0
}if(e.altKey&&e.keyCode===f.ui.keyCode.PAGE_DOWN){return this._activate(this._focusNextTab(this.options.active+1,!0)),!0
}},_findNextTab:function(h,k){function e(){return h>j&&(h=0),h<0&&(h=j),h}var j=this.tabs.length-1;
while(f.inArray(e(),this.options.disabled)!==-1){h=k?h+1:h-1}return h},_focusNextTab:function(i,h){return i=this._findNextTab(i,h),this.tabs.eq(i).focus(),i
},_setOption:function(i,h){if(i==="active"){this._activate(h);return}if(i==="disabled"){this._setupDisabled(h);
return}this._super(i,h),i==="collapsible"&&(this.element.toggleClass("ui-tabs-collapsible",h),!h&&this.options.active===!1&&this._activate(0)),i==="event"&&this._setupEvents(h),i==="heightStyle"&&this._setupHeightStyle(h)
},_tabId:function(h){return h.attr("aria-controls")||"ui-tabs-"+a()},_sanitizeSelector:function(h){return h?h.replace(/[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g,"\\$&"):""
},refresh:function(){var e=this.options,h=this.tablist.children(":has(a[href])");
e.disabled=f.map(h.filter(".ui-state-disabled"),function(i){return h.index(i)}),this._processTabs(),e.active===!1||!this.anchors.length?(e.active=!1,this.active=f()):this.active.length&&!f.contains(this.tablist[0],this.active[0])?this.tabs.length===e.disabled.length?(e.active=!1,this.active=f()):this._activate(this._findNextTab(Math.max(0,e.active-1),!1)):e.active=this.tabs.index(this.active),this._refresh()
},_refresh:function(){this._setupDisabled(this.options.disabled),this._setupEvents(this.options.event),this._setupHeightStyle(this.options.heightStyle),this.tabs.not(this.active).attr({"aria-selected":"false",tabIndex:-1}),this.panels.not(this._getPanelForTab(this.active)).hide().attr({"aria-expanded":"false","aria-hidden":"true"}),this.active.length?(this.active.addClass("ui-tabs-active ui-state-active").attr({"aria-selected":"true",tabIndex:0}),this._getPanelForTab(this.active).show().attr({"aria-expanded":"true","aria-hidden":"false"})):this.tabs.eq(0).attr("tabIndex",0)
},_processTabs:function(){var e=this;this.tablist=this._getList().addClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all").attr("role","tablist"),this.tabs=this.tablist.find("> li:has(a[href])").addClass("ui-state-default ui-corner-top").attr({role:"tab",tabIndex:-1}),this.anchors=this.tabs.map(function(){return f("a",this)[0]
}).addClass("ui-tabs-anchor").attr({role:"presentation",tabIndex:-1}),this.panels=f(),this.anchors.each(function(t,p){var m,s,k,j=f(p).uniqueId().attr("id"),q=f(p).closest("li"),h=q.attr("aria-controls");
c(p)?(m=p.hash,s=e.element.find(e._sanitizeSelector(m))):(k=e._tabId(q),m="#"+k,s=e.element.find(m),s.length||(s=e._createPanel(k),s.insertAfter(e.panels[t-1]||e.tablist)),s.attr("aria-live","polite")),s.length&&(e.panels=e.panels.add(s)),h&&q.data("ui-tabs-aria-controls",h),q.attr({"aria-controls":m.substring(1),"aria-labelledby":j}),s.attr("aria-labelledby",j)
}),this.panels.addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").attr("role","tabpanel")
},_getList:function(){return this.element.find("ol,ul").eq(0)},_createPanel:function(e){return f("<div>").attr("id",e).addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").data("ui-tabs-destroy",!0)
},_setupDisabled:function(e){f.isArray(e)&&(e.length?e.length===this.anchors.length&&(e=!0):e=!1);
for(var i=0,h;h=this.tabs[i];i++){e===!0||f.inArray(i,e)!==-1?f(h).addClass("ui-state-disabled").attr("aria-disabled","true"):f(h).removeClass("ui-state-disabled").removeAttr("aria-disabled")
}this.options.disabled=e},_setupEvents:function(e){var h={click:function(i){i.preventDefault()
}};e&&f.each(e.split(" "),function(j,i){h[i]="_eventHandler"}),this._off(this.anchors.add(this.tabs).add(this.panels)),this._on(this.anchors,h),this._on(this.tabs,{keydown:"_tabKeydown"}),this._on(this.panels,{keydown:"_panelKeydown"}),this._focusable(this.tabs),this._hoverable(this.tabs)
},_setupHeightStyle:function(h){var k,j,e=this.element.parent();h==="fill"?(f.support.minHeight||(j=e.css("overflow"),e.css("overflow","hidden")),k=e.height(),this.element.siblings(":visible").each(function(){var i=f(this),l=i.css("position");
if(l==="absolute"||l==="fixed"){return}k-=i.outerHeight(!0)}),j&&e.css("overflow",j),this.element.children().not(this.panels).each(function(){k-=f(this).outerHeight(!0)
}),this.panels.each(function(){f(this).height(Math.max(0,k-f(this).innerHeight()+f(this).height()))
}).css("overflow","auto")):h==="auto"&&(k=0,this.panels.each(function(){k=Math.max(k,f(this).height("").height())
}).height(k))},_eventHandler:function(w){var j=this.options,e=this.active,m=f(w.currentTarget),x=m.closest("li"),h=x[0]===e[0],v=h&&j.collapsible,q=v?f():this._getPanelForTab(x),p=e.length?this._getPanelForTab(e):f(),k={oldTab:e,oldPanel:p,newTab:v?f():x,newPanel:q};
w.preventDefault();if(x.hasClass("ui-state-disabled")||x.hasClass("ui-tabs-loading")||this.running||h&&!j.collapsible||this._trigger("beforeActivate",w,k)===!1){return
}j.active=v?!1:this.tabs.index(x),this.active=h?f():x,this.xhr&&this.xhr.abort(),!p.length&&!q.length&&f.error("jQuery UI Tabs: Mismatching fragment identifier."),q.length&&this.load(this.tabs.index(x),w),this._toggle(w,k)
},_toggle:function(j,p){function m(){l.running=!1,l._trigger("activate",j,p)}function e(){p.newTab.closest("li").addClass("ui-tabs-active ui-state-active"),h.length&&l.options.show?l._show(h,l.options.show,m):(h.show(),m())
}var l=this,h=p.newPanel,k=p.oldPanel;this.running=!0,k.length&&this.options.hide?this._hide(k,this.options.hide,function(){p.oldTab.closest("li").removeClass("ui-tabs-active ui-state-active"),e()
}):(p.oldTab.closest("li").removeClass("ui-tabs-active ui-state-active"),k.hide(),e()),k.attr({"aria-expanded":"false","aria-hidden":"true"}),p.oldTab.attr("aria-selected","false"),h.length&&k.length?p.oldTab.attr("tabIndex",-1):h.length&&this.tabs.filter(function(){return f(this).attr("tabIndex")===0
}).attr("tabIndex",-1),h.attr({"aria-expanded":"true","aria-hidden":"false"}),p.newTab.attr({"aria-selected":"true",tabIndex:0})
},_activate:function(e){var i,h=this._findActive(e);if(h[0]===this.active[0]){return
}h.length||(h=this.active),i=h.find(".ui-tabs-anchor")[0],this._eventHandler({target:i,currentTarget:i,preventDefault:f.noop})
},_findActive:function(e){return e===!1?f():this.tabs.eq(e)},_getIndex:function(h){return typeof h=="string"&&(h=this.anchors.index(this.anchors.filter("[href$='"+h+"']"))),h
},_destroy:function(){this.xhr&&this.xhr.abort(),this.element.removeClass("ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-collapsible"),this.tablist.removeClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all").removeAttr("role"),this.anchors.removeClass("ui-tabs-anchor").removeAttr("role").removeAttr("tabIndex").removeData("href.tabs").removeData("load.tabs").removeUniqueId(),this.tabs.add(this.panels).each(function(){f.data(this,"ui-tabs-destroy")?f(this).remove():f(this).removeClass("ui-state-default ui-state-active ui-state-disabled ui-corner-top ui-corner-bottom ui-widget-content ui-tabs-active ui-tabs-panel").removeAttr("tabIndex").removeAttr("aria-live").removeAttr("aria-busy").removeAttr("aria-selected").removeAttr("aria-labelledby").removeAttr("aria-hidden").removeAttr("aria-expanded").removeAttr("role")
}),this.tabs.each(function(){var e=f(this),h=e.data("ui-tabs-aria-controls");h?e.attr("aria-controls",h):e.removeAttr("aria-controls")
}),this.panels.show(),this.options.heightStyle!=="content"&&this.panels.css("height","")
},enable:function(h){var e=this.options.disabled;if(e===!1){return}h===b?e=!1:(h=this._getIndex(h),f.isArray(e)?e=f.map(e,function(i){return i!==h?i:null
}):e=f.map(this.tabs,function(j,i){return i!==h?i:null})),this._setupDisabled(e)},disable:function(h){var e=this.options.disabled;
if(e===!0){return}if(h===b){e=!0}else{h=this._getIndex(h);if(f.inArray(h,e)!==-1){return
}f.isArray(e)?e=f.merge([h],e).sort():e=[h]}this._setupDisabled(e)},load:function(k,p){k=this._getIndex(k);
var l=this,j=this.tabs.eq(k),m=j.find(".ui-tabs-anchor"),h=this._getPanelForTab(j),e={tab:j,panel:h};
if(c(m[0])){return}this.xhr=f.ajax(this._ajaxSettings(m,p,e)),this.xhr&&this.xhr.statusText!=="canceled"&&(j.addClass("ui-tabs-loading"),h.attr("aria-busy","true"),this.xhr.success(function(i){setTimeout(function(){h.html(i),l._trigger("load",p,e)
},1)}).complete(function(n,i){setTimeout(function(){i==="abort"&&l.panels.stop(!1,!0),j.removeClass("ui-tabs-loading"),h.removeAttr("aria-busy"),n===l.xhr&&delete l.xhr
},1)}))},_ajaxSettings:function(h,k,j){var e=this;return{url:h.attr("href"),beforeSend:function(i,l){return e._trigger("beforeLoad",k,f.extend({jqXHR:i,ajaxSettings:l},j))
}}},_getPanelForTab:function(e){var h=f(e).attr("aria-controls");return this.element.find(this._sanitizeSelector("#"+h))
}}),f.uiBackCompat!==!1&&(f.ui.tabs.prototype._ui=function(i,h){return{tab:i,panel:h,index:this.anchors.index(i)}
},f.widget("ui.tabs",f.ui.tabs,{url:function(i,h){this.anchors.eq(i).attr("href",h)
}}),f.widget("ui.tabs",f.ui.tabs,{options:{ajaxOptions:null,cache:!1},_create:function(){this._super();
var e=this;this._on({tabsbeforeload:function(i,h){if(f.data(h.tab[0],"cache.tabs")){i.preventDefault();
return}h.jqXHR.success(function(){e.options.cache&&f.data(h.tab[0],"cache.tabs",!0)
})}})},_ajaxSettings:function(h,k,j){var e=this.options.ajaxOptions;return f.extend({},e,{error:function(l,i){try{e.error(l,i,j.tab.closest("li").index(),j.tab[0])
}catch(m){}}},this._superApply(arguments))},_setOption:function(i,h){i==="cache"&&h===!1&&this.anchors.removeData("cache.tabs"),this._super(i,h)
},_destroy:function(){this.anchors.removeData("cache.tabs"),this._super()},url:function(h){this.anchors.eq(h).removeData("cache.tabs"),this._superApply(arguments)
}}),f.widget("ui.tabs",f.ui.tabs,{abort:function(){this.xhr&&this.xhr.abort()}}),f.widget("ui.tabs",f.ui.tabs,{options:{spinner:"<em>Loading&#8230;</em>"},_create:function(){this._super(),this._on({tabsbeforeload:function(j,h){if(j.target!==this.element[0]||!this.options.spinner){return
}var k=h.tab.find("span"),i=k.html();k.html(this.options.spinner),h.jqXHR.complete(function(){k.html(i)
})}})}}),f.widget("ui.tabs",f.ui.tabs,{options:{enable:null,disable:null},enable:function(e){var i=this.options,h;
if(e&&i.disabled===!0||f.isArray(i.disabled)&&f.inArray(e,i.disabled)!==-1){h=!0}this._superApply(arguments),h&&this._trigger("enable",null,this._ui(this.anchors[e],this.panels[e]))
},disable:function(e){var i=this.options,h;if(e&&i.disabled===!1||f.isArray(i.disabled)&&f.inArray(e,i.disabled)===-1){h=!0
}this._superApply(arguments),h&&this._trigger("disable",null,this._ui(this.anchors[e],this.panels[e]))
}}),f.widget("ui.tabs",f.ui.tabs,{options:{add:null,remove:null,tabTemplate:"<li><a href='#{href}'><span>#{label}</span></a></li>"},add:function(q,l,j){j===b&&(j=this.anchors.length);
var k,p,h=this.options,e=f(h.tabTemplate.replace(/#\{href\}/g,q).replace(/#\{label\}/g,l)),m=q.indexOf("#")?this._tabId(e):q.replace("#","");
return e.addClass("ui-state-default ui-corner-top").data("ui-tabs-destroy",!0),e.attr("aria-controls",m),k=j>=this.tabs.length,p=this.element.find("#"+m),p.length||(p=this._createPanel(m),k?j>0?p.insertAfter(this.panels.eq(-1)):p.appendTo(this.element):p.insertBefore(this.panels[j])),p.addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").hide(),k?e.appendTo(this.tablist):e.insertBefore(this.tabs[j]),h.disabled=f.map(h.disabled,function(i){return i>=j?++i:i
}),this.refresh(),this.tabs.length===1&&h.active===!1&&this.option("active",0),this._trigger("add",null,this._ui(this.anchors[j],this.panels[j])),this
},remove:function(h){h=this._getIndex(h);var k=this.options,j=this.tabs.eq(h).remove(),e=this._getPanelForTab(j).remove();
return j.hasClass("ui-tabs-active")&&this.anchors.length>2&&this._activate(h+(h+1<this.anchors.length?1:-1)),k.disabled=f.map(f.grep(k.disabled,function(i){return i!==h
}),function(i){return i>=h?--i:i}),this.refresh(),this._trigger("remove",null,this._ui(j.find("a")[0],e[0])),this
}}),f.widget("ui.tabs",f.ui.tabs,{length:function(){return this.anchors.length}}),f.widget("ui.tabs",f.ui.tabs,{options:{idPrefix:"ui-tabs-"},_tabId:function(e){var h=e.is("li")?e.find("a[href]"):e;
return h=h[0],f(h).closest("li").attr("aria-controls")||h.title&&h.title.replace(/\s/g,"_").replace(/[^\w\u00c0-\uFFFF\-]/g,"")||this.options.idPrefix+a()
}}),f.widget("ui.tabs",f.ui.tabs,{options:{panelTemplate:"<div></div>"},_createPanel:function(e){return f(this.options.panelTemplate).attr("id",e).addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").data("ui-tabs-destroy",!0)
}}),f.widget("ui.tabs",f.ui.tabs,{_create:function(){var h=this.options;h.active===null&&h.selected!==b&&(h.active=h.selected===-1?!1:h.selected),this._super(),h.selected=h.active,h.selected===!1&&(h.selected=-1)
},_setOption:function(i,h){if(i!=="selected"){return this._super(i,h)}var j=this.options;
this._super("active",h===-1?!1:h),j.selected=j.active,j.selected===!1&&(j.selected=-1)
},_eventHandler:function(){this._superApply(arguments),this.options.selected=this.options.active,this.options.selected===!1&&(this.options.selected=-1)
}}),f.widget("ui.tabs",f.ui.tabs,{options:{show:null,select:null},_create:function(){this._super(),this.options.active!==!1&&this._trigger("show",null,this._ui(this.active.find(".ui-tabs-anchor")[0],this._getPanelForTab(this.active)[0]))
},_trigger:function(m,j,o){var l,h,k=this._superApply(arguments);return k?(m==="beforeActivate"?(l=o.newTab.length?o.newTab:o.oldTab,h=o.newPanel.length?o.newPanel:o.oldPanel,k=this._super("select",j,{tab:l.find(".ui-tabs-anchor")[0],panel:h[0],index:l.closest("li").index()})):m==="activate"&&o.newTab.length&&(k=this._super("show",j,{tab:o.newTab.find(".ui-tabs-anchor")[0],panel:o.newPanel[0],index:o.newTab.closest("li").index()})),k):!1
}}),f.widget("ui.tabs",f.ui.tabs,{select:function(h){h=this._getIndex(h);if(h===-1){if(!this.options.collapsible||this.options.selected===-1){return
}h=this.options.selected}this.anchors.eq(h).trigger(this.options.event+this.eventNamespace)
}}),function(){var e=0;f.widget("ui.tabs",f.ui.tabs,{options:{cookie:null},_create:function(){var i=this.options,h;
i.active==null&&i.cookie&&(h=parseInt(this._cookie(),10),h===-1&&(h=!1),i.active=h),this._super()
},_cookie:function(i){var h=[this.cookie||(this.cookie=this.options.cookie.name||"ui-tabs-"+ ++e)];
return arguments.length&&(h.push(i===!1?-1:i),h.push(this.options.cookie)),f.cookie.apply(null,h)
},_refresh:function(){this._super(),this.options.cookie&&this._cookie(this.options.active,this.options.cookie)
},_eventHandler:function(){this._superApply(arguments),this.options.cookie&&this._cookie(this.options.active,this.options.cookie)
},_destroy:function(){this._super(),this.options.cookie&&this._cookie(null,this.options.cookie)
}})}(),f.widget("ui.tabs",f.ui.tabs,{_trigger:function(h,k,j){var e=f.extend({},j);
return h==="load"&&(e.panel=e.panel[0],e.tab=e.tab.find(".ui-tabs-anchor")[0]),this._super(h,k,e)
}}),f.widget("ui.tabs",f.ui.tabs,{options:{fx:null},_getFx:function(){var e,i,h=this.options.fx;
return h&&(f.isArray(h)?(e=h[0],i=h[1]):e=i=h),h?{show:i,hide:e}:null},_toggle:function(p,k){function q(){v.running=!1,v._trigger("activate",p,k)
}function h(){k.newTab.closest("li").addClass("ui-tabs-active ui-state-active"),m.length&&l.show?m.animate(l.show,l.show.duration,function(){q()
}):(m.show(),q())}var v=this,m=k.newPanel,j=k.oldPanel,l=this._getFx();if(!l){return this._super(p,k)
}v.running=!0,j.length&&l.hide?j.animate(l.hide,l.hide.duration,function(){k.oldTab.closest("li").removeClass("ui-tabs-active ui-state-active"),h()
}):(k.oldTab.closest("li").removeClass("ui-tabs-active ui-state-active"),j.hide(),h())
}}))}(jQuery),function(c){function d(e,g){var f=(e.attr("aria-describedby")||"").split(/\s+/);
f.push(g),e.data("ui-tooltip-id",g).attr("aria-describedby",c.trim(f.join(" ")))}function b(f){var h=f.data("ui-tooltip-id"),g=(f.attr("aria-describedby")||"").split(/\s+/),e=c.inArray(h,g);
e!==-1&&g.splice(e,1),f.removeData("ui-tooltip-id"),g=c.trim(g.join(" ")),g?f.attr("aria-describedby",g):f.removeAttr("aria-describedby")
}var a=0;c.widget("ui.tooltip",{version:"1.9.2",options:{content:function(){return c(this).attr("title")
},hide:!0,items:"[title]:not([disabled])",position:{my:"left top+15",at:"left bottom",collision:"flipfit flip"},show:!0,tooltipClass:null,track:!1,close:null,open:null},_create:function(){this._on({mouseover:"open",focusin:"open"}),this.tooltips={},this.parents={},this.options.disabled&&this._disable()
},_setOption:function(e,g){var f=this;if(e==="disabled"){this[g?"_disable":"_enable"](),this.options[e]=g;
return}this._super(e,g),e==="content"&&c.each(this.tooltips,function(i,h){f._updateContent(h)
})},_disable:function(){var e=this;c.each(this.tooltips,function(h,g){var f=c.Event("blur");
f.target=f.currentTarget=g[0],e.close(f,!0)}),this.element.find(this.options.items).andSelf().each(function(){var f=c(this);
f.is("[title]")&&f.data("ui-tooltip-title",f.attr("title")).attr("title","")})},_enable:function(){this.element.find(this.options.items).andSelf().each(function(){var e=c(this);
e.data("ui-tooltip-title")&&e.attr("title",e.data("ui-tooltip-title"))})},open:function(e){var g=this,f=c(e?e.target:this.element).closest(this.options.items);
if(!f.length||f.data("ui-tooltip-id")){return}f.attr("title")&&f.data("ui-tooltip-title",f.attr("title")),f.data("ui-tooltip-open",!0),e&&e.type==="mouseover"&&f.parents().each(function(){var h=c(this),i;
h.data("ui-tooltip-open")&&(i=c.Event("blur"),i.target=i.currentTarget=this,g.close(i,!0)),h.attr("title")&&(h.uniqueId(),g.parents[this.id]={element:this,title:h.attr("title")},h.attr("title",""))
}),this._updateContent(f,e)},_updateContent:function(k,g){var l,j=this.options.content,f=this,h=g?g.type:null;
if(typeof j=="string"){return this._open(g,k,j)}l=j.call(k[0],function(e){if(!k.data("ui-tooltip-open")){return
}f._delay(function(){g&&(g.type=h),this._open(g,k,e)})}),l&&this._open(g,k,l)},_open:function(j,l,h){function m(f){e.of=f;
if(k.is(":hidden")){return}k.position(e)}var k,n,g,e=c.extend({},this.options.position);
if(!h){return}k=this._find(l);if(k.length){k.find(".ui-tooltip-content").html(h);
return}l.is("[title]")&&(j&&j.type==="mouseover"?l.attr("title",""):l.removeAttr("title")),k=this._tooltip(l),d(l,k.attr("id")),k.find(".ui-tooltip-content").html(h),this.options.track&&j&&/^mouse/.test(j.type)?(this._on(this.document,{mousemove:m}),m(j)):k.position(c.extend({of:l},this.options.position)),k.hide(),this._show(k,this.options.show),this.options.show&&this.options.show.delay&&(g=setInterval(function(){k.is(":visible")&&(m(e.of),clearInterval(g))
},c.fx.interval)),this._trigger("open",j,{tooltip:k}),n={keyup:function(f){if(f.keyCode===c.ui.keyCode.ESCAPE){var i=c.Event(f);
i.currentTarget=l[0],this.close(i,!0)}},remove:function(){this._removeTooltip(k)}};
if(!j||j.type==="mouseover"){n.mouseleave="close"}if(!j||j.type==="focusin"){n.focusout="close"
}this._on(!0,l,n)},close:function(f){var h=this,e=c(f?f.currentTarget:this.element),g=this._find(e);
if(this.closing){return}e.data("ui-tooltip-title")&&e.attr("title",e.data("ui-tooltip-title")),b(e),g.stop(!0),this._hide(g,this.options.hide,function(){h._removeTooltip(c(this))
}),e.removeData("ui-tooltip-open"),this._off(e,"mouseleave focusout keyup"),e[0]!==this.element[0]&&this._off(e,"remove"),this._off(this.document,"mousemove"),f&&f.type==="mouseleave"&&c.each(this.parents,function(i,j){c(j.element).attr("title",j.title),delete h.parents[i]
}),this.closing=!0,this._trigger("close",f,{tooltip:g}),this.closing=!1},_tooltip:function(g){var f="ui-tooltip-"+a++,e=c("<div>").attr({id:f,role:"tooltip"}).addClass("ui-tooltip ui-widget ui-corner-all ui-widget-content "+(this.options.tooltipClass||""));
return c("<div>").addClass("ui-tooltip-content").appendTo(e),e.appendTo(this.document[0].body),c.fn.bgiframe&&e.bgiframe(),this.tooltips[f]=g,e
},_find:function(e){var f=e.data("ui-tooltip-id");return f?c("#"+f):c()},_removeTooltip:function(f){f.remove(),delete this.tooltips[f.attr("id")]
},_destroy:function(){var e=this;c.each(this.tooltips,function(h,g){var f=c.Event("blur");
f.target=f.currentTarget=g[0],e.close(f,!0),c("#"+h).remove(),g.data("ui-tooltip-title")&&(g.attr("title",g.data("ui-tooltip-title")),g.removeData("ui-tooltip-title"))
})}})}(jQuery);(function(a){a.caretTo=function(d,c){if(d.createTextRange){var b=d.createTextRange();
b.move("character",c);b.select()}else{if(d.selectionStart!=null){d.focus();d.setSelectionRange(c,c)
}}};a.fn.caretToEnd=function(){return this.queue(function(b){a.caretTo(this,a(this).val().length);
b()})}}(jQuery));(function(a){a.tiny=a.tiny||{};a.tiny.scrollbar={options:{axis:"y",wheel:40,scroll:true,lockscroll:true,size:"auto",sizethumb:"auto",minsizethumb:0,invertscroll:false}};
a.fn.tinyscrollbar=function(d){var c=a.extend({},a.tiny.scrollbar.options,d);this.each(function(){a(this).data("tsb",new b(a(this),c))
});return this};a.fn.tinyscrollbar_update=function(c){return a(this).data("tsb").update(c)
};function b(q,g){var k=this,t=q,j={obj:a(".viewport",q)},h={obj:a(".overview",q)},d={obj:a(".scrollbar",q)},m={obj:a(".track",d.obj)},p={obj:a(".thumb",d.obj)},l=g.axis==="x",n=l?"left":"top",v=l?"Width":"Height",r=0,y={start:0,now:0},o={},e="ontouchstart" in document.documentElement;
function c(){k.update();s();return k}this.update=function(z){j[g.axis]=j.obj[0]["offset"+v]-3;
h[g.axis]=h.obj[0]["scroll"+v];h.ratio=j[g.axis]/h[g.axis];d.obj.toggleClass("disable",h.ratio>=1);
m[g.axis]=g.size==="auto"?j[g.axis]:g.size;p[g.axis]=Math.min(m[g.axis],Math.max(0,(g.sizethumb==="auto"?Math.max(m[g.axis]*h.ratio,g.minsizethumb):g.sizethumb)));
d.ratio=(h[g.axis]-j[g.axis])/(m[g.axis]-p[g.axis]);r=(z==="relative"&&h.ratio<=1)?Math.min((h[g.axis]-j[g.axis]),Math.max(0,r)):0;
r=(z==="bottom"&&h.ratio<=1)?(h[g.axis]-j[g.axis]):isNaN(parseInt(z,10))?r:parseInt(z,10);
w()};function w(){var z=v.toLowerCase();p.obj.css(n,Math.min(r/d.ratio,m[g.axis]-g.minsizethumb));
h.obj.css(n,-r);o.start=p.obj.offset()[n];d.obj.css(z,m[g.axis]);m.obj.css(z,m[g.axis]);
p.obj.css(z,p[g.axis])}function s(){if(!e){p.obj.bind("mousedown",i);m.obj.bind("mouseup",u)
}else{j.obj[0].ontouchstart=function(z){if(1===z.touches.length){i(z.touches[0]);
z.stopPropagation()}}}if(g.scroll&&window.addEventListener){t[0].addEventListener("DOMMouseScroll",x,false);
t[0].addEventListener("mousewheel",x,false)}else{if(g.scroll){t[0].onmousewheel=x
}}}function i(A){a("body").addClass("noSelect");var z=parseInt(p.obj.css(n),10);o.start=l?A.pageX:A.pageY;
y.start=z=="auto"?0:z;if(!e){a(document).bind("mousemove",u);a(document).bind("mouseup",f);
p.obj.bind("mouseup",f)}else{document.ontouchmove=function(B){B.preventDefault();
u(B.touches[0])};document.ontouchend=f}}function x(B){if(h.ratio<1){var A=B||window.event,z=A.wheelDelta?A.wheelDelta/120:-A.detail/3;
r-=z*g.wheel;r=Math.min((h[g.axis]-j[g.axis]),Math.max(0,r));p.obj.css(n,Math.min(r/d.ratio,m[g.axis]-g.minsizethumb));
h.obj.css(n,-r);if(g.lockscroll||(r!==(h[g.axis]-j[g.axis])&&r!==0)){A=a.event.fix(A);
A.preventDefault()}}}function u(z){if(h.ratio<1){if(g.invertscroll&&e){y.now=Math.min((m[g.axis]-p[g.axis]),Math.max(0,(y.start+(o.start-(l?z.pageX:z.pageY)))))
}else{y.now=Math.min((m[g.axis]-p[g.axis]),Math.max(0,(y.start+((l?z.pageX:z.pageY)-o.start))))
}r=y.now*d.ratio;h.obj.css(n,-r);p.obj.css(n,y.now)}}function f(){a("body").removeClass("noSelect");
a(document).unbind("mousemove",u);a(document).unbind("mouseup",f);p.obj.unbind("mouseup",f);
document.ontouchmove=document.ontouchend=null}return c()}}(jQuery));(function(b,f,m){var c=false;
if(b.browser.msie&&b.browser.version.substr(0,1)<7){c=true}else{m.documentElement.className=m.documentElement.className+" dk_fouc"
}var q={},s=[],o={left:37,up:38,right:39,down:40,enter:13},e=['<div class="dk_container" id="dk_container_{{ id }}" tabindex="{{ tabindex }}">','<a class="dk_toggle">','<span class="dk_label">{{ label }}</span>',"</a>",'<div class="dk_options">','<ul class="dk_options_inner">',"</ul>","</div>","</div>"].join(""),h='<li class="{{ current }}"><a data-dk-dropdown-value="{{ value }}">{{ text }}</a></li>',i={startSpeed:0,theme:false,change:false},l=false;
q.init=function(t){t=b.extend({},i,t);return this.each(function(){var w=b(this),C=w.find(":selected").first(),B=w.find("option"),A=w.data("dropkick")||{},u=w.attr("id")||w.attr("name"),v=t.width||w.outerWidth(),x=w.attr("tabindex")?w.attr("tabindex"):"",y=false,z;
if(A.id){return w}else{A.settings=t;A.tabindex=x;A.id=u;A.$original=C;A.$select=w;
A.value=d(w.val())||d(C.attr("value"));A.label=C.text();A.options=B}y=a(e,A);y.find(".dk_toggle").css({width:v+"px"});
w.before(y);y=b("#dk_container_"+u).fadeIn(t.startSpeed);z=t.theme?t.theme:"default";
y.addClass("dk_theme_"+z);A.theme=z;A.$dk=y;w.data("dropkick",A);y.data("dropkick",A);
s[s.length]=w;y.bind("focus.dropkick",function(D){y.addClass("dk_focus")}).bind("blur.dropkick",function(D){y.removeClass("dk_open dk_focus")
});setTimeout(function(){w.hide()},0)})};q.theme=function(x){var u=b(this),v=u.data("dropkick"),t=v.$dk,w="dk_theme_"+v.theme;
t.removeClass(w).addClass("dk_theme_"+x);v.theme=x};q.reset=function(){for(var v=0,t=s.length;
v<t;v++){var x=s[v].data("dropkick"),u=x.$dk,w=u.find("li").first();u.find(".dk_label").text(x.label);
u.find(".dk_options_inner").animate({scrollTop:0},0);n(w,u);g(w,u,true)}};b.fn.dropkick=function(t){if(!c){if(q[t]){return q[t].apply(this,Array.prototype.slice.call(arguments,1))
}else{if(typeof t==="object"||!t){return q.init.apply(this,arguments)}}}};function p(A,v){var t=A.keyCode,w=v.data("dropkick"),D=v.find(".dk_options"),z=v.hasClass("dk_open"),B=v.find(".dk_option_current"),y=D.find("li").first(),C=D.find("li").last(),x,u;
switch(t){case o.enter:if(z){g(B.find("a"),v);k(v)}else{r(v)}A.preventDefault();break;
case o.up:u=B.prev("li");if(z){if(u.length){n(u,v)}else{n(C,v)}}else{r(v)}A.preventDefault();
break;case o.down:if(z){x=B.next("li").first();if(x.length){n(x,v)}else{n(y,v)}}else{r(v)
}A.preventDefault();break;default:break}}function g(v,u,w){var y,t,x;y=v.attr("data-dk-dropdown-value");
t=v.text();x=u.data("dropkick");$select=x.$select;$select.val(y);u.find(".dk_label").text(t);
w=w||false;if(x.settings.change&&!w){x.settings.change.call($select,y,t)}}function n(u,t){t.find(".dk_option_current").removeClass("dk_option_current");
u.addClass("dk_option_current");j(t,u)}function j(v,u){var t=u.prevAll("li").outerHeight()*u.prevAll("li").length;
v.find(".dk_options_inner").animate({scrollTop:t+"px"},0)}function k(t){t.removeClass("dk_open")
}function r(t){var u=t.data("dropkick");t.find(".dk_options").css({top:t.find(".dk_toggle").outerHeight()-1});
t.toggleClass("dk_open")}function a(y,A){var B=y,C=[],v;B=B.replace("{{ id }}",A.id);
B=B.replace("{{ label }}",A.label);B=B.replace("{{ tabindex }}",A.tabindex);if(A.options&&A.options.length){for(var w=0,u=A.options.length;
w<u;w++){var t=b(A.options[w]),z="dk_option_current",x=h;x=x.replace("{{ value }}",t.val());
x=x.replace("{{ current }}",(d(t.val())===A.value)?z:"");x=x.replace("{{ text }}",t.text());
C[C.length]=x}}v=b(B);v.find(".dk_options_inner").html(C.join(""));return v}function d(t){return(b.trim(t).length>0)?t:false
}b(function(){b(".dk_toggle").live("click",function(u){var t=b(this).parents(".dk_container").first();
r(t);if("ontouchstart" in f){t.addClass("dk_touch");t.find(".dk_options_inner").addClass("scrollable vertical")
}u.preventDefault();return false});b(".dk_options a").live((b.browser.msie?"mousedown":"click"),function(w){var v=b(this),t=v.parents(".dk_container").first(),u=t.data("dropkick");
k(t);g(v,t);n(v.parent(),t);w.preventDefault();return false});b(m).bind("keydown.dk_nav",function(v){var w=b(".dk_container.dk_open"),u=b(".dk_container.dk_focus"),t=null;
if(w.length){t=w}else{if(u.length&&!w.length){t=u}}if(t){p(v,t)}})})})(jQuery,window,document);