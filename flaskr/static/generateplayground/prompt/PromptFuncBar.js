import { FuncBar } from '../../FuncBar.js';
import { PromptNode } from './PromptNode.js';
import { PromptFlowline } from './PromptFlowline.js';
import { Prompt } from './Prompt.js';
export class PromptFuncBar extends FuncBar {
    constructor(container) {
        super(container);
        this.activeToggle = this.container.querySelector(".active");
        this.prompt = this.container.closest(".prompt");
        this.selButton = this.container.querySelector("#selmode");
        this.nodeButton = this.container.querySelector("#nodemode");
        this.flowButton = this.container.querySelector("#flowmode");
        PromptFuncBar.allPromptFuncBars.push(this);
    }
    activateFunction(id) {
        super.activateFunction(id);
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
    deactivateFunction(id) {
        super.deactivateFunction(id);
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
    setFlowMode() {
        PromptFlowline.lineAdd = true;
        this.promptItem.promptNodes.forEach(node => {
            node.setIdentifier('input-identifier');
            node.setIdentifier('output-identifier');
        });
        let event = new CustomEvent('flowlineTabClick');
        document.dispatchEvent(event);
    }
    unsetFlowMode() {
        PromptFlowline.lineAdd = false;
        this.promptItem.promptNodes.forEach(node => {
            node.rmIdentifier('input-identifier');
            node.rmIdentifier('output-identifier');
        });
        let event = new CustomEvent('disableFlowlineTabClick');
        document.dispatchEvent(event);
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
}
PromptFuncBar.allPromptFuncBars = [];
