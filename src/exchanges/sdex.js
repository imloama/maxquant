/**
 * 恒星SDEX
 */
var StellarSdk = require('stellar-sdk');
const Big = require('big.js');


class API {
  constructor(horizon, seed){
    this.horizon = horizon
    this.seed = seed
    this.account = null
    this.balances = {}
    if(this.horizon.indexOf('testnet') > 0){
      // StellarSdk.Network.useTestNetwork()
      this.network = StellarSdk.Networks.TESTNET
      this.server = new StellarSdk.Server(this.horizon)
    }else{
      // StellarSdk.Network.usePublicNetwork()
      this.network = StellarSdk.Networks.PUBLIC
      this.server = new StellarSdk.Server(this.horizon)
    }
    if(seed){
      this.keypair = StellarSdk.Keypair.fromSecret(seed)
      this.address = this.keypair.publicKey()
    }
  }

  //获取账户信息
  async info(){
    this.account = await this.server.loadAccount(this.address)
    const bb = this.account.balances
    for(let i=0,n=bb.length;i<n;i++){
      const code = bb[i].asset_type === 'native' ? 'XLM' : bb[i].asset_code 
      this.balances[code] = new Big(bb[i].balance)
        .minus(bb[i].buying_liabilities).minus(bb[i].selling_liabilities).toString()
    }
    return this.account;
  }

  async createBuyOffer(sellAsset, buyAsset, buyAmount, price, offerId){
    await this.info()
    const builder = new StellarSdk.TransactionBuilder(this.account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network
    })
    const opt = StellarSdk.Operation.manageBuyOffer({
      selling: this.asset(sellAsset),
      buying: this.asset(buyAsset),
      buyAmount: buyAmount.toFixed(7),
      price: price.toFixed(7),
      offerId
    })
    builder.addOperation(opt).setTimeout(60)
    const tx = builder.build()
    tx.sign(this.keypair);
    console.log(`----buyAmount-${buyAmount}--price:${price}--`)
    const result = await this.server.submitTransaction(tx);
    console.log(`--submit---`)
    // 从result获取到offerid
    return result.offerResults[0].currentOffer.offerId
  }

  async createSellOffer(sellAsset, buyAsset, amount, price, offerId){
    await this.info()
    const builder = new StellarSdk.TransactionBuilder(this.account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network
    })
    const opt = StellarSdk.Operation.manageSellOffer({
      selling: this.asset(sellAsset),
      buying: this.asset(buyAsset),
      amount: amount.toFixed(7),
      price: price.toFixed(7),
      offerId
    })
    builder.addOperation(opt).setTimeout(60)
    const tx = builder.build()
    tx.sign(this.keypair);
    const result = await this.server.submitTransaction(tx);
    // 从result获取到offerid
    if(!result.hash)return;
    return  result.offerResults[0].currentOffer.offerId
  }


  asset(code, issuer){
    if(typeof code ==='object'){
      issuer = code.issuer
      code = code.code
    }
    if(code === 'XLM' )return new StellarSdk.Asset.native()
    return new StellarSdk.Asset(code, issuer);
  }


  async cancelSellOffers(sellAsset, buyAsset,price, offerIds){
    await this.info()
    const builder = new StellarSdk.TransactionBuilder(this.account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network
    })
    for(let i in offerIds){
      const opt = StellarSdk.Operation.manageSellOffer({
        selling: this.asset(sellAsset),
        buying: this.asset(buyAsset),
        amount: "0",
        price,
        offerId: offerIds[i]
      })
      builder.addOperation(opt).setTimeout(60)
    }
    const tx = builder.build()
    tx.sign(this.keypair);
    const result = await this.server.submitTransaction(tx);
    return result
  }

  async fetchOffers(){
    this.offers = await this.server.offers('accounts', this.address).call()
    return this.offers
  }

  async fetchOrderBooks(sellAsset, buyAsset){
    this.orderbooks = await this.server
        .orderbook(this.asset(sellAsset), this.asset(buyAsset))
        .limit(10).call()
    return this.orderbooks
  }


}

module.exports = API