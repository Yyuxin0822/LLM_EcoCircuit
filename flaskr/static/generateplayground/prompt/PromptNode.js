import { Prompt } from './Prompt.js';
import { PromptIdentifier } from './PromptIdentifier.js';
import { PromptNodeDrpDwn } from './PromptNodeDrpDwn.js';
export class PromptNode {
    constructor(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, container) {
        if (!container) {
            throw new Error("Container for nodes is undefined.");
        }
        this._container = container;
        this._inputIdentifier = null;
        this._outputIdentifier = null;
        this.PromptObj = Prompt.getPromptItembyPrompt(this._container);
        if (this.PromptObj) {
            this.PromptObj.promptNodes.push(this);
        }
        PromptNode.myNodes.push(this);
        this._nodeContent = nodeContent;
        this._nodeX = nodeX;
        this._nodeY = nodeY;
        this._nodeTransform = nodeTransform;
        this._nodeRGB = nodeRGB;
        this._nodeSys = nodeSys;
        this.selected = false;
        this.init();
        this.attachEventListeners();
    }
    init() {
        this.newNode = document.createElement("div");
        this.newNode.classList.add('node');
        this.newNode.id = 'node' + validId(this._nodeContent);
        this.newNode.style.top = this._nodeY * 1.5 + 'rem';
        this.newNode.style.transform = this._nodeTransform;
        this.newNode.style.backgroundColor = this._nodeRGB;
        this._nodeWrapper = document.createElement("div");
        this._nodeWrapper.classList.add('node-wrapper', 'card-node');
        this._nodeWrapper.innerHTML = this._nodeContent;
        this.newNode.appendChild(this._nodeWrapper);
        this.adjustFontSize();
        if (this.PromptObj) {
            let col = this._container.querySelector('#col' + validId(this._nodeX.toString()));
            if (!col) {
                col = document.createElement('div');
                col.classList.add('col');
                col.id = 'col' + validId(this._nodeX.toString());
                let PromptObj = Prompt.getPromptItembyPrompt(this._container);
                col.style.left = PromptObj.convertNodeXtoAbs(this._nodeX) + 'rem';
                console.log(col.style.left);
                this._container.appendChild(col);
            }
            col.appendChild(this.newNode);
            if (this._nodeX % 1 !== 0) {
                col.style.width = '15rem';
            }
        }
    }
    adjustFontSize() {
        let nodeWrapper = this._nodeWrapper;
        let node = this.newNode;
        function updateFontSize(nodeWrapper, fontSize) {
            nodeWrapper.style.fontSize = `${fontSize}px`;
        }
        function isOverflowingX(nodeWrapper) {
            return parseFloat(window.getComputedStyle(nodeWrapper).width) > (parseFloat(window.getComputedStyle(node).width) - parseFloat(window.getComputedStyle(node).paddingLeft) - parseFloat(window.getComputedStyle(node).paddingRight));
        }
        function isOverflowingY(nodeWrapper) {
            return parseFloat(window.getComputedStyle(nodeWrapper).height) > (parseFloat(window.getComputedStyle(node).width) + 4);
        }
        function adjust(node) {
            let fontSize = 14;
            updateFontSize(nodeWrapper, fontSize);
            while (isOverflowingX(nodeWrapper) && fontSize > 12) {
                fontSize--;
                updateFontSize(nodeWrapper, fontSize);
            }
            if (fontSize === 12 && isOverflowingX(nodeWrapper)) {
                nodeWrapper.style.whiteSpace = 'normal';
                nodeWrapper.style.lineHeight = '1.0';
                node.style.alignItems = 'flex-start';
                node.style.overflow = 'hidden';
            }
        }
        if (document.readyState === 'complete') {
            adjust(node);
        }
        else {
            document.addEventListener('DOMContentLoaded', () => { adjust(node); });
        }
    }
    attachEventListeners() {
        this.node.addEventListener('contextmenu', this.handleContextMenuClick.bind(this));
        this.nodeWrapper.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('nodeTabClick', event => { this.nodeWrapper.style.cursor = 'pointer'; });
        document.addEventListener('disableNodeTabClick', event => { this.nodeWrapper.style.cursor = 'default'; });
        document.addEventListener('flowlineTabClick', event => {
            if (this.inputIdentifier) {
                this.inputIdentifier.identifier.style.cursor = 'pointer';
            }
            if (this.outputIdentifier) {
                this.outputIdentifier.identifier.style.cursor = 'pointer';
            }
        });
        document.addEventListener('disableFlowlineTabClick', event => {
            if (this.inputIdentifier) {
                this.inputIdentifier.identifier.style.cursor = 'default';
            }
            if (this.outputIdentifier) {
                this.outputIdentifier.identifier.style.cursor = 'default';
            }
        });
    }
    handleClick() {
        if (!PromptNode.nodeSel)
            return;
        if (this.selected) {
            this.unselect();
        }
        else {
            this.select();
        }
    }
    handleContextMenuClick(e) {
        e.preventDefault();
        if (!PromptNodeDrpDwn.globalEnabled)
            return;
        if (this.PromptObj.focused && e.target.closest('.prompt') === this.PromptObj.prompt) {
            this._dropdown = new PromptNodeDrpDwn(this.newNode);
        }
    }
    get node() {
        return this.newNode;
    }
    set node(node) {
        this.newNode = node;
    }
    get nodeX() {
        return this._nodeX;
    }
    set nodeX(number) {
        this._nodeX = number;
        if (this.newNode) {
            this.newNode.style.left = number + 'px';
        }
    }
    get nodeY() {
        return this._nodeY;
    }
    set nodeY(number) {
        this._nodeY = number;
        if (this.newNode) {
            this.newNode.style.top = number * 1.5 + 'rem';
        }
    }
    get nodeTransform() {
        return this._nodeTransform;
    }
    set nodeTransform(transform) {
        this._nodeTransform = transform;
        if (this.newNode) {
            this.newNode.style.transform = transform;
        }
    }
    get nodeContent() {
        return this._nodeContent;
    }
    set nodeContent(name) {
        this._nodeContent = name;
        if (this.newNode) {
            this.newNode.querySelector('.node-wrapper').innerHTML = name;
        }
    }
    get nodeWrapper() {
        return this._nodeWrapper;
    }
    get inputIdentifier() {
        return this._inputIdentifier;
    }
    get outputIdentifier() {
        return this._outputIdentifier;
    }
    setIdentifier(identifierClass) {
        if (!this.newNode)
            return;
        if (identifierClass !== 'input-identifier' && identifierClass !== 'output-identifier')
            return;
        if (identifierClass === 'input-identifier') {
            if (this._inputIdentifier)
                return;
            this._inputIdentifier = new PromptIdentifier(this.newNode, identifierClass);
        }
        if (identifierClass === 'output-identifier') {
            if (this._outputIdentifier)
                return;
            this._outputIdentifier = new PromptIdentifier(this.newNode, identifierClass);
        }
    }
    rmIdentifier(identifierClass) {
        if (identifierClass === 'input-identifier') {
            if (!this._inputIdentifier)
                return;
            this._inputIdentifier.remove();
        }
        if (identifierClass === 'output-identifier') {
            if (!this._outputIdentifier)
                return;
            this._outputIdentifier.remove();
        }
    }
    get nodeRGB() {
        return this._nodeRGB;
    }
    set nodeRGB(color) {
        this._nodeRGB = color;
        if (this.newNode) {
            this.newNode.style.backgroundColor = color;
        }
    }
    get nodeSys() {
        return this._nodeSys;
    }
    set nodeSys(sys) {
        this._nodeSys = sys;
    }
    get dropdown() {
        return this._dropdown;
    }
    set dropdown(dropdown) {
        this._dropdown = dropdown;
    }
    get container() {
        return this._container;
    }
    set container(container) {
        this._container = container;
    }
    static getNodeById(id, container = document) {
        return PromptNode.myNodes.find(nodeItem => nodeItem.newNode.id === id && nodeItem.container === container);
    }
    static getNodeObjbyNode(node, container = document) {
        return PromptNode.myNodes.find(nodeItem => nodeItem.newNode === node && nodeItem.container === container);
    }
    select() {
        if (this.selected)
            return;
        this.newNode.classList?.add('node-selected');
        this.newNode.classList?.remove('node-unselected');
        let event = new CustomEvent('node-select', { detail: this });
        this.newNode.dispatchEvent(event);
        this.selected = true;
    }
    unselect() {
        if (!this.selected)
            return;
        this.newNode.classList?.remove('node-selected');
        this.newNode.classList?.add('node-unselected');
        let event = new CustomEvent('node-unselect', { detail: this });
        this.newNode.dispatchEvent(event);
        this.selected = false;
    }
    delete() {
        let startLines = this.PromptObj.getLinesWhereNodeasInput(this);
        let endLines = this.PromptObj.getLinesWhereNodeasOutput(this);
        if (startLines.length > 0) {
            startLines.forEach(line => {
                line.remove();
            });
        }
        if (endLines.length > 0) {
            endLines.forEach(line => {
                line.remove();
            });
        }
        this.newNode.remove();
        let index = PromptNode.myNodes.indexOf(this);
        if (index > -1) {
            PromptNode.myNodes.splice(index, 1);
        }
        let index1 = this.PromptObj.promptNodes.indexOf(this);
        if (index1 > -1) {
            this.PromptObj.promptNodes.splice(index1, 1);
        }
        this.PromptObj.returnInfo();
    }
    toJSONObj(abs = false) {
        if (!abs) {
            return { [this.nodeContent]: [[this.nodeX, this.nodeY], this.nodeSys, this.nodeTransform] };
        }
        else {
            let [posX, posY] = PromptNode.getnodePositionInDOM(this.newNode);
            return { [this.nodeContent]: [[posX, posY], this.nodeSys, this.nodeTransform] };
        }
    }
    static addCustomNode(event) {
        let newNode = new PromptCustomNode(event.offsetX, event.offsetY, event.target.closest('.prompt'));
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
    static rmNodeSel() {
        PromptNode.myNodes.forEach(node => {
            node.unselect();
        });
    }
    static getSelectedNodes() {
        return PromptNode.myNodes.filter(node => node.newNode.classList.contains('node-selected'));
    }
    static getAllNodes() {
        return PromptNode.myNodes;
    }
    static getnodePositionInDOM(node) {
        let x = 0;
        let y = 0;
        let nodeparent = node.closest('.prompt-frame');
        while (node) {
            x += node.offsetLeft;
            y += node.offsetTop;
            node = node.offsetParent;
            if (node === nodeparent) {
                break;
            }
        }
        return [x, y];
    }
}
PromptNode.myNodes = [];
PromptNode.nodeSel = true;
export class PromptCustomNode extends PromptNode {
    constructor(absNodeX, absNodeY, container) {
        let PromptObj = Prompt.getPromptItembyPrompt(container);
        let nodeX = PromptObj.convertAbstoNodeX(absNodeX);
        let nodeY = PromptObj.convertAbstoNodeY(absNodeY);
        console.log(nodeX, nodeY);
        let node = PromptNode.myNodes.find(node => node.nodeX === nodeX && node.nodeY === nodeY && node.container === container);
        if (!node) {
            super("", nodeX, nodeY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN", container);
        }
        else {
            return;
        }
    }
}
