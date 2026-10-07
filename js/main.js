/* ========================================
   MELANIN CODED
   Main JavaScript
======================================== */

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = primaryNav.classList.toggle("open");
        menuToggle.classList.toggle("active", isOpen);
        menuToggle.setAttribute("aria-expanded", isOpen);
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });
}
// ========================================
// FAQ — ACCORDION
// ========================================

const faqTriggers =
    document.querySelectorAll(".faq-trigger");

faqTriggers.forEach((trigger) => {

    trigger.addEventListener("click", () => {

        const answerId =
            trigger.getAttribute("aria-controls");

        const answer =
            document.getElementById(answerId);

        if (!answer) {
            return;
        }

        const isOpen =
            trigger.getAttribute("aria-expanded") ===
            "true";

        trigger.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

        answer.hidden = isOpen;

    });

});