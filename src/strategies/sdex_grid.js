/**
 * stellar dex grid
 * props:
 *   1. 价格区间：最低价 - 最高价
 *   2. 步长，隔多少的价格
 *   3. 每次交易数量
 */

class SDEXGrid {
  constructor(opts = {}){
    //最低价
    this.min = opts.min || 0
    //最高价
    this.max = opts.max || 0
    //每次的价格波动
    this.step = opts.step || 0.1
    //交易价格
    this.amount = opts.amount || 0
    this.scale = opts.scale || 4

    this.init()

    //当前买单与卖单的索引
    this.buyindex = -1
    this.sellindex = -1

  }

  init(){
    let prices = []
    for(let i = this.min; i <= this.max; i+=this.step) {
      prices.push(i.toFixed(this.scale));
    }
    this.prices = prices
  }

  start(){
    //1. 查询当前大盘，获取买1卖1价
    //2. 比较买1卖1价，获取最优位置
    //3. 执行下单
    //4. 等待时间，3S，检查订单，确认是否补单

  }

  stop(){

  }

}

module.exports = SDEXGrid;