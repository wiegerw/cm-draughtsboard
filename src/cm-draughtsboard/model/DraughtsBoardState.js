/**
 * Authors and copyright: Stefan Haack (https://shaack.com)
 *                        Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */
import {Position} from "./Position.js"

export const DRAUGHTSPIECE = {
    wp: "wp", wq: "wq", wk: "wk",
    bp: "bp", bq: "bq", bk: "bk"
}

export const DRAUGHTS_START_POSITION = "xxxxxxxxxxxxxxxxxxxx..........ooooooooooooooooooooW"
export const DRAUGHTS_EMPTY_POSITION = "..................................................W"
export const DRAUGHTS = {
    start: DRAUGHTS_START_POSITION,
    empty: DRAUGHTS_EMPTY_POSITION
}

function half(n)
{
  return ~~(n / 2)
}

export const PIECE_TYPE = {
  whitePiece: "o",
  blackPiece: "x",
  whiteKing: "O",
  blackKing: "X",
  empty: "."
}

function pieceToChar(piece)
{
  switch (piece)
  {
    case 'bp': return 'x'
    case 'bq': return 'X'
    case 'wp': return 'o'
    case 'wq': return 'O'
    default: return '.'
  }
}

function pieceToPieceType(piece)
{
  switch (piece)
  {
    case 'bp': return PIECE_TYPE.blackPiece
    case 'bq': return PIECE_TYPE.blackKing
    case 'wp': return PIECE_TYPE.whitePiece
    case 'wq': return PIECE_TYPE.whiteKing
    default: return PIECE_TYPE.empty
  }
}

export function pieceTypeToPiece(piece)
{
  switch (piece)
  {
    case PIECE_TYPE.blackPiece: return 'bp'
    case PIECE_TYPE.blackKing: return 'bq'
    case PIECE_TYPE.whitePiece: return 'wp'
    case PIECE_TYPE.whiteKing: return 'wq'
    default: return undefined
  }
}

export class DraughtsBoardState extends Position {

    constructor(text = DRAUGHTS.empty,
                rows = 10,
                columns = 10,
                type_number = 20,
                notation_type = 'N',
                notation_start = 2,
                invert_flag = 0,
                flipped = false
    ) {
        super(rows, columns)

        // PDN gametype attributes
        this.type_number = type_number
        this.notation_type = notation_type
        this.notation_start = notation_start
        this.invert_flag = invert_flag
        this.flipped = flipped
        this.setFen(text)
    }

    setFen(text)
    {
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

    createPosition(text = DRAUGHTS.empty) {
        let squares = new Array(this.rows * this.columns).fill(undefined)
        for (let i = 0; i < text.length; i++) {
            let piece = undefined
            switch(text[i]) {
                case 'x': piece = 'bp'; break;
                case 'X': piece = 'bq'; break;
                case 'o': piece = 'wp'; break;
                case 'O': piece = 'wq'; break;
            }
            squares[this.index2pos(i)] = piece
        }
        return new Position(this.rows, this.columns, squares)
    }

    isNonPlayingField(r, c)
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

    isPlayerField(r, c)
    {
        if (this.isNonPlayingField(r, c))
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

    isOpponentField(field)
    {
        [r, c] = this.f2rc(field)
        if (this.isNonPlayingField(r, c))
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

    getMaxField()
    {
        return half(this.rows * this.columns)
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

    f2r(f)
    {
        f = f - 1

        if ((f < 0) || (f > (this.getMaxField() - 1)))
        {
          return -1;
        }
        else
        {
          return ~~((f * 2) / this.columns)
        }
    }

    f2rc(f)
    {
        f = f - 1

        if ((f < 0) || (f > (this.getMaxField() - 1)))
        {
          return -1
        }

        let d = half(this.columns)

        let r = ~~((f * 2) / this.columns)
        let c = 1 - (~~(f / d) % 2) + (2 * (f % d))
        return [r, c]
    }

    f2index(f)
    {
        const [row, column] = this.f2rc(f)
        return (this.rows - row - 1) * this.columns + column
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
