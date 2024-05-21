//@ts-ignore
import { Prompt } from './Prompt.js';
//@ts-ignore
import { PromptFuncBar } from './PromptFuncBar.js';
//@ts-ignore
import { PromptNode } from './PromptNode.js';
//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';

export class PromptIdentifier {
  static allIdentifiers = [];
  static inSelect = null;
  node: HTMLElement;
  prompt: HTMLElement;
  nodeItem: PromptNode;
  promptItem: Prompt;
  identifierClass: string;
  identifier: HTMLElement;
  selected: boolean;

  constructor(node: HTMLElement, identifierClass: string) {
    this.node = node;
    this.prompt = this.node.closest('.prompt');
    this.nodeItem = PromptNode.getNodeObjbyNode(this.node, this.prompt);
    this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
    this.identifierClass = identifierClass;
    this.identifier = this.createIdentifierHTML(identifierClass);
    this.selected = false;
    this.attachEventListener();
    PromptIdentifier.getAllIdentifiers().push(this);
  }

  createIdentifierHTML(identifierClass: string) {
    let identifier = document.createElement("div");
    identifier.classList.add(identifierClass);
    let identifierDot = document.createElement("div");
    identifierDot.classList.add('identifier-dot', 'identifier-unselected');
    identifier.appendChild(identifierDot);
    this.node.appendChild(identifier);
    return identifier;
  }

  attachEventListener() {
    this.identifier.addEventListener('click', (event) => {
      if (this.identifier.querySelector('.identifier-dot').classList.contains('identifier-selected')) {
        this.unselect();
      } else {
        this.select();
      }
    });
    this.identifier.addEventListener('identifier-select', this.handleIdentifierSelect.bind(this));
    this.identifier.addEventListener('identifier-unselect', this.handleIdentifierUnselect.bind(this));
  }

  handleIdentifierSelect(event: CustomEvent) {
    if (event.detail != this) return;
    //1. If the selected identifier is not the first one in the line to be selected, then select the line
    let activateToSelect = true;
    this.associateLines.forEach(line => {
      if (line.startNodeItem.inputIdentifier.selected && line.endNodeItem.outputIdentifier.selected) {
        line.select();
        activateToSelect = false;
      }
    });

    // //then reset all other lines and identifiers
    // PromptIdentifier.inSelect = this;
    // //I need to find an efficient way to unselect the isolated identifier that is selected. 
    // //Firstly, clean the prompt loop through all lines in the Prompt, if line.selected=true, skip, else updateColorOptions
    // this.promptItem.promptLines.forEach(line => {
    //   //if the line is not selected and the line start or end doesn't contain this
    //   if (!line.selected && (line.startNodeItem.inputIdentifier !== this && line.endNodeItem.outputIdentifier !== this)) {
    //     line.resettoselect();
    //   }
    // });

    //2. If the selected identifier is the first one in the line to be selected, then activate toselect mode.
    if (!activateToSelect) return;
    this.associateLines.forEach(line => {
      if (line.startNodeItem.inputIdentifier === this || line.endNodeItem.outputIdentifier === this) {
        line.toselect();
      }
    });


  }

  handleIdentifierUnselect(event: CustomEvent) {
    if (event.detail != this) return;
    this.associateLines.forEach(line => {
      line.unselect();
      //check the other identifier in the line, if it is selected,enable its associateLines toselect
      let otherIdentifier = line.startNodeItem.inputIdentifier === this ? line.endNodeItem.outputIdentifier : line.startNodeItem.inputIdentifier;
      if (otherIdentifier.selected) {
        otherIdentifier.associateLines.forEach(line => {
          line.toselect();
        });
      }
    });


  }

  select() {
    // console.log('Selected');
    if (this.selected) return;
    this.identifier.querySelector('.identifier-dot').classList?.add('identifier-selected');
    // this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-toselect');
    this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-unselected');
    this.selected = true;
    if (PromptFlowline.lineSel) {
      let event = new CustomEvent('identifier-select', { detail: this });
      this.identifier.dispatchEvent(event);
    }
  }

  unselect() {
    // console.log(this.identifierClass)
    // console.log('Unselected');
    if (!this.selected) return;

    this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-selected');
    // this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-toselect');
    this.identifier.querySelector('.identifier-dot').classList?.add('identifier-unselected');
    this.selected = false;
    if (PromptFlowline.lineSel) {
      let event = new CustomEvent('identifier-unselect', { detail: this });
      this.identifier.dispatchEvent(event);
    }

  }

  // toselect() {
  //   if (this.selected) return;
  //   this.identifier.querySelector('.identifier-dot').classList?.add('identifier-toselect');
  //   this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-unselected');
  // }

  // resettoselect() {
  //   if (PromptIdentifier.inSelect === this) return;
  //   this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-toselect');

  //   if (this.selected) {
  //     // Check if any of its associate lines are selected
  //     let anySelected = this.associateLines.some(line => line.selected);

  //     // If no associated lines are selected, unselect this item
  //     if (!anySelected) {
  //       this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-selected');
  //       this.selected = false;
  //     } else {
  //       return; // Stop resettoselect
  //     }
  //   }

  //   this.identifier.querySelector('.identifier-dot').classList?.add('identifier-unselected');
  // }


  remove() {
    this.identifier.removeEventListener('identifier-select', this.handleIdentifierSelect.bind(this));
    this.identifier.removeEventListener('identifier-unselect', this.handleIdentifierUnselect.bind(this));

    let nodeItem = PromptNode.getNodeObjbyNode(this.node, this.prompt);
    if (this.identifierClass === 'input-identifier') {
      nodeItem._inputIdentifier = null;
    }
    if (this.identifierClass === 'output-identifier') {
      nodeItem._outputIdentifier = null;
    }

    this.identifier.remove();
    let index = PromptIdentifier.getAllIdentifiers().indexOf(this);
    if (index > -1) {
      PromptIdentifier.allIdentifiers.splice(index, 1);
    }
  }

  get associateLines() {
    return this.promptItem.promptLines.filter(line => line.start === this.node || line.end === this.node);
  }

  static getIdentifierObjbyIdentifier(identifier: HTMLElement) {
    return PromptIdentifier.allIdentifiers.find(identifierObj => identifierObj.identifier === identifier && identifierObj.prompt === identifier.closest('.prompt'));
  }



  static getAllIdentifiers() {
    return PromptIdentifier.allIdentifiers;
  }
}

