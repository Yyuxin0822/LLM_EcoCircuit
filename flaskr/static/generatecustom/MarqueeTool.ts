import { CustomNode } from "./CustomNode.js";
import { CustomFlowline } from "./CustomFlowline.js";

const customprompt = document.getElementById('customprompt');
export class MarqueeTool {
    constructor(container) {
        this.container = container;
        this.selectionBox = new this.SelectionBox(this.container, this);
        this.selectedBox = new this.SelectedBox(this.container);
        this.handlers = {
            handleMouseDown: this.handleMouseDown.bind(this),
            handleMouseMove: this.handleMouseMove.bind(this),
            handleMouseUp: this.handleMouseUp.bind(this)
        };
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Attach event listeners using the stored handlers
        this.container.addEventListener('mousedown', this.handlers.handleMouseDown);
        this.container.addEventListener('mousemove', this.handlers.handleMouseMove);
        this.container.addEventListener('mouseup', this.handlers.handleMouseUp);
    }
    
    detachEventListeners() {
        // Detach event listeners using the stored handlers
        this.container.removeEventListener('mousedown', this.handlers.handleMouseDown);
        this.container.removeEventListener('mousemove', this.handlers.handleMouseMove);
        this.container.removeEventListener('mouseup', this.handlers.handleMouseUp);
    }

    remove() {
        // Remove the selectionBox and selectedBox if they exist
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }

        if (this.selectedBox) {
            this.selectedBox.hide();
            this.selectedBox.remove();
            this.selectedBox = null;
        }

        // Detach event listeners to prevent memory leaks
        this.detachEventListeners();
        console.log('MarqueeTool removed');
    }

    handleMouseDown(event) {
        console.log('mouse down');
        const rect = this.container.getBoundingClientRect();
        const startX = event.clientX - rect.left;
        const startY = event.clientY - rect.top;

        // Remove the selected box when starting a new selection
        if (this.selectedBox) {
            this.selectedBox.hide();
            this.selectedBox.remove();
            this.selectedBox = null;
        }

        //create a new instance each time
        if (this.selectionBox) {
            this.selectionBox.end();
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        this.selectionBox = new this.SelectionBox(this.container, this);

        this.selectionBox.start(startX, startY);
    }

    handleMouseMove(event) {
        console.log('mouse move');
        if (this.selectedBox && event.target === this.selectedBox.boxElement) return;
        if (this.selectionBox && !this.selectionBox.isActive) return;
        if (this.selectionBox && event.target === customprompt) {
            let rect = this.container.getBoundingClientRect();
            let currentX = event.clientX - rect.left;
            let currentY = event.clientY - rect.top;
            this.selectionBox.update(currentX, currentY);
        }
    }

    handleMouseUp(event) {
        console.log('mouse up');
        if (this.selectedBox && event.target === this.selectedBox.boxElement) {
            return;
        }

        let selectionRect;
        if (this.selectionBox) {
            selectionRect = this.selectionBox.selectionRect;
            this.selectionBox.end();
            this.selectionBox.remove();  // Remove the selection box after use
            this.selectionBox = null;
        }

        if (this.selectedBox) {
            this.selectedBox.hide();
            this.selectedBox.remove();
            this.selectedBox = null;
        }

        this.selectedBox = new this.SelectedBox(this.container, selectionRect);
        this.selectedBox.display();
    }


    static elementsToObjs(elementsList) {
        if (!elementsList) { return []; };
        let objList = [];
        elementsList.forEach(element => {
            if (CustomNode.getNodeObjbyNode(element)) {
                objList.push(CustomNode.getNodeObjbyNode(element));
            } 
            // else if (Identifier.getIdentifierObjbyIdentifier(element)) {
            //     objList.push(Identifier.getIdentifierObjbyIdentifier(element));
            // }
        }
        )
        return objList;
    }



    // Nested SelectionBox class
    SelectionBox = class {
        constructor(container, parent) {
            this.container = container;
            this.parent = parent;
            this.boxElement = document.createElement('div');
            this.boxElement.classList = "inSelBox";
            this.boxElement.style.display = 'none';
            this.container.appendChild(this.boxElement);
            this.isActive = false;
            this.selectionRect;
        }

        start(x, y) {
            this.isActive = true;
            this.initialX = x;
            this.initialY = y;
            this.updatePosition(x, y, 0, 0);
            this.boxElement.style.display = 'block';
        }

        update(x, y) {
            const width = Math.abs(x - this.initialX);
            const height = Math.abs(y - this.initialY);
            const left = (x < this.initialX) ? x : this.initialX;
            const top = (y < this.initialY) ? y : this.initialY;
            this.updatePosition(left, top, width, height);
            this.selectionRect = this.boxElement.getBoundingClientRect();
        }

        end() {
            this.isActive = false;
            this.boxElement.style.display = 'none';
        }

        updatePosition(x, y, width, height) {
            this.boxElement.style.left = `${x}px`;
            this.boxElement.style.top = `${y}px`;
            this.boxElement.style.width = `${width}px`;
            this.boxElement.style.height = `${height}px`;
        }

        remove() {
            this.boxElement.remove();
        }

    }

    // Nested SelectedBox class
    SelectedBox = class {
        constructor(container, selectionRect) {
            this.container = container;
            this.selectionRect = selectionRect;
            this.displayRect = {};
            this.selectedElements = []; // List to track selected elements
            this.selectedObjs = [];//List to track selected Class objects
            this.boxElement = document.createElement('div');
            this.boxElement.style.display = 'none';
            this.boxElement.classList = "selectedBox";
            this.container.appendChild(this.boxElement);
        }

        display() {
            this.selectedElements = this.getElementsWithinSelection();
            if (this.selectedElements.length === 0) { return; }
            this.selectedObjs = MarqueeTool.elementsToObjs(this.selectedElements);
            this.selectElementsToSelect();
            this.displayRect = this.calculateBoundingBox(this.selectedElements);
            this.boxElement.style.left = `${this.displayRect.left}px`;
            this.boxElement.style.top = `${this.displayRect.top}px`;
            this.boxElement.style.width = `${this.displayRect.width}px`;
            this.boxElement.style.height = `${this.displayRect.height}px`;
            this.boxElement.style.transform = 'translate(0, 0)';
            this.boxElement.style.display = 'block';
            this.moveToSelectedBox(this.selectedObjs);
            this._draggable = new PlainDraggable(this.boxElement, {
                onMove: CustomFlowline.fixLine,
                containment: { left: 0, top: 0, width: 12000, height: 12000 },
                autoScroll: true,
            });
        }

        hide() {
            if (this.selectedObjs.length === 0) return;
            this.moveToContainer(this.selectedObjs);
            this.boxElement.style.display = 'none';
        }

        getElementsWithinSelection() {
            if (!this.selectionRect) { return []; };
            let elements = Array.from(this.container.querySelectorAll(".node, .input-identifier, .output-identifier, .customImage"))
            return elements.filter(element => {
                const rect = element.getBoundingClientRect();
                return !(rect.right < this.selectionRect.left ||
                    rect.left > this.selectionRect.right ||
                    rect.bottom < this.selectionRect.top ||
                    rect.top > this.selectionRect.bottom);
            });
        }

        calculateBoundingBox() {
            if (this.selectedElements.length === 0) { return {}; };
            let offsetRect = this.container.getBoundingClientRect();
            const rects = this.selectedElements.map(element => element.getBoundingClientRect());
            const left = Math.min(...rects.map(rect => rect.left));
            const top = Math.min(...rects.map(rect => rect.top));
            const right = Math.max(...rects.map(rect => rect.right));
            const bottom = Math.max(...rects.map(rect => rect.bottom));
            this.displayRect = {
                left: left - offsetRect.left,
                top: top - offsetRect.top,
                width: right - left,
                height: bottom - top
            };
            return this.displayRect;
        }


        moveToSelectedBox(selectedObjs) {
            let customevent = new CustomEvent('marquee');
            customprompt.dispatchEvent(customevent);
            //console.log("move to selected box");
            selectedObjs.forEach(obj => {
                if (obj instanceof CustomNode) {
                    let newobj = obj.copyTo(this.boxElement, true);
                    newobj.nodeX = parseFloat(obj.node.style.left) - parseFloat(this.boxElement.style.left);
                    newobj.nodeY = parseFloat(obj.node.style.top) - parseFloat(this.boxElement.style.top);
                    let translate1 = parseTranslate(obj.node.style.transform);
                    let translate2 = parseTranslate(this.boxElement.style.transform);
                    newobj.nodeTransform = `translate(${translate1.x - translate2.x}px, ${translate1.y - translate2.y}px)`;
                    newobj.draggable.disabled = true;
                    newobj.node.pointerEvents = 'none';
                    //replace the node in the selectedObjs with the new node
                    selectedObjs[selectedObjs.indexOf(obj)] = newobj;
                }
            })
            customprompt.dispatchEvent(customevent);
        }

        moveToContainer(selectedObjs) {
            let customevent = new CustomEvent('marquee');
            customprompt.dispatchEvent(customevent);
            if (selectedObjs.length === 0) return;
            selectedObjs.forEach(obj => {
                if (obj instanceof CustomNode) {
                    let newobj = obj.copyTo(this.container, true);
                    newobj.nodeX = parseFloat(obj.node.style.left) + parseFloat(this.boxElement.style.left);
                    newobj.nodeY = parseFloat(obj.node.style.top) + parseFloat(this.boxElement.style.top);
                    let translate1 = parseTranslate(obj.node.style.transform);
                    let translate2 = parseTranslate(this.boxElement.style.transform);
                    newobj.nodeTransform = `translate(${translate1.x + translate2.x}px, ${translate1.y + translate2.y}px)`;
                    newobj.node.pointerEvents = 'auto';
                    selectedObjs[selectedObjs.indexOf(obj)] = newobj;                    //replace the node in the selectedObjs with the new node
                    newobj.draggable.disabled = false;
                }
            });
            customprompt.dispatchEvent(customevent);
        }

        selectElementsToSelect() {
            this.selectedObjs.forEach(obj => {
                if (obj.select) {
                    obj.select();  // Call the select method on each element
                }
            });
        }

        unselectAllSelectedElements() {
            this.selectedObjs.forEach(obj => {
                if (obj.unselect) {
                    obj.unselect();
                }
            });
            this.selectedElements = [];  // Clear the array after unselecting all
        }


        remove() {
            this.boxElement.remove();
        }
    }
}

customprompt.addEventListener('marquee', CustomFlowline.fixLine, false);
const customPromptRect = customprompt.getBoundingClientRect();


const img = document.getElementById("customImage");
// var imageDraggable = new PlainDraggable(img, { containment: { left: 0, top: 0, width: 12000, height: 12000 } });

function parseTranslate(transformString) {
    const regex = /translate\(([\d\-.]+)px, ([\d\-.]+)px\)/i;
    const match = transformString.match(regex);
    return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
}



// var customNodeSel = false;
// var customLineSel = false;



// //////////////////////click selector/////////////////////////////
// /////////////////////////////////////////////////////////////////

// function addIdentifier() {
//     CustomFlowline.getAllLines().forEach(line => {
//         addIdentifierToNode(line.start, 'input-identifier');
//         addIdentifierToNode(line.end, 'output-identifier');
//     })
//     function addIdentifierToNode(node, identifierClass) {
//         if (node.querySelector('.' + identifierClass)) return;
//         let identifier = document.createElement("div");
//         identifier.classList.add(identifierClass);
//         let identifierdot = document.createElement("div");
//         identifierdot.classList.add('identifier-dot', 'identifier-unselected');
//         node.appendChild(identifier);
//         identifier.appendChild(identifierdot);
//     }
// }




// function rmIdentifier() {
//     var nodes = document.querySelectorAll('.node');
//     nodes.forEach(node => {
//         node.querySelectorAll('.input-identifier').forEach(identifier => identifier?.remove());
//         node.querySelectorAll('.output-identifier').forEach(identifier => identifier?.remove());
//     });
// }

// function rmNodeSel() {
//     var nodes = document.querySelectorAll('.node');
//     nodes.forEach(node => {
//         node.classList.remove('node-selected');
//         node.classList.add('node-unselected');
//     });
// }


// // addGlobalEventListener('click', '.node-wrapper', (e) => {
// //     e.target.closest('.node').classList.add('node-selected');
// //     e.target.closest('.node').classList.remove('node-unselected');
// // });

// // addCustomDbclickEventListener('.node-wrapper', (e) => {
// //     e.target.closest('.node').classList.remove('node-selected');
// //     e.target.closest('.node').classList.add('node-unselected');
// // }, 500);

// // Assume addGlobalEventListener is defined elsewhere
// let connectMode = false;
// let dotclickActive = true;
// let currentMatchedLines = [];
// let currentMatchedNodes = [];
// let savedMatchedLines = [];
// let savedMatchedNodes = [];
// let nodeOnsearch;


// // Function to clear previous lines' styling
// function rmLineSel() {
//     CustomFlowline.getAllLines().forEach(line => {
//         line.setOptions({
//             startPlugColor: line.start.style.backgroundColor,
//             endPlugColor: line.end.style.backgroundColor,
//             outline: false,
//             endPlugOutline: false
//         });
//         line.position();
//     });
// }

// function setConnectionStyle() {
//     savedMatchedLines.forEach(line => {
//         line.setOptions({
//             startPlugColor: 'black',
//             endPlugColor: 'black',
//             outline: true,
//             outlineColor: 'black',
//             endPlugOutline: true,
//             outlineSize: 4
//         });
//         line.position();
//     });
//     savedMatchedNodes.forEach(node => {
//         node.querySelector('.identifier-dot').classList?.remove('identifier-toselect');
//         node.querySelector('.identifier-dot').classList?.remove('identifier-unselected');
//         node.querySelector('.identifier-dot').classList?.add('identifier-selected');
//     });

//     // for the line that belongs to myLines-savedMatchedLines, remove resetthe style
//     let unsavedMatchedLines = CustomFlowline.getAllLines().filter(line => !savedMatchedLines.includes(line));
//     unsavedMatchedLines.forEach(line => {
//         line.setOptions({
//             startPlugColor: line.start.style.backgroundColor,
//             endPlugColor: line.end.style.backgroundColor,
//             outline: false, endPlugOutline: false
//         });
//         line.position();
//     });
//     let nodes = document.querySelectorAll('.node');
//     let allNodes = [];
//     nodes.forEach(node => { allNodes.push(node); });
//     let filteredNodes = Array.from(nodes).filter(node => !savedMatchedNodes.includes(node));
//     filteredNodes.forEach(node => {
//         node.querySelector('.identifier-dot')?.classList?.remove('identifier-toselect');
//         node.querySelector('.identifier-dot')?.classList?.remove('identifier-selected');
//         node.querySelector('.identifier-dot')?.classList?.add('identifier-unselected');
//     });
// }

// function resetConnectionStyle() {
//     CustomFlowline.getAllLines().forEach(line => {
//         line.setOptions({
//             startPlugColor: line.start.style.backgroundColor,
//             endPlugColor: line.end.style.backgroundColor,
//             outline: false,
//             endPlugOutline: false
//         });
//         line.position();
//         line.end.querySelector('.identifier-dot').classList?.remove('identifier-selected');
//         line.end.querySelector('.identifier-dot').classList?.add('identifier-unselected');
//         line.start.querySelector('.identifier-dot').classList?.remove('identifier-selected');
//         line.start.querySelector('.identifier-dot').classList?.add('identifier-unselected');
//     });
// }

// function setToconnectStyle(nodeOnsearch) {
//     currentMatchedLines.forEach(line => {
//         if (line.start === nodeOnsearch) {
//             line.setOptions({ outline: true, outlineColor: 'black', endPlugOutline: true, startPlugColor: 'black', outlineSize: 2 });
//         }
//         else if (line.end === nodeOnsearch) {
//             line.setOptions({ outline: true, outlineColor: 'black', endPlugOutline: true, endPlugColor: 'black', outlineSize: 2 });
//         }
//         line.position();
//     });
//     currentMatchedNodes.forEach(node => {
//         node.querySelector('.identifier-dot').classList?.add('identifier-toselect');
//     });
// }

// addGlobalEventListener('click', '.input-identifier, .output-identifier, .identifier-dot', handleDotClick, false);

// function handleDotClick(e) {
//     if (!dotclickActive) return;
//     connectMode = false;
//     let dot = e.target.closest('.identifier-dot');
//     if (dot) {
//         dot?.classList.remove('identifier-unselected');
//         dot?.classList.add('identifier-selected');

//         let { matchedNodes, matchedLines } = findFlow(dot);

//         currentMatchedNodes = matchedNodes;
//         currentMatchedLines = matchedLines;

//         connectMode = true;
//         dotclickActive = false;
//         nodeOnsearch = dot.closest('.node');
//         setToconnectStyle(nodeOnsearch);
//         e.stopPropagation();
//     }
// }

// document.addEventListener('click', (e) => {
//     if (!connectMode) return;
//     dotclickActive = false;

//     let nodeEnd = currentMatchedNodes.find(node => node === e.target || node.contains(e.target.closest('.node')));
//     if (nodeEnd) {
//         matchedline = currentMatchedLines.find(line => line.end === nodeEnd || line.start === nodeEnd);
//         if (matchedline) {
//             savedMatchedLines.push(matchedline);
//             if (!savedMatchedNodes.includes(matchedline.start)) {
//                 savedMatchedNodes.push(matchedline.start);
//             }
//             if (!savedMatchedNodes.includes(matchedline.end)) {
//                 savedMatchedNodes.push(matchedline.end);
//             }
//         }
//         setConnectionStyle();
//         dotclickActive = true;
//         e.stopPropagation();
//         return;
//     } else if (e.target.closest('.node') !== nodeOnsearch) {
//         resetConnectionStyle();
//         setConnectionStyle();
//         dotclickActive = true;
//         return;
//     }
// }, false);

// addCustomDbclickEventListener('.input-identifier, .output-identifier, .identifier-dot', (e) => {
//     let dot = e.target.closest('.identifier-dot');
//     dot?.classList.remove('identifier-selected');
//     dot?.classList.add('identifier-unselected');
//     let correspondingMatchedLines = savedMatchedLines.filter(line => line.end === dot.closest('.node') || line.start === dot.closest('.node'));
//     savedMatchedLines = savedMatchedLines.filter(line => !correspondingMatchedLines.includes(line));
//     if (correspondingMatchedLines) {
//         correspondingMatchedLines.forEach(matchedline => {
//             if (savedMatchedNodes.includes(matchedline.start)) {
//                 savedMatchedNodes = savedMatchedNodes.filter(node => node !== matchedline.start);
//             }
//             if (savedMatchedNodes.includes(matchedline.end)) {
//                 savedMatchedNodes = savedMatchedNodes.filter(node => node !== matchedline.end);
//             }
//         });
//     }
//     setConnectionStyle();
// }, 500);

// function findFlow(dot) {
//     var flowString = document.querySelector('#customPromptFlow').innerText;
//     var flowArray = parseJson(flowString);

//     let matchedFlows = []; // This will store all matching flow arrays
//     if (dot.closest('.input-identifier') !== null) {
//         matchedFlows = flowArray.filter(flow =>
//             validId(flow[1]) === dot.closest('.node').id.replace('node', '')
//         );
//         matchedNodes = matchedFlows.map(flow => customprompt.querySelector('#node' + validId(flow[2])));
//         matchedLines = CustomFlowline.getAllLines().filter(line => line.start === dot.closest('.node') && matchedNodes.includes(line.end));
//     } else if (dot.closest('.output-identifier') !== null) {
//         matchedFlows = flowArray.filter(flow =>
//             validId(flow[2]) === dot.closest('.node').id.replace('node', '')
//         );
//         matchedNodes = matchedFlows.map(flow => customprompt.querySelector('#node' + validId(flow[1])));
//         matchedLines = CustomFlowline.getAllLines().filter(line => line.end === dot.closest('.node') && matchedNodes.includes(line.start));
//     }

//     return { matchedNodes, matchedLines }; // Return the array of matched Nodes(HTML elements)
// }


