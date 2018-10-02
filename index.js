const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const APIError = require('./APIError');
process.env.NODE_ENV = 'development';

const { SECRET_KEY } = require('./config');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const usersRoutes = require('./routes/users');
const companiesRoutes = require('./routes/companies');
const jobsRoutes = require('./routes/jobs');

const { userAuthHandler, companyAuthHandler } = require('./auth');
app.post('/user-auth', userAuthHandler);
app.post('/company-auth', companyAuthHandler);

app.use('/users', usersRoutes);
app.use('/companies', companiesRoutes);
app.use('/jobs', jobsRoutes);
app.use(cors());

app.use((error, request, response, next) => {
  // format built-in errors
  if (!(error instanceof APIError)) {
    error = new APIError(500, error.type, error.message);
  }
  // log the error stack if we're in development
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack); //eslint-disable-line no-console
  }

  return response.status(error.status).json(error);
});

module.exports = app;
