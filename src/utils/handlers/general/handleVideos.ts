import { CommandContext } from "../../../structures/CommandContext";
import { parseHTMLElements } from "../../parseHTMLElements";
import { ButtonPagination } from "../../ButtonPagination";
import { ServerQueue } from "../../../structures/ServerQueue";
import { Rawon } from "../../../structures/Rawon";
import { createEmbed } from "../../createEmbed";
import { ISong } from "../../../typings";
import { chunk } from "../../chunk";
import i18n from "../../../config";
import { play } from "./play";
import { Message, StageChannel, Util, VoiceChannel } from "discord.js";
import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";

export async function handleVideos(client: Rawon, ctx: CommandContext, toQueue: ISong[], voiceChannel: StageChannel | VoiceChannel): Promise<Message | undefined> {
    const wasIdle = ctx.guild?.queue?.idle;

    async function sendPagination(): Promise<void> {
        for (const song of toQueue) {
            ctx.guild?.queue?.songs.addSong(song, ctx.member!);
        }

        const opening = i18n.__mf("utils.generalHandler.handleVideoInitial", { length: toQueue.length });
        const pages = await Promise.all(chunk(toQueue, 10).map(async (v, i) => {
            const texts = await Promise.all(v.map((song, index) => `${(i * 10) + (index + 1)}.) ${Util.escapeMarkdown(parseHTMLElements(song.title))}`));

            return texts.join("\n");
        }));
        const embed = createEmbed("info", opening);
        const msg = await ctx.reply({ embeds: [embed] }, true);

        return new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, e, p) => {
                e.setDescription(`\`\`\`\n${opening}${p}\`\`\``).setFooter({ text: `• ${i18n.__mf("reusable.pageFooter", { actual: i + 1, total: pages.length })}` });
            },
            embed,
            pages
        }).start();
    }

    if (ctx.guild?.queue) {
        await sendPagination();

        if (wasIdle) {
            void play(client, ctx.guild, undefined, wasIdle);
        }

        return;
    }

    ctx.guild!.queue = new ServerQueue(ctx.channel!);
    await sendPagination();

    try {
        const connection = joinVoiceChannel({
            adapterCreator: ctx.guild!.voiceAdapterCreator as DiscordGatewayAdapterCreator,
            channelId: voiceChannel.id,
            guildId: ctx.guild!.id,
            selfDeaf: true
        }).on("debug", message => {
            client.logger.debug(message);
        });
        ctx.guild!.queue.connection = connection;
    } catch (error) {
        ctx.guild?.queue.songs.clear();
        delete ctx.guild!.queue;

        client.logger.error("PLAY_CMD_ERR:", error);
        void ctx.channel!.send({
            embeds: [createEmbed("error", i18n.__mf("utils.generalHandler.errorJoining", { message: `\`${(error as Error).message}\`` }), true)]
        }).catch(e => {
            client.logger.error("PLAY_CMD_ERR:", e);
        });
        return;
    }

    void play(client, ctx.guild!);
}