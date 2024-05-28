//@ts-ignore
import { MarqueeTool } from "./MarqueeTool.js";
//@ts-ignore
import { CustomCanvasDraw } from "./CustomCanvasDraw.js";
//@ts-ignore
import { CustomNode } from "./CustomNode.js";
//@ts-ignore
import { CustomFlowline } from "./CustomFlowline.js";

const customprompt = document.getElementById("customprompt");

export class CustomFuncBar {
  contanier: HTMLElement;
  customtoggles: NodeListOf<Element>;
  drawButton: HTMLElement;
  nodeButton: HTMLElement;
  selButton: HTMLElement;
  fullButton: HTMLElement;
  marqueeToolInstance: MarqueeTool;
  canvasDrawInstance: CanvasDraw;


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
        } else {
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
        this.deactivateFunction(t.id); // Ensure proper deactivation
      }
    });

    toggle.classList.remove("inactive");
    toggle.classList.add("active");
    this.activateFunction(toggle.id);
  }

  activateFunction(id) {
    // Switch directly to handle different modes without cleaning here since deactivate handles it
    switch (id) {
      case 'selmode': this.marqueeToolInstance = this.setSelMode(); break;
      case 'drawmode': this.setDrawMode(); break;
      case 'nodemode': this.setNodeMode(); break;
      case 'fullscreen': this.fullScreen(); break;
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
      // Add cases for other modes if they have specific deactivate requirements
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

    //change cursor to crosshair
    document.body.style.cursor = "crosshair";
    let handleNodeClick = (e) => {
      let customNode = CustomNode.addCustomNode(e)

      customNode.nodeWrapper.addEventListener('blur', (e) => {
        if (!customNode.nodeWrapper.textContent) {
          console.log(customNode.nodeWrapper.textContent);
          console.log("Deleting node");
          customNode.delete();
        } else {
          console.log("Node created");
          customNode.nodeWrapper.textContent = customNode.nodeWrapper.textContent.trim().toUpperCase();
          let newNode = new CustomNode(customNode.nodeWrapper.textContent, customNode.nodeX, customNode.nodeY, customNode.nodeTransform, customNode.nodeRGB, customprompt);
          customNode.delete();
        }
        this.cleanupNodeMode();
        this.handleToggleClick(this.selButton);
      }, { once: true });
    }

    customprompt.addEventListener('click', handleNodeClick);

    let handleBlur = () => {
      this.cleanupNodeMode();
      this.activateFunction('selmode');
    }

    customprompt.addEventListener('blur', handleBlur);

    this.cleanupNodeMode = () => {
      customprompt.removeEventListener('click', handleNodeClick);
      customprompt.removeEventListener('blur', handleBlur);
      document.body.style.cursor = "default";
      console.log("Node mode deactivated");
    }
  }

  fullScreen() {
    // Add fullscreen mode functionality here
  }
}

// Create an instance of CustomFuncBar
const customFuncBar = new CustomFuncBar(document);









// /////////////////////////// Instance Variables ///////////////////////////////
// const dropdownState = new Map();
// const marqueeToolInstance = null;

// const customtoggles = document.querySelectorAll(".custom-toggle");
// const customtogglesArray = Array.from(customtoggles);
// /////////////////Selection Button
// document.addEventListener('DOMContentLoaded', () => {
//   customtoggles.forEach((toggle) => {
//     if (toggle.classList.contains('active')) {
//       activateFunction(toggle.id);
//     }
//   })
// });

// customtoggles.forEach((toggle) => {
//   toggle.addEventListener('click', function (e) {
//     let otherToggles = customtogglesArray.filter((t) => t !== this);
//     otherToggles.forEach((toggle) => {
//       toggle.classList?.remove("active");
//       toggle.classList?.add("inactive");
//     });
//     this.classList.remove("inactive");
//     this.classList.add("active");
//   });
// });

// function activateFunction(id) {
//   if (marqueeToolInstance) {
//     marqueeToolInstance.remove();
//     marqueeToolInstance = null;
//   }

//   switch (id) {
//     case 'selmode': marqueeToolInstance = setSelMode(); break;
//     case 'drawmode': setDrawMode(); break;
//     case 'nodemode': setNodeMode(); break;
//     case 'fullscreen': fullScreen(); break;
//   }
// }



// //set and unset drawmode when clicked and unclicked
// var drawMode = false;
// drawButton.addEventListener('click', function (e) {

//   if (drawMode) {
//     unsetDrawMode();
//   } else {
//     setDrawMode();
//   }

//   //set drawmode to opposite of current state
//   drawMode = !drawMode;
// });

// function setDrawMode() {
//   //console.log("draw mode")
//   let canvasDraw = document.getElementById("canvasDraw");
//   canvasDraw.style.zIndex = '1';
// }

// function unsetDrawMode() {
//   //console.log("node mode")

//   let canvasDraw = document.getElementById("canvasDraw");
//   canvasDraw.style.zIndex = '-1';
// }

// function setImageMode() { }




function createDropdown(object, menuItems) {
  // add dropdown menu
  var dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';
  object.appendChild(dropdown);

  for (var i = 0; i < menuItems.length; i++) {
    appendDropdownItem(menuItems[i], dropdown)
  }
}

function appendDropdownItem(itemName, dropdown) {
  let item = document.createElement('div');
  item.className = 'dropdown-item';
  item.id = "dropdown" + validId(itemName);
  item.innerHTML = "&#9656  " + itemName;
  dropdown.appendChild(item);
}











