import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem | undefined;
let timer: NodeJS.Timeout | undefined;
let timeLeft = 45 * 60;
let panel: vscode.WebviewPanel | undefined;
let randomConstraint: string = "";
let extensionContext: vscode.ExtensionContext | undefined;

const constraints = [
    "Space: O(1)", "No regex", "No built-ins", "No sorting", 
    "Single pass", "No extra space", "In-place only", "No recursion"
];

export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;
    
    const startDisposable = vscode.commands.registerCommand('interview-mode.start', () => {
        startInterview(context);
    });
    
    context.subscriptions.push(startDisposable);
}

function startInterview(context: vscode.ExtensionContext) {
    randomConstraint = constraints[Math.floor(Math.random() * constraints.length)];
    
    // Create webview panel
    if (!panel) {
        panel = vscode.window.createWebviewPanel(
            'interviewMode',
            'Interview Mode',
            vscode.ViewColumn.Beside,
            { 
                enableScripts: true,
                retainContextWhenHidden: true 
            }
        );
        
        // Load HTML file
        const htmlPath = path.join(context.extensionPath, 'media', 'interview.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf8');
        
        // Handle messages from webview
        panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'start':
                    startTimer(randomConstraint);
                    return;
            }
        });
    }
    
    panel.reveal(vscode.ViewColumn.Beside);
    
    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    updateStatusBar();
    statusBarItem.show();
    
    vscode.window.showInformationMessage(`🚀 Interview Mode ON! ${randomConstraint}`);
}

function startTimer(constraint: string) {
    timeLeft = 45 * 60;
    randomConstraint = constraint;
    
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        updateStatusBar();
        
        if (timeLeft <= 0) {
            clearInterval(timer!);
            endInterview();
        }
    }, 1000);
}

function updateStatusBar() {
    if (statusBarItem) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        statusBarItem.text = `🕐 Interview: ${minutes}:${seconds.toString().padStart(2, '0')} | ${randomConstraint}`;
    }
}

function endInterview() {
    statusBarItem?.dispose();
    if (panel) {
        panel.dispose();
        panel = undefined;
    }
    vscode.window.showWarningMessage('⏰ TIME UP! Check your solution.');
}

export function deactivate() {
    if (timer) clearInterval(timer);
    statusBarItem?.dispose();
    panel?.dispose();
}
