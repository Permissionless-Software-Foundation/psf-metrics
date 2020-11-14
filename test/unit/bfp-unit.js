/*
  Unit tests for the bfp.js Bitcoin Files library.
*/

// npm libraries
const chai = require('chai')
const sinon = require('sinon')
// const Bfp = require('bitcoinfiles-node').bfp

// Locally global variables.
const assert = chai.assert

// Mocking data libraries.
const mockData = require('./mocks/bfp-mocks')

// Unit under test
const BFP = require('../../lib/bfp')
const bfp = new BFP()
const Bfp = require('bitcoinfiles-node').bfp

describe('#bfp.js', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => (sandbox = sinon.createSandbox()))
  afterEach(() => sandbox.restore())

  describe('#getUTXOsByAddress', () => {
    it('should get UTXOs on an address', async () => {
      sandbox.stub(bfp.bchjs.Electrumx, 'utxo').resolves(mockData.electrumUTXOs)
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
    it('should throw an error as address is invalid', async () => {
      const addr = 'asdf'
      try {
        await bfp.getBCHBalance(addr, true)
        assert.fail()
      } catch (e) {
        assert.equal(e.error, 'Unsupported address format : asdf')
      }
    })
    it('should get BCH balance on an address', async () => {
      sandbox
        .stub(bfp.bchjs.Electrumx, 'balance')
        .resolves(mockData.electrumBalance)

      const addr = 'bchtest:qrtddel54p4zxmrkf7jyex7j06lhx48k3s5wqpgu5p'
      // const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const balance = await bfp.getBCHBalance(addr, true)

      assert.equal(balance, 1)
      // assert.equal(balance, 0.00001) MAINNET
    })
  })

  describe('#_throwErrorIfBalanceIsInSufficient', () => {
    it('should throw an error as balance is insufficient', async () => {
      try {
        await bfp._throwErrorIfBalanceIsInSufficient(1, 2)
        assert.fail()
      } catch (e) {
        assert.equal(
          e,
          'Error: Not enough satoshis in the largest utxo(1) to pay the BFP fees of 2'
        )
      }
    })
  })

  describe('#getUTXOsByAddress', () => {
    it('should throw an error as address is invalid', async () => {
      sandbox.stub(bfp.bchjs.Electrumx, 'utxo').resolves({
        utxos: []
      })
      try {
        await bfp.getUTXOsByAddress('')
        assert.fail()
      } catch (e) {
        assert.equal(e, 'Error: No UTXOs found.')
      }
    })
  })

  describe('#initWallet', () => {
    it('should throw an error as wallet not found', async () => {
      try {
        sandbox.stub(bfp, 'openWallet').throws(new Error())
        bfp.initWallet()
      } catch (e) {
        assert.equal(
          e.message,
          'Could not open wallet.json. Generate a wallet with create-wallet first.'
        )
      }
    })
  })

  describe('#checkBalanceKillProcessIfZero', () => {
    it('should kill process as balance is 0.0', async () => {
      try {
        await bfp.checkBalanceKillProcessIfZero(0.0)
        assert.fail()
      } catch (e) {
        assert.equal(e, 'Error: Balance of sending address is zero.')
      }
    })
  })

  describe('#writeBfp', () => {
    it('should throw error as addr is invalid', async () => {
      try {
        const error = new Error('some fake error')
        sandbox.stub(bfp, 'getBCHBalance').throws(error)
        await bfp.writeBFP(true)
        assert.fail()
      } catch (e) {
        assert.notEqual(e.message, 'assert.fail()')
        assert.notEqual(
          e,
          'TypeError: Cannot stub non-existent property SEND_ADDR'
        )
        assert.equal(e, 'Error: some fake error')
      }
    })
    it('should write a file to the blockchain', async () => {
      sandbox
        .stub(bfp.bchjs.Electrumx, 'balance')
        .resolves(mockData.electrumBalance)

      sandbox
        .stub(bfp.bchjs.Crypto, 'sha256')
        .resolves('n16vM3Ndnpp43GzDnxhHgshMCXspkvsJoq')

      sandbox
        .stub(Bfp, 'calculateFileUploadCost') // this is a static function
        .resolves(1042)

      sandbox.stub(bfp.bchjs.Electrumx, 'utxo').resolves(mockData.electrumUTXOs)

      sandbox.stub(bfp.bfp, 'uploadFile').resolves('fileId8739873984')

      assert.isNotEmpty(await bfp.writeBFP())
    })
  })
})
