var util = require('util')

var adb = require('adbkit')
var Promise = require('bluebird')

module.exports.parseKeyCharacterMap = function(stream) {
  var resolver = Promise.defer()
    , state = 'type_t'
    , keymap = {
        type: null
      , keys: []
      }
    , lastKey
    , lastRule
    , lastModifier
    , lastBehavior

  function fail(char, state) {
    throw new Error(util.format(
      'Unexpected character "%s" in state "%s"'
    , char
    , state
    ))
  }

  function parse(char) {
    switch (state) {
      case 'comment_before_type_t':
        if (char === '\n') {
          state = 'type_t'
          break
        }
        return true
      case 'type_t':
        if (char === '\n') {
          return true
        }
        if (char === '#') {
          state = 'comment_before_type_t'
          return true
        }
        if (char === 'k') {
          state = 'key_k'
          return parse(char)
        }
        if (char === 't') {
          state = 'type_y'
          return true
        }
        return fail(char, state)
      case 'type_y':
        if (char === 'y') {
          state = 'type_p'
          return true
        }
        return fail(char, state)
      case 'type_p':
        if (char === 'p') {
          state = 'type_e'
          return true
        }
        return fail(char, state)
      case 'type_e':
        if (char === 'e') {
          state = 'type_name_start'
          keymap.type = ''
          return true
        }
        return fail(char, state)
      case 'type_name_start':
        if (char === ' ') {
          return true
        }
        if (char >= 'A' && char <= 'Z') {
          keymap.type += char
          state = 'type_name_continued'
          return true
        }
        return fail(char, state)
      case 'type_name_continued':
        if (char === '\n') {
          // Could have more of these, although it doesn't make much sense
          state = 'type_t'
          return true
        }
        if (char >= 'A' && char <= 'Z') {
          keymap.type += char
          return true
        }
        return fail(char, state)
      case 'comment_before_key_k':
        if (char === '\n') {
          state = 'key_k'
          break
        }
        return true
      case 'key_k':
        if (char === '\n') {
          return true
        }
        if (char === '#') {
          state = 'comment_before_key_k'
          return true
        }
        if (char === 'k') {
          state = 'key_e'
          return true
        }
        return fail(char, state)
      case 'key_e':
        if (char === 'e') {
          state = 'key_y'
          return true
        }
        return fail(char, state)
      case 'key_y':
        if (char === 'y') {
          state = 'key_name_start'
          return true
        }
        return fail(char, state)
      case 'key_name_start':
        if (char === ' ') {
          return true
        }
        if ((char >= '0' && char <= '9') ||
            (char >= 'A' && char <= 'Z')) {
          keymap.keys.push(lastKey = {
            key: char
          , rules: []
          })
          state = 'key_name_continued'
          return true
        }
        return fail(char, state)
      case 'key_name_continued':
        if (char === ' ') {
          state = 'key_start_block'
          return true
        }
        if ((char >= '0' && char <= '9') ||
            (char >= 'A' && char <= 'Z') ||
            (char === '_')) {
          lastKey.key += char
          return true
        }
        return fail(char, state)
      case 'key_start_block':
        if (char === ' ') {
          return true
        }
        if (char === '{') {
          state = 'filter_name_start'
          return true
        }
        return fail(char, state)
      case 'filter_name_start':
        if (char === '\n' || char === '\t' || char === ' ') {
          return true
        }
        if (char === '}') {
          state = 'key_k'
          return true
        }
        if (char >= 'a' && char <= 'z') {
          lastKey.rules.push(lastRule = {
            modifiers: [lastModifier = {
              type: char
            }]
          , behaviors: []
          })
          state = 'filter_name_continued'
          return true
        }
        return fail(char, state)
      case 'filter_name_continued':
        if (char === ':') {
          state = 'filter_behavior_start'
          return true
        }
        if (char === ',') {
          state = 'filter_name_or_start'
          return true
        }
        if (char === '+') {
          state = 'filter_name_and_start'
          return true
        }
        if (char >= 'a' && char <= 'z') {
          lastModifier.type += char
          return true
        }
        return fail(char, state)
      case 'filter_name_or_start':
        if (char === ' ') {
          return true
        }
        if (char >= 'a' && char <= 'z') {
          lastKey.rules.push(lastRule = {
            modifiers: [lastModifier = {
              type: char
            }]
          , behaviors: lastRule.behaviors
          })
          state = 'filter_name_continued'
          return true
        }
        return fail(char, state)
      case 'filter_name_and_start':
        if (char === ' ') {
          return true
        }
        if (char >= 'a' && char <= 'z') {
          lastRule.modifiers.push(lastModifier = {
            type: char
          })
          state = 'filter_name_continued'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_literal':
        if (char === '\\') {
          state = 'filter_behavior_literal_escape'
          return true
        }
        if (char !== "'") {
          lastRule.behaviors.push({
            type: 'literal'
          , value: char
          })
          state = 'filter_behavior_literal_end'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_literal_escape':
        if (char === '\\' || char === '\'' || char === '"') {
          lastRule.behaviors.push({
            type: 'literal'
          , value: char
          })
          state = 'filter_behavior_literal_end'
          return true
        }
        if (char === 'n') {
          lastRule.behaviors.push({
            type: 'literal'
          , value: '\n'
          })
          state = 'filter_behavior_literal_end'
          return true
        }
        if (char === 't') {
          lastRule.behaviors.push({
            type: 'literal'
          , value: '\t'
          })
          state = 'filter_behavior_literal_end'
          return true
        }
        if (char === 'u') {
          state = 'filter_behavior_literal_unicode_1'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_literal_end':
        if (char === '\'') {
          state = 'filter_behavior_start'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_start':
        if (char === '\n') {
          state = 'filter_name_start'
          return true
        }
        if (char === ' ') {
          return true
        }
        if (char === "'") {
          state = 'filter_behavior_literal'
          return true
        }
        if (char === 'n') {
          state = 'filter_behavior_none_2'
          return true
        }
        if (char === 'f') {
          state = 'filter_behavior_fallback_2'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_2':
        if (char === 'a') {
          state = 'filter_behavior_fallback_3'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_3':
        if (char === 'l') {
          state = 'filter_behavior_fallback_4'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_4':
        if (char === 'l') {
          state = 'filter_behavior_fallback_5'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_5':
        if (char === 'b') {
          state = 'filter_behavior_fallback_6'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_6':
        if (char === 'a') {
          state = 'filter_behavior_fallback_7'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_7':
        if (char === 'c') {
          state = 'filter_behavior_fallback_8'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_8':
        if (char === 'k') {
          state = 'filter_behavior_fallback_key_start'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_key_start':
        if (char === ' ') {
          return true
        }
        if ((char >= '0' && char <= '9') ||
            (char >= 'A' && char <= 'Z')) {
          lastRule.behaviors.push(lastBehavior = {
            type: 'fallback'
          , key: char
          })
          state = 'filter_behavior_fallback_key_continued'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_fallback_key_continued':
        if (char === ' ') {
          state = 'filter_behavior_start'
          return true
        }
        if (char === '\n') {
          state = 'filter_name_start'
          return true
        }
        if ((char >= '0' && char <= '9') ||
            (char >= 'A' && char <= 'Z') ||
            (char === '_')) {
          lastBehavior.key += char
          return true
        }
        return fail(char, state)
      case 'filter_behavior_none_2':
        if (char === 'o') {
          state = 'filter_behavior_none_3'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_none_3':
        if (char === 'n') {
          state = 'filter_behavior_none_4'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_none_4':
        if (char === 'e') {
          lastRule.behaviors.push({
            type: 'none'
          })
          state = 'filter_behavior_start'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_literal_unicode_1':
        if ((char >= '0' && char <= '9') ||
            (char >= 'a' && char <= 'f')) {
          lastRule.behaviors.push(lastBehavior = {
            type: 'literal'
          , value: parseInt(char, 16) << 12
          })
          state = 'filter_behavior_literal_unicode_2'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_literal_unicode_2':
        if ((char >= '0' && char <= '9') ||
            (char >= 'a' && char <= 'f')) {
          lastBehavior.value += parseInt(char, 16) << 8
          state = 'filter_behavior_literal_unicode_3'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_literal_unicode_3':
        if ((char >= '0' && char <= '9') ||
            (char >= 'a' && char <= 'f')) {
          lastBehavior.value += parseInt(char, 16) << 4
          state = 'filter_behavior_literal_unicode_4'
          return true
        }
        return fail(char, state)
      case 'filter_behavior_literal_unicode_4':
        if ((char >= '0' && char <= '9') ||
            (char >= 'a' && char <= 'f')) {
          lastBehavior.value += parseInt(char, 16)
          state = 'filter_behavior_literal_end'
          return true
        }
        return fail(char, state)
      default:
        throw new Error(util.format('Unexpected state "%s"', state))
    }
  }

  function errorListener(err) {
    resolver.reject(err)
  }

  function readableListener() {
    var chunk = stream.read()
      , i = 0
      , l = chunk.length

    try {
      while (i < l) {
        parse(String.fromCharCode(chunk[i++]))
      }
    }
    catch (err) {
      resolver.reject(err)
    }
  }

  function endListener() {
    resolver.resolve(keymap)
  }

  stream.on('error', errorListener)
  stream.on('readable', readableListener)
  stream.on('end', endListener)

  return resolver.promise.finally(function() {
    stream.removeListener('error', errorListener)
    stream.removeListener('readable', readableListener)
    stream.removeListener('end', endListener)
  })
}
