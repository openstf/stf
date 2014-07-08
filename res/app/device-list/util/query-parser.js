var State = {
  TERM_START: 1
, FIELD_OR_QUERY: 2
, QUERY_START: 3
, QUERY: 4
, DOUBLEQUOTED_QUERY: 5
}

function Term() {
  this.field = null
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
    if (input === '"') {
      this.state = State.DOUBLEQUOTED_QUERY
      return
    }
    this.state = State.FIELD_OR_QUERY
    this.currentTerm.query += input
    return
  case State.FIELD_OR_QUERY:
    if (this.isWhitespace(input)) {
      return this.concludeTerm()
    }
    if (input === ':') {
      this.currentTerm.field = this.currentTerm.query
      this.currentTerm.query = ''
      this.state = State.QUERY_START
      return
    }
    this.currentTerm.query += input
    return
  case State.QUERY_START:
    if (this.isWhitespace(input)) {
      // Preceding whitespace, ignore.
      return
    }
    if (input === '"') {
      this.state = State.DOUBLEQUOTED_QUERY
      return
    }
    this.currentTerm.query += input
    return
  case State.QUERY:
    if (this.isWhitespace(input)) {
      return this.concludeTerm()
    }
    if (input === '"') {
      this.state = State.DOUBLEQUOTED_QUERY
      return
    }
    this.currentTerm.query += input
    return
  case State.DOUBLEQUOTED_QUERY:
    if (input === '\\') {
      return
    }
    if (input === '"') {
      return this.concludeTerm()
    }
    this.currentTerm.query += input
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
