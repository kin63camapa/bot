var lastSellOrder =  "auto";
//цена последнего ордера на продажу 0 - не важно; "auto" - по последней своей сделке 
var lastBuyOrder =  "auto";
//цена последнего ордера на покупку 0 - не важно; "auto" - по последней своей сделке 
var steps = 10;
//индекс жадности от 0 до бесконечнноти (10 - очень жадный бот c большими шансами улететь в лонг сразу же)
var maxCoins = 1.000;
//максимальная ставка в BTC 
var allowRisk = 0;
//разрешить сделки в минус (на свой страх и риск) 0 - нет; 1-да
var onlyOneOrder = 1;
//запретить ставить больше одного ордера 1 - да; 0 - нет

var range = trader.get("LastPrice")/100*0.5;
var max = trader.get("LastPrice")+(range*0.5)+0.001;
var min = trader.get("LastPrice")-(range*0.5)-0.001;
var upStep = 0;
var dwStep = 0;
var tmp = -1;
var sellOrder = 0;
var buyOrder = 0;

if (lastSellOrder == "auto") lastSellOrder = trader.get("LastMySellPrice");
if (lastBuyOrder == "auto") lastBuyOrder = trader.get("LastMyBuyPrice");
if (lastSellOrder == 0) lastSellOrder = max-0.001;
if (lastBuyOrder == 0) lastBuyOrder = min+0.001;

trader.log("now start");
trader.log("range ", range);
trader.log("max ", max.toFixed(3));
trader.log("min ", min.toFixed(3));
trader.log("lso ", lastSellOrder.toFixed(3));
trader.log("lbo ", lastBuyOrder.toFixed(3));

trader.on("LastPrice").changed()
{
    if(symbol!="BTCUSD")return;
    if (trader.get("LastPrice")>max)
    {
        max = trader.get("LastPrice");
        trader.log("max changed ",max.toFixed(3));
        if (sellOrder<max)
        {
            sellOrder = 0;
            lastSellOrder = trader.get("LastMySellPrice");
        }
        if (upStep<steps)
        {
            upStep++;
            return;
        }
        if (upStep==steps)
        {
            trader.log("время продавать");
            upStep = 0;
            dwStep = 0;
            min = min+trader.get("LastPrice")-max;
            range = trader.get("LastPrice")/100*0.5;
            if (min>(max-range)) min=max-range;
            if (min<(max-range*2)) min=max-range*1.5;
            trader.log("min changed ",min.toFixed(3));
            if (buyOrder)
            {
                trader.cancelOrders();
                sellOrder = 0;
                buyOrder = 0;
                return;
            }
            if (onlyOneOrder && sellOrder){ trader.log("новый ордер не создан"); return; }
            tmp = trader.get("Balance","BTC");
            if (max > lastBuyOrder+range)
            {   
                if (tmp < 0.01){ trader.log("вы нищеброд"); return; }
                if (tmp > maxCoins) tmp = maxCoins;
                trader.sell(tmp,max);
                sellOrder = lastSellOrder = max;
            }
            else
            {
                if (allowRisk)
                {
                    if (tmp < 0.01){ trader.log("вы нищеброд"); return; }
                    if (tmp > maxCoins) tmp = maxCoins;
                    trader.sell(tmp,max);
                    sellOrder = lastSellOrder = max;
                }
                else trader.log("отказ делать невыгодную ставку: покупка за",lastBuyOrder," не окупится");
            }
        }
    }
    if (trader.get("LastPrice")<min)
    {
        min = trader.get("LastPrice");
        trader.log("min changed ",min.toFixed(3));
        if (buyOrder>min)
        {
            buyOrder = 0;
            lastBuyOrder = trader.get("LastMyBuyPrice");
        }
        if (dwStep<steps)
        {
            dwStep++;
            return;
        }
        if (dwStep==steps)
        {
            trader.log("время покупать");
            upStep = 0;
            dwStep = 0;
            max = max+trader.get("LastPrice")-min;
            range = trader.get("LastPrice")/100*0.5;
            if (max<(min+range)) max=min+range;
            if (max>(min+range*2)) max=min+range*1.5;
            trader.log("max changed ",max.toFixed(3));
            if (sellOrder)
            {
                trader.cancelOrders();
                sellOrder = 0;
                buyOrder = 0;
                return;
            }
            if (onlyOneOrder && buyOrder){ trader.log("новый ордер не создан"); return; }
            tmp = trader.get("Balance","USD")/(min+0.001);
            if (min < lastSellOrder-(lastSellOrder/100*0.5;))
            {
                if (tmp < 0.01) { trader.log("вы нищеброд"); return; }
                if (tmp > maxCoins) tmp = maxCoins;
                trader.buy(tmp,min);
                buyOrder = lastBuyOrder = min;
            }
            else
            {
                if (allowRisk)
                {
                    if (tmp < 0.01) { trader.log("вы нищеброд"); return; }
                    if (tmp > maxCoins) tmp = maxCoins;
                    trader.buy(tmp,min);
                    buyOrder = lastBuyOrder = min;
                }
                else trader.log("отказ делать невыгодную ставку: продажа за",lastSellOrder," не окупится");
            }
        }
    }
}