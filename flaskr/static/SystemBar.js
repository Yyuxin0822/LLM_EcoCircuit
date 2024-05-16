import { FuncBar } from "./FuncBar.js";
import { PromptFlowline } from "./generateplayground/prompt/PromptFlowline.js";
export class SystemFuncBar extends FuncBar {
    constructor(container) {
        super(container);
    }
    attachEventListeners() {
        super.attachEventListeners();
        document.addEventListener('click', (event) => {
            this.handleClickOutside.bind(this)(event);
        });
        this.container.addEventListener('click', (event) => {
            if (event.target.closest('.toggle')) {
                this.handleToggleClick(event.target.closest('.toggle'));
                this.handleColorPicker();
            }
        });
        this.confirmColorBtn = this.container.querySelector('#confirm-color');
        this.confirmColorBtn.addEventListener('click', this.handleConfirmColor.bind(this));
        this.resetColorBtn = this.container.querySelector('#reset-color');
        this.resetColorBtn.addEventListener('click', this.handleResetColor.bind(this));
    }
    handleClickOutside(event) {
        if (event.target.closest('#system-bar'))
            return;
        if (this.activeToggle) {
            this.activeToggle?.classList?.remove("active");
            this.activeToggle?.classList?.add("inactive");
            this.deactivateFunction(this.activeToggle.id);
            this.activeToggle = null;
            this.hideColorPicker();
            this.handleResetColor();
        }
    }
    handleColorPicker() {
        var pickerContainer = document.getElementById('colorPicker');
        var pickerFunc = document.getElementById('colorPickerFunc');
        var isVisible = pickerContainer.style.display !== 'none';
        if (!isVisible) {
            pickerContainer.style.display = 'block';
            pickerFunc.style.display = 'block';
        }
        PromptFlowline.fixLine();
    }
    hideColorPicker() {
        var pickerContainer = document.getElementById('colorPicker');
        var pickerFunc = document.getElementById('colorPickerFunc');
        var isVisible = pickerContainer.style.display !== 'none';
        if (isVisible) {
            pickerContainer.style.display = 'none';
            pickerFunc.style.display = 'none';
        }
        PromptFlowline.fixLine();
    }
    get activeSystem() {
        return this.activeToggle;
    }
    handleConfirmColor() {
        System.returnSysArray().then(() => {
            window.location.reload();
        }).catch(error => {
            console.error("Failed to return system array:", error);
        });
    }
    handleResetColor() {
        var systemString = document.querySelector('#project-system').innerText;
        var systemArray = parseJson(systemString);
        systemArray.forEach((system) => {
            var toggle = document.getElementById(validId(system[0]));
            if (!toggle)
                return;
            toggle.querySelector('.icon-common').style.backgroundColor = system[1];
        });
    }
}
export class System {
    constructor(container, content, color, iconUrl) {
        this._container = container;
        this._content = content;
        this._id = validId(content);
        this._color = color;
        this._iconUrl = iconUrl;
        this.init();
    }
    init() {
        let toggle = document.createElement('div');
        toggle.classList.add('toggle');
        toggle.id = this.id;
        let icon = document.createElement('div');
        icon.classList.add('icon-common');
        toggle.appendChild(icon);
        let textdiv = document.createElement('p');
        textdiv.innerText = this._content.charAt(0).toUpperCase();
        textdiv.classList.add('icon-placeholder');
        textdiv.style.display = 'none';
        icon.appendChild(textdiv);
        if (this._iconUrl === undefined || this._iconUrl === null) {
            textdiv.style.display = 'flex';
        }
        else {
            icon.style.backgroundImage = `url(${this._iconUrl})`;
            icon.style.backgroundColor = 'transparent';
            textdiv.style.display = 'none';
        }
        icon.style.backgroundColor = this._color;
        this._container.insertBefore(toggle, this._container.querySelector('.stopper').previousSibling);
        toggle.classList.add('tooltip');
        let tooltiptext = document.createElement('span');
        tooltiptext.classList.add('tooltiptext');
        tooltiptext.innerText = this._content;
        toggle.appendChild(tooltiptext);
    }
    get id() {
        return this._id;
    }
    get content() {
        return this._content;
    }
    get color() {
        return this._color;
    }
    set color(color) {
        this._color = color;
        let toggle = this._container.querySelector(`#${this._id}`);
        toggle.querySelector('.icon-common').style.backgroundColor = color;
    }
    static returnSysArray() {
        let sysBtn = document.getElementById('info-frame').querySelector('.active');
        DefaultSystem.currentSystems.forEach((system) => {
            if (system.content === sysBtn.querySelector('.tooltiptext').innerHTML) {
                system.color = sysBtn.querySelector('.icon-common').style.backgroundColor;
            }
        });
        let systemArray = DefaultSystem.returnPrjDict();
        let project_id = document.getElementById('project_id').innerText;
        let data = { project_id: project_id, system: systemArray };
        return emitSocket("save_system", data).then(() => {
            return systemArray;
        }).catch(error => {
            console.error("Failed to emit socket:", error);
            throw error;
        });
    }
}
export const colorPicker = new iro.ColorPicker("#colorPicker", {
    width: 224,
    layout: [{
            component: iro.ui.Wheel,
            options: {}
        }
    ]
});
colorPicker.on('color:change', function (color) {
    if (document.getElementById('info-frame')) {
        let sysBtn = document.getElementById('info-frame').querySelector('.active');
        sysBtn.querySelector('.icon-common').style.backgroundColor = color.hexString;
    }
    if (document.getElementById('syslist') && document.getElementById('syslist').querySelector('.active')) {
        let systemItem = DefaultSystem.getSystemItembyId(document.getElementById('syslist').querySelector('.active').id);
        systemItem.color = color.hexString;
    }
});
var iconInput = document.getElementById('customicon-upload');
function previewIcon(iconInput) {
    if (iconInput) {
        iconInput.addEventListener('change', function () {
            if (iconInput.files && iconInput.files.length > 0) {
                var file = iconInput.files[0];
                console.log(file);
                let iconToggle = document.querySelector('#syslist .active');
                if (!iconToggle) {
                    console.log('No active icon toggle found.');
                    return;
                }
                let defaultIcon = DefaultSystem.getSystemItembytoggle(iconToggle);
                if (!defaultIcon) {
                    console.log('No default icon found for the active toggle.');
                    return;
                }
                let reader = new FileReader();
                reader.onload = function () {
                    let iconUrl = reader.result;
                    defaultIcon.iconUrl = iconUrl;
                    console.log(iconUrl);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}
previewIcon(iconInput);
export class DefaultSystem {
    constructor(container, content, color, iconUrl) {
        this._container = container;
        this._content = content;
        this._id = validId(content);
        this._color = color;
        this._iconUrl = iconUrl;
        this.init();
        this.attachEventListeners();
        DefaultSystem.mySystems.push(this);
        if (DefaultSystem.mySystems.length === 1) {
            this.handleToggleClick();
        }
    }
    init() {
        this._toggle = document.createElement('div');
        this._toggle.classList.add('toggle');
        this._toggle.id = this.id;
        this._container.insertBefore(this._toggle, this._container.querySelector('#addnew').previousSibling);
        let sysicon = document.createElement('div');
        sysicon.classList.add('sysicon');
        this._toggle.appendChild(sysicon);
        this.closeBtn = document.createElement('span');
        this.closeBtn.classList.add('icon-common');
        this.closeBtn.classList.add('icon-close2');
        this._toggle.appendChild(this.closeBtn);
        this._systext = document.createElement('p');
        this._systext.classList.add('systext');
        this._systext.innerText = this._content;
        this._toggle.appendChild(this._systext);
        this._icon = document.createElement('span');
        this._icon.classList.add('icon-common');
        sysicon.appendChild(this._icon);
        this.textdiv = document.createElement('p');
        this.textdiv.classList.add('icon-placeholder');
        this.textdiv.innerText = this._content.charAt(0).toUpperCase();
        this._icon.appendChild(this.textdiv);
        this.textdiv.style.display = 'none';
        let defaultSystem = DefaultSystem.defaultSystems.find((system) => system.content === this._content);
        if (defaultSystem) {
            this.iconUrl = defaultSystem.iconUrl;
        }
        else {
            this.iconUrl = null;
        }
        this.icon.style.backgroundColor = this._color;
    }
    attachEventListeners() {
        this._toggle.addEventListener('click', this.handleToggleClick.bind(this));
        document.addEventListener('click', (event) => {
            this.handleClickOutside.bind(this)(event);
        });
        this.closeBtn.addEventListener('click', () => {
            this.remove();
        });
        this.systext.addEventListener('blur', () => {
            if (this.systext.contentEditable === 'false')
                return;
            this.commitTextEdit(this.systext.innerText);
        });
    }
    handleToggleClick() {
        DefaultSystem.mySystems.forEach((system) => {
            system.toggle.classList.remove('active');
            system.toggle.classList.add('inactive');
            system.deactivate();
        });
        if (this._toggle.classList.contains('active')) {
            this._toggle.classList.remove('active');
            this._toggle.classList.add('inactive');
            this.deactivate();
        }
        else {
            this._toggle.classList.remove('inactive');
            this._toggle.classList.add('active');
            this.activate();
            document.querySelector('.icon-editer').classList?.add('active');
        }
    }
    handleClickOutside(event) {
        if (event.target.closest('#syslist') || event.target.closest('.icon-editer'))
            return;
        DefaultSystem.mySystems.forEach((system) => {
            system.toggle.classList.remove('active');
            system.toggle.classList.add('inactive');
            system.deactivate();
        });
        document.querySelector('.icon-editer').classList?.remove('active');
    }
    activate() {
        this.systext.contentEditable = 'true';
        this.systext.focus();
    }
    deactivate() {
        this.systext.contentEditable = 'false';
        this.systext.blur();
    }
    remove() {
        this._container.removeChild(this._toggle);
        DefaultSystem.mySystems = DefaultSystem.mySystems.filter((system) => system.id !== this.id);
    }
    get id() {
        return this._id;
    }
    get content() {
        return this._content;
    }
    set content(content) {
        content = content.toUpperCase();
        this._content = content;
        this._id = validId(content);
        this._toggle.id = this._id;
        this._systext.innerText = content;
    }
    get toggle() {
        return this._toggle;
    }
    get color() {
        return this._color;
    }
    set color(color) {
        this._color = color;
        this.toggle.querySelector('.icon-common').style.backgroundColor = color;
    }
    get systext() {
        return this._systext;
    }
    get icon() {
        return this._icon;
    }
    get iconUrl() {
        return this._iconUrl;
    }
    set iconUrl(iconUrl) {
        this._iconUrl = iconUrl;
        if (this._iconUrl === undefined || this._iconUrl === null) {
            this.textdiv.innerText = this.content.charAt(0).toUpperCase();
            this.textdiv.style.display = 'flex';
            this.icon.style.backgroundImage = 'none';
        }
        else {
            this.icon.style.backgroundImage = `url(${iconUrl})`;
            this.icon.style.backgroundColor = 'transparent';
            this.textdiv.style.display = 'none';
        }
    }
    static returnSysArray() {
        let systemArray = [];
        systemArray = DefaultSystem.mySystems.map((system) => {
            return { "content": system.content, "color": system.color, "iconUrl": system.iconUrl };
        });
        DefaultSystem.currentSystems = systemArray;
        return systemArray;
    }
    static returnPrjDict() {
        let dict = {};
        let systems = DefaultSystem.currentSystems.length === 0 ? DefaultSystem.defaultSystems : DefaultSystem.currentSystems;
        systems.forEach((system) => {
            dict[system.content] = [system.color, system.iconUrl];
        });
        return dict;
    }
    static getSystemItembyId(id) {
        return DefaultSystem.mySystems.find((system) => system.id === id);
    }
    static getSystemItembytoggle(toggle) {
        return DefaultSystem.mySystems.find((system) => system.id === toggle.id);
    }
    static getAllSystemContents() {
        let systemContent = [];
        DefaultSystem.mySystems.forEach((system) => {
            systemContent.push(system.content);
        });
        return systemContent;
    }
    commitTextEdit(text) {
        if (this.content === text.toUpperCase())
            return;
        if (DefaultSystem.getAllSystemContents().includes(text.toUpperCase())) {
            this.remove();
            alert('This system already exists.');
        }
        this.content = text;
        this.iconUrl = null;
    }
}
DefaultSystem.mySystems = [];
DefaultSystem.defaultSystems = [
    {
        "content": "HYDRO",
        "color": "#0BF",
        "iconUrl": "static/icon/Iconsystem-water.png"
    },
    {
        "content": "ENERGY",
        "color": "#FC0",
        "iconUrl": "static/icon/Iconsystem-energy.png"
    },
    {
        "content": "SOLID WASTE",
        "color": "#A75",
        "iconUrl": "static/icon/Iconsystem-solidwaste.png"
    },
    {
        "content": "TELECOMMUNICATION",
        "color": "#C5E",
        "iconUrl": "static/icon/Iconsystem-ict.png"
    },
    {
        "content": "MOBILITY",
        "color": "#F44",
        "iconUrl": "static/icon/Iconsystem-mobility.png"
    },
    {
        "content": "BIOSYSTEM",
        "color": "#3C4",
        "iconUrl": "static/icon/Iconsystem-ecosystem.png"
    },
    {
        "content": "UNKNOWN",
        "color": "#888",
        "iconUrl": "static/icon/Iconsystem-unknown.png"
    }
];
DefaultSystem.currentSystems = [];
