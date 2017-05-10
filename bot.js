var coin = "LTC";
var pair = "USD";
//пара
var minCoins = 0.1;
//размер минимальной ставки разрешенной на бирже для пары
var lastSellOrder = 0;
//цена последнего ордера на продажу 0 - не важно; "auto" - по последней своей сделке 
var lastBuyOrder = 0;
//цена последнего ордера на покупку 0 - не важно; "auto" - по последней своей сделке 
var steps = 3;
//индекс жадности от 0 до бесконечнноти (10 - очень жадный бот c большими шансами улететь в лонг сразу же 1-2 шорты)
var dwSkip = 0;
var upSkip = 2;
//сколько шагов пропустить вверх или вниз
var maxCoins = 0.5;
//максимальная ставка в %coin% 
var allowRisk = 0;
//разрешить сделки в минус (на свой страх и риск) 0 - нет; 1-да
var onlyOneOrder = 0;
//запретить ставить больше одного ордера 1 - да; 0 - нет
var fee = 0.2
//комиссия биржи

var range = (trader.get("LastPrice")/100)*(fee*3);
var max = trader.get("LastPrice")+(range*0.5)+0.001;
var min = trader.get("LastPrice")-(range*0.5)-0.001;
var upStep = 0;
var dwStep = 0;
var tmp = -1;

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
    if(symbol!=coin+pair)return;
    if (trader.get("LastPrice")>max)
    {
        max = trader.get("LastPrice");
        trader.log("max changed ",max.toFixed(3));
        if (upStep<steps+upSkip)
        {
            upStep++;
            return;
        }
        if (upStep==steps+upSkip)
        {
            trader.log("время продавать");
            upStep = 0;
            dwStep = 0;
            //min = min+trader.get("LastPrice")-max;//wtf? max = trader.get("LastPrice") => min+0?
            range = (trader.get("LastPrice")/100)*(fee*3);
            if (min>(max-range)) min=max-range;
            if (min<(max-range*2)) min=max-range*1.5;
            trader.log("min recalculated ",min.toFixed(3));
            if (onlyOneOrder && trader.get("OpenOrdersCount")){ trader.log("новый ордер не создан"); return; }
            tmp = trader.get("Balance",coin);
            if (max > lastBuyOrder+range || allowRisk)
            {   
                if (tmp < minCoins){ trader.log("вы нищеброд"); return; }
                if (tmp >= maxCoins && tmp-maxCoins >=  maxCoins ) tmp = maxCoins;
                trader.sell(tmp,max);
                sellOrder = lastSellOrder = max;
            }
            else trader.log("отказ делать невыгодную ставку: покупка за",lastBuyOrder," не окупится");
        }
    }
    if (trader.get("LastPrice")<min)
    {
        min = trader.get("LastPrice");
        trader.log("min changed ",min.toFixed(3));
        if (dwStep<steps+dwSkip)
        {
            dwStep++;
            return;
        }
        if (dwStep==steps+dwSkip)
        {
            trader.log("время покупать");
            upStep = 0;
            dwStep = 0;
            range = (trader.get("LastPrice")/100)*(fee*3);
            if (max<(min+range)) max=min+range;
            if (max>(min+range*2)) max=min+range*1.5;
            trader.log("max recalculated ",max.toFixed(3));
            if (onlyOneOrder && trader.get("OpenOrdersCount")){ trader.log("новый ордер не создан"); return; }
            tmp = trader.get("Balance",pair)/(min+0.001);
            if (min < (lastSellOrder-((lastSellOrder/100)*fee*3))||allowRisk)
            {
                if (tmp < minCoins) { trader.log("вы нищеброд"); return; }
                if (tmp > maxCoins) tmp = maxCoins;
                trader.buy(tmp,min);
                buyOrder = lastBuyOrder = min;
            }
            else trader.log("отказ делать невыгодную ставку: продажа за",lastSellOrder," не окупится");
        }
    }
}