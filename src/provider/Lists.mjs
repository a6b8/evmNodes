
import axios from 'axios'
import fs from 'fs'


export class Lists {
    #config
    #state


    constructor( { lists }) {
        this.#config = { lists }

        return true
    }


    async init() {
        return true
    }


    async getPrivateNodes( { privatePaths } ) {
        const [ rpcs, websockets ] = privatePaths
            .reduce( ( acc, item, index ) => {
                try {
                    const { path, type } = item
                    const data = fs.readFileSync( path, 'utf-8' )

                    let result
                    switch( type ) {
                        case 'env':
                            result = this.#findUrlsInEnv( { data } )
                            break
                        case 'script':
                            result = this.#findUrlsInScript( { data } )
                            break
                    }

                    const [ r, w ] = result 
                    acc[ 0 ] = [ ...acc[ 0 ], ...r ]
                    acc[ 1 ] = [ ...acc[ 1 ], ...w ]
                } catch( e ) {
                    console.log( `Path ${index} is not available.` )
                } 

                return acc
            }, [ [], [] ] )

        return [ rpcs, websockets ]
    }


    async getPublicNodes() {
        const [ a, b ] = await this.#getChainList()
        const [ c, d ] = await this.#getChainId()

        const datas = [ 
            [ [ ...a, ...c ], 'rpcs' ], 
            [ [ ...b, ...d ], 'websockets' ]  
        ]
            .reduce( ( acc, a ) => {
                const [ list, key ] = a
                acc[ key ] = list
                    .filter( ( v, i, a ) => a.indexOf( v ) === i )

                return acc
            }, {} )

        return datas
    }


    async #getChainList() {
        const { url } = this.#config['lists']['chainList']

        const response = await axios.get( url )
        const { data } = response
        const [ rpcs, websockets ] = this.#findUrlsInScript( { data } )

        return [ rpcs, websockets ]
    }


    async #getChainId() {
        let result = [ [], [] ]
        try {
            const { url } = this.#config['lists']['chainId']
            const response = await axios.get( url )
            let { data } = response
            result = data
                .reduce( ( acc, item, index, all ) => {
                    if( Object.hasOwn( item, 'rpc' ) ) {
                        if( Array.isArray( item['rpc'] ) ) {
                            item['rpc']
                                .filter( a => typeof a === 'string' )
                                .forEach( url => {
                                    if( url.startsWith( 'https://' ) ) {
                                        acc['rpcs'].push( url)
                                    } else if( url.startsWith( 'wss://' ) ) {
                                        acc['websockets'].push( url)
                                    }
                                } )
                        }
                    }

                    if( all.length-1 === index ) {
                        acc['rpcs'] = acc['rpcs']
                            .filter( ( v, i, a ) => a.indexOf( v ) === i )
                            .filter( a => a.indexOf( '${') === -1 )
                        
                        acc['websockets'] = acc['websockets']
                            .filter( ( v, i, a ) => a.indexOf( v ) === i )
                            .filter( a => a.indexOf( '${') === -1 )

                        acc = [ acc['rpcs'], acc['websockets'] ]
                    }
    
                    return acc
                }, 
                { 'rpcs': [], 'websockets': [] } 
            )
        } catch( e ) {
            console.log( e )
            console.log( 'Chain ID list is not available.' )
        }

        return result
    }


    #findUrlsInEnv( { data } ) {
        const [ rpcs, websockets ] = data
            .split( "\n" )
            .reduce( ( acc, line ) => {
                if( line.indexOf( '=' ) !== -1 ) {
                    const str = line.substring(
                        line.indexOf( '=' ) + 1,
                        line.length
                    )

                    if( str.startsWith( 'https://' ) ) {
                        acc[ 0 ].push( str )
                    } else if( str.startsWith( 'wss://' ) ) {
                        acc[ 1 ].push( str )
                    }
                }

                return acc
            }, [ [], [] ] )

        return [ rpcs, websockets ]
    }


    #findUrlsInScript( { data } ) {
        const [ rpcs, websockets ] = data
            .split( '' )
            .reduce( ( acc, a, index ) => {    
                a === '"' ? acc.push( index ) : ''
                return acc
            }, [] )
            .reduce( ( acc, a, index, all ) => {
                if( all.length-1 !== index ) {
                    const str = data.substring(
                        a + 1,
                        all[ index + 1 ]
                    )

                    if( str.startsWith( 'https://' ) ) {
                        acc[ 0 ].push( str )
                    } else if( str.startsWith( 'wss://' ) ) {
                        acc[ 1 ].push( str )
                    }
                }

                return acc
            }, [ [], [] ] )

        return [ rpcs, websockets ]
    }
}