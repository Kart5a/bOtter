const {
  Client
} = require('discord.js');
const yt = require('ytdl-core');
const tokens = require('./tokens.json');
var firebase = require('firebase');
const client = new Client();

let voiceChannel;
let dispatcher;
var lastmessager;
let queue = {};

const streamOptions = {
  seek: 0,
  volume: 0.06,
  audioonly: true
};

var pääpäivä = false;
var dj = null;
let date = [0, 0, 0];

var config = {
  apiKey: "AIzaSyCRlwc_0YwgbeY12i9Bhe3oIcCHwyJbcm8",
  authDomain: "botter-bot.firebaseapp.com",
  databaseURL: "https://botter-bot.firebaseio.com",
  projectId: "botter-bot",
  storageBucket: "botter-bot.appspot.com",
  messagingSenderId: "963103793875"
};

firebase.initializeApp(config);

var database = firebase.database();
var ref = database.ref('profiles');

var data;
ref.on('value', gotData, errData);

function gotData(_data) {
  data = _data.val();
}

function errData(err) {
  console.log("Error!");
  console.log(err);
}

function changeTitle(text) {
  client.user.setPresence({
    game: {
      name: text + " | " + tokens.prefix + "apustus",
      type: 2
    }
  });
}

function printSlot(_eka, _toka, _kolmas, _voitto, target_id, msg) {

  ref.on('value', gotData, errData);

  var rahat = "" + data[target_id]["rahat"];
  var väli1 = " ".repeat(8 - rahat.length);
  var str = "Rahat: " + rahat + väli1 + "|▇ " + _eka + " ▇▇ " + _toka + " ▇▇ " + _kolmas + " ▇|" + "\nVoitit: " + _voitto;

  msg.channel.send(str);

}

function printProfile(target_id, msg) {

  ref.on('value', gotData, errData);

  var nimi = data[target_id]["name"];
  var motto = data[target_id]["motto"];
  var kuvaus = data[target_id]["kuvaus"];
  var kuva = data[target_id]["kuva"];
  var rahat = data[target_id]["rahat"];

  var avatar;

  client.fetchUser(target_id).then(myUser => {
    avatar = myUser.avatarURL;
    laheta(avatar);
  });

  function laheta(avatar) {

    msg.channel.send({
      "embed": {
        "title": "***DISCORDPROFIILI***",
        "color": 15466496,
        "thumbnail": {
          "url": avatar
        },
        "image": {
          "url": kuva
        },
        "fields": [{
            "name": "***___Nimi:___***",
            "value": nimi
          },
          {
            "name": "***___Motto:___***",
            "value": motto
          },
          {
            "name": "***___Kuvaus:___***",
            "value": kuvaus
          },
          {
            "name": "***___Rahat:___***",
            "value": rahat
          }
        ]
      }
    });
  }
}

setInterval(function() {
  ref.on('value', gotData, errData);
  var pv = new Date();
  pvd = [pv.getDate(), pv.getMonth(), pv.getYear()];
  var day = pv.getDay();

  if (pvd[0] == date[0] && pvd[1] == date[1] && pvd[2] == date[2]) {
    pääpäivä = true;
  } else {
    pääpäivä = false;
    dj = null;
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

}, 60000);


const commands = {
  'give': (msg) => {
    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];

    if ((name == '' || name === undefined)) return msg.channel.sendMessage(`Kirjoita !give ja summa`);
    if (isNaN(amount)) return msg.channel.sendMessage(`Voit siirtää vain rahea, et muuta...`);

    name = name.replace(/\D/g, '');

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return msg.channel.sendMessage(`Kelvoton nimi.`);

    ref.on('value', gotData, errData);

    var target_id = name;
    var sender_id = msg.author.id;

    if (data[sender_id]["rahat"] == null || data[sender_id]["rahat"] == undefined) {
      data[sender_id]["rahat"] = 100;
    }
    if (data[sender_id]["rahat"] < parseInt(amount)) return msg.channel.sendMessage(`Sulla ei oo tarpeeks rahea...`);
    if (data[target_id]["rahat"] == null || data[target_id]["rahat"] == undefined) {
      data[target_id]["rahat"] = 100;
    }

    data[target_id]["rahat"] += parseInt(amount);
    data[sender_id]["rahat"] -= parseInt(amount);

    firebase.database().ref('profiles').set(data);
    msg.channel.send("Rahet siirretty!");

  },

  'money': (msg) => {

    let name = msg.content.split(' ')[1];
    ref.on('value', gotData, errData);
    var sender_id = msg.author.id;

    if (data[sender_id]["rahat"] == null || data[sender_id]["rahat"] == undefined) {
      data[sender_id]["rahat"] = 100;
    }

    if ((name == '' || name === undefined)) return msg.channel.sendMessage(`Sulla on rahaa ` + data[sender_id]["rahat"]);

    name = name.replace(/\D/g, '');

    var target_id = name;


    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return msg.channel.sendMessage(`Kelvoton nimi.`);

    if (data[target_id]["rahat"] == null || data[target_id]["rahat"] == undefined) {
      data[target_id]["rahat"] = 100;
    }

    msg.channel.send("Hänellä on rahaa " + data[target_id]["rahat"]);
  },

  'slot': (msg) => {
    const karvis = msg.guild.emojis.find("name", "karvis");
    const sasu = msg.guild.emojis.find("name", "sasu");
    const protect = msg.guild.emojis.find("name", "protect");
    const poggers = msg.guild.emojis.find("name", "poggers");
    const kys = msg.guild.emojis.find("name", "kys2");



    ref.on('value', gotData, errData);

    if (data[msg.author.id]["rahat"] < 10) return msg.channel.sendMessage(`Sulla ei oo varaa uhkapelata.`);
    data[msg.author.id]["rahat"] -= 10;

    var rulla = [];
    for (var i = 0; i < 3; i++) {
      var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
      if (rnd <= 40) {
        rulla.push(karvis);

      } else if (rnd <= 60) {
        rulla.push(sasu);
      } else if (rnd <= 80) {
        rulla.push(kys);
      } else if (rnd <= 90) {
        rulla.push(protect);
      } else {
        rulla.push(poggers);
      }
    }

    var voitto;
    if (rulla[0] == poggers && rulla[1] == poggers && rulla[2] == poggers) {
      voitto = 1000;
      data[msg.author.id]["rahat"] += voitto;
    } else if (rulla[0] == poggers && rulla[1] == poggers) {
      voitto = 30;
      data[msg.author.id]["rahat"] += voitto;
      // poggers x 2
    } else if (rulla[0] == poggers) {
      voitto = 10;
      data[msg.author.id]["rahat"] += voitto;
      // poggers x 1
    } else if (rulla[0] == rulla[1] && rulla[0] == rulla[2] && rulla[1] == rulla[2]) {

        if (rulla[0] == kys) {
          voitto = 40;
          data[msg.author.id]["rahat"] += voitto;
        } else if (rulla[0] == karvis || rulla[0] == sasu) {
          voitto = 100;
          data[msg.author.id]["rahat"] += voitto;
        } else if (rulla[0] == protect) {
          voitto = 60;
          data[msg.author.id]["rahat"] += voitto;
        }
      } else {
      voitto = 0;
    }

    firebase.database().ref('profiles').set(data);
    printSlot(rulla[0], rulla[1], rulla[2], voitto, msg.author.id, msg);


  },

  'dj': (msg) => {
    if (dj == null) {
      if (msg.member.voiceChannel === undefined) return msg.channel.send("Kaikkien ehdokkaiden pitää olla voicekannulla, myös sun!");
      var kannulla = msg.member.voiceChannel.members.keyArray();
      var rnd = Math.floor(Math.random() * Math.floor(kannulla.length + 1));
      dj = "<@" + kannulla[rnd] + ">";
      msg.channel.send("Pääpäivän DJ on " + dj + "!");
    } else {
      msg.channel.send("Pääpäivän DJ on jo valittu, ttunettaja on " + dj + "!");
    }

  },
  'wealthiest': (msg) => {
    ref.on('value', gotData, errData);

    var w_l = {};
    for (var id in data) {
      if (data[id]["rahat"] == null || data[id]["rahat"] == undefined) {
        data[id]["rahat"] = 100;
      }
      key = id;
      value = data[id]["rahat"];
      w_l[key] = value;
    }

    var items = Object.keys(w_l).map(function(key) {
      return {
        id: key,
        val: w_l[key]
      };
    });


    items = items.sort(function(a, b) {
      return ((a.val > b.val) ? -1 : ((a.val == b.val) ? 0 : 1));
    });

    lista = "";

    for (var i = 0; i < 5; i++) {
      lista += i + 1 + ". <@" + items[i].id + "> : " + items[i].val + "\n";
    }

    msg.channel.send({
      "embed": {
        "title": "***RIKKAIMMAT***",
        "color": 15466496,
        "description": lista
      },
    });
  },

  'profiles': (msg) => {
    ref.on('value', gotData, errData);

    var all_profiles = "";
    for (var id in data) {
      all_profiles += data[id]['name'] + "\n";
    }

    msg.channel.send({
      "embed": {
        "title": "***KAIKKI PROFIILIT***",
        "color": 15466496,
        "description": all_profiles
      },
    });
  },


  'profile': (msg) => {

    let name = msg.content.split(' ')[1];
    let category = msg.content.split(' ')[2];
    let all = msg.content.split(' ');
    let edit = "";
    for (var i = 3; i < all.length; i++) {
      edit += all[i] + " ";
    }

    if ((name == '' || name === undefined)) return msg.channel.sendMessage(`Kirjoita !profile ja discordnimi`);

    name = name.replace(/\D/g, '');

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return msg.channel.sendMessage(`Kelvoton nimi.`);

    ref.on('value', gotData, errData);

    var target_id = name;
    var sender_id = msg.author.id;

    if ((data[target_id] == undefined || data[target_id] == null) && category !== "luo") return msg.channel.send("Käyttäjällä ei ole profiilia! Luo profiili komennolla " + tokens.prefix + "profile <username> luo")

    if ((category == '' || category === undefined)) {

      printProfile(target_id, msg);

    } else {

      if ((category == "luo")) {

        var profile_name = msg.content.split(' ')[1];

        if (data[target_id] != undefined) return msg.channel.send("Käyttäjällä " + profile_name + " on jo profiili!");

        var empty = {
          "name": profile_name,
          "motto": "Tyhjä",
          "kuvaus": "Tyhjä",
          "kuva": null,
          "rahat": 100
        };

        data[target_id] = empty;

        firebase.database().ref('profiles').set(data);

        msg.channel.send("Profiili " + profile_name + " luotu!");

        return;
      }

      if (target_id === sender_id) return msg.channel.sendMessage("Et voi muokata omaa profiiliasi...");

      if (msg.member.roles.some(r => ["Admin", "Aktiivinen"].includes(r.name))) {

        ref.on('value', gotData, errData);

        if (category == "nimi") {

          data[target_id]["name"] = edit;
          msg.channel.send("Nimi vaihdettu!");

        } else if (category == "motto") {

          data[target_id]["motto"] = edit;
          msg.channel.send("Motto vaihdettu!");

        } else if (category == "kuvaus") {

          data[target_id]["kuvaus"] = edit;
          msg.channel.send("Kuvaus vaihdettu!");

        } else if (category == "kuva") {

          data[target_id]["kuva"] = edit;
          msg.channel.send("Kuva vaihdettu!");

        } else {
          msg.channel.sendMessage("Vialliset komennot...");
          return;
        }

        firebase.database().ref('profiles').set(data);

      } else {
        msg.channel.sendMessage("Vain Aktiiviset ja Adminit voi muuttaa profiileja!");
      }
    }
  },

  'join': (msg) => {
    return new Promise((resolve, reject) => {
      voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('En voinut liittyä voicekannulle...');
      voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
      console.log("Liityttiin voicekanavalle!");
    });
  },

  'play': (msg, manual = null, joining = false) => {

    if (joining === true) {
      startPlay(msg);
      return;
    } else {
      // ADDAA TTUNEN JONOON //
      var flag = false;
      let url;
      if (manual !== null) {
        url = manual;
      } else {
        url = msg.content.split(' ')[1];
        if (url == '' || url === undefined) return msg.channel.sendMessage(`Laita Youtube linkki tai ID tämän jälkeen: ${tokens.prefix}add`);
      }
      console.log("aloitetaan lataus");
      yt.getInfo(url, (err, info) => {
        if (err) return msg.channel.sendMessage('Kelvotonta linkkiä: ' + err);
        if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
        queue[msg.guild.id].songs.push({
          url: url,
          title: info.title,
          requester: msg.author.username
        });
        msg.channel.sendMessage(`**${info.title}** jonossa!`);
        console.log("biisi ladannut" + queue[msg.guild.id].songs);
        startPlay(msg);
      });
    }

    // ALKAA SOITTAA QUEUEA //
    function startPlay(msg) {
      if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg, null, true));
      if (queue[msg.guild.id].playing || queue[msg.guild.id].playing == undefined) return;


      queue[msg.guild.id].playing = true;

      (function play(song) {
        console.log(song);
        if (song === undefined) {
          console.log("biisi ei ollut havaiitavissa");
          queue[msg.guild.id].playing = false;
          voiceChannel.leave();
        };
        msg.channel.sendMessage(`Soitetaan: **${song.title}**, jäbän **${song.requester}** toiveesta!`);
        dispatcher = msg.guild.voiceConnection.playStream(yt(song.url), streamOptions);
        console.log("Ruvettiin soittamaan");
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
      changeTitle("PÄÄPÄIVÄ");
      if (pääpäivä == true) {
        msg.channel.send("Tänään on jo pääpäivä!");

      } else {
        pääpäivä = true;
        console.log("pääpäivä asetettu " + date);
        msg.channel.send("Pääpäivä päätetty! Tänään on pääpäivä!");

        var linkki = "https://www.youtube.com/watch?v=687_ZGkP6OU";

        commands.play(msg, linkki);

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

      msg.channel.send("Valitettavasti wednesdayn aplikaatio on vielä work in progress, mutta ON WEDNESDAY");
    } else {
      msg.channel.send("Valitettavasti wednesdayn aplikaatio on vielä work in progress, mutta ei oo wednesday :(");
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
            name: tokens.prefix + "profile + jäbän username + (luo / nimi / motto / kuvaus / kuva)",
            value: "Näyttää käyttäjän profiilin. Suluissa olevilla voi muokata."
          },
          {
            name: tokens.prefix + "profiles",
            value: "Näyttää kaikki tarjolla olevat profiilit."
          },
          {
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
            name: tokens.prefix + "DJ",
            value: "Arpoo pääpäivälle DJ:n!"
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
            name: tokens.prefix + "money + nimi",
            value: "Näyttää rahat"
          },
          {
            name: tokens.prefix + "wealthiest",
            value: "Näyttää listan rikkaimmista."
          },
          {
            name: tokens.prefix + "give + nimi",
            value: "Antaa rahaasi henkilölle."
          },
          {
            name: tokens.prefix + "slot",
            value: "Uhkapelaa rahaasi"
          },
          {
            name: tokens.prefix + "voittotaulu",
            value: "Näyttää voittotaulun (tulossa)"
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
            name: tokens.prefix + "play",
            value: "Laittaa ttunen jonoon ja soittaa sen"
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
  reagoi([/homo/, /autisti/], ["sasu", "karvis"], msg);
  reagoi([/kys/], ["kys2", "protect"], msg);


  if (!msg.content.startsWith(tokens.prefix)) return;
  if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);
});

client.login(tokens.d_token);
