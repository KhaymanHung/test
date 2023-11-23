const numUtil = require("../utils/numberUtil");
// const g_cfgDia = require('./config.json') ;
const g_cfgData = require('./cascading.json') ;
var def = require("./cmd_define");

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

                // Bonus固定2格，因此如果是不能出現2格的位置(第一行、最後一行，以及最上面兩列)，將Bonus的機率移除
                var nEndSymTotalProb = nSymTotalProb;
                if (x == 0 || x > map.length - 2 || y >= map[x].length - 2) {
                    for (var i = 0; i < objCfg.sym.length; i++) {
                        if (objCfg.sym[i].id == def.SYMBOLS.SYMBOLS_BONUS) {
                            nEndSymTotalProb -= objCfg.sym[i].prob;
                            break;
                        }
                    }
                }

                // 產生隨機圖案
                var randProb = Math.floor(Math.random() * nEndSymTotalProb);
                for (var i = 0; i < objCfg.sym.length; i++) {
                    if (randProb < objCfg.sym[i].prob) {
                        sym = objCfg.sym[i].id;
                        // 第一行不會出現Wild，如果出現Wild，重骰
                        if (x == 0 && sym == def.SYMBOLS.SYMBOLS_WILD) {
                            randProb = Math.floor(Math.random() * nEndSymTotalProb);
                            i = -1;
                            continue;
                        }
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
                    }

                    // Scattle最多2格
                    if (sym == def.SYMBOLS.SYMBOLS_SCATTER && max_slot > 1) {
                        max_slot = 1;
                    }

                    // Bonus固定2格
                    if (sym == def.SYMBOLS.SYMBOLS_BONUS) {
                        slot = 1;
                    } else if (max_slot > 0) {
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

                // 決定邊框，只有2格以上的圖案才可能有邊框，Wild及Scatter及Bonus沒有框
                var frame = 0; // 邊框類型
                if (slot > 0 && sym <= def.SYMBOLS.SYMBOLS_SA) {
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

// 將盤面填滿scatter及bonus以外的圖案，且不會有其它得獎
var createNoAwardMap = function(objCfg, map = []) {
    var max_x = objCfg.reel.x;
    var max_y = objCfg.reel.y;
    var nSymTotalProb = 0;
    var nSlotTotalProb = [0, 0, 0, 0];
    var nFrameTotalProb = 0;

    // 計算圖案隨機分母，不會出現scatter和bonus
    for (var i = 0; i < objCfg.sym.length; i++) {
        if (objCfg.sym[i].id != def.SYMBOLS.SYMBOLS_SCATTER && objCfg.sym[i].id != def.SYMBOLS.SYMBOLS_BONUS) {
            nSymTotalProb += objCfg.sym[i].prob;
        }
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
    var nAwardSym = 0;
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
    } else {
        // 如果不是空盤面時，傳入盤面應該只有確認得獎圖案，取得得獎圖案
        for (var x = 0; x < max_x; x++) {
            for (var y = 0; y < max_y; y++) {
                if (map[x][x] != 0 && map[x][x] != -1) {
                    nAwardSym = map[x][x] % 100;
                    break;
                }
            }
            if (nAwardSym != 0) {
                break;
            }
        }
    }

    for (var x = 0; x < map.length; x++) {
        for (var y = 0; y < map[x].length; y++) {
            if (map[x][y] == 0) {
                var sym = 0; // 圖案id

                // 產生隨機圖案
                var randProb = Math.floor(Math.random() * nSymTotalProb);
                for (var i = 0; i < objCfg.sym.length; i++) {
                    if (randProb < objCfg.sym[i].prob) {
                        sym = objCfg.sym[i].id;

                        // 產生圖案與傳入的得獎圖案相同時，重骰
                        if (nAwardSym == sym) {
                            randProb = Math.floor(Math.random() * nSymTotalProb);
                            i = -1;
                            continue;
                        }

                        // 第1-3行不會出現Wild，如果出現Wild，重骰
                        if (x < 3 && sym == def.SYMBOLS.SYMBOLS_WILD) {
                            randProb = Math.floor(Math.random() * nSymTotalProb);
                            i = -1;
                            continue;
                        }

                        // 第3行如果出現的圖案前兩行各有至少一個，重骰，如此應該保證不會出現其實得獎
                        if (x == 3) {
                            var isContinue = false;
                            for (var _y = 0; _y < map[0].length; _y++) {
                                if (map[0][_y] == sym) {
                                    isContinue = true;
                                    break;
                                }
                            }
                            if (isContinue) {
                                isContinue = false;
                                for (var _y = 0; _y < map[1].length; _y++) {
                                    if (map[1][_y] == sym) {
                                        isContinue = true;
                                        break;
                                    }
                                }
                                if (isContinue) {
                                    randProb = Math.floor(Math.random() * nSymTotalProb);
                                    i = -1;
                                    continue;
                                }
                            }
                        }

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
                    }

                    if (max_slot > 0) {
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

                // 決定邊框，只有2格以上的圖案才可能有邊框，Wild及Scatter及Bonus沒有框
                var frame = 0; // 邊框類型
                if (slot > 0 && sym <= def.SYMBOLS.SYMBOLS_SA) {
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
};

// 在空白盤面上隨機放入num個指定圖案，且達成得獎條件
var getsReservedAwardMap = function(objCfg, sym, num) {
    var map = [];

    // 如果數量不可能小於1
    if (num < 1) {
        return map;
    }

    // 如果指定圖案為Wild，因為Wild不可能開獨得獎，故不成立
    if (sym == def.SYMBOLS.SYMBOLS_WILD) {
        return map;
    }

    // 如果指定圖案為Scattle，因為Scattle至少需要4個才能得獎，故如果num少於4，則不成立
    if (sym == def.SYMBOLS.SYMBOLS_SCATTER && num < 4) {
        return map;
    }

    // 如果指定圖案為一般得獎圖案，因為至少需要3個才能得獎，故如果num少於3，則不成立
    if (sym >= def.SYMBOLS.SYMBOLS_10 && sym <= def.SYMBOLS.SYMBOLS_SA && num < 3) {
        return map;
    }

    var max_x = objCfg.reel.x;
    var max_y = objCfg.reel.y;

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

    if (sym == def.SYMBOLS.SYMBOLS_SCATTER || sym == def.SYMBOLS.SYMBOLS_BONUS) {
        // scatter和bonus得獎只需盤面上有一定個數即可，故不需在意連續
        for (var i = 0; i < num; i++) {
            // 取得目前可以放置的位置
            var randomList = [];

            for (var x = 0; x < max_x; x++) {
                for (var y = 0; y < max_y; y++) {
                    if (sym == def.SYMBOLS.SYMBOLS_SCATTER) {
                        if (map[x][y] == 0) {
                            var pos = {};
                            pos.x = x;
                            pos.y = y;
                            randomList.push(pos);
                        }
                    } else if (sym == def.SYMBOLS.SYMBOLS_BONUS) {
                        if (x > 0 && x < (max_x - 1) && y < (max_y - 3)) {
                            if (map[x][y] == 0 && map[x][y + 1] == 0) {
                                var pos = {};
                                pos.x = x;
                                pos.y = y;
                                randomList.push(pos);
                            }
                        }
                    }
                }
            }

            if (randomList.length > 0) {
                var roll = Math.floor(Math.random() * randomList.length);
                var pos = randomList[roll];
                if (sym == def.SYMBOLS.SYMBOLS_SCATTER) {
                    map[pos.x][pos.y] = sym;
                } else if (sym == def.SYMBOLS.SYMBOLS_BONUS) {
                    // bonus 固定2格
                    map[pos.x][pos.y] = sym + 100;
                    map[pos.x][pos.y + 1] = -1;
                }
            } else {
                // 沒有位置放就提前結束
                break;
            }
        }
    } else {
        // 一般圖案得獎需在意連續
        var x = 0;
        for (var i = 0; i < num; i++) {
            // 取得目前可以放置的位置
            var randomList = [];
            for (var y = 0; y < max_y; y++) {
                if (map[x][y] == 0) {
                    var pos = {};
                    pos.x = x;
                    pos.y = y;
                    randomList.push(pos);
                }
            }

            if (randomList.length > 0) {
                var roll = Math.floor(Math.random() * randomList.length);
                var pos = randomList[roll];
                map[pos.x][pos.y] = sym;
            } else {
                // 沒有位置放就提前結束
                break;
            }

            x++;
            if (x >= max_x) {
                x = 0;
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
    
    // 先塞Scatter和Bonus進去，數量為0
    var data_scatter = {};
    data_scatter.sym = def.SYMBOLS.SYMBOLS_SCATTER;
    data_scatter.path = [];
    data_scatter.payout = [];
    data_scatter.payout.push(0);
    data_scatter.stop = false;
    awardData.push(data_scatter);
    
    var data_bonus = {};
    data_bonus.sym = def.SYMBOLS.SYMBOLS_BONUS;
    data_bonus.path = [];
    data_bonus.payout = [];
    data_bonus.payout.push(0);
    data_bonus.stop = false;
    awardData.push(data_bonus);

    // 先計算第1行所有除了Wild以外圖案的數量
    for (var y = 0; y < map[0].length; y++) {
        if (map[0][y] == -1) {
            continue;
        }
        var tempSym = map[0][y];
        if (tempSym != def.SYMBOLS.SYMBOLS_WILD) {
            var isHave = false;
            for (var i = 0; i < awardData.length; i++) {
                if (awardData[i].sym == tempSym) {
                    awardData[i].path.push([0, y]);
                    awardData[i].payout[0]++;
                    isHave = true;
                    break;
                }
            }
            if (isHave == false) {
                var _data = {};
                _data.sym = tempSym;
                var tPath = [0, y];
                _data.path = [tPath];
                _data.payout = [1];
                _data.stop = false;
                awardData.push(_data);
            }
        }
    }
    
    // 從第2行開始判斷有沒有從第1行開始連續出現的圖案或Wild
    for (var x = 1; x < map.length; x++) {
        for (var y = 0; y < map[x].length; y++) {
            if (map[x][y] == -1) {
                continue;
            }
            var tempSym = map[x][y] % 100;
    
            // 先累計有連續圖案的
            for (var i = 0; i < awardData.length; i++) {
                if (awardData[i].stop == false) {
                    if ((awardData[i].sym == tempSym) ||
                        (tempSym == def.SYMBOLS.SYMBOLS_WILD && awardData[i].sym != def.SYMBOLS.SYMBOLS_SCATTER && awardData[i].sym != def.SYMBOLS.SYMBOLS_BONUS)) {
                        var tPath = [];
                        tPath.push(x);
                        tPath.push(y);
                        awardData[i].path.push(tPath);
                        // Scatter和Bonus只計算總數而不將每行數量分開統計
                        if (awardData[i].sym == def.SYMBOLS.SYMBOLS_SCATTER || awardData[i].sym == def.SYMBOLS.SYMBOLS_BONUS) {
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
    
        // 如果圖案不是Scatter和Bonus，且1-3行沒有連續出現過同圖案或Wild的話，從awardData中刪除
        // 1-3行有連續，但4行之後中任意一行中斷的話，設置為停止計算
        for (var i = 0; i < awardData.length; i++) {
            if (awardData[i].sym != def.SYMBOLS.SYMBOLS_SCATTER && awardData[i].sym != def.SYMBOLS.SYMBOLS_BONUS) {
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

    var isOtherAward = false;
    for (var i = 0; i < awardData.length; i++) {
        // 計算Bonus數量小於1時刪除
        if (awardData[i].sym == def.SYMBOLS.SYMBOLS_BONUS && awardData[i].payout[0] < 1) {
            awardData.splice(i, 1);
            i--;
            continue;
        }
        // 計算Scatter的數量少於4個時刪除
        if (awardData[i].sym == def.SYMBOLS.SYMBOLS_SCATTER && awardData[i].payout[0] < 4) {
            awardData.splice(i, 1);
            i--;
            continue;
        }
        // 如果有其它得獎圖案時，先將Scatter及Bonus刪除，先計算其它得獎
        if (awardData[i].sym != def.SYMBOLS.SYMBOLS_SCATTER && awardData[i].sym != def.SYMBOLS.SYMBOLS_BONUS) {
            isOtherAward = true;
        }
    }
    if (isOtherAward) {
        // 因為不確定在之前Bonus及Scatter有沒有因為數量不足而被事先刪除，因此只好再foreach一次
        for (var i = 0; i < awardData.length; i++) {
            if (awardData[i].sym == def.SYMBOLS.SYMBOLS_SCATTER || awardData[i].sym == def.SYMBOLS.SYMBOLS_BONUS) {
                awardData.splice(i, 1);
                i--;
            }
        }
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
                    if (objCfg.sym[n].id <= def.SYMBOLS.SYMBOLS_SA) {
                        nNormalTotalProb += objCfg.sym[n].prob;
                    }
                }
                var randProb = Math.floor(Math.random() * nNormalTotalProb);
                var sym = 0;
                for (var n = 0; n < objCfg.sym.length; n++) {
                    if (objCfg.sym[n].id <= def.SYMBOLS.SYMBOLS_SA) {
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
                // 701-999 為金框，消除處理為變成Wild
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
    for (var x = 1; x < (map.length - 1); x++) {
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

// 進行包括freespin在內的完整一局，mode為盤面產生模式，1 普通隨機填滿盤面，2 將盤面填滿scatter及bonus以外的圖案，且不會有其它得獎
var getSpin = function(objCfg, mode, arDefinedMap = []) {
    var map = arDefinedMap;
    var awardData = [];
    var totalAwardData = [];
    var totalFreeSpin = 0;
    var combo = 1;
    var enterFree = false;
    var first = 0;

    do {
        // 連續得獎時，累計combo數，平時及進入 free spin 時 +1，free spin 中得獎時一次 +2
        if (awardData.length > 0) {
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
    
        if (mode == 1) {
            // 普通的隨機填滿盤面
                // console.log("[debug] getSpin, mode: " + mode + ", createMap");
            map = createMap(objCfg, map);
        } else if (mode == 2) {
            if (first == 0) {
                // 將盤面填滿scatter及bonus以外的圖案，且不會有其它得獎
                // 此狀況為使用fs道具時出現，而且只有此局的第一次盤面才需如此
                // console.log("[debug] getSpin, mode: " + mode + ", createNoAwardMap");
                map = createNoAwardMap(objCfg, map);
                first = 1;
            } else {
                // 普通的隨機填滿盤面
                // console.log("[debug] getSpin, mode: " + mode + ", createMap");
                map = createMap(objCfg, map);
            }
        }
        // console.log("[debug] getSpin, getAward");
        awardData = getAward(map);

        var tempResult = {};

        // 盤面複製
        var beforeMap = [];
        for (var x = 0; x < map.length; x++) {
            beforeMap.push([]);
            for (var y = 0; y < map[x].length; y++) {
                beforeMap[x].push(map[x][y]);
            }
        }
        tempResult.beforeMap = beforeMap;

        var bReroll = false;
        var scoreInfo = [];
        for (var i = 0; i < awardData.length; i++) {
            var data = awardData[i];
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

            // Bonus 資訊，盤面上的Bonus數字產生，數字為隨機倍率
            temp.bonus = [];
            if (data.sym == def.SYMBOLS.SYMBOLS_BONUS) {
                for (var i = 0; i < path.length; i++) {
                    temp.bonus.push(Math.floor(Math.random() * objCfg.sym[13].odds[1]) + objCfg.sym[13].odds[0]);
                }
            }
    
            // 計算 free span 次數
            var freeSpan = 0;
            if (data.sym == def.SYMBOLS.SYMBOLS_SCATTER) {
                // 如果 freespin 還有 2 次以上，則不應該再出現 freespin
                if (totalFreeSpin < 3) {
                    enterFree = true;
                    freeSpan = objCfg.sym[12].odds[0] + (data.payout[0] - 4) * objCfg.sym[12].odds[1];
                } else {
                    bReroll = true;
                    break;
                }
            }
            totalFreeSpin += freeSpan;
            temp.freeSpan = totalFreeSpin;

            // 記錄 combo 數
            temp.combo = combo;

            scoreInfo.push(temp);
        }
        if (bReroll) {
            awardData = [];
            totalFreeSpin++;        // 將此次 freespin 加回來
            continue;
        }
        tempResult.scoreInfo = scoreInfo;
        totalAwardData.push(tempResult);
        // console.log("[debug] getSpin, tempResult: " + JSON.stringify(tempResult) + ", totalFreeSpin: " + totalFreeSpin);
        
        // 因為只有沒有其它圖案得獎時才會在得獎中列入符合條件的Scattle和Bonus，所以如果得獎列表中出現 Scattle 和 Bonus 時，將得獎列表清空，以便後續處理時視為無得獎來處理
        for (var i = 0; i < awardData.length; i++) {
            if (awardData[i].sym == def.SYMBOLS.SYMBOLS_SCATTER || awardData[i].sym == def.SYMBOLS.SYMBOLS_BONUS) {
                awardData = [];
            }
        }

        if (awardData.length > 0) {
            // console.log("[debug] getSpin, sorfMap");
            map = slotLogic.sorfMap(objCfg, map, awardData);
        }
        // console.log("[debug] getSpin, awardData: " + JSON.stringify(awardData) + ", totalFreeSpin: " + totalFreeSpin);
    } while(awardData.length > 0 || totalFreeSpin > 0);
    
    // console.log("[debug] getSpin, end");
    return totalAwardData;
}

var checkMap = function(objCfg, checkMap = []) {
    var map = [];
    var awardData = [];
    var totalAwardData = [];
    var totalFreeSpin = 0;
    var combo = 1;
    var enterFree = false;

    for (var num = 0; num < checkMap.length; num++) {
        console.log("=================================================================================");
        console.log("[debug] getSpin, num: " + num);
        // 連續得獎時，累計combo數，平時及進入 free spin 時 +1，free spin 中得獎時一次 +2
        if (awardData.length > 0) {
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
            console.log("[debug] map = [], totalFreeSpin: " + totalFreeSpin + ", awardData: " + JSON.stringify(awardData));
            totalFreeSpin--;
            map = [];
        }
        awardData = [];
    
        map = checkMap[num];
        console.log("[debug] getSpin, map: " + JSON.stringify(map));
        awardData = getAward(map);
        console.log("[debug] getAward, awardData: " + JSON.stringify(awardData));

        var tempResult = {};

        // 盤面複製
        var beforeMap = [];
        for (var x = 0; x < map.length; x++) {
            beforeMap.push([]);
            for (var y = 0; y < map[x].length; y++) {
                beforeMap[x].push(map[x][y]);
            }
        }
        tempResult.beforeMap = beforeMap;

        var bReroll = false;
        var scoreInfo = [];
        for (var i = 0; i < awardData.length; i++) {
            var data = awardData[i];
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
            for (var symNum = 0; symNum < objCfg.sym.length; symNum++) {
                if (objCfg.sym[symNum].id == data.sym) {
                    var len = data.payout.length - 3;       // 得獎列數最低3列，最高6列，因此倍率由0-3分別為3、4、5、6列時的倍率
                    temp.odds = objCfg.sym[symNum].odds[len];
                }
            }

            // Bonus 資訊，盤面上的Bonus數字產生，數字為隨機倍率
            temp.bonus = [];
            if (data.sym == def.SYMBOLS.SYMBOLS_BONUS) {
                for (var pathNum = 0; pathNum < path.length; pathNum++) {
                    temp.bonus.push(Math.floor(Math.random() * objCfg.sym[13].odds[1]) + objCfg.sym[13].odds[0]);
                }
            }
    
            // 計算 free span 次數
            var freeSpan = 0;
            if (data.sym == def.SYMBOLS.SYMBOLS_SCATTER) {
                // 如果 freespin 還有 2 次以上，則不應該再出現 freespin
                if (totalFreeSpin < 3) {
                    enterFree = true;
                    freeSpan = objCfg.sym[12].odds[0] + (data.payout[0] - 4) * objCfg.sym[12].odds[1];
                } else {
                    bReroll = true;
                    break;
                }
            }
            totalFreeSpin += freeSpan;
            temp.freeSpan = totalFreeSpin;

            // 記錄 combo 數
            temp.combo = combo;

            scoreInfo.push(temp);
        }
        if (bReroll) {
            awardData = [];
            totalFreeSpin++;        // 將此次 freespin 加回來
            continue;
        }
        tempResult.scoreInfo = scoreInfo;
        totalAwardData.push(tempResult);
        console.log("[debug] make result, result: " + JSON.stringify(tempResult));
        
        // 因為只有沒有其它圖案得獎時才會在得獎中列入符合條件的Scattle和Bonus，所以如果得獎列表中出現 Scattle 和 Bonus 時，將得獎列表清空，以便後續處理時視為無得獎來處理
        for (var i = 0; i < awardData.length; i++) {
            if (awardData[i].sym == def.SYMBOLS.SYMBOLS_SCATTER || awardData[i].sym == def.SYMBOLS.SYMBOLS_BONUS) {
                awardData = [];
            }
        }

        if (awardData.length > 0) {
            map = sorfMap(objCfg, map, awardData);
            console.log("[debug] sorfMap, map: " + JSON.stringify(map));
        }
    }
    
    console.log("[debug] check end, totalAwardData: " + JSON.stringify(totalAwardData));
    console.log("=================================================================================");
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
// runTest();


// map = this.createMap(objCfg, map);
var map = [
	[
		[9,22,3,9,6,-1],[601,-1,-1,-1,1,6],[203,-1,-1,110,-1,22],[6,22,122,-1,4,7],[123,-1,4,9,1,6],[5,11,6,4,5,-1]
	],
	[
		[6,8,4,3,1,-1],[1,306,-1,-1,-1,21],[4,122,-1,121,-1,2],[1,408,-1,5,4,3],[101,-1,5,1,5,8],[3,5,8,1,10,-1]
	],
	[
		[3,4,3,2,3,-1],[104,-1,121,-1,7,2],[122,-1,106,-1,1,8],[702,-1,5,103,-1,5],[5,5,101,-1,5,1],[3,5,10,5,4,-1]
	],
	[
		[8,5,3,7,7,-1],[110,-1,123,-1,4,5],[301,-1,-1,-1,5,3],[108,-1,109,-1,5,6],[8,2,3,6,7,3],[22,1,5,21,9,-1]
	],
	[
		[8,3,7,7,5,-1],[110,-1,123,-1,4,3],[301,-1,-1,-1,6,6],[108,-1,109,-1,3,3],[8,2,3,6,7,3],[22,1,5,21,9,-1]
	],
	[
		[2,6,6,6,22,-1],[406,-1,101,-1,2,2],[2,7,103,-1,6,3],[9,123,-1,101,-1,9],[3,8,21,102,-1,7],[5,2,3,3,7,-1]
	],
	[
		[22,2,3,7,7,-1],[702,-1,101,-1,8,3],[7,103,-1,8,8,9],[9,123,-1,101,-1,7],[3,8,21,102,-1,6],[5,2,3,3,7,-1]
	],
	[
		[22,2,7,7,6,-1],[702,-1,101,-1,8,9],[7,8,8,2,2,7],[9,123,-1,101,-1,6],[3,8,21,102,-1,7],[5,2,3,3,7,-1]
	],
	[
		[22,7,7,6,7,-1],[121,-1,101,-1,8,9],[7,8,8,102,-1,7],[9,123,-1,101,-1,6],[3,8,21,102,-1,7],[5,2,3,3,7,-1]
	],
	[
		[22,6,1,2,22,-1],[101,-1,8,104,-1,9],[8,8,102,-1,3,6],[9,123,-1,101,-1,7],[3,8,21,102,-1,9],[5,2,3,3,7,-1]
	],
	[
		[1,1,6,22,4,-1],[1,404,-1,406,-1,7],[1,105,-1,104,-1,3],[5,22,502,-1,-1,2],[410,-1,3,105,-1,21],[4,7,8,3,4,-1]
	],
	[
		[6,22,5,4,1,-1],[709,-1,406,-1,2,7],[105,-1,102,-1,3,3],[5,22,502,-1,-1,2],[410,-1,3,105,-1,21],[4,7,8,3,4,-1]
	],
	[
		[6,9,6,7,6,-1],[1,7,111,-1,5,9],[21,103,-1,103,-1,3],[4,210,-1,-1,22,22],[122,-1,5,3,3,1],[8,21,10,3,1,-1]
	],
	[
		[6,6,6,5,3,-1],[1,111,-1,5,2,3],[103,-1,103,-1,22,22],[4,210,-1,-1,22,1],[122,-1,5,3,3,1],[8,21,10,3,1,-1]
	],
	[
		[22,6,5,2,4,-1],[101,-1,6,401,-1,1],[209,-1,-1,121,-1,1],[302,-1,-1,-1,6,1],[6,101,-1,121,-1,1],[10,4,3,1,3,-1]
	],
	[
		[22,5,2,4,3,-1],[101,-1,401,-1,5,1],[209,-1,-1,103,-1,1],[302,-1,-1,-1,7,1],[101,-1,2,8,1,1],[10,4,3,1,3,-1]
	],
	[
		[4,1,7,7,6,-1],[108,-1,108,-1,3,2],[3,204,-1,-1,7,6],[303,-1,-1,-1,3,3],[4,123,-1,106,-1,3],[1,2,7,5,2,-1]
	],
	[
		[5,9,8,10,10,-1],[402,-1,2,121,-1,9],[3,22,401,-1,21,1],[402,-1,122,-1,1,8],[409,-1,102,-1,1,4],[1,6,3,3,7,-1]
	],
	[
		[10,3,4,8,8,-1],[402,-1,2,8,9,1],[3,22,401,-1,6,4],[402,-1,122,-1,1,1],[409,-1,102,-1,1,3],[1,6,3,3,7,-1]
	],
	[
		[6,10,4,2,2,-1],[2,406,-1,121,-1,8],[308,-1,-1,-1,9,1],[403,-1,122,-1,9,9],[203,-1,-1,102,-1,3],[7,3,7,6,2,-1]
	],
	[
		[10,4,10,9,1,-1],[302,-1,-1,-1,7,2],[121,-1,104,-1,6,11],[102,-1,2,101,-1,3],[103,-1,102,-1,6,21],[5,6,8,1,22,-1]
	],
	[
		[2,10,8,2,4,-1],[4,202,-1,-1,3,10],[6,105,-1,9,8,5],[6,121,-1,7,8,3],[1,8,22,3,1,1],[4,5,1,4,1,-1]
	]
];

// var awardData = getAward(map);
// map = sorfMap(g_cfgData, map, awardData);
// console.log(JSON.stringify(awardData));
// console.log(map);
checkMap(g_cfgData, map);