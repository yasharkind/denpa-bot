const Discord = require('discord.js')
const Util = require('../classes/utils.js')

module.exports = {
  name: 'queue',
  aliases: ['q'],
  run: async (client, message, args) => {
    try {
      const queue = client.distube.getQueue(message)
      if (!queue) return message.channel.send(`${client.emotes.error} | There is nothing playing!`)
      let np = ''
      if (queue.songs.length > 0) {
        const firstSong = queue.songs[0]
        const isQueueRestored = !!firstSong.metadata?.fromRestoredQueue
        const requester = Util.sanitizeDiscordString(
          isQueueRestored ? firstSong.metadata.actualRequester : firstSong.user.username
        )

        np = `${Util.sanitizeDiscordString(firstSong.name)} - \`${firstSong.formattedDuration}\` \n
        Requested by \`${requester}\` ${isQueueRestored ? '**[RESTORED]**' : ''}\n
        <${firstSong.url}>`
      }
      let page = 0
      let pages = 0
      if (isNaN(args[0])) {
        page = 0
      } else {
        page = args[0] - 1
      }
      // 11 and -2 because must account for NP song
      pages = queue.songs.length <= 11 ? 1 : 1 + Math.trunc((queue.songs.length - 2) / 10)
      if (page >= pages) page = pages - 1
      let q = queue.songs
        .slice(1 + page * 10, 1 + (page + 1) * 10)
        .map((song, i) => {
          const requester = Util.sanitizeDiscordString(song.metadata?.actualRequester ?? song.user.username)
          return `${page * 10 + i + 1}. ${Util.sanitizeDiscordString(song.name)} - \`${
            song.formattedDuration
          }\` \`${requester}\``
        })
        .join('\n')

      // calculate total time remaining string
      const sumTime = queue.songs.reduce((accum, curSong) => accum + curSong.duration, 0)

      let formattedSumTime = ''
      const hourTime = Math.floor(sumTime / 3600)
      const minTime = Math.floor(sumTime / 60) % 60
      const secondTime = sumTime % 60
      const fillTwo = s => (s > 9 ? s : '0' + s)

      if (hourTime > 0) {
        formattedSumTime += `${fillTwo(hourTime)}:${fillTwo(minTime)}:`
      } else if (minTime > 0) {
        formattedSumTime += `${fillTwo(minTime)}:`
      }
      formattedSumTime += `${fillTwo(secondTime)}`

      if (q === '') q = 'Queue is empty'
      // const str = `${client.emotes.queue} | **Server Queue**\n${q}`
      const queueEmbed = new Discord.EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Now playing')
        .setThumbnail(queue.songs[0].thumbnail)
        .setDescription(np)
        .addFields({ name: `Queue (time left: \`${formattedSumTime}\`)`, value: q })
        // .setTimestamp()
        .setFooter({ text: `Page: ${page + 1} of ${pages}\n${queue.songs.length - 1} songs in queue` })

      message.channel.send({ embeds: [queueEmbed] })
    } catch (e) {
      message.channel.send(`${client.emotes.error} | ${e}`)
    }
  }
}
