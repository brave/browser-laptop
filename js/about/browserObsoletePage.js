const React = require('react')
const BrowserButton = require('../../app/renderer/components/common/browserButton')
const logoUrl = require('./browserObsoleteComponents/logo.svg')

module.exports = function BrowserObsoletePage ({
  onObsoleteActionClick,
  obsoleteActionText
}) {
  if (!onObsoleteActionClick || !obsoleteActionText) {
    throw new Error('BrowserObsoletePage props not passed correctly')
  }
  return (
    <div className={'obsolete'}>
      <aside className={'obsolete_logo'}><img alt='Brave Logo' src={logoUrl} /></aside>
      <h1 className={'obsolete_title'}>Yeah! Congrats, you made it.</h1>
      <p className={'obsolete_paragraph'}>
        You made it to the last day that we can allow you to safely use this old version of Brave.
      </p>
      <p className={'obsolete_paragraph'}>
        Your safety and privacy on the web is our top priority. Download the new Brave browser to continue on this journey with us to fix the web.
      </p>
      <p className={'obsolete_paragraph'}>
        You'll be able to import all of your data from this browser, including bookmarks, passwords, and Brave Payments wallet.
      </p>
      <p className={'obsolete_paragraph'}>
        Thank you for the continued support.
      </p>
      <p className={'obsolete_paragraph'}>
        - Brave Product Team
      </p>
      <div className={'obsolete_actions'}>
        <BrowserButton
          primaryColor
          l10nId={obsoleteActionText}
          onClick={onObsoleteActionClick}
        />
        <a
          className={'obsolete_learn-more-link'}
          href={'https://support.brave.com/hc/en-us/articles/360018538092'}
        >
          Learn more…
        </a>
      </div>
    </div>
  )
}
