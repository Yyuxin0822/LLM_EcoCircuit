//@ts-ignore
import { Prompt } from './Prompt.js';
//@ts-ignore
import { PromptFuncBar } from './PromptFuncBar.js';
//@ts-ignore
import { PromptNode } from './PromptNode.js';
//@ts-ignore
import { PromptFlowline } from './PromptFlowline .js';

export class PromptIdentifier {
    static allIdentifiers = [];
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
      if (event.detail === this) {
        this.associateLines.forEach(line => {
          if (line.startNodeItem.inputIdentifier.selected && line.endNodeItem.outputIdentifier.selected) {
            line.select();
          }
        });
      }
    }
  
    handleIdentifierUnselect(event: CustomEvent) {
      if (event.detail === this) {
        this.associateLines.forEach(line => {
          line.unselect();
        });
      }
    }
  
    select() {
      console.log('Selected');
      if (this.selected) return;
      this.identifier.querySelector('.identifier-dot').classList?.add('identifier-selected');
      this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-unselected');
      this.selected = true;
      let event = new CustomEvent('identifier-select', { detail: this });
      this.identifier.dispatchEvent(event);
    }
  
    unselect() {
      console.log('Unselected');
      if (!this.selected) return;
      this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-selected');
      this.identifier.querySelector('.identifier-dot').classList?.add('identifier-unselected');
      this.selected = false;
      let event = new CustomEvent('identifier-unselect', { detail: this });
      this.identifier.dispatchEvent(event);
    }
  
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
  
    static getSelectedIdentifiers() {
      return PromptIdentifier.allIdentifiers.filter(identifier => identifier.identifier.querySelector('.identifier-dot').classList.contains('identifier-selected'));
    }
  
    static getAllIdentifiers() {
      return PromptIdentifier.allIdentifiers;
    }
  }