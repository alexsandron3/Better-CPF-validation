// Libs
const puppeteer = require('puppeteer');
require('dotenv').config();
const express = require('express');
const app = express();
const chromium = require('chrome-aws-lambda');

app.use(express.json());

// Script initial setup;
const END_POINT =
  'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp';

const timeout = 180000; // in milliseconds

/*
  if you are using environment variables 
  const CPF = process.env.CPF;
  const BIRTH_DAY = process.env.BIRTH_DAY;
*/
const PORT = process.env.PORT || 7000;

const IS_CAPTCHA_FILLED =
  'document.querySelector("[data-hcaptcha-response]").dataset.hcaptchaResponse !== ""';
const USER_SITUATION_SELECTOR =
  '#mainComp > div:nth-child(3) > p > span:nth-child(10)';

// Express server
app.listen(PORT, function () {
  console.log(`Running on port 7000.`);
});

app.post('/', (req, res) => {
  const { CPF, BIRTH_DAY } = req.body;
  const main = async () => {
    try {
      // Browser config
      const browser = await chromium.puppeteer.launch({
        headless: false,
        // args: [
        //   '--no-sandbox',
        //   '--disable-setuid-sandbox',
        //   '--disable-dev-shm-usage',
        // ],
      });
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
      );
      // Fill form
      await page.goto(END_POINT);
      await page.type('#txtCPF', CPF);
      await page.type('#txtDataNascimento', BIRTH_DAY);
      await page.waitForFunction(IS_CAPTCHA_FILLED, { timeout });

      // Send data
      const submitData = await page.$('#id_submit');
      await submitData.click();
      await page.waitForSelector(USER_SITUATION_SELECTOR, { timeout });
      // Verify user situtation
      const elementUserSituation = await page.$(USER_SITUATION_SELECTOR);
      const textUserSituation = await page.evaluate(
        (element) => element.textContent,
        elementUserSituation,
      );
      const isUserRegular = textUserSituation === 'Situação Cadastral: REGULAR';
      await browser.close();
      res.send({ isUserRegular });
    } catch (error) {
      console.error(error);
    }
  };
  main();
});
