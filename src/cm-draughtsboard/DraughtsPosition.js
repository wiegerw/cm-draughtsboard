/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {Position} from "./Position.js"

export const DRAUGHTS_START_POSITION = "xxxxxxxxxxxxxxxxxxxx..........ooooooooooooooooooooW"
export const DRAUGHTS_EMPTY_POSITION = "..................................................W"
export const DRAUGHTS = {
    start: DRAUGHTS_START_POSITION,
    empty: DRAUGHTS_EMPTY_POSITION
}

export class DraughtsPosition extends Position {

    constructor(text = undefined, animated = false, rows = 10, columns = 10) {
        super()
        this.rows = rows
        this.columns = columns
        this.squares = new Array(rows * columns).fill(undefined)
        this.setFen(text)
    }

    // Converts an index in a position string like 'xxxxx...ooo' to an index in the squares array
    index2pos(i) {
        const d = this.columns / 2;
        const row = Math.floor((2 * i) / this.columns);
        const column = 2 * (i % d) + (i % this.columns < d ? 1 : 0);
        return (this.rows - row - 1) * this.columns + column
    }

    setFen(text)
    {
        if (text) {
            for (let i = 0; i < text.length; i++) {
                let piece = undefined
                switch(text[i]) {
                    case 'x': piece = 'bp'; break;
                    case 'X': piece = 'bq'; break;
                    case 'o': piece = 'wp'; break;
                    case 'O': piece = 'wq'; break;
                }
                this.squares[this.index2pos(i)] = piece
            }
        }
    }

    getFen() {
        let N = (this.rows * this.columns) / 2
        let pieces = new Array(N)
        for (let i = 0; i < N; i++) {
            const pos = this.index2pos(i);
            let piece = '.';
            switch(this.squares[pos]) {
                case 'bp': piece = 'x'; break;
                case 'bq': piece = 'X'; break;
                case 'wp': piece = 'o'; break;
                case 'wq': piece = 'O'; break;
            }
            pieces[i] = piece
        }
        return pieces.join("")
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
        const cloned = new DraughtsPosition()
        cloned.rows = this.rows
        cloned.columns = this.columns
        cloned.squares = this.squares.slice(0)
        return cloned
    }

    createEmptyPosition() {
        return DraughtsPosition(DRAUGHTS.empty)
    }
}
