/*
  An npm JavaScript library for front end web apps. Implements a minimal
  Bitcoin Cash wallet.
*/

/* eslint-disable no-async-promise-executor */

'use strict'

const BCHJS = require('@psf/bch-js')

const Metrics = require('./lib/metrics')

let _this // local global for 'this'.

class BoilplateLib {
  constructor () {
    _this = this

    _this.bchjs = new BCHJS()
    _this.metrics = new Metrics()
  }
}

async function runReport () {
  try {
    const lib = new BoilplateLib()

    const Dec1stBlock = 664000
    const Dec31stBlock = 668300

    const inflows = await lib.metrics.tokenInflows(Dec1stBlock, Dec31stBlock)
    console.log(
      `Token inflows between blocks ${Dec1stBlock} and ${Dec31stBlock}:\n${JSON.stringify(
        inflows,
        null,
        2
      )}`
    )
  } catch (err) {
    console.error('Error in runReport(): ', err)
  }
}
runReport()

module.exports = BoilplateLib
