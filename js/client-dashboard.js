/* =========================================================
   CLIENT DASHBOARD — MOBILE NAVIGATION
   ========================================================= */

const clientSidebar = document.getElementById("client-sidebar");
const clientMenuToggle = document.getElementById("client-menu-toggle");
const clientMenuClose = document.getElementById("client-menu-close");
const clientSidebarOverlay = document.getElementById("client-sidebar-overlay");
const clientMain = document.querySelector(".client-main");

const clientMobileQuery = window.matchMedia("(max-width: 768px)");

function closeClientMenu() {
    clientSidebar.classList.remove("is-open");

    clientMenuToggle.setAttribute("aria-expanded", "false");
    clientMenuToggle.setAttribute("aria-label", "Open client navigation");

    clientSidebarOverlay.hidden = true;
    document.body.style.overflow = "";

    clientMain.inert = false;

    if (clientMobileQuery.matches) {
        clientSidebar.inert = true;
    }
}

function openClientMenu() {
    clientSidebar.inert = false;
    clientSidebar.classList.add("is-open");

    clientMenuToggle.setAttribute("aria-expanded", "true");
    clientMenuToggle.setAttribute("aria-label", "Close client navigation");

    clientSidebarOverlay.hidden = false;
    document.body.style.overflow = "hidden";

    clientMain.inert = true;
    clientMenuClose.focus();
}

function syncClientMenu() {
    const isMobile = clientMobileQuery.matches;

    clientMenuToggle.hidden = !isMobile;
    clientMenuClose.hidden = !isMobile;

    if (isMobile) {
        closeClientMenu();
    } else {
        clientSidebar.inert = false;
        clientMain.inert = false;
        clientSidebar.classList.remove("is-open");
        clientSidebarOverlay.hidden = true;
        document.body.style.overflow = "";
    }
}

clientMenuToggle.addEventListener("click", () => {
    if (clientSidebar.classList.contains("is-open")) {
        closeClientMenu();
        clientMenuToggle.focus();
    } else {
        openClientMenu();
    }
});

clientMenuClose.addEventListener("click", () => {
    closeClientMenu();
    clientMenuToggle.focus();
});

clientSidebarOverlay.addEventListener("click", () => {
    closeClientMenu();
    clientMenuToggle.focus();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" &&
        clientSidebar.classList.contains("is-open")) {
        closeClientMenu();
        clientMenuToggle.focus();
    }
});

/* Keep keyboard focus inside the open mobile sidebar */
clientSidebar.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" ||
        !clientMobileQuery.matches ||
        !clientSidebar.classList.contains("is-open")) {
        return;
    }

    const focusableElements = Array.from(
        clientSidebar.querySelectorAll(
            'a[href], button:not([disabled]):not([hidden])'
        )
    ).filter((element) => element.getClientRects().length > 0);

    if (!focusableElements.length) {
        event.preventDefault();
        return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
});

document.addEventListener("focusin", (event) => {
    if (clientMobileQuery.matches &&
        clientSidebar.classList.contains("is-open") &&
        !clientSidebar.contains(event.target)) {
        clientMenuClose.focus();
    }
});

clientMobileQuery.addEventListener("change", syncClientMenu);
syncClientMenu();

/* =========================================================
   CLIENT DASHBOARD — AUTHENTICATION GUARD
   ========================================================= */

async function verifyClientAccess() {
    const page = document.body;

    page.dataset.authState = "checking";

    try {
        // Verify the current user with Supabase Auth.
        const { data, error: authError } =
            await window.mcSupabase.auth.getUser();

        if (authError || !data.user) {
            throw new Error("No authenticated user.");
        }

        // Look up the user's role using the protected profiles table.
        const { data: profile, error: profileError } =
            await window.mcSupabase
                .from("profiles")
                .select("full_name, role")
                .eq("id", data.user.id)
                .single();

        if (profileError || !profile || profile.role !== "client") {
            throw new Error("Client access required.");
        }

        // Only verified client accounts may view this dashboard.
        page.dataset.authState = "authorized";

        console.log("Client dashboard access verified.");

    } catch (error) {
        console.warn("Client dashboard access denied:", error.message);

        page.dataset.authState = "denied";

        window.location.replace("portal-login.html");
    }
}

verifyClientAccess();

/* =========================================================
   CLIENT DASHBOARD — SIGN OUT
   ========================================================= */

const clientSignoutButton =
    document.getElementById("client-signout-button");

clientSignoutButton.addEventListener("click", async () => {
    clientSignoutButton.disabled = true;
    clientSignoutButton.textContent = "Signing Out...";

    try {
        const { error } = await window.mcSupabase.auth.signOut();

        if (error) {
            throw error;
        }

        // Return to the portal login page.
        window.location.replace("portal-login.html");

    } catch (error) {
        console.error("Client sign out failed:", error.message);

        clientSignoutButton.disabled = false;
        clientSignoutButton.textContent = "Sign Out";

        alert("Unable to sign out. Please try again.");
    }
});
