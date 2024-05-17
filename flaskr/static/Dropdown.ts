export class Dropdown {
    static activeDropdown: Dropdown | null = null;  // Static property to track the active dropdown
    
    container: HTMLElement;
    dropdown: HTMLElement | null; //<div>dropdown</div>
    options: Map<string, string[]>; //<option, subOptions[]>
    dropdownItems: HTMLElement[]; //<div class="dropdown-item">dropdown-item</div>

    constructor(container: HTMLElement, options = new Map<string, string[]>()) {
        this.container = container;
        this.options = options;
        this.dropdown = null;
        this.dropdownItems = [];
        this.init();
    }

    init() {
        this.createDropdown();
        // document.addEventListener('contextmenu', this.handleClickOutside.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }


    handleClickOutside(e: MouseEvent) {
        if (Dropdown.activeDropdown && !Dropdown.activeDropdown.dropdown.contains(e.target as HTMLElement)) {
            Dropdown.activeDropdown.remove();
        }
    }

    createDropdown(): void {
        if (Dropdown.activeDropdown) {
            Dropdown.activeDropdown.remove();  // Remove any currently active dropdown
        }

        let dropdownHTML = document.createElement('div');
        dropdownHTML.classList.add('dropdown-menu');
        this.container.style.zIndex = "5";
        this.container.appendChild(dropdownHTML);
        this.dropdown = dropdownHTML;

        // loop through the map of options
        // for each key, create a dropdown item
        // if the key has sub-options, create sub-dropdown items
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
            this.container.style.zIndex = "0";
            this.dropdown.remove();
            this.dropdown = null;
            if (Dropdown.activeDropdown === this) {
                Dropdown.activeDropdown = null;  // Reset the active dropdown
            }
        }
        //remove event listeners
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
            //console.log(subItems);
            for (let i = 0; i < subItems.length; i++) {
                if (subItems[i].classList.contains('hidden')) {
                    subItems[i].classList.remove('hidden');
                } else {
                    subItems[i].classList.add('hidden');
                }
            }
        }
    }


    private appendDropdownItem(itemName: string): HTMLElement {
        let item = document.createElement('div');
        item.className = 'dropdown-item';
        item.id = "dropdown" + itemName.replace(/\s+/g, '');
        item.innerHTML = "&#9656  " + itemName;
        this.dropdown.appendChild(item);
        this.dropdownItems.push(item);
        return item as HTMLElement;
    }

    private appendSubDropdownItem(itemName: string, parentdrpdwnitem: HTMLElement): HTMLElement {
        let id = 'dropdownsub' + itemName.replace(/\s+/g, '');
        let item = document.getElementById(id) || document.createElement('div');
        item.classList.add('dropdown-item-sub');
        item.classList.add('hidden')
        //add a class to associate the parent dropdown item
        item.classList.add(parentdrpdwnitem.id.replace('dropdown', ''));
        item.style.transform = "translateX(20px)";
        item.style.color = "grey";
        item.id = id;
        item.innerHTML = "&#9656  " + itemName;
        parentdrpdwnitem.appendChild(item);
        return item as HTMLElement;
    }


}

