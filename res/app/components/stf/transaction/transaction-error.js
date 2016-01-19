function TransactionError(result) {
  this.code = this.message = result.error
  this.name = 'TransactionError'
  Error.captureStackTrace(this, TransactionError)
}

TransactionError.prototype = Object.create(Error.prototype)
TransactionError.prototype.constructor = TransactionError

module.exports = TransactionError
