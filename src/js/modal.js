class HacktoberfestModal {
  constructor() {
    this.modalShown = false; // Use boolean instead of !1
    this.init();
  }

  init() {
    const lastShown = localStorage.getItem("hacktoberfestModalLastShown");
    const today = new Date().toDateString();
    if (!lastShown || lastShown !== today) {
      this.createModal();
      this.showModal();
      localStorage.setItem("hacktoberfestModalLastShown", today);
    }
  }

  createModal() {
    const modalHTML = `
      <div class="hacktoberfest-modal-container" id="hacktoberfestModal">
        <div class="hacktoberfest-modal">
          <img src="img/Pumpkin.webp" alt="Halloween Pumpkin" class="modal-pumpkin">
          <button class="hacktoberfest-modal-close">×</button>
          <div class="hacktoberfest-modal-header">
            <h2 class="hacktoberfest-modal-title">HACKTOBERFEST IS ALMOST ENDING 🎃</h2>
          </div>
          <div class="hacktoberfest-modal-body">
            <p>Thank you for your participation this year! It was an amazing experience and we hope to be here again next year!</p>
          </div>
          <div class="hacktoberfest-modal-footer">
            <button class="hacktoberfest-close-button">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listener for the "X" button
    const closeButtonX = document.querySelector(".hacktoberfest-modal-close");
    closeButtonX.addEventListener("click", () => this.hideModal());

    // Add event listener for the "Close" button
    const closeButton = document.querySelector(".hacktoberfest-close-button");
    closeButton.addEventListener("click", () => this.hideModal());

    // Add event listener for the modal container
    document
      .getElementById("hacktoberfestModal")
      .addEventListener("click", (e) => {
        if (e.target.className === "hacktoberfest-modal-container") {
          this.hideModal();
        }
      });
  }

  showModal() {
    const modal = document.getElementById("hacktoberfestModal");
    if (modal) {
      modal.classList.add("show");
      this.modalShown = true;
    }
  }

  hideModal() {
    const modal = document.getElementById("hacktoberfestModal");
    if (modal) {
      modal.classList.remove("show");
      this.modalShown = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new HacktoberfestModal();
});
