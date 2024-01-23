[![CircleCI](https://img.shields.io/circleci/build/github/a6b8/evmNodes/main)]()

# Evm Nodes

This module helps in checking the activity of lists of Evm Nodes. It simultaneously queries the `networkId`, measures the response speed of the server, and estimates whether the Nodes are Archive Nodes based on RPC URLs.

## Features:
- Checking if the Node is available.
- Adding a human-readable Alias Name ID, for example, `ETHEREUM_MAINNET`, if known.
- Verifying which `networkId` the Node has.
- Measuring the time taken for the connection and later sorting the results from fastest to slowest.
- Estimating whether historical data (Archive Node) can be queried through the Node.
- Output as a structured list divided into inactive and active.


## Quickstart
This example shows how to query public Nodes.

```js
import { EvmNodes } from './../src/EvmNodes.mjs'
const evnNodes = new EvmNodes()
const states = await evnNodes.getPublicNodes({})
```

## Table of Contents
- [Evm Nodes](#evm-nodes)
  - [Features:](#features)
  - [Quickstart](#quickstart)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Methods](#methods)
    - [.getNodes()](#getnodes)
      - [Example](#example)
    - [.getPrivateNodes()](#getprivatenodes)
      - [Example](#example-1)
    - [.getPublicNodes()](#getpublicnodes)
      - [Example](#example-2)
  - [Alias Names](#alias-names)
- [Output](#output)
  - [License](#license)


## Overview

This module
1. Partially retrieves URLs synchronously.
2. Merges different lists if necessary.
3. Analyzes the URLs for availability and other important features.
4. Generates structured output.


```
1 Private Lists*    Public Lists*
     |                    |
2     ------- Merge* ------
                |
3 ---------- Analysis ----------             
  |  getStatus, connectionTime |
  |  isArchive, clientVersion  |
  ------------------------------
                |
4 ----------- Output -----------
  |    lvl1: sort by status    |
  |   lvl2: sort by key/alias  |
  ------------------------------
```

## Methods
There are three public methods defined: `getPrivateNodes`, `getPublicNode`, and `getNodes`. The latter executes both previous methods one after the other and outputs the result together. All three methods return the same structure as the result. They can evaluate 'private' and 'public' Nodes. 'Private' refers to a list of Nodes added by the user themselves, which may also have an API Key in the URL. 'Public' combines and evaluates public lists via an HTTPS request.

### .getNodes()

This method combines `.getPrivateNode()` and `.getPublicNode()` and returns a result.

| Key           | Type   | Description                                         | Required |
| ------------- | ------ | --------------------------------------------------- | -------- |
| privatePaths     | Array of Object | Each object contains the keys `path` and `parser`. `path` specifies the path, and `parser` offers two options: `env` or `script`. `env` searches for `key=url\n` lines, while `script` searches for URLs in double quotes within `"url"`. | `true`     |
| onlyActive | Boolean | Determines whether the inactive Nodes should also be listed in the 'inactive' section of the result. | `false` |
| aliasAsKey | Boolean | By default, the `active` results are sorted by `networkId`, but this can be changed to `alias` with this method. If no alias is specified, `UNKNOWN_${{networkId}}` is used. | `false` |

**Method**  
```js
async getNodes( { privatePaths=[], onlyActive=false, aliasAsKey=false } )
```

#### Example  
```js
import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getNodes( {
    'privatePaths': [ 
        { 'path': './tests/.example-env', 'parser': 'env' }
    ],
    'onlyActive': true,
    'aliasAsKey': true
} )
```

**Returns**  
```js
Object{}
```

### .getPrivateNodes()

This method creates a list from various files and then determines the status of each URL.

| Key           | Type   | Description                                         | Required |
| ------------- | ------ | --------------------------------------------------- | -------- |
| paths     | Array of Object | Each object contains the keys `path` and `parser`. `path` specifies the path, and `parser` offers two options: `env` or `script`. `env` searches for `key=url\n` lines, while `script` searches for URLs in double quotes within `"url"`. | `true`     |
| onlyActive | Boolean | Determines whether the inactive Nodes should also be listed in the 'inactive' section of the result. | `false` |
| aliasAsKey | Boolean | By default, the `active` results are sorted by `networkId`, but this can be changed to `alias` with this method. If no alias is specified, `UNKNOWN_${{networkId}}` is used. | `false` |

**Method**  
```js
.getPrivateNodes( { paths=[], onlyActive=false, aliasAsKey=false } )
```

#### Example 
```js
import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getPrivateNodes( {
    'paths': [ 
        { 'path': './tests/.example-env', 'parser': 'env' }
    ]
} )
```

**Returns**  
```js
Object{}
```

### .getPublicNodes()

This method searches for current public Nodes through publicly available [lists](https://github.com/a6b8/evmProviders/blob/a5533c544bc9668ac94e1305208931dd28b06dd5/src/data/config.mjs#L32).

| Key           | Type   | Description                                         | Required |
| ------------- | ------ | --------------------------------------------------- | -------- |
| onlyActive | Boolean | Determines whether the inactive Nodes should also be listed in the 'inactive' section of the result. | `false` |
| aliasAsKey | Boolean | By default, the `active` results are sorted by `networkId`, but this can be changed to `alias` with this method. If no alias is specified, `UNKNOWN_${{networkId}}` is used. | `false` |


**Method**  
```js
.getPublicNodes( { onlyActive=false, aliasAsKey=false } )
```

#### Example
```js
import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getPublicNodes( {} )
```

**Returns**    
```js
Object{}
```

## Alias Names

Aliases are also used in the queries if available. The list can be found here: `./src/data/alias.mjs`. 

If a network is missing, you are welcome to contribute the missing information via a pull request.

Example:
```js
const alias = {
    "1": {
        "alias": "ETHEREUM_MAINNET",
        "name": "Ethereum Mainnet (eth)",
        "description": "ETH"
    },
    "2": {
        "alias": "EXPANSE_MAINNET",
        "name": "Expanse Network (exp)",
        "description": "EXP"
    },
    ...
}
```


# Output
The structure is the same for all three methods. The results are divided into `active` and `inactive`. Whether `inactive` results are included can be optionally configured. In `active`, the individual networks are divided by `networkId`. This can optionally be changed to use the `alias` name with the `aliasAsKey` option.

Output
```js
{
    'active: {
        '{{networkId}}: [
            {
                'alias': '',
                'lightNodes: [ 
                    {
                        'url': string,
                        'timeInMs': number,
                        'clientVersion': string,
                        'source': string
                    },
                    ... 
                ],
                'archiveNodes': [ 
                    {
                        'url': string,
                        'timeInMs': number,
                        'clientVersion': string,
                        'source': string
                    },
                    ... 
                 ]
                'websockets': [ 
                    {
                        'url': string,
                        'timeInMs': number,
                        'clientVersion': string,
                        'source': string
                    },
                    ...
                 ]
            }
        ]
    },
    'inactive: [
        { 
            'url': string,
            'source': string
        },
        ...
    ]
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.