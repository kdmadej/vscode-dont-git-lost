import * as vscode from 'vscode';
import { formatAnnotation, formatAgo } from './annotation';
import type { BlameCache } from '../git/blameCache';
import type { RepoLocator } from '../git/repoLocator';
import { readConfig } from '../config';

const DEBOUNCE_MS = 100;
const TYPING_IDLE_MS = 500;

export class LineBlame implements vscode.Disposable {
  private decoration = vscode.window.createTextEditorDecorationType({
    after: {
      margin: '0 0 0 3em',
      color: new vscode.ThemeColor('editorCodeLens.foreground'),
      fontStyle: 'normal',
    },
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
  });
  private timer: NodeJS.Timeout | undefined;
  private typingTimer: NodeJS.Timeout | undefined;
  private isTyping = false;
  private editTimes = new Map<string, number>();
  private subscriptions: vscode.Disposable[] = [];

  constructor(
    private blameCache: BlameCache,
    private repoLocator: RepoLocator,
  ) {
    this.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection((e) => {
        if (!this.isTyping) this.schedule(e.textEditor);
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.isTyping = false;
        if (this.typingTimer) { clearTimeout(this.typingTimer); this.typingTimer = undefined; }
        if (editor) this.schedule(editor);
      }),
      vscode.workspace.onDidChangeConfiguration(() => this.refreshActive()),
      vscode.workspace.onDidCloseTextDocument((doc) => this.editTimes.delete(doc.uri.toString())),
      vscode.workspace.onDidChangeTextDocument((e) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || e.document !== editor.document) return;
        const match = this.repoLocator.locate(e.document.uri);
        if (match) this.blameCache.invalidate(match.relPath);
        this.isTyping = true;
        this.editTimes.set(e.document.uri.toString(), Date.now());
        editor.setDecorations(this.decoration, []);
        if (this.timer) { clearTimeout(this.timer); this.timer = undefined; }
        if (this.typingTimer) clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
          this.isTyping = false;
          this.typingTimer = undefined;
          void this.update(editor);
        }, TYPING_IDLE_MS);
      }),
    );
  }

  private schedule(editor: vscode.TextEditor): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.update(editor), DEBOUNCE_MS);
  }

  private refreshActive(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) this.schedule(editor);
  }

  private async update(editor: vscode.TextEditor): Promise<void> {
    const cfg = readConfig();
    if (!cfg.blameEnabled || editor !== vscode.window.activeTextEditor) {
      editor.setDecorations(this.decoration, []);
      return;
    }
    if (editor.document.uri.scheme !== 'file') {
      editor.setDecorations(this.decoration, []);
      return;
    }
    const match = this.repoLocator.locate(editor.document.uri);
    if (!match || !match.headSha) {
      editor.setDecorations(this.decoration, []);
      return;
    }
    const line = editor.selection.active.line;
    try {
      const blame = await this.blameCache.get(match.relPath, match.headSha);
      const entry = blame.find((b) => b.lineNumber === line);
      if (!entry) {
        editor.setDecorations(this.decoration, []);
        return;
      }
      if (entry.isUncommitted) {
        const editMs = this.editTimes.get(editor.document.uri.toString());
        const suffix = editMs !== undefined ? `, ${formatAgo(Math.floor(editMs / 1000), Date.now())}` : '';
        const range = editor.document.lineAt(line).range;
        editor.setDecorations(this.decoration, [{
          range,
          renderOptions: { after: { contentText: `You${suffix}` } },
        }]);
        return;
      }
      const text = formatAnnotation(
        entry.commit,
        cfg.blameFormat,
        cfg.blameMessageMaxLength,
        Date.now(),
      );
      const range = editor.document.lineAt(line).range;
      editor.setDecorations(this.decoration, [{
        range,
        renderOptions: { after: { contentText: text } },
        hoverMessage: undefined, // hover is handled by hoverProvider
      }]);
    } catch {
      editor.setDecorations(this.decoration, []);
    }
  }

  dispose(): void {
    this.decoration.dispose();
    this.subscriptions.forEach((d) => d.dispose());
    if (this.timer) clearTimeout(this.timer);
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }
}
