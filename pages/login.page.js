const { By, until } = require('selenium-webdriver');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.url = 'https://www.saucedemo.com/';
    this.usernameInput = By.id('user-name');
    this.passwordInput = By.id('password');
    this.loginButton = By.id('login-button');
    this.error = By.css("h3[data-test='error']");
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.usernameInput), 10000);
    return this;
  }

  async login(username, password) {
    const usernameField = await this.driver.findElement(this.usernameInput);
    const passwordField = await this.driver.findElement(this.passwordInput);
    await usernameField.clear();
    await usernameField.sendKeys(username);
    await passwordField.clear();
    await passwordField.sendKeys(password);
    await this.driver.findElement(this.loginButton).click();
    return this;
  }

  async getErrorMessage() {
    const error = await this.driver.wait(until.elementLocated(this.error), 10000);
    await this.driver.wait(until.elementIsVisible(error), 5000);
    return error.getText();
  }
}

class InventoryPage {
  constructor(driver) {
    this.driver = driver;
    this.title = By.css('.title');
    this.items = By.css('.inventory_item');
  }

  async waitUntilLoaded() {
    await this.driver.wait(until.elementLocated(this.title), 10000);
    return this;
  }

  async getTitle() {
    return (await this.driver.findElement(this.title)).getText();
  }

  async getItemCount() {
    return (await this.driver.findElements(this.items)).length;
  }
}

module.exports = { LoginPage, InventoryPage };
