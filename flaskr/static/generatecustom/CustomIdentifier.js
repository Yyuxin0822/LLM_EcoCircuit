import { CustomFlowline } from './CustomFlowline.js';
export class Identifier {
    constructor(node, identifierClass) {
        this.node = node;
        this.identifierClass = identifierClass;
        this.identifier = this.createIdentifier(identifierClass);
        Identifier.allIdentifiers.push(this);
    }
    createIdentifier(identifierClass) {
        if (this.node.querySelector('.' + identifierClass))
            return;
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
Identifier.allIdentifiers = [];
