'use strict';

function MyError(message, fileName, lineNumber) {
  var err = new Error();

  if (err.stack) {
      // remove one stack level:
      this.stack = err.stack;
  }
  this.message    = message    === undefined ? err.message    : message;
  this.fileName   = fileName   === undefined ? err.fileName   : fileName;
  this.lineNumber = lineNumber === undefined ? err.lineNumber : lineNumber;
}

MyError.prototype = new Error();
MyError.prototype.constructor = MyError;
MyError.prototype.name = 'MyError';

module.exports = function (message, fileName, lineNumber) {
  return new MyError(message, fileName, lineNumber);
};