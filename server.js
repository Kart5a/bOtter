// bOtter -Discord bot
// Made by Tino Kaartovuori
// Assisted by Sasu Ryynälä

// This bot is custom made for one server only.
// This bot has features like:
// User profiles, money system, shop, games, musicbot (ttunebot) and some tools.

// This season (2) started on 30.8.2018.

const {
  Client
} = require('discord.js');
const Discord = require('discord.js');
const yt = require('ytdl-core');
const tokens = require('./tokens.json');
const fireb = require('./config.json');
const firebase = require('firebase');
const client = new Client();

// ttunesbot variables
let voiceChannel;
let dispatcher;
let queue = {};

const streamOptions = {
  seek: 0,
  volume: 0.06,
  audioonly: true
};

// Emojies
var coins, karvis, sasu, protect, poggers, kys, tyhjä, es, harpoon_e;
var jaa, empty_e;
var card_emojies, card_back, hit_emoji, double_emoji, stand_emoji, jako_emoji;

// FIREBASE SETUP
var data;
firebase.initializeApp(fireb);
var database = firebase.database();
var ref = database.ref('profiles');
ref.on('value', gotData, errData);

// Other variables
let deck = []; // Deck of card for BJ
const BOT_IDs = ["232916519594491906","155149108183695360","430827809418772481"];

let bj = {};
let harpoon_collectors = {};

var pääpäivä = false;

function change_title(text) {
  // Changes title of bOtter
  client.user.setPresence({
    game: {
      name: text + " | " + tokens.prefix + "apustus",
      type: 2
    }
  });
}

function print_profile(target_id, msg) {

  ref.on('value', gotData, errData);

  var name = data[target_id]["nimi"];
  var motto = data[target_id]["motto"];
  var description = data[target_id]["kuvaus"];
  var picture = data[target_id]["kuva"];
  var money = data[target_id]["omistus"]["rahat"];
  var time = data[target_id]["aika_kannuilla"];
  var basic_incoming = data[target_id]["omistus"]["perustulo"];
  var es_amount = data[target_id]["omistus"]["ES"];
  var es_amount_empty = data[target_id]["omistus"]["ES_tyhjät"];

  var avatar;

  client.fetchUser(target_id).then(myUser => {
    avatar = myUser.avatarURL;
    send_profile(avatar);
  });

  if (data[target_id]["omistus"]["kultainen_harppuuna"]) {
    harp = "\nLöytyy: " + harpoon_e ;
  } else {
    harp = "";
  }

  if (data[target_id]["omistus"]["valaankasvatusohjelma"]) {
    val1 = "\nKasvatan valaita 🐳";
  } else {
    val1 = "";
  }

  function send_profile(avatar) {
    msg.channel.send({
      "embed": {
        "title": "***DISCORDPROFIILI***",
        "color": 15466496,
        "thumbnail": {
          "url": avatar
        },
        "image": {
          "url": picture
        },
        "fields": [{
            "name": "***___Nimi:___***",
            "value": name
          },
          {
            "name": "***___Motto:___***",
            "value": motto
          },
          {
            "name": "***___Kuvaus:___***",
            "value": description
          },
          {
            "name": "***___Rahat:___***",
            "value": money + coins + " (Perustulo: " + basic_incoming + ")"
          },
          {
            "name": "***___Muut romut:___***",
            "value": es_amount + es + " (Juodut: " + es_amount_empty + ")" + harp + val1
          },
          {
            "name": "***___Aika kannulla:___***",
            "value": time + " min"
          }

        ]
      }
    })

  }
}

// Reacts emojies when message contains words
function react_to_message(wordlist, emojilist, msg) {
  var f = false;
  for (var word of wordlist) {
    if (word.test(msg.content) === true) {
      f = true;
    }
  }
  if (!f) return;
  for (var emo of emojilist) {
    var emoji = msg.guild.emojis.find(x => x.name === emo);
    msg.react(emoji);
  }
}

function check_URL(str) {
  if (str.includes("http")) {
    return true;

  } else {
    return false;
  }
}

function user_check_database(_id) {

  if (_id == "date" || _id == undefined || _id == "dj" || _id == "deck") return;
  var usr = client.users;

  var name;
  try {
    name = usr.get(_id).username;
  } catch (err) {
    name = "<@" + _id + ">"
  }

  if (BOT_IDs.includes(_id)) {
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
        "kultainen_harppuuna": false,
        "varastetut": 0,
        "sulta_varastetut" : 0,
        "sakot" : 0,
        "imetyt" : 0,
        "imetyt_minuutit" : 0,
        "sulta_imetyt_minuutit" : 0,
        "sulta_imetyt": 0,
        "korvaukset": 0,
        "tulokoneista_saadut_rahat" : 0,
        "lyöty" : 0,
        "suo_lyöty" : 0,
        "kalastetut_kalat" : 0,
        "painavin_kala" : 0,
        "kaloista_saadut_rahat" : 0,
        "lootboxit" : {
          "common" : 0,
          "uncommon" : 0,
          "rare" : 0,
          "epic" : 0,
          "legendary" : 0
        },
        "avatut_lootboxit" : {
          "common" : 0,
          "uncommon" : 0,
          "rare" : 0,
          "epic" : 0,
          "legendary" : 0
        }
      },
      "pelit": {
        "slot_pelit": 0,
        "slot_voitot": 0,
        "slot_häviöt_yhteensä": 0,
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
        },
        "BJ_pelit": 0,
        "BJ_voitetut_pelit": 0,
        "BJ_hävityt_pelit": 0,
        "BJ_voitetut_rahat": 0,
        "BJ_hävityt_rahat" : 0,
        "BJ_panokset" : 0,
        "BJ_yli": 0,
        "BJ_21" : 0,
        "BJ_vähemmän": 0,
        "BJ_hit" : 0,
        "BJ_stand" : 0,
        "BJ_double" : 0,
        "BJ_split" : 0,
        "kortteja_pelannut" : 0
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
    if (!("varastetut" in data[_id]["omistus"])) {
      data[_id]["omistus"]["varastetut"] = 0;
    }
    if (!("sulta_varastetut" in data[_id]["omistus"])) {
      data[_id]["omistus"]["sulta_varastetut"] = 0;
    }
    if (!("lyöty" in data[_id]["omistus"])) {
      data[_id]["omistus"]["lyöty"] = 0;
    }
    if (!("suo_lyöty" in data[_id]["omistus"])) {
      data[_id]["omistus"]["suo_lyöty"] = 0;
    }
    if (!("sakot" in data[_id]["omistus"])) {
      data[_id]["omistus"]["sakot"] = 0;
    }
    if (!("imetyt" in data[_id]["omistus"])) {
      data[_id]["omistus"]["imetyt"] = 0;
    }
    if (!("sulta_imetyt" in data[_id]["omistus"])) {
      data[_id]["omistus"]["sulta_imetyt"] = 0;
    }
    if (!("korvaukset" in data[_id]["omistus"])) {
      data[_id]["omistus"]["korvaukset"] = 0;
    }
    if (!("imetyt_minuutit" in data[_id]["omistus"])) {
      data[_id]["omistus"]["imetyt_minuutit"] = 0;
    }
    if (!("sulta_imetyt_minuutit" in data[_id]["omistus"])) {
      data[_id]["omistus"]["sulta_imetyt_minuutit"] = 0;
    }
    if (!("kalastetut_kalat" in data[_id]["omistus"])) {
      data[_id]["omistus"]["kalastetut_kalat"] = 0;
    }
    if (!("kaloista_saadut_rahat" in data[_id]["omistus"])) {
      data[_id]["omistus"]["kaloista_saadut_rahat"] = 0;
    }
    if (!("painavin_kala" in data[_id]["omistus"])) {
      data[_id]["omistus"]["painavin_kala"] = 0;
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
        "kultainen_harppuuna": false,
        "valaankasvatusohjelma": false,
        "onki" : true,
        "hiilikuituonki" : true,
        "lootboxit" : {
          "common" : 0,
          "uncommon" : 0,
          "rare" : 0,
          "epic" : 0,
          "legendary" : 0
        },
        "avatut_lootboxit" : {
          "common" : 0,
          "uncommon" : 0,
          "rare" : 0,
          "epic" : 0,
          "legendary" : 0
        }
      };
    }

    if (!("rahat" in data[_id]["omistus"])) {
      data[_id]["omistus"]["rahat"] = 500;
    }
    if (!("kultainen_harppuuna" in data[_id]["omistus"])) {
      data[_id]["omistus"]["kultainen_harppuuna"] = false;
    }
    if (!("valaankasvatusohjelma" in data[_id]["omistus"])) {
      data[_id]["omistus"]["valaankasvatusohjelma"] = false;
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
    if (!("onki" in data[_id]["omistus"])) {
      data[_id]["omistus"]["onki"] = false;
    }
    if (!("hiilikuituonki" in data[_id]["omistus"])) {
      data[_id]["omistus"]["hiilikuituonki"] = false;
    }
    if (!("lootboxit" in data[_id]["omistus"])) {
      data[_id]["omistus"]["lootboxit"] = {
        "common" : 0,
        "uncommon" : 0,
        "rare" : 0,
        "epic" : 0,
        "legendary" : 0
      };
    }

    if (!("common" in data[_id]["omistus"]["lootboxit"])) {
      data[_id]["omistus"]["lootboxit"]["common"] = 0;
    }
    if (!("uncommon" in data[_id]["omistus"]["lootboxit"])) {
      data[_id]["omistus"]["lootboxit"]["uncommon"] = 0;
    }
    if (!("rare" in data[_id]["omistus"]["lootboxit"])) {
      data[_id]["omistus"]["lootboxit"]["rare"] = 0;
    }
    if (!("epic" in data[_id]["omistus"]["lootboxit"])) {
      data[_id]["omistus"]["lootboxit"]["epic"] = 0;
    }
    if (!("legendary" in data[_id]["omistus"]["lootboxit"])) {
      data[_id]["omistus"]["lootboxit"]["legendary"] = 0;
    }

    if (!("avatut_lootboxit" in data[_id]["omistus"])) {
      data[_id]["omistus"]["avatut_lootboxit"] = {
        "common" : 0,
        "uncommon" : 0,
        "rare" : 0,
        "epic" : 0,
        "legendary" : 0
      };
    }

    if (!("common" in data[_id]["omistus"]["avatut_lootboxit"])) {
      data[_id]["omistus"]["avatut_lootboxit"]["common"] = 0;
    }
    if (!("uncommon" in data[_id]["omistus"]["avatut_lootboxit"])) {
      data[_id]["omistus"]["avatut_lootboxit"]["uncommon"] = 0;
    }
    if (!("rare" in data[_id]["omistus"]["avatut_lootboxit"])) {
      data[_id]["omistus"]["avatut_lootboxit"]["rare"] = 0;
    }
    if (!("epic" in data[_id]["omistus"]["avatut_lootboxit"])) {
      data[_id]["omistus"]["avatut_lootboxit"]["epic"] = 0;
    }
    if (!("legendary" in data[_id]["omistus"]["avatut_lootboxit"])) {
      data[_id]["omistus"]["avatut_lootboxit"]["legendary"] = 0;
    }

    if (!("pelit" in data[_id])) {
      data[_id]["pelit"] = {
        "slot_pelit": 0,
        "slot_voitot": 0,
        "slot_voitot_yhteensä": 0,
        "slot_häviöt_yhteensä": 0,
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
        "BJ_pelit": 0,
        "BJ_voitetut_pelit": 0,
        "BJ_hävityt_pelit": 0,
        "BJ_voitetut_rahat": 0,
        "BJ_hävityt_rahat" : 0,
        "BJ_panokset" : 0,
        "BJ_yli": 0,
        "BJ_21" : 0,
        "BJ_vähemmän": 0,
        "BJ_hit" : 0,
        "BJ_stand" : 0,
        "BJ_double" : 0,
        "BJ_split" : 0,
        "kortteja_pelannut" : 0
      };
    }
    if (!("BJ_pelit" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_pelit"] = 0;
    }
    if (!("BJ_voitetut_pelit" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_voitetut_pelit"] = 0;
    }
    if (!("BJ_hävityt_pelit" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_hävityt_pelit"] = 0;
    }
    if (!("BJ_voitetut_rahat" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_voitetut_rahat"] = 0;
    }
    if (!("BJ_hävityt_rahat" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_hävityt_rahat"] = 0;
    }
    if (!("BJ_panokset" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_panokset"] = 0;
    }
    if (!("BJ_yli" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_yli"] = 0;
    }
    if (!("BJ_21" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_21"] = 0;
    }
    if (!("BJ_vähemmän" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_vähemmän"] = 0;
    }
    if (!("BJ_hit" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_hit"] = 0;
    }
    if (!("BJ_stand" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_stand"] = 0;
    }
    if (!("BJ_double" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_double"] = 0;
    }
    if (!("BJ_split" in data[_id]["pelit"])) {
      data[_id]["pelit"]["BJ_split"] = 0;
    }
    if (!("kortteja_pelannut" in data[_id]["pelit"])) {
      data[_id]["pelit"]["kortteja_pelannut"] = 0;
    }
    if (!("slot_voitot_yhteensä" in data[_id]["pelit"])) {
      data[_id]["pelit"]["slot_voitot_yhteensä"] = 0;
    }
    if (!("slot_häviöt_yhteensä" in data[_id]["pelit"])) {
      data[_id]["pelit"]["slot_häviöt_yhteensä"] = 0;
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

    if (!check_URL(data[_id]["kuva"])) {
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

function draw_lootbox(_id, _max_rate) {
  var msg = "";

  // rates
  var rate_legendary =_max_rate;
  var rate_epic = _max_rate * 0.25;
  var rate_rare = _max_rate * 0.1;
  var rate_uncommon = _max_rate * 0.016666666667;
  var rate_common = _max_rate * 0.008333333333;

  var legendary = Math.floor(Math.random() * Math.floor(rate_legendary + 1));
  var epic = Math.floor(Math.random() * Math.floor(rate_epic + 1));
  var rare = Math.floor(Math.random() * Math.floor(rate_rare + 1));
  var uncommon = Math.floor(Math.random() * Math.floor(rate_uncommon + 1));
  var common = Math.floor(Math.random() * Math.floor(rate_common + 1));

  if (legendary == 0) {
    data[_id]["omistus"]["lootboxit"]["legendary"] += 1;
    msg = "OMG <@" + _id + ">: 1 x " + chest_legendary;
  }
  else if (epic == 0) {
    data[_id]["omistus"]["lootboxit"]["epic"] += 1;
    msg = "Eeppistä <@" + _id + ">: 1 x " + chest_epic;
  }
  else if (rare == 0) {
    data[_id]["omistus"]["lootboxit"]["rare"] += 1;
    msg = "<@" + _id + ">: 1 x " + chest_rare;
  }
  else if (uncommon == 0) {
    data[_id]["omistus"]["lootboxit"]["uncommon"] += 1;
    msg = "<@" + _id + ">: 1 x " + chest_uncommon;
  }
  else if (common == 0) {
    data[_id]["omistus"]["lootboxit"]["common"] += 1;
    msg = "<@" + _id + ">: 1 x " + chest_common;
  }
  if (msg != "") {
    client.channels.get("280272696560975872").send(msg);
  }

}

function draw_lootbox_weighted(_id, _max_rate, _weight=1, _commonness=100) {
  var msg = "";

  // rates
  var rate_legendary =_max_rate * (1/_weight);
  var rate_epic = _max_rate * 0.25 * (1/_weight);
  var rate_rare = _max_rate * 0.1 * (1/_weight);
  var rate_uncommon = _max_rate * 0.016666666667 * (1/_weight);
  var rate_common = _max_rate * 0.008333333333 * (1/_weight);

  var legendary = Math.floor(Math.random() * Math.floor(rate_legendary*(100/_commonness) + 1));
  var epic = Math.floor(Math.random() * Math.floor(rate_epic*(100/_commonness) + 1));
  var rare = Math.floor(Math.random() * Math.floor(rate_rare*(100/_commonness) + 1));
  var uncommon = Math.floor(Math.random() * Math.floor(rate_uncommon*(100/_commonness) + 1));
  var common = Math.floor(Math.random() * Math.floor(rate_common*(100/_commonness) + 1));

  if (legendary == 0) {
    data[_id]["omistus"]["lootboxit"]["legendary"] += 1;
    msg = "OMG <@" + _id + ">: 1 x " + chest_legendary;
  }
  else if (epic == 0) {
    data[_id]["omistus"]["lootboxit"]["epic"] += 1;
    msg = "Eeppistä <@" + _id + ">: 1 x " + chest_epic;
  }
  else if (rare == 0) {
    data[_id]["omistus"]["lootboxit"]["rare"] += 1;
    msg = "Oujee <@" + _id + ">: 1 x " + chest_rare;
  }
  else if (uncommon == 0) {
    data[_id]["omistus"]["lootboxit"]["uncommon"] += 1;
    msg = "<@" + _id + ">: 1 x " + chest_uncommon;
  }
  else if (common == 0) {
    data[_id]["omistus"]["lootboxit"]["common"] += 1;
    msg = "<@" + _id + ">: 1 x " + chest_common;
  }
  if (msg != "") {
    client.channels.get("280272696560975872").send(msg);
  }

}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

// All commands
const commands = {

  // Game commands

  'bj': (msg) => {
    ref.on('value', gotData, errData);

    check_deck();
    user_check_database(msg.author.id);

    var player = msg.author.id;

    msg.delete();

    const BJRATE = 20;

    let bet = msg.content.split(' ')[1];
    let starting_money = data[msg.author.id]["omistus"]["rahat"];
    let peak_money = data[msg.author.id]["omistus"]["maxrahat"];
    let basic_income = data[msg.author.id]["omistus"]["perustulo"];

    try {
      bet = eval(bet);
    } catch (err) {
      bet = bet;
    }
    if (bet == "e") {
      bet = 272;
    } else if (bet == "pi") {
      bet = 314;
    } else if ((bet + "").startsWith("log(")) {
      try {
        bet = Math.log(bet.replace(/\D/g, '')) * 100;
      } catch (err) {
        return msg.channel.send("Virhe logaritmissä!");
      }
    }

    let min_bet = Math.floor(data[msg.author.id]["omistus"]["rahat"] / (BJRATE * 10)) * 10;
    if (min_bet < 5) {
      min_bet = 5
    }

    if (bet == "min") {
      bet = min_bet;
    }
    if (bet == "max") {
      bet = data[msg.author.id]["omistus"]["rahat"];
    }
    if (bet == "puolet") {
      bet = data[msg.author.id]["omistus"]["rahat"] / 2;
    }

    if (bet == 0) return msg.channel.send(`bet pitää olla vähintään ` + min_bet + ' coins');
    if ((bet == '' || bet === undefined)) {
      bet = min_bet;
    }
    if (isNaN(bet)) return msg.channel.send("Panos tarvitsee olla positiivinen luku");
    if (bet < min_bet) return msg.channel.send(`Panos pitää olla vähintään ` + min_bet + ' coins');

    bet = Math.floor(bet);

    if (data[msg.author.id]["omistus"]["rahat"] < bet) {
      return msg.channel.send("Liian iso panos!");
    }

    data[msg.author.id]["omistus"]["rahat"] -= bet;
    data[msg.author.id]["pelit"]["BJ_panokset"] += bet;
    data[msg.author.id]["pelit"]["BJ_pelit"] += 1;

    if (bj[msg.author.id] != undefined) {
      data[msg.author.id]["pelit"]["BJ_hävityt_pelit"] += 1;
      bj[msg.author.id].stop();
      delete bj[msg.author.id];
    }

    // PELI //
    let dealer_hand = [];
    let player_hand = [];

    let dealer_sum = 0;
    let player_sum = 0;

    for (let i = 0; i < 2; i++) {
      dealer_hand = deal_card(msg.author.id, dealer_hand);
    }

    for (let u = 0; u < 2; u++) {
      player_hand = deal_card(msg.author.id, player_hand);
    }
    dealer_sum = calculate_sum(dealer_hand, true, 21);
    player_sum = calculate_sum(player_hand, false, 21);

    var history_log = [];
    history_log.push("" + jako_emoji);

    if (player_sum == 21) {
      data[msg.author.id]["pelit"]["BJ_21"] += 1;
      data[msg.author.id]["pelit"]["BJ_voitetut_pelit"] += 1;
      data[msg.author.id]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet*1.5);
      data[msg.author.id]["omistus"]["rahat"] += Math.floor(bet*2.5);
      firebase.database().ref('profiles').set(data);
      msg.channel.send(print_BJ(msg.author.id, player_hand, dealer_hand, Math.floor(bet), true, "Blackjack! Voitit " + Math.floor(bet*1.5) + coins, 5348864, history_log));
      return;
    } else if (player_sum > 21) {
      data[msg.author.id]["pelit"]["BJ_yli"] += 1;
      data[msg.author.id]["pelit"]["BJ_hävityt_pelit"] += 1;
      data[msg.author.id]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet);
      firebase.database().ref('profiles').set(data);
      msg.channel.send(print_BJ(msg.author.id, player_hand, dealer_hand, Math.floor(bet), true, "Jakaja voitti! Hävisit " + Math.floor(bet) + coins, 9381414, history_log));
      return;
    }

    firebase.database().ref('profiles').set(data);

    let bot_message;

    msg.channel.send(print_BJ(msg.author.id, player_hand, dealer_hand, Math.floor(bet), true, " ", 6842472, history_log)).then(m => {
      bot_message = m;
      return bot_message;
    }).then(async m => {
      await m.react(hit_emoji);
      await m.react(stand_emoji);

      let sum_u = calculate_sum(player_hand, false, 21);

      let sum = 0;
      for (let k = 0; k < player_hand.length; k++) {

        if (parseInt(player_hand[k].replace(/\D/g,'')) == 1) {
          sum += 1;
        }
        else if (parseInt(player_hand[k].replace(/\D/g,'')) > 10) {
          sum += 10;
        } else {
          sum += parseInt(player_hand[k].replace(/\D/g,''));
        }
      }

      if (data[msg.author.id]["omistus"]["rahat"] > Math.floor(bet) && ((sum_u >= 9 && sum_u <= 11) || ((sum >= 9 && sum <= 11))) && player_hand.length == 2 && sum_u < 21) {
        await m.react(double_emoji)
      }

      return m;
    }).then(m => {
      bot_message = m;

      bj[msg.author.id] = m.createReactionCollector((reaction, user) => user.id === msg.author.id, { time : 60 * 1000});
      bj[msg.author.id].on('collect', (reaction, user) => {

        if (reaction.emoji == stand_emoji) {
          stand();
        }

        else if (reaction.emoji == hit_emoji) {
          reaction.remove(msg.author.id);

          for (let re of bot_message.reactions.array()) {
            if (re.emoji == double_emoji) {
              re.remove(user.id);
            }
          }
          hit();

        }

        else if (reaction.emoji == double_emoji) {

          let sum_u = calculate_sum(player_hand, false, 21);

          let sum = 0;
          for (let k = 0; k < player_hand.length; k++) {

            if (parseInt(player_hand[k].replace(/\D/g,'')) == 1) {
              sum += 1;
            }
            else if (parseInt(player_hand[k].replace(/\D/g,'')) > 10) {
              sum += 10;
            } else {
              sum += parseInt(player_hand[k].replace(/\D/g,''));
            }
          }
          if ((sum_u >= 9 && sum_u <= 11) || (sum >= 9 && sum <= 11) && player_hand.length == 2 && sum_u < 21) {
            double();
          }
        }

      });

      bj[msg.author.id].on('end', () => {
        delete bj[msg.author.id];
        var weight = map(bet, min_bet, (basic_income*1000 + starting_money)/2, 1, 3);
        draw_lootbox_weighted(msg.author.id, 14400, weight, 1350);
        firebase.database().ref('profiles').set(data);
      });

      function hit() {

        ref.on('value', gotData, errData);
        history_log.push("" + hit_emoji);

        // Aloittaa pelin jakamalla pelaajalle
        player_hand = deal_card(player, player_hand);
        data[player]["pelit"]["BJ_hit"] += 1;
        firebase.database().ref('profiles').set(data);

        // Tutkii playern summan
        let player_sum = calculate_sum(player_hand, false, 21);

        // Katsoo jos player voitti tai hävisi suoraan
        if (player_sum == 21 && player_hand.length == 2) {
          data[player]["pelit"]["BJ_21"] += 1;
          data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
          data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet*1.5);
          data[player]["omistus"]["rahat"] += Math.floor(bet*2.5);
          firebase.database().ref('profiles').set(data);
          bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), true, "Blackjack! Voitit " + Math.floor(bet*1.5) + coins, 5348864, history_log));
          bj[player].stop();
          return;

        } else if (player_sum == 21) {
          stand();

          return;

        } else if (player_sum > 21) {
          data[player]["pelit"]["BJ_yli"] += 1;
          data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
          data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet);

          firebase.database().ref('profiles').set(data);
          bot_message.clearReactions();
          bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Jakaja voitti! Hävisit " + Math.floor(bet) + coins, 9381414, history_log));
          bj[player].stop();

        } else {
          bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), true, " ", 6842472, history_log));
        }
      }

      function stand() {
        ref.on('value', gotData, errData);
        history_log.push("" + stand_emoji);
        bot_message.clearReactions();

        // katsoo summan -> jakaa ->
        data[player]["pelit"]["BJ_stand"] += 1;
        firebase.database().ref('profiles').set(data);

        let player_sum = calculate_sum(player_hand, false, 21);

        while (true) {

          let jakaja_sum = calculate_sum(dealer_hand, false, 21);

          let sum_2 = 0;
          for (let k = 0; k < dealer_hand.length; k++) {

            if (parseInt(dealer_hand[k].replace(/\D/g,'')) == 1) {
              sum_2 += 1;
            }
            else if (parseInt(dealer_hand[k].replace(/\D/g,'')) > 10) {
              sum_2 += 10;
            } else {
              sum_2 += parseInt(dealer_hand[k].replace(/\D/g,''));
            }
          }

          // Katsoo jos player voitti tai hävisi suoraan
          if (jakaja_sum == 21 && dealer_hand.length == 2) {

            data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
            data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet);

            firebase.database().ref('profiles').set(data);
            bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Jakajan Blackjack! Hävisit " + Math.floor(bet) + coins, 9381414, history_log));
            bj[player].stop();
            return;

          } else if (jakaja_sum > 21) {

            data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
            data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet);
            data[player]["omistus"]["rahat"] += Math.floor(bet*2);

            firebase.database().ref('profiles').set(data);
            bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Jakaja meni yli! Voitit " + Math.floor(bet) + coins, 5348864, history_log));
            bj[player].stop();
            return;

          } else if (jakaja_sum >= 17) {

            if (jakaja_sum >= player_sum) {
              data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
              data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet);
              data[player]["pelit"]["BJ_vähemmän"] += 1;

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Jakaja voitti! Hävisit " + Math.floor(bet) + coins, 9381414, history_log));
              bj[player].stop();
              return;

            } else {
              data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
              data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet);
              data[player]["omistus"]["rahat"] += Math.floor(bet*2);

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Voitit: " + Math.floor(bet) + coins, 5348864, history_log));
              bj[player].stop();
              return;
            }

          } else {

            dealer_hand = deal_card(player, dealer_hand);

          }

        }
      }

      function double() {
        ref.on('value', gotData, errData);
        history_log.push("" + double_emoji);
        bot_message.clearReactions();
        // katsoo summan -> jakaa ->

        data[player]["pelit"]["BJ_double"] += 1;
        data[player]["omistus"]["rahat"] -= bet;

        player_hand = deal_card(player, player_hand);
        player_sum = calculate_sum(player_hand, false, 21);

        if (player_sum > 21) {
          data[player]["pelit"]["BJ_yli"] += 1;
          data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
          data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet*2);

          firebase.database().ref('profiles').set(data);
          msg.channel.send(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Jakaja voitti! Hävisit " + Math.floor(bet*2) + coins, 9381414, history_log));
          bj[player].stop();
          return;

        }

        while (true) {

          jakaja_sum = calculate_sum(dealer_hand, false, 21);

          let sum_2 = 0;
          for (let k = 0; k < dealer_hand.length; k++) {

            if (parseInt(dealer_hand[k].replace(/\D/g,'')) == 1) {
              sum_2 += 1;
            }
            else if (parseInt(dealer_hand[k].replace(/\D/g,'')) > 10) {
              sum_2 += 10;
            } else {
              sum_2 += parseInt(dealer_hand[k].replace(/\D/g,''));
            }
          }

          // Katsoo jos player voitti tai hävisi suoraan
          if (jakaja_sum == 21 && dealer_hand.length == 2) {

            data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
            data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet*2);

            firebase.database().ref('profiles').set(data);
            bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Jakajan Blackjack! Hävisit " + Math.floor(bet*2) + coins, 9381414, history_log));
            bj[player].stop();
            return;

          } else if (jakaja_sum > 21) {

            data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
            data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet*2);
            data[player]["omistus"]["rahat"] += Math.floor(bet*2*2);

            firebase.database().ref('profiles').set(data);
            bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Jakaja meni yli! Voitit " + Math.floor(bet*2) + coins, 5348864, history_log));
            bj[player].stop();
            return;

          } else if (jakaja_sum >= 17) {

            if (jakaja_sum >= player_sum) {
              data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
              data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet*2);
              data[player]["pelit"]["BJ_vähemmän"] += 1;

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Jakaja voitti! Hävisit " + Math.floor(bet*2) + coins, 9381414, history_log));
              bj[player].stop();
              return;

            } else {
              data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
              data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet*2);
              data[player]["omistus"]["rahat"] += Math.floor(bet*2*2);

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Voitit: " + Math.floor(bet*2) + coins, 5348864, history_log));
              bj[player].stop();
              return;
            }

          } else {

            // Jaa uusi kortti
            dealer_hand = deal_card(player, dealer_hand);

          }

        }

      }

    });

    // Tool commands for BJ

    function check_deck() {
      // Checks if there is enough cards in the deck and makes new decks
      if (!("deck" in data)) {
        data["deck"] = deck;
      }
      deck = data["deck"];

      if (deck.length < 15) {
        deck = [];
        for (let m = 0; m < 3; m++) {
          for (let p = 1; p < 14; p++) {
            deck.push(p+"S");
          }
          for (let h = 1; h < 14; h++) {
            deck.push(h+"H");
          }
          for (let r = 1; r < 14; r++) {
            deck.push(r+"C");
          }
          for (let ru = 1; ru < 14; ru++) {
            deck.push(ru+"D");
          }
        }
      }

      data["deck"] = deck;
    }

    function deal_card(_player, _hand) {
      // Adds new card to the hand
      deck = data["deck"];

      let player = _player;
      let hand = _hand;
      var rnd_c = Math.floor(Math.random() * Math.floor(deck.length));

      hand.push(deck[rnd_c]);
      deck.splice(rnd_c, 1);

      data[player]["pelit"]["kortteja_pelannut"] += 1;
      data["deck"] = deck;
      return hand;
    }

    function calculate_sum(_hand, _dealer_first, _threshhold) {

      //  Calculates sum of cards for a hand
      let hand = _hand;
      let dealer_first = _dealer_first;

      let sum = 0;
      let threshhold = _threshhold;
      let len;

      if (dealer_first == true) {
        len = hand.length - 1;
      } else {
        len = hand.length;
      }

      for (let k = 0; k < len; k++) {

        if (parseInt(hand[k].replace(/\D/g,'')) == 1) {
          sum += 11;
        }
        else if (parseInt(hand[k].replace(/\D/g,'')) > 10) {
          sum += 10;
        } else {
          sum += parseInt(hand[k].replace(/\D/g,''));
        }
      }

      for (let x = 0; x < hand.length; x++) {
        if (sum > threshhold) {
          if (parseInt(hand[x].replace(/\D/g,'')) == 1) {
            sum -= 10;
          }
        }
      }
      return sum;
    }

    function print_BJ(_user, _player_hand, _dealer_hand, _bet, _first_time, _info_text, _color, _history_log) {

      // Prints embed message that contains BJ game
      var dealer_hand_str = "";
      var player_hand_str = "";

      var dealer_sum = 0;
      var player_sum = 0;

      var avatar = " ";
      var username = " ";
      var user = _user;

      var color = _color;
      var history = "";

      dealer_sum = calculate_sum(_dealer_hand, _first_time, 21);
      player_sum = calculate_sum(_player_hand, false, 21);

      let count = 0;
      for (let card of _dealer_hand) {
        if (count == 1 && _first_time) {
          dealer_hand_str += card_back;
        } else {
          dealer_hand_str += "" + card_emojies[card];
        }
        count++;
      }

      for (let card of _player_hand) {
        player_hand_str += "" + card_emojies[card];
      }

      let sum = 0;
      for (let k = 0; k < _player_hand.length; k++) {

        if (parseInt(_player_hand[k].replace(/\D/g,'')) == 1) {
          sum += 1;
        }
        else if (parseInt(_player_hand[k].replace(/\D/g,'')) > 10) {
          sum += 10;
        } else {
          sum += parseInt(_player_hand[k].replace(/\D/g,''));
        }
      }


      dealer_hand_str += "\nYht: " + dealer_sum ;
      player_hand_str += "\nYht: " + player_sum;

      avatar = client.users.get(user).avatarURL;
      username = client.users.get(user).username;

      for (var i of _history_log) {
        history += i;
      }
      return {
          "embed": {
            "color": color,
            "author": {
              "name": "BLACKJACK",
              "icon_url": avatar
            },
            "description" : "Rahat: " + data[user]["omistus"]["rahat"] + coins + ", Panos: " + _bet + coins,
            "fields": [
                {
                "name": "***Jakaja:***",
                "value": dealer_hand_str,
                "inline" : false
              },
              {
                "name": "***" + username + ":***",
                "value": player_hand_str + "\n"  + _info_text,
                "inline": true
              },

              {
                "name": "***Historia:***",
                "value": history,
                "inline": true
              }
            ],
            footer: {
              text: "Kortteja jäljellä: " + deck.length
            }
          }
        };
    }

  },

  'harpoon': (msg) => {

    ref.on('value', gotData, errData);
    msg.delete();
    user_check_database(msg.author.id);

    let multi = 1;
    if (data[msg.author.id]["omistus"]["kultainen_harppuuna"]) {
      multi = 5;
    } else {
      multi = 1;
    }

    if (data[msg.author.id]["omistus"]["rahat"] < 50 * multi) {
      return msg.channel.send("Tarvitset vähintään " + 50 * multi + coins + "!");
    }


    data[msg.author.id]["omistus"]["rahat"] -= 50 * multi;
    data[msg.author.id]["pelit"]["harpoon_pelit"] += 1;

    firebase.database().ref('profiles').set(data);

    if (msg.author.id in harpoon_collectors) {
      harpoon_collectors[msg.author.id].stop();
      delete harpoon_collectors[msg.author.id];
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

    // shark
    var shark_rnd = Math.floor(Math.random() * Math.floor(5 + 1));


    if (shark_rnd < 2) {

      var balloon_x = Math.floor(Math.random() * Math.floor(W - 4 + 1)) + 3;
      var balloon_y = Math.floor(Math.random() * Math.floor(H - 3));
      field_matrix[balloon_y][balloon_x] = 2;

    } else {

      var balloon = Math.floor(Math.random() * Math.floor(2 + 1));

      var balloon_x = Math.floor(Math.random() * Math.floor(W - 4 + 1)) + 3;
      var balloon_y = Math.floor(Math.random() * Math.floor(H - 3));
      var shark = Math.floor(Math.random() * Math.floor(W - 2));

      if (balloon == 1) {
        field_matrix[balloon_y][balloon_x] = 2;
      }
      field_matrix[H - 1][shark + 2] = 1;
    }

    let whale_rarity = 15;
    if (data[msg.author.id]["omistus"]["valaankasvatusohjelma"]) {
      whale_rarity = 10;
    }
    var whale_rnd = Math.floor(Math.random() * Math.floor(whale_rarity + 1));

    if (whale_rnd == 1) {
      while (true) {
        var whale_tile = Math.floor(Math.random() * Math.floor(W - 2));
        if (field_matrix[H - 1][whale_tile + 3] != 1) {
          field_matrix[H - 1][whale_tile + 3] = 3;
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

    let wind = Math.floor(Math.random() * Math.floor(10 + 1)) - 5;
    wind_str = "";

    if (wind < 0) {

      for (let i = 0; i < Math.abs(wind); i++) {
        wind_str += "⏪";
      }

    } else if (wind == 0) {
      wind_str = "0";

    } else {

      for (let i = 0; i < Math.abs(wind); i++) {
        wind_str += "⏩";
      }

    }


    if (multi == 5) {
      color = 16093987;
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
            "name": icon + " Tuuli: " + wind_str,
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

    harpoon_collectors[msg.author.id] = msg.channel.createCollector(m => m);
    harpoon_collectors[msg.author.id].on('collect', m => {
      if (m.content.startsWith(tokens.prefix + 'ammu') && msg.author.id == m.author.id) {
        ref.on('value', gotData, errData);

        m.delete();

        let deg = m.content.split(' ')[1];
        let force = m.content.split(' ')[2];

        if (isNaN(deg) || isNaN(force)) return msg.channel.send("Kulma tarvitsee olla välillä 0-90 astetta ja voima välillä 1-100");
        if (deg < 1 || deg > 90) return msg.channel.send("Kulma tarvitsee olla välillä 0-90 astetta ja voima välillä 1-100");

        shoot_harpoon(deg, force, wind, field_matrix);

      } else if (m.content.startsWith(tokens.prefix + 'lopeta')) {
        msg.channel.send('Lopetetaan harppuuna.').then(() => {
          data[msg.author.id]["pelit"]["harpoon_hävityt"] += 50;
          harpoon_collectors[msg.author.id].stop();
          msg[msg.author.id];
        });
      }
    });

    function shoot_harpoon(_deg, _force, _wind, _field_matrix) {
      harpoon_collectors[msg.author.id].stop();
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

        _x = _x + _wind/5*i/2000 + f_x / 100;
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
        win_text = "Ammuit ohi... -" + 50 * multi + coins;

        if (field_matrix[_ytile][_xtile] == 1) {
          win_text = "Osuit haihin! Voitit: " + 150*multi + coins;

          data[msg.author.id]["pelit"]["harpoon_osumat"] += 1;
          data[msg.author.id]["pelit"]["harpoon_yksittäiset"]["harpoon_hai"] += 1;
          data[msg.author.id]["pelit"]["harpoon_voitetut"] += 150 * multi;
          data[msg.author.id]["omistus"]["rahat"] += 150* multi;

          field_matrix[_ytile][_xtile] = 7;
          flag = false;
          break;

        }
        if (field_matrix[_ytile][_xtile] == 2) {
          win_text = "Osuit palloon! Voitit: " +  250*multi + coins;

          data[msg.author.id]["pelit"]["harpoon_osumat"] += 1;
          data[msg.author.id]["pelit"]["harpoon_yksittäiset"]["harpoon_pallo"] += 1;
          data[msg.author.id]["pelit"]["harpoon_voitetut"] += 250* multi;
          data[msg.author.id]["omistus"]["rahat"] += 250* multi;

          field_matrix[_ytile][_xtile] = 7;
          flag = false;
          break;

        }
        if (field_matrix[_ytile][_xtile] == 3) {
          win_text = "Osuit valaaseen! Voitit " + 1000*multi + coins;

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


      wind_str = "";

      if (wind < 0) {

        for (let i = 0; i < Math.abs(wind); i++) {
          wind_str += "⏪";
        }

      } else if (wind == 0) {
        wind_str = "0";

      } else {

        for (let i = 0; i < Math.abs(wind); i++) {
          wind_str += "⏩";
        }

      }

      if (multi == 5) {
        color = 16093987;
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
              "name": "Tuuli: " + wind_str,
              "value": new_field
            },
            {
              "name": "Tulos:",
              "value": win_text
            }

          ]
        }
      });

      draw_lootbox_weighted(msg.author.id, 14400, 1, 800);

      firebase.database().ref('profiles').set(data);


    }

  },

  'ryhmäpeli': (msg) => {
    if (msg.channel.id != "280272696560975872") return msg.delete();
    var message;
    ref.on('value', gotData, errData);

    let bet = msg.content.split(' ')[1];
    if ((bet == '' || bet === undefined)) {
      bet = 100;
    }
    if (isNaN(bet)) return msg.channel.send("Panos tarvitsee olla luku");
    if (bet < 100) return msg.channel.send(`Ryhmäpelin panos pitää olla vähintään 100 ` + coins);

    bet = Math.floor(bet);

    msg.channel.send("***" + data[msg.author.id]["nimi"] + "*** loi ryhmäpelin panoksella " + bet + coins + ". Liity mukaan painamalla ✅")
      .then(function(msg) {
        message = msg;
        msg.react("✅");
      }).catch(function() {
        //Something
      });

    let co = msg.channel.createCollector(m => m);
    co.on('collect', m => {
      if (m.content.startsWith(tokens.prefix + 'aloita') && msg.author.id == m.author.id) {
        draw(message);
      } else if (m.content.startsWith(tokens.prefix + 'keskeytä')) {
        msg.channel.send('Keskeytetään ryhmäpeli.').then(() => {
          co.stop();
          message = null;
        });
      }
    });


    function draw(_message) {
      msgreact = _message.reactions.array();
      var participators = msgreact[0].users.keyArray();

      var failures = [];
      var no_enough_money = [];
      var successful_players = [];
      var ironman_players = [];

      for (var i = 0; i < participators.length; i++) {
        if (participators[i] == "430827809418772481") {

        } else if (data[participators[i]] == undefined) {
          failures.push(participators[i]);
        } else if (data[participators[i]]["omistus"]["rahat"] < bet) {
          no_enough_money.push(participators[i]);
        } else if ("ironman" in data[participators[i]]) {
          ironman_players.push(participators[i]);
        } else {
          successful_players.push(participators[i]);
        }
      }

      console.log(successful_players, no_enough_money, failures);

      var successful = "";
      for (var i of successful_players) {
        successful += "<@" + i + ">\n";
      }

      var unsuccessful = "";
      for (var i of failures) {

        unsuccessful += "<@" + i + ">\n";
      }

      var no_enough_moneys = "";
      for (var i of no_enough_money) {

        no_enough_moneys += "<@" + i + ">\n";
      }

      var ironman_players_t = "";
      for (var i of ironman_players) {

        ironman_players_t += "<@" + i + ">\n";
      }

      co.stop();
      var ep = "";
      var ra = "";
      if (successful_players.length < 2) return msg.channel.send("Ei ole tarpeeksi kelvollisia osallistuja!");
      if (failures.length > 0) {
        ep = "\nError 404:\n" + unsuccessful;
      }
      if (no_enough_money.length > 0) {
        ra = "\nLiian köyhät:\n" + no_enough_moneys;
      }
      if (ironman_players.length > 0) {
        ir = "\nIronmanit:\n" + ironman_players_t;
      }
      var all_money = bet * successful_players.length;
      var rnd = Math.floor(Math.random() * Math.floor(successful_players.length));
      var winner = successful_players[rnd];

      for (var part of successful_players) {

        user_check_database(part);
        user_check_database(winner);

        data[part]["omistus"]["rahat"] -= bet;

        data[part]["pelit"]["ryhmäpelit"] += 1;

        if (part != winner) {
          data[part]["pelit"]["ryhmäpelihäviöt_yht"] += bet;
        }

        draw_lootbox_weighted(part, 14400, 1, 1200);

      }

      data[winner]["pelit"]["ryhmäpelivoitot_yht"] += (all_money - bet);
      data[winner]["pelit"]["ryhmäpelivoitot"] += 1;
      data[winner]["omistus"]["rahat"] += all_money;

      if (data[winner]["omistus"]["rahat"] > data[winner]["omistus"]["maxrahat"]) {
        data[winner]["omistus"]["maxrahat"] = data[winner]["omistus"]["rahat"]
      }

      msg.channel.send("Ryhmäpelin potti: " + all_money + coins + "\nVoittaja on: <@" + winner + ">\n\nOsallistuneet pelaajat:\n" + successful + "\n" + ra + ep + ir);
      firebase.database().ref('profiles').set(data);
    }
  },

  'slot': (msg) => {

    let bet = msg.content.split(' ')[1];
    if (msg.channel.id != "280272696560975872") return msg.delete();
    const SLOTRATE = 30;
    var starting_money = data[msg.author.id]["omistus"]["rahat"];
    try {
      bet = eval(bet);
    } catch (err) {
      bet = bet;
    }
    if (bet == "e") {
      bet = 272;
    } else if (bet == "pi") {
      bet = 314;
    } else if ((bet + "").startsWith("log(")) {
      try {
        bet = Math.log(bet.replace(/\D/g, '')) * 100;
      } catch (err) {
        return msg.channel.send("Virhe logaritmissä!");
      }
    }

    let min_bet = Math.floor(data[msg.author.id]["omistus"]["rahat"] / (SLOTRATE * 10)) * 10;

    if (min_bet < 5) {
      min_bet = 5
    }

    if (bet == "min") {
      bet = min_bet;
    }
    if (bet == "max") {
      bet = data[msg.author.id]["omistus"]["rahat"];
    }
    if (bet == "puolet") {
      bet = data[msg.author.id]["omistus"]["rahat"] / 2;
    }

    if (bet == 0) return msg.channel.send(`Panos pitää olla vähintään ` + min_bet + ' coins');
    if ((bet == '' || bet === undefined)) {
      bet = min_bet;
    }
    if (isNaN(bet)) return msg.channel.send("Panos tarvitsee olla positiivinen luku");
    if (bet < min_bet) return msg.channel.send(`Panos pitää olla vähintään ` + min_bet + ' coins');

    bet = Math.floor(bet);

    ref.on('value', gotData, errData);

    try {

      if (data[msg.author.id]["omistus"]["rahat"] < bet) return msg.channel.send(`Sulla ei oo varaa uhkapelata.`);
      data[msg.author.id]["omistus"]["rahat"] -= bet;
      data[msg.author.id]["pelit"]["slot_häviöt_yhteensä"] += bet;

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
      const alfa_v = 32;
      const meloni_v = 85;

      var win_line = [];
      for (var i = 0; i < 3; i++) {
        var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
        if (rnd <= tkarvis) {
          win_line.push(karvis);
        } else if (rnd <= tsasu + tkarvis) {
          win_line.push(sasu);
        } else if (rnd <= tsasu + tkarvis + talfa) {
          win_line.push(kys);
        } else if (rnd <= tsasu + tkarvis + tmeloni + talfa) {
          win_line.push(protect);
        } else {
          win_line.push(poggers);
        }
      }


      var winnings;
      if (win_line[0] == poggers && win_line[1] == poggers && win_line[2] == poggers) {
        winnings = pog3_v * bet;
        win_line = [poggersrow, poggersrow,poggersrow]
        data[msg.author.id]["omistus"]["rahat"] += winnings;
        data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["poggers3"] += 1;
      } else if (win_line[0] == poggers && win_line[1] == poggers) {
        winnings = pog2_v * bet;
        data[msg.author.id]["omistus"]["rahat"] += winnings;
        data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["poggers2"] += 1;
        // poggers x 2
      } else if (win_line[0] == poggers) {
        winnings = pog1_v * bet;
        data[msg.author.id]["omistus"]["rahat"] += winnings;
        data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["poggers1"] += 1;
        // poggers x 1
      } else if (win_line[0] == win_line[1] && win_line[0] == win_line[2] && win_line[1] == win_line[2]) {

        if (win_line[0] == kys) {
          winnings = alfa_v * bet;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["alfa"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += winnings;

        } else if (win_line[0] == karvis) {
          winnings = karvis_v * bet;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["karvis"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += winnings;

        } else if (win_line[0] == sasu) {
          winnings = sasu_v * bet;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["sasu"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += winnings;

        } else if (win_line[0] == protect) {
          winnings = meloni_v * bet;
          data[msg.author.id]["pelit"]["slot_yksittäisvoitot"]["meloni"] += 1;
          data[msg.author.id]["omistus"]["rahat"] += winnings;
        }
      } else {
        winnings = 0;
      }

      if (winnings > 0) {
        data[msg.author.id]["pelit"]["slot_voitot_yhteensä"] += winnings;
        data[msg.author.id]["pelit"]["slot_voitot"] += 1;
        data[msg.author.id]["pelit"]["slot_pelit"] += 1;
      } else {
        data[msg.author.id]["pelit"]["slot_pelit"] += 1;
      }
    } catch (err) {
      user_check_database(msg.author.id);
      msg.channel.send(`Tapahtui virhe datan kanssa. Korjattu! Kokeile uudelleen.`);
    }

    if (data[msg.author.id]["omistus"]["rahat"] > data[msg.author.id]["omistus"]["maxrahat"]) {
      data[msg.author.id]["omistus"]["maxrahat"] = data[msg.author.id]["omistus"]["rahat"]
    }


    firebase.database().ref('profiles').set(data);
    print_slot(win_line[0], win_line[1], win_line[2], winnings, msg.author.id, msg, bet);
    msg.delete();

    function print_slot(_first_roll, _second_roll, _third_roll, _win_amount, target_id, msg, _bet) {

      // Prints slot results

      ref.on('value', gotData, errData);

      var starting_money = data[target_id]["omistus"]["rahat"];
      var min_bet = Math.floor(starting_money / (SLOTRATE * 10)) * 10
      if (min_bet < 5) {
        min_bet = 5;
      }

      const tpog = 7;
      const tsasu = 35;
      const tkarvis = 28;
      const talfa = 18;
      const tmeloni = 12;

      var rnd = [];
      for (var i = 0; i < 6; i++) {
        var rnda = Math.floor(Math.random() * Math.floor(100 + 1));
        if (rnda <= tkarvis) {
          rnd.push(karvis);
        } else if (rnda <= tsasu + tkarvis) {
          rnd.push(sasu);
        } else if (rnda <= tsasu + tkarvis + talfa) {
          rnd.push(kys);
        } else if (rnda <= tsasu + tkarvis + tmeloni + talfa) {
          rnd.push(protect);
        } else {
          rnd.push(poggers);
        }
      }
      let color = 9381414;
      if (_win_amount > 0) {
        color = 5348864;
      }

      var str = "Rahat: " + starting_money + coins + ", Panos: " + _bet + coins + "\n\n" +
      "⬛️|        " + rnd[0] + "    |    " + rnd[1] + "    |    " + rnd[2] +"        |⬛️\n" +
      "▶️|        " + _first_roll + "    |    " + _second_roll + "    |    " + _third_roll + "        |◀️\n" +
      "⬛️|        " + rnd[3] + "    |    " + rnd[4] + "    |    " + rnd[5] +"        |⬛️\n" +
      "\nVoitit: " + _win_amount + coins + ", Min panos: " + min_bet + coins;

      msg.channel.send({
        "embed": {
          "color": color,
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

      let basic_income = data[msg.author.id]["omistus"]["perustulo"];

      var weight = map(bet, min_bet, (basic_income*1500 + starting_money/2.5)/2, 1, 10);
      draw_lootbox_weighted(msg.author.id, 14400, weight, 550);
      firebase.database().ref('profiles').set(data);

    }

  },

  'kaikkitaieimitään': (msg) => {

    if (msg.channel.id != "280272696560975872") return msg.delete();
    var player = msg.author.id;
    user_check_database(player);
    const MIN = 500;

    let starting_money = data[player]["omistus"]["rahat"];
    let peak_money = data[player]["omistus"]["maxrahat"];

    if (data[player]["omistus"]["rahat"] < MIN) return msg.channel.send("Tarvitset vähintään " + MIN + " " + coins + " pelataksesi kaikki tai ei mitään.");

    var rnd = Math.floor(Math.random() * Math.floor(1000) + 1);

    if (rnd % 2 == 0) {
      data[player]["omistus"]["rahat"] *= 2;
      msg.channel.send({
        "embed": {
          "color": 5348864,
          "image": {
            "url": "https://i.ytimg.com/vi/F39Y67DzHTM/hqdefault.jpg"
          },
          "fields": [{
            "name": "***VOITIT: " + data[player]["omistus"]["rahat"] / 2 + coins + "***",
            "value": "Rollasit: " + rnd + ". (Parillinen = winnings, Pariton = Häviö)"
          }, {
            "name": "Rahat nyt:",
            "value": "" + data[player]["omistus"]["rahat"] + coins
          }]
        }
      });

      data[player]["pelit"]["KTEM_voitetut_pelit"] += 1;
      data[player]["pelit"]["KTEM_voitot"] += data[player]["omistus"]["rahat"] / 2;

    } else {

      data[player]["pelit"]["KTEM_häviöt"] += data[player]["omistus"]["rahat"];
      msg.channel.send({
        "embed": {
          "color": 9381414,
          "image": {
            "url": "https://static.naamapalmu.com/files/pp/big/v7vkeefs.jpg"
          },
          "fields": [{
              "name": "***HÄVISIT: " + data[player]["omistus"]["rahat"] + coins + "***",
              "value": "Rollasit: " + rnd + ". (Parillinen = winnings, Pariton = Häviö)"
            },
            {
              "name": "Rahat nyt:",
              "value": "0" + coins
            }
          ]
        }
      });
      data[player]["omistus"]["rahat"] = 0;
    }

    if (data[player]["omistus"]["rahat"] > data[player]["omistus"]["maxrahat"]) {
      data[player]["omistus"]["maxrahat"] = data[player]["omistus"]["rahat"];
    }
    data[player]["pelit"]["KTEM_pelit"] += 1;

    let basic_income = data[msg.author.id]["omistus"]["perustulo"];

    let weight = map(starting_money, 500, basic_income*2000, 1, 10);
    draw_lootbox_weighted(msg.author.id, 14400, weight, 4800);

    firebase.database().ref('profiles').set(data);
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
            "value": "32 x panos\n"
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
            "value": "110,75%"
          }
        ]
      }
    });


  },

  'pelidata': (msg) => {

    ref.on('value', gotData, errData);

    user_check_database(msg.author.id);

    var w_l = {};
    for (var id in data) {
      user_check_database(id);
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
    user_check_database(target_id);

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
    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

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
    var ryhmäpeliwinningssumma = data[target_id]["pelit"]["ryhmäpelivoitot_yht"];
    var ryhmäpelihäviösumma = data[target_id]["pelit"]["ryhmäpelihäviöt_yht"];
    var maxrahat = data[target_id]["omistus"]["maxrahat"];

    var bjpelit = data[target_id]["pelit"]["BJ_pelit"];
    var bjvoitot = data[target_id]["pelit"]["BJ_voitetut_pelit"];
    var bjhäviöt = data[target_id]["pelit"]["BJ_hävityt_pelit"];
    var bjw = (parseInt(bjvoitot)*100/parseInt(bjpelit)).toFixed(2);
    var bjvr = data[target_id]["pelit"]["BJ_voitetut_rahat"];
    var vjhr = data[target_id]["pelit"]["BJ_hävityt_rahat"];
    var bjnetto = (parseInt(bjvr) - parseInt(vjhr));

    var _tulokone = " ";
    var _tuloimu = " ";
    if ("tulokoneajastin" in data[target_id]) {

      if (data[target_id]["tulokoneajastin"]["tulokonetier"] == 1) {
        var _tulokone_icon = tulokone;
        var tulokone_name = "Tulokone"
      }
      else if (data[target_id]["tulokoneajastin"]["tulokonetier"] == 2) {
        var _tulokone_icon = tulokone_x;
        var tulokone_name = "Tulokone-X"
      }
      else if (data[target_id]["tulokoneajastin"]["tulokonetier"] == 4) {
        var _tulokone_icon = tulokiihdytin;
        var tulokone_name = "Tulokiihdytin"
      }

      _tulokone = "\n" + _tulokone_icon + " " + tulokone_name + " päällä (" + data[target_id]["tulokoneajastin"]["tulokoneaika"] + "mins jäljellä): " + data[target_id]["tulokoneajastin"]["tulokonetier"]*10 + " x perustulo. Saatu: " + data[target_id]["tulokoneajastin"]["summa"] + coins;
    }
    if ("tuloimuajastin" in data[target_id]) {
      _tuloimu = "\n" + tuloimu + " Tuloimu päällä (" + data[target_id]["tulokoneajastin"]["tuloimuaika"] + "mins jäljellä): Kohde: <@" + data[target_id]["tulokoneajastin"]["kohde"] + ">. Imetty: " + data[target_id]["tuloimuajastin"]["summa"] + coins;
    }

    msg.channel.send({
      "embed": {
        "title": "***PELIDATA: " + data[target_id]["nimi"] + "***",
        "color": 15466496,
        "fields": [{
            "name": "***___Tiedot:___***",
            "value": massikeisari + "Rahat: " + money + coins + "\nPeak rahat: " + maxrahat + coins + "\nPerustulo: " + perustulo + coins + _tulokone + _tuloimu
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
            "value": "Pelit: " + ryhmäpelit + "\nVoitot: " + ryhmäpelivoitot + "\nVoitetut rahat: " + ryhmäpeliwinningssumma + coins + "\nHävityt rahat: " + ryhmäpelihäviösumma + coins
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
            "name": "***___BJ:___***",
            "value":
            "Pelit: " + bjpelit +
            "\nVoitot: " + bjvoitot +
            "\nHäviöt: " + bjhäviöt +
            "\nW%: " + bjw + "%" +
            "\nVoitetut rahat: " + bjvr + coins +
            "\nHävityt rahat: " + vjhr + coins +
            "\nNetto: " + bjnetto + coins
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

  'kalasta' : (msg) => {

    ref.on('value', gotData, errData);
    var has_rod = data[msg.author.id]["omistus"]["onki"];
    var has_rod2 = data[msg.author.id]["omistus"]["lasikuituonki"];

    if (has_rod == true || has_rod2 == true) {
    } else {
      return msg.channel.send("Sulla ei ole vielä onkea...");
    }

    var date = new Date();
    var hour = date.getHours();
    var part_day = "";
    var time;

    if (hour > 6 && hour <= 10) {
      part_day = "A";
      time = "Aamu";
    }
    if (hour > 10 && hour <= 18) {
      part_day = "P";
      time = "Päivä";
    }
    if (hour > 18 && hour <= 23) {
      part_day = "I";
      time = "Ilta";
    }
    if (hour > 23 || hour <= 6) {
      part_day = "Y";
      time = "Yö";
    }
    if ("kalastusajastin" in data[msg.author.id]) return msg.channel.send("Olet jo kalastamassa!");

    let depth = msg.content.split(' ')[1];
    let distance = msg.content.split(' ')[2];
    let extra = msg.content.split(' ')[3];

    var extras = ["joki", "meri", "järvi", "supersytti", "hypersytti"];
    if (isNaN(depth) || isNaN(distance)) return msg.channel.send("Syvyys tarvitsee olla välillä 1-10 ja matka välillä 1-100m (joki 10m)");
    if (depth < 1 || depth > 10) return msg.channel.send("Syvyys tarvitsee olla välillä 1-10 ja matka välillä 1-100m (joki 10m)");
    if (distance < 1 || distance > 100) return msg.channel.send("Syvyys tarvitsee olla välillä 1-10 ja matka välillä 1-100m (joki 10m)");
    if (extra == "" || extra == undefined) return msg.channel.send("Kirjoita paikka tai sytti!");
    if (!extras.includes(extra)) return msg.channel.send("Virheellinen paikka tai syötti! Kirjoita joko joki, meri, järvi tai erikoisyötti.");

    var fishes;
    var place;
    var bait;
    if (extra == "järvi") {
      if (!("inventory" in data[msg.author.id]["omistus"])) return msg.channel.send("Sinulla ei ole syttiä!");
      if (!("sytti" in data[msg.author.id]["omistus"]["inventory"])) return msg.channel.send("Sinulla ei ole syttiä!");
      if (data[msg.author.id]["omistus"]["inventory"]["sytti"] <= 0) return msg.channel.send("Sinulla ei ole syttiä!");

      data[msg.author.id]["omistus"]["inventory"]["sytti"] -= 1;
      if (data[msg.author.id]["omistus"]["inventory"]["sytti"] == 0) {
        delete data[msg.author.id]["omistus"]["inventory"]["sytti"];
      }

      place = "Järvi";
      bait = sytti;
      fishes = {
        "Katkaravut" : {
          "syvyys": 10,
          "matka": 5,
          "emoji": shrimps,
          "paino_min": 0.01,
          "paino_max" : 0.06,
          "hinta" : 1900,
          "hajonta": 3,
          "aika" : "PAIY"
        },
        "Ahven" : {
          "syvyys": 4,
          "matka": 50,
          "emoji": bass,
          "paino_min": 0.1,
          "paino_max" : 1.5,
          "hinta" : 450,
          "hajonta": 6,
          "aika" : "PAI"
        },
        "Hummeri" : {
          "syvyys": 10,
          "matka": 60,
          "emoji": lobster,
          "paino_min": 0.2,
          "paino_max" : 0.5,
          "hinta" : 2000,
          "hajonta": 1,
          "aika" : "IY"
        },
        "Lohi" : {
          "syvyys": 7,
          "matka": 40,
          "emoji": salmon,
          "paino_min": 0.5,
          "paino_max" : 5,
          "hinta" : 200,
          "hajonta": 5,
          "aika" : "AI"
        },
        "Taimen" : {
          "syvyys": 5,
          "matka": 35,
          "emoji": trout,
          "paino_min": 0.4,
          "paino_max" : 3,
          "hinta" : 320,
          "hajonta": 7,
          "aika" : "AI"
        },
        "Hauki" : {
          "syvyys": 7,
          "matka": 80,
          "emoji": pike,
          "paino_min": 0.5,
          "paino_max" : 4,
          "hinta" : 80,
          "hajonta": 7,
          "aika" : "PAI"
        },
        "Kuha" : {
          "syvyys": 6,
          "matka": 30,
          "emoji": cod,
          "paino_min": 0.5,
          "paino_max" : 1.5,
          "hinta" : 150,
          "hajonta": 4,
          "aika" : "PAIY"
        },
        "Ankerias" : {
          "syvyys": 9,
          "matka": 80,
          "emoji": eel,
          "paino_min": 0.2,
          "paino_max" : 1,
          "hinta" : 1500,
          "hajonta": 1,
          "aika" : "YA"
        }
      }
    }
    else if (extra == "joki") {
      if (!("inventory" in data[msg.author.id]["omistus"])) return msg.channel.send("Sinulla ei ole syttiä!");
      if (!("sytti" in data[msg.author.id]["omistus"]["inventory"])) return msg.channel.send("Sinulla ei ole syttiä!");
      if (data[msg.author.id]["omistus"]["inventory"]["sytti"] <= 0) return msg.channel.send("Sinulla ei ole syttiä!");

      data[msg.author.id]["omistus"]["inventory"]["sytti"] -= 1;
      if (data[msg.author.id]["omistus"]["inventory"]["sytti"] == 0) {
        delete data[msg.author.id]["omistus"]["inventory"]["sytti"];
      }

      place = "Joki";
      bait = sytti;
      if (distance < 1 || distance > 10) return msg.channel.send("Joessa syvyys 1-10m ja matka 1-10m...");
      fishes = {
        "Katkaravut" : {
          "syvyys": 10,
          "matka": 1,
          "emoji": shrimps,
          "paino_min": 0.01,
          "paino_max" : 0.06,
          "hinta" : 750,
          "aika" : "PAIY",
          "hajonta" : 6
        },
        "Sardellit" : {
          "syvyys": 2,
          "matka": 3,
          "emoji": anchovies,
          "paino_min": 0.01,
          "paino_max" : 0.06,
          "hinta" : 3000,
          "aika" : "PA",
          "hajonta" : 4
        },
        "Hummeri" : {
          "syvyys": 10,
          "matka": 3,
          "emoji": lobster,
          "paino_min": 0.2,
          "paino_max" : 0.5,
          "hinta" : 2000,
          "aika" : "Y",
          "hajonta" : 1
        },
        "Lohi" : {
          "syvyys": 4,
          "matka": 9,
          "emoji": salmon,
          "paino_min": 0.5,
          "paino_max" : 5,
          "hinta" : 150,
          "aika" : "AI",
          "hajonta" : 2
        },
        "Taimen" : {
          "syvyys": 5,
          "matka": 4,
          "emoji": trout,
          "paino_min": 0.4,
          "paino_max" : 3,
          "hinta" : 150,
          "aika" : "AI",
          "hajonta" : 4
        },
        "Jokitaimen" : {
          "syvyys": 7,
          "matka": 8,
          "emoji": leaping_trout,
          "paino_min": 0.4,
          "paino_max" : 3,
          "hinta" : 290,
          "aika" : "AIP",
          "hajonta" : 3
        },
        "Jokilohi" : {
          "syvyys": 5,
          "matka": 7,
          "emoji": leaping_salmon,
          "paino_min": 0.4,
          "paino_max" : 2.5,
          "hinta" : 220,
          "aika" : "AIY",
          "hajonta" : 4
        },
        "Jokisampi" : {
          "syvyys": 8,
          "matka": 9,
          "emoji": leaping_sturgeon,
          "paino_min": 0.6,
          "paino_max" : 4,
          "hinta" : 210,
          "aika" : "AYP",
          "hajonta" : 2
        }
      }
    }
    else if (extra == "meri") {
      if (!("inventory" in data[msg.author.id]["omistus"])) return msg.channel.send("Sinulla ei ole syttiä!");
      if (!("sytti" in data[msg.author.id]["omistus"]["inventory"])) return msg.channel.send("Sinulla ei ole syttiä!");
      if (data[msg.author.id]["omistus"]["inventory"]["sytti"] <= 0) return msg.channel.send("Sinulla ei ole syttiä!");

      data[msg.author.id]["omistus"]["inventory"]["sytti"] -= 1;
      if (data[msg.author.id]["omistus"]["inventory"]["sytti"] == 0) {
        delete data[msg.author.id]["omistus"]["inventory"]["sytti"];
      }

      place = "Meri";
      bait = sytti;
      fishes = {
        "Sardellit" : {
          "syvyys": 2,
          "matka": 60,
          "emoji": anchovies,
          "paino_min": 0.01,
          "paino_max" : 0.06,
          "hinta" : 1200,
          "hajonta": 7,
          "aika" : "P"
        },
        "Ahven" : {
          "syvyys": 3,
          "matka": 62,
          "emoji": bass,
          "paino_min": 0.1,
          "paino_max" : 0.7,
          "hinta" : 650,
          "hajonta": 4,
          "aika" : "PAIY"
        },
        "Hummeri" : {
          "syvyys": 10,
          "matka": 65,
          "emoji": lobster,
          "paino_min": 0.2,
          "paino_max" : 0.5,
          "hinta" : 1500,
          "hajonta": 1,
          "aika" : "YA"
        },
        "Lohi" : {
          "syvyys": 7,
          "matka": 22,
          "emoji": salmon,
          "paino_min": 0.5,
          "paino_max" : 5,
          "hinta" : 150,
          "hajonta": 3,
          "aika" : "AI"
        },
        "Hauki" : {
          "syvyys": 6.5,
          "matka": 52,
          "emoji": pike,
          "paino_min": 0.5,
          "paino_max" : 3,
          "hinta" : 80,
          "hajonta": 5,
          "aika" : "PAI"
        },
        "Sardiini" : {
          "syvyys": 2,
          "matka": 20,
          "emoji": sardine,
          "paino_min": 0.05,
          "paino_max" : 0.1,
          "hinta" : 250,
          "hajonta": 3,
          "aika" : "PAIY"
        },
        "Silakka" : {
          "syvyys": 3,
          "matka": 70,
          "emoji": herring,
          "paino_min": 0.08,
          "paino_max" : 0.15,
          "hinta" : 1500,
          "hajonta": 6,
          "aika" : "PAIY"
        },
        "Kuha" : {
          "syvyys": 6,
          "matka": 30,
          "emoji": cod,
          "paino_min": 0.5,
          "paino_max" : 3,
          "hinta" : 80,
          "hajonta": 6,
          "aika" : "PAIY"
        },
        "Merikrotti" : {
          "syvyys": 9,
          "matka": 83,
          "emoji": monkfish,
          "paino_min": 1,
          "paino_max" : 8,
          "hinta" : 100,
          "hajonta": 1,
          "aika" : "P"
        },
        "Makrilli" : {
          "syvyys": 8,
          "matka": 70,
          "emoji": mackerel,
          "paino_min": 0.1,
          "paino_max" : 0.2,
          "hinta" : 1000,
          "hajonta": 5,
          "aika" : "PAY"
        },
        "Tonnikala" : {
          "syvyys": 5,
          "matka": 90,
          "emoji": tuna,
          "paino_min": 70,
          "paino_max" : 333,
          "hinta" : 2.5,
          "hajonta": 2,
          "aika" : "P"
        },
        "Merilevää" : {
          "syvyys": 1,
          "matka": 25,
          "emoji": seaweed,
          "paino_min": 0.02,
          "paino_max" : 0.05,
          "hinta" : 0,
          "hajonta": 3,
          "aika" : "P"
        }
      }
    }
    else if (extra == "supersytti") {
      if (!("inventory" in data[msg.author.id]["omistus"])) return msg.channel.send("Sinulla ei ole supersyttiä!");
      if (!("supersytti" in data[msg.author.id]["omistus"]["inventory"])) return msg.channel.send("Sinulla ei ole supersyttiä!");
      if (data[msg.author.id]["omistus"]["inventory"]["supersytti"] <= 0) return msg.channel.send("Sinulla ei ole supersyttiä!");

      data[msg.author.id]["omistus"]["inventory"]["supersytti"] -= 1;
      if (data[msg.author.id]["omistus"]["inventory"]["supersytti"] == 0) {
        delete data[msg.author.id]["omistus"]["inventory"]["supersytti"];
      }

      place = "Meri";
      bait = supersytti;
      fishes = {
        "Hai" : {
          "syvyys": 7,
          "matka": 75,
          "emoji": shark,
          "paino_min": 500,
          "paino_max" : 1000,
          "hinta" : 3,
          "hajonta": 1,
          "aika" : "PAIY"
        },
        "Merikilpikonna" : {
          "syvyys": 2,
          "matka": 60,
          "emoji": sea_turtle,
          "paino_min": 30,
          "paino_max" : 70,
          "hinta" : 40,
          "hajonta": 2,
          "aika" : "PA"
        },
        "Miekkakala" : {
          "syvyys": 4,
          "matka": 50,
          "emoji": swordfish,
          "paino_min": 200,
          "paino_max" : 600,
          "hinta" : 4,
          "hajonta": 5,
          "aika" : "PAI"
        },
        "Pallokala" : {
          "syvyys": 8,
          "matka": 20,
          "emoji": pufferfish,
          "paino_min": 2,
          "paino_max" : 22,
          "hinta" : 125,
          "hajonta": 7,
          "aika" : "PAIY"
        },
        "Piikkirausku" : {
          "syvyys": 9,
          "matka": 50,
          "emoji": manta_ray,
          "paino_min": 1600,
          "paino_max" : 2600,
          "hinta" : 1,
          "hajonta": 4,
          "aika" : "PA"
        },
        "Luola-ankerias" : {
          "syvyys": 8,
          "matka": 80,
          "emoji": cave_eel,
          "paino_min": 0.2,
          "paino_max" : 1,
          "hinta" : 3000,
          "hajonta": 3,
          "aika" : "IY"
        },
        "Karambwan" : {
          "syvyys": 10,
          "matka": 5,
          "emoji": karambwan,
          "paino_min": 0.2,
          "paino_max" : 2,
          "hinta" : 1500,
          "hajonta": 3,
          "aika" : "PIY"
        },
        "Merikrotti" : {
          "syvyys": 8,
          "matka": 64,
          "emoji": monkfish,
          "paino_min": 7,
          "paino_max" : 45,
          "hinta" : 50,
          "hajonta": 6,
          "aika" : "IY"
        },
        "Hummeri" : {
          "syvyys": 10,
          "matka": 40,
          "emoji": lobster,
          "paino_min": 0.3,
          "paino_max" : 1,
          "hinta" : 1000,
          "hajonta": 3,
          "aika" : "Y"
        }

      }
    }
    else if (extra == "hypersytti") {
      if (!("inventory" in data[msg.author.id]["omistus"])) return msg.channel.send("Sinulla ei ole hypersyttiä!");
      if (!("hypersytti" in data[msg.author.id]["omistus"]["inventory"])) return msg.channel.send("Sinulla ei ole hypersyttiä!");
      if (data[msg.author.id]["omistus"]["inventory"]["hypersytti"] <= 0) return msg.channel.send("Sinulla ei ole hypersyttiä!");

      data[msg.author.id]["omistus"]["inventory"]["hypersytti"] -= 1;
      if (data[msg.author.id]["omistus"]["inventory"]["hypersytti"] == 0) {
        delete data[msg.author.id]["omistus"]["inventory"]["hypersytti"];
      }

      place = "Meri";
      bait = hypersytti;
      fishes = {
        "Megahai" : {
          "syvyys": 8,
          "matka": 90,
          "emoji": big_shark,
          "paino_min": 3200,
          "paino_max" : 5600,
          "hinta" : 3,
          "hajonta": 2,
          "aika" : "PI"
        },
        "Sateenkaarikala" : {
          "syvyys": 2,
          "matka": 60,
          "emoji": rainbow_fish,
          "paino_min": 0.2,
          "paino_max" : 0.9,
          "hinta" : 20250,
          "hajonta": 2,
          "aika" : "AP"
        },
        "Suphi" : {
          "syvyys": 4,
          "matka": 70,
          "emoji": suphi_fish,
          "paino_min": 4,
          "paino_max" : 10.5,
          "hinta" : 1625,
          "hajonta": 2,
          "aika" : "IY"
        },
        "Infernaalinen ankerias" : {
          "syvyys": 8,
          "matka": 20,
          "emoji": infernal_eel,
          "paino_min": 1.8,
          "paino_max" : 7.2,
          "hinta" : 2321,
          "hajonta": 4,
          "aika" : "YA"
        },
        "Antennikrotti" : {
          "syvyys": 10,
          "matka": 95,
          "emoji": anglerfish,
          "paino_min": 12,
          "paino_max" : 25,
          "hinta" : 488,
          "hajonta": 3,
          "aika" : "Y"
        },
        "Merikilpikonna" : {
          "syvyys": 3.5,
          "matka": 65,
          "emoji": sea_turtle,
          "paino_min": 40,
          "paino_max" : 100,
          "hinta" : 120,
          "hajonta": 3,
          "aika" : "P"
        },
        "Luola-ankerias" : {
          "syvyys": 8,
          "matka": 30,
          "emoji": cave_eel,
          "paino_min": 3,
          "paino_max" : 7,
          "hinta" : 1900,
          "hajonta": 3,
          "aika" : "PY"
        },
        "Tummarapu" : {
          "syvyys": 10,
          "matka": 50,
          "emoji": dark_crab,
          "paino_min": 0.5,
          "paino_max" : 2,
          "hinta" : 5200,
          "hajonta": 4,
          "aika" : "IY"
        },
        "Pyhäankerias" : {
          "syvyys": 7,
          "matka": 40,
          "emoji": sacred_eel,
          "paino_min": 2,
          "paino_max" : 3,
          "hinta" : 4000,
          "hajonta": 4,
          "aika" : "PAIY"
        }

      }
    }

    var rod;
    if (data[msg.author.id]["omistus"]["hiilikuituonki"]) {
      weight_multi = 1.4;
      rod = hiilikuituonki;
    } else {
      weight_multi = 1;
      rod = onki;
    }
    var bucket = [];

    for (var fish in fishes) {
      var de = fishes[fish]["syvyys"];
      var di = fishes[fish]["matka"];
      var ti = fishes[fish]["aika"];
      var variance = fishes[fish]["hajonta"];

      if (fish == "Merilevää" && Math.random() > 0.3) {
        continue;
      }

      var difference_x;
      if (extra == "joki") {
        difference_x = Math.abs(distance - di);
      } else {
        difference_x = Math.abs(distance - di)/10;
      }
      var difference_y = Math.abs(depth - de);

      if (difference_x == 0) {
        difference_x = 0.1;
      }
      if (difference_y == 0) {
        difference_y = 0.1;

      }

      var prop_x = 1*Math.exp(-(difference_x)^2/(2*(variance/1.5)^2))*1000;
      var prop_y = 1*Math.exp(-(difference_y)^2/(2*(variance/1.5)^2))*1000;

      var multi_prob = Math.sqrt(prop_x*prop_y);

      if (ti.includes(part_day)) {
        multi_prob = multi_prob*1;
      } else {
        multi_prob = multi_prob*0.05;
      }

      var multi_prob = multi_prob * (1+(-0.5+Math.random()));


      for (var x = 0; x < Math.floor(multi_prob); x++) {
        bucket.push(fish);
      }
    }

    if (depth > 8 && place == "Meri" && distance < 25 && Math.random() > 0.5 && bucket.length > 50) {
      var aarre;
      if (bait == sytti) {
        aarre = {
            "syvyys": 0,
            "matka": 0,
            "emoji": casket,
            "paino_min": 12,
            "paino_max" : 12,
            "hinta" : 1500,
            "hajonta": 0,
            "aika" : "PAIY"
          }
      }
      if (bait == supersytti) {
        aarre = {
          "syvyys": 0,
          "matka": 0,
          "emoji": casket,
          "paino_min": 12,
          "paino_max" : 12,
          "hinta" : 1000,
          "hajonta": 0,
          "aika" : "PAIY"
        }
      }
      if (bait == hypersytti) {

        aarre =  {
          "syvyys": 0,
          "matka": 0,
          "emoji": casket,
          "paino_min": 12,
          "paino_max" : 12,
          "hinta" : 2000,
          "hajonta": 0,
          "aika" : "PAIY"
        }
    }

      bucket.push[aarre];
    }

    var _rnd = Math.floor(Math.random() * Math.floor(bucket.length));

    var caught_fish = bucket[_rnd];

    var weight_var = Math.random();


    var weight = map(weight_var, 0, 1, fishes[caught_fish]["paino_min"], fishes[caught_fish]["paino_max"]*weight_multi).toFixed(2);
    if (extra == "hypersytti"){
      var price = Math.floor(weight * fishes[caught_fish]["hinta"]);
    }
    if (extra == "megasytti"){
      var price = Math.floor(weight * fishes[caught_fish]["hinta"]);
    }
    else {
      var price = Math.floor(weight * fishes[caught_fish]["hinta"]);
    }

    var timer;

    if (extra == "hypersytti") {
      var lure_time = map(bucket.length, 0, 1000, 8, 0);
      if (lure_time < 0) {
        lure_time = 1;
      }
      if (lure_time > 8) {
        lure_time = 8;
      }
      timer = Math.floor(Math.random() * Math.floor(lure_time)) + 1;
    }
    else if (extra == "supersytti") {
      var lure_time = map(bucket.length, 0, 1000, 6, 0);
      if (lure_time < 0) {
        lure_time = 1;
      }
      if (lure_time > 6) {
        lure_time = 6;
      }
      timer = Math.floor(Math.random() * Math.floor(lure_time)) + 1;
    }
    else {
      var lure_time = map(bucket.length, 0, 1000, 4, 0);
      if (lure_time < 0) {
        lure_time = 1;
      }
      if (lure_time > 4) {
        lure_time = 4;
      }
      timer = Math.floor(Math.random() * Math.floor(lure_time)) + 1;
    }

    data[msg.author.id]["kalastusajastin"] = {
      "kala" : caught_fish,
      "paino" : weight,
      "hinta" : price,
      "päiväaika" : time,
      "sytti" : bait.name,
      "emoji" : fishes[caught_fish]["emoji"].name,
      "timer" : timer,
      "onki" : rod.name,
      "paikka" : place
    };

    msg.channel.send("Kalastetaan!");
    firebase.database().ref('profiles').set(data);

  },

  // Money commands

  'rahat': (msg) => {

    let name = msg.content.split(' ')[1];

    ref.on('value', gotData, errData);
    var sender_id = msg.author.id;

    user_check_database(sender_id);


    firebase.database().ref('profiles').set(data);


    if ((name == '' || name === undefined)) return msg.channel.send(`Sulla on ` + data[sender_id]["omistus"]["rahat"] + coins);

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

    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

    user_check_database(target_id);

    msg.channel.send("Hänellä on " + data[target_id]["omistus"]["rahat"] + coins);
  },

  'anna': (msg) => {
    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];
    let product = msg.content.split(' ')[3];

    const products = ["rahat", "ES", "sytti", "hypersytti", "supersytti", "tulokone", "tulokone-x", "tulokiihdytin", "maski", "keppi", "es"];

    if (product == undefined || product == null) {
      product = "rahat";
    }

    if (!products.includes(product)) return msg.channel.send("Tuotetta ei ole olemassakaan...");

    user_check_database(msg.author.id);


    if ((name == '' || name === undefined)) return msg.channel.send(`Kirjoita !anna ja summa`);
    if (isNaN(amount)) return msg.channel.send(amount + ` ei voida antaa :D`);
    if (amount == undefined || amount == "") return msg.channel.send(`Laita summa!!!`);

    if (parseInt(amount) < 0) {
      return msg.channel.send("Älä saatana yritä viedä toisilta kädestä");
    } else if (parseInt(amount) == 0) {
      return msg.channel.send("Et voi siirtää et mitään...");
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

    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

    ref.on('value', gotData, errData);

    var target_id = name;
    var sender_id = msg.author.id;

    user_check_database(sender_id)
    user_check_database(target_id)

    if ("ironman" in data[sender_id]) return msg.channel.send(`Olet Ironman... et voi antaa mitään...`);
    if ("ironman" in data[target_id]) return msg.channel.send(`Kohde on Ironman... Hän ei huoli lahjustasi`);

    if (BOT_IDs.includes(target_id)) {
      delete data[target_id];
      return msg.channel.send("Botille ei voi antaa :/");
    }

    if (target_id == sender_id) return msg.channel.send(`Turhaa siirrät ittelles mitää...`);
    amount = Math.floor(parseInt(amount));


    if (product == "rahat") {
      if (data[sender_id]["omistus"]["rahat"] < parseInt(amount)) return msg.channel.send(`Sulla ei oo tarpeeks rahea...`);
      data[target_id]["omistus"]["rahat"] += parseInt(amount);
      data[sender_id]["omistus"]["rahat"] -= parseInt(amount);
      data[target_id]["omistus"]["saadut_rahat"] += parseInt(amount);
      data[sender_id]["omistus"]["annetut_rahat"] += parseInt(amount);

      if (data[target_id]["omistus"]["rahat"] > data[target_id]["omistus"]["maxrahat"]) {
        data[target_id]["omistus"]["maxrahat"] = data[target_id]["omistus"]["rahat"]
      }
      firebase.database().ref('profiles').set(data);
      return msg.channel.send(`Rahat siirretty!`);

    }
    else if (product == "sytti") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["syötit"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["syötit"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("syötit" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["syötit"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["syötit"] += amount;
          if (data[target_id]["omistus"]["inventory"]["syötit"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["syötit"];
          }

      } catch(err) {

      }
    }
    else if (product == "keppi") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["kepit"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["kepit"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("kepit" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["kepit"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["kepit"] += amount;
          if (data[target_id]["omistus"]["inventory"]["kepit"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["kepit"];
          }
      } catch(err) {

      }
    }
    else if (product == "maski") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["maskit"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["maskit"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("maskit" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["maskit"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["maskit"] += amount;
          if (data[target_id]["omistus"]["inventory"]["maskit"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["maskit"];
          }
      } catch(err) {

      }
    }
    else if (product == "supersytti") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["mehevätsyötit"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["maskit"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("mehevätsyötit" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["mehevätsyötit"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["mehevätsyötit"] += amount;
          if (data[target_id]["omistus"]["inventory"]["mehevätsyötit"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["mehevätsyötit"];
          }

      } catch(err) {

      }
    }
    else if (product == "hypersytti") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["megasyötit"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["megasyötit"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("megasyötit" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["megasyötit"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["megasyötit"] += amount;
          if (data[target_id]["omistus"]["inventory"]["megasyötit"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["megasyötit"];
          }

      } catch(err) {

      }
    }
    else if (product == "dupepyssy") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["dupepyssyt"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["dupepyssyt"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("dupepyssyt" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["dupepyssyt"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["dupepyssyt"] += amount;
          if (data[target_id]["omistus"]["inventory"]["dupepyssyt"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["dupepyssyt"];
          }
      } catch(err) {

      }
    }
    else if (product == "tulokone") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["tulokone"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["tulokone"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("tulokone" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["tulokone"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["tulokone"] += amount;

          if (data[target_id]["omistus"]["inventory"]["tulokone"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["tulokone"];
          }
      } catch(err) {

      }
    }
    else if (product == "tulokone-x") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["tulokone-x"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["tulokone-x"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("tulokone-x" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["tulokone-x"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["tulokone-x"] += amount;
          if (data[target_id]["omistus"]["inventory"]["tulokone-x"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["tulokone-x"];
          }
      } catch(err) {

      }
    }
    else if (product == "tulokiihdytin") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["tulokiihdytin"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["tulokiihdytin"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("tulokiihdytin" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["tulokiihdytin"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["tulokiihdytin"] += amount;
          if (data[target_id]["omistus"]["inventory"]["tulokiihdytin"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["tulokone-x"];
          }
      } catch(err) {

      }
    }
    else if (product == "tuloimu") {
      try {
        if (data[sender_id]["omistus"]["inventory"]["tuloimu"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["inventory"]["tuloimu"] -= amount;

          if (!("inventory" in data[target_id]["omistus"])) {
            data[target_id]["omistus"]["inventory"] = {};
          }
          if (!("tuloimu" in data[target_id]["omistus"]["inventory"])) {
            data[target_id]["omistus"]["inventory"]["tuloimu"] = 0;
          }

          data[target_id]["omistus"]["inventory"]["tuloimu"] += amount;
          if (data[target_id]["omistus"]["inventory"]["tuloimu"] == 0) {
            delete data[target_id]["omistus"]["inventory"]["tuloimu"];
          }
      } catch(err) {

      }
    }
    else if (product == "es") {
      try {
        if (data[sender_id]["omistus"]["ES"] < amount) return msg.channel.send(`Sulla ei ole tarpeeksi siirrettävää asiaa!`);
          data[sender_id]["omistus"]["ES"] -= amount;
          data[target_id]["omistus"]["ES"] += amount;

      } catch(err) {

      }
    }

    firebase.database().ref('profiles').set(data);
    msg.channel.send(product.charAt(0).toUpperCase() + product.slice(1) + " siirretty! (" + amount + " kpl)");

  },

  'kauppa': (msg) => {

    var user = msg.author.id;

    user_check_database(user);

    firebase.database().ref('profiles').set(data);

    var basic_income = Math.floor(data[user]["omistus"]["perustulo"]);
    var cost_next_basic_income = 100 * Math.pow(basic_income, 2);

    msg.channel.send({
      "embed": {
        "title": "***KAUPPA*** (" + data[user]["nimi"] + ")",
        "color": 15466496,
        "thumbnail": {
          "url": "https://upload.wikimedia.org/wikipedia/fi/thumb/3/3a/Lidlin_logo.svg/1024px-Lidlin_logo.svg.png"
        },
        "fields": [{
          "name": "***___"+ _perustulo + " Perustulo +5:___***",
          "value": "___Hinta:___ " + cost_next_basic_income + coins + ". Se olisi sun " + (((basic_income - 10) / 5) + 1) + ". perustulon korotus."
        }, {
          "name": "***___" + es + "ES:___***",
          "value": "___Hinta:___ 1" + coins
        },
        {
         "name": "***___" + harpoon_e + "Kultainen harppuuna:___***",
         "value": "___Hinta:___ 150000" + coins +". Viisinkertaistaa Harpoon -pelissä liikkuvat massit!"
       },
       {
        "name": "***___" + "🐳 Valaankasvatusohjelma:___***",
        "value": "___Hinta:___ 240000" + coins +". Nostaa valaiden määrää 50%!"
      }]
      }
    });
  },

  'osta': (msg) => {
    let purchase = msg.content.split(' ')[1].toLowerCase();
    let amount = msg.content.split(' ')[2];
    var customer = msg.author.id;

    if ((amount == '' || amount === undefined)) {
      amount = 1;
    }

    if (isNaN(amount)) return msg.channel.send(amount + ` määrää ei voida ostaa :D`);
    amount = Math.floor(parseInt(amount));
    if (amount < 1) return msg.channel.send("Et voi antaa tuotetta pois :(");

    user_check_database(customer);

    if ((purchase == '' || purchase === undefined)) return msg.channel.send(`Kirjoita !osta ja tuotteen nimi`);

    var money = data[customer]["omistus"]["rahat"];

    // PERUSTULO
    if (purchase == "perustulo") {
      var basic_income = data[customer]["omistus"]["perustulo"];
      var basic_income_price = 100 * Math.pow(basic_income, 2);
      if (money < basic_income_price) return msg.channel.send("Ei ole varaa ostaa... nyt keräämään, tarvitset: " + basic_income_price + coins + ".");

      data[customer]["omistus"]["perustulo"] += 5;
      data[customer]["omistus"]["rahat"] -= basic_income_price;

      msg.channel.send("Onnittelut, perustuloa ostettu! Maksoi: " + basic_income_price + coins + ". Seuraava perustulon korotus maksaa: " + 100 * Math.pow(basic_income + 5, 2) + coins + ".");

    } else if (purchase.toLowerCase() == "es") {

      if (money < amount) return msg.channel.send("Lol, köyhä " + jaa);

      data[customer]["omistus"]["ES"] += amount;
      data[customer]["omistus"]["rahat"] -= amount;

      msg.channel.send("Ostit " + amount + es);

    } else if (purchase.toLowerCase() == "harpuuna") {

      if (data[customer]["omistus"]["kultainen_harppuuna"] == true) return msg.channel.send("Älä osta toista harpuunaa, menee hukkaan!");
      if (money < 150000) return msg.channel.send("Lol, köyhä " + jaa);


      data[customer]["omistus"]["kultainen_harppuuna"] = true;
      data[customer]["omistus"]["rahat"] -= 150000;

      msg.channel.send("Onnittelut! Sulla on nyt kultainen harppuuna!");

    } else if (purchase.toLowerCase() == "valaankasvatusohjelma") {

      if (data[customer]["omistus"]["valaankasvatusohjelma"] == true) return msg.channel.send("Älä osta toista harpuunaa, menee hukkaan!");
      if (money < 240000) return msg.channel.send("Lol, köyhä " + jaa);


      data[customer]["omistus"]["kultainen_harppuuna"] = true;
      data[customer]["omistus"]["rahat"] -= 240000;

      msg.channel.send("Onnittelut! Sulla on nyt kultainen harppuuna!");

    } else {
      msg.channel.send("Et voi ostaa mitään ihme " + purchase + " -juttua...");
    }
    firebase.database().ref('profiles').set(data);

  },

  'inv' : (msg) => {
    let name = msg.content.split(' ')[1];

    ref.on('value', gotData, errData);
    var sender_id = msg.author.id;

    user_check_database(sender_id);

    if ((name == '' || name === undefined)) return print_inventory(sender_id);

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

    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

    user_check_database(name);
    print_inventory(name);

    function print_inventory(_id) {
      var avatar;

      client.fetchUser(_id).then(myUser => {
        avatar = myUser.avatarURL;
        jatka(avatar);
      });

      function jatka(avatar) {
        var items = "Ei mitään";
        var lootboxes = "";
        var keyitems = "";
        if ("inventory" in data[_id]["omistus"]){
          items = "";
          var items1 = "";
          var items2 = "";
          var items3 = "";
          var items4 = "";
          var items5 = "";
          var items6 = "";
          var items7 = "";
          var items8 = "";
          var items9 = "";
          var items10 = "";
          var items11 = "";
          var items12 = "";
          for (let item in data[_id]["omistus"]["inventory"]) {
            if (item == "kepit") {
              items1 += keppi + " Kepit: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "sytti") {
              items2 += sytti + " Sytit: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "supersytti") {
              items3 += supersytti + " Supersytit: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "hypersytti") {
              items4 += hypersytti + " Hypersytit: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "maskit") {
              items5 += maski + " Maskit: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "tulokone") {
              items6 += tulokone + " Tulokoneet: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "tulokone-x") {
              items7 += tulokonex + " Tulokone-X: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "tulokiihdytin") {
              items8 += tulokiihdytin + " Tulokiihdyttimet: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "tuloimu") {
              items9 += tuloimu + " Tuloimut: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "gem") {
              items10 += gem + " Gemit: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "dupepyssyt") {
              items11 += dupepyssy + " Dupepyssyt: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
            if (item == "perustulo") {
              items12 += _perustulo + " Perustulot: " + data[_id]["omistus"]["inventory"][item] + "\n";
            }
          }
        }
        items = items1+items2+items3+items4+items5+items6+items7+items8+items9+items10+items11+items12;

        lootboxes += chest_common + " Common: " + data[_id]["omistus"]["lootboxit"]["common"] + " (" + (data[_id]["omistus"]["avatut_lootboxit"]["common"]+data[_id]["omistus"]["lootboxit"]["common"]) + ")\n";
        lootboxes += chest_uncommon + " Uncommon : " + data[_id]["omistus"]["lootboxit"]["uncommon"] + " (" + (data[_id]["omistus"]["avatut_lootboxit"]["uncommon"]+data[_id]["omistus"]["lootboxit"]["uncommon"]) + ")\n";
        lootboxes += chest_rare + " Rare: " + data[_id]["omistus"]["lootboxit"]["rare"] + " (" + (data[_id]["omistus"]["avatut_lootboxit"]["rare"]+data[_id]["omistus"]["lootboxit"]["rare"]) + ")\n";
        lootboxes += chest_epic + " Epic: " + data[_id]["omistus"]["lootboxit"]["epic"] + " (" + (data[_id]["omistus"]["avatut_lootboxit"]["epic"]+data[_id]["omistus"]["lootboxit"]["epic"]) + ")\n";
        lootboxes += chest_legendary + " Legendary: " + data[_id]["omistus"]["lootboxit"]["legendary"] + " (" + (data[_id]["omistus"]["avatut_lootboxit"]["legendary"]+data[_id]["omistus"]["lootboxit"]["legendary"]) + ")\n";


        if (data[_id]["omistus"]["kultainen_harppuuna"]) {
          keyitems += harpoon_e + "\n";
        }
        if (data[_id]["omistus"]["onki"]) {
          keyitems += onki + "\n";
        }
        if (data[_id]["omistus"]["hiilikuituonki"]) {
          keyitems += hiilikuituonki + "\n";
        }

        if (keyitems == "") {
          keyitems = "Ei mitään";
        }


        msg.channel.send({
          "embed": {
            "title": "***INVENTORY***",
            "color": 15466496,
            "thumbnail": {
              "url": avatar
            },
            "fields": [{
                "name": "***___Tavarat:___***",
                "value": items
              },
              {
                "name": "***___Avaintavarat:___***",
                "value": keyitems
              },
              {
                "name": "***___LootBoxit:___***",
                "value": lootboxes
              }
            ]
          }
        })
      }
    }
  },

  'avaa' : (msg) => {
    ref.on('value', gotData, errData);
    let type = msg.content.split(' ')[1];

    if ((type == '' || type === undefined)) {
      if ( data[msg.author.id]["omistus"]["lootboxit"]["common"] > 0) {
        type = "common";
      }
      else if ( data[msg.author.id]["omistus"]["lootboxit"]["uncommon"] > 0) {
        type = "uncommon";
      }
      else if (data[msg.author.id]["omistus"]["lootboxit"]["rare"] > 0) {
        type = "rare";
      }
      else if (data[msg.author.id]["omistus"]["lootboxit"]["epic"] > 0) {
        type = "epic";
      }
      else if (data[msg.author.id]["omistus"]["lootboxit"]["legendary"] > 0) {
        type = "legendary";
      } else {
        return msg.channel.send(`Sinulla ei ole LootBoxeja...`);
      }
    }

    var boxtypes = ["uncommon", "common", "rare", "epic", "legendary"];
    if (!(boxtypes.includes(type))) return msg.channel.send(`Ei ole olemassa tuollaista LootBoxia.`);

    if (data[msg.author.id]["omistus"]["lootboxit"][type] > 0) {

      data[msg.author.id]["omistus"]["lootboxit"][type] -= 1;
      firebase.database().ref('profiles').set(data);
      open_lootbox(msg, msg.author.id, type);

    } else {
      msg.channel.send(`Sulla ei ole LootBoxia...`);
    }

    function open_lootbox(_msg, _id, _rarity) {
      ref.on('value', gotData, errData);
      var color;
      if (_rarity == "common") {
        msg1 = chest_common + " Common LootBox" ;
        msg2 = "";
        color = 10197915;
        data[_id]["omistus"]["avatut_lootboxit"]["common"] += 1;
        for (var x = 0; x < 2; x++) {
          var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
          if (rnd > 9) {
            msg2 += "- Paska (ei mitään)\n";
          }
          else if (rnd > 5) {
            msg2 += "- 500" + coins + "\n";
            data[_id]["omistus"]["rahat"] += 500;
          }
          else if (rnd > 2) {
            msg2 += "- 500" + es + "\n";
            data[_id]["omistus"]["ES"] += 500;
          }
          else if (rnd >= 0) {
            msg2 += "- 2 x "+ sytti + "\n";
            if (!("inventory" in data[_id]["omistus"])) {
              data[_id]["omistus"]["inventory"] = {};
            }
            if (!("sytti" in data[_id]["omistus"]["inventory"])) {
              data[_id]["omistus"]["inventory"]["sytti"] = 0;
            }
            data[_id]["omistus"]["inventory"]["sytti"] += 2;
          }
        }
      }
      if (_rarity == "uncommon") {
        msg1 = chest_uncommon + " Uncommon LootBox" ;
        msg2 = "";
        color = 1276418;
        data[_id]["omistus"]["avatut_lootboxit"]["uncommon"] += 1;
        for (var x = 0; x < 2; x++) {
          var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
          if (rnd > 90) {
            msg2 += "- 3 Keppiä " + keppi + "\n";
            if (!("inventory" in data[_id]["omistus"])) {
              data[_id]["omistus"]["inventory"] = {};
            }
            if (!("kepit" in data[_id]["omistus"]["inventory"])) {
              data[_id]["omistus"]["inventory"]["kepit"] = 0;
            }
            data[_id]["omistus"]["inventory"]["kepit"] += 5;
          }
          else if (rnd > 55) {
            msg2 += "- 2000" + coins + "\n";
            data[_id]["omistus"]["rahat"] += 2000;
          }
          else if (rnd > 37) {
            msg2 += "- 2000" + es + "\n";
            data[_id]["omistus"]["ES"] += 2000;
          }
          else if (rnd > 27) {
            msg2 += "- 1 x " + supersytti + "!\n";
            if (!("inventory" in data[_id]["omistus"])) {
              data[_id]["omistus"]["inventory"] = {};
            }
            if (!("supersytti" in data[_id]["omistus"]["inventory"])) {
              data[_id]["omistus"]["inventory"]["supersytti"] = 0;
            }
            data[_id]["omistus"]["inventory"]["supersytti"] += 1;
          }
          else if (rnd > 2) {
            msg2 += "- 4 x "+ sytti + "\n";
            if (!("inventory" in data[_id]["omistus"])) {
              data[_id]["omistus"]["inventory"] = {};
            }
            if (!("sytti" in data[_id]["omistus"]["inventory"])) {
              data[_id]["omistus"]["inventory"]["sytti"] = 0;
            }
            data[_id]["omistus"]["inventory"]["sytti"] += 4;
          }
          else if (rnd >= 0) {
            if (data[_id]["omistus"]["onki"] == false){
              msg2 += "- "+ onki +" Onki! (Saatavilla vain kerran)\n";
              data[_id]["omistus"]["onki"] = true;

            } else {
              msg2 += "- 3 x "+ sytti;
              if (!("inventory" in data[_id]["omistus"])) {
                data[_id]["omistus"]["inventory"] = {};
              }
              if (!("sytti" in data[_id]["omistus"]["inventory"])) {
                data[_id]["omistus"]["inventory"]["sytti"] = 0;
              }
              data[_id]["omistus"]["inventory"]["sytti"] += 3;
            }
          }
        }
      }
      if (_rarity == "rare") {
        msg1 = chest_rare + " Rare LootBox" ;
        msg2 = "";
        color = 1146367;
        data[_id]["omistus"]["avatut_lootboxit"]["rare"] += 1;
        var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
        if (rnd > 80) {

          if (data[_id]["omistus"]["onki"] == false){
            msg2 += "- "+ onki +" Onki! (Saatavilla vain kerran)\n";
            data[_id]["omistus"]["onki"] = true;

          } else {
            msg2 += "- 10 x "+ sytti +"!\n- 5000" + coins;
            if (!("inventory" in data[_id]["omistus"])) {
              data[_id]["omistus"]["inventory"] = {};
            }
            if (!("sytti" in data[_id]["omistus"]["inventory"])) {
              data[_id]["omistus"]["inventory"]["sytti"] = 0;
            }
            data[_id]["omistus"]["inventory"]["sytti"] += 10;
            data[_id]["omistus"]["rahat"] += 5000;
          }


        }
        else if (rnd > 50) {
          msg2 += "- 10000" + coins + "\n- 10000" + es;
          data[_id]["omistus"]["rahat"] += 10000;
          data[_id]["omistus"]["ES"] += 10000;
        }
        else if (rnd > 25) {
          msg2 += "- " + tulokone + "Tulokone\n";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("tulokone" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["tulokone"] = 0;
          }
          data[_id]["omistus"]["inventory"]["tulokone"] += 1;
        }
        else if (rnd > 25) {
          msg2 += "- 1 x " + hypersytti + " Hypersytti\n";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("hypersytti" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["hypersytti"] = 0;
          }
          data[_id]["omistus"]["inventory"]["hypersytti"] += 1;
        }
        else if (rnd >= 0) {
          msg2 += "- 5 x " + supersytti + " Supersytti";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("supersytti" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["supersytti"] = 0;
          }
          data[_id]["omistus"]["inventory"]["supersytti"] += 5;
        }
      }
      if (_rarity == "epic") {
        msg1 = chest_epic + " Epic LootBox" ;
        msg2 = "";
        color = 12390624;
        data[_id]["omistus"]["avatut_lootboxit"]["epic"] += 1;
        var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
        if (rnd > 90) {
          msg2 += "- " + _perustulo + "Perustulo +5!";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("perustulo" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["perustulo"] = 0;
          }
          data[_id]["omistus"]["inventory"]["perustulo"] += 1;
        }
        else if (rnd > 65) {
          msg2 += "- 5 " + maski;
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("maskit" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["maskit"] = 0;
          }
          data[_id]["omistus"]["inventory"]["maskit"] += 5;
        }
        else if (rnd > 55) {
          msg2 += "- " + tulokone_x + " Tulokone-X";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("tulokone-x" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["tulokone-x"] = 0;
          }
          data[_id]["omistus"]["inventory"]["tulokone-x"] += 1;
        }
        else if (rnd > 35) {
          msg2 += "- 5 x " + hypersytti + " Hypersytti";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("hypersytti" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["hypersytti"] = 0;
          }
          data[_id]["omistus"]["inventory"]["hypersytti"] += 5;
        }
        else if (rnd > 20) {
          msg2 += "- " + tuloimu + " Tuloimu!";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("tuloimu" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["tuloimu"] = 0;
          }
          data[_id]["omistus"]["inventory"]["tuloimu"] += 1;
        }
        else if (rnd >= 0) {
          msg2 += "- 50000" + coins + "\n";
          data[_id]["omistus"]["rahat"] += 50000;

        }
      }
      if (_rarity == "legendary") {
        msg1 = chest_legendary + " Legendary LootBox" ;
        msg2 = "";
        color = 16098851;
        data[_id]["omistus"]["avatut_lootboxit"]["legendary"] += 1;
        var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
        if (rnd > 80) {
          if (data[_id]["omistus"]["kultainen_harppuuna"] == false){
            msg2 += "- " + harpoon_e + "Kultainen harpuuna! (Saatavilla vain kerran)";
            data[_id]["omistus"]["kultainen_harppuuna"] = true;

          } else {
            msg2 += "- 100000" + coins;
            data[_id]["omistus"]["rahat"] += 100000;
          }
        }
        else if (rnd > 60) {
          msg2 += "- "+ dupepyssy + " Dupepyssy!";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("dupepyssyt" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["dupepyssyt"] = 0;
          }
          data[_id]["omistus"]["inventory"]["dupepyssyt"] += 1;
        }
        else if (rnd > 40) {
          msg2 += "- " + gem + " Gem!";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("gem" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["gem"] = 0;
          }
          data[_id]["omistus"]["inventory"]["gem"] += 1;
        }
        else if (rnd > 20) {
          if (data[_id]["omistus"]["hiilikuituonki"] == false){
            msg2 += "- "+ hiilikuituonki + " Hiilikuituonki (Saatavilla vain kerran)";
            data[_id]["omistus"]["hiilikuituonki"] = true;

          } else {
            msg2 += "- 80000" + coins + "\n- " + hypersytti + " Hypersytti!";
            data[_id]["omistus"]["rahat"] += 100000;
            if (!("inventory" in data[_id]["omistus"])) {
              data[_id]["omistus"]["inventory"] = {};
            }
            if (!("hypersytti" in data[_id]["omistus"]["inventory"])) {
              data[_id]["omistus"]["inventory"]["hypersytti"] = 0;
            }
            data[_id]["omistus"]["inventory"]["hypersytti"] += 1;
          }
        }
        else if (rnd >= 0) {
          msg2 += "- " + tulokiihdytin + " Tulokiihdytin!\n";
          if (!("inventory" in data[_id]["omistus"])) {
            data[_id]["omistus"]["inventory"] = {};
          }
          if (!("tulokiihdytin" in data[_id]["omistus"]["inventory"])) {
            data[_id]["omistus"]["inventory"]["tulokiihdytin"] = 0;
          }
          data[_id]["omistus"]["inventory"]["tulokiihdytin"] += 1;
        }
      }

      firebase.database().ref('profiles').set(data);
      _msg.channel.send({
        "embed": {
          "title": "***" + msg1 + "***",
          "color": color,
          "fields": [{
              "name": "***___Loot:___***",
              "value": msg2
            }
          ]
        }
      });
    }
  },

  'aktivoi' : (msg) => {

    let item = msg.content.split(' ')[1];
    let name = msg.content.split(' ')[2];

    if ((name == '' || name === undefined)) {
      name = msg.author.id;
    }

    if ((item == '' || item === undefined)) {
      return msg.channel.send(`Valitse aktivoitava tavara ja mahdollinen kohde!`);
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

    if (!flag) return ref.on('value', gotData, errData);
    ref.on('value', gotData, errData);


    var target_id = name;
    var sender_id = msg.author.id;

    user_check_database(target_id);
    user_check_database(sender_id);


    if (!("inventory" in data[sender_id]["omistus"])) return msg.channel.send(`Sulla ei ole mitään tavaraa...`);

    if (item == "tulokone" ) {
      if (!("tulokone" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole Tulokonetta`);
      if ("tulokoneajastin" in data[sender_id]) return msg.channel.send(`Sulla on jo Tulokone päällä!`);
      data[sender_id]["tulokoneajastin"] = {
        "tulokonetier" : 1,
        "tulokoneaika": 60,
        "summa" : 0
      };

      data[sender_id]["omistus"]["inventory"]["tulokone"] -= 1;
      if (data[sender_id]["omistus"]["inventory"]["tulokone"] == 0) {
        delete data[sender_id]["omistus"]["inventory"]["tulokone"];
      }

      msg.channel.send(`Hurraa! Tulokone hurraa!`);
      firebase.database().ref('profiles').set(data);
      return;
    }
    else if (item == "tulokone-x" ) {
      if (!("tulokone-x" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole Tulokone-X:ää`);
      if ("tulokoneajastin" in data[sender_id]) return msg.channel.send("Sulla on jo Tulokone päällä!");
      data[sender_id]["tulokoneajastin"] = {
        "tulokonetier" : 2,
        "tulokoneaika": 60,
        "summa" : 0,
      };

      data[sender_id]["omistus"]["inventory"]["tulokone-x"] -= 1;
      if (data[sender_id]["omistus"]["inventory"]["tulokone-x"] == 0) {
        delete data[sender_id]["omistus"]["inventory"]["tulokone-x"];
      }

      msg.channel.send(`Hurraa! Tulokone-X hurraa!`);
      firebase.database().ref('profiles').set(data);
      return;
    }
    else if (item == "tulokiihdytin" ) {
      if (!("tulokiihdytin" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole Tulokiihdytintä`);
      if ("tulokoneajastin" in data[sender_id]) return msg.channel.send(`Sulla on jo Tulokone päällä!`);
      data[sender_id]["tulokoneajastin"] = {
        "tulokonetier" : 4,
        "tulokoneaika": 60,
        "summa" : 0
      };

      data[sender_id]["omistus"]["inventory"]["tulokiihdytin"] -= 1;
      if (data[sender_id]["omistus"]["inventory"]["tulokiihdytin"] == 0) {
        delete data[sender_id]["omistus"]["inventory"]["tulokiihdytin"];
      }

      msg.channel.send(`Hurraa! Tulokiihdytin hurraa!`);
      firebase.database().ref('profiles').set(data);
      return;
    }
    else if (item == "gem" ) {
      if (!("gem" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole gemiä...`);

        data[name]["omistus"]["rahat"] = data[name]["omistus"]["rahat"] * 2;
        msg.channel.send(`Uiui, rahasi tuplaantuivat!`);

        data[sender_id]["omistus"]["inventory"]["gem"] -= 1;
        if (data[sender_id]["omistus"]["inventory"]["gem"] == 0) {
          delete data[sender_id]["omistus"]["inventory"]["gem"];
        }
    }
    else if (item == "perustulo" ) {
      if (!("perustulo" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole perustuloa...`);

        data[name]["omistus"]["perustulo"] += 5;
        msg.channel.send(`Uiui, sait perustuloa +5!`);

        data[sender_id]["omistus"]["inventory"]["perustulo"] -= 1;
        if (data[sender_id]["omistus"]["inventory"]["perustulo"] == 0) {
          delete data[sender_id]["omistus"]["inventory"]["perustulo"];
        }
    }

    if ("ironman" in data[sender_id]) return msg.channel.send(`Olet Ironman... et voi koskea muihin`);
    if ("ironman" in data[target_id]) return msg.channel.send(`Kohde on Ironman...`);

    if (item == "keppi" ) {

      if (!("kepit" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole keppejä`);
      if (name == sender_id) return msg.channel.send(`Ai vittu!`);
        var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
        if (rnd > 3 && data[name]["omistus"]["rahat"] > 100) {
          msg.channel.send("Löit jäbää <@" + name +  ">! Hän pudotti 100" + coins + " maahan... Keppikin meni poikki...");
          data[name]["omistus"]["rahat"] -= 100;
        } else {
          msg.channel.send("Löit jäbää <@" + name +  ">! Hän muistaa tämän seuraavan kerran... Keppi meni poikki...");
        }
        data[sender_id]["omistus"]["inventory"]["kepit"] -= 1;
        data[sender_id]["omistus"]["lyöty"] += 1;
        data[target_id]["omistus"]["suo_lyöty"] += 1;
        if (data[sender_id]["omistus"]["inventory"]["kepit"] == 0) {
          delete data[sender_id]["omistus"]["inventory"]["kepit"];
        }
    }
    if (item == "maski" ) {
      if (name == sender_id) return msg.channel.send(`Et voi varastaa omaa rahaa, lol!`);
      if (!("maskit" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole maskeja`);
      if (data[name]["omistus"]["rahat"] <= 0) return msg.channel.send(`Kohteella ei ole oikein rahaa...`);
        var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
        var sum = Math.floor(Math.random() * Math.floor(data[name]["omistus"]["rahat"]/100 + 1))*10+10;
        if (sum > 28000){
          sum == 28000;
        }

        if (rnd > 2) {
          msg.channel.send("Varastit jäbältä <@" + name +  ">! Sait: " + sum + coins);
          data[sender_id]["omistus"]["rahat"] += sum;
          data[sender_id]["omistus"]["varastetut"] += sum;
          data[name]["omistus"]["rahat"] -= sum;
          data[name]["omistus"]["sulta_varastetut"] -= sum;
        } else {
          msg.channel.send("Jäit kiinni varastaessasi jäbältä <@" + name +  ">! Sait sakkoa " + sum + coins + ". Kohdehenkilö saa korvausta: " + Math.floor(sum/2) + coins);
          data[sender_id]["omistus"]["rahat"] -= sum;
          data[sender_id]["omistus"]["sakot"] += sum;
          data[name]["omistus"]["rahat"] += Math.floor(sum/2);
          data[name]["omistus"]["korvaukset"] += Math.floor(sum/2);
        }
        data[sender_id]["omistus"]["inventory"]["maskit"] -= 1;
        if (data[sender_id]["omistus"]["inventory"]["maskit"] == 0) {
          delete data[sender_id]["omistus"]["inventory"]["maskit"];
        }
    }
    if (item == "dupepyssy" ) {
      if (name == sender_id) return msg.channel.send(`Et voi käyttää pyssyä itseesi, pelottaa!`);
      if (!("dupepyssyt" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole dupepyssyä...`);

        data[name]["omistus"]["rahat"] = data[name]["omistus"]["rahat"] * 2;
        msg.channel.send(`Uiui, hänen rahat tuplaantuivat!`);

        data[sender_id]["omistus"]["inventory"]["dupepyssyt"] -= 1;
        if (data[sender_id]["omistus"]["inventory"]["dupepyssyt"] == 0) {
          delete data[sender_id]["omistus"]["inventory"]["dupepyssyt"];
        }
    }
    if (item == "tuloimu" ) {
      if (!("tuloimu" in data[sender_id]["omistus"]["inventory"])) return msg.channel.send(`Sulla ei ole Tuloimuria`);
      if ("tuloimuajastin" in data[sender_id]) return msg.channel.send(`Sulla on jo imuri päällä!`);
      data[sender_id]["tuloimuajastin"] = {
        "kohde" : name,
        "tuloimuaika": 240,
        "summa": 0
      };

      data[sender_id]["omistus"]["inventory"]["tuloimu"] -= 1;
      if (data[sender_id]["omistus"]["inventory"]["tuloimu"] == 0) {
        delete data[sender_id]["omistus"]["inventory"]["tuloimu"];
      }

      msg.channel.send(`Imet tuloa!`);
    }

    firebase.database().ref('profiles').set(data);

  },

  // Other commands

  'juo': (msg) => {

    user_check_database(msg.author.id);

    if (data[msg.author.id]["omistus"]["ES"] <= 0) return msg.channel.send("Sulla ei oo juotavaa... ostas ES");

    data[msg.author.id]["omistus"]["ES"] -= 1;
    data[msg.author.id]["omistus"]["ES_tyhjät"] += 1;

    const answers = [
      "Bärbär",
      "ES jumalten juoma, jonnen parhain kuoma!",
      "Saa keulisuitn moposi!",
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

    var rnd = Math.floor(Math.random() * Math.floor(answers.length));
    msg.channel.send(answers[rnd]);
    firebase.database().ref('profiles').set(data);


  },

  'ironman': (msg) => {
    ref.on('value', gotData, errData);
    if ("ironman" in data[msg.author.id]) return msg.channel.send(`Olet jo Ironman, etkä muuksi muutu...`);
    data[msg.author.id]["ironman"] = true;

    msg.channel.send(`Olet nyt Ironman. Sinä et voi vaihtaa mitään. Muut eivät voi varastaa sinulta, etkä sinä muilta!`);
    firebase.database().ref('profiles').set(data);
  },

  'dj': (msg) => {
    ref.on('value', gotData, errData);

    if (data["dj"] == undefined) {
      if (msg.member.voiceChannel === undefined) return msg.channel.send("Kaikkien ehdokkaiden pitää olla voicein_channel, myös sun!");
      var in_channel = msg.member.voiceChannel.members.keyArray();
      var rnd = Math.floor(Math.random() * Math.floor(in_channel.length + 1));
      data["dj"] = "<@" + in_channel[rnd] + ">";
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
      user_check_database(id);

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

    richest_list = "";

    for (var i = 0; i < items.length; i++) {
      richest_list += i + 1 + ". <@" + items[i].id + "> : " + items[i].val + coins + " (" + data[items[i].id]["omistus"]["perustulo"] + "/min)\n";
    }

    msg.channel.send({
      "embed": {
        "title": "***RIKKAIMMAT***",
        "color": 15466496,
        "description": richest_list
      },
    });
    firebase.database().ref('profiles').set(data);
  },

  'suurimmat_summat': (msg) => {
    ref.on('value', gotData, errData);

    var w_l = {};
    for (var id in data) {
      user_check_database(id);

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

    peakest_list = "";

    for (var i = 0; i < items.length; i++) {
      peakest_list += i + 1 + ". <@" + items[i].id + "> : " + items[i].val + coins + '\n';
    }

    msg.channel.send({
      "embed": {
        "title": "***SUURIMMAT SUMMAT (Peakannut korkeimmillaan)***",
        "color": 15466496,
        "description": peakest_list
      },
    });
    firebase.database().ref('profiles').set(data);
  },

  'aktiivisimmat': (msg) => {
    ref.on('value', gotData, errData);

    var w_l = {};
    for (var id in data) {
      user_check_database(id);

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

    most_active_list = "";

    for (var i = 0; i < items.length; i++) {
      most_active_list += i + 1 + ". <@" + items[i].id + "> : " + items[i].val + " mins\n";
    }

    msg.channel.send({
      "embed": {
        "title": "***AKTIIVISIMMAT***",
        "color": 15466496,
        "description": most_active_list
      },
    });
    firebase.database().ref('profiles').set(data);
  },

  'profiilit': (msg) => {
    ref.on('value', gotData, errData);

    var all_profiles = "";
    for (var id in data) {
      user_check_database(id);
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

    if (!flag) return msg.channel.send(`Kelvoton nimi.`);
    ref.on('value', gotData, errData);


    var target_id = name;
    var sender_id = msg.author.id;

    user_check_database(target_id);

    if ((category == '' || category === undefined)) {

      print_profile(target_id, msg);

    } else {

      if (target_id === sender_id) return msg.channel.send("Et voi muokata osuit profiiliasi...");

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
          msg.channel.send("Vialliset komennot...");
          return;
        }

        firebase.database().ref('profiles').set(data);

      } else {
        msg.channel.send("Vain Aktiiviset ja Adminit voi muuttaa profiileja!");
      }
    }
  },

  'pääpäivä': (msg) => {
    var date = new Date();
    date_array = [date.getDate(), date.getMonth(), date.getYear()];

    if (date_array[0] == data["date"][0] && date_array[1] == data["date"][1] && date_array[2] == data["date"][2]) {
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
      change_title("PÄÄPÄIVÄ");
      if (pääpäivä == true) {
        msg.channel.send("Tänään on jo pääpäivä!");

      } else {
        pääpäivä = true;
        msg.channel.send("Pääpäivä päätetty! Tänään on pääpäivä!");

        var link = "https://www.youtube.com/watch?v=687_ZGkP6OU";

        commands.play(msg, link);

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
    let this_date = new Date();

    let day = this_date.getDay();
    console.log(this_date + " " + day);

    if (day == 3) {

      msg.channel.send("Valitettavasti wednesdayn aplikaatio on vielä work in progress, mutta ON WEDNESDAY");
    } else {
      msg.channel.send("Valitettavasti wednesdayn aplikaatio on vielä work in progress, mutta ei oo wednesday :(");
    }

  },

  'kruuna': (msg) => {

    result = Math.floor(Math.random() * Math.floor(2));

    if (result === 1) {
      msg.channel.send("Klaava, " + "hävisit " + msg.author.username);
    } else {
      msg.channel.send("Kkruuna, " + "voitit " + msg.author.username);
    }
  },

  'klaava': (msg) => {

    result = Math.floor(Math.random() * Math.floor(2));

    if (result === 1) {
      msg.channel.send("Kruuna, " + "hävisit " + msg.author.username);
    } else {
      msg.channel.send("Kklaava, " + "voitit " + msg.author.username);
    }
  },

  'onkokarvisvammanen': (msg) => {
    msg.channel.send("ON");
  },

  'onkovammanen': (msg) => {
    let dude = msg.content.split(' ')[1];
    if ((dude == '' || dude === undefined)) return msg.channel.send(`Ketä tarkoitat?`);

    result = Math.floor(Math.random() * Math.floor(2));

    if (result === 1) {
      msg.channel.send(dude + " on vammanen.");
    } else {
      msg.channel.send(dude + " ei ole vammanen");
    }

  },

  // MusicBot

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
        if (url == '' || url === undefined) return msg.channel.send(`Laita Youtube linkki tai ID tämän jälkeen: ${tokens.prefix}add`);
      }
      console.log("aloitetaan lataus");
      yt.getInfo(url, (err, info) => {
        if (err) return msg.channel.send('Kelvotonta linkkiä: ' + err);
        if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
        queue[msg.guild.id].songs.push({
          url: url,
          title: info.title,
          requester: msg.author.username
        });
        msg.channel.send(`**${info.title}** jonossa!`);
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
        msg.channel.send(`Soitetaan: **${song.title}**, jäbän **${song.requester}** toiveesta!`);
        dispatcher = msg.guild.voiceConnection.playStream(yt(song.url), streamOptions);
        console.log("Ruvettiin soittasuitn");
        let collector = msg.channel.createCollector(m => m);
        collector.on('collect', m => {
          if (m.content.startsWith(tokens.prefix + 'pause')) {
            msg.channel.send('Pauseettu').then(() => {
              dispatcher.pause();
            });
          } else if (m.content.startsWith(tokens.prefix + 'resume')) {
            msg.channel.send('Jatketaan').then(() => {
              dispatcher.resume();
            });
          } else if (m.content.startsWith(tokens.prefix + 'skip')) {
            msg.channel.send('Skipattu').then(() => {
              dispatcher.end();
            });
          } else if (m.content.startsWith(tokens.prefix + 'time')) {
            msg.channel.send(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
          }
        });
        dispatcher.on('end', () => {
          collector.stop();
          play(queue[msg.guild.id].songs.shift());
        });
        dispatcher.on('error', (err) => {
          return msg.channel.send('error: ' + err).then(() => {
            collector.stop();
            play(queue[msg.guild.id].songs.shift());
          });
        });
      })(queue[msg.guild.id].songs.shift());
    }
  },

  'queue': (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.send(`Laita ttuneja jonoon: ${tokens.prefix}add`);
    let tosend = [];
    queue[msg.guild.id].songs.forEach((song, i) => {
      tosend.push(`${i+1}. ${song.title} - Tilaaja: ${song.requester}`);
    });
    msg.channel.send(`__**${msg.guild.name}, Musiikki jono:**__ Nyt **${tosend.length}** ttunea jonossa ${(tosend.length > 15 ? '*[Näyttää vain 15 viimeisintä]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
  },

  // Tool Commands

  'sano': (msg) => {
    if (msg.author.id != "247754056804728832") return msg.delete();
    let text_parts = msg.content.split(' ');
    str = "";
    for (var i = 1; i < text_parts.length; i++) {
      str += text_parts[i] + " ";
    }
    msg.channel.send(str);
    msg.delete();

  },

  'siirräsaldo': (msg) => {
    if (msg.author.id != "247754056804728832") return msg.delete();

    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];
    let product = msg.content.split(' ')[3];

    const products = ["rahat", "ES"];

    if (product == undefined || product == null) {
      product = "rahat";
    }

    if (!products.includes(product)) return;

    if (product == "es") {
      product = product.toUpperCase();
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

    user_check_database(target_id)


    if (product == "rahat") {
      data[target_id]["omistus"]["rahat"] += parseInt(amount);

      if (data[target_id]["omistus"]["rahat"] > data[target_id]["omistus"]["maxrahat"]) {
        data[target_id]["omistus"]["maxrahat"] = data[target_id]["omistus"]["rahat"]
      }

    } else {
      data[target_id]["pelit"][product] += parseInt(amount);
    }

    mark = "+";
    if (amount < 0) {
      mark = ""
    }

    firebase.database().ref('profiles').set(data);
    msg.channel.send("<@" + target_id + ">:lle " + product.charAt(0).toUpperCase() + product.slice(1) + " - Saldoa muutettu " + mark + amount + "!")
    msg.delete();

  },

  'muutasaldo': (msg) => {
    if (msg.author.id != "247754056804728832") return msg.delete();

    let name = msg.content.split(' ')[1];
    let amount = msg.content.split(' ')[2];
    let product = msg.content.split(' ')[3];

    const products = ["rahat", "ES"];

    if (product == undefined || product == null) {
      product = "rahat";
    }

    if (!products.includes(product)) return msg.channel.send("");


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

    user_check_database(target_id)


    if (product == "rahat") {
      data[target_id]["omistus"]["rahat"] = parseInt(amount);

      if (data[target_id]["omistus"]["rahat"] > data[target_id]["omistus"]["maxrahat"]) {
        data[target_id]["omistus"]["maxrahat"] = data[target_id]["omistus"]["rahat"]
      }

    } else {
      data[target_id]["pelit"][product] = parseInt(amount);
    }

    mark = "";
    if (amount < 0) {
      mark = "-"
    }

    firebase.database().ref('profiles').set(data);
    msg.channel.send("<@" + target_id + ">:lle " + product.charAt(0).toUpperCase() + product.slice(1) + " - Saldo nyt " + mark + amount + "!")
    msg.delete();

  },

  'purge': (msg) => {
    // This command removes all messages from all users in the channel, up to 100.
    if (msg.author.id != "247754056804728832") return msg.delete();
    let amount = msg.content.split(' ')[1];
    // get the delete count, as an actual number.
    if ((amount == '' || amount === undefined)) {
      msg.channel.send("Kirjoita !purge ja määrä");
      return;
    }

    if (isNaN(amount)) return msg.channel.send("Purge tarvitsee olla positiivinen luku");
    if (amount < 2) return msg.channel.send(`Purge pitää olla vähintään 2 `);

    amount = Math.floor(amount);

    // So we get our messages, and delete them. Simple enough, right?
    msg.channel.fetchMessages({
      limit: amount + 1
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

  // Help

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
            name: tokens.prefix + "Ammu [asteet 1-90] [voima 1-100]",
            value: "Ampuu harppuunan"
          },
          {
            name: tokens.prefix + "Kalasta [Syvyys 1-10] [Matka 1-100] [Paikka/Sytti]",
            value: "Kalastetaan! Tarvitset ongen. Jos tavallinen sytti, valitse paikka: (joki, järvi, meri). Jos erikoisytti, niin laita sen nimi."
          },
          {
            name: tokens.prefix + "bj + (panos)",
            value: "Pelaa Blackjackiä. !hit, !stand, !double"
          },
          {
            name: tokens.prefix + "kaikkitaieimitään",
            value: "Uhkapelaa rahaasi tuplaamalla... uskallatko?"
          },
          {
            name: tokens.prefix + "voittotaulu",
            value: "Näyttää voittostaulun"
          },
          {
            name: tokens.prefix + "kauppa",
            value: "Näyttää kaikki tarjolla olevat products"
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

// Loads emojies to server
function loadEmojies() {
  coins = client.emojis.find(x => x.name === "coin");

  karvis = client.emojis.find(x => x.name === "karvis");
  sasu = client.emojis.find(x => x.name === "sasu");
  protect = "\:watermelon:";
  poggers = client.emojis.find(x => x.name === "poggers");
  kys = client.emojis.find(x => x.name === "alfa");
  tyhjä = "\:x:";
  es = client.emojis.find(x => x.name === "ES");
  harpoon_e = client.emojis.find(x => x.name === "harpuuna");
  jaa = client.emojis.find(x => x.name === "jaa");
  empty_e = client.emojis.find(x => x.name === "empty");
  card_emojies = {};

  for (let m = 0; m < 5; m++) {
    let suit;
    if (m == 0) {
      suit = "S";
    } else if (m == 1){
      suit = "H";
    } else if (m == 2) {
      suit = "D";
    } else if (m == 3) {
      suit = "C";
    }
    for (let k = 1; k < 15; k++) {
      card_emojies[k + suit + ""] = client.emojis.find(x => x.name === "" + k + suit);
    }
  }
  card_back = client.emojis.find(x => x.name === "back");
  hit_emoji = client.emojis.find(x => x.name === "H_");
  double_emoji = client.emojis.find(x => x.name === "D_");
  stand_emoji = client.emojis.find(x => x.name === "S_");
  jako_emoji = client.emojis.find(x => x.name === "J_");
  poggersrow = client.emojis.find(x => x.name === "PoggersRow");

  chest_common = client.emojis.find(x => x.name === "chest_common");
  chest_uncommon = client.emojis.find(x => x.name === "chest_uncommon");
  chest_rare = client.emojis.find(x => x.name === "chest_rare");
  chest_epic = client.emojis.find(x => x.name === "chest_epic");
  chest_legendary = client.emojis.find(x => x.name === "chest_legendary");

  sytti = client.emojis.find(x => x.name === "sytti");
  supersytti = client.emojis.find(x => x.name === "supersytti");
  hypersytti = client.emojis.find(x => x.name === "hypersytti");

  maski = client.emojis.find(x => x.name === "maski");
  onki = client.emojis.find(x => x.name === "onki");
  hiilikuituonki = client.emojis.find(x => x.name === "hiilikuituonki");
  gem = client.emojis.find(x => x.name === "gemi");
  dupepyssy = client.emojis.find(x => x.name === "dupepyssy");
  keppi = client.emojis.find(x => x.name === "keppi");

  tulokone = client.emojis.find(x => x.name === "tulokone");
  tulokone_x = client.emojis.find(x => x.name === "tulokonex");
  tulokiihdytin = client.emojis.find(x => x.name === "tulokiihdytin");
  tuloimu = client.emojis.find(x => x.name === "tuloimu");
  _perustulo = client.emojis.find(x => x.name === "perustulo");

  big_shark = client.emojis.find(x => x.name === "big_shark");
  pufferfish = client.emojis.find(x => x.name === "pufferfish");
  suphi_fish = client.emojis.find(x => x.name === "suphi_fish");
  shrimps = client.emojis.find(x => x.name === "shrimps");
  sacred_eel = client.emojis.find(x => x.name === "sacred_eel");
  anchovies = client.emojis.find(x => x.name === "anchovies");
  salmon = client.emojis.find(x => x.name === "salmon");
  dark_crab = client.emojis.find(x => x.name === "dark_crab");
  manta_ray = client.emojis.find(x => x.name === "manta_ray");
  eel = client.emojis.find(x => x.name === "eel");
  lobster = client.emojis.find(x => x.name === "lobster");
  shark = client.emojis.find(x => x.name === "shark");
  mackerel = client.emojis.find(x => x.name === "mackerel");
  monkfish = client.emojis.find(x => x.name === "monkfish");
  cave_eel = client.emojis.find(x => x.name === "cave_eel");
  cod = client.emojis.find(x => x.name === "cod");
  anglerfish = client.emojis.find(x => x.name === "anglerfish");
  bass = client.emojis.find(x => x.name === "bass");
  tuna = client.emojis.find(x => x.name === "tuna");
  herring = client.emojis.find(x => x.name === "herring");
  pike = client.emojis.find(x => x.name === "pike");
  trout = client.emojis.find(x => x.name === "trout");
  rainbow_fish = client.emojis.find(x => x.name === "rainbow_fish");
  sea_turtle = client.emojis.find(x => x.name === "sea_turtle");
  sardine = client.emojis.find(x => x.name === "sardine");
  karambwan = client.emojis.find(x => x.name === "karambwan");
  swordfish = client.emojis.find(x => x.name === "swordfish");
  infernal_eel = client.emojis.find(x => x.name === "infernal_eel");
  leaping_trout = client.emojis.find(x => x.name === "leaping_trout");
  leaping_salmon = client.emojis.find(x => x.name === "leaping_salmon");
  leaping_sturgeon = client.emojis.find(x => x.name === "leaping_sturgeon");
  seaweed = client.emojis.find(x => x.name === "seaweed");
  casket = client.emojis.find(x => x.name === "casket");
}

// When bot is ready
client.on('ready', () => {

  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  ref.on('value', gotData, errData);

  loadEmojies();
  
  var date = new Date();
  var date_array = [date.getDate(), date.getMonth(), date.getYear()];
  var day = date.getDay();

  // Setting up "Title"
  if (pääpäivä == true) {
    change_title("PÄÄPÄIVÄ");
  } else if (day === 3) {
    change_title("Wednesday");
  } else {
    change_title("ttunes");
  }
  if (data["deck"] == undefined) {
    check_deck();
    data["deck"] = deck;
  }

});

// When message is recieved
client.on('message', async msg => {

  react_to_message([/homo/, /autisti/], ["sasu", "karvis"], msg);

  if (msg.author.bot) return;
  if (msg.content.indexOf(tokens.prefix) !== 0) return;

  if (!msg.content.startsWith(tokens.prefix)) return;
  if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);

});


client.on("error", e => {
  console.log(e);
});

// INTERVALLIFUNKTIO MINUUTIN VÄLEIN
var minute_count = 0;

setInterval(function() {
  ref.on('value', gotData, errData);

  var date = new Date();
  var date_array = [date.getDate(), date.getMonth(), date.getYear()];
  var day = date.getDay();

  // Next day
  if (date_array[0] == data["date"][0] && date_array[1] == data["date"][1] && date_array[2] == data["date"][2]) {
    pääpäivä = true;
  } else {
    pääpäivä = false;
    data["dj"] = null;
    data["date"] = [0, 0, 0];
  }

  // Check if there is no card deck
  try {
    deck = data["deck"];
  } catch(err) {
    console.log("err");
    check_deck();
    deck = data["deck"];
    firebase.database().ref('profiles').set(data);
  }

  // Setting up "Title"
  if (pääpäivä == true) {
    change_title("PÄÄPÄIVÄ");
  } else if (day === 3) {
    change_title("Wednesday");
  } else {
    change_title("ttunes");
  }
  if (data["deck"] == undefined) {
    check_deck();
    data["deck"] = deck;
  }

  // Happens every time user is active on voicechannel
  var voicechannels_array = client.channels.keyArray();
  for (var i of voicechannels_array) {
    var channel = client.channels.get(i);

    if (channel.type == 'voice' && channel.id != "300242143702679552" && channel.id != "422007359507005440") {
      var channel_members = channel.members.keyArray();
      for (var m of channel_members) {
        var usr = channel.members.get(m);
        user_check_database(m);
        if (usr.id == "430827809418772481" || usr.id == "232916519594491906" || usr.id == "155149108183695360") continue;
        if (!usr.deaf) {

          if (data[m]["omistus"]["rahat"] > data[m]["omistus"]["maxrahat"]) {
            data[m]["omistus"]["maxrahat"] = data[m]["omistus"]["rahat"]
          }

          data[m]["aika_kannuilla"] += 1;

          data[m]["omistus"]["rahat"] += data[m]["omistus"]["perustulo"];

          var weight = map(data[m]["omistus"]["perustulo"], 10, 80, 1, 1);
          draw_lootbox_weighted(usr.id, 14400, weight, 180); // 180

        }
        if (BOT_IDs.includes(usr.id)) {
          delete data[usr.id];
          return;
        }
      }
    }
  }

  // Happens every minute
  var server_members = client.users.keyArray();
  for (var m of server_members) {
    if (m in data) {

      // Tuloimuajastin -> imee tuloa vain jos kohde on paikalla -> muuten kuluu
      if ("tuloimuajastin" in data[m]) {
        var trg = client.users.get(data[m]["tuloimuajastin"]["kohde"]);

        if (is_on_voicechannel(trg.id, voicechannels_array) && !(trg.deaf)) {

          if ("tulokoneajastin" in data[trg.id]) {
            multi = data[trg.id]["tulokoneajastin"]["tulokonetier"]*10;
          } else {
            multi = 1;
          }

          data[trg.id]["omistus"]["rahat"] -= data[trg.id]["omistus"]["perustulo"]*multi;
          data[trg.id]["omistus"]["sulta_imetyt"] -= data[trg.id]["omistus"]["perustulo"]*multi;
          data[trg.id]["omistus"]["sulta_imetyt_minuutit"] += 1;


          data[m]["omistus"]["rahat"] += data[trg.id]["omistus"]["perustulo"]*multi;
          data[m]["omistus"]["imetyt"] += data[trg.id]["omistus"]["perustulo"]*multi;
          data[m]["omistus"]["imetyt_minuutit"] += 1;
          data[m]["tuloimuajastin"]["summa"] += data[trg.id]["omistus"]["perustulo"]*multi;

        }

        data[m]["tuloimuajastin"]["tuloimuaika"] -= 1;
        if (data[m]["tuloimuajastin"]["tuloimuaika"] == 0) {
          client.channels.get("280272696560975872").send("<@" + m + ">, Tuloimusi on päättynyt... Sait: " + data[m]["tuloimuajastin"]["summa"] + coins);
          delete data[m]["tuloimuajastin"];
        }
      }

      // Tulokoneajastin -> kuluu kokoajan. antaa enemmän rahaa jos paikalla
      if ("tulokoneajastin" in data[m]) {

        if (is_on_voicechannel(m, voicechannels_array) && !(client.users.get(m).deaf)) {

          data[m]["omistus"]["rahat"] += data[m]["omistus"]["perustulo"]*data[m]["tulokoneajastin"]["tulokonetier"]*10 - data[m]["omistus"]["perustulo"];
          data[m]["tulokoneajastin"]["summa"] += data[m]["omistus"]["perustulo"]*data[m]["tulokoneajastin"]["tulokonetier"]*10 - data[m]["omistus"]["perustulo"];
          data[m]["tulokoneajastin"]["tulokoneaika"] -= 1;
          if (data[m]["tulokoneajastin"]["tulokoneaika"] == 0) {
            client.channels.get("280272696560975872").send("<@" + m + "> ,Tulokoneesi on päättynyt... Sait: " + (data[m]["tulokoneajastin"]["summa"]) + coins);
            delete data[m]["tulokoneajastin"];
          }
        }
        else {
          data[m]["tulokoneajastin"]["tulokoneaika"] -= 1;
          if (data[m]["tulokoneajastin"]["tulokoneaika"] == 0) {
            client.channels.get("280272696560975872").send("<@" + m + "> ,Tulokoneesi on päättynyt... Sait: " + (data[m]["tulokoneajastin"]["summa"]) + coins);
            delete data[m]["tulokoneajastin"];
          }
        }
      }

      // Kuluu aina -> kalastaminen loppuu kun ajastin päättyy
      if ("kalastusajastin" in data[m]) {

        data[m]["kalastusajastin"]["timer"] -= 1;

        if (data[m]["kalastusajastin"]["timer"] == 0) {
          data[m]["omistus"]["rahat"] += data[m]["kalastusajastin"]["hinta"];

          var fish_pic = client.emojis.find(x => x.name === data[m]["kalastusajastin"]["emoji"]);
          var rod_picture = client.emojis.find(x => x.name === data[m]["kalastusajastin"]["onki"]);
          var bait_picture = client.emojis.find(x => x.name === data[m]["kalastusajastin"]["sytti"]);

          client.channels.get("280272696560975872").send({
            "embed": {
              "title": "***" + client.users.get(m).username + " " + "saaliisi:***",
              "color": 15466496,
              "fields": [{
                  "name": fish_pic + " " + data[m]["kalastusajastin"]["kala"],
                  "value": "(Paino: " + data[m]["kalastusajastin"]["paino"] + "0kg , Arvo: " + data[m]["kalastusajastin"]["hinta"] + coins + ")"
                },
                {
                  "name": "***___Tiedot:___***",
                  "value": "***Paikka:*** " + data[m]["kalastusajastin"]["paikka"] + "\n***Aika:*** " + data[m]["kalastusajastin"]["päiväaika"] + "\n***Onki:*** " + rod_picture + "\n***Sytti:*** " + bait_picture
                }
              ]
            }
          });

          data[m]["omistus"]["kaloista_saadut_rahat"] += data[m]["kalastusajastin"]["hinta"];
          data[m]["omistus"]["kalastetut_kalat"] += 1;
          if (data[m]["omistus"]["painavin_kala"] < data[m]["kalastusajastin"]["paino"]) {
            data[m]["omistus"]["painavin_kala"] = data[m]["kalastusajastin"]["paino"];
          }

          delete fish_pic;
          delete rod_picture;
          delete bait_picture;
          delete data[m]["kalastusajastin"];
        }
      }
    }
  }
  minute_count += 1;
  console.log("Intervalli meni! (" + minute_count + ")");

  firebase.database().ref('profiles').set(data);

}, 60000);

function is_on_voicechannel(_id, _voice_channels) {
  for (var i of _voice_channels) {
    var kan = client.channels.get(i);
    if (kan.type == 'voice' && kan.id != "300242143702679552" && kan.id != "422007359507005440") {
      var membrs = kan.members.keyArray();
      for (var c of membrs) {
        if (c == _id) {
          return true;
        }
      }
    }
  }
  return false;
}

// FIREBASEN DATAKÄSITTELYFUNKTIOITA
function gotData(_data) {
  data = _data.val();
}

function errData(err) {
  console.log("Error!");
  console.log(err);
}

// Bot login
client.login(tokens.d_token);
