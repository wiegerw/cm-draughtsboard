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
    moveInput: "moveInput", // move started, to validate or canceled
    // moveInputStateChanged: "moveInput", // TODO deprecated, use `moveInput`
    redrawBoard: "redrawBoard", // called after redrawing the board
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
