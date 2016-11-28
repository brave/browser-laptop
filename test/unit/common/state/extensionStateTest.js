/* global describe, it, before */
const extensionState = require('../../../../app/common/state/extensionState')
const Immutable = require('immutable')
const assert = require('assert')

const defaultAppState = Immutable.fromJS({
  tabs: [],
  extensions: {
    'blah': {
      browserAction: {
        title: 'blah',
        popup: 'blah.html'
      }
    }
  },
  otherProp: true
})

const abcdBrowserAction = Immutable.fromJS({
  browserAction: {
    title: 'title',
    popup: 'popup.html',
    tabs: {}
  }
})

const commonTests = () => {
  it('should not change any other extensions', function () {
    let extension = this.state.getIn(['extensions', 'blah'])
    assert(Immutable.is(extension, defaultAppState.getIn(['extensions', 'blah'])))
  })

  it('should not change other props in the state', function () {
    assert.equal(this.state.get('otherProp'), true)
  })
}

describe('extensionState', function () {
  describe('browserActionRegistered', function () {
    describe('extensionId has been installed', function () {
      before(function () {
        this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({}))
      })

      describe('browser action already exists', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], abcdBrowserAction)
          this.state = extensionState.browserActionRegistered(this.state, Immutable.fromJS({
            extensionId: 'abcd',
            browserAction: {
              title: 'title2'
            }
          }))
        })

        it('should overwrite the existing browserAction', function () {
          let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction'])
          assert.equal(browserAction.get('title'), 'title2')
          assert.equal(browserAction.get('popup'), undefined)
        })

        commonTests()
      })

      describe('browser action does not exist', function () {
        before(function () {
          this.state = extensionState.browserActionRegistered(this.state, Immutable.fromJS({
            extensionId: 'abcd',
            browserAction: abcdBrowserAction.get('browserAction')
          }))
        })

        it('should create the browserAction', function () {
          let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction'])
          assert.equal(browserAction.get('title'), abcdBrowserAction.getIn(['browserAction', 'title']))
          assert.equal(browserAction.get('popup'), abcdBrowserAction.getIn(['browserAction', 'popup']))
        })

        it('should add default values', function () {
          let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction'])
          assert.equal(browserAction.get('tabs'), Immutable.fromJS({}))
        })

        commonTests()
      })
    })

    describe('extensionId has not been installed', function () {
      before(function () {
        this.state = extensionState.browserActionRegistered(defaultAppState, Immutable.fromJS({
          extensionId: 'abcd',
          browserAction: abcdBrowserAction.get('browserAction')
        }))
      })

      it('should not update the state', function () {
        Immutable.is(this.state, defaultAppState)
      })
    })
  })  // browserActionRegistered

  describe('browserActionUpdated', function () {
    describe('extensionId has been installed', function () {
      before(function () {
        this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({}))
      })

      describe('with tabId', function () {
        describe('browser action has been registered', function () {
          before(function () {
            this.state = defaultAppState.setIn(['extensions', 'abcd'], abcdBrowserAction)
            this.state = extensionState.browserActionUpdated(this.state, Immutable.fromJS({
              extensionId: 'abcd',
              tabId: '1',
              browserAction: {
                title: 'title2'
              }
            }))
          })

          describe('browser action for tab already exists', function () {
            before(function () {
              let browserAction = abcdBrowserAction.setIn(['browserAction', 'tabs', '1'], Immutable.fromJS({
                title: 'tabTitle',
                popup: 'tabPopup'
              }))
              this.state = defaultAppState.setIn(['extensions', 'abcd'], browserAction)
              this.state = extensionState.browserActionUpdated(this.state, Immutable.fromJS({
                extensionId: 'abcd',
                tabId: '1',
                browserAction: {
                  title: 'tabTitle2'
                }
              }))
            })

            it('should update the existing tab browserAction', function () {
              let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction', 'tabs', '1'])
              assert.equal(browserAction.get('title'), 'tabTitle2')
              assert.equal(browserAction.get('popup'), 'tabPopup')
            })

            it('should not change any properties of the non-tab browserAction', function () {
              let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction'])
              assert(browserAction.get('title'), abcdBrowserAction.getIn(['browserAction', 'title']))
              assert(browserAction.get('popup'), abcdBrowserAction.getIn(['browserAction', 'popup']))
            })

            commonTests()
          })  // browserActionUpdate extensionId has been installed with tabId browser action for tab already exists

          describe('browser action for tab does not exist', function () {
            before(function () {
              this.state = defaultAppState.setIn(['extensions', 'abcd'], abcdBrowserAction)
              this.state = extensionState.browserActionUpdated(this.state, Immutable.fromJS({
                extensionId: 'abcd',
                tabId: '1',
                browserAction: {
                  title: 'tabTitle2'
                }
              }))
            })

            it('should create the tab browserAction', function () {
              let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction', 'tabs', '1'])
              assert.equal(browserAction.get('title'), 'tabTitle2')
              assert.equal(browserAction.get('popup'), undefined)
            })

            it('should not change any properties of the non-tab browserAction', function () {
              let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction'])
              assert(browserAction.get('title'), abcdBrowserAction.getIn(['browserAction', 'title']))
              assert(browserAction.get('popup'), abcdBrowserAction.getIn(['browserAction', 'popup']))
            })

            commonTests()
          })
        })  // browserActionUpdate extensionId has been installed with tabId browser action for tab does not exist

        describe('browser action has not been registered', function () {
          before(function () {
            this.state = extensionState.browserActionUpdated(this.state, Immutable.fromJS({
              extensionId: 'abcd',
              browserAction: abcdBrowserAction.get('browserAction')
            }))
          })

          it('should not update the state', function () {
            Immutable.is(this.state, defaultAppState)
          })

          describe('with tabId', function () {
            before(function () {
              this.state = extensionState.browserActionUpdated(defaultAppState, Immutable.fromJS({
                extensionId: 'abcd',
                tabId: '1',
                browserAction: {
                  title: 'tabTitle2'
                }
              }))
            })
          })

          it('should not update the state', function () {
            Immutable.is(this.state, defaultAppState)
          })
        })
      })  // browserActionUpdate extensionId has been installed with tabId

      describe('browser action already exists', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], abcdBrowserAction)
          this.state = extensionState.browserActionUpdated(this.state, Immutable.fromJS({
            extensionId: 'abcd',
            browserAction: {
              title: 'title2'
            }
          }))
        })

        it('should update the existing browserAction', function () {
          let browserAction = this.state.getIn(['extensions', 'abcd', 'browserAction'])
          assert.equal(browserAction.get('title'), 'title2')
          assert.equal(browserAction.get('popup'), abcdBrowserAction.getIn(['browserAction', 'popup']))
        })

        commonTests()
      })

      describe('browser action does not exist', function () {
        before(function () {
          this.state = extensionState.browserActionUpdated(this.state, Immutable.fromJS({
            extensionId: 'abcd',
            browserAction: abcdBrowserAction.get('browserAction')
          }))
        })

        it('should not update the state', function () {
          Immutable.is(this.state, defaultAppState)
        })
      })
    })  // browserActionUpdated extensionId has been installed

    describe('extensionId has not been installed', function () {
      before(function () {
        this.state = extensionState.browserActionUpdated(defaultAppState, Immutable.fromJS({
          extensionId: 'abcd',
          browserAction: abcdBrowserAction.get('browserAction')
        }))
      })

      it('should not update the state', function () {
        Immutable.is(this.state, defaultAppState)
      })
    })
  })  // browserActionUpdated

  describe('getEnabledExtensions', function () {
    describe('without tab-specific properties', function () {
      before(function () {
        this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
          enabled: true,
          id: 'abcd'
        }))
        this.enabledExtensions = extensionState.getEnabledExtensions(this.state)
      })

      it('return extensions where enabled === true', function () {
        assert.equal(this.enabledExtensions.size, 1)
        assert.equal(this.enabledExtensions.first().get('enabled'), true)
        assert.equal(this.enabledExtensions.first().get('id'), 'abcd')
      })
    })
  })

  describe('getBrowserActionByTabId', function () {
    before(function () {
      this.state = defaultAppState.setIn(['extensions', 'abcd'],
        abcdBrowserAction.setIn(['browserAction', 'tabs', '1'], Immutable.fromJS({
          title: 'tabTitle'
        })))
    })

    describe('without tab-specific properties', function () {
      before(function () {
        this.browserAction = extensionState.getBrowserActionByTabId(this.state, 'abcd', '1')
      })

      it('should return the default browserAction properties', function () {
        assert.equal(this.browserAction.get('title'), abcdBrowserAction.getIn(['browserAction', 'title']))
        assert.equal(this.browserAction.get('popup'), abcdBrowserAction.getIn(['browserAction', 'popup']))
      })
    })

    describe('with tab-specific properties', function () {
      before(function () {
        this.browserAction = extensionState.getBrowserActionByTabId(this.state, 'abcd', '1')
      })

      it('should merge the tab-specific properties into the default browserAction properties', function () {
        assert(this.browserAction.get('title'), 'tabTitle')
        assert(this.browserAction.get('popup'), abcdBrowserAction.getIn(['browserAction', 'popup']))
      })
    })

    describe('no browser action for the extensionId', function () {
      before(function () {
        let state = this.state.setIn(['extensions', 'abcde'], Immutable.fromJS({}))
        this.browserAction1 = extensionState.getBrowserActionByTabId(state, 'abcde', '1')
        this.browserAction2 = extensionState.getBrowserActionByTabId(state, 'abcdef', '1')
      })

      it('should return null', function () {
        assert.equal(this.browserAction1, null)
        assert.equal(this.browserAction2, null)
      })
    })
  })

  describe('extensionInstalled', function () {
    describe('extensionId has been installed', function () {
      before(function () {
        this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
          name: 'old-brave',
          id: 'abcd',
          url: 'old_url',
          path: 'old/path',
          version: '0.9',
          description: 'an awesome extension',
          manifest: {
            manifest_value: 'test1',
            manifest_value2: 'test2'
          },
          enabled: true
        }))
        this.state = extensionState.extensionInstalled(this.state, Immutable.fromJS({
          extensionId: 'abcd',
          installInfo: {
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            }
          }
        }))
      })

      it('should overwrite the existing extension', function () {
        let extension = this.state.getIn(['extensions', 'abcd'])
        assert.equal(extension.get('name'), 'brave')
        assert.equal(extension.get('id'), 'abcd')
        assert.equal(extension.get('url'), 'some_url')
        assert.equal(extension.get('path'), 'some/path')
        assert.equal(extension.get('version'), '1.0')
        assert.equal(extension.get('description'), 'a more awesomer extension')
        assert.equal(extension.get('enabled'), undefined)
        assert(Immutable.is(extension.get('manifest'), Immutable.fromJS({manifest_value: 'test2'})))
      })

      commonTests()
    })

    describe('extensionId has not been installed', function () {
      before(function () {
        this.state = extensionState.extensionInstalled(defaultAppState, Immutable.fromJS({
          extensionId: 'abcd',
          installInfo: {
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            }
          }
        }))
      })

      it('should add the extension to the state', function () {
        let extension = this.state.getIn(['extensions', 'abcd'])
        assert.equal(extension.get('name'), 'brave')
        assert.equal(extension.get('id'), 'abcd')
        assert.equal(extension.get('url'), 'some_url')
        assert.equal(extension.get('path'), 'some/path')
        assert.equal(extension.get('version'), '1.0')
        assert.equal(extension.get('description'), 'a more awesomer extension')
        assert(Immutable.is(extension.get('manifest'), Immutable.fromJS({manifest_value: 'test2'})))
      })

      commonTests()
    })
  })

  describe('extensionEnabled', function () {
    describe('extensionId has been installed', function () {
      describe('extensionId has not been enabled', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            }
          }))
          this.state = extensionState.extensionEnabled(this.state, Immutable.fromJS({extensionId: 'abcd'}))
        })

        it('should set the enabled property to true', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('enabled'), true)
        })

        it('should not alter any other properties', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('name'), 'brave')
          assert.equal(extension.get('id'), 'abcd')
          assert.equal(extension.get('url'), 'some_url')
          assert.equal(extension.get('path'), 'some/path')
          assert.equal(extension.get('version'), '1.0')
          assert.equal(extension.get('description'), 'a more awesomer extension')
          assert(Immutable.is(extension.get('manifest'), Immutable.fromJS({manifest_value: 'test2'})))
        })

        commonTests()
      })

      describe('extensionId is enabled', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            },
            enabled: true
          }))
          this.state = extensionState.extensionEnabled(this.state, Immutable.fromJS({extensionId: 'abcd'}))
        })

        it('should not update the state', function () {
          Immutable.is(this.state, defaultAppState)
        })
      })

      describe('extensionId is disabled', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            },
            enabled: false
          }))
          this.state = extensionState.extensionEnabled(this.state, Immutable.fromJS({extensionId: 'abcd'}))
        })

        it('should set the enabled property to true', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('enabled'), true)
        })

        it('should not alter any other properties', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('name'), 'brave')
          assert.equal(extension.get('id'), 'abcd')
          assert.equal(extension.get('url'), 'some_url')
          assert.equal(extension.get('path'), 'some/path')
          assert.equal(extension.get('version'), '1.0')
          assert.equal(extension.get('description'), 'a more awesomer extension')
          assert(Immutable.is(extension.get('manifest'), Immutable.fromJS({manifest_value: 'test2'})))
        })

        commonTests()
      })
    }) // extensionEnabled extensionId has been installed

    describe('extensionId has not been installed', function () {
      before(function () {
        this.state = extensionState.extensionInstalled(defaultAppState, Immutable.fromJS({
          extensionId: 'abcd',
          installInfo: {
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            }
          }
        }))
      })

      it('should not update the state', function () {
        Immutable.is(this.state, defaultAppState)
      })

      commonTests()
    })
  })  // extensionEnabled

  describe('extensionDisabled', function () {
    describe('extensionId has been installed', function () {
      describe('extensionId has not been enabled', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            }
          }))
          this.state = extensionState.extensionDisabled(this.state, Immutable.fromJS({extensionId: 'abcd'}))
        })

        it('should set the enabled property to false', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('enabled'), false)
        })

        it('should not alter any other properties', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('name'), 'brave')
          assert.equal(extension.get('id'), 'abcd')
          assert.equal(extension.get('url'), 'some_url')
          assert.equal(extension.get('path'), 'some/path')
          assert.equal(extension.get('version'), '1.0')
          assert.equal(extension.get('description'), 'a more awesomer extension')
          assert(Immutable.is(extension.get('manifest'), Immutable.fromJS({manifest_value: 'test2'})))
        })

        commonTests()
      })

      describe('extensionId is disabled', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            },
            enabled: false
          }))
          this.state = extensionState.extensionDisabled(this.state, Immutable.fromJS({extensionId: 'abcd'}))
        })

        it('should not update the state', function () {
          Immutable.is(this.state, defaultAppState)
        })
      })

      describe('extensionId is enabled', function () {
        before(function () {
          this.state = defaultAppState.setIn(['extensions', 'abcd'], Immutable.fromJS({
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            },
            enabled: true
          }))
          this.state = extensionState.extensionDisabled(this.state, Immutable.fromJS({extensionId: 'abcd'}))
        })

        it('should set the enabled property to false', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('enabled'), false)
        })

        it('should not alter any other properties', function () {
          let extension = this.state.getIn(['extensions', 'abcd'])
          assert.equal(extension.get('name'), 'brave')
          assert.equal(extension.get('id'), 'abcd')
          assert.equal(extension.get('url'), 'some_url')
          assert.equal(extension.get('path'), 'some/path')
          assert.equal(extension.get('version'), '1.0')
          assert.equal(extension.get('description'), 'a more awesomer extension')
          assert(Immutable.is(extension.get('manifest'), Immutable.fromJS({manifest_value: 'test2'})))
        })

        commonTests()
      })
    }) // extensionEnabled extensionId has been installed

    describe('extensionId has not been installed', function () {
      before(function () {
        this.state = extensionState.extensionInstalled(defaultAppState, Immutable.fromJS({
          extensionId: 'abcd',
          installInfo: {
            name: 'brave',
            id: 'abcd',
            url: 'some_url',
            path: 'some/path',
            version: '1.0',
            description: 'a more awesomer extension',
            manifest: {
              manifest_value: 'test2'
            }
          }
        }))
      })

      it('should not update the state', function () {
        Immutable.is(this.state, defaultAppState)
      })

      commonTests()
    })
  })
})
