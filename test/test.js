const BigNumber = require('bignumber.js');

// 二爺賠率表
var g_twoYeahOdds = [15, 30, 45, 60, 30, 60, 90, 120, 45, 90, 135, 180, 60, 120, 180, 240, 100, 200, 300, 400, 200, 400, 600, 800];
// 二爺賠率機率表
var g_twoYeahOddsProb = [1200, 1000, 800, 400, 1000, 600, 400, 300, 800, 400, 300, 200, 600, 300, 250, 200, 400, 250, 100, 100, 200, 100, 75, 25];

// 產生二爺的隨機倍率
function getTwoYeahOdds() {
    var nTotalProb = 0;
    g_twoYeahOddsProb.forEach((value) => {
        nTotalProb += value;
    })

    var dice = Math.floor(Math.random() * nTotalProb);
    var odds = 0;
    for (var i = 0; i < g_twoYeahOddsProb.length; i++) {
        // console.log("g_twoYeahOddsProb[ " + i + "] = " + g_twoYeahOddsProb[i] + " / dice = " + dice);
        if (dice < g_twoYeahOddsProb[i]) {
            odds = i;
            break;
        } else {
            dice -= g_twoYeahOddsProb[i];
        }
    }

    return odds;
}

//浮點數相除
function BigNumber_div(arg1, arg2,pointDigit) {
    if (arg1 == undefined) console.error("BigNumber_div().arg1=undefined") ;
    if (arg2 == undefined) console.error("BigNumber_div().arg2=undefined") ;

    arg1 = point_keep(arg1,pointDigit);
    arg2 = point_keep(arg2,pointDigit);
    var retValue = new BigNumber(arg1).div(arg2).toNumber();;
    return point_keep(retValue,pointDigit);
};

function point_keep(num, digit) {
    if(digit == undefined)digit = 6;
    var s_num = num.toString();
    var p_idx = s_num.indexOf('.');
    if(p_idx == -1) return num;
    s_num = s_num.slice(0,p_idx+digit+1);
    return Number(s_num);
}

var time = 10000000;
var getOddsNumber = [];
g_twoYeahOdds.forEach(() => {
    getOddsNumber.push(0);
})
for (var i = 0; i < time; i++) {
    var oddsIndex = getTwoYeahOdds();
    getOddsNumber[oddsIndex]++;
}

g_twoYeahOdds.forEach((value, index) => {
    console.log("odds : " + value + " / random nmber : " + getOddsNumber[index] + " / " + BigNumber_div(getOddsNumber[index], time, 4));
})
