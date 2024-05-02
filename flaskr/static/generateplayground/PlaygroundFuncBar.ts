//@ts-ignore
import { FuncBar } from '../FuncBar.js';
//@ts-ignore
import { Prompt, PromptFuncBar } from './Prompt.js';
//@ts-ignore
import { PromptFlowline } from './PromptFlowline.js';
//@ts-ignore
import { PromptNode } from './PromptNode.js';

export class PlaygroundFuncBar extends FuncBar {
    constructor(container) {
        super(container);
        this.enableEditButton = this.container.querySelector("#enable-edit");
        this.disableEditButton = this.container.querySelector("#disable-edit");
    }

    activateFunction(id) {
        super.activateFunction(id); // Call base class method
        // Extend with specific functionality
        switch (id) {
            case 'add-input':
                this.handleNodeTabClick();
                break;
            case 'add-process':
                this.handleFlowlineTabClick()
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
        super.deactivateFunction(id); // Call base class method
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
                this.disablePromptFuncBars();
                this.enableEditButton?.classList?.remove('hidden');
                this.disableEditButton?.classList?.add('hidden');
                break;
        }
    }

    setEditMode() {
        PromptNode.nodeSel = false;
        PromptFlowline.lineSel = false;
        this.enableEditButton?.classList?.add('hidden');
        this.disableEditButton?.classList?.remove('hidden');
        this.enablePromptFuncBars();
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
        PromptFlowline.rmSelFlowStyle();
        PromptFlowline.rmAllIdentifiers();
        let event = new CustomEvent('disableFlowlineTabClick');
        document.dispatchEvent(event);
    }

    enablePromptFuncBars() {
        Prompt.allPrompts.forEach(prompt => {
            prompt.focusable = true
        });
    }

    disablePromptFuncBars() {
        Prompt.allPrompts.forEach(prompt => {
            prompt.unfocus();
            prompt.focusable = false
        });
    }

    returnMode() {
        this.activeToggle = this.container.querySelector(".active");
        if (this.activeToggle && this.activeToggle != this.enableEditButton) {
            console.log(this.activeToggle.id);
            return this.activeToggle.id;
        }
    }
}





