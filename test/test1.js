function cauchyRancom(a, b) {
    let u, cauchy;
    u = Math.random();
    cauchy = a - b / Math.tan(Math.PI * u);
    return cauchy;
}

function sample(a, b) {
    return (a / 2 + b / 2) + (b / 2 - a / 2) * (2 * Math.random() - 1);
}

function normalRandom(mean, std) {
    let u = 0.0, v = 0.0, w = 0.0, c = 0.0;
    do {
        // 獲得兩個(-1, 1)的獨立隨機變數
        u = Math.random() * 2 - 1.0;
        v = Math.random() * 2 - 1.0;
        w = u * u + v * v;
    } while (w == 0.0 || w >= 1.0)

    // Box-Muller 轉換
    c = Math.sqrt((- 1 * Math.log(w)) / w);
    let normal = mean + (u * c) * std;
    return normal;
}

// 用於產生服從正態分布的隨機數矩陣
function normalRandomSize(mean, std, size) {
    let normal = [];
    for (let i = 0; i < size; i++) {
        normal[i] = randomNormal(mean, std);
    }
    return normal;
}

function main() {
    let numList = [];
    
    for (let i = 0; i < 100000000; i++) {
        // let roll = Math.floor(Math.random() * 100);
        let roll = Math.floor(sample(0, 100));
        if (!numList[roll]) {
            numList[roll] = 0;
        }
        numList[roll]++;
    }
    
    // console.log(JSON.stringify(numList));
    console.log(numList);
}

main();