/**
 * Author and copyright: Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {PIECE_TYPE} from "./DraughtsboardState.js";

function isKing(piece)
{
  return piece === PIECE_TYPE.blackKing || piece === PIECE_TYPE.whiteKing
}

function capturedKingCount(m)
{
  let count = 0;
  for (let i = 0; i < m.getCaptureCount(); i++)
  {
    if (isKing(m.getCapturedPiece(i)))
    {
      count++
    }
  }
  return count
}

function half(n)
{
  console.assert(n >= 0)
  return ~~(n / 2)
}

function equalArrays(x, y)
{
  if (x.length !== y.length)
  {
    return false
  }

  for (let i = 0; i < x.length; i++)
  {
    let j
    for (j = 0; j < y.length; j++)
    {
      if (x[i] === y[j])
      {
        break
      }
    }

    if (j >= y.length)
    {
      return false
    }
  }

  return true
}

export function printBoard(bs, includeSpaces = false, includeColor = false)
{
  let result = ""
  let pos = bs.getPosition()
  let columns = bs.getColumns()
  let rows = bs.getRows()
  let f = 0
  for (let i = 0; i < rows; i++)
  {
    if (includeSpaces && ((i % 2) === 0))
    {
      result += "  "
    }
    for (let j = 0; j < half(columns); j++)
    {
      if (includeSpaces)
      {
        result += " "
      }
      result += pos[f++]
      if (includeSpaces)
      {
        result += "  "
      }
    }
    if (includeSpaces)
    {
      result += "\n"
    }
  }
  if (includeColor)
  {
    if (includeSpaces)
    {
      result += "\n"
    }
    result = result + (bs.isWhiteToMove() ? "W" : "B")
  }
  return result
}

export class Move
{
  #field
  #capturedField
  #capturedPiece
  #beginPiece
  #endPiece

  constructor(field, capturedPiece = [], capturedField = [], beginPiece = 0, endPiece = 0)
  {
    this.#field = field
    this.#capturedField = capturedField
    this.#capturedPiece = capturedPiece
    this.#beginPiece = beginPiece
    this.#endPiece = endPiece
  }

  getBeginField()
  {
    return this.#field[0]
  }

  getBeginPiece()
  {
    return this.#beginPiece
  }

  isBlackMove()
  {
    return ((this.getBeginPiece() === PIECE_TYPE.blackPiece) || (this.getBeginPiece() === PIECE_TYPE.blackKing))
  }

  isCapture()
  {
    return this.getCaptureCount() > 0
  }

  getCaptureCount()
  {
    return this.#capturedField.length
  }

  getCapturedField(i)
  {
    return this.#capturedField[i]
  }

  getCapturedFields()
  {
    return this.#capturedField
  }

  getCapturedPiece(i)
  {
    return this.#capturedPiece[i]
  }

  getCapturedPieces()
  {
    return this.#capturedPiece
  }

  getEndField()
  {
    return this.#field[this.#field.length - 1]
  }

  getEndPiece()
  {
    return this.#endPiece
  }

  getField(i)
  {
    return this.#field[i]
  }

  getFieldCount()
  {
    return this.#field.length
  }

  getFullNotation()
  {
    if (this.#field.length === 0)
    {
      return ""
    }

    let separator = (this.#capturedField.length > 0) ? 'x' : '-'
    let result = "" + this.getBeginField()

    for (let i = 1; i < this.#field.length; i++)
    {
      result = result + separator + this.#field[i]
    }

    return result
  }

  isKingMove()
  {
    return ((this.getBeginPiece() === PIECE_TYPE.whiteKing) || (this.getBeginPiece() === PIECE_TYPE.blackKing))
  }

  getNotation()
  {
    if (this.#field.length === 0)
    {
      return ""
    }
    let b = this.getBeginField()
    let e = this.getEndField()
    let separator = this.isCapture() ? "x" : "-"
    return "" + ((b < 10) ? " " : "") + b + separator + e + ((e < 10) ? " " : "")
  }

  isPieceMove()
  {
    return ((this.getBeginPiece() === PIECE_TYPE.whitePiece) || (this.getBeginPiece() === PIECE_TYPE.blackPiece))
  }

  isPromotion()
  {
    return this.getBeginPiece() !== this.getEndPiece()
  }

  isWhiteMove()
  {
    return ((this.getBeginPiece() === PIECE_TYPE.whitePiece) || (this.getBeginPiece() === PIECE_TYPE.whiteKing))
  }

  equals(other)
  {
    if (this.getBeginField() !== other.getBeginField())
    {
      return false
    }

    if (this.getEndField() !== other.getEndField())
    {
      return false;
    }

    return equalArrays(this.#capturedField, other.#capturedField)
  }

  isEnemy(p)
  {
    if (this.isWhiteMove())
    {
      return ((p === PIECE_TYPE.blackPiece) || (p === PIECE_TYPE.blackKing))
    }
    else
    {
      return ((p === PIECE_TYPE.whitePiece) || (p === PIECE_TYPE.whiteKing))
    }
  }

  setCapturedFields(bs)
  {
    console.log('setCapturedFields ' + this.#field)
    if (this.#field.length === 0)
    {
      return
    }

    this.#beginPiece = bs.getPieceFromField(this.getBeginField())
    console.assert(this.#beginPiece !== PIECE_TYPE.empty)

    this.#endPiece = this.computeEndPiece(this.#beginPiece, this.getEndField(), bs)
    console.log('endpiece: ' + this.getEndField() + ' ' + this.#endPiece)

    let n = this.#field.length - 1 // maximum #captures
    let noCaptures = 0
    this.#capturedField = new Array(n)
    this.#capturedPiece = new Array(n)

    let endField = this.#field[0]
    let ce = bs.f2c(endField)
    let re = bs.f2r(endField)

    for (let i = 0; i < n; i++)
    {
      let rb = re
      let cb = ce
      endField = this.#field[i + 1]
      re = bs.f2r(endField)
      ce = bs.f2c(endField)
      let dr = 0
      let dc = 0
      if (re === rb) // horizontal move
      {
        dc = ce > cb ? 2 : -2
      }
      else if (ce === cb) // vertical move
      {
        dr = re > rb ? 2 : -2
      }
      else // diagonal move
      {
        dr = re > rb ? 1 : -1
        dc = ce > cb ? 1 : -1
      }
      this.#capturedField[i] = 0

      let r = rb + dr
      let c = cb + dc

      while ((r !== re) || (c !== ce))
      {
        let f = bs.rc2f(r, c)
        let p = bs.getPieceFromField(f)
        if (this.isEnemy(p))
        {
          noCaptures++
          this.#capturedField[i] = f
          this.#capturedPiece[i] = p
          console.log('capture ' + f + ' ' + p)
          break
        }

        r = r + dr
        c = c + dc
      }
    }
    if (noCaptures === 0)
    {
      this.#capturedField = []
      this.#capturedPiece = []
    }
  }

  computeEndPiece(piece, field, bs)
  {
    let d = half(bs.getColumns())

    if ((piece === PIECE_TYPE.whitePiece) && (field <= d))
    {
      return PIECE_TYPE.whiteKing
    }

    if ((piece === PIECE_TYPE.blackPiece) && (field >= (bs.getMaxField() - d + 1)))
    {
      return PIECE_TYPE.blackKing
    }

    return piece
  }

  setEndPieceRussian(bs)
  {
    if (this.isKingMove())
    {
      return
    }
    for (let i = 1; i < this.getFieldCount(); i++)
    {
      if (bs.isKingField(this.isWhiteMove(), this.getField(i)))
      {
        this.#endPiece = this.isWhiteMove() ? PIECE_TYPE.whiteKing : PIECE_TYPE.blackKing
      }
    }
  }
}

export class MoveFilterAnyCapture
{
  filter(moves)
  {
    let legalMoves = []
    let illegalMoves = []
    let maxCapture = 0
    for (const m of moves)
    {
      if (m.getCaptureCount() > maxCapture)
      {
        maxCapture = m.getCaptureCount()
      }
    }

    for (const m of moves)
    {
      if (maxCapture === 0 || m.getCaptureCount() > 0)
      {
        legalMoves.push(m)
      }
      else
      {
        illegalMoves.push(m)
      }
    }
    return [legalMoves, illegalMoves]
  }
}

export class MoveFilterMaximumCapture
{
  filter(moves)
  {
    let legalMoves = []
    let illegalMoves = []
    let maxCapture = 0
    for (const m of moves)
    {
      if (m.getCaptureCount() > maxCapture)
      {
        maxCapture = m.getCaptureCount()
      }
    }

    for (const m of moves)
    {
      if (m.getCaptureCount() === maxCapture)
      {
        legalMoves.push(m)
      }
      else
      {
        illegalMoves.push(m)
      }
    }
    return [legalMoves, illegalMoves]
  }
}

export class MoveFilterItalian
{
  filter(moves)
  {
    let legalMoves = []
    let illegalMoves = []

    let maxCaptureCount = 0
    let maxIsKingMove = false
    let maxCaptureKingCount = 0
    let maxFirstCaptureIsKing = false

    for (const m of moves)
    {
      if (!m.isCapture())
      {
        continue;
      }
      if (m.getCaptureCount() > maxCaptureCount)
      {
        maxCaptureCount = m.getCaptureCount();
        maxIsKingMove = isKing(m.getBeginPiece());
        maxCaptureKingCount = capturedKingCount(m)
        maxFirstCaptureIsKing = isKing(m.getCapturedPiece(0))
      }
      else if (m.getCaptureCount() === maxCaptureCount &&
        isKing(m.getBeginPiece()) && !maxIsKingMove)
      {
        maxIsKingMove = isKing(m.getBeginPiece());
        maxCaptureKingCount = capturedKingCount(m);
        maxFirstCaptureIsKing = isKing(m.getCapturedPiece(0))
      }
      else if (m.getCaptureCount() === maxCaptureCount &&
        isKing(m.getBeginPiece()) === maxIsKingMove &&
        capturedKingCount(m) > maxCaptureKingCount)
      {
        maxCaptureKingCount = capturedKingCount(m);
        maxFirstCaptureIsKing = isKing(m.getCapturedPiece(0))
      }
      else if (m.getCaptureCount() === maxCaptureCount &&
        isKing(m.getBeginPiece()) === maxIsKingMove &&
        capturedKingCount(m) === maxCaptureKingCount &&
        isKing(m.getCapturedPiece(0)) && !maxFirstCaptureIsKing)
      {
        maxFirstCaptureIsKing = isKing(m.getCapturedPiece(0))
      }
    }

    for (const m of moves)
    {
      if (maxCaptureCount === 0 ||
        (m.getCaptureCount() === maxCaptureCount &&
          isKing(m.getBeginPiece()) === maxIsKingMove &&
          capturedKingCount(m) === maxCaptureKingCount &&
          isKing(m.getCapturedPiece(0)) === maxFirstCaptureIsKing))
      {
        legalMoves.push(m);
      }
      else
      {
        illegalMoves.push(m);
      }
    }
    return [legalMoves, illegalMoves]
  }
}

export class MoveFilterSpanish
{
  capturedKingCount(m)
  {
    let count = 0;
    for (let i = 0; i < m.getCaptureCount(); i++)
    {
      if (isKing(m.getCapturedPiece(i)))
      {
        count++
      }
    }
    return count
  }

  filter(moves)
  {
    let legalMoves = []
    let illegalMoves = []

    let maxCapture = 0;
    let maxKings = 0;
    for (const m of moves)
    {
      if (m.getCaptureCount() > maxCapture)
      {
        maxCapture = m.getCaptureCount()
        maxKings = this.capturedKingCount(m)
      }
      else if (m.getCaptureCount() === maxCapture)
      {
        maxKings = Math.max(maxKings, this.capturedKingCount(m))
      }
    }

    for (const m of moves)
    {
      if (m.getCaptureCount() === maxCapture && capturedKingCount(m) === maxKings)
      {
        legalMoves.push(m)
      }
      else
      {
        illegalMoves.push(m)
      }
    }
    return [legalMoves, illegalMoves]
  }
}

export class MoveGenerator
{
  #longMoves
  #backwardsCapture
  #promoteDuringCapture
  #frysianMoves
  #moveFilter
  #moves
  #legalMoves
  #illegalMoves
  #field
  #capturedField
  #rows
  #columns
  #position
  #whiteToMove
  #isCaptured
  
  constructor(longMoves = true, backwardsCapture = true, promoteDuringCapture = false, frysianMoves = false, moveFilter = new MoveFilterMaximumCapture())
  {
    this.#longMoves = longMoves
    this.#backwardsCapture = backwardsCapture
    this.#promoteDuringCapture = promoteDuringCapture
    this.#frysianMoves = frysianMoves
    this.#moveFilter = moveFilter

    this.#rows = 0
    this.#columns = 0
    this.#position = []
    this.#whiteToMove = true

    // reset
    this.#moves = []
    this.#legalMoves = []
    this.#illegalMoves = []
    this.#field = []
    this.#capturedField = []
    this.#isCaptured = []
  }

  #reset()
  {
    this.#moves = []
    this.#legalMoves = []
    this.#illegalMoves = []
    this.#field = []
    this.#capturedField = []
  }

  isKingField(f)
  {
    let d = half(this.#columns)
    if (this.#whiteToMove)
    {
      return (f <= d)
    }
    let maxField = half(this.#rows * this.#columns)
    return f >= (maxField - d + 1)
  }

  generateForcedCaptures(bs)
  {
    let position = {...bs} // shallow clone
    position.squares = [...position.squares]

    let result = []

    while (true)
    {
      let moves = this.generateMoves(position)

      if (moves.length !== 1)
      {
        break
      }

      let m = moves[0]

      if (!m.isCapture())
      {
        break
      }

      position.moveForward(m)
      result.push(m)
    }

    return result
  }

  generateAllMoves(bs)
  {
    this.#reset()
    this.#rows = bs.getRows()
    this.#columns = bs.getColumns()
    this.#whiteToMove = bs.isWhiteToMove()
    this.#position = bs.getPieces()
    this.#isCaptured = Array(bs.getMaxField()).fill(false)

    if (this.#whiteToMove)
    {
      for (let row = 0; row < this.#rows; row++)
      {
        for (let col = 0; col < this.#columns; col++)
        {
          let f = bs.rc2f(row, col)

          switch (this.#position[f])
          {
            case PIECE_TYPE.whitePiece:
              this.#position[f] = PIECE_TYPE.empty;
              this.#doPieceCaptures(row, col)
              this.#position[f] = PIECE_TYPE.whitePiece;
              this.#doPieceMove(row, col, -1, -1)
              this.#doPieceMove(row, col, -1, 1)
              break

            case PIECE_TYPE.whiteKing:
              this.#position[f] = PIECE_TYPE.empty
              this.#doKingCaptures(row, col)
              this.#position[f] = PIECE_TYPE.whiteKing
              this.#doKingMoves(row, col, -1, -1)
              this.#doKingMoves(row, col, -1, 1)
              this.#doKingMoves(row, col, 1, -1)
              this.#doKingMoves(row, col, 1, 1)
              break
          }
        }
      }
    }
    else
    {
      for (let row = 0; row < this.#rows; row++)
      {
        for (let col = 0; col < this.#columns; col++)
        {
          let f = bs.rc2f(row, col)

          switch (this.#position[f])
          {
            case PIECE_TYPE.blackPiece:
              this.#position[f] = PIECE_TYPE.empty;
              this.#doPieceCaptures(row, col)
              this.#position[f] = PIECE_TYPE.blackPiece;
              this.#doPieceMove(row, col, 1, -1)
              this.#doPieceMove(row, col, 1, 1)
              break

            case PIECE_TYPE.blackKing:
              this.#position[f] = PIECE_TYPE.empty;
              this.#doKingCaptures(row, col)
              this.#position[f] = PIECE_TYPE.blackKing;
              this.#doKingMoves(row, col, -1, -1)
              this.#doKingMoves(row, col, -1, 1)
              this.#doKingMoves(row, col, 1, -1)
              this.#doKingMoves(row, col, 1, 1)
              break
          }
        }
      }
    }

    for (const m of this.#moves)
    {
      m.setCapturedFields(bs)
      if (this.#promoteDuringCapture)
      {
        m.setEndPieceRussian(bs)
      }
    }

    let result = this.#moveFilter.filter(this.#moves)
    this.#legalMoves = result[0];
    this.#illegalMoves = result[1];
  }

  generateMoves(bs)
  {
    this.generateAllMoves(bs)
    return this.#legalMoves;
  }

  allMoves()
  {
    return this.#moves
  }

  legalMoves()
  {
    return this.#legalMoves
  }

  illegalMoves()
  {
    return this.#illegalMoves
  }

  isEnemy(f)
  {
    if (this.#isCaptured[f])
    {
      return false
    }
    if (this.#whiteToMove)
    {
      return ((this.#position[f] === PIECE_TYPE.blackPiece) || (this.#position[f] === PIECE_TYPE.blackKing))
    }
    else
    {
      return ((this.#position[f] === PIECE_TYPE.whitePiece) || (this.#position[f] === PIECE_TYPE.whiteKing))
    }
  }

  #appendCurrentMove()
  {
    let field = new Array(this.#field.length)
    for (let i = 0; i < this.#field.length; i++)
    {
      field[i] = this.#field[i]
    }
    let m = new Move(field)
    this.#moves.push(m)
  }

  #doKingCaptureDirection(row, col, dr, dc)
  {
    let foundCaptures = false;
    row += dr
    col += dc
    let f = this.rc2f(row, col)

    if (this.#longMoves)
    {
      while ((f > 0) && (this.#position[f] === PIECE_TYPE.empty))
      {
        row += dr
        col += dc
        f = this.rc2f(row, col)
      }
    }

    if ((f > 0) && this.isEnemy(f))
    {
      let fbetween = f;
      row += dr
      col += dc
      f = this.rc2f(row, col)

      while ((f > 0) && (this.#position[f] === PIECE_TYPE.empty))
      {
        foundCaptures = true
        this.#capturedField.push(fbetween)
        this.#isCaptured[fbetween] = true
        this.#doKingCaptures(row, col)
        this.#isCaptured[fbetween] = false
        this.#capturedField.pop()
        if (!this.#longMoves)
        {
          break
        }
        row += dr
        col += dc
        f = this.rc2f(row, col)
      }
    }
    return foundCaptures;
  }

  #doKingCaptures(row, col)
  {
    let foundCaptures = false;
    this.#field.push(this.rc2f(row, col))
    foundCaptures |= this.#doKingCaptureDirection(row, col, -1, -1)
    foundCaptures |= this.#doKingCaptureDirection(row, col, -1, 1)
    foundCaptures |= this.#doKingCaptureDirection(row, col, 1, -1)
    foundCaptures |= this.#doKingCaptureDirection(row, col, 1, 1)
    if (this.#frysianMoves)
    {
      foundCaptures |= this.#doKingCaptureDirection(row, col, -2, 0)
      foundCaptures |= this.#doKingCaptureDirection(row, col, 2, 0)
      foundCaptures |= this.#doKingCaptureDirection(row, col, 0, 2)
      foundCaptures |= this.#doKingCaptureDirection(row, col, 0, -2)
    }
    if (this.#capturedField.length > 0 && !foundCaptures)
    {
      this.#appendCurrentMove()
    }
    this.#field.pop()
  }

  #doKingMoves(row, col, dr, dc)
  {
    let fstart = this.rc2f(row, col)
    row += dr
    col += dc
    let f = this.rc2f(row, col)

    while ((f > 0) && (this.#position[f] === PIECE_TYPE.empty))
    {
      let field = [fstart, f]
      let m = new Move(field)
      this.#moves.push(m)

      if (!this.#longMoves)
      {
        break
      }
      row += dr
      col += dc
      f = this.rc2f(row, col)
    }
  }

  #doPieceCaptureDirection(row, col, dr, dc)
  {
    let foundCaptures = false;
    row += dr
    col += dc

    let f = this.rc2f(row, col)

    if ((f > 0) && this.isEnemy(f))
    {
      let fbetween = f
      row += dr
      col += dc
      f = this.rc2f(row, col)

      if ((f > 0) && (this.#position[f] === PIECE_TYPE.empty))
      {
        foundCaptures = true
        this.#capturedField.push(fbetween)
        this.#isCaptured[fbetween] = true
        if (this.#promoteDuringCapture && this.isKingField(f))
        {
          this.#doKingCaptures(row, col)
        }
        else
        {
          this.#doPieceCaptures(row, col)
        }
        this.#isCaptured[fbetween] = false
        this.#capturedField.pop()
      }
    }
    return foundCaptures;
  }

  #doPieceCaptures(row, col)
  {
    let foundCaptures = false;
    this.#field.push(this.rc2f(row, col))
    if (this.#backwardsCapture || this.#whiteToMove)
    {
      foundCaptures |= this.#doPieceCaptureDirection(row, col, -1, -1)
      foundCaptures |= this.#doPieceCaptureDirection(row, col, -1, 1)
    }
    if (this.#backwardsCapture || !this.#whiteToMove)
    {
      foundCaptures |= this.#doPieceCaptureDirection(row, col, 1, -1)
      foundCaptures |= this.#doPieceCaptureDirection(row, col, 1, 1)
    }
    if (this.#frysianMoves)
    {
      foundCaptures |= this.#doPieceCaptureDirection(row, col, 0, 2)
      foundCaptures |= this.#doPieceCaptureDirection(row, col, 2, 0)
      foundCaptures |= this.#doPieceCaptureDirection(row, col, 0, -2)
      foundCaptures |= this.#doPieceCaptureDirection(row, col, -2, 0)
    }
    if (this.#capturedField.length > 0 && !foundCaptures)
    {
      this.#appendCurrentMove()
    }
    this.#field.pop()
  }

  #doPieceMove(row, col, dr, dc)
  {
    let f = this.rc2f(row + dr, col + dc)

    if ((f > 0) && (this.#position[f] === PIECE_TYPE.empty))
    {
      let field = [this.rc2f(row, col), f]
      let m = new Move(field)
      this.#moves.push(m)
    }
  }

  rc2f(r, c)
  {
    if ((r < 0) || (c < 0) || (r >= this.#rows) || (c >= this.#columns))
    {
      return -1
    }

    if ((r % 2) === (c % 2))
    {
      return 0
    }

    return 1 + (r * half(this.#columns)) + half(c)
  }
}

export function findMove(bs, moveGenerator, destPos)
{
  let moves = moveGenerator.generateMoves(bs)
  for (const m of moves)
  {
    console.log('pos0 ', bs.getPosition())
    console.log('move = ' + m.getFullNotation())
    console.log('captured fields = ' + m.getCapturedFields())
    console.log('captured pieces = ' + m.getCapturedPieces())
    bs.moveForward(m)
    let pos = bs.getPosition()
    bs.moveBackward(m)
    console.log('pos1 ', pos)
    console.log('pos2 ', destPos)
    if (pos === destPos)
    {
      return m
    }
  }
  return undefined
}