const ENS = require('ethereum-ens');
const Web3 = require('web3');
const url = require('url')
const ens = new ENS(new Web3(new Web3.providers.HttpProvider('https://test.bzz.network/geth')));

// @NOTE Workaround to resolve annoying error
Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

// @TODO Make more robust
ensResolver = async path => {
  const host = url.parse(path).host
  const split = host.split('.')
  if (split[split.length - 1] === 'eth') {
    const resolver = await ens.resolver(host)
    const value = await resolver.content()
    return { host, value }
  } else {
    return false
  }
}

module.exports = { ensResolver }
