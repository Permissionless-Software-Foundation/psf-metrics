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
      outStr += `${thisData.date},${thisData.height},${thisData.amount},${thisData.txid},${thisData.vout}\n`
    }

    return outStr
  }
}

async function runReport () {
  try {
    const lib = new BoilplateLib()

    const Dec1stBlock = 664000
    const Dec31stBlock = 668300
    // const inflows = await lib.metrics.tokenInflows(Dec1stBlock, Dec31stBlock)
    // const csv = lib.generateCSV(inflows)
    // console.log(csv)

    // const outflows = await lib.metrics.tokenOutflows(Dec1stBlock, Dec31stBlock)
    // const csv = lib.generateCSV(outflows)
    // console.log(csv)

    // await lib.metrics.tokenBurns(672210, 672215)
    const burns = await lib.metrics.tokenBurns(Dec1stBlock, Dec31stBlock)
    const csv = lib.generateCSV(burns)
    console.log(csv)

    // console.log(
    //   `Token inflows between blocks ${Oct1stBlock} and ${Oct30thBlock}:\n${JSON.stringify(
    //     inflows,
    //     null,
    //     2
    //   )}`
    // )

    // const Nov1stBlock = 659634
    // const Nov30thBlock = 668300
    // const inflows = await lib.metrics.tokenInflows(Nov1stBlock, Nov30thBlock)

    // const Oct1stBlock = 655220
    // const Oct30thBlock = 659634
    // const inflows = await lib.metrics.tokenInflows(Oct1stBlock, Oct30thBlock)
    //
    // console.log(
    //   `Token inflows between blocks ${Oct1stBlock} and ${Oct30thBlock}:\n${JSON.stringify(
    //     inflows,
    //     null,
    //     2
    //   )}`
    // )
  } catch (err) {
    console.error('Error in runReport(): ', err)
  }
}
runReport()

module.exports = BoilplateLib
