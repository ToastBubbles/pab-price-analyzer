const axios = require('axios');
const { getBLURL } = require('./bl-checker');
const { getBLPN } = require('./bl-checker-2');
const { extractColorIdFromUrl, delay } = require('./utils');
const { getBLPrices } = require('./bl-checker-3');
const fs = require("fs");

let saveData = []
let pages = 0



// async function start() {


//     let currentPage = 1;

//     async function processPage(page) {
//         let items = await getPaB(page);
//         console.log(items);

//         let filteredItems = items.filter(item => {
//             return !saveData.some(entry => entry.id === item.id);
//         });

//         if (filteredItems.length !== items.length) {
//             console.log(`${items.length - filteredItems.length} entries found, continuing where left off...`);
//         }

//         await Promise.all(filteredItems.map(async (item) => {
//             const checkedItem = await checkPart(item);
//             if (checkedItem) {
//                 saveData.push(checkedItem); // Add checked item to saveData
//                 await save(); // Save to .json file
//             }
//             await delay(10000); // Wait for 10 seconds before processing the next item
//         }));

//         if (currentPage == 1 || currentPage < pages) { // Check if currentPage == 1 or currentPage < pages
//             currentPage++;
//             if (currentPage <= pages) {
//                 await processPage(currentPage); // Process next page recursively
//             }
//         }
//     }

//     await processPage(currentPage);
// }

async function start() {
    let currentPage = 1;

    async function processPage(page) {
        let items = await getPaB(page);
        console.log(items);

        let filteredItems = items.filter(item => {
            return !saveData.some(entry => entry.id === item.id);
        });

        if (filteredItems.length !== items.length) {
            console.log(`${items.length - filteredItems.length} entries found, continuing where left off...`);
        }

        for (let item of filteredItems) {
            const checkedItem = await checkPart(item);
            console.log(checkedItem);
            if (checkedItem) {
                saveData.push(checkedItem); // Add checked item to saveData
                await save(); // Save to .json file
            }
            console.log('Waiting...');
            await delay(10000); // Wait for 10 seconds before processing the next item
        }

        if (currentPage == 1 || currentPage < pages) { // Check if currentPage == 1 or currentPage < pages
            currentPage++;
            if (currentPage <= pages) {
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


async function checkPart(part) {
    let colorId = null
    getBLURL(part.elementId)
        .then(url => {
            if (url) {
                colorId = extractColorIdFromUrl(url);

                if (colorId) {
                    return getBLPN(url); // Return the promise from getBLPN
                } else {
                    console.log("Color ID not found in URL");
                    return null; // Return null if color ID not found
                }
            } else {
                console.log("URL not found");
                return null;
            }
        })
        .then(pn => {
            if (pn && colorId) {
                // console.log("pn & colID: ", pn, colorId);
                return getBLPrices(pn, colorId)
            } else {
                console.log("PN not found");
                return null;
            }
        }).then(data => {
            let output = part

            output.blData = data

            console.log('final item: ', output);

            return output;

        })
        .catch(error => {
            console.log("Error:", error);
            return null;
        });
    return null;
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

load()