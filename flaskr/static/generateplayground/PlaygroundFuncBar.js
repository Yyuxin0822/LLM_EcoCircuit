import { FuncBar } from '../FuncBar.js';
import { Prompt } from './prompt/Prompt.js';
import { PromptFlowline } from './prompt/PromptFlowline.js';
import { PromptNode } from './prompt/PromptNode.js';
export class PlaygroundFuncBar extends FuncBar {
    constructor(container) {
        super(container);
        this.currentMode = "";
        this.currentAgent = "";
    }
    updateAgentAndMode(id) {
        const newAgent = PlaygroundFuncBar.aiMethods.includes(id) ? 'AI' : PlaygroundFuncBar.humanMethods.includes(id) ? 'Human' : '';
        const isSwitchingToAI = newAgent === 'AI' && this.currentAgent !== 'AI';
        const isSwitchingToHuman = newAgent === 'Human' && this.currentAgent !== 'Human';
        this.currentAgent = newAgent;
        this.currentMode = id;
        return { isSwitchingToAI, isSwitchingToHuman };
    }
    activateFunction(id) {
        super.activateFunction(id);
        this.openInstruction(id);
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
            case 'update-image':
                this.activateInfoEdit();
                break;
            case 'more-io':
                this.activateInfoEdit();
                break;
            case 'drawmode':
                Prompt.allPrompts.forEach(prompt => {
                    prompt._prompt.querySelector("#drawmode").click();
                });
                break;
            case 'nodemode':
                Prompt.allPrompts.forEach(prompt => {
                    prompt._prompt.querySelector("#nodemode").click();
                });
                break;
            case 'flowmode':
                Prompt.allPrompts.forEach(prompt => {
                    prompt._prompt.querySelector("#flowmode").click();
                });
                break;
            case 'editinfo':
                this.activateInfoEdit();
                this.activateTitleEdit();
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
            case 'update-image':
                this.deactivateInfoEdit();
                break;
            case 'more-io':
                this.deactivateInfoEdit();
                break;
            case 'drawmode':
                break;
            case 'nodemode':
                break;
            case 'flowmode':
                break;
            case 'editinfo':
                this.deactivateInfoEdit();
                this.deactivateTitleEdit();
                break;
        }
    }
    openInstruction(id) {
        let instructid = id + "-instruction";
        let instruction = document.getElementById(instructid);
        if (instruction) {
            let instructContainer = instruction.closest(".option-instruct");
            instructContainer.querySelectorAll(".instruct").forEach((element) => {
                element.classList.add("hidden");
            });
            instruction.classList.remove("hidden");
            instructContainer.classList.remove("hidden");
            instructContainer.querySelectorAll(".component-wrapper").forEach((element) => {
                element.style.display = "none";
            });
            let optiongroup1 = ["add-input", "add-process", "add-cooptimization", "add-output", "add-feedback"];
            if (optiongroup1.includes(id)) {
                document.getElementById("quickgen").style.display = "flex";
            }
            let optiongroup2 = ["more-io"];
            if (optiongroup2.includes(id)) {
                document.getElementById("add-io").style.display = "flex";
            }
            let optiongroup3 = ["update-image"];
            if (optiongroup3.includes(id)) {
                document.getElementById("regen-image").style.display = "flex";
            }
        }
        PromptFlowline.fixLine();
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
    returnMode() {
        this.activeToggle = this.container.querySelector(".active");
        if (this.activeToggle && this.activeToggle != this.enableEditButton) {
            console.log(this.activeToggle.id);
            return this.activeToggle.id;
        }
    }
    activateInfoEdit() {
        let info = document.getElementById("info");
        let infoPrev = document.getElementById("info-previous");
        info.contentEditable = true;
        info.focus();
        info?.addEventListener('blur', function () {
            if (!info.textContent) {
                info.textContent = infoPrev.textContent;
                return;
            }
            else {
                let project_id = document.getElementById('project_id').innerText;
                let data = { project_id: project_id, info: info.textContent };
                return emitSocket("save_info", data).then(() => {
                    infoPrev.textContent = info.textContent;
                }).catch(error => {
                    console.error("Failed to emit socket:", error);
                });
            }
        });
    }
    deactivateInfoEdit() {
        let info = document.getElementById("info");
        info.contentEditable = false;
    }
    activateTitleEdit() {
        let projectTitle = document.getElementById("pjtitle");
        let projectTitlePrev = document.getElementById("pjtitle-previous");
        projectTitle.contentEditable = true;
        projectTitle?.addEventListener('blur', function () {
            if (!projectTitle.textContent) {
                projectTitle.textContent = projectTitlePrev.textContent;
                return;
            }
            else {
                let project_id = document.getElementById('project_id').innerText;
                let data = { project_id: project_id, title: projectTitle.innerText };
                return emitSocket("save_title", data).then(() => {
                    projectTitlePrev.textContent = projectTitle.textContent;
                }).catch(error => {
                    console.error("Failed to emit socket:", error);
                });
            }
        });
    }
    deactivateTitleEdit() {
        let projectTitle = document.getElementById("pjtitle");
        projectTitle.contentEditable = false;
    }
    disable() {
        this.addInputButton.click();
    }
    enable() {
        this.enableEditButton.click();
    }
    ;
}
PlaygroundFuncBar.aiMethods = ["add-input", "add-process", "add-coop", "add-output", "add-feedback", "update-image", "more-io"];
PlaygroundFuncBar.humanMethods = ["drawmode", "nodemode", "flowmode"];
