export class Dropdown {
    static activeDropdown = null;  // Static property to track the active dropdown

    constructor(container, options = []) {
        this.container = container;
        this.options = options;
        this.dropdown = null;
        this.init();
    }

    init() {
        this.container.addEventListener('contextmenu', this.handleContextMenuClick.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    handleContextMenuClick(e) {
        e.preventDefault();  // Prevent the default context menu
        if (Dropdown.activeDropdown) {
            Dropdown.activeDropdown.removeDropdown();  // Remove any currently active dropdown
        }
        this.createDropdown(this.options);
        this.showDropdown(e);
        Dropdown.activeDropdown = this;  // Set this dropdown as the active one
    }

    showDropdown(e) {
        this.container.style.zIndex = "5";
        this.dropdown.style.opacity = 1;
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

    handleClickOutside(e) {
        // Check if the click is outside the active dropdown
        if (Dropdown.activeDropdown && !Dropdown.activeDropdown.dropdown.contains(e.target)) {
            Dropdown.activeDropdown.removeDropdown();
        }
    }

    createDropdown(options) {
        this.removeDropdown();  // Remove existing dropdown, if any
        let dropdown = document.createElement('div');
        dropdown.classList.add('dropdown-menu');
        this.container.appendChild(dropdown);
        this.dropdown = dropdown;

        options.forEach(option => {
            this.appendDropdownItem(option);
        });
    }

    appendDropdownItem(itemName) {
        let item = document.createElement('div');
        item.className = 'dropdown-item';
        item.id = "dropdown" + itemName.replace(/\s+/g, '');
        item.innerHTML = "&#9656  " + itemName;
        this.dropdown.appendChild(item);
    }

    appendSubDropdownItem(itemName, dropdownitem) {
        let id = 'dropdownsub' + itemName.replace(/\s+/g, '');
        let item = document.getElementById(id) || document.createElement('div');
        item.className = 'dropdown-item-sub';
        item.style.transform = "translateX(20px)";
        item.style.color = "grey";
        item.id = id;
        item.innerHTML = "&#9656  " + itemName;
        dropdownitem.appendChild(item);
        return item;
    }
}
























// const dropdownState = new Map();
// addGlobalEventListener('contextmenu', 'button.tag,#canvasImage', e => {
//   e.stopPropagation(); 
//   // Hide all dropdowns except for the target
//   let allDropdowns = document.querySelectorAll('.dropdown-menu');
//   allDropdowns.forEach(dropdown => {
//       dropdown.style.opacity = 0;
//       dropdown.style.transform = 'translateY(-10px)';
//       dropdown.style.pointerEvents = 'none';
//   });

//   // Now, show or hide the target dropdown
//   let dropdowns = e.target.querySelectorAll('.dropdown-menu');
//   dropdowns.forEach(dropdown => {
//     const currentState = dropdownState.get(dropdown) || false;

//     if (currentState) {
//         // If the dropdown is currently shown, hide it.
//         e.target.style.zIndex = "1";
//         dropdown.style.opacity = 0;
//         dropdown.style.transform = 'translateY(-10px)';
//         dropdown.style.pointerEvents = 'none';
//         // remove all sub-dropdowns
//         let subdropdowns = document.querySelectorAll('.dropdown-item-sub');
//         subdropdowns.forEach(subdropdown => {
//           subdropdown.remove();
//         });
//     } else {
//         // If the dropdown is currently hidden, show it.
//         e.target.style.zIndex = "5 ";
//         dropdown.style.opacity = 1;
//         dropdown.style.transform = 'translateY(0)';
//         dropdown.style.pointerEvents = 'auto';
//     }

//     // Update the state in our Map.
//     dropdownState.set(dropdown, !currentState);
// });
//   e.preventDefault();
//  // To prevent the default context menu from appearing
// });


// addGlobalEventListener('click', '.dropdown-item, .dropdown-item-sub', e => {
//   let tag = e.target.closest('.tag');
//   tag.style.zIndex = "3";

// })


// function createDropdown(tagElement){
//   // add dropdown menu
//   var dropdown = document.createElement('div');
//   dropdown.className = 'dropdown-menu';
//   tagElement.appendChild(dropdown);

//   appendDropdownItem('Select Element',dropdown)
//   appendDropdownItem('Select Input Flow',dropdown)
//   appendDropdownItem('Select Output Flow',dropdown)
//   appendDropdownItem('Unselect Element',dropdown)
//   appendDropdownItem('Unselect Input Flow',dropdown)
//   appendDropdownItem('Unselect Output Flow',dropdown)
//   appendDropdownItem('',dropdown)//This group are about selection and send further for focused display and inquire
  
//   // add new tag is double-click
//   appendDropdownItem('Reset System',dropdown)//Please do not hide, but only delete
//   appendDropdownItem('Add New Input Flow',dropdown)
//   appendDropdownItem('Add New Output Flow',dropdown)
//   appendDropdownItem('Delete Input Flow',dropdown)//Please do not hide, but only delete
//   appendDropdownItem('Delete Output Flow',dropdown)//Please do not hide, but only delete
//   appendDropdownItem('Delete Element',dropdown)//Please do not hide, but only delete
//   // appendDropdownItem('',dropdown)//This group are about add and delete

//   appendDropdownItem('Change Flow Style',dropdown)//Please do not hide, but only delete

//   let emptyItems=document.querySelectorAll("#dropdown")
//   emptyItems.forEach(emptyItem => emptyItem.style.visibility = "hidden")

// }


// function appendDropdownItem(itemName,dropdown){
//   let item = document.createElement('div');
//   item.className = 'dropdown-item';
//   item.id = "dropdown" + itemName.replace(/\s+/g, '');
//   item.innerHTML = "&#9656  "+itemName;
//   dropdown.appendChild(item);
// }

// function appendSubDropdownItem(itemName,dropdown){
//   if (document.getElementById('dropdownsub' + itemName.replace(/\s+/g, ''))){
//     let item = document.getElementById('dropdownsub' + itemName.replace(/\s+/g, ''));
//     return item}else{
//   let item = document.createElement('div');
//   item.className = 'dropdown-item-sub';
//   item.style.transform="translateX(20px)";
//   item.style.color="grey"
//   item.id = "dropdownsub" + itemName.replace(/\s+/g, '');
//   item.innerHTML = "&#9656  "+itemName;
//   dropdown.appendChild(item)
//   return item}
// }

// function clearSubDropdownItems() {
//   var subItems = document.querySelectorAll('.dropdown-item-sub');
//   subItems.forEach(item => {
//           item.remove();
//   });
// }

// function clearDropdownItems(){
//   var dropdowns = document.querySelectorAll('.dropdown-item');
//   dropdowns.forEach(item => {
//           item.remove();
//   });
// }

