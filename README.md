[![CircleCI](https://img.shields.io/circleci/build/github/a6b8/evmProviders/main)]()

# Evm Providers

Dieses Modul hilft um Listen von Evm Nodes auf aktivität zu überprüfen. Erfragt gleichzeitig die `networkId`, misst die Geschwindigkeit in der der Server anwortet und schätzt bei RPC Urls ob die Nodes eine ArchivNode ist.

Funktionsumfang:
- Überprüfen ob die Node  verfügbar ist
- Fügt, wenn Bekannt, einem human readable Alias Name ID, zum Beispiel `ETHEREUM_MAINNET` ein.
- Überprüft welche `networkId` die Node hat.
- Misst die Zeit wielange die Verbindung gebraucht hat und ordnet die Resultate später von schnell zu langsam.
- Ein Schätzung ob sich über die Node auch historischen Daten (Archive Node) abfragen lassen. 
- Ausgabe als Strukturierte Liste unterteilt in inactive und aktive


## Quickstart
Dieses Beispiel zeigt wie sich öffentliche Nodes abfragen lassen.

```js
import { EvmNodes } from './../src/EvmNodes.mjs'
const evnNodes = new EvmNodes()
const states = await evnNodes.getPublicNodes({})
```

## Table of Contents

- [Evm Providers](#evm-providers)
  - [Quickstart](#quickstart)
  - [Table of Contents](#table-of-contents)
  - [Methods](#methods)
    - [.getNodes()](#getnodes)
    - [.getPrivateNodes()](#getprivatenodes)
    - [.getPublicNodes()](#getpublicnodes)
  - [Alias Names](#alias-names)
- [Output](#output)
  - [License](#license)

## Methods
Es sind 3 öffentliche Methode definiert. `getPrivateNodes`, `getPublicNode` und `getNodes` was beide vorherigen Methoden nacheinander ausführt und das Ergebnis gemeinsam ausgibt. Alle 3 Methoden geben die gleiche Struktur als resultat zurück. Es können 'private' und 'public' Nodes ausgewertet werden. Private meint das eine Liste von Nodes vom nutzer selbst hinzugefügt wird, die zum Beispiel auch über einen API Key in der URL verfügen. Bei public werden über einen https request öffentliche Listen zusammengeführt und ausgewertet. 

### .getNodes()

Diese Methode verbindet `.getPrivateNode()` und `.getPublicNode()` miteinander und gibt ein Resultat zurück.

| Key           | Type   | Description                                         | Required |
| ------------- | ------ | --------------------------------------------------- | -------- |
| privatePaths     | Array of Object | Hier wird jeweils ein Object mit den key `path` und `parser` übergeben. `path` gibt den pfad an, bei `parser` stehen 2 mœglichkeiten zur Verfügung `env` oder `script`. `env` sucht nach `key=url\n` zeilen. `script` sucht nach urls in `"url"` anführungszeichen.                     | true     |
| onlyActive | Boolean | Bestimmt ob als Resultat auch die nicht inaktiven Nodes in der Rubrik `inactive` aufgeführt werden soll | false |
| aliasAsKey | Boolean | Per default werden die `active` Ergenisse nach `networkId` sortiert, das kann mit dieser Methode auf `alias` umgestellt werden. Falls kein alias hinterlegt wird `UNKNOWN_${{networkId}}` verwendet. | false |

**methode**  
`async getNodes( { privatePaths=[], onlyActive=false, aliasAsKey=false } )`  

**beispiel**  
```js
import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getNodes( {
    'privatePaths': [ 
        { 'path': './tests/.example-env', 'type': 'env' }
    ],
    'onlyActive': true
    'aliasAsKey': true
} )
```

**returns**  
`Object{}`


### .getPrivateNodes()

Diese Methode erstellt eine Liste auf verschiedenen Dateien um dann den Status der jeweiligen Url zu ermitteln.


| Key           | Type   | Description                                         | Required |
| ------------- | ------ | --------------------------------------------------- | -------- |
| paths     | Array of Object | Hier wird jeweils ein Object mit den key `path` und `parser` übergeben. `path` gibt den pfad an, bei `parser` stehen 2 möglichkeiten zur Verfügung `env` oder `script`. `env` sucht nach `key=url\n` zeilen. `script` sucht nach urls in `"url"` anführungszeichen.                     | true     |
| onlyActive | Boolean | Bestimmt ob als Resultat auch die nicht inaktiven Nodes in der Rubrik `inactive` aufgeführt werden soll | false |
| aliasAsKey | Boolean | Per default werden die `active` Ergenisse nach `networkId` sortiert, das kann mit dieser Methode auf `alias` umgestellt werden. Falls kein alias hinterlegt wird `UNKNOWN_${{networkId}}` verwendet. | false |

**methoden**  
`.getPrivateNodes( { paths=[], onlyActive=false } )`  

**beispiel**  
```js
import { EvmNodes } from './../src/EvmNodes.mjs'

const evnNodes = new EvmNodes()
const states = await evnNodes.getPrivateNodes( {
    'paths': [ 
        { 'path': './tests/.example-env', 'type': 'env' }
    ]
} )
```


returns  
`Object{}`

### .getPublicNodes()

Diese Methode sucht über nach aktuellen öffentlichen Nodes über öffentlich verfügbaren [Listen](https://github.com/a6b8/evmProviders/blob/a5533c544bc9668ac94e1305208931dd28b06dd5/src/data/config.mjs#L32).

| Key           | Type   | Description                                         | Required |
| ------------- | ------ | --------------------------------------------------- | -------- |
| onlyActive | Boolean | Bestimmt ob als Resultat auch die nicht inaktiven Nodes in der Rubrik `inactive` aufgeführt werden soll | false |
| aliasAsKey | Boolean | Per default werden die `active` Ergenisse nach `networkId` sortiert, das kann mit dieser Methode auf `alias` umgestellt werden. Falls kein alias hinterlegt wird `UNKNOWN_${{networkId}}` verwendet. | false |


**method**  
`.getPublicNodes( { onlyActive=false, aliasAsKey=false } )`


**returns**    
`Object{}`


## Alias Names

Es wird bei den Abfragen auch ein Alias wenn vorhanden eingesetzt. Die Liste ist hier zu finden: `./src/data/alias.mjs`. Falls eine Netzwerk kann gerne über eine pull request die fehlenden Informatioen eingesetzt werden.

Bespiel:
```js
const alias = {
    "1": {
        "alias": "ETHEREUM_MAINNET",
        "name": "Ethereum Mainnet (eth)",
        "description": "ETH"
    },
    "2": {
        "alias": "EXPANSE_MAINNET",
        "name": "Expanse Network (exp)",
        "description": "EXP"
    },
    ...
}
```


# Output
Die Struktur ist bei allen 3 Methoden gleich. Die Resultate werden in `active` und `inactive` unterteilt. Ob `inactive` Resultate mit ausgegeben werden kann optional ausgestellt werden. In `active` werden die einzelnen Netzwerke per `networkId` unterteilt. Dies kann optionnal auch auf den  `alias` namen geändert werden. Mit der option `aliasAsKey`.


Output
```js
{
    'active: {
        '{{networkId}}: [
            {
                'alias': '',
                'lightNodes: [ 
                    {
                        'url': string,
                        'timeInMs': number,
                        'source': string
                    },
                    ... 
                ],
                'archiveNodes': [ 
                    {
                        'url': string,
                        'timeInMs': number,
                        'source': string
                    },
                    ... 
                 ]
                'websockets': [ 
                    {
                        'url': string,
                        'timeInMs': number,
                        'source': string
                    },
                    ...
                 ]
            }
        ]
    },
    'inactive: [
        { 
            'url': string,
            'source': string
        }
    ]
}
```



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
