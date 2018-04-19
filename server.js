const {
  Client
} = require('discord.js');
const yt = require('ytdl-core');
const tokens = require('./tokens.json');
const client = new Client();

let queue = {};

const streamOptions = {
  seek: 0,
  volume: 0.1,
  audioonly: true
};

var pääpäivä = false;
let date = [0, 0, 0];

const commands = {
  'play': (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Laita ttuneja kirjoittamalla ${tokens.prefix}add ja linkki!`);
    if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
    if (queue[msg.guild.id].playing) return msg.channel.sendMessage('Soitetaan jo!');
    let dispatcher;
    queue[msg.guild.id].playing = true;

    console.log(queue);
    (function play(song) {
      console.log(song);
      if (song === undefined) return msg.channel.sendMessage('Jono on tyhjä').then(() => {
        queue[msg.guild.id].playing = false;
        msg.member.voiceChannel.leave();
      });
      msg.channel.sendMessage(`Soitettaan: **${song.title}**, jäbän **${song.requester}** toiveesta!`);
      dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, streamOptions), {
        passes: tokens.passes
      });
      let collector = msg.channel.createCollector(m => m);
      collector.on('message', m => {
        if (m.content.startsWith(tokens.prefix + 'pause')) {
          msg.channel.sendMessage('Pauseettu').then(() => {
            dispatcher.pause();
          });
        } else if (m.content.startsWith(tokens.prefix + 'resume')) {
          msg.channel.sendMessage('Jatketaan').then(() => {
            dispatcher.resume();
          });
        } else if (m.content.startsWith(tokens.prefix + 'skip')) {
          msg.channel.sendMessage('Skipattu').then(() => {
            dispatcher.end();
          });
        } else if (m.content.startsWith(tokens.prefix + 'time')) {
          msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
        }
      });
      dispatcher.on('end', () => {
        collector.stop();
        play(queue[msg.guild.id].songs.shift());
      });
      dispatcher.on('error', (err) => {
        return msg.channel.sendMessage('error: ' + err).then(() => {
          collector.stop();
          play(queue[msg.guild.id].songs.shift());
        });
      });
    })(queue[msg.guild.id].songs.shift());
  },
  'join': (msg) => {
    return new Promise((resolve, reject) => {
      const voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('En voinut liittyä voicekannulle...');
      voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
    });
  },
  'add': (msg) => {
    let url = msg.content.split(' ')[1];
    if (url == '' || url === undefined) return msg.channel.sendMessage(`Laita Youtube linkki tai id tämän jälkeen: ${tokens.prefix}add`);
    yt.getInfo(url, (err, info) => {
      if (err) return msg.channel.sendMessage('Kelvotonta linkkiä: ' + err);
      if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
      queue[msg.guild.id].songs.push({
        url: url,
        title: info.title,
        requester: msg.author.username
      });
      msg.channel.sendMessage(`Laitetaan **${info.title}** jonoon!`);
    });
  },
  'queue': (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Laita ttuneja jonoon: ${tokens.prefix}add`);
    let tosend = [];
    queue[msg.guild.id].songs.forEach((song, i) => {
      tosend.push(`${i+1}. ${song.title} - Tilaaja: ${song.requester}`);
    });
    msg.channel.sendMessage(`__**${msg.guild.name}, Musiikki jono:**__ Nyt **${tosend.length}** ttunea jonossa ${(tosend.length > 15 ? '*[Näyttää vain 15 viimeisintä]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
  },
  'help': (msg) => {
    msg.channel.send({
      embed: {
        color: 3447003,

        title: "**__Komennot:__**",
        fields: [{
            name: tokens.prefix + "pääpäivä",
            value: "Kertoo onko pääpäivä."
          },
          {
            name: tokens.prefix + "onpääpäivä",
            value: "Asettaa kyseisen päivän pääpäiväksi."
          },
          {
            name: tokens.prefix + "eiolepääpäivä",
            value: "Lopettaa pääpäivän."
          },
          {
            name: tokens.prefix + "wednesday",
            value: "Tarkistaa onko keskiviikko."
          },
          {
            name: "**__ttuneBotti:__**",
            value: "Tässä kaikki ttuneBottiin liittyvät komennot:"
          },
          {
            name: tokens.prefix + "join",
            value: "ttuneBotti tulee kannulle"
          },
          {
            name: tokens.prefix + "add",
            value: "Laittaa ttunen jonoon"
          },
          {
            name: tokens.prefix + "play",
            value: "Alkaa soittamaan ttuneja jonosta"
          },
          {
            name: tokens.prefix + "queue",
            value: "Näyttää ttunejonon"
          },
          {
            name: tokens.prefix + "pause",
            value: "Keskeyttää ttunen"
          },
          {
            name: tokens.prefix + "resume",
            value: "Jatkaa ttunea"
          },
          {
            name: tokens.prefix + "skip",
            value: "Hheittää ttunen rroskiin"
          },
          {
            name: tokens.prefix + "time",
            value: "Näyttää biisin soitetun ajan"
          },
          {
            name: "**__Muut:__**",
            value: "pixlPlace: https://pixlplace.herokuapp.com/"
          }
        ],
        timestamp: new Date(),
        footer: {
          icon_url: client.user.avatarURL,
          text: "© Kart5a & ddosSasu"
        }
      }
    });
  },
  'reboot': (msg) => {
    if (msg.author.id == tokens.adminID) process.exit(); //Requires a node module like Forever to work.
  },
  'onpääpäivä': (msg) => {
    if (msg.member.roles.some(r => ["Admin", "Aktiivinen"].includes(r.name))) {
      var d = new Date();
      date = [d.getDate(), d.getMonth(), d.getYear()];
      if (pääpäivä == true) {
        msg.channel.send("Tänään on jo pääpäivä!");

      } else {
        pääpäivä = true;
        console.log("pääpäivä asetettu " + date);
        msg.channel.send("Pääpäivä päätetty! Tänään on pääpäivä!");

        msg.member.voiceChannel.join();

        yt.getInfo("https://www.youtube.com/watch?v=687_ZGkP6OU", (err, info) => {
          if (err) return msg.channel.sendMessage('Kelvotonta linkkiä: ' + err);
          if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
          queue[msg.guild.id].songs.push({
            url: "https://www.youtube.com/watch?v=687_ZGkP6OU",
            title: "PÄÄPÄIVÄ",
            requester: "bOtter"
          });

          console.log(queue);
          (function play(song) {
            console.log(song);
            if (song === undefined) return msg.channel.sendMessage('Jono on tyhjä').then(() => {
              queue[msg.guild.id].playing = false;
              msg.member.voiceChannel.leave();
            });
            msg.channel.sendMessage(`Soitettaan PÄÄPÄIVÄ!`);
            dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, streamOptions), {
              passes: tokens.passes
            });
            let collector = msg.channel.createCollector(m => m);
            collector.on('message', m => {
              if (m.content.startsWith(tokens.prefix + 'pause')) {
                msg.channel.sendMessage('Pauseettu').then(() => {
                  dispatcher.pause();
                });
              } else if (m.content.startsWith(tokens.prefix + 'resume')) {
                msg.channel.sendMessage('Jatketaan').then(() => {
                  dispatcher.resume();
                });
              } else if (m.content.startsWith(tokens.prefix + 'skip')) {
                msg.channel.sendMessage('Skipattu').then(() => {
                  dispatcher.end();
                });
              } else if (m.content.startsWith(tokens.prefix + 'time')) {
                msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
              }
            });
            dispatcher.on('end', () => {
              collector.stop();
              play(queue[msg.guild.id].songs.shift());
            });
            dispatcher.on('error', (err) => {
              return msg.channel.sendMessage('error: ' + err).then(() => {
                collector.stop();
                play(queue[msg.guild.id].songs.shift());
              });
            });
          })(queue[msg.guild.id].songs.shift());

          client.user.setPresence({
            game: {
              name: "PÄÄPÄIVÄ | " + tokens.prefix + "help",
              type: 2
            }
          });
        });
      }
    } else {
      msg.channel.send("Sulla ei oo oikeuksia määrittää pääpäivää t. bOtter");
    }
  },
  'eiolepääpäivä': (msg) => {
    if (msg.member.roles.some(r => ["Admin", "Aktiivinen"].includes(r.name))) {

      date = [0, 0, 0];

      if (pääpäivä) {
        msg.channel.send("onpääpäivä peruttu :(");
      } else {
        msg.channel.send("Eihä tänää ollukkaa pääpäivä...");

      }
      pääpäivä = false;
      console.log("pääpäivä postettu");
      client.user.setPresence({
        game: {
          name: "ttunes | !help",
          type: 2
        }
      });
      dispatcher.end();
    } else {
      msg.channel.send("Sinähän et täällä rupea pääpäivää säätelemään!");
    }
  },
  'pääpäivä': (msg) => {
    var pv = new Date();
    pvd = [pv.getDate(), pv.getMonth(), pv.getYear()];

    if (pvd[0] == date[0] && pvd[1] == date[1] && pvd[2] == date[2]) {
      pääpäivä = true;
    } else {
      pääpäivä = false;
      console.log("pääpäivä loppu");
      date = [0, 0, 0];
    }

    if (pääpäivä == true) {
      msg.channel.send("Tänään on pääpäivä!");
    } else if (pääpäivä == false) {
      msg.channel.send("Tänään ei ole pääpäivä :(");
      client.user.setPresence({
        game: {
          name: "ttunes | !help",
          type: 2
        }
      });
    }
  },
  'wednesday': (msg) => {

    let pvmaara = new Date();
    let day = pvmaara.getDay();
    const is = {
      files: ["img/isWednesday.jpg"]
    };
    const no = {
      files: ["img/notWednesday.jpg"]
    };

    if (day == 3) {
      msg.channel.send("",is);
    } else {
      msg.channel.send("",no);
    }
  }

};

client.on('ready', () => {
  console.log('ready!');
});

client.on('message', msg => {

  //REAGOI EMOTEJA VALITTUIHIN SANOIHIN
  const sana1 = /homo/;
  const sana2 = /autisti/;
  if (sana1.test(msg.content) === true || sana2.test(msg.content) === true) {
    const sasu_emoji = msg.guild.emojis.find('name', 'sasu');
    const karvis_emoji = msg.guild.emojis.find('name', 'karvis');

    msg.react(sasu_emoji);
    msg.react(karvis_emoji);
  }

  if (!msg.content.startsWith(tokens.prefix)) return;
  if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);
});

client.login(tokens.d_token);
