import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getNodes( {
    'privatePaths': [ 
        { 'path': './tests/.example-env', 'type': 'env' }
    ]
} )