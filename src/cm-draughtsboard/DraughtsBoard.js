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

    isNonPlayingField(field) {
        let [r, c] = this.state.f2rc(field)
        return this.state.isNonPlayingField(r, c)
    }

    setPiece(field, piece, animated = false) {
        if (this.isNonPlayingField(field)) {
            return
        }
        let index = this.state.f2index(field)
        return super.setPiece(index, piece, animated)
    }

    getPiece(field) {
        if (this.isNonPlayingField(field)) {
            return
        }
        let index = this.state.f2index(field)
        return super.getPiece(index)
    }

    movePiece(fieldFrom, fieldTo, animated = false) {
        if (this.isNonPlayingField(fieldFrom) || this.isNonPlayingField(fieldTo)) {
            return
        }
        let indexFrom = this.state.f2index(fieldFrom)
        let indexTo = this.state.f2index(fieldTo)
        return super.movePiece(indexFrom, indexTo, animated)
    }
}
