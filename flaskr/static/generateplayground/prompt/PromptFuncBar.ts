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

        let handleNodeClick = (e:Event) => {

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
        PromptFlowline.lineAdd = true;

        //add all Temp Itentifiers 
        this.promptItem.promptNodes.forEach(node => {
            node.setIdentifier('input-identifier');
            node.setIdentifier('output-identifier');});
            
        //eventlistener in PromptNodes changes cursor style
        let event = new CustomEvent('flowlineTabClick');
        document.dispatchEvent(event);
    }

    unsetFlowMode() {
        PromptFlowline.lineAdd = false;
        this.promptItem.promptNodes.forEach(node => {
            node.rmIdentifier('input-identifier');
            node.rmIdentifier('output-identifier');
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
