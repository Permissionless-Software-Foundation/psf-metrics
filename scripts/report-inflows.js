/*
  Generates a CSV file for token INFLOWS between the startBlock and endBlock
  defined in the config/index.js file.
*/

/* eslint-disable no-async-promise-executor */

'use strict'

const BCHJS = require('@psf/bch-js')

const Metrics = require('../lib/metrics')
const config = require('../config')

let _this // local global for 'this'.

class BoilplateLib {
  constructor () {
    _this = this

    _this.bchjs = new BCHJS()
    _this.metrics = new Metrics()
  }

  // Generate a CSV output from an array of objects (data). An optional header
  // string can be provided.
  generateCSV (data) {
    // let outStr = header
    let outStr = '\n\nInflows:\nDate,Height,TokenQty,TXID,Vout\n'

    for (let i = 0; i < data.length; i++) {
      const thisData = data[i]
      outStr += `${thisData.date},${thisData.height},${thisData.amount},${
        thisData.txid
      },${thisData.vout}\n`
    }

    return outStr
  }
}

// This is the main function that starts off the program.
// It generates a CSV report on token inflows.
async function runReport () {
  try {
    const lib = new BoilplateLib()

    const startBlock = config.startBlock
    const stopBlock = config.endBlock

    const inflows = await lib.metrics.tokenInflows(startBlock, stopBlock)
    const csv = lib.generateCSV(inflows)
    console.log(csv)
  } catch (err) {
    console.error('Error in runReport(): ', err)
  }
}
runReport()

module.exports = BoilplateLib
