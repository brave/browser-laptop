(function () {
    function adReplace() {
        if (window.arConfig) {
            for (var i = 0; i < arConfig.rules.length; i++) {
                var rule = arConfig.rules[i];
                var url = document.location.hostname + document.location.pathname;
                if (url.startsWith(rule.url)) {
                    for (var j = 0; j < rule.eles.length; j++) {
                        var eleSler = rule.eles[j];
                        var eless = document.querySelectorAll(eleSler);
                        for (var x = 0; x < eless.length; x++) {
                            var ele = eless[x];
                            if (ele) {
                                var width = ele.clientWidth;
                                var height = ele.clientHeight;
                                ele.innerHTML = "<div style='width:" + width + "px;height:" + height + "px;font-size:20px'>"
                                    + (rule.replaceText || arConfig.replaceText) + "</div>";

                            }
                        }
                    }
                }
            }
        }
        setTimeout(adReplace,200);
    }
    adReplace();
})();
// document.querySelector("#lg").innerHTML = "<h1>天国在此，谁敢造次！</h1>";
// document.querySelector("#kw").value = "天国你大爷";