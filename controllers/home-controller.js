const Tweet = require('../models/Tweet')
const User = require('../models/User')
const map = {'<': '&lt;', '>': '$gt;'}

let tagParser = tweet => {
  let parsedBody = tweet.newBody
  for (let tag of tweet.tags) {
    parsedBody = parsedBody.replace(new RegExp(tag.name, 'g'),
    `<a href="/tag/${tag.name.replace('#', '%23')}">${tag.name}</a>`)
  }

  return parsedBody
}

let handleParser = tweet => {
  let parseBody = tweet.newBody
  for (let handle of tweet.handles) {
    parseBody = parseBody.replace(new RegExp(handle.username, 'g'),
      `<a href="profile/${handle.username}">${handle.username}</a>`)
  }

  return parseBody
}

module.exports = {
  getHome: (req, res) => {
    if (req.user) {
      forLoggedUser()
    } else {
      forAnonUser()
    }
    function forAnonUser () {
      Tweet.find().sort('-date').limit(100).populate('author')
        .populate('tags').then(tweets => {
          if (tweets.length === 0) {
            res.render('home/home')
            return
          }
          for (let tweet of tweets) {
            tweet.newBody = tweet.body.replace(/[<>]/g, match => map[match])
            if (tweet.tags.length > 0) { tweet.newBody = tagParser(tweet) }
            if (tweet.handles.length > 0) { tweet.newBody = handleParser(tweet) }
          }

          res.render('home/home', {tweets})
          for (let tweet of tweets) {
            delete tweet.newBody
            tweet.views++
            tweet.save()
          }
        })
    }

    function forLoggedUser () {
      User.findById(req.user._id).populate({
        path: 'tweets', populate: {path: 'author'}})
        .populate({path: 'tweets', populate: {path: 'tags'}})
        .populate({path: 'mentionedTweets', populate: {path: 'author'}})
        .populate({path: 'mentionedTweets', populate: {path: 'tags'}})
        .then(foundUser => {
          if (!foundUser) {
            res.status(404).send('Invalid user')
            return
          }

          let tweets = foundUser.tweets.concat(foundUser.mentionedTweets)
          .sort((a, b) => b.date - a.date).slice(0, 100)

          if (tweets.length === 0) {
            res.render('home/home')
            return
          }

          for (let tweet of tweets) {
            tweet.newBody = tweet.body.replace(/[<>]/g, match => map[match])
            if (tweet.tags.length > 0) { tweet.newBody = tagParser(tweet) }
            if (tweet.handles.length > 0) { tweet.newBody = handleParser(tweet) }
          }

          res.render('home/home', {tweets})
          for (let tweet of tweets) {
            delete tweet.newBody
            tweet.views++
            tweet.save()
          }
        })
    }
  }

}
