import { Prompt } from './Prompt.js';
import { PromptFlowline } from './PromptFlowline.js';
import { PromptIdentifier } from './PromptIdentifier.js';
import { Dropdown } from '../../Dropdown.js';
export class PromptNodeDrpDwn extends Dropdown {
    constructor(node) {
        super(node);
        this.promptItem = Prompt.getPromptItembyPrompt(node.closest('.prompt'));
        this.nodeItem = PromptNode.getNodeObjbyNode(node, node.closest('.prompt'));
        if (this.nodeItem && this.promptItem) {
            this.options.set('Reclassify System', []);
            this.options.set('Delete Node', []);
            this.options.set('Delete Flowline', []);
            this.addReclassifyOption();
            this.addDeleteFlowOption();
        }
        this.init();
    }
    attachEventListenersToItems() {
        super.attachEventListenersToItems();
        let reclassifySubs = this.dropdown?.querySelectorAll('.ReclassifySystem');
        if (reclassifySubs) {
            reclassifySubs.forEach(reclassify => {
                reclassify.addEventListener('click', this.handleReclassify.bind(this));
            });
        }
        let delNode = this.dropdown?.querySelector('#dropdownDeleteNode');
        if (delNode) {
            delNode?.addEventListener('click', this.handleDelNode.bind(this));
        }
        let delFlow = this.dropdown?.querySelector('.DeleteFlowline');
        if (delFlow) {
            delFlow.addEventListener('click', this.handleDelFlow.bind(this));
        }
        let addFlow = this.dropdown?.querySelector('.AddFlowline');
        if (addFlow) {
            addFlow.addEventListener('click', this.handleAddFlow.bind(this));
        }
    }
    addReclassifyOption() {
        var systemString = document.querySelector('.prompt-system').innerHTML;
        this.systemArray = parseJson(systemString);
        if (Object.keys(this.systemArray).length > 0) {
            for (let key in this.systemArray) {
                if (this.systemArray[key][0] !== this.nodeItem?.nodeSys) {
                    this.options.get('Reclassify System').push(this.systemArray[key][0]);
                }
            }
        }
        this.promptItem.returnInfo();
    }
    addDeleteFlowOption() {
        if (this.nodeItem && this.promptItem) {
            let startLines = this.promptItem.getLinesWhereNodeasInput(this.nodeItem);
            let endLines = this.promptItem.getLinesWhereNodeasOutput(this.nodeItem);
            if (startLines.length > 0) {
                startLines.forEach(line => {
                    this.options.get('Delete Flowline').push('To ' + line.toJSONArray()[1]);
                });
            }
            if (endLines.length > 0) {
                endLines.forEach(line => {
                    this.options.get('Delete Flowline').push('From ' + line.toJSONArray()[0]);
                });
            }
        }
    }
    addAddFlowOption() {
        if (this.nodeItem && this.promptItem) {
            this.promptItem.promptNodes.forEach(node => {
                if (node !== this.nodeItem) {
                    this.options.get('Add Flowline').push(node.nodeContent);
                }
            });
        }
    }
    handleReclassify(e) {
        console.log('Reclassify');
        var systemString = document.querySelector('.prompt-system').innerText;
        this.systemArray = parseJson(systemString);
        let sys = e.target.innerHTML.substring(3);
        if (Object.keys(this.systemArray).length > 0) {
            for (let key in this.systemArray) {
                if (this.systemArray[key][0] === sys) {
                    this.nodeItem.nodeSys = sys;
                    this.nodeItem.nodeRGB = hexToRGBA(this.systemArray[key][1], 0.75);
                    break;
                }
            }
        }
        PromptFlowline.myLines.forEach(line => {
            line.updateColorOptions();
        });
        this.container.click();
    }
    handleDelNode() {
        console.log('Delete Node');
        this.nodeItem.delete();
    }
    handleDelFlow(e) {
        console.log('Delete Flowline');
        let info = e.target.innerHTML.substring(3);
        let firstSpace = info.indexOf(' ');
        info = [info.substring(0, firstSpace), info.substring(firstSpace + 1)];
        let startText = info[0] === 'To' ? this.nodeItem.nodeContent : info[1];
        let endText = info[0] === 'To' ? info[1] : this.nodeItem.nodeContent;
        PromptFlowline.getLinebyEndTexts(startText, endText).remove();
        e.target.closest('.dropdown-item-sub').remove();
        this.container.click();
    }
    remove() {
        super.remove();
        this.nodeItem.dropdown = null;
    }
}
PromptNodeDrpDwn.globalEnabled = false;
export class PromptNode {
    constructor(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, container) {
        if (!container) {
            throw new Error("Container for nodes is undefined.");
        }
        this._container = container;
        this._inputIdentifier = null;
        this._outputIdentifier = null;
        this.PromptObj = Prompt.getPromptItembyPrompt(this._container);
        this.PromptObj.promptNodes.push(this);
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
        let col = this._container.querySelector('#col' + validId(this._nodeX.toString()));
        if (!col) {
            col = document.createElement('div');
            col.classList.add('col');
            col.id = 'col' + validId(this._nodeX.toString());
            let PromptObj = Prompt.getPromptItembyPrompt(this._container);
            col.style.left = PromptObj.convertNodeXtoAbs(this._nodeX) + 'rem';
            this._container.appendChild(col);
        }
        col.appendChild(this.newNode);
    }
    attachEventListeners() {
        this.node.addEventListener('contextmenu', this.handleContextMenuClick.bind(this));
        this.nodeWrapper.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('nodeTabClick', event => { this.nodeWrapper.style.cursor = 'pointer'; });
        document.addEventListener('disableNodeTabClick', event => { this.nodeWrapper.style.cursor = 'default'; });
        document.addEventListener('flowlineTabClick', event => {
            let inputidentifier = this.newNode.querySelector('.input-identifier');
            if (inputidentifier) {
                inputidentifier.style.cursor = 'pointer';
            }
            let outputidentifier = this.newNode.querySelector('.output-identifier');
            if (outputidentifier) {
                outputidentifier.style.cursor = 'pointer';
            }
        });
        document.addEventListener('disableFlowlineTabClick', event => {
            let inputidentifier = this.newNode.querySelector('.input-identifier');
            if (inputidentifier) {
                inputidentifier.style.cursor = 'default';
            }
            let outputidentifier = this.newNode.querySelector('.output-identifier');
            if (outputidentifier) {
                outputidentifier.style.cursor = 'default';
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
    toJSONObj() {
        return { [this.nodeContent]: [[this.nodeX, this.nodeY], this.nodeSys, this.nodeTransform] };
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
}
PromptNode.myNodes = [];
PromptNode.nodeSel = true;
export class PromptCustomNode extends PromptNode {
    constructor(nodeX, nodeY, container) {
        super("", nodeX, nodeY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN", container);
    }
    init() {
        super.init();
        this.node.style.top = this.nodeY + 'px';
    }
}
