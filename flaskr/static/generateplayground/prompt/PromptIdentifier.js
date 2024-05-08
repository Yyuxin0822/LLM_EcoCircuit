import { Prompt } from './Prompt.js';
import { PromptNode } from './PromptNode.js';
import { PromptFlowline } from './PromptFlowline.js';
export class PromptIdentifier {
    constructor(node, identifierClass) {
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
    createIdentifierHTML(identifierClass) {
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
            }
            else {
                this.select();
            }
        });
        this.identifier.addEventListener('identifier-select', this.handleIdentifierSelect.bind(this));
        this.identifier.addEventListener('identifier-unselect', this.handleIdentifierUnselect.bind(this));
    }
    handleIdentifierSelect(event) {
        if (event.detail === this) {
            this.associateLines.forEach(line => {
                if (line.startNodeItem.inputIdentifier.selected && line.endNodeItem.outputIdentifier.selected) {
                    line.select();
                }
            });
        }
    }
    handleIdentifierUnselect(event) {
        if (event.detail === this) {
            this.associateLines.forEach(line => {
                line.unselect();
            });
        }
    }
    select() {
        if (this.selected)
            return;
        this.identifier.querySelector('.identifier-dot').classList?.add('identifier-selected');
        this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-toselect');
        this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-unselected');
        this.selected = true;
        if (PromptFlowline.lineSel) {
            let event = new CustomEvent('identifier-select', { detail: this });
            this.identifier.dispatchEvent(event);
        }
    }
    unselect() {
        if (!this.selected)
            return;
        this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-selected');
        this.identifier.querySelector('.identifier-dot').classList?.remove('identifier-toselect');
        this.identifier.querySelector('.identifier-dot').classList?.add('identifier-unselected');
        this.selected = false;
        if (PromptFlowline.lineSel) {
            let event = new CustomEvent('identifier-unselect', { detail: this });
            this.identifier.dispatchEvent(event);
        }
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
    static getIdentifierObjbyIdentifier(identifier) {
        return PromptIdentifier.allIdentifiers.find(identifierObj => identifierObj.identifier === identifier && identifierObj.prompt === identifier.closest('.prompt'));
    }
    static getAllIdentifiers() {
        return PromptIdentifier.allIdentifiers;
    }
}
PromptIdentifier.allIdentifiers = [];
