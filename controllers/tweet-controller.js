const Tweet = require('../models/Tweet')
const Tag = require('../models/Tag')
const errorHandler = require('../utils/error-handler')
const regexTags = /#([^,.?!\s]+)/g
const regexMentions = /@([^,.?!\s]+)/g
const User = require('../models/User')
const map = {'<': '&lt;', '>': '$gt;'}

let tagParser = tweet => {
  let parsedBody = tweet.newBody
  for (let tag of tweet.tags) {
    parsedBody = parsedBody.replace(new RegExp(tag.name, 'g'), `<a href="/tag/${tag.name.replace('#', '%23')}">${tag.name}</a>`)
  }

  return parsedBody
}

let handleParser = tweet => {
  let parseBody = tweet.newBody
  for (let handle of tweet.handles) {
    parseBody = parseBody.replace(new RegExp(handle.username, 'g'),
      `<a href="/profile/${handle.username}">${handle.username}</a>`)
  }

  return parseBody
}
module.exports = {
  getAdd: (req, res) => {
    res.render('tweets/add')
  },
  postTweet: (req, res) => {
    let body = req.body.body
    if (body.length === 0) {
      errorHandler(res, 'Tweet cannot be empty', 'tweets/add')
      return
    }

    if (body.length > 140) {
      errorHandler(res, 'Tweet too long', 'tweets/add', {tweet: req.body})
      return
    }

    let reqPost = {
      author: req.user._id,
      body: body,
      views: 0,
      likes: 0,
      tags: [],
      handles: [],
      date: Date.now()
    }

    let reqTags = [...new Set(body.match(regexTags))]
    let reqHandles = [...new Set(body.match(regexMentions))]

    Tweet.create(reqPost).then(createdTweet => {
      User.findById(reqPost.author).then(author => {
        author.tweets.push(createdTweet._id)
        author.save().then(() => {
          if (reqTags) saveNCheckTags(createdTweet)
          else if (reqHandles) checkNSaveHandles(createdTweet)
          else res.redirect('/')
        })
      })
    })

    function saveNCheckTags (tweet) {
      let promises = []
      for (let reqTag of reqTags) {
        let p = new Promise((resolve, reject) => {
          Tag.findOne({name: reqTag}).then(foundTag => {
            if (!foundTag) createTagNSave(reqTag, tweet, resolve)
            else {
              tweet.tags.push(foundTag._id)
              tweet.save()
              foundTag.tweets.push(tweet._id)
              foundTag.save().then(() => resolve())
            }
          })
        })
        promises.push(p)
      }
      Promise.all(promises).then(() => {
        if (reqHandles) checkNSaveHandles(tweet)
        else res.redirect('/')
      })
    }

    function createTagNSave (reqTag, tweet, resolve) {
      Tag.create({name: reqTag, tweets: [tweet._id]}).then(createdTag => {
        tweet.tags.push(createdTag._id)
        tweet.save().then(() => resolve())
      })
    }

    function checkNSaveHandles (tweet) {
      let promises = []
      for (let reqHandle of reqHandles) {
        let handleName = reqHandle.substring(1)
        let p = new Promise((resolve, reject) => {
          User.findOne({username: handleName}).then(foundUser => {
            if (!foundUser) return
            else if (foundUser._id === tweet.author._id) return
            else {
              let handle = {username: reqHandle, id: foundUser._id}
              tweet.handles.push(handle)
              tweet.save().then(() => {
                foundUser.mentionedTweets.push(tweet._id)
                foundUser.save().then(() => resolve())
              })
            }
          })
        })
        promises.push(p)
      }
      Promise.all(promises).then(() => {
        res.redirect('/')
      })
    }
  },
  getByTag: (req, res) => {
    let reqTag = req.params.tagName

    if (!reqTag) {
      res.redirect('/')
      return
    }

    Tag.findOne({name: reqTag}).populate({path: 'tweets', populate: {path: 'tags'}})
        .populate({path: 'tweets', populate: {path: 'author'}})
        .then(foundTag => {
          if (!foundTag || foundTag.tweets.length === 0) {
            res.render('tweets/byTag')
            return
          }

          let tweets = foundTag.tweets.sort((a, b) => b.date - a.date).slice(0, 100)

          for (let tweet of tweets) {
            tweet.newBody = tweet.body.replace(/[<>]/g, match => map[match])
            if (tweet.tags.length > 0) { tweet.newBody = tagParser(tweet) }
            if (tweet.handles.length > 0) { tweet.newBody = handleParser(tweet) }
          }

          res.render('tweets/byTag', {tweets})
          for (let tweet of tweets) {
            delete tweet.newBody
            tweet.views++
            tweet.save()
          }
        })
  },
  getProfilePage: (req, res) => {
    let username = req.params.username

    if (!username) {
      res.status(404).send('Invalid link')
      return
    }

    User.findOne({username: username.slice(1)}).populate('author')
    .populate({path: 'tweets', populate: {path: 'tags'}})
    .populate({path: 'tweets', populate: {path: 'author'}})
    .populate({path: 'mentionedTweets', populate: {path: 'tags'}})
    .populate({path: 'mentionedTweets', populate: {path: 'author'}})
    .then(foundUser => {
      if (!foundUser) {
        res.status(404).send('Invalid user')
        return
      }
      let tweets = foundUser.tweets.concat(foundUser.mentionedTweets)

      if (tweets.length === 0) {
        res.render('user/profile')
        return
      }

      tweets = tweets.sort((a, b) => b.date - a.date).slice(0, 100)

      for (let tweet of tweets) {
        tweet.newBody = tweet.body.replace(/[<>]/g, match => map[match])
        if (tweet.tags.length > 0) { tweet.newBody = tagParser(tweet) }
        if (tweet.handles.length > 0) { tweet.newBody = handleParser(tweet) }
      }

      res.render('user/profile', {tweets, username})
      for (let tweet of tweets) {
        delete tweet.newBody
        tweet.views++
        tweet.save()
      }
    })
  },
  tweetLike: (req, res) => {
    let tweetId = req.params.tweetId
    let userId = req.user._id

    if (!tweetId) {
      res.status(404).send('Invalid link')
      return
    }

    Tweet.findById(tweetId).then(foundTweet => {
      if (!foundTweet) {
        res.status(404).send('Invalid tweet')
        return
      }

      if (foundTweet.likedBy.indexOf(userId) > -1) {
        res.redirect('/')
        return
      }

      foundTweet.likedBy.push(userId)
      foundTweet.likes++
      foundTweet.save().then(() => {
        res.redirect('/')
      })
    })
  },
  tweetDislike: (req, res) => {
    let tweetId = req.params.tweetId
    let userId = req.user._id

    if (!tweetId) {
      res.status(404).send('Invalid link')
      return
    }

    Tweet.findById(tweetId).then(foundTweet => {
      if (!foundTweet) {
        res.status(404).send('Invalid tweet')
        return
      }

      let index = foundTweet.likedBy.indexOf(userId)

      if (index === -1) {
        res.redirect('/')
        return
      }

      foundTweet.likedBy.splice(index, 1)
      foundTweet.likes--
      foundTweet.save().then(() => {
        res.redirect('/')
      })
    })
  }
}
