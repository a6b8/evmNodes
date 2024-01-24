[![CircleCI](https://img.shields.io/circleci/build/github/a6b8/evmNodes/main)]() ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

# Evm Nodes

Evm Nodes is a CLI-enabled module for checking the activity of Evm Nodes. It provides insights into the status of these nodes, including network connectivity, response speed, and the possibility of querying historical data through Archive Nodes based on RPC URLs.

## Features:
- Checking the availability of the Node.
- Adding a human-readable Alias Name ID, e.g., `ETHEREUM_MAINNET`, if it's known.
- Verifying the `networkId` of the Node.
- Measuring the `timeInMs` taken for the connection and subsequently sorting the results from fastest to slowest.
- Estimating whether historical data (`isArchive`) can be queried through the Node.
- Querying the Client Version (`clientVersion`) of the URL.
- Outputting the results as a structured list divided into `inactive` and `active`.


## Quickstart

To use the module, both a Command Line Interface and the module itself is available.

### Command Line Interface

This example demonstrates how to install the CLI of the module.

**terminal**
```bash
git clone https://github.com/a6b8/evmNodes.git
cd evmNodes
npm i
npm link
```

```bash
evmnodes
```

### Code

This example shows how to query public Nodes with Node.js.

**index.mjs**
```javascript
import { EvmNodes } from './../src/EvmNodes.mjs'
const evnNodes = new EvmNodes()
const states = await evnNodes.getPublicNodes({})
```

**terminal**
```bash
node index.mjs
```

## Table of Contents
- [Evm Nodes](#evm-nodes)
  - [Features:](#features)
  - [Quickstart](#quickstart)
    - [Command Line Interface](#command-line-interface)
    - [Code](#code)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Methods](#methods)
    - [.getNodes()](#getnodes)
      - [Example](#example)
    - [.getPrivateNodes()](#getprivatenodes)
      - [Example](#example-1)
    - [.getPublicNodes()](#getpublicnodes)
      - [Example](#example-2)
  - [Command Line Interface](#command-line-interface-1)
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
2     -- Filter* Merge* --
                |
3 ---------- Analysis ----------             
  |  getStatus, connectionTime |
  |  isArchive, clientVersion  |
  ------------------------------
                |
4 ----------- Output -----------
  |    lvl1: sort by status    |
  |   lvl2: sort by key/alias  |
  |   lvl3: sort by rpc/webs.  |
  ------------------------------
```

## Methods
There are three public methods defined: `getPrivateNodes`, `getPublicNode`, and `getNodes`. The latter executes both previous methods one after the other and outputs the result together. All three methods return the same structure as the result. They can evaluate 'private' and 'public' Nodes. 'Private' refers to a list of Nodes added by the user themselves, which may also have an API Key in the URL. 'Public' combines and evaluates public lists via an HTTPS request.

### .getNodes()

This method combines `.getPrivateNode()` and `.getPublicNode()` and returns a result.

Um eine weitere Spalte mit dem Namen "default" hinzuzufügen, kannst du die Markdown-Tabelle entsprechend bearbeiten. Hier ist die aktualisierte Tabelle:

| Key           | Type            | Default | Description                                         | Required |
| ------------- | --------------- | ------- | --------------------------------------------------- | -------- |
| privatePaths  | Array of Object |         | Each object contains the keys `path` and `parser`. `path` specifies the path, and `parser` offers two options: `env` or `script`. `env` searches for `key=url\n` lines, while `script` searches for URLs in double quotes within `"url"`. | `true`  |
| onlyActive    | Boolean         | `false` | Determines whether the inactive Nodes should also be listed in the 'inactive' section of the result. | `false` |
| aliasAsKey    | Boolean         | `true`  | By default, the `active` results are sorted by `networkId`, but this can be changed to `alias` with this method. If no alias is specified, `UNKNOWN_${{networkId}}` is used. | `false` |
| useRpcs       | Boolean         | `true`  | Whether to use RPCs for fetching nodes. | `false` |
| useWebsockets | Boolean         | `true`  | Whether to use Websockets for fetching nodes. | `false` |

Die Spalte "Default" wurde hinzugefügt, aber die Werte für die Default-Einstellungen fehlen. Du kannst die Werte in der Tabelle entsprechend ergänzen.

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

| Key           | Type            | Default | Description                                         | Required |
| ------------- | --------------- | ------- | --------------------------------------------------- | -------- |
| paths  | Array of Object |         | Each object contains the keys `path` and `parser`. `path` specifies the path, and `parser` offers two options: `env` or `script`. `env` searches for `key=url\n` lines, while `script` searches for URLs in double quotes within `"url"`. | `true`  |
| onlyActive    | Boolean         | `false` | Determines whether the inactive Nodes should also be listed in the 'inactive' section of the result. | `false` |
| aliasAsKey    | Boolean         | `true`  | By default, the `active` results are sorted by `networkId`, but this can be changed to `alias` with this method. If no alias is specified, `UNKNOWN_${{networkId}}` is used. | `false` |
| useRpcs       | Boolean         | `true`  | Whether to use RPCs for fetching nodes. | `false` |
| useWebsockets | Boolean         | `true`  | Whether to use Websockets for fetching nodes. | `false` |

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
    ],
    'onlyActive': true,
    'aliasAsKey': true
} )
```

**Returns**  
```js
Object{}
```

### .getPublicNodes()

This method searches for current public Nodes through publicly available [lists](https://github.com/a6b8/evmProviders/blob/a5533c544bc9668ac94e1305208931dd28b06dd5/src/data/config.mjs#L32).

| Key           | Type            | Default | Description                                         | Required |
| ------------- | --------------- | ------- | --------------------------------------------------- | -------- |
| onlyActive    | Boolean         | `false` | Determines whether the inactive Nodes should also be listed in the 'inactive' section of the result. | `false` |
| aliasAsKey    | Boolean         | `true`  | By default, the `active` results are sorted by `networkId`, but this can be changed to `alias` with this method. If no alias is specified, `UNKNOWN_${{networkId}}` is used. | `false` |
| useRpcs       | Boolean         | `true`  | Whether to use RPCs for fetching nodes. | `false` |
| useWebsockets | Boolean         | `true`  | Whether to use Websockets for fetching nodes. | `false` |


**Method**  
```js
.getPublicNodes( { onlyActive=false, aliasAsKey=false } )
```

#### Example
```js
import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getPublicNodes( {
    'onlyActive': true,
    'aliasAsKey': true
} )
```

**Returns**    
```js
Object{}
```

## Command Line Interface

```
____ _  _ _  _    _  _ ____ ___  ____ ____ 
|___ |  | |\/|    |\ | |  | |  \ |___ [__  
|___  \/  |  |    | \| |__| |__/ |___ ___] 
                                           
Choose list type
? Route (Use arrow keys)
❯ Public 
  Private 
  Both 
```

To ensure easier usage, a CLI version is available, covering **all** public methods of the module. Additionally, a path must be specified where the results will be output later. Currently, there is no NPM module available, so the repository must be downloaded first. Afterward, it can be made globally available using `npm link`. To undo this, you can use `npm unlink -g evmnodes`.

To install:

**terminal**
```bash
git clone https://github.com/a6b8/evmNodes.git
cd evmNodes
npm i
npm link
```

```bash
evmnodes
```

To uninstall:
```
npm unlink -g evmnodes
```


## Alias Names

Aliases are also used in the queries if available. The list can be found here: `./src/data/alias.mjs`. This list includes more than 500 entries, each consisting of the `networkId`, `alias`, and a detailed name (`name`).

The following rules were observed during creation:
- The `alias` name serves as a unique ID, ensuring no duplications.
- The name consists of two parts: 1. The network name, e.g., `ETHEREUM`, and the network type, e.g., `MAINNET`.
- The main network is described as `MAINNET`. If not specified otherwise, the test network is labeled with the type `TESTNET`.
- The name and type are separated by an underscore `_`. No other characters such as uppercase letters or numbers are allowed in names or types.

> If a network is missing, you are welcome to contribute the missing information via a pull request.

Example:
```javascript
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


## Output
The structure is the same for all three methods. The results are divided into `active` and `inactive`. Whether `inactive` results are included can be optionally configured. In `active`, the individual networks are divided by `networkId`. This can optionally be changed to use the `alias` name with the `aliasAsKey` option.

Default output (sort by `networkId`):
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