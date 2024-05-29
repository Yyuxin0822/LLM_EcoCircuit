//@ts-ignore
import { Prompt } from './Prompt.js';
//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';
//@ts-ignore
import { PromptIdentifier } from './PromptIdentifier.js';
//@ts-ignore
import { PromptNodeDrpDwn } from './PromptNodeDrpDwn.js';


export class PromptNode {
  //field declaration
  static myNodes = [];
  static nodeSel = true;

  protected _container: HTMLElement;//prompt container
  PromptObj: Prompt;
  protected newNode: HTMLElement;
  protected _nodeWrapper: HTMLElement;
  protected _inputIdentifier: PromptIdentifier;
  protected _outputIdentifier: PromptIdentifier;
  protected _dropdown: PromptNodeDrpDwn;

  protected _nodeX: number;
  protected _nodeY: number;
  protected _nodeTransform: string;
  protected _nodeContent: any;
  protected _nodeRGB: any;
  protected _nodeSys: string;

  selected: boolean;

  constructor(nodeContent: string, nodeX: number, nodeY: number, nodeTransform: string,
    nodeRGB: string, nodeSys: string, container: HTMLElement) {
    if (!container) {
      throw new Error("Container for nodes is undefined.");
    }

    //set up assciated elements
    this._container = container;
    this._inputIdentifier = null;
    this._outputIdentifier = null;
    this.PromptObj = Prompt.getPromptItembyPrompt(this._container);
    if (this.PromptObj) { this.PromptObj.promptNodes.push(this); } //for customnode, this.PromptObj is undefined
    PromptNode.myNodes.push(this);

    // Attributes
    this._nodeContent = nodeContent;
    this._nodeX = nodeX;
    this._nodeY = nodeY;
    this._nodeTransform = nodeTransform;
    this._nodeRGB = nodeRGB;
    this._nodeSys = nodeSys;

    // status
    this.selected = false;
    this.init();
    this.attachEventListeners();

  }

  init() {
    // node HTML
    this.newNode = document.createElement("div");
    this.newNode.classList.add('node');
    this.newNode.id = 'node' + validId(this._nodeContent);
    this.newNode.style.top = this._nodeY * 1.5 + 'rem';
    this.newNode.style.transform = this._nodeTransform;
    this.newNode.style.backgroundColor = this._nodeRGB;

    // Node wrapper
    this._nodeWrapper = document.createElement("div");
    this._nodeWrapper.classList.add('node-wrapper', 'card-node');
    this._nodeWrapper.innerText = this._nodeContent;
    this.newNode.appendChild(this._nodeWrapper);

    //Add tooltip to the nodewrapper
    // <div class="node-wrapper tooltip">My text
    //   <span class="tooltiptext">Tooltip text</span>
    // </div>
    this._nodeWrapper.classList.add('tooltip');
    let tooltiptext= document.createElement('span');
    tooltiptext.classList.add('tooltiptext');
    tooltiptext.innerHTML = this._nodeContent;
    this._nodeWrapper.appendChild(tooltiptext);

   
    //for customnode, this.PromptObj is undefined
    if (this.PromptObj) {
      let col = this._container.querySelector('#col' + validId(this._nodeX.toString())) as HTMLElement;
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

      //if nodeX is float
      if (this._nodeX % 1 !== 0) {
        col.style.width = '15rem';
      }
    }else{
      this._container.appendChild(this.newNode);
    }
    this.adjustFontSize();
  }

  adjustFontSize() {
    let nodeWrapper = this._nodeWrapper;
    let node = this.newNode;
    // Function to update font size
    function updateFontSize(nodeWrapper: HTMLElement, fontSize: number) {
      nodeWrapper.style.fontSize = `${fontSize}px`;
    }

    // Check if the text is overflowing
    function isOverflowingX(nodeWrapper: HTMLElement) {
      //if container has classList
      // console.log(nodeWrapper.closest('.node').classList.contains('plain-draggable'));
      // console.log(nodeWrapper.closest('.customprompt'));
      // if (nodeWrapper.closest('.customprompt')) {
      //   console.log('actual width', parseFloat(window.getComputedStyle(nodeWrapper).width));
      //   console.log('frame width', parseFloat(window.getComputedStyle(node).width));
      // }
      let nodeWrapperWidth = parseFloat(window.getComputedStyle(nodeWrapper).width);
      return nodeWrapperWidth > (parseFloat(window.getComputedStyle(node).width) - parseFloat(window.getComputedStyle(node).paddingLeft) - parseFloat(window.getComputedStyle(node).paddingRight));
    }
    
    function isOverflowingY(nodeWrapper: HTMLElement) {
      // console.log('actual height', parseFloat(window.getComputedStyle(nodeWrapper).height));
      // console.log('frame height', parseFloat(window.getComputedStyle(node).width)+4);
      return parseFloat(window.getComputedStyle(nodeWrapper).height) > (parseFloat(window.getComputedStyle(node).width) + 4);
    }

    // Adjust font size to prevent overflow or reduce to minimum size
    function adjust(node: HTMLElement) {
      let fontSize = 14; // Start from initial font size
      updateFontSize(nodeWrapper, fontSize);

      while (isOverflowingX(nodeWrapper) && fontSize > 12) {
        fontSize--; // Decrease font size
        updateFontSize(nodeWrapper, fontSize);
      }

      if (fontSize === 12 && isOverflowingX(nodeWrapper)) {
        // console.log(nodeWrapper.textContent);
        nodeWrapper.style.whiteSpace = 'normal';
        nodeWrapper.style.lineHeight = '1.0';
        node.style.height = '24px'; // Allow node height to adjust to content
        node.style.alignItems = 'flex-start';
        // nodeWrapper.style.overflow = 'hidden';
        node.style.textOverflow = 'ellipsis';
        // if (isOverflowingY(nodeWrapper)) {
        //   nodeWrapper.title = nodeWrapper.textContent;
        // }

      }
    }

    if (document.readyState === 'complete') {
      adjust(node); // Adjust immediately if document is already loaded
    } else {
      document.addEventListener('DOMContentLoaded', () => { adjust(node); }); // Adjust when document is loaded
    }
  }

  attachEventListeners() {
    this.node.addEventListener('contextmenu', this.handleContextMenuClick.bind(this));
    this.nodeWrapper.addEventListener('click', this.handleClick.bind(this));
    // this.nodeWrapper.addEventListener('mouseover', this.handleHover.bind(this));
    // this.nodeWrapper.addEventListener('mouseout', this.handleHoverOver.bind(this));
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

  handleHover() {
    this.nodeWrapper.classList.add('hovered');
    // let sameNodes= PromptNode.myNodes.filter(node => node.nodeContent === this.nodeContent);
    // if (sameNodes.length > 0) {
    //   sameNodes.forEach(node => {
    //     node.nodeWrapper.classList.add('hovered');
    //     //find associatedLines and add hovered class
    //     let findAssociatedNodes = function (node: PromptNode) {
    //       let associatedNodes = [];
    //       let startLines = node.PromptObj.getLinesWhereNodeasInput(node);
    //       console.log(startLines);
    //       //get the endNodes of the startLines
    //       startLines.forEach(line => {
    //         associatedNodes.push(line.endNodeItem);
    //       });
    //       let endLines = node.PromptObj.getLinesWhereNodeasOutput(node);
    //       console.log(endLines);
    //       //get the startNodes of the endLines
    //       endLines.forEach(line => {
    //         associatedNodes.push(line.startNodeItem);
    //       });
    //       return associatedNodes;
    //     }

    //     let associatedNodes = findAssociatedNodes(node);
    //     associatedNodes.forEach(node => {
    //       console.log(node.nodeWrapper);
    //       node.nodeWrapper.classList.add('hovered');
    //     });
    //   });
    // }
    
  }

  handleHoverOver() {
    this.nodeWrapper.classList.remove('hovered');
    // let sameNodes= PromptNode.myNodes.filter(node => node.nodeContent === this.nodeContent);
    // if (sameNodes.length > 0) {
    //   sameNodes.forEach(node => {
    //     node.nodeWrapper.classList.remove('hovered');
    //     //find associatedLines and add hovered class
    //     let findAssociatedNodes = function (node) {
    //       let associatedNodes = [];
    //       let startLines = node.PromptObj.getLinesWhereNodeasInput(node);
    //       //get the endNodes of the startLines
    //       startLines.forEach(line => {
    //         associatedNodes.push(line.endNodeItem);
    //       });
    //       let endLines = node.PromptObj.getLinesWhereNodeasOutput(node);
    //       //get the startNodes of the endLines
    //       endLines.forEach(line => {
    //         associatedNodes.push(line.startNodeItem);
    //       });
    //       return associatedNodes;
    //     }
    //     let associatedNodes = findAssociatedNodes(node);
    //     associatedNodes.forEach(node => {
    //       node.nodeWrapper.classList.remove('hovered');
    //     });
    //   });
    // }

    
  }

  handleClick() {
    if (!PromptNode.nodeSel) return;
    if (this.selected) {
      this.unselect();
    } else {
      this.select();
    }
  }

  handleContextMenuClick(e) {
    e.preventDefault();  // Prevent the default context menu
    if (!PromptNodeDrpDwn.globalEnabled) return;
    if (this.PromptObj.focused && e.target.closest('.prompt') === this.PromptObj.prompt) {
      this._dropdown = new PromptNodeDrpDwn(this.newNode);
    }
  }

  //getter
  get node() {
    return this.newNode;
  }

  set node(node) {
    this.newNode = node;
  }

  get nodeX() {
    return this._nodeX;
  }

  set nodeX(number: number) {
    this._nodeX = number;
    if (this.newNode) {
      this.newNode.style.left = number + 'px';
      // this probably need fixing, as the node style is influenced by the parent col
    }
  }

  get nodeY() {
    return this._nodeY;
  }

  set nodeY(number: number) {
    this._nodeY = number;
    if (this.newNode) {
      this.newNode.style.top = number * 1.5 + 'rem';
    }
  }
  get nodeTransform() {
    return this._nodeTransform;
  }

  set nodeTransform(transform: string) {
    this._nodeTransform = transform;
    if (this.newNode) {
      this.newNode.style.transform = transform;
    }
  }

  get nodeContent() {
    return this._nodeContent;
  }

  set nodeContent(name: string) {
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

  setIdentifier(identifierClass: string) { //identifierClass is either 'input-identifier' or 'output-identifier'
    if (!this.newNode) return;
    if (identifierClass !== 'input-identifier' && identifierClass !== 'output-identifier') return;
    if (identifierClass === 'input-identifier') {
      if (this._inputIdentifier) return;
      this._inputIdentifier = new PromptIdentifier(this.newNode, identifierClass);
    }

    if (identifierClass === 'output-identifier') {
      if (this._outputIdentifier) return;
      this._outputIdentifier = new PromptIdentifier(this.newNode, identifierClass);
    }
  }

  rmIdentifier(identifierClass: string) {
    if (identifierClass === 'input-identifier') {
      if (!this._inputIdentifier) return;
      this._inputIdentifier.remove();
    }
    if (identifierClass === 'output-identifier') {
      if (!this._outputIdentifier) return;
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

  set nodeSys(sys: string) {
    this._nodeSys = sys;
  }


  get dropdown() {
    return this._dropdown;
  }

  set dropdown(dropdown: PromptNodeDrpDwn) {
    this._dropdown = dropdown;
  }

  get container() {
    return this._container;
  }

  set container(container: HTMLElement) {
    this._container = container;
  }

  //a function that return nodeItem by ID
  static getNodeById(id: string, container: HTMLElement | Document = document) {
    return PromptNode.myNodes.find(nodeItem => nodeItem.newNode.id === id && nodeItem.container === container);
  }

  static getNodeObjbyNode(node: HTMLElement, container: HTMLElement | Document = document) {
    return PromptNode.myNodes.find(nodeItem => nodeItem.newNode === node && nodeItem.container === container);
  }



  //methods
  select() {
    if (this.selected) return;
    this.newNode.classList?.add('node-selected');
    this.newNode.classList?.remove('node-unselected');
    let event = new CustomEvent('node-select', { detail: this });
    this.newNode.dispatchEvent(event);
    this.selected = true;
  }

  unselect() {
    if (!this.selected) return;
    this.newNode.classList?.remove('node-selected');
    this.newNode.classList?.add('node-unselected');
    let event = new CustomEvent('node-unselect', { detail: this });
    this.newNode.dispatchEvent(event);
    this.selected = false;
  }

  delete() {
    //clean related flowline
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

    //cleanning flowline before cleaning nodes
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

    this.PromptObj.returnInfo(); // save immediately after deleting a node
  }

  toJSONObj(abs = false) {
    // Return a JSON object representing the node "NON-POTABLE WATER": [[0, 0], "HYDRO"], for example
    if (!abs) {
      return { [this.nodeContent]: [[this.nodeX, this.nodeY], this.nodeSys, this.nodeTransform] };
    } else {
      let [posX, posY] = PromptNode.getnodePositionInDOM(this.newNode); 
      return { [this.nodeContent]: [[posX, posY], this.nodeSys, this.nodeTransform] };
    }
  }



  static addCustomNode(event) {
    // console.log(event.target)
    // console.log(event)
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

  static getnodePositionInDOM(node: HTMLElement) {
    let x = 0;
    let y = 0;
    let nodeparent = node.closest('.prompt-frame');
    while (node) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement;
      if (node === nodeparent) {
        break;
      }
    }
    return [x, y];
  }
}

export class PromptCustomNode extends PromptNode {
  constructor(absNodeX: number, absNodeY: number, container: HTMLElement) {
    let PromptObj = Prompt.getPromptItembyPrompt(container);
    let nodeX = PromptObj.convertAbstoNodeX(absNodeX);
    let nodeY = PromptObj.convertAbstoNodeY(absNodeY);
    
    // Call the super constructor first
    super("", nodeX, nodeY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN", container);
    this.nodeWrapper.classList.remove('tooltip');
    // Check in PromptNode.myNodes if there is already a node at the same position
    // let node = PromptNode.myNodes.find(node => node.nodeX === nodeX && node.nodeY === nodeY && node.container === container);
    // if (node.length === 0) {

    // } else {
    //   // If a node already exists at the same position, you might want to handle this case.
    //   // For now, we'll simply return to avoid creating a new node.

    //   return;
    // }
  }
}





