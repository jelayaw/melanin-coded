
const contactForm = document.getElementById("contact-form");
const contactFormStatus = document.getElementById("contact-form-status");


if (contactForm) {

    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();
        console.log("Contact form submitted");
        const submitButton =
            contactForm.querySelector(".contact-submit");

        const formData = new FormData(contactForm);

       const contactData = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    companyWebsite: formData.get("companyWebsite")
};


        // ========================================
        // SENDING STATE
        // ========================================

        submitButton.disabled = true;

        contactFormStatus.textContent =
            "Sending your message...";


        try {

const response = await fetch("/.netlify/functions/contact", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(contactData)
            });


            const result = await response.json();


            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to send message."
                );
            }


            // ========================================
            // SUCCESS
            // ========================================

            contactFormStatus.textContent =
                "Message received ✓ Thanks for reaching out.";

            contactForm.reset();


        } catch (error) {

            console.error(
                "Contact form error:",
                error
            );


            // ========================================
            // ERROR
            // ========================================

            contactFormStatus.textContent =
                "Something went wrong. Please try again or email me directly at jelayaw@gmail.com.";

        } finally {

            submitButton.disabled = false;

        }

    });

}