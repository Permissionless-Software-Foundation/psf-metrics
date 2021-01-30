/*
  Integration tests for the metrics.js library.
*/

const Metrics = require('../../lib/metrics')
let uut

describe('#metrics', () => {
  beforeEach(() => {
    uut = new Metrics()
  })

  describe('#tokenLiquidityBurn', () => {
    it('should do something', async () => {
      const Dec1stBlock = 664000
      const Dec31stBlock = 668300

      await uut.tokenInflows(Dec1stBlock, Dec31stBlock)
    })
  })
})
