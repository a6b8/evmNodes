import inquirer from 'inquirer'
import figlet from 'figlet'
import { EvmNodes } from './EvmNodes.mjs'
import chalk from 'chalk'
import fs from 'fs'


export class CLI {
    #state
    #cmd
    #evmNodes


    constructor() {
        this.#state = {}
        this.#cmd = {}
        this.#evmNodes = new EvmNodes()

        return true
    }


    async start() {
        this.#addHeadline()
        await this.#startRoute()
        return true
    }


    async #startRoute() {
        const { type } = await this.#addChooseRoute()
        console.log( '' )

        let paths = []
        if( type === 'Private' || type === 'Both' ) {
            paths = await this.#addPrivatePaths( { paths } )
            paths = await this.#morePrivatePaths( { paths } )
            console.log( '' )
        }

        const msg = 'Choose options'
        const msgColor = chalk.green( msg )
        console.log( msgColor )
        const { onlyActive, aliasAsKey } = await this.#addOptions() 
        const { filePath } = await this.#addFilePath()
        const struct = {
            type,
            'params': {
                paths,
                onlyActive,
                aliasAsKey
            }
        }

        type === 'Public' ? delete struct['params']['paths'] : null

        const { confirmed } = await this.#addConfirmation( { struct } )
        if( !confirmed ) {
            return true
        } else {
            console.log( '' )
        }

        let result
        switch( type ) {
            case 'Private':
                result = await this.#evmNodes.getPrivateNodes( {
                    paths,
                    onlyActive,
                    aliasAsKey
                } )
                break
            case 'Public':
                result = await this.#evmNodes.getPublicNodes( {
                    onlyActive,
                    aliasAsKey
                } )   
                break
            case 'Both':
                result = await this.#evmNodes.getNodes( {
                    'privatePaths': paths,
                    onlyActive,
                    aliasAsKey
                } )
                break
            default:
                console.log( 'Not found.' )
                break
        }

        if( !fs.existsSync( filePath ) ) {
            fs.writeFileSync( filePath, JSON.stringify( result, null, 4 ), 'utf-8' )
        } else {
            console.log( 'Error: File already exists.' )
        }

        return true
    }

    #addHeadline() {
        console.log( figlet.textSync( 'EVM Nodes', { 'horizontalLayout': 'full' } ) )
    }


    async #addFilePath() {
        const response = await inquirer.prompt([
            {
                'type': 'input',
                'name': 'filePath',
                'message': 'Enter the path to the file:',
                'default': `node_${Math.floor(Date.now() / 1000)}.json`,
                'validate': ( input ) => {
                    if( fs.existsSync( input ) ) {
                        return 'File already exists. Please choose a different name.'
                    }
                    return true
                }
            }
        ] )

        return response
    }


    async #addConfirmation( { struct } ) {
        console.log()
        console.log( chalk.green( 'Is this data correct?' ) )
        console.log( `${chalk.yellow( 'List:' )} ${chalk.white( struct['type'] )}` )
        console.log( `${chalk.yellow( 'Options:' )} ${JSON.stringify( struct['params'], null, 4 )}` )

        const response = await inquirer.prompt( [
            {
                'type': 'confirm',
                'name': 'confirmed',
                'message': 'Is the data correct?',
                'default': true
            }
        ] )

        return response
    }


    async #morePrivatePaths( { paths } ) {
        const answer = await inquirer.prompt( [
            {
                type: 'list',
                name: 'addMore',
                message: 'Do you want to add another struct?',
                choices: [ 'Yes', 'No' ],
                default: 'No'
            }
        ] )
      
        if( answer.addMore === 'Yes' ) {
            paths = await this.#addPrivatePaths( { paths })
            paths = await this.#morePrivatePaths( { paths } )
        }

        return paths
    }


    async #addPrivatePaths( { paths } )  {
        const msg = 'Add a private path:'
        const msgColor = chalk.green( msg )
        console.log( msgColor )

        const response = await inquirer.prompt( [
            {
                'type': 'input',
                'name': 'path',
                'message': 'Enter the path to the file:',
                'default': './.example-env',
                'validate': function ( input ) {
                    if( !fs.existsSync( input ) ) {
                        return 'File does not exists. Please choose a path to an existing file.'
                    } 
                    return true
                }
            }  
        ] )

        const response2 = await inquirer.prompt( [
            {
                'type': 'list',
                'name': 'parser',
                'message': 'Choose a parser:',
                'choices': [ 'env', 'script' ],
            }
        ] )

        const { path } = response
        const { parser } = response2
        paths.push(  { path, parser } )

        return paths
    }

    async #addOptions() {
        // write a function to add options
        // 1. question: onlyActive boolean
        // 2. question: aliasAsKey boolean

        const response = await inquirer.prompt( [
            {
                'type': 'confirm',
                'name': 'onlyActive',
                'message': 'Should the result only contain active nodes?',
                'default': false
            },
            {
                'type': 'confirm',
                'name': 'aliasAsKey',
                'message': 'Should the key to a network named by networkId or alias?',
                'default': false
            }
        ] )

        return response
    }


    async #addChooseRoute() {
        const msg = 'Choose list type'
        const msgColor = chalk.green( msg )
        console.log( msgColor )

        const response = await inquirer.prompt( [
            {
                'type': 'list',
                'name': 'type',
                'message': 'Route',
                'choices': [ 'Public', 'Private', 'Both' ],
            }
        ] )

        return response
    }



}