const axios = require('axios');
const { getBLURL } = require('./bl-checker');
const { getBLPN } = require('./bl-checker-2');
const { extractColorIdFromUrl, delay } = require('./utils');
const { getBLPrices } = require('./bl-checker-3');
const fs = require("fs");

let saveData = []
let pages = 33

const delayMS = 26500

let pabCache = []


async function start() {
    let currentPage = Math.ceil((saveData.length + 1) / 400);
    let currentCount = 0

    let pageChange = false

    async function processPage(page) {

        console.log(`${saveData.length}  / 13051 items scanned. (${(saveData.length / 13051 * 100).toFixed(2)}%)`);
        console.log(`page ${currentPage}`);

        let items = pabCache.length == 0 || saveData.length / 400 > currentPage ? await getPaB(page) : pabCache

        if (pageChange) {
            items = await getPaB(page)
            pageChange = false
        }

        let filteredItems = items.filter(item => {
            return !saveData.some(entry => entry.id === item.id);
        });

        if (filteredItems.length !== items.length) {
            console.log(`${items.length - filteredItems.length} entries found, continuing where left off...`);
        }

        for (let item of filteredItems) {
            const randInt = Math.floor(Math.random() * 1201);
            const checkedItem = await checkPart(item);

            if (checkedItem) {
                if (checkedItem.blData !== null) {
                    saveData.push(checkedItem); // Add checked item to saveData
                    await save(); // Save to .json file
                } else {
                    console.log(`${typeof checkedItem.blData} BL DATA, Stopping...`);
                    return
                }
            }
            console.log(`Waiting ${(delayMS + randInt) / 1000} seconds...`);
            currentCount++
            console.log(`${currentCount} complete`);
            await delay(delayMS + randInt); // Wait for 10 seconds before processing the next item
        }

        if (currentPage == 1 || currentPage < pages) { // Check if currentPage == 1 or currentPage < pages

            currentPage++;
            console.log(`Increasing page to ${currentPage}`);
            if (currentPage <= pages) {
                pageChange = true
                await processPage(currentPage); // Process next page recursively
            }
        }
    }

    await processPage(currentPage);
}

async function getPaB(page) {
    const url = 'https://www.lego.com/api/graphql/PickABrickQuery'

    let data = JSON.stringify({
        "operationName": "PickABrickQuery",
        "variables": {
            "input": {
                "perPage": 400,
                "system": [
                    "LEGO"
                ],
                "page": page
            }
        },
        "query": "query PickABrickQuery($input: ElementQueryArgs, $sku: String) {\n  __typename\n  elements(input: $input) {\n    count\n    facets {\n      ...FacetData\n      __typename\n    }\n    sortOptions {\n      ...Sort_SortOptions\n      __typename\n    }\n    results {\n      ...ElementLeafData\n      __typename\n    }\n    set {\n      id\n      type\n      name\n      imageUrl\n      instructionsUrl\n      pieces\n      inStock\n      price {\n        formattedAmount\n        __typename\n      }\n      __typename\n    }\n    total\n    __typename\n  }\n}\n\nfragment FacetData on Facet {\n  id\n  key\n  name\n  labels {\n    count\n    key\n    name\n    children {\n      count\n      key\n      name\n      ... on FacetValue {\n        value\n        __typename\n      }\n      __typename\n    }\n    ... on FacetValue {\n      value\n      __typename\n    }\n    ... on FacetRange {\n      from\n      to\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment Sort_SortOptions on SortOptions {\n  id\n  key\n  direction\n  label\n  analyticLabel\n  __typename\n}\n\nfragment ElementLeafData on Element {\n  id\n  name\n  categories {\n    name\n    key\n    __typename\n  }\n  inStock\n  ... on SingleVariantElement {\n    variant {\n      ...ElementLeafVariant\n      __typename\n    }\n    __typename\n  }\n  ... on MultiVariantElement {\n    variants {\n      ...ElementLeafVariant\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ElementLeafVariant on ElementVariant {\n  id\n  price {\n    centAmount\n    formattedAmount\n    __typename\n  }\n  attributes {\n    designNumber\n    colourId\n    deliveryChannel\n    maxOrderQuantity\n    system\n    quantityInSet(sku: $sku)\n    indexImageURL\n    __typename\n  }\n  __typename\n}"
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };
    return new Promise((resolve, reject) => {
        axios.request(config)
            .then((response) => {
                const results = response.data.data.elements.results
                const total = response.data.data.elements.total
                if (pages == 0) pages = Math.ceil(total / results.length)

                const convertedResults = []
                const convertedResultsOOS = []

                for (let item of results) {
                    let conversion = {
                        id: item.id,
                        name: item.name,
                        elementId: item.variant.id,
                        price: item.variant.price.formattedAmount,
                        colorId: item.variant.attributes.colourId,
                        system: item.variant.attributes.system
                    }
                    if (item.inStock) {
                        convertedResults.push(conversion)
                    } else {
                        convertedResultsOOS.push(conversion)
                    }

                }

                console.log("P0: Complete");

                console.log(`${total} total PaB parts`);

                pabCache = convertedResults

                savePaBCache()

                resolve(
                    convertedResults,
                )

            })
            .catch((error) => {
                console.log(error);
                console.log("P0: FAILED");
                reject(error);
            })
    });
}


// async function checkPart(part) {
//     let colorId = null
//     getBLURL(part.elementId)
//         .then(url => {
//             if (url) {
//                 colorId = extractColorIdFromUrl(url);

//                 if (colorId) {
//                     return getBLPN(url); // Return the promise from getBLPN
//                 } else {
//                     console.log("Color ID not found in URL");
//                     return null; // Return null if color ID not found
//                 }
//             } else {
//                 console.log("URL not found");
//                 return null;
//             }
//         })
//         .then(pn => {
//             if (pn && colorId) {
//                 // console.log("pn & colID: ", pn, colorId);
//                 return getBLPrices(pn, colorId)
//             } else {
//                 console.log("PN not found");
//                 return null;
//             }
//         }).then(data => {
//             let output = part

//             output.blData = data

//             console.log('final item: ', output);

//             return output;

//         })
//         .catch(error => {
//             console.log("Error:", error);
//             return null;
//         });
//     return null;
// }
async function checkPart(part) {
    return new Promise((resolve, reject) => {
        let colorId = null;
        getBLURL(part.elementId)
            .then(url => {
                if (url) {
                    colorId = extractColorIdFromUrl(url);
                    if (colorId) {
                        return getBLPN(url); // Return the promise from getBLPN
                    } else {
                        console.log("Color ID not found in URL");
                        resolve(null); // Resolve with null if color ID not found
                    }
                } else {
                    console.log("URL not found");
                    resolve(null);
                }
            })
            .then(pn => {
                if (pn && colorId) {

                    part.colorId = colorId
                    return getBLPrices(pn, colorId);
                } else {
                    console.log("PN | CID not found");
                    return 'n'
                }
            })
            .then(data => {
                let output = part;

                if (data == null) reject()
                else if (data == 'n') output.blData = 'not on BL'
                else output.blData = data;
                console.log('final item: ', output);
                resolve(output);
            })
            .catch(error => {
                console.log("Error:", error);
                reject(error);
            });
    });
}

function checkForSave() {
    try {
        return fs.existsSync("save.json");
    } catch (e) {
        console.log(e);
    }
}


function load() {
    if (checkForSave()) {
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
            start()
        }
    } else {
        console.log('No save file found...');
        save().then(() =>
            start())
    }

}

async function save() {
    try {
        console.log("Saving...");
        let data = JSON.stringify(saveData);
        await fs.writeFileSync("save.json", data);
        console.log("Saved!");
        return true
    } catch (e) {
        console.log(e);
    }

}



function loadPaBCache() {
    try {
        console.log('Loading Cache...');
        let rawdata = fs.readFileSync("cache.json");
        let localInfo = JSON.parse(rawdata);
        if (localInfo) {
            pabCache = localInfo;
            console.log('File loaded');
        } else {
            console.log('Nothing to load');
        }
    } catch (e) {
        console.log(e);
    } finally {
        load()
    }
}

async function savePaBCache() {
    try {
        console.log("Saving Cache...");
        let data = JSON.stringify(pabCache);
        await fs.writeFileSync("cache.json", data);
        console.log("Saved!");
        return true
    } catch (e) {
        console.log(e);
    }

}

loadPaBCache()