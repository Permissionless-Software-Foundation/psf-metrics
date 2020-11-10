/*
  A mocking library for util.js unit tests.
  A mocking library contains data to use in place of the data that would come
  from an external dependency.
*/

'use strict'

const mockBalance = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
  balance: '1000',
  totalReceived: '1000',
  totalSent: '0',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 1,
  txids: ['6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d']
}

const mockUtxos = [
  {
    txid: '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d',
    vout: 0,
    value: '1000',
    height: 601861,
    confirmations: 4560,
    satoshis: 1000
  }
]

const electrumUTXOs = {
  utxos: [
    {
      txid: "2b37bdb3b63dd0bca720437754a36671431a950e684b64c44ea910ea9d5297c7",
      vout: 0,
      amount: 0.00001,
      satoshis: 1000,
      height: 602405,
      confirmations: 36459
    },
    {
      txid: "2b37bdb3b63dd0bca720437754a36671431a950e684b64c44ea910ea9d5297c7",
      vout: 0,
      amount: 0.00003,
      satoshis: 3000,
      height: 602405,
      confirmations: 36459
    },
    {
      txid: "2b37bdb3b63dd0bca720437754a36671431a950e684b64c44ea910ea9d5297c7",
      vout: 0,
      amount: 0.00002,
      satoshis: 2000,
      height: 602405,
      confirmations: 36459
    }
  ],
  legacyAddress: "15NCRBJsHaJy8As5bX1oh2YauRejnZ1MKF",
  cashAddress: "bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9",
  slpAddress: "simpleledger:qqh793x9au6ehvh7r2zflzguanlme760wuwzunhjfm",
  scriptPubKey: "76a9142fe2c4c5ef359bb2fe1a849f891cecffbcfb4f7788ac",
  asm:
    "OP_DUP OP_HASH160 2fe2c4c5ef359bb2fe1a849f891cecffbcfb4f77 OP_EQUALVERIFY OP_CHECKSIG"
}

const electrumBalance = {
        "success": true,
        "balance": {
          "confirmed": 90000000,
          "unconfirmed": 10000000
        }
      }

module.exports = {
  mockBalance,
  mockUtxos,
  electrumUTXOs,
  electrumBalance
}
