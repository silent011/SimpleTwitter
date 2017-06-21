const mongoose = require('mongoose')
const {Schema} = mongoose
const msg = '{PATH} is required'

let tagSchema = new Schema({
  name: {type: String, required: msg, unique: true},
  tweets: [{type: Schema.Types.ObjectId, ref: 'Tweets'}]
})

let Tag = mongoose.model('Tags', tagSchema)

module.exports = Tag
