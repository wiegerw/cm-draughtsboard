/**
 * Authors and copyright: Stefan Haack (https://shaack.com)
 *                        Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */
import {BoardState} from "./BoardState.js";
import {DraughtsPosition} from "./DraughtsPosition.js"

export const DRAUGHTSPIECE = {
    wp: "wp", wq: "wq", wk: "wk",
    bp: "bp", bq: "bq", bk: "bk"
}

export class DraughtsBoardState extends BoardState {

    constructor() {
        super(new DraughtsPosition())

        // PDN gametype attributes for international draughts
        // TODO: set these attributes via the constructor
        this.type_number = 20
        this.rows = 10
        this.columns = 10
        this.notation_type = 'N'
        this.notation_start = 2
        this.invert_flag = 0
        this.flipped = false
    }

    setPosition(text, animated = false) {
        this.position = new DraughtsPosition(text, animated)
    }

    // TODO: reuse code from DraughtsPosition
    getPosition() {
        let N = (this.rows * this.columns) / 2
        let pieces = new Array(N)
        for (let i = 0; i < N; i++) {
            const pos = this.index2pos(i);
            let piece = '.';
            switch(this.position.squares[pos]) {
                case 'bp': piece = 'x'; break;
                case 'bq': piece = 'X'; break;
                case 'wp': piece = 'o'; break;
                case 'wq': piece = 'O'; break;
            }
            pieces[i] = piece
        }
        return pieces.join("")
    }

    is_non_playing_field(r, c)
    {
        if (this.type_number === 30) // Turkish draughts
        {
            return false;
        }
        else
        {
            if (this.flipped)
            {
                return (this.invert_flag === 0) === (r % 2 === (this.columns - c) % 2);
            }
            else
            {
                return (this.invert_flag === 0) === ((this.rows - r) % 2 === c % 2);
            }
        }
    }

    is_player_field(r, c)
    {
        if (this.is_non_playing_field(r, c))
        {
            return false;
        }
        let minrow = this.rows - ~~(this.rows / 2) + 1;
        let maxrow = this.rows;
        if (this.type_number === 31) // Thai
        {
            minrow++;
        }
        else if (this.type_number === 30) // Turkish
        {
            minrow = this.rows - 3;
            maxrow = this.rows - 2;
        }
        return minrow <= r && r <= maxrow;
    }

    is_opponent_field(r, c)
    {
        if (this.is_non_playing_field(r, c))
        {
            return false;
        }
        let minrow = 0;
        let maxrow = ~~(this.rows / 2) - 2;
        if (this.type_number === 31) // Thai
        {
            maxrow--;
        }
        else if (this.type_number === 30) // Turkish
        {
            minrow = 1;
            maxrow = 2;
        }
        return minrow <= r && r <= maxrow;
    }

    // Converts an index in a position string like 'xxxxx...ooo' to an index in the squares array
    index2pos(i) {
        const d = this.columns / 2;
        const row = Math.floor((2 * i) / this.columns);
        const column = 2 * (i % d) + (i % this.columns < d ? 1 : 0);
        return (this.rows - row - 1) * this.columns + column
    }

    rc2f(r, c)
    {
        if ((r < 0) || (c < 0) || (r >= this.rows) || (c >= this.columns))
        {
            return -1; // out of board
        }
        return 1 + (r * ~~(this.columns / 2)) + ~~(c / 2);
    }

    // 0 = Bottom left
    // 1 = Bottom right
    // 2 = Top left
    // 3 = Top right
    notation(r, c)
    {
        if (this.flipped)
        {
            r = this.rows - r - 1;
            c = this.columns - c - 1;
        }

        const left = this.notation_start === 0 || this.notation_start === 2;
        const bottom = this.notation_start === 0 || this.notation_start === 1;

        r = bottom ? this.rows - r - 1 : r;
        c = left ? c : this.columns - c - 1;

        if (this.notation_type === 'N')
        {
            const f = this.rc2f(r, c);
            return "" + f;
        }
        else
        {
            return 'abcdefghijklmnop'[c] + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16][r];
        }
    }

    // square is in alphanumeric format, e.g. 'b3'
    // squareToIndex(square) {
    //     const column = square.substr(0, 1).charCodeAt(0) - 97
    //     const row = square.substr(1, 1) - 1
    //     return this.columns * row + column
    // }
}