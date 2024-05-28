import { CustomFlowline } from './CustomFlowline.js';
import { PromptNode } from '../generateplayground/prompt/PromptNode.js';
export class CustomNode extends PromptNode {
    constructor(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, container) {
        super(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, container);
        this._nodeX = nodeX;
        this._nodeY = nodeY;
        this._nodeDragState = false;
        if (PromptNode.myNodes[PromptNode.myNodes.length - 1] instanceof CustomNode) {
            PromptNode.myNodes.pop();
        }
        CustomNode.myCustomNodes.push(this);
    }
    init() {
        super.init();
        this.newNode.style.left = this._nodeX + 'px';
        this.newNode.style.top = this._nodeY + 'px';
        this._draggable = new PlainDraggable(this.newNode, {
            onMove: CustomFlowline.fixLine,
            containment: {
                left: 0,
                top: 0,
                width: 12000,
                height: 12000
            },
            autoScroll: true
        });
    }
    attachEventListeners() {
    }
    handleClick() {
    }
    handleContextMenuClick(e) {
    }
    get nodeY() {
        return this._nodeY;
    }
    set nodeY(number) {
        this._nodeY = number;
        if (this.newNode) {
            this.newNode.style.top = number + 'px';
        }
    }
    get draggable() {
        return this._draggable;
    }
    get nodeDragState() {
        return this.nodeDragState;
    }
    set nodeDragState(state) {
        this._nodeDragState = state;
    }
    setIdentifier(identifierClass) {
    }
    set dropdown(dropdown) {
    }
    get associatedLinesNodeasInput() {
        return CustomFlowline.myCustomLines.filter(line => line.start === this.newNode);
    }
    get associatedLinesNodeasOutput() {
        return CustomFlowline.myCustomLines.filter(line => line.end === this.newNode);
    }
    static isNodeExists(nodeContent, x, y, system, transform) {
        let node = CustomNode.getNodebyInfo(nodeContent, x, y, system, transform);
        if (node != null && node != undefined) {
            return true;
        }
        return false;
    }
    static getNodebyInfo(nodeContent, x, y, system, transform) {
        let node = CustomNode.myCustomNodes.find(node => node.nodeContent === nodeContent);
        if (node != null && node != undefined) {
        }
        return CustomNode.myCustomNodes.find(node => node.nodeContent === nodeContent && node.nodeX === x && node.nodeY === y && node.nodeSys === system && node.nodeTransform === transform);
    }
    static getNodeById(id) {
    }
    static getNodeObjbyNode(node) {
        return CustomNode.myCustomNodes.find(nodeItem => nodeItem.newNode === node);
    }
    delete() {
        this.associatedLinesNodeasInput.forEach(line => line.remove());
        this.associatedLinesNodeasOutput.forEach(line => line.remove());
        this.newNode.remove();
        let index = CustomNode.myCustomNodes.indexOf(this);
        if (index > -1) {
            CustomNode.myCustomNodes.splice(index, 1);
        }
    }
    toJSONObj() {
        return { [this._nodeContent]: [[this._nodeX, this._nodeY], this._nodeSys, this._nodeTransform] };
    }
    copyTo(newcontainer, delcurrent = false) {
        let newNodeItem = new CustomNode(this.nodeContent, this.nodeX, this.nodeY, this.nodeTransform, this.nodeRGB, this.nodeSys, newcontainer);
        if (this._inputIdentifier) {
            newNodeItem.setIdentifier(this._inputIdentifier);
        }
        if (this._outputIdentifier) {
            newNodeItem.setIdentifier(this._outputIdentifier);
        }
        if (this.associatedLinesNodeasInput) {
            this.associatedLinesNodeasInput.forEach(line => new CustomFlowline(newNodeItem.node, line.end));
        }
        if (this.associatedLinesNodeasOutput) {
            this.associatedLinesNodeasOutput.forEach(line => new CustomFlowline(line.start, newNodeItem.node));
        }
        if (delcurrent) {
            this.delete();
            if (this.associatedLinesNodeasInput) {
                this.associatedLinesNodeasInput.forEach(line => line.remove());
            }
            if (this.associatedLinesNodeasOutput) {
                this.associatedLinesNodeasOutput.forEach(line => line.remove());
            }
        }
        return newNodeItem;
    }
    setNodeDragState() {
        let startX = 0;
        let startY = 0;
        let moved = false;
        let mouseMoveHandler;
        this.nodeWrapper.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            moved = false;
            mouseMoveHandler = (moveEvent) => {
                let diffX = Math.abs(moveEvent.clientX - startX);
                let diffY = Math.abs(moveEvent.clientY - startY);
                if (diffX > 5 || diffY > 5) {
                    moved = true;
                }
            };
            document.addEventListener('mousemove', mouseMoveHandler);
        });
        this.nodeWrapper.addEventListener('mouseup', (e) => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            if (moved) {
                console.log('Drag Event');
                this.nodeDragState = true;
            }
            else {
                console.log('Click Event');
                this.nodeDragState = false;
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (e.target !== this.nodeWrapper && moved) {
                document.removeEventListener('mousemove', mouseMoveHandler);
                this.nodeDragState = true;
                moved = false;
            }
        });
    }
    initSelEventListener() {
        this.nodeWrapper.addEventListener('click', (e) => {
            if (!customNodeSel)
                return;
            if (this.nodeDragState)
                return;
            this.newNode.classList.toggle('node-selected');
            this.newNode.classList.toggle('node-unselected');
        });
    }
    static addCustomNode(event) {
        let customprompt = document.getElementById('customprompt');
        let newNode = new CustomNode("", event.clientX, event.clientY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN", customprompt);
        newNode.node.id = 'nodecustom';
        newNode.nodeWrapper.contentEditable = true;
        newNode.nodeWrapper.focus();
        newNode.nodeWrapper.addEventListener('keydown', function (event) {
            if (event.key === "Enter" || event.keyCode === 13) {
                event.preventDefault();
                newNode.nodeWrapper.blur();
            }
        });
        return newNode;
    }
    static getSelectedNodes() {
        return CustomNode.myCustomNodes.filter(node => node.newNode.classList.contains('node-selected'));
    }
    static getAllNodes() {
        return CustomNode.myCustomNodes;
    }
}
CustomNode.myCustomNodes = [];
CustomNode.customNodeSel = true;
