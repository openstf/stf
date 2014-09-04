module.exports = function TransactionError(result) {
  this.message = this.code = result.error
  this.result = result
}
