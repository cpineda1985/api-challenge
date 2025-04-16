const express = require('express')
const cors = require('cors') // importando cors
const filesRouter = require('./routes/files')

const app = express()

app.use(cors()) // habilitando CORS para consumo ambiente local desarrollo
app.use(express.json())

// Content-Type: application/json
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// Ruta principal
app.use('/files', filesRouter)

module.exports = app
