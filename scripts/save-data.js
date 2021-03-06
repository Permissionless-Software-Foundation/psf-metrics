/*
  This starts an interval that records the price of BCH and PSF tokens to the
  blockchain, using the memo.cash protocol.
*/

const wallet = require('../wallet.json')

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

const MsgLib = require('bch-message-lib/index')
const msgLib = new MsgLib({ bchjs })

const axios = require('axios')

const TOKENID = '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'

async function startProgram () {
  try {
    // Write the price data to the chain once every 24 hours.
    setInterval(function () {
      writeDataToChain()
    }, 60000 * 60 * 24)

    // Write data to the chain right away.
    writeDataToChain()
  } catch (err) {
    console.log('Error in startProgram(): ', err)
  }
}
startProgram()

async function writeDataToChain () {
  try {
    // Get the price of PSF tokens.
    const psfData = await axios.get('https://psfoundation.cash/price')
    // const { usdPerBCH, bchBalance, tokenBalance, usdPerToken} = psfData.data
    // console.log('psfData: ', psfData)

    // Convert the usdPerBCH to a number.
    const priceData = psfData.data
    priceData.usdPerBCH = Number(priceData.usdPerBCH)

    // Add a timestamp.
    const now = new Date()
    priceData.time = now.toISOString()

    const tokenStats = await bchjs.SLP.Utils.tokenStats(TOKENID)
    // console.log(`tokenStats: ${JSON.stringify(tokenStats, null, 2)}`)
    priceData.circulatingSupply = tokenStats.circulatingSupply

    // Convert the object to a string.
    const dataStr = JSON.stringify(priceData, null, 2)
    // console.log('dataStr: ', dataStr)

    // Generate a BCH transaction using the Memo.cash protocol.
    const hex = await msgLib.memo.memoPush(dataStr, wallet.WIF)
    // console.log('hex: ', hex)

    // Broadcast the transaction.
    const txid = await bchjs.RawTransactions.sendRawTransaction(hex)
    console.log('Data written to the chain.')
    console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`)
  } catch (err) {
    console.log('Error in writeDataToChain()')
    throw err
  }
}
