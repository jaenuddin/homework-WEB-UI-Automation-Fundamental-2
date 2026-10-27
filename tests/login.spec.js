const assert = require('node:assert/strict');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { LoginPage, InventoryPage } = require('../pages/login.page');
const { assertVisualMatch } = require('./helpers/visual');

describe('SauceDemo login', function () {
  this.timeout(30000);

  let driver;

  beforeEach(async function () {
    const options = new chrome.Options();
    options.addArguments(
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--force-device-scale-factor=1',
      '--window-size=1365,900',
    );
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().window().setRect({ width: 1365, height: 900, x: 0, y: 0 });
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
      driver = undefined;
    }
  });

  it('positive: login success', async function () {
    await new LoginPage(driver).open().then((page) => page.login('standard_user', 'secret_sauce'));
    const inventory = await new InventoryPage(driver).waitUntilLoaded();

    assert.ok((await driver.getCurrentUrl()).endsWith('/inventory.html'));
    assert.equal(await inventory.getTitle(), 'Products');
    assert.equal(await inventory.getItemCount(), 6);
    await assertVisualMatch(driver, 'login-success', assert);
  });

  it('negative: invalid username', async function () {
    const loginPage = await new LoginPage(driver).open();
    await loginPage.login('invalid_user', 'secret_sauce');

    assert.equal(
      await loginPage.getErrorMessage(),
      'Epic sadface: Username and password do not match any user in this service',
    );
    assert.ok((await driver.getCurrentUrl()).startsWith('https://www.saucedemo.com/'));
    await assertVisualMatch(driver, 'invalid-username', assert);
  });

  it('negative: wrong password', async function () {
    const loginPage = await new LoginPage(driver).open();
    await loginPage.login('standard_user', 'wrong_password');

    assert.equal(
      await loginPage.getErrorMessage(),
      'Epic sadface: Username and password do not match any user in this service',
    );
    assert.ok((await driver.getCurrentUrl()).startsWith('https://www.saucedemo.com/'));
    await assertVisualMatch(driver, 'wrong-password', assert);
  });

  it('negative: locked_out_user', async function () {
    const loginPage = await new LoginPage(driver).open();
    await loginPage.login('locked_out_user', 'secret_sauce');

    assert.equal(
      await loginPage.getErrorMessage(),
      'Epic sadface: Sorry, this user has been locked out.',
    );
    assert.ok((await driver.getCurrentUrl()).startsWith('https://www.saucedemo.com/'));
    await assertVisualMatch(driver, 'locked-out-user', assert);
  });
});
