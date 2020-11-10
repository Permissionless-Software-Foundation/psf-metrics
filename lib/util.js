/*
  An example of a typical utility library. Things to notice:
  - This library is exported as a Class.
  - External dependencies are embedded into the class 'this' object: this.bitbox
  - `_this` maintains top-level context for `this`.
*/

'use strict'

// npm libraries
const BCHJS = require('@psf/bch-js')

// Locally global variables.
let _this
const bchjs = new BCHJS()

let verbose = false;

class UtilLib {
  constructor (verboseLogging = false) {
    // Embed external libraries into the class, for easy mocking.
    this.bchjs = bchjs
    if (verboseLogging) verbose = true;
    _this = this
  }

  async getBchData (addr) {
    try {
      // Validate Input
      if (typeof addr !== 'string') throw new Error('Address must be a string')

      const balance = await _this.bchjs.Blockbook.balance(addr)

      const utxos = await _this.bchjs.Blockbook.utxo(addr)

      const bchData = {
        balance,
        utxos
      }

      return bchData
    } catch (err) {
      // Optional log to indicate the source of the error. This would normally
      // be written with a logging app like Winston.
      console.log('Error in util.js/getBalance()')
      throw err
    }
  }

  async getUTXOsByAddress (address) {
      const utxos = await bchjs.Electrumx.utxo(address)
      if (verbose) console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
      if (utxos.utxos.length === 0) throw new Error('No UTXOs found.')
      return utxos;
  }

  // Get the balance in BCH of a BCH address.
  async getBCHBalance (addr) {
    try {
      const result = await bchjs.Electrumx.balance(addr)

      if (verbose) console.log(result)

      // The total balance is the sum of the confirmed and unconfirmed balances.
      const satBalance =
        Number(result.balance.confirmed) + Number(result.balance.unconfirmed)

      // Convert the satoshi balance to a BCH balance
      const bchBalance = bchjs.BitcoinCash.toBitcoinCash(satBalance)

      if (verbose) console.log(`bchBalance: ${JSON.stringify(bchBalance, null, 2)}`)
      if (verbose) console.log(`Balance of address ${addr} is ${bchBalance} BCH.`)

      return bchBalance
    } catch (err) {
      console.error('Error in _getBCHBalance: ', err)
      console.log(`addr: ${addr}`)
      throw err
    }
  }

  checkBalanceKillProcessIfZero (balance) {
      if (balance <= 0.0) {
        console.log('Balance of sending address is zero. Exiting.')
        process.exit(0)
      }
  }

  // Returns the utxo with the biggest balance from an array of utxos.
  async findBiggestUtxo (utxos) {
    try {
      let largestAmount = 0
      let largestIndex = 0

      for (var i = 0; i < utxos.length; i++) {
        const thisUtxo = utxos[i]
        if (verbose) console.log(`thisUTXO: ${JSON.stringify(thisUtxo, null, 2)}`);

        // Validate the UTXO data with the full node.
        const txout = await bchjs.Blockchain.getTxOut(
          thisUtxo.tx_hash,
          thisUtxo.tx_pos,
          true
        )
        if (verbose) console.log(`txout: ${JSON.stringify(txout,null,2)}`)

        if (txout === null) {
          // If the UTXO has already been spent, the full node will respond with null.
          console.log(
            'Stale UTXO found. You may need to wait for the indexer to catch up.'
          )
          continue
        }

        if (thisUtxo.value > largestAmount) {
          largestAmount = thisUtxo.value
          largestIndex = i
        }
      }

      return utxos[largestIndex]
    } catch (err) {
      console.error('Error in _findBiggestUtxo()')
      throw err
    }
  }
}

module.exports = UtilLib
