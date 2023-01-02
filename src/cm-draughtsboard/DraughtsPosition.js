/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Position} from "./Position.js"

export class DraughtsPosition extends Position {

    constructor(fen = undefined, animated = false, rows = 10, columns = 10) {
        super();
        this.rows = rows
        this.columns = columns
        this.squares = new Array(rows * columns).fill(undefined)
        this.setFen(fen);
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
}
