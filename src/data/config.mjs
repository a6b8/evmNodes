export const config = {
    'status': {
        'timeoutInMs': 5000,
        'rpcs': {
            'chunkSize': 40,
            'thresholdInMs': 3000
        },
        'websockets': {
            'chunkSize': 20,
            'thresholdInMs': 3000
        },
        'requests': {
            'chainId': {
                'jsonrpc': '2.0',
                'method': 'eth_chainId',
                'params': [],
                'id': 1
            },
            'getLogs': {
                'jsonrpc': '2.0',
                'method': 'eth_getLogs',
                'params': [ 
                    { 
                        'fromBlock': '0x1', 
                        'toBlock': '0x5'
                    }
                ],
                'id': 1
            }
        },
    },
    'lists': {
        'types': [ 'env', 'script' ],
        'regex': {
            'rpcs': /https?:\/\/[^\s/$.?#].[^\s]*/g,
            'websockets': /wss:\/\/[^\s/$.?#].[^\s]*/g
        },
        'chainId': {
            'url': 'https://chainid.network/chains.json'
        },
        'chainList': {
            'url': 'https://raw.githubusercontent.com/DefiLlama/chainlist/main/constants/extraRpcs.js',
            'key': 'extraRpcs'
        }
    }

}