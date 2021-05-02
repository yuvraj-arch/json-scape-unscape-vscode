
import * as vscode from 'vscode';
import * as prettier from 'prettier';


export function activate(context: vscode.ExtensionContext) {

	console.log('Extension "Json-Escape/Unescape" is now active!');

	let unscapeJsonDisposable = vscode.commands.registerCommand('json-vscode.unscapeJson', async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showInformationMessage('Not able to get text!');
					return;
			}

			if (editor.selections.length > 1){
				vscode.window.showWarningMessage("Multiple Selection not supported");
			}

			let diffSelectChar =  editor.selections[0].end.character - editor.selections[0].start.character
			let diffLineChar =  editor.selections[0].end.line - editor.selections[0].start.line

			let inputContent : string;
			if (diffSelectChar === 0 ){
				inputContent = editor.document.getText().replace(/(?:\r\n|\r|\n)/g,'').trim()
			} else {
				inputContent = editor.document.getText(editor.selection).replace(/(?:\r\n|\r|\n)/g, '').trim()
			}
			let flag = false;

			let regexSlaceStr =  new RegExp('(^{)(\\\\)+(")(.*)(}$)');
			while (true) {
				if (regexSlaceStr.test(inputContent)){
					flag = true;
					inputContent = '"' + inputContent + '"';
					inputContent = JSON.parse(inputContent)
				} else{
					break;
				}
			}
			if (flag) {
				const content : string = formateSpecialChar(inputContent);
				if (diffSelectChar ===0 && diffLineChar === 0) {

					const message = prettier.format(content, {bracketSpacing:false, trailingComma: "es5", tabWidth: 2, 
					semi: false, singleQuote: true,  parser: "json-stringify",}).trim();

					const lastLineId = editor.document.lineCount - 1;
					const range : vscode.Range = new vscode.Range(0, 0, lastLineId, editor.document.lineAt(lastLineId).text.length);
					const textEdit : vscode.TextEdit = vscode.TextEdit.replace(range, message);
				
					await editor.edit((editBuilder) => {
						editBuilder.replace(textEdit.range, textEdit.newText);
					});
					goToStartingPosition(editor)
					vscode.languages.setTextDocumentLanguage(editor.document, 'json');
				} else {
					if (diffLineChar === editor.document.lineCount-1) {
						const message = prettier.format(content, {bracketSpacing:false, trailingComma: "es5", tabWidth: 2, 
							semi: false, singleQuote: true,  parser: "json-stringify",}).trim();
						const textEdit : vscode.TextEdit = vscode.TextEdit.replace(editor.selections[0], message);
						await editor.edit((editBuilder) => {
							editBuilder.replace(textEdit.range, textEdit.newText);
						});
						goToStartingPosition(editor)
						vscode.languages.setTextDocumentLanguage(editor.document, 'json');
					} else {
						const doc = await vscode.workspace.openTextDocument({
							language: 'json',
							content: prettier.format(content, {bracketSpacing:false, trailingComma: "es5",
								tabWidth: 2, semi: false, singleQuote: true, parser: "json-stringify",}).trim(),
						});
						vscode.window.showTextDocument(doc);
					}	
				}
			} else {
				vscode.window.showErrorMessage("Error:: Input not valid escape json string");
			}
		} catch (error) {
			vscode.window.showErrorMessage("Error:: Input not valid escape json string");
		}
	});

	let scapeJsonDisposable = vscode.commands.registerCommand('json-vscode.scapeJson', async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showInformationMessage('Not able to get text!');
					return;
			}
			let content = editor.document.getText()
			let message = JSON.stringify(JSON.stringify(JSON.parse(content)))
							.replace(/^"/g, '').replace(/"$/, '');
			const lastLineId = editor.document.lineCount - 1;
			const range : vscode.Range = new vscode.Range(0, 0, lastLineId, editor.document.lineAt(lastLineId).text.length);
			const textEdit : vscode.TextEdit = vscode.TextEdit.replace(range, message);
			await editor.edit((editBuilder) => {
				editBuilder.replace(textEdit.range, textEdit.newText);
			});
			vscode.languages.setTextDocumentLanguage(editor.document, 'plaintext');
		} catch (error) {
			vscode.window.showErrorMessage("Error:: Input text not valid json");
		}
	});

	context.subscriptions.push(unscapeJsonDisposable, scapeJsonDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function goToStartingPosition(textEditor: vscode.TextEditor) : void {
    if (!textEditor) return;
    const position = new vscode.Position(0, 0);
    textEditor.selection = new vscode.Selection(position, position);
    textEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.Default);
}

function formateSpecialChar(text: string) : string {
    return text.replace(/\n/g, '\\n')
}
