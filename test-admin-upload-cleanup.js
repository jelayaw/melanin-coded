
const assert = require("node:assert/strict");

async function testCleanup(removedFiles, cleanupError) {
    const projectId = "test-project";
    const storagePath = "test-project/test-file.png";

    const cleanupConfirmed =
        !cleanupError &&
        Array.isArray(removedFiles) &&
        removedFiles.some(item =>
            item.name === storagePath ||
            item.name === storagePath.split("/").pop()
        );

    if (!cleanupConfirmed) {
        return {
            success: false,
            message: "Automatic cleanup was not confirmed."
        };
    }

    return {
        success: true,
        message: "Uploaded file cleaned up successfully."
    };
}

async function runTests() {
    // Test 1: Storage confirms the file was removed.
    const successfulCleanup = await testCleanup(
        [{ name: "test-file.png" }],
        null
    );

    assert.equal(successfulCleanup.success, true);
    console.log("PASS: Successful cleanup recognized.");

    // Test 2: Storage reports an error.
    const failedCleanup = await testCleanup(
        null,
        { message: "Storage permission denied" }
    );

    assert.equal(failedCleanup.success, false);
    console.log("PASS: Storage cleanup error recognized.");

    // Test 3: Storage returns no removed files.
    const emptyCleanup = await testCleanup([], null);

    assert.equal(emptyCleanup.success, false);
    console.log("PASS: Empty cleanup response recognized.");

    // Test 4: Storage returns an unrelated file.
    const wrongFileCleanup = await testCleanup(
        [{ name: "different-file.png" }],
        null
    );

    assert.equal(wrongFileCleanup.success, false);
    console.log("PASS: Unrelated file rejected.");

    console.log("All four isolated cleanup checks passed.");
}

runTests().catch(error => {
    console.error("Cleanup test failed:", error);
    process.exitCode = 1;
});
