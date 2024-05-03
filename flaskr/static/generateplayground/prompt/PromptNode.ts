//@ts-ignore
import { Prompt } from './Prompt.js';

//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';
//@ts-ignore
import { PromptIdentifier } from './PromptIdentifier.js';



//@ts-ignore
import { Dropdown } from '../../Dropdown.js';
export class PromptNodeDrpDwn extends Dropdown {
  static globalEnabled: boolean = false;  // Static property to enable/disable all dropdowns

  promptItem: Prompt;
  nodeItem: PromptNode;
  systemArray: [];

  constructor(node: HTMLElement) {
    super(node);
    this.promptItem = Prompt.getPromptItembyPrompt(node.closest('.prompt') as HTMLElement);
    this.nodeItem = PromptNode.getNodeObjbyNode(node, node.closest('.prompt') as HTMLElement);
    if (this.nodeItem && this.promptItem) {
      this.options.set('Reclassify System', []);
      this.options.set('Delete Node', []);
      this.options.set('Delete Flowline', []);
      // this.options.set('Add Flowline', []);
      this.addReclassifyOption();
      this.addDeleteFlowOption();
      // this.addAddFlowOption();
      //console.log(this.options);
    }
    this.init();
  }

  attachEventListenersToItems() {
    super.attachEventListenersToItems();
    let reclassifySubs = this.dropdown?.querySelectorAll('.ReclassifySystem'); //query sub-dropdown
    if (reclassifySubs) {
      reclassifySubs.forEach(reclassify => {
        reclassify.addEventListener('click', this.handleReclassify.bind(this));
      });
    }

    let delNode = this.dropdown?.querySelector('#dropdownDeleteNode');
    if (delNode) {
      delNode?.addEventListener('click', this.handleDelNode.bind(this));
    }

    let delFlow = this.dropdown?.querySelector('.DeleteFlowline'); //query sub-dropdown
    if (delFlow) {
      delFlow.addEventListener('click', this.handleDelFlow.bind(this));
    }

    let addFlow = this.dropdown?.querySelector('.AddFlowline'); //query sub-dropdown
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
    this.promptItem.returnInfo(); // save immediately after reclassifying a node
  }

  //addDeleteFlowOption() {}

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

  handleReclassify(e: MouseEvent) {
    console.log('Reclassify');
    //e.target.innerText
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

  handleDelFlow(e: MouseEvent) {
    console.log('Delete Flowline');

    let info = e.target.innerHTML.substring(3);
    let firstSpace = info.indexOf(' ');
    info = [info.substring(0, firstSpace), info.substring(firstSpace + 1)];

    let startText = info[0] === 'To' ? this.nodeItem.nodeContent : info[1];
    let endText = info[0] === 'To' ? info[1] : this.nodeItem.nodeContent;
    PromptFlowline.getLinebyEndTexts(startText, endText).remove();

    //rempove this sub-dropdown as well
    e.target.closest('.dropdown-item-sub').remove();

    this.container.click();
  }


  remove() {
    super.remove();
    //remove ths associate in PromptNode
    this.nodeItem.dropdown = null;
  }
}

export class PromptNode {
  //field declaration
  static myNodes = [];
  static nodeSel = true;

  private _container: HTMLElement;//prompt container
  PromptObj: Prompt;
  private newNode: HTMLElement;
  private _nodeWrapper: HTMLElement;
  private _inputIdentifier: PromptIdentifier;
  private _outputIdentifier: PromptIdentifier;
  private _dropdown: PromptNodeDrpDwn;

  private _nodeX: number;
  private _nodeY: number;
  private _nodeTransform: string;
  private _nodeContent: any;
  private _nodeRGB: any;
  private _nodeSys: string;

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
    this.PromptObj.promptNodes.push(this);
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
    this._nodeWrapper.innerHTML = this._nodeContent;
    this.newNode.appendChild(this._nodeWrapper);
    // Todo:adjustFontSize(newNode);

    let col = this._container.querySelector('#col' + validId(this._nodeX.toString())) as HTMLElement;
    if (!col) {
      col = document.createElement('div');
      col.classList.add('col');
      col.id = 'col' + validId(this._nodeX.toString());
      let PromptObj = Prompt.getPromptItembyPrompt(this._container);
      col.style.left = PromptObj.convertNodeXtoAbs(this._nodeX) + 'rem';
      this._container.appendChild(col);
    }
    col.appendChild(this.newNode);

    // this syntax has an issue when the nodex is not an integer, it will query e.g. "#col1.3" which is invalid

  }

  attachEventListeners() {
    this.node.addEventListener('contextmenu', this.handleContextMenuClick.bind(this));
    this.nodeWrapper.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('nodeTabClick', event => { this.nodeWrapper.style.cursor = 'pointer'; });
    document.addEventListener('disableNodeTabClick', event => { this.nodeWrapper.style.cursor = 'default'; });
    document.addEventListener('flowlineTabClick', event => {
      let inputidentifier = this.newNode.querySelector('.input-identifier') as HTMLElement;
      if (inputidentifier) {
        inputidentifier.style.cursor = 'pointer';
      }
      let outputidentifier = this.newNode.querySelector('.output-identifier') as HTMLElement;
      if (outputidentifier) {
        outputidentifier.style.cursor = 'pointer';
      }
    });
    document.addEventListener('disableFlowlineTabClick', event => {
      let inputidentifier = this.newNode.querySelector('.input-identifier') as HTMLElement;
      if (inputidentifier) {
        inputidentifier.style.cursor = 'default';
      }
      let outputidentifier = this.newNode.querySelector('.output-identifier') as HTMLElement;
      if (outputidentifier) {
        outputidentifier.style.cursor = 'default';
      }
    });
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

  toJSONObj() {
    // Return a JSON object representing the node "NON-POTABLE WATER": [[0, 0], "HYDRO"], for example
    return { [this.nodeContent]: [[this.nodeX, this.nodeY], this.nodeSys, this.nodeTransform] };
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
  constructor(nodeX: number, nodeY: number, container: HTMLElement) {
    super("", nodeX, nodeY, 'translate(0%, 0%)', hexToRGBA("#888", 0.75), "UNKNOWN", container);
  }

  //override init
  init() {
    super.init();
    this.node.style.top = this.nodeY + 'px';
  }
}




