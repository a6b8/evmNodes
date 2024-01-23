import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getPrivateNodes( {
    'paths': [ 
        { 'path': './tests/.example-env', 'parser': 'env' }
    ]
} )

console.log( 'states', JSON.stringify( states, null, 4 ) )