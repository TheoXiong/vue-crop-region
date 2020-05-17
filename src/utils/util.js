const isNum = (num) => { return typeof num === 'number' && !isNaN(num) }
const isPNum = (num) => { return typeof num === 'number' && num >= 0 }

export {
  isNum,
  isPNum
}