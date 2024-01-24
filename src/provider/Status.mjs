import axios from 'axios'
import WebSocket  from 'ws'
import readline from 'readline'


export class Status {
    #config
    #progress
    #state
    #readline


    constructor( { status }) {
        this.#config = { status }
        this.#progress = {
            'total': 0,
            'done': 0,
            'startDate': new Date(),
            'rpcs': new Set(),
            'websockets': new Set(),
            'isArchive': new Set(),
            'nonce': 0
        }
    }


    async start( { rpcs, websockets, onlyActive, source } ) {
        this.#progress['total'] = rpcs.length + websockets.length
        this.#state = { onlyActive }

        const chunks = this.#groupingUrls( { rpcs, websockets } )
        const states = {
            'rpcs': [],
            'websockets': []
        }

        const rpcPromise = this.#getRpcStates( {
            'chunks': chunks['rpcs'],
            source
        } )
          
          const websocketPromise = this.#getWebsocketStates( {
            'chunks': chunks['websockets'],
            source
        } )

        const [ rpcData, websocketData ] = await Promise.all( [
            rpcPromise, websocketPromise
        ] )

        states['rpcs'] = rpcData
        states['websockets'] = websocketData    
        this.#readline.close()
        
        return states
    }


    async #getWebsocketStates( { chunks, source } ) {
        let results = []
        for( const chunk of chunks ) {
            const result = await Promise.all( 
                chunk.map( async url => {
                    this.#progress['done']++
                    const struct = {}

                    let resp
                    try {
                        resp = await this.#getWebSocketStatus( { url } )
                        struct['networkId'] = resp['networkId']
                        struct['status'] = resp['status']
                        struct['timeInMs'] = resp['timeInMs']
                    } catch( e ) {
                        struct['status'] =false
                        struct['timeInMs'] = null
                    }
                    
                    struct['url'] = url
                    struct['isArchive'] = false
                    struct['source'] = source

                    if( struct['status'] === true ) {
                        struct['status'] ? this.#progress['websockets'].add( url ) : null
                        this.#printStatus( { 'status': struct['status'] } )
                    }

                    return struct
                } ) 
            )
            results = results.concat( result )
        }

        if( this.#state['onlyActive'] ) {
            results = results.filter( a => a['status'] === true )
        }

        return results
    }


    async #getRpcStates( { chunks, source } ) {
        let results = []
        for( const chunk of chunks ) {
            const result = await Promise.all( 
                chunk.map( async url => {
                    this.#progress['done']++
                    const { status, networkId, timeInMs } = await this.#getRpcStatus( { url } )

                    const struct = {
                        url,
                        status,
                        networkId,
                        'isArchive': false,
                        timeInMs,
                        source,
                        'clientVersion': null
                    }

                    if( struct['status'] === true ) {
                        const resp = await this.#getRpcIsArchiveNode( { url } )
                        resp['isArchive'] !== undefined ? struct['isArchive'] = resp['isArchive'] : ''
                        struct['isArchive'] ? this.#progress['isArchive'].add( url ) : null

                        const resp2 = await this.#getRpcClientVersion( { url } )
                        resp2['clientVersion'] !== undefined ? struct['clientVersion'] = resp2['clientVersion'] : ''
                    }

                    status ? this.#progress['rpcs'].add( url ) : null
                    this.#printStatus( { 'status': status } )
 
                    return struct
                } ) 
            )
            results = results.concat( result )
        }

        if( this.#state['onlyActive'] ) {
            results = results.filter( a => a['status'] === true )
        }

        return results
    }

    
    #groupingUrls( { rpcs, websockets } ) {
        const result = [ 
            [ rpcs, 'rpcs' ] , 
            [ websockets, 'websockets' ]
        ]
            .reduce( ( acc, a ) => {
                const [ values, key ] = a
                const { chunkSize } = this.#config['status'][ key ]
                acc[ key ] = values
                    .map( ( a, i ) => i % chunkSize === 0 ? values.slice( i, i + chunkSize ) : null )
                    .filter( a => a )
                return acc
            }, {} )

        return result
    }


    async #rpcRequest( { url, data } ) {
        const result = {
            'data': null,
            'timeInMs': null,
            'status': false
        }

        const startTime = new Date()
        let endTime

        try {
            const { timeoutInMs } = this.#config['status']
            const response = await axios.request( {
                'method': 'post',
                'maxBodyLength': Infinity,
                url,
                'headers': { 'Content-Type': 'application/json' },
                'data': JSON.stringify( data ),
                'timeout': timeoutInMs
            } )
    
            result['data'] = response['data']
            endTime = new Date()
            result['timeInMs'] = endTime - startTime
            result['status'] = true
        } catch( e ) {}

        return result
    }


    async #getRpcStatus( { url } ) {   
        let result = {
            url,
            'status': false,
            'networkId': null,
            'timeInMs': null
        }

        try {     
            const data = this.#config['status']['requests']['chainId'] 
            const response = await this.#rpcRequest( { url, data } )
            result['timeInMs'] = response['timeInMs']

            if( response['status'] === true ) {
                result['networkId'] = parseInt( response['data']['result'], 16 )
                result['status'] = !isNaN( result['networkId'] ) ? true : false
                result['timeInMs'] = response['timeInMs']
            }
        } catch( e ) {
            // console.log( e )
        }
        return result
    }


    async #getRpcClientVersion( { url } ) {
        let result = {
            url,
            'status': false,
            'clientVersion': null,
        }

        try {
            const data = this.#config['status']['requests']['clientVersion']
            const response = await this.#rpcRequest( { url, data } )
            result['clientVersion'] = response['data']['result']
        } catch( e ) {}

        return result
    }


    async #getRpcIsArchiveNode( { url } ) {
        let result = {
            url,
            'status': false,
            'isArchive': null,
            'timeInMs': null
        }

        try {
            const data = this.#config['status']['requests']['getLogs']
            const response = await this.#rpcRequest( { url, data } )

            result['timeInMs'] = response['timeInMs']
            if( response['status'] !== true ) {
            } else if( Object.hasOwn( response['data'], 'result' ) ) {
                if( Array.isArray( response['data']['result'] ) ) {
                    // console.log( response['data']['result'].length )
                    if( response['data']['result'].length === 0 ) {
                        // result['message'] = 'No results found'
                    } else {
                        result['status'] = true
                        result['isArchive'] = true
                        // result['message'] = `Success! (${response['data']['result'].length} Logs found)`
                    }
                } else {
                    // result['message'] = 'Result is not Array'
                }
            } else if( Object.hasOwn( response['data'], 'error' ) ) {
                if( Object.hasOwn( response['data']['error'], 'message' ) ) {
                    // result['message'] = `${response['data']['error']['message']}`
                } else {
                    // result['message'] = `Request`
                }
            } else {
                // result['message'] = `Unknown error`
            }
        } catch( e ) {
        }
    
        return result
    }


    #getWebSocketStatus( { url } ) {
        return new Promise( async(resolve, reject) => {
            let result = {
                url,
                'status': false,
                'networkId': null,
                'timeInMs': null
            }

            const startTime = new Date()
            let endTime
            let ws
            try {
                ws = new WebSocket( url )

                setTimeout( () => {
                    ws.close()
                    // console.log( 'WebSocket connection closed after 5 seconds.' )
                }, 10000 )


                ws.on( 'open', () => {
                    // console.log( 'WebSocket connection is open.' )
                    ws.send( JSON.stringify( { 'jsonrpc':  '2.0', 'id': 0, 'method': 'eth_chainId' } ) )
                } )
        
                ws.on('message', ( message ) => {
                    // console.log( 'Send WebSocket message:' )
                    const json = JSON.parse( message.toString() )
                    const networkId = parseInt( json['result'], 16 )
                    result['networkId'] = networkId
                    result['status'] = !isNaN( result['networkId'] ) ? true : false
                    // console.log( 'Received message:', message.toString() )
                    // console.log( `Network ID: ${networkId}` )
                    ws.close()
                } )
        
                ws.on('close', ( code, reason ) => {
                    // console.log( `WebSocket connection closed with code ${code}: ${reason}` )
                    // console.log( result )
                    endTime = new Date()
                    result['timeInMs'] = endTime - startTime
                    resolve( result )
                } )
        
                ws.on('error', ( error ) => {
                    // console.error( 'WebSocket error:', error )
                    endTime = new Date()
                    result['timeInMs'] = endTime - startTime
                    result['status'] = false
                    reject( result )
                } )

            } catch( e ) {
                reject( result )
                endTime = new Date()
                result['timeInMs'] = endTime - startTime
            }
        } )
    }


    #printStatus( { status } ) {
        if( this.#progress['nonce'] === 0 ) {
            this.#readline = readline.createInterface( {
                'input': process.stdin,
                'output': process.stdout,
            } )
        }

        if( status ) {
            this.#progress['nonce']++
            if( this.#progress['nonce'] % 2 === 0 || this.#progress['nonce'] === 1 ) {
                process.stdout.clearLine( 0 )
                process.stdout.cursorTo( 0 )
                this.#readline.write( null, { ctrl: true, name: 'u' } )

                const strs = [
                    [ this.#progress['rpcs'].size, 'LightNodes' ],
                    [ this.#progress['isArchive'].size, 'ArchiveNodes' ],
                    [ this.#progress['websockets'].size, 'Websockets' ]
                ]
                    .reduce( ( acc, a, index ) => {
                        const [ size, name ] = a
                        const _size = new Array( 4 - size.toString().length )
                            .fill( ' ' )
                            .join( '' )
                        const _websockets = new Array( 14 - name.length )
                            .fill( ' ' )
                            .join( '' )
                        
                        const str = `${_size} ${size} ${name}${_websockets}`
                        acc += str
                        return acc
                    }, '' )


                const s = [
                    this.#progress['done'],
                    this.#progress['total']
                ]
                    .join( '/' )


                const currentTime = new Date()
                const timeDiff = currentTime - this.#progress['startDate']
                const minutes = Math.floor( timeDiff / 60000 )
                const seconds = Math.floor( ( timeDiff % 60000) / 1000 )
                const _time = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;


                let rpc = ''
                rpc += `${this.#progress['rpcs'].size + this.#progress['isArchive'].size} `
                rpc += `(${this.#progress['rpcs'].size}|${this.#progress['isArchive'].size}) `
                rpc += `Rpcs`

                let websockets = ''
                websockets += `${this.#progress['websockets'].size} `
                websockets += `Websockets`


                const _percent = Math.floor( ( this.#progress['done'] * 100 ) / this.#progress['total'] )

                this.#readline.write( `${_percent}% (${s}) | ${_time} | ${rpc} | ${websockets}`  )
            }
        }

        return true
    }
}