const express = require('express')
const app = express()
const port = 3000

require('./server/database')()
require('./server/express.config')(app)
require('./server/passport.config')()
require('./server/routes')(app)

app.listen(port, () => {
  console.log(`express listening on ${port}`)
})
