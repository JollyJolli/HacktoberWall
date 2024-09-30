document.getElementById("feedbackForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Display thank you message
    document.getElementById("thankYouMessage").style.display = "block";

    // Optionally, you can handle the form data here, such as sending it to a server
    const comments = document.getElementById("comments").value;
    const contact = document.getElementById("contact").value;

    console.log("Feedback submitted:", { comments, contact });

    // Clear the form fields
    document.getElementById("feedbackForm").reset();
});
