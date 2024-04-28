///////////////instance variables////////////////////
const myLines = [];

// helpers
// document.addEventListener('DOMContentLoaded', function () {
//     const prompts = document.querySelectorAll('.prompt');
//     prompts.forEach(prompt => {
//         const cols = prompt.querySelectorAll('.col');
//         let colX = [];

//         // Extract left values and only push valid numbers
//         cols.forEach(col => {
//             const leftStyle = window.getComputedStyle(col).left;
//             if (leftStyle !== '') colX.push(parseFloat(leftStyle));
//         });

//         if (colX.length === 0) return;
//         const mincolX = Math.min(...colX);

//         // Update left positions of cols
//         cols.forEach(col => {
//             const currentLeft = parseFloat(window.getComputedStyle(col).left);
//             col.style.left = `${currentLeft - mincolX}px`;
//         });

//         // Assuming each col is 22.5rem wide, calculate total width required
//         const totalWidth = cols.length * 22.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
//         prompt.style.width = `${totalWidth + mincolX}px`;  // Ensure you add mincolX to totalWidth before converting to a px value

//         // Scroll to where mincolX would begin (ensuring it's a non-negative pixel value)
//         prompt.scrollLeft = Math.abs(mincolX * parseFloat(getComputedStyle(document.documentElement).fontSize));
//     });
// });


function parseJson(jsonString) {
    var nodeObject = JSON.parse(jsonString);
    var node = [];
    Object.entries(nodeObject).forEach(([key, value]) => {
        var subnode = [];
        subnode.push(key);
        if (Array.isArray(value)) {
            value.forEach(item => subnode.push(item));
        } else {
            subnode.push(value);
        }
        node.push(subnode);
    });
    return node;
}

function validId(nodeName) {
    // Replace problematic characters with dashes and remove leading/trailing non-alphanumeric characters
    return nodeName
        .replace(/[\s,().]+/g, '-') // Replace spaces, commas, and parentheses with dashes
        .replace(/--+/g, '-') // Replace multiple consecutive dashes with a single dash
        .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
        .replace(/[^\w-]+/g, ''); // Remove any remaining non-word characters (excluding dashes)
}


function processPrompt(prompt) {
    var prIndex = prompt.id.replace('prompt', '');
    console.log(prIndex);
    var flowString = prompt.querySelector('#promptFlow' + prIndex).innerText;
    var flowArray = parseJson(flowString);
    var nodeString = prompt.querySelector('#promptNode' + prIndex).innerText;
    var nodeArray = parseJson(nodeString);
    var systemString = prompt.querySelector('#promptSystem' + prIndex).innerText;
    var systemArray = parseJson(systemString);


    var parentPrompt = document.querySelector('#prompt' + prIndex);

    let NodeX = Array.from(new Set(nodeArray.map(node => node[1][0])));
    let coorXMap = processNodeX(NodeX.sort());
    let NodeY = Array.from(new Set(nodeArray.map(node => node[1][1])));
    let NodeYMax = Math.max(...NodeY);

    parentPrompt.style.height = ((NodeYMax + 1) * 1.5 + 3) + 'rem';
    NodeX.forEach((x) => {
        let col = document.createElement("div");
        col.classList.add('col');
        col.id = 'col' + validId(x.toString());
        col.style.left = coorXMap[x];
        parentPrompt.appendChild(col);
    });

    nodeArray.forEach((node, nIndex) => {
        var nodeName = node[0];
        var nodeId = validId(nodeName);
        var nodeX = node[1][0];
        var nodeY = node[1][1];
        var nodeSystem = node[2];

        if (parentPrompt.querySelector('#node' + nodeId)) {
            return;
        } else {
            var newNode = document.createElement("div");
            newNode.classList.add('node');
            newNode.id = 'node' + nodeId;
            newNode.style.top = nodeY * 1.5 + 'rem';
            // create a nodewrapper
            var nodeWrapper = document.createElement("div");
            nodeWrapper.classList.add('node-wrapper', 'card-node');
            nodeWrapper.innerHTML = nodeName;
            newNode.appendChild(nodeWrapper);

            systemArray.forEach((system) => {
                if (system[0] === nodeSystem) {
                    newNode.style.backgroundColor = hexToRGBA(system[1], 0.75);
                }
            });

            parentPrompt.querySelector('#col' + validId(nodeX.toString())).appendChild(newNode);
            // this syntax has an issue when the nodex is not an integer, it will query e.g. "#col1.3" which is invalid
            // adjustFontSize(newNode);
        }
    });

    flowArray.forEach((flow) => {
        // console.log(flow);
        for (var i = 1; i < flow.length - 1; i++) {
            var nodeStart = parentPrompt.querySelector('#node' + validId(flow[i]));
            var nodeEnd = parentPrompt.querySelector('#node' + validId(flow[i + 1]));
            // console.log(flow[i], flow[i + 1]);
            drawLine(nodeStart, nodeEnd, myLines);
        }
    });

}


function processNodeX(nodeXs) {
    if (nodeXs.length === 2) {
        return { [nodeXs[0]]: '0rem', [nodeXs[1]]: '67.5rem' };
    }
    //this function is to position nodeX according to its value
    //ie. let's say that we have a series of nodes whose nodeXs are [0, 1, 1.1, 1.2, 1.3, 2]
    //An integer is a div with a width of 22.5rem, a float is a div with a width of 15rem
    //so firstly transform according to nodeX to get the coordinateX of the left edge of div
    //[0, 67.5rem, 90rem, 112.5rem, 135rem, 150rem, 165rem, 180rem,]
    //For conditions that have no float number bewteen integer like 0 and 1 in this, I 'd like to close the gap of 45rem
    //so the resulted left edge of div coordinateX is [0, 67.5rem-45rem, 90rem-45rem, 112.5rem-45rem, 135rem-45rem, 150rem-45rem, 165rem-45rem, 180rem-45rem,]
    //return a mapping relationship of nodeX to coordinateX
    // Constants for div widths
    const integerWidth = 22.5;  // Width for integers in rem
    const floatWidth = 15;      // Width for floats in rem
    const gapBetweenIntegers = 67.5;  // Gap between integers when preceded by an integer in rem

    // Array to store the accumulated widths leading to each node's x-coordinate
    let coordinates = [0]; // Start with 0 for the first node
    let lastIntegerIndex = 0; // Store the index of the last integer node

    // Iterate through nodeXs to calculate coordinates
    for (let i = 1; i < nodeXs.length; i++) {
        const prevNode = nodeXs[i - 1];
        const currentNode = nodeXs[i];
        const prevIsInteger = Number.isInteger(prevNode);
        const currentIsInteger = Number.isInteger(currentNode);

        if (currentIsInteger) {
            if (prevIsInteger) {
                // Current and previous both integers
                coordinates.push(coordinates[coordinates.length - 1] + integerWidth);
            } else {
                // Current is integer, previous is float
                coordinates.push(coordinates[lastIntegerIndex] + gapBetweenIntegers);
            }
            lastIntegerIndex = i;  // Update the last seen integer index
        } else {
            // Current is float
            const widthToAdd = prevIsInteger ? integerWidth : floatWidth;
            coordinates.push(coordinates[coordinates.length - 1] + widthToAdd);
        }
    }

    // Map nodeXs to their corresponding coordinates in rem units
    let nodeXToCoordinateXMap = {};
    nodeXs.forEach((node, index) => {
        nodeXToCoordinateXMap[node] = `${coordinates[index]}rem`;
    });

    return nodeXToCoordinateXMap;
}

// Example usage
// const nodeXs1 = [0, 1, 1.1, 2];
// const nodeXs2 = [0, 0.1, 0.2, 1];
// console.log(processNodeX(nodeXs1));
// console.log(processNodeX(nodeXs2));




function cleanPrompt(prompt) {
    var nodes = Array.from(document.querySelectorAll('.node'));
    myLines.forEach((line) => {
        if (nodes.includes(line.start) && nodes.includes(line.end)) {
            console.log('line removed');
            myLines.splice(myLines.indexOf(line), 1);
            line.remove();
        }
    });
    var cols = prompt.querySelectorAll('.col');
    cols.forEach(col => {
        col.remove();
    });
}

function loadajax(promptdata, prompt_id) {
    // when new ajax is loaded, create the following div
    // <div class="prompt" id="prompt{{i}}">
    //     <div class="prompt-flow hidden" id="promptFlow{{i}}">{{promptFlows[i]}}</div>
    //     <div class="prompt-node hidden" id="promptNode{{i}}">{{promptNodes[i]}}</div>
    //     <div class="prompt-system hidden" id="promptSystem{{i}}">{{promptSystems[i]}}</div>
    //     <div class="input" id="input{{i}}"></div>
    //     <div class="output" id="output{{i}}"></div>
    // </div>
    // define promptid,
    // for class .prompt, their id is prompt{{i}}, get max i, then i+1
    if (!prompt_id) {
        var prompt_id = document.querySelectorAll('.prompt').length;

        let prompt = document.createElement("div");
        prompt.classList.add('prompt');
        prompt.id = 'prompt' + prompt_id;
        document.getElementById('prompt-frame').appendChild(prompt);

        let promptFlow = document.createElement("div");
        promptFlow.classList.add('prompt-flow', 'hidden');
        promptFlow.id = 'promptFlow' + prompt_id;
        promptFlow.innerText = promptdata['flow'];
        prompt.appendChild(promptFlow);

        let promptNode = document.createElement("div");
        promptNode.classList.add('prompt-node', 'hidden');
        promptNode.id = 'promptNode' + prompt_id;
        promptNode.innerText = promptdata['node'];
        prompt.appendChild(promptNode);

        let promptSystem = document.createElement("div");
        promptSystem.classList.add('prompt-system', 'hidden');
        promptSystem.id = 'promptSystem' + prompt_id;
        promptSystem.innerText = promptdata['system'];
        prompt.appendChild(promptSystem);

    } else {
        let prompt = document.getElementById('prompt' + prompt_id);
        let promptFlow = document.getElementById('promptFlow' + prompt_id);
        promptFlow.innerText = JSON.stringify(promptdata['flow']);
        let promptNode = document.getElementById('promptNode' + prompt_id);
        promptNode.innerText = JSON.stringify(promptdata['node']);
    }

    return prompt_id;
}

function drawLine(tagStart, tagEnd, myLines) {
    let commonOptions = {
        startPlug: "hidden",
        startPlugSize: 4,
        endPlug: "arrow1",
        endPlugSize: 1,
        size: 4,
        gradient: true,
        path: 'fluid',
        startPlugOutline: false,
        outline: false,
        endPlugOutline: false,
        outlineSize: 4,
        outlineColor: 'black',
        hide: false,
        // Colors derived from the start and end tags
        startPlugColor: tagStart.style.backgroundColor,
        endPlugColor: tagEnd.style.backgroundColor,
        startPlugOutlineColor: tagStart.style.backgroundColor,
    };

    // Determine the relative positions to decide the socket orientation
    let startRect = tagStart.getBoundingClientRect();
    let endRect = tagEnd.getBoundingClientRect();

    let positionOptions = startRect.left <= endRect.left ? {
        startSocket: 'Right', endSocket: 'Left',
        startSocketGravity: [150, 0], endSocketGravity: [-150, 0],
    } : {
        startSocket: 'Left', endSocket: 'Right',
        startSocketGravity: [-150, 0], endSocketGravity: [150, 0],
        dash: { animation: true, len: 12, gap: 6 }
    };

    var line = new LeaderLine(tagStart, tagEnd, { ...commonOptions, ...positionOptions });

    // Add the newly created line to the myLines array
    myLines.push(line);
    return myLines;
}

const eventTypes = ['click', 'keydown', 'keyup', 'scroll'];
eventTypes.forEach(type => {
    var prompts = document.querySelectorAll('.prompt');
    prompts.forEach(prompt => {
        prompt.addEventListener(type, (event) => {
            myLines.forEach((line) => {
                try {
                    line?.position();
                } catch (e) {
                    console.log(e);
                }
            });
        });
    });

    document.addEventListener(type, (event) => {
        myLines.forEach((line) => {
            try {
                line?.position();
            } catch (e) {
                console.log(e);
            }
        });
    });
});


////////////// function-frame ////////////// 
// toggling views 
function toggleViews() {
    document.getElementById('view-playground')?.classList.toggle('hidden');
    document.getElementById('view-custom')?.classList.toggle('hidden');
    contentFrame.classList.toggle('hidden');
    contentCustom.classList.toggle('hidden');
}

document.getElementById('toggle-playground')?.addEventListener('click', toggleViews);
document.getElementById('toggle-custom')?.addEventListener('click', toggleViews);

// toggling fold/unfold engineer bar
function toggleEngineerBar() {
    document.getElementById('engineer-bar-unfolded')?.classList.toggle('hidden');
    document.getElementById('engineer-bar-folded')?.classList.toggle('hidden');
}

document.getElementById('fold')?.addEventListener('click', toggleEngineerBar);
document.getElementById('unfold')?.addEventListener('click', toggleEngineerBar);

//toggle quickselect
const quicksel = document.getElementById('quicksel-folded')
const unquickseltab = document.getElementById('quicksel-unfolded')
const unqickselbutton = document.getElementById('quicksel-unfolded-button')
unqickselbutton?.addEventListener('click', (e) => {
    quicksel?.classList.remove('hidden');
    unquickseltab?.classList.add('hidden');
    nodesel = false;
    linesel = false;
    rmIdentifier();
});

quicksel?.addEventListener('click', (e) => {
    quicksel?.classList.add('hidden');
    unquickseltab?.classList.remove('hidden');
    var engtabs = document.querySelectorAll('.component-eng-tab');
    engtabs.forEach(t => {
        t.classList?.add('eng-unselected');
        t.classList?.remove('eng-selected');
    });
    nodesel = true;
    linesel = true;
    addIdentifier();
});

// playtab toggle
const addinputtab = document.getElementById('add-input');
const addoutputtab = document.getElementById('add-output');
const addprocesstab = document.getElementById('add-process');
const addcooptimizationtab = document.getElementById('add-cooptimization');
const addfeedbacktab = document.getElementById('add-feedback');
const addiotab = document.getElementById('add-io');

function toggleEngTab(tab) {
    var engtabs = document.querySelectorAll('.component-eng-tab');
    engtabs.forEach(t => {
        if (t !== tab) {
            t.classList?.add('eng-unselected');
            t.classList?.remove('eng-selected');
        }
    });
    tab.classList.add('eng-selected');
    tab.classList.remove('eng-unselected');
}

addprocesstab?.addEventListener('click', (e) => {
    nodesel = false;
    linesel = true;
    rmNodeSel();
    addIdentifier();
    toggleEngTab(addprocesstab)

    quicksel?.classList.remove('hidden');
    unquickseltab?.classList.add('hidden');
});

addinputtab?.addEventListener('click', (e) => {
    nodesel = true;
    linesel = false;
    rmLineSel();
    rmIdentifier();
    toggleEngTab(addinputtab)

    quicksel?.classList.remove('hidden');
    unquickseltab?.classList.add('hidden');
});

addoutputtab?.addEventListener('click', (e) => {
    nodesel = true;
    linesel = false;
    rmLineSel();
    rmIdentifier();
    toggleEngTab(addoutputtab)

    quicksel?.classList.remove('hidden');
    unquickseltab?.classList.add('hidden');
});

addcooptimizationtab?.addEventListener('click', (e) => {
    nodesel = true;
    linesel = false;
    rmLineSel();
    rmIdentifier();
    toggleEngTab(addcooptimizationtab)

    quicksel?.classList.remove('hidden');
    unquickseltab?.classList.add('hidden');
});

addfeedbacktab?.addEventListener('click', (e) => {
    nodesel = true;
    linesel = false;
    rmLineSel();
    rmIdentifier();
    toggleEngTab(addfeedbacktab)

    quicksel?.classList.remove('hidden');
    unquickseltab?.classList.add('hidden');
});

////////////// prompt-frame ////////////// 
var prompts = document.querySelectorAll('.prompt');
prompts.forEach(processPrompt);

// AJAX prompt
addiotab?.addEventListener('click', addio);
function addio() {
    startload();
    let id = document.getElementById('project_id').innerHTML;
    let info = document.getElementById('info').innerHTML;
    fetch('/addio', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'project_id': id, 'info': info }),
    })
        .then(response => response.json())
        .then(data => {
            // let prompt_id = loadajax(data['prompt']);
            // let prompt = document.getElementById('prompt' + prompt_id);
            // processPrompt(prompt);
            // scroll to the bottom
            window.location.reload();
            // document.getElementById('prompt-frame').scrollIntoView(false);
            console.log('load success')
        })
        .finally(() => {
            // finishload();
        });
}

let quickgen = document.getElementById('quickgen');
quickgen?.addEventListener('click', () => {

    let mode = returnMode();
    if (!mode) return;

    startload();
    let { prompt_id, info, currentmatrix } = returnInfo();

    fetch('/quickgen', {
        method: 'POST',
        body: JSON.stringify({
            'mode': mode,
            'prompt_id_array': prompt_id,
            'info_array': info,
            'currentmatrix_array': currentmatrix, //please do return current matrix as I wanted to utilize scripts to record transform
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            // let promptString = JSON.stringify(data);
            // let promptArray = JSON.parse(promptString);
            // promptArray.forEach(promptdata => {
            //     let prompt_id = loadajax(promptdata, promptdata['id']);
            //     let prompt = document.getElementById('prompt' + prompt_id);
            //     cleanPrompt(prompt);
            //     processPrompt(prompt);
            // });
            // console.log(data["data"]);
            window.location.reload();
            console.log('load success')
        })
        .finally(() => {

            finishload();
        });
});

// function saveToCustom() {
//     let { prompt_id, info, currentmatrix } = returnInfo(true);
//     let id = document.getElementById('project_id').innerHTML;
//     fetch('/load-playground', {
//         method: 'POST',
//         body: JSON.stringify({
//             'project_id': id,
//             'prompt_id_array': prompt_id,
//             'info_array': info,
//             'currentmatrix_array': currentmatrix,
//         }),
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     })
//         .then(response => response.json())
//         .then(data => {
//             console.log(data);
//             console.log('save success')
//         })
//         .finally(() => {
//         });
//     }

// quickgen sending data
function returnMode() {
    return document.querySelector('.eng-selected')?.id;
}

function returnInfo(absposition = false) {
    let info = [];
    let prompt_id = [];
    let currentmatrix = [];
    let prompts = document.querySelectorAll('.prompt');
    prompts.forEach(prompt => {
        absPostionMatrix(prompt);
        let promptinfo = [];
        if (nodesel) {
            var selectednodes = prompt.querySelectorAll('.node-selected');
            selectednodes.forEach(node => {
                promptinfo.push(node.querySelector(".node-wrapper").innerHTML);
            });
        }

        if (linesel) {
            savedMatchedLines.forEach(line => {
                let tempNode = [];
                tempNode.push(line.start.querySelector(".node-wrapper").innerHTML);
                tempNode.push(line.end.querySelector(".node-wrapper").innerHTML);

                //test if the first node of tempnode is a child of prompt
                if (line.start.closest(".prompt") == prompt) {
                    promptinfo.push(tempNode);
                }
            })
        }

        if (promptinfo.length > 0) {
            info.push(promptinfo);
            prompt_id.push(prompt.id);
            if (!absposition) {
                currentmatrix.push(prompt.querySelector(prompt.id.replace('prompt', '#promptNode')).innerText);
            }
            else {
                currentmatrix.push(absPostionMatrix(prompt));
            }
        } else { return; }

    })

    return { prompt_id, info, currentmatrix };
}


function absPostionMatrix(prompt) {
    //this function is to transform the relative position matrix to absolute position matrix
    //the relative position matrix is the matrix that is stored in the database
    //the absolute position matrix is the matrix that is displayed in the playground

    //the absolute position matrix is a 2D array with the following structure
    // {nodeName:[[absX, absY], nodeSystem]}

    let absMatrix = {};

    var nodewrapper = prompt.querySelectorAll('.node-wrapper')
    nodewrapper.forEach((nodewrapper) => {
        let node = nodewrapper.closest('.node');
        let absPosition = getnodePositionInDOM(node);
        absMatrix[nodewrapper.innerHTML] = [absPosition, node.style.transform, node.style.backgroundColor];
    })
    return absMatrix;
}

function getnodePositionInDOM(node) {
    let x = 0;
    let y = 0;
    nodeparent = node.closest('.prompt-frame');
    while (node) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
        if (node === nodeparent) {
            break;
        }
    }
    return [x, y];
}


document.querySelector('.prompt-user').classList.add('hidden');

//add hover effect 

///////////////////////////socket function/////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
var socket = io.connect('http://localhost:5000');
function sendDataToCustom() {
    let { prompt_id, info, currentmatrix } = returnInfo(true);
    let id = document.getElementById('project_id').innerHTML;
    socket.emit('send_data_to_custom', {
        'project_id': id,
        'prompt_id_array': prompt_id,
        'info_array': info,
        'currentmatrix_array': currentmatrix
    });
}
