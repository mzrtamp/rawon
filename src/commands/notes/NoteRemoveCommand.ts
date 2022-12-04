import { ApplicationCommandOptionType, bold } from "discord.js";
import { NoteMethods } from "../../database/methods/NoteMethods.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof NoteRemoveCommand>({
    name: "noteremove",
    description: "Remove note by providing name",
    usage: "{prefix} noteremove <name>",
    slash: {
        name: "noteremove",
        description: "Remove note by providing name",
        options: [
            {
                name: "name",
                description: "Name of the note",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    }
})
export class NoteRemoveCommand extends BaseCommand {
    private readonly noteMethod = new NoteMethods(this.client);

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const options = {
            name: ctx.args[0] ?? ctx.options?.getString("name", true)
        };

        if (!options.name) {
            if (!options.name) {
                await ctx.send({ embeds: [createEmbed("warn", "Name is required")] }, "editReply");
                return;
            }
        }

        const note = await this.noteMethod.deleteNoteByNameAndUserId(options.name, ctx.author.id);

        if (note.affected === 0) {
            await ctx.send(
                { embeds: [createEmbed("error", `No note with name ${bold(options.name)} found`)] },
                "editReply"
            );
            return;
        }

        await ctx.send(
            { embeds: [createEmbed("success", `Note ${bold(options.name)} is deleted successfully!`)] },
            "editReply"
        );
    }
}