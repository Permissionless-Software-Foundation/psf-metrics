/*
  Unit tests for the bfp.js Bitcoin Files library.
*/

// npm libraries
const chai = require('chai')
// const sinon = require('sinon')
// const Bfp = require('bitcoinfiles-node').bfp

// Locally global variables.
const assert = chai.assert

// Unit under test
const BFP = require('../../lib/bfp')
const bfp = new BFP()
// const Bfp = require('bitcoinfiles-node').bfp

describe('#bfp.js', () => {
  describe('#getUTXOsByAddress', () => {
    it('should get UTXOs on an address', async () => {
      const addr = 'bchtest:qrtddel54p4zxmrkf7jyex7j06lhx48k3s5wqpgu5p'
      // const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const utxos = await bfp.getUTXOsByAddress(addr)
      console.log(utxos)

      // Assert essential UTXOs properties exist.
      assert.isArray(utxos.utxos)
      assert.property(utxos.utxos[0], 'tx_hash')
      assert.property(utxos.utxos[0], 'height')
      assert.property(utxos.utxos[0], 'value')
    })
  })

  describe('#getBCHBalance', () => {
    it('should get BCH balance on an address', async () => {
      const addr = 'bchtest:qrtddel54p4zxmrkf7jyex7j06lhx48k3s5wqpgu5p'
      // const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const balance = await bfp.getBCHBalance(addr, true)

      assert.equal(balance, 0.01)
      // assert.equal(balance, 0.00001) MAINNET
    })
  })

  describe('#writeBfp', () => {
    it('should write a file to the blockchain', async () => {
      assert.isNotEmpty(await bfp.writeBFP())
    })
  })
})
