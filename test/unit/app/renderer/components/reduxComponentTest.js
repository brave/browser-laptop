/* global describe, it, before, after, afterEach */
const EventEmitter = require('events')
const React = require('react')
const { mount } = require('enzyme')
const Immutable = require('immutable')
const mockery = require('mockery')
const sinon = require('sinon')
const { assert } = require('chai')
const fakeElectron = require('../../../lib/fakeElectron')

function TestComponent () {
  return <p>hi</p>
}

describe('ReduxComponent', function () {
  const appState = Immutable.fromJS({
    context: 'appState'
  })
  const windowState = Immutable.fromJS({
    context: 'windowState'
  })
  let winStoreEmitter = new EventEmitter()
  let appStoreEmitter = new EventEmitter()
  const fakeWindowStore = {
    state: windowState,
    addChangeListener: (fn) => {
      winStoreEmitter.on('change', fn)
    }
  }
  const fakeAppStore = {
    state: appState,
    addChangeListener: (fn) => {
      appStoreEmitter.on('change', fn)
    }
  }
  let ReduxComponent

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/stores/windowStore', fakeWindowStore)
    mockery.registerMock('../../../js/stores/appStoreRenderer', fakeAppStore)
    ReduxComponent = require('../../../../../app/renderer/components/reduxComponent')
  })

  after(function () {
    mockery.disable()
  })

  afterEach(function () {
    winStoreEmitter.removeAllListeners()
    appStoreEmitter.removeAllListeners()
  })

  it('calls mergeProps for each component', function () {
    const mergeProps1 = sinon.stub().returns({ })
    const mergeProps2 = sinon.stub().returns({ })
    let Component1 = ReduxComponent.connect(TestComponent, mergeProps1)
    let Component2 = ReduxComponent.connect(TestComponent, mergeProps2)
    mount(<div><Component1 /><Component2 /></div>)
    // make sure mergeProps was called
    assert.equal(mergeProps1.callCount, 1, 'mergeProps was called once')
    assert.equal(mergeProps2.callCount, 1, 'mergeProps was called once')
  })

  it('calls mergeProps when app state changes', function () {
    const mergeProps1 = sinon.stub().returns({ })
    const mergeProps2 = sinon.stub().returns({ })
    let Component1 = ReduxComponent.connect(TestComponent, mergeProps1)
    let Component2 = ReduxComponent.connect(TestComponent, mergeProps2)
    mount(<div><Component1 /><Component2 /></div>)
    appStoreEmitter.emit('change')
    // make sure mergeProps was called
    assert.equal(mergeProps1.callCount, 2, 'mergeProps was called once')
    assert.equal(mergeProps2.callCount, 2, 'mergeProps was called once')
  })

  it('calls mergeProps when window state changes', function () {
    const mergeProps1 = sinon.stub().returns({ })
    const mergeProps2 = sinon.stub().returns({ })
    let Component1 = ReduxComponent.connect(TestComponent, mergeProps1)
    let Component2 = ReduxComponent.connect(TestComponent, mergeProps2)
    mount(<div><Component1 /><Component2 /></div>)
    winStoreEmitter.emit('change')
    // make sure mergeProps was called
    assert.equal(mergeProps1.callCount, 2, 'mergeProps was called once')
    assert.equal(mergeProps2.callCount, 2, 'mergeProps was called once')
  })

  it('sets component props as returned by mergeProps', function () {
    const testProps = {
      testProp: 'testValue',
      testDeepProps: {
        testDeepProp: true
      }
    }
    const mergeProps = sinon.stub().returns(Object.assign({}, testProps))
    class ComponentPropsLogger extends React.Component {
      render () {
        return null
      }
    }
    const renderFn = sinon.stub(ComponentPropsLogger.prototype, 'render').returns(null)
    let Component = ReduxComponent.connect(ComponentPropsLogger, mergeProps)
    mount(<Component />)
    assert.equal(renderFn.callCount, 1, 'react component render was called once')
    const actualRenderThis = renderFn.thisValues[0]
    assert.isOk(actualRenderThis, 'react component render was providing a `this`')
    assert.deepEqual(actualRenderThis.props, testProps, 'result of mergeProps was provided as `this.props` in react component render')
  })

  it('re-renders component if props change', function () {
    const testProps = {
      testProp: 'testValue',
      testDeepProps: {
        testDeepProp: true
      }
    }
    const modifiedTestProps = Object.assign({}, testProps, { testProps: 'modified' })
    const mergeProps = sinon.stub()
    mergeProps.onCall(0).returns(Object.assign({}, testProps))
    mergeProps.onCall(1).returns(Object.assign({}, modifiedTestProps))
    class ComponentPropsLogger extends React.Component {
      render () {
        return null
      }
    }
    const renderFn = sinon.stub(ComponentPropsLogger.prototype, 'render').returns(null)
    let Component2 = ReduxComponent.connect(ComponentPropsLogger, mergeProps)
    mount(<Component2 />)
    // sanity check first render
    assert.equal(renderFn.callCount, 1, 'react component render was called once')
    assert.deepEqual(renderFn.thisValues[0].props, testProps, 'result of mergeProps was provided as `this.props` in react component render')
    // modify state
    appStoreEmitter.emit('change')
    // check rendered twice
    assert.equal(renderFn.callCount, 2, 'react component render was called after state change')
    // check props
    assert.deepEqual(renderFn.thisValues[1].props, modifiedTestProps, 'result of modified mergeProps was provided as `this.props` in react component render')
  })

  it('does not re-render component if props are the same', function () {
    const testProps = {
      testProp: 'testValue',
      testDeepProps: {
        testDeepProp: true
      }
    }
    const mergeProps = sinon.stub().returns(Object.assign({}, testProps))
    class ComponentPropsLogger extends React.Component {
      render () {
        return null
      }
    }
    const renderFn = sinon.stub(ComponentPropsLogger.prototype, 'render').returns(null)
    let Component = ReduxComponent.connect(ComponentPropsLogger, mergeProps)
    mount(<Component />)
    assert.equal(renderFn.callCount, 1, 'react component render was called once')
    const actualRenderThis = renderFn.thisValues[0]
    assert.isOk(actualRenderThis, 'react component render was providing a `this`')
    assert.deepEqual(actualRenderThis.props, testProps, 'result of mergeProps was provided as `this.props` in react component render')
    appStoreEmitter.emit('change')
    assert.equal(renderFn.callCount, 1, 'react component render was called once')
  })

  it('provides windowState merged with appState', function () {
    const mergeProps = sinon.stub().returns({ })
    let Component = ReduxComponent.connect(TestComponent, mergeProps)
    mount(<Component />)
    assert.equal(mergeProps.callCount, 1, 'mergeProps was called once')
    // check that we have the state structure we're looking for
    const state = mergeProps.args[0][0]
    assert.property(state, 'toJS', 'state is immutable object')
    const rawState = state.toJS()
    assert.propertyVal(rawState, 'context', 'appState', 'has app state properties')
    assert.property(rawState, 'currentWindow', 'has window state')
    assert.propertyVal(rawState.currentWindow, 'context', 'windowState', 'has window state properties')
  })

  it('provides the same state object to multiple components', function () {
    let component1State
    let component2State
    const mergeProps1 = sinon.spy((state, ownProps) => {
      component1State = state
      return { }
    })
    const mergeProps2 = sinon.spy((state, ownProps) => {
      component2State = state
      return { }
    })
    let Component1 = ReduxComponent.connect(TestComponent, mergeProps1)
    let Component2 = ReduxComponent.connect(TestComponent, mergeProps2)
    mount(<div><Component1 /><Component2 /></div>)
    // make sure the exact same state object is given to each component
    assert.strictEqual(component1State, component2State, 'Each component state is strict equal')
  })

  it('accepts generator function as mergeProps', function () {
    const testProps = {
      testProp: 'testValue',
      testDeepProps: {
        testDeepProp: 4
      }
    }
    const realMergeProps = sinon.stub().returns(Object.assign({}, testProps))
    const mergePropsGenerator = sinon.stub().returns(realMergeProps)
    class ComponentPropsLogger extends React.Component {
      render () {
        return null
      }
    }
    const renderFn = sinon.stub(ComponentPropsLogger.prototype, 'render').returns(null)
    let Component = ReduxComponent.connect(ComponentPropsLogger, mergePropsGenerator)
    mount(<Component />)
    assert.equal(renderFn.callCount, 1, 'react component render was called once')
    const actualRenderThis = renderFn.thisValues[0]
    assert.isOk(actualRenderThis, 'react component render was providing a `this`')
    assert.deepEqual(actualRenderThis.props, testProps, 'result of mergeProps was provided as `this.props` in react component render')
    // update store to make sure generated mergeProps function is called again, and not the generator
    appStoreEmitter.emit('change')
    assert.equal(realMergeProps.callCount, 2, 'generated mergeProps function was called again after a store update')
    assert.equal(mergePropsGenerator.callCount, 1, 'mergeProps generator function was only called once in order to generate mergeProps function')
  })
})
