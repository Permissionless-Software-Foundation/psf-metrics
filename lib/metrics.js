/*
  This library contains functions around retrieving PSF metrics.

  - The 145 derivation path address for the token liquidity app is:
    bitcoincash:qrnn49rx0p4xh78tts79utf0zv26vyru6vqtl9trd3

  - The 245 derivation path address for the token liquidity app is:
    bitcoincash:qzhrpmu7nruyfcemeanqh5leuqcnf6zkjq4qm9nqh0

  - An INFLOW is characterized by:
      - An SLP tx
      - Token ID is the PSF token ID
      - Has the 145 address as an output
      - Does not have the 245 address as an output
      - Does not have the 145 address as an input

    - Notes:
      - Any transaction from the 145 address that have the 245 address in the
      vout[1] output (second output), is a transfer and can be ignored.

  - An OUTFLOW is characterized by:
    - An SLP tx
    - Token ID is the PSF token ID
    - Has the 245 address as an input
    - Does not have the 245 address as an output

  - A BURN is characterized by:
    - An SLP tx
    - Token ID is the PSF token ID
    - Has the 245 address as the second output
    - Has the 245 address as the second input
    - The token quantity difference between the input and output is the amount burned.
*/

// Public npm libraries
const BCHJS = require('@psf/bch-js')
const BchUtil = require('bch-util')

const PSF_TOKENID =
  '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'

const tokenLiquidity145 =
  // After Nov 15th 2020 fork.
  'bitcoincash:qrnn49rx0p4xh78tts79utf0zv26vyru6vqtl9trd3'
// Before Nov 15th 2020 fork.
// 'bitcoincash:qzl6k0wvdd5ky99hewghqdgfj2jhcpqnfq8xtct0al'
const tokenLiquidity245 =
  // After Nov 15th 2020 fork.
  'bitcoincash:qzhrpmu7nruyfcemeanqh5leuqcnf6zkjq4qm9nqh0'
  // Before Nov 15th 2020 fork.
  // 'bitcoincash:qz9l5w0fvp670a8r48apsv0xqek840320cf5czgcmk'

class Metrics {
  constructor (metricsConfig) {
    this.bchjs = new BCHJS()
    this.bchUtil = new BchUtil({ bchjs: this.bchjs })
  }

  // Calculates the amount of tokens sent to the token-liquidity app between
  // two block times. Intended do to be used to generate monthly reports.
  async tokenInflows (startBlock, stopBlock) {
    try {
      // const burnAddr = 'bitcoincash:qqsrke9lh257tqen99dkyy2emh4uty0vky9y0z0lsr'
      let total = 0

      const txData = await this.bchjs.Electrumx.transactions(tokenLiquidity145)
      // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

      const txWindow = txData.transactions.filter(elem => {
        return elem.height > startBlock && elem.height < stopBlock
      })
      // console.log(`txWindow: ${JSON.stringify(txWindow, null, 2)}`)

      // Sort the data so that the newst is first.
      const sortTxData = this.bchjs.Electrumx.sortConfTxs(txWindow)
      // console.log(`sortTxData: ${JSON.stringify(sortTxData, null, 2)}`)

      const tokenTx = []

      // for (let i = 30; i < 40; i++) {
      for (let i = 0; i < sortTxData.length; i++) {
        const thisTx = sortTxData[i]

        try {
          // decodeOpReturn() will throw an error if the transaction is a
          // non-SLP transaction.
          const opReturn = await this.bchjs.SLP.Utils.decodeOpReturn(
            thisTx.tx_hash
          )
          // console.log(`opReturn: ${JSON.stringify(opReturn, null, 2)}`)

          // Get the transaction data.
          const txData = await this.bchjs.RawTransactions.getTxData(
            thisTx.tx_hash
          )
          // const txData = await this.bchjs.RawTransactions.getRawTransaction(
          //   thisTx.tx_hash,
          //   true
          // )
          // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

          // Loop through each output in the tx.
          for (let j = 0; j < txData.vout.length; j++) {
            // If the output has an address (not an OP_RETURN) and the address
            // matches the 145 address.
            if (
              // The address property exists in the vout (not an OP_RETURN)
              txData.vout[j].scriptPubKey.addresses &&
              // The output address is the 145 address.
              txData.vout[j].scriptPubKey.addresses[0] === tokenLiquidity145 &&
              // The token ID matches the PSF token.
              opReturn.tokenId === PSF_TOKENID
            ) {
              // PSF tokens have 8 decimal places.
              const amount = Number(opReturn.amounts[j - 1]) / Math.pow(10, 8)

              // amount will be null if this is a transfer between the 145 and
              // 245 addresses.
              if (amount) {
                // Loop through the inputs and ensure none of them have the 145
                // address as an input.
                let vinIsOk = true
                for (let k = 0; k < txData.vin.length; k++) {
                  const thisVin = txData.vin[k]

                  if (thisVin.address === tokenLiquidity145) {
                    vinIsOk = false
                    break
                  }
                }
                if (!vinIsOk) break

                const date = new Date(txData.time * 1000)

                const entry = {
                  txid: thisTx.tx_hash,
                  // txType: opReturn.txType,
                  // amounts: opReturn.amounts,
                  amount,
                  vout: j,
                  height: thisTx.height,
                  // date: date.toLocaleString()
                  date: date.toISOString()
                }
                console.log(`entry: ${JSON.stringify(entry, null, 2)}`)

                tokenTx.push(entry)

                total += amount
              }

              // break
            }
          }
        } catch (err) {
          // exit quietly
        }

        await this.sleep(2000)
      }

      // console.log(`Token Inflows: ${JSON.stringify(tokenTx, null, 2)}`)
      console.log(`Total inflows: ${total}`)

      return tokenTx
    } catch (err) {
      console.error('Error in tokenLiquidity()')
      throw err
    }
  }

  // - An OUTFLOW is characterized by:
  //   - An SLP tx
  //   - Token ID is the PSF token ID
  //   - Has the 245 address as an input
  //   - Does not have the 245 address as an output
  async tokenOutflows (startBlock, stopBlock) {
    try {
      // const burnAddr = 'bitcoincash:qqsrke9lh257tqen99dkyy2emh4uty0vky9y0z0lsr'
      let total = 0

      const txData = await this.bchjs.Electrumx.transactions(tokenLiquidity245)
      // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

      const txWindow = txData.transactions.filter(elem => {
        return elem.height > startBlock && elem.height < stopBlock
      })
      // console.log(`txWindow: ${JSON.stringify(txWindow, null, 2)}`)

      // Sort the data so that the newest is first.
      const sortTxData = this.bchjs.Electrumx.sortConfTxs(txWindow)
      // console.log(`sortTxData: ${JSON.stringify(sortTxData, null, 2)}`)

      const tokenTx = []

      for (let i = 30; i < 40; i++) {
        // for (let i = 0; i < sortTxData.length; i++) {
        const thisTx = sortTxData[i]

        try {
          // decodeOpReturn() will throw an error if the transaction is a
          // non-SLP transaction.
          const opReturn = await this.bchjs.SLP.Utils.decodeOpReturn(
            thisTx.tx_hash
          )
          // console.log(`opReturn: ${JSON.stringify(opReturn, null, 2)}`)

          // Get the transaction data.
          const txData = await this.bchjs.RawTransactions.getTxData(
            thisTx.tx_hash
          )
          // const txData = await this.bchjs.RawTransactions.getRawTransaction(
          //   thisTx.tx_hash,
          //   true
          // )
          // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

          // Loop through each output in the tx.
          for (let j = 0; j < txData.vout.length; j++) {
            // If the output has an address (not an OP_RETURN) and the address
            // matches the 145 address.
            if (
              // The address property exists in the vout (not an OP_RETURN)
              txData.vout[j].scriptPubKey.addresses &&
              // The output address is the 145 address.
              txData.vout[j].scriptPubKey.addresses[0] !== tokenLiquidity245 &&
              // The token ID matches the PSF token.
              opReturn.tokenId === PSF_TOKENID
            ) {
              // PSF tokens have 8 decimal places.
              const amount = Number(opReturn.amounts[j - 1]) / Math.pow(10, 8)

              // amount will be null if this is a transfer between the 145 and
              // 245 addresses.
              if (amount) {
                // Loop through the inputs and ensure none of them have the 145
                // address as an input.
                // let vinIsOk = true
                // for (let k = 0; k < txData.vin.length; k++) {
                //   const thisVin = txData.vin[k]
                //
                //   if (thisVin.address === tokenLiquidity245) {
                //     vinIsOk = false
                //     break
                //   }
                // }
                // if (!vinIsOk) break

                const date = new Date(txData.time * 1000)

                const entry = {
                  txid: thisTx.tx_hash,
                  // txType: opReturn.txType,
                  // amounts: opReturn.amounts,
                  amount,
                  vout: j,
                  height: thisTx.height,
                  // date: date.toLocaleString()
                  date: date.toISOString()
                }
                console.log(`entry: ${JSON.stringify(entry, null, 2)}`)

                tokenTx.push(entry)

                total += amount
              }

              // break
            }
          }
        } catch (err) {
          // exit quietly
        }

        await this.sleep(1000)
      }

      // console.log(`Token Inflows: ${JSON.stringify(tokenTx, null, 2)}`)
      console.log(`Total outflows: ${total}`)

      return tokenTx
    } catch (err) {
      console.error('Error in tokenLiquidity()')
      throw err
    }
  }

  // - A BURN is characterized by:
  //   - An SLP tx
  //   - Token ID is the PSF token ID
  //   - Has the 245 address as the second output
  //   - Has the 245 address as the second input
  //   - The token quantity difference between the input and output is the amount burned.
  async tokenBurns (startBlock, stopBlock) {
    try {
      // const burnAddr = 'bitcoincash:qqsrke9lh257tqen99dkyy2emh4uty0vky9y0z0lsr'
      let total = 0

      const txData = await this.bchjs.Electrumx.transactions(tokenLiquidity245)
      // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

      const txWindow = txData.transactions.filter(elem => {
        return elem.height > startBlock && elem.height < stopBlock
      })
      // console.log(`txWindow: ${JSON.stringify(txWindow, null, 2)}`)

      // Sort the data so that the newest is first.
      const sortTxData = this.bchjs.Electrumx.sortConfTxs(txWindow)
      // console.log(`sortTxData: ${JSON.stringify(sortTxData, null, 2)}`)

      const tokenTx = []

      // for (let i = 30; i < 40; i++) {
      for (let i = 0; i < sortTxData.length; i++) {
        const thisTx = sortTxData[i]

        try {
          // decodeOpReturn() will throw an error if the transaction is a
          // non-SLP transaction.
          const opReturn = await this.bchjs.SLP.Utils.decodeOpReturn(
            thisTx.tx_hash
          )
          // console.log(`opReturn: ${JSON.stringify(opReturn, null, 2)}`)

          // Get the transaction data.
          const txData = await this.bchjs.RawTransactions.getTxData(
            thisTx.tx_hash
          )
          // const txData = await this.bchjs.RawTransactions.getRawTransaction(
          //   thisTx.tx_hash,
          //   true
          // )
          // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)

          // Loop through each output in the tx.
          // for (let j = 0; j < txData.vout.length; j++) {

          const vout2 = txData.vout[1]

          // If the output matches the pattern.
          if (
            // The token ID matches the PSF token.
            opReturn.tokenId === PSF_TOKENID &&
            // The address property exists in the vout (not an OP_RETURN)
            vout2.scriptPubKey.addresses &&
            // If the second output is to the 245 address
            vout2.scriptPubKey.addresses[0] === tokenLiquidity245 &&
            // If the second input is from the 245 address
            txData.vin[1].address === tokenLiquidity245
          ) {
            // console.log(`txData: ${JSON.stringify(txData, null, 2)}`)
            // console.log(`opReturn: ${JSON.stringify(opReturn, null, 2)}`)

            // Hydrate the transaction with token quantities for inputs and outputs.
            const txDataSlp = await this.bchjs.RawTransactions.getTxDataSlp(
              thisTx.tx_hash
            )
            // console.log(`txDataSlp: ${JSON.stringify(txDataSlp, null, 2)}`)

            // Loop through each input and add up all the token amounts.
            let inputTotal = 0
            for (let i = 0; i < txDataSlp.vin.length; i++) {
              const tokenQty = txDataSlp.vin[i].tokenQty

              if (tokenQty) {
                inputTotal += Number(tokenQty) / Math.pow(10, 8)
              }
            }

            // Get the input and verify that it matches the burn pattern too.
            // const inputTokenTx = await this.bchjs.SLP.Utils.decodeOpReturn(
            //   txData.vin[1].txid
            // )
            // console.log(
            //   `input opReturn: ${JSON.stringify(inputTokenTx, null, 2)}`
            // )

            // PSF tokens have 8 decimal places.
            // const inputAmount = Number(opReturn.amounts[0]) / Math.pow(10, 8)
            const outputAmount =
              Number(opReturn.amounts[0]) / Math.pow(10, 8)
            const burnAmount = this.bchUtil.util.round8(inputTotal - outputAmount)

            // amount will be null if this is a transfer between the 145 and
            // 245 addresses.
            // if (amount) {
            //   // Loop through the inputs and ensure none of them have the 145
            //   // address as an input.
            //   // let vinIsOk = true
            //   // for (let k = 0; k < txData.vin.length; k++) {
            //   //   const thisVin = txData.vin[k]
            //   //
            //   //   if (thisVin.address === tokenLiquidity245) {
            //   //     vinIsOk = false
            //   //     break
            //   //   }
            //   // }
            //   // if (!vinIsOk) break
            //
            const date = new Date(txData.time * 1000)

            const entry = {
              txid: thisTx.tx_hash,
              // txType: opReturn.txType,
              // amounts: opReturn.amounts,
              amount: burnAmount,
              vout: 1,
              height: thisTx.height,
              // date: date.toLocaleString()
              date: date.toISOString()
            }
            console.log(`burn: ${JSON.stringify(entry, null, 2)}`)

            tokenTx.push(entry)

            total += burnAmount
            // }

            // break
          }
          // }
        } catch (err) {
          // exit quietly
        }

        await this.sleep(1000)
      }

      // console.log(`Token Inflows: ${JSON.stringify(tokenTx, null, 2)}`)
      console.log(`Total burns: ${total}`)

      return tokenTx
    } catch (err) {
      console.error('Error in tokenLiquidity()')
      throw err
    }
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = Metrics
