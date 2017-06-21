const map = {'<': '&lt;', '>': '&gt;'}

module.exports = {
  htmlEscape: body => {
    let newBody = body.replace(/[<>]/g, found => {
      return map[found]
    })
    return newBody
  }

}
