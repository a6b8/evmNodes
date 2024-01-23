import { EvmNodes } from '../src/EvmNodes.mjs'

const evmNodes = new EvmNodes()
if( evmNodes.health() ) {
    process.exit( 0 )
} else {
    process.exit( 1 )
}