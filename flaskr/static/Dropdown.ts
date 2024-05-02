export class Dropdown {
    static activeDropdown = null;  // Static property to track the active dropdown
    container: HTMLElement;
    dropdown: HTMLElement | null; //<div>dropdown</div>
    options: Map<string, string[]>; //<option, subOptions[]>
    dropdownItem: HTMLElement[]; //<div class="dropdown-item">dropdown-item</div>
    enabled: boolean;

    constructor(container: HTMLElement, options = new Map<string, string[]>()) {
        this.container = container;
        this.options = options;
        this.dropdown = null;
        this.dropdownItem = [];
        this.enabled = false;
        this.init();
    }

    init() {
        this.container.addEventListener('contextmenu', this.handleContextMenuClick.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    handleContextMenuClick(e) {
        e.preventDefault();  // Prevent the default context menu
        if (!this.enabled) return;
        console.log(this.enabled);
        if (Dropdown.activeDropdown) {
            Dropdown.activeDropdown.removeDropdown();  // Remove any currently active dropdown
        }
        this.createDropdown(this.options);
        this.showDropdown();
        Dropdown.activeDropdown = this;  // Set this dropdown as the active one
    }

    handleClickOutside(e) {
        // Check if the click is outside the active dropdown
        if (Dropdown.activeDropdown && !Dropdown.activeDropdown.dropdown.contains(e.target)) {
            console.log('click outside');
            Dropdown.activeDropdown.removeDropdown();
        }
    }


    showDropdown() {
        this.container.style.zIndex = "5";
        this.dropdown.style.opacity = "1";
        this.dropdown.style.transform = 'translateY(0)';
        this.dropdown.style.pointerEvents = 'auto';
    }

    removeDropdown() {
        if (this.dropdown) {
            this.dropdown.remove();
            this.dropdown = null;
            if (Dropdown.activeDropdown === this) {
                Dropdown.activeDropdown = null;  // Reset the active dropdown
            }
        }
    }

    createDropdown(options: Map<string, string[]>):void {
        this.removeDropdown();  // Remove existing dropdown, if any

        let dropdown = document.createElement('div');
        dropdown.classList.add('dropdown-menu');
        this.container.appendChild(dropdown);
        this.dropdown = dropdown;

        // loop through the map of options
        // for each key, create a dropdown item
        // if the key has sub-options, create sub-dropdown items
        for (let [option, subOptions] of options) {
            let dropdownItem = this.appendDropdownItem(option);
            if (subOptions) {
                subOptions.forEach(subOption => {
                    this.appendSubDropdownItem(subOption, dropdownItem);
                });
            }
        }
    }

    private appendDropdownItem(itemName: string):HTMLElement {
        let item = document.createElement('div');
        item.className = 'dropdown-item';
        item.id = "dropdown" + itemName.replace(/\s+/g, '');
        item.innerHTML = "&#9656  " + itemName;
        this.dropdown.appendChild(item);
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                let subItems = item.querySelectorAll('.dropdown-item-sub');
                for (let i = 0; i < subItems.length; i++) {
                    if (subItems[i].classList.contains('hidden')) {
                        subItems[i].classList.remove('hidden');
                    } else {
                        subItems[i].classList.add('hidden');
                    }
                }
            }
        });
        return item;
    }

    private appendSubDropdownItem(itemName:string, dropdownitem: HTMLElement):HTMLElement {
        let id = 'dropdownsub' + itemName.replace(/\s+/g, '');
        let item = document.getElementById(id) || document.createElement('div');
        item.classList.add('dropdown-item-sub');
        item.classList.add('hidden')
        //add a class to associate the parent dropdown item
        item.classList.add(dropdownitem.id.replace('dropdown', ''));
        item.style.transform = "translateX(20px)";
        item.style.color = "grey";
        item.id = id;
        item.innerHTML = "&#9656  " + itemName;
        dropdownitem.appendChild(item);
        return item;
    }


    enable() {
        this.enabled = true;
    }

    disable() {
        // Remove the dropdown if it is currently active
        if (Dropdown.activeDropdown === this) {
            this.removeDropdown();
        }
        this.enabled = false;
    }
}

