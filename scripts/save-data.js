/*
  This starts an interval that records the price of BCH and PSF tokens to the
  blockchain, using the memo.cash protocol.
*/

// const BCHJS = require('@psf/bch-js')
// const bchjs = new BCHJS()

// const MsgLib = require('bch-message-lib')
// const msgLib = new MsgLib({ bchjs })

const axios = require('axios')

async function startProgram () {
  try {
    // Get the price of PSF tokens.
    const psfData = await axios.get('https://psfoundation.cash/price')
    // const { usdPerBCH, bchBalance, tokenBalance, usdPerToken} = psfData.data
    console.log('psfData: ', psfData)
  } catch (err) {
    console.log('Error in startProgram(): ', err)
  }
}
startProgram()
