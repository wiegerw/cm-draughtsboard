/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {Board} from "./Board.js"
import {DraughtsBoardState} from "./DraughtsBoardState.js";

export class DraughtsBoard extends Board {

    constructor(context, props) {
        if (props.state === undefined) {
            props.state = new DraughtsBoardState(props.position)
        }
        super(context, props)
    }
}
