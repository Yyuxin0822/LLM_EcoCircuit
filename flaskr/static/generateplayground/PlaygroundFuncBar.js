import { FuncBar } from '../FuncBar.js';
import { Prompt } from './prompt/Prompt.js';
import { PromptFlowline } from './prompt/PromptFlowline.js';
import { PromptNode } from './prompt/PromptNode.js';
import { PromptNodeDrpDwn } from './prompt/PromptNodeDrpDwn.js';
export class PlaygroundFuncBar extends FuncBar {
    constructor(container) {
        super(container);
        this.enableEditButton = this.container.querySelector("#enable-edit");
        this.disableEditButton = this.container.querySelector("#disable-edit");
    }
    activateFunction(id) {
        super.activateFunction(id);
        switch (id) {
            case 'add-input':
                this.handleNodeTabClick();
                break;
            case 'add-process':
                this.handleFlowlineTabClick();
                break;
            case 'add-cooptimization':
                this.handleNodeTabClick();
                break;
            case 'add-output':
                this.handleNodeTabClick();
                break;
            case 'add-feedback':
                this.handleNodeTabClick();
                break;
            case 'enable-edit':
                this.setEditMode();
                break;
        }
    }
    deactivateFunction(id) {
        super.deactivateFunction(id);
        switch (id) {
            case 'add-input':
                this.disableNodeTabClick();
                break;
            case 'add-process':
                this.disableFlowlineTabClick();
                break;
            case 'add-cooptimization':
                this.disableNodeTabClick();
                break;
            case 'add-output':
                this.disableNodeTabClick();
                break;
            case 'add-feedback':
                this.disableNodeTabClick();
                break;
            case 'enable-edit':
                this.unsetEditMode();
                break;
        }
    }
    handleNodeTabClick() {
        PromptNode.nodeSel = true;
        let event = new CustomEvent('nodeTabClick');
        document.dispatchEvent(event);
    }
    handleFlowlineTabClick() {
        PromptFlowline.lineSel = true;
        PromptFlowline.addAllIdentifiers();
        let event = new CustomEvent('flowlineTabClick');
        document.dispatchEvent(event);
    }
    disableNodeTabClick() {
        PromptNode.nodeSel = false;
        PromptNode.rmNodeSel();
        let event = new CustomEvent('disableNodeTabClick');
        document.dispatchEvent(event);
    }
    disableFlowlineTabClick() {
        PromptFlowline.lineSel = false;
        PromptFlowline.rmAllSelFlow();
        PromptFlowline.rmAllIdentifiers();
        let event = new CustomEvent('disableFlowlineTabClick');
        document.dispatchEvent(event);
    }
    setEditMode() {
        PromptFlowline.lineSel = false;
        PromptNode.nodeSel = false;
        Prompt.allPrompts.forEach(prompt => {
            prompt.focusable = true;
        });
        PromptNodeDrpDwn.globalEnabled = true;
        let firstPrompt = Prompt.allPrompts[Prompt.allPrompts.length - 1];
        firstPrompt.promptFocus();
    }
    unsetEditMode() {
        Prompt.allPrompts.forEach(prompt => {
            prompt.unfocus();
            prompt.focusable = false;
        });
        PromptNodeDrpDwn.globalEnabled = false;
    }
    returnMode() {
        this.activeToggle = this.container.querySelector(".active");
        if (this.activeToggle && this.activeToggle != this.enableEditButton) {
            console.log(this.activeToggle.id);
            return this.activeToggle.id;
        }
    }
}
