var State = {
  TERM_START: 10
, QUERY_START: 20
, OP_LT: 30
, OP_GT: 40
, QUERY_VALUE_START: 50
, QUERY_VALUE: 60
, QUERY_VALUE_DOUBLEQUOTED: 70
}

function Term() {
  this.field = null
  this.op = null
  this.query = ''
}

Term.prototype.append = function(input) {
  this.query += input
}

Term.prototype.reset = function() {
  this.query = ''
}

function QueryParser() {
  this.terms = []
  this.currentTerm = new Term()
  this.state = State.TERM_START
}

QueryParser.parse = function(input) {
  var parser = new QueryParser()
  return parser.parse(input)
}

QueryParser.prototype.parse = function(input) {
  var chars = input.split('')
  for (var i = 0, l = chars.length; i < l; ++i) {
    this.consume(chars[i])
  }
  return this.terms
}

QueryParser.prototype.consume = function(input) {
  switch (this.state) {
  case State.TERM_START:
    if (this.isWhitespace(input)) {
      // Preceding whitespace, ignore.
      return
    }
    this.terms.push(this.currentTerm)
    this.state = State.QUERY_START
    return this.consume(input)
  case State.QUERY_START:
    if (this.isWhitespace(input)) {
      // Preceding whitespace, ignore.
      return
    }
    if (input === '<') {
      this.state = State.OP_LT
      return
    }
    if (input === '>') {
      this.state = State.OP_GT
      return
    }
    this.state = State.QUERY_VALUE_START
    return this.consume(input)
  case State.OP_LT:
    if (input === '=') {
      this.currentTerm.op = '<='
      this.state = State.QUERY_VALUE_START
      return
    }
    this.currentTerm.op = '<'
    this.state = State.QUERY_VALUE_START
    return this.consume(input)
  case State.OP_GT:
    if (input === '=') {
      this.currentTerm.op = '>='
      this.state = State.QUERY_VALUE_START
      return
    }
    this.currentTerm.op = '>'
    this.state = State.QUERY_VALUE_START
    return this.consume(input)
  case State.QUERY_VALUE_START:
    if (this.isWhitespace(input)) {
      // Preceding whitespace, ignore.
      return
    }
    if (input === '"') {
      this.state = State.QUERY_VALUE_DOUBLEQUOTED
      return
    }
    this.state = State.QUERY_VALUE
    return this.consume(input)
  case State.QUERY_VALUE:
    if (this.isWhitespace(input)) {
      return this.concludeTerm()
    }
    if (input === ':') {
      this.currentTerm.field = this.currentTerm.query
      this.currentTerm.reset()
      this.state = State.QUERY_START
      return
    }
    this.currentTerm.append(input)
    return
  case State.QUERY_VALUE_DOUBLEQUOTED:
    if (input === '\\') {
      return
    }
    if (input === '"') {
      return this.concludeTerm()
    }
    this.currentTerm.append(input)
    return
  }
}

QueryParser.prototype.concludeTerm = function() {
  this.currentTerm = new Term()
  this.state = State.TERM_START
}

QueryParser.prototype.isWhitespace = function(input) {
  return input === ' ' || input === '\t' || input === '\n' || input === ''
}

module.exports = QueryParser
