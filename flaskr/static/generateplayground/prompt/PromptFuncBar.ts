//@ts-ignore
import { FuncBar } from '../../FuncBar.js';
//@ts-ignore
import { PromptNode } from './PromptNode.js';
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


    constructor(container: HTMLElement) {
        super(container);
        // this.activeToggle = this.container.querySelector(".active");
        this.prompt = this.container.closest(".prompt");
        // this.selButton = this.container.querySelector("#selmode");
        this.nodeButton = this.container.querySelector("#nodemode");
        this.flowButton = this.container.querySelector("#flowmode");
        PromptFuncBar.allPromptFuncBars.push(this);
    }

    activateFunction(id: string) {
        super.activateFunction(id); // Call base class method
        // Extend with specific functionality
        switch (id) {
            // case 'selmode':
            //     this.setSelMode();
            //     break;
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
            // case 'selmode':
            //     this.unsetSelMode();
            //     break;
            case 'nodemode':
                this.unsetNodeMode();
                break;
            case 'flowmode':
                this.unsetFlowMode();
                break;
        }
    }

    // setSelMode() {
    //     document.body.style.cursor = "default";
    // }

    // unsetSelMode() {
    //     document.body.style.cursor = "default";
    //     this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
    //     this.promptItem.returnInfo();
    // }


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

    handleNodeClick = (e: Event) => {
        // console.log(e.target)
        if (e.target.closest('.node')) return;

        let customNode = PromptNode.addCustomNode(e);
        customNode.nodeWrapper.addEventListener('blur', (e) => {

            if (!customNode.nodeWrapper.textContent) {
                customNode.delete();
            } else {
                customNode.nodeWrapper.textContent = customNode.nodeWrapper.textContent.trim().toUpperCase();
                customNode.delete();
                let currentchildnodes = customNode.container.querySelectorAll(".node"); //event timing is important!

                this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);//event timing is important!
                // let nodeX = this.promptItem.convertAbstoNodeX(customNode.nodeX);
                // let nodeY = this.promptItem.convertAbstoNodeY(customNode.nodeY);

                let newNode = new PromptNode(customNode.nodeWrapper.textContent, customNode.nodeX, customNode.nodeY,
                    customNode.nodeTransform, customNode.nodeRGB, "UNKNOWN", customNode.container);

                for (let i = 0; i < currentchildnodes.length; i++) {
                    if (customNode.nodeWrapper.textContent === currentchildnodes[i].textContent) {
                        newNode.delete();
                    }
                }

                // console.log("Node created");
            }
            this.cleanupNodeMode();
            // this.selButton.click();

        }, { once: true });
    }

    handleBlur = () => {
        this.cleanupNodeMode();
        this.selButton.click();
    }

    cleanupNodeMode = () => {
        this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
        this.promptItem.returnInfo();
    }

    setFlowMode() {
        //add all Temp Itentifiers 
        this.promptItem = Prompt.getPromptItembyPrompt(this.prompt);
        this.promptItem.promptNodes.forEach(node => {
            let identifier1 = createTempIdentifierHTML(node.node, 'input-identifier');
            let identifier2 = createTempIdentifierHTML(node.node, 'output-identifier');
            let temp1 = new Temp(identifier1);
            let temp2 = new Temp(identifier2);
        });

        //eventlistener in PromptNodes changes cursor style
        let event = new CustomEvent('TempClick');
        document.dispatchEvent(event);
        // console.log("Flow Mode Set");
    }

    unsetFlowMode() {
        //remove all Temp Identifiers
        Temp.allTemps.slice().forEach(temp => {
            temp.remove();
        });

        //eventlistener in PromptNodes changes cursor style
        let event = new CustomEvent('disableTempClick');
        document.dispatchEvent(event);
    }

    enable() {
        this.container.classList.remove("hidden");
        this.nodeButton.click();
    }

    disable() {
        this.container.classList.add("hidden");
        //deactivate all functions
        this.deactivateFunction("selmode");
        this.deactivateFunction("nodemode");
        this.deactivateFunction("flowmode");
    }


}

function createTempIdentifierHTML(container: HTMLElement, identifierClass: string) {
    let identifier = document.createElement("div");
    identifier.classList.add(identifierClass);
    let identifierDot = document.createElement("div");
    identifierDot.classList.add('identifier-temp', 'identifier-unselected');
    identifier.appendChild(identifierDot);
    container.appendChild(identifier);
    return identifier;
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
        this.selectable = true; //when initialized, all temps are selectable
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
    handleAddLine(event: CustomEvent) {
        let total = Temp.totalSelected.length;

        if (total === 0 || total > 2) {
            // console.log('all not selected')
            Temp.allTemps.forEach(temp => {
                temp.selectable = true;
                // console.log("unselcting all")
                temp.unselect();
            });
            return;
        }

        if (total >= 1) {
            //disable all selectable
            Temp.allTemps.forEach(temp => {
                temp.selectable = false;
            });
            // console.log(Temp.totalSelected);
        }

        //if total is 1, enter "to add mode"
        if (total === 1) {
            if (event.detail === this) {
                this.selectable = true;
                if (this.temp.closest('.input-identifier')) {
                    Temp.allTemps.forEach(temp => {
                        if (temp.tempContent !== this.tempContent && temp.temp.closest('.output-identifier')) {
                            temp.selectable = true;
                            temp.toselect();
                        }
                    })
                } else if (this.temp.closest('.output-identifier')) {
                    Temp.allTemps.forEach(temp => {
                        if (temp.tempContent !== this.tempContent && temp.temp.closest('.input-identifier')) {
                            temp.selectable = true;
                            temp.toselect();
                        }
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
                // console.log(startNode, endNode)
                line = new PromptFlowline(startNode, endNode);
                promptItem.returnInfo();//save the info immediately after adding the line
            }

            Temp.allTemps.forEach(temp => {
                temp.selectable = true;
                temp.unselect();
            })
        }

    }

    toselect() {
        this.temp.querySelector('.identifier-temp').classList?.remove('identifier-unselected');
        this.temp.querySelector('.identifier-temp').classList?.add('identifier-toselect');
    }

    unselect() {
        if (!this.selectable) return;
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
        } // timing is very impoortant as the count of total selected matters
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
        event = new CustomEvent('TempClick');
        document.dispatchEvent(event);
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