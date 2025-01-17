/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */
import {Svg} from "../lib/Svg.js"
import {Position} from "../model/Position.js"

/*
* Thanks to markosyan for the idea of the PromiseQueue
* https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
*/

export class PromiseQueue {

    constructor() {
        this.queue = []
        this.workingOnPromise = false
        this.stop = false
    }

    async enqueue(promise) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                promise, resolve, reject,
            })
            this.dequeue()
        })
    }

    dequeue() {
        if (this.workingOnPromise) {
            return
        }
        if (this.stop) {
            this.queue = []
            this.stop = false
            return
        }
        const entry = this.queue.shift()
        if (!entry) {
            return
        }
        try {
            this.workingOnPromise = true
            entry.promise().then((value) => {
                this.workingOnPromise = false
                entry.resolve(value)
                this.dequeue()
            }).catch(err => {
                this.workingOnPromise = false
                entry.reject(err)
                this.dequeue()
            })
        } catch (err) {
            this.workingOnPromise = false
            entry.reject(err)
            this.dequeue()
        }
        return true
    }

    destroy() {
        this.stop = true
    }

}


const CHANGE_TYPE = {
    move: 0,
    appear: 1,
    disappear: 2
}

export class PositionsAnimation {

    constructor(view, fromPosition, toPosition, duration, callback) {
        this.view = view
        if (fromPosition && toPosition) {
            this.rows = fromPosition.rows
            this.columns = fromPosition.columns
            this.animatedElements = this.createAnimation(fromPosition.squares, toPosition.squares)
            this.duration = duration
            this.callback = callback
            this.frameHandle = requestAnimationFrame(this.animationStep.bind(this))
        } else {
            console.error("fromPosition", fromPosition, "toPosition", toPosition)
        }
    }

    squareDistance(index1, index2) {
        const column1 = index1 % this.columns
        const row1 = Math.floor(index1 / this.columns)
        const column2 = index2 % this.columns
        const row2 = Math.floor(index2 / this.columns)
        return Math.max(Math.abs(row2 - row1), Math.abs(column2 - column1))
    }

    seekChanges(fromIndices, toIndices) {
        let N = this.rows * this.columns
        const appearedList = [], disappearedList = [], changes = []
        for (let i = 0; i < N; i++) {
            const previousSquare = fromIndices[i]
            const newSquare = toIndices[i]
            if (newSquare !== previousSquare) {
                if (newSquare) {
                    appearedList.push({piece: newSquare, index: i})
                }
                if (previousSquare) {
                    disappearedList.push({piece: previousSquare, index: i})
                }
            }
        }
        appearedList.forEach((appeared) => {
            let shortestDistance = Math.max(this.rows, this.columns)
            let foundMoved = undefined
            disappearedList.forEach((disappeared) => {
                if (appeared.piece === disappeared.piece) {
                    const moveDistance = this.squareDistance(appeared.index, disappeared.index)
                    if (moveDistance < shortestDistance) {
                        foundMoved = disappeared
                        shortestDistance = moveDistance
                    }
                }
            })
            if (foundMoved) {
                disappearedList.splice(disappearedList.indexOf(foundMoved), 1) // remove from disappearedList, because it is moved now
                changes.push({
                    type: CHANGE_TYPE.move,
                    piece: appeared.piece,
                    atIndex: foundMoved.index,
                    toIndex: appeared.index
                })
            } else {
                changes.push({type: CHANGE_TYPE.appear, piece: appeared.piece, atIndex: appeared.index})
            }
        })
        disappearedList.forEach((disappeared) => {
            changes.push({type: CHANGE_TYPE.disappear, piece: disappeared.piece, atIndex: disappeared.index})
        })
        return changes
    }

    createAnimation(fromIndices, toIndices) {
        const changes = this.seekChanges(fromIndices, toIndices)
        // console.log("changes", changes)
        const animatedElements = []
        changes.forEach((change) => {
            const animatedItem = {
                type: change.type
            }
            switch (change.type) {
                case CHANGE_TYPE.move:
                    animatedItem.element = this.view.getPieceElement(change.atIndex)
                    animatedItem.element.parentNode.appendChild(animatedItem.element) // move element to top layer
                    animatedItem.atPoint = this.view.indexToPoint(change.atIndex)
                    animatedItem.toPoint = this.view.indexToPoint(change.toIndex)
                    break
                case CHANGE_TYPE.appear:
                    animatedItem.element = this.view.drawPieceOnSquare(change.atIndex, change.piece)
                    animatedItem.element.style.opacity = 0
                    break
                case CHANGE_TYPE.disappear:
                    animatedItem.element = this.view.getPieceElement(change.atIndex)
                    break
            }
            animatedElements.push(animatedItem)
        })
        return animatedElements
    }

    animationStep(time) {
        // console.log("animationStep", time)
        if (!this.startTime) {
            this.startTime = time
        }
        const timeDiff = time - this.startTime
        if (timeDiff <= this.duration) {
            this.frameHandle = requestAnimationFrame(this.animationStep.bind(this))
        } else {
            cancelAnimationFrame(this.frameHandle)
            // console.log("ANIMATION FINISHED")
            this.animatedElements.forEach((animatedItem) => {
                if (animatedItem.type === CHANGE_TYPE.disappear) {
                    Svg.removeElement(animatedItem.element)
                }
            })
            this.callback()
            return
        }
        const t = Math.min(1, timeDiff / this.duration)
        let progress = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOut
        if (isNaN(progress)) {
            progress = 1
        }
        this.animatedElements.forEach((animatedItem) => {
            // console.log("animatedItem", animatedItem)
            if (animatedItem.element) {
                switch (animatedItem.type) {
                    case CHANGE_TYPE.move:
                        animatedItem.element.transform.baseVal.removeItem(0)
                        const transform = (this.view.svg.createSVGTransform())
                        transform.setTranslate(
                            animatedItem.atPoint.x + (animatedItem.toPoint.x - animatedItem.atPoint.x) * progress,
                            animatedItem.atPoint.y + (animatedItem.toPoint.y - animatedItem.atPoint.y) * progress)
                        animatedItem.element.transform.baseVal.appendItem(transform)
                        break
                    case CHANGE_TYPE.appear:
                        animatedItem.element.style.opacity = Math.round(progress * 100) / 100
                        break
                    case CHANGE_TYPE.disappear:
                        animatedItem.element.style.opacity = Math.round((1 - progress) * 100) / 100
                        break
                }
            } else {
                console.warn("animatedItem has no element", animatedItem)
            }
        })
    }
}

export class PositionAnimationsQueue extends PromiseQueue {

    constructor(board) {
        super()
        this.board = board
    }

    async enqueuePositionChange(positionFrom, positionTo, animated) {
        if(positionFrom.equals(positionTo)) {
            return Promise.resolve()
        } else {
            return super.enqueue(() => new Promise((resolve) => {
                let duration = animated ? this.board.props.animationDuration : 0
                if (this.queue.length > 0) {
                    duration = duration / (1 + Math.pow(this.queue.length / 5, 2))
                }
                // console.log("duration", duration, animated, "this.board.props.animationDuration", this.board.props.animationDuration)
                new PositionsAnimation(this.board.view,
                    positionFrom, positionTo, animated ? duration : 0,
                    () => {
                        if (this.board.view) { // if destroyed, no view anymore
                            this.board.view.redrawPieces(positionTo.squares)
                        }
                        resolve()
                    }
                )
            }))
        }
    }

    async enqueueTurnBoard(position, color, animated) {
        const emptyPosition = new Position(position.rows, position.columns)
        return super.enqueue(() => new Promise((resolve) => {
            let duration = animated ? this.board.props.animationDuration : 0
            if(this.queue.length > 0) {
                duration = duration / (1 + Math.pow(this.queue.length / 5, 2))
            }
            new PositionsAnimation(this.board.view,
                position, emptyPosition, animated ? duration : 0,
                () => {
                    this.board.orientation = color
                    this.board.view.redrawBoard()
                    this.board.view.redrawPieces(emptyPosition.squares)
                    new PositionsAnimation(this.board.view,
                        emptyPosition, position, animated ? duration : 0,
                        () => {
                            this.board.view.redrawPieces(position.squares)
                            resolve()
                        }
                    )
                }
            )
        }))
    }

}
