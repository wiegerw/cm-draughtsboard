/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {Board} from "./Board.js"
import {DraughtsBoardState} from "./DraughtsBoardState.js"

export class DraughtsBoard extends Board {

    constructor(context, props) {
        if (props.state === undefined) {
            props.state = new DraughtsBoardState(props.position)
        }
        super(context, props)
    }

    getPieceIndex(index) {
        return this.state.getPiece(index)
    }

    getPiece(field) {
        let index = this.state.f2index(field)
        return super.getPieceIndex(index)
    }

    setPiece(field, piece, animated = false) {
        let index = this.state.f2index(field)
        return super.setPieceIndex(index, piece, animated)
    }

    movePiece(fieldFrom, fieldTo, animated = false) {
        let indexFrom = this.state.f2index(fieldFrom)
        let indexTo = this.state.f2index(fieldTo)
        return super.movePieceIndex(indexFrom, indexTo, animated)
    }
}
