import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getPublicNodes( {} )