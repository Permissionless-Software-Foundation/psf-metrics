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

  // Generate a CSV output from an array of objects (data). An optional header
  // string can be provided.
  generateCSV (data) {
    // let outStr = header
    let outStr = 'Date,Height,TokenQty,TXID,Vout\n'

    for (let i = 0; i < data.length; i++) {
      const thisData = data[i]
      outStr += `${thisData.date},${thisData.height},${thisData.amount},${
        thisData.txid
      },${thisData.vout}\n`
    }

    return outStr
  }
}

async function runReport () {
  try {
    const lib = new BoilplateLib()

    const startBlock = 672758
    const stopBlock = 676830

    // const inflows = await lib.metrics.tokenInflows(startBlock, stopBlock)
    // const csv = lib.generateCSV(inflows)
    // console.log(csv)

    const outflows = await lib.metrics.tokenOutflows(startBlock, stopBlock)
    const csv = lib.generateCSV(outflows)
    console.log(csv)

    // const burns = await lib.metrics.tokenBurns(startBlock, stopBlock)
    // const csv = lib.generateCSV(burns)
    // console.log(csv)
  } catch (err) {
    console.error('Error in runReport(): ', err)
  }
}
runReport()

module.exports = BoilplateLib
