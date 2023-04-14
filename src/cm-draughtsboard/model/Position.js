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

const compareArrays = (a, b) =>
  a.length === b.length && a.every((element, index) => element === b[index]);

export class Position {

    constructor(rows, columns, squares=undefined) {
        this.rows = rows
        this.columns = columns
        if (squares)
        {
            this.squares = squares
        }
        else
        {
            this.squares = new Array(rows * columns).fill(undefined)
        }
    }

    movePiece(indexFrom, indexTo) {
        if(!this.squares[indexFrom]) {
            console.warn("no piece on", indexFrom)
            return
        }
        this.squares[indexTo] = this.squares[indexFrom]
        this.squares[indexFrom] = undefined
    }

    setPiece(index, piece) {
        this.squares[index] = piece
    }

    getPiece(index) {
        return this.squares[index]
    }

    clone() {
        const cloned = new Position(this.rows, this.columns)
        cloned.squares = this.squares.slice(0)
        return cloned
    }

    equals(pos) {
        return compareArrays(this.squares, pos.squares)
    }
}
