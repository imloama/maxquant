/**
 * 将自己的单子排成买1卖1价
 * 1. 获取当前盘面
 * 2. 根据当前买单和卖单的价格，进行下单，保证自己是第1位的
 * 3. 每隔3秒钟，下单
 * 4. 如果买单被吃，则再下买单
 * 5. 如果卖单被吃，再下卖单，
 */
const API = require('../exchanges/sdex');
const Big = require('big.js');

class SDEXTop{
  constructor(opt = { }){
    this.horizon = opt.horizon || `https://horizon-testnet.stellar.org`
    this.address = opt.apikey
    this.seed = opt.apisecret
    this.api = new API(this.horizon, this.seed)
    this.counter = opt.counter
    this.base = opt.base

    //当前买单
    this.buyOffer = null
    //当前卖单
    this.sellOffer = null
    //每单数量
    this.pernum = opt.pernum || 1
    this.stepprice =  opt.stepprice || 0.002
    
    this.buyPrice = 0
    this.sellPrice = 0

  }

  async init(){
    //const offers = await this.api.fetchOffers()
    this.startBalance = await this.api.info()
    const obs = await this.api.fetchOrderBooks(this.base, this.counter)
    const bid0 = obs.bids[0]
    const ask0 = obs.asks[0]
    this.buyPrice = new Big(bid0.price).plus(this.stepprice)
    this.sellPrice = new Big(ask0.price).minus(this.stepprice)
    console.log(this.buyPrice + '---' + this.sellPrice)
    if(this.buyPrice.gt(this.sellPrice))throw new Error('价格不成立')
    this.buyOfferId = await this.api.createBuyOffer(this.base, this.counter, this.pernum, Number(this.buyPrice.toString()))
    this.sellOfferId = await this.api.createSellOffer(this.base, this.counter, this.pernum, Number(this.sellPrice.toString()))
  }

  async run(){
    
    // 获取当前大盘
    const obs = await this.api.fetchOrderBooks(this.base, this.counter)
    const bid0 = obs.bids[0]
    const ask0 = obs.asks[0]

    const offerRecords = await this.api.fetchOffers()
    const offers = offerRecords.records
    const offlen = offers.length

    const buyHas = this.buyPrice.plus(bid0.price)
    const sellHash = this.sellPrice.plus(ask0.price)

    if(offlen === 2){
      //两单都没成交的情况
      if(buyHas.lt(0)){
        //证明有人出的买单价比我的高，则需要修改我的订单
        const bOffer = offers.filter(item => item.id === this.buyOfferId)
        this.buyPrice = new Big(bid0.price).plus(this.stepprice)
        await this.createBuyOffer(this.base, this.counter, Number(bOffer.amount), this.buyPrice, this.buyOfferId)
      }
      if(sellHash.gt(0)){
        // 有人出的卖单价比我的低
        const sOffer = offers.filter(item => item.id === this.sellOfferId)
        this.sellPrice = new Big(ask0.price).plus(this.stepprice)
        await this.createSellOffer(this.base, this.counter, Number(sOffer.amount), this.sellPrice, this.sellOfferId)
      }
    }else if(offlen === 1){
      //有一个单子成交了
      if(this.buyOfferId === offers[0].id){
        //卖单成交了,则创建卖单
        this.sellPrice = new Big(ask0.price).plus(this.stepprice)
        this.sellOfferId = await this.createSellOffer(this.base, this.counter, Number(sOffer.amount), this.sellPrice, this.sellOfferId)
      }else{
        // 买单成交了,则再创建买单
        this.buyPrice = new Big(bid0.price).plus(this.stepprice)
        this.buyOfferId = await this.api.createBuyOffer(this.base, this.counter, this.pernum, Number(this.buyPrice.toString()))
      }
    }else{
      // 两个单子都成交了
      this.buyPrice = new Big(bid0.price).plus(this.stepprice)
      this.sellPrice = new Big(ask0.price).minus(this.stepprice)
      if(this.buyPrice.gt(this.sellPrice))throw new Error('价格不成立')
      this.buyOfferId = await this.api.createBuyOffer(this.base, this.counter, this.pernum, Number(this.buyPrice.toString()))
      this.sellOfferId = await this.api.createSellOffer(this.base, this.counter, this.pernum, Number(this.sellPrice.toString()))
    }
    // const balances = await this.api.info()
    logger.debug(`--------当前账户余额：${JSON.stringify(this.api.account)}--------`)
    

  }
}


module.exports = SDEXTop