/* global describe, it, before, after */
const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../lib/fakeElectron')
const settingsConst = require('../../../../js/constants/settings')
const {getHostPattern} = require('../../../../js/lib/urlutil')
let PublisherToggle
require('../../braveUnit')

describe('PublisherToggle component', function () {
  const getUrlOrigin = url => url.split('/').slice(0, 3).join('/')
  const getHostName = url => getUrlOrigin(url).split('/').slice(2).join('/')
  const getPattern = pattern => getHostPattern(getHostName(pattern))

  const locationInfo = (url, exclude, verified) => Immutable.fromJS({
    [url]: {
      'publisher': getHostName(url),
      'exclude': exclude,
      'verified': verified
    }
  })
  const hostPattern = (pattern, isEnabled, shouldShow) => Immutable.fromJS({
    [getPattern(pattern)]: {
      'ledgerPayments': isEnabled,
      'ledgerPaymentsShown': shouldShow
    }
  })
  const publisherSynopsis = (url, verified) => Immutable.fromJS([{
    'site': getHostName(url),
    'publisherURL': url,
    'verified': verified
  }])
  const paymentsEnabled = settingsConst.PAYMENTS_ENABLED
  const autoSuggestSites = settingsConst.AUTO_SUGGEST_SITES
  const url1 = 'https://clifton.io/sharing-my-passion-for-mercedes-benz'
  const aboutPage = 'about:preferences'

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_no.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg')
    mockery.registerMock('../../../../js/settings', { getSetting: (settingKey, settingsCollection, value) => {
      if (settingKey === paymentsEnabled || settingKey === autoSuggestSites) {
        return true
      }
      return false
    }})
    mockery.registerMock('electron', fakeElectron)
    window.chrome = fakeElectron
    PublisherToggle = require('../../../../app/renderer/components/navigation/publisherToggle')
  })
  after(function () {
    mockery.disable()
  })

  describe('default behaviour (when autoSuggest is ON)', function () {
    it('show as enabled if site is on synopsis list (siteSettings is empty)', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={Immutable.Map()}
          siteSettings={Immutable.Map()}
          synopsis={publisherSynopsis(url1, false)} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-authorized'], true)
    })
    it('show as enabled if hostPattern is on siteSettings list (synopsis is empty)', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={Immutable.Map()}
          siteSettings={hostPattern(url1, true, true)}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-authorized'], true)
    })
    it('show as enabled if url exists in locationInfo (both synopsis and siteSettings are empty)', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={locationInfo(url1, false, false)}
          siteSettings={Immutable.Map()}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-authorized'], true)
    })
    it('Show as disabled if publisher is on exclusion list', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={locationInfo(url1, true, false)}
          siteSettings={Immutable.Map()}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-authorized'], false)
    })
    it('Show as verified if publisher is shown as verified on locationInfo list', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={locationInfo(url1, false, true)}
          siteSettings={Immutable.Map()}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-verified'], true)
    })
    it('do not render if about page', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={aboutPage}
          locationInfo={Immutable.Map()}
          siteSettings={Immutable.Map()}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 0)
    })
  })

  describe('user interaction behaviour', function () {
    it('do not render if publisher is permanently hidden', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={locationInfo(url1, false, true)}
          siteSettings={hostPattern(url1, true, false)}
          synopsis={publisherSynopsis(url1, false)} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 0)
    })
    it('show as enabled if ledgerPayments is true for that publisher', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={Immutable.Map()}
          siteSettings={hostPattern(url1, true, true)}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-authorized'], true)
    })
    it('Show as disabled if ledgerPayments is false for that publisher', function () {
      const wrapper = shallow(
        <PublisherToggle
          location={url1}
          locationInfo={locationInfo(url1, false, true)}
          siteSettings={hostPattern(url1, false, true)}
          synopsis={publisherSynopsis(url1, false)} />
      )
      assert.equal(wrapper.props()['data-test-authorized'], false)
    })
  })
})
