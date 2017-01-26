/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

// Stylesheets go here
require('../../less/about/styles.less')
require('../../less/button.less')
require('../../less/forms.less')

const {Textbox, FormTextbox, SettingTextbox, RecoveryKeyTextbox} = require('../../app/renderer/components/textbox')
const {Dropdown, FormDropdown, SettingDropdown} = require('../../app/renderer/components/dropdown')

class AboutStyle extends ImmutableComponent {
  render () {
    return <div className='wrapper'>
      <h1 data-l10n-id='introTitle' />
      <p data-l10n-id='intro' />

      <hr />

      <h1 className='typography' data-l10n-id='typography' />
      <h1 data-l10n-id='h1' />
      <h2 data-l10n-id='h2' />
      <h3 data-l10n-id='h3' />
      <h4 data-l10n-id='h4' />

      <hr />

      <h1 data-l10n-id='textboxes' />

      <div className='container'>
        <h2>Plain textbox</h2>
        <Textbox placeholder='Textbox' />
        <pre><code>
          const { '{Textbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;Textbox />
        </code></pre>
      </div>

      <div className='container'>
        <h2>Textbox for use in forms</h2>
        <FormTextbox placeholder='FormTextbox' />
        <pre><code>
          const { '{FormTextbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;FormTextbox />
        </code></pre>
      </div>

      <div className='container'>
        <h2>Texbox used mostly in Preferences; has a fixed width</h2>
        <SettingTextbox placeholder='SettingTextbox' />
        <pre><code>
          const { '{SettingTextbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;SettingTextbox />
        </code></pre>
      </div>

      <div className='container'>
        <h2>Textbox used on wallet recovery screen in Brave Payments</h2>
        <RecoveryKeyTextbox placeholder='RecoveryKeyTextbox' />
        <pre><code>
          const { '{RecoveryKeyTextbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;RecoveryKeyTextbox />
        </code></pre>
      </div>

      <hr />

      <h1 data-l10n-id='dropdowns' />

      <div className='container'>
        <h2>Plain dropdown</h2>
        <Dropdown>
          <option>Select Box</option>
          <option>Second Choice</option>
          <option>Third Choice</option>
        </Dropdown>
        <pre><code>
          const { '{Dropdown}' } = require('../../app/renderer/components/dropdown'){'\n'}
          &lt;Dropdown>{'\n'}
          &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
          &lt;/Dropdown>
        </code></pre>
      </div>

      <div className='container'>
        <h2>Dropdown for use in forms</h2>
        <FormDropdown>
          <option>Select Box</option>
          <option>Second Choice</option>
          <option>Third Choice</option>
        </FormDropdown>
        <pre><code>
          const { '{FormDropdown}' } = require('../../app/renderer/components/dropdown'){'\n'}
          &lt;FormDropdown>{'\n'}
          &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
          &lt;/FormDropdown>
        </code></pre>
      </div>

      <div className='container'>
        <h2>Dropdown used mostly in Preferences; has a fixed width</h2>
        <SettingDropdown>
          <option>Select Box</option>
          <option>Second Choice</option>
          <option>Third Choice</option>
        </SettingDropdown>
        <pre><code>
          const { '{SettingDropdown}' } = require('../../app/renderer/components/dropdown'){'\n'}
          &lt;SettingDropdown>{'\n'}
          &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
          &lt;/SettingDropdown>
        </code></pre>
      </div>

      <hr />

      <h1 data-l10n-id='buttons' />
      <button data-l10n-id='browserButton' className='browserButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='done' className='browserButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='whiteButton' className='browserButton whiteButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='inlineButton' className='browserButton whiteButton inlineButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='done' className='browserButton whiteButton inlineButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='wideButton' className='browserButton whiteButton wideButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton wideButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='smallButton' className='browserButton whiteButton smallButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='done' className='browserButton whiteButton smallButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='primaryButton' className='browserButton primaryButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='cancel' className='browserButton primaryButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='actionButton' className='browserButton actionButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='done' className='browserButton actionButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='subtleButton' className='browserButton subtleButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='cancel' className='browserButton subtleButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </code></pre>

      <button data-l10n-id='primaryButton' className='browserButton primaryButton' onClick={this.onRemoveBookmark} /><button data-l10n-id='whiteButton' className='browserButton whiteButton' onClick={this.onRemoveBookmark} /><button data-l10n-id='wideButton' className='browserButton whiteButton wideButton' onClick={this.onRemoveBookmark} /><button data-l10n-id='primaryButton' className='browserButton primaryButton' onClick={this.onRemoveBookmark} />
      <pre><code>
        &lt;button data-l10n-id='cancel' className='browserButton primaryButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton wideButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
        &lt;button data-l10n-id='cancel' className='browserButton primaryButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
      </code></pre>
    </div>
  }
}

module.exports = <AboutStyle />
