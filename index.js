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
const timeout = 800; // in milliseconds
const PORT = process.env.PORT || 7000;
const SECRET = process.env.SECRET;

const IS_CAPTCHA_FILLED =
  'document.querySelector("[data-hcaptcha-response]").dataset.hcaptchaResponse !== ""';
const USER_SITUATION_SELECTOR =
  '#mainComp > div:nth-child(3) > p > span:nth-child(10)';

const USER_INVALID_DATA_SELECTOR =
  '#content-core > div > div > div.clConteudoCentro > span > h4';

// Express server
app.listen(PORT, function () {
  console.log(`Running on port ${PORT}`);
});

app.post('/', (req, res) => {
  console.clear();
  process.stdout.write('\x1Bc');
  const { CPF, BIRTH_DAY } = req.body;

  // Format data
  const regexOnlyNumbers = /\d+/g;
  const formatedCpf = CPF.match(regexOnlyNumbers).join('');
  const formatedBirthday = BIRTH_DAY.match(regexOnlyNumbers).join('');

  // Verify that the data is correct
  const isCpfInvalid = formatedCpf.length !== 11;
  const isBirthdayInvalid = formatedBirthday.length !== 8;
  if (isCpfInvalid) return res.send({ Message: 'Cpf inválido', status: 0 });
  if (isBirthdayInvalid)
    return res.send({ Message: 'Data de aniversário inválida', status: 0 });

  const main = async () => {
    try {
      // Browser config
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
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
      await page.type('#txtCPF', formatedCpf);
      await page.type('#txtDataNascimento', formatedBirthday);

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
            }, 500);
          } else {
            const { text } = data.solution;
            page.type('#txtTexto_captcha_serpro_gov_br', text);
            await page.waitForTimeout(100);
            // Send data
            const submitData = await page.$('#id_submit');
            await submitData.click();

            try {
              await page.waitForSelector('#idMensagemErro > span', { timeout });
              console.log('CAPTCHA FAILED');
              process.stdout.write('\x1Bc');

              await browser.close();
              main();
              return 0;
            } catch (error) {
              console.log('CAPTCHA SUCCESS');
              console.log('Step 3: Sending data to RF');
            }
            try {
              await page.waitForSelector(USER_SITUATION_SELECTOR, { timeout });
            } catch (error) {
              console.log('CPF OR BIRTH_DAY NOT VALID');
            }

            // Verify user situtation
            console.log('Step 4: Verify user situtation');
            let textUserSituation = '';

            // CPF and BIRTH_DAY is valid
            try {
              const elementUserSituation = await page.$(
                USER_SITUATION_SELECTOR,
              );
              textUserSituation = await page.evaluate(
                (element) => element.textContent,
                elementUserSituation,
              );
            } catch (error) {
              // CPF OR BIRTH_DAY is invalid
              const elementUserSituation = await page.$(
                USER_INVALID_DATA_SELECTOR,
              );
              textUserSituation = await page.evaluate(
                (element) => element.textContent,
                elementUserSituation,
              );
            }

            const isUserRegular = textUserSituation.includes('REGULAR');
            const isUserPending = textUserSituation.includes('PENDENTE');
            const isUserSuspended = textUserSituation.includes('SUSPENSO');
            const invalidCpf = textUserSituation.includes('CPF');
            const invalidBirthDate =
              textUserSituation.includes('Data de nascimento');

            const userSituation = () => {
              if (isUserRegular) return 'REGULAR';
              if (isUserPending) return 'PENDENTE';
              if (isUserSuspended) return 'SUSPENSO';
              if (invalidCpf) return 'CPF INCORRETO';
              if (invalidBirthDate) return 'DATA DE NASCIMENTO INCORRETA';
              return 'INVALID';
            };

            res.send({
              Message: '',
              userSituation: userSituation(),
              status: 1,
            });
            await browser.close();
            console.log('Script finished');
          }
        } catch (error) {
          res.send({Message: 'Please, try again', status: 0 });
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
