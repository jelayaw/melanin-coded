
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

// Read the actual admin dashboard JavaScript.
const source = fs.readFileSync(
    "js/admin-dashboard.js",
    "utf8"
);

// Extract the function without relying on line numbers.
const startMarker = "async function uploadAdminProjectFile(";

const start = source.indexOf(startMarker);
const end = source.indexOf(
    "async function deleteAdminProjectFile(",
    start
);

assert.ok(start !== -1, "Upload function was not found.");
assert.ok(end > start, "Upload function ending was not found.");

const functionCode = source.slice(start, end);

async function runScenario(cleanupResult, cleanupError) {
    const calls = [];

    // Simulated Supabase client — no network requests.
    const mockSupabase = {
        auth: {
            getUser: async () => ({
                data: { user: { id: "test-admin-id" } },
                error: null
            })
        },

        storage: {
            from: () => ({
                upload: async (path) => {
                    calls.push({ action: "upload", path });
                    return { error: null };
                },

                remove: async (paths) => {
                    calls.push({ action: "remove", paths });
                    return {
                        data: cleanupResult,
                        error: cleanupError
                    };
                }
            })
        },

        from: () => ({
            insert: async () => {
                calls.push({ action: "insert" });
                return {
                    error: { message: "Simulated database failure" }
                };
            }
        })
    };

    const context = vm.createContext({
        window: { mcSupabase: mockSupabase },
        crypto: {
            randomUUID: () => "test-file-id"
        },
        console: {
            error: () => {}
        }
    });

    vm.runInContext(functionCode, context);

    const uploadFunction = vm.runInContext(
        "uploadAdminProjectFile",
        context
    );

    let errorMessage = "";

    try {
        await uploadFunction(
            "test-project",
            "Documents",
            {
                name: "test.txt",
                type: "text/plain",
                size: 100
            }
        );
    } catch (error) {
        errorMessage = error.message;
    }

    return { calls, errorMessage };
}

async function runTests() {
    const success = await runScenario(
        [{ name: "test-file-id.txt" }],
        null
    );

    assert.deepEqual(
        success.calls.map(call => call.action),
        ["upload", "insert", "remove"]
    );

    assert.match(
        success.errorMessage,
        /cleaned up successfully/i
    );

    console.log("PASS: Failed database insert triggers cleanup.");

    const failure = await runScenario(
        null,
        { message: "Simulated cleanup failure" }
    );

    assert.deepEqual(
        failure.calls.map(call => call.action),
        ["upload", "insert", "remove"]
    );

    assert.match(
        failure.errorMessage,
        /cleanup was not confirmed/i
    );

    console.log("PASS: Failed cleanup reports an error.");
    console.log("Both full-function tests passed.");
}

runTests().catch(error => {
    console.error("TEST FAILED:", error);
    process.exitCode = 1;
});
