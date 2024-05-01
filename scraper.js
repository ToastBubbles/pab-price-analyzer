const axios = require('axios');

const url = 'https://www.lego.com/api/graphql/PickABrickQuery'
//POST
const referrer = `https://www.lego.com/en-us/pick-and-build/pick-a-brick?system=LEGO`

//path: data/elements/results
//path2: data/elements/total (total parts)

let data = JSON.stringify({
    "operationName": "PickABrickQuery",
    "variables": {
        "input": {
            "perPage": 400,
            "system": [
                "LEGO"
            ]
            // "page": 4
        }
    },
    "query": "query PickABrickQuery($input: ElementQueryArgs, $sku: String) {\n  __typename\n  elements(input: $input) {\n    count\n    facets {\n      ...FacetData\n      __typename\n    }\n    sortOptions {\n      ...Sort_SortOptions\n      __typename\n    }\n    results {\n      ...ElementLeafData\n      __typename\n    }\n    set {\n      id\n      type\n      name\n      imageUrl\n      instructionsUrl\n      pieces\n      inStock\n      price {\n        formattedAmount\n        __typename\n      }\n      __typename\n    }\n    total\n    __typename\n  }\n}\n\nfragment FacetData on Facet {\n  id\n  key\n  name\n  labels {\n    count\n    key\n    name\n    children {\n      count\n      key\n      name\n      ... on FacetValue {\n        value\n        __typename\n      }\n      __typename\n    }\n    ... on FacetValue {\n      value\n      __typename\n    }\n    ... on FacetRange {\n      from\n      to\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment Sort_SortOptions on SortOptions {\n  id\n  key\n  direction\n  label\n  analyticLabel\n  __typename\n}\n\nfragment ElementLeafData on Element {\n  id\n  name\n  categories {\n    name\n    key\n    __typename\n  }\n  inStock\n  ... on SingleVariantElement {\n    variant {\n      ...ElementLeafVariant\n      __typename\n    }\n    __typename\n  }\n  ... on MultiVariantElement {\n    variants {\n      ...ElementLeafVariant\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ElementLeafVariant on ElementVariant {\n  id\n  price {\n    centAmount\n    formattedAmount\n    __typename\n  }\n  attributes {\n    designNumber\n    colourId\n    deliveryChannel\n    maxOrderQuantity\n    system\n    quantityInSet(sku: $sku)\n    indexImageURL\n    __typename\n  }\n  __typename\n}"
});

let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: url,
    headers: {
        // 'Referer': referrer,
        'Content-Type': 'application/json'
    },
    data: data
};

axios.request(config)
    .then((response) => {

        // const results = JSON.stringify(response.data.data.elements.results, null, 2)
        const results = response.data.data.elements.results

        const total = response.data.data.elements.total
        console.log(results.length, total);
    })
    .catch((error) => {
        console.log(error);

    })