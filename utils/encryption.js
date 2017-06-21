const crypto = require('crypto')

module.exports = {
  generateSalt: () => {
    return crypto.randomBytes(128).toString('base64')
  },
  generateHashPass: (salt, pass) => {
    return crypto.createHmac('sha256', salt).update(pass).digest('hex')
  }
}
