const BigNumber = require('bignumber.js');
var utils = module.exports;

//浮點數相加
utils.add = function(arg1, arg2, pointDigit)
{
    if (arg1 == undefined || arg2 == undefined) {
        console.error("NumberUtil.add() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.add() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.add() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.add() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
    }

    return BigNumber_add(arg1, arg2, pointDigit);
};

//浮點數相減
utils.sub = function(arg1, arg2, pointDigit)
{
    if (arg1 == undefined || arg2 == undefined) {
        console.error("NumberUtil.sub() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.sub() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.sub() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.sub() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
    }
    return BigNumber_sub(arg1, arg2, pointDigit);
};

//浮點數相乘
utils.mul = function(arg1, arg2, pointDigit)
{
    if (arg1 == undefined || arg2 == undefined) {
        console.error("NumberUtil.mul() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.mul() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.mul() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.mul() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
    }
    return BigNumber_mul(arg1, arg2, pointDigit);
};

//浮點數相除
utils.div = function(arg1, arg2, pointDigit)
{
    if (arg1 == undefined || arg2 == undefined) {
        console.error("NumberUtil.div() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.div() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.div() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
        console.error("NumberUtil.div() Error!!! arg1=" + arg1 + ", arg2=" + arg2);
    }
    return BigNumber_div(arg1, arg2, pointDigit);
};

utils.isNumber = function(arg){
    return (!isNaN(parseFloat(arg)) && isFinite(arg));
};

utils.CalMoneyWithTex = function (totalValue, userAmount, tex, pointDigit) {
    if (totalValue <= 0) {
        console.warn("[warning] !!! CalMoneyWithTex() value < 0!!!!  value=" + totalValue);
    }

    var eachUserValue = this.div(totalValue, userAmount, pointDigit);
    var userRate = this.sub(1,tex, pointDigit);
    var userGetValue2 = this.mul(eachUserValue,userRate, pointDigit);
    var userGetValue = point_keep(userGetValue2, pointDigit) ;
    var totalUserGetValue = this.mul(userGetValue, userAmount,pointDigit);
    var systemGetValue = this.sub(totalValue, totalUserGetValue,pointDigit);

    var retValue = {
        userGet:userGetValue,
        systemGet:systemGetValue,
    };
    return retValue ;
    // TEST : (100,3,0.05) => { userGet: 31.66, systemGet:  5.02 }
    // TEST : (100,1,0.05) => { userGet: 95   , systemGet:  5 }
    // TEST : (200,3,0.05) => { userGet: 63.32, systemGet: 10.04 }
};

// 將 [totalValue] 隨機分成 [userAmount] 份   (ex:totalValue=500, userAmount=6 ==> [60,40,70,80,210,40])
utils.RandomSplit = function(totalValue, userAmount, pointDigit) {
    var splitValue = [] ;
    var tmpList = [] ;
    var totalPercentage = 100 ;
    for (var f1 = 0 ; f1 < totalPercentage ; f1++) tmpList.push(f1) ;
    for (var f1 = 0 ; f1 < userAmount-1 ; f1++) {
        var rndValue = Math.floor(Math.random()*tmpList.length) ;
        splitValue.push(rndValue) ;
        var index = tmpList.indexOf(rndValue) ;
        tmpList.splice(index, 1) ;
        // console.log("[" + f1 + "]: index=" + index + ", value=" + rndValue);
    }

    // console.log("---before:" + splitValue);
    splitValue.sort(function(a,b){ return (a>b) ; });
    // console.log("---after :" + splitValue);

    var retRateList = [] ;
    retRateList.push(splitValue[0]);
    for (var f1 = 1 ; f1 < splitValue.length ; f1++) {
        var v1 = splitValue[f1-1] ;
        var v2 = splitValue[f1] ;
        retRateList.push(v2-v1) ;
    }
    retRateList.push(totalPercentage-splitValue[splitValue.length-1]) ;
    // console.log("---split :" + retRateList);

    var calTotal = totalValue ;
    var retList = [] ;
    for (var f1 = 0 ; f1 < retRateList.length-1 ; f1++) {
        var v1 = retRateList[f1] ;                      // ex : 23
        var v2 = this.div(v1 , totalPercentage, pointDigit) ;    // ex : 0.23
        var v3 = this.mul(totalValue, v2, pointDigit) ;
        retList.push(v3) ;
        calTotal = this.sub(calTotal, v3, pointDigit) ;
    }
    retList.push(calTotal) ;
    // console.log(" ---- final:" + retList) ;
    return retList ;
};

// 將 [totalValue] 平均分成 [userAmount] 份   (ex:totalValue=600, userAmount=5 ==> [120,120,120,120,120])
utils.SameSplit = function(totalValue, userAmount, pointDigit) {
    var calTotal = totalValue ;
    var splitList = [] ;
    var divValue = this.div(totalValue, userAmount, pointDigit) ;

    // 每人都拿到一樣的錢
    for (var f1 = 0 ; f1 < userAmount-1 ; f1++) {
        splitList.push(divValue) ;
        calTotal = this.sub(calTotal, divValue, pointDigit) ;
    }

    // 最後一個人可能會拿到無法平分的多的那一點錢
    splitList.push(calTotal);

    return splitList ;
};

// 將 [totalValue] 隨機分成 [userAmount] 份，但每一份至少保底 [1/saveBase]   ex:totalValue=600, userAmount=5
// ==> [100,100,100,100,100] + randomSplit(100,5)
// ==> [100,100,100,100,100] + [ 10,50,20,15,5] ==> [110, 150, 120, 115, 105]
utils.RandomSplitWithBase = function(totalValue, userAmount, saveBase, pointDigit) {
    if (userAmount == 1) return [totalValue];
// console.log("(A)RandomSplitWithBase():    totalValue=" + totalValue + ", userAmount=" + userAmount + ", saveBase=" + saveBase);
    if (saveBase == undefined) saveBase = userAmount+1 ;
    if (saveBase == 0) return this.RandomSplit(totalValue, userAmount, pointDigit) ;
    if (saveBase <= userAmount) saveBase = userAmount+1 ;

    var calTotal = totalValue ;
    var splitList = [] ;

// console.log("RandomSplitWithBase():    totalValue=" + totalValue + ", userAmount=" + userAmount + ", saveBase=" + saveBase);
// console.log("RandomSplitWithBase():    totalValue=" + totalValue + ", userAmount=" + userAmount + ", saveBase=" + saveBase);
// console.log("RandomSplitWithBase():    totalValue=" + totalValue + ", userAmount=" + userAmount + ", saveBase=" + saveBase);
// console.log("RandomSplitWithBase():    totalValue=" + totalValue + ", userAmount=" + userAmount + ", saveBase=" + saveBase);
    var divValue = this.div(totalValue, saveBase, pointDigit) ;

    // 先將1/x分給每個玩家
    for (var f1 = 0 ; f1 < userAmount ; f1++) {
        splitList.push(divValue) ;
        calTotal = this.sub(calTotal, divValue, pointDigit) ;
    }

    // 剩下的再隨機分成[玩家人數]分
    var leftList = this.RandomSplit(calTotal, userAmount, pointDigit) ;
    // console.log("phase 1: " + splitList);

    for (var f1 = 0 ; f1 < splitList.length ; f1++) {
        splitList[f1] = this.add(splitList[f1], leftList[f1], pointDigit) ;
    }
    // console.log("phase 2: " + splitList);
    return splitList ;
};

// 取得8位數隨機數字
utils.GenRandomNumber8 = function() {
    var rndA = Math.floor(Math.random()*10000).toString();
    var rndB = Math.floor(Math.random()*10000).toString();

    while (rndA.length<4) {
        var rndN = Math.floor(Math.random()*10).toString() ;      // 0~9
        var rnd2 = Math.floor(Math.random()*2) ;                  // 0~1
        if (rnd2 == 0)  rndA = rndA.concat(rndN) ;
        else            rndA = rndN.concat(rndA) ;
    }   //
    while (rndB.length<4) {
        var rndN = Math.floor(Math.random()*10).toString() ;      // 0~9
        var rnd2 = Math.floor(Math.random()*2) ;                  // 0~1
        if (rnd2 == 0)  rndB = rndB.concat(rndN) ;
        else            rndB = rndN.concat(rndB) ;
    }   //

    return rndA.concat(rndB) ;
};
//////////////////////////////////////////

utils.PointKeep = function(num,digit) { return point_keep(num,digit) ; }

/// 將傳入的數字，小數點0.1以下的部份截掉
utils.round01 = function(value) {
    var tmpA = this.mul(value, 10) ;
    var tmpB = Math.floor(tmpA) ;
    var tmpC = this.div(tmpB, 10) ;
    return tmpC ;
}

//浮點數相加
var BigNumber_add = function(arg1, arg2, pointDigit)
{
    if (arg1 == undefined) console.error("BigNumber_add().arg1=undefined") ;
    if (arg2 == undefined) console.error("BigNumber_add().arg2=undefined") ;
    arg1 = point_keep(arg1,pointDigit);
    arg2 = point_keep(arg2,pointDigit);
    var retValue = new BigNumber(arg1).add(arg2).toNumber();
    return point_keep(retValue,pointDigit);
};
//浮點數相減
var BigNumber_sub = function(arg1, arg2,pointDigit)
{
    if (arg1 == undefined) console.error("BigNumber_sub().arg1=undefined") ;
    if (arg2 == undefined) console.error("BigNumber_sub().arg2=undefined") ;
    arg1 = point_keep(arg1,pointDigit);
    arg2 = point_keep(arg2,pointDigit);
    var retValue = new BigNumber(arg1).sub(arg2).toNumber();;
    return point_keep(retValue,pointDigit);
};
//浮點數相乘
var BigNumber_mul = function(arg1, arg2,pointDigit)
{
    if (arg1 == undefined) console.error("BigNumber_mul().arg1=undefined") ;
    if (arg2 == undefined) console.error("BigNumber_mul().arg2=undefined") ;

    arg1 = point_keep(arg1,pointDigit);
    arg2 = point_keep(arg2,pointDigit);
    var retValue = new BigNumber(arg1).mul(arg2).toNumber();;
    return point_keep(retValue,pointDigit);
};
//浮點數相除
var BigNumber_div  = function(arg1, arg2,pointDigit)
{
    if (arg1 == undefined) console.error("BigNumber_div().arg1=undefined") ;
    if (arg2 == undefined) console.error("BigNumber_div().arg2=undefined") ;

    arg1 = point_keep(arg1,pointDigit);
    arg2 = point_keep(arg2,pointDigit);
    var retValue = new BigNumber(arg1).div(arg2).toNumber();;
    return point_keep(retValue,pointDigit);
};

var point_keep = function(num, digit){
    if(digit == undefined)digit = 6;
    var s_num = num.toString();
    var p_idx = s_num.indexOf('.');
    if(p_idx == -1) return num;
    s_num = s_num.slice(0,p_idx+digit+1);
    return Number(s_num);
}

function testNumber4(testOp, times, var1, var2, isBigNumber) {
    var func ;
    var retValue ;
    if (testOp === "add") func = NumberUtil.add;
    if (testOp === "sub") func = NumberUtil.sub;
    if (testOp === "mul") func = NumberUtil.mul;
    if (testOp === "div") func = NumberUtil.div;

    var testFunc = "BigNumber" ;
    if (isBigNumber == undefined) testFunc = "normal";

    // console.log(testFunc + " test : " + var1 + " " + testOp + " " + var2 + " ---- times=" + times + "[start]");
    for (var f1=0; f1< times ; f1++) {
        retValue = func(var1,var2,isBigNumber);
    }
    // console.log(testFunc + " test : " + var1 + " " + testOp + " " + var2 + " ---- times=" + times + "[ end ]");
    return retValue;
}

function testNumber3(testOp, times, var1, var2, str) {
    var startTime, endTime;
    var retValue , useTime ;
    startTime = new Date().getTime();

    for (var f1=0; f1< times; f1++) {
        if (testOp === "add") retValue = var1 + var2 ;
        else if (testOp === "sub") retValue = var1 - var2 ;
        else if (testOp === "mul") retValue = var1 * var2 ;
        else if (testOp === "div") retValue = var1 / var2 ;
    }
    endTime = new Date().getTime() ;
    useTime = endTime-startTime ;
    console.log("[ node ] " + var1 + " " + testOp + " " + var2 + " = " + retValue + "(exp: " + str + " )===> use " + useTime);

    startTime = new Date().getTime();
    retValue = testNumber4(testOp, times, var1, var2);
    endTime = new Date().getTime() ;
    useTime = endTime-startTime ;
    console.log("[normal] " + var1 + " " + testOp + " " + var2 + " = " + retValue + "(exp: " + str + " )===> use " + useTime);

    startTime = new Date().getTime();
    retValue = testNumber4(testOp, times, var1, var2, true);
    endTime = new Date().getTime() ;
    useTime = endTime-startTime ;
    console.log("[BigNum] " + var1 + " " + testOp + " " + var2 + " = " + retValue + "(exp: " + str + " )===> use " + useTime);
}

function testNumber() {
    // add : 200.64999999999998
    testNumber3("add", 100000, 135.98, 64.67, "200.64999999999998") ;

    // add : 299
    testNumber3("add", 100000, 135, 64, "299") ;

    // sub: 6.390000000000001
    testNumber3("sub", 100000, 90, 83.61, "6.390000000000001");

    // sub: 90
    testNumber3("sub", 100000, 158.38, 68.38, "90") ;

    // mul: 500
    testNumber3("mul", 100000, 250, 2, "500");

    // mul: 0.010000000000000002
    testNumber3("mul", 100000, 0.1, 0.1, "0.010000000000000002");

    // div: 17.5
    testNumber3("div", 100000, 35, 2, "17.5");

    // div: 0.09999999999999999
    testNumber3("div", 100000, 0.3, 3, "0.09999999999999999");
}

