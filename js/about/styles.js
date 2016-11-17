/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

// Stylesheets go here
require('../../less/about/styles.less')
require('../../less/button.less')
require('../../less/forms.less')

class AboutStyle extends ImmutableComponent {
  render () {
    return <div className='wrapper'>
      <h1 data-l10n-id='introTitle' />
      <p data-l10n-id='intro' />
      <h1 className='typography' data-l10n-id='typography' />
      <h1 data-l10n-id='h1' />
      <h2 data-l10n-id='h2' />
      <h3 data-l10n-id='h3' />
      <h4 data-l10n-id='h4' />

      <h1 data-l10n-id='forms' />
      <h2 data-l10n-id='inputs' />
      <div className='container'>
        <input placeholder='Input box' className='form-control' type='text' />
        <pre><code>
          // require('less/forms.less'){'\n'}{'\n'}
          &lt;input className='form-control' type='text' />
        </code></pre>
      </div>
      <div className='container'>
        <select className='form-control'>
          <option>Select Box</option>
          <option>Second Choice</option>
          <option>Third Choice</option>
        </select>
        <pre><code>
          &lt;select className='form-control'>{'\n'}
          &lt;option>Select Box&lt;/option>{'\n'}
          &lt;option>Second Choice&lt;/option>{'\n'}
          &lt;option>Third Choice&lt;/option>{'\n'}
          &lt;/select>
        </code></pre>
      </div>
      <h2 data-l10n-id='buttons' />
      <span data-l10n-id='whiteButton' className='browserButton whiteButton inlineButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;span data-l10n-id='cancel' className='browserButton whiteButton inlineButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>
      <span data-l10n-id='primaryButton' className='browserButton primaryButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;span data-l10n-id='done' className='browserButton primaryButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>
    </div>
  }
}

module.exports = <AboutStyle />
