const webdriver = require('selenium-webdriver');

var driver = new webdriver.Builder()
  // The "9515" is the port opened by chrome driver.
  .usingServer('http://localhost:9515')
  .withCapabilities({
    chromeOptions: {
      // Here is the path to your Electron binary.
      binary: 'Brave-darwin-x64/Brave.app/Contents/MacOS/Electron',
    }
  })
  .forBrowser('electron')
  .build();

driver.findElement(webdriver.By.css('body')).getAttribute("innerHTML").then((html) => {
  console.log('HTML is:', html)  
});

driver.quit();
