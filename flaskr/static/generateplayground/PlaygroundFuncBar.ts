//@ts-ignore
import { FuncBar } from '../FuncBar.js';
//@ts-ignore
import { Prompt} from './prompt/Prompt.js';
//@ts-ignore
import { PromptFlowline } from './prompt/PromptFlowline.js';
//@ts-ignore
import { PromptNode} from './prompt/PromptNode.js';
//@ts-ignore
import { PromptNodeDrpDwn } from './prompt/PromptNodeDrpDwn.js';

export class PlaygroundFuncBar extends FuncBar {
    enableEditButton: HTMLElement | null;
    disableEditButton: HTMLElement | null;
    container: HTMLElement;
    activeToggle: HTMLElement | null;

    constructor(container: HTMLElement) {
        super(container);
        this.enableEditButton = this.container.querySelector("#enable-edit");
        this.disableEditButton = this.container.querySelector("#disable-edit");
    }

    activateFunction(id: string) {
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
        //toggle edit button
        PromptFlowline.lineSel = false;
        PromptNode.nodeSel = false;
        //enable all prompts, then autofocus to the first prompt
        Prompt.allPrompts.forEach(prompt => {
            prompt.focusable = true
        });
        PromptNodeDrpDwn.globalEnabled = true;

        //get the first prompt
        let firstPrompt = Prompt.allPrompts[Prompt.allPrompts.length - 1];
        firstPrompt.promptFocus();
    }

    unsetEditMode() {
        Prompt.allPrompts.forEach(prompt => {
            prompt.unfocus();
            prompt.focusable = false
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





