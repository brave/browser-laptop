/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */
const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../../lib/fakeElectron')
const fakeSettings = require('../../../../../lib/fakeSettings')
let LedgerTable
require('../../../../../braveUnit')

const fivePublishers = {
  siteSettings: Immutable.Map([
    [
      'https?://times.com',
      Immutable.Map({
        ledgerPayments: true
      })
    ],
    [
      'https?://cnn.com',
      Immutable.Map({
        ledgerPayments: true
      })
    ],
    [
      'https?://brianbondy.com',
      Immutable.Map({
        ledgerPayments: true
      })
    ],
    [
      'https?://github.com',
      Immutable.Map({
        ledgerPayments: true
      })
    ],
    [
      'https?://clifton.io',
      Immutable.Map({
        ledgerPayments: true
      })
    ]
  ]),
  synopsis: Immutable.List([
    Immutable.Map({
      publisherKey: 'times.com',
      siteName: 'times.com',
      verified: false,
      views: 2,
      pinPercentage: 10,
      percentage: 10,
      secondsSpent: 60,
      minutesSpent: 0,
      hoursSpent: 0,
      daysSpent: 0,
      score: 3.6513249998816057,
      publisherURL: 'http://times.com',
      duration: 59963,
      faviconURL: ''
    }),
    Immutable.Map({
      publisherKey: 'cnn.com',
      siteName: 'cnn.com',
      verified: false,
      views: 1,
      pinPercentage: 15,
      percentage: 15,
      secondsSpent: 52,
      minutesSpent: 0,
      hoursSpent: 0,
      daysSpent: 0,
      score: 3.468416104362607,
      publisherURL: 'http://cnn.com',
      duration: 52143,
      faviconURL: ''
    }),
    Immutable.Map({
      publisherKey: 'brianbondy.com',
      siteName: 'brianbondy.com',
      verified: true,
      views: 1,
      pinPercentage: 0,
      percentage: 34,
      secondsSpent: 38,
      minutesSpent: 0,
      hoursSpent: 0,
      daysSpent: 0,
      score: 2.290627169652012,
      publisherURL: 'https://brianbondy.com',
      duration: 37688,
      faviconURL: ''
    }),
    Immutable.Map({
      publisherKey: 'github.com',
      siteName: 'github.com',
      verified: false,
      views: 1,
      pinPercentage: 0,
      percentage: 22,
      secondsSpent: 18,
      minutesSpent: 0,
      hoursSpent: 0,
      daysSpent: 0,
      score: 1.4855477833585369,
      publisherURL: 'https://github.com',
      duration: 18462,
      faviconURL: ''
    }),
    Immutable.Map({
      publisherKey: 'clifton.io',
      siteName: 'clifton.io',
      verified: false,
      views: 1,
      pinPercentage: 0,
      percentage: 19,
      secondsSpent: 15,
      minutesSpent: 0,
      hoursSpent: 0,
      daysSpent: 0,
      score: 1.3011662888251045,
      publisherURL: 'https://clifton.io',
      duration: 14971,
      faviconURL: ''
    })
  ])
}

describe('LedgerTable component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/settings', fakeSettings)
    fakeSettings.mockReturnValue = false
    window.chrome = fakeElectron
    mockery.registerMock('../../../../extensions/brave/img/ledger/verified_green_icon.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/verified_white_icon.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/icon_remove.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/icon_pin.svg')
    LedgerTable = require('../../../../../../../app/renderer/components/preferences/payment/ledgerTable')
  })

  after(function () {
    mockery.disable()
  })

  it('only non pinned tabs', function () {
    const siteSettings = Immutable.Map([
      [
        'https?://times.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ]
    ])

    const synopsis = Immutable.List([
      Immutable.Map({
        publisherKey: 'times.com',
        siteName: 'times.com',
        verified: false,
        views: 2,
        pinPercentage: 0,
        secondsSpent: 60,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.6513249998816057,
        publisherURL: 'http://times.com',
        duration: 59963,
        faviconURL: ''
      })
    ])

    const wrapper = mount(
      <LedgerTable
        ledgerData={Immutable.Map({synopsis: synopsis})}
        settings={Immutable.Map()}
        onChangeSetting={function () {}}
        siteSettings={siteSettings}
      />
    )
    assert.equal(wrapper.find('[data-tbody-index="0"] [data-test-id="siteName"]').length, 0, '0 pinned')
    assert.equal(wrapper.find('[data-tbody-index="1"] [data-test-id="siteName"]').length, 1, '1 unpinned')
  })

  it('two pinned tabs, 1 unpinned tab (show all button is not necessary', function () {
    const siteSettings = Immutable.Map([
      [
        'https?://times.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ],
      [
        'https?://cnn.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ],
      [
        'https?://brianbondy.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ]
    ])

    const synopsis = Immutable.List([
      Immutable.Map({
        publisherKey: 'times.com',
        siteName: 'times.com',
        verified: false,
        views: 2,
        pinPercentage: 10,
        percentage: 10,
        secondsSpent: 60,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.6513249998816057,
        publisherURL: 'http://times.com',
        duration: 59963,
        faviconURL: ''
      }),
      Immutable.Map({
        publisherKey: 'cnn.com',
        siteName: 'cnn.com',
        verified: false,
        views: 1,
        pinPercentage: 15,
        percentage: 15,
        secondsSpent: 52,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.468416104362607,
        publisherURL: 'http://cnn.com',
        duration: 52143,
        faviconURL: ''
      }),
      Immutable.Map({
        publisherKey: 'brianbondy.com',
        siteName: 'brianbondy.com',
        verified: true,
        views: 1,
        pinPercentage: 0,
        percentage: 34,
        secondsSpent: 38,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 2.290627169652012,
        publisherURL: 'https://brianbondy.com',
        duration: 37688,
        faviconURL: ''
      })
    ])

    const wrapper = mount(
      <LedgerTable
        ledgerData={Immutable.Map({synopsis: synopsis})}
        settings={Immutable.Map()}
        onChangeSetting={function () {}}
        siteSettings={siteSettings}
      />
    )
    assert.equal(wrapper.find('[data-tbody-index="0"] [data-test-id="siteName"]').length, 2, '2 pinned')
    assert.equal(wrapper.find('[data-tbody-index="1"] [data-test-id="siteName"]').length, 1, '1 unpinned')
    assert.equal(wrapper.find('[data-test-id="showAll"]').length, 0, 'show all button hidden')
  })

  it('two pinned tabs, no un pinned (there shouldn\'t be any show all button', function () {
    const siteSettings = Immutable.Map([
      [
        'https?://times.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ],
      [
        'https?://cnn.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ]
    ])

    const synopsis = Immutable.List([
      Immutable.Map({
        publisherKey: 'times.com',
        siteName: 'times.com',
        verified: false,
        views: 2,
        pinPercentage: 10,
        percentage: 10,
        secondsSpent: 60,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.6513249998816057,
        publisherURL: 'http://times.com',
        duration: 59963,
        faviconURL: ''
      }),
      Immutable.Map({
        publisherKey: 'cnn.com',
        siteName: 'cnn.com',
        verified: false,
        views: 1,
        pinPercentage: 15,
        percentage: 15,
        secondsSpent: 52,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.468416104362607,
        publisherURL: 'http://cnn.com',
        duration: 52143,
        faviconURL: ''
      })
    ])

    const wrapper = mount(
      <LedgerTable
        ledgerData={Immutable.Map({synopsis: synopsis})}
        settings={Immutable.Map()}
        onChangeSetting={function () {}}
        siteSettings={siteSettings}
      />
    )
    assert.equal(wrapper.find('[data-tbody-index="0"] [data-test-id="siteName"]').length, 2, '2 pinned')
    assert.equal(wrapper.find('[data-tbody-index="1"] [data-test-id="siteName"]').length, 0, '0 unpinned')
    assert.equal(wrapper.find('[data-test-id="showAll"]').length, 0, 'show all button hidden')
  })

  it('pinned tabs should have exclude disabled', function () {
    const siteSettings = Immutable.Map([
      [
        'https?://times.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ]
    ])

    const synopsis = Immutable.List([
      Immutable.Map({
        publisherKey: 'times.com',
        siteName: 'times.com',
        verified: false,
        views: 2,
        pinPercentage: 42,
        percentage: 42,
        secondsSpent: 60,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.6513249998816057,
        publisherURL: 'http://times.com',
        duration: 59963,
        faviconURL: ''
      })
    ])

    const wrapper = mount(
      <LedgerTable
        ledgerData={Immutable.Map({synopsis: synopsis})}
        settings={Immutable.Map()}
        onChangeSetting={function () {}}
        siteSettings={siteSettings}
      />
    )
    assert.equal(wrapper.find('[data-tbody-index="0"] [data-td-index="2"] [data-test-id="pinnedDisabled"]').length, 1, 'exclude disabled')
  })

  it('two pinned tabs (1 banned), 3 unpinned (1 banned)', function () {
    const siteSettings = Immutable.Map([
      [
        'https?://times.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ],
      [
        'https?://cnn.com',
        Immutable.Map({
          ledgerPayments: true,
          ledgerPaymentsShown: false
        })
      ],
      [
        'https?://brianbondy.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ],
      [
        'https?://github.com',
        Immutable.Map({
          ledgerPayments: true
        })
      ],
      [
        'https?://clifton.io',
        Immutable.Map({
          ledgerPayments: true,
          ledgerPaymentsShown: false
        })
      ]
    ])

    const synopsis = Immutable.List([
      Immutable.Map({
        siteName: 'times.com',
        publisherKey: 'times.com',
        verified: false,
        views: 2,
        pinPercentage: 10,
        percentage: 10,
        secondsSpent: 60,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.6513249998816057,
        publisherURL: 'http://times.com',
        duration: 59963,
        faviconURL: ''
      }),
      Immutable.Map({
        siteName: 'cnn.com',
        publisherKey: 'cnn.com',
        verified: false,
        views: 1,
        pinPercentage: 15,
        percentage: 15,
        secondsSpent: 52,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 3.468416104362607,
        publisherURL: 'http://cnn.com',
        duration: 52143,
        faviconURL: ''
      }),
      Immutable.Map({
        siteName: 'brianbondy.com',
        publisherKey: 'brianbondy.com',
        verified: true,
        views: 1,
        pinPercentage: 0,
        percentage: 34,
        secondsSpent: 38,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 2.290627169652012,
        publisherURL: 'https://brianbondy.com',
        duration: 37688,
        faviconURL: ''
      }),
      Immutable.Map({
        siteName: 'github.com',
        publisherKey: 'github.com',
        verified: false,
        views: 1,
        pinPercentage: 0,
        percentage: 22,
        secondsSpent: 18,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 1.4855477833585369,
        publisherURL: 'https://github.com',
        duration: 18462,
        faviconURL: ''
      }),
      Immutable.Map({
        siteName: 'clifton.io',
        publisherKey: 'clifton.io',
        verified: false,
        views: 1,
        pinPercentage: 0,
        percentage: 19,
        secondsSpent: 15,
        minutesSpent: 0,
        hoursSpent: 0,
        daysSpent: 0,
        score: 1.3011662888251045,
        publisherURL: 'https://clifton.io',
        duration: 14971,
        faviconURL: ''
      })
    ])

    const wrapper = mount(
      <LedgerTable
        ledgerData={Immutable.Map({synopsis: synopsis})}
        settings={Immutable.Map()}
        onChangeSetting={function () {}}
        siteSettings={siteSettings}
      />
    )
    assert.equal(wrapper.find('[data-tbody-index="0"] [data-test-id="siteName"]').length, 1, '1 pinned')
    assert.equal(wrapper.find('[data-tbody-index="1"] [data-test-id="siteName"]').length, 2, '2 unpinned')
  })

  it('8 pinned tabs, 12 unpinned (show all button, 2 hidden unpinned)', function () {
    const siteSettings = fivePublishers.siteSettings
      .concat(fivePublishers.siteSettings)
      .concat(fivePublishers.siteSettings)
      .concat(fivePublishers.siteSettings)

    const synopsis = fivePublishers.synopsis
      .concat(fivePublishers.synopsis)
      .concat(fivePublishers.synopsis)
      .concat(fivePublishers.synopsis)

    const wrapper = mount(
      <LedgerTable
        ledgerData={Immutable.Map({synopsis: synopsis})}
        settings={Immutable.Map()}
        onChangeSetting={function () {}}
        siteSettings={siteSettings}
      />
    )
    assert.equal(wrapper.find('[data-tbody-index="0"] [data-test-id="siteName"]').length, 8, '8 pinned')
    assert.equal(wrapper.find('[data-tbody-index="1"] [data-test-id="siteName"]').length, 10, '10 unpinned, 2 hidden')
    assert.equal(wrapper.find('[data-test-id="showAll"]').length, 1, 'show all button visible')
  })
})
