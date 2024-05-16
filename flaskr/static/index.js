import { DefaultSystem, System, colorPicker } from "./SystemBar.js";
document.getElementById('modal-description-activate')?.addEventListener('click', function () {
    document.querySelector('#modal-popup-prompt').style.display = 'block';
    document.querySelector('.modal-description').style.visibility = 'visible';
});
document.getElementById('modal-img-activate')?.addEventListener('click', function () {
    document.querySelector('#modal-popup-prompt').style.display = 'block';
    document.querySelector('.modal-img').style.visibility = 'visible';
});
document.getElementById('modal-label-activate')?.addEventListener('click', function () {
    document.querySelector('#modal-popup-prompt').style.display = 'block';
    document.querySelector('.modal-label').style.visibility = 'visible';
});
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
function processDefaultSystem(container) {
    if (!container)
        return;
    DefaultSystem.defaultSystems.forEach((system) => {
        new DefaultSystem(container, system.content, system.color, system.iconUrl);
    });
}
function processProjectSystem(container) {
    if (!container)
        return;
    let currentToggles = container.querySelectorAll('.toggle');
    if (currentToggles) {
        currentToggles.forEach((toggle) => {
            toggle.remove();
        });
    }
    let systemObjects = DefaultSystem.currentSystems && DefaultSystem.currentSystems.length > 0
        ? DefaultSystem.currentSystems : DefaultSystem.defaultSystems;
    systemObjects.forEach(system => {
        new System(container, system.content, system.color, system.iconUrl);
    });
}
const modalSystem = document.getElementById('modal-system');
if (modalSystem) {
    processDefaultSystem(modalSystem.querySelector('#syslist'));
}
var systemFrames = document.querySelectorAll('.system-frame');
systemFrames.forEach((systemFrame) => processProjectSystem(systemFrame));
function addNewSystem(sys, content = '', color = 'rgba(161, 173, 204, 1)', iconUrl = null) {
    if (DefaultSystem.getAllSystemContents().includes(content)) {
        return;
    }
    if (DefaultSystem.mySystems.length >= 7) {
        alert('You can only add up to 7 systems.');
        return;
    }
    let newSystem = new DefaultSystem(sys, content, color, iconUrl);
    newSystem.handleToggleClick();
}
if (modalSystem) {
    let addNewBtn = modalSystem.querySelector('#addnew');
    addNewBtn.onclick = (event) => addNewSystem(modalSystem.querySelector('#syslist'));
}
function resetToDefault(sys) {
    DefaultSystem.mySystems.forEach((system) => {
        system.remove();
    });
    colorPicker.color.set("#fff");
    processDefaultSystem(sys);
}
if (modalSystem) {
    let resetBtn = modalSystem.querySelector('#reset-system');
    resetBtn.onclick = (event) => resetToDefault(modalSystem.querySelector('#syslist'));
}
function setSystem() {
    if (DefaultSystem.mySystems.length == 0) {
        alert('Please add at least one system.');
        return;
    }
    DefaultSystem.returnSysArray();
    processProjectSystem(document.querySelector('.system-frame'));
    closeSystemModal();
    let systemFrames = document.querySelectorAll('.system-frame');
    systemFrames.forEach((systemFrame) => processProjectSystem(systemFrame));
}
if (modalSystem) {
    let systemBtn = modalSystem.querySelector('#set-system');
    systemBtn.onclick = (event) => setSystem();
}
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
        }
        else {
            form.appendChild(createInput('expand', false));
        }
        let input2 = createInput('requesttype', 'description');
        form.appendChild(input2);
        let input3 = createInput('system', JSON.stringify(DefaultSystem.returnPrjDict()));
        form.appendChild(input3);
        if (document.getElementById('description').textContent) {
            form.submit();
            startload();
        }
        else {
            alert('Please enter a description.');
            return;
        }
    }
});
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
function previewUpload(fileInput, preview) {
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            var file = fileInput.files[0];
            if (!file) {
                preview.src = "";
                preview.style.display = 'none';
                return;
            }
            if (file.size > 4000000) {
                alert('File is too large. Maximum allowed size is 4 MB.');
                fileInput.value = '';
                return;
            }
            var reader = new FileReader();
            reader.onloadend = function () {
                var img = new Image();
                img.onload = function () {
                    var resizedimension = 720;
                    var dimension = Math.min(img.width, img.height);
                    var canvas = document.createElement('canvas');
                    canvas.width = resizedimension;
                    canvas.height = resizedimension;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, (img.width - dimension) / 2, (img.height - dimension) / 2, dimension, dimension, 0, 0, resizedimension, resizedimension);
                    preview.src = canvas.toDataURL();
                    preview.style.display = 'block';
                };
                img.src = reader.result;
            };
            let uploadIcon = document.getElementById('icon-upload');
            uploadIcon.style.display = 'none';
            reader.readAsDataURL(file);
        });
    }
}
var fileInput = document.getElementById('image-upload');
var preview = document.getElementById('preview-img');
previewUpload(fileInput, preview);
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
            return;
        }
        else {
            let customLabel = createCustomLabel(custom.textContent);
            custom.replaceWith(customLabel);
            let customDefault = createCustomDefault();
            customLabel.insertAdjacentElement('afterend', customDefault);
        }
    });
}
function createCustomDefault() {
    let custom = document.getElementById('custom');
    if (!custom) {
        let customDefault = document.createElement('div');
        customDefault.classList.add('component-bar-custom', 'card-14');
        customDefault.id = 'custom';
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
function finishEdit(event) {
    if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
        event.target.blur();
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
