const controllers = require('../controllers')
const auth = require('./auth')

module.exports = (app) => {
  app.get('/', controllers.home.getHome)

  app.get('/user/register', auth.isNotAuth, controllers.user.getReg)
  app.post('/user/register', auth.isNotAuth, controllers.user.postReg)

  app.get('/user/login', auth.isNotAuth, controllers.user.getLogin)
  app.post('/user/login', auth.isNotAuth, controllers.user.postLogin)

  app.get('/user/logout', auth.isAuth, controllers.user.logout)

  app.get('/tweet', auth.isAuth, controllers.tweet.getAdd)
  app.post('/tweet', auth.isAuth, controllers.tweet.postTweet)

  app.get('/tag/:tagName', controllers.tweet.getByTag)

  app.get('/profile/:username', controllers.tweet.getProfilePage)

  app.get('/tweet/:tweetId/like', auth.isAuth, controllers.tweet.tweetLike)

  app.get('/tweet/:tweetId/dislike', auth.isAuth, controllers.tweet.tweetDislike)
}
