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
let sendersAddress
let fileName
let fileExt
// const SEND_MNEMONIC = walletInfo.mnemonic
let wif
let jsonObj

class BFP {
  constructor(config) {
    _this = this

    this.bchjs = new BCHJS({
      restURL: BCHN_MAINNET
    })
    this.bfp = new Bfp(this.bchjs, 'mainnet')
    this.bchUtil = new UtilLib({
      bchjs: this.bchjs
    })

    _this._throwErrorOnInvalidConfigParameters(config)

    fileName = config.filename
    fileExt = config.fileExt
    wif = config.wif
    jsonObj = config.data //might make sense to call the variable data within this class too, as user could write any data String to the blockchain?
    sendersAddress = _this._generateCashAddressFromWif(wif)
    // const SEND_MNEMONIC = walletInfo.mnemonic
  }

  _generateCashAddressFromWif(wif) {
    //TODO generate cashAddress from WIF, which library shall it use?
    return 'bitcoincash:qqppp0wyzlzrratv6nk2d4j28cjaqscyqykfkduk4g'
  }

  _throwErrorOnInvalidConfigParameters(config) {
    if (config === 'undefined' || config == null) {
      _this._throwMissingPropertyError('config');
    }
    if (!config.wif) {
      _this._throwMissingPropertyError('config.wif');
    }
    if (!config.fileName) {
      _this._throwMissingPropertyError('config.fileName');
    }
    if (!config.fileExt) {
      _this._throwMissingPropertyError('config.fileExt');
    }
    if (!config.data) {
      _this._throwMissingPropertyError('config.data');
    }
    if (config.wif.length != 52 && config.wif.length != 51) { //shall it accept uncompressed WIF?
      throw new Error('config.wif format is incorrect, length must be 52 or 51 but it is:' + config.wif.length)
    }
  }

  _throwMissingPropertyError(property) {
    throw new Error(`Must pass ${property} to constructor`)
  }

  async writeBFP() {
    try {
      // Get the balance of the wallet.
      const balance = await _this.getBCHBalance(sendersAddress)

      // Exit if there is no BCH in the wallet.
      _this.checkBalanceKillProcessIfZero(balance)

      // Convert the JSON object to a buffer.
      const jsonBuffered = _this._convertToBufferedBytes(jsonObj)

      // Calculate the upload cost.
      const uploadCost = _this._estimateUploadCost(jsonBuffered)

      // Get the UTXO associated with the address in the wallet.
      const utxos = await _this.getUTXOsByAddress(sendersAddress)

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

  _throwErrorIfBalanceIsInSufficient(biggestUTXObalance, uploadCost) {
    if (biggestUTXObalance < uploadCost) {
      throw new Error(
        `Not enough satoshis in the largest utxo(${biggestUTXObalance}) to pay the BFP fees of ${uploadCost}`
      )
    }
  }

  async _uploadToBlockchain(utxo, jsonBuffered, fileName, fileExt) {
    const fileId = await this.bfp.uploadFile(
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

    return fileId
  }

  // Add property differences between Electrumx and Insight (different indexers).
  _addUTXOproperties(utxo) {
    utxo.vout = utxo.tx_pos
    utxo.txid = utxo.tx_hash
    utxo.satoshis = utxo.value
    utxo.address = this.bchjs.Address.toLegacyAddress(sendersAddress)
    return utxo
  }

  _convertToBufferedBytes(jsonObj) {
    return Buffer.from(JSON.stringify(jsonObj))
  }

  _estimateUploadCost(jsonBuffered) {
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
  async getUTXOsByAddress(address) {
    const utxos = await this.bchjs.Electrumx.utxo(address)

    if (utxos.utxos.length === 0) throw new Error('No UTXOs found.')

    return utxos
  }

  // Get the balance in BCH of a BCH address.
  async getBCHBalance(addr) {
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

  checkBalanceKillProcessIfZero(balance) {
    if (balance <= 0.0) {
      console.log('Balance of sending address is zero.')
      throw new Error('Balance of sending address is zero.')
    }
  }
}

module.exports = BFP
