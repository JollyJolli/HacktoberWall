// modal.js
class HacktoberfestModal {
  constructor() {
    this.modalShown = false;
    this.init();
  }

  init() {
    // Check if modal was shown today
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
                  <button class="hacktoberfest-modal-close" onclick="hacktoberfestModal.hideModal()">×</button>
                  <div class="hacktoberfest-modal-header">
                      <h2 class="hacktoberfest-modal-title">HACKTOBERFEST IS ALMOST ENDING 🎃</h2>
                  </div>
                  <div class="hacktoberfest-modal-body">
                      <p>Thank you for your participation this year! It was an amazing experience and we hope to be here again next year!</p>
                  </div>
                  <div class="hacktoberfest-modal-footer">
                      <button class="hacktoberfest-close-button" onclick="hacktoberfestModal.hideModal()">Close</button>
                  </div>
              </div>
          </div>
      `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add click event to close modal when clicking outside
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

// Initialize modal
document.addEventListener("DOMContentLoaded", () => {
  const hacktoberfestModal = new HacktoberfestModal();
});
