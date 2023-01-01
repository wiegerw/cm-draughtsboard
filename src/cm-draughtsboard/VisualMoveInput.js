/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Svg} from "./BoardView.js"
import {createTask} from "./DraughtsboardState.js"

const STATE = {
    waitForInputStart: 0,
    pieceClickedThreshold: 1,
    clickTo: 2,
    secondClickThreshold: 3,
    dragTo: 4,
    clickDragTo: 5,
    moveDone: 6,
    reset: 7
}

export const MOVE_CANCELED_REASON = {
    secondClick: "secondClick",
    movedOutOfBoard: "movedOutOfBoard",
    draggedBack: "draggedBack",
    clickedAnotherPiece: "clickedAnotherPiece"
}

const DRAG_THRESHOLD = 4

export class VisualMoveInput {

    constructor(view, moveInputStartedCallback, validateMoveInputCallback, moveInputCanceledCallback) {
        this.view = view
        this.chessboard = view.chessboard
        this.moveInputStartedCallback = (index) => {
            const result = moveInputStartedCallback(index)
            if(result) {
                this.chessboard.state.moveInputProcess = createTask()
            }
            return result
        }
        this.validateMoveInputCallback = (fromIndex, toIndex) => {
            const result = validateMoveInputCallback(fromIndex, toIndex)
            this.chessboard.state.moveInputProcess.resolve(result)
            return result
        }
        this.moveInputCanceledCallback = (reason, fromIndex, toIndex) => {
            moveInputCanceledCallback(reason, fromIndex, toIndex)
            this.chessboard.state.moveInputProcess.resolve()
        }
        this.setMoveInputState(STATE.waitForInputStart)
    }

    setMoveInputState(newState, params = undefined) {

        // console.log("setMoveInputState", Object.keys(STATE)[this.moveInputState], "=>", Object.keys(STATE)[newState]);

        const prevState = this.moveInputState
        this.moveInputState = newState

        switch (newState) {

            case STATE.waitForInputStart:
                break

            case STATE.pieceClickedThreshold:
                if (STATE.waitForInputStart !== prevState && STATE.clickTo !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.pointerMoveListener) {
                    removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener)
                    this.pointerMoveListener = undefined
                }
                if (this.pointerUpListener) {
                    removeEventListener(this.pointerUpListener.type, this.pointerUpListener)
                    this.pointerUpListener = undefined
                }
                this.fromIndex = params.index
                this.toIndex = undefined
                this.movedPiece = params.piece
                this.updateStartEndMarkers()
                this.startPoint = params.point
                if (!this.pointerMoveListener && !this.pointerUpListener) {
                    if (params.type === "mousedown") {

                        this.pointerMoveListener = this.onPointerMove.bind(this)
                        this.pointerMoveListener.type = "mousemove"
                        addEventListener("mousemove", this.pointerMoveListener)

                        this.pointerUpListener = this.onPointerUp.bind(this)
                        this.pointerUpListener.type = "mouseup"
                        addEventListener("mouseup", this.pointerUpListener)

                    } else if (params.type === "touchstart") {

                        this.pointerMoveListener = this.onPointerMove.bind(this)
                        this.pointerMoveListener.type = "touchmove"
                        addEventListener("touchmove", this.pointerMoveListener)

                        this.pointerUpListener = this.onPointerUp.bind(this)
                        this.pointerUpListener.type = "touchend"
                        addEventListener("touchend", this.pointerUpListener)

                    } else {
                        throw Error("event type")
                    }
                } else {
                    throw Error("_pointerMoveListener or _pointerUpListener")
                }
                break

            case STATE.clickTo:
                if (this.draggablePiece) {
                    Svg.removeElement(this.draggablePiece)
                    this.draggablePiece = undefined
                }
                if (prevState === STATE.dragTo) {
                    this.view.setPieceVisibility(params.index, true)
                }
                break

            case STATE.secondClickThreshold:
                if (STATE.clickTo !== prevState) {
                    throw new Error("moveInputState")
                }
                this.startPoint = params.point
                break

            case STATE.dragTo:
                if (STATE.pieceClickedThreshold !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.view.chessboard.state.inputEnabled) {
                    this.view.setPieceVisibility(params.index, false)
                    this.createDraggablePiece(params.piece)
                }
                break

            case STATE.clickDragTo:
                if (STATE.secondClickThreshold !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.view.chessboard.state.inputEnabled) {
                    this.view.setPieceVisibility(params.index, false)
                    this.createDraggablePiece(params.piece)
                }
                break

            case STATE.moveDone:
                if ([STATE.dragTo, STATE.clickTo, STATE.clickDragTo].indexOf(prevState) === -1) {
                    throw new Error("moveInputState")
                }
                this.toIndex = params.index
                if (this.toIndex && this.validateMoveInputCallback(this.fromIndex, this.toIndex)) {
                    if (prevState === STATE.clickTo) {
                        this.chessboard.movePiece(this.fromIndex, this.toIndex, true).then(() => {
                            this.setMoveInputState(STATE.reset)
                        })
                    } else {
                        this.chessboard.movePiece(this.fromIndex, this.toIndex, false).then(() => {
                            this.view.setPieceVisibility(this.toIndex, true)
                            this.setMoveInputState(STATE.reset)
                        })
                    }
                } else {
                    this.view.setPieceVisibility(this.fromIndex, true)
                    this.setMoveInputState(STATE.reset)
                }
                break

            case STATE.reset:
                if (this.fromIndex && !this.toIndex && this.movedPiece) {
                    this.chessboard.state.position.setPiece(this.fromIndex, this.movedPiece)
                }
                this.fromIndex = undefined
                this.toIndex = undefined
                this.movedPiece = undefined
                this.updateStartEndMarkers()
                if (this.draggablePiece) {
                    Svg.removeElement(this.draggablePiece)
                    this.draggablePiece = undefined
                }
                if (this.pointerMoveListener) {
                    removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener)
                    this.pointerMoveListener = undefined
                }
                if (this.pointerUpListener) {
                    removeEventListener(this.pointerUpListener.type, this.pointerUpListener)
                    this.pointerUpListener = undefined
                }
                this.setMoveInputState(STATE.waitForInputStart)
                break

            default:
                throw Error(`moveInputState ${newState}`)
        }
    }

    createDraggablePiece(pieceName) {
        // TODO use the existing piece from the board and don't create an new one
        if (this.draggablePiece) {
            throw Error("draggablePiece exists")
        }
        this.draggablePiece = Svg.createSvg(document.body)
        this.draggablePiece.classList.add("cm-chessboard-draggable-piece")
        this.draggablePiece.setAttribute("width", this.view.squareWidth)
        this.draggablePiece.setAttribute("height", this.view.squareHeight)
        this.draggablePiece.setAttribute("style", "pointer-events: none")
        this.draggablePiece.name = pieceName
        const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url
        const piece = Svg.addElement(this.draggablePiece, "use", {
            href: `${spriteUrl}#${pieceName}`
        })
        const scaling = this.view.squareHeight / this.chessboard.props.sprite.size
        const transformScale = (this.draggablePiece.createSVGTransform())
        transformScale.setScale(scaling, scaling)
        piece.transform.baseVal.appendItem(transformScale)
    }

    moveDraggablePiece(x, y) {
        this.draggablePiece.setAttribute("style",
            `pointer-events: none; position: absolute; left: ${x - (this.view.squareHeight / 2)}px; top: ${y - (this.view.squareHeight / 2)}px`)
    }

    onPointerDown(e) {
        if (e.type === "mousedown" && e.button === 0 || e.type === "touchstart") {
            const index = e.target.getAttribute("data-index")
            if (index) { // pointer on index
                const pieceName = this.chessboard.getPiece(index)
                // console.log("onPointerDown", index, pieceName)
                let color
                if (pieceName) {
                    color = pieceName ? pieceName.substring(0, 1) : undefined
                    // allow scrolling, if not pointed on draggable piece
                    if (color === "w" && this.chessboard.state.inputWhiteEnabled ||
                        color === "b" && this.chessboard.state.inputBlackEnabled) {
                        e.preventDefault()
                    }
                }
                if (this.moveInputState !== STATE.waitForInputStart ||
                    this.chessboard.state.inputWhiteEnabled && color === "w" ||
                    this.chessboard.state.inputBlackEnabled && color === "b") {
                    let point
                    if (e.type === "mousedown") {
                        point = {x: e.clientX, y: e.clientY}
                    } else if (e.type === "touchstart") {
                        point = {x: e.touches[0].clientX, y: e.touches[0].clientY}
                    }
                    if (this.moveInputState === STATE.waitForInputStart && pieceName && this.moveInputStartedCallback(index)) {
                        this.setMoveInputState(STATE.pieceClickedThreshold, {
                            index: index,
                            piece: pieceName,
                            point: point,
                            type: e.type
                        })
                    } else if (this.moveInputState === STATE.clickTo) {
                        if (index === this.fromIndex) {
                            this.setMoveInputState(STATE.secondClickThreshold, {
                                index: index,
                                piece: pieceName,
                                point: point,
                                type: e.type
                            })
                        } else {
                            const pieceName = this.chessboard.getPiece(index)
                            const pieceColor = pieceName ? pieceName.substring(0, 1) : undefined
                            const startPieceName = this.chessboard.getPiece(this.fromIndex)
                            const startPieceColor = startPieceName ? startPieceName.substring(0, 1) : undefined
                            if (color && startPieceColor === pieceColor) {
                                this.moveInputCanceledCallback(MOVE_CANCELED_REASON.clickedAnotherPiece, this.fromIndex, index)
                                if (this.moveInputStartedCallback(index)) {
                                    this.setMoveInputState(STATE.pieceClickedThreshold, {
                                        index: index,
                                        piece: pieceName,
                                        point: point,
                                        type: e.type
                                    })
                                } else {
                                    this.setMoveInputState(STATE.reset)
                                }
                            } else {
                                this.setMoveInputState(STATE.moveDone, {index: index})
                            }
                        }
                    }
                }
            }
        }
    }

    onPointerMove(e) {
        let pageX, pageY, clientX, clientY, target
        if (e.type === "mousemove") {
            clientX = e.clientX
            clientY = e.clientY
            pageX = e.pageX
            pageY = e.pageY
            target = e.target
        } else if (e.type === "touchmove") {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
            pageX = e.touches[0].pageX
            pageY = e.touches[0].pageY
            target = document.elementFromPoint(clientX, clientY)
        }
        if (this.moveInputState === STATE.pieceClickedThreshold || this.moveInputState === STATE.secondClickThreshold) {
            if (Math.abs(this.startPoint.x - clientX) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - clientY) > DRAG_THRESHOLD) {
                if (this.moveInputState === STATE.secondClickThreshold) {
                    this.setMoveInputState(STATE.clickDragTo, {index: this.fromIndex, piece: this.movedPiece})
                } else {
                    this.setMoveInputState(STATE.dragTo, {index: this.fromIndex, piece: this.movedPiece})
                }
                if (this.view.chessboard.state.inputEnabled) {
                    this.moveDraggablePiece(pageX, pageY)
                }
            }
        } else if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo || this.moveInputState === STATE.clickTo) {
            if (target && target.getAttribute && target.parentElement === this.view.boardGroup) {
                const index = target.getAttribute("data-index")
                if (index !== this.fromIndex && index !== this.toIndex) {
                    this.toIndex = index
                    this.updateStartEndMarkers()
                } else if (index === this.fromIndex && this.toIndex !== undefined) {
                    this.toIndex = undefined
                    this.updateStartEndMarkers()
                }
            } else {
                if (this.toIndex !== undefined) {
                    this.toIndex = undefined
                    this.updateStartEndMarkers()
                }
            }
            if (this.view.chessboard.state.inputEnabled && (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo)) {
                this.moveDraggablePiece(pageX, pageY)
            }
        }
    }

    onPointerUp(e) {
        let target
        if (e.type === "mouseup") {
            target = e.target
        } else if (e.type === "touchend") {
            target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        }
        if (target && target.getAttribute) {
            const index = target.getAttribute("data-index")

            if (index) {
                if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo) {
                    if (this.fromIndex === index) {
                        if (this.moveInputState === STATE.clickDragTo) {
                            this.chessboard.state.position.setPiece(this.fromIndex, this.movedPiece)
                            this.view.setPieceVisibility(this.fromIndex)
                            this.moveInputCanceledCallback(MOVE_CANCELED_REASON.draggedBack, index, index)
                            this.setMoveInputState(STATE.reset)
                        } else {
                            this.setMoveInputState(STATE.clickTo, {index: index})
                        }
                    } else {
                        this.setMoveInputState(STATE.moveDone, {index: index})
                    }
                } else if (this.moveInputState === STATE.pieceClickedThreshold) {
                    this.setMoveInputState(STATE.clickTo, {index: index})
                } else if (this.moveInputState === STATE.secondClickThreshold) {
                    this.setMoveInputState(STATE.reset)
                    this.moveInputCanceledCallback(MOVE_CANCELED_REASON.secondClick, index, index)
                }
            } else {
                this.view.redrawPieces()
                const moveStartSquare = this.fromIndex
                this.setMoveInputState(STATE.reset)
                this.moveInputCanceledCallback(MOVE_CANCELED_REASON.movedOutOfBoard, moveStartSquare, undefined)
            }
        } else {
            this.view.redrawPieces()
            this.setMoveInputState(STATE.reset)
        }
    }

    updateStartEndMarkers() {
        if (this.chessboard.props.style.moveFromMarker) {
            this.chessboard.state.removeMarkers(undefined, this.chessboard.props.style.moveFromMarker)
        }
        if (this.chessboard.props.style.moveToMarker) {
            this.chessboard.state.removeMarkers(undefined, this.chessboard.props.style.moveToMarker)
        }
        if (this.chessboard.props.style.moveFromMarker) {
            if (this.fromIndex) {
                this.chessboard.state.addMarker(this.fromIndex, this.chessboard.props.style.moveFromMarker)
            }
        }
        if (this.chessboard.props.style.moveToMarker) {
            if (this.toIndex) {
                this.chessboard.state.addMarker(this.toIndex, this.chessboard.props.style.moveToMarker)
            }
        }
        this.view.drawMarkers()
    }

    reset() {
        this.setMoveInputState(STATE.reset)
    }

    destroy() {
        this.reset()
    }

}
