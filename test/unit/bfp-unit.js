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
const mockWallet = require('./mocks/wallet.json')

// Unit under test
const BFP = require('../../lib/bfp')
let uut

const Bfp = require('bitcoinfiles-node').bfp
let config

describe('#bfp.js', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    config = {
      wif: 'Ky4nfbTgCQ79Gbx4gRSqSQdtEeqgZBVL3qBuF4nDn2hrr236T2DG',
      fileExt: '.ext',
      fileName: 'filename',
      data: '{bla:blub}'
    }
    uut = new BFP(config)
  })

  afterEach(() => sandbox.restore())
  describe('#throwErrorOnInvalidConfigParameters', () => {
    it('should throw an error if config is not set', () => {
      try {
        const temp = new BFP()
        assert.fail('Unexpected result')
        console.log(temp)
      } catch (err) {
        assert.include(err.message, 'Must pass config to constructor')
      }
    })
    it('should throw an error if config.wif is not set', () => {
      try {
        config.wif = ''
        const temp = new BFP(config)
        assert.fail('Unexpected result')
        console.log(temp)
      } catch (err) {
        assert.include(err.message, 'Must pass config.wif to constructor')
      }
    })
    it('should throw an error if config.fileName is not set', () => {
      try {
        config.fileName = ''
        const temp = new BFP(config)
        assert.fail('Unexpected result')
        console.log(temp)
      } catch (err) {
        assert.include(err.message, 'Must pass config.fileName to constructor')
      }
    })
    it('should throw an error if config.fileExt is not set', () => {
      try {
        config.fileExt = ''
        const temp = new BFP(config)
        assert.fail('Unexpected result')
        console.log(temp)
      } catch (err) {
        assert.include(err.message, 'Must pass config.fileExt to constructor')
      }
    })
    it('should throw an error if config.data is not set', () => {
      try {
        config.data = ''
        const temp = new BFP(config)
        assert.fail('Unexpected result')
        console.log(temp)
      } catch (err) {
        assert.include(err.message, 'Must pass config.data to constructor')
      }
    })
    it('should throw an error if config.wif is wrong format', () => {
      try {
        config.wif = 'sfdhu'
        const temp = new BFP(config)
        assert.fail('Unexpected result')
        console.log(temp)
      } catch (err) {
        assert.include(err.message, 'config.wif format is incorrect')
      }
    })
  })
  describe('#constructor', () => {
    it('should throw an error if wallet data is not passed in.', () => {
      try {
        const temp = new BFP()
        assert.fail('Unexpected result')
        console.log(temp)
      } catch (err) {
        assert.include(err.message, 'Must pass config to constructor')
      }
    })
  })

  describe('#getUTXOsByAddress', () => {
    it('should get UTXOs on an address', async () => {
      sandbox.stub(uut.bchjs.Electrumx, 'utxo').resolves(mockData.electrumUTXOs)
      const addr = 'bchtest:qrtddel54p4zxmrkf7jyex7j06lhx48k3s5wqpgu5p'
      // const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const utxos = await uut.getUTXOsByAddress(addr)
      // console.log(utxos)

      // Assert essential UTXOs properties exist.
      assert.isArray(utxos.utxos)
      assert.property(utxos.utxos[0], 'tx_hash')
      assert.property(utxos.utxos[0], 'height')
      assert.property(utxos.utxos[0], 'value')
    })
  })

  describe('#getBCHBalance', () => {
    it('should throw an error as address is invalid', async () => {
      try {
        // Force an error.
        sandbox
          .stub(uut.bchjs.Electrumx, 'balance')
          .rejects(new Error('Unsupported address format : asdf'))

        const addr = 'asdf'

        await uut.getBCHBalance(addr)

        assert.fail()
      } catch (e) {
        assert.include(e.message, 'Unsupported address format : asdf')
      }
    })

    it('should get BCH balance on an address', async () => {
      sandbox
        .stub(uut.bchjs.Electrumx, 'balance')
        .resolves(mockData.electrumBalance)

      const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'

      const balance = await uut.getBCHBalance(addr, true)

      assert.equal(balance, 1)
    })
  })

  describe('#_throwErrorIfBalanceIsInSufficient', () => {
    it('should throw an error if balance is insufficient', async () => {
      try {
        await uut._throwErrorIfBalanceIsInSufficient(1, 2)

        assert.fail()
      } catch (err) {
        assert.include(
          err.message,
          'Not enough satoshis in the largest utxo(1) to pay the BFP fees of 2'
        )
      }
    })
  })

  describe('#getUTXOsByAddress', () => {
    it('should throw an error if address is invalid', async () => {
      try {
        // Force an error.
        sandbox.stub(uut.bchjs.Electrumx, 'utxo').resolves({
          utxos: []
        })

        await uut.getUTXOsByAddress('')
        assert.fail()
      } catch (err) {
        assert.include(err.message, 'No UTXOs found.')
      }
    })
  })

  describe('#checkBalanceKillProcessIfZero', () => {
    it('should kill process as balance is 0.0', async () => {
      try {
        uut.checkBalanceKillProcessIfZero(0.0)

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Balance of sending address is zero.')
      }
    })
  })

  describe('#writeBfp', () => {
    it('should throw error if addr is invalid', async () => {
      try {
        // Froce an error
        const error = new Error('some fake error')
        sandbox.stub(uut, 'getBCHBalance').rejects(error)

        await uut.writeBFP(true)

        assert.fail()
      } catch (err) {
        assert.include(err.message, 'some fake error')
      }
    })

    it('should write a file to the blockchain', async () => {
      sandbox
        .stub(uut.bchjs.Electrumx, 'balance')
        .resolves(mockData.electrumBalance)

      sandbox
        .stub(uut.bchjs.Crypto, 'sha256')
        .resolves('n16vM3Ndnpp43GzDnxhHgshMCXspkvsJoq')

      sandbox
        .stub(Bfp, 'calculateFileUploadCost') // this is a static function
        .resolves(1042)

      sandbox.stub(uut.bchjs.Electrumx, 'utxo').resolves(mockData.electrumUTXOs)

      sandbox.stub(uut.bfp, 'uploadFile').resolves('fileId8739873984')

      const result = await uut.writeBFP()

      assert.isString(result)
    })
  })
})
