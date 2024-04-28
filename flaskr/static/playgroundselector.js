const promptFrame = document.getElementById('prompt-frame');
const contentFrame = document.getElementById('content-frame');
const contentCustom= document.getElementById('content-custom-frame');

// let startX, startY, isSelecting = false;
// const selectionBox = document.createElement('div');
// selectionBox.style.position = 'absolute';
// selectionBox.style.border = '1px dashed #000';
// selectionBox.style.pointerEvents = 'none'; // Important to allow events on underlying elements
// container.appendChild(selectionBox);

// container.addEventListener('mousedown', (e) => {
//     console.log('mousedown');
//     console.log(e.target);
//     const rect = container.getBoundingClientRect();
//     startX = e.clientX - rect.left; // Correct for any scrolling and container position
//     startY = e.clientY - rect.top;
//     console.log(startX, startY);
//     isSelecting = true;
//     selectionBox.style.left = `${startX}px`;
//     selectionBox.style.top = `${startY}px`;
//     selectionBox.style.width = '0';
//     selectionBox.style.height = '0';
//     selectionBox.style.display = 'block';
// },false);

// container.addEventListener('mousemove', (e) => {
//     if (!isSelecting) return;
//     const rect = container.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     const width = Math.abs(x - startX);
//     const height = Math.abs(y - startY);
//     const newLeft = (x < startX) ? x : startX;
//     const newTop = (y < startY) ? y : startY;
//     selectionBox.style.width = `${width}px`;
//     selectionBox.style.height = `${height}px`;
//     selectionBox.style.left = `${newLeft}px`;
//     selectionBox.style.top = `${newTop}px`;
// });

// container.addEventListener('mouseup', (e) => {
//     isSelecting = false;
//     const finalRect = selectionBox.getBoundingClientRect();
//     selectElements(finalRect);
//     selectionBox.style.display = 'none'; // Hide selection box after selection
// });



// function selectElements(selectionRect) {
//     var nodes=document.querySelectorAll('.node');
//     var identifiers=document.querySelectorAll('.identifier-dot');
//     nodes.forEach(node => {
//         const nodeRect = node.getBoundingClientRect();
//         if (isIntersecting(nodeRect, selectionRect)) {
//             node.classList.toggle('node-selected');
//             node.classList.toggle('node-unselected');
//         }
//     });
//     identifiers.forEach(identifier => {
//         const identifierRect = identifier.getBoundingClientRect();
//         if (isIntersecting(identifierRect, selectionRect)) {
//             identifier.classList.toggle('identifier-selected');
//             identifier.classList.toggle('identifier-unselected');
//         }
    
//     });
// }

// function isIntersecting(rect1, rect2) {
//     return !(rect1.right < rect2.left || 
//              rect1.left > rect2.right || 
//              rect1.bottom < rect2.top || 
//              rect1.top > rect2.bottom);
// }













//////////////////////click selector/////////////////////////////
/////////////////////////////////////////////////////////////////
var nodesel=false; 
var linesel=false;
    
function addIdentifier() {
    myLines.forEach(line => {
        addIdentifierToNode(line.start, 'input-identifier');
        addIdentifierToNode(line.end, 'output-identifier');
    })
    function addIdentifierToNode(node, identifierClass) {
        if (node.querySelector('.'+identifierClass)) return;
        let identifier = document.createElement("div");
        identifier.classList.add(identifierClass);
        let identifierdot=document.createElement("div");
        identifierdot.classList.add('identifier-dot', 'identifier-unselected');
        node.appendChild(identifier);
        identifier.appendChild(identifierdot);
    }
}

function rmIdentifier() {
    var nodes=document.querySelectorAll('.node');
    nodes.forEach(node => {
        node.querySelectorAll('.input-identifier').forEach(identifier => identifier?.remove());
        node.querySelectorAll('.output-identifier').forEach(identifier => identifier?.remove());
    });
}

function rmNodeSel(){
    var nodes=document.querySelectorAll('.node');
    nodes.forEach(node => {
        node.classList.remove('node-selected');
        node.classList.add('node-unselected');
    });
}
var nodewrappers=document.querySelectorAll('.node-wrapper');
nodewrappers.forEach(node => {
    node.addEventListener('click', (e) => {
        if (!nodesel) return;
        e.target.closest('.node').classList.toggle('node-selected');
        e.target.closest('.node').classList.toggle('node-unselected');});
});

// addGlobalEventListener('click', '.node-wrapper', (e) => {
//     e.target.closest('.node').classList.add('node-selected');
//     e.target.closest('.node').classList.remove('node-unselected');
// });

// addCustomDbclickEventListener('.node-wrapper', (e) => {
//     e.target.closest('.node').classList.remove('node-selected');
//     e.target.closest('.node').classList.add('node-unselected');
// }, 500);

// Assume addGlobalEventListener is defined elsewhere
let connectMode = false;
let dotclickActive = true; 
let currentMatchedLines = [];
let currentMatchedNodes = [];
let savedMatchedLines = [];
let savedMatchedNodes = [];
let nodeOnsearch;


// Function to clear previous lines' styling
function rmLineSel(){
    myLines.forEach(line => {
        line.setOptions({
            startPlugColor: line.start.style.backgroundColor,
            endPlugColor: line.end.style.backgroundColor,
            outline: false, 
            endPlugOutline: false});
        line.position();
    });
}

function setConnectionStyle() {
    savedMatchedLines.forEach(line => {
        line.setOptions({
            startPlugColor: 'black',
            endPlugColor: 'black',
            outline: true, 
            outlineColor: 'black', 
            endPlugOutline: true, 
            outlineSize: 4});
        line.position();
    });
    savedMatchedNodes.forEach(node => {
        node.querySelector('.identifier-dot').classList?.remove('identifier-toselect');
        node.querySelector('.identifier-dot').classList?.remove('identifier-unselected');
        node.querySelector('.identifier-dot').classList?.add('identifier-selected');
    });

    // for the line that belongs to myLines-savedMatchedLines, remove resetthe style
    let unsavedMatchedLines = myLines.filter(line => !savedMatchedLines.includes(line));
    unsavedMatchedLines.forEach(line => {
        line.setOptions({
            startPlugColor: line.start.style.backgroundColor,
            endPlugColor: line.end.style.backgroundColor,
            outline: false, endPlugOutline: false});
        line.position();
    });
    let nodes = document.querySelectorAll('.node');
    let allNodes=[];
    nodes.forEach(node => {allNodes.push(node);});
    let filteredNodes = Array.from(nodes).filter(node => !savedMatchedNodes.includes(node));
    filteredNodes.forEach(node => {
        node.querySelector('.identifier-dot')?.classList?.remove('identifier-toselect');
        node.querySelector('.identifier-dot')?.classList?.remove('identifier-selected');
        node.querySelector('.identifier-dot')?.classList?.add('identifier-unselected');
    });
}

function resetConnectionStyle() {
    myLines.forEach(line => {
        line.setOptions({
            startPlugColor: line.start.style.backgroundColor,
            endPlugColor: line.end.style.backgroundColor,
            outline: false, 
            endPlugOutline: false});
        line.position();
        line.end.querySelector('.identifier-dot').classList?.remove('identifier-selected');
        line.end.querySelector('.identifier-dot').classList?.add('identifier-unselected');
        line.start.querySelector('.identifier-dot').classList?.remove('identifier-selected');
        line.start.querySelector('.identifier-dot').classList?.add('identifier-unselected');
    });
}

function setToconnectStyle(nodeOnsearch){
    currentMatchedLines.forEach(line => {
        if (line.start === nodeOnsearch) {
            line.setOptions({outline:true, outlineColor: 'black', endPlugOutline:true, startPlugColor: 'black', outlineSize: 2});}
        else if (line.end === nodeOnsearch){
            line.setOptions({outline:true, outlineColor: 'black', endPlugOutline:true, endPlugColor: 'black', outlineSize: 2});
        }
        line.position();
    });
    currentMatchedNodes.forEach(node => {
        node.querySelector('.identifier-dot').classList?.add('identifier-toselect');
    });
}

addGlobalEventListener('click', '.input-identifier, .output-identifier, .identifier-dot',  handleDotClick, false);

function handleDotClick (e){
    if (!dotclickActive) return; 
    connectMode = false;
    let dot = e.target.closest('.identifier-dot');
    if(dot){
        dot?.classList.remove('identifier-unselected');
        dot?.classList.add('identifier-selected');

        let {matchedNodes, matchedLines} = findFlow(dot);    

        currentMatchedNodes = matchedNodes;
        currentMatchedLines = matchedLines;

        connectMode = true;
        dotclickActive = false;
        nodeOnsearch=dot.closest('.node');
        setToconnectStyle(nodeOnsearch);
        e.stopPropagation();
    }
}

document.addEventListener('click', (e) => {
    if (!connectMode) return;
    dotclickActive = false;

    let nodeEnd = currentMatchedNodes.find(node => node === e.target || node.contains(e.target.closest('.node')));
    if (nodeEnd) {
        matchedline=currentMatchedLines.find(line=>line.end === nodeEnd || line.start === nodeEnd);
        if (matchedline) {
            savedMatchedLines.push(matchedline);
            if (!savedMatchedNodes.includes(matchedline.start)) {
                savedMatchedNodes.push(matchedline.start);
            }
            if (!savedMatchedNodes.includes(matchedline.end)) {
                savedMatchedNodes.push(matchedline.end);
            }
        }
        setConnectionStyle();
        dotclickActive = true;
        e.stopPropagation();
        return;
    }else if (e.target.closest('.node')!==nodeOnsearch) {
        resetConnectionStyle();
        setConnectionStyle();
        dotclickActive = true;
        return;
    }
}, false);

addCustomDbclickEventListener('.input-identifier, .output-identifier, .identifier-dot', (e) => {
    let dot = e.target.closest('.identifier-dot');
    dot?.classList.remove('identifier-selected');
    dot?.classList.add('identifier-unselected');
    let correspondingMatchedLines = savedMatchedLines.filter(line=>line.end === dot.closest('.node') || line.start === dot.closest('.node'));
    savedMatchedLines = savedMatchedLines.filter(line => !correspondingMatchedLines.includes(line));
    if (correspondingMatchedLines) {
        correspondingMatchedLines.forEach(matchedline => {
            if (savedMatchedNodes.includes(matchedline.start)) {
                savedMatchedNodes = savedMatchedNodes.filter(node => node !== matchedline.start);
            }
            if (savedMatchedNodes.includes(matchedline.end)) {
                savedMatchedNodes = savedMatchedNodes.filter(node => node !== matchedline.end);
            }
        });
    }
    setConnectionStyle();
}, 500); 

function findFlow(dot){
    let prompt=dot.closest('.prompt')
    var prIndex = prompt.id.replace('prompt', '');
    var flowString= prompt.querySelector('#promptFlow' + prIndex).innerText;
    var flowArray = parseJson(flowString);

    let matchedFlows = []; // This will store all matching flow arrays
    if (dot.closest('.input-identifier') !== null) {
        matchedFlows = flowArray.filter(flow => 
            validId(flow[1]) === dot.closest('.node').id.replace('node', '')
        );
        matchedNodes=matchedFlows.map(flow=>prompt.querySelector('#node'+validId(flow[2])));
        matchedLines=myLines.filter(line=>line.start === dot.closest('.node') && matchedNodes.includes(line.end));
    } else if (dot.closest('.output-identifier') !== null) {
        matchedFlows = flowArray.filter(flow => 
            validId(flow[2]) === dot.closest('.node').id.replace('node', '')
        );
        matchedNodes=matchedFlows.map(flow=>prompt.querySelector('#node'+validId(flow[1])));
        matchedLines=myLines.filter(line=>line.end === dot.closest('.node') && matchedNodes.includes(line.start));
    }

    return {matchedNodes, matchedLines}; // Return the array of matched Nodes(HTML elements)
}
