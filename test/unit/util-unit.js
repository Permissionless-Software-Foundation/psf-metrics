/*
  Unit tests for the util.js utility library.
*/

// npm libraries
const chai = require('chai')
const sinon = require('sinon')

// Locally global variables.
const assert = chai.assert

// Mocking data libraries.
const mockData = require('./mocks/util-mocks')

// Unit under test
const UtilLib = require('../../lib/util')
const uut = new UtilLib(true)

describe('#util.js', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => (sandbox = sinon.createSandbox()))
  afterEach(() => sandbox.restore())

  describe('#getBchData', () => {
    it('should throw error if address is not a string', async () => {
      try {
        const addr = 1234

        await uut.getBchData(addr)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Address must be a string')
      }
    })

    it('should get BCH data on an address', async () => {
      // Mock external dependencies.
      sandbox
        .stub(uut.bchjs.Blockbook, 'balance')
        .resolves(mockData.mockBalance)
      sandbox.stub(uut.bchjs.Blockbook, 'utxo').resolves(mockData.mockUtxos)

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

  describe('#getUTXOsByAddress', () => {
    it('should get UTXOs on an address', async () => {
      sandbox
        .stub(uut.bchjs.Electrumx, 'utxo')
        .resolves(mockData.electrumUTXOs)
      const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const utxos = await uut.getUTXOsByAddress(addr)

      // Assert essential UTXOs properties exist.
      assert.isArray(utxos.utxos)
      assert.property(utxos.utxos[0], 'txid')
      assert.property(utxos.utxos[1], 'vout')
      assert.property(utxos.utxos[2], 'satoshis')
    })
  })

  describe('#getBCHBalance', () => {
    it('should get BCH balance on an address', async () => {
      sandbox
        .stub(uut.bchjs.Electrumx, 'balance')
        .resolves(mockData.electrumBalance)
      const addr = 'irrelevantForTheMock'

      const balance = await uut.getBCHBalance(addr, true)

      assert.equal(balance, 1)
    })
  })

  describe('#findBiggestUtxo', () => {
    it('should get biggest UTXO on an address', async () => {
      sandbox
        .stub(uut.bchjs.Blockchain, 'getTxOut')
        .resolves(mockData.electrumUTXOs)

      const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const utxo = await uut.findBiggestUtxo(mockData.electrumUTXOs.utxos, true)

      // 2b37bdb3b63dd0bca720437754a36671431a950e684b64c44ea910ea9d5297c7 is the biggest of the three mocked UTXOs
      assert.equal(utxo.txid, '2b37bdb3b63dd0bca720437754a36671431a950e684b64c44ea910ea9d5297c7')
    })
  })
})
