/**
 * Author and copyright: Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {MoveGenerator, printBoard} from "../src/cm-chessboard/Draughts.js"
import {DraughtsboardState} from "../src/cm-chessboard/DraughtsboardState.js"

function generateMoves(pos)
{
  let bs = new DraughtsboardState()
  bs.setPosition(pos)
  console.log(printBoard(bs, true, true))
  let movegen = new MoveGenerator()
  let moves = movegen.generateMoves(bs)
  let result = []
  for (const m of moves)
  {
    result.push(m.getNotation())
  }
  return result
}

const equalArrays = (a, b) =>
  a.length === b.length &&
  a.every((v, i) => v === b[i])

describe("TestDraughts", () => {

  it("position 1", () => {
    let pos = `xxxxxxxxxxxxxxxxxxxx..........ooooooooooooooooooooW`
    let moves = generateMoves(pos)
    assert.true(equalArrays(moves, [ "31-26", "31-27", "32-27", "32-28", "33-28", "33-29", "34-29", "34-30", "35-30" ]))
  })

  it("position 2", () => {
    let pos = `
   .   .   .   .   .
 .   x   x   .   .
   .   .   .   .   .
 .   x   x   .   .
   .   o   .   .   .
 .   x   .   .   .
   .   .   .   .   .
 .   .   .   .   .
   .   .   .   .   .
 .   .   .   .   .
W`
    let moves = generateMoves(pos)
    assert.true(equalArrays(moves, [ "22x31" ]))
  })

  it("position 3", () => {
    let pos = `
   .   .   .   .   .
 .   .   .   .   .
   .   .   x   x   .
 x   x   x   x   .
   x   .   x   x   o
 x   o   o   .   o
   .   o   o   .   o
 .   o   o   o   .
   .   .   .   .   .
 .   .   .   .   .
B`
    let moves = generateMoves(pos)
    assert.true(equalArrays(moves, [ "14-20", "17-22", "18-22", "23-29", "24-29", "26-31" ]))
  })

  it("position 4", () => {
    let pos = `
   .   .   .   .   .
 .   x   x   .   .
   .   .   .   x   .
 .   .   x   .   .
   .   O   .   .   .
 .   x   .   .   .
   .   .   .   .   .
 .   .   .   .   .
   .   .   .   .   .
 .   .   .   .   .
W`
    let moves = generateMoves(pos)
    assert.true(equalArrays(moves, [ "22x10", "22x5 " ]))
  })

})
