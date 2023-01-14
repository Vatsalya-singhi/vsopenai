import { TokenManager } from './TokenManager';
import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { Util } from "./Util";

export class HelloWorldPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: HelloWorldPanel | undefined;

    public static readonly viewType = "hello-world";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (HelloWorldPanel.currentPanel) {
            HelloWorldPanel.currentPanel._panel.reveal(column);
            HelloWorldPanel.currentPanel._update();
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            HelloWorldPanel.viewType,
            "VSChatGPT",
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,
                retainContextWhenHidden: true,
                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media"),
                    vscode.Uri.joinPath(extensionUri, "out/compiled"),
                    vscode.Uri.joinPath(extensionUri, "media/build"),
                ],
            }
        );

        HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri);
    }

    public static kill() {
        HelloWorldPanel.currentPanel?.dispose();
        HelloWorldPanel.currentPanel = undefined;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        HelloWorldPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;

        this._panel.webview.html = this._getHtmlForWebview(webview);

        webview.onDidReceiveMessage(async (event) => {
            // console.log("extension listener => ", event);
            switch (event.command) {
                case "requestToken": {
                    webview.postMessage({ type: "setToken", value: TokenManager.getToken() });
                    break;
                }
                case "saveToken": {
                    TokenManager.setToken(event.value);
                    webview.postMessage({ type: "setToken", value: TokenManager.getToken() });
                    vscode.window.showInformationMessage("Token Saved!");
                    break;
                }
                case "deleteToken": {
                    TokenManager.setToken("");
                    webview.postMessage({ type: "setToken", value: TokenManager.getToken() });
                    vscode.window.showInformationMessage("Token Deleted!");
                    break;
                }
                case "copyToClipboard": {
                    vscode.env.clipboard.writeText(event.value);
                    vscode.window.showInformationMessage("Copied to clipboard!");
                    break;
                }
                case "Error": {
                    if (typeof event.value === "string") {
                        vscode.window.showErrorMessage(`Error: ${event.value}`);
                    } else {
                        vscode.window.showErrorMessage(`Error: Please try again!`);
                    }
                    break;
                }
                default:
                    break;
            }
        });

    }


    private _getHtmlForWebview(webview: vscode.Webview) {
        // // And the uri we use to load this script in the webview

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const manifestMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "build/manifest.json"));
        const mainScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));

        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "build/static/js/main.598b0c94.js"));
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "build/static/css/main.e93b2994.css"));

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `
            <!DOCTYPE html>
			<html lang="en">
			    <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta name="description" content="Web site created using create-react-app" />
                    <link href="${stylesResetUri}" rel="stylesheet">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <link href="${cssUri}" rel="stylesheet">
                    <link href="${manifestMainUri}" rel="manifest"/>
                    <title>VSChatGPT - Your CODE Assistant</title>

                    <meta http-equiv="Content-Security-Policy" 
                        content="
                        default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval' 'unsafe-dynamic'; 
                        script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; 
                        connect-src * data: blob: 'unsafe-inline'; 
                        img-src * data: blob: 'unsafe-inline'; 
                        frame-src * data: blob: ; 
                        style-src * data: blob: 'unsafe-inline';
                        font-src * data: blob: 'unsafe-inline';
                        frame-ancestors * data: blob: 'unsafe-inline';
                        "
                    />

                    <script nonce="${nonce}"> </script>
                    <script src="${mainScriptUri}" nonce="${nonce}"></script>

			    </head>

                <body>
                    <noscript>You need to enable JavaScript to run this app.</noscript>
                    <div id="root"></div>
                </body>

                <script src="${scriptUri}" nonce="${nonce}"></script>

			</html>`;
    }
}