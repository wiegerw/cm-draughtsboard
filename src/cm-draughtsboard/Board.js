/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {PositionAnimationsQueue} from "./PositionAnimationsQueue.js"
import {EXTENSION_POINT} from "./Extension.js"
import {BoardView} from "./BoardView.js"

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

    constructor(context, props) {
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
        this.state.orientation = this.props.orientation
        // instantiate extensions
        for (const extensionData of this.props.extensions) {
            this.extensions.push(new extensionData.class(this, extensionData.props))
        }
        this.view.redrawBoard()
        this.view.redrawPieces()
        this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
    }

    // API //

    async setPiece(index, piece, animated = false) {
        const positionFrom = this.state.clone()
        this.state.setPiece(index, piece)
        this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.clone(), animated)
    }

    async movePiece(indexFrom, indexTo, animated = false) {
        const positionFrom = this.state.clone()
        this.state.movePiece(indexFrom, indexTo)
        this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.clone(), animated)
    }

    async setPosition(fen, animated = false) {
        const positionFrom = this.state.clone()
        const positionTo = this.state.createPosition(fen)
        if (!positionFrom.equals(positionTo)) {
            this.state.setFen(fen)
            this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        }
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.clone(), animated)
    }

    async setOrientation(color, animated = false) {
        const position = this.state.clone()
        if (this.boardTurning) {
            console.log("setOrientation is only once in queue allowed")
            return
        }
        this.boardTurning = true
        const emptyPosition = this.state.createPosition()
        return this.positionAnimationsQueue.enqueueTurnBoard(position, emptyPosition, color, animated).then(() => {
            this.boardTurning = false
            this.state.invokeExtensionPoints(EXTENSION_POINT.boardChanged)
        })
    }

    getPiece(index) {
        return this.state.getPiece(index)
    }

    getPosition() {
        return this.state.getFen()
    }

    getOrientation() {
        return this.state.orientation
    }

    addMarker(type, index) {
        if (typeof type === "string" || typeof index === "object") { // todo remove 2022-12-01
            console.error("changed the signature of `addMarker` to `(type, index)` with v5.1.x")
            return
        }
        this.state.addMarker(index, type)
        this.view.drawMarkers()
    }

    getMarkers(type = undefined, index = undefined) {
        if (typeof type === "string" || typeof index === "object") { // todo remove 2022-12-01
            console.error("changed the signature of `getMarkers` to `(type, index)` with v5.1.x")
            return
        }
        const markersFound = []
        this.state.markers.forEach((marker) => {
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
        if (typeof type === "string" || typeof index === "object") { // todo remove 2022-12-01
            console.error("changed the signature of `removeMarkers` to `(type, index)` with v5.1.x")
            return
        }
        this.state.removeMarkers(index, type)
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
        this.state.squareSelectEnabled = true
        this.view.visualizeInputState()
    }

    disableSquareSelect() {
        this.context.removeEventListener("contextmenu", this.squareSelectListener)
        this.context.removeEventListener("mousedown", this.squareSelectListener)
        this.context.removeEventListener("mouseup", this.squareSelectListener)
        this.context.removeEventListener("touchstart", this.squareSelectListener)
        this.context.removeEventListener("touchend", this.squareSelectListener)
        this.squareSelectListener = undefined
        this.state.squareSelectEnabled = false
        this.view.visualizeInputState()
    }

    destroy() {
        this.state.invokeExtensionPoints(EXTENSION_POINT.destroy)
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

}
