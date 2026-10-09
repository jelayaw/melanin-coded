// =========================================================
// MELANIN CODED — CLIENT PORTAL LOGIN
// =========================================================

const portalLoginForm = document.getElementById("portal-login-form");
const portalLoginMessage = document.getElementById("portal-login-message");
const portalLoginButton = portalLoginForm.querySelector('button[type="submit"]');

portalLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("portal-email").value.trim();
    const password = document.getElementById("portal-password").value;

    portalLoginMessage.textContent = "";
    portalLoginButton.disabled = true;
    portalLoginButton.textContent = "Signing In...";

    try {
        const { data, error } = await window.mcSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        const { data: profile, error: profileError } = await window.mcSupabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", data.user.id)
            .single();

        if (profileError || !profile) {
            throw new Error("Unable to load your portal profile.");
        }

        // Redirect users according to their verified portal role.
        if (profile.role === "admin") {
            portalLoginMessage.textContent = `Welcome, ${profile.full_name}! Opening your Admin Studio...`;

            window.location.replace("admin-dashboard.html");

        } else if (profile.role === "client") {
            portalLoginMessage.textContent =
                `Welcome, ${profile.full_name}! Opening your Client Dashboard...`;

            window.location.replace("client-dashboard.html");

        } else {
            throw new Error("Unrecognized portal role.");
        }

    } catch (error) {
        console.error("Portal login error:", error.message);
        portalLoginMessage.textContent =
            "Unable to sign in. Please check your credentials or contact support.";
    } finally {
        portalLoginButton.disabled = false;
        portalLoginButton.textContent = "Sign In";
    }
});