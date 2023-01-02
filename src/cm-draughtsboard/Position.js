/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

export function createTask() {
    let resolve, reject
    const promise = new Promise(function (_resolve, _reject) {
        resolve = _resolve
        reject = _reject
    })
    promise.resolve = resolve
    promise.reject = reject
    return promise
}

// TODO: it seems to me that this should become a base class of BoardState
//       N.B. However, there is a name clash (getPiece / setPiece etc.)
export class Position {

    constructor(text = undefined, animated = false) {
        this.squares = undefined
        this.animated = animated
    }

    setFen(fen ) {
        throw new Error('Not implemented yet')
    }

    getFen() {
        throw new Error('Not implemented yet')
    }

    createPosition(text = undefined) {
        throw new Error('Not implemented yet')
    }

    movePiece(indexFrom, indexTo) {
        if(!this.squares[indexFrom]) {
            console.warn("no piece on", indexFrom)
            return
        }
        this.squares[indexTo] = this.squares[indexFrom]
        this.squares[indexFrom] = undefined
    }

    setPiece(square, piece) {
        this.squares[square] = piece
    }

    getPiece(square) {
        return this.squares[square]
    }

    clone() {
        const cloned = new Position()
        cloned.squares = this.squares.slice(0)
        return cloned
    }
}
