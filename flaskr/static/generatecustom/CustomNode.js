import { CustomFlowline } from './CustomFlowline.js';

export class Identifier {
    static allIdentifiers = [];
  
    constructor(node, identifierClass) {
      this.node = node;
      this.identifierClass = identifierClass;
      this.identifier = this.createIdentifier(identifierClass);
      Identifier.allIdentifiers.push(this);
    }
  
    createIdentifier(identifierClass) {
      if (this.node.querySelector('.' + identifierClass)) return;
      let identifier = document.createElement("div");
      identifier.classList.add(this.identifierClass);
      let identifierdot = document.createElement("div");
      identifierdot.classList.add('identifier-dot', 'identifier-unselected');
      this.node.appendChild(identifier);
      identifier.appendChild(identifierdot);
      identifier.addEventListener('identifier-select', CustomFlowline.setSelectedFlowStyle);
      return identifier;
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
  
    static getIdentifierObjbyNode(node) {
      return Identifier.allIdentifiers.find(identifier => identifier.node === node);
    }
  
    static getIdentifierObjbyIdentifier(identifier) {
      return Identifier.allIdentifiers.find(identifierObj => identifierObj.identifier === identifier);
    }
  
    static getSelectedIdentifiers() {
      return Identifier.allIdentifiers.filter(identifier => identifier.identifier.querySelector('.identifier-dot').classList.contains('identifier-selected'));
    }
    static getAllIdentifiers() {
      return Identifier.allIdentifiers;
    }
  }
  
export class CustomNode {
    //field declaration
    static myCustomNodes = [];
    static customNodeSel = true;
    nodeDragState;
    newNode;
    _nodeWrapper;
    _identifier;
    _nodeContent;
    _container;
    _draggable;
    _nodeRGB;
    _nodeX;
    _nodeY;
  
    constructor(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, container) {
      if (!container) {
        throw new Error("Container for nodes is undefined.");
      }
      this._container = container;
      this._identifier = [];
      this.nodeDragState = false;
      this.init(nodeName, nodeX, nodeY, nodeTransform, nodeRGB);
      CustomNode.myCustomNodes.push(this);
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
      // this syntax has an issue when the nodex is not an integer, it will query e.g. "#col1.3" which is invalid
      // adjustFontSize(newNode);
  
      //this.initSelEventListener();
      //this.setNodeDragState(this.newNode);
  
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
  
    get draggable() {
      return this._draggable;
    }
  
    get nodeDragState() {
      return this.nodeDragState;
    }
  
    get associatedLinesNodeasInput() {
      return CustomFlowline.myCustomLines.filter(line => line.start === this.newNode);
    }
  
    get associatedLinesNodeasOutput() {
      return CustomFlowline.myCustomLines.filter(line => line.end === this.newNode);
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
    static getNodeById(id) {
      return CustomNode.myCustomNodes.find(node => node.newNode.id === id);
    }
  
    static getNodeObjbyNode(node) {
      return CustomNode.myCustomNodes.find(nodeItem => nodeItem.newNode === node);
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
      let newIdentifier = new Identifier(this.newNode, identifierClass);
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
      let index = CustomNode.myCustomNodes.indexOf(this);
      if (index > -1) {
        NodeItem.myCustomNodes.splice(index, 1);
      }
    }
  
    copyTo(newcontainer, delcurrent = false) {
      let newNodeItem = new CustomNode(this.nodeContent, this.nodeX, this.nodeY, this.nodeTransform, this.nodeRGB, newcontainer);
      if (this.identifier) {
        this.identifier.forEach(identifier => newNodeItem.setIdentifier(identifier.identifierClass));
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
  
        // Move the mousemove event to the document to handle outside moves
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
        // Remove mousemove event listener to prevent unnecessary event firing
        document.removeEventListener('mousemove', mouseMoveHandler);
  
        if (moved) {
          console.log('Drag Event');
          this.nodeDragState = true;
        } else {
          console.log('Click Event');
          this.nodeDragState = false;
        }
      });
  
      // Additionally handle mouseup outside the nodeWrapper
      document.addEventListener('mouseup', (e) => {
        if (e.target !== this.nodeWrapper && moved) {
          document.removeEventListener('mousemove', mouseMoveHandler);
          console.log('Drag Event ended outside');
          this.nodeDragState = true;
          moved = false;  // Reset moved state
        }
      });
    }
  
    toString() {
      console.log(this.nodeName);
      return this.nodeName;
    }
  
    initSelEventListener() {
      this.nodeWrapper.addEventListener('click', (e) => {
        if (!customNodeSel) return;
        if (this.nodeDragState) return;
        this.newNode.classList.toggle('node-selected');
        this.newNode.classList.toggle('node-unselected');
      });
    }
  
  
    static addCustomNode(event) {
      //    <div class="component-bar-custom card-14" id="custom" contenteditable></div>
      let newNode = new CustomNode("", event.clientX, event.clientY, 'translate(0%, 0%)',hexToRGBA("#888",0.75) , customprompt);
      newNode.node.id = 'nodecustom';
      newNode.nodeWrapper.contentEditable = true;
      newNode.nodeWrapper.focus();
      newNode.nodeWrapper.addEventListener('keydown', function(event) {
          if (event.key === "Enter" || event.keyCode === 13) {
              event.preventDefault();  // Prevent the default enter behavior
              newNode.nodeWrapper.blur();  // Remove focus from the element
          }});
      return newNode;
    }
  
    static getSelectedNodes() {
      return CustomNode.myCustomNodes.filter(node => node.newNode.classList.contains('node-selected'));
    }
  
    static getAllNodes() {
      return CustomNode.myCustomNodes;
    }
  }
  