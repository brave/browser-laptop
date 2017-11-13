/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const session = electron.session
const appActions = require('../js/actions/appActions')

module.exports.init = () => {
  process.on('personal-data-changed', (profileGuids, creditCardGuids) => {
    appActions.autofillDataChanged(profileGuids, creditCardGuids)
  })
}

module.exports.addAutofillAddress = (detail) => {
  session.defaultSession.autofill.addProfile({
    full_name: detail.get('name'),
    company_name: detail.get('organization'),
    street_address: detail.get('streetAddress'),
    city: detail.get('city'),
    state: detail.get('state'),
    postal_code: detail.get('postalCode'),
    country_code: detail.get('country'),
    phone: detail.get('phone'),
    email: detail.get('email'),
    guid: detail.get('guid')
  })
}

module.exports.removeAutofillAddress = (guid) => {
  session.defaultSession.autofill.removeProfile(guid)
}

module.exports.addAutofillCreditCard = (detail) => {
  session.defaultSession.autofill.addCreditCard({
    name: detail.get('name'),
    card_number: detail.get('card'),
    expiration_month: detail.get('month'),
    expiration_year: detail.get('year'),
    guid: detail.get('guid')
  })
}

module.exports.removeAutofillCreditCard = (guid) => {
  session.defaultSession.autofill.removeCreditCard(guid)
}

module.exports.clearAutocompleteData = () => {
  session.defaultSession.autofill.clearAutocompleteData()
}

module.exports.clearAutofillData = () => {
  session.defaultSession.autofill.clearAutofillData()
}

module.exports.addLogin = (form) => {
  session.defaultSession.autofill.addLogin(form)
}

module.exports.updateLogin = (form) => {
  session.defaultSession.autofill.updateLogin(form)
}

module.exports.removeLogin = (form) => {
  session.defaultSession.autofill.removeLogin(form)
}

module.exports.clearLogins = (form) => {
  session.defaultSession.autofill.clearLogins(form)
}

module.exports.getAutofillableLogins = (cb) => {
  session.defaultSession.autofill.getAutofillableLogins((result) => {
    cb(result)
  })
}

module.exports.getBlackedlistLogins = (cb) => {
  session.defaultSession.autofill.getBlackedlistLogins((result) => {
    cb(result)
  })
}
