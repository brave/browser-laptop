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

module.exports.addAutofillAddress = (detail, guid) => {
  session.defaultSession.autofill.addProfile({
    full_name: detail.name,
    company_name: detail.organization,
    street_address: detail.streetAddress,
    city: detail.city,
    state: detail.state,
    postal_code: detail.postalCode,
    country_code: detail.country,
    phone: detail.phone,
    email: detail.email,
    guid: guid
  })
}

module.exports.removeAutofillAddress = (guid) => {
  session.defaultSession.autofill.removeProfile(guid)
}

module.exports.addAutofillCreditCard = (detail, guid) => {
  session.defaultSession.autofill.addCreditCard({
    name: detail.name,
    card_number: detail.card,
    expiration_month: detail.month,
    expiration_year: detail.year,
    guid: guid
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
