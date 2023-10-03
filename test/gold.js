const numUtil = require("../utils/numberUtil");
// const g_cfgDia = require('./config.json') ;
const g_cfgData = require('./cascading.json') ;

// var nSymTotalProb = 0;
// var nSlotTotalProb = [0, 0, 0, 0];
// var nFrameTotalProb = 0;

// var g_gameId = 10001;
// var g_baseBet = 20;
var betList = [0.6, 1.2, 3, 6, 9, 15, 30, 45, 6, 90, 120, 300, 600, 888, 960];

// var init = function() {
//     // 計算圖案隨機分母
//     for (var i = 0; i < g_cfgDia.sym.length; i++) {
//         nSymTotalProb += g_cfgDia.sym[i].prob;
//     }

//     // 計算圖案長度隨機分母
//     for (var i = 0; i < g_cfgDia.slot.length; i++) {
//         var tempProb = 0;
//         for (var k = 0; k < (i + 1); k++) {
//             tempProb += g_cfgDia.slot[k].prob
//         }
//         nSlotTotalProb[i] = tempProb;
//     }
//     // console.log("nSlotTotalProb = ");
//     // console.log(nSlotTotalProb);

//     // 計算邊框隨機分母
//     for (var i = 0; i < g_cfgDia.frame.length; i++) {
//         nFrameTotalProb += g_cfgDia.frame[i].prob;
//     }
// }

var createMap = function(objCfg, map = []) {
    var max_x = objCfg.reel.x;
    var max_y = objCfg.reel.y;
    var nSymTotalProb = 0;
    var nSlotTotalProb = [0, 0, 0, 0];
    var nFrameTotalProb = 0;

    // 計算圖案隨機分母
    for (var i = 0; i < objCfg.sym.length; i++) {
        nSymTotalProb += objCfg.sym[i].prob;
    }

    // 計算圖案長度隨機分母
    for (var i = 0; i < objCfg.slot.length; i++) {
        var tempProb = 0;
        for (var k = 0; k < (i + 1); k++) {
            tempProb += objCfg.slot[k].prob
        }
        nSlotTotalProb[i] = tempProb;
    }

    // 計算邊框隨機分母
    for (var i = 0; i < objCfg.frame.length; i++) {
        nFrameTotalProb += objCfg.frame[i].prob;
    }

    // 傳入空盤面時，代表上一次轉盤未得獎，將盤面初始化
    if (map.length == 0) {
        // (0,0)為左下
        for (var x = 0; x < max_x; x++) {
            var row = [];
            for (var y = 0; y < max_y; y++) {
                row.push(0);
            }
            map.push(row);
        }

        // 左上及右上兩個角落不使用
        map[0][(max_y - 1)] = -1;
        map[(max_x - 1)][(max_y - 1)] = -1;
    }

    for (var x = 0; x < map.length; x++) {
        for (var y = 0; y < map[x].length; y++) {
            if (map[x][y] == 0) {
                var sym = 0; // 圖案id

                // bonus固定2格，因此如果是不能出現2格的位置，將bonus的機率移除
                var nEndSymTotalProb = nSymTotalProb;
                if (y == 0 || y == map[x].length - 1 || x > map.length - 2 ) {
                    for (var i = 0; i < objCfg.sym.length; i++) {
                        if (objCfg.sym[i].id == 23) {
                            nEndSymTotalProb -= objCfg.sym[i].prob;
                            break;
                        }
                    }
                }

                // 產生隨機圖案
                var randProb = Math.floor(Math.random() * nSymTotalProb);
                for (var i = 0; i < objCfg.sym.length; i++) {
                    if (randProb < objCfg.sym[i].prob) {
                        sym = objCfg.sym[i].id;
                        break;
                    } else {
                        randProb -= objCfg.sym[i].prob;
                    }
                }

                // 決定圖案長度，最左邊和最右邊兩行不會出現1格以外的長度
                var slot = 0; // 圖案長度
                if (x > 0 && x < (max_x - 1)) {
                    // 最上面兩列不會出現1格以外的長度
                    var max_slot = 0;
                    if (y <= 1) {
                        max_slot = 3;
                    } else if (y == 2) {
                        max_slot = 2;
                    } else if (y == 3) {
                        max_slot = 1;
                    } else if (y >= 4) {
                        max_slot = 0;
                    }

                    // 百搭最多2格
                    if (sym == 22 && max_slot > 1) {
                        max_slot = 1;
                    }

                    // bonus固定2格
                    if (sym == 22) {
                        slot = 1;
                    } else {
                        var randProb = Math.floor(Math.random() * nSlotTotalProb[max_slot]);
                        for (var i = 0; i < objCfg.slot.length; i++) {
                            if (randProb < objCfg.slot[i].prob) {
                                slot = objCfg.slot[i].id;
                                break;
                            } else {
                                randProb -= objCfg.slot[i].prob;
                            }
                        }
                    }
                }

                // 決定邊框，只有2格以上的圖案才可能有邊框，百搭及尋寶及bonus沒有框
                var frame = 0; // 邊框類型
                if (slot > 0 && sym < 21) {
                    var randProb = Math.floor(Math.random() * nFrameTotalProb);
                    for (var i = 0; i < objCfg.frame.length; i++) {
                        if (randProb < objCfg.frame[i].prob) {
                            frame = objCfg.frame[i].id;
                            break;
                        } else {
                            randProb -= objCfg.frame[i].prob;
                        }
                    }
                }

                // 0-99: 1格，100-199: 無邊框2格，200-299: 無邊框3格，300-399: 無邊框4格
                // 400-499: 銀框2格，500-599: 銀框3格，600-699: 銀框4格，700-799: 金框2格，800-899: 金框3格，900-999: 金框4格
                sym = sym + slot * 100 + frame * 300;
                map[x][y] = sym;

                // 如果圖案長度為2-4格，則將佔據的額外位置填入-1
                for (var i = 0; i < slot; i++) {
                    y++;
                    map[x][y] = -1;
                }
            }
        }
    }

    return map;
}

var getAward = function(map) {
    var awardData = [];
    if (map == null || map === undefined) {
        return awardData;
    }
    
    // 先塞尋寶和bonus進去，數量為0
    var data = {};
    data.sym = 22;
    data.path = [];
    data.payout = [];
    data.payout.push(0);
    data.stop = false;
    awardData.push(data);
    data.sym = 23;
    awardData.push(data);

    // 先計算第1行所有除了百搭以外圖案的數量
    for (var y = 0; y < map[0].length; y++) {
        if (map[0][y] == -1) {
            continue;
        }
        var tempSym = map[0][y];
        if (tempSym != 21) {
            var data = {};
            awardData.forEach((value) => {
                if (value.sym == tempSym) {
                    data = value;
                    var tPath = [];
                    tPath.push(0);
                    tPath.push(y);
                    data.path.push(tPath);
                    data.payout[0]++;
                    value = data;
                    return;
                }
            });
            if (Object.keys(data).length === 0) {
                data.sym = tempSym;
                var tPath = [];
                tPath.push(0);
                tPath.push(y);
                data.path = [];
                data.path.push(tPath);
                data.payout = [];
                data.payout.push(1);
                data.stop = false;
                awardData.push(data);
            }
        }
    }

    // 再把第1行的百搭數量加到除了尋寶和bonus以外的其它圖案上
    for (var y = 0; y < map[0].length; y++) {
        if (map[0][y] != 21) {
            continue;
        }
        awardData.forEach((value) => {
            if (value.sym != 22 && value.sym != 23) {
                var tPath = [];
                tPath.push(0);
                tPath.push(y);
                value.path.push(tPath);
                value.payout[0]++;
            }
        });
    }

    // 從第2行開始判斷有沒有從第1行開始連續出現的圖案或百搭
    for (var x = 1; x < map.length; x++) {
        for (var y = 0; y < map[x].length; y++) {
            if (map[x][y] == -1) {
                continue;
            }
            var tempSym = map[x][y] % 100;
    
            // 先累計有連續圖案的
            for (var i = 0; i < awardData.length; i++) {
                if (awardData[i].stop == false) {
                    if ((awardData[i].sym == tempSym) || (tempSym == 21 && awardData[i].sym != 22 && awardData[i].sym != 23)) {
                        var tPath = [];
                        tPath.push(x);
                        tPath.push(y);
                        awardData[i].path.push(tPath);
                        // 尋寶和bonus只計算總數而不將每行數量分開統計
                        if (awardData[i].sym == 22) {
                            awardData[i].payout[0]++;
                        } else if (awardData[i].sym == 23) {
                            awardData[i].payout[0]++;
                        } else {
                            if (awardData[i].payout.length < (x + 1)){
                                awardData[i].payout.push(1);
                            } else {
                                awardData[i].payout[x]++;
                            }
                        }
                    }
                }
            }
        }
    
        // 如果圖案不是尋寶和bonus，且1-3行沒有連續出現過同圖案或百搭的話，從awardData中刪除
        // 1-3行有連續，但4行之後中任意一行中斷的話，設置為停止計算
        for (var i = 0; i < awardData.length; i++) {
            if (awardData[i].sym != 22 && awardData[i].sym != 23) {
                if (awardData[i].payout.length < (x + 1)) {
                    if (x < 3) {
                        awardData.splice(i, 1);
                        i--;
                    } else {
                        awardData[i].stop = true;
                    }
                }
            }
        }
    }

    // console.log("awardData : ");
    // console.log(awardData);


    // 計算bonus數量為0時，將其刪除
    if (awardData[1].payout[0] == 0) {
        awardData.splice(1, 1);
    }
    // 計算尋寶的數量，少於4個時刪除，如果有其它得獎圖案時，也先將尋寶刪除，先計算其它得獎
    if (awardData[0].payout[0] < 4 || awardData.length > 1) {
        awardData.splice(0, 1);
    }

    return awardData;
}

var sorfMap = function(objCfg, map, awardData) {
    if ((map == null || map == undefined) || (awardData == null || awardData == undefined)) {
        return map;
    }

    // 先將得獎的圖案消去
    for (var i = 0; i < awardData.length; i++) {
        for (var k = 0; k < awardData[i].path.length; k++) {
            var x = awardData[i].path[k][0];
            var y = awardData[i].path[k][1];
            if (map[x][y] < 400) {
                // 399 以下為無邊框圖案，照一般消除處理
                var len = Math.floor(map[x][y] / 100);
                for (var n = 0; n <= len; n++) {
                    map[x][y + n] = 0;
                }
            } else if (map[x][y] > 400 && map[x][y] < 700) {
                // 401-699 為銀框，消除處理為重新產生一個新的一般圖案，然後銀框變成金框
                var nNormalTotalProb = 0;
                for (var n = 0; n < objCfg.sym.length; n++) {
                    if (objCfg.sym[n].id < 21) {
                        nNormalTotalProb += objCfg.sym[n].prob;
                    }
                }
                var randProb = Math.floor(Math.random() * nNormalTotalProb);
                var sym = 0;
                for (var n = 0; n < objCfg.sym.length; n++) {
                    if (objCfg.sym[n].id < 21) {
                        if (randProb < objCfg.sym[n].prob) {
                            sym = objCfg.sym[n].id;
                            break;
                        } else {
                            randProb -= objCfg.sym[n].prob;
                        }
                    }
                }
                map[x][y] = map[x][y] - (map[x][y] % 100) + sym + 300;
                // console.log("[debug] randProb = " + randProb + " / nNormalTotalProb = " + nNormalTotalProb + " / sym = " + sym);
            } else if (map[x][y] > 700 && map[x][y] < 1000) {
                // 701-999 為金框，消除處理為變成百搭
                map[x][y] = map[x][y] - (map[x][y] % 100) + 21 - 600;
            }
        }
    }

    // 除了最上面一列外的圖案，往下掉落
    for (var x = 0; x < map.length; x++) {
        for (var y = 0; y < (map[x].length - 2); y++) {
            if (map[x][y] == 0) {
                // 如果[x][y]為0時，往上尋找到除了最上面一列外第一個不為0的圖案
                for (var n = y + 1; n < (map[x].length - 1); n++) {
                    if (map[x][n] != 0) {
                        map[x][y] = map[x][n];
                        map[x][n] = 0;
                        break;
                    }
                }
            }
        }
    }

    // 最上面一列的圖案，除了最左和最右兩格外，往左靠齊
    for (var x = 1; x < (map.length - 3); x++) {
        var y = map[x].length - 1;
        if (map[x][y] == 0) {
            // 如果[x][y]為0時，往右尋找到除了最右一個外第一個不為0的圖案
            for (var n = x + 1; n < (map.length - 1); n++) {
                if (map[n][y] != 0) {
                    map[x][y] = map[n][y];
                    map[n][y] = 0;
                    break;
                }
            }
        }
    }

    return map;
}

// 字串左邊補字
var _paddingLeft = function(str, lenght, sep = "0") {
    if (str === undefined) {
        str = "";
    }
	if (str.length >= lenght) {
	    return str;
    } else {
	    return _paddingLeft(sep + str, lenght, sep);
    }
}

// 計算object byte size
// function roughSizeOfObject(object) {
//     var objectList = [];
//     var stack = [ object ];
//     var bytes = 0;

//     while ( stack.length ) {
//         var value = stack.pop();

//         if ( typeof value === 'boolean' ) {
//             bytes += 4;
//         } else if ( typeof value === 'string' ) {
//             bytes += value.length * 2;
//         } else if ( typeof value === 'number' ) {
//             bytes += 8;
//         } else if (typeof value === 'object' && objectList.indexOf( value ) === -1) {
//             objectList.push( value );

//             for( var i in value ) {
//                 stack.push( value[ i ] );
//             }
//         }
//     }
//     return bytes;
// }

var getSpin = function(objCfg, map = []) {
    var map = [];
    var awardData = [];
    var totalAwardData = [];
    var totalFreeSpin = 0;
    var combo = 1;
    var enterFree = false;

    do {
        // 如果消去的只有尋寶或bonus，則不增加combo數
        var isCombo = false;
        for (var i = 0; i < awardData.length; i++) {
            if (awardData[i].sym != 22 && awardData[i].sym != 23) {
                isCombo = true;
                break;
            }
        }
        
        // 連續得獎時，累計combo數，平時及進入free spin時+1，free spin中得獎時一次+2
        if (awardData.length > 0 && isCombo) {
            if (totalFreeSpin > 0) {
                if (enterFree == true) {
                    enterFree = false;
                    combo++;
                } else {
                    combo += 2;
                }
            } else {
                combo++;
            }
        }

        // free spin 時，未得獎才會減少 free spin 次數，並將盤面清空
        if (totalFreeSpin > 0 && awardData.length < 1) {
            totalFreeSpin--;
            map = [];
        }
        awardData = [];

        map = createMap(objCfg, map);
        awardData = getAward(map);

        var tempResult = {};

        // 盤面
        var beforeMap = [];
        for (var x = 0; x < map.length; x++) {
            beforeMap.push([]);
            for (var y = 0; y < map[x].length; y++) {
                beforeMap[x].push(map[x][y]);
            }
        }
        tempResult.beforeMap = beforeMap;

        var scoreInfo = [];
        awardData.forEach((data, index) => {
            var temp = {};
            temp.sym = data.sym;

            // 各列消除數量
            temp.payoutValue = [];
            data.payout.forEach((value) => {
                temp.payoutValue.push(value);
            })
            
            // 消除圖案座標
            var path = [];
            for (var x = 0; x < data.path.length; x++) {
                path.push([]);
                for (var y = 0; y < data.path[x].length; y++) {
                    path[x].push(data.path[x][y]);
                }
            }
            temp.path = path;

            // 記錄得獎圖案倍率
            for (var i = 0; i < objCfg.sym.length; i++) {
                if (objCfg.sym[i].id == data.sym) {
                    var len = data.payout.length - 3;       // 得獎列數最低3列，最高6列，因此倍率由0-3分別為3、4、5、6列時的倍率
                    temp.odds = objCfg.sym[i].odds[len];
                }
            }

            // bonus 資訊，盤面上的bonus數字產生，數字為隨機倍率
            temp.bonus = [];
            if (data.sym == 23) {
                for (var i = 0; i < path.length; i++) {
                    temp.bonus.push(Math.floor(Math.random() * objCfg.sym[13].odds[1]) + objCfg.sym[13].odds[0]);
                }
            }

            // 計算 free span 次數
            var freeSpan = 0;
            if (data.sym == 22) {
                enterFree = true;
                freeSpan = objCfg.sym[12].odds[0] + (data.payout[0] - 4) * objCfg.sym[12].odds[1];
            }
            totalFreeSpin += freeSpan;
            temp.freeSpan = totalFreeSpin;

            // 記錄 combo 數
            temp.combo = combo;

            scoreInfo.push(temp);
        })
        tempResult.scoreInfo = scoreInfo;
        totalAwardData.push(tempResult);
            
        if (awardData.length > 0) {
            map = sorfMap(objCfg, map, awardData);
            // console.log(awardData);
        }
    } while(awardData.length > 0 || totalFreeSpin > 0);
    
    return totalAwardData;
}

// var rtpTest = function(count = 1) {
//     var totalOdds = 0;
//     var totalFreeSpin = 0;

//     for (var i = 0; i < count; i++) {
//         var map = createMap();
//         var symData = getAward(map);
    
//         symData.forEach((data, index) => {
//             var symOdds = 0;
//             if (data.sym != 22) {
//                 for (var i = 0; i < g_cfgDia.sym.length; i++) {
//                     if ( g_cfgDia.sym[i].id == data.sym) {
//                         symOdds = g_cfgDia.sym[i].odds[(data.payout.length - 3)];
//                     }
//                 }
//             }
    
//             var numOdds = 1;
//             data.payout.forEach((value) => {
//                 numOdds = numOdds * value;
//             })
    
    
//             var freeSpan = 0;
//             if (data.sym == 22) {
//                 numOdds = 0;
//                 freeSpan = 10 + (data.payout[0] - 4) * 2;
//             }
    
//             totalOdds += (symOdds * numOdds);
//             totalFreeSpin += freeSpan;
//         })
//     }
    
//     console.log("run time " + count + " / total odds = " + totalOdds + " / ave. odds = " + (totalOdds / count) + " / total free spin = " + totalFreeSpin + " / ave. free spin = " + (totalFreeSpin / count));
// }

// var runTest = function() {
//     var betSize = 0.05;
//     var bet = numUtil.mul(betSize, g_baseBet);
//     var map = [];
//     var symData = [];
//     var mapInfo = {};
//     mapInfo.wagerId = g_gameId.toString() + Date.now().toString() + _paddingLeft(Math.floor(Math.random() * 1000).toString(), 3);
//     var resultList = [];
//     var totalFreeSpin = 0;
//     var totalWin = 0;
//     var combo = 1;
//     var enterFree = false;

//     do {
//         if (symData.length > 0) {
//             // 連續得獎時，累計combo數，平時及進入free spin時+1，free spin中得獎時一次+2
//             if (totalFreeSpin > 0) {
//                 if (enterFree == true) {
//                     enterFree = false;
//                     combo++;
//                 } else {
//                     combo += 2;
//                 }
//             } else {
//                 combo++;
//             }
//         }
//         // free spin 時，未得獎才會減少 free spin 次數
//         if (totalFreeSpin > 0 && symData.length < 1) {
//             totalFreeSpin--;
//             map = [];
//         }
//         symData = [];

//         map = createMap(map);
//         symData = _symClear(map);

//         var tempResult = {};

//         // 盤面
//         var beforeMap = [];
//         for (var x = 0; x < map.length; x++) {
//             beforeMap.push([]);
//             for (var y = 0; y < map[x].length; y++) {
//                 beforeMap[x].push(map[x][y]);
//             }
//         }
//         tempResult.beforeMap = beforeMap;

//         var scoreInfo = [];
//         symData.forEach((data, index) => {
//             var temp = {};
//             temp.sym = data.sym;

//             var symOdds = 0;
//             if (data.sym != 22) {
//                 for (var i = 0; i < g_cfgDia.sym.length; i++) {
//                     if ( g_cfgDia.sym[i].id == data.sym) {
//                         symOdds = g_cfgDia.sym[i].odds[(data.payout.length - 3)];
//                         break;
//                     }
//                 }
//             }

//             // 各列消除數量
//             temp.payoutValue = [];

//             var payoutValue = 1;
//             data.payout.forEach((value) => {    
//                 payoutValue = payoutValue * value;
//                 temp.payoutValue.push(value);
//             })
//             // 實際得分
//             temp.score = numUtil.mul(numUtil.mul(betSize, symOdds), payoutValue);
//             // 實際總得分
//             temp.totalWin = numUtil.add(totalWin, temp.score);
            
//             // 消除圖案座標
//             var path = [];
//             for (var x = 0; x < data.path.length; x++) {
//                 path.push([]);
//                 for (var y = 0; y < data.path[x].length; y++) {
//                     path[x].push(data.path[x][y]);
//                 }
//             }
//             temp.path = path;

//             // 計算 free span 次數
//             var freeSpan = 0;
//             if (data.sym == 22) {
//                 enterFree = true;
//                 freeSpan = g_cfgDia.sym[12].odds[0] + (data.payout[0] - 4) * g_cfgDia.sym[12].odds[1];
//             }
//             totalFreeSpin += freeSpan;
//             temp.freeSpan = freeSpan;

//             // 記錄 combo 數
//             temp.combo = combo;

//             scoreInfo.push(temp);
//         })
//         tempResult.scoreInfo = scoreInfo;
//         resultList.push(tempResult);
            
//         if (symData.length > 0) {
//             map = sorfMap(map, symData);
//             // console.log(symData);
//         }
//     } while(symData.length > 0 || totalFreeSpin > 0);
//     mapInfo.resultList = resultList;

//     console.log("=================================================")
//     console.log(JSON.stringify(mapInfo));
//     console.log("=================================================")

//     // debug log
//     resultList.forEach((result, index) => {
//         var map = result.beforeMap;
//         // console.log(map);
//         for (var y = g_cfgDia.reel.y - 1; y >= 0; y--) {
//             var mapStr = "";
//             for (var x = 0; x < g_cfgDia.reel.x; x++) {
//                 mapStr = mapStr + "[" + _paddingLeft(map[x][y].toString(), 3, " ") + "]";
//             }
//             console.log(mapStr);
//         }

//         var scoreInfo = result.scoreInfo;
//         scoreInfo.forEach((info) => {            
//             var payoutStr = "";
//             info.payoutValue.forEach((value) => {
//                 if (payoutStr == "") {
//                     payoutStr += "[";
//                 } else {
//                     payoutStr += ", ";
//                 }
//                 payoutStr += value;
//             })
//             payoutStr += "]";
            
//             var pathStr = "";
//             info.path.forEach((value) => {
//                 if (pathStr == "") {
//                     pathStr += "[";
//                 } else {
//                     pathStr += ", ";
//                 }
//                 pathStr += "[" + value[0] + ", " + value[1] + "]";
//             })
//             pathStr += "]";

//             console.log("sym = " + info.sym + " / payout value : " + payoutStr + " / path = " + pathStr + " / score = " + info.score + " / combo = " + info.combo + " / freeSpan = " + info.freeSpan);
//         });

//         console.log("=================================================")
//     })

//     console.log("result size : " + roughSizeOfObject(mapInfo) + " bytes");

// }


var runTest = function() {
    var bet = betList[0];
    let fBet = numUtil.div(bet, 20, 4);
    var objAward = getSpin(g_cfgData);
    
    // 計算實際贏得倍率及贏分
    let fTWin = 0;
    for (let nA = 0; nA < objAward.length; nA++) {
        for (let nB = 0; nB < objAward[nA].scoreInfo.length; nB++) {
            let scoreInfo = objAward[nA].scoreInfo[nB];
            let odds = 1;
            // 尋寶及bonus的得分倍率為0
            if (scoreInfo.sym == 22 || scoreInfo.sym == 23) {
                odds = 0;
                // 將bonus的數字從倍率換成實際金額
                if (scoreInfo.sym == 23) {
                    for (let nC = 0; nC < scoreInfo.bonus.length; nC++) {
                        scoreInfo.bonus[nC] = numUtil.mul(bet, scoreInfo.bonus[nC]);
                    }
                }
            } else {
                // 倍率額外加成計算為每列同圖案數量的乘積
                for (let nC = 0; nC < scoreInfo.payoutValue.length; nC++) {
                    odds = numUtil.mul(odds, scoreInfo.payoutValue[nC], 4);
                }
                odds = numUtil.mul(odds, scoreInfo.odds, 4);
            }
            objAward[nA].scoreInfo[nB].odds = odds;
            objAward[nA].scoreInfo[nB].totalWin = numUtil.mul(numUtil.mul(fBet, odds, 4), scoreInfo.combo, 4);
            fTWin = numUtil.add(fTWin , objAward[nA].scoreInfo[nB].totalWin);
        }
    }

    console.log(JSON.stringify(objAward));
    console.log("fTWin = " + fTWin);
}

// init();

// rtpTest(1000000);
runTest();
