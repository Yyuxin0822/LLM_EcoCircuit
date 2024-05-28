import { CustomNode } from "./CustomNode.js";
import { CustomFlowline } from "./CustomFlowline.js";
const customprompt = document.getElementById('customprompt');
export class MarqueeTool {
    constructor(container) {
        this.SelectionBox = class {
            constructor(container, parent) {
                this.container = container;
                this.parent = parent;
                this.boxElement = document.createElement('div');
                this.boxElement.classList = "inSelBox";
                this.boxElement.style.display = 'none';
                this.container.appendChild(this.boxElement);
                this.isActive = false;
                this.selectionRect;
            }
            start(x, y) {
                this.isActive = true;
                this.initialX = x;
                this.initialY = y;
                this.updatePosition(x, y, 0, 0);
                this.boxElement.style.display = 'block';
            }
            update(x, y) {
                const width = Math.abs(x - this.initialX);
                const height = Math.abs(y - this.initialY);
                const left = (x < this.initialX) ? x : this.initialX;
                const top = (y < this.initialY) ? y : this.initialY;
                this.updatePosition(left, top, width, height);
                this.selectionRect = this.boxElement.getBoundingClientRect();
            }
            end() {
                this.isActive = false;
                this.boxElement.style.display = 'none';
            }
            updatePosition(x, y, width, height) {
                this.boxElement.style.left = `${x}px`;
                this.boxElement.style.top = `${y}px`;
                this.boxElement.style.width = `${width}px`;
                this.boxElement.style.height = `${height}px`;
            }
            remove() {
                this.boxElement.remove();
            }
        };
        this.SelectedBox = class {
            constructor(container, selectionRect) {
                this.container = container;
                this.selectionRect = selectionRect;
                this.displayRect = {};
                this.selectedElements = [];
                this.selectedObjs = [];
                this.boxElement = document.createElement('div');
                this.boxElement.style.display = 'none';
                this.boxElement.classList = "selectedBox";
                this.container.appendChild(this.boxElement);
            }
            display() {
                this.selectedElements = this.getElementsWithinSelection();
                if (this.selectedElements.length === 0) {
                    return;
                }
                this.selectedObjs = MarqueeTool.elementsToObjs(this.selectedElements);
                this.selectElementsToSelect();
                this.displayRect = this.calculateBoundingBox(this.selectedElements);
                this.boxElement.style.left = `${this.displayRect.left}px`;
                this.boxElement.style.top = `${this.displayRect.top}px`;
                this.boxElement.style.width = `${this.displayRect.width}px`;
                this.boxElement.style.height = `${this.displayRect.height}px`;
                this.boxElement.style.transform = 'translate(0, 0)';
                this.boxElement.style.display = 'block';
                this.moveToSelectedBox(this.selectedObjs);
                this._draggable = new PlainDraggable(this.boxElement, {
                    onMove: CustomFlowline.fixLine,
                    containment: { left: 0, top: 0, width: 12000, height: 12000 },
                    autoScroll: true,
                });
            }
            hide() {
                if (this.selectedObjs.length === 0)
                    return;
                this.moveToContainer(this.selectedObjs);
                this.boxElement.style.display = 'none';
            }
            getElementsWithinSelection() {
                if (!this.selectionRect) {
                    return [];
                }
                ;
                let elements = Array.from(this.container.querySelectorAll(".node, .input-identifier, .output-identifier, .customImage"));
                return elements.filter(element => {
                    const rect = element.getBoundingClientRect();
                    return !(rect.right < this.selectionRect.left ||
                        rect.left > this.selectionRect.right ||
                        rect.bottom < this.selectionRect.top ||
                        rect.top > this.selectionRect.bottom);
                });
            }
            calculateBoundingBox() {
                if (this.selectedElements.length === 0) {
                    return {};
                }
                ;
                let offsetRect = this.container.getBoundingClientRect();
                const rects = this.selectedElements.map(element => element.getBoundingClientRect());
                const left = Math.min(...rects.map(rect => rect.left));
                const top = Math.min(...rects.map(rect => rect.top));
                const right = Math.max(...rects.map(rect => rect.right));
                const bottom = Math.max(...rects.map(rect => rect.bottom));
                this.displayRect = {
                    left: left - offsetRect.left,
                    top: top - offsetRect.top,
                    width: right - left,
                    height: bottom - top
                };
                return this.displayRect;
            }
            moveToSelectedBox(selectedObjs) {
                let customevent = new CustomEvent('marquee');
                customprompt.dispatchEvent(customevent);
                selectedObjs.forEach(obj => {
                    if (obj instanceof CustomNode) {
                        let newobj = obj.copyTo(this.boxElement, true);
                        newobj.nodeX = parseFloat(obj.node.style.left) - parseFloat(this.boxElement.style.left);
                        newobj.nodeY = parseFloat(obj.node.style.top) - parseFloat(this.boxElement.style.top);
                        let translate1 = parseTranslate(obj.node.style.transform);
                        let translate2 = parseTranslate(this.boxElement.style.transform);
                        newobj.nodeTransform = `translate(${translate1.x - translate2.x}px, ${translate1.y - translate2.y}px)`;
                        newobj.draggable.disabled = true;
                        newobj.node.pointerEvents = 'none';
                        selectedObjs[selectedObjs.indexOf(obj)] = newobj;
                    }
                });
                customprompt.dispatchEvent(customevent);
            }
            moveToContainer(selectedObjs) {
                let customevent = new CustomEvent('marquee');
                customprompt.dispatchEvent(customevent);
                if (selectedObjs.length === 0)
                    return;
                selectedObjs.forEach(obj => {
                    if (obj instanceof CustomNode) {
                        let newobj = obj.copyTo(this.container, true);
                        newobj.nodeX = parseFloat(obj.node.style.left) + parseFloat(this.boxElement.style.left);
                        newobj.nodeY = parseFloat(obj.node.style.top) + parseFloat(this.boxElement.style.top);
                        let translate1 = parseTranslate(obj.node.style.transform);
                        let translate2 = parseTranslate(this.boxElement.style.transform);
                        newobj.nodeTransform = `translate(${translate1.x + translate2.x}px, ${translate1.y + translate2.y}px)`;
                        newobj.node.pointerEvents = 'auto';
                        selectedObjs[selectedObjs.indexOf(obj)] = newobj;
                        newobj.draggable.disabled = false;
                    }
                });
                customprompt.dispatchEvent(customevent);
            }
            selectElementsToSelect() {
                this.selectedObjs.forEach(obj => {
                    if (obj.select) {
                        obj.select();
                    }
                });
            }
            unselectAllSelectedElements() {
                this.selectedObjs.forEach(obj => {
                    if (obj.unselect) {
                        obj.unselect();
                    }
                });
                this.selectedElements = [];
            }
            remove() {
                this.boxElement.remove();
            }
        };
        this.container = container;
        this.selectionBox = new this.SelectionBox(this.container, this);
        this.selectedBox = new this.SelectedBox(this.container);
        this.handlers = {
            handleMouseDown: this.handleMouseDown.bind(this),
            handleMouseMove: this.handleMouseMove.bind(this),
            handleMouseUp: this.handleMouseUp.bind(this)
        };
        this.attachEventListeners();
    }
    attachEventListeners() {
        this.container.addEventListener('mousedown', this.handlers.handleMouseDown);
        this.container.addEventListener('mousemove', this.handlers.handleMouseMove);
        this.container.addEventListener('mouseup', this.handlers.handleMouseUp);
    }
    detachEventListeners() {
        this.container.removeEventListener('mousedown', this.handlers.handleMouseDown);
        this.container.removeEventListener('mousemove', this.handlers.handleMouseMove);
        this.container.removeEventListener('mouseup', this.handlers.handleMouseUp);
    }
    remove() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        if (this.selectedBox) {
            this.selectedBox.hide();
            this.selectedBox.remove();
            this.selectedBox = null;
        }
        this.detachEventListeners();
        console.log('MarqueeTool removed');
    }
    handleMouseDown(event) {
        console.log('mouse down');
        const rect = this.container.getBoundingClientRect();
        const startX = event.clientX - rect.left;
        const startY = event.clientY - rect.top;
        if (this.selectedBox) {
            this.selectedBox.hide();
            this.selectedBox.remove();
            this.selectedBox = null;
        }
        if (this.selectionBox) {
            this.selectionBox.end();
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        this.selectionBox = new this.SelectionBox(this.container, this);
        this.selectionBox.start(startX, startY);
    }
    handleMouseMove(event) {
        console.log('mouse move');
        if (this.selectedBox && event.target === this.selectedBox.boxElement)
            return;
        if (this.selectionBox && !this.selectionBox.isActive)
            return;
        if (this.selectionBox && event.target === customprompt) {
            let rect = this.container.getBoundingClientRect();
            let currentX = event.clientX - rect.left;
            let currentY = event.clientY - rect.top;
            this.selectionBox.update(currentX, currentY);
        }
    }
    handleMouseUp(event) {
        console.log('mouse up');
        if (this.selectedBox && event.target === this.selectedBox.boxElement) {
            return;
        }
        let selectionRect;
        if (this.selectionBox) {
            selectionRect = this.selectionBox.selectionRect;
            this.selectionBox.end();
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        if (this.selectedBox) {
            this.selectedBox.hide();
            this.selectedBox.remove();
            this.selectedBox = null;
        }
        this.selectedBox = new this.SelectedBox(this.container, selectionRect);
        this.selectedBox.display();
    }
    static elementsToObjs(elementsList) {
        if (!elementsList) {
            return [];
        }
        ;
        let objList = [];
        elementsList.forEach(element => {
            if (CustomNode.getNodeObjbyNode(element)) {
                objList.push(CustomNode.getNodeObjbyNode(element));
            }
        });
        return objList;
    }
}
customprompt.addEventListener('marquee', CustomFlowline.fixLine, false);
const customPromptRect = customprompt.getBoundingClientRect();
const img = document.getElementById("customImage");
function parseTranslate(transformString) {
    const regex = /translate\(([\d\-.]+)px, ([\d\-.]+)px\)/i;
    const match = transformString.match(regex);
    return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
}
