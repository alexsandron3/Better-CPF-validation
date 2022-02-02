// Script initial setup;
const puppeteer = require('puppeteer');
require('dotenv').config();

const END_POINT = 'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp';

const timeout = 180000; // in milliseconds

const CPF = process.env.CPF;
const BIRTH_DAY = process.env.BIRTH_DAY;

const IS_CAPTCHA_FILLED = 'document.querySelector("[data-hcaptcha-response]").dataset.hcaptchaResponse !== ""';
const USER_SITUATION_SELECTOR = '#mainComp > div:nth-child(3) > p > span:nth-child(10)';
  (
    async () => {

      // Browser config
      const browser = await puppeteer.launch({
        headless: false,
      });
      const page = await browser.newPage();

      // Fill form
      await page.goto(END_POINT);
      await page.type('#txtCPF', CPF);
      await page.type('#txtDataNascimento', BIRTH_DAY);
      await page.waitForFunction(IS_CAPTCHA_FILLED, { timeout });

      // Send data
      const submitData = await page.$('#id_submit');
      await submitData.click();
      await page.waitForSelector(
        USER_SITUATION_SELECTOR,
        { timeout },
      );
      // Verify user situtation
      const elementUserSituation = await page.$(USER_SITUATION_SELECTOR);
      const textUserSituation = await page.evaluate(
        (element) => element.textContent,
        elementUserSituation,
      );
      const isUserRegular = textUserSituation === 'Situação Cadastral: REGULAR';
      console.log(isUserRegular);
      await browser.close();
    },
  )();