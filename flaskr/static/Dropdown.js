export class Dropdown {
    constructor(container, options = new Map()) {
        this.container = container;
        this.options = options;
        this.dropdown = null;
        this.dropdownItems = [];
        this.init();
    }
    init() {
        this.createDropdown();
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }
    handleClickOutside(e) {
        if (Dropdown.activeDropdown && !Dropdown.activeDropdown.dropdown.contains(e.target)) {
            Dropdown.activeDropdown.remove();
        }
    }
    createDropdown() {
        if (Dropdown.activeDropdown) {
            Dropdown.activeDropdown.remove();
        }
        let dropdownHTML = document.createElement('div');
        dropdownHTML.classList.add('dropdown-menu');
        this.container.style.zIndex = "5";
        this.container.appendChild(dropdownHTML);
        this.dropdown = dropdownHTML;
        for (let [option, subOptions] of this.options) {
            let dropdownItem = this.appendDropdownItem(option);
            if (subOptions) {
                subOptions.forEach(subOption => {
                    this.appendSubDropdownItem(subOption, dropdownItem);
                });
            }
        }
        this.attachEventListenersToItems();
        Dropdown.activeDropdown = this;
    }
    remove() {
        if (this.dropdown) {
            this.container.style.removeProperty('z-index');
            this.dropdown.remove();
            this.dropdown = null;
            if (Dropdown.activeDropdown === this) {
                Dropdown.activeDropdown = null;
            }
        }
        document.removeEventListener('contextmenu', this.handleClickOutside);
        document.removeEventListener('click', this.handleClickOutside);
    }
    attachEventListenersToItems() {
        this.dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleSubItemsToggle(e);
            });
        });
    }
    handleSubItemsToggle(e) {
        if (e.target.classList.contains('dropdown-item')) {
            let subItems = e.target.querySelectorAll('.dropdown-item-sub');
            for (let i = 0; i < subItems.length; i++) {
                if (subItems[i].classList.contains('hidden')) {
                    subItems[i].classList.remove('hidden');
                }
                else {
                    subItems[i].classList.add('hidden');
                }
            }
        }
    }
    appendDropdownItem(itemName) {
        let item = document.createElement('div');
        item.className = 'dropdown-item';
        item.id = "dropdown" + itemName.replace(/\s+/g, '');
        item.innerHTML = "&#9656  " + itemName;
        this.dropdown.appendChild(item);
        this.dropdownItems.push(item);
        return item;
    }
    appendSubDropdownItem(itemName, parentdrpdwnitem) {
        let id = 'dropdownsub' + itemName.replace(/\s+/g, '');
        let item = document.getElementById(id) || document.createElement('div');
        item.classList.add('dropdown-item-sub');
        item.classList.add('hidden');
        item.classList.add(parentdrpdwnitem.id.replace('dropdown', ''));
        item.style.transform = "translateX(20px)";
        item.style.color = "grey";
        item.id = id;
        item.innerHTML = "&#9656  " + itemName;
        parentdrpdwnitem.appendChild(item);
        return item;
    }
}
Dropdown.activeDropdown = null;
