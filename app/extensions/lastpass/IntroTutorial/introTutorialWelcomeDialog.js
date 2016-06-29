var IntroTutorialWelcomeDialog = function(dialog) {
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
IntroTutorialWelcomeDialog.prototype = Object.create(Dialog.prototype);
IntroTutorialWelcomeDialog.prototype.constructor = IntroTutorialWelcomeDialog;

(function() {
  IntroTutorialWelcomeDialog.prototype.initialize = function(element) {
    Dialog.prototype.initialize.apply(this, arguments);

    (function(dialog) {

      var addSiteElement = element.find('#addSiteLink');
      var importSitesElement = element.find('#importLink');
      var noThanksElement = element.find('#noThanks, #btnClose');

      function bindAddSite(event) {
        event.preventDefault();
        IntroTutorialImprove.improveLP('shadingwelcome', 'addsite');
        dialog.close(true);
        dialogs.introTutorialSelectSite.open();
      }
      function bindImportSites(event) {
        event.preventDefault();
        window.location = LPProxy.getBaseURL() + 'dl';
        var introTutorialHelp = new IntroTutorialHelpDialog();
        introTutorialHelp.initialize(document, {
          makeShade: false,
          alignBottom: true,
          addHide: true,
          transparentBG: true,
          appendElementId: 'vault',
          textChoice: 'downloadImporter',
          arrow: {
            orientation: 'bottom',
            position: 'left'
          }
        });
        IntroTutorialImprove.improveLP('shadingwelcome', 'download');
        IntroTutorialImprove.improveLP('downloadimporter', 'welcome');
        dialog.close(true);
      }

      addSiteElement.bind('click', bindAddSite);
      importSitesElement.bind('click', bindImportSites);

      noThanksElement.bind('click', function(event) {
        event.preventDefault();
        IntroTutorialImprove.improveLP('shadingwelcome', 'nothanks');
        dialog.close(true);
        LPVault.openTour();
      });

    })(this);
  };

  IntroTutorialWelcomeDialog.prototype.close = function(forceClose) {
    if(!forceClose) {
      (function(dialog) {
        dialogs.confirmation.open({
          title: Strings.translateString("Close"),
          text: Strings.translateString("Are you sure You'd like to exit the tutorial?"),
          handler: function() {
            IntroTutorialImprove.improveLP('shadingwelcome', 'nothanks');
            dialog.close(true);
          }
        });
      })(this);
    }
    else {
      Dialog.prototype.close.call(this, forceClose);
    }
  };
})();
