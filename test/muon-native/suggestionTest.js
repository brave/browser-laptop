// lazy load requires for dual use in and outside muon
const suggestion = () => require('../../app/common/lib/suggestion')

module.exports = {
  suggestionSimpleCheck: (test) => {
    test.deepEqual(suggestion().isSimpleDomainNameValue('http://test.com') &&
      suggestion().isSimpleDomainNameValue('http://test.com/') &&
      suggestion().isSimpleDomainNameValue('http://test.com#') &&
      !suggestion().isSimpleDomainNameValue('http://test.com/test'),
    true)
  }
}
