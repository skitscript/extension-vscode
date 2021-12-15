import type * as vscode from "vscode";
import rewire = require("rewire");

class Range {
  constructor(readonly start: Position, readonly end: Position) {}
}

class Disposable {
  static from(...disposableLikes: { dispose: () => unknown }[]): Disposable {
    return {
      mockedDisposableOf: [...disposableLikes],
    };
  }
}

class Position {
  constructor(readonly line: number, readonly character: number) {}
}

class WorkspaceEdit {
  readonly mockedReplacements: {
    readonly uri: string;
    readonly range: Range;
    readonly newName: string;
  }[] = [];

  replace(uri: string, range: Range, newName: string): void {
    this.mockedReplacements.push({ uri, range, newName });
  }
}

const createTextDocument = (text: string): vscode.TextDocument => ({
  uri: `Example Text Document Uri` as unknown as vscode.Uri,
  fileName: `Example File Name`,
  isUntitled: false,
  languageId: `skitscript`,
  version: 1234,
  isDirty: true,
  isClosed: false,
  async save() {
    fail(`Unexpected call to TextDocument.save.`);
    throw new Error(`Unexpected call to TextDocument.save.`);
  },
  eol: 2,
  lineCount: 1234,
  lineAt() {
    fail(`Unexpected call to TextDocument.lineAt.`);
    throw new Error(`Unexpected call to TextDocument.lineAt.`);
  },
  offsetAt() {
    fail(`Unexpected call to TextDocument.offsetAt.`);
    throw new Error(`Unexpected call to TextDocument.offsetAt.`);
  },
  positionAt() {
    fail(`Unexpected call to TextDocument.positionAt.`);
    throw new Error(`Unexpected call to TextDocument.positionAt.`);
  },
  getText(range?: Range) {
    if (range === undefined) {
      return text;
    } else {
      fail(`Unexpected Range in call to TextDocument.getText.`);
      throw new Error(`Unexpected Range in call to TextDocument.getText.`);
    }
  },
  getWordRangeAtPosition() {
    fail(`Unexpected call to TextDocument.getWordRangeAtPosition.`);
    throw new Error(`Unexpected call to TextDocument.getWordRangeAtPosition.`);
  },
  validateRange() {
    fail(`Unexpected call to TextDocument.validateRange.`);
    throw new Error(`Unexpected call to TextDocument.validateRange.`);
  },
  validatePosition() {
    fail(`Unexpected call to TextDocument.validatePosition.`);
    throw new Error(`Unexpected call to TextDocument.validatePosition.`);
  },
});

describe(`on activation`, () => {
  let context: vscode.ExtensionContext;

  beforeAll(() => {
    context = {
      subscriptions: [],
      workspaceState: {
        keys() {
          fail(`Unexpected call to Memento.keys.`);
          throw new Error(`Unexpected call to Memento.keys.`);
        },
        get() {
          fail(`Unexpected call to Memento.get.`);
          throw new Error(`Unexpected call to Memento.get.`);
        },
        async update() {
          fail(`Unexpected call to Memento.update.`);
        },
      },
      globalState: {
        keys() {
          fail(`Unexpected call to Memento.keys.`);
          throw new Error(`Unexpected call to Memento.keys.`);
        },
        setKeysForSync() {
          fail(`Unexpected call to Memento.setKeysForSync.`);
        },
        get() {
          fail(`Unexpected call to Memento.get.`);
          throw new Error(`Unexpected call to Memento.get.`);
        },
        async update() {
          fail(`Unexpected call to Memento.update.`);
        },
      },
      extensionPath: `Example Extension Path`,
      asAbsolutePath(relativePath: string): string {
        fail(`Unexpected call to context.asAbsolutePath.`);
        return relativePath;
      },
      storagePath: `Example Storage Path`,
      globalStoragePath: `Example Global Storage Path`,
      logPath: `Example Log Path`,
      extensionUri: {} as unknown as vscode.Uri,
      secrets: {
        async get() {
          fail(`Unexpected call to secrets.get.`);
          return undefined;
        },
        async store() {
          fail(`Unexpected call to secrets.store.`);
        },
        async delete() {
          fail(`Unexpected call to secrets.delete.`);
        },
        onDidChange: () => {
          fail(`Unexpected call to secrets.onDidChange.`);
          throw new Error(`Unexpected call to secrets.onDidChange.`);
        },
      },
      environmentVariableCollection: {
        persistent: false,
        replace() {
          fail(`Unexpected call to environmentVariableCollection.replace.`);
        },
        append() {
          fail(`Unexpected call to environmentVariableCollection.append.`);
        },
        prepend() {
          fail(`Unexpected call to environmentVariableCollection.prepend.`);
        },
        get() {
          fail(`Unexpected call to environmentVariableCollection.get.`);
          return undefined;
        },
        forEach() {
          fail(`Unexpected call to environmentVariableCollection.forEach.`);
        },
        delete() {
          fail(`Unexpected call to environmentVariableCollection.delete.`);
        },
        clear() {
          fail(`Unexpected call to environmentVariableCollection.clear.`);
        },
      },
      globalStorageUri: {} as unknown as vscode.Uri,
      storageUri: {} as unknown as vscode.Uri,
      logUri: {} as unknown as vscode.Uri,
      extension: {
        id: `Example Extension Id`,
        extensionUri: {} as unknown as vscode.Uri,
        extensionPath: `Example Extension Path`,
        isActive: false,
        packageJSON: {},
        extensionKind: 1,
        exports: null,
        async activate() {
          fail(`Unexpected call to context.extension.activate.`);
        },
      },
      extensionMode: 3,
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const extension = rewire(`.`);

    extension.__set__(`vscode`, {
      Range,
      Position,
      Disposable,
      WorkspaceEdit,
      languages: {
        registerRenameProvider(
          documentSelector: vscode.DocumentSelector,
          renameProvider: vscode.RenameProvider
        ) {
          return {
            mockedRenameProvider: {
              documentSelector,
              renameProvider,
            },
          };
        },
      },
    });

    extension[`activate`](context);
  });

  it(`adds one disposable item to the context with the expected number of providers`, () => {
    expect(context.subscriptions).toEqual([
      {
        mockedDisposableOf: [jasmine.anything()],
      },
    ]);
  });

  describe(`rename provider`, () => {
    let renameProvider: {
      readonly mockedRenameProvider: {
        readonly documentSelector: vscode.DocumentSelector;
        readonly renameProvider: vscode.RenameProvider;
      };
    };

    beforeAll(() => {
      renameProvider = (
        context.subscriptions[0] as unknown as {
          readonly mockedDisposableOf: ReadonlyArray<Record<string, unknown>>;
        }
      ).mockedDisposableOf.find((item) => `mockedRenameProvider` in item) as {
        readonly mockedRenameProvider: {
          readonly documentSelector: vscode.DocumentSelector;
          readonly renameProvider: vscode.RenameProvider;
        };
      };
    });

    it(`is included`, () => {
      expect(renameProvider).not.toBeUndefined();
    });

    it(`uses the correct document selector`, () => {
      expect(renameProvider.mockedRenameProvider.documentSelector).toEqual({
        scheme: `file`,
        language: `skitscript`,
      });
    });

    describe(`provideRenameEdits`, () => {
      describe(`when the document cannot be parsed`, () => {
        let output: vscode.ProviderResult<vscode.WorkspaceEdit>;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B isnt Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              `Example Identifier`,
              {} as vscode.CancellationToken
            );
        });

        it(`returns null`, () => {
          expect(output).toBeNull();
        });
      });

      describe(`when the cursor is before the first character of an identifier`, () => {
        let output: vscode.ProviderResult<vscode.WorkspaceEdit>;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 9) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );
        });

        it(`returns null`, () => {
          expect(output).toBeNull();
        });
      });

      describe(`when the cursor is after the last character of an identifier`, () => {
        let output: vscode.ProviderResult<vscode.WorkspaceEdit>;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 30) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );
        });

        it(`returns null`, () => {
          expect(output).toBeNull();
        });
      });

      describe(`when the cursor is on the first character of an identifier`, () => {
        let output: vscode.ProviderResult<vscode.WorkspaceEdit>;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 10) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );
        });

        it(`returns the expected workspace edit`, () => {
          const expected = new WorkspaceEdit();

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(1, 10), new Position(1, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(4, 10), new Position(4, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(6, 10), new Position(6, 30)),
            `Example Identifier C`
          );

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit);
        });
      });

      describe(`when the cursor is in the middle of an identifier`, () => {
        let output: vscode.ProviderResult<vscode.WorkspaceEdit>;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );
        });

        it(`returns the expected workspace edit`, () => {
          const expected = new WorkspaceEdit();

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(1, 10), new Position(1, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(4, 10), new Position(4, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(6, 10), new Position(6, 30)),
            `Example Identifier C`
          );

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit);
        });
      });

      describe(`when the cursor is on the last character of an identifier`, () => {
        let output: vscode.ProviderResult<vscode.WorkspaceEdit>;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 29) as vscode.Position,
              ` \n \r \t Example Identifier C \n \r \t `,
              {} as vscode.CancellationToken
            );
        });

        it(`returns the expected workspace edit`, () => {
          const expected = new WorkspaceEdit();

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(1, 10), new Position(1, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(4, 10), new Position(4, 30)),
            `Example Identifier C`
          );

          expected.replace(
            `Example Text Document Uri`,
            new Range(new Position(6, 10), new Position(6, 30)),
            `Example Identifier C`
          );

          expect(output).toEqual(expected as unknown as vscode.WorkspaceEdit);
        });
      });

      describe(`when the identifier is invalid`, () => {
        let output: vscode.ProviderResult<vscode.WorkspaceEdit>;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.provideRenameEdits(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              ` \n \r \t Example (Invalid) Identifier \n \r \t `,
              {} as vscode.CancellationToken
            );
        });

        it(`returns null`, () => {
          expect(output).toBeNull();
        });
      });
    });

    describe(`prepareRename`, () => {
      describe(`when the document cannot be parsed`, () => {
        let output: vscode.ProviderResult<
          Range | { range: Range; placeholder: string }
        >;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B isnt Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              {} as vscode.CancellationToken
            );
        });

        it(`returns null`, () => {
          expect(output).toBeNull();
        });
      });

      describe(`when the cursor is before the first character of an identifier`, () => {
        let output: vscode.ProviderResult<
          Range | { range: Range; placeholder: string }
        >;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 9) as vscode.Position,
              {} as vscode.CancellationToken
            );
        });

        it(`returns null`, () => {
          expect(output).toBeNull();
        });
      });

      describe(`when the cursor is after the last character of an identifier`, () => {
        let output: vscode.ProviderResult<
          Range | { range: Range; placeholder: string }
        >;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 30) as vscode.Position,
              {} as vscode.CancellationToken
            );
        });

        it(`returns null`, () => {
          expect(output).toBeNull();
        });
      });

      describe(`when the cursor is on the first character of an identifier`, () => {
        let output: vscode.ProviderResult<
          Range | { range: Range; placeholder: string }
        >;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 10) as vscode.Position,
              {} as vscode.CancellationToken
            );
        });

        it(`returns the expected workspace edit`, () => {
          expect(output).toEqual({
            range: new Range(new Position(4, 10), new Position(4, 30)),
            placeholder: `Example Identifier B`,
          });
        });
      });

      describe(`when the cursor is in the middle of an identifier`, () => {
        let output: vscode.ProviderResult<
          Range | { range: Range; placeholder: string }
        >;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 24) as vscode.Position,
              {} as vscode.CancellationToken
            );
        });

        it(`returns the expected workspace edit`, () => {
          expect(output).toEqual({
            range: new Range(new Position(4, 10), new Position(4, 30)),
            placeholder: `Example Identifier B`,
          });
        });
      });

      describe(`when the cursor is on the last character of an identifier`, () => {
        let output: vscode.ProviderResult<
          Range | { range: Range; placeholder: string }
        >;

        beforeAll(() => {
          output =
            renameProvider.mockedRenameProvider.renameProvider.prepareRename?.(
              createTextDocument(
                `Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Example Identifier B is Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.
Location: Example Identifier B.
Location: Example Identifier A.`
              ),
              new Position(4, 29) as vscode.Position,
              {} as vscode.CancellationToken
            );
        });

        it(`returns the expected range`, () => {
          expect(output).toEqual({
            range: new Range(new Position(4, 10), new Position(4, 30)),
            placeholder: `Example Identifier B`,
          });
        });
      });
    });
  });
});