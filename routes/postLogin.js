const express = require('express')
const router = express.Router()
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client()
const audience = process.env.GOOGLE_CLIENT_ID
const { Pool } = require('pg')
const pool = new Pool()

router.post('/login', async (req, res) => {
  let payload
  try {
    const ticket = await client.verifyIdToken({
      audience,
      idToken: req.body.credential
    })
    payload = ticket.getPayload()

    const email = payload.email
    const name = payload.name

    // Check if user exists in the database
    const auth = await pool.query('SELECT * FROM people WHERE email = $1', [email])
    if (auth.rowCount === 0) {
      // Insert new user into the database
      const insertResult = await pool.query('INSERT INTO people (name, email) VALUES ($1, $2) RETURNING id', [name, email])
      const userId = insertResult.rows[0].id
      return res.status(201).json({ user: userId })
    }
    const userId = auth.rows[0].id
    return res.status(200).json({ user: userId })
  } catch (err) {
    console.error(err)
    res.sendStatus(401)
  }
})

module.exports = router
