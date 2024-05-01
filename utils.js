const headers = require("./headers");

function extractColorIdFromUrl(url) {
    // Split the URL by "?" to separate the base URL and the query string
    const queryStringStartIndex = url.indexOf('?');
    const queryString = queryStringStartIndex !== -1 ? url.substring(queryStringStartIndex + 1) : '';

    // Split the query string by "&" to get individual key-value pairs
    const queryParams = queryString.split('&');

    // Loop through the key-value pairs to find the one with "idColor" parameter
    for (const param of queryParams) {
        const [key, value] = param.split('=');
        if (key === 'idColor') {
            return value; // Return the value of "idColor" parameter
        }
    }

    // If "idColor" parameter is not found in the query string, check if it's in the path
    const pathParts = url.split('/');
    for (const part of pathParts) {
        const match = part.match(/^idColor=(\d+)/);
        if (match) {
            return match[1]; // Return the value of "idColor" parameter found in the path
        }
    }

    return null; // "idColor" parameter not found
}

function generateHeader() {
    return headers.heads[Math.round(Math.random() * (headers.heads.length - 1))];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


exports.extractColorIdFromUrl = extractColorIdFromUrl
exports.delay = delay
exports.generateHeader = generateHeader