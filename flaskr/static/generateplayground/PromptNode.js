import { PromptFlowline } from './PromptFlowline.js';
import { Dropdown } from '../Dropdown.js';
import { Prompt } from './Prompt.js';
export class PromptNodeDrpDwn extends Dropdown {
    constructor(node) {
        super(node);
        this.promptItem = Prompt.getPromptItembyPrompt(node.closest('.prompt'));
        this.nodeItem = PromptNode.getNodeObjbyNode(node, node.closest('.prompt'));
        if (this.nodeItem && this.promptItem) {
            this.options.set('Reclassify', []);
            this.options.set('Delete Node', []);
            this.options.set('Delete Flowline', []);
            this.addReclassifyOption();
            this.addDeleteFlowOption();
            console.log(this.options);
        }
        this.init();
    }
    attachEventListenersToItems() {
        super.attachEventListenersToItems();
        let reclassify = this.dropdown?.querySelector('.Reclassify');
        if (reclassify) {
            reclassify.addEventListener('click', this.handleReclassify.bind(this));
        }
        let delNode = this.dropdown?.querySelector('#dropdownDeleteNode');
        if (delNode) {
            delNode?.addEventListener('click', this.handleDelNode.bind(this));
        }
    }
    addReclassifyOption() {
        var systemString = document.querySelector('.prompt-system').innerText;
        this.systemObj = parseJson(systemString);
        if (Object.keys(this.systemObj).length > 0) {
            for (let key in this.systemObj) {
                if (this.systemObj[key][0] !== this.nodeItem?.nodeSys) {
                    this.options.get('Reclassify').push(this.systemObj[key][0]);
                }
            }
        }
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
    handleReclassify(e) {
        console.log('Reclassify');
        var systemString = document.querySelector('.prompt-system').innerText;
        this.systemObj = parseJson(systemString);
        if (this.systemObj[e.target.innerText]) {
            this.nodeItem.nodeSys = e.target.innerText;
            this.nodeItem.nodeWrapper.style.backgroundColor = hextoRGBA(this.systemObj[e.target.innerText][1], 0.75);
        }
    }
    handleDelNode(e) {
        console.log('Delete Node');
        this.nodeItem.delete();
    }
}
PromptNodeDrpDwn.globalEnabled = false;
export class PromptIdentifier {
    constructor(node, identifierClass) {
        this.node = node;
        this.identifierClass = identifierClass;
        this.identifier = this.createIdentifier(identifierClass);
        this.prompt = this.node.closest('.prompt');
        PromptIdentifier.getAllIdentifiers().push(this);
    }
    createIdentifier(identifierClass) {
        let identifier = document.createElement("div");
        identifier.classList.add(identifierClass);
        let identifierDot = document.createElement("div");
        identifierDot.classList.add('identifier-dot', 'identifier-unselected');
        identifier.appendChild(identifierDot);
        this.node.appendChild(identifier);
        identifier.addEventListener('identifier-select', this.handleIdentifierSelect.bind(this));
        identifier.addEventListener('identifier-unselect', this.handleIdentifierUnselect.bind(this));
        return identifier;
    }
    handleIdentifierSelect(event) {
        PromptFlowline.setSelectedFlowStyle(event);
    }
    handleIdentifierUnselect(event) {
        PromptFlowline.rmSelFlowStyle(event);
    }
    select() {
        console.log('Selected');
        this.identifier.querySelector('.identifier-dot').classList?.add('identifier-selected');
        this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-unselected');
        let event = new CustomEvent('identifier-select', { detail: this });
        this.identifier.dispatchEvent(event);
    }
    unselect() {
        console.log('Unselected');
        this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-selected');
        this.identifier.querySelector('.identifier-dot').classList?.add('identifier-unselected');
        let event = new CustomEvent('identifier-unselect', { detail: this });
        this.identifier.dispatchEvent(event);
    }
    remove() {
        this.identifier.removeEventListener('identifier-select', this.handleIdentifierSelect.bind(this));
        this.identifier.removeEventListener('identifier-unselect', this.handleIdentifierUnselect.bind(this));
        let nodeItem = PromptNode.getNodeObjbyNode(this.node, this.prompt);
        let index1 = nodeItem.identifier.indexOf(this);
        if (index1 > -1) {
            nodeItem.identifier.splice(index1, 1);
        }
        this.identifier.remove();
        let index = PromptIdentifier.getAllIdentifiers().indexOf(this);
        if (index > -1) {
            PromptIdentifier.allIdentifiers.splice(index, 1);
        }
    }
    static getIdentifierObjbyNode(node) {
        return PromptIdentifier.allIdentifiers.find(identifierObj => identifierObj.node === node && identifierObj.prompt === node.closest('.prompt'));
    }
    static getIdentifierObjbyIdentifier(identifier) {
        return PromptIdentifier.allIdentifiers.find(identifierObj => identifierObj.identifier === identifier && identifierObj.prompt === identifier.closest('.prompt'));
    }
    static getSelectedIdentifiers() {
        return PromptIdentifier.allIdentifiers.filter(identifier => identifier.identifier.querySelector('.identifier-dot').classList.contains('identifier-selected'));
    }
    static getAllIdentifiers() {
        return PromptIdentifier.allIdentifiers;
    }
}
PromptIdentifier.allIdentifiers = [];
export class PromptNode {
    constructor(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, container) {
        if (!container) {
            throw new Error("Container for nodes is undefined.");
        }
        this._container = container;
        this._identifier = [];
        this.init(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB);
        this.handlers = {
            handleClick: this.handleClick.bind(this),
            handleContextMenuClick: this.handleContextMenuClick.bind(this)
        };
        this.nodeSys = nodeSys;
        this.attachEventListeners();
        this.addNodeToPrompt();
    }
    init(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB) {
        this._nodeContent = nodeContent;
        this._nodeX = nodeX;
        this._nodeY = nodeY;
        this._nodeTransform = nodeTransform;
        this._nodeRGB = nodeRGB;
        this.newNode = document.createElement("div");
        this.newNode.classList.add('node');
        this.newNode.id = 'node' + validId(nodeContent);
        this.newNode.style.top = nodeY * 1.5 + 'rem';
        this.newNode.style.transform = nodeTransform;
        this.newNode.style.backgroundColor = nodeRGB;
        this._nodeWrapper = document.createElement("div");
        this._nodeWrapper.classList.add('node-wrapper', 'card-node');
        this._nodeWrapper.innerHTML = nodeContent;
        this.newNode.appendChild(this._nodeWrapper);
        let col = this._container.querySelector('#col' + validId(nodeX.toString()));
        if (!col) {
            col = document.createElement('div');
            col.classList.add('col');
            col.id = 'col' + validId(nodeX.toString());
            let PromptObj = Prompt.getPromptItembyPrompt(this._container);
            col.style.left = PromptObj.convertNodeXtoAbs(nodeX) + 'rem';
            this._container.appendChild(col);
        }
        col.appendChild(this.newNode);
        this._dropdown = null;
        this.newNode.nodeItem = this;
    }
    addNodeToPrompt() {
        PromptNode.myNodes.push(this);
        this.PromptObj = Prompt.getPromptItembyPrompt(this._container);
        this.PromptObj.promptNodes.push(this);
    }
    attachEventListeners() {
        this.node.addEventListener('contextmenu', this.handlers.handleContextMenuClick);
        this.nodeWrapper.addEventListener('click', this.handlers.handleClick);
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
    handleClick(e) {
        if (!PromptNode.nodeSel)
            return;
        this.newNode.classList.toggle('node-selected');
        this.newNode.classList.toggle('node-unselected');
    }
    handleContextMenuClick(e) {
        e.preventDefault();
        if (!PromptNodeDrpDwn.globalEnabled)
            return;
        this._dropdown = new PromptNodeDrpDwn(this.newNode);
    }
    get node() {
        return this.newNode;
    }
    get nodeX() {
        return this._nodeX;
    }
    get nodeY() {
        return this._nodeY;
    }
    get nodeContent() {
        return this._nodeContent;
    }
    get nodeWrapper() {
        return this._nodeWrapper;
    }
    get identifier() {
        return this._identifier;
    }
    get nodeRGB() {
        return this._nodeRGB;
    }
    get container() {
        return this._container;
    }
    set nodeX(number) {
        this._nodeX = number;
        if (this.newNode) {
            this.newNode.style.left = number + 'px';
        }
    }
    set nodeY(number) {
        this._nodeY = number;
        if (this.newNode) {
            this.newNode.style.top = number + 'px';
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
    set nodeRGB(color) {
        this._nodeRGB = color;
        if (this.newNode) {
            this.newNode.style.backgroundColor = color;
        }
    }
    set nodeContent(name) {
        this._nodeContent = name;
        if (this.newNode) {
            this.newNode.querySelector('.node-wrapper').innerHTML = name;
        }
    }
    get dropdown() {
        return this._dropdown;
    }
    set dropdown(dropdown) {
        this._dropdown = dropdown;
    }
    static getNodeById(id, container = document) {
        return PromptNode.myNodes.find(nodeItem => nodeItem.newNode.id === id && nodeItem.container === container);
    }
    static getNodeObjbyNode(node, container = document) {
        return PromptNode.myNodes.find(nodeItem => nodeItem.newNode === node && nodeItem.container === container);
    }
    setIdentifier(identifierClass) {
        let existingIdentifier = this._identifier.find(identifier => identifier.identifierClass === identifierClass);
        if (existingIdentifier) {
            return;
        }
        let newIdentifier = new PromptIdentifier(this.newNode, identifierClass);
        this._identifier.push(newIdentifier);
        this.newNode.appendChild(newIdentifier.identifier);
    }
    select() {
        this.newNode.classList?.add('node-selected');
        this.newNode.classList?.remove('node-unselected');
        let event = new CustomEvent('node-select', { detail: this });
        this.newNode.dispatchEvent(event);
    }
    unselect() {
        this.newNode.classList?.remove('node-selected');
        this.newNode.classList?.add('node-unselected');
        let event = new CustomEvent('node-unselect', { detail: this });
        this.newNode.dispatchEvent(event);
    }
    delete() {
        this.newNode.remove();
        let index = PromptNode.myNodes.indexOf(this);
        if (index > -1) {
            PromptNode.myNodes.splice(index, 1);
        }
        let index1 = this.PromptObj.promptNodes.indexOf(this);
        if (index1 > -1) {
            this.PromptObj.promptNodes.splice(index1, 1);
        }
    }
    toJSONObj() {
        return { [this.nodeContent]: [[this.nodeX, this.nodeY], this.nodeSys] };
    }
    rmIdentifier(identifierClass) {
        let identifier = this._identifier.find(identifier => identifier.identifierClass === identifierClass);
        if (identifier) {
            identifier.remove();
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
}
PromptNode.myNodes = [];
PromptNode.nodeSel = true;
export class PromptCustomNode extends PromptNode {
    constructor(nodeX, nodeY, container) {
        super("", nodeX, nodeY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN", container);
    }
    init(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB) {
        this._nodeContent = nodeContent;
        this._nodeX = nodeX;
        this._nodeY = nodeY;
        this._nodeTransform = nodeTransform;
        this._nodeRGB = nodeRGB;
        this.newNode = document.createElement("div");
        this.newNode.classList.add('node');
        this.newNode.id = 'node' + validId(nodeContent);
        this.newNode.style.top = nodeY + 'px';
        this.newNode.style.left = nodeX + 'px';
        this.newNode.style.transform = nodeTransform;
        this.newNode.style.backgroundColor = nodeRGB;
        this._nodeWrapper = document.createElement("div");
        this._nodeWrapper.classList.add('node-wrapper', 'card-node');
        this._nodeWrapper.innerHTML = nodeContent;
        this.newNode.appendChild(this._nodeWrapper);
        this._container.appendChild(this.newNode);
        this.newNode.nodeItem = this;
    }
}
