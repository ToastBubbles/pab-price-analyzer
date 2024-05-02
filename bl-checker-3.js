var HTMLParser = require("node-html-parser");
const https = require("https");

const { generateHeader } = require("./utils");

function getBLPrices(pn, cid) {
    return new Promise((resolve, reject) => {
        try {
            const options = {
                host: `www.bricklink.com`,
                path: `/catalogPG.asp?P=${pn}&ColorID=${cid}`,
                headers: {
                    "User-Agent": generateHeader(),
                },
            };
            https
                .get(options, (resp) => {
                    if (resp.statusCode == 200) {
                        let data = "";
                        resp.on("data", (chunk) => {
                            data += chunk;
                        });
                        resp.on("end", () => {
                            if (data === "") {
                                throw "empty string";
                            }

                            var root = HTMLParser.parse(data);

                            let imgElement = root.querySelector("[NAME='img-1']")
                            let name = imgElement.getAttribute("title").toString()
                            name = name.substring(name.indexOf("Name: ") + 6, name.length)

                            let tables = root.querySelectorAll(`td[valign="TOP"],font.fv`)

                            let placer = 0
                            let newPriceLISTEDAvg = "unavailable";
                            let newPriceSOLDAvg = "unavailable";
                            let newSoldQty = "unavailable";
                            let newListedQty = "unavailable";

                            let newPriceLISTEDMin = "unavailable";
                            let newPriceSOLDMin = "unavailable";
                            for (let table of tables) {
                                const str = table.toString()
                                let unavailable = false
                                // console.log(table.toString());
                                // console.log('$$$$$$$$$$$$$$$$$');
                                if (str.includes("(Unavailable)")) {
                                    unavailable = true
                                }
                                if (placer == 0 && !unavailable) {
                                    //New (Sold)
                                    let pt1 = str.substring(str.indexOf(">Avg Price:</TD><TD><B>US&nbsp;") + 31, str.length)
                                    newPriceSOLDAvg = pt1.split("</B>")[0]

                                    let pt1min = str.substring(str.indexOf(">Min Price:</TD><TD><B>US&nbsp;") + 31, str.length)
                                    newPriceSOLDMin = pt1min.split("</B>")[0]

                                    const qtyMatch = str.match(/<TD>Total Qty:<\/TD><TD><B>(\d+)<\/B><\/TD>/);
                                    // Check if a match is found and extract the number
                                    newSoldQty = qtyMatch ? parseInt(qtyMatch[1]) : null;
                                }
                                if (placer == 2 && !unavailable) {
                                    //New (FOR SALE)
                                    let pt1 = str.substring(str.indexOf(">Avg Price:</TD><TD><B>US&nbsp;") + 31, str.length)
                                    newPriceLISTEDAvg = pt1.split("</B>")[0]

                                    let pt1min = str.substring(str.indexOf(">Min Price:</TD><TD><B>US&nbsp;") + 31, str.length)
                                    newPriceLISTEDMin = pt1min.split("</B>")[0]

                                    const qtyMatch = str.match(/<TD>Total Qty:<\/TD><TD><B>(\d+)<\/B><\/TD>/);

                                    // Check if a match is found and extract the number
                                    newListedQty = qtyMatch ? parseInt(qtyMatch[1]) : null;

                                }

                                placer++
                            }



                            if (newPriceLISTEDAvg.length > 12 || newPriceSOLDAvg.length > 12) {


                                console.log({
                                    soldQty: newSoldQty,
                                    soldPriceMin: newPriceSOLDMin,
                                    soldPriceAvg: newPriceSOLDAvg,
                                    listedQty: newListedQty,
                                    listedPriceMin: newPriceLISTEDMin,
                                    listedPriceAvg: newPriceLISTEDAvg
                                });
                                console.log('P3: FAILED');


                                if (newPriceSOLDMin.includes('Add to My Inventory') || newPriceSOLDAvg.includes('Add to My Inventory')) {
                                    resolve({
                                        soldQty: newSoldQty,
                                        soldPriceMin: "unavailable",
                                        soldPriceAvg: "unavailable",
                                        listedQty: newListedQty,
                                        listedPriceMin: newPriceLISTEDMin,
                                        listedPriceAvg: newPriceLISTEDAvg
                                    })
                                }
                                resolve(null)
                            } else {
                                // console.log("new: ", newPriceSOLDAvg);
                                // console.log("used: ", newPriceLISTEDAvg);
                                console.log('P3: Complete');
                                resolve({
                                    soldQty: newSoldQty,
                                    soldPriceMin: newPriceSOLDMin,
                                    soldPriceAvg: newPriceSOLDAvg,
                                    listedQty: newListedQty,
                                    listedPriceMin: newPriceLISTEDMin,
                                    listedPriceAvg: newPriceLISTEDAvg
                                })
                            }


                        });
                    } else if (resp.statusCode == 403) {
                        console.log("403");
                        // hasError = true
                        reject("Error: 403");

                    } else {

                        console.log(resp.statusCode + " is a weird code.");
                        reject(`Error: ${resp.statusCode}`);
                    }
                })
                .on("error", (err) => {
                    hasError = true

                    console.log(err);
                    reject("Error: " + err.message);
                })
                .end();
        } catch (err) {
            console.log("oops", err);
            reject("Somethings Wrong...");
        }
    });
}


exports.getBLPrices = getBLPrices