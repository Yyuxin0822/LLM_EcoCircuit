//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';
//@ts-ignore
import { Dropdown } from '../Dropdown.js';
//@ts-ignore
import { Prompt } from './Prompt.js';

export class PromptNodeDrpDwn extends Dropdown {
  private promptItem: Prompt;
  private nodeItemArray: PromptNode[];
  private flowItemArray: PromptFlowline[];  
  private options: string[];

  constructor(node: HTMLElement) {
    super(node);
    this.promptItem=Prompt.getPromptItembyPrompt(node.closest('.prompt') as HTMLElement);
    this.nodeItemArray = PromptNode.getNodeObjbyNode(node, this.promptItem.prompt);
    this.flowItemArray;
    this.options = ['Reclassify', 'Delete Node', 'Delete Flowline'];
  }

  handleContextMenuClick(e) {
    super.handleContextMenuClick(e);
  }

  handleReclassify(e){
    console.log('Reclassify');
  }

  handleDelNode(e){
    console.log('Delete Node');
    this.nodeItem.delete();
  }

  handleDelFlowline(e){
    console.log('Delete Flowline');
    let flowline = PromptFlowline.getFlowlineObjbyStartEnd(this.nodeItem.node);
    flowline.delete();
  }
}

export class PromptIdentifier {
  static allIdentifiers = [];

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

export class PromptNode {
  //field declaration
  static myNodes = [];
  static nodeSel = true;

  constructor(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, container) {
    if (!container) {
      throw new Error("Container for nodes is undefined.");
    }
    this._container = container;
    this._identifier = [];
    this.init(nodeName, nodeX, nodeY, nodeTransform, nodeRGB);
    this._dropdown = new PromptNodeDrpDwn(this.newNode);
    this.handlers = {handleClick: this.handleClick.bind(this)};
    this.nodeSys = nodeSys;
    this.attachEventListeners();
    this.addNodeToPrompt();
  }

  init(nodeName, nodeX, nodeY, nodeTransform, nodeRGB) {
    // Attributes
    this._nodeContent = nodeName;
    this._nodeX = nodeX;
    this._nodeY = nodeY;
    this._nodeTransform = nodeTransform;
    this._nodeRGB = nodeRGB;

    // Main node
    this.newNode = document.createElement("div");
    this.newNode.classList.add('node');
    this.newNode.id = 'node' + validId(nodeName);
    this.newNode.style.top = nodeY * 1.5 + 'rem';
    this.newNode.style.transform = nodeTransform;
    this.newNode.style.backgroundColor = nodeRGB;

    // Node wrapper
    this._nodeWrapper = document.createElement("div");
    this._nodeWrapper.classList.add('node-wrapper', 'card-node');
    this._nodeWrapper.innerHTML = nodeName;
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
    this.newNode.nodeItem = this;
    // this syntax has an issue when the nodex is not an integer, it will query e.g. "#col1.3" which is invalid
    // adjustFontSize(newNode);
  }

  addNodeToPrompt() {
    PromptNode.myNodes.push(this);
    this.PromptObj = Prompt.getPromptItembyPrompt(this._container);
    this.PromptObj.promptNodes.push(this);
  }

  attachEventListeners() {
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
    if (!PromptNode.nodeSel) return;
    this.newNode.classList.toggle('node-selected');
    this.newNode.classList.toggle('node-unselected');
  }


  
  //getter
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

  get associatedLinesNodeasInput() {
    return PromptFlowline.myLines.filter(line => line.start === this.newNode);
  }

  get associatedLinesNodeasOutput() {
    return PromptFlowline.myLines.filter(line => line.end === this.newNode);
  }

  set nodeX(number) {
    this._nodeX = number;
    if (this.newNode) {
      this.newNode.style.left = number + 'px';  // Use the parameter 'number', not the global 'nodeX'
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
  //a function that return nodeItem by ID
  static getNodeById(id, container = document) {
    return PromptNode.myNodes.find(nodeItem => nodeItem.newNode.id === id && nodeItem.container === container);
  }

  static getNodeObjbyNode(node, container = document) {
    return PromptNode.myNodes.find(nodeItem => nodeItem.newNode === node && nodeItem.container === container);
  }

  //setter
  setIdentifier(identifierClass) {
    // Check if an identifier with the same class already exists
    let existingIdentifier = this._identifier.find(identifier => identifier.identifierClass === identifierClass);

    if (existingIdentifier) {
      // If an identifier with this class already exists, do nothing
      return;
    }

    // Otherwise, create a new Identifier and append it
    let newIdentifier = new PromptIdentifier(this.newNode, identifierClass);
    this._identifier.push(newIdentifier);
    this.newNode.appendChild(newIdentifier.identifier);
  }


  //methods
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

    //delete in this.PromptObj.promptNodes
    let index1 = this.PromptObj.promptNodes.indexOf(this);
    if (index1 > -1) {
      this.PromptObj.promptNodes.splice(index1, 1);
    }
  }

  toJSONObj() {
    // Return a JSON object representing the node "NON-POTABLE WATER": [[0, 0], "HYDRO"], for example
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
        event.preventDefault();  // Prevent the default enter behavior
        newNode.nodeWrapper.blur();  // Remove focus from the element
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

export class PromptCustomNode extends PromptNode {
  constructor(nodeX, nodeY, container) {
    super("", nodeX, nodeY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN",container);
  }

  //override init
  init(nodeName, nodeX, nodeY, nodeTransform, nodeRGB) {
    // Attributes
    this._nodeContent = nodeName;
    this._nodeX = nodeX;
    this._nodeY = nodeY;
    this._nodeTransform = nodeTransform;
    this._nodeRGB = nodeRGB;

    // Main node
    this.newNode = document.createElement("div");
    this.newNode.classList.add('node');
    this.newNode.id = 'node' + validId(nodeName);
    this.newNode.style.top = nodeY + 'px';
    this.newNode.style.left = nodeX + 'px';
    this.newNode.style.transform = nodeTransform;
    this.newNode.style.backgroundColor = nodeRGB;

    // Node wrapper
    this._nodeWrapper = document.createElement("div");
    this._nodeWrapper.classList.add('node-wrapper', 'card-node');
    this._nodeWrapper.innerHTML = nodeName;
    this.newNode.appendChild(this._nodeWrapper);

    this._container.appendChild(this.newNode);
    this.newNode.nodeItem = this;
  }
}


//eventListeners
//this function add event listener to the identifier to this.start, and this.end
//this function actually works as an observer


