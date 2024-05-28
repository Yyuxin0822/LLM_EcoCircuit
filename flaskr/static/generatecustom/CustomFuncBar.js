import { MarqueeTool } from "./MarqueeTool.js";
import { CustomCanvasDraw } from "./CustomCanvasDraw.js";
import { CustomNode } from "./CustomNode.js";
import { CustomFlowline } from "./CustomFlowline.js";
const customprompt = document.getElementById("customprompt");
export class CustomFuncBar {
    constructor(container) {
        this.contanier = container;
        this.customtoggles = this.contanier.querySelectorAll(".custom-toggle");
        this.drawButton = this.contanier.querySelector("#drawmode");
        this.nodeButton = this.contanier.querySelector("#nodemode");
        this.selButton = this.contanier.querySelector("#selmode");
        this.fullButton = this.contanier.querySelector("#fullscreen");
        this.marqueeToolInstance = null;
        this.canvasDrawInstance = new CustomCanvasDraw("canvasDraw", customprompt);
        this.attachEventListeners();
    }
    attachEventListeners() {
        this.customtoggles.forEach((toggle) => {
            toggle.addEventListener('click', (event) => {
                this.handleToggleClick(toggle);
            });
        });
        document.addEventListener('DOMContentLoaded', () => {
            this.customtoggles.forEach((toggle) => {
                if (toggle.classList.contains('active')) {
                    this.activateFunction(toggle.id);
                }
                else {
                    this.deactivateFunction(toggle.id);
                }
            });
        });
    }
    handleToggleClick(toggle) {
        this.customtoggles.forEach(t => {
            t.classList.remove("active");
            t.classList.add("inactive");
            if (t !== toggle) {
                this.deactivateFunction(t.id);
            }
        });
        toggle.classList.remove("inactive");
        toggle.classList.add("active");
        this.activateFunction(toggle.id);
    }
    activateFunction(id) {
        switch (id) {
            case 'selmode':
                this.marqueeToolInstance = this.setSelMode();
                break;
            case 'drawmode':
                this.setDrawMode();
                break;
            case 'nodemode':
                this.setNodeMode();
                break;
            case 'fullscreen':
                this.fullScreen();
                break;
        }
        console.log(`Activated ${id}`);
    }
    deactivateFunction(id) {
        switch (id) {
            case 'selmode':
                if (this.marqueeToolInstance) {
                    this.marqueeToolInstance.remove();
                    this.marqueeToolInstance = null;
                }
                break;
            case 'drawmode':
                if (this.canvasDrawInstance.enabled) {
                    this.canvasDrawInstance.disable();
                }
                break;
        }
        console.log(`Deactivated ${id}`);
    }
    setSelMode() {
        console.log("Selection mode");
        CustomNode.customNodeSel = true;
        CustomFlowline.customsel = true;
        let marquee = new MarqueeTool(customprompt);
        return marquee;
    }
    setDrawMode() {
        console.log("Draw mode");
        console.log(this.marqueeToolInstance);
        this.canvasDrawInstance.enable();
    }
    setNodeMode() {
        console.log("Node mode");
        document.body.style.cursor = "crosshair";
        let handleNodeClick = (e) => {
            let customNode = CustomNode.addCustomNode(e);
            customNode.nodeWrapper.addEventListener('blur', (e) => {
                if (!customNode.nodeWrapper.textContent) {
                    console.log(customNode.nodeWrapper.textContent);
                    console.log("Deleting node");
                    customNode.delete();
                }
                else {
                    console.log("Node created");
                    customNode.nodeWrapper.textContent = customNode.nodeWrapper.textContent.trim().toUpperCase();
                    let newNode = new CustomNode(customNode.nodeWrapper.textContent, customNode.nodeX, customNode.nodeY, customNode.nodeTransform, customNode.nodeRGB, customprompt);
                    customNode.delete();
                }
                this.cleanupNodeMode();
                this.handleToggleClick(this.selButton);
            }, { once: true });
        };
        customprompt.addEventListener('click', handleNodeClick);
        let handleBlur = () => {
            this.cleanupNodeMode();
            this.activateFunction('selmode');
        };
        customprompt.addEventListener('blur', handleBlur);
        this.cleanupNodeMode = () => {
            customprompt.removeEventListener('click', handleNodeClick);
            customprompt.removeEventListener('blur', handleBlur);
            document.body.style.cursor = "default";
            console.log("Node mode deactivated");
        };
    }
    fullScreen() {
    }
}
const customFuncBar = new CustomFuncBar(document);
function createDropdown(object, menuItems) {
    var dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';
    object.appendChild(dropdown);
    for (var i = 0; i < menuItems.length; i++) {
        appendDropdownItem(menuItems[i], dropdown);
    }
}
function appendDropdownItem(itemName, dropdown) {
    let item = document.createElement('div');
    item.className = 'dropdown-item';
    item.id = "dropdown" + validId(itemName);
    item.innerHTML = "&#9656  " + itemName;
    dropdown.appendChild(item);
}
