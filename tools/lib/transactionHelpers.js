let Joi = require('joi')
const braveCrypto = require('brave-crypto')
let generateRandomHost = require('./randomHostname')
const BigNumber = require('bignumber.js')

const VALID_CURRENCY_CODE_REGEX = /^[A-Z]+$/
const VALID_HOSTNAME_REGEX = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/

const transactionSchema = Joi.object().keys({
  viewingId: Joi.string().guid().required().description('a unique id for the transaction'),
  surveyorId: Joi.string().length(32, 'base64').required().description('a unique id for the surveyor. 32 bytes, base64 encoded'),
  contribution: Joi.object().keys({
    altcurrency: Joi.string().required(),
    fiat: Joi.object().keys({
      amount: Joi.number().min(0).precision(2).required(),
      currency: Joi.string().required()
    }).required(),
    rates: Joi.object().pattern(VALID_CURRENCY_CODE_REGEX, Joi.number().min(0).precision(2)),
    probi: Joi.string().min(0).required().description('contribution amount in satoshis (10E-8 BTC)')
  }).required().description('object describing contribution in fiat and BTC, with exchange rate at time of contribution and network transaction fee'),
  submissionStamp: Joi.date().timestamp().required(),
  /** submissionId is 32 bytes, 64 chars hex-encoded **/
  submissionId: Joi.string().hex().length(32, 'hex').required(),
  submissionDate: Joi.date(),
  count: Joi.number().integer().min(0),

  /** credential:
    *  complicated JSON BLOB from anonize2, come back to this later
    **/
  credential: Joi.string(),

  /** surveyorIds:
   * an array of random 32-byte ids (base64-encoded).
   * length should equal sibling value `count`
   **/
  surveyorIds: Joi.array().items(Joi.string().length(32, 'base64')), // ideally something like .length(Joi.ref('count'))

  satoshis: Joi.ref('contribution.satoshis'),
  votes: Joi.ref('count'),
  ballots: Joi.object().pattern(VALID_HOSTNAME_REGEX, Joi.number().integer().min(0))
})

const validateTransaction = function (tx) {
  return Joi.validate(tx, transactionSchema)
}

const generateTransaction = function () {
  const count = braveCrypto.random.uniform(100)

  const viewingId = generateViewingId()
  const surveyorId = generateSurveyorId()
  const contribution = generateContribution()
  const submissionStamp = generateSubmissionStamp()
  const submissionDate = new Date(submissionStamp)
  const submissionId = generateSubmissionId()
  const credential = generateCredential() // what args needed?
  const surveyorIds = generateSurveyorIds(count)
  const satoshis = contribution.satoshis
  const votes = count
  const ballots = generateBallots(votes)

  return {
    viewingId,
    surveyorId,
    contribution,
    submissionStamp,
    submissionDate,
    submissionId,
    credential,
    surveyorIds,
    count,
    satoshis,
    votes,
    ballots
  }
}

/** code for generating transaction object components **/
const uuid = require('uuid')
const crypto = require('crypto')
const randomBytes = crypto.randomBytes

const generateViewingId = function () {
  return uuid.v4().toLowerCase()
}

const generateSurveyorId = function () {
  /**
   Random 32 bytes, generated in node-anonize2-relic/anonize2/anon.cpp:createSurvey as a random Big:
   ---
     Big vid;
     rand_int(vid);
   ---
   Expressed in base64 everywhere in JS-land
   **/
  return randomBytes(32).toString('base64')
}

const generateSurveyorIds = function (count) {
  if (!count) {
    return []
  }

  return (new Array(count)).fill(null).map(generateSurveyorId)
}

const generateContribution = function () {
  const amounts = [5.0, 7.5, 10.0, 17.5, 25.0, 50.0, 75.0, 100.0]
  let randomContributionAmount = amounts[braveCrypto.random.uniform(amounts.length)]
  const currency = 'BAT'

  let rates = {
    BTC: 0.00004132,
    ETH: 0.0006605302785672951,
    EUR: 0.16857817177013637,
    GBP: 0.150931297991734,
    USD: 0.1991611604
  }

  return {
    altcurrency: currency,
    fiat: {
      amount: randomContributionAmount,
      currency: currency
    },
    rates: rates,
    probi: new BigNumber(randomContributionAmount.toString()).times('1e18').toString()
  }
}

const generateSubmissionStamp = function () {
  return (new Date()).getTime()
}

const generateSubmissionId = function () {
  return randomBytes(32).toString('hex')
}

// this one is a TODO, as it is a complicated JSON blob from anonize
const generateCredential = function () {
  return 'PLACEHOLDER_CREDENTIAL_STRING'
}

const generateBallots = function (votes) {
  let ballots = {}

  let votesRemaining = votes

  while (votesRemaining) {
    let votesToCast = 1
    if (votesRemaining > 1) {
      votesToCast += braveCrypto.random.uniform(votesRemaining - 1)
    }
    let host = generateRandomHost()
    ballots[host] = votesToCast
    votesRemaining -= votesToCast
  }

  return ballots
}

module.exports = {
  transactionSchema,
  validateTransaction,
  generateTransaction
}
