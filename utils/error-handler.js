module.exports = (res, err, view, data) => {
  res.locals.globalError = err
  res.render(view, data)
}
