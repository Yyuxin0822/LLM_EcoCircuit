//@ts-ignore
import { PromptNode, PromptNodeDrpDwn } from './PromptNode.js';
//@ts-ignore
import { PromptCustomNode } from './PromptNode.js';
//@ts-ignore
import { PromptFlowLine } from './PromptFlowLine.js';


export class Prompt {
    static allPrompts = [];

    private id: number;
    public promptLines: PromptFlowLine[];
    public promptNodes: PromptNode[];
    private _prompt: HTMLElement | null;
    private _promptFuncbar: PromptFuncBar;
    private _focusable: boolean;
    private _eventManager: EventManager;

    constructor(id: number) {
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

    private EventManager = class {
        parent: Prompt;

        constructor(parent: Prompt) {
            this.parent = parent;
            this.handleClickInside = this.handleClickInside.bind(this);
            this.handleClickOutside = this.handleClickOutside.bind(this);
        }

        attachEventListeners(): void {
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

        detachEventListeners(): void {
            this.parent._prompt.removeEventListener('click', this.handleClickInside, false);
            document.removeEventListener('click', this.handleClickOutside, false);
        }


        private handleClickInside(): void {
            if (!this.parent.focusable) return;
            // Unfocus all other prompts
            Prompt.allPrompts.forEach(p => {
                if (p !== this.parent && p._prompt.classList.contains("focused")) {
                    p.unfocus();
                }
            });
            this.parent.promptFocus();
        }

        private handleClickOutside(event: MouseEvent): void {
            if (!this.parent.focusable) return;
            const isClickInsideAnyPrompt = Prompt.allPrompts.some(p => p._prompt.contains(event.target as Node));
            if (!isClickInsideAnyPrompt) {
                this.parent.unfocus();
            }
        }
    }

    get focusable(): boolean {
        return this._focusable;
    }

    set focusable(focusable: boolean) {
        this._focusable = focusable;
    }

    promptFocus(): void {
        if (!this.focusable) return;
        this._prompt.classList.add("focused");
        this._promptFuncbar.enable();
    }

    unfocus(): void {
        if (!this.focusable) return;
        this._prompt.classList.remove("focused");
        this._promptFuncbar.disable();
    }


    //other methods to refactor
    get prompt() {
        return this._prompt;
    }

    set prompt(id) {
        this._prompt = document.getElementById("prompt" + id);
    }



    getrefMapX() {
        let nodeXs: Set<number> = new Set();
        this._prompt.querySelectorAll(".col").forEach((col) => {
            let nodeX = parseFloat(col.id.replace("col", "").replace("-", "."));
            console.log(nodeX);
            nodeXs.add(nodeX);
        });
        nodeXs.add(0);
        nodeXs.add(0.1);
        nodeXs.add(0.2);
        nodeXs.add(0.3);

        let sortedNodexs: number[] = Array.from<number>(nodeXs).sort((a, b) => a - b);
        return Prompt.processNodeX(sortedNodexs);
    }

    convertAbstoNodeX(abs: number) {
        //abs in rem
        let nodeXMap = this.getrefMapX(); //unit in rem
        console.log(nodeXMap);
        //find the floor value in nodeXMap that is less than abs
        let nodeX = 0;
        //loop through the nearest nodeXMap value to find the cooresponding key as nodeX
        for (let key in nodeXMap) {
            if (nodeXMap[key] <= (abs / 16)) {
                nodeX = parseFloat(key);
            }
        }
        return nodeX;
    }

    convertNodeXtoAbs(nodeX: number) {
        //abs in rem
        let nodeXMap = this.getrefMapX();
        return nodeXMap[nodeX];
    }

    convertAbstoNodeY(abs: number) {
        //abs(px) = nodeY * 1.5 + 'rem';
        //consider px to rem conversion
        return Math.floor(abs / 16 / 1.5);
    }


    static getPromptItembyPrompt(prompt: HTMLElement | null) {
        return Prompt.allPrompts.find(p => p.prompt === prompt);
    }

    static processNodeX(nodeXs: number[]): { [key: number]: number } {
        if (nodeXs.length === 2) {
            return { [nodeXs[0]]: 0, [nodeXs[1]]: 67.5 };
        }
        //this function is to position nodeX according to its value
        //ie. let's say that we have a series of nodes whose nodeXs are [0, 1, 1.1, 1.2, 1.3, 2]
        //An integer is a div with a width of 22.5rem, a float is a div with a width of 15rem
        //so firstly transform according to nodeX to get the coordinateX of the left edge of div
        //[0, 67.5rem, 90rem, 112.5rem, 135rem, 150rem, 165rem, 180rem,]
        //For conditions that have no float number bewteen integer like 0 and 1 in this, I 'd like to close the gap of 45rem
        //so the resulted left edge of div coordinateX is [0, 67.5rem-45rem, 90rem-45rem, 112.5rem-45rem, 135rem-45rem, 150rem-45rem, 165rem-45rem, 180rem-45rem,]
        //return a mapping relationship of nodeX to coordinateX
        // Constants for div widths
        const integerWidth = 22.5;  // Width for integers in rem
        const floatWidth = 15;      // Width for floats in rem
        const gapBetweenIntegers = 67.5;  // Gap between integers when preceded by an integer in rem

        // Array to store the accumulated widths leading to each node's x-coordinate
        let coordinates = [0]; // Start with 0 for the first node
        let lastIntegerIndex = 0; // Store the index of the last integer node

        // Iterate through nodeXs to calculate coordinates
        for (let i = 1; i < nodeXs.length; i++) {
            const prevNode = nodeXs[i - 1];
            const currentNode = nodeXs[i];
            const prevIsInteger = Number.isInteger(prevNode);
            const currentIsInteger = Number.isInteger(currentNode);

            if (currentIsInteger) {
                if (prevIsInteger) {
                    // Current and previous both integers
                    coordinates.push(coordinates[coordinates.length - 1] + integerWidth);
                } else {
                    // Current is integer, previous is float
                    coordinates.push(coordinates[lastIntegerIndex] + gapBetweenIntegers);
                }
                lastIntegerIndex = i;  // Update the last seen integer index
            } else {
                // Current is float
                const widthToAdd = prevIsInteger ? integerWidth : floatWidth;
                coordinates.push(coordinates[coordinates.length - 1] + widthToAdd);
            }
        }

        // Map nodeXs to their corresponding coordinates in rem units
        let nodeXToCoordinateXMap = {};
        nodeXs.forEach((node, index) => {
            nodeXToCoordinateXMap[node] = coordinates[index];
        });

        return nodeXToCoordinateXMap;
    }


    //prompt Manager

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

    getLinesWhereNodeasInput(nodeItem:PromptNode): PromptFlowLine[] {
        return this.promptLines.filter(line => line.start === nodeItem.node);
      }
    
    getLinesWhereNodeasOutput(nodeItem:PromptNode): PromptFlowLine[]{
        return this.promptLines.filter(line => line.end === nodeItem.node);
    }

}

//@ts-ignore
import { FuncBar } from '../FuncBar.js';
export class PromptFuncBar extends FuncBar {
    static allPromptFuncBars = [];
    activeToggle: HTMLElement;
    prompt: HTMLElement;
    selButton: HTMLElement;
    nodeButton: HTMLElement;
    promptItem: Prompt;
    container: HTMLElement;
    cleanupNodeMode: () => void;


    constructor(container: HTMLElement) {
        super(container);
        this.activeToggle = this.container.querySelector(".active");
        this.prompt = this.container.closest(".prompt");
        this.selButton = this.container.querySelector("#selmode");
        this.nodeButton = this.container.querySelector("#nodemode");
        PromptFuncBar.allPromptFuncBars.push(this);
    }

    activateFunction(id) {
        super.activateFunction(id); // Call base class method
        // Extend with specific functionality
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
        super.deactivateFunction(id); // Call base class method
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
                } else {
                    customNode.nodeWrapper.textContent = customNode.nodeWrapper.textContent.trim().toUpperCase();
                    customNode.delete();
                    let currentchildnodes = customNode.container.querySelectorAll(".node"); //event timing is important!

                    this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);//event timing is important!
                    let nodeX = this.promptItem.convertAbstoNodeX(customNode.nodeX);
                    let nodeY = this.promptItem.convertAbstoNodeY(customNode.nodeY);

                    let newNode = new PromptNode(customNode.nodeWrapper.textContent, nodeX, nodeY,
                        customNode.nodeTransform, customNode.nodeRGB, "UNKNOWN", customNode.container);

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
        }

        this.prompt.addEventListener('click', handleNodeClick);

        let handleBlur = () => {
            this.cleanupNodeMode();
            this.selButton.click();
        }

        this.prompt.addEventListener('blur', handleBlur);

        this.cleanupNodeMode = () => {
            this.promptItem.returnInfo();
            this.prompt.removeEventListener('click', handleNodeClick);
            this.prompt.removeEventListener('blur', handleBlur);
            console.log("Node mode deactivated");
        }
    }
    
    // handleToggleClick() {
    //     throw new Error('Method not implemented.');
    // }

    enable() {
        this.selButton.click();
        this.container.classList.remove("hidden");
    }

    disable() {
        this.container.classList.add("hidden");
        //deactivate all functions
        this.deactivateFunction("selmode");
        this.deactivateFunction("nodemode");
    }

    getAllPromptFuncBars() {
        return PromptFuncBar.allPromptFuncBars;
    }
}
