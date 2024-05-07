// Modal popup for text, image, and draw
// when clicked id="text", show the modal-text
document.getElementById('modal-description-activate')?.addEventListener('click', function () {
    document.querySelector('.modal-description').style.visibility = 'visible';
});
// when clicked id="img", show the modal-img
document.getElementById('modal-img-activate')?.addEventListener('click', function () {
    document.querySelector('.modal-img').style.visibility = 'visible';
});
// when clicked id="draw", show the modal-draw
document.getElementById('modal-label-activate')?.addEventListener('click', function () {
    document.querySelector('.modal-label').style.visibility = 'visible';
});
// when clicked icon_close, close the modal
document.querySelectorAll('.icon-close')?.forEach(function (icon) {
    icon.addEventListener('click', function () {
        document.querySelectorAll('.modal-description, .modal-img, .modal-label').forEach(function (modal) {
            let preview = document.getElementById('preview-img');
            if (preview) {
                preview.src = "";
                preview.style.display = 'none';
            }
            let uploadIcon=document.getElementById('icon-upload');
            uploadIcon.style.display = 'block';
            modal.style.visibility = 'hidden';
        });
    });
});

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
    let input2 = document.createElement('input');
    input2.type = 'hidden';
    input2.name = 'requesttype';

    if (document.querySelector('.modal-description').style.visibility == 'visible') {
        let input = createInput('description', document.getElementById('description').textContent);
        let componentExpandDescription = document.getElementById('component-expand-description');

        if (!componentExpandDescription.classList.contains('hidden')) {
            form.appendChild(createInput('expand', true));
        } else {
            form.appendChild(createInput('expand', false));
        }

        if (document.getElementById('description').textContent) {
            input2.value = 'description';
        } else {
            alert('Please enter a description.');
            return; // Exit the function to avoid further processing and submitting
        }

        form.appendChild(input);
        form.appendChild(input2);
        // startload();
    }

    document.body.appendChild(form);

    if (input2.value) {
        form.submit();
        startload();
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
        }}

    let input2 = document.createElement('input');
    input2.type = 'hidden';
    input2.name = 'requesttype';
    input2.value = 'image';
    form.appendChild(input2);
    form.submit();
    startload();
});


var fileInput = document.getElementById('image-upload');
var preview = document.getElementById('preview-img');
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
        
        let uploadIcon=document.getElementById('icon-upload');
        uploadIcon.style.display = 'none';
        reader.readAsDataURL(file); // Reads the file as a data URL
    });
}

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
            finishEdit();
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
function finishEdit() {
    let elements = document.querySelectorAll('[contenteditable]');
    elements.forEach(function (element) {
        // Add an event listener for 'keydown' to each contenteditable element
        element.addEventListener('keydown', function (event) {
            // Check if the key pressed is 'Enter'
            if (event.key === "Enter" || event.keyCode === 13) {
                event.preventDefault(); // Prevent the default action to avoid adding a new line
                element.blur(); // Trigger the blur event, ending the editing session
            }
        });
    });
}

// Call the function to apply the behavior
finishEdit();


document.getElementById('generate-label')?.addEventListener('click', function () {
    let form = document.createElement('form');
    form.method = 'POST';
    let input2 = document.createElement('input');
    input2.type = 'hidden';
    input2.name = 'requesttype';

    if (document.querySelector('.modal-label').style.visibility == 'visible') {
        let buttonSelected = document.querySelectorAll('.component-bar-node-selected');
        let selectedValues = Array.from(buttonSelected).map(button => button.textContent).join(', ');
        let inputlabel = createInput('label', selectedValues);
        if (selectedValues) { input2.value = 'label'; }
        form.appendChild(inputlabel);
        form.appendChild(input2);
    }

    document.body.appendChild(form);
    if (input2.value) { form.submit(); 
        startload();
    }
});


