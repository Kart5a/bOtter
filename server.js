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
const SLOTRATE = 30;


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
            "name": "***___Aika in_channel:___***",
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
        "kultainen_harppuuna": false
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
        "valaankasvatusohjelma": false
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

      bj[msg.author.id] = m.createReactionCollector((reaction, user) => user.id === msg.author.id);
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
          delete bj[player];
          return;

        } else if (player_sum == 21) {
          bj[player].stop();
          stand();
          delete bj[player];
          return;

        } else if (player_sum > 21) {
          data[player]["pelit"]["BJ_yli"] += 1;
          data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
          data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet);

          firebase.database().ref('profiles').set(data);
          bot_message.clearReactions();
          bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), true, "Jakaja voitti! Hävisit " + Math.floor(bet) + coins, 9381414, history_log));
          bj[player].stop();
          delete bj[player];

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
            delete bj[player];
            return;

          } else if (jakaja_sum > 21) {

            data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
            data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet);
            data[player]["omistus"]["rahat"] += Math.floor(bet*2);

            firebase.database().ref('profiles').set(data);
            bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Jakaja meni yli! Voitit " + Math.floor(bet) + coins, 5348864, history_log));
            bj[player].stop();
            delete bj[player];
            return;

          } else if (jakaja_sum >= 17) {

            if (jakaja_sum >= player_sum) {
              data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
              data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet);
              data[player]["pelit"]["BJ_vähemmän"] += 1;

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Jakaja voitti! Hävisit " + Math.floor(bet) + coins, 9381414, history_log));
              bj[player].stop();
              delete bj[player];
              return;

            } else {
              data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
              data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet);
              data[player]["omistus"]["rahat"] += Math.floor(bet*2);

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet), false, "Voitit: " + Math.floor(bet) + coins, 5348864, history_log));
              bj[player].stop();
              delete bj[player];
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
          delete bj[player];
          return;
        }

        while (true) {

          jakaja_sum = calculate_sum(dealer_hand, true, false, 21);

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
            delete bj[player];
            return;

          } else if (jakaja_sum > 21) {

            data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
            data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet*2);
            data[player]["omistus"]["rahat"] += Math.floor(bet*2*2);

            firebase.database().ref('profiles').set(data);
            bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Jakaja meni yli! Voitit " + Math.floor(bet*2) + coins, 5348864, history_log));
            bj[player].stop();
            delete bj[player];
            return;

          } else if (jakaja_sum >= 17) {

            if (jakaja_sum >= player_sum) {
              data[player]["pelit"]["BJ_hävityt_pelit"] += 1;
              data[player]["pelit"]["BJ_hävityt_rahat"] += Math.floor(bet*2);
              data[player]["pelit"]["BJ_vähemmän"] += 1;

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Jakaja voitti! Hävisit " + Math.floor(bet*2) + coins, 9381414, history_log));
              bj[player].stop();
              delete bj[player];
              return;

            } else {
              data[player]["pelit"]["BJ_voitetut_pelit"] += 1;
              data[player]["pelit"]["BJ_voitetut_rahat"] += Math.floor(bet*2);
              data[player]["omistus"]["rahat"] += Math.floor(bet*2*2);

              firebase.database().ref('profiles').set(data);
              bot_message.edit(print_BJ(player, player_hand, dealer_hand, Math.floor(bet)*2, false, "Voitit: " + Math.floor(bet*2) + coins, 5348864, history_log));
              bj[player].stop();
              delete bj[player];
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
      delete harpoon_collectors[msg.author.if];
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
            "name": icon + " wind: " + wind_str,
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
    harpoon_collectors[msg.author.id].on('message', m => {
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
        win_text = "shoot_harpoonit ohi... -" + 50 * multi + coins;

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
              "name": icon + " shoot_harpoonit:",
              "value": "Kulma: " + _deg + "°, Voima: " + _force + "."
            },
            {
              "name": "wind: " + wind_str,
              "value": new_field
            },
            {
              "name": "result:",
              "value": win_text
            }

          ]
        }
      });

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
    co.on('message', m => {
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

      for (var i = 0; i < participators.length; i++) {
        if (participators[i] == "430827809418772481") {

        } else if (data[participators[i]] == undefined) {
          failures.push(participators[i]);
        } else if (data[participators[i]]["omistus"]["rahat"] < bet) {
          no_enough_money.push(participators[i]);
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

      }

      data[winner]["pelit"]["ryhmäpelivoitot_yht"] += (all_money - bet);
      data[winner]["pelit"]["ryhmäpelivoitot"] += 1;
      data[winner]["omistus"]["rahat"] += all_money;

      if (data[winner]["omistus"]["rahat"] > data[winner]["omistus"]["maxrahat"]) {
        data[winner]["omistus"]["maxrahat"] = data[winner]["omistus"]["rahat"]
      }

      msg.channel.send("Ryhmäpelin potti: " + all_money + coins + "\nVoittaja on: <@" + winner + ">\n\nOsallistuneet pelaajat:\n" + successful + "\n" + ra + ep);
      firebase.database().ref('profiles').set(data);
    }
  },

  'slot': (msg) => {

    let bet = msg.content.split(' ')[1];

    if (msg.channel.id != "280272696560975872") return msg.delete();

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

    let min_bet = Math.floor(data[msg.author.id]["omistus"]["rahat"] / (SLOTRATE * 10)) * 10
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

      var money = data[target_id]["omistus"]["rahat"];
      min_bet = Math.floor(money / (SLOTRATE * 10)) * 10
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

      var str = "Rahat: " + money + coins + ", Panos: " + _bet + coins + "\n\n" +
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

    }

  },

  'kaikkitaieimitään': (msg) => {

    if (msg.channel.id != "280272696560975872") return msg.delete();
    var player = msg.author.id;
    user_check_database(player);
    const MIN = 500;

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
            "value": "Pelit: " + kaikkitpelit + "\nwinningsjen määrä: " + kaikkitvoit + "\nVoitetut rahat: " + kaikkit + coins + "\nHävityt rahat: " + kaikkithäv + coins
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

    const products = ["rahat", "ES"];

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

    if (BOT_IDs.includes(target_id)) {
      delete data[target_id];
      return msg.channel.send("Botille ei voi antaa :/");
    }

    if (target_id == sender_id) return msg.channel.send(`Turhaa siirrät ittelles mitää...`);


    if (product == "rahat") {
      if (data[sender_id]["omistus"]["rahat"] < parseInt(amount)) return msg.channel.send(`Sulla ei oo tarpeeks rahea...`);
      data[target_id]["omistus"]["rahat"] += parseInt(amount);
      data[sender_id]["omistus"]["rahat"] -= parseInt(amount);
      data[target_id]["omistus"]["saadut_rahat"] += parseInt(amount);
      data[sender_id]["omistus"]["annetut_rahat"] += parseInt(amount);

      if (data[target_id]["omistus"]["rahat"] > data[target_id]["omistus"]["maxrahat"]) {
        data[target_id]["omistus"]["maxrahat"] = data[target_id]["omistus"]["rahat"]
      }

    } else {
      if (data[sender_id][product] < parseInt(amount)) return msg.channel.send(`Sulla ei oo tarpeeks ` + product);
      data[target_id]["pelit"][product] += parseInt(amount);
      data[sender_id]["pelit"][product] -= parseInt(amount);
    }

    firebase.database().ref('profiles').set(data);
    msg.channel.send(product.charAt(0).toUpperCase() + product.slice(1) + " siirretty!");

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
          "name": "***___\:euro: Perustulo +5:___***",
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
        collector.on('message', m => {
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
            name: tokens.prefix + "shoot_harpoon [asteet 1-90] [voima 1-100]",
            value: "ampuu harppuunan"
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
            name: tokens.prefix + "winningstaulu",
            value: "Näyttää winningstaulun"
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

// When bot is ready
client.on('ready', () => {
  //if (msg.guild.id != "180699479379410944") return;

  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  ref.on('value', gotData, errData);

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
setInterval(function() {
  //if (client.guild.id != "180699479379410944") return;
  ref.on('value', gotData, errData);

  var date = new Date();
  var date_array = [date.getDate(), date.getMonth(), date.getYear()];
  var day = date.getDay();

  if (date_array[0] == data["date"][0] && date_array[1] == data["date"][1] && date_array[2] == data["date"][2]) {
    pääpäivä = true;
  } else {
    pääpäivä = false;
    data["dj"] = null;
    data["date"] = [0, 0, 0];
  }

  try {
    deck = data["deck"];
  } catch(err) {
    console.log("err");
    check_deck();
    deck = data["deck"];
    firebase.database().ref('profiles').set(data);
  }

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

  var keyarr = client.channels.keyArray();

  for (var i of keyarr) {
    var kan = client.channels.get(i);

    if (kan.type == 'voice' && kan.id != "300242143702679552" && kan.id != "404378873380470786" && kan.id != "422007359507005440") {
      var membrs = kan.members.keyArray();
      for (var m of membrs) {
        var usr = kan.members.get(m);
        user_check_database(m);
        if (!usr.deaf) {
          if (usr.id == "430827809418772481" || usr.id == "232916519594491906" || usr.id == "155149108183695360") continue;

          data[m]["omistus"]["rahat"] += data[m]["omistus"]["perustulo"];
          if (data[m]["omistus"]["rahat"] > data[m]["omistus"]["maxrahat"]) {
            data[m]["omistus"]["maxrahat"] = data[m]["omistus"]["rahat"]
          }
          data[m]["aika_kannuilla"] += 1;

        }
        if (BOT_IDs.includes(usr.id)) {
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

// Bot login
client.login(tokens.d_token);
