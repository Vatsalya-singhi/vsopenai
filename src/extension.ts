import { TokenManager } from './TokenManager';
import { HelloWorldPanel } from './HelloWorldPanel';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    TokenManager.globalState = context.globalState;

    let mainApp = vscode.commands.registerCommand('vschatgpt.mainApp', () => {
        HelloWorldPanel.kill();
        HelloWorldPanel.createOrShow(context.extensionUri);
    });
    context.subscriptions.push(mainApp);

}

// This method is called when your extension is deactivated
export function deactivate() {
}
