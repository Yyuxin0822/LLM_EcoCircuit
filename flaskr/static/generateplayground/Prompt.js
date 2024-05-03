import { PromptNode, PromptNodeDrpDwn } from './PromptNode.js';
export class Prompt {
    constructor(id) {
        this.EventManager = class {
            constructor(parent) {
                this.parent = parent;
                this.handleClickInside = this.handleClickInside.bind(this);
                this.handleClickOutside = this.handleClickOutside.bind(this);
            }
            attachEventListeners() {
                this.parent._prompt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleClickInside();
                }, false);
                this.parent._prompt.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                document.addEventListener('click', this.handleClickOutside, false);
            }
            detachEventListeners() {
                this.parent._prompt.removeEventListener('click', this.handleClickInside, false);
                document.removeEventListener('click', this.handleClickOutside, false);
            }
            handleClickInside() {
                if (!this.parent.focusable)
                    return;
                Prompt.allPrompts.forEach(p => {
                    if (p !== this.parent && p._prompt.classList.contains("focused")) {
                        p.unfocus();
                    }
                });
                this.parent.promptFocus();
            }
            handleClickOutside(event) {
                if (!this.parent.focusable)
                    return;
                const isClickInsideAnyPrompt = Prompt.allPrompts.some(p => p._prompt.contains(event.target));
                if (!isClickInsideAnyPrompt) {
                    this.parent.unfocus();
                }
            }
        };
        this.id = id;
        this.promptLines = [];
        this.promptNodes = [];
        this._prompt = document.getElementById("prompt" + id);
        this._promptFuncbar = new PromptFuncBar(this._prompt.querySelector(".prompt-funcbar"));
        this._focusable = false;
        this._eventManager = new this.EventManager(this);
        this._eventManager.attachEventListeners();
        Prompt.allPrompts.push(this);
    }
    get focusable() {
        return this._focusable;
    }
    set focusable(focusable) {
        this._focusable = focusable;
    }
    promptFocus() {
        if (!this.focusable)
            return;
        this._prompt.classList.add("focused");
        this._promptFuncbar.enable();
    }
    unfocus() {
        if (!this.focusable)
            return;
        this._prompt.classList.remove("focused");
        this._promptFuncbar.disable();
    }
    get prompt() {
        return this._prompt;
    }
    set prompt(id) {
        this._prompt = document.getElementById("prompt" + id);
    }
    getrefMapX() {
        let nodeXs = new Set();
        this._prompt.querySelectorAll(".col").forEach((col) => {
            let nodeX = parseFloat(col.id.replace("col", "").replace("-", "."));
            console.log(nodeX);
            nodeXs.add(nodeX);
        });
        nodeXs.add(0);
        nodeXs.add(0.1);
        nodeXs.add(0.2);
        nodeXs.add(0.3);
        let sortedNodexs = Array.from(nodeXs).sort((a, b) => a - b);
        return Prompt.processNodeX(sortedNodexs);
    }
    convertAbstoNodeX(abs) {
        let nodeXMap = this.getrefMapX();
        console.log(nodeXMap);
        let nodeX = 0;
        for (let key in nodeXMap) {
            if (nodeXMap[key] <= (abs / 16)) {
                nodeX = parseFloat(key);
            }
        }
        return nodeX;
    }
    convertNodeXtoAbs(nodeX) {
        let nodeXMap = this.getrefMapX();
        return nodeXMap[nodeX];
    }
    convertAbstoNodeY(abs) {
        return Math.floor(abs / 16 / 1.5);
    }
    static getPromptItembyPrompt(prompt) {
        return Prompt.allPrompts.find(p => p.prompt === prompt);
    }
    static processNodeX(nodeXs) {
        if (nodeXs.length === 2) {
            return { [nodeXs[0]]: 0, [nodeXs[1]]: 67.5 };
        }
        const integerWidth = 22.5;
        const floatWidth = 15;
        const gapBetweenIntegers = 67.5;
        let coordinates = [0];
        let lastIntegerIndex = 0;
        for (let i = 1; i < nodeXs.length; i++) {
            const prevNode = nodeXs[i - 1];
            const currentNode = nodeXs[i];
            const prevIsInteger = Number.isInteger(prevNode);
            const currentIsInteger = Number.isInteger(currentNode);
            if (currentIsInteger) {
                if (prevIsInteger) {
                    coordinates.push(coordinates[coordinates.length - 1] + integerWidth);
                }
                else {
                    coordinates.push(coordinates[lastIntegerIndex] + gapBetweenIntegers);
                }
                lastIntegerIndex = i;
            }
            else {
                const widthToAdd = prevIsInteger ? integerWidth : floatWidth;
                coordinates.push(coordinates[coordinates.length - 1] + widthToAdd);
            }
        }
        let nodeXToCoordinateXMap = {};
        nodeXs.forEach((node, index) => {
            nodeXToCoordinateXMap[node] = coordinates[index];
        });
        return nodeXToCoordinateXMap;
    }
    returnInfo() {
        let prompt_id = this.id;
        let flow = [];
        this.promptLines.forEach(line => {
            flow.push(line.toJSONArray());
        });
        let nodematrix = {};
        this.promptNodes.forEach(node => {
            Object.assign(nodematrix, node.toJSONObj());
        });
        var socket = io.connect('http://localhost:5000');
        socket.emit('save_prompt', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix });
        return { prompt_id, flow, nodematrix };
    }
    static returnAllInfo() {
        let prompt_id = [];
        let flow = [];
        let nodematrix = [];
        Prompt.allPrompts.forEach(prompt => {
            prompt_id.push(prompt.id);
            let flowArys = [];
            prompt.promptLines.forEach(line => {
                flowArys.push(line.toJSONArray());
            });
            flow.push(flowArys);
            let nodeObjs = {};
            prompt.promptNodes.forEach(node => {
                Object.assign(nodeObjs, node.toJSONobj());
            });
            nodematrix.push(nodeObjs);
        });
        return { prompt_id, flow, nodematrix };
    }
    getLinesWhereNodeasInput(nodeItem) {
        return this.promptLines.filter(line => line.start === nodeItem.node);
    }
    getLinesWhereNodeasOutput(nodeItem) {
        return this.promptLines.filter(line => line.end === nodeItem.node);
    }
}
Prompt.allPrompts = [];
import { FuncBar } from '../FuncBar.js';
export class PromptFuncBar extends FuncBar {
    constructor(container) {
        super(container);
        this.activeToggle = this.container.querySelector(".active");
        this.prompt = this.container.closest(".prompt");
        this.selButton = this.container.querySelector("#selmode");
        this.nodeButton = this.container.querySelector("#nodemode");
        PromptFuncBar.allPromptFuncBars.push(this);
    }
    activateFunction(id) {
        super.activateFunction(id);
        switch (id) {
            case 'selmode':
                this.setSelMode();
                break;
            case 'drawmode':
                break;
            case 'nodemode':
                this.setNodeMode();
                break;
            case 'fullscreen':
                break;
        }
    }
    deactivateFunction(id) {
        super.deactivateFunction(id);
        switch (id) {
            case 'selmode':
                this.unsetSelMode();
                break;
            case 'drawmode':
                break;
        }
    }
    setSelMode() {
        document.body.style.cursor = "default";
        PromptNodeDrpDwn.globalEnabled = true;
    }
    unsetSelMode() {
        document.body.style.cursor = "default";
        PromptNodeDrpDwn.globalEnabled = false;
        this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
        this.promptItem.returnInfo();
    }
    setNodeMode() {
        document.body.style.cursor = "crosshair";
        let handleNodeClick = (e) => {
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
                    let nodeX = this.promptItem.convertAbstoNodeX(customNode.nodeX);
                    let nodeY = this.promptItem.convertAbstoNodeY(customNode.nodeY);
                    let newNode = new PromptNode(customNode.nodeWrapper.textContent, nodeX, nodeY, customNode.nodeTransform, customNode.nodeRGB, "UNKNOWN", customNode.container);
                    for (let i = 0; i < currentchildnodes.length; i++) {
                        if (customNode.nodeWrapper.textContent === currentchildnodes[i].textContent) {
                            newNode.delete();
                        }
                    }
                    console.log("Node created");
                }
                this.cleanupNodeMode();
                this.selButton.click();
            }, { once: true });
        };
        this.prompt.addEventListener('click', handleNodeClick);
        let handleBlur = () => {
            this.cleanupNodeMode();
            this.selButton.click();
        };
        this.prompt.addEventListener('blur', handleBlur);
        this.cleanupNodeMode = () => {
            this.promptItem.returnInfo();
            this.prompt.removeEventListener('click', handleNodeClick);
            this.prompt.removeEventListener('blur', handleBlur);
            console.log("Node mode deactivated");
        };
    }
    enable() {
        this.selButton.click();
        this.container.classList.remove("hidden");
    }
    disable() {
        this.container.classList.add("hidden");
        this.deactivateFunction("selmode");
        this.deactivateFunction("nodemode");
    }
    getAllPromptFuncBars() {
        return PromptFuncBar.allPromptFuncBars;
    }
}
PromptFuncBar.allPromptFuncBars = [];
