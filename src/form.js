document
  .getElementById("feedbackForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Display thank you message
    if (document.body.classList.contains('halloween-mode')) {
      document.getElementById("thankYouMessage").textContent = "Thanks for your spooky feedback!";
    }
    
    // Add an animated effect to the thank you message for Halloween
    if (document.body.classList.contains('halloween-mode')) {
      document.getElementById("thankYouMessage").style.textShadow = "2px 2px 10px orange, 2px 2px 20px red";
    document.getElementById("thankYouMessage").style.display = "block";}

    // Optionally, you can handle the form data here, such as sending it to a server
    const comments = document.getElementById("comments").value;
    const contact = document.getElementById("contact").value;

    console.log("Feedback submitted:", { comments, contact });

    // Clear the form fields
    event.target.reset();

    // Delay for 2 seconds to let the user see the thank you message
    setTimeout(function () {
      // Redirect to index.html after 2 seconds
      window.location.href = "index.html";
    }, 2000);
    // Modify the thank you message for Halloween

}

  );
