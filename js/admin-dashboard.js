/* =========================================================
   MELANIN CODED — ADMIN DASHBOARD NAVIGATION
   ========================================================= */

const adminSidebar = document.getElementById("admin-sidebar");
const adminMenuToggle = document.getElementById("admin-menu-toggle");
const adminMenuClose = document.getElementById("admin-menu-close");
const adminSidebarOverlay = document.getElementById("admin-sidebar-overlay");

const adminMobileQuery = window.matchMedia("(max-width: 768px)");

function closeAdminMenu() {
    adminSidebar.classList.remove("is-open");
    adminMenuToggle.setAttribute("aria-expanded", "false");
    adminMenuToggle.setAttribute("aria-label", "Open admin navigation");

    adminSidebarOverlay.hidden = true;
    document.body.style.overflow = "";

    if (adminMobileQuery.matches) {
        adminSidebar.inert = true;
    }
}

function openAdminMenu() {
    adminSidebar.inert = false;
    adminSidebar.classList.add("is-open");

    adminMenuToggle.setAttribute("aria-expanded", "true");
    adminMenuToggle.setAttribute("aria-label", "Close admin navigation");

    adminSidebarOverlay.hidden = false;
    document.body.style.overflow = "hidden";

    adminMenuClose.focus();
}

function syncAdminMenu() {
    const isMobile = adminMobileQuery.matches;

    adminMenuToggle.hidden = !isMobile;
    adminMenuClose.hidden = !isMobile;

    if (isMobile) {
        closeAdminMenu();
    } else {
        adminSidebar.inert = false;
        adminSidebar.classList.remove("is-open");
        adminSidebarOverlay.hidden = true;
        document.body.style.overflow = "";
    }
}

adminMenuToggle.addEventListener("click", () => {
    if (adminSidebar.classList.contains("is-open")) {
        closeAdminMenu();
    } else {
        openAdminMenu();
    }
});

adminMenuClose.addEventListener("click", () => {
    closeAdminMenu();
    adminMenuToggle.focus();
});

adminSidebarOverlay.addEventListener("click", () => {
    closeAdminMenu();
    adminMenuToggle.focus();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && adminSidebar.classList.contains("is-open")) {
        closeAdminMenu();
        adminMenuToggle.focus();
    }
});

/* ---------- Mobile Sidebar Keyboard Focus ---------- */

adminSidebar.addEventListener("keydown", (event) => {
    if (
        event.key !== "Tab" ||
        !adminMobileQuery.matches ||
        !adminSidebar.classList.contains("is-open")
    ) {
        return;
    }

    const focusableElements = Array.from(
        adminSidebar.querySelectorAll(
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

/* Keep keyboard focus inside the open mobile menu */
document.addEventListener("focusin", (event) => {
    if (
        adminMobileQuery.matches &&
        adminSidebar.classList.contains("is-open") &&
        !adminSidebar.contains(event.target)
    ) {
        adminMenuClose.focus();
    }
});

adminMobileQuery.addEventListener("change", syncAdminMenu);

syncAdminMenu();


/* =========================================================
   ADMIN DASHBOARD — AUTHENTICATION GUARD
   ========================================================= */

async function verifyAdminAccess() {
    const page = document.body;
    page.dataset.authState = "checking";

    try {
        // Verify the authenticated user with Supabase Auth.
        const { data, error: authError } =
            await window.mcSupabase.auth.getUser();

        if (authError || !data.user) {
            throw new Error("No authenticated user.");
        }

        // Retrieve the user's role from the protected profiles table.
        const { data: profile, error: profileError } =
            await window.mcSupabase
                .from("profiles")
                .select("full_name, role")
                .eq("id", data.user.id)
                .single();

        if (profileError || !profile || profile.role !== "admin") {
            throw new Error("Admin access required.");
        }

        // Only verified admins can see the dashboard.
        page.dataset.authState = "authorized";

        console.log("Admin dashboard access verified.");

    } catch (error) {
        console.warn("Admin dashboard access denied:", error.message);

        page.dataset.authState = "denied";

        window.location.replace("portal-login.html");
    }
}

verifyAdminAccess();

/* =========================================================
   ADMIN DASHBOARD — SIGN OUT
   ========================================================= */

const adminSignoutButton = document.getElementById("admin-signout-button");

adminSignoutButton.addEventListener("click", async () => {
    adminSignoutButton.disabled = true;
    adminSignoutButton.textContent = "Signing Out...";

    const { error } = await window.mcSupabase.auth.signOut();

    if (error) {
        console.error("Sign out failed:", error.message);
        adminSignoutButton.disabled = false;
        adminSignoutButton.textContent = "Sign Out";
        alert("Unable to sign out. Please try again.");
        return;
    }

    window.location.replace("portal-login.html");
});