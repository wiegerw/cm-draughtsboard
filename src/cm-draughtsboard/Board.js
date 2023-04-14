/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {PositionAnimationsQueue} from "./view/PositionAnimationsQueue.js"
import {EXTENSION_POINT} from "./model/Extension.js"
import {BoardView} from "./view/BoardView.js"
import {createTask, Position} from "./model/Position.js";

export const COLOR = {
    white: "w",
    black: "b"
}
export const INPUT_EVENT_TYPE = {
    moveStart: "moveInputStarted", // TODO deprecated 2022-08-24, use `moveInputStarted`
    moveInputStarted: "moveInputStarted",
    moveDone: "validateMoveInput", // TODO deprecated 2022-08-24, use `validateMoveInput` https://github.com/shaack/cm-chessboard/issues/83
    validateMoveInput: "validateMoveInput",
    moveCanceled: "moveInputCanceled", // TODO deprecated 2022-08-24, use `moveInputCanceled`
    moveInputCanceled: "moveInputCanceled",
}
export const SQUARE_SELECT_TYPE = {
    primary: "primary",
    secondary: "secondary"
}
export const BORDER_TYPE = {
    none: "none", // no border
    thin: "thin", // thin border
    frame: "frame" // wide border with coordinates in it
}
export const MARKER_TYPE = {
    frame: {class: "marker-frame", slice: "markerFrame"},
    square: {class: "marker-square", slice: "markerSquare"},
    dot: {class: "marker-dot", slice: "markerDot"},
    circle: {class: "marker-circle", slice: "markerCircle"}
}

export class Board {

    constructor(context, props, rows=10, columns=10) {
        // board dimensions
        this.rows = rows
        this.columns = columns

        // interaction
        this.inputWhiteEnabled = false
        this.inputBlackEnabled = false
        this.inputEnabled = false
        this.squareSelectEnabled = false
        this.extensionPoints = {}
        this.moveInputProcess = createTask().resolve()
        this.markers = []

        if (!context) {
            throw new Error("container element is " + context)
        }
        this.context = context
        this.id = (Math.random() + 1).toString(36).substring(2, 8)
        this.extensions = []
        let defaultProps = {
            orientation: COLOR.white, // white on bottom
            responsive: true, // resize the board automatically to the size of the context element
            animationDuration: 300, // pieces animation duration in milliseconds. Disable all animation with `0`.
            language: navigator.language.substring(0, 2).toLowerCase(), // supports "de" and "en" for now, used for pieces naming
            style: {
                cssClass: "default", // set the css theme of the board, try "green", "blue" or "chess-club"
                showCoordinates: false, // show ranks and files
                borderType: BORDER_TYPE.thin, // "thin" thin border, "frame" wide border with coordinates in it, "none" no border
                aspectRatio: 1, // height/width of the board
                moveFromMarker: MARKER_TYPE.frame, // the marker used to mark the start square
                moveToMarker: MARKER_TYPE.frame, // the marker used to mark the square where the figure is moving to
            },
            sprite: {
                url: "../data/pieces", // the folder where pieces and markers are stored
                size: 40, // the sprite tiles size, defaults to 40x40px
                cache: true // cache the sprite
            },
            extensions: [ /* {class: ExtensionClass, props: { ... }} */] // add extensions here
        }
        this.props = {}
        Object.assign(this.props, defaultProps)
        Object.assign(this.props, props)
        this.props.sprite = defaultProps.sprite
        this.props.style = defaultProps.style
        if (props.sprite) {
            Object.assign(this.props.sprite, props.sprite)
        }
        if (props.style) {
            Object.assign(this.props.style, props.style)
        }
        if (props.extensions) {
            this.props.extensions = props.extensions
        }
        if (this.props.language !== "de" && this.props.language !== "en") {
            this.props.language = "en"
        }

        this.state = props.state
        this.view = new BoardView(this)
        this.positionAnimationsQueue = new PositionAnimationsQueue(this)
        this.orientation = this.props.orientation
        // instantiate extensions
        for (const extensionData of this.props.extensions) {
            this.extensions.push(new extensionData.class(this, extensionData.props))
        }
        this.view.redrawBoard()
        this.view.redrawPieces()
        this.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
    }

    // API //
    getPieceIndex(index) {
        throw new Error("Board::getPieceIndex must be overridden")
    }

    getPosition() {
        let squares = new Array(this.rows * this.columns).fill(undefined)
        const N = this.rows * this.columns
        for (let i = 0; i < N; i++) 
        {
            squares[i] = this.getPieceIndex(i)
        }
        return new Position(this.rows, this.columns, squares)
    }

    async setPieceIndex(index, piece, animated = false) {
        const positionFrom = this.getPosition()
        this.state.setPiece(index, piece)
        this.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.getPosition(), animated)
    }

    async movePieceIndex(indexFrom, indexTo, animated = false) {
        const positionFrom = this.getPosition()
        this.state.movePiece(indexFrom, indexTo)
        this.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.getPosition(), animated)
    }

    async setPosition(fen, animated = false) {
        const positionFrom = this.getPosition()
        const positionTo = this.state.createPosition(fen)
        if (!positionFrom.equals(positionTo)) {
            this.state.setFen(fen)
            this.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        }
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.getPosition(), animated)
    }

    async setOrientation(color, animated = false) {
        const position = this.getPosition()
        if (this.boardTurning) {
            console.log("setOrientation is only once in queue allowed")
            return
        }
        this.boardTurning = true
        return this.positionAnimationsQueue.enqueueTurnBoard(position, color, animated).then(() => {
            this.boardTurning = false
            this.invokeExtensionPoints(EXTENSION_POINT.boardChanged)
        })
    }

    getOrientation() {
        return this.orientation
    }

    // markers
    addMarker(type, index) {
        this.markers.push({index: index, type: type})
        this.view.drawMarkers()
    }

    getMarkers(type = undefined, index = undefined) {
        if (typeof type === "string" || typeof index === "object") { // todo remove 2022-12-01
            console.error("changed the signature of `getMarkers` to `(type, index)` with v5.1.x")
            return
        }
        const markersFound = []
        this.markers.forEach((marker) => {
            const markerSquare = marker.index
            if (!index && (!type || type === marker.type) ||
                !type && index === markerSquare ||
                type === marker.type && index === markerSquare) {
                markersFound.push({index: marker.index, type: marker.type})
            }
        })
        return markersFound
    }

    removeMarkers(type = undefined, index = undefined) {
        if (!index && !type) {
            this.markers = []
        } else {
            this.markers = this.markers.filter((marker) => {
                if (!type) {
                    if (index === marker.index) {
                        return false
                    }
                } else if (!index) {
                    if (marker.type === type) {
                        return false
                    }
                } else if (marker.type === type && index === marker.index) {
                    return false
                }
                return true
            })
        }
        this.view.drawMarkers()
    }

    enableMoveInput(eventHandler, color = undefined) {
        this.view.enableMoveInput(eventHandler, color)
    }

    disableMoveInput() {
        this.view.disableMoveInput()
    }

    enableSquareSelect(eventHandler) {
        if (this.squareSelectListener) {
            console.warn("squareSelectListener already existing")
            return
        }
        this.squareSelectListener = function (e) {
            const index = e.target.getAttribute("data-index")
            if (e.type === "contextmenu") {
                // disable context menu
                e.preventDefault()
                return
            }
            eventHandler({
                mouseEvent: e,
                board: this,
                type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
                index: index
            })
        }
        this.context.addEventListener("contextmenu", this.squareSelectListener)
        this.context.addEventListener("mousedown", this.squareSelectListener)
        this.context.addEventListener("mouseup", this.squareSelectListener)
        this.context.addEventListener("touchstart", this.squareSelectListener)
        this.context.addEventListener("touchend", this.squareSelectListener)
        this.squareSelectEnabled = true
        this.view.visualizeInputState()
    }

    disableSquareSelect() {
        this.context.removeEventListener("contextmenu", this.squareSelectListener)
        this.context.removeEventListener("mousedown", this.squareSelectListener)
        this.context.removeEventListener("mouseup", this.squareSelectListener)
        this.context.removeEventListener("touchstart", this.squareSelectListener)
        this.context.removeEventListener("touchend", this.squareSelectListener)
        this.squareSelectListener = undefined
        this.squareSelectEnabled = false
        this.view.visualizeInputState()
    }

    destroy() {
        this.invokeExtensionPoints(EXTENSION_POINT.destroy)
        this.positionAnimationsQueue.destroy()
        this.view.destroy()
        this.view = undefined
        this.state = undefined
        if (this.squareSelectListener) {
            this.context.removeEventListener("contextmenu", this.squareSelectListener)
            this.context.removeEventListener("mouseup", this.squareSelectListener)
            this.context.removeEventListener("touchend", this.squareSelectListener)
        }
    }

    invokeExtensionPoints(name, data = {}) {
        const extensionPoints = this.extensionPoints[name]
        const dataCloned = Object.assign({}, data)
        dataCloned.extensionPoint = name
        let returnValue = true
        if (extensionPoints) {
            for (const extensionPoint of extensionPoints) {
                if(extensionPoint(dataCloned) === false) {
                    returnValue = false
                }
            }
        }
        return returnValue
    }
}
