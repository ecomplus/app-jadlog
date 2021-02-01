const deadlineRanges = [
  require('./deadlines/range-0'),
  require('./deadlines/range-1'),
  require('./deadlines/range-2'),
  require('./deadlines/range-3'),
  require('./deadlines/range-4'),
  require('./deadlines/range-5'),
  require('./deadlines/range-6'),
  require('./deadlines/range-7'),
  require('./deadlines/range-8'),
  require('./deadlines/range-9')
]

module.exports = ({ cepori, cepdes, modalidade }) => {
  const isExpress = !modalidade || modalidade <= 7
  let days = deadlineRanges[parseInt(cepori.charAt(0), 10)](cepdes, isExpress)
  if (cepori > 19999999 && Math.abs(cepori - cepdes) > 4000000) {
    days += (isExpress ? 1 : 2)
  }
  return days
}
