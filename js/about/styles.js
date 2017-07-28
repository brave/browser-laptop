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
require('../../node_modules/font-awesome/css/font-awesome.css')

const {Textbox, FormTextbox, SettingTextbox, RecoveryKeyTextbox} = require('../../app/renderer/components/common/textbox')
const {TextArea, DefaultTextArea} = require('../../app/renderer/components/common/textbox')
const {Dropdown, FormDropdown, SettingDropdown, BraveryPanelDropdown} = require('../../app/renderer/components/common/dropdown')
const {BrowserButton} = require('../../app/renderer/components/common/browserButton')

const {
  SectionTitleWrapper,
  SectionTitleLabelWrapper,
  DefaultSectionTitle,
  AboutPageSectionTitle,
  AboutPageSectionSubTitle,
  SectionLabelTitle
} = require('../../app/renderer/components/common/sectionTitle')

const {
  CommonForm,
  CommonFormTitle,
  CommonFormSection,
  CommonFormDropdown,
  CommonFormClickable,
  CommonFormSubSection,
  CommonFormButtonWrapper,
  CommonFormBottomWrapper
} = require('../../app/renderer/components/common/commonForm')

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

class GoTop extends ImmutableComponent {
  render () {
    return <div className={css(styles.flexJustifyEnd, styles.goTop)}><a href='#top' {...this.props}>Go back to top</a></div>
  }
}

class Tab extends ImmutableComponent {
  render () {
    return <div className={css(styles.tab)} {...this.props} />
  }
}

class Tab2 extends ImmutableComponent {
  render () {
    return <div className={css(styles.tab2)} {...this.props} />
  }
}

class Tab3 extends ImmutableComponent {
  render () {
    return <div className={css(styles.tab3)} {...this.props} />
  }
}

class Tab4 extends ImmutableComponent {
  render () {
    return <div className={css(styles.tab4)} {...this.props} />
  }
}

class AboutStyle extends ImmutableComponent {
  render () {
    return <div className={css(styles.wrapper)}>
      <h1 data-l10n-id='introTitle' />
      <p className={css(styles.fontSizeInitial)} data-l10n-id='intro' />

      <ul className={css(styles.fontSizeInitial)}>
        <li className={css(styles.toc__marginBottom)}><a href='#typography'>typography</a></li>
        <li className={css(styles.toc__marginBottom)}><a href='#textboxes'>textboxes</a></li>
        <li className={css(styles.toc__marginBottom)}><a href='#dropdowns'>dropdowns</a></li>
        <li className={css(styles.toc__marginBottom)}><a href='#buttons'>buttons</a></li>
        <li className={css(styles.toc__marginBottom)}><a href='#commonForm'>commonForm</a></li>
        <li className={css(styles.toc__marginBottom)}><a href='#sectionTitle'>sectionTitle</a></li>
      </ul>

      <hr />

      <div id='typography'>
        <h1 className='typography' data-l10n-id='typography' />
        <h1 data-l10n-id='h1' />
        <h2 data-l10n-id='h2' />
        <h3 data-l10n-id='h3' />
        <h4 data-l10n-id='h4' />

        <GoTop />
      </div>

      <hr />

      <div id='textboxes'>
        <h1 data-l10n-id='textboxes' />
        <Container>
          <h2>Plain textbox</h2>
          <Textbox placeholder='Textbox' />
          <Pre><Code>
            const { '{Textbox}' } = require('../../app/renderer/components/common/textbox'){'\n'}
            &lt;Textbox />
          </Code></Pre>
        </Container>

        <Container>
          <h2>Textbox for use in forms</h2>
          <FormTextbox placeholder='FormTextbox' />
          <Pre><Code>
            const { '{FormTextbox}' } = require('../../app/renderer/components/common/textbox'){'\n'}
            &lt;FormTextbox />
          </Code></Pre>
        </Container>

        <Container>
          <h2>Texbox used mostly in Preferences; has a fixed width</h2>
          <SettingTextbox placeholder='SettingTextbox' />
          <Pre><Code>
            const { '{SettingTextbox}' } = require('../../app/renderer/components/common/textbox'){'\n'}
            &lt;SettingTextbox />
          </Code></Pre>
        </Container>

        <Container>
          <h2>Textbox used on wallet recovery screen in Brave Payments</h2>
          <RecoveryKeyTextbox placeholder='RecoveryKeyTextbox' />
          <Pre><Code>
            const { '{RecoveryKeyTextbox}' } = require('../../app/renderer/components/common/textbox'){'\n'}
            &lt;RecoveryKeyTextbox />
          </Code></Pre>
        </Container>

        <Container>
          <h2>Plain textarea</h2>
          <TextArea placeholder='TextArea' />
          <Pre><Code>
            const { '{TextArea}' } = require('../../app/renderer/components/common/textbox'){'\n'}
            &lt;TextArea />
          </Code></Pre>
        </Container>

        <Container>
          <h2>Default textarea; font size is specified</h2>
          <DefaultTextArea placeholder='DefaultTextArea' />
          <Pre><Code>
            const { '{DefaultTextArea}' } = require('../../app/renderer/components/common/textbox'){'\n'}
            &lt;DefaultTextArea />
          </Code></Pre>
        </Container>

        <GoTop />
      </div>

      <hr />

      <div id='dropdowns'>
        <h1 data-l10n-id='dropdowns' />
        <Container>
          <h2>Plain dropdown</h2>
          <Dropdown>
            <option>Select Box</option>
            <option>Second Choice</option>
            <option>Third Choice</option>
          </Dropdown>
          <Pre><Code>
            const { '{Dropdown}' } = require('../../app/renderer/components/common/dropdown'){'\n'}
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
            const { '{FormDropdown}' } = require('../../app/renderer/components/common/dropdown'){'\n'}
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
            const { '{SettingDropdown}' } = require('../../app/renderer/components/common/dropdown'){'\n'}
            &lt;SettingDropdown>{'\n'}
            &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
            &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
            &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
            &lt;/SettingDropdown>
          </Code></Pre>
        </Container>

        <Container>
          <h2>Dropdown used mostly on Bravery Panel; has 100% width and 13px font size</h2>
          <BraveryPanelDropdown>
            <option>Select Box</option>
            <option>Second Choice</option>
            <option>Third Choice</option>
          </BraveryPanelDropdown>
          <Pre><Code>
            const { '{BraveryPanelDropdown}' } = require('../../app/renderer/components/common/dropdown'){'\n'}
            &lt;BraveryPanelDropdown>{'\n'}
            &nbsp;&nbsp;&lt;option>Select Box&lt;/option>{'\n'}
            &nbsp;&nbsp;&lt;option>Second Choice&lt;/option>{'\n'}
            &nbsp;&nbsp;&lt;option>Third Choice&lt;/option>{'\n'}
            &lt;/BraveryPanelDropdown>
          </Code></Pre>
        </Container>

        <GoTop />
      </div>

      <hr />

      <div id='buttons'>
        <h1 data-l10n-id='buttons' />
        <BrowserButton l10nId='browserButton' onClick={this.onRemoveBookmark} />
        <Pre><Code>
          &lt;BrowserButton l10nId='browserButton' onClick={'{this.onRemoveBookmark}'} />
        </Code></Pre>

        <BrowserButton primaryColor l10nId='primaryColor' onClick={this.onRemoveBookmark} />
        <Pre><Code>
          &lt;BrowserButton primaryColor l10nId='cancel' onClick={'{this.onRemoveBookmark}'} />
        </Code></Pre>

        <BrowserButton secondaryColor l10nId='secondaryColor' onClick={this.onRemoveBookmark} />
        <Pre><Code>
          &lt;BrowserButton secondaryColor l10nId='secondaryColor' onClick={'{this.onRemoveBookmark}'} />
        </Code></Pre>

        <BrowserButton actionItem l10nId='actionButton' onClick={this.onRemoveBookmark} />
        <Pre><Code>
          &lt;BrowserButton actionItem l10nId='done' onClick={'{this.onRemoveBookmark}'} />
        </Code></Pre>

        <BrowserButton subtleItem l10nId='subtleButton' onClick={this.onRemoveBookmark} />
        <Pre><Code>
          &lt;BrowserButton subtleItem l10nId='cancel' onClick={'{this.onRemoveBookmark}'} />
        </Code></Pre>

        <BrowserButton groupedItem primaryColor l10nId='primaryColor' onClick={this.onRemoveBookmark} />
        <BrowserButton groupedItem secondaryColor l10nId='secondaryColor' onClick={this.onRemoveBookmark} />
        <BrowserButton groupedItem primaryColor l10nId='primaryColor' onClick={this.onRemoveBookmark} />
        <Pre><Code>
          &lt;BrowserButton groupedItem primaryColor l10nId='cancel' onClick={'{this.onRemoveBookmark}'} />{'\n'}
          &lt;BrowserButton groupedItem secondaryColor l10nId='cancel' onClick={'{this.onRemoveBookmark}'} />{'\n'}
          &lt;BrowserButton groupedItem primaryColor l10nId='cancel' onClick={'{this.onRemoveBookmark}'} />
        </Code></Pre>

        <BrowserButton extensionItem l10nId='extensionItem' onClick={this.onRemoveBookmark} />
        <Pre><Code>
          &lt;BrowserButton extensionItem l10nId='cancel' onClick={'{this.onRemoveBookmark}'} />
        </Code></Pre>

        <BrowserButton groupedItem secondaryColor notificationItem l10nId='notificationItem' onClick={this.onEnableAutoplay} />
        <BrowserButton groupedItem secondaryColor notificationItem l10nId='notificationItem' onClick={this.onEnableAutoplay} />
        <Pre><Code>
          &lt;BrowserButton groupedItem secondaryColor notificationItem l10nId='Yes' onClick={'{this.onEnableAutoplay}'} />{'\n'}
          &lt;BrowserButton groupedItem secondaryColor notificationItem l10nId='No' onClick={'{this.onEnableAutoplay}'} />
        </Code></Pre>

        <BrowserButton iconOnly iconClass={globalStyles.appIcons.moreInfo} size='30px' color='rebeccapurple' />
        <BrowserButton iconOnly iconClass={globalStyles.appIcons.closeTab} size='45px' color='#c1c1c1' />
        <BrowserButton iconOnly iconClass={globalStyles.appIcons.private} size='60px' color='red' />
        <Pre><Code>
          &lt;BrowserButton iconOnly icon={'{'}globalStyles.appIcons.private{'}'} size='30px' color='rebeccapurple' />{'\n'}
          &lt;BrowserButton iconOnly icon={'{'}globalStyles.appIcons.private{'}'} size='45px' color='#c1c1c1' />{'\n'}
          &lt;BrowserButton iconOnly icon={'{'}globalStyles.appIcons.private{'}'} size='60px' color='red' />
        </Code></Pre>

        <BrowserButton groupedItem primaryColor panelItem l10nId='panelItem' onClick={this.copyToClipboard} />
        <BrowserButton groupedItem primaryColor panelItem l10nId='panelItem' onClick={this.props.showQRcode} />
        <Pre><Code>
          &lt;BrowserButton groupedItem primaryColor panelItem l10nId='panelItem' onClick={'{this.copyToClipboard}'} />{'\n'}
          &lt;BrowserButton groupedItem primaryColor panelItem l10nId='panelItem' onClick={'{this.props.showQRcode}'} />
        </Code></Pre>

        <GoTop />
      </div>

      <hr />

      <div id='commonForm'>
        <h1>CommonForm</h1>

        <Container>
          <div style={{
            height: '430px',
            position: 'relative',
            bottom: '40px'
          }}>
            <CommonForm>
              <CommonFormTitle>CommonFormTitle</CommonFormTitle>
              <CommonFormSection>
                CommonFormSection - Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut
                labore et dolore magna aliqua.
              </CommonFormSection>
              <CommonFormSection>
                <CommonFormDropdown>
                  <option value='CommonFormDropdown'>CommonFormDropdown</option>
                </CommonFormDropdown>
              </CommonFormSection>
              <CommonFormSection>
                <CommonFormSubSection>CommonFormSubSection</CommonFormSubSection>
                <CommonFormSubSection>
                  <CommonFormDropdown>
                    <option value='CommonFormDropdown'>CommonFormDropdown</option>
                  </CommonFormDropdown>
                </CommonFormSubSection>
              </CommonFormSection>
              <CommonFormSection>
                CommonFormSection - Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut
                labore et dolore magna aliqua.
              </CommonFormSection>
              <CommonFormButtonWrapper>
                <BrowserButton groupedItem secondaryColor l10nId='Cancel' />
                <BrowserButton groupedItem primaryColor l10nId='Done' />
              </CommonFormButtonWrapper>
              <CommonFormBottomWrapper>
                <CommonFormClickable>CommonFormClickable</CommonFormClickable>
              </CommonFormBottomWrapper>
            </CommonForm>
          </div>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>CommonForm,{'\n'}</Tab>
            <Tab>CommonFormTitle,{'\n'}</Tab>
            <Tab>CommonFormSection,{'\n'}</Tab>
            <Tab>CommonFormDropdown,{'\n'}</Tab>
            <Tab>CommonFormClickable,{'\n'}</Tab>
            <Tab>CommonFormSubSection,{'\n'}</Tab>
            <Tab>CommonFormButtonWrapper,{'\n'}</Tab>
            <Tab>CommonFormBottomWrapper{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/commonForm'){'\n'}
            {'\n'}
            &lt;CommonForm&gt;{'\n'}
            <Tab>&lt;CommonFormTitle&gt;CommonFormTitle&lt;/CommonFormTitle&gt;{'\n'}</Tab>
            <Tab>&lt;CommonFormSection&gt;{'\n'}</Tab>
            <Tab2>CommonFormSection - Lorem ipsum dolor sit amet, consectetur adipisicing elit,{'\n'}</Tab2>
            <Tab2>sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.{'\n'}</Tab2>
            <Tab>&lt;/CommonFormSection&gt;{'\n'}</Tab>
            <Tab>&lt;CommonFormSection&gt;{'\n'}</Tab>
            <Tab2>&lt;CommonFormDropdown&gt;{'\n'}</Tab2>
            <Tab3>&lt;option value='CommonFormDropdown'&gt;CommonFormDropdown&lt;/option&gt;{'\n'}</Tab3>
            <Tab2>&lt;/CommonFormDropdown&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormSection&gt;{'\n'}</Tab>
            <Tab>&lt;CommonFormSection&gt;{'\n'}</Tab>
            <Tab2>&lt;CommonFormSubSection&gt;CommonFormSubSection&lt;/CommonFormSubSection&gt;{'\n'}</Tab2>
            <Tab2>&lt;CommonFormSubSection&gt;{'\n'}</Tab2>
            <Tab3>&lt;CommonFormDropdown&gt;{'\n'}</Tab3>
            <Tab4>&lt;option value='CommonFormDropdown'&gt;CommonFormDropdown&lt;/option&gt;{'\n'}</Tab4>
            <Tab3>&lt;/CommonFormDropdown&gt;{'\n'}</Tab3>
            <Tab2>&lt;/CommonFormSubSection&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormSection&gt;{'\n'}</Tab>
            <Tab>&lt;CommonFormSection&gt;{'\n'}</Tab>
            <Tab2>CommonFormSection - Lorem ipsum dolor sit amet, consectetur adipisicing elit,{'\n'}</Tab2>
            <Tab2>sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.{'\n'}</Tab2>
            <Tab>&lt;/CommonFormSection&gt;{'\n'}</Tab>
            <Tab>&lt;CommonFormButtonWrapper&gt;{'\n'}</Tab>
            <Tab2>&lt;BrowserButton groupedItem secondaryColor l10nId='Cancel' /&gt;{'\n'}</Tab2>
            <Tab2>&lt;BrowserButton groupedItem primaryColor l10nId='Done' /&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormButtonWrapper&gt;{'\n'}</Tab>
            <Tab>&lt;CommonFormBottomWrapper&gt;{'\n'}</Tab>
            <Tab2>&lt;CommonFormClickable&gt;CommonFormClickable&lt;/CommonFormClickable&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormBottomWrapper&gt;{'\n'}</Tab>
            &lt;/CommonForm&gt;{'\n'}
          </Code></Pre>
        </Container>

        <Container>
          <h2>Title</h2>
          <div style={{
            height: '60px',
            position: 'relative',
            bottom: '40px'
          }}>
            <CommonForm>
              <CommonFormTitle>CommonFormTitle</CommonFormTitle>
            </CommonForm>
          </div>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>CommonForm,{'\n'}</Tab>
            <Tab>CommonFormTitle{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/commonForm'){'\n'}
            {'\n'}
            &lt;CommonForm&gt;{'\n'}
            <Tab>&lt;CommonFormTitle&gt;CommonFormTitle&lt;/CommonFormTitle&gt;{'\n'}</Tab>
            &lt;/CommonForm&gt;{'\n'}
          </Code></Pre>
        </Container>

        <Container>
          <h2>Section</h2>
          <div style={{
            height: '90px',
            position: 'relative',
            bottom: '40px'
          }}>
            <CommonForm>
              <CommonFormSection>
                CommonFormSection - Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut
                labore et dolore magna aliqua.
              </CommonFormSection>
            </CommonForm>
          </div>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>CommonForm,{'\n'}</Tab>
            <Tab>CommonFormSection{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/commonForm'){'\n'}
            {'\n'}
            &lt;CommonForm&gt;{'\n'}
            <Tab>&lt;CommonFormSection&gt;{'\n'}</Tab>
            <Tab2>CommonFormSection - Lorem ipsum dolor sit amet, consectetur adipisicing elit,{'\n'}</Tab2>
            <Tab2>sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.{'\n'}</Tab2>
            <Tab>&lt;/CommonFormSection&gt;{'\n'}</Tab>
            &lt;/CommonForm&gt;{'\n'}
          </Code></Pre>
        </Container>

        <Container>
          <h2>Dropdown</h2>
          <div style={{
            height: '70px',
            position: 'relative',
            bottom: '40px'
          }}>
            <CommonForm>
              <CommonFormSection>
                <CommonFormDropdown>
                  <option value='CommonFormDropdown'>CommonFormDropdown</option>
                </CommonFormDropdown>
              </CommonFormSection>
            </CommonForm>
          </div>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>CommonForm,{'\n'}</Tab>
            <Tab>CommonFormSection,{'\n'}</Tab>
            <Tab>CommonFormDropdown{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/commonForm'){'\n'}
            {'\n'}
            &lt;CommonForm&gt;{'\n'}
            <Tab>&lt;CommonFormSection&gt;{'\n'}</Tab>
            <Tab2>&lt;CommonFormDropdown&gt;{'\n'}</Tab2>
            <Tab3>&lt;option value='CommonFormDropdown'&gt;CommonFormDropdown&lt;/option&gt;{'\n'}</Tab3>
            <Tab2>&lt;/CommonFormDropdown&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormSection&gt;{'\n'}</Tab>
            &lt;/CommonForm&gt;{'\n'}
          </Code></Pre>
        </Container>

        <Container>
          <h2>Sub sections with a dropdown</h2>
          <div style={{
            height: '110px',
            position: 'relative',
            bottom: '40px'
          }}>
            <CommonForm>
              <CommonFormSection>
                <CommonFormSubSection>CommonFormSubSection</CommonFormSubSection>
                <CommonFormSubSection>
                  <CommonFormDropdown>
                    <option value='CommonFormDropdown'>CommonFormDropdown</option>
                  </CommonFormDropdown>
                </CommonFormSubSection>
              </CommonFormSection>
            </CommonForm>
          </div>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>CommonForm,{'\n'}</Tab>
            <Tab>CommonFormSection,{'\n'}</Tab>
            <Tab>CommonFormSubSection,{'\n'}</Tab>
            <Tab>CommonFormDropdown{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/commonForm'){'\n'}
            {'\n'}
            &lt;CommonForm&gt;{'\n'}
            <Tab>&lt;CommonFormSection&gt;{'\n'}</Tab>
            <Tab2>&lt;CommonFormSubSection&gt;CommonFormSubSection&lt;/CommonFormSubSection&gt;{'\n'}</Tab2>
            <Tab2>&lt;CommonFormSubSection&gt;{'\n'}</Tab2>
            <Tab3>&lt;CommonFormDropdown&gt;{'\n'}</Tab3>
            <Tab4>&lt;option value='CommonFormDropdown'&gt;CommonFormDropdown&lt;/option&gt;{'\n'}</Tab4>
            <Tab3>&lt;/CommonFormDropdown&gt;{'\n'}</Tab3>
            <Tab2>&lt;/CommonFormSubSection&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormSection&gt;{'\n'}</Tab>
            &lt;/CommonForm&gt;{'\n'}
          </Code></Pre>
        </Container>

        <Container>
          <h2>Button wrapper</h2>
          <div style={{
            height: '70px',
            position: 'relative',
            bottom: '40px'
          }}>
            <CommonForm>
              <CommonFormButtonWrapper>
                <BrowserButton groupedItem secondaryColor l10nId='Cancel' />
                <BrowserButton groupedItem primaryColor l10nId='Done' />
              </CommonFormButtonWrapper>
            </CommonForm>
          </div>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>CommonForm,{'\n'}</Tab>
            <Tab>CommonFormButtonWrapper{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/commonForm'){'\n'}
            {'\n'}
            &lt;CommonForm&gt;{'\n'}
            <Tab>&lt;CommonFormButtonWrapper&gt;{'\n'}</Tab>
            <Tab2>&lt;BrowserButton groupedItem secondaryColor l10nId='Cancel' /&gt;{'\n'}</Tab2>
            <Tab2>&lt;BrowserButton groupedItem primaryColor l10nId='Done' /&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormButtonWrapper&gt;{'\n'}</Tab>
            &lt;/CommonForm&gt;{'\n'}
          </Code></Pre>
        </Container>

        <Container>
          <h2>Bottom wrapper with a clickable element</h2>
          <div style={{
            height: '60px',
            position: 'relative',
            bottom: '40px'
          }}>
            <CommonForm>
              <CommonFormBottomWrapper>
                <CommonFormClickable>CommonFormClickable</CommonFormClickable>
              </CommonFormBottomWrapper>
            </CommonForm>
          </div>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>CommonForm,{'\n'}</Tab>
            <Tab>CommonFormBottomWrapper,{'\n'}</Tab>
            <Tab>CommonFormClickable{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/commonForm'){'\n'}
            {'\n'}
            &lt;CommonForm&gt;{'\n'}
            <Tab>&lt;CommonFormBottomWrapper&gt;{'\n'}</Tab>
            <Tab2>&lt;CommonFormClickable&gt;CommonFormClickable&lt;/CommonFormClickable&gt;{'\n'}</Tab2>
            <Tab>&lt;/CommonFormBottomWrapper&gt;{'\n'}</Tab>
            &lt;/CommonForm&gt;{'\n'}
          </Code></Pre>
        </Container>

        <GoTop />
      </div>

      <hr />

      <div id='sectionTitle'>
        <h1>Section title</h1>

        <Container>
          <h2>Default section title</h2>

          <DefaultSectionTitle>General Settings on about:preferences</DefaultSectionTitle>

          <Pre><Code>
            const &#123;DefaultSectionTitle&#125; = require('../../app/renderer/components/common/sectionTitle'){'\n'}
            {'\n'}
            &lt;DefaultSectionTitle&gt;General Settings on about:preferences&lt;/DefaultSectionTitle&gt;{'\n'}
          </Code></Pre>
        </Container>

        <Container>
          <h2>About page section title</h2>

          <SectionTitleWrapper>
            <AboutPageSectionTitle>Brave Sync</AboutPageSectionTitle>
          </SectionTitleWrapper>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>SectionTitleWrapper,{'\n'}</Tab>
            <Tab>AboutPageSectionTitle{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/sectionTitle'){'\n'}
            {'\n'}
            &lt;SectionTitleWrapper&gt;{'\n'}
            <Tab>&lt;AboutPageSectionTitle&gt;Brave Sync&lt;/AboutPageSectionTitle&gt;{'\n'}</Tab>
            &lt;/SectionTitleWrapper&gt;
          </Code></Pre>
        </Container>

        <Container>
          <h2>About page section title + beta label</h2>

          <SectionTitleLabelWrapper>
            <AboutPageSectionTitle>Brave Payments</AboutPageSectionTitle>
            <SectionLabelTitle>beta</SectionLabelTitle>
          </SectionTitleLabelWrapper>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>SectionTitleLabelWrapper,{'\n'}</Tab>
            <Tab>AboutPageSectionTitle,{'\n'}</Tab>
            <Tab>SectionLabelTitle{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/sectionTitle'){'\n'}
            {'\n'}
            &lt;SectionTitleLabelWrapper&gt;{'\n'}
            <Tab>&lt;AboutPageSectionTitle&gt;Brave Payments&lt;/AboutPageSectionTitle&gt;{'\n'}</Tab>
            <Tab>&lt;SectionLabelTitle&gt;beta&lt;/SectionLabelTitle&gt;{'\n'}</Tab>
            &lt;/SectionTitleLabelWrapper&gt;
          </Code></Pre>
        </Container>

        <Container>
          <h2>About page section title + sub title</h2>

          <SectionTitleWrapper>
            <AboutPageSectionTitle>History</AboutPageSectionTitle>
          </SectionTitleWrapper>

          <AboutPageSectionSubTitle>Today</AboutPageSectionSubTitle>

          <Pre><Code>
            const &#123;{'\n'}
            <Tab>SectionTitleWrapper,{'\n'}</Tab>
            <Tab>AboutPageSectionTitle,{'\n'}</Tab>
            <Tab>AboutPageSectionSubTitle{'\n'}</Tab>
            &#125; = require('../../app/renderer/components/common/sectionTitle'){'\n'}
            {'\n'}
            &lt;SectionTitleWrapper&gt;{'\n'}
            <Tab>&lt;AboutPageSectionTitle&gt;About Brave&lt;/AboutPageSectionTitle&gt;{'\n'}</Tab>
            &lt;/SectionTitleWrapper&gt;{'\n'}
            {'\n'}
            &lt;AboutPageSectionSubTitle&gt;Today&lt;/AboutPageSectionSubTitle&gt;{'\n'}
          </Code></Pre>
        </Container>

        <GoTop />
      </div>
    </div>
  }
}

const common = {
  maxWidth: '800px',
  margin: '0 auto'
}

const tabWidth = '1em'

const styles = StyleSheet.create({
  flexJustifyEnd: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  fontSizeInitial: {
    fontSize: 'initial'
  },
  toc__marginBottom: {
    marginBottom: '.25rem'
  },

  wrapper: common,
  container: common,

  pre: {
    background: '#1d1f21',
    color: '#fff',
    fontSize: '14px',
    padding: '1rem',
    borderRadius: globalStyles.radius.borderRadius,
    tabSize: '2',
    wordBreak: 'normal',
    overflowX: 'scroll'
  },

  code: {
    fontFamily: 'monospace',
    whiteSpace: 'pre'
  },

  goTop: {
    fontSize: '1rem',
    margin: '1rem 0'
  },

  tab: {
    textIndent: tabWidth
  },
  tab2: {
    textIndent: `calc(${tabWidth} * 2)`
  },
  tab3: {
    textIndent: `calc(${tabWidth} * 3)`
  },
  tab4: {
    textIndent: `calc(${tabWidth} * 4)`
  }
})

module.exports = <AboutStyle />
