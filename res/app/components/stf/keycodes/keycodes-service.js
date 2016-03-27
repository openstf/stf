module.exports = function KeycodesServiceFactory(KeycodesAndroid, KeycodesJS) {
  var service = {}

  var a = KeycodesAndroid
  var j = KeycodesJS
  var androidMap = [
    [j.ENTER, a.KEYCODE_ENTER],
    [j.SPACE, a.KEYCODE_SPACE],
    [j.DELETE, a.KEYCODE_DEL],
    [j.ESCAPE, a.KEYCODE_ESCAPE],
    [j.BACKSPACE, a.KEYCODE_DEL],
    [j.TAB, a.KEYCODE_TAB],
    [j.SHIFT, a.KEYCODE_SHIFT_LEFT],
    [j.CAPS_LOCK, a.KEYCODE_CAPS_LOCK],
    [j.SLASH, a.KEYCODE_SLASH],
    [j.BACKSLASH, a.KEYCODE_BACKSLASH],
    [j.COMMA, a.KEYCODE_COMMA],
    [j.PERIOD, a.KEYCODE_PERIOD],
    [j.SEMICOLON, a.KEYCODE_SEMICOLON],
    [j.PAGE_UP, a.KEYCODE_PAGE_UP],
    [j.PAGE_DOWN, a.KEYCODE_PAGE_DOWN],
    //  [j.LEFT_WINDOW, a.KEYCODE_RO],
    //  [j.SELECT_KEY, a.KEYCODE_KANA],
    [j.HOME, a.KEYCODE_MOVE_HOME],
    [j.END, a.KEYCODE_MOVE_END],
    [j.UP, a.KEYCODE_DPAD_UP],
    [j.DOWN, a.KEYCODE_DPAD_DOWN],
    [j.LEFT, a.KEYCODE_DPAD_LEFT],
    [j.RIGHT, a.KEYCODE_DPAD_RIGHT],
    [j.F3, a.KEYCODE_POWER],
    [j.F7, a.KEYCODE_MEDIA_PREVIOUS],
    [j.F8, a.KEYCODE_MEDIA_PLAY_PAUSE],
    [j.F9, a.KEYCODE_MEDIA_NEXT],
    [j.F10, a.KEYCODE_VOLUME_MUTE],
    [j.F11, a.KEYCODE_VOLUME_DOWN],
    [j.F12, a.KEYCODE_VOLUME_UP],
    [j.NUMPAD_0, a.KEYCODE_NUMPAD_0],
    [j.NUMPAD_1, a.KEYCODE_NUMPAD_1],
    [j.NUMPAD_2, a.KEYCODE_NUMPAD_2],
    [j.NUMPAD_3, a.KEYCODE_NUMPAD_3],
    [j.NUMPAD_4, a.KEYCODE_NUMPAD_4],
    [j.NUMPAD_5, a.KEYCODE_NUMPAD_5],
    [j.NUMPAD_6, a.KEYCODE_NUMPAD_6],
    [j.NUMPAD_7, a.KEYCODE_NUMPAD_7],
    [j.NUMPAD_8, a.KEYCODE_NUMPAD_8],
    [j.NUMPAD_9, a.KEYCODE_NUMPAD_9],
    [j.MULTIPLY, a.KEYCODE_NUMPAD_MULTIPLY],
    [j.ADD, a.KEYCODE_NUMPAD_ADD],
    [j.SUBTRACT, a.KEYCODE_NUMPAD_SUBTRACT],
    [j.DECIMAL_POINT, a.KEYCODE_NUMPAD_DOT],
    [j.DIVIDE, a.KEYCODE_NUMPAD_DIVIDE],
    [j.EQUAL_SIGN, a.KEYCODE_EQUALS],
    [j.DASH, a.KEYCODE_MINUS],
    [j.GRAVE_ACCENT, a.KEYCODE_GRAVE],
    [j.OPEN_BRACKET, a.KEYCODE_LEFT_BRACKET],
    [j.CLOSE_BRACKET, a.KEYCODE_RIGHT_BRACKET],
    [j.SINGLE_QUOTE, a.KEYCODE_APOSTROPHE]
  ]

  service.mapToDevice = function(keyCode) {
    return service.mapToAndroid(keyCode)
  }

  service.mapToAndroid = function(key) {
    // All special keys
    for (var i = 0; i < androidMap.length; ++i) {
      if (androidMap[i][0] === key) {
        return androidMap[i][1]
      }
    }
    // Range of numbers and letters
    if (key >= j['0'] && key <= j['9']) {
      return key - 41 // 0-9 range
    }
    else if (key >= j.A && key <= j.Z) {
      return key - 36 // a-z range
    }
    // Key not mapped
    return -1
  }

  return service
}
