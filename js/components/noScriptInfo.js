/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const Button = require('./button')

class NoScriptInfo extends ImmutableComponent {
  get numberBlocked () {
    return this.props.frameProps.getIn(['noScript', 'blocked']).size
  }

  onAllowTemp () { }

  onAllow () { }

  render () {
    const l10nArgs = {
      numberBlocked: this.numberBlocked
    }
    return <Dialog onHide={this.props.onHide} className='noScriptInfo' isClickDismiss>
      <div>
        <div data-l10n-args={JSON.stringify(l10nArgs)} data-l10n-id='scriptsBlocked' />
        <div>
          <Button l10nId='allowScriptsTemp' className='wideButton'
            onClick={this.onAllowTemp.bind(this)} />
        </div>
        <div>
          <Button l10nId='allowScripts' className='subtleButton'
            onClick={this.onAllow.bind(this)} />
        </div>
      </div>
    </Dialog>
  }
}

NoScriptInfo.propTypes = {
  frameProps: React.PropTypes.object,
  onHide: React.PropTypes.func
}

module.exports = NoScriptInfo
