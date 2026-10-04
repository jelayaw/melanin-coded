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


function cleanArray(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);

}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function displayValue(value) {

    return value
        ? escapeHtml(value)
        : "Not provided";

}


function displayList(values) {

    if (!values.length) {
        return "None selected";
    }

    return values
        .map((value) => escapeHtml(value))
        .join("<br>");

}


// ========================================
// NETLIFY PROJECT INQUIRY FUNCTION
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

        const body = JSON.parse(
            event.body || "{}"
        );


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
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: true,
                    message:
                        "Project inquiry sent successfully."
                })
            };

        }


        // ========================================
        // CLEAN INPUT — STEP 01
        // ========================================

        const projectType = cleanText(
            body.projectType
        );

        const projectDescription = cleanText(
            body.projectDescription
        );

        const currentWebsite = cleanText(
            body.currentWebsite
        );

        const currentWebsiteUrl = cleanText(
            body.currentWebsiteUrl
        );


        // ========================================
        // CLEAN INPUT — STEP 02
        // ========================================

        const pageCount = cleanText(
            body.pageCount
        );

        const features = cleanArray(
            body.features
        );

        const assetsReady = cleanArray(
            body.assetsReady
        );

        const projectRequirements = cleanText(
            body.projectRequirements
        );


        // ========================================
        // CLEAN INPUT — STEP 03
        // ========================================

        const budget = cleanText(
            body.budget
        );

        const timeline = cleanText(
            body.timeline
        );

        const launchDate = cleanText(
            body.launchDate
        );

        const paymentPreference = cleanText(
            body.paymentPreference
        );


        // ========================================
        // CLEAN INPUT — STEP 04
        // ========================================

        const clientName = cleanText(
            body.clientName
        );

        const clientEmail = cleanText(
            body.clientEmail
        );

        const businessName = cleanText(
            body.businessName
        );

        const clientPhone = cleanText(
            body.clientPhone
        );

        const preferredContact = cleanText(
            body.preferredContact
        );

        const referralSource = cleanText(
            body.referralSource
        );

        const clientNotes = cleanText(
            body.clientNotes
        );


        // ========================================
        // REQUIRED FIELDS
        // ========================================

        if (
            !projectType ||
            !projectDescription ||
            !currentWebsite ||
            !pageCount ||
            !budget ||
            !timeline ||
            !paymentPreference ||
            !clientName ||
            !clientEmail ||
            !preferredContact
        ) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message:
                        "Please complete all required fields."
                })
            };

        }


        // ========================================
        // CONDITIONAL REQUIREMENTS
        // ========================================

        if (
            timeline === "Specific Date" &&
            !launchDate
        ) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message:
                        "Please provide your ideal launch date."
                })
            };

        }


        if (
            (
                preferredContact === "Phone" ||
                preferredContact === "Text"
            ) &&
            !clientPhone
        ) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message:
                        "Please provide a phone number."
                })
            };

        }


        // ========================================
        // EMAIL VALIDATION
        // ========================================

        if (!isValidEmail(clientEmail)) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message:
                        "Please enter a valid email address."
                })
            };

        }


        // ========================================
        // LENGTH LIMITS
        // ========================================

        if (
            projectType.length > 100 ||
            projectDescription.length > 5000 ||
            currentWebsite.length > 100 ||
            currentWebsiteUrl.length > 1000 ||
            pageCount.length > 100 ||
            projectRequirements.length > 3000 ||
            budget.length > 100 ||
            timeline.length > 100 ||
            launchDate.length > 50 ||
            paymentPreference.length > 150 ||
            clientName.length > 100 ||
            clientEmail.length > 254 ||
            businessName.length > 150 ||
            clientPhone.length > 50 ||
            preferredContact.length > 50 ||
            referralSource.length > 150 ||
            clientNotes.length > 3000
        ) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message:
                        "One or more fields are too long."
                })
            };

        }


        if (
            features.length > 25 ||
            assetsReady.length > 25
        ) {

            return {
                statusCode: 400,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message:
                        "Too many selections were submitted."
                })
            };

        }


        // ========================================
        // SAFE EMAIL CONTENT
        // ========================================

        const safeClientName =
            displayValue(clientName);

        const safeClientEmail =
            displayValue(clientEmail);

        const safeBusinessName =
            displayValue(businessName);

        const safeClientPhone =
            displayValue(clientPhone);

        const safePreferredContact =
            displayValue(preferredContact);

        const safeReferralSource =
            displayValue(referralSource);

        const safeClientNotes =
            displayValue(clientNotes);

        const safeProjectType =
            displayValue(projectType);

        const safeProjectDescription =
            displayValue(projectDescription);

        const safeCurrentWebsite =
            displayValue(currentWebsite);

        const safeCurrentWebsiteUrl =
            displayValue(currentWebsiteUrl);

        const safePageCount =
            displayValue(pageCount);

        const safeFeatures =
            displayList(features);

        const safeAssetsReady =
            displayList(assetsReady);

        const safeProjectRequirements =
            displayValue(projectRequirements);

        const safeBudget =
            displayValue(budget);

        const safeTimeline =
            displayValue(timeline);

        const safeLaunchDate =
            displayValue(launchDate);

        const safePaymentPreference =
            displayValue(paymentPreference);


        // ========================================
        // SEND INQUIRY EMAIL
        // ========================================

        const { data, error } =
            await resend.emails.send({

                from:
                    "Melanin Coded <onboarding@resend.dev>",

                to: [
                    "jelayaw@gmail.com"
                ],

                replyTo: clientEmail,

                subject:
                    `New Project Inquiry — ${clientName}`,

                html: `
                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 700px;
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
                            margin: 0 0 8px;
                            font-size: 28px;
                        ">
                            New Project Inquiry
                        </h1>

                        <p style="
                            margin: 0 0 32px;
                            color: #725b54;
                        ">
                            A potential client submitted
                            the Start a Project form.
                        </p>


                        <h2 style="
                            margin-top: 32px;
                            padding-bottom: 10px;
                            border-bottom:
                                1px solid #ead8d0;
                            font-size: 20px;
                        ">
                            01 — Your Project
                        </h2>

                        <p>
                            <strong>Project Type:</strong><br>
                            ${safeProjectType}
                        </p>

                        <p>
                            <strong>
                                Project Overview:
                            </strong><br>
                            <span style="
                                white-space: pre-wrap;
                            ">${safeProjectDescription}</span>
                        </p>

                        <p>
                            <strong>
                                Current Website:
                            </strong><br>
                            ${safeCurrentWebsite}
                        </p>

                        <p>
                            <strong>
                                Current Website URL:
                            </strong><br>
                            ${safeCurrentWebsiteUrl}
                        </p>


                        <h2 style="
                            margin-top: 32px;
                            padding-bottom: 10px;
                            border-bottom:
                                1px solid #ead8d0;
                            font-size: 20px;
                        ">
                            02 — What They Need
                        </h2>

                        <p>
                            <strong>
                                Estimated Pages:
                            </strong><br>
                            ${safePageCount}
                        </p>

                        <p>
                            <strong>
                                Website Features:
                            </strong><br>
                            ${safeFeatures}
                        </p>

                        <p>
                            <strong>
                                Assets Ready:
                            </strong><br>
                            ${safeAssetsReady}
                        </p>

                        <p>
                            <strong>
                                Additional Requirements:
                            </strong><br>
                            <span style="
                                white-space: pre-wrap;
                            ">${safeProjectRequirements}</span>
                        </p>


                        <h2 style="
                            margin-top: 32px;
                            padding-bottom: 10px;
                            border-bottom:
                                1px solid #ead8d0;
                            font-size: 20px;
                        ">
                            03 — Budget &amp; Timing
                        </h2>

                        <p>
                            <strong>Budget:</strong><br>
                            ${safeBudget}
                        </p>

                        <p>
                            <strong>Timeline:</strong><br>
                            ${safeTimeline}
                        </p>

                        <p>
                            <strong>
                                Ideal Launch Date:
                            </strong><br>
                            ${safeLaunchDate}
                        </p>

                        <p>
                            <strong>
                                Payment Preference:
                            </strong><br>
                            ${safePaymentPreference}
                        </p>


                        <h2 style="
                            margin-top: 32px;
                            padding-bottom: 10px;
                            border-bottom:
                                1px solid #ead8d0;
                            font-size: 20px;
                        ">
                            04 — About the Client
                        </h2>

                        <p>
                            <strong>Name:</strong><br>
                            ${safeClientName}
                        </p>

                        <p>
                            <strong>Email:</strong><br>
                            ${safeClientEmail}
                        </p>

                        <p>
                            <strong>
                                Business / Brand:
                            </strong><br>
                            ${safeBusinessName}
                        </p>

                        <p>
                            <strong>Phone:</strong><br>
                            ${safeClientPhone}
                        </p>

                        <p>
                            <strong>
                                Preferred Contact:
                            </strong><br>
                            ${safePreferredContact}
                        </p>

                        <p>
                            <strong>
                                Referral Source:
                            </strong><br>
                            ${safeReferralSource}
                        </p>

                        <p>
                            <strong>
                                Additional Notes:
                            </strong><br>
                            <span style="
                                white-space: pre-wrap;
                            ">${safeClientNotes}</span>
                        </p>

                    </div>
                `
            });


        // ========================================
        // RESEND ERROR
        // ========================================

        if (error) {

            console.error(
                "Resend project inquiry error:",
                error
            );

            return {
                statusCode: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    success: false,
                    message:
                        "Unable to send project inquiry."
                })
            };

        }


        // ========================================
        // SUCCESS
        // ========================================

        console.log(
            "Project inquiry email sent:",
            data
        );

        return {
            statusCode: 200,

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                success: true,
                message:
                    "Project inquiry sent successfully."
            })
        };


    } catch (error) {

        console.error(
            "Project inquiry function error:",
            error
        );

        return {
            statusCode: 500,

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                success: false,
                message:
                    "Unable to send project inquiry."
            })
        };

    }

};