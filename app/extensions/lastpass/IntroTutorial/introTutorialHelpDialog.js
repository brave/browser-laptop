var IntroTutorialImages = IntroTutorialImages || (function() {
  var _images = {
    amazon: {
      large: "data:image/png;base64,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"
    },
    google: {
      large: "data:image/png;base64,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"
    },
    facebook: {
      large: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALAAAAAsCAIAAABKcaUxAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AQMDxQ1Fof8EQAAENJJREFUeNrtXHlUFFe6v7equpq92XcQEEFEFpcYg/tzfxJHo0bFNxN1sptJYiZOXl6SifOSTDbjTGKc8R2NccOMx8QkOmrcdzQqAoIICMjS0A3d0Cu9VdW974+GpqmqbhrEP1Tu4Xi6bvWtvve7v+/3bbeEGGMw2AZbVyMGRTDYBgEx2AYBMdg8a5SrG1dKGi9cr21W6eUtOhISCOPocFlEiG/ykNCRwyLSksIf9JUbzbbahjZ5i766Xq3WmoICvNc+M/Eh2FG90VpVp2pU6hoUWoVKPyoteuncrHsCREml4t2/H2tq1dMS0rm/QaEFACCEA/ykJ7c/9+CKbOdPhV/tucQwiKIIkoQkQQAARo+IedCh8JfNJ38+Xc5ySEIRJEEQBAQAhAb53hNDlNe0rn5nv4QieWjotjEETIoLeaAFx7CIIkkJRT5kbG+xsbTE5cb104d47a8H3UsKAzBsyIMNCAAfUn8QDsDCegDi0JnbGr3Z/QCMcFLsgw0IjB7O1As3EOvqYTIKy5soUiTuQBhzHIIAEgRkWC5taNgDzhAPJ0UMyKp6AKKuSSOiTxi8vGx8amI4w3KqNuPdZk1iTPBgePZIhJ16o0XoMTw9J2PlwrGDknpEGtGTSqGQHyJC/QfF9IgCAgAstBe+3pJBMT2iJoMgCDEPrHdnxdBhVaoNLW1Gs4W193hJyaAAn/goWYCfl+ezUWtNzS06laYDIQwAoEgiMsw/OjxA5vYhJjNTr9C0qI02hsUA+HnTibHB0eEBfdMMonuZGr35rlyj1hgxAACD2EjZiKHh0DNXVKM3NzRrW9uNCGMIIQQgISYoPipQSlN9mk+DQlvfrLVYGAwwhDDQ3zs+WhYRct/Zmiooqi+7o4QQQgg1OpMQDScKqlXtHY4qOcOi3y96zEtK/Xyq/FpZ480qpUJlsNpYkoAkQXR7uhggjFkWhQb7ThqTkDcvOzXRZWxypbjhp9O3LhXV6wwWiiSIroAaA8BxiEPY31eaEBOU/9ky51E6g2XPv4uOnKtoVOpIgiDJzlEIA5bjvKWSqeOSVi4YOzzJo5jIxnCnf605cq6iqKJZ1dZBUQTZBREOYQlFzHhi2J9fnu5qXxUqw55DN05erla06imKdIy1LwEAMDwpfN6U4cvmZlGUu/rR+et39x0tKSpvNlkYiuwUBAYAY8xyyFsqmTg6YfHsjPFZ8fey6//7z1OXbtQ52wEAAMNy+Z8tg1/uupj/7yJ7zOJKB5yPTFht7MX8F40m24zV2/x8aA9nYGPY5fOy162ewuvX6s1vfn7kRnlTr/k1Px/pye3PdqdMzt7+6P9OY4TdK66N4Z6cmrb+DzOdv7T1+2vb9l/ljUMII4xFo26nOdB7NywPD/bj9X/4z1M/nCjrlQMQwlKafOvZqblT04R365o16z47XCtv7zWFamXYzJSojW/lhgT6OPe/vfGXM1dreF9ePDvjzVWTnXuaWnTzX94pEQh8THrs5vd+Q9hpAEJ3wbn9rv1PSlN+PtLIUH9fnz74FrSE2nf05q6fbzh3Gk22JWvzy+4oPcm2Do3rjnV3/Fj4/qYTAPduzmgJefRC5f9s/MUTk+EeDfYJv/D+AV7nyrf3Hzx72xOLQBCQYdH6r09u/+Ea71ZlnXrZG3sblTpPEupSCVV5VzV/zc5Gpa4f9LDh2/NCNNgY7k+/nwz6Uf6W0p3PigmT9c04kcTX+QXOPes+P2zosHoyFgOQkhBq/3yzUvHl7oueZ+wJAh6/VHWi4M6AmNhGpe7YxSrH5Sdbz5bXtPQpZ0xRxKb8gpIKhfNmPP/nH/o6E45DL//lx76Okit1Z6/WCvtnTUgZEh3UH0A4aGpEcp8r4AjjkwXVnTpxV3W5uMHDgRjhpNhOhvhixwVRdcQYcwghsfStREJu/u7ywPhcJHHwTLlDuPuOljh7ox4rFfXuV8cdl5v3FlisbD8m09Jm/PbH630a8sGWU0Lp2RjurWc7rTmFAXYIUXRtGPc4dinz97Z/SE0MO3jmdoCvVObvFRMhCw308faSQAgZlmtq0RXfVgi9J4okCsubZuQkAwAOnLjlJaVEgU8QUObnTZLQZGHMVsZm4xBCQ4eE2kVQWiViYiiSyMvNTowJttjYgqL6M1drePx/t7Fd3qKLjeiF1TAGNoalJaREQprMjCgPFXcp997DxbQYNBmWk/l7x0XKrDa2rkmDMBZSiFypvVmpyEyNAgDsO3pTlGI4DkWFB0SF+cuVOoXKIJwMQcD9x0pXeZw2LK9pvVYq5z0HY7D0P7OCAjq3lZo8NikuMpCAEBJwy7+u8IpbGOOZOSmjRkRjewQGYIisc+S8KWlzJ6W6Kre368yLXttttjACb1zfKdbKZlFRvvfS9AXT050noFQbKu+q7D7ElZIGUmDpOQ7t/9uKuKhA++XCGen/vfEojxhpmrpeJncDCISwrw+9eHbGrJxhw4aEAgCUasPrHx8SpvMtVsZsYby9JOeu1YqSw8a3npzyWKLj8vPt5/YdvckDqJSmTv9ak5kaVVzRzDCc0KgnDwnd9M58xz7JW3SvfnSwuVXP+1pzi76pVR/jWYy9Yfs5IaogBK/kPdGtWqPSokelRdsvdh+8IQAEGJMes3BGuvDpwV3IEG3BMu85E1MOnLzFE5nW0Pn8hmaRusmimRnOaLA7vFFhAVFhnQuuk7eTAhoblxnnQIO9PTVj5ImCO84OGknAmsZ2NxNOSwrb+clS557IUP+P18556tXdPI5lWdRhttE0JdRahPCavCec0QAAWLd6Skmlorq+jfeL1Q1tAICaxnYhxG0M980Hi5x/NzZC9tU783Nf3MGjVYoiquvVngCi+HZzcYVCQA/4t/NH+3rT4plK0SP5/T6nHx7sBwRjHXGBI4XlTA92a+KmtetEqvMRIfw40M9XKpy1ewfWXyz3FRnqL1JThgAAqDda7AkGXkA4Z1Kq8DmzJ6QIxahUGQAAak2H0FJnpEQKLX1shEy4UgJCtcbkyXZsyi8Q0gMtIdfk5bjMVA5sE3UR3Npv3GtaE4p5OTfKm9/e+AuHEIQQY0wQ0NBhE8aQVreOm6g3SktIV/ogGllgBGT+IkuQ+XthLAjsXTujPl7iIb3M30snKEC692rt966WNhZVNNM9Y1oOoVeXT+TNagAAUa/QVtS2GjqsvErIzUpFn2r0GIPeg0mx7VGqDUq1oVcxcRgNINyROFCwq13pE8262mNSLFPSG4NDAMDfdlygBRmOAF+vvHlZ7moZfW2Hz1Vs2nNJ2WaUkIQwRwQhgA/pUZQHqxUU1VfWqXnKxnHo9d+JnDLvPyA27738zQ/XaAnpRVMPhmAezXcWIW5o1goNKIeQ6GHpfr6oU9ek2fb91Xs84Nt39run02/9GIr6fEoRivocCA/M+bb+OPgYLpuX5e8rFbhH1EdbTg0YQ3x/vJS+D8TQP6kF+HklRAdi1/tHkgRCyJ6a7SunwD4v4T5ayX4//A//lfPhltM8nqisU527WjtlXNIAAKKkQiGcGkUSE0YneHtJaAkJMK5paCuraYV90GAodKE98e1zsuPXvzLzfmyA3mgVjWugi52BEJgsNmF4ZbYwwgHQNSkyjLj/22G29Y/5FkxP3/lToULVw/WWUORft54ZGEAIvXqrjd35RZ7zoYfvjpSUVbfw54sdWguFeKppbHNkyUSb6GECtdZ0nzTyWlmj0DknCcKeJMBi07tT3/Z4pg+vv6K2VQhlWkIBAHy8JRjzi/j1Co1oXNPabhRyWK9F2k6SWDFh3YbDvGpqu8607+jNpXMz79WHEC6PQzgxNrin4CB2DWdH8tE51vr2wHWbjXPzu8nxIUK7cK200WDqpWoqqlvu9ay1zfjFjvPCSI+iCD8f2s+HlvnxDbOEIjftucTrbFToRGutCbFBAIAhUYHC3Fe71rT/WCnfi8+/LFw7y3JD40PcWr3OIf8xfmhKQpgQ3H/fddGZpfrJEMJ4kqbIU1eq505KtYc0v95sPHK+UozhO3tSEkLVmg7evTatadZz256cmhYdEUCRpMXCqDQddU2asjvKbR8uTooNzh4ezbAcL4sHIVzyev7qp8ZmpkT6+kghBCYzo9Gb65o0TS268uqWkkrFMwvGvLIix82KKmpVX+6+REDo4yVp05qqG9uKyptE4/7krg3ISo2+fkvOu3unvi33pR1L5mQkxQazLCq8Jf/+eJnwIRzC9lNPj2XEsSziaTlJEp9uPXu5uH7SmMTIMH+lynD0QsWN8mYhGdAS0vMXr/+4ctLz7x8QpNvRV3suvfbbCfcEiPjoQG2lmac37315/NNtZymSaNeaIAHdn/WYPDbxQmGdsDBhsbL7j5XaK6ywC3ksh+42tifFBqckhIYE+hhNfHXX6s0btp9nWA53gY4gIEl2HsYjSeJ2bWuvFLL3cLFdp+wwdpEFwtPGDbV/zp2WdqWkgWfFIARqTcc/9l7mOAygSz5HCM/KGWZPSo5Jj7lV3SLkoYKi+ouFdRxC9jd3RR817fGhnkdPY0fGjkqL5v0WhDD/UFFebnZYkG//TcbotGhhCERRhMXKGk02mqZ6PfmzYHq6t+vcNoSQsB/k6mK2GnlnaeqFpeNZDolm96Q05UVTXjQlpSmJ40Rip+KqPYlxYG8+GofwiidH2T/PmZgSGebvav4URbhCA8Z4+bwsB8+9sXKSjeFcpSwlFOkqcWm1cS8tG9+njXv3xelWGyv8lU+3nvXUhxB1gxfNymBY1C9b0/35/TUzXAlCOKq2obNauGR2Rvbw6L5G5Eq1sduNwP1MC9gY7u3npjkXGr7407y+5ypAdFjA2mcmOS7TkyPycrNFUe6mMQz3zgvTesTSHiwqMTZo1oQUYf+ZqzW18naPACGqMWHBvityszm3a7AxnHCss/imj09++/lpQsCKtlp5d/F62weLRqXFMCznufgkFFFapbyXiMNqY99cNXnRrJHOnamJYVvWLyQJ6CE+OQ4lxgbv+nQpz1a+uWry0rmZHqqHXbZvrJq0eHZGPzJv61ZPFopOQpGff3OODwiWRUznH9f1L+dKA/64avLMnGFmKyNcs9XGjh0Zu+Pjp1/Jy7HaWPtzGJZjGI5DPTC0ZHbGT1//Lmt4lMXKuFERjkNVPTl/y/qF69fMDAn0sVhZF3UmgDFmWK7DbAuW+SyaleEIghiWs1gZlkWeKDfDIouVnTg64dA/VublZotYzxExJ7Y/N2/KcIyxK9bEGFttrMzPa+0zk77bsFyYNwQArFs9ZdcnT6cmhJmtjKuJcQibLUxGSuS+jXkrckcJpIS7Rd31x3H8R4UG+S6cMbLrC907fqGw7teShh6p1qulcrYLOxhgAkKEQVJskDBEdMp2qQ+cKC2rarExrI83nRwfMi4zbnxWvP3Vmg6zrbRKSXa9/wMJ6C2l0pMjhM8xW5iCovqi283KNkNrWwdCyJ6ZiA4PCA/xG5EcMWxIaGKMSKqxqk5deEteVadubNGZzQyAAHE4LNg3LNg3ISY4OT4kPTmcV1XnEFao9HVyjUrT0aDQ6o0WncGi77AaO6x2rwVCQJJEVFhAZIjfY5lxj2fGeRLrI4QLihsKiurkLbp2rckuV4KAcVGypNiQnFHxI4ZGeKLBre0dFwvvllYpG5U6q42F0P7+HB0fJctIiZo4JsFxjEoYKGkMZme6ggCEh/glCORmMFlv3GqSSEh7TIrt7IJBaJAvHPx/KgdbDwdzUASDbRAQg20QEIPNs/b/pXSJ5EpV1+UAAAAASUVORK5CYII="
    },
    netflix: {
      large: "data:image/png;base64,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"
    }
  };
  var _getImage = function (name, kind) {
    var image = _images[name];
    if(image) {
      return image[kind];
    }
    else {
      return '';
    }
  };

  return {
    getImage: _getImage
  };
})();

var IntroTutorialUtils = IntroTutorialUtils || (function() {
  function _setIFramePosition(iframeDiv, data){
    try {
      var tutorialData = {};
      if(data) {
        tutorialData = data['tutorialStatus'] || data['tutorialData'];
      } else {
        //this case should happen when we come from the event handler for resize or scroll
        iframeDiv = document.getElementsByClassName('lpiframeoverlay')[0];
        tutorialData.domain = document.domain;
      }

      if(document.URL.toLowerCase().includes(tutorialData.domain)){
        var targetEl;
        if (tutorialData.domain.includes('google.com')){
          targetEl = document.getElementById('Email');
          if (targetEl.className.includes('hidden')){
            targetEl = document.getElementById('Passwd');
          }
        } else if (tutorialData.domain.includes('amazon.com')){
          targetEl = document.getElementById('ap_email');
        } else if (tutorialData.domain.includes('facebook.com')){
          if (document.getElementById('email')){
            targetEl = document.getElementById('email');
          } else {
            targetEl = document.getElementById('pass');
          }

        } else if (tutorialData.domain.includes('netflix.com')){
          targetEl = document.getElementsByName('email')[0];
          if (targetEl.type.includes('hidden')){
            targetEl = document.getElementsByName('password')[0];
          }
        }
        iframeDiv.style.top = targetEl.getBoundingClientRect().top - 45 + 'px';
        iframeDiv.style.left = targetEl.getBoundingClientRect().left - 390 + 'px';
      }
    } catch(ex) {
      console.log("Error in setIFramePosition: " + ex.message);
    }
  }
  function _introTutorialHelpDialogConfig(data, doc) {
    var docURL = doc.URL.toLowerCase();
    if(docURL.includes(data['tutorialStatus'].domain)) {
      if(docURL.includes('amazon.com/gp/yourstore/home')) { //patch to fis 'SaveSite' for amazon
        document.location = 'https://www.amazon.com/ap/cnep?_encoding=UTF8&openid.assoc_handle=usflex';
      }
      if( docURL.includes('netflix.com/login') ||
          docURL.includes('facebook.com/login.php') ||
          docURL.includes('facebook.com/?stype=lo') ||
          docURL.includes('accounts.google.com/servicelogin') ||
          docURL.includes('accounts.google.com/addsession') ||
          docURL.includes('amazon.com/ap/signin')
        ) {
        set_tutorial_login_status_false();
        data['do_tutorial'] = true;
        data['iframe_size'] = 'dialog';
        lpshownotification('add', data);
      }
      else {
        set_tutorial_login_status_false();
        if(data['tutorialStatus'].firstLogin &&
          docURL.includes('facebook')) {
          data['do_interstitial'] = true;
          data['iframe_size'] = 'full';
          lpshownotification('add', data);
          //SUPER DUPER FRAGILE
          document.getElementsByClassName('_5lxs')[0].click();
          setTimeout(function(){
            document.getElementsByClassName('_w0d')[0].submit();
          }, 2000);
        }
        if(data['tutorialStatus'].firstLogin &&
          (docURL.includes('https://www.netflix.com/logout') ||
           docURL.includes('https://www.netflix.com/SignOut'))) {
          document.location = 'https://www.netflix.com/Login';
        }
      }
    }
  }
  function _showTryAgain(data, urlextra) {
    if(data['tutorialData'] &&
      document.URL.includes(data['tutorialData'].domain) &&
      data['notificationdata'].includes(data['tutorialData'].domain)) {

      urlextra += '&hideoverlay=1';

      if(data['cmd'] === 'showaddnotification'){
        docURL = document.URL.toLowerCase();

        if(docURL.includes('facebook.com/login')
          || docURL.includes('netflix.com/login')
          || docURL.includes('amazon.com/ap/signin')
          || docURL.includes('accounts.google.com/signin/challenge/sl/password')
          || docURL.includes('accounts.google.com/serviceloginauth')
          || docURL.includes('accounts.google.com/addsession#password')){

          urlextra += '&showtryagain=1';
          data['iframe_size'] = 'dialog';
        }
        else {
          data['iframe_size'] = 'full';
          urlextra += '&showadddialog=1';
        }
      }

    }
    return urlextra;
  }
  return {
    setIFramePosition: _setIFramePosition,
    introTutorialHelpDialogConfig: _introTutorialHelpDialogConfig,
    showTryAgain: _showTryAgain
  };
})();

var IntroTutorialImprove = IntroTutorialImprove || (function() {
    function _improveLP(event, action) {
      if (bg.g_prompts['improve'] && event && action) {
        bg.lpMakeRequest(bg.base_url + 'lastpass/api.php?cmd=lpimprove&event=' + event + '&action=' + action, null, false, function() {}, null);
      }
    }
    return {
      improveLP: _improveLP
    };
  })();

var IntroTutorialHelpDialog = IntroTutorialHelpDialog || function() {

};

(function() {
  'use strict';
  IntroTutorialHelpDialog.prototype._dialog = null;
  IntroTutorialHelpDialog.prototype._options = {
    makeShade: false,
    alignBottom: false,
    addHide: false,
    transparentBG: false,
    textChoice: ''
  };

  IntroTutorialHelpDialog.prototype.setBackgroundTransparent = function (_document, transparentBG) {
    if(_document && transparentBG) {
      document.body.style.background = 'transparent';
    }
  };
  IntroTutorialHelpDialog.prototype.getTranslateFn = function() {
    if(typeof(bg) != 'undefined' && typeof(bg.gs) == 'function') {
      return bg.gs;
    }
    else if(typeof(gs) == 'function') {
      return gs;
    }
    else {
      return null;
    }
  };
  IntroTutorialHelpDialog.prototype.setArrow = function (_document, arrow) {
    var dialog = IntroTutorialHelpDialog.prototype._dialog;
    if(_document && dialog && arrow){
      dialog.className += ' arrow_box';
      switch(arrow.orientation) {
        case 'top':
          dialog.className += ' a-top';
          break;
        case 'bottom':
          dialog.className += ' a-bottom';
          break;
        case 'left':
          dialog.className += ' a-left';
          break;
        case 'right':
          dialog.className += ' a-right';
          break;
      }
      switch(arrow.position) {
        case 'left':
          dialog.className += ' a-h-left';
          break;
        case 'center':
          dialog.className += ' a-h-center';
          break;
        case 'right':
          dialog.className += ' a-h-right';
          break;
        case 'high':
          dialog.className += ' a-v-high';
          break;
        case 'middle':
          dialog.className += ' a-v-middle';
          break;
        case 'low':
          dialog.className += ' a-v-low';
          break;
      }
    }
  };
  IntroTutorialHelpDialog.prototype.createDialog = function (_document, textChoice) {
    var translateFn = IntroTutorialHelpDialog.prototype.getTranslateFn();

    if (_document && translateFn) {
      var dialog = _document.createElement('div');
      dialog.className = 'tutorialDialog';
      var textDiv = _document.createElement('div');
      textDiv.className = 'dialogTextDiv';
      var text1 = _document.createElement('p');
      text1.className = 'topText';
      var text2 = _document.createElement('p');
      text2.className = 'bottomText';
      switch (textChoice) {
        case 'saveSite':
          text1.innerHTML = translateFn('Easy, right?');
          text2.innerHTML = translateFn('Now just save it to your vault.');
          break;
        case 'siteLanding':
          text1.innerHTML = translateFn('Good choice!');
          text2.innerHTML = translateFn('Next, sign in to your account.');
          break;
        case 'tryAgain':
          text1.innerHTML = translateFn('Login failed');
          text2.innerHTML = translateFn('Please try again.');
          break;
        case 'finishSaveSite':
          text1.innerHTML = translateFn('Customize and Save');
          text2.innerHTML = translateFn('You can set these details for each site');
          break;
        case 'downloadImporter':
          text1.innerHTML = translateFn('The LastPass Importer is downloading');
          text2.innerHTML = translateFn("When it's done, just run it!");
          setTimeout(function() {dialog.remove(_document);}, 15000);
          break;
        case 'interstitial':
          text1.innerHTML = translateFn('Just a second...');
          text2.innerHTML = translateFn('Logging you out');
          dialog.style.margin = '15px auto 0px auto';
          break;
      }
      textDiv.appendChild(text1);
      textDiv.appendChild(text2);
      dialog.appendChild(textDiv);

      return dialog;
    }
    else return null;
  };
  IntroTutorialHelpDialog.prototype.setAlignment = function (alignBottom) {
    var dialog = IntroTutorialHelpDialog.prototype._dialog;
    if (dialog && alignBottom) {
      dialog.className += ' downloadDialog';
    }
  };
  IntroTutorialHelpDialog.prototype.setFooter = function (_document, addHide) {
    var translateFn = IntroTutorialHelpDialog.prototype.getTranslateFn();
    var dialog = IntroTutorialHelpDialog.prototype._dialog;
    if(_document && dialog){
      var footerDiv = _document.createElement('div');
      footerDiv.className = 'footerDiv';
      var lpLogo = _document.createElement('img');
      lpLogo.className = 'dialogLPLogo';
      lpLogo.src = 'images/vault_4.0/LastPass_Color_Small.png';
      footerDiv.appendChild(lpLogo);
      if (addHide) {
        var hideDiv = _document.createElement('div');
        hideDiv.className = 'hideDiv';
        var hideP = _document.createElement('p');
        hideP.className = 'hideP';
        hideP.innerHTML = translateFn('Hide');
        hideDiv.addEventListener('click', function() {
          IntroTutorialHelpDialog.prototype.remove(_document);
        });
        hideDiv.appendChild(hideP);
        footerDiv.appendChild(hideDiv);
      }
      dialog.appendChild(footerDiv);
    }
  };
  IntroTutorialHelpDialog.prototype.setShade = function (_document, makeShade, textChoice) {
    if (_document && makeShade) {
      var shade = _document.createElement('div');
      if (textChoice === 'interstitial'){
        shade.className = 'interstitialShade';
      } else {
        shade.className = 'shade';
      }
      _document.body.appendChild(shade);
    }
  };
  IntroTutorialHelpDialog.prototype.setPosition = function(position) {
    try {
      var dialog = IntroTutorialHelpDialog.prototype._dialog;

      if (dialog && position && position.positionFn && typeof(position.positionFn) == 'function') {
        var pos = position.positionFn();
        if (pos && pos.top && pos.left) {
          pos.top += (position.offset && position.offset.top) ? position.offset.top : 0;
          pos.left += (position.offset && position.offset.left) ? position.offset.left : 0;

          dialog.style.position = 'absolute';
          dialog.style.top = pos.top + 'px';
          dialog.style.left = pos.left + 'px';
        }
      }
    }
    catch (ex) {
      console.log("Error in IntroTutorialHelpDialog.setPosition: " + ex.message);
    }
  };

  //Window resize events
  IntroTutorialHelpDialog.prototype.subscribeToWindowResize = function() {
    if (window) {
      window.addEventListener("resize", IntroTutorialHelpDialog.prototype.windowResizeHandler);
      if(typeof(Topics) != "undefined"){
        Topics.get(Topics.DIALOG_RESIZE).subscribe(function(event) {
          IntroTutorialHelpDialog.prototype.windowResizeHandler();
        });
      }
    }
  };
  IntroTutorialHelpDialog.prototype.unSubscribeToWindowResize = function() {
    if (window && IntroTutorialHelpDialog.prototype.windowResizeHandler) {
      if (window.removeEventListener) {                   // For all major browsers, except IE 8 and earlier
        window.removeEventListener("resize", IntroTutorialHelpDialog.prototype.windowResizeHandler);
      } else if (window.detachEvent) {                    // For IE 8 and earlier versions
        window.detachEvent("resize", IntroTutorialHelpDialog.prototype.windowResizeHandler);
      }
      IntroTutorialHelpDialog.prototype.windowResizeHandler = null;
    }
  };
  IntroTutorialHelpDialog.prototype.windowResizeHandler = function(eventObject) {
    IntroTutorialHelpDialog.prototype.setPosition(IntroTutorialHelpDialog.prototype._options.position);
  };

  IntroTutorialHelpDialog.prototype.initialize = function(_document, _options) {
    try {
      IntroTutorialHelpDialog.prototype._options = _options || IntroTutorialHelpDialog.prototype._options;
      IntroTutorialHelpDialog.prototype.setBackgroundTransparent(_document, _options.transparentBG);
      IntroTutorialHelpDialog.prototype._dialog = IntroTutorialHelpDialog.prototype.createDialog(_document, _options.textChoice);
      IntroTutorialHelpDialog.prototype.setFooter(_document, _options.addHide);
      IntroTutorialHelpDialog.prototype.setArrow(_document, _options.arrow);
      IntroTutorialHelpDialog.prototype.setAlignment(_options.alignBottom);

      if(_options.position) {
        IntroTutorialHelpDialog.prototype.setPosition(_options.position);
        IntroTutorialHelpDialog.prototype.subscribeToWindowResize();
      }
      else {
        IntroTutorialHelpDialog.prototype.unSubscribeToWindowResize();
      }

      var mainElement = _document.getElementById(_options.appendElementId);
      if(mainElement) {
        mainElement.appendChild(IntroTutorialHelpDialog.prototype._dialog);
      }
      else {
        _document.body.appendChild(IntroTutorialHelpDialog.prototype._dialog);
      }
      IntroTutorialHelpDialog.prototype.setShade(_document, _options.makeShade, _options.textChoice);
    }
    catch (ex) {
      console.log("Error in IntroTutorialHelpDialog.initialize: " + ex.message);
    }
  };
  IntroTutorialHelpDialog.prototype.remove = function(_document) {

    IntroTutorialHelpDialog.prototype.unSubscribeToWindowResize();
    _document.getElementsByClassName('tutorialDialog')[0].remove();
    if (_document.getElementsByClassName('shade')[0]){
      _document.getElementsByClassName('shade')[0].remove();
      window.top.postMessage('minimizeIframe', '*');
    }
  };
})();
