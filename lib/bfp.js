/*
  This file contains utility functions for interacting with the Bitcoin Files
  Protocol (BFP):
  https://github.com/simpleledger/slp-specifications/blob/master/bitcoinfiles.md

  This file contains functions based on these examples:
  https://github.com/Permissionless-Software-Foundation/bch-js-examples/tree/master/applications/bfp
*/

const BCHJS = require('@psf/bch-js')

let _this

// Set NETWORK to either testnet or mainnet
const NETWORK = 'testnet'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
// const MAINNET_API_PAID = 'https://api.fullstack.cash/v3/'
// const TESTNET_API_PAID = 'https://tapi.fullstack.cash/v3/'

// Instantiate bch-js based on the network.
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({
  restURL: MAINNET_API_FREE
})
else bchjs = new BCHJS({
  restURL: TESTNET_API_FREE
})
let config = {};
config.bchjs = bchjs

const Bfp = require('bitcoinfiles-node').bfp
const UtilLib = require('bch-util')
const uut = new UtilLib(config)

let bfp = new Bfp(bchjs, 'testnet')
if (NETWORK === 'mainnet') bfp = new Bfp(bchjs, 'mainnet')


let walletInfo
let SEND_ADDR
// const SEND_MNEMONIC = walletInfo.mnemonic
let wif
const VERBOSE = true

class BFP {
  constructor(config) {
    this.bfp = bfp
    this.bchjs = bchjs
    _this = this

    walletInfo = _this.initWallet()

    SEND_ADDR = walletInfo.cashAddress
    // const SEND_MNEMONIC = walletInfo.mnemonic
    wif = walletInfo.WIF
  }

  initWallet() {
    try {
      return _this.openWallet()
    } catch (err) {
      throw new Error('Could not open wallet.json. Generate a wallet with create-wallet first.');
    }
  }

  openWallet() {
    return require('./wallet.json')
  }

  async writeBFP() {
    try {
      //const walletInfo = _this.openWallet()
      const fileName = 'test'
      const fileExt = '.ext'
      const jsonObj = '{"ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf","ddfasf":"dsafadsf",}'
      const balance = await _this.getBCHBalance(SEND_ADDR)
      _this.checkBalanceKillProcessIfZero(balance)

      //_logTimeAndData(jsonObj)

      const jsonBuffered = _this._convertToBufferedBytes(jsonObj)
      const uploadCost = _this._estimateUploadCost(jsonBuffered)
      const utxos = await _this.getUTXOsByAddress(SEND_ADDR)

      const biggestUTXO = await uut.util.findBiggestUtxo(utxos.utxos)
      _this._logUTXO(biggestUTXO)

      const biggestUTXObalance = _this._addUTXOproperties(biggestUTXO).value
      _this._throwErrorIfBalanceIsInSufficient(biggestUTXObalance, uploadCost)

      //TODO Clarify if the following statement shall be activated by parameter or not at all
      // Generate a change address from a Mnemonic of a private key.
      // const change = await changeAddrFromMnemonic(SEND_MNEMONIC)

      return _this._uploadToBlockchain(biggestUTXO, jsonBuffered, fileName, fileExt)

      //onUploadFinishedCallback(fileId)
      //TODO Clarify the intention of the following statement (as it was activated in the examples)
      //console.log('There is a bug. The transaction hash is reversed.')
    } catch (err) {
      console.log('error: ', err)
      throw err
    }
  }

  _throwErrorIfBalanceIsInSufficient(biggestUTXObalance, uploadCost) {
    if (biggestUTXObalance < uploadCost) {
      throw new Error(`Not enough satoshis in the largest utxo(${biggestUTXObalance}) to pay the BFP fees of ${uploadCost}`)
    }
  }

  _logUTXO(utxo) {
    if (VERBOSE) console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)
  }

  /*_logTimeAndData(jsonObj) {
    if (VERBOSE) console.log(new Date().toString() + '\nWriting the following JSON object to the blockchain: ')
    if (VERBOSE) console.log(`
  ${
    JSON.stringify(jsonObj, null, 2)
  }
  `)
  }*/

  async _uploadToBlockchain(utxo, jsonBuffered, fileName, fileExt) {
    const fileId = await bfp.uploadFile(
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

    if (VERBOSE) console.log(`The JSON has been uploaded to the blockchain with BFP file ID: ${fileId} at ${new Date().toString()}`)

    return fileId
  }

  _addUTXOproperties(utxo) {
    utxo.vout = utxo.tx_pos
    utxo.txid = utxo.tx_hash
    utxo.satoshis = utxo.value
    utxo.address = bchjs.Address.toLegacyAddress(SEND_ADDR)
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
    if (VERBOSE) console.log("upload cost: " + uploadCost)
    return uploadCost
  }

  async getUTXOsByAddress(address) {
    const utxos = await bchjs.Electrumx.utxo(address)
    if (VERBOSE) console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
    if (utxos.utxos.length === 0) throw new Error('No UTXOs found.')
    return utxos;
  }

  // Get the balance in BCH of a BCH address.
  async getBCHBalance(addr) {
    try {
      const result = await bchjs.Electrumx.balance(addr)

      if (VERBOSE) console.log(result)

      // The total balance is the sum of the confirmed and unconfirmed balances.
      const satBalance =
        Number(result.balance.confirmed) + Number(result.balance.unconfirmed)

      // Convert the satoshi balance to a BCH balance
      const bchBalance = bchjs.BitcoinCash.toBitcoinCash(satBalance)

      if (VERBOSE) console.log(`bchBalance: ${JSON.stringify(bchBalance, null, 2)}`)
      if (VERBOSE) console.log(`Balance of address ${addr} is ${bchBalance} BCH.`)

      return bchBalance
    } catch (err) {
      console.error('Error in _getBCHBalance: ', err)
      console.log(`addr: ${addr}`)
      throw err
    }
  }

  checkBalanceKillProcessIfZero(balance) {
    if (balance <= 0.0) {
      console.log('Balance of sending address is zero.')
      throw new Error('Balance of sending address is zero.');
    }
  }
}

module.exports = BFP
