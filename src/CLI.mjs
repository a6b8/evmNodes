import inquirer from 'inquirer'
import figlet from 'figlet'
import { EvmNodes } from './EvmNodes.mjs'
import chalk from 'chalk'


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

        let paths = []
        if( type === 'Private' || type === 'Both' ) {
            paths = await this.#addPrivatePaths( { paths } )
            paths = await this.#morePrivatePaths( { paths } )
            console.log( '' )
        }

        const { onlyActive, aliasAsKey } = await this.#addOptions() 
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

        switch( type ) {
            case 'Private':
                await this.#evmNodes.getPrivateNodes( {
                    paths,
                    onlyActive,
                    aliasAsKey
                } )
                break
            case 'Public':
                await this.#evmNodes.getPublicNodes( {
                    onlyActive,
                    aliasAsKey
                } )   
                break
            case 'Both':
                await this.#evmNodes.getNodes( {
                    'privatePaths': paths,
                    onlyActive,
                    aliasAsKey
                } )
                break
            default:
                console.log( 'Not found.' )
                break
        }

        return true
    }

    #addHeadline() {
        console.log( figlet.textSync( 'EVM Nodes', { 'horizontalLayout': 'full' } ) )
    }


    async #addConfirmation( { struct } ) {
        console.log()
        console.log( chalk.green( 'Is this data correct?' ) )
        console.log()
        console.log( `${chalk.green( 'List:' )} ${chalk.white( struct['type'] )}` )
        console.log( `${chalk.green( 'Options:' )} ${JSON.stringify( struct['params'], null, 4 )}` )

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
        console.log( '' )
        const msg = 'Add a private path:'
        const msgColor = chalk.green( msg )
        console.log( msgColor )

        const response = await inquirer.prompt( [
            {
                'type': 'input',
                'name': 'path',
                'message': 'Enter the path to the file:',
                'default': './.example-env'
            },
            {
                'type': 'list',
                'name': 'parser',
                'message': 'Choose a parser:',
                'choices': [ 'env', 'script' ],
            }
        ] )

        const { path, parser } = response
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
        const msg = 'Route'
        const msgColor = chalk.green( msg )
        console.log( msgColor )

        const response = await inquirer.prompt( [
            {
                'type': 'list',
                'name': 'type',
                'message': 'Choose list type',
                'choices': [ 'Public', 'Private', 'Both' ],
            }
        ] )

        return response
    }



}