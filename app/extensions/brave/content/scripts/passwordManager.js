/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if (chrome.contentSettings.passwordManager == 'allow') {
  let credentials = {}
  function savePassword (username/*: ?string*/, pw/*: string*/, origin/*: string*/, action/*: string*/) {
    chrome.ipcRenderer.send('save-password', username, pw, origin, action)
  }

  let submittedForms = []
  function onFormSubmit (form/*: HTMLFormElement*/, formOrigin/*: string*/) {
    if (submittedForms.includes(form)) {
      return
    }
    var fields = getFormFields(form, true)
    var passwordElem = fields[1]
    if (!passwordElem || !passwordElem.value) {
      return
    }
    // Re-get action in case it has changed
    var action = form.action || document.location.href
    var usernameElem = fields[0] || {}
    savePassword(usernameElem.value, passwordElem.value, formOrigin, normalizeURL(action))
    submittedForms.push(form)
  }

  /**
   * Try to autofill a form with credentials, using roughly the heuristic from
   * http://mxr.mozilla.org/firefox/source/toolkit/components/passwordmgr/src/nsLoginManager.js
   * @param {string} formOrigin - origin of the form
   * @param {Element} form - the form node
   */
  function tryAutofillForm (formOrigin, form) {
    var fields = getFormFields(form, false)
    var action = form.action || document.location.href
    action = normalizeURL(action)
    var usernameElem = fields[0]
    var passwordElem = fields[1]

    if (!passwordElem) {
      return
    }

    if (Array.isArray(credentials[action])) {
      let isDuplicate = false
      credentials[action].forEach((elems) => {
        if (isDuplicate === true) {
          return
        } else if (elems[0] === passwordElem && elems[1] === usernameElem) {
          isDuplicate = true
        }
      })
      if (isDuplicate === false) {
        credentials[action].push([passwordElem, usernameElem])
      } else {
        return
      }
    } else {
      credentials[action] = [[passwordElem, usernameElem]]
    }

    // Fill the password immediately if there's only one or if the username
    // is already autofilled
    chrome.ipcRenderer.send('get-passwords', formOrigin, action)

    if (usernameElem) {
      usernameElem.addEventListener('keyup', (e) => {
        if (!usernameElem || !(e instanceof KeyboardEvent)) {
          return
        }
        switch (e.keyCode) {
          case KeyEvent.DOM_VK_ESCAPE:
            e.preventDefault()
            e.stopPropagation()
            chrome.ipcRenderer.send('hide-context-menu')
            break
          default:
            let rect = usernameElem.getBoundingClientRect()
            chrome.ipcRenderer.send('show-username-list', formOrigin, action, {
              bottom: rect.bottom,
              left: rect.left,
              width: rect.width
            }, usernameElem.value || '')
        }
      })
    }

    // Whenever a form is submitted, offer to save it in the password manager
    // if the credentials have changed.
    form.addEventListener('submit', (e) => {
      if (usernameElem) {
        usernameElem.blur()
        chrome.ipcRenderer.send('hide-context-menu')
      }
      onFormSubmit(form, formOrigin)
    })
    Array.from(form.querySelectorAll('button')).forEach((button) => {
      button.addEventListener('click', (e) => {
        onFormSubmit(form, formOrigin)
      })
    })
  }

  /**
   * Gets protocol + host + path from a URL.
   * @return {string}
   */
  function normalizeURL (url) {
    if (typeof url !== 'string') {
      return ''
    }
    var a = document.createElement('a')
    a.href = url
    return [a.protocol, a.host].join('//') + a.pathname
  }

  /**
   * @return {boolean}
   */
  function autofillPasswordListener () {
    // Don't autofill on non-HTTP(S) sites for now
    if (document.location.protocol !== 'http:' && document.location.protocol !== 'https:') {
      return
    }

    if (document.querySelectorAll('input[type=password]').length === 0) {
      // No password fields;
      return
    }

    // Map of action origin to [[password element, username element]]
    var formOrigin = [document.location.protocol, document.location.host].join('//')
    var formNodes = document.querySelectorAll('form')

    Array.from(formNodes).forEach((form) => {
      tryAutofillForm(formOrigin, form)
    })

    chrome.ipcRenderer.on('got-password', (e, username, password, origin, action, isUnique) => {
      var elems = credentials[action]
      if (formOrigin === origin && elems) {
        elems.forEach((elem) => {
          if (isUnique) {
            // Autofill password if there is only one available
            elem[0].value = password
            if (username && elem[1]) {
              // Autofill the username if needed
              elem[1].value = username
            }
          } else if (elem[1] && username && username === elem[1].value) {
            // If the username is already autofilled by something else, fill
            // in the corresponding password
            elem[0].value = password
          }
        })
      }
    })
  }

  /**
   * Gets form fields.
   * @param {Element} form - The form to inspect
   * @param {boolean} isSubmission - Whether the form is being submitted
   * @return {Array.<Element>}
   */
  function getFormFields (form/*: HTMLFormElement */, isSubmission/*: boolean*/)/*: Array<?HTMLInputElement>*/ {
    var passwords = getPasswordFields(form, isSubmission)

    // We have no idea what is going on with a form that has 0 or >3 password fields
    if (passwords.length === 0 || passwords.length > 3) {
      return [null, null, null]
    }

    // look for any form field that has username-ish attributes
    var username = form.querySelector('input[type=email i]') ||
        form.querySelector('input[autocomplete=email i]') ||
        form.querySelector('input[autocomplete=username i]') ||
        form.querySelector('input[name=email i]') ||
        form.querySelector('input[name=username i]') ||
        form.querySelector('input[name=user i]') ||
        form.querySelector('input[name="session[username_or_email]"]')

    if (!username) {
      // Search backwards from first password field to find the username field
      let previousSibling = passwords[0].previousSibling
      while (previousSibling) {
        if ((previousSibling instanceof HTMLElement)) {
          if (previousSibling.getAttribute('type') === 'text') {
            username = previousSibling
            break
          }
        }
        previousSibling = previousSibling.previousSibling
      }
    }

    // Last resort: find the first text input in the form
    username = username || form.querySelector('input[type=text i]')

    // If not a submission, autofill the first password field and ignore the rest
    if (!isSubmission || passwords.length === 1) {
      return [username instanceof HTMLInputElement ? username : null, passwords[0], null]
    }

    // Otherwise, this is probably a password change form and we need to figure out
    // what username/password combo to save.
    var oldPassword = null
    var newPassword = null
    var value1 = passwords[0] ? passwords[0].value : ''
    var value2 = passwords[1] ? passwords[1].value : ''
    var value3 = passwords[2] ? passwords[2].value : ''

    if (passwords.length === 2) {
      if (value1 === value2) {
        // Treat as if there were 1 pw field
        newPassword = passwords[0]
      } else {
        oldPassword = passwords[0]
        newPassword = passwords[1]
      }
    } else {
      // There is probably a "confirm your password" field for the new
      // password, so the new password is the one that is repeated.
      if (value1 === value2 && value2 === value3) {
        // Treat as if there were 1 pw field
        newPassword = passwords[0]
      } else if (value1 === value2) {
        newPassword = passwords[0]
        oldPassword = passwords[2]
      } else if (value2 === value3) {
        newPassword = passwords[2]
        oldPassword = passwords[0]
      } else if (value1 === value3) {
        // Weird
        newPassword = passwords[0]
        oldPassword = passwords[1]
      }
    }
    return [username instanceof HTMLInputElement ? username : null, newPassword, oldPassword]
  }

  /**
   * Gets password fields in a form.
   * @param {Element} form - The form to inspect
   * @param {boolean} isSubmission - Whether the form is being submitted
   * @return {Array.<Element>|null}
   */
  function getPasswordFields (form, isSubmission) {
    var currentPassword = form.querySelector('input[autocomplete=current-password i]')
    var newPassword = form.querySelector('input[autocomplete=new-password i]')
    if (currentPassword instanceof HTMLInputElement) {
      if (!newPassword) {
        // This probably isn't a password change form; ex: twitter login
        return [currentPassword]
      } else if (newPassword instanceof HTMLInputElement){
        return [currentPassword, newPassword]
      }
    }
    var passwordNodes = Array.from(form.querySelectorAll('input[type=password]'))
    // Skip nodes that are invisible
    passwordNodes = passwordNodes.filter((e) => {
      return (e instanceof HTMLInputElement && e.clientHeight > 0 && e.clientWidth > 0)
    })
    if (isSubmission) {
      // Skip empty fields
      passwordNodes = passwordNodes.filter((e) => { return (e instanceof HTMLInputElement && e.value) })
    }
    return passwordNodes
  }

  autofillPasswordListener()
  let interval = setInterval(autofillPasswordListener, 3000)
  document.addEventListener('visibilitychange', () => {
    clearInterval(interval)
    if (document.visibilityState !== 'hidden') {
      interval = setInterval(autofillPasswordListener, 3000)
    }
  })
}

