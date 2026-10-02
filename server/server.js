require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ========================================
// STATIC WEBSITE
// ========================================

app.use(
    express.static(
        path.join(__dirname, "..")
    )
);


// ========================================
// CONTACT ROUTE
// ========================================

app.post("/api/contact", async (req, res) => {

    const {
        name,
        email,
        subject,
        message
    } = req.body;


    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (!name || !email || !subject || !message) {

        return res.status(400).json({
            success: false,
            message: "Please complete all required fields."
        });

    }


    try {

        const { data, error } = await resend.emails.send({

            from: "Melanin Coded <onboarding@resend.dev>",

            to: ["jelayaw@gmail.com"],

            replyTo: email,

            subject: `New Melanin Coded Contact — ${subject}`,

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
                        ${name}
                    </p>

                    <p>
                        <strong>Email:</strong><br>
                        ${email}
                    </p>

                    <p>
                        <strong>Subject:</strong><br>
                        ${subject}
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
                        ">${message}</p>

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

            return res.status(500).json({
                success: false,
                message: "Unable to send message."
            });

        }


        // ========================================
        // SUCCESS
        // ========================================

        console.log(
            "Contact email sent:",
            data
        );

        return res.json({
            success: true,
            message: "Message sent successfully."
        });


    } catch (error) {

        console.error(
            "Contact route error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to send message."
        });

    }

});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `💻 Melanin Coded server is running on port ${PORT}`
    );

});