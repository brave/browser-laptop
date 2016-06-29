var IntroTutorialSelectSiteDialog = function(dialog) {
  Dialog.call(this, dialog, {
    closeButtonEnabled: false,
    maximizeButtonEnabled: false,
    dynamicHeight: true,
    hideHeader: true,
    hideButtons: true,
    confirmOnClose: false
  });
};

// Extend Dialog
IntroTutorialSelectSiteDialog.prototype = Object.create(Dialog.prototype);
IntroTutorialSelectSiteDialog.prototype.constructor = IntroTutorialSelectSiteDialog;

(function() {
  IntroTutorialSelectSiteDialog.prototype.getBigIcon = function(name) {
    var imageData = null;
    if(IntroTutorialImages) {
      imageData = IntroTutorialImages.getImage(name.toLowerCase(), 'large');
    }
    return imageData;
  };

  IntroTutorialSelectSiteDialog.prototype.initialize = function(element) {
    Dialog.prototype.initialize.apply(this, arguments);

    (function(dialog) {
      var noThanksElement = element.find('#btnClose');

      function setupTile(parentElement, elementId, name, domain) {

        LPProxy.getSiteMeta(domain,
          function(response) {
            if(response && response.length == 1) {
              var data = response[0];
              var tile1Icon = parentElement.find(elementId + ' .bigIcon');
              var launchButton = parentElement.find(elementId + ' .launchButton');
              var bigIcon = IntroTutorialSelectSiteDialog.prototype.getBigIcon(name);

              tile1Icon.attr('src', bigIcon? bigIcon : 'data:image/gif;base64,' + data.favicon);

              if(domain === 'netflix.com') {
                data.url = 'https://www.netflix.com/SignOut';
              }
              launchButton.attr('href', data.url);

              launchButton.click( data.url, function(event) {
                event.preventDefault();
                IntroTutorialImprove.improveLP('selectedtoursite', domain.charAt(0));
                if(bg && bg.g_introTutorialStatus) {
                  bg.g_introTutorialStatus.init(true, domain, name);
                }
                window.location = event.data;
              });
            }
          });

        var tile1Name = parentElement.find(elementId + ' .name');
        var overlayText = parentElement.find(elementId + ' .overlayHelpText');

        tile1Name.text(name);
        overlayText.text(overlayText.text() + ' ' + name);
      }
      setupTile(element, '#tile1', 'Google', 'google.com');
      setupTile(element, '#tile2', 'Facebook', 'facebook.com');
      setupTile(element, '#tile3', 'Amazon', 'amazon.com');
      setupTile(element, '#tile4', 'Netflix', 'netflix.com');

      noThanksElement.bind('click', function(event) {
        event.preventDefault();
        dialog.close(true);
        LPVault.openTour();
      });

    })(this);
  };

  IntroTutorialSelectSiteDialog.prototype.close = function(forceClose) {
    if(!forceClose) {
      dialogs.confirmation.open({
        title: Strings.translateString("Close"),
        text: Strings.translateString("Are you sure You'd like to exit the tutorial?"),
        handler: this.createHandler(this.close, true)
      });
    }
    else {
      Dialog.prototype.close.call(this, forceClose);
    }
  };

})();
