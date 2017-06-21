const mongoose = require('mongoose')
const {Schema} = mongoose
const msg = '{PATH} is required'

let tweetSchema = new Schema({
  body: {type: String, required: msg},
  author: {type: Schema.Types.ObjectId, ref: 'Users'},
  tags: [{type: Schema.Types.ObjectId, ref: 'Tags'}],
  views: {type: Number, default: 0},
  likes: {type: Number, default: 0},
  likedBy: [{type: Schema.Types.ObjectId, ref: 'Users'}],
  date: {type: Date, default: Date.now()},
  handles:[]
})

let Tweet = mongoose.model('Tweets', tweetSchema)

module.exports = Tweet
