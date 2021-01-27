/*
  This library contains functions around retrieving PSF metrics.
*/

// Public npm libraries
const BCHJS = require('@psf/bch-js')

class Metrics {
  constructor (metricsConfig) {
    this.bchjs = new BCHJS()
  }

  async tokenLiquidityBurn (startBlock, stopBlock) {
    try {
      const burnAddr = 'bitcoincash:qqsrke9lh257tqen99dkyy2emh4uty0vky9y0z0lsr'

      const txData = await this.bchjs.Electrumx.transactions(burnAddr)
      // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

      const txWindow = txData.transactions.filter(elem => {
        return elem.height > startBlock && elem.height < stopBlock
      })
      console.log(`txWindow: ${JSON.stringify(txWindow, null, 2)}`)

      return true
    } catch (err) {
      console.error('Error in tokenLiquidity()')
      throw err
    }
  }
}

module.exports = Metrics
