module.exports = (date, format) => {
  let str = format
  str = str.replace('h', date.getHours())
  str = str.replace('M', date.getMonth() + 1)
  str = str.replace('Y', date.getFullYear())
  str = str.replace('d', date.getDate())
  let min = date.getMinutes()
  if (min < 10) { min = '0' + min }
  str = str.replace('m', min)

  return str
}
