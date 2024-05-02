const fs = require("fs");
const { parseMoneyString } = require("./utils");

let saveData = []

let convertedData = []


function load() {

    try {
        console.log('Loading...');
        let rawdata = fs.readFileSync("save.json");
        let localInfo = JSON.parse(rawdata);
        if (localInfo) {
            saveData = localInfo;
            console.log('File loaded');
        } else {
            console.log('Nothing to load');
        }
    } catch (e) {
        console.log(e);
    } finally {
        compare()
    }

}

function compare() {
    for (let item of saveData) {
        if (item.price && item.price.includes('$')) {
            let output = item
            const price = parseMoneyString(item.price)

            let soldPriceMargin = undefined
            let listedPriceMargin = undefined

            if (item.blData.soldPriceAvg && item.blData.soldPriceAvg.includes('$')) {
                soldPriceMargin = parseMoneyString(item.blData.soldPriceAvg) - price
            }


            if (item.blData.listedPriceAvg && item.blData.listedPriceAvg.includes('$')) {
                listedPriceMargin = parseMoneyString(item.blData.listedPriceAvg) - price
            }

            output.soldPriceMargin = soldPriceMargin.toFixed(2)
            output.listedPriceMargin = listedPriceMargin.toFixed(2)
            output.link = `https://www.lego.com/en-us/pick-and-build/pick-a-brick?query=${output.elementId}`

            convertedData.push(output)
        }

    }
    convertedData.sort(sortBySoldPriceMargin);
    console.log('Sorting done...');
    console.log('Here is the 15 best items by sold price...');
    console.log(convertedData.slice(0, 15));


    // console.log(convertedData.slice(-5));
}

function sortBySoldPriceMargin(a, b) {
    // If either item does not have soldPriceMargin, consider it smaller and move it to the end
    if (a.soldPriceMargin === undefined) return 1;
    if (b.soldPriceMargin === undefined) return -1;

    // Compare soldPriceMargin values
    return b.soldPriceMargin - a.soldPriceMargin;
}

load()