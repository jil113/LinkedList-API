const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'coolsecretkey';
const {
  ensureCorrectUser,
  ensureLoggedIn,
  ensureCorrectCompany
} = require('../middleware');

router.get('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const data = await db.query('SELECT * FROM companies');
    for (let i = 0; i < data.rows.length; i++) {
      delete data.rows[i].password;
    }
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (req.body.password.length > 55)
      return next(new Error('Password is too long'));
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'INSERT INTO companies (name, email, handle, password, logo) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [
        req.body.name,
        req.body.email,
        req.body.handle,
        hashedPass,
        req.body.logo
      ]
    );
    data.rows[0].password = req.body.password;
    return res.json(data.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return next(`The handle ${req.body.handle} already exists.`);
    return next(err);
  }
});

router.get('/:handle', ensureLoggedIn, async (req, res, next) => {
  try {
    const company = await db.query(
      'SELECT * FROM companies WHERE handle=$1 LIMIT 1',
      [req.params.handle]
    );
    // const users = await db.query(
    //   'SELECT * FROM users WHERE current_company_id=$1',
    //   [req.params.id]
    // );
    // const jobs = await db.query('SELECT * FROM jobs WHERE company_id=$1', [
    //   req.params.id
    // ]);
    // company.rows[0].users = users.rows;
    // company.rows[0].jobs = jobs.rows;

    delete company.rows[0].password;
    return res.json(company.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:handle', ensureCorrectCompany, async (req, res, next) => {
  try {
    if (req.body.password.length > 55)
      return next(new Error('Password is too long'));
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'UPDATE companies SET name=($1), logo=($2), handle=($3), password=($4), email=($5) WHERE handle=($3) RETURNING *',
      [
        req.body.name,
        req.body.logo,
        req.params.handle,
        hashedPass,
        req.body.email
      ]
    );
    data.rows[0].password = req.body.password;
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:handle', ensureCorrectCompany, async (req, res, next) => {
  try {
    const data = await db.query(
      'DELETE FROM companies WHERE handle=$1 RETURNING *',
      [req.params.handle]
    );

    return res.status(200).json({
      status: 200,
      title: 'Success',
      message: 'The operation was successful.'
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
