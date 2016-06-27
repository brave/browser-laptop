var IntroTutorialCompleteDialog = function(dialog) {
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
IntroTutorialCompleteDialog.prototype = Object.create(Dialog.prototype);
IntroTutorialCompleteDialog.prototype.constructor = IntroTutorialCompleteDialog;

(function() {

  IntroTutorialCompleteDialog.prototype.initialize = function(element) {
    Dialog.prototype.initialize.apply(this, arguments);

    (function(dialog) {
      var downloadImporter = element.find('#downloadImporter');
      var noThanksElement = element.find('#noThanks, #btnClose');
      var siteName = element.find('#siteName');

      if(bg.g_introTutorialStatus && bg.g_introTutorialStatus.getName()) {
        siteName.text(' ' + bg.g_introTutorialStatus.getName() + ' ');
      }

      downloadImporter.bind('click', function(event) {
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
        IntroTutorialImprove.improveLP('downloadimporter', 'complete');
        dialog.close(true);
      });

      noThanksElement.bind('click', function(event) {
        event.preventDefault();
        dialog.close(true);
      });

      LPProxy.setPreferences('ShowIntroTutorial', false);
      if(bg && bg.g_introTutorialStatus) {
        bg.g_introTutorialStatus.setStatus(false);
      }

    })(this);
  };

})();
