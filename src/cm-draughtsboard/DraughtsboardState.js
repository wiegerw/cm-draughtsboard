/**
 * Author and copyright: Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

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

export class DraughtsboardState
{
  // PDN game type attributes
  #typeNumber
  #rows
  #columns
  #notationType
  #notationStart
  #invertFlag

  #flipped
  #whiteToMove
  
  constructor(typeNumber = 20, rows = 10, columns = 10, notationType = 'N', notationStart = 2, invertFlag = 0, flipped = false)
  {
    this.#typeNumber = typeNumber
    this.#rows = rows
    this.#columns = columns
    this.#notationType = notationType
    this.#notationStart = notationStart
    this.#invertFlag = invertFlag
    this.#flipped = flipped
    this.#whiteToMove = true
    this.squares = new Array(rows * columns).fill(undefined)
  }

  setPiece(index, piece)
  {
    console.log('setPiece ' + piece)
    this.squares[index] = pieceTypeToPiece(piece)
  }

  f2index(f)
  {
    const [row, column] = this.f2rc(f)
    return (this.getRows() - row - 1) * this.getColumns() + column
  }

  setPieceField(f, piece)
  {
    console.log('I ' + f + ' -> ' + this.f2index(f) + ' ' + piece)
    this.setPiece(this.f2index(f), piece)
  }

  getPieceFromField(f)
  {
    return pieceToPieceType(this.squares[this.index2pos(f - 1)])
  }

  getPieces()
  {
    let N = half(this.#rows * this.#columns)
    let pieces = new Array(N + 1)
    for (let i = 0; i < N; i++)
    {
      const pos = this.index2pos(i);
      pieces[i+1] = pieceToPieceType(this.squares[pos])
    }
    return pieces
  }

  isEmptyField(r, c)
  {
    if (this.#typeNumber === 30) // Turkish draughts
    {
      return false
    }
    else
    {
      if (this.#flipped)
      {
        return (this.#invertFlag === 0) === (r % 2 === (this.#columns - c) % 2)
      }
      else
      {
        return (this.#invertFlag === 0) === ((this.#rows - r) % 2 === c % 2)
      }
    }
  }

  isNonPlayingField(r, c)
  {
    if (this.#typeNumber === 30) // Turkish draughts
    {
      return false
    }
    else
    {
      if (this.#flipped)
      {
        return (this.#invertFlag === 0) === (r % 2 === (this.#columns - c) % 2)
      }
      else
      {
        return (this.#invertFlag === 0) === ((this.#rows - r) % 2 === c % 2)
      }
    }
  }

  isPlayerField(r, c)
  {
    if (this.isEmptyField(r, c))
    {
      return false;
    }
    let minrow = this.#rows - half(this.#rows) + 1
    let maxrow = this.#rows
    if (this.#typeNumber === 31) // Thai
    {
      minrow++
    }
    else if (this.#typeNumber === 30) // Turkish
    {
      minrow = this.#rows - 3
      maxrow = this.#rows - 2
    }
    return minrow <= r && r <= maxrow;
  }

  isOpponentField(r, c)
  {
    if (this.isEmptyField(r, c))
    {
      return false;
    }
    let minrow = 0
    let maxrow = half(this.#rows) - 2
    if (this.#typeNumber === 31) // Thai
    {
      maxrow--
    }
    else if (this.#typeNumber === 30) // Turkish
    {
      minrow = 1
      maxrow = 2
    }
    return minrow <= r && r <= maxrow
  }

  // Converts an index in a position string like 'xxxxx...ooo' to an index in the squares array
  index2pos(i)
  {
    const d = half(this.#columns)
    const row = ~~((2 * i) / this.#columns)
    const column = 2 * (i % d) + (i % this.#columns < d ? 1 : 0)
    return (this.#rows - row - 1) * this.#columns + column
  }

  getMaxField()
  {
    return half(this.#rows * this.#columns)
  }

  rc2f(r, c)
  {
    if ((r < 0) || (c < 0) || (r >= this.#rows) || (c >= this.#columns))
    {
      return -1 // out of board
    }
    return 1 + (r * half(this.#columns)) + half(c)
  }

  f2c(f)
  {
    f = f - 1

    if ((f < 0) || (f > (this.getMaxField() - 1)))
    {
      return -1
    }

    let d = half(this.#columns)

    return 1 - (~~(f / d) % 2) + (2 * (f % d))
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
      return ~~((f * 2) / this.#columns)
    }
  }

  f2rc(f)
  {
    f = f - 1

    if ((f < 0) || (f > (this.getMaxField() - 1)))
    {
      return -1
    }

    let d = half(this.#columns)

    let r = ~~((f * 2) / this.#columns)
    let c = 1 - (~~(f / d) % 2) + (2 * (f % d))
    return [r, c]
  }

  // 0 = Bottom left
  // 1 = Bottom right
  // 2 = Top left
  // 3 = Top right
  notation(r, c)
  {
    if (this.#flipped)
    {
      r = this.#rows - r - 1
      c = this.#columns - c - 1
    }

    const left = this.notationStart === 0 || this.notationStart === 2
    const bottom = this.notationStart === 0 || this.notationStart === 1

    r = bottom ? this.#rows - r - 1 : r
    c = left ? c : this.#columns - c - 1

    if (this.notationType === 'N')
    {
      const f = this.rc2f(r, c)
      return "" + f
    }
    else
    {
      return 'abcdefghijklmnop'[c] + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16][r]
    }
  }

  isWhiteToMove()
  {
    return this.#whiteToMove
  }

  getRows()
  {
    return this.#rows
  }
  
  getColumns()
  {
    return this.#columns
  }
  
  setPosition(text)
  {
    let N = this.getMaxField()
    text = text.replace(/\s/g, "")
    if (text)
    {
      for (let i = 0; i < N; i++)
      {
        let piece = undefined
        switch (text[i])
        {
          case 'x':
            piece = 'bp'
            break
          case 'X':
            piece = 'bq'
            break
          case 'o':
            piece = 'wp'
            break
          case 'O':
            piece = 'wq'
            break
        }
        this.squares[this.index2pos(i)] = piece
      }
      this.#whiteToMove = text[N] === 'W'
    }
  }

  getPosition()
  {
    let N = half(this.#rows * this.#columns)
    let pieces = new Array(N)
    for (let i = 0; i < N; i++)
    {
      const pos = this.index2pos(i);
      pieces[i] = pieceToChar(this.squares[pos])
    }
    return pieces.join("") + (this.isWhiteToMove() ? "W" : "B")
  }

  switchPlayer()
  {
    this.#whiteToMove = !this.#whiteToMove
  }

  moveBackward(m)
  {
    if (m.getFieldCount() === 0)
    {
      return
    }
    this.setPieceField(m.getEndField(), PIECE_TYPE.empty);
    for (let i = 0; i < m.getCaptureCount(); i++)
    {
      this.setPieceField(m.getCapturedField(i), m.getCapturedPiece(i))
    }
    this.setPieceField(m.getBeginField(), m.beginPiece)
    this.switchPlayer()
  }

  moveForward(m)
  {
    if (m.getFieldCount() === 0)
    {
      return
    }
    this.setPieceField(m.getBeginField(), PIECE_TYPE.empty)
    console.log('set begin ' + m.getBeginField() + ' to ' + PIECE_TYPE.empty)
    for (let i = 0; i < m.getCaptureCount(); i++)
    {
      this.setPieceField(m.getCapturedField(i), PIECE_TYPE.empty)
      console.log('set captured ' + m.getCapturedField(i) + ' to ' + PIECE_TYPE.empty)
    }
    this.setPieceField(m.getEndField(), m.getEndPiece())
    console.log('set end ' + m.getEndField() + ' to ' + m.getEndPiece())
    this.switchPlayer()
    console.log('DONE ' + this.getPosition())
  }
}
