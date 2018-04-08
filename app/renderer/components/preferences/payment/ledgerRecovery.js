/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 const React = require('react')
 const {StyleSheet, css} = require('aphrodite/no-important')
 
 // util
 const {batToCurrencyString} = require('../../../../common/lib/ledgerUtil')
 
 // components
 const ImmutableComponent = require('../../immutableComponent')
 const BrowserButton = require('../../common/browserButton')
 const {SettingsList, SettingItem} = require('../../common/settings')
 
 // style
 const globalStyles = require('../../styles/global')
 const commonStyles = require('../../styles/commonStyles')
 
 // other
 const aboutActions = require('../../../../../js/about/aboutActions')
 const appActions = require('../../../../../js/actions/appActions')
 
 class LedgerRecoveryContent extends ImmutableComponent {
   constructor () {
     super()
     this.handleRecoveryKeyChange = this.handleRecoveryKeyChange.bind(this)
   }
 
   handleRecoveryKeyChange (e) {
     this.props.handleRecoveryKeyChange(e.target.value)
   }
 
   clearRecoveryStatus (success) {
     if (success) {
       this.props.hideAdvancedOverlays()
     }
     appActions.resetRecoverStatus()
   }
 
   render () {
     const l10nDataArgs = {
       balance: batToCurrencyString(this.props.ledgerData.get('balance'), this.props.ledgerData)
     }
     const recoverySucceeded = this.props.ledgerData.get('recoverySucceeded')
     const recoveryError = this.props.ledgerData.getIn(['error', 'error'])
     const isNetworkError = typeof recoveryError === 'object'
 
     return <section>
       {
         recoverySucceeded === true
           ? <section className={css(styles.recoveryOverlay)}>
             <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoverySucceeded' />
             <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
               data-l10n-id='balanceRecovered'
               data-test-id='balanceRecoveredMessage'
               data-l10n-args={JSON.stringify(l10nDataArgs)}
             />
             <BrowserButton secondaryColor
               l10nId='ok'
               testId='recoveryOverlayOkButton'
               onClick={this.clearRecoveryStatus.bind(this, true)}
             />
           </section>
           : null
       }
       {
         (recoverySucceeded === false && recoveryError && isNetworkError)
           ? <section className={css(styles.recoveryOverlay)}>
             <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoveryNetworkFailedTitle' data-test-id='recoveryError' />
             <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
               data-l10n-id='ledgerRecoveryNetworkFailedMessage'
               data-test-id='ledgerRecoveryFailedMessage'
             />
             <BrowserButton secondaryColor
               l10nId='ok'
               testId='recoveryOverlayErrorButton'
               onClick={this.clearRecoveryStatus.bind(this, false)}
             />
           </section>
           : null
       }
       {
         (recoverySucceeded === false && recoveryError && !isNetworkError)
           ? <section className={css(styles.recoveryOverlay)}>
             <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoveryFailedTitle' />
             <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
               data-l10n-id='ledgerRecoveryFailedMessage'
               data-test-id='ledgerRecoveryFailedMessage'
             />
             <BrowserButton secondaryColor
               l10nId='ok'
               testId='recoveryOverlayErrorButton'
               onClick={this.clearRecoveryStatus.bind(this, false)}
             />
           </section>
           : null
       }
       <h4 className={css(styles.recoveryContent__h4)} data-l10n-id='ledgerRecoverySubtitle' />
       <SettingsList className={css(commonStyles.noMarginBottom)}>
         <SettingItem>
           <textarea className={css(
             commonStyles.formControl,
             commonStyles.textArea,
             styles.recoveryContent__recoveryKey
           )}
             id='recoveryKey'
             spellCheck='false'
             onChange={this.handleRecoveryKeyChange}
           />
         </SettingItem>
         {/* default properties file is GB, create a ledgerRecoveryContent, runtime will pull out string based on localization ID */}
        <h5 className={css(styles.ledgerRecoveryContent__p) } data-l10n-id='ledgerRecoveryContentSubtitle'/>
      </SettingsList>
     </section>
   }
 }
 
 class LedgerRecoveryFooter extends ImmutableComponent {
   constructor () {
     super()
     this.recoverWallet = this.recoverWallet.bind(this)
   }
 
   recoverWallet () {
     aboutActions.ledgerRecoverWallet(this.props.state.recoveryKey)
   }
 
   recoverWalletFromFile () {
     aboutActions.ledgerRecoverWalletFromFile()
   }
 
   render () {
     return <div>
       <BrowserButton groupedItem primaryColor
         l10nId='recover'
         testId='recoverButton'
         onClick={this.recoverWallet}
         custom={styles.recover__button}        
       />
       <BrowserButton groupedItem secondaryColor
         l10nId='recoverFromFile'
         testId='recoverFromFileButton'
         onClick={this.recoverWalletFromFile}
         custom={styles.recoverFromFile__button}
         />
       <BrowserButton groupedItem secondaryColor
         l10nId='cancel'
         testId='cancelButton'
         onClick={this.props.hideOverlay.bind(this, 'ledgerRecovery')}
         custom={styles.cancel__button}        
       />
     </div>
   }
 }
 
 const styles = StyleSheet.create({
   recoveryContent__h4: {
     marginBottom: globalStyles.spacing.dialogInsideMargin
   },
   recoveryContent__h3: {
     marginBottom: globalStyles.spacing.modalPanelHeaderMarginBottom
   },
   recoveryContent__recoveryKey: {
     height: '65px'
   },
   ledgerRecoveryContent: {
     marginBottom: globalStyles.spacing.dialogInsideMargin
   },
   recoverFromFile__button: {
     right: '410px',
   },
   recover__button: {
     left: '250px',
   },
   cancel__button: {
     right: '100px',
   },
 
   ledgerRecoveryContent__p: {
     fontSize: '14px',
   },
 
   recoveryOverlay: {
     display: 'flex',
     flexFlow: 'column',
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: globalStyles.color.black75,
     border: `1px solid ${globalStyles.color.black75}`,
     position: 'absolute',
     top: '-1px',
     left: '-1px',
     width: '100%',
     height: '100%',
     zIndex: 999
   },
   recoveryOverlay__textColor: {
     color: '#DC143C'
   },
   recoveryOverlay__spaceAround: {
     margin: '50px auto'
   }
 })
 
 module.exports = {
   LedgerRecoveryContent,
   LedgerRecoveryFooter
 }
 