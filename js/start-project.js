console.log("Start Project JS loaded");


// ========================================
// PROJECT INTAKE — ELEMENTS
// ========================================

const projectForm = document.getElementById(
    "project-intake-form"
);

const projectSteps = document.querySelectorAll(
    ".project-form-step"
);

const desktopProgressItems = document.querySelectorAll(
    ".project-progress-item"
);

const mobileProgressLabel = document.querySelector(
    ".project-progress-mobile-label"
);

const mobileProgressBar = document.querySelector(
    ".project-progress-mobile-bar span"
);


// ========================================
// PROJECT INTAKE — STATE
// ========================================

let editingFromReview = false;
let editingStepNumber = null;

// ========================================
// STEP VALIDATION
// ========================================

function validateProjectStep(stepNumber) {

    const step = document.querySelector(
        `[data-step="${stepNumber}"]`
    );

    if (!step) {
        return false;
    }

    const requiredFields = step.querySelectorAll(
        "[required]"
    );

    for (const field of requiredFields) {

        if (!field.checkValidity()) {

            field.reportValidity();

            if (
                field.type === "radio" ||
                field.type === "checkbox"
            ) {

                const group = field.closest(
                    ".project-field-group"
                );

                group?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            } else {

                field.focus();

            }

            return false;
        }

    }

    return true;

}

// ========================================
// SHOW PROJECT STEP
// ========================================

function showProjectStep(stepNumber) {

    projectSteps.forEach((step) => {

        const stepValue = Number(
            step.dataset.step
        );

        if (stepValue === stepNumber) {

            step.hidden = false;
            step.classList.add("active");

        } else {

            step.hidden = true;
            step.classList.remove("active");

        }

    });


    // Desktop progress
    desktopProgressItems.forEach(
        (item, index) => {

            item.classList.toggle(
                "active",
                index === stepNumber - 1
            );

        }
    );


    // Mobile progress label
    if (mobileProgressLabel) {

    if (stepNumber === 5) {

        mobileProgressLabel.textContent =
            "Review Inquiry";

    } else if (stepNumber === 6) {

        mobileProgressLabel.textContent =
            "Inquiry Received";

    } else {

        mobileProgressLabel.textContent =
            `Step ${stepNumber} of 4`;

    }

}

    // Mobile progress bar
   if (mobileProgressBar) {

    mobileProgressBar.style.width =
        stepNumber >= 5
            ? "100%"
            : `${stepNumber * 25}%`;

}

}


// ========================================
// STEP 01 → STEP 02
// ========================================

const stepOneNextButton = document.querySelector(
    '[data-step="1"] .project-next-button'
);

if (stepOneNextButton) {

    stepOneNextButton.addEventListener(
        "click",
        () => {

            if (!validateProjectStep(1)) {
                return;
            }

            if (
                editingFromReview &&
                editingStepNumber === 1
            ) {

                returnToReview();
                return;

            }

            showProjectStep(2);

        }
    );

}


// ========================================
// STEP 02 → STEP 01
// ========================================

const stepTwoBackButton = document.querySelector(
    '[data-step="2"] .project-back-button'
);

if (stepTwoBackButton) {

    stepTwoBackButton.addEventListener(
        "click",
        () => {

            showProjectStep(1);

        }
    );

}


// ========================================
// STEP 02 → STEP 03
// ========================================

const stepTwoNextButton = document.querySelector(
    '[data-step="2"] .project-next-button'
);

if (stepTwoNextButton) {

    stepTwoNextButton.addEventListener(
        "click",
        () => {

            if (!validateProjectStep(2)) {
                return;
            }

            if (
                editingFromReview &&
                editingStepNumber === 2
            ) {

                returnToReview();
                return;

            }

            showProjectStep(3);

        }
    );

}


// ========================================
// STEP 03 → STEP 02
// ========================================

const stepThreeBackButton = document.querySelector(
    '[data-step="3"] .project-back-button'
);

if (stepThreeBackButton) {

    stepThreeBackButton.addEventListener(
        "click",
        () => {

            showProjectStep(2);

        }
    );

}


// ========================================
// STEP 03 → STEP 04
// ========================================

const stepThreeNextButton = document.querySelector(
    '[data-step="3"] .project-next-button'
);

if (stepThreeNextButton) {

    stepThreeNextButton.addEventListener(
        "click",
        () => {

            if (!validateProjectStep(3)) {
                return;
            }

            if (
                editingFromReview &&
                editingStepNumber === 3
            ) {

                returnToReview();
                return;

            }

            showProjectStep(4);

        }
    );

}


// ========================================
// STEP 04 → STEP 03
// ========================================

const stepFourBackButton = document.querySelector(
    '[data-step="4"] .project-back-button'
);

if (stepFourBackButton) {

    stepFourBackButton.addEventListener(
        "click",
        () => {

            showProjectStep(3);

        }
    );

}


// ========================================
// STEP 04 → REVIEW
// ========================================

const stepFourNextButton = document.querySelector(
    '[data-step="4"] .project-next-button'
);

if (stepFourNextButton) {

    stepFourNextButton.addEventListener(
        "click",
        () => {

            if (!validateProjectStep(4)) {
                return;
            }

            if (
                editingFromReview &&
                editingStepNumber === 4
            ) {

                returnToReview();
                return;

            }

            populateProjectReview();
            showProjectStep(5);

        }
    );

}


// ========================================
// REVIEW → STEP 04
// ========================================

const reviewBackButton = document.querySelector(
    '[data-step="5"] .project-back-button'
);

if (reviewBackButton) {

    reviewBackButton.addEventListener(
        "click",
        () => {

            resetReviewEditState();
            showProjectStep(4);

        }
    );

}


// ========================================
// CURRENT WEBSITE URL
// ========================================

const currentWebsiteChoices =
    document.querySelectorAll(
        'input[name="currentWebsite"]'
    );

const websiteUrlGroup =
    document.getElementById(
        "project-website-url-group"
    );

currentWebsiteChoices.forEach((choice) => {

    choice.addEventListener(
        "change",
        () => {

            if (!websiteUrlGroup) {
                return;
            }

            const shouldShowUrl =
                choice.value === "Yes" ||
                choice.value ===
                    "Needs Replacement";

            websiteUrlGroup.hidden =
                !shouldShowUrl;

        }
    );

});


// ========================================
// SPECIFIC LAUNCH DATE
// ========================================

const timelineChoices =
    document.querySelectorAll(
        'input[name="timeline"]'
    );

const launchDateGroup =
    document.getElementById(
        "project-launch-date-group"
    );

    const launchDateInput =
    document.getElementById(
        "project-launch-date"
    );

timelineChoices.forEach((choice) => {

    choice.addEventListener(
        "change",
        () => {

            if (!launchDateGroup) {
                return;
            }

            launchDateGroup.hidden =
                choice.value !==
                "Specific Date";

                if (launchDateInput) {

    launchDateInput.required =
        choice.value ===
        "Specific Date";

}

        }
    );

});

// ========================================
// PREFERRED CONTACT — PHONE REQUIREMENT
// ========================================

const preferredContactChoices =
    document.querySelectorAll(
        'input[name="preferredContact"]'
    );

const clientPhone =
    document.getElementById(
        "client-phone"
    );

preferredContactChoices.forEach((choice) => {

    choice.addEventListener(
        "change",
        () => {

            if (!clientPhone) {
                return;
            }

            const phoneRequired =
                choice.value === "Phone" ||
                choice.value === "Text";

            clientPhone.required =
                phoneRequired;

        }
    );

});

// ========================================
// REVIEW — HELPERS
// ========================================

function createReviewItem(
    label,
    value
) {

    const item =
        document.createElement("div");

    item.className =
        "project-review-item";


    const itemLabel =
        document.createElement("span");

    itemLabel.className =
        "project-review-label";

    itemLabel.textContent = label;


    const itemValue =
        document.createElement("p");

    itemValue.className =
        "project-review-value";

    itemValue.textContent =
        value || "Not provided";


    item.append(
        itemLabel,
        itemValue
    );

    return item;

}


function getCheckedValue(name) {

    const selected =
        document.querySelector(
            `input[name="${name}"]:checked`
        );

    return selected
        ? selected.value
        : "Not provided";

}


function getCheckedValues(name) {

    const selected =
        document.querySelectorAll(
            `input[name="${name}"]:checked`
        );

    if (selected.length === 0) {

        return "None selected";

    }

    return Array.from(selected)
        .map((input) => input.value)
        .join(", ");

}


function getFieldValue(id) {

    const field =
        document.getElementById(id);

    if (
        !field ||
        !field.value.trim()
    ) {

        return "Not provided";

    }

    return field.value.trim();

}


// ========================================
// REVIEW — POPULATE SUMMARY
// ========================================

function populateProjectReview() {

    const projectReview =
        document.getElementById(
            "review-project"
        );

    const needsReview =
        document.getElementById(
            "review-needs"
        );

    const budgetReview =
        document.getElementById(
            "review-budget"
        );

    const clientReview =
        document.getElementById(
            "review-client"
        );


    // ------------------------------------
    // 01 — YOUR PROJECT
    // ------------------------------------

    if (projectReview) {

        projectReview.replaceChildren(

            createReviewItem(
                "Project Type",
                getCheckedValue(
                    "projectType"
                )
            ),

            createReviewItem(
                "Project Overview",
                getFieldValue(
                    "project-description"
                )
            ),

            createReviewItem(
                "Current Website",
                getCheckedValue(
                    "currentWebsite"
                )
            ),

            createReviewItem(
                "Website URL",
                getFieldValue(
                    "current-website-url"
                )
            )

        );

    }


    // ------------------------------------
    // 02 — WHAT YOU NEED
    // ------------------------------------

    if (needsReview) {

        needsReview.replaceChildren(

            createReviewItem(
                "Estimated Pages",
                getCheckedValue(
                    "pageCount"
                )
            ),

            createReviewItem(
                "Website Features",
                getCheckedValues(
                    "features"
                )
            ),

            createReviewItem(
                "Assets Ready",
                getCheckedValues(
                    "assetsReady"
                )
            ),

            createReviewItem(
                "Additional Requirements",
                getFieldValue(
                    "project-requirements"
                )
            )

        );

    }


    // ------------------------------------
    // 03 — BUDGET & TIMING
    // ------------------------------------

    if (budgetReview) {

        budgetReview.replaceChildren(

            createReviewItem(
                "Budget",
                getCheckedValue(
                    "budget"
                )
            ),

            createReviewItem(
                "Timeline",
                getCheckedValue(
                    "timeline"
                )
            ),

            createReviewItem(
                "Ideal Launch Date",
                getFieldValue(
                    "project-launch-date"
                )
            ),

            createReviewItem(
                "Payment Preference",
                getCheckedValue(
                    "paymentPreference"
                )
            )

        );

    }


    // ------------------------------------
    // 04 — ABOUT YOU
    // ------------------------------------

    if (clientReview) {

        clientReview.replaceChildren(

            createReviewItem(
                "Name",
                getFieldValue(
                    "client-name"
                )
            ),

            createReviewItem(
                "Email",
                getFieldValue(
                    "client-email"
                )
            ),

            createReviewItem(
                "Business / Brand",
                getFieldValue(
                    "business-name"
                )
            ),

            createReviewItem(
                "Phone",
                getFieldValue(
                    "client-phone"
                )
            ),

            createReviewItem(
                "Preferred Contact",
                getCheckedValue(
                    "preferredContact"
                )
            ),

            createReviewItem(
                "How You Found Melanin Coded",
                getFieldValue(
                    "referral-source"
                )
            ),

            createReviewItem(
                "Additional Notes",
                getFieldValue(
                    "client-notes"
                )
            )

        );

    }

}


// ========================================
// REVIEW — EDIT BUTTONS
// ========================================

const reviewEditButtons =
    document.querySelectorAll(
        ".project-review-edit"
    );

reviewEditButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            const stepNumber = Number(
                button.dataset.editStep
            );

            editingFromReview = true;
            editingStepNumber = stepNumber;

            updateEditedStepButton(
                stepNumber,
                true
            );

            showProjectStep(stepNumber);

        }
    );

});


// ========================================
// REVIEW — EDIT BUTTON LABEL
// ========================================

function updateEditedStepButton(
    stepNumber,
    isEditing
) {

    const step =
        document.querySelector(
            `[data-step="${stepNumber}"]`
        );

    const nextButton =
        step?.querySelector(
            ".project-next-button"
        );

    if (!nextButton) {
        return;
    }


    if (isEditing) {

        nextButton.innerHTML = `
            Return to Review
            <span aria-hidden="true">→</span>
        `;

        return;

    }


    if (stepNumber === 4) {

        nextButton.innerHTML = `
            Review Inquiry
            <span aria-hidden="true">→</span>
        `;

    } else {

        nextButton.innerHTML = `
            Continue
            <span aria-hidden="true">→</span>
        `;

    }

}


// ========================================
// RETURN TO REVIEW AFTER EDIT
// ========================================

function returnToReview() {

    const previousEditedStep =
        editingStepNumber;

    populateProjectReview();

    editingFromReview = false;
    editingStepNumber = null;

    if (previousEditedStep) {

        updateEditedStepButton(
            previousEditedStep,
            false
        );

    }

    showProjectStep(5);

}


// ========================================
// RESET REVIEW EDIT STATE
// ========================================

function resetReviewEditState() {

    if (editingStepNumber) {

        updateEditedStepButton(
            editingStepNumber,
            false
        );

    }

    editingFromReview = false;
    editingStepNumber = null;

}


// ========================================
// PROJECT INQUIRY — SUBMISSION
// ========================================

if (projectForm) {

    projectForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // Final validation safeguard
            for (let stepNumber = 1; stepNumber <= 4; stepNumber++) {

                if (!validateProjectStep(stepNumber)) {

                    showProjectStep(stepNumber);
                    return;

                }

            }


            const submitButton =
                projectForm.querySelector(
                    ".project-submit-button"
                );

            const originalButtonContent =
                submitButton?.innerHTML;


            // ========================================
            // BUILD INQUIRY DATA
            // ========================================

            const inquiryData = {

                companyWebsite:
                    getFieldValue("company-website") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("company-website"),

                projectType:
                    getCheckedValue("projectType"),

                projectDescription:
                    getFieldValue("project-description"),

                currentWebsite:
                    getCheckedValue("currentWebsite"),

                currentWebsiteUrl:
                    getFieldValue("current-website-url") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("current-website-url"),

                pageCount:
                    getCheckedValue("pageCount"),

                features:
                    Array.from(
                        document.querySelectorAll(
                            'input[name="features"]:checked'
                        )
                    ).map((input) => input.value),

                assetsReady:
                    Array.from(
                        document.querySelectorAll(
                            'input[name="assetsReady"]:checked'
                        )
                    ).map((input) => input.value),

                projectRequirements:
                    getFieldValue("project-requirements") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("project-requirements"),

                budget:
                    getCheckedValue("budget"),

                timeline:
                    getCheckedValue("timeline"),

                launchDate:
                    getFieldValue("project-launch-date") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("project-launch-date"),

                paymentPreference:
                    getCheckedValue("paymentPreference"),

                clientName:
                    getFieldValue("client-name"),

                clientEmail:
                    getFieldValue("client-email"),

                businessName:
                    getFieldValue("business-name") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("business-name"),

                clientPhone:
                    getFieldValue("client-phone") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("client-phone"),

                preferredContact:
                    getCheckedValue("preferredContact"),

                referralSource:
                    getFieldValue("referral-source") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("referral-source"),

                clientNotes:
                    getFieldValue("client-notes") ===
                    "Not provided"
                        ? ""
                        : getFieldValue("client-notes")

            };


            // ========================================
            // SUBMIT INQUIRY
            // ========================================

            try {

                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "Sending Inquiry...";

                }


                const response = await fetch(
                    "/.netlify/functions/project-inquiry",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(
                            inquiryData
                        )
                    }
                );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to send project inquiry."
                    );

                }


                    // ========================================
// SUCCESS
// ========================================

console.log(
    "Project inquiry sent successfully."
);

resetReviewEditState();

projectForm.reset();

if (websiteUrlGroup) {
    websiteUrlGroup.hidden = true;
}

if (launchDateGroup) {
    launchDateGroup.hidden = true;
}

if (launchDateInput) {
    launchDateInput.required = false;
}

if (clientPhone) {
    clientPhone.required = false;
}

showProjectStep(6);

window.scrollTo({
    top: 0,
    behavior: "smooth"
});
            } catch (error) {

                console.error(
                    "Project inquiry submission error:",
                    error
                );

                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.innerHTML =
                        originalButtonContent;

                }

                window.alert(
                    "Your inquiry could not be sent. " +
                    "Please try again."
                );

            }

        }
    );

}