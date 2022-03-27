const express = require('express');
const cors = require('cors');
const error = require('./middlewares/error');
const validateData = require('./middlewares/validateData');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(error);

const PORT = process.env.PORT || 3333;
app.get('/', validateData, () => console.log('here'));
app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
