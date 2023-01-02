/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {Board} from "./Board.js"
import {DraughtsPosition, DRAUGHTS} from "./DraughtsPosition.js";

export class DraughtsBoard extends Board {

    constructor(context, props) {
        if (props.position === undefined) {
            props.position = new DraughtsPosition(DRAUGHTS.empty)
        }
        else
        {
            props.position = new DraughtsPosition(props.position)
        }
        super(context, props)
    }
}
