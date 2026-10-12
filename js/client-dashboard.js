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

        // Retrieve projects assigned to the authenticated client.
        // Supabase RLS also restricts which projects this user can read.
        const { data: assignedProjects, error: projectsError } =
            await window.mcSupabase
                .from("projects")
                .select(`
                    id,
                    project_name,
                    status,
                    current_stage,
                    progress_percent,
                    project_members!inner(user_id)
                `)
                .eq("project_members.user_id", data.user.id);

        if (projectsError) {
            throw projectsError;
        }

        console.log("Client assigned projects:", assignedProjects);
        renderClientProjects(assignedProjects);
        populateClientUploadProjects(assignedProjects);
        initializeClientUploadForm();

        // Update the Active Projects summary card.
const activeProjectsCount = assignedProjects.filter(
    (project) => project.status?.toLowerCase() === "active"
).length;

const activeProjectsElement =
    document.getElementById("client-active-projects");

if (activeProjectsElement) {
    activeProjectsElement.textContent = activeProjectsCount;
}

        /* CLIENT DASHBOARD — PENDING ACTIONS */

        const { data: clientActions, error: actionsError } =
            await window.mcSupabase
                .from("client_actions")
                .select("id, project_id, title, status")
                .eq("status", "pending");

        if (actionsError) {
            console.error("Unable to load client actions:", actionsError);
        } else {
            console.log("Client pending actions:", clientActions);
            renderClientActions(clientActions);

            const pendingActionsElement =
                document.getElementById("client-pending-actions");

            if (pendingActionsElement) {
                pendingActionsElement.textContent = clientActions.length;
            }
        }

        /* CLIENT DASHBOARD — RECENT PROJECT UPDATES */

        const { data: projectUpdates, error: updatesError } =
            await window.mcSupabase
                .from("project_updates")
                .select("id, project_id, title, message, created_at")
                .order("created_at", { ascending: false })
                .limit(10);

        if (updatesError) {
            console.error("Unable to load project updates:", updatesError);
        } else {
            console.log("Client project updates:", projectUpdates);
            renderClientUpdates(projectUpdates);

            /* CLIENT DASHBOARD — LATEST UPDATE SUMMARY */

            const latestUpdateElement =
                document.getElementById("client-latest-update");

            if (latestUpdateElement) {
                if (projectUpdates.length > 0) {
                    latestUpdateElement.textContent =
                        projectUpdates[0].title || "Project Update";
                } else {
                    latestUpdateElement.textContent = "No updates yet";
                }
            }
        }

        /* =========================================================
           CLIENT DASHBOARD — UPCOMING PAYMENT SUMMARY
           ========================================================= */

        const upcomingPaymentElement =
            document.getElementById("client-upcoming-payments");
        const upcomingPaymentDateElement =
            document.getElementById("client-upcoming-payment-date");

        const { data: upcomingPayments, error: paymentsError } =
            await window.mcSupabase
                .from("project_payments")
                .select("id, amount_due, currency, due_date, status, description")
                .in("status", ["pending", "overdue"])
                .order("due_date", {
                    ascending: true,
                    nullsFirst: false
                });

        if (paymentsError) {
            console.error("Unable to load upcoming payments:", paymentsError);

            if (upcomingPaymentElement) {
                upcomingPaymentElement.textContent = "Unavailable";
            }
        } else {
            console.log("Client upcoming payments:", upcomingPayments);
            renderClientPaymentSchedule(upcomingPayments);

            /* Calculate total outstanding project payments */
            const outstandingBalance = upcomingPayments.reduce(
                (total, payment) => total + Number(payment.amount_due),
                0
            );

            const outstandingBalanceElement =
                document.getElementById("client-outstanding-balance");

            if (outstandingBalanceElement) {
                outstandingBalanceElement.textContent =
                    new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD"
                    }).format(outstandingBalance);
            }

            /* Display the next scheduled payment date */
            const nextPaymentDateElement =
                document.getElementById("client-next-payment-date");

            if (nextPaymentDateElement) {
                const nextDatedPayment = upcomingPayments.find(
                    payment => payment.due_date
                );

                if (nextDatedPayment) {
                    const dueDate = new Date(
                        `${nextDatedPayment.due_date}T12:00:00`
                    );

                    nextPaymentDateElement.textContent =
                        dueDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        });
                } else {
                    nextPaymentDateElement.textContent =
                        "Not scheduled";
                }
            }

            if (upcomingPaymentElement) {
                if (upcomingPayments.length > 0) {
                    const nextPayment = upcomingPayments[0];

                    if (upcomingPaymentDateElement) {
                        if (nextPayment.due_date) {
                            const dueDate = new Date(
                                `${nextPayment.due_date}T12:00:00`
                            );

                            upcomingPaymentDateElement.textContent =
                                "Due " + dueDate.toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric"
                                });
                        } else {
                            upcomingPaymentDateElement.textContent =
                                "Due date not scheduled";
                        }
                    }

                    upcomingPaymentElement.textContent =
                        new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: nextPayment.currency || "USD"
                        }).format(Number(nextPayment.amount_due));
                } else {
                    upcomingPaymentElement.textContent = "No payments due";
                }
            }
        }

        /* =========================================
           CLIENT PORTAL — PAYMENT HISTORY QUERY
           ========================================= */

        const { data: paymentHistory, error: paymentHistoryError } =
            await window.mcSupabase
                .from("project_payments")
                .select(
                    "id, description, amount_due, currency, paid_at, status"
                )
                .eq("status", "paid")
                .order("paid_at", {
                    ascending: false,
                    nullsFirst: false
                });

        if (paymentHistoryError) {
            console.error(
                "Unable to load payment history:",
                paymentHistoryError
            );
        } else {
            console.log("Client payment history:", paymentHistory);
            renderClientPaymentHistory(paymentHistory);
        }

        /* =========================================
           CLIENT PORTAL — PROJECT FILES
           Load permitted file metadata
        ========================================= */

        const { data: projectFiles, error: projectFilesError } =
            await window.mcSupabase
                .from("project_files")
                .select(
                    "id, project_id, file_name, storage_path, file_type, file_size, category, created_at"
                )
                .order("created_at", { ascending: false });

        if (projectFilesError) {
            console.error(
                "Unable to load project files:",
                projectFilesError
            );
        } else {
            console.log("Client project files:", projectFiles);
            renderClientFiles(projectFiles);
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

/* =========================================================
   CLIENT DASHBOARD — PROJECT DISPLAY
   ========================================================= */

function renderClientProjects(projects) {
    const container =
        document.getElementById("client-projects-container");

    if (!container) return;

    // Preserve the empty state if no projects are assigned.
    if (!projects || projects.length === 0) {
        return;
    }

    container.classList.remove("client-empty-state");
    container.classList.add("client-project-list");
    container.replaceChildren();

    projects.forEach((project) => {
        const card = document.createElement("article");
        card.className = "client-project-card";

        const name = document.createElement("h3");
        name.textContent = project.project_name || "Untitled Project";

        const status = document.createElement("p");
        status.textContent = `Status: ${project.status || "Not set"}`;

        const stage = document.createElement("p");
        stage.textContent =
            `Current Stage: ${project.current_stage || "Not set"}`;

        const progress = document.createElement("p");
        const percent = Math.min(
            100,
            Math.max(0, Number(project.progress_percent) || 0)
        );
        progress.textContent = `Progress: ${percent}%`;

        const progressBar = document.createElement("progress");
        progressBar.max = 100;
        progressBar.value = percent;
        progressBar.setAttribute(
            "aria-label",
            `${project.project_name || "Project"} progress`
        );

        card.append(name, status, stage, progress, progressBar);
        container.appendChild(card);
    });
}

/* =========================================================
   CLIENT DASHBOARD — ACTION ITEMS DISPLAY
   ========================================================= */

function renderClientActions(actions) {
    const container =
        document.getElementById("client-actions-container");

    if (!container) return;

    if (!actions || actions.length === 0) {
        return;
    }

    container.classList.remove("client-empty-state");
    container.classList.add("client-action-list");
    container.replaceChildren();

    actions.forEach((action) => {
        const card = document.createElement("article");
        card.className = "client-action-card";

        const content = document.createElement("div");
        content.className = "client-action-content";

        const title = document.createElement("h3");
        title.textContent = action.title || "Untitled Action";

        const status = document.createElement("span");
        status.className = "client-action-status";
        status.textContent = action.status || "Pending";

        content.append(title, status);
        card.appendChild(content);
        container.appendChild(card);
    });
}

/* =========================================================
   CLIENT DASHBOARD — RECENT UPDATES DISPLAY
   ========================================================= */

function renderClientUpdates(updates) {
    const container =
        document.getElementById("client-updates-container");

    if (!container) return;

    if (!updates || updates.length === 0) {
        return;
    }

    container.classList.remove("client-empty-state");
    container.classList.add("client-update-list");
    container.replaceChildren();

    updates.forEach((update) => {
        const card = document.createElement("article");
        card.className = "client-update-card";

        const title = document.createElement("h3");
        title.textContent = update.title || "Project Update";

        const message = document.createElement("p");
        message.textContent = update.message || "";

        const date = document.createElement("time");
        date.className = "client-update-date";

        const parsedDate = new Date(update.created_at);

        if (!Number.isNaN(parsedDate.getTime())) {
            date.dateTime = parsedDate.toISOString();
            date.textContent = parsedDate.toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );
        }

        card.append(title, message, date);
        container.appendChild(card);
    });
}

/* =========================================
   CLIENT PORTAL — PAYMENT SCHEDULE
   ========================================= */

function renderClientPaymentSchedule(payments) {
    const container = document.getElementById(
        "client-payment-schedule"
    );

    if (!container) return;

    container.replaceChildren();

    if (!payments || payments.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "client-payment-empty";
        emptyMessage.textContent = "No outstanding payments.";

        container.appendChild(emptyMessage);
        return;
    }

    payments.forEach((payment) => {
        const card = document.createElement("article");
        card.className = "client-payment-card";

        const details = document.createElement("div");
        details.className = "client-payment-card-details";

        const title = document.createElement("h4");
        title.textContent =
            payment.description || "Project Payment";

        const dueDate = document.createElement("p");

        if (payment.due_date) {
            const formattedDate = new Date(
                `${payment.due_date}T12:00:00`
            ).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });

            dueDate.textContent = `Due ${formattedDate}`;
        } else {
            dueDate.textContent = "Due date not scheduled";
        }

        details.append(title, dueDate);

        const paymentInfo = document.createElement("div");
        paymentInfo.className = "client-payment-card-info";

        const amount = document.createElement("strong");
        amount.textContent = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: payment.currency || "USD"
        }).format(Number(payment.amount_due));

        const status = document.createElement("span");
        status.className = "client-payment-status";
        status.textContent = payment.status || "Pending";

        paymentInfo.append(amount, status);
        card.append(details, paymentInfo);
        container.appendChild(card);
    });
}

/* =========================================
   CLIENT PORTAL — PAYMENT HISTORY
   ========================================= */

function renderClientPaymentHistory(payments) {
    const container = document.getElementById(
        "client-payment-history"
    );

    if (!container) return;

    container.replaceChildren();

    if (!payments || payments.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "client-payment-empty";
        emptyMessage.textContent = "No completed payments yet.";

        container.appendChild(emptyMessage);
        return;
    }

    payments.forEach((payment) => {
        const card = document.createElement("article");
        card.className = "client-payment-card";

        const details = document.createElement("div");
        details.className = "client-payment-card-details";

        const title = document.createElement("h4");
        title.textContent =
            payment.description || "Project Payment";

        const paymentDate = document.createElement("p");

        if (payment.paid_at) {
            const formattedDate = new Date(
                payment.paid_at
            ).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });

            paymentDate.textContent = `Paid ${formattedDate}`;
        } else {
            paymentDate.textContent = "Payment completed";
        }

        details.append(title, paymentDate);

        const paymentInfo = document.createElement("div");
        paymentInfo.className = "client-payment-card-info";

        const amount = document.createElement("strong");
        amount.textContent = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: payment.currency || "USD"
        }).format(Number(payment.amount_due));

        const status = document.createElement("span");
        status.className =
            "client-payment-status client-payment-status-paid";
        status.textContent = "Paid";

        paymentInfo.append(amount, status);
        card.append(details, paymentInfo);
        container.appendChild(card);
    });
}

/* =========================================
   CLIENT PORTAL — PROJECT FILES
   Render permitted file metadata
========================================= */

function renderClientFiles(files) {
    const container = document.getElementById(
        "client-files-container"
    );

    if (!container) return;

    container.replaceChildren();

    if (!files || files.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "client-files-empty";
        emptyMessage.textContent =
            "No project files have been shared yet.";

        container.appendChild(emptyMessage);
        return;
    }

    files.forEach((file) => {
        const card = document.createElement("div");
        card.className = "client-file-card";

        const info = document.createElement("div");
        info.className = "client-file-info";

        const name = document.createElement("span");
        name.className = "client-file-name";
        name.textContent = file.file_name || "Untitled file";

        const details = document.createElement("span");
        details.className = "client-file-details";

        const fileSize = Number(file.file_size);
        const formattedSize =
            Number.isFinite(fileSize) && fileSize >= 0
                ? `${(fileSize / 1024).toFixed(1)} KB`
                : "Size unavailable";

        const category = file.category || "Project File";

        details.textContent = `${category} • ${formattedSize}`;

        info.appendChild(name);
        info.appendChild(details);

        card.appendChild(info);

        // Download button for private project files
        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "client-file-action";
        downloadButton.textContent = "Download";

        downloadButton.addEventListener("click", async () => {
            downloadButton.disabled = true;
            downloadButton.textContent = "Downloading...";

            try {
                if (!file.storage_path) {
                    throw new Error("File storage path is missing.");
                }

                const { data, error } = await window.mcSupabase.storage
                    .from("project-files")
                    .download(file.storage_path);

                if (error) throw error;
                if (!(data instanceof Blob)) {
                    throw new Error("No downloadable file was returned.");
                }

                const objectUrl = URL.createObjectURL(data);
                const link = document.createElement("a");

                link.href = objectUrl;
                link.download = file.file_name || "project-file";
                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
            } catch (error) {
                console.error("Project file download failed:", error);
                alert("Unable to download this file. Please try again.");
            } finally {
                downloadButton.disabled = false;
                downloadButton.textContent = "Download";
            }
        });

        card.appendChild(downloadButton);
        container.appendChild(card);
    });
}

/* =========================================
   CLIENT PORTAL — UPLOAD PROJECT SELECTOR
========================================= */

function populateClientUploadProjects(projects) {
    const projectSelect = document.getElementById(
        "client-upload-project"
    );

    if (!projectSelect) return;

    projectSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose your project";

    projectSelect.appendChild(placeholder);

    if (!Array.isArray(projects) || projects.length === 0) {
        projectSelect.disabled = true;
        return;
    }

    projectSelect.disabled = false;

    projects.forEach((project) => {
        const option = document.createElement("option");

        option.value = project.id;
        option.textContent =
            project.project_name || "Untitled Project";

        projectSelect.appendChild(option);
    });
}

/* =========================================
   CLIENT PORTAL — UPLOAD FORM VALIDATION
========================================= */

function initializeClientUploadForm() {
    const form = document.getElementById("client-upload-form");
    const projectSelect = document.getElementById("client-upload-project");
    const categorySelect = document.getElementById("client-upload-category");
    const fileInput = document.getElementById("client-upload-file");
    const uploadButton = form?.querySelector(".client-upload-button");
    const message = document.getElementById("client-upload-message");

    if (
        !form ||
        !projectSelect ||
        !categorySelect ||
        !fileInput ||
        !uploadButton ||
        !message
    ) {
        return;
    }

    const maxFileSize = 25 * 1024 * 1024;

    const allowedTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]);

    function validateUpload() {
        const file = fileInput.files?.[0];

        uploadButton.disabled = true;

        if (!projectSelect.value || !categorySelect.value || !file) {
            return;
        }

        if (!allowedTypes.has(file.type)) {
            message.textContent = "This file type is not supported.";
            return;
        }

        if (file.size > maxFileSize) {
            message.textContent = "Files must be 25 MB or smaller.";
            return;
        }

        if (file.size === 0) {
            message.textContent = "Please select a non-empty file.";
            return;
        }

        uploadButton.disabled = false;
    }

    projectSelect.addEventListener("change", validateUpload);
    categorySelect.addEventListener("change", validateUpload);
    fileInput.addEventListener("change", validateUpload);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const projectId = projectSelect.value;
        const category = categorySelect.value;
        const file = fileInput.files?.[0];

        if (!projectId || !category || !file) {
            message.textContent =
                "Please select a project, category, and file.";
            return;
        }

        // Revalidate before uploading.
        if (
            !allowedTypes.has(file.type) ||
            file.size === 0 ||
            file.size > maxFileSize
        ) {
            message.textContent =
                "Please select a valid file under 25 MiB.";
            return;
        }

        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";
        message.textContent = "Uploading your file. Please wait...";

        try {
            await uploadClientProjectFile(projectId, category, file);

            message.textContent =
                "Your file was uploaded successfully!";

            fileInput.value = "";
            categorySelect.value = "";

            // Refresh the file list without reloading the page.
            const { data: updatedFiles, error: refreshError } =
                await window.mcSupabase
                    .from("project_files")
                    .select(
                        "id, project_id, file_name, storage_path, " +
                        "file_type, file_size, category, created_at"
                    )
                    .order("created_at", { ascending: false });

            if (refreshError) {
                console.error(
                    "Unable to refresh project files:",
                    refreshError
                );
            } else {
                renderClientFiles(updatedFiles);
            }

        } catch (error) {
            console.error("Client file upload failed:", error);

            message.textContent =
                error.message ||
                "Upload failed. Please try again.";

        } finally {
            uploadButton.textContent = "Upload File";
            validateUpload();
        }
    });
}

/* =========================================
   CLIENT PORTAL — SECURE UPLOAD PATH
========================================= */

function createClientUploadPath(projectId, file) {
    const extensionsByType = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
        "application/pdf": "pdf",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "text/plain": "txt"
    };

    const extension = extensionsByType[file.type];

    if (!extension) {
        throw new Error("Unsupported file type.");
    }

    const uniqueId = crypto.randomUUID();

    return `${projectId}/${uniqueId}.${extension}`;
}

/* =========================================
   CLIENT PORTAL — UPLOAD PROJECT FILE
========================================= */

async function uploadClientProjectFile(projectId, category, file) {
    const supabase = window.mcSupabase;

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("You must be signed in to upload files.");
    }

    const allowedTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]);

    const allowedCategories = new Set([
        "Brand Assets",
        "Client Content",
        "Documents"
    ]);

    if (!allowedCategories.has(category)) {
        throw new Error("Invalid file category.");
    }

    if (
        !file ||
        !allowedTypes.has(file.type) ||
        file.size === 0 ||
        file.size > 25 * 1024 * 1024
    ) {
        throw new Error("Invalid file type or size.");
    }

    const storagePath = createClientUploadPath(projectId, file);

    const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file, {
            contentType: file.type,
            upsert: false
        });

    if (uploadError) {
        throw uploadError;
    }

    const { error: metadataError } = await supabase
        .from("project_files")
        .insert({
            project_id: projectId,
            uploaded_by: user.id,
            file_name: file.name,
            storage_path: storagePath,
            file_type: file.type,
            file_size: file.size,
            category: category
        });

    if (metadataError) {
        console.error("Project file metadata save failed:", {
            projectId,
            storagePath,
            originalFileName: file.name,
            uploadedBy: user.id,
            error: metadataError
        });

        throw new Error(
            "Your file reached storage, but we couldn't finish recording it. " +
            "Please contact Melanin Coded support before trying again."
        );
    }

    return {
        file_name: file.name,
        storage_path: storagePath
    };
}
