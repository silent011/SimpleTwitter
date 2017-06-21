const conStr = 'mongodb://localhost:27017/Twitter'
const mongoose = require('mongoose')

mongoose.Promise = global.Promise

require('../models/User')
require('../models/Tweet')
require('../models/Tag')

module.exports = () => {
  mongoose.connect(conStr)

  let database = mongoose.connection

  database.once('open', () => {
    console.log('db connected')
  })

  database.on('error', err => {
    console.log(err)
  })
}
