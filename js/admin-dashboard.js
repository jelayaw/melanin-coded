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

        await loadAdminFileProjects();
        initializeAdminFileUploadForm();

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

/* ==========================================
   ADMIN PROJECT FILES — LOAD PROJECTS
========================================== */

async function loadAdminFileProjects() {
    const projectSelect =
        document.getElementById("admin-files-project");

    if (!projectSelect) return;

    const { data: projects, error } =
        await window.mcSupabase
            .from("projects")
            .select("id, project_name")
            .order("project_name", { ascending: true });

    if (error) {
        console.error("Unable to load admin file projects:", error);
        return;
    }

    projectSelect.innerHTML =
        '<option value="">Choose a project</option>';

    (projects || []).forEach((project) => {
        const option = document.createElement("option");

        option.value = project.id;
        option.textContent =
            project.project_name || "Untitled Project";

        projectSelect.appendChild(option);
    });

    console.log("Admin file projects loaded:", projects);

    projectSelect.addEventListener("change", () => {
        loadAdminProjectFiles(projectSelect.value);
    });
}

/* ==========================================
   ADMIN PROJECT FILES — DISPLAY FILES
========================================== */

async function loadAdminProjectFiles(projectId) {
    const filesContainer =
        document.getElementById("admin-files-list");

    if (!filesContainer) return;

    filesContainer.replaceChildren();

    const message = document.createElement("p");
    message.className = "admin-empty-state";

    if (!projectId) {
        message.textContent =
            "Select a project to view its shared files.";
        filesContainer.appendChild(message);
        return;
    }

    message.textContent = "Loading project files...";
    filesContainer.appendChild(message);

    const { data: files, error } =
        await window.mcSupabase
            .from("project_files")
            .select(
                "id, file_name, storage_path, category, file_size, created_at"
            )
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

    // Ignore results if the admin switched projects
    // while the request was loading.
    const projectSelect =
        document.getElementById("admin-files-project");

    if (projectSelect?.value !== projectId) return;

    filesContainer.replaceChildren();

    if (error) {
        console.error("Unable to load admin project files:", error);

        message.textContent =
            "Unable to load project files. Please try again.";
        filesContainer.appendChild(message);
        return;
    }

    if (!files?.length) {
        message.textContent =
            "No files have been shared for this project yet.";
        filesContainer.appendChild(message);
        return;
    }

    files.forEach((file) => {
        const card = document.createElement("article");
        card.className = "admin-file-card";

        const details = document.createElement("div");
        details.className = "admin-file-info";

        const name = document.createElement("h3");
        name.className = "admin-file-name";
        name.textContent = file.file_name;

        const metadata = document.createElement("p");
        metadata.className = "admin-file-details";

        const size =
            typeof file.file_size === "number"
                ? `${(file.file_size / 1024).toFixed(1)} KB`
                : "Size unavailable";

        metadata.textContent =
            `${file.category || "Documents"} · ${size}`;

        details.append(name, metadata);
        card.appendChild(details);

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "admin-file-download";
        downloadButton.textContent = "Download";
        downloadButton.setAttribute(
            "aria-label",
            `Download ${file.file_name}`
        );

        downloadButton.addEventListener("click", async () => {
            downloadButton.disabled = true;
            downloadButton.textContent = "Downloading...";

            try {
                const { data, error } =
                    await window.mcSupabase.storage
                        .from("project-files")
                        .download(file.storage_path);

                if (error) throw error;

                const downloadUrl = URL.createObjectURL(data);
                const link = document.createElement("a");

                link.href = downloadUrl;
                link.download = file.file_name;

                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => {
                    URL.revokeObjectURL(downloadUrl);
                }, 1000);
            } catch (error) {
                console.error("Admin file download failed:", error);
                alert("Unable to download this file. Please try again.");
            } finally {
                downloadButton.disabled = false;
                downloadButton.textContent = "Download";
            }
        });

        /* ==========================================
           ADMIN FILE ACTIONS MENU
        ========================================== */

        const fileActions = document.createElement("div");
        fileActions.className = "admin-file-actions";

        const menuWrapper = document.createElement("div");
        menuWrapper.className = "admin-file-menu-wrapper";

        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className = "admin-file-menu-button";
        menuButton.textContent = "⋮";
        menuButton.setAttribute(
            "aria-label",
            `More options for ${file.file_name}`
        );
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-haspopup", "true");

        const menu = document.createElement("div");
        menu.className = "admin-file-menu";
        menu.hidden = true;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "admin-file-delete";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${file.file_name}`
        );

        deleteButton.addEventListener("click", async () => {
            menu.hidden = true;
            menuButton.setAttribute("aria-expanded", "false");

            const confirmed = window.confirm(
                `Are you sure you want to permanently delete "${file.file_name}"?\n\n` +
                "This will remove the file from project storage and the file list. " +
                "This action cannot be undone."
            );

            if (!confirmed) return;

            deleteButton.disabled = true;
            menuButton.disabled = true;
            downloadButton.disabled = true;

            try {
                await deleteAdminProjectFile(file.id, projectId);

                await loadAdminProjectFiles(projectId);

                alert(`"${file.file_name}" was deleted successfully.`);
            } catch (error) {
                console.error("Admin file deletion failed:", error);

                alert(
                    error.message ||
                    "Unable to delete this file. Please try again."
                );

                await loadAdminProjectFiles(projectId);
            } finally {
                deleteButton.disabled = false;
                menuButton.disabled = false;
                downloadButton.disabled = false;
            }
        });

        menu.appendChild(deleteButton);
        menuWrapper.append(menuButton, menu);

        menuButton.addEventListener("click", () => {
            const isOpening = menu.hidden;

            document.querySelectorAll(".admin-file-menu").forEach((otherMenu) => {
                otherMenu.hidden = true;
            });

            document.querySelectorAll(".admin-file-menu-button").forEach((button) => {
                button.setAttribute("aria-expanded", "false");
            });

            menu.hidden = !isOpening;
            menuButton.setAttribute("aria-expanded", String(isOpening));
        });

        fileActions.append(downloadButton, menuWrapper);
        card.appendChild(fileActions);
        filesContainer.appendChild(card);
    });

    console.log("Admin project files loaded:", {
        projectId,
        count: files.length
    });
}

/* ==========================================
   ADMIN FILE UPLOAD FORM VALIDATION
========================================== */

function initializeAdminFileUploadForm() {
    const projectSelect = document.getElementById("admin-files-project");
    const categorySelect = document.getElementById("admin-file-upload-category");
    const fileInput = document.getElementById("admin-file-upload-input");
    const uploadButton = document.querySelector(".admin-file-upload-button");
    const message = document.getElementById("admin-file-upload-message");

    if (!projectSelect || !categorySelect || !fileInput ||
        !uploadButton || !message) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];

    const allowedCategories = [
        "Brand Assets",
        "Client Content",
        "Design Previews",
        "Documents",
        "Final Deliverables"
    ];

    const maxFileSize = 25 * 1024 * 1024;

    function validateUpload() {
        const file = fileInput.files?.[0];

        const validProject = Boolean(projectSelect.value);
        const validCategory = allowedCategories.includes(categorySelect.value);
        const validFile = Boolean(
            file &&
            allowedTypes.includes(file.type) &&
            file.size > 0 &&
            file.size <= maxFileSize
        );

        uploadButton.disabled = !(
            validProject &&
            validCategory &&
            validFile
        );
    }

    projectSelect.addEventListener("change", validateUpload);
    categorySelect.addEventListener("change", validateUpload);
    fileInput.addEventListener("change", () => {
        message.textContent = "";

        const file = fileInput.files?.[0];

        if (file && !allowedTypes.includes(file.type)) {
            message.textContent = "This file type is not supported.";
        } else if (file && file.size > maxFileSize) {
            message.textContent = "File exceeds the 25 MB limit.";
        } else if (file && file.size === 0) {
            message.textContent = "Please choose a non-empty file.";
        }

        validateUpload();
    });

    /* ==========================================
       ADMIN FILE UPLOAD SUBMISSION
    ========================================== */

    const uploadForm = document.getElementById("admin-file-upload-form");
    let isUploading = false;

    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isUploading) return;

        const projectId = projectSelect.value;
        const category = categorySelect.value;
        const file = fileInput.files?.[0];

        if (
            !projectId ||
            !allowedCategories.includes(category) ||
            !file ||
            !allowedTypes.includes(file.type) ||
            file.size <= 0 ||
            file.size > maxFileSize
        ) {
            message.textContent =
                "Please select a valid project, category, and file.";
            validateUpload();
            return;
        }

        isUploading = true;
        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";
        message.textContent = "Uploading your project file...";

        // Keep the destination unchanged during the upload.
        projectSelect.disabled = true;
        categorySelect.disabled = true;
        fileInput.disabled = true;

        try {
            const uploadedFile = await uploadAdminProjectFile(
                projectId,
                category,
                file
            );

            message.textContent =
                `${uploadedFile.file_name} uploaded successfully!`;

            categorySelect.value = "";
            fileInput.value = "";

            await loadAdminProjectFiles(projectId);
        } catch (error) {
            console.error("Admin file upload failed:", error);

            message.textContent =
                error.message || "Unable to upload file. Please try again.";
        } finally {
            isUploading = false;

            projectSelect.disabled = false;
            categorySelect.disabled = false;
            fileInput.disabled = false;

            uploadButton.textContent = "Upload File";
            validateUpload();
        }
    });

    validateUpload();
}

/* ==========================================
   ADMIN PROJECT FILE UPLOAD
========================================== */

async function uploadAdminProjectFile(projectId, category, file) {
    const { data: authData, error: authError } =
        await window.mcSupabase.auth.getUser();

    if (authError || !authData?.user) {
        throw new Error("Please sign in again before uploading.");
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];

    const allowedCategories = [
        "Brand Assets",
        "Client Content",
        "Design Previews",
        "Documents",
        "Final Deliverables"
    ];

    const extensions = {
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

    const maxFileSize = 25 * 1024 * 1024;

    if (!projectId || !allowedCategories.includes(category)) {
        throw new Error("Please select a valid project and category.");
    }

    if (
        !file ||
        !allowedTypes.includes(file.type) ||
        file.size <= 0 ||
        file.size > maxFileSize
    ) {
        throw new Error("Please choose a supported file under 25 MB.");
    }

    const storagePath =
        `${projectId}/${crypto.randomUUID()}.${extensions[file.type]}`;

    const { error: storageError } =
        await window.mcSupabase.storage
            .from("project-files")
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
            });

    if (storageError) {
        throw storageError;
    }

    const { error: metadataError } =
        await window.mcSupabase
            .from("project_files")
            .insert({
                project_id: projectId,
                uploaded_by: authData.user.id,
                file_name: file.name,
                storage_path: storagePath,
                file_type: file.type,
                file_size: file.size,
                category: category
            });

    if (metadataError) {
        console.error("Admin upload metadata failed:", {
            projectId,
            storagePath,
            fileName: file.name,
            error: metadataError
        });

        throw new Error(
            "The file reached storage, but its database record " +
            "could not be saved. Check the console before retrying."
        );
    }

    return {
        file_name: file.name,
        storage_path: storagePath
    };
}

/* ==========================================
   ADMIN PROJECT FILE DELETION HELPER
========================================== */

async function deleteAdminProjectFile(fileId, projectId) {
    const { data: authData, error: authError } =
        await window.mcSupabase.auth.getUser();

    if (authError || !authData?.user) {
        throw new Error("Please sign in again before deleting files.");
    }

    // Retrieve the actual database record instead of trusting
    // a file path supplied by the browser.
    const { data: file, error: lookupError } =
        await window.mcSupabase
            .from("project_files")
            .select("id, project_id, file_name, storage_path")
            .eq("id", fileId)
            .eq("project_id", projectId)
            .single();

    if (lookupError || !file) {
        throw new Error("Unable to find this project file.");
    }

    if (!file.storage_path.startsWith(`${projectId}/`)) {
        throw new Error("File storage path does not match this project.");
    }

    // Remove the private Storage object first.
    const { data: removedObjects, error: storageError } =
        await window.mcSupabase.storage
            .from("project-files")
            .remove([file.storage_path]);

    if (storageError) {
        throw new Error(
            `Unable to remove file from storage: ${storageError.message}`
        );
    }

    if (
        !removedObjects?.some(
            (object) => object.name === file.storage_path ||
                        file.storage_path.endsWith(`/${object.name}`)
        )
    ) {
        throw new Error(
            "Storage did not confirm removal. The database record was preserved."
        );
    }

    // Only remove metadata after Storage reports success.
    const { data: deletedRows, error: metadataError } =
        await window.mcSupabase
            .from("project_files")
            .delete()
            .eq("id", file.id)
            .eq("project_id", projectId)
            .select("id");

    if (metadataError || deletedRows?.length !== 1) {
        console.error("Admin file metadata cleanup failed:", {
            fileId,
            projectId,
            storagePath: file.storage_path,
            error: metadataError
        });

        throw new Error(
            "The file was removed from storage, but its database record " +
            "could not be deleted. Please review this file in Supabase."
        );
    }

    return file.file_name;
}