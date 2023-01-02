/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

// TODO: it seems to me that this should become a base class of BoardState
export class Position {

    // TODO: find out what animated is for (it seems to be unused in cm-chessboard)
    constructor(text = undefined, animated = false) {
        this.squares = undefined
        this.animated = animated
    }

    // TODO: rename this function to setPosition
    setFen(fen ) {
    }

    // TODO: rename this function to getPosition
    getFen() {
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
