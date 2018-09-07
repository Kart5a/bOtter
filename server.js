// ALKUHÖMPÖNPÖMPÄT
const {
  Client
} = require('discord.js');
const Discord = require('discord.js');
const yt = require('ytdl-core');
const tokens = require('./tokens.json');
const fireb = require('./config.json');
const firebase = require('firebase');
const client = new Client();

// MUSABOTIN VARIABLEJA
let voiceChannel;
let dispatcher;
let queue = {};
const streamOptions = {
  seek: 0,
  volume: 0.06,
  audioonly: true
};

// SERVERIN VARIABLEJA
var pääpäivä = false;
const SLOTRATE = 30;

// emojies
var coins;
var karvis;
var sasu;
var protect;
var poggers;
var kys;
var tyhjä;
var es;
var harpoon_e;
var jaa;
var empty_e;

// FIREBASEN SETUP
var data;
const BOTIT = ["232916519594491906","155149108183695360","430827809418772481"];
let msg = {};
let harpoons = {};


firebase.initializeApp(fireb);
var database = firebase.database();
var ref = database.ref('profiles');

ref.on('value', gotData, errData);

// VAIHTAA BOTIN TEKSTIÄ
function changeTitle(text) {
  client.user.setPresence({
    game: {
      name: text + " | " + tokens.prefix + "apustus",
      type: 2
    }
  });
}

// LÄHETTÄÄ PELIAUTOMAATTITIEDOT
function printSlot(_eka, _toka, _kolmas, _voitto, target_id, msg, _panos) {

  ref.on('value', gotData, errData);


  var rahat = "" + data[target_id]["omistus"]["rahat"];
  var väli1 = " ".repeat(8 - rahat.length);
  min_panos = Math.floor(rahat / (SLOTRATE * 10)) * 10
  if (min_panos < 5) {
    min_panos = 5;
  }
  var str = "Rahat: " + rahat + coins + ", Panos: " + _panos + coins + "\n\n" +
    "|    -    " + _eka + "    -    " + _toka + "    -    " + _kolmas +
    "    -    |" + "\n\nVoitit: " + _voitto + coins + ", Min panos: " + min_panos + coins;

  msg.channel.send({
    "embed": {
      "color": 15466496,
      "author": {
        "name": "SLOTTIPOTTI",
        "icon_url": "https://ih1.redbubble.net/image.517537251.7910/flat,800x800,075,f.u2.jpg"
      },
      "fields": [{
        "name": "***" + data[target_id]["nimi"] + "***",
        "value": str
      }]
    }
  });

}

// LÄHETTÄÄ PROFIILIN TIEDOT
function printProfile(target_id, msg) {

  ref.on('value', gotData, errData);

  var nimi = data[target_id]["nimi"];
  var motto = data[target_id]["motto"];
  var kuvaus = data[target_id]["kuvaus"];
  var kuva = data[target_id]["kuva"];
  var rahat = data[target_id]["omistus"]["rahat"];
  var aika = data[target_id]["aika_kannuilla"];
  var perustulo = data[target_id]["omistus"]["perustulo"];
  var es_määrä = data[target_id]["omistus"]["ES"];
  var es_tyhjät = data[target_id]["omistus"]["ES_tyhjät"];

  var avatar;

  client.fetchUser(target_id).then(myUser => {
    avatar = myUser.avatarURL;
    laheta(avatar);
  });

  if (data[target_id]["omistus"]["kultainen_harppuuna"]) {
    harp = "\nLöytyy: " + harpoon_e;
  } else {
    harp = "";
  }

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
            "value": rahat + coins + " (Perustulo: " + perustulo + ")"
          },
          {
            "name": "***___Muut romut:___***",
            "value": es_määrä + es + " (Juodut: " + es_tyhjät + ")" + harp
          },
          {
            "name": "***___Aika kannulla:___***",
            "value": aika + " min"
          }

        ]
      }
    })

  }
}

// REAGOI VIESTEIHIN EMOJIEILLA
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

function ValidURL(str) {
  if (str.includes("http")) {
    return true;

  } else {
    return false;
  }
}

// Luo/Korjaa profiilin tietoja.
function luoTiedot(_id) {

  if (_id == "date" || _id == undefined) return;
  var usr = client.users;

  var name;
  try {
    name = usr.get(_id).username;
  } catch (err) {
    name = "<@" + _id + ">"
  }

  if (BOTIT.includes(_id)) {
    delete data[_id];
    return;
  }

  if (!(_id in data)) {
    console.log(_id + ", Uusi profiili luodaan!");

    new_data = {
      "nimi": name,
      "motto": "-",
      "kuvaus": "-",
      "kuva": " ",
      "aika_kannuilla": 0,
      "omistus": {
        "rahat": 500,
        "maxrahat": 500,
        "annetut_rahat": 0,
        "saadut_rahat": 0,
        "perustulo": 10,
        "ES": 0,
        "ES_tyhjät": 0,
        "kultainen_harppuuna": false
      },
      "pelit": {
        "slot_pelit": 0,
        "slot_voitot": 0,
        "slot_voitot_yhteensä": 0,
        "slot_yksittäisvoitot": {
          "sasu": 0,
          "karvis": 0,
          "alfa": 0,
          "meloni": 0,
          "poggers1": 0,
          "poggers2": 0,
          "poggers3": 0
        },
        "KTEM_pelit": 0,
        "KTEM_voitot": 0,
        "KTEM_häviöt": 0,
        "KTEM_voitetut_pelit": 0,
        "ryhmäpelit": 0,
        "ryhmäpelivoitot": 0,
        "ryhmäpelivoitot_yht": 0,
        "ryhmäpelihäviöt_yht": 0,
        "harpoon_pelit": 0,
        "harpoon_voitetut": 0,
        "harpoon_hävityt": 0,
        "harpoon_osumat": 0,
        "harpoon_yksittäiset": {
          "harpoon_hai": 0,
          "harpoon_pallo": 0,
          "harpoon_valas": 0
        }
      }
    };

    data[_id] = new_data;

  } else {

    if (!("nimi" in data[_id])) {
      data[_id]["nimi"] = name;
    }
    if (!("motto" in data[_id])) {
      data[_id]["motto"] = "-";
    }
    if (!("kuvaus" in data[_id])) {
      data[_id]["kuvaus"] = "-";
    }
    if (!("kuva" in data[_id])) {
      data[_id]["kuva"] = " ";
    }
    if (!("aika_kannuilla" in data[_id])) {
      data[_id]["aika_kannuilla"] = 0;
    }
    if (!("omistus" in data[_id])) {
      data[_id]["omistus"] = {
        "rahat": 500,
        "maxrahat": 500,
        "annetut_rahat": 0,
        "saadut_rahat": 0,
        "perustulo": 10,
        "ES": 0,
        "ES_tyhjät": 0,
        "kultainen_harppuuna": false
      };
    }
    if (!("rahat" in data[_id]["omistus"])) {
      data[_id]["omistus"]["rahat"] = 500;
    }
    if (!("kultainen_harppuuna" in data[_id]["omistus"])) {
      data[_id]["omistus"]["kultainen_harppuuna"] = false;
    }
    if (!("maxrahat" in data[_id]["omistus"])) {
      data[_id]["omistus"]["maxrahat"] = 500;
    }
    if (!("annetut_rahat" in data[_id]["omistus"])) {
      data[_id]["omistus"]["annetut_rahat"] = 0;
    }
    if (!("saadut_rahat" in data[_id]["omistus"])) {
      data[_id]["omistus"]["saadut_rahat"] = 0;
    }
    if (!("perustulo" in data[_id]["omistus"])) {
      data[_id]["omistus"]["perustulo"] = 10;
    }
    if (!("ES" in data[_id]["omistus"])) {
      data[_id]["omistus"]["ES"] = 0;
    }
    if (!("ES_tyhjät" in data[_id]["omistus"])) {
      data[_id]["omistus"]["ES_tyhjät"] = 0;
    }
    if (!("pelit" in data[_id])) {
      data[_id]["pelit"] = {
        "slot_pelit": 0,
        "slot_voitot": 0,
        "slot_voitot_yhteensä": 0,
        "slot_yksittäisvoitot": {
          "sasu": 0,
          "karvis": 0,
          "alfa": 0,
          "meloni": 0,
          "poggers1": 0,
          "poggers2": 0,
          "poggers3": 0
        },
        "KTEM_pelit": 0,
        "KTEM_voitot": 0,
        "KTEM_häviöt": 0,
        "KTEM_voitetut_pelit": 0,
        "ryhmäpelit": 0,
        "ryhmäpelivoitot": 0,
        "ryhmäpelivoitot_yht": 0,
        "ryhmäpelihäviöt_yht": 0
      };
    }
    if (!("slot_pelit" in data[_id]["pelit"])) {
      data[_id]["slot_pelit"] = 0;
    }
    if (!("slot_voitot" in data[_id]["pelit"])) {
      data[_id]["slot_voitot"] = 0;
    }
    if (!("slot_voitot_yhteensä" in data[_id]["pelit"])) {
      data[_id]["slot_voitot_yhteensä"] = 0;
    }
    if (!("KTEM_pelit" in data[_id]["pelit"])) {
      data[_id]["KTEM_pelit"] = 0;
    }
    if (!("KTEM_voitot" in data[_id]["pelit"])) {
      data[_id]["KTEM_voitot"] = 0;
    }
    if (!("KTEM_häviöt" in data[_id]["pelit"])) {
      data[_id]["KTEM_häviöt"] = 0;
    }
    if (!("KTEM_voitetut_pelit" in data[_id]["pelit"])) {
      data[_id]["KTEM_voitetut_pelit"] = 0;
    }
    if (!("ryhmäpelit" in data[_id]["pelit"])) {
      data[_id]["ryhmäpelit"] = 0;
    }
    if (!("ryhmäpelivoitot" in data[_id]["pelit"])) {
      data[_id]["ryhmäpelivoitot"] = 0;
    }
    if (!("ryhmäpelivoitot_yht" in data[_id]["pelit"])) {
      data[_id]["ryhmäpelivoitot_yht"] = 0;
    }
    if (!("ryhmäpelihäviöt_yht" in data[_id]["pelit"])) {
      data[_id]["ryhmäpelihäviöt_yht"] = 0;
    }
    if (!("slot_yksittäisvoitot" in data[_id]["pelit"])) {
      data[_id]["slot_yksittäisvoitot"] = {
        "sasu": 0,
        "karvis": 0,
        "alfa": 0,
        "meloni": 0,
        "poggers1": 0,
        "poggers2": 0,
        "poggers3": 0
      };
    }
    if (!("sasu" in data[_id]["pelit"]["slot_yksittäisvoitot"])) {
      data[_id]["sasu"] = 0;
    }
    if (!("karvis" in data[_id]["pelit"]["slot_yksittäisvoitot"])) {
      data[_id]["karvis"] = 0;
    }
    if (!("alfa" in data[_id]["pelit"]["slot_yksittäisvoitot"])) {
      data[_id]["alfa"] = 0;
    }
    if (!("meloni" in data[_id]["pelit"]["slot_yksittäisvoitot"])) {
      data[_id]["meloni"] = 0;
    }
    if (!("poggers1" in data[_id]["pelit"]["slot_yksittäisvoitot"])) {
      data[_id]["poggers1"] = 0;
    }
    if (!("poggers2" in data[_id]["pelit"]["slot_yksittäisvoitot"])) {
      data[_id]["poggers2"] = 0;
    }
    if (!("poggers3" in data[_id]["pelit"]["slot_yksittäisvoitot"])) {
      data[_id]["poggers3"] = 0;
    }

    if (!ValidURL(data[_id]["kuva"])) {
      data[_id]["kuva"] = " ";
    }

    if (!("harpoon_yksittäiset" in data[_id]["pelit"])) {
      data[_id]["pelit"]["harpoon_yksittäiset"] = {
        "harpoon_hai": 0,
        "harpoon_pallo": 0,
        "harpoon_valas": 0
      };
    }
    if (!("harpoon_hai" in data[_id]["pelit"]["harpoon_yksittäiset"])) {
      data[_id]["harpoon_hai"] = 0;
    }
    if (!("harpoon_pallo" in data[_id]["pelit"]["harpoon_yksittäiset"])) {
      data[_id]["harpoon_pallo"] = 0;
    }
    if (!("harpoon_valas" in data[_id]["pelit"]["harpoon_yksittäiset"])) {
      data[_id]["harpoon_valas"] = 0;
    }
    if (!("harpoon_pelit" in data[_id]["pelit"])) {
      data[_id]["pelit"]["harpoon_pelit"] = 0;
    }
    if (!("harpoon_voitetut" in data[_id]["pelit"])) {
      data[_id]["pelit"]["harpoon_voitetut"] = 0;
    }
    if (!("harpoon_hävityt" in data[_id]["pelit"])) {
      data[_id]["pelit"]["harpoon_hävityt"] = 0;
    }
    if (!("harpoon_osumat" in data[_id]["pelit"])) {
      data[_id]["pelit"]["harpoon_osumat"] = 0;
    }

  }
  firebase.database().ref('profiles').set(data);
}


// KAIKKI KOMENNOT
const commands = {

  'harpoon': (msg) => {

    ref.on('value', gotData, errData);
    msg.delete();
    luoTiedot(msg.author.id);

    if (data[msg.author.id]["omistus"]["rahat"] < 50) {
      return msg.channel.sendMessage("Tarvitset vähintään 50" + coins + "!");
    }

    let multi = 1;
    if (data[msg.author.id]["omistus"]["kultainen_harppuuna"]) {
      multi = 5;
    } else {
      multi = 1;
    }

    data[msg.author.id]["omistus"]["rahat"] -= 50 * multi;
    data[msg.author.id]["pelit"]["harpoon_pelit"] += 1;

    firebase.database().ref('profiles').set(data);

    if (msg.author.id in harpoons) {
      harpoons[msg.author.id].stop();
      delete harpoons[msg.author.if];
    }
    // Tehdään kenttä
    const W = 18;
    const H = 10;

    var field_matrix = [];
    for (var i = 0; i < H; i++) {
      field_matrix[i] = [];
      for (var j = 0; j < W; j++) {
        if (i == H - 1) {
          field_matrix[i][j] = 8;
        } else {
          field_matrix[i][j] = 0;
        }

      }
    }

    // Tehdään tarketit
    field_matrix[H - 1][0] = 9;

    // Kala
    var kala_r = Math.floor(Math.random() * Math.floor(5 + 1));


    if (kala_r < 2) {

      var ilmapallo_x = Math.floor(Math.random() * Math.floor(W - 4 + 1)) + 3;
      var ilmapallo_y = Math.floor(Math.random() * Math.floor(H - 3));
      field_matrix[ilmapallo_y][ilmapallo_x] = 2;

    } else {

      var ilmapallo = Math.floor(Math.random() * Math.floor(2 + 1));

      var ilmapallo_x = Math.floor(Math.random() * Math.floor(W - 4 + 1)) + 3;
      var ilmapallo_y = Math.floor(Math.random() * Math.floor(H - 3));
      var kala = Math.floor(Math.random() * Math.floor(W - 2));

      if (ilmapallo == 1) {
        field_matrix[ilmapallo_y][ilmapallo_x] = 2;
      }
      field_matrix[H - 1][kala + 2] = 1;
    }

    // EpicKala
    var rnd = Math.floor(Math.random() * Math.floor(15 + 1));

    if (rnd == 1) {
      while (true) {
        var epic = Math.floor(Math.random() * Math.floor(W - 2));
        if (field_matrix[H - 1][epic + 3] != 1) {
          field_matrix[H - 1][epic + 3] = 3;
          break;
        } else {
          continue;
        }
      }
    }


    // Printataan
    field = "";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (field_matrix[y][x] == 0) {
          field += "⬛️";
        } else if (field_matrix[y][x] == 8) {
          field += "🌊";
        } else if (field_matrix[y][x] == 1) {
          field += "🦈";
        } else if (field_matrix[y][x] == 2) {
          field += "🎈";
        } else if (field_matrix[y][x] == 3) {
          field += "🐳";
        } else if (field_matrix[y][x] == 9) {
          field += "🚢";
        }
      }

      field += "\n";
    }

    let tuuli = Math.floor(Math.random() * Math.floor(10 + 1)) - 5;
    tuuli_str = "";

    if (tuuli < 0) {

      for (let i = 0; i < Math.abs(tuuli); i++) {
        tuuli_str += "⏪";
      }

    } else if (tuuli == 0) {
      tuuli_str = "0";

    } else {

      for (let i = 0; i < Math.abs(tuuli); i++) {
        tuuli_str += "⏩";
      }

    }


    if (multi == 5) {
      color = 0xfffa17;
      icon = harpoon_e;
    } else {
      color = 1006999;
      icon = "";
    }

    msg.channel.send({
      "embed": {
        "color": color,
        "author": {
          "name": "HARPOON: " + msg.author.username,
          "icon_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbDL3_tJo_6dJjnVd0hUZMhIIm5NPacOTVJB1yuKU_v0B4zXNtKg"
        },
        "fields": [{
            "name": icon + " Tuuli: " + tuuli_str,
            "value": field
          },
          {
              "name": "Ammu kirjoittamalla: ",
              "value": "!ammu <asteet> <voima> (1-90°, 1-100)."
            }

        ]
      }
    }).then(m => {

      msg[msg.author.id] = m;

    });

    harpoons[msg.author.id] = msg.channel.createCollector(m => m);
    harpoons[msg.author.id].on('message', m => {
      if (m.content.startsWith(tokens.prefix + 'ammu') && msg.author.id == m.author.id) {
        ref.on('value', gotData, errData);

        m.delete();

        let deg = m.content.split(' ')[1];
        let force = m.content.split(' ')[2];

        if (isNaN(deg) || isNaN(force)) return msg.channel.sendMessage("Kulma tarvitsee olla välillä 0-90 astetta ja voima välillä 1-100");
        if (deg < 1 || deg > 90) return msg.channel.sendMessage("Kulma tarvitsee olla välillä 0-90 astetta ja voima välillä 1-100");

        ammu(deg, force, tuuli, field_matrix);

      } else if (m.content.startsWith(tokens.prefix + 'lopeta')) {
        msg.channel.sendMessage('Lopetetaan harppuuna.').then(() => {
          data[msg.author.id]["pelit"]["harpoon_hävityt"] += 50;
          harpoons[msg.author.id].stop();
          msg[msg.author.id];
        });
      }
    });

    function ammu(_deg, _force, _tuuli, _field_matrix) {
      harpoons[msg.author.id].stop();
      let multi = 1;
      if (data[msg.author.id]["omistus"]["kultainen_harppuuna"] == true) {
        multi = 5;
      } else {
        multi = 1;
      }

      let field_matrix = _field_matrix;

      let c_w = W * 10;
      let c_h = H * 10;

      let _x = 0;
      let _y = c_w - c_h/H * (H-1) ;

      let g = -0.2;

      let f_x = Math.cos(_deg / 180 * Math.PI) * _force;
      let f_y = Math.sin(_deg / 180 * Math.PI) * _force;

      let i = 0;
      let flag = true;

      while (flag) {

        i++;

        _x = _x + _tuuli/5*i/2000 + f_x / 100;
        _y = _y - (g * i / 100 + f_y / 100);

        if (_x <= 0 || _x > c_w) {
          data[msg.author.id]["pelit"]["harpoon_hävityt"] += 50 * multi;
          break;
        }
        if (_y >= c_h) {
          data[msg.author.id]["pelit"]["harpoon_hävityt"] += 50 * multi;
          break;
        }

        _xtile = Math.floor(_x / c_w * W);
        _ytile = Math.floor(_y / c_h * H);

        if (_xtile == 0 && _ytile == H - 1) {
          continue;
        }


        try {
        // OSUMAT
        voitto = "Ammuit ohi... -" + 50 * multi + coins;

        if (field_matrix[_ytile][_xtile] == 1) {
          voitto = "Osuit haihin! Voitit: " + 150*multi + coins;

          data[msg.author.id]["pelit"]["harpoon_osumat"] += 1;
          data[msg.author.id]["pelit"]["harpoon_yksittäiset"]["harpoon_hai"] += 1;
          data[msg.author.id]["pelit"]["harpoon_voitetut"] += 150 * multi;
          data[msg.author.id]["omistus"]["rahat"] += 150* multi;

          field_matrix[_ytile][_xtile] = 7;
          flag = false;
          break;

        }
        if (field_matrix[_ytile][_xtile] == 2) {
          voitto = "Osuit palloon! Voitit: " +  250*multi + coins;

          data[msg.author.id]["pelit"]["harpoon_osumat"] += 1;
          data[msg.author.id]["pelit"]["harpoon_yksittäiset"]["harpoon_pallo"] += 1;
          data[msg.author.id]["pelit"]["harpoon_voitetut"] += 250* multi;
          data[msg.author.id]["omistus"]["rahat"] += 250* multi;

          field_matrix[_ytile][_xtile] = 7;
          flag = false;
          break;

        }
        if (field_matrix[_ytile][_xtile] == 3) {
          voitto = "Osuit valaaseen! Voitit " + 1000*multi + coins;

          data[msg.author.id]["pelit"]["harpoon_osumat"] += 1;
          data[msg.author.id]["pelit"]["harpoon_yksittäiset"]["harpoon_valas"] += 1;
          data[msg.author.id]["pelit"]["harpoon_voitetut"] += 1000 * multi;
          data[msg.author.id]["omistus"]["rahat"] += 1000 * multi;

          field_matrix[_ytile][_xtile] = 7;
          flag = false;
          break;

        }

        if (_ytile ==  H - 1) {
          field_matrix[_ytile][_xtile] = 4;
          flag = false;
          data[msg.author.id]["pelit"]["harpoon_hävityt"] += 50 * multi;
          break;
        }

          field_matrix[_ytile][_xtile] = 6;
        } catch (err) {
          continue;
        }

      }

      let trail = "";
      if (multi == 5) {
        trail = "🔸";
      } else {
        trail = "▫️"
      }


      new_field = "";
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (field_matrix[y][x] == 0) {
            new_field += "⬛️";
          } else if (field_matrix[y][x] == 8) {
            new_field += "🌊";
          } else if (field_matrix[y][x] == 1) {
            new_field += "🦈";
          } else if (field_matrix[y][x] == 2) {
            new_field += "🎈";
          } else if (field_matrix[y][x] == 3) {
            new_field += "🐳";
          } else if (field_matrix[y][x] == 9) {
            new_field += "🚢";
          } else if (field_matrix[y][x] == 6) {
            new_field += trail;
          } else if (field_matrix[y][x] == 7) {
            new_field += "💥";
          } else if (field_matrix[y][x] == 4) {
            new_field += "💦";
          }
        }

        new_field += "\n";
      }


      tuuli_str = "";

      if (tuuli < 0) {

        for (let i = 0; i < Math.abs(tuuli); i++) {
          tuuli_str += "⏪";
        }

      } else if (tuuli == 0) {
        tuuli_str = "0";

      } else {

        for (let i = 0; i < Math.abs(tuuli); i++) {
          tuuli_str += "⏩";
        }

      }

      if (multi == 5) {
        color = 0xfffa17;
        icon = harpoon_e;
      } else {
        color = 1006999;
        icon = "";
      }

      msg[msg.author.id].edit({
        "embed": {
          "color": color,
          "author": {
            "name": "HARPOON: " + msg.author.username,
            "icon_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbDL3_tJo_6dJjnVd0hUZMhIIm5NPacOTVJB1yuKU_v0B4zXNtKg"
          },
          "fields": [
            {
              "name": icon + " Ammuit:",
              "value": "Kulma: " + _deg + "°, Voima: " + _force + "."
            },
            {
              "name": "Tuuli: " + tuuli_str,
              "value": new_field
            },
            {
              "name": "Tulos:",
              "value": voitto
            }

          ]
        }
      });

      firebase.database().ref('profiles').set(data);


    }

  },

  'juo': (msg) => {

    luoTiedot(msg.author.id);

    if (data[msg.author.id]["omistus"]["ES"] <= 0) return msg.channel.send("Sulla ei oo juotavaa... ostas ES");

    data[msg.author.id]["omistus"]["ES"] -= 1;
    data[msg.author.id]["omistus"]["ES_tyhjät"] += 1;

    const tekstit = [
      "Bärbär",
      "ES jumalten juoma, jonnen parhain kuoma!",
      "Saa keulimaan moposi!",
      "Nothing interesting happens.",
      "You drink ES. It makes you feel dizzy...",
      "Tshiiii, kruts... glug glug glug... aah",
      "" + es + kys + es,
      "" + es + poggers,
      "5/5",
      "Olis testis...",
      "ES > MF",
      "Joit ES ennätysajassa, toivoisit saavasi lisää...",
      "Oletko maistanu es-hyytelöä?",
      es + "\:boy:" + es,
      "Mukavan hapokasta.",
      "Humala on lähellä...",
      "Hyvää, maistakaa muutkin!",
      "Joit purkin ES, kyrpäsi värähti.",
      "Panttia 15 euroo...",
      "Kolmoissalama",
      "Tunsit sateenkaaren värit kielelläsi",
      "Sekoitit tipan viinaa joukkoon, yäiks",
      "Sätii"

    ];

    var rnd = Math.floor(Math.random() * Math.floor(tekstit.length));
    msg.channel.send(tekstit[rnd]);
    firebase.database().ref('profiles').set(data);


  },

  'ryhmäpeli': (msg) => {
    if (msg.channel.id != "280272696560975872") return msg.delete();
    var viesti;
    ref.on('value', gotData, errData);

    let panos = msg.content.split(' ')[1];
    if ((panos == '' || panos === undefined)) {
      panos = 100;
    }
    if (isNaN(panos)) return msg.channel.sendMessage("Panos tarvitsee olla luku");
    if (panos < 100) return msg.channel.sendMessage(`Ryhmäpelin panos pitää olla vähintään 100 ` + coins);

    panos = Math.floor(panos);

    msg.channel.send("***" + data[msg.author.id]["nimi"] + "*** loi ryhmäpelin panoksella " + panos + coins + ". Liity mukaan painamalla ✅")
      .then(function(msg) {
        viesti = msg;
        msg.react("✅");
      }).catch(function() {
        //Something
      });

    let co = msg.channel.createCollector(m => m);
    co.on('message', m => {
      if (m.content.startsWith(tokens.prefix + 'aloita') && msg.author.id == m.author.id) {
        rollaa(viesti);
      } else if (m.content.startsWith(tokens.prefix + 'keskeytä')) {
        msg.channel.sendMessage('Keskeytetään ryhmäpeli.').then(() => {
          co.stop();
          viesti = null;
        });
      }
    });


    function rollaa(_viesti) {
      var pelaajat = [];
      msgreact = _viesti.reactions.array();
      var osallistujat = msgreact[0].users.keyArray();

      var epäonnistujat = [];
      var rahattomat = [];
      var onnistujat = [];

      for (var i = 0; i < osallistujat.length; i++) {
        if (osallistujat[i] == "430827809418772481") {

        } else if (data[osallistujat[i]] == undefined) {
          epäonnistujat.push(osallistujat[i]);
        } else if (data[osallistujat[i]]["omistus"]["rahat"] < panos) {
          rahattomat.push(osallistujat[i]);
        } else {
          onnistujat.push(osallistujat[i]);
        }
      }

      console.log(onnistujat, rahattomat, epäonnistujat);

      var onnistui = "";
      for (var i of onnistujat) {
        onnistui += "<@" + i + ">\n";
      }

      var epäonnistui = "";
      for (var i of epäonnistujat) {

        epäonnistui += "<@" + i + ">\n";
      }

      var rahattomia = "";
      for (var i of rahattomat) {

        rahattomia += "<@" + i + ">\n";
      }

      co.stop();
      var ep = "";
      var ra = "";
      if (onnistujat.length <= 2) return msg.channel.send("Ei ole tarpeeksi kelvollisia osallistuja!");
      if (epäonnistujat.length > 0) {
        ep = "\nError 404:\n" + epäonnistui;
      }
      if (rahattomat.length > 0) {
        ra = "\nLiian köyhät:\n" + rahattomia;
      }
      var potti = panos * onnistujat.length;
      var rnd = Math.floor(Math.random() * Math.floor(onnistujat.length));
      var voittaja = onnistujat[rnd];

      for (var o of onnistujat) {

        luoTiedot(o);
        luoTiedot(voittaja);

        data[o]["omistus"]["rahat"] -= panos;

        data[o]["pelit"]["ryhmäpelit"] += 1;

        if (o != voittaja) {
          data[o]["pelit"]["ryhmäpelihäviöt_yht"] += panos;
        }

      }

      data[voittaja]["pelit"]["ryhmäpelivoitot_yht"] += (potti - panos);
      data[voittaja]["pelit"]["ryhmäpelivoitot"] += 1;
      data[voittaja]["omistus"]["rahat"] += potti;

      if (data[voittaja]["omistus"]["rahat"] > data[voittaja]["omistus"]["maxrahat"]) {
        data[voittaja]["omistus"]["maxrahat"] = data[voittaja]["omistus"]["rahat"]
      }

      msg.channel.send("Ryhmäpelin potti: " + potti + coins + "\nVoittaja on: <@" + voittaja + ">\n\nOsallistuneet pelaajat:\n" + onnistui + "\n" + ra + ep);
      firebase.database().ref('profiles').set(data);
    }
  },

  'kauppa': (msg) => {

    var käyttäjä = msg.author.id;

    luoTiedot(käyttäjä);

    firebase.database().ref('profiles').set(data);

    var palkka = Math.floor(data[käyttäjä]["omistus"]["perustulo"]);
    var hintapalkka = 100 * Math.pow(palkka, 2);

    msg.channel.send({
      "embed": {
        "title": "***KAUPPA*** (" + data[käyttäjä]["nimi"] + ")",
        "color": 15466496,
        "thumbnail": {
          "url": "https://upload.wikimedia.org/wikipedia/fi/thumb/3/3a/Lidlin_logo.svg/1024px-Lidlin_logo.svg.png"
        },
        "fields": [{
          "name": "***___\:euro: Perustulo +5:___***",
          "value": "___Hinta:___ " + hintapalkka + coins + ". Se olisi sun " + (((palkka - 10) / 5) + 1) + ". perustulon korotus."
        }, {
          "name": "***___" + es + "ES:___***",
          "value": "___Hinta:___ 1" + coins
        },
        {
         "name": "***___" + harpoon_e + "Kultainen harppuuna:___***",
         "value": "___Hinta:___ 150000" + coins +". Viisinkertaistaa Harpoon -pelissä liikkuvat massit!"
       }]
      }
    });
  },

  'osta': (msg) => {
    let ostos = msg.content.split(' ')[1].toLowerCase();
    let määrä = msg.content.split(' ')[2];
    var ostaja = msg.author.id;

    if ((määrä == '' || määrä === undefined)) {
      määrä = 1;
    }

    if (isNaN(määrä)) return msg.channel.sendMessage(määrä + ` määrää ei voida ostaa :D`);
    määrä = Math.floor(parseInt(määrä));
    if (määrä < 1) return msg.channel.sendMessage("Et voi antaa tuotetta pois :(");

    luoTiedot(ostaja);

    if ((ostos == '' || ostos === undefined)) return msg.channel.sendMessage(`Kirjoita !osta ja tuotteen nimi`);

    var rahat = data[ostaja]["omistus"]["rahat"];

    // PERUSTULO
    if (ostos == "perustulo") {
      var perustulonyt = data[ostaja]["omistus"]["perustulo"];
      var perustulohinta = 100 * Math.pow(perustulonyt, 2);
      if (rahat < perustulohinta) return msg.channel.sendMessage("Ei ole varaa ostaa... nyt keräämään, tarvitset: " + perustulohinta + coins + ".");

      data[ostaja]["omistus"]["perustulo"] += 5;
      data[ostaja]["omistus"]["rahat"] -= perustulohinta;

      msg.channel.sendMessage("Onnittelut, perustuloa ostettu! Maksoi: " + perustulohinta + coins + ". Seuraava perustulon korotus maksaa: " + 100 * Math.pow(perustulonyt + 5, 2) + coins + ".");

    } else if (ostos.toLowerCase() == "es") {

      if (rahat < määrä) return msg.channel.sendMessage("Lol, köyhä " + jaa);

      data[ostaja]["omistus"]["ES"] += määrä;
      data[ostaja]["omistus"]["rahat"] -= määrä;

      msg.channel.sendMessage("Ostit " + määrä + es);

    } else if (ostos.toLowerCase() == "harpuuna") {

      if (data[ostaja]["omistus"]["kultainen_harppuuna"] == true) return msg.channel.sendMessage("Älä osta toista harpuunaa, menee hukkaan!");
      if (rahat < 150000) return msg.channel.sendMessage("Lol, köyhä " + jaa);


      data[ostaja]["omistus"]["kultainen_harppuuna"] = true;
      data[ostaja]["omistus"]["rahat"] -= 150000;

      msg.channel.sendMessage("Onnittelut! Sulla on nyt kultainen harppuuna!");

    } else {
      msg.channel.sendMessage("Et voi ostaa mitään ihme " + ostos + " -juttua...");
    }
    firebase.database().ref('profiles').set(data);

  },

  'pelidata': (msg) => {

    ref.on('value', gotData, errData);

    luoTiedot(msg.author.id);

    var w_l = {};
    for (var id in data) {
      luoTiedot(id);
      if (isNaN(id)) continue;
      key = id;
      value = data[id]["omistus"]["rahat"];
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

    let name = msg.content.split(' ')[1];

    if (name == undefined || name == "") {
      name = msg.author.id;
    }
    name = name.replace(/\D/g, '');
    var target_id = name;
    luoTiedot(target_id);

    if (target_id == items[0]["id"]) {
      massikeisari = "\:moneybag:___ MASSIKEISARI___\:moneybag:\n";
    } else {
      massikeisari = "";
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

    var money = data[target_id]["omistus"]["rahat"];
    var pelit = data[target_id]["pelit"]["slot_pelit"];
    var voitot = data[target_id]["pelit"]["slot_voitot"];
    var yht = data[target_id]["pelit"]["slot_voitot_yhteensä"];
    var poggers3 = data[target_id]["pelit"]["slot_yksittäisvoitot"]["poggers3"];
    var poggers2 = data[target_id]["pelit"]["slot_yksittäisvoitot"]["poggers2"];
    var poggers1 = data[target_id]["pelit"]["slot_yksittäisvoitot"]["poggers1"];
    var karvis1 = data[target_id]["pelit"]["slot_yksittäisvoitot"]["karvis"];
    var sasu1 = data[target_id]["pelit"]["slot_yksittäisvoitot"]["sasu"];
    var kys1 = data[target_id]["pelit"]["slot_yksittäisvoitot"]["alfa"];
    var protect1 = data[target_id]["pelit"]["slot_yksittäisvoitot"]["meloni"];
    var vast = data[target_id]["omistus"]["saadut_rahat"];
    var ann = data[target_id]["omistus"]["annetut_rahat"];
    var kaikkit = data[target_id]["pelit"]["KTEM_voitot"];
    var kaikkitpelit = data[target_id]["pelit"]["KTEM_pelit"];
    var kaikkithäv = data[target_id]["pelit"]["KTEM_häviöt"];
    var kaikkitvoit = data[target_id]["pelit"]["KTEM_voitetut_pelit"];
    var perustulo = data[target_id]["omistus"]["perustulo"];
    var ryhmäpelit = data[target_id]["pelit"]["ryhmäpelit"];
    var ryhmäpelivoitot = data[target_id]["pelit"]["ryhmäpelivoitot"];
    var ryhmäpelivoittosumma = data[target_id]["pelit"]["ryhmäpelivoitot_yht"];
    var ryhmäpelihäviösumma = data[target_id]["pelit"]["ryhmäpelihäviöt_yht"];
    var maxrahat = data[target_id]["omistus"]["maxrahat"];


    msg.channel.send({
      "embed": {
        "title": "***PELIDATA: " + data[target_id]["nimi"] + "***",
        "color": 15466496,
        "fields": [{
            "name": "***___Tiedot:___***",
            "value": massikeisari + "Rahat: " + money + coins + "\nPeak rahat: " + maxrahat + coins + "\nPerustulo: " + perustulo + coins
          },
          {
            "name": "***___Slotit:___***",
            "value": "Pelit: " + pelit + "\nVoitetut pelit: " + voitot +
              "\nVoitetut rahat: " + yht + " coins\n\n" +
              ("" + poggers).repeat(3) + ": " + poggers3 + "\n" +
              ("" + protect).repeat(3) + ": " + protect1 + "\n" +
              ("" + kys).repeat(3) + ": " + kys1 + "\n" +
              ("" + poggers).repeat(2) + tyhjä + ": " + poggers2 + "\n" +
              ("" + karvis).repeat(3) + ": " + karvis1 + "\n" +
              ("" + sasu).repeat(3) + ": " + sasu1 + "\n" +
              poggers + ("" + tyhjä).repeat(2) + ": " + poggers1 + "\n"

          },
          {
            "name": "***___Kaikki tai ei mitään:___***",
            "value": "Pelit: " + kaikkitpelit + "\nVoittojen määrä: " + kaikkitvoit + "\nVoitetut rahat: " + kaikkit + coins + "\nHävityt rahat: " + kaikkithäv + coins
          },
          {
            "name": "***___Ryhmäpelit:___***",
            "value": "Pelit: " + ryhmäpelit + "\nVoitot: " + ryhmäpelivoitot + "\nVoitetut rahat: " + ryhmäpelivoittosumma + coins + "\nHävityt rahat: " + ryhmäpelihäviösumma + coins
          },
          {
            "name": "***___Harpoon:___***",
            "value": "Pelit: " + data[target_id]["pelit"]["harpoon_pelit"] + "\nOsumat: " + data[target_id]["pelit"]["harpoon_osumat"] + "\nVoitetut rahat: " + data[target_id]["pelit"]["harpoon_voitetut"] + coins
            + "\nHävityt rahat: " + data[target_id]["pelit"]["harpoon_hävityt"] + coins + "\nAccuracy: "
            + (parseInt(data[target_id]["pelit"]["harpoon_osumat"])/parseInt(data[target_id]["pelit"]["harpoon_pelit"])*100).toFixed(2) + "% \n🦈: "
            + data[target_id]["pelit"]["harpoon_yksittäiset"]["harpoon_hai"] + "\n🎈: " + data[target_id]["pelit"]["harpoon_yksittäiset"]["harpoon_pallo"]
            + "\n🐳: " + data[target_id]["pelit"]["harpoon_yksittäiset"]["harpoon_valas"]
          },
          {
            "name": "***___Siirrot:___***",
            "value": "Annetut rahat: " + ann + coins + "\nVastaanotetut rahat: " + vast + coins
          }
        ]
      }

    });



    firebase.database().ref('profiles').set(data);

  },

  'anna': (msg) => {
    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];
    let tuote = msg.content.split(' ')[3];

    const tuotteet = ["rahat", "ES"];

    if (tuote == undefined || tuote == null) {
      tuote = "rahat";
    }

    if (!tuotteet.includes(tuote)) return msg.channel.send("Tuotetta ei ole olemassakaan...");

    luoTiedot(msg.author.id);


    if ((name == '' || name === undefined)) return msg.channel.sendMessage(`Kirjoita !anna ja summa`);
    if (isNaN(amount)) return msg.channel.sendMessage(amount + ` ei voida antaa :D`);
    if (amount == undefined || amount == "") return msg.channel.sendMessage(`Laita summa!!!`);

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

    luoTiedot(sender_id)
    luoTiedot(target_id)

    if (BOTIT.includes(target_id)) {
      delete data[target_id];
      return msg.channel.send("Botille ei voi antaa :/");
    }

    if (target_id == sender_id) return msg.channel.sendMessage(`Turhaa siirrät ittelles mitää...`);


    if (tuote == "rahat") {
      if (data[sender_id]["omistus"]["rahat"] < parseInt(amount)) return msg.channel.sendMessage(`Sulla ei oo tarpeeks rahea...`);
      data[target_id]["omistus"]["rahat"] += parseInt(amount);
      data[sender_id]["omistus"]["rahat"] -= parseInt(amount);

      if (data[target_id]["omistus"]["rahat"] > data[target_id]["omistus"]["max_rahat"]) {
        data[target_id]["omistus"]["max_rahat"] = data[target_id]["omistus"]["rahat"]
      }

    } else {
      if (data[sender_id][tuote] < parseInt(amount)) return msg.channel.sendMessage(`Sulla ei oo tarpeeks ` + tuote);
      data[target_id]["pelit"][tuote] += parseInt(amount);
      data[sender_id]["pelit"][tuote] -= parseInt(amount);
    }

    firebase.database().ref('profiles').set(data);
    msg.channel.send(tuote.charAt(0).toUpperCase() + tuote.slice(1) + " siirretty!");

  },

  'rahat': (msg) => {

    let name = msg.content.split(' ')[1];

    ref.on('value', gotData, errData);
    var sender_id = msg.author.id;

    luoTiedot(sender_id);


    firebase.database().ref('profiles').set(data);


    if ((name == '' || name === undefined)) return msg.channel.sendMessage(`Sulla on ` + data[sender_id]["omistus"]["rahat"] + coins);

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

    luoTiedot(target_id);

    msg.channel.send("Hänellä on " + data[target_id]["omistus"]["rahat"] + coins);
  },

  'voittotaulu': (msg) => {
    msg.channel.send({
      "embed": {
        "color": 15466496,
        "author": {
          "name": "SLOTTIPOTTI - VOITOT:",
          "icon_url": "https://ih1.redbubble.net/image.517537251.7910/flat,800x800,075,f.u2.jpg"
        },
        "fields": [{
            "name": (sasu + " ").repeat(3) + ":",
            "value": "4 x panos\n"
          },
          {
            "name": (karvis + " ").repeat(3) + ":",
            "value": "8 x panos\n"
          },
          {
            "name": (kys + " ").repeat(3) + ":",
            "value": "30 x panos\n"
          },
          {
            "name": (protect + " ").repeat(3) + ":",
            "value": "85 x panos\n"
          },
          {
            "name": poggers + tyhjä + tyhjä + ":",
            "value": "2 x panos\n"
          },
          {
            "name": poggers + " " + poggers + tyhjä + ":",
            "value": "35 x panos\n"
          },
          {
            "name": (poggers + " ").repeat(3) + ":",
            "value": "400 x panos\n"
          },
          {
            "name": "Palautusprosentti:",
            "value": "109.59%"
          }
        ]
      }
    });


  },

  'slot': (msg) => {

    let panos = msg.content.split(' ')[1];

    if (msg.channel.id != "280272696560975872") return msg.delete();

    try {
      panos = eval(panos);
    } catch (err) {
      panos = panos;
    }
    if (panos == "e") {
      panos = 272;
    } else if (panos == "pi") {
      panos = 314;
    } else if ((panos + "").startsWith("log(")) {
      try {
        panos = Math.log(panos.replace(/\D/g, '')) * 100;
      } catch (err) {
        return msg.channel.sendMessage("Virhe logaritmissä!");
      }
    }

    let min_panos = Math.floor(data[msg.author.id]["omistus"]["rahat"] / (SLOTRATE * 10)) * 10
    if (min_panos < 5) {
      min_panos = 5
    }

    if (panos == "min") {
      panos = min_panos;
    }
    if (panos == "max") {
      panos = data[msg.author.id]["omistus"]["rahat"];
    }
    if (panos == "puolet") {
      panos = data[msg.author.id]["omistus"]["rahat"] / 2;
    }

    if (panos == 0) return msg.channel.sendMessage(`Panos pitää olla vähintään ` + min_panos + ' coins');
    if ((panos == '' || panos === undefined)) {
      panos = min_panos;
    }
    if (isNaN(panos)) return msg.channel.sendMessage("Panos tarvitsee olla positiivinen luku");
    if (panos < min_panos) return msg.channel.sendMessage(`Panos pitää olla vähintään ` + min_panos + ' coins');

    panos = Math.floor(panos);

    ref.on('value', gotData, errData);

    try {

      if (data[msg.author.id]["omistus"]["rahat"] < panos) return msg.channel.sendMessage(`Sulla ei oo varaa uhkapelata.`);
      data[msg.author.id]["omistus"]["rahat"] -= panos;

      const tpog = 7;
      const tsasu = 35;
      const tkarvis = 28;
      const talfa = 18;
      const tmeloni = 12;

      const pog1_v = 2;
      const pog2_v = 35;
      const pog3_v = 400;
      const sasu_v = 4;
      const karvis_v = 8;
      const alfa_v = 30;
      const meloni_v = 85;

      var rulla = [];
      for (var i = 0; i < 3; i++) {
        var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
        if (rnd <= tkarvis) {
          rulla.push(karvis);
        } else if (rnd <= tsasu + tkarvis) {
          rulla.push(sasu);
        } else if (rnd <= tsasu + tkarvis + talfa) {
          rulla.push(kys);
        } else if (rnd <= tsasu + tkarvis + tmeloni + talfa) {
          rulla.push(protect);
        } else {
          rulla.push(poggers);
        }
      }

      var voitto;
      if (rulla[0] == poggers && rulla[1] == poggers && rulla[2] == poggers) {
        voitto = pog3_v * panos;
        data[msg.author.id]["omistus"]["rahat"] += voitto;
        data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["poggers3"] += 1;
      } else if (rulla[0] == poggers && rulla[1] == poggers) {
        voitto = pog2_v * panos;
        data[msg.author.id]["omistus"]["rahat"] += voitto;
        data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["poggers2"] += 1;
        // poggers x 2
      } else if (rulla[0] == poggers) {
        voitto = pog1_v * panos;
        data[msg.author.id]["omistus"]["rahat"] += voitto;
        data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["poggers1"] += 1;
        // poggers x 1
      } else if (rulla[0] == rulla[1] && rulla[0] == rulla[2] && rulla[1] == rulla[2]) {

        if (rulla[0] == kys) {
          voitto = alfa_v * panos;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["alfa"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += voitto;

        } else if (rulla[0] == karvis) {
          voitto = karvis_v * panos;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["karvis"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += voitto;

        } else if (rulla[0] == sasu) {
          voitto = sasu_v * panos;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["sasu"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += voitto;

        } else if (rulla[0] == protect) {
          voitto = meloni_v * panos;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["meloni"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += voitto;
        }
      } else {
        voitto = 0;
      }

      if (voitto > 0) {
        data[msg.author.id]["pelit"]["slot_voitot_yhteensä"] += voitto;
        data[msg.author.id]["pelit"]["slot_voitot"] += 1;
        data[msg.author.id]["pelit"]["slot_pelit"] += 1;
      } else {
        data[msg.author.id]["pelit"]["slot_pelit"] += 1;
      }
    } catch (err) {
      luoTiedot(msg.author.id);
      msg.channel.sendMessage(`Tapahtui virhe datan kanssa. Korjattu! Kokeile uudelleen.`);
    }

    if (data[msg.author.id]["omistus"]["rahat"] > data[msg.author.id]["omistus"]["max_rahat"]) {
      data[msg.author.id]["omistus"]["max_rahat"] = data[msg.author.id]["omistus"]["rahat"]
    }


    firebase.database().ref('profiles').set(data);
    printSlot(rulla[0], rulla[1], rulla[2], voitto, msg.author.id, msg, panos);
    msg.delete();


  },

  'kaikkitaieimitään': (msg) => {

    if (msg.channel.id != "280272696560975872") return msg.delete();
    var pelaaja = msg.author.id;
    luoTiedot(pelaaja);
    const MIN = 500;

    if (data[pelaaja]["omistus"]["rahat"] < MIN) return msg.channel.send("Tarvitset vähintään " + MIN + " " + coins + " pelataksesi kaikki tai ei mitään.");

    var rnd = Math.floor(Math.random() * Math.floor(100) + 1); // Luku 1 - 100 väliltä

    if (rnd > 51) {
      data[pelaaja]["omistus"]["rahat"] *= 2;
      msg.channel.send({
        "embed": {
          "color": 15466496,
          "image": {
            "url": "https://i.ytimg.com/vi/F39Y67DzHTM/hqdefault.jpg"
          },
          "fields": [{
            "name": "***VOITIT: " + data[pelaaja]["omistus"]["rahat"] / 2 + coins + "***",
            "value": "Rollasit: " + rnd + ". (1-51 Häviö, 52-100 Voitto)"
          }, {
            "name": "Rahat nyt:",
            "value": "" + data[pelaaja]["omistus"]["rahat"] + coins
          }]
        }
      });

      data[pelaaja]["pelit"]["KTEM_voitetut_pelit"] += 1;
      data[pelaaja]["pelit"]["KTEM_voitot"] += data[pelaaja]["omistus"]["rahat"] / 2;

    } else {

      data[pelaaja]["pelit"]["KTEM_häviöt"] += data[pelaaja]["omistus"]["rahat"];
      msg.channel.send({
        "embed": {
          "color": 15466496,
          "image": {
            "url": "https://static.naamapalmu.com/files/pp/big/v7vkeefs.jpg"
          },
          "fields": [{
              "name": "***HÄVISIT: " + data[pelaaja]["omistus"]["rahat"] + coins + "***",
              "value": "Rollasit: " + rnd + ". (1-51 Häviö, 52-100 Voitto)"
            },
            {
              "name": "Rahat nyt:",
              "value": "0" + coins
            }
          ]
        }
      });
      data[pelaaja]["omistus"]["rahat"] = 0;
    }

    if (data[pelaaja]["omistus"]["rahat"] > data[pelaaja]["omistus"]["max_rahat"]) {
      data[pelaaja]["omistus"]["max_rahat"] = data[pelaaja]["omistus"]["rahat"]
    }

    data[pelaaja]["pelit"]["KTEM_pelit"] += 1;

    firebase.database().ref('profiles').set(data);
  },

  'dj': (msg) => {
    ref.on('value', gotData, errData);

    if (data["dj"] == undefined) {
      if (msg.member.voiceChannel === undefined) return msg.channel.send("Kaikkien ehdokkaiden pitää olla voicekannulla, myös sun!");
      var kannulla = msg.member.voiceChannel.members.keyArray();
      var rnd = Math.floor(Math.random() * Math.floor(kannulla.length + 1));
      data["dj"] = "<@" + kannulla[rnd] + ">";
      msg.channel.send("Pääpäivän DJ on " + data["dj"] + "!");
    } else {
      msg.channel.send("Pääpäivän DJ on jo valittu, ttunettaja on " + data["dj"] + "!");
    }
    firebase.database().ref('profiles').set(data);


  },

  'rikkaimmat': (msg) => {
    ref.on('value', gotData, errData);

    var w_l = {};
    for (var id in data) {
      luoTiedot(id);

      if (isNaN(id)) continue;

      key = id;
      value = data[id]["omistus"]["rahat"];
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

    for (var i = 0; i < items.length; i++) {
      lista += i + 1 + ". <@" + items[i].id + "> : " + items[i].val + coins + " (" + data[items[i].id]["omistus"]["perustulo"] + "/min)\n";
    }

    msg.channel.send({
      "embed": {
        "title": "***RIKKAIMMAT***",
        "color": 15466496,
        "description": lista
      },
    });
    firebase.database().ref('profiles').set(data);
  },

  'suurimmat_summat': (msg) => {
    ref.on('value', gotData, errData);

    var w_l = {};
    for (var id in data) {
      luoTiedot(id);

      if (isNaN(id)) continue;

      key = id;
      value = data[id]["omistus"]["maxrahat"];
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

    for (var i = 0; i < items.length; i++) {
      lista += i + 1 + ". <@" + items[i].id + "> : " + items[i].val + coins + '\n';
    }

    msg.channel.send({
      "embed": {
        "title": "***SUURIMMAT SUMMAT (Peakannut korkeimmillaan)***",
        "color": 15466496,
        "description": lista
      },
    });
    firebase.database().ref('profiles').set(data);
  },

  'aktiivisimmat': (msg) => {
    ref.on('value', gotData, errData);

    var w_l = {};
    for (var id in data) {
      luoTiedot(id);

      if (isNaN(id)) continue;

      key = id;
      value = data[id]["aika_kannuilla"];
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

    for (var i = 0; i < items.length; i++) {
      lista += i + 1 + ". <@" + items[i].id + "> : " + items[i].val + " mins\n";
    }

    msg.channel.send({
      "embed": {
        "title": "***AKTIIVISIMMAT***",
        "color": 15466496,
        "description": lista
      },
    });
    firebase.database().ref('profiles').set(data);
  },

  'profiilit': (msg) => {
    ref.on('value', gotData, errData);

    var all_profiles = "";
    for (var id in data) {
      luoTiedot(id);
      if (isNaN(id)) continue;

      all_profiles += "<@" + id + ">\n";
    }

    msg.channel.send({
      "embed": {
        "title": "***KAIKKI PROFIILIT***",
        "color": 15466496,
        "description": all_profiles
      },
    });
    firebase.database().ref('profiles').set(data);
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

    luoTiedot(target_id);

    if ((category == '' || category === undefined)) {

      printProfile(target_id, msg);

    } else {

      if (target_id === sender_id) return msg.channel.sendMessage("Et voi muokata omaa profiiliasi...");

      if (msg.member.roles.some(r => ["Admin", "Aktiivinen"].includes(r.name))) {


        if (category == "nimi") {

          data[target_id]["nimi"] = edit;
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

  'pääpäivä': (msg) => {
    var pv = new Date();
    pvd = [pv.getDate(), pv.getMonth(), pv.getYear()];

    if (pvd[0] == data["date"][0] && pvd[1] == data["date"][1] && pvd[2] == data["date"][2]) {
      pääpäivä = true;
    } else {
      pääpäivä = false;
      console.log("pääpäivä loppu");
      data["date"] = [0, 0, 0];
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
      data["date"] = [d.getDate(), d.getMonth(), d.getYear()];
      changeTitle("PÄÄPÄIVÄ");
      if (pääpäivä == true) {
        msg.channel.send("Tänään on jo pääpäivä!");

      } else {
        pääpäivä = true;
        msg.channel.send("Pääpäivä päätetty! Tänään on pääpäivä!");

        var linkki = "https://www.youtube.com/watch?v=687_ZGkP6OU";

        commands.play(msg, linkki);

      }
    } else {
      msg.channel.send("Sulla ei oo oikeuksia määrittää pääpäivää t. bOtter");
    }
    firebase.database().ref('profiles').set(data);
  },

  'pääpäivä_ei': (msg) => {
    if (msg.member.roles.some(r => ["Admin", "Aktiivinen"].includes(r.name))) {

      data["date"] = [0, 0, 0];

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

  // Bottikomennot

  'sano': (msg) => {
    if (msg.author.id != "247754056804728832") return msg.delete();
    let tekstinosat = msg.content.split(' ');
    str = "";
    for (var i = 1; i < tekstinosat.length; i++) {
      str += tekstinosat[i] + " ";
    }

    msg.channel.send(str);
    msg.delete();

  },

  'siirräsaldo': (msg) => {
    if (msg.author.id != "247754056804728832") return msg.delete();

    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];
    let tuote = msg.content.split(' ')[3];

    const tuotteet = ["rahat", "ES"];

    if (tuote == undefined || tuote == null) {
      tuote = "rahat";
    }

    if (!tuotteet.includes(tuote)) return;

    if (tuote == "es") {
      tuote = tuote.toUpperCase();
    }

    if ((name == '' || name === undefined)) return;
    if (isNaN(amount)) return;
    if (amount == undefined || amount == "") return;

    name = name.replace(/\D/g, '');

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return;

    ref.on('value', gotData, errData);

    var target_id = name;

    luoTiedot(target_id)


    if (tuote == "rahat") {
      data[target_id]["omistus"]["rahat"] += parseInt(amount);

      if (data[target_id]["omistus"]["rahat"] > data[target_id]["omistus"]["max_rahat"]) {
        data[target_id]["omistus"]["max_rahat"] = data[target_id]["omistus"]["rahat"]
      }

    } else {
      data[target_id]["pelit"][tuote] += parseInt(amount);
    }

    merkki = "+";
    if (amount < 0) {
      merkki = ""
    }

    firebase.database().ref('profiles').set(data);
    msg.channel.send("<@" + target_id + ">:lle " + tuote.charAt(0).toUpperCase() + tuote.slice(1) + " - Saldoa muutettu " + merkki + amount + "!")
    msg.delete();

  },

  'muutasaldo': (msg) => {
    if (msg.author.id != "247754056804728832") return msg.delete();

    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];
    let tuote = msg.content.split(' ')[3];

    const tuotteet = ["rahat", "ES"];

    if (tuote == undefined || tuote == null) {
      tuote = "rahat";
    }

    if (!tuotteet.includes(tuote)) return msg.channel.send("");


    if ((name == '' || name === undefined)) return;
    if (isNaN(amount)) return;
    if (amount == undefined || amount == "") return;

    name = name.replace(/\D/g, '');

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return;

    ref.on('value', gotData, errData);

    var target_id = name;

    luoTiedot(target_id)


    if (tuote == "rahat") {
      data[target_id]["omistus"]["rahat"] = parseInt(amount);

      if (data[target_id]["omistus"]["rahat"] > data[target_id]["omistus"]["max_rahat"]) {
        data[target_id]["omistus"]["max_rahat"] = data[target_id]["omistus"]["rahat"]
      }

    } else {
      data[target_id]["pelit"][tuote] = parseInt(amount);
    }

    merkki = "";
    if (amount < 0) {
      merkki = "-"
    }

    firebase.database().ref('profiles').set(data);
    msg.channel.send("<@" + target_id + ">:lle " + tuote.charAt(0).toUpperCase() + tuote.slice(1) + " - Saldo nyt " + merkki + amount + "!")
    msg.delete();

  },

  'purge': (msg) => {
    // This command removes all messages from all users in the channel, up to 100.
    if (msg.author.id != "247754056804728832") return msg.delete();
    let määrä = msg.content.split(' ')[1];
    // get the delete count, as an actual number.
    if ((määrä == '' || määrä === undefined)) {
      msg.channel.sendMessage("Kirjoita !purge ja määrä");
      return;
    }

    if (isNaN(määrä)) return msg.channel.sendMessage("Purge tarvitsee olla positiivinen luku");
    if (määrä < 2) return msg.channel.sendMessage(`Purge pitää olla vähintään 2 `);

    määrä = Math.floor(määrä);

    // So we get our messages, and delete them. Simple enough, right?
    msg.channel.fetchMessages({
      limit: määrä + 1
    }).then(fetch => {
      msg.channel.bulkDelete(fetch)
        .catch(error => msg.reply(`Ei voitu purgea syystä: ${error}`));
    });
  },

  'ping': (msg) => {

    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    msg.channel.send("Ping?").then(m => {

      m.edit(`Pong! Viive on ${m.createdTimestamp - msg.createdTimestamp}ms. API viive on ${Math.round(client.ping)}ms`);

    });

  },

  'apustus': (msg) => {
    msg.channel.send({
      embed: {
        color: 3447003,

        title: "**__Komennot:__**",
        fields: [{
            name: tokens.prefix + "profiili + (nimi) + (luo / nimi / motto / kuvaus / kuva)",
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
            name: tokens.prefix + "dj",
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
            name: tokens.prefix + "rahat + (nimi)",
            value: "Näyttää rahat"
          },
          {
            name: tokens.prefix + "rikkaimmat",
            value: "Näyttää listan rikkaimmista"
          },
          {
            name: tokens.prefix + "suurimmat_summat",
            value: "Näyttää listan suurimmista hetkellisistä rahoista"
          },
          {
            name: tokens.prefix + "aktiivisimmat",
            value: "Näyttää listan aktiivisimmista (aika kanavalla)"
          },
          {
            name: tokens.prefix + "anna + nimi + summa",
            value: "Antaa rahaasi henkilölle"
          },
          {
            name: tokens.prefix + "slot + (panos)",
            value: "Uhkapelaa rahaasi"
          },
          {
            name: tokens.prefix + "ryhmäpeli + panos",
            value: "Ryhmäuhkapeli ;)"
          },
          {
            name: tokens.prefix + "harpoon",
            value: "Aloittaa harppuuna-pelin (maksaa 50 coins)"
          },
          {
            name: tokens.prefix + "ammu [asteet 1-90] [voima 1-100]",
            value: "ampuu harppuunan"
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
            name: tokens.prefix + "kauppa",
            value: "Näyttää kaikki tarjolla olevat tuotteet"
          },
          {
            name: tokens.prefix + "osta + tuote + (määrä)",
            value: "Ostaa tuotetta x määrän."
          },
          {
            name: tokens.prefix + "juo",
            value: "Juo es."
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
            value: "pixlPlace: https://www.kart5a.fi/pixlplace/"
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

// CLIENTIN OLLESSA VALMIS
client.on('ready', () => {
  //if (msg.guild.id != "180699479379410944") return;

  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  ref.on('value', gotData, errData);

  coins = client.emojis.find("name", "coin");

  karvis = client.emojis.find("name", "karvis");
  sasu = client.emojis.find("name", "sasu");
  protect = "\:watermelon:" //client.emojis.find("name", "meloni");
  //poggers =  "<a:popoggers:442267614979293202>";
  poggers = client.emojis.find("name", "poggers");
  kys = client.emojis.find("name", "alfa");
  tyhjä = "\:x:";
  es = client.emojis.find("name", "ES");
  harpoon_e = client.emojis.find("name", "harpuuna");
  jaa = client.emojis.find("name", "jaa");
  empty_e = client.emojis.find("name", "empty");

});

// CLIENTIN VASTAANOTTESSA VIESTIN
client.on('message', async msg => {
  //if (msg.guild.id != "180699479379410944") return console.log("Komento väärällä servulla!: " + msg);
  //REAGOI EMOTEJA VALITTUIHIN SANOIHIN
  reagoi([/homo/, /autisti/], ["sasu", "karvis"], msg);
  //reagoi([/kys/], ["kys2", "meloni"], msg);
  if (msg.author.bot) return;
  if (msg.content.indexOf(tokens.prefix) !== 0) return;

  if (!msg.content.startsWith(tokens.prefix)) return;
  if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);
});

// INTERVALLIFUNKTIO MINUUTIN VÄLEIN
setInterval(function() {
  //if (client.guild.id != "180699479379410944") return;
  ref.on('value', gotData, errData);

  var pv = new Date();
  var pvd = [pv.getDate(), pv.getMonth(), pv.getYear()];
  var day = pv.getDay();

  if (pvd[0] == data["date"][0] && pvd[1] == data["date"][1] && pvd[2] == data["date"][2]) {
    pääpäivä = true;
  } else {
    pääpäivä = false;
    data["dj"] = null;
    data["date"] = [0, 0, 0];
  }

  if (pääpäivä == true) {
    changeTitle("PÄÄPÄIVÄ");
  } else if (day === 3) {
    changeTitle("Wednesday");
  } else {
    changeTitle("ttunes");
  }

  var keyarr = client.channels.keyArray();

  for (var i of keyarr) {
    var kan = client.channels.get(i);

    if (kan.type == 'voice' && kan.id != "300242143702679552" && kan.id != "404378873380470786" && kan.id != "422007359507005440") {
      var membrs = kan.members.keyArray();
      for (var m of membrs) {
        var usr = kan.members.get(m);
        luoTiedot(m);
        if (!usr.deaf) {
          if (usr.id == "430827809418772481" || usr.id == "232916519594491906" || usr.id == "155149108183695360") continue;

          data[m]["omistus"]["rahat"] += data[m]["omistus"]["perustulo"];
          if (data[m]["omistus"]["rahat"] > data[m]["omistus"]["maxrahat"]) {
            data[m]["omistus"]["maxrahat"] = data[m]["omistus"]["rahat"]
          }
          data[m]["aika_kannuilla"] += 1;

        }
        if (BOTIT.includes(usr.id)) {
          delete data[usr.id];
          return;
        }
      }
    }
  }
  console.log("Intervalli meni!");
  firebase.database().ref('profiles').set(data);

}, 60000);

// FIREBASEN DATAKÄSITTELYFUNKTIOITA
function gotData(_data) {
  data = _data.val();
}

function errData(err) {
  console.log("Error!");
  console.log(err);
}

// BOTIN KIRJAUTUMINEN
client.login(tokens.d_token);
