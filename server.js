const {
  Client
} = require('discord.js');
const yt = require('ytdl-core');
const tokens = require('./tokens.json');
const client = new Client();

let dispatcher;
var lastmessager;

let queue = {};

const streamOptions = {
  seek: 0,
  volume: 0.06,
  audioonly: true
};

var pääpäivä = false;
let date = [0, 0, 0];


function changeTitle(text) {
  client.user.setPresence({
    game: {
      name: text + " | " + tokens.prefix + "apustus",
      type: 2
    }
  });
}

setInterval(function() {
  var pv = new Date();
  pvd = [pv.getDate(), pv.getMonth(), pv.getYear()];
  var day = pv.getDay();

  if (pvd[0] == date[0] && pvd[1] == date[1] && pvd[2] == date[2]) {
    pääpäivä = true;
  } else {
    pääpäivä = false;
    date = [0, 0, 0];
  }

  if (pääpäivä == true) {
    changeTitle("PÄÄPÄIVÄ");
    return;
  } else if (day === 3) {
    changeTitle("Wednesday");
    return;
  } else {
    changeTitle("ttunes");
  }

  commands.start(lastmessager);


}, 1000);


const commands = {


  'join': (msg) => {
    return new Promise((resolve, reject) => {
      const voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('En voinut liittyä voicekannulle...');
      voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
    });
  },

  'start': (msg) => {

    if (msg === undefined || msg === null) {
      return;
    } else {
    // LAITTAA SOITTIMEN PÄÄLLE //

    //if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Laita ttuneja kirjoittamalla ${tokens.prefix}add ja yt-linkki!`);
    if (!msg.guild.voiceConnection) return commands.join(msg);
    if (queue[msg.guild.id].playing || queue[msg.guild.id].playing == undefined) return;

    queue[msg.guild.id].playing = true;

    (function play(song) {
      console.log(song);
      if (song === undefined) {
        queue[msg.guild.id].playing = false;
        msg.member.voiceChannel.leave();
      };
      msg.channel.sendMessage(`Soitetaan: **${song.title}**, jäbän **${song.requester}** toiveesta!`);
      dispatcher = msg.guild.voiceConnection.playStream(yt(song.url), streamOptions);
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
  }
  },


  'play': (msg, manual=null) => {
    lastmessager = msg;
    // ADDAA TTUNEN JONOON //
    let url;
    if (manual !== null) {
      url = manual;
    } else {
      url = msg.content.split(' ')[1];
      if (url == '' || url === undefined) return msg.channel.sendMessage(`Laita Youtube linkki tai id tämän jälkeen: ${tokens.prefix}add`);
    }
    yt.getInfo(url, (err, info) => {
      if (err) return msg.channel.sendMessage('Kelvotonta linkkiä: ' + err);
      if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
      queue[msg.guild.id].songs.push({
        url: url,
        title: info.title,
        requester: msg.author.username
      });
      msg.channel.sendMessage(`**${info.title}** jonossa!`);
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
  'reboot': (msg) => {
    if (msg.author.id == tokens.adminID) process.exit(); //Requires a node module like Forever to work.
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
    }
  },

  'pääpäivä_on': (msg) => {
    if (msg.member.roles.some(r => ["Admin", "Aktiivinen"].includes(r.name))) {
      var d = new Date();
      date = [d.getDate(), d.getMonth(), d.getYear()];
      if (pääpäivä == true) {
        msg.channel.send("Tänään on jo pääpäivä!");

      } else {
        pääpäivä = true;
        console.log("pääpäivä asetettu " + date);
        msg.channel.send("Pääpäivä päätetty! Tänään on pääpäivä!");

        var linkki = "https://www.youtube.com/watch?v=687_ZGkP6OU";

        commands.add(msg, linkki);

        /////////////////
        /////////////////
        commands.play(msg);
        /////////////////
        /////////////////

      }
    } else {
      msg.channel.send("Sulla ei oo oikeuksia määrittää pääpäivää t. bOtter");
    }
  },
  'pääpäivä_ei': (msg) => {
    if (msg.member.roles.some(r => ["Admin", "Aktiivinen"].includes(r.name))) {

      date = [0, 0, 0];

      if (pääpäivä) {
        msg.channel.send("pääpäivä on peruttu :(");
      } else {
        msg.channel.send("Eihä tänää ollukkaa pääpäivä...");

      }
      pääpäivä = false;
      console.log("pääpäivä postettu");

      if (dispatcher === null || dispatcher === undefined) {
      } else {
      dispatcher.end();
    }

    } else {
      msg.channel.send("Sinähän et täällä rupea pääpäivää säätelemään!");
    }
  },
  'wednesday': (msg) => {

    //IS IT WEDNESDAY MY DUDES?
    let pvmaara = new Date();

    let day = pvmaara.getDay();
    console.log(pvmaara + " " + day);

    if (day == 3) {
      msg.channel.send({
        files: ["https://imgur.com/NcE2HFK"]
      });
    } else {
      msg.channel.send({
        files: ["https://imgur.com/hlNUbYt"]
      });
    }

  },
  'kruuna': (msg) => {

    tulos = Math.floor(Math.random() * Math.floor(2));

    if (tulos === 1) {
      msg.channel.send("Klaava, " + "hävisit " + msg.author.username);
    } else {
      msg.channel.send("Kkruuna, " + "voitit " + msg.author.username);
    }
  },
  'klaava': (msg) => {

    tulos = Math.floor(Math.random() * Math.floor(2));

    if (tulos === 1) {
      msg.channel.send("Kruuna, " + "hävisit " + msg.author.username);
    } else {
      msg.channel.send("Kklaava, " + "voitit " + msg.author.username);
    }
  },

  'onkokarvisvammanen': (msg) => {
    msg.channel.send("ON");
  },

  'onkovammanen': (msg) => {
    let jaba = msg.content.split(' ')[1];
    if ((jaba == '' || jaba === undefined)) return msg.channel.sendMessage(`Ketä tarkoitat?`);

    tulos = Math.floor(Math.random() * Math.floor(2));

    if (tulos === 1) {
      msg.channel.send(jaba + " on vammanen.");
    } else {
      msg.channel.send(jaba + " ei ole vammanen");
    }

  },
  'apustus': (msg) => {
    msg.channel.send({
      embed: {
        color: 3447003,

        title: "**__Komennot:__**",
        fields: [{
            name: tokens.prefix + "pääpäivä",
            value: "Kertoo onko pääpäivä."
          },
          {
            name: tokens.prefix + "pääpäivä_on",
            value: "Asettaa kyseisen päivän pääpäiväksi."
          },
          {
            name: tokens.prefix + "pääpäivä_ei",
            value: "Lopettaa pääpäivän."
          },
          {
            name: tokens.prefix + "wednesday",
            value: "Tarkistaa onko keskiviikko."
          },
          {
            name: tokens.prefix + "kruuna/klaava",
            value: "Heittää rahea"
          },
          {
            name: tokens.prefix + "onkokarvisvammanen",
            value: "Kertoo onko karvis vammanen"
          },
          {
            name: tokens.prefix + "onkovammanen",
            value: "!onkovammanen + käyttäjänimi kertoo onko hän vammanen"
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
  }

};

client.on('ready', () => {
  console.log('ready!');
});


function reagoi(sanalist, emojilist, msg) {
  var f = false;
  for (var sana of sanalist) {
    if (sana.test(msg.content) === true) {
      f = true;
    }
  }
  if (!f) return;
  for (var emo of emojilist) {
    var emoji = msg.guild.emojis.find('name', emo);
    msg.react(emoji);
  }
}

client.on('message', msg => {

  //REAGOI EMOTEJA VALITTUIHIN SANOIHIN
  var sanat = [/homo/, /autisti/];
  var emojit = ["sasu", "karvis"];

  reagoi(sanat, emojit, msg);

  if (!msg.content.startsWith(tokens.prefix)) return;
  if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);
});

client.login(tokens.d_token);
