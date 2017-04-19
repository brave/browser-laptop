/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')

// Stylesheets go here
require('../../less/button.less')
require('../../less/forms.less')

const {Textbox, FormTextbox, SettingTextbox, RecoveryKeyTextbox} = require('../../app/renderer/components/textbox')
const {TextArea, DefaultTextArea} = require('../../app/renderer/components/textbox')
const {Dropdown, FormDropdown, SettingDropdown} = require('../../app/renderer/components/dropdown')

class Container extends ImmutableComponent {
  render () {
    return <div className={css(styles.container)} {...this.props} />
  }
}

class Pre extends ImmutableComponent {
  render () {
    return <pre className={css(styles.pre)} {...this.props} />
  }
}

class Code extends ImmutableComponent {
  render () {
    return <code className={css(styles.code)} {...this.props} />
  }
}

class AboutStyle extends ImmutableComponent {
  render () {
    return <div className={css(styles.wrapper)}>
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

      <Container>
        <h2>Plain textbox</h2>
        <Textbox placeholder='Textbox' />
        <Pre><Code>
          const { '{Textbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;Textbox />
        </Code></Pre>
      </Container>

      <Container>
        <h2>Textbox for use in forms</h2>
        <FormTextbox placeholder='FormTextbox' />
        <Pre><Code>
          const { '{FormTextbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;FormTextbox />
        </Code></Pre>
      </Container>

      <Container>
        <h2>Texbox used mostly in Preferences; has a fixed width</h2>
        <SettingTextbox placeholder='SettingTextbox' />
        <Pre><Code>
          const { '{SettingTextbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;SettingTextbox />
        </Code></Pre>
      </Container>

      <Container>
        <h2>Textbox used on wallet recovery screen in Brave Payments</h2>
        <RecoveryKeyTextbox placeholder='RecoveryKeyTextbox' />
        <Pre><Code>
          const { '{RecoveryKeyTextbox}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;RecoveryKeyTextbox />
        </Code></Pre>
      </Container>

      <Container>
        <h2>Plain textarea</h2>
        <TextArea placeholder='TextArea' />
        <Pre><Code>
          const { '{TextArea}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;TextArea />
        </Code></Pre>
      </Container>

      <Container>
        <h2>Default textarea; font size is specified</h2>
        <DefaultTextArea placeholder='DefaultTextArea' />
        <Pre><Code>
          const { '{DefaultTextArea}' } = require('../../app/renderer/components/textbox'){'\n'}
          &lt;DefaultTextArea />
        </Code></Pre>
      </Container>

      <hr />

      <h1 data-l10n-id='dropdowns' />

      <Container>
        <h2>Plain dropdown</h2>
        <Dropdown>
          <option>Select Box</option>
          <option>Second Choice</option>
          <option>Third Choice</option>
        </Dropdown>
        <Pre><Code>
          const { '{Dropdown}' } = require('../../app/renderer/components/dropdown'){'\n'}
          &lt;Dropdown>{'\n'}
          &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
          &lt;/Dropdown>
        </Code></Pre>
      </Container>

      <Container>
        <h2>Dropdown for use in forms</h2>
        <FormDropdown>
          <option>Select Box</option>
          <option>Second Choice</option>
          <option>Third Choice</option>
        </FormDropdown>
        <Pre><Code>
          const { '{FormDropdown}' } = require('../../app/renderer/components/dropdown'){'\n'}
          &lt;FormDropdown>{'\n'}
          &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
          &lt;/FormDropdown>
        </Code></Pre>
      </Container>

      <Container>
        <h2>Dropdown used mostly in Preferences; has a fixed width</h2>
        <SettingDropdown>
          <option>Select Box</option>
          <option>Second Choice</option>
          <option>Third Choice</option>
        </SettingDropdown>
        <Pre><Code>
          const { '{SettingDropdown}' } = require('../../app/renderer/components/dropdown'){'\n'}
          &lt;SettingDropdown>{'\n'}
          &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
          &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
          &lt;/SettingDropdown>
        </Code></Pre>
      </Container>

      <hr />

      <h1 data-l10n-id='buttons' />
      <button data-l10n-id='browserButton' className='browserButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='done' className='browserButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='whiteButton' className='browserButton whiteButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='inlineButton' className='browserButton whiteButton inlineButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='done' className='browserButton whiteButton inlineButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='wideButton' className='browserButton whiteButton wideButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton wideButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='smallButton' className='browserButton whiteButton smallButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='done' className='browserButton whiteButton smallButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='primaryButton' className='browserButton primaryButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='cancel' className='browserButton primaryButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='actionButton' className='browserButton actionButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='done' className='browserButton actionButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='subtleButton' className='browserButton subtleButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='cancel' className='browserButton subtleButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />
      </Code></Pre>

      <button data-l10n-id='primaryButton' className='browserButton primaryButton' onClick={this.onRemoveBookmark} /><button data-l10n-id='whiteButton' className='browserButton whiteButton' onClick={this.onRemoveBookmark} /><button data-l10n-id='wideButton' className='browserButton whiteButton wideButton' onClick={this.onRemoveBookmark} /><button data-l10n-id='primaryButton' className='browserButton primaryButton' onClick={this.onRemoveBookmark} />
      <Pre><Code>
        &lt;button data-l10n-id='cancel' className='browserButton primaryButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
        &lt;button data-l10n-id='cancel' className='browserButton whiteButton wideButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
        &lt;button data-l10n-id='cancel' className='browserButton primaryButton'{'\n'}
        onClick={'{this.onRemoveBookmark}'} />{'\n'}
      </Code></Pre>
    </div>
  }
}

const common = {
  maxWidth: '800px',
  margin: '0 auto'
}

const styles = StyleSheet.create({
  wrapper: common,
  container: common,
  pre: {
    background: '#1d1f21',
    color: '#FFFFFF',
    fontSize: '14px',
    padding: '5px',
    borderRadius: globalStyles.radius.borderRadius,
    tabSize: '2',
    wordBreak: 'normal'
  },
  code: {
    fontFamily: 'monospace',
    whiteSpace: 'pre'
  }
})

module.exports = <AboutStyle />
