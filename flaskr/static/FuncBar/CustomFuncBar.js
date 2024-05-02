import { FuncBar } from './FuncBar.js';
import { FuncBar } from './FuncBar.js';
export class CustomFuncBar extends FuncBar {
  constructor(container) {
    super(container);
    this.marqueeToolInstance = null;
    this.canvasDrawInstance = new CanvasDraw("canvasDraw");
  }

  activateFunction(id) {
    super.activateFunction(id); // Call base class method
    // Extend with specific functionality
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
  }

  deactivateFunction(id) {
    super.deactivateFunction(id); // Call base class method
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
  }

  setSelMode() {
    console.log("Selection mode");
    NodeItem.customNodeSel = true;
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
      let customNode = NodeItem.addCustomNode(e)

      customNode.nodeWrapper.addEventListener('blur', (e) => {
        if (!customNode.nodeWrapper.textContent) {
          console.log(customNode.nodeWrapper.textContent);
          console.log("Deleting node");
          customNode.delete();
        } else {
          console.log("Node created");
          customNode.nodeWrapper.textContent = customNode.nodeWrapper.textContent.trim().toUpperCase();
          let newNode = new NodeItem(customNode.nodeWrapper.textContent, customNode.nodeX, customNode.nodeY, customNode.nodeTransform, customNode.nodeRGB, customprompt);
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
const customFuncBar = new CustomFuncBar(document.body);





//append drop-down for draggables
// ///////////////////////////////
// customprompt.addEventListener('click', handleClick);
// customprompt.addEventListener('contextmenu', handleContextMenuClick);

// function handleClick(e) {
//   e.preventDefault();
//   e.stopPropagation();
//   console.log(e.target);
//   let rect = img.getBoundingClientRect();
//   if (e.target === customprompt) {
//     // e.clientX and e.clientY give the mouse position relative to the viewport
//     let isInsideImage = (
//       e.clientX >= rect.left &&
//       e.clientX <= rect.right &&
//       e.clientY >= rect.top &&
//       e.clientY <= rect.bottom
//     );
//     if (isInsideImage) {
//       img.style.zIndex = '1'; // Bring the image to the front
//     } else {
//       img.style.zIndex = '-1'; // Reset or set a different z-index when not clicked
//     }
//   } else {
//     img.style.zIndex = '-1'; // Reset or set a different z-index when not clicked
//   }
// }

// function handleContextMenuClick(e) {
//   e.preventDefault();
//   e.stopPropagation();
//   let rect = img.getBoundingClientRect();
//   if (e.target === customprompt) {
//     // e.clientX and e.clientY give the mouse position relative to the viewport
//     let isInsideImage = (
//       e.clientX >= rect.left &&
//       e.clientX <= rect.right &&
//       e.clientY >= rect.top &&
//       e.clientY <= rect.bottom
//     );
//     if (isInsideImage) {
//       img.style.zIndex = '1'; // Bring the image to the front
//       handleContextMenu(img);
//       createDropdown(img, ["Size Up", "Size Down"]);
//     } else {
//       img.style.zIndex = '-1'; // Reset or set a different z-index when not clicked
//     }
//   } else {
//     img.style.zIndex = '-1'; // Reset or set a different z-index when not clicked
//   }
// }

// function handleContextMenu(object) {
//   // Show or toggle the dropdown menu for the target
//   const dropdown = object.querySelector('.dropdown-menu');
//   if (dropdown) {
//     const isVisible = dropdown.style.opacity === "1";
//     if (!isVisible) {
//       dropdown.style.opacity = 1;
//       dropdown.style.transform = 'translateY(0)';
//       dropdown.style.pointerEvents = 'auto';
//       dropdownState.set(dropdown, true);
//     } else {
//       dropdown.style.opacity = 0;
//       dropdown.style.transform = 'translateY(-10px)';
//       dropdown.style.pointerEvents = 'none';
//       dropdownState.set(dropdown, false);
//     }
//   }
// }



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











