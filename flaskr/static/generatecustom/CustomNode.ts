//@ts-ignore
import { CustomFlowline } from './CustomFlowline.js';
import { Identifier } from './CustomIdentifier.js';
import { PromptNode } from '../generateplayground/prompt/PromptNode.js';


export class CustomNode extends PromptNode {
  //field declaration
  static myCustomNodes = [];
  static customNodeSel = true;

  private _draggable: PlainDraggable;
  private _nodeDragState: boolean;


  constructor(nodeContent: string, nodeX: number, nodeY: number, nodeTransform: string,
    nodeRGB: string, nodeSys: string, container: HTMLElement) {
    super(nodeContent, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, container);
    this._nodeX = nodeX;
    this._nodeY = nodeY;
    this._nodeDragState = false;
    // Remove the last added element from Parent.elements if it's an instance of Child
    if (PromptNode.myNodes[PromptNode.myNodes.length - 1] instanceof CustomNode) {
      PromptNode.myNodes.pop();
    }
    CustomNode.myCustomNodes.push(this);
  }

  init() {
    super.init();

    this.newNode.style.left = this._nodeX + 'px';
    this.newNode.style.top = this._nodeY + 'px';

    this._container.appendChild(this.newNode);

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
    //this.initSelEventListener();
    //this.setNodeDragState(this.newNode);

  }

  //@override
  attachEventListeners(): void {
    //Do nothing in the child class
  }

  //@override
  handleClick(): void {
    //Do nothing in the child class
  }

  //@override
  handleContextMenuClick(e: any): void {
    //Do nothing in the child class
  }


  //getter
  //@override
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

  set nodeDragState(state: boolean) {
    this._nodeDragState = state;
  }
  //setter
  setIdentifier(identifierClass) {
    //Do nothing in the child class
    // // Check if an identifier with the same class already exists
    // let existingIdentifier = this._identifier.find(identifier => identifier.identifierClass === identifierClass);

    // if (existingIdentifier) {
    //   // If an identifier with this class already exists, do nothing
    //   return;
    // }

    // // Otherwise, create a new Identifier and append it
    // let newIdentifier = new Identifier(this.newNode, identifierClass);
    // this._identifier.push(newIdentifier);
    // this.newNode.appendChild(newIdentifier.identifier);
  }


  //@override
  set dropdown(dropdown) {
    //Do nothing in the child class
  }

  get associatedLinesNodeasInput() {
    return CustomFlowline.myCustomLines.filter(line => line.start === this.newNode);
  }

  get associatedLinesNodeasOutput() {
    return CustomFlowline.myCustomLines.filter(line => line.end === this.newNode);
  }


  //a function that return nodeItem by ID
  static getNodeById(id) {
    return CustomNode.myCustomNodes.find(node => node.newNode.id === id);
  }

  static getNodeObjbyNode(node) {
    return CustomNode.myCustomNodes.find(nodeItem => nodeItem.newNode === node);
  }


  //methods
  //@override
  delete() {
    //clean up the associated lines
    this.associatedLinesNodeasInput.forEach(line => line.remove());
    this.associatedLinesNodeasOutput.forEach(line => line.remove());

    //This is not correct, please revise
    this.newNode.remove();
    let index = CustomNode.myCustomNodes.indexOf(this);
    if (index > -1) {
      CustomNode.myCustomNodes.splice(index, 1);
    }
  }

  //@override
  toJSONObj() {
    // Return a JSON object representing the node "NON-POTABLE WATER": [[0, 0], "HYDRO"], for example
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
    let customprompt = document.getElementById('customprompt');
    let newNode = new CustomNode("", event.clientX, event.clientY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN", customprompt);
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

  static getSelectedNodes() {
    return CustomNode.myCustomNodes.filter(node => node.newNode.classList.contains('node-selected'));
  }
  //@override
  static getAllNodes() {
    return CustomNode.myCustomNodes;
  }
}

