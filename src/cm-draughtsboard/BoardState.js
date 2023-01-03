/**
 * Authors and copyright: Stefan Haack (https://shaack.com)
 *                        Wieger Wesselink (https://10x10.org)
 * Repository: https://github.com/wiegerw/cm-draughtsboard
 * License: MIT, see file 'LICENSE'
 */
import {createTask} from "./Position.js"

export class BoardState {

    constructor(position) {
        this.position = position
        this.orientation = undefined
        this.markers = []
        this.inputWhiteEnabled = false
        this.inputBlackEnabled = false
        this.inputEnabled = false
        this.squareSelectEnabled = false
        this.extensionPoints = {}
        this.moveInputProcess = createTask().resolve()
    }

    addMarker(index, type) {
        this.markers.push({index: index, type: type})
    }

    removeMarkers(index = undefined, type = undefined) {
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
