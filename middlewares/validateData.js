/* eslint-disable consistent-return */
const { StatusCodes } = require('http-response-status');
const sanitizeString = require('../helpers/sanitizeString');
const validateBirthday = require('../helpers/validateBirthday');
const validateCpf = require('../helpers/validateCpf');

module.exports = (err, req, res, next) => {
  const { CPF, BIRTH_DAY } = req.body;
  console.log(CPF, BIRTH_DAY);
  const sanitizedCpf = sanitizeString(CPF);
  const sanitizedBirthday = sanitizeString(BIRTH_DAY);
  const isCpfValid = validateCpf(sanitizedCpf);
  const isBirthdayValid = validateBirthday(sanitizedBirthday);
  console.log(isCpfValid);
  if (!isCpfValid) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      Message: 'CPF deve conter apenas 11 digitos',
      status: 0,
    });
  }

  if (!isBirthdayValid) {
    return res.send({
      Message: 'Data de nascimento deve conter apenas 8 digitos',
      status: 0,
    });
  }

  next();
  // return false;
};
