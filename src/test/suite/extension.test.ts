import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'm31-team.m31-mini';

suite('Extension Test Suite', () => {
  test('Check if extension activates', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);

    assert.ok(extension, `Extension ${EXTENSION_ID} not found.`);

    if (!extension.isActive) {
      await extension.activate();
    }

    assert.strictEqual(extension.isActive, true, 'Extension did not activate.');
  });
});
