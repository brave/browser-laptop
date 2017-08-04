/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Perform a sequence of function calls, grouping together contiguous function
 * calls for the same function different args.
 * See syncUtil.applySyncRecords() for a usage example.
 */
module.exports = class FunctionBuffer {
  /**
   * @param {function=} prepareArguments Before calling a function, run this function to prepare the buffered arguments.
   */
  constructor (prepareArguments) {
    this.argumentsBuffer = []
    this.previousFunction = () => {}
    this.prepareArguments = prepareArguments || ((args) => args)
  }

  /**
   * @param {function} fn Function to call. NOTE: this supports only calling with the first argument.
    * @param {any} arg Arg to buffer
   */
  buffer (fn, arg) {
    if (fn !== this.previousFunction) {
      this.flush()
      this.previousFunction = fn
    }
    this.argumentsBuffer.push(arg)
  }

  /**
   * Call previousFunction with buffered arguments and empty buffer.
   */
  flush () {
    if (!this.argumentsBuffer.length) { return }
    const preparedArgs = this.prepareArguments(this.argumentsBuffer)
    const returnValue = this.previousFunction(preparedArgs)
    this.argumentsBuffer = []
    return returnValue
  }
}
