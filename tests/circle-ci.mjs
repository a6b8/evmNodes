import { EvmNodes } from '../src/EvmNodes.mjs'

const evmNodes = new EvmNodes()
if( evmNodes.health() ) {
    console.log( 'Success!' )
    process.exit( 0 )
} else {
    console.log( 'Failure!' )
    process.exit( 1 )
}