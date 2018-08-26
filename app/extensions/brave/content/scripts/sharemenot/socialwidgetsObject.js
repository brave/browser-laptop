var trackerInfoObject = {
	"AddThis": {
		"domain": "s7.addthis.com",
		"buttonSelectors": [
			".addthis_toolbox"
		],
		"replacementButton": {
			"details": "<!-- AddThis Button BEGIN --> <div class='addthis_toolbox addthis_default_style addthis_32x32_style'> <a class='addthis_button_preferred_1'></a> <a class='addthis_button_preferred_2'></a> <a class='addthis_button_preferred_3'></a> <a class='addthis_button_preferred_4'></a> <a class='addthis_button_compact'></a> <a class='addthis_counter addthis_bubble_style'></a> </div> <script type='text/javascript'>var addthis_config = {'data_track_addressbar':true};</script> <script type='text/javascript' src='//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-522d600d3b535ebf'></script> <!-- AddThis Button END -->",
			"unblockDomains": [
				"http://s7.addthis.com/",
				"http://ct1.addthis.com/",
				"http://api-public.addthis.com/"
			],
			"imagePath": "AddThis.svg",
			"type": 2
		}
	},

	"Digg": {
		"domain": "widgets.digg.com",
		"buttonSelectors": [
			".DiggThisButton"
		],
		"replacementButton": {
			"details": "http://www.digg.com/submit?url=",
			"unblockDomains": [
				"http://www.digg.com/submit?url="
			],
			"imagePath": "Digg.svg",
			"type": 0
		}
	},

	"Facebook Like": {
		"domain": "www.facebook.com",
		"buttonSelectors": [
			"fb\\:like",
			"iframe[src*='://www.facebook.com/plugins/like.php']",
			"iframe[src*='://www.facebook.com/v2.0/plugins/like.php']",
			".fb-like"
		],
		"replacementButton": {
			"details": "https://www.facebook.com/plugins/like.php?href=",
			"unblockDomains": [
                                "https://www.facebook.com/plugins/like.php?href=",
                                "https://www.facebook.com/v2.0/plugins/like.php?href="
                        ],
			"imagePath": "FacebookLike.svg",
			"type": 1
		}
	},

	"Facebook Share": {
		"domain": "www.facebook.com",
		"buttonSelectors": [
			"fb\\:share_button",
			"iframe[src*='://www.facebook.com/plugins/share_button.php']",
			"iframe[src*='://www.facebook.com/v2.0/plugins/share_button.php']",
			".fb-share-button"
		],
		"replacementButton": {
			"details": "https://www.facebook.com/plugins/share_button.php?href=",
			"unblockDomains": [
                                "https://www.facebook.com/plugins/share_button.php?href=",
                                "https://www.facebook.com/v2.0/plugins/share_button.php?href="
                        ],
			"imagePath": "FacebookShare.svg",
			"type": 1
		}
	},

	"Google+": {
		"domain": "apis.google.com",
		"buttonSelectors": [
			"g\\:plusone",
			".g-plusone"
		],
		"replacementButton": {
			"details": "https://plusone.google.com/se/0/_/+1/fastbutton?url=",
			"unblockDomains": [
				"https://plusone.google.com/se/0/_/+1/fastbutton?url=",
				"http://clients6.google.com/",
				"http://apis.google.com/"
                        ],
			"imagePath": "GooglePlus.svg",
			"type": 1
		}
	},

        "SoundCloud": {
          "domain": "soundcloud.com",
          "buttonSelectors": [
            "iframe[src*='api.soundcloud.com']"
          ],
          "replacementButton": {
            "details": "",
            "unblockDomains": [
              "https://w.soundcloud.com/"
            ],
            "imagePath": "soundcloud.png",
            "type": 3
          }
        },
	"LinkedIn": {
		"domain": "platform.linkedin.com",
		"buttonSelectors": [
			"script[type='in/share']"
		],
		"replacementButton": {
			"details": "http://www.linkedin.com/shareArticle?mini=true&url=",
			"unblockDomains": [
				"http://www.linkedin.com/shareArticle?mini=true&url="
                        ],
			"imagePath": "LinkedIn.svg",
			"type": 0
		}
	},

	"Pinterest": {
		"domain": "assets.pinterest.com",
		"buttonSelectors": [
			"script[src='//assets.pinterest.com/js/pinit.js']",
			".pin-it-button"
		],
		"replacementButton": {
			"details": "http://pinterest.com/pin/create/button/?url=",
			"unblockDomains": [
				"http://pinterest.com/pin/create/button/?url="
                        ],
			"imagePath": "Pinterest.svg",
			"type": 0
		}
	},

	"StumbleUpon": {
		"domain": "www.stumbleupon.com",
		"buttonSelectors": [
			"su\\:badge",
			"script[src^='http://www.stumbleupon.com/hostedbadge.php']"
		],
		"replacementButton": {
			"details": "http://www.stumbleupon.com/badge/?url=",
			"unblockDomains": [
				"http://www.stumbleupon.com/badge/?url="
                        ],
			"imagePath": "StumbleUpon.svg",
			"type": 0
		}
	},

	"Twitter": {
		"domain": "platform.twitter.com",
		"buttonSelectors": [
			".twitter-share-button"
		],
		"replacementButton": {
			"details": "https://twitter.com/intent/tweet?url=",
			"unblockDomains": [
				"https://twitter.com/intent/tweet?url="
                        ],
			"imagePath": "Twitter.svg",
			"type": 0
		}
	}
}
