/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 *                       Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */

import {VisualMoveInput} from "./VisualMoveInput.js"
import {BORDER_TYPE, COLOR, INPUT_EVENT_TYPE} from "./Board.js"
import {EXTENSION_POINT} from "./Extension.js"

export class BoardView {

    constructor(board) {
        this.board = board
        this.rows = board.rows
        this.columns = board.columns
        this.moveInput = new VisualMoveInput(this,
            this.moveInputStartedCallback.bind(this),
            this.validateMoveInputCallback.bind(this),
            this.moveInputCanceledCallback.bind(this)
        )
        this.loadSVGImages()
        this.context = document.createElement("div")
        this.board.context.appendChild(this.context)
        if (board.props.responsive) {
            if (typeof ResizeObserver !== "undefined") {
                this.resizeObserver = new ResizeObserver(() => {
                    this.handleResize()
                })
                this.resizeObserver.observe(this.board.context)
            } else {
                this.resizeListener = this.handleResize.bind(this)
                window.addEventListener("resize", this.resizeListener)
            }
        }

        this.pointerDownListener = this.pointerDownHandler.bind(this)
        this.context.addEventListener("mousedown", this.pointerDownListener)
        this.context.addEventListener("touchstart", this.pointerDownListener)

        this.createSvgAndGroups()
        this.updateMetrics()
        this.handleResize()
        this.redrawBoard()
    }

    pointerDownHandler(e) {
        this.moveInput.onPointerDown(e)
    }

    destroy() {
        this.moveInput.destroy()
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(this.board.context)
        }
        if (this.resizeListener) {
            window.removeEventListener("resize", this.resizeListener)
        }
        this.board.context.removeEventListener("mousedown", this.pointerDownListener)
        this.board.context.removeEventListener("touchstart", this.pointerDownListener)
        Svg.removeElement(this.svg)
    }

    // Sprite //
    loadSVG(filename, id)
    {
        if (document.getElementById(id))
        {
            return;
        }
        let img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        img.id = id;
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', filename);
        document.body.appendChild(img);
    }

    loadSVGImages() {
        const path = this.board.props.sprite.url
        this.loadSVG(path + '/wp.svg', 'wp')
        this.loadSVG(path + '/bp.svg', 'bp')
        this.loadSVG(path + '/wq.svg', 'wq')
        this.loadSVG(path + '/bq.svg', 'bq')
        this.loadSVG(path + '/circle.svg', 'markerCircle')
        this.loadSVG(path + '/dot.svg', 'markerDot')
        this.loadSVG(path + '/frame.svg', 'markerFrame')
        this.loadSVG(path + '/square.svg', 'markerSquare')
    }

    clearCache() {
        const wrapperId = "chessboardSpriteCache"
        document.getElementById(wrapperId).remove()
    }

    createSvgAndGroups() {
        this.svg = Svg.createSvg(this.context)
        // let description = document.createElement("description")
        // description.innerText = "Chessboard"
        // description.id = "svg-description"
        // this.svg.appendChild(description)
        let cssClass = this.board.props.style.cssClass ? this.board.props.style.cssClass : "default"
        this.svg.setAttribute("class", "cm-chessboard border-type-" + this.board.props.style.borderType + " " + cssClass)
        // this.svg.setAttribute("aria-describedby", "svg-description")
        this.svg.setAttribute("role", "img")
        this.updateMetrics()
        this.boardGroup = Svg.addElement(this.svg, "g", {class: "board"})
        this.coordinatesGroup = Svg.addElement(this.svg, "g", {class: "coordinates"})
        this.markersLayer = Svg.addElement(this.svg, "g", {class: "markers-layer"})
        this.markersGroup = Svg.addElement(this.markersLayer, "g", {class: "markers"})
        this.piecesLayer = Svg.addElement(this.svg, "g", {class: "pieces-layer"})
        this.piecesGroup = Svg.addElement(this.piecesLayer, "g", {class: "pieces"})
        this.markersTopLayer = Svg.addElement(this.svg, "g", {class: "markers-top-layer"})
        // this.markersTopGroup = Svg.addElement(this.markersTopLayer, "g", {class: "markers-top"})
    }

    updateMetrics() {
        this.width = this.context.clientWidth
        this.height = this.context.clientWidth * (this.board.props.style.aspectRatio || 1)
        if (this.board.props.style.borderType === BORDER_TYPE.frame) {
            this.borderSize = this.width / 25
        } else if (this.board.props.style.borderType === BORDER_TYPE.thin) {
            this.borderSize = this.width / 320
        } else {
            this.borderSize = 0
        }
        this.innerWidth = this.width - 2 * this.borderSize
        this.innerHeight = this.height - 2 * this.borderSize
        this.squareWidth = this.innerWidth / this.columns
        this.squareHeight = this.innerHeight / this.rows
        this.scalingX = this.squareWidth / this.board.props.sprite.size
        this.scalingY = this.squareHeight / this.board.props.sprite.size
        this.pieceXTranslate = (this.squareWidth / 2 - this.board.props.sprite.size * this.scalingY / 2)
    }

    handleResize() {
        this.context.style.width = this.board.context.clientWidth + "px"
        this.context.style.height = (this.board.context.clientWidth * this.board.props.style.aspectRatio) + "px"
        if (this.board.context.clientWidth !== this.width ||
            this.board.context.clientHeight !== this.height) {
            this.updateMetrics()
            this.redrawBoard()
            this.redrawPieces()
        }
        this.svg.setAttribute("width", "100%") // safari bugfix
        this.svg.setAttribute("height", "100%")
    }

    redrawBoard() {
        this.redrawSquares()
        this.drawCoordinatesDraughts()
        this.drawMarkers()
        this.board.invokeExtensionPoints(EXTENSION_POINT.redrawBoard)
        this.visualizeInputState()
    }

    // Board //

    redrawSquares() {
        while (this.boardGroup.firstChild) {
            this.boardGroup.removeChild(this.boardGroup.lastChild)
        }

        let boardBorder = Svg.addElement(this.boardGroup, "rect", {width: this.width, height: this.height})
        boardBorder.setAttribute("class", "border")
        if (this.board.props.style.borderType === BORDER_TYPE.frame) {
            const innerPos = this.borderSize
            let borderInner = Svg.addElement(this.boardGroup, "rect", {
                x: innerPos,
                y: innerPos,
                width: this.width - innerPos * 2,
                height: this.height - innerPos * 2
            })
            borderInner.setAttribute("class", "border-inner")
        }
        let N = this.rows * this.columns
        for (let i = 0; i < N; i++) {
            const index = this.board.orientation === COLOR.white ? i : N - i - 1
            const squareColor = (Math.floor(index / this.columns) % 2 === index % 2) ? 'black' : 'white'
            const fieldClass = `square ${squareColor}`
            const point = this.indexToPoint(index)
            const squareRect = Svg.addElement(this.boardGroup, "rect", {
                x: point.x, y: point.y, width: this.squareWidth, height: this.squareHeight
            })
            squareRect.setAttribute("class", fieldClass)
            squareRect.setAttribute("data-index", "" + index)
        }
    }

    drawCoordinates() {
        if (!this.board.props.style.showCoordinates) {
            return
        }
        while (this.coordinatesGroup.firstChild) {
            this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild)
        }
        const inline = this.board.props.style.borderType !== BORDER_TYPE.frame
        for (let column = 0; column < this.columns; column++) {
            let x = this.borderSize + (17 + this.board.props.sprite.size * column) * this.scalingX
            let y = this.height - this.scalingY * 3.5
            let cssClass = "coordinate file"
            if (inline) {
                x = x + this.scalingX * 15.5
                cssClass += column % 2 ? " white" : " black"
            }
            const textElement = Svg.addElement(this.coordinatesGroup, "text", {
                class: cssClass,
                x: x,
                y: y,
                style: `font-size: ${this.scalingY * 10}px`
            })
            if (this.board.orientation === COLOR.white) {
                textElement.textContent = String.fromCharCode(97 + column)
            } else {
                textElement.textContent = String.fromCharCode(104 - column)
            }
        }
        for (let row = 0; row < this.rows; row++) {
            let x = (this.borderSize / 3.7)
            let y = this.borderSize + 25 * this.scalingY + row * this.squareHeight
            let cssClass = "coordinate rank"
            if (inline) {
                cssClass += row % 2 ? " black" : " white"
                if (this.board.props.style.borderType === BORDER_TYPE.frame) {
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
            if (this.board.orientation === COLOR.white) {
                textElement.textContent = "" + (this.rows - row)
            } else {
                textElement.textContent = "" + (1 + row)
            }
        }
    }

    drawCoordinate(row, column, f, color, inline, is_left, is_top) {
        let text = "" + f
        let x = is_left ?
            (this.borderSize / 3.7) + (this.board.props.sprite.size * column) * this.scalingX :
            this.borderSize + (25 + this.board.props.sprite.size * column) * this.scalingX

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
            if (this.board.props.style.borderType === BORDER_TYPE.frame) {
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

    drawCoordinatesDraughts() {
        let color = " black"
        if (!this.board.props.style.showCoordinates) {
            color = " white"  // draw the coordinates in the background color; TODO: avoid the need to redraw like this
            // return
        }
        while (this.coordinatesGroup.firstChild) {
            this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild)
        }
        const inline = this.board.props.style.borderType !== BORDER_TYPE.frame
        let is_left = false
        let is_top = true
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                if (!this.board.state.isNonPlayingField(row, column))
                {
                    let f = this.board.state.rc2f(row, column)
                    this.drawCoordinate(row, column, f, color, inline, is_left, is_top)
                }
            }
        }
    }

    // Pieces //

    redrawPieces(squares = this.board.state.squares) {
        const childNodes = Array.from(this.piecesGroup.childNodes)
        let N = this.rows * this.columns
        for (let i = 0; i < N; i++) {
            const pieceName = squares[i]
            if (pieceName) {
                this.drawPieceOnSquare(i, pieceName)
            }
        }
        for (const childNode of childNodes) {
            this.piecesGroup.removeChild(childNode)
        }
    }

    drawPiece(parentGroup, pieceName, point) {
        const pieceGroup = Svg.addElement(parentGroup, "g", {})
        pieceGroup.setAttribute("data-piece", pieceName)
        pieceGroup.setAttribute("class", "piece-group")
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        pieceGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.board.props.sprite.cache ? "" : this.board.props.sprite.url
        const pieceUse = Svg.addElement(pieceGroup, "use", {
            href: `${spriteUrl}#${pieceName}`,
            class: "piece"
        })
        const transformScale = (this.svg.createSVGTransform())
        transformScale.setScale(this.scalingY, this.scalingY)
        pieceUse.transform.baseVal.appendItem(transformScale)
        const transformTranslate = (this.svg.createSVGTransform())
        transformTranslate.setTranslate(this.pieceXTranslate, 0)
        pieceUse.transform.baseVal.appendItem(transformTranslate)
        return pieceGroup
    }

    drawPieceOnSquare(index, pieceName) {
        const point = this.indexToPoint(index)
        const pieceGroup = this.drawPiece(this.piecesGroup, pieceName, point)
        pieceGroup.setAttribute("data-index", index)
        return pieceGroup
    }

    setPieceVisibility(index, visible = true) {
        const piece = this.getPieceElement(index)
        if(piece) {
            if (visible) {
                piece.setAttribute("visibility", "visible")
            } else {
                piece.setAttribute("visibility", "hidden")
            }
        } else {
            console.warn("no piece on", square)
        }
    }

    getPieceElement(index) {
        const piece = this.piecesGroup.querySelector(`g[data-index='${index}']`)
        if (!piece) {
            console.warn("no piece on", square)
        }
        return piece
    }

    // Markers //

    drawMarkers() {
        while (this.markersGroup.firstChild) {
            this.markersGroup.removeChild(this.markersGroup.firstChild)
        }
        this.board.markers.forEach((marker) => {
                this.drawMarker(marker)
            }
        )
    }

    drawMarker(marker) {
        // console.log("drawMarker", marker)
        const markerGroup = Svg.addElement(this.markersGroup, "g")
        markerGroup.setAttribute("data-index", marker.index)
        const point = this.indexToPoint(marker.index)
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        markerGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.board.props.sprite.cache ? "" : this.board.props.sprite.url
        const markerUse = Svg.addElement(markerGroup, "use",
            {href: `${spriteUrl}#${marker.type.slice}`, class: "marker " + marker.type.class})
        const transformScale = (this.svg.createSVGTransform())
        transformScale.setScale(this.scalingX, this.scalingY)
        markerUse.transform.baseVal.appendItem(transformScale)
        return markerGroup
    }

    // enable and disable move input //

    enableMoveInput(eventHandler, color = undefined) {
        if (color === COLOR.white) {
            this.board.inputWhiteEnabled = true
        } else if (color === COLOR.black) {
            this.board.inputBlackEnabled = true
        } else {
            this.board.inputWhiteEnabled = true
            this.board.inputBlackEnabled = true
        }
        this.board.inputEnabled = true
        this.moveInputCallback = eventHandler
        this.board.invokeExtensionPoints(EXTENSION_POINT.moveInputToggled, {enabled: true, color: color})
        this.visualizeInputState()
    }

    disableMoveInput() {
        this.board.inputWhiteEnabled = false
        this.board.inputBlackEnabled = false
        this.board.inputEnabled = false
        this.moveInputCallback = undefined
        this.board.invokeExtensionPoints(EXTENSION_POINT.moveInputToggled, {enabled: false})
        this.visualizeInputState()
    }

    // callbacks //

    moveInputStartedCallback(index) {
        const data = {
            board: this.board,
            type: INPUT_EVENT_TYPE.moveInputStarted,
            index: index,
            piece: this.board.getPieceIndex(index)
        }
        if (this.moveInputCallback) {
            // the "oldschool" move input validator
            data.moveInputCallbackResult =  this.moveInputCallback(data)
        }
        // the new extension points
        const extensionPointsResult = this.board.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        // validates, when moveInputCallbackResult and extensionPointsResult are true
        return !(extensionPointsResult === false || !data.moveInputCallbackResult);
    }

    validateMoveInputCallback(indexFrom, indexTo) {
        const data = {
            board: this.board,
            type: INPUT_EVENT_TYPE.moveDone,
            indexFrom: indexFrom,
            indexTo: indexTo,
            piece: this.board.getPieceIndex(indexFrom)
        }
        if (this.moveInputCallback) {
            // the "oldschool" move input validator
            data.moveInputCallbackResult = this.moveInputCallback(data)
        }
        // the new extension points
        const extensionPointsResult = this.board.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        // validates, when moveInputCallbackResult and extensionPointsResult are true
        return !(extensionPointsResult === false || !data.moveInputCallbackResult);
    }

    moveInputCanceledCallback(reason, indexFrom, indexTo) {
        const data = {
            board: this.board,
            type: INPUT_EVENT_TYPE.moveCanceled,
            reason: reason,
            indexFrom: indexFrom,
            indexTo: indexTo
        }
        this.board.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        if (this.moveInputCallback) {
            this.moveInputCallback(data)
        }
    }

    // Helpers //

    visualizeInputState() {
        if (this.board.state) { // fix https://github.com/shaack/cm-chessboard/issues/47
            if (this.board.inputWhiteEnabled || this.board.inputBlackEnabled || this.board.squareSelectEnabled) {
                this.boardGroup.setAttribute("class", "board input-enabled")
            } else {
                this.boardGroup.setAttribute("class", "board")
            }
        }
    }

    indexToPoint(index) {
        let x, y
        if (this.board.orientation === COLOR.white) {
            x = this.borderSize + (index % this.columns) * this.squareWidth
            y = this.borderSize + (this.rows - 1 - Math.floor(index / this.columns)) * this.squareHeight
        } else {
            x = this.borderSize + (this.columns - 1 - index % this.columns) * this.squareWidth
            y = this.borderSize + (Math.floor(index / this.columns)) * this.squareHeight
        }
        return {x: x, y: y}
    }
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

export class Svg {

    /**
     * create the Svg in the HTML DOM
     * @param containerElement
     * @returns {Element}
     */
    static createSvg(containerElement = undefined) {
        let svg = document.createElementNS(SVG_NAMESPACE, "svg")
        if (containerElement) {
            svg.setAttribute("width", "100%")
            svg.setAttribute("height", "100%")
            containerElement.appendChild(svg)
        }
        return svg
    }

    /**
     * Add an Element to a SVG DOM
     * @param parent
     * @param name
     * @param attributes
     * @param sibling
     * @returns {Element}
     */
    static addElement(parent, name, attributes, sibling = undefined) {
        let element = document.createElementNS(SVG_NAMESPACE, name)
        if (name === "use") {
            attributes["xlink:href"] = attributes["href"] // fix for safari
        }
        for (let attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                if (attribute.indexOf(":") !== -1) {
                    const value = attribute.split(":")
                    element.setAttributeNS("http://www.w3.org/1999/" + value[0], value[1], attributes[attribute])
                } else {
                    element.setAttribute(attribute, attributes[attribute])
                }
            }
        }
        if (sibling !== undefined) {
        parent.appendChild(element)
        } else {
          parent.insertBefore(element, sibling)
        }
        return element
    }

    /**
     * Remove an Element from a SVG DOM
     * @param element
     */
    static removeElement(element) {
        if(element.parentNode) {
        element.parentNode.removeChild(element)
        } else {
            console.warn(element, "without parentNode")
        }
    }

}

export class DomUtils {
    static delegate(element, eventName, selector, handler) {
        const eventListener = function (event) {
            let target = event.target
            while (target && target !== this) {
                if (target.matches(selector)) {
                    handler.call(target, event)
                }
                target = target.parentNode
            }
        }
        element.addEventListener(eventName, eventListener)
        return {
            remove: function () {
                element.removeEventListener(eventName, eventListener)
            }
        }
    }
}
