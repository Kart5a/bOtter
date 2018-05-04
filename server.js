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

function printSlot(_eka, _toka, _kolmas, _voitto, target_id, msg, _panos) {

  ref.on('value', gotData, errData);

  var rahat = "" + data[target_id]["rahat"];
  var väli1 = " ".repeat(8 - rahat.length);
  var str = "Rahat: " + rahat + ", Panos: " + _panos + "\n\n" + "|    -    " + _eka + "    -    " + _toka + "    -    " + _kolmas + "    -    |" + "\n\nVoitit: " + _voitto;

  msg.channel.send({
    "embed": {
      "color": 15466496,
      "author": {
        "name": "SLOTTIPOTTI",
        "icon_url": "https://ih1.redbubble.net/image.517537251.7910/flat,800x800,075,f.u2.jpg"
      },
      "fields": [{
        "name": "***" + data[target_id]["name"] + "***",
        "value": str
      }]
    }
  });

}

function printProfile(target_id, msg) {

  ref.on('value', gotData, errData);

  var nimi = data[target_id]["name"];
  var motto = data[target_id]["motto"];
  var kuvaus = data[target_id]["kuvaus"];
  var kuva = data[target_id]["kuva"];
  var rahat = data[target_id]["rahat"];
  var aika = data[target_id]["aikakannuilla"];

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
          },
          {
            "name": "***___Aika kannulla:___***",
            "value": aika + " min"
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


  var keyarr = client.channels.keyArray();
  var v_channels = [];
  for (var i of keyarr) {
    var kan = client.channels.get(i);

    if (kan.type == 'voice' && kan.id != "300242143702679552") {
      var membrs = kan.members.keyArray();
      for (var m of membrs) {

        if (data[m]["rahat"] == undefined) {
          data[m]["rahat"] = 0;
        }

        data[m]["rahat"] += 1;
        if (data[m]["aikakannuilla"] == undefined) {
          data[m]["aikakannuilla"] = 0;
        }
        data[m]["aikakannuilla"] += 1;
      }
    }
  }
  console.log("intervallin loppu")
  firebase.database().ref('profiles').set(data);

}, 60000);


const commands = {

  'pelidata': (msg) => {

    ref.on('value', gotData, errData);
    let name = msg.content.split(' ')[1];

    if (name == undefined || name == "") {
      name = msg.author.id;
    }
    name = name.replace(/\D/g, '');
    var target_id = name;

    if (data[target_id]["pelit"] == undefined || data[target_id]["pelit"] == null) {
      data[target_id]["pelit"] = {
        "pelit": 0,
        "voitot": 0,
        "yhtsumma": 0,
        "sasu": 0,
        "karvis": 0,
        "kys": 0,
        "protect": 0,
        "poggers1": 0,
        "poggers2": 0,
        "poggers3": 0,
        "annetut": 0,
        "vastaanotetut": 0
      };
    }

    if (data[target_id]["rahat"] == null || data[target_id]["rahat"] == undefined) {
      data[target_id]["rahat"] = 100;
    }

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }
    if (!flag) return msg.channel.sendMessage(`Kelvoton nimi.`);

    var money = data[target_id]["rahat"];
    var pelit = data[target_id]["pelit"]["pelit"];
    var voitot = data[target_id]["pelit"]["voitot"];
    var yht = data[target_id]["pelit"]["yhtsumma"];
    var poggers3 = data[target_id]["pelit"]["poggers3"];
    var poggers2 = data[target_id]["pelit"]["poggers2"];
    var poggers1 = data[target_id]["pelit"]["poggers1"];
    var karvis1 = data[target_id]["pelit"]["karvis"];
    var sasu1 = data[target_id]["pelit"]["sasu"];
    var kys1 = data[target_id]["pelit"]["kys"];
    var protect1 = data[target_id]["pelit"]["protect"];
    var vast = data[target_id]["pelit"]["vastaanotetut"];
    var ann = data[target_id]["pelit"]["annetut"];

    msg.channel.send("```Nimi: " + data[target_id]["name"] + "\nPelit: " + pelit + "\n" + "Voitetut pelit: " + voitot + "\n" + "Kaikki voitot: " + yht + "\n\n" + "Poggers x 3: " + poggers3 + "\n" + "Poggers x 2: " + poggers2 + "\n" + "Poggers x 1: " + poggers1 + "\n" + "Karvis: " + karvis1 + "\n" + "Sasu: " + sasu1 + "\n" + "Kys: " + kys1 + "\n" + "Protect: " + protect1 + "\n\nAnnetut rahet: " + ann + "\nVastaanotetut rahet: " + vast + "```");

    firebase.database().ref('profiles').set(data);
  },

  "kaikkitaieimitään" : (msg) => {
    console.log("kaikki tai ei mitään aktivoitu");

    var pelaaja = msg.authot.id;

    if (data[pelaaja]["rahat"] == null || data[pelaaja]["rahat"] == undefined) {
      data[pelaaja]["rahat"] = 100;
    }

    var rnd = Math.floor(Math.random() * Math.floor(100 + 1));

    if (rnd >= 51) {
      data[pelaaja]["rahat"] *= 2;
      msg.channel.sendMessage("Nyt onnisti! Sulla on " + data[pelaaja]["rahat"] + ".");
    } else {
      data[pelaaja]["rahat"] *= 0;
      msg.channel.sendMessage("Päin vittua... Onnea kannulla hillumiseen.");
    }

    firebase.database().ref('profiles').set(data);
  },

  'anna': (msg) => {
    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];


    if ((name == '' || name === undefined)) return msg.channel.sendMessage(`Kirjoita !give ja summa`);
    if (isNaN(amount)) return msg.channel.sendMessage(amount + ` ei voida antaa :D`);

    if (parseInt(amount) < 0) {
      return msg.channel.sendMessage("Älä saatana yritä viedä toisilta kädestä");
    } else if (parseInt(amount) == 0) {
      return msg.channel.sendMessage("Et voi siirtää et mitään...");
    }

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

    if (data[target_id]["pelit"] == undefined || data[target_id]["pelit"] == null) {
      data[target_id]["pelit"] = {
        "pelit": 0,
        "voitot": 0,
        "yhtsumma": 0,
        "sasu": 0,
        "karvis": 0,
        "kys": 0,
        "protect": 0,
        "poggers1": 0,
        "poggers2": 0,
        "poggers3": 0,
        "annetut": 0,
        "vastaanotetut": 0
      };
    }
    if (data[sender_id]["pelit"] == undefined || data[sender_id]["pelit"] == null) {
      data[sender_id]["pelit"] = {
        "pelit": 0,
        "voitot": 0,
        "yhtsumma": 0,
        "sasu": 0,
        "karvis": 0,
        "kys": 0,
        "protect": 0,
        "poggers1": 0,
        "poggers2": 0,
        "poggers3": 0,
        "annetut": 0,
        "vastaanotetut": 0
      };
    }

    if (target_id == sender_id) return msg.channel.sendMessage(`Turhaa siirrät ittelles rahea...`);

    if (data[sender_id]["rahat"] == null || data[sender_id]["rahat"] == undefined) {
      data[sender_id]["rahat"] = 100;
    }
    if (data[sender_id]["rahat"] < parseInt(amount)) return msg.channel.sendMessage(`Sulla ei oo tarpeeks rahea...`);
    if (data[target_id]["rahat"] == null || data[target_id]["rahat"] == undefined) {
      data[target_id]["rahat"] = 300;
    }

    data[target_id]["rahat"] += parseInt(amount);
    data[sender_id]["rahat"] -= parseInt(amount);
    data[target_id]["pelit"]["vastaanotetut"] += parseInt(amount);
    data[sender_id]["pelit"]["annetut"] += parseInt(amount);


    firebase.database().ref('profiles').set(data);
    msg.channel.send("Rahet siirretty!");

  },

  'rahat': (msg) => {

    let name = msg.content.split(' ')[1];

    ref.on('value', gotData, errData);
    var sender_id = msg.author.id;

    if (data[sender_id]["rahat"] == null || data[sender_id]["rahat"] == undefined) {
      data[sender_id]["rahat"] = 100;
      firebase.database().ref('profiles').set(data);
    }

    if ((name == '' || name === undefined)) return msg.channel.sendMessage(`Sulla on ` + data[sender_id]["rahat"] + " rahea.");

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

    msg.channel.send("Hänellä on " + data[target_id]["rahat"] + " rahea.");
  },

  'voittotaulu' : (msg) => {

    const karvis = msg.guild.emojis.find("name", "karvis");
    const sasu = msg.guild.emojis.find("name", "sasu");
    const protect = msg.guild.emojis.find("name", "protect");
    const poggers = msg.guild.emojis.find("name", "poggers");
    const kys = msg.guild.emojis.find("name", "kys2");

    msg.channel.send({
      "embed": {
        "color": 15466496,
        "author": {
          "name": "SLOTTIPOTTI - VOITOT:",
          "icon_url": "https://ih1.redbubble.net/image.517537251.7910/flat,800x800,075,f.u2.jpg"
        },
        "fields": [{
          "name": (sasu+" ").repeat(3) + ":",
          "value": "8 x panos\n"
        },
        {
          "name": (karvis+" ").repeat(3) + ":",
          "value": "10 x panos\n"
        }
        ,
        {
          "name": (kys+" ").repeat(3) + ":",
          "value": "12 x panos\n"
        }
        ,
        {
          "name": (protect+" ").repeat(3) + ":",
          "value": "40 x panos\n"
        }
        ,
        {
          "name": poggers + " X X" + ":",
          "value": "2 x panos\n"
        }
        ,
        {
          "name": poggers + " " + poggers + " X" + ":",
          "value": "25 x panos\n"
        }
        ,
        {
          "name":  (poggers+" ").repeat(3) + ":",
          "value": "100 x panos\n"
        }
      ]
      }
    });


  },

  'slot': (msg) => {

    let panos = msg.content.split(' ')[1];
    if ((panos == '' || panos === undefined)) {
      panos = 10;
    }
    if (panos <= 0) return msg.channel.sendMessage(`Panos pitää olla positiivinen luku!`);
    panos = Math.floor(panos);

    const karvis = msg.guild.emojis.find("name", "karvis");
    const sasu = msg.guild.emojis.find("name", "sasu");
    const protect = msg.guild.emojis.find("name", "protect");
    const poggers = msg.guild.emojis.find("name", "poggers");
    const kys = msg.guild.emojis.find("name", "kys2");

    ref.on('value', gotData, errData);

    if (data[msg.author.id]["rahat"] < panos) return msg.channel.sendMessage(`Sulla ei oo varaa uhkapelata.`);
    data[msg.author.id]["rahat"] -= panos;

    const tpog = 10;
    const tsasu = 35;
    const tkarvis = 25;
    const tkys = 17.5;
    const tprotect = 12.6;

    const pog1_v = 2;
    const pog2_v = 25;
    const pog3_v = 100;
    const sasu_v = 8;
    const karvis_v = 10;
    const kys_v = 12;
    const protect_v = 40;

    var rulla = [];
    for (var i = 0; i < 3; i++) {
      var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
      if (rnd <= tkarvis) {
        rulla.push(karvis);
      } else if (rnd <= tsasu + tkarvis) {
        rulla.push(sasu);
      } else if (rnd <= tsasu + tkarvis + tkys) {
        rulla.push(kys);
      } else if (rnd <= tsasu + tkarvis + tprotect + tkys) {
        rulla.push(protect);
      } else {
        rulla.push(poggers);
      }
    }

    var voitto;
    if (data[msg.author.id]["pelit"] == undefined || data[msg.author.id]["pelit"] == null) {
      data[msg.author.id]["pelit"] = {
        "pelit": 0,
        "voitot": 0,
        "yhtsumma": 0,
        "sasu": 0,
        "karvis": 0,
        "kys": 0,
        "protect": 0,
        "poggers1": 0,
        "poggers2": 0,
        "poggers3": 0,
        "annetut": 0,
        "vastaanotetut": 0
      };
    }

    if (rulla[0] == poggers && rulla[1] == poggers && rulla[2] == poggers) {
      voitto = pog3_v * panos;
      data[msg.author.id]["rahat"] += voitto;
      if (data[msg.author.id]["pelit"]["poggers3"] == undefined) {
        data[msg.author.id]["pelit"]["poggers3"] = 0;
      }
      data[msg.author.id]["pelit"]["poggers3"] += 1;
    } else if (rulla[0] == poggers && rulla[1] == poggers) {
      voitto = pog2_v * panos;
      data[msg.author.id]["rahat"] += voitto;
      if (data[msg.author.id]["pelit"]["poggesr2"] == undefined) {
        data[msg.author.id]["pelit"]["poggers2"] = 0;
      }
      data[msg.author.id]["pelit"]["poggers2"] += 1;
      // poggers x 2
    } else if (rulla[0] == poggers) {
      voitto = pog1_v * panos;
      data[msg.author.id]["rahat"] += voitto;
      if (data[msg.author.id]["pelit"]["poggers1"] == undefined) {
        data[msg.author.id]["pelit"]["poggers1"] = 0;
      }
      data[msg.author.id]["pelit"]["poggers1"] += 1;
      // poggers x 1
    } else if (rulla[0] == rulla[1] && rulla[0] == rulla[2] && rulla[1] == rulla[2]) {

      if (rulla[0] == kys) {
        voitto = kys_v * panos;

        if (data[msg.author.id]["pelit"]["kys"] == undefined) {
          data[msg.author.id]["pelit"]["kys"] = 0;
        }
        data[msg.author.id]["pelit"]["kys"] += 1;
        data[msg.author.id]["rahat"] += voitto;

      } else if (rulla[0] == karvis) {
        voitto = karvis_v * panos;
        if (data[msg.author.id]["pelit"]["karvis"] == undefined) {
          data[msg.author.id]["pelit"]["karvis"] = 0;
        }
        data[msg.author.id]["pelit"]["karvis"] += 1;
        data[msg.author.id]["rahat"] += voitto;

      } else if (rulla[0] == sasu) {
        voitto = sasu_v * panos;
        if (data[msg.author.id]["pelit"]["sasu"] == undefined) {
          data[msg.author.id]["pelit"]["sasu"] = 0;
        }
        data[msg.author.id]["pelit"]["sasu"] += 1;
        data[msg.author.id]["rahat"] += voitto;

      } else if (rulla[0] == protect) {
        voitto = protect_v * panos;
        if (data[msg.author.id]["pelit"]["protect"] == undefined) {
          data[msg.author.id]["pelit"]["protect"] = 0;
        }
        data[msg.author.id]["pelit"]["protect"] += 1;
        data[msg.author.id]["rahat"] += voitto;
    } }else {
      voitto = 0;
    }

    if (voitto > 0) {
      data[msg.author.id]["pelit"]["yhtsumma"] += voitto;
      data[msg.author.id]["pelit"]["voitot"] += 1;
      data[msg.author.id]["pelit"]["pelit"] += 1;
    } else {
      data[msg.author.id]["pelit"]["pelit"] += 1;
    }

    firebase.database().ref('profiles').set(data);
    printSlot(rulla[0], rulla[1], rulla[2], voitto, msg.author.id, msg, panos);


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
  'rikkaimmat': (msg) => {
    ref.on('value', gotData, errData);

    var w_l = {};
    for (var id in data) {
      if (data[id]["rahat"] == null || data[id]["rahat"] == undefined) {
        data[id]["rahat"] = 300;
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

  'profiilit': (msg) => {
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


  'profiili': (msg) => {

    let name = msg.content.split(' ')[1];
    let category = msg.content.split(' ')[2];
    let all = msg.content.split(' ');
    let edit = "";
    for (var i = 3; i < all.length; i++) {
      edit += all[i] + " ";
    }

    if ((name == '' || name === undefined)) {
      name = msg.author.id;
    }
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
          "rahat": 300
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

  'liity': (msg) => {
    return new Promise((resolve, reject) => {
      voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('En voinut liittyä voicekannulle...');
      voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
      console.log("Liityttiin voicekanavalle!");
    });
  },

  'soita': (msg, manual = null, joining = false) => {

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


  'jono': (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Laita ttuneja jonoon: ${tokens.prefix}add`);
    let tosend = [];
    queue[msg.guild.id].songs.forEach((song, i) => {
      tosend.push(`${i+1}. ${song.title} - Tilaaja: ${song.requester}`);
    });
    msg.channel.sendMessage(`__**${msg.guild.name}, Musiikki jono:**__ Nyt **${tosend.length}** ttunea jonossa ${(tosend.length > 15 ? '*[Näyttää vain 15 viimeisintä]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
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
            name: tokens.prefix + "profiili + jäbän username + (luo / nimi / motto / kuvaus / kuva)",
            value: "Näyttää käyttäjän profiilin. Suluissa olevilla voi muokata"
          },
          {
            name: tokens.prefix + "profiilit",
            value: "Näyttää kaikki tarjolla olevat profiilit"
          },
          {
            name: tokens.prefix + "pääpäivä",
            value: "Kertoo onko pääpäivä"
          },
          {
            name: tokens.prefix + "pääpäivä_on",
            value: "Asettaa kyseisen päivän pääpäiväksi"
          },
          {
            name: tokens.prefix + "pääpäivä_ei",
            value: "Lopettaa pääpäivän"
          },
          {
            name: tokens.prefix + "DJ",
            value: "Arpoo pääpäivälle DJ:n!"
          },
          {
            name: tokens.prefix + "wednesday",
            value: "Tarkistaa onko keskiviikko"
          },
          {
            name: tokens.prefix + "kruuna/klaava",
            value: "Heittää rahea"
          },
          {
            name: tokens.prefix + "rahat + nimi",
            value: "Näyttää rahat"
          },
          {
            name: tokens.prefix + "rikkaimmat",
            value: "Näyttää listan rikkaimmista"
          },
          {
            name: tokens.prefix + "anna + nimi",
            value: "Antaa rahaasi henkilölle"
          },
          {
            name: tokens.prefix + "slot",
            value: "Uhkapelaa rahaasi"
          },
          {
            name: tokens.prefix + "kaikkitaieimitään",
            value: "Uhkapelaa rahaasi tuplaamalla... uskallatko?"
          },
          {
            name: tokens.prefix + "voittotaulu",
            value: "Näyttää voittotaulun"
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
            name: tokens.prefix + "liity",
            value: "ttuneBotti tulee kannulle"
          },
          {
            name: tokens.prefix + "soita",
            value: "Laittaa ttunen jonoon ja soittaa sen"
          },
          {
            name: tokens.prefix + "jono",
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
            name: tokens.prefix + "aika",
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
  //reagoi([/kys/], ["kys2", "protect"], msg);


  if (!msg.content.startsWith(tokens.prefix)) return;
  if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);
});

client.login(tokens.d_token);
