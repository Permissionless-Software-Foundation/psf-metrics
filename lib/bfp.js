/*
  This file contains utility functions for interacting with the Bitcoin Files
  Protocol (BFP):
  https://github.com/simpleledger/slp-specifications/blob/master/bitcoinfiles.md

  This file contains functions based on these examples:
  https://github.com/Permissionless-Software-Foundation/bch-js-examples/tree/master/applications/bfp
*/

const BCHJS = require('@psf/bch-js')
const UtilLib = require('util')

let _this

// Set NETWORK to either testnet or mainnet
const NETWORK = 'mainnet'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
// const MAINNET_API_PAID = 'https://api.fullstack.cash/v3/'
// const TESTNET_API_PAID = 'https://tapi.fullstack.cash/v3/'

// Instantiate bch-js based on the network.
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
else bchjs = new BCHJS({ restURL: TESTNET_API_FREE })

const Bfp = require('bitcoinfiles-node').bfp

let bfp = new Bfp(bchjs, 'testnet')
if (NETWORK === 'mainnet') bfp = new Bfp(bchjs, 'mainnet')

  let walletInfo
  let sendersAddress
  let wif
  let SEND_MNEMONIC //TODO clarify, what is the purpose of this variable
  let verbose = false

class BFP {
  constructor (wallet, verboseLogging) {
    try {
      walletInfo = wallet
      this.bchjs = new BCHJS()
      _this = this

      if (typeof verboseLogging !== 'undefined' && verboseLogging)
        verbose = true

      //TODO Clarify if wallet shall be a parameter to the constructor or how is this library intented to be used?
      //if (typeof wallet === 'undefined' || wallet == null)
        //walletInfo = require('../examples/wallet/create-wallet/wallet.json')

      sendersAddress = walletInfo.cashAddress
      //SEND_MNEMONIC = walletInfo.mnemonic
      wif = walletInfo.WIF
    } catch (err) {
      console.log(
        'ERROR constructor BFP'
      )
      throw new Error(err)
    }
  }

  async writeBFP (jsonObj, fileName, fileExt, onUploadFinishedCallback) {
    try {
      let uut = new UtilLib()
      const balance = await uut.getBCHBalance(sendersAddress, verbose)
      uut.checkBalanceKillProcessIfZero()

      _logTimeAndData(jsonObj)

      const jsonBuffered = _convertToBufferedBytes(jsonObj)
      const uploadCost = _estimateUploadCost(jsonBuffered)
      const utxos = uut.getUTXOsByAddress(sendersAddress)

      const biggestUTXO = await uut.findBiggestUtxo(utxos.utxos, verbose)
      _logUTXO(biggestUTXO)

      const biggestUTXObalance = _addUTXOproperties(biggestUTXO).value
      _throwErrorIfBalanceIsInSufficient(biggestUTXObalance, uploadCost)

      //TODO Clarify if the following statement shall be activated by parameter or not at all
      // Generate a change address from a Mnemonic of a private key.
      // const change = await changeAddrFromMnemonic(SEND_MNEMONIC)

      const fileId = _uploadToBlockchain(biggestUTXO, jsonBuffered, fileName, fileExt)

      onUploadFinishedCallback(fileId)
      //TODO Clarify the intention of the following statement (as it was activated in the examples)
      //console.log('There is a bug. The transaction hash is reversed.')
    } catch (err) {
      console.log('error: ', err)
    }
  }

  _throwErrorIfBalanceIsInSufficient(biggestUTXObalance, uploadCost) {
      if (biggestUTXObalance < uploadCost) {
        throw new Error(
          `Not enough satoshis in the largest utxo (${biggestUTXObalance}) to pay the BFP fees of ${uploadCost}`
        )
      }
  }

  _logUTXO(biggestUTXO) {
    if (verbose) console.log(`biggestUTXO: ${JSON.stringify(biggestUTXO, null, 2)}`)
  }

  _logTimeAndData(jsonObj) {
    if (verbose) console.log(new Date().toString() + '\nWriting the following JSON object to the blockchain: ')
    if (verbose) console.log(`${JSON.stringify(jsonObj, null, 2)}`)
  }

  async _uploadToBlockchain(utxo, jsonBuffered, fileName, fileExt) {
    const fileId = await bfp.uploadFile(
            utxo,
            sendersAddress,
            wif,
            jsonBuffered,
            fileName,
            fileExt,
            null,
            null,
            sendersAddress,
            null,
            null,
            null,
            null
          )

          if (verbose) console.log(
            `The JSON has been uploaded to the blockchain with BFP file ID: ${fileId} at ${new Date().toString()}`
          )

          return fileId
  }

  _addUTXOproperties(utxo) {
    utxo.vout = utxo.tx_pos
    utxo.txid = utxo.tx_hash
    utxo.satoshis = utxo.value
    utxo.address = bchjs.Address.toLegacyAddress(sendersAddress)
    return utxo
  }

  _convertToBufferedBytes(jsonObj) {
    return Buffer.from(JSON.stringify(jsonObj))
  }

  _estimateUploadCost(jsonBuffered) {
        const fileSize = jsonBuffered.length
        const fileSha256Hex = bchjs.Crypto.sha256(jsonBuffered).toString('hex')
        const config = {
          msgType: 1,
          chunkCount: 1,
          fileName: 'test',
          fileExt: '.json',
          fileSize: fileSize,
          fileSha256Hex: fileSha256Hex,
          prevFileSha256Hex: null,
          fileUri: null,
          chunkData: null // chunk not needed for cost estimate stage
        }

        const uploadCost = Bfp.calculateFileUploadCost(fileSize, config)
        if (verbose) console.log(`\nupload cost: ${uploadCost} satoshis`)
        return uploadCost
  }

}

module.exports = BFP
