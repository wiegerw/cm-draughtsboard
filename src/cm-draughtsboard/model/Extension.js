/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

export const EXTENSION_POINT = {
    positionChanged: "positionChanged", // the positions of the pieces was changed
    boardChanged: "boardChanged", // the board (orientation) was changed
    moveInputToggled: "moveInputToggled", // move input was enabled or disabled
    moveInput: "moveInput", // move started, moving over a square, validating or canceled
    redrawBoard: "redrawBoard", // called after redrawing the board
    animation: "animation", // called on animation start, end and on every animation frame
    destroy: "destroy" // called, before the board is destroyed
}

export class Extension {

    constructor(board, props) {
        this.board = board
        this.props = props
    }

    registerExtensionPoint(name, callback) {
        if (!this.board.extensionPoints[name]) {
            this.board.extensionPoints[name] = []
        }
        this.board.extensionPoints[name].push(callback)
    }

    registerMethod(name, callback) {
        if (!this.board[name]) {
            this.board[name] = (...args) => {
                return callback.apply(this, args)
            }
        } else {
            log.error("method", name, "already exists")
        }
    }

}
