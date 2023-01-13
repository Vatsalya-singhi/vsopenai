// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const tsvscode = acquireVsCodeApi();
    window.tsvscode = tsvscode;

    console.log("tsvscode from main.js", tsvscode);
    console.log("window.tsvscode from main.js", window.tsvscode);
}());