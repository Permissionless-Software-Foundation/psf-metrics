/*
  Integration tests for the util.js utility library.
*/

// npm libraries
const chai = require('chai')

// Locally global variables.
const assert = chai.assert

// Unit under test
const UtilLib = require('../../lib/util')
const uut = new UtilLib()

describe('#util.js', () => {
  describe('#getBchData', () => {
    it('should get BCH data on an address', async () => {
      const addr = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      const bchData = await uut.getBchData(addr)

      // Assert that top-level properties exist.
      assert.property(bchData, 'balance')
      assert.property(bchData, 'utxos')

      // Assert essential UTXOs properties exist.
      assert.isArray(bchData.utxos)
      assert.property(bchData.utxos[0], 'txid')
      assert.property(bchData.utxos[0], 'vout')
      assert.property(bchData.utxos[0], 'satoshis')
    })
  })
  describe('#getBCHBalance', () => {
    it('should get BCH balance on an address', async () => {
      const addr = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      const utxos = await uut.getUTXOsByAddress(addr)

      // Assert essential UTXOs properties exist.
      assert.isArray(utxos)
      assert.property(utxos[0], 'txid')
      assert.property(utxos[0], 'vout')
      assert.property(utxos[0], 'satoshis')
    })
  })
})
