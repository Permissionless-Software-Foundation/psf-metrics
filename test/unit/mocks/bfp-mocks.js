/*
  A mocking library for util.js unit tests.
  A mocking library contains data to use in place of the data that would come
  from an external dependency.
*/

'use strict'

const electrumUTXOs = {
  success: true,
  utxos: [{
    height: 602405,
    tx_hash: 'lkhgfidsghds7hz98w4hz98fusdsfdsfdshduifhudsfhdsfhoFAKEHASH',
    tx_pos: 0,
    value: 1000
  },
  {
    height: 602405,
    tx_hash: '2b37bdb3b63dd0bca720437754a36671431a950e684b64c44ea910ea9d5297c7',
    tx_pos: 1,
    value: 2000
  },
  {
    height: 602405,
    tx_hash: 'lkhgfidsghds7hz98w4hz98fushduifhudsfhdsfhoFAKEHASH',
    tx_pos: 2,
    value: 3000
  }
  ]
}

/*
//TODO Clarify the differences between this and the UTXO model above
const electrumUTXOs = {
  utxos: [{
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
  asm: "OP_DUP OP_HASH160 2fe2c4c5ef359bb2fe1a849f891cecffbcfb4f77 OP_EQUALVERIFY OP_CHECKSIG"
} */

const electrumBalance = {
  success: true,
  balance: {
    confirmed: 90000000,
    unconfirmed: 10000000
  }
}

module.exports = {
  electrumUTXOs,
  electrumBalance
}
