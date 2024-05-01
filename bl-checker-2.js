const axios = require('axios');
const { generateHeader } = require('./utils');

async function getBLPN(url) {

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url,
        headers: {
            "User-Agent": generateHeader(),
            // 'Cookie': 'BLNEWSESSIONID=V10B05E30951325C91B3A6BEFB83BB455404BDBE6A2F8A799994F38786FB752CF662A9082E69AE0C9403C47DA255E1765EA; cartBuyerID=-1872613020; AWSALB=oLg9ZoW7mrM5v9MU3fVCdBvesyYEuQ6+SVt6+orDVhVJrcdQed8MtOUnr5aBSIYSZ/YXIYpPUjmGaALsfSsWEZfkiGpvFW+6AOWtSgBWf1kj20bQ+PXgkaB/AQZM; AWSALBCORS=oLg9ZoW7mrM5v9MU3fVCdBvesyYEuQ6+SVt6+orDVhVJrcdQed8MtOUnr5aBSIYSZ/YXIYpPUjmGaALsfSsWEZfkiGpvFW+6AOWtSgBWf1kj20bQ+PXgkaB/AQZM'
        }
    };

    return axios.request(config)
        .then((response) => {
            // console.log(response.data.item.strItemNo);
            console.log('P2: Complete');
            return response.data.item.strItemNo
        })
        .catch((error) => {
            console.log(error);
            return null
        });
}

exports.getBLPN = getBLPN
