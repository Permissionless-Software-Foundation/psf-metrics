/*
  Unit tests for the bfp.js Bitcoin Files library.
*/

// npm libraries
const chai = require('chai')
const sinon = require('sinon')
//const Bfp = require('bitcoinfiles-node').bfp

// Locally global variables.
const assert = chai.assert

// Mocking data libraries.
const mockData = require('./mocks/bfp-mocks')

// Unit under test
const BFP = require('../../lib/bfp')

const bfp = new BFP()

describe('#bfp.js', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => (sandbox = sinon.createSandbox()))
  afterEach(() => sandbox.restore())

  describe('#writeBfp', () => {
    it('should write a file to the blockchain', async () => {
      /*sandbox
        .stub(uut.bchjs.Electrumx, 'balance')
        .resolves(mockData.electrumBalance)

      sandbox
        .stub(uut.bchjs.Crypto, 'sha256')
        .resolves("n16vM3Ndnpp43GzDnxhHgshMCXspkvsJoq")

      sandbox
        .stub(Bfp, 'calculateFileUploadCost')
        .resolves(1042)

      sandbox
        .stub(uut.bchjs.Electrumx, 'utxo')
        .resolves(mockData.electrumUTXOs)*/

      /*
            sandbox  //TODO I WANT TO STUB THE CALL IN _uploadToBlockchain but getting: TypeError: Cannot stub non-existent property uploadFile
              .stub(bfp, 'uploadFile')
              .resolves('fileId8739873984')*/


      assert.isNotEmpty(await bfp.writeBFP())
      done()
    })
  })

  describe('#getUTXOsByAddress', () => {
    it('should get UTXOs on an address', async () => {
      sandbox
        .stub(bfp.bchjs.Electrumx, 'utxo')
        .resolves(mockData.electrumUTXOs)
      const addr = 'bchtest:qrtddel54p4zxmrkf7jyex7j06lhx48k3s5wqpgu5p'
      //const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

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
      sandbox
        .stub(bfp.bchjs.Electrumx, 'balance')
        .resolves(mockData.electrumBalance)

      const addr = 'bchtest:qrtddel54p4zxmrkf7jyex7j06lhx48k3s5wqpgu5p'
      //const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const balance = await bfp.getBCHBalance(addr, true)

      assert.equal(balance, 0.01)
      //assert.equal(balance, 0.00001) MAINNET
    })
  })
})
