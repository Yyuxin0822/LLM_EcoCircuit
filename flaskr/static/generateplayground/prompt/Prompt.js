import { PromptNode } from './PromptNode.js';
import { PromptFlowline } from './PromptFlowline.js';
import { PromptFuncBar } from './PromptFuncBar.js';
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
                    if (e.target.closest(".identifier-dot")) {
                        e.stopPropagation();
                    }
                    this.handleClickInside();
                }, false);
                this.parent._prompt.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
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
                if (this.parent.focused)
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
        this._focused = false;
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
    get focused() {
        return this._focused;
    }
    set focused(focused) {
        this._focused = focused;
    }
    promptFocus() {
        if (!this.focusable)
            return;
        this._prompt.classList.add("focused");
        this._promptFuncbar.enable();
        this._focused = true;
    }
    unfocus() {
        if (!this.focusable)
            return;
        this._prompt.classList.remove("focused");
        this._promptFuncbar.disable();
        this.promptNodes.forEach(node => {
            node.dropdown?.remove();
        });
        this._focused = false;
    }
    get prompt() {
        return this._prompt;
    }
    set prompt(id) {
        this._prompt = document.getElementById("prompt" + id);
    }
    getSelectedIdentifiers() {
        let selectedIdentifiers = [];
        this.promptNodes.forEach(node => {
            if (node.inputIdentifier.selected) {
                selectedIdentifiers.push(node.inputIdentifier);
            }
            if (node.outputIdentifier.selected) {
                selectedIdentifiers.push(node.outputIdentifier);
            }
        });
        return selectedIdentifiers;
    }
    getrefMapX() {
        let nodeXs = new Set();
        this._prompt.querySelectorAll(".col").forEach((col) => {
            let nodeX = parseFloat(col.id.replace("col", "").replace("-", "."));
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
        let nodeX = 0;
        for (let key in nodeXMap) {
            if (nodeXMap[key] <= (abs / 16)) {
                let tempNodeX = parseFloat(key);
                if (nodeX < tempNodeX) {
                    nodeX = tempNodeX;
                }
            }
        }
        return nodeX;
    }
    convertNodeXtoAbs(nodeX) {
        let nodeXMap = this.getrefMapX();
        return nodeXMap[nodeX];
    }
    convertAbstoNodeY(abs) {
        return Math.floor(abs / 16 / 1.5) - 2;
    }
    static getPromptItembyPrompt(prompt) {
        return Prompt.allPrompts.find(p => p.prompt === prompt);
    }
    static processNodeX(nodeXs) {
        if (nodeXs.length === 2) {
            return { [nodeXs[0]]: 0, [nodeXs[1]]: 67.5 };
        }
        nodeXs.push(0);
        nodeXs.push(0.1);
        nodeXs.push(0.2);
        nodeXs.push(0.3);
        nodeXs.push(1);
        nodeXs = Array.from(new Set(nodeXs)).sort((a, b) => a - b);
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
        emitSocket('save_prompt', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix });
        return { prompt_id, flow, nodematrix };
    }
    returnQuery() {
        this.returnInfo();
        let prompt_id = this.id;
        let query = [];
        if (PromptNode.nodeSel) {
            this.promptNodes.forEach(node => {
                if (node.selected)
                    query.push(node.nodeContent);
            });
        }
        if (PromptFlowline.lineSel) {
            this.promptLines.forEach(line => {
                if (line.selected)
                    query.push(line.toJSONArray());
            });
        }
        return { prompt_id, query };
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
    static returnAllQuery() {
        let prompt_id_array = [];
        let query_array = [];
        Prompt.allPrompts.forEach(prompt => {
            let { prompt_id, query } = prompt.returnQuery();
            if (query.length > 0) {
                prompt_id_array.push(prompt_id);
                query_array.push(query);
            }
        });
        return { prompt_id_array, query_array };
    }
    collectCustomInfo(mode) {
        let flow = [];
        let flownode = [];
        let nodematrix = {};
        if (mode === 'send-all') {
            this.promptLines.forEach(line => {
                let tempflowinfo = line.toJSONArray();
                flownode.push(tempflowinfo[0]);
                flownode.push(tempflowinfo[1]);
                flow.push(line.toJSONArray(true));
            });
            this.promptNodes.forEach(node => {
                if (!flownode.includes(node.nodeContent)) {
                    Object.assign(nodematrix, node.toJSONObj(true));
                }
            });
        }
        if (mode === 'send-selected') {
            this.promptLines.forEach(line => {
                if (line.selected)
                    flow.push(line.toJSONArray(true));
                let startNodeItem = this.promptNodes.find(node => node.node === line.start);
                let endNodeItem = this.promptNodes.find(node => node.node === line.end);
                Object.assign(nodematrix, startNodeItem.toJSONObj(true));
                Object.assign(nodematrix, endNodeItem.toJSONObj(true));
            });
            this.promptNodes.forEach(node => {
                if (node.selected)
                    Object.assign(nodematrix, node.toJSONObj(true));
            });
        }
        return { flow, nodematrix };
    }
    getLinesWhereNodeasInput(nodeItem) {
        return this.promptLines.filter(line => line.start === nodeItem.node);
    }
    getLinesWhereNodeasOutput(nodeItem) {
        return this.promptLines.filter(line => line.end === nodeItem.node);
    }
}
Prompt.allPrompts = [];
