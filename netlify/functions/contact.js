const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);


// ========================================
// HELPERS
// ========================================

function cleanText(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}


function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================
// NETLIFY CONTACT FUNCTION
// ========================================

exports.handler = async (event) => {

    // Only allow POST requests
    if (event.httpMethod !== "POST") {

        return {
            statusCode: 405,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                success: false,
                message: "Method not allowed."
            })
        };

    }


    try {

        const body = JSON.parse(event.body || "{}");
// ========================================
// HONEYPOT SPAM CHECK
// ========================================

const companyWebsite = cleanText(
    body.companyWebsite
);

if (companyWebsite) {

    return {
        statusCode: 200,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            success: true,
            message: "Message sent successfully."
        })
    };

}

        // ========================================
        // CLEAN INPUT
        // ========================================

        const name = cleanText(body.name);
        const email = cleanText(body.email);
        const subject = cleanText(body.subject);
        const message = cleanText(body.message);


        // ========================================
        // REQUIRED FIELDS
        // ========================================

        if (!name || !email || !subject || !message) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message: "Please complete all required fields."
                })
            };

        }


        // ========================================
        // EMAIL VALIDATION
        // ========================================

        if (!isValidEmail(email)) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message: "Please enter a valid email address."
                })
            };

        }


        // ========================================
        // LENGTH LIMITS
        // ========================================

        if (
            name.length > 100 ||
            email.length > 254 ||
            subject.length > 150 ||
            message.length > 5000
        ) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message: "One or more fields are too long."
                })
            };

        }


        // ========================================
        // SAFE EMAIL CONTENT
        // ========================================

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message);


        // ========================================
        // SEND EMAIL
        // ========================================

        const { data, error } = await resend.emails.send({

            from: "Melanin Coded <onboarding@resend.dev>",

            to: ["jelayaw@gmail.com"],

            replyTo: email,

            subject:
                `New Melanin Coded Contact — ${subject}`,

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 620px;
                    margin: 0 auto;
                    padding: 32px;
                    color: #3b2723;
                ">

                    <p style="
                        margin: 0 0 8px;
                        font-size: 12px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        color: #b94f70;
                    ">
                        Melanin Coded
                    </p>

                    <h1 style="
                        margin: 0 0 32px;
                        font-size: 28px;
                    ">
                        New Contact Message
                    </h1>

                    <p>
                        <strong>From:</strong><br>
                        ${safeName}
                    </p>

                    <p>
                        <strong>Email:</strong><br>
                        ${safeEmail}
                    </p>

                    <p>
                        <strong>Subject:</strong><br>
                        ${safeSubject}
                    </p>

                    <div style="
                        margin-top: 28px;
                        padding-top: 24px;
                        border-top: 1px solid #ead8d0;
                    ">

                        <strong>Message</strong>

                        <p style="
                            line-height: 1.7;
                            white-space: pre-wrap;
                        ">${safeMessage}</p>

                    </div>

                </div>
            `
        });


        // ========================================
        // RESEND ERROR
        // ========================================

        if (error) {

            console.error(
                "Resend contact error:",
                error
            );

            return {
                statusCode: 500,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message: "Unable to send message."
                })
            };

        }


        // ========================================
        // SUCCESS
        // ========================================

        console.log(
            "Contact email sent:",
            data
        );

        return {
            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                success: true,
                message: "Message sent successfully."
            })
        };


    } catch (error) {

        console.error(
            "Contact function error:",
            error
        );

        return {
            statusCode: 500,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                success: false,
                message: "Unable to send message."
            })
        };

    }

};