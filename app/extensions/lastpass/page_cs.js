var MAX_META=50;
function LP_getLPMeta(b){b||(b=LP_derive_doc());if(!b)return null;var c=null,e=!1,f="",g="";b=b.getElementsByTagName("meta");for(var d=0;d<b.length&&d<MAX_META;d++)if(c=b[d])if((name=c.getAttribute("name"))&&"LASTPASS"==name.toUpperCase()){var a=c.getAttribute("data-lpignore");"undefined"!=typeof a&&null!==a&&(e=a);a=c.getAttribute("data-lpfunction");"undefined"!=typeof a&&null!==a&&(f=a);a=c.getAttribute("data-lpflavor");"undefined"!=typeof a&&null!==a&&(g=a)}return{skiplp:e,lpfunction:f,lpflavor:g}}
;
