const mongoose = require('mongoose')
const {Schema} = mongoose
const enc = require('../utils/encryption')
const msg = '{PATH} is required'

let userSchema = new mongoose.Schema({
  username: {type: String, unique: true, required: msg},
  password: {type: String, required: true},
  roles: [{type: String}],
  salt: {type: String},
  isBlocked: {type: Boolean, default: false},
  tweets: [{type: Schema.Types.ObjectId, ref: 'Tweets'}],
  mentionedTweets: [{type: Schema.Types.ObjectId, ref: 'Tweets'}]
})

userSchema.methods.authenticate = function (pass) {
  if (enc.generateHashPass(this.salt, pass) === this.password) {
    console.log(this.salt)
    return true
  }
  return false
}

let User = mongoose.model('Users', userSchema)

module.exports = User
