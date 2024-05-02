export class FuncBar {
    constructor(container) {
        this.container = container;
        this.toggles = this.container.querySelectorAll(".toggle");
        this.activeToggle = this.container.querySelector(".active"); // Tracks the currently active toggle
        this.attachEventListeners();
        this.initiateDefaultToggle();
    }

    attachEventListeners() {
        this.toggles.forEach(toggle => {
            toggle.addEventListener('click', (event) => {
                event.stopPropagation();
                this.handleToggleClick(toggle);
            },false);
        });
    }

    handleToggleClick(toggle) {
        if (this.activeToggle) {
            this.activeToggle?.classList?.remove("active");
            this.activeToggle?.classList?.add("inactive");
            this.deactivateFunction(this.activeToggle.id);
        }
        toggle.classList?.remove("inactive");
        toggle.classList?.add("active");
        this.activateFunction(toggle.id);
        this.activeToggle = toggle;
    }

    activateFunction(id) {
        console.log(`Activated ${id}`);
    }

    deactivateFunction(id) {
        console.log(`Deactivated ${id}`);
    }

    initiateDefaultToggle() {
        document.addEventListener('DOMContentLoaded', () => {
            if (this.activeToggle) {
                this.activeToggle.click();
            }
        });
    }
}
