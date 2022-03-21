/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 *
 * Author and copyright: 2022 Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 *
 * License: MIT, see file 'LICENSE'
 */

import {BORDER_TYPE} from "./Chessboard.js"
import {ChessboardView, Svg} from "./ChessboardView.js"

export class DraughtsboardView extends ChessboardView
{
    constructor(board, callbackAfterCreation) {
        super(board, callbackAfterCreation, 10, 10)
    }

    clearCache() {
        const wrapperId = "chessboardSpriteCache"
        document.getElementById(wrapperId).remove()
    }

    drawCoordinate(row, column, f, color, inline, is_left, is_top) {
        let text = "" + f
        let x = is_left ?
            (this.borderSize / 3.7) + (this.chessboard.props.sprite.size * column) * this.scalingX :
            this.borderSize + (25 + this.chessboard.props.sprite.size * column) * this.scalingX

        if (!is_left && f < 10)
        {
            x = x + 6 * this.scalingX
        }

        let y = is_top ?
            this.borderSize + 25 * this.scalingY + row * this.squareHeight :
            this.borderSize + 52 * this.scalingY + row * this.squareHeight

        let cssClass = "coordinate rank"
        if (inline) {
            cssClass += color
            if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
                x = x + this.scalingX * 10
                y = y - this.scalingY * 15
            } else {
                x = x + this.scalingX * 2
                y = y - this.scalingY * 15
            }
        }
        const textElement = Svg.addElement(this.coordinatesGroup, "text", {
            class: cssClass,
            x: x,
            y: y,
            style: `font-size: ${this.scalingY * 10}px`
        })
        textElement.textContent = text
    }

    drawCoordinates() {
        let color = " black"
        if (!this.chessboard.props.style.showCoordinates) {
            color = " white"  // draw the coordinates in the background color; TODO: avoid the need to redraw like this
            // return
        }
        while (this.coordinatesGroup.firstChild) {
            this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild)
        }
        const inline = this.chessboard.props.style.borderType !== BORDER_TYPE.frame
        let is_left = false
        let is_top = true
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                if (!this.chessboard.state.isNonPlayingField(row, column))
                {
                    let f = this.chessboard.state.rc2f(row, column)
                    this.drawCoordinate(row, column, f, color, inline, is_left, is_top)
                }
            }
        }
    }

}
