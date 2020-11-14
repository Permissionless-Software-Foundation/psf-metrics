/*
  This file contains utility functions for interacting with the Bitcoin Files
  Protocol (BFP):
  https://github.com/simpleledger/slp-specifications/blob/master/bitcoinfiles.md

  This file contains functions based on these examples:
  https://github.com/Permissionless-Software-Foundation/bch-js-examples/tree/master/applications/bfp

  ToDo:
  - writeBFP() needs to be abstracted. A config object should be passed in
  with the following data:
    - WIF private key to pay for transactions.
    - file name
    - file extension
    - JSON data

  - A method for reversing the TXID needs to be added. BFP returns the TXID
    in the wrong endian-ness.
  - The dependency on an external wallet.json should be eliminated.
  - A readBFP() method should be added.
*/

const BCHJS = require('@psf/bch-js')
const UtilLib = require('bch-util')
const Bfp = require('bitcoinfiles-node').bfp

let _this

// REST API servers.
const BCHN_MAINNET = 'https://bchn.fullstack.cash/v3/'
// const ABC_MAINNET = 'https://abc.fullstack.cash/v3/'

let walletInfo
let SEND_ADDR
// const SEND_MNEMONIC = walletInfo.mnemonic
let wif

class BFP {
  // Expects a config object
  constructor (config) {
    _this = this

    // Encapsulate dependencies.
    this.bchjs = new BCHJS({
      restURL: BCHN_MAINNET
    })
    this.bfp = new Bfp(this.bchjs, 'mainnet')
    this.bchUtil = new UtilLib({ bchjs: this.bchjs })

    // Ensure wallet info is passed in.
    if (!config || !config.walletInfo) {
      throw new Error('Must pass wallet data on initialization')
    }
    walletInfo = config.walletInfo

    SEND_ADDR = walletInfo.cashAddress
    // const SEND_MNEMONIC = walletInfo.mnemonic
    wif = walletInfo.WIF
  }

  async writeBFP () {
    try {
      const fileName = 'test'
      const fileExt = '.ext'
      const jsonObj =
        '{"ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf",}'

      // Get the balance of the wallet.
      const balance = await _this.getBCHBalance(SEND_ADDR)

      // Exit if there is no BCH in the wallet.
      _this.checkBalanceKillProcessIfZero(balance)

      // Convert the JSON object to a buffer.
      const jsonBuffered = _this._convertToBufferedBytes(jsonObj)

      // Calculate the upload cost.
      const uploadCost = _this._estimateUploadCost(jsonBuffered)

      // Get the UTXO associated with the address in the wallet.
      const utxos = await _this.getUTXOsByAddress(SEND_ADDR)

      // Get the biggest UTXO.
      const biggestUTXO = await this.bchUtil.util.findBiggestUtxo(utxos.utxos)

      const biggestUTXObalance = _this._addUTXOproperties(biggestUTXO).value

      // Throw an error if the UTXO is not big enough to pay the fee.
      _this._throwErrorIfBalanceIsInSufficient(biggestUTXObalance, uploadCost)

      const txidReversed = _this._uploadToBlockchain(
        biggestUTXO,
        jsonBuffered,
        fileName,
        fileExt
      )

      return txidReversed
    } catch (err) {
      console.error('Error in writeBFP()')
      throw err
    }
  }

  _throwErrorIfBalanceIsInSufficient (biggestUTXObalance, uploadCost) {
    if (biggestUTXObalance < uploadCost) {
      throw new Error(
        `Not enough satoshis in the largest utxo(${biggestUTXObalance}) to pay the BFP fees of ${uploadCost}`
      )
    }
  }

  async _uploadToBlockchain (utxo, jsonBuffered, fileName, fileExt) {
    const fileId = await this.bfp.uploadFile(
      utxo,
      SEND_ADDR,
      wif,
      jsonBuffered,
      fileName,
      fileExt,
      null,
      null,
      SEND_ADDR,
      null,
      null,
      null,
      null
    )

    return fileId
  }

  // Add property differences between Electrumx and Insight (different indexers).
  _addUTXOproperties (utxo) {
    utxo.vout = utxo.tx_pos
    utxo.txid = utxo.tx_hash
    utxo.satoshis = utxo.value
    utxo.address = this.bchjs.Address.toLegacyAddress(SEND_ADDR)
    return utxo
  }

  _convertToBufferedBytes (jsonObj) {
    return Buffer.from(JSON.stringify(jsonObj))
  }

  _estimateUploadCost (jsonBuffered) {
    const fileSize = jsonBuffered.length
    const fileSha256Hex = this.bchjs.Crypto.sha256(jsonBuffered).toString('hex')
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

    return uploadCost
  }

  // Get the UTXOs associated with an address.
  async getUTXOsByAddress (address) {
    const utxos = await this.bchjs.Electrumx.utxo(address)

    if (utxos.utxos.length === 0) throw new Error('No UTXOs found.')

    return utxos
  }

  // Get the balance in BCH of a BCH address.
  async getBCHBalance (addr) {
    try {
      const result = await this.bchjs.Electrumx.balance(addr)

      // The total balance is the sum of the confirmed and unconfirmed balances.
      const satBalance =
        Number(result.balance.confirmed) + Number(result.balance.unconfirmed)

      // Convert the satoshi balance to a BCH balance
      const bchBalance = this.bchjs.BitcoinCash.toBitcoinCash(satBalance)

      // console.log(`bchBalance: ${JSON.stringify(bchBalance, null, 2)}`)
      // console.log(`Balance of address ${addr} is ${bchBalance} BCH.`)

      return bchBalance
    } catch (err) {
      console.error('Error in _getBCHBalance()')
      throw err
    }
  }

  checkBalanceKillProcessIfZero (balance) {
    if (balance <= 0.0) {
      console.log('Balance of sending address is zero.')
      throw new Error('Balance of sending address is zero.')
    }
  }
}

module.exports = BFP
