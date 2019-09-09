const SDEXGrid = require('../src/strategies/sdex_grid');


const instance = new SDEXGrid({
  min: 0.35,
  max: 1,
  step: 0.05,
  amoun: 1
})
instance.start()