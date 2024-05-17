var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var _a;
import { FuncBar } from '../../FuncBar.js';
import { PromptNode } from './PromptNode.js';
import { PromptFlowline } from './PromptFlowline.js';
import { Prompt } from './Prompt.js';
export class PromptFuncBar extends FuncBar {
    constructor(container) {
        super(container);
        this.handleNodeClick = (e) => {
            if (e.target.closest('.node'))
                return;
            if (e.target.closest('.prompt-funcbar'))
                return;
            let customNode = PromptNode.addCustomNode(e);
            customNode.nodeWrapper.addEventListener('blur', (e) => {
                if (!customNode.nodeWrapper.textContent) {
                    customNode.delete();
                }
                else {
                    customNode.nodeWrapper.textContent = customNode.nodeWrapper.textContent.trim().toUpperCase();
                    customNode.delete();
                    let currentchildnodes = customNode.container.querySelectorAll(".node");
                    this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
                    let newNode = new PromptNode(customNode.nodeWrapper.textContent, customNode.nodeX, customNode.nodeY, customNode.nodeTransform, customNode.nodeRGB, "UNKNOWN", customNode.container);
                    for (let i = 0; i < currentchildnodes.length; i++) {
                        if (customNode.nodeWrapper.textContent === currentchildnodes[i].textContent) {
                            newNode.delete();
                        }
                    }
                }
                this.cleanupNodeMode();
            }, { once: true });
        };
        this.handleBlur = () => {
            this.cleanupNodeMode();
            this.selButton.click();
        };
        this.cleanupNodeMode = () => {
            this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
            this.promptItem.returnInfo();
        };
        this.prompt = this.container.closest(".prompt");
        this.nodeButton = this.container.querySelector("#nodemode");
        this.flowButton = this.container.querySelector("#flowmode");
        PromptFuncBar.allPromptFuncBars.push(this);
    }
    activateFunction(id) {
        super.activateFunction(id);
        switch (id) {
            case 'nodemode':
                this.setNodeMode();
                break;
            case 'flowmode':
                this.setFlowMode();
                break;
        }
    }
    deactivateFunction(id) {
        super.deactivateFunction(id);
        switch (id) {
            case 'nodemode':
                this.unsetNodeMode();
                break;
            case 'flowmode':
                this.unsetFlowMode();
                break;
        }
    }
    setNodeMode() {
        this.prompt.style.cursor = "crosshair";
        this.prompt.addEventListener('click', this.handleNodeClick);
        this.prompt.addEventListener('blur', this.handleBlur);
    }
    unsetNodeMode() {
        this.prompt.style.cursor = "default";
        this.prompt.removeEventListener('click', this.handleNodeClick);
        this.prompt.removeEventListener('blur', this.handleBlur);
        document.body.style.cursor = "default";
    }
    setFlowMode() {
        this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
        this.promptItem.promptNodes.forEach(node => {
            let identifier1 = createTempIdentifierHTML(node.node, 'input-identifier');
            let identifier2 = createTempIdentifierHTML(node.node, 'output-identifier');
            let temp1 = new Temp(identifier1);
            let temp2 = new Temp(identifier2);
        });
        let event = new CustomEvent('TempClick');
        document.dispatchEvent(event);
    }
    unsetFlowMode() {
        Temp.allTemps.slice().forEach(temp => {
            temp.remove();
        });
        let event = new CustomEvent('disableTempClick');
        document.dispatchEvent(event);
    }
    enable() {
        this.container.classList.remove("hidden");
        this.activateFunction("nodemode");
    }
    disable() {
        this.container.classList.add("hidden");
        this.deactivateFunction("selmode");
        this.deactivateFunction("nodemode");
        this.deactivateFunction("flowmode");
    }
}
PromptFuncBar.allPromptFuncBars = [];
function createTempIdentifierHTML(container, identifierClass) {
    let identifier = document.createElement("div");
    identifier.classList.add(identifierClass);
    let identifierDot = document.createElement("div");
    identifierDot.classList.add('identifier-temp', 'identifier-unselected');
    identifier.appendChild(identifierDot);
    container.appendChild(identifier);
    return identifier;
}
let Temp = (_a = class {
        constructor(temp) {
            this.temp = temp;
            this.tempContent = this.temp.closest('.node').textContent;
            this.selected = false;
            this.selectable = true;
            this.temp.addEventListener('temp-add', this.handleAddLine.bind(this));
            this.temp.addEventListener('click', this.handleClick.bind(this));
            document.addEventListener('TempClick', this.handleTempClick.bind(this));
            document.addEventListener('disableTempClick', this.handleDisableTempClick.bind(this));
            Temp.allTemps.push(this);
        }
        handleClick() {
            if (this.selected) {
                this.unselect();
            }
            else {
                this.select();
            }
        }
        handleTempClick() {
            if (this.selectable) {
                this.temp.style.cursor = "pointer";
            }
        }
        handleDisableTempClick() {
            this.temp.style.cursor = "default";
        }
        handleAddLine(event) {
            let total = Temp.totalSelected.length;
            if (total === 0 || total > 2) {
                Temp.allTemps.forEach(temp => {
                    temp.selectable = true;
                    temp.unselect();
                });
                return;
            }
            if (total >= 1) {
                Temp.allTemps.forEach(temp => {
                    temp.selectable = false;
                });
            }
            if (total === 1) {
                if (event.detail === this) {
                    this.selectable = true;
                    if (this.temp.closest('.input-identifier')) {
                        Temp.allTemps.forEach(temp => {
                            if (temp.tempContent !== this.tempContent && temp.temp.closest('.output-identifier')) {
                                temp.selectable = true;
                                temp.toselect();
                            }
                        });
                    }
                    else if (this.temp.closest('.output-identifier')) {
                        Temp.allTemps.forEach(temp => {
                            if (temp.tempContent !== this.tempContent && temp.temp.closest('.input-identifier')) {
                                temp.selectable = true;
                                temp.toselect();
                            }
                        });
                    }
                }
            }
            if (total === 2) {
                let startText = '';
                let endText = '';
                let startNode = null;
                let endNode = null;
                Temp.totalSelected.forEach(temp => {
                    if (temp.temp.closest('.input-identifier')) {
                        startText = temp.tempContent;
                        startNode = temp.temp.closest('.node');
                    }
                    if (temp.temp.closest('.output-identifier')) {
                        endText = temp.tempContent;
                        endNode = temp.temp.closest('.node');
                    }
                });
                let promptItem = Prompt.getPromptItembyPrompt(this.temp.closest('.prompt'));
                let line = PromptFlowline.getLinebyEndTexts(startText, endText, promptItem);
                if (!line) {
                    line = new PromptFlowline(startNode, endNode);
                    promptItem.returnInfo();
                }
                Temp.allTemps.forEach(temp => {
                    temp.selectable = true;
                    temp.unselect();
                });
            }
        }
        toselect() {
            this.temp.querySelector('.identifier-temp').classList?.remove('identifier-unselected');
            this.temp.querySelector('.identifier-temp').classList?.add('identifier-toselect');
        }
        unselect() {
            if (!this.selectable)
                return;
            this.temp.querySelector('.identifier-temp').classList?.remove('identifier-selected');
            this.temp.querySelector('.identifier-temp').classList?.remove('identifier-toselect');
            this.temp.querySelector('.identifier-temp').classList?.add('identifier-unselected');
            let index = Temp.totalSelected.indexOf(this);
            if (index > -1) {
                Temp.totalSelected.splice(index, 1);
            }
            if (this.selected) {
                this.selected = false;
                let event = new CustomEvent('temp-add', { detail: this });
                this.temp.dispatchEvent(event);
            }
        }
        select() {
            if (!this.selectable)
                return;
            if (this.selected)
                return;
            this.selected = true;
            Temp.totalSelected.push(this);
            this.temp.querySelector('.identifier-temp').classList?.remove('identifier-toselect');
            this.temp.querySelector('.identifier-temp').classList?.remove('identifier-unselected');
            this.temp.querySelector('.identifier-temp').classList?.add('identifier-selected');
            let event = new CustomEvent('temp-add', { detail: this });
            this.temp.dispatchEvent(event);
            event = new CustomEvent('TempClick');
            document.dispatchEvent(event);
        }
        remove() {
            this.temp.removeEventListener('temp-add', this.handleAddLine.bind(this));
            this.temp.removeEventListener('click', this.handleClick.bind(this));
            let index = Temp.allTemps.indexOf(this);
            if (index > -1) {
                Temp.allTemps.splice(index, 1);
            }
            this.temp.remove();
        }
    },
    __setFunctionName(_a, "Temp"),
    _a.totalSelected = [],
    _a.allTemps = [],
    _a);
