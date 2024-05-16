//@ts-ignore
import { DefaultSystem, System, colorPicker } from "./SystemBar.js";


// Modal popup for text, image, and draw
// when clicked id="text", show the modal-text
document.getElementById('modal-description-activate')?.addEventListener('click', function () {
    document.querySelector('#modal-popup-prompt').style.display = 'block';
    document.querySelector('.modal-description').style.visibility = 'visible';
});
// when clicked id="img", show the modal-img
document.getElementById('modal-img-activate')?.addEventListener('click', function () {
    document.querySelector('#modal-popup-prompt').style.display = 'block';
    document.querySelector('.modal-img').style.visibility = 'visible';
});
// when clicked id="draw", show the modal-draw
document.getElementById('modal-label-activate')?.addEventListener('click', function () {
    document.querySelector('#modal-popup-prompt').style.display = 'block';
    document.querySelector('.modal-label').style.visibility = 'visible';
});
// when clicked icon_close, close the modal
document.querySelectorAll('.icon-prompt-close')?.forEach(function (icon) {
    icon.addEventListener('click', function () {
        document.querySelectorAll('.modal-description, .modal-img, .modal-label').forEach(function (modal) {
            let preview = document.getElementById('preview-img');
            if (preview) {
                preview.src = "";
                preview.style.display = 'none';
            }
            let uploadIcon = document.getElementById('icon-upload');
            uploadIcon.style.display = 'block';
            modal.style.visibility = 'hidden';
        });
        document.querySelector('#modal-popup-prompt').style.display = 'none';
    });
});

function closeSystemModal() {
    document.querySelector('#modal-popup-system').style.display = 'none';
    document.querySelector('.modal-system').style.visibility = 'hidden';
}
if (document.getElementById('icon-close-system')) {
    document.getElementById('icon-close-system').onclick = closeSystemModal;
}


document.querySelectorAll('.system-frame').forEach(function (frame) {
    frame.addEventListener('click', function () {
        document.querySelector('#modal-popup-system').style.display = 'block';
        document.querySelector('.modal-system').style.visibility = 'visible';
    });
});


// loading system-related HTML elements

function processDefaultSystem(container: HTMLElement | null) {
    if (!container) return;
    DefaultSystem.defaultSystems.forEach((system) => {
        new DefaultSystem(container, system.content, system.color, system.iconUrl);
    });
}

function processProjectSystem(container: HTMLElement | null) {
    if (!container) return;
    let currentToggles = container.querySelectorAll('.toggle');
    if (currentToggles) {
        currentToggles.forEach((toggle) => {
            toggle.remove();
        });
    }

    // Ensure DefaultSystem.currentSystem is defined and it's an array
    let systemObjects = DefaultSystem.currentSystems && DefaultSystem.currentSystems.length > 0
        ? DefaultSystem.currentSystems : DefaultSystem.defaultSystems;

    // Assuming systemObjects is an array of objects with properties to use
    systemObjects.forEach(system => {
        new System(container, system.content, system.color, system.iconUrl);
    });
}

const modalSystem = document.getElementById('modal-system');
if (modalSystem) {
    processDefaultSystem(modalSystem.querySelector('#syslist'));
}
var systemFrames = document.querySelectorAll('.system-frame');
systemFrames.forEach((systemFrame: HTMLElement) => processProjectSystem(systemFrame))



///////////// Inside the modal-system ////////////
function addNewSystem(sys: HTMLElement, content: string = '', color: string = 'rgba(161, 173, 204, 1)', iconUrl: string = null) {
    //if content in DefaultSystem.getAllSystemContents() then return
    if (DefaultSystem.getAllSystemContents().includes(content)) {
        return;
    }
    //check if DefaultSystem.myDefaultSystemItems has already reached 7 items as the limit
    if (DefaultSystem.mySystems.length >= 7) {
        alert('You can only add up to 7 systems.');
        return;
    }
    let newSystem = new DefaultSystem(sys, content, color, iconUrl);
    newSystem.handleToggleClick();
}
if (modalSystem) {
    let addNewBtn = modalSystem.querySelector('#addnew') as HTMLElement;
    addNewBtn.onclick = (event: MouseEvent) => addNewSystem(modalSystem.querySelector('#syslist'));
}




function resetToDefault(sys: HTMLElement) {
    DefaultSystem.mySystems.forEach((system) => {
        system.remove();
    });

    colorPicker.color.set("#fff"); //timing is important

    processDefaultSystem(sys);

}
if (modalSystem) {
    let resetBtn = modalSystem.querySelector('#reset-system') as HTMLElement;
    resetBtn.onclick = (event: MouseEvent) => resetToDefault(modalSystem.querySelector('#syslist'));
}


function setSystem() {
    //get all current DefaultSystem.myDefaultSystems to DefaultSystem.currentSystem
    DefaultSystem.returnSysArray();

    //reset the system-frame,timing is important
    processProjectSystem(document.querySelector('.system-frame') as HTMLElement);
    //close the modal
    closeSystemModal();
    //reset the .system-frame
    let systemFrames = document.querySelectorAll('.system-frame');
    systemFrames.forEach((systemFrame: HTMLElement) => processProjectSystem(systemFrame));
}

if (modalSystem) {
    let systemBtn = modalSystem.querySelector('#set-system') as HTMLElement;
    systemBtn.onclick = (event: MouseEvent) => setSystem();
}
////////////modal-description////////////
let componentExpandDescription = document.getElementById('component-expand-description');
let componentCollapseDescription = document.getElementById('component-dont-expand-description');
componentExpandDescription?.addEventListener('click', function () {
    componentExpandDescription.classList.toggle('hidden');
    componentCollapseDescription.classList.toggle('hidden');
});
componentCollapseDescription?.addEventListener('click', function () {
    componentExpandDescription.classList.toggle('hidden');
    componentCollapseDescription.classList.toggle('hidden');
});

function createInput(name, value) {
    let input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    return input;
}

document.getElementById('generate-text')?.addEventListener('click', function () {
    let form = document.createElement('form');
    form.method = 'POST';
    document.body.appendChild(form);

    if (document.querySelector('.modal-description').style.visibility == 'visible') {
        let input = createInput('description', document.getElementById('description').textContent);
        form.appendChild(input);

        let componentExpandDescription = document.getElementById('component-expand-description');
        if (!componentExpandDescription.classList.contains('hidden')) {
            form.appendChild(createInput('expand', true));
        } else {
            form.appendChild(createInput('expand', false));
        }

        let input2 = createInput('requesttype', 'description');
        form.appendChild(input2);

        let input3 = createInput('system', JSON.stringify(DefaultSystem.returnPrjDict()));
        form.appendChild(input3);

        if (document.getElementById('description').textContent) {
            form.submit();
            startload();
        } else {
            alert('Please enter a description.');
            return; // Exit the function to avoid further processing and submitting
        }
    }

});

////////////modal-image////////////
document.getElementById('generate-img')?.addEventListener('click', function () {
    var form = document.querySelector('.modal-img form');
    var fileInput = document.getElementById('image-upload');
    if (fileInput) {
        var file = fileInput.files[0];
        if (!file) {
            alert('Please browse file to upload an image.');
            return;
        }
    }

    let input2 = createInput('requesttype', 'image');
    form.appendChild(input2);

    let input3 = createInput('system', JSON.stringify(DefaultSystem.returnPrjDict()));
    form.appendChild(input3);

    form.submit();
    startload();
});

function previewUpload(fileInput: HTMLElement, preview: HTMLElement) {
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            var file = fileInput.files[0];
            if (!file) {
                preview.src = "";
                preview.style.display = 'none'; // Hide the image if no file is selected
                return;
            }

            if (file.size > 4000000) { // 12 MB
                alert('File is too large. Maximum allowed size is 4 MB.');
                fileInput.value = ''; // Reset the file input
                return;
            }

            var reader = new FileReader();
            reader.onloadend = function () {
                var img = new Image();
                img.onload = function () {
                    // Create a square cropped version of the image
                    var resizedimension = 720;
                    var dimension = Math.min(img.width, img.height);
                    var canvas = document.createElement('canvas');
                    canvas.width = resizedimension;
                    canvas.height = resizedimension;
                    var ctx = canvas.getContext('2d');

                    // Draw image centered in canvas
                    ctx.drawImage(img, (img.width - dimension) / 2, (img.height - dimension) / 2, dimension, dimension, 0, 0, resizedimension, resizedimension);

                    preview.src = canvas.toDataURL();
                    preview.style.display = 'block'; // Show the image
                };
                img.src = reader.result; // Set source so the `onload` can trigger
            };

            let uploadIcon = document.getElementById('icon-upload');
            uploadIcon.style.display = 'none';
            reader.readAsDataURL(file); // Reads the file as a data URL
        });
    }
}
var fileInput = document.getElementById('image-upload');
var preview = document.getElementById('preview-img');
previewUpload(fileInput, preview);
////////////modal-label////////////
// for class="component-bar-custom", when clicked, change the class to "component-bar-custom-selected"
function seldesel(component) {
    component.addEventListener('click', function () {
        component.classList.toggle('component-bar-custom');
        component.classList.toggle('component-bar-node-selected');
    });
}
let componentBarCustom = document.querySelectorAll('.component-bar-custom:not(#custom)');
componentBarCustom.forEach(seldesel);

let custom = document.getElementById('custom');
attachCustomEvent(custom);
function attachCustomEvent(custom) {
    custom?.addEventListener('blur', function () {
        if (!custom.textContent) {
            return
        } else {
            let customLabel = createCustomLabel(custom.textContent);
            custom.replaceWith(customLabel);
            let customDefault = createCustomDefault();
            customLabel.insertAdjacentElement('afterend', customDefault);
            // finishEdit();
        }
    });
}

// Updated createCustomDefault function
function createCustomDefault() {
    let custom = document.getElementById('custom');
    if (!custom) {
        let customDefault = document.createElement('div');
        customDefault.classList.add('component-bar-custom', 'card-14');
        customDefault.id = 'custom'; // Ensure unique IDs or handle differently if needed
        customDefault.contentEditable = true;
        attachCustomEvent(customDefault);
        return customDefault;
    }
}

function createCustomLabel(content) {
    let nodeEdited = document.createElement('div');
    nodeEdited.classList.add('node-edited');
    let iconClose2 = document.createElement('span');
    iconClose2.classList.add('icon-common');
    iconClose2.classList.add('icon-close2');
    iconClose2.addEventListener('click', function () {
        nodeEdited.remove();
    });
    let custom = document.createElement('div');
    custom.classList.add('component-bar-node-selected');
    custom.classList.add('card-14');
    custom.id = content;
    custom.textContent = content;
    seldesel(custom);
    nodeEdited.appendChild(iconClose2);
    nodeEdited.appendChild(custom);
    return nodeEdited;
}

/////////////////////////////////////// helper functions ///////////////////////////////////////
// Function to be called when finishing editing
function finishEdit(event) {
    if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault(); // Prevent the default action to avoid adding a new line
        event.target.blur(); // Trigger the blur event, ending the editing session
    }
}
addGlobalEventListener('keydown', '[contenteditable]', finishEdit);

document.getElementById('generate-label')?.addEventListener('click', function () {
    let form = document.createElement('form');
    form.method = 'POST';
    document.body.appendChild(form);

    if (document.querySelector('.modal-label').style.visibility == 'visible') {
        let buttonSelected = document.querySelectorAll('.component-bar-node-selected');
        let selectedValues = Array.from(buttonSelected).map(button => button.textContent).join(', ');
        let inputlabel = createInput('label', selectedValues);

        form.appendChild(inputlabel);

        let input2 = createInput('requesttype', 'label');
        form.appendChild(input2);

        let input3 = createInput('system', JSON.stringify(DefaultSystem.returnPrjDict()));
        form.appendChild(input3);

        if (selectedValues) {
            form.submit();
            startload();
        }
    }
});


