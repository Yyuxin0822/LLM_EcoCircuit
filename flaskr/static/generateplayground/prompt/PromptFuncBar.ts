//@ts-ignore
import { FuncBar } from '../../FuncBar.js';
//@ts-ignore
import { PromptNode, PromptNodeDrpDwn, PromptCustomNode } from './PromptNode.js';
//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';
//@ts-ignore
import { PromptIdentifier } from './PromptIdentifier.js';
//@ts-ignore
import { Prompt } from './Prompt.js';


export class PromptFuncBar extends FuncBar {
    static allPromptFuncBars = [];
    activeToggle: HTMLElement;
    prompt: HTMLElement;
    selButton: HTMLElement;
    nodeButton: HTMLElement;
    flowButton: HTMLElement;
    promptItem: Prompt;
    container: HTMLElement;
    cleanupNodeMode: () => void;


    constructor(container: HTMLElement) {
        super(container);
        this.activeToggle = this.container.querySelector(".active");
        this.prompt = this.container.closest(".prompt");
        this.selButton = this.container.querySelector("#selmode");
        this.nodeButton = this.container.querySelector("#nodemode");
        this.flowButton = this.container.querySelector("#flowmode");
        PromptFuncBar.allPromptFuncBars.push(this);
    }

    activateFunction(id: string) {
        super.activateFunction(id); // Call base class method
        // Extend with specific functionality
        switch (id) {
            case 'selmode':
                this.setSelMode();
                break;
            case 'nodemode':
                this.setNodeMode();
                break;
            case 'flowmode':
                this.setFlowMode();
                break;
        }
    }

    deactivateFunction(id: string) {
        super.deactivateFunction(id); // Call base class method
        switch (id) {
            case 'selmode':
                this.unsetSelMode();
                break;
            case 'flowmode':
                this.unsetFlowMode();
                break;
        }
    }

    setSelMode() {
        document.body.style.cursor = "default";
    }

    unsetSelMode() {
        document.body.style.cursor = "default";
        this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
        this.promptItem.returnInfo();
    }

    setNodeMode() {
        document.body.style.cursor = "crosshair";

        let handleNodeClick = (e: Event) => {

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

    setFlowMode() {
        //add all Temp Itentifiers 
        function createTempIdentifierHTML(container: HTMLElement, identifierClass: string) {
            let identifier = document.createElement("div");
            identifier.classList.add(identifierClass);
            let identifierDot = document.createElement("div");
            identifierDot.classList.add('identifier-temp', 'identifier-unselected');
            identifier.appendChild(identifierDot);
            container.appendChild(identifier);
            return identifier;
        }

        this.promptItem.promptNodes.forEach(node => {
            let identifier1 = createTempIdentifierHTML(node.node, 'input-identifier');
            let identifier2 = createTempIdentifierHTML(node.node, 'output-identifier');
            let temp1 = new Temp(identifier1);
            let temp2 = new Temp(identifier2);
        });
        console.log("All temps:", Temp.allTemps.length);
        //eventlistener in PromptNodes changes cursor style
        let event = new CustomEvent('flowlineTabClick');
        document.dispatchEvent(event);

    }

    unsetFlowMode() {
        //remove all Temp Identifiers
        Temp.allTemps.slice().forEach(temp => {
            temp.remove();
        });
        
        //eventlistener in PromptNodes changes cursor style
        let event = new CustomEvent('disableFlowlineTabClick');
        document.dispatchEvent(event);
    }

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


}


let Temp = class {
    static totalSelected = [];
    static allTemps = []; //keep lifecycle of all temps
    temp: HTMLElement;
    tempContent: string;
    selected: boolean;
    selectable: boolean;

    constructor(temp: HTMLElement) {
        this.temp = temp;
        this.tempContent = this.temp.closest('.node').textContent;
        this.selected = false;
        this.selectable = true;
        this.temp.addEventListener('temp-add', this.handleAddLine.bind(this));
        this.temp.addEventListener('click', this.handleClick.bind(this));
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

    handleAddLine(event: CustomEvent) {
        let total = Temp.totalSelected.length;
        if (total >= 1) {
            console.log(Temp.totalSelected);
        }

        //if total is i one, enter "to add mode"
        if (total === 1) {
            if (event.detail === this) {
                if (this.temp.closest('.input-identifier')) {
                    Temp.allTemps.forEach(temp => {
                        if (temp.tempContent !== this.tempContent && temp.temp.closest('.output-identifier')) {
                            temp.toselect();
                        } else { temp.selectable = false; }
                    })
                } else if (this.temp.closest('.output-identifier')) {
                    Temp.allTemps.forEach(temp => {
                        if (temp.tempContent !== this.tempContent && temp.temp.closest('.input-identifier')) {
                            if (temp === this) {
                                console.log("same");
                            }
                            temp.toselect();
                        } else { temp.selectable = false; }
                    })
                }

            }
        }

        //if total is two, try to create the line
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
                console.log(startNode, endNode)
                line = new PromptFlowline(startNode, endNode);
                promptItem.returnInfo();//save the info immediately after adding the line
            }

            Temp.allTemps.forEach(temp => {
                temp.unselect();
                temp.selectable = true;
            })
        }

    }

    toselect() {
        this.temp.querySelector('.identifier-temp').classList?.remove('identifier-unselected');
        this.temp.querySelector('.identifier-temp').classList?.add('identifier-toselect');
    }

    unselect() {
        this.temp.querySelector('.identifier-temp').classList?.remove('identifier-selected');
        this.temp.querySelector('.identifier-temp').classList?.remove('identifier-toselect');
        this.temp.querySelector('.identifier-temp').classList?.add('identifier-unselected');
        let index = Temp.totalSelected.indexOf(this);
        if (index > -1) {
            Temp.totalSelected.splice(index, 1);
        }
    }

    select() {
        if (!this.selectable) return;
        if (this.selected) return;
        this.selected = true;
        Temp.totalSelected.push(this);
        this.temp.querySelector('.identifier-temp').classList?.remove('identifier-toselect');
        this.temp.querySelector('.identifier-temp').classList?.remove('identifier-unselected');
        this.temp.querySelector('.identifier-temp').classList?.add('identifier-selected');
        let event = new CustomEvent('temp-add', { detail: this });
        this.temp.dispatchEvent(event);
    }

    remove() {
        // Detach event listeners
        this.temp.removeEventListener('temp-add', this.handleAddLine.bind(this));
        this.temp.removeEventListener('click', this.handleClick.bind(this));

        // Remove from allTemps array
        let index = Temp.allTemps.indexOf(this);
        if (index > -1) {
            Temp.allTemps.splice(index, 1);
        }
        // Remove the HTML element from the DOM
        this.temp.remove();
    }

};