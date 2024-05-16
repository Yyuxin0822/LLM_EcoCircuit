//@ts-ignore
import { Prompt } from './Prompt.js';
//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';
//@ts-ignore
import { PromptNode } from './PromptNode.js';
//@ts-ignore
import { PromptIdentifier} from './PromptIdentifier.js';

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

    let delFlowSubs = this.dropdown?.querySelectorAll('.DeleteFlowline'); //query sub-dropdown
    if (delFlowSubs) {
      delFlowSubs.forEach(delFlow => {
      delFlow.addEventListener('click', this.handleDelFlow.bind(this));});
    }

  }

  addReclassifyOption() {
    var systemString = document.querySelector('#project-system').innerText;
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
    // console.log('Reclassify');
    //e.target.innerText
    var systemString = document.querySelector('#project-system').innerText;
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
    PromptFlowline.getLinebyEndTexts(startText, endText, this.promptItem).remove();

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
