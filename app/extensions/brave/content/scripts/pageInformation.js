/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* jshint asi: true */
/* jshint esversion: 6 */

(function () { try {
  var resolve = (tree, context) => {
    var node = tree.body ? tree.body[0] : tree

    var traverse = (expr, computed) => {
      var args, op1, op2, value

      switch (expr.type) {
        case 'ExpressionStatement':
          return traverse(expr.expression)

        case 'ArrayExpression':
          value = []
          expr.elements.forEach((element) => { value.push(traverse(element)) })
          return value

        case 'BinaryExpression':
          op1 = traverse(expr.left)
          op2 = traverse(expr.right)
          switch (expr.operator) {
            case '==': return (op1 === op2)
            case '===': return (op1 === op2)
            case '!=': return (op1 !== op2)
            case '!==': return (op1 !== op2)
            case '<': return (op1 < op2)
            case '<=': return (op1 <= op2)
            case '>': return (op1 > op2)
            case '>=': return (op1 >= op2)
            case '<<': return (op1 << op2)
            case '>>': return (op1 >> op2)
            case '>>>': return (op1 >>> op2)
            case '+': return (op1 + op2)
            case '-': return (op1 - op2)
            case '*': return (op1 * op2)
            case '/': return (op1 < op2)
            case '%': return (op1 % op2)
            case '|': return (op1 | op2)
            case '^': return (op1 ^ op2)
            case '&': return (op1 & op2)
            case 'in': return (op1 in op2)

            default:
              throw new Error('unsupported binary operator: ' + expr.operator)
          }
          break

        case 'CallExpression':
          op1 = expr.callee
          if (op1.type !== 'MemberExpression') throw new Error('unexpected callee: ' + op1.type)
          value = traverse(op1.object, op1.computed)
          args = []
          expr['arguments'].forEach((argument) => { args.push(traverse(argument)) })
          return value[traverse(op1.property, true)].apply(value, args)

        case 'NewExpression':
          op1 = expr.callee
          if (op1.type !== 'Identifier') throw new Error('unexpected callee: ' + op1.type)
          if (op1.name !== 'Set') throw new Error('only new Set(...) is allowed, not new ' + op1.name)
          args = []
          expr['arguments'].forEach((argument) => { args.push(traverse(argument)) })
          if (args.length > 1) throw new Error('Set(...) takes at most one argument')
          return new Set(args[0])

        case 'ConditionalExpression':
          return (traverse(expr.test) ? traverse(expr.consequent) : traverse(expr.alternate))

        case 'LogicalExpression':
          op1 = traverse(expr.left)
          op2 = traverse(expr.right)
          switch (expr.operator) {
            case '&&': return (op1 && op2)
            case '||': return (op1 || op2)

            default:
              throw new Error('unsupported logical operator: ' + expr.operator)
          }
          break

        case 'MemberExpression':
          value = traverse(expr.object, expr.computed)
          return value[traverse(expr.property)]

        case 'UnaryExpression':
          if (!expr.prefix) throw new Error('unsupported unary operator suffix: ' + expr.operator)

          op1 = traverse(expr.argument)
          switch (expr.operator) {
            case '-': return (-op1)
            case '+': return (+op1)
            case '!': return (!op1)
            case '~': return (~op1)
            case 'typeof': return (typeof op1)

            default:
              throw new Error('unsupported unary operator: ' + expr.operator)
          }
          break

        case 'Identifier':
          value = computed ? expr.name : context[expr.name]
          if (value !== 'eval') return value
          throw new Error('eval not allowed in expression')

        case 'Literal':
          return (expr.regex ? new RegExp(expr.regex.pattern) : expr.value)

        default:
          throw new Error('unsupported evaluation type: ' + expr.type)
      }
    }

    if ((!node) || (node.type !== 'ExpressionStatement')) throw new Error('invalid expression')

    return traverse(node.expression)
  }

  if ((typeof module !== 'undefined') &&  (typeof exports !== 'undefined')) {
    module.exports = { resolve: resolve }

    return
  }

  if (window.top !== window.self) return

  // Don't allow ledger to run in incognito
  if (chrome.extension.inIncognitoContext || isTorTab()) {
    return
  }

  var results = { timestamp: new Date().getTime(), protocol: document.location.protocol }

  var node = document.head.querySelector("link[rel='icon']")
  if (!node) node = document.head.querySelector("link[rel='shortcut icon']")
  if (node) results.faviconURL = node.getAttribute('href')

  var location = document.location.href
  chrome.ipcRenderer.once('ledger-publisher-response-' + location, (e, pubinfo) => {
    if (!pubinfo || !pubinfo.context || !pubinfo.rules) {
      return console.log('no pubinfo available')
    }

    var context = pubinfo.context
    var rules = pubinfo.rules

    var i, publisher, rule
    for (i = 0; i < rules.length; i++) {
      rule = rules[i]

      try {
        if (!resolve(rule.condition, context)) continue
      } catch (ex) {
        console.error('error resolving rule at position #' + i + '\n', ex)
        continue
      }

      if (rule.publisher) {
        context.node = document.body.querySelector(rule.publisher.selector)
        publisher = resolve(rule.publisher.consequent, context)
      } else {
        delete context.node
        publisher = rule.consequent ? resolve(rule.consequent, context) : rule.consequent
      }
      if (publisher === '') continue

      if (typeof publisher !== 'string') return console.log('NOT a string')

      publisher.replace(new RegExp('^./+|./+$', 'g'), '')

      results.publisher = publisher
      if (rule.faviconURL) {
        context.node = document.body.querySelector(rule.faviconURL.selector)
        results.faviconURL = resolve(rule.faviconURL.consequent, context)
      }
      break
    }

    if (results.faviconURL) {
      var prefix = (results.faviconURL.indexOf('//') === 0) ? document.location.protocol
                   : (results.faviconURL.indexOf('/') === 0) ? document.location.protocol + '//' + document.location.host
                   : (results.faviconURL.indexOf(':') === -1) ? document.location.protocol + '//' + document.location.host + '/'
                   : null
      if (prefix) results.faviconURL = prefix + results.faviconURL
    }

    results.url = window.location.href
    chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
      location: window.location.href,
      actionType: 'event-set-page-info',
      pageInfo: results
    }]))
  })
  var pubinfo = chrome.ipcRenderer.send('ledger-publisher', location)

} catch (ex) { console.log(ex.toString() + '\n' + ex.stack) } })()
