/**
 * Represents an RPC (Remote Procedure Call) node.
 *
 * @typedef {Object} rpcStruct
 * @property {string} url - The URL of the RPC node.
 * @property {number} timeInMs - The connection time to the RPC node in milliseconds.
 * @property {string} source - The source of the RPC node (public/private).
 */

/**
 * Represents a WebSocket node.
 *
 * @typedef {Object} websocketStruct
 * @property {string} url - The WebSocket URL.
 * @property {number} timeInMs - The connection time to the WebSocket node in milliseconds.
 * @property {string} source - The source of the WebSocket node (public/private).
 */

/**
 * Represents an active network with nodes.
 *
 * @typedef {Object} ActiveNetwork
 * @property {string} alias - The alias for the network.
 * @property {rpcStruct[]} lightNodes - An array of RPC nodes for light nodes.
 * @property {rpcStruct[]} archiveNodes - An array of RPC nodes for archive nodes.
 * @property {websocketStruct[]} websockets - An array of WebSocket nodes.
 */

/**
 * Represents an inactive node.
 *
 * @typedef {Object} inactiveStruct
 * @property {string} url - The WebSocket URL.
 * @property {string} source - The source of the WebSocket node (public/private).
 */

/**
 * Represents the structure of the return value of the `getNodes` method.
 *
 * @typedef {Object} GetNodesResponse
 * @property {ActiveNetwork} active - An object representing active network nodes.
 * @property {inactiveStruct[]} inactive - An array of inactive nodes.
 */


import { config } from './data/config.mjs'
import { alias } from './data/alias.mjs'

import { printMessages } from './helpers/mixed.mjs'

import { Lists } from './provider/Lists.mjs'
import { Status } from './provider/Status.mjs'

import ora from 'ora'
import fs from 'fs'
import crypto from 'crypto'



export class EvmNodes {
    #config
    #lists
    #status


    constructor() {
        this.#config = config
        this.#init()

        return true
    }


    #init() {
        this.#lists = new Lists( {
            'lists': this.#config['lists']
        })
        this.#status = new Status({ 
            'status': this.#config['status'],
            'alias': this.#config['alias']
        } )

        return true
    }


/**
 * Fetches and returns a list of nodes, combining private and public nodes.
 *
 * @async
 * @param {Object} options - Options for fetching nodes.
 * @param {Array<{ path: string, parser: 'env' | 'script' }>} options.paths - An array of objects representing paths and their types.
 *   Each object should have a 'path' property (a string representing the file path) and a 'parser' property (either 'env' or 'script').
 * @param {boolean} options.onlyActive - Whether to filter nodes by status.
 * @param {boolean} options.aliasAsKey - Switch key from networkId to aliasName if available.
 * @returns {Promise<GetNodesResponse>} - A promise that resolves to an object containing active and inactive nodes.
 * @throws {Error} If there is an issue fetching the nodes.
 */

    async getNodes( { privatePaths=[], onlyActive=false, aliasAsKey=false } ) {
        const [ messages, comments ] = this.#validateGetPrivateNodes( { privatePaths, onlyActive, aliasAsKey } )
        printMessages( { messages, comments } )

        const [ rpcs, websockets ] = await this.#lists.getPrivateNodes( { privatePaths } )
        let _private = await this.#status.start( { rpcs, websockets, onlyActive, 'source':'private' } )

        const list = await this.#lists.getPublicNodes()

        let _public = await this.#status.start( { 
            'rpcs': list['rpcs'], 
            'websockets': list['websockets'], 
            onlyActive, 
            'source':'public' 
        } )

        let states = {
            'rpcs': _private['rpcs'].concat( _public['rpcs'] ),
            'websockets': _private['websockets'].concat( _public['websockets'] )
        }

        states = this.#sortByNetworkId( { states, aliasAsKey } )

        return states
    }


/**
 * Fetches and returns a list of private nodes.
 *
 * @async
 * @param {Object} options - Options for fetching nodes.
 * @param {Array<{ path: string, parser: 'env' | 'script' }>} options.paths - An array of objects representing paths and their types.
 *   Each object should have a 'path' property (a string representing the file path) and a 'parser' property (either 'env' or 'script').
 * @param {boolean} options.onlyActive - Whether to filter nodes by status.
 * @param {boolean} options.aliasAsKey - Switch key from networkId to aliasName if available.
 * @returns {Promise<GetNodesResponse>} - A promise that resolves to an object containing active and inactive nodes.
 * @throws {Error} If there is an issue fetching the nodes.
 */

    async getPrivateNodes( { paths=[], onlyActive=false, aliasAsKey=false } ) {
        const privatePaths = paths
        const [ messages, comments ] = this.#validateGetPrivateNodes( { privatePaths, onlyActive, aliasAsKey } )
        printMessages( { messages, comments } )

        const [ rpcs, websockets ] = await this.#lists.getPrivateNodes( { privatePaths } )
        let states = await this.#status.start( { rpcs, websockets, onlyActive, 'source':'private' } )
        states = this.#sortByNetworkId( { states, aliasAsKey } )

        return states
    }


/**
 * Fetches and returns a list of public nodes.
 *
 * @async
 * @param {Object} options - Options for fetching nodes.
 * @param {boolean} options.onlyActive - Whether to filter nodes by status.
 * @param {boolean} options.aliasAsKey - Switch key from networkId to aliasName if available.
 * @returns {Promise<GetNodesResponse>} - A promise that resolves to an object containing active and inactive nodes.
 * @throws {Error} If there is an issue fetching the nodes.
 */

    async getPublicNodes( { onlyActive=false, aliasAsKey=false } ) {
        const[ messages, comments ] = this.#validateGetPublicNodes( { onlyActive, aliasAsKey } )
        printMessages( { messages, comments } )

        const { rpcs, websockets } = await this.#lists.getPublicNodes()
        let states = await this.#status.start( { rpcs, websockets, onlyActive, 'source':'public' } )
        states = this.#sortByNetworkId( { states, aliasAsKey } )
        return states
    }


    #sortByNetworkId( { states, aliasAsKey } ) {
        let result = [ 
            'rpcs', 
            'websockets' 
        ]
            .reduce( ( acc, key, index ) => {
                if( index === 0 ) {
                    acc['active'] = {}
                    acc['inactive'] = []
                }

                states[ key ]
                    .forEach( ( item, index ) => {
                        const { networkId } = item

                        if( item['status'] === false ) {
                            acc['inactive'].push( item )
                            return true
                        }

                        let id = `${networkId}`
                        if( !Object.hasOwn( acc['active'], networkId ) ) {
                            acc['active'][ id ] = {
                                'alias': '', 
                                'lightNodes': [],
                                'archiveNodes': [],
                                'websockets': []
                            }
        
                            if( Object.hasOwn( alias, id ) ) {
                                acc['active'][ networkId ]['alias'] = alias[ id ]['alias']
                            } else {
                                acc['active'][ networkId ]['alias'] = ''
                                acc['active'][ networkId ]['alias'] += this.#config['alias']['unknown'] 
                                acc['active'][ networkId ]['alias'] += this.#config['alias']['splitter'] 
                                acc['active'][ networkId ]['alias'] += networkId 
                            }
                        }

                        const struct = {
                            'url': item['url'],
                            'timeInMs': item['timeInMs'],
                            'source': item['source'],
                        }

                        if( Object.hasOwn( item, 'clientVersion' ) ) {
                            struct['clientVersion'] = item['clientVersion']
                        }

                        switch( key ) {
                            case 'rpcs':
                                if( item['isArchive'] ) {
                                    acc['active'][ id ]['archiveNodes'].push( struct )
                                } else {
                                    acc['active'][ id ]['lightNodes'].push( struct )
                                }
                                break
                            case 'websockets':
                                acc['active'][ id ]['websockets'].push( struct )
                                break
                        }

                        return true
                    } )
                return acc
            }, {} )

        result['active'] = Object.keys( result['active'] )
            .map( a => parseInt( a ) )
            .sort( ( a, b ) => a - b )
            .reduce( ( acc, a, index ) => {
                const id = `${a}`
                acc[ id ] = result['active'][ id ]

                const tmp = [ 'lightNodes', 'archiveNodes', 'websockets' ]
                    .forEach( key => {
                        acc[ id ][ key ] = acc[ id ][ key ]
                            .sort( ( a, b ) => a['timeInMs'] - b['timeInMs'] )
                    } )

                return acc
            }, {} )

        result['inactive'] = result['inactive']
            .map( a => {
                delete a['timeInMs']
                delete a['status']
                delete a['isArchive']
                delete a['networkId']
                return a
            } )
            .sort( ( a, b ) => {
                const _a = `${a.url}`
                const _b = `${b.url}`

                return _b.localeCompare( _a, 'en', { sensitivity: 'base' } )
            } )

        return result
    }


    #validateGetPrivateNodes( { privatePaths, onlyActive, aliasAsKey } ) {
        const messages = []
        const comments = []

        if( privatePaths === undefined ) {
            messages.push( `Key 'privatePaths' is undefined.` )
        } else if( !Array.isArray( privatePaths ) ) {
            messages.push( `Key 'privatePaths' is not an array.` )
        } else if( privatePaths.length === 0 ) {
            messages.push( `Key 'privatePaths' is empty.` ) 
        }

        if( messages.length > 0 ) {
            return [ messages, comments ]
        }

        privatePaths
            .forEach( ( item, index ) => {
                if( item === undefined ) {
                    messages.push( `[${index}] Item is type of 'undefined'.` )
                } else if( item.constructor !== Object ) {
                    messages.push( `[${index}] Item with the value '${item}' is not type of 'object'.` )
                }
            } )

        if( messages.length !== 0 ) {
            return [ messages, comments ]
        }

        privatePaths
            .forEach( ( item, index ) => {
                if( !Object.hasOwn( item, 'path' ) ) {
                    messages.push( `[${index}] Item has no key 'path'.` )
                } else if( !fs.existsSync( item['path'] ) ) {
                    messages.push( `[${index}] Item with the value '${item['path']}' does not exist.` )
                }
                
                if( !Object.hasOwn( item, 'parser' ) ) {
                    messages.push( `[${index}] Item has no key 'parser'.` )
                    return true
                } else if( !this.#config['lists']['parserTypes'].includes( item['parser'] ) ) {
                    messages.push( `[${index}] Item has an unknown type '${item['parser']}'. Choose from ${this.#config['lists']['types'].map( a => `'${a}'`).join( ', ' )} instead.` )
                }
            } )

        if( onlyActive === undefined ) {
            messages.push( `Key 'onlyActive' is undefined.` )
        } else if( typeof onlyActive !== 'boolean' ) {
            messages.push( `Key 'onlyActive' is not type of 'boolean'.` )
        }

        if( aliasAsKey === undefined ) {
            messages.push( `Key 'aliasAsKey' is undefined.` )
        }   else if( typeof aliasAsKey !== 'boolean' ) {
            messages.push( `Key 'aliasAsKey' is not type of 'boolean'.` )
        }

        return [ messages, comments ]
    }


    #validateGetPublicNodes( { onlyActive, aliasAsKey } ) {
        const messages = []
        const comments = []

        if( onlyActive === undefined ) {
            messages.push( `Key 'onlyActive' is undefined.` )
        } else if( typeof onlyActive !== 'boolean' ) {
            messages.push( `Key 'onlyActive' is not type of 'boolean'.` )
        }

        if( aliasAsKey === undefined ) {
            messages.push( `Key 'aliasAsKey' is undefined.` )
        }   else if( typeof aliasAsKey !== 'boolean' ) {
            messages.push( `Key 'aliasAsKey' is not type of 'boolean'.` )
        }

        return [ messages, comments ]
    }


    health() {
        return true
    }
}