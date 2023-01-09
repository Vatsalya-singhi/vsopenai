import { TokenManager } from './TokenManager';
import { HelloWorldPanel } from './HelloWorldPanel';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import { SidebarProvider } from './SideBarProvider';

export function activate(context: vscode.ExtensionContext) {

    TokenManager.globalState = context.globalState;
    console.log("token value init=>", TokenManager.getToken());

    let mainApp = vscode.commands.registerCommand('vschatgpt.mainApp', () => {
        HelloWorldPanel.kill();
        HelloWorldPanel.createOrShow(context.extensionUri);
        setTimeout(() => {
            vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools");
        }, 1000);
    });
    context.subscriptions.push(mainApp);

}

// This method is called when your extension is deactivated
export function deactivate() { }
