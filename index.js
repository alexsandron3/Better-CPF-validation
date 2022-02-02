// Libs
const puppeteer = require('puppeteer');
require('dotenv').config();
const express = require('express');
const app = express();
const axios = require('axios');

app.use(express.json());

// Script initial setup;
const END_POINT =
  'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp';

const CAPTCHA_VALIDATION_END_POINT = 'https://api.anycaptcha.com';
const timeout = 180000; // in milliseconds
const PORT = process.env.PORT || 7000;
const SECRET = process.env.SECRET;

const IS_CAPTCHA_FILLED =
  'document.querySelector("[data-hcaptcha-response]").dataset.hcaptchaResponse !== ""';
const USER_SITUATION_SELECTOR =
  '#mainComp > div:nth-child(3) > p > span:nth-child(10)';
// Express server
app.listen(PORT, function () {
  console.log(`Running on port ${PORT}`);
});

app.post('/', (req, res) => {
  const { CPF, BIRTH_DAY } = req.body;
  const main = async () => {
    try {
      // Browser config
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      });
      const page = await browser.newPage();
      page.setViewport({ width: 800, height: 600 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
      );
      // Fill form
      console.log('Step 1: Fill form with POST data');
      await page.goto(END_POINT);
      await page.type('#txtCPF', CPF);
      await page.type('#txtDataNascimento', BIRTH_DAY);

      // Fill captcha
      console.log('Step 2: Fill captcha');
      await page.waitForSelector('#id_captchasonoro');
      const buttonCptToText = await page.$('#id_captchasonoro');
      await buttonCptToText.click();
      await page.waitForSelector('#imgCaptcha');
      const imgCaptcha = await page.$('#imgCaptcha');
      const imgSrc = await page.evaluate(
        (imgCaptcha) => imgCaptcha.getAttribute('src'),
        imgCaptcha,
      );
      const base64Img = imgSrc.split('base64,').pop();
      const requestBody = {
        clientKey: SECRET,
        task: {
          type: 'ImageToTextTask',
          body: base64Img,
        },
      };
      const {
        data: { taskId },
      } = await axios.post(`${CAPTCHA_VALIDATION_END_POINT}/createTask`, {
        ...requestBody,
      });

      const get = async () => {
        console.log('Trying to resolve CAPTCHA');
        const { data } = await axios.post(
          `${CAPTCHA_VALIDATION_END_POINT}/getTaskResult`,
          {
            clientKey: SECRET,
            taskId,
          },
        );
        try {
          if (!data.solution) {
            setTimeout(() => {
              get();
            }, 10000);
          } else {
            const { text } = data.solution;
            page.type('#txtTexto_captcha_serpro_gov_br', text);
            await page.waitForTimeout(1000);
            // Send data
            console.log('Step 3: Sending data do RF');
            const submitData = await page.$('#id_submit');
            await submitData.click();
            await page.waitForSelector(USER_SITUATION_SELECTOR, { timeout });
            // Verify user situtation
            console.log('Step 4: Verify user situtation');
            const elementUserSituation = await page.$(USER_SITUATION_SELECTOR);
            const textUserSituation = await page.evaluate(
              (element) => element.textContent,
              elementUserSituation,
            );
            const isUserRegular =
              textUserSituation === 'Situação Cadastral: REGULAR';

            res.send({ isUserRegular });
            console.log({ isUserRegular });
            await browser.close();
          }
        } catch (error) {
          console.error(error);
        }
      };
      get();
    } catch (error) {
      console.error(error);
    }
  };
  main();
});
