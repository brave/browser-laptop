
function betterttv_init()
{
	script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = "https://cdn.betterttv.net/betterttv.js?"+Math.random();
	thehead = document.getElementsByTagName('head')[0];
	if(thehead) thehead.appendChild(script);
}

betterttv_init();
