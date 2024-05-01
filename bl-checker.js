var HTMLParser = require("node-html-parser");
const https = require("https");
const fs = require("fs");
const { generateHeader } = require("./utils");





async function getBLURL(code) {

    //https://www.bricklink.com/v2/catalog/catalogitem.page?ccName=${'code'}#T=P

    return new Promise((resolve, reject) => {
        try {
            const options = {
                host: `www.bricklink.com`,
                path: `/v2/catalog/catalogitem.page?ccName=${code}#T=P`,

                headers: {
                    "User-Agent": generateHeader(),
                },
            };

            https
                .get(options, (resp) => {
                    if (resp.statusCode == 302) {
                        const formattedJson = JSON.stringify(resp.data, null, 2); // Formatting with an indentation of 2 spaces


                        // Accessing the "Location" header
                        const locationHeader = resp.headers['location'];

                        if (locationHeader) { console.log('P1: Complete'); }

                        resolve(convertUrl(locationHeader))

                    } else if (resp.statusCode == 403) {
                        console.log("403");
                        // hasError = true
                        resolve(false)

                    } else {

                        console.log(resp.statusCode + " is a weird code.");
                        resolve(false)
                    }
                })
                .on("error", (err) => {
                    hasError = true
                    resolve(false)
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


function convertUrl(inputUrl) {
    // Split the URL by "?" to separate the base URL and the query string
    const [baseUrl, queryString] = inputUrl.split('?');
    if (!queryString) {
        return null; // No query string found
    }

    // Split the query string by "&" to get individual key-value pairs
    const queryParams = queryString.split('&');

    // Extract "id" and "idColor" parameters from the query string
    let id, idColor;
    for (const param of queryParams) {
        const [key, value] = param.split('=');
        if (key === 'id') {
            id = value;
        } else if (key === 'idColor') {
            idColor = value;
        }
    }

    // Construct the output URL
    const outputUrl = `https://www.bricklink.com/ajax/renovate/catalog/getItemImageList.ajax?idItem=${id}&idColor=${idColor}`;
    return outputUrl;
}



exports.getBLURL = getBLURL