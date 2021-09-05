import ThePlugin from "../main";
import { genericFuzzySuggester, suggesterItem } from "./genericFuzzySuggester";
import * as transporter from "../utils/transporterFunctions"
import { Notice, MarkdownView } from "obsidian";

export default class pluginCommands {
    plugin: ThePlugin;
    commands = [
        {
            caption: "Select current line", shortcut: "SL", menu: true, icon: "highlight-glyph",
            command: async (): Promise<void> => transporter.selectCurrentLine()
        },
        {
            caption: "Select current line and expand up into previous block", shortcut: "SP", menu: true, icon: "highlight-glyph",
            command: async (): Promise<void> => transporter.selectCurrentSection(true)
        },
        {
            caption: "Select current line and expand down into next block", shortcut: "SN", menu: true, icon: "highlight-glyph",
            command: async (): Promise<void> => transporter.selectCurrentSection(false)
        },
        {
            caption: "Add block ref ID's to selection", shortcut: "ABI", menu: true, icon: "blocks",
            command: async (): Promise<Array<string>> => transporter.addBlockRefsToSelection()
        },
        {
            caption: "Copy current block to clipboard as a block reference", shortcut: "CC", menu: true, icon: "blocks",
            command: async (): Promise<string> => transporter.copyBlockRefToClipboard()
        },
        {
            caption: "Copy line/selection to another file", shortcut: "CLT", menu: true, icon: "right-arrow-with-tail",
            command: async (): Promise<void> => transporter.copyOrPushLineOrSelectionToNewLocation(this.plugin, true)
        },
        {
            caption: "Push line/selection to another file", shortcut: "PLT", menu: true, icon: "right-arrow-with-tail",
            command: async (): Promise<void> => transporter.copyOrPushLineOrSelectionToNewLocation(this.plugin, false)
        },
        {
            caption: "Push line/selection to another file as Block Ref", shortcut: "PLB", menu: true, icon: "right-arrow-with-tail",
            command: async (): Promise<void> => transporter.pushBlockReferenceToAnotherFile(this.plugin)
        },
        {
            caption: "Copy line(s) from another file", shortcut: "CLF", menu: true, icon: "left-arrow-with-tail",
            command: async (): Promise<void> => transporter.copyOrPulLineOrSelectionFromAnotherLocation(this.plugin, true)
        },
        {
            caption: "Pull line(s) from another file", shortcut: "LLF", menu: true, icon: "left-arrow-with-tail",
            command: async (): Promise<void> => transporter.copyOrPulLineOrSelectionFromAnotherLocation(this.plugin, false)
        },
        {
            caption: "Pull line(s) from another file as block", shortcut: "LLB", menu: true, icon: "left-arrow-with-tail",
            command: async (): Promise<void> => transporter.pullBlockReferenceFromAnotherFile(this.plugin)
        },
    ];

    async reloadPlugin() {
        new Notice('Reloading plugin: ' + this.plugin.appName);
        // @ts-ignore
        await app.plugins.disablePlugin('obsidian42-text-transporter');
        // @ts-ignore
        await app.plugins.enablePlugin('obsidian42-text-transporter')
    }

    async masterControlProgram() { // Yes this is a reference to Tron https://www.imdb.com/title/tt0084827/
        const currentView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if(!currentView || currentView.getMode()!=="source") {
            new Notice("No document in edit mode");
            return;
        }
        
        const gfs = new genericFuzzySuggester(this.plugin);
        let cpCommands: Array<suggesterItem> = [];
        for (let cmd of this.commands)
            cpCommands.push({ display: cmd.caption, info: cmd.command });
        if(this.plugin.settings.enableDebugMode)
            cpCommands.push({display: "Reload plugin (Debugging)", info:  async (): Promise<void> => this.reloadPlugin() })
        
        gfs.setSuggesterData(cpCommands);
        gfs.display(async (i: any, evt: MouseEvent | KeyboardEvent) => i.item.info(evt)); //call the callback
    }

    constructor(plugin: ThePlugin) {
        this.plugin = plugin
        // Combined function
        this.plugin.addCommand({
            id: this.plugin.appID + '-combinedCommands', name: 'All Commands List',
            editorCallback: async () => {
                await this.masterControlProgram();
            }
        });

        this.plugin.registerEvent(
            this.plugin.app.workspace.on("editor-menu", (menu) => {
                for (let [key, value] of Object.entries(this.commands)) {
                    if (value.menu === true) {
                        menu.addItem(item => {
                            item
                                .setTitle(value.caption)
                                .setIcon(value.icon)
                                .onClick(async () => { await value.command() });
                        });
                    }
                }
            })
        );

        for (let [key, value] of Object.entries(this.commands)) {
            this.plugin.addCommand({
                id: this.plugin.appID + "-" + key.toString(),
                icon: value.icon,
                name: `${value.caption} (${value.shortcut})`,
                editorCallback: value.command
            });
        }
    }
}

