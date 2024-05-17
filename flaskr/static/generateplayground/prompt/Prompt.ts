//@ts-ignore
import { PromptNode } from './PromptNode.js';
//@ts-ignore
import { PromptCustomNode } from './PromptNode.js';
//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';
//@ts-ignore
import { PromptFuncBar } from './PromptFuncBar.js';
//@ts-ignore
import { PromptNodeDrpDwn } from './PromptNodeDrpDwn.js';

export class Prompt {
    static allPrompts = [];

    private id: number;
    public promptLines: PromptFlowline[];
    public promptNodes: PromptNode[];
    private _prompt: HTMLElement | null;
    private _promptFuncbar: PromptFuncBar;
    private _focusable: boolean; //if the prompt is focusable, controled by the playgroundFuncBar
    private _focused: boolean; //if the prompt is focused, record the status
    private _eventManager: EventManager;

    constructor(id: number) {
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

    private EventManager = class {
        parent: Prompt;

        constructor(parent: Prompt) {
            this.parent = parent;
            this.handleClickInside = this.handleClickInside.bind(this);
            this.handleClickOutside = this.handleClickOutside.bind(this);
        }

        attachEventListeners(): void {
            this.parent._prompt.addEventListener('click', (e) => {
                if (e.target.closest(".identifier-dot")) {
                    e.stopPropagation();
                }
                this.handleClickInside();
            }, false);

            this.parent._prompt.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                // e.stopPropagation();
            });

            document.addEventListener('click', this.handleClickOutside, false);
        }

        detachEventListeners(): void {
            this.parent._prompt.removeEventListener('click', this.handleClickInside, false);
            document.removeEventListener('click', this.handleClickOutside, false);
        }


        private handleClickInside(): void {
            if (!this.parent.focusable) return;
            if (this.parent.focused) return;
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

            const isClickInsideAnyPrompt = Prompt.allPrompts.some(p => p._prompt.contains(event.target as HTMLElement));
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

    get focused(): boolean {
        return this._focused;
    }

    set focused(focused: boolean) {
        this._focused = focused;
    }

    promptFocus(): void {
        if (!this.focusable) return;
        this._prompt.classList.add("focused"); // Add focus style
        this._promptFuncbar.enable(); // Enable the function bar
        this._focused = true;
    }

    unfocus(): void {
        if (!this.focusable) return;
        this._prompt.classList.remove("focused");
        this._promptFuncbar.disable();
        this.promptNodes.forEach(node => {
            node.dropdown?.remove();
        });
        this._focused = false;
    }


    //other methods to refactor
    get prompt(): HTMLElement | null {
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
        let nodeXs: Set<number> = new Set();
        this._prompt.querySelectorAll(".col").forEach((col) => {
            let nodeX = parseFloat(col.id.replace("col", "").replace("-", "."));
            // console.log(nodeX);
            nodeXs.add(nodeX);
        });
        nodeXs.add(0);
        nodeXs.add(0.1);
        nodeXs.add(0.2);
        nodeXs.add(0.3);

        let sortedNodexs: number[] = Array.from<number>(nodeXs).sort((a, b) => a - b);
        return Prompt.processNodeX(sortedNodexs);
    }

    convertAbstoNodeX(abs: number): number {
        //abs in px
        let nodeXMap = this.getrefMapX(); //unit in rem

        // console.log(nodeXMap);
        //find the floor value in nodeXMap that is less than abs
        let nodeX = 0;
        //loop through the nearest nodeXMap value to find the cooresponding key as nodeX
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

    convertNodeXtoAbs(nodeX: number): number {
        //abs in rem
        let nodeXMap = this.getrefMapX();

        return nodeXMap[nodeX];
    }

    convertAbstoNodeY(abs: number) {
        //abs(px) = nodeY * 1.5 + 'rem';
        //consider px to rem conversion
        return Math.floor(abs / 16 / 1.5) - 2;
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

        emitSocket('save_prompt', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix });
        return { prompt_id, flow, nodematrix };
    }


    returnQuery(): { prompt_id: number, query: any[] } {
        this.returnInfo(); //always save current matrix and flow

        let prompt_id = this.id;
        let query = [];
        if (PromptNode.nodeSel) {
            this.promptNodes.forEach(node => {
                if (node.selected)
                    query.push(node.nodeContent);
            })
        }

        if (PromptFlowline.lineSel) {
            this.promptLines.forEach(line => {
                if (line.selected)
                    query.push(line.toJSONArray());
            })
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
                Object.assign(nodeObjs, node.toJSONobj());   // This needs to be converted to the correct value 
            });
            nodematrix.push(nodeObjs);
        });
        return { prompt_id, flow, nodematrix };
    }


    static returnAllQuery(): { prompt_id_array: number[], query_array: any[] } {
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


    collectCustomInfo(mode: string) {
        let flow = [];
        let nodematrix = {};
        if (mode === 'send-all') {
            this.promptLines.forEach(line => {
                flow.push(line.toJSONArray());
            });
            this.promptNodes.forEach(node => {
                Object.assign(nodematrix, node.toJSONObj(true));
            });
        }

        if (mode === 'send-selected') {
            this.promptLines.forEach(line => {
                if (line.selected)
                    flow.push(line.toJSONArray());
                //push the start and end node of the line
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


    getLinesWhereNodeasInput(nodeItem: PromptNode): PromptFlowline[] {
        return this.promptLines.filter(line => line.start === nodeItem.node);
    }

    getLinesWhereNodeasOutput(nodeItem: PromptNode): PromptFlowline[] {
        return this.promptLines.filter(line => line.end === nodeItem.node);
    }

}

