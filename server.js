// bOtter -Discord bot
// Made by Tino Kaartovuori
// Assisted by Sasu Ryynälä

// This bot is custom made for one server only.
// This bot has features like:
// User profiles, money system, shop, games, musicbot (ttunebot) and some tools.

// This season (2) started on 30.8.2018.
// This seasun (3) started on 31.10.2018.
const {Client} = require("discord.js");
const Discord = require("discord.js");
const tokens = require("./tokens.json");
const fireb = require("./config.json");
const fishes = require("./fishes.json");
const firebase = require("firebase");
const client = new Client();

// FIREBASE SETUP
var users;

// Collectors
var harpoon_collectors = {};
var msg = {};
var bj = {};

firebase.initializeApp(fireb);
var database = firebase.database();
var bot_users = database.ref("users");
var global_data = database.ref("global_data");

function change_title(text) {
  // Changes title of bOtter
  client.user.setPresence({
    game: {
      name: text + " | " + tokens.prefix + "apustus",
      type: 2
    }
  });
}

function map(value, a, b, c, d) {
  value = (value - a) / (b - a);
  return c + value * (d - c);
}

function randn_bm(min, max, skew) {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
  num = Math.pow(num, skew); // Skew
  num *= max - min; // Stretch to fill range
  num += min; // offset to min
  return num;
}

//// Database management
function get_user(_id) {
  return firebase
    .database()
    .ref("users/" + _id)
    .once("value")
    .then(d => {
      user = d.val();
      return user;
    });
}

function save_user(user) {
  firebase
    .database()
    .ref("users/" + user["id"])
    .update(user);
}

function get_all_users() {
  return firebase.database().ref("users").once("value").then(d => {
      user = d.val();
      return user;
    });
}

function save_all_users(users) {
  firebase
    .database()
    .ref("users")
    .update(users);
}

function print_profile(user, msg) {
  var name = user["name"];
  var motto = user["info"]["motto"];
  var description = user["info"]["description"];
  var picture = user["info"]["pictures"];
  var money = user["inventory"]["money"];
  var time = user["basic_statistics"]["minutes_on_channel"];
  var basic_incoming = user["inventory"]["income"];
  var wealth = calculate_wealth(user);
  var color = parseInt(user["info"]["color"]);

  var avatar;

  client.fetchUser(user["id"]).then(myUser => {
    avatar = myUser.avatarURL;
    send_profile(avatar);
  });

  var safe_t = "";
  if (user["inventory"]["key_items"]["safe"]["own"]) {
    safe_t = `\n${emojies["tallelokero"]} ${user["inventory"]["key_items"]["safe"]["money"]}${emojies["coin"]}`
  }

  function send_profile(avatar) {
    msg.channel.send({
      embed: {
        title: "***DISCORDPROFIILI***",
        color: color,
        thumbnail: {
          url: avatar
        },
        image: {
          "url": picture
        },
        fields: [
          {
            name: "***___Nimi:___***",
            value: name
          },
          {
            name: "***___Motto:___***",
            value: motto
          },
          {
            name: "***___Kuvaus:___***",
            value: description
          },
          {
            name: "***___Rahat:___***",
            value:
              money +
              emojies["coin"] +
              " (Perustulo: " +
              basic_incoming +
              emojies["coin"] +
              "/min)" + safe_t
          },
          {
            name: "***___Aika kannulla:___***",
            value: time + " min"
          },
          {
            name: "***___Omaisuus:___***",
            value: wealth + emojies["coin"]
          }
        ]
      }
    });
  }
}

//// Adders
async function draw_lootbox(user_id, multi, game = true) {

  check_user_in_database(user_id)
  var user = await get_user(user_id);

    var propabilities = {
      legendary: 300,
      epic: 50,
      rare: 10,
      uncommon: 3,
      common: 1
    };

    var rnd_legendary = Math.floor(
      Math.random() * Math.floor(propabilities["legendary"] * multi + 1)
    );
    var rnd_epic = Math.floor(
      Math.random() * Math.floor(propabilities["epic"] * multi + 1)
    );
    var rnd_rare = Math.floor(
      Math.random() * Math.floor(propabilities["rare"] * multi + 1)
    );
    var rnd_uncommon = Math.floor(
      Math.random() * Math.floor(propabilities["uncommon"] * multi + 1)
    );
    var rnd_common = Math.floor(
      Math.random() * Math.floor(propabilities["common"] * multi + 1)
    );

    var lootbox_text = "";
    var name = "<@" + user["id"] + ">: ";
    if (user["info"]["notifications"] == false) {
      var uz = client.users.get(user["id"]);
      name = uz.username + ": ";
    }

    if (rnd_common == 0) {
      user["inventory"]["lootboxes"]["common"] += 1;

      if (game) {
        user["basic_statistics"]["lootboxes_by_playing_common"] += 1;
      } else {
        user["basic_statistics"]["lootboxes_by_afking_common"] += 1;
      }


      lootbox_text +=
         name + emojies["chest_common"] + "\n";
    }
    if (rnd_uncommon == 0) {

      if (game) {
        user["basic_statistics"]["lootboxes_by_playing_uncommon"] += 1;
      } else {
        user["basic_statistics"]["lootboxes_by_afking_uncommon"] += 1;
      }

      user["inventory"]["lootboxes"]["uncommon"] += 1;
      lootbox_text +=
        "Jes! " + name + emojies["chest_uncommon"] + "\n";
    }
    if (rnd_rare == 0) {

      if (game) {
        user["basic_statistics"]["lootboxes_by_playing_rare"] += 1;
      } else {
        user["basic_statistics"]["lootboxes_by_afking_rare"] += 1;
      }

      user["inventory"]["lootboxes"]["rare"] += 1;
      lootbox_text +=
        "Oujee! " + name + emojies["chest_rare"] + "\n";
    }
    if (rnd_epic == 0) {

      if (game) {
        user["basic_statistics"]["lootboxes_by_playing_epic"] += 1;
      } else {
        user["basic_statistics"]["lootboxes_by_afking_epic"] += 1;
      }

      user["inventory"]["lootboxes"]["epic"] += 1;
      lootbox_text +=
        "Eeppistä! " + name + emojies["chest_epic"] + "\n";
    }
    if (rnd_legendary == 0) {

      if (game) {
        user["basic_statistics"]["lootboxes_by_playing_legendary"] += 1;
      } else {
        user["basic_statistics"]["lootboxes_by_afking_legendary"] += 1;
      }

      user["inventory"]["lootboxes"]["legendary"] += 1;
      lootbox_text +=
        "Legendaarista! " + name + emojies["chest_legendary"] + "\n";
    }

    if (lootbox_text != "") {
      client.channels.get("280272696560975872").send(lootbox_text);
    }
    return save_user(user);
}

async function add_income(_id) {
  var user = await get_user(_id);
  user["inventory"]["money"] += user["inventory"]["income"];
  user["basic_statistics"]["money_from_incomes"] += user["inventory"]["income"];
  user["basic_statistics"]["minutes_on_channel"] += 1;

  await save_user(user);
}

async function add_solo(_id) {
  console.log(_id);
  var user = await get_user(_id);
  user["basic_statistics"]["solo_minutes"] += 1;
  await save_user(user);
}

//// Checkers
function check_user_in_database(_id) {
  return firebase
    .database()
    .ref("users/" + _id)
    .once("value")
    .then(d => {
      var users = d.val();
      var all_users = client.users;

      var name;
      try {
        name = (all_users.get(_id)).username;
      } catch (err) {
        name = "<@" + _id + ">";
      }

      if ((all_users.get(_id)).bot) return;

      var new_user_users = {
        id: _id,
        name: (client.users.get(_id)).username,
        info: {
          description: "-",
          motto: "-",
          picture: "",
          ironman: false,
          color: 10197915,
          notifications: true
        },
        inventory: {
          money: 500,
          income: 10,
          items: {
            bait: 0,
            super_bait: 0,
            hyper_bait: 0,
            stick: 0,
            log: 0,
            mask: 0,
            ES: 0,
            ES_can: 0,
            income_machine: 0,
            income_machine_X: 0,
            income_accelerator: 0,
            income_absorber: 0,
            gem: 0,
            glitch: 0,
            bomb: 0,
            shield: 0,
            security_cam: 0,
            bronze_income: 0,
            silver_income: 0,
            gold_income: 0,
            timemachine : 0,
            prankster: 0,
            grabber: 0,
            stunner: 0
          },
          key_items: {
            rod: false,
            super_rod: false,
            hyper_rod: false,
            fishing_boat: false,
            golden_harpoon: false,
            whale_breeding_program: false,
            safe: {
              own: false,
              money: 0,
              capasity: 1000000,
            },
            bush: {
              own: false,
              on: false,
              timer: 0
            }
          },
          lootboxes: {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0
          }
        },
        basic_statistics: {
          minutes_on_channel: 0,
          peak_money: 500,
          income_bought: 0,
          money_from_incomes: 0,
          solo_minutes : 0,
          stunned: 0,
          you_stunned: 0,
          money_from_opening_lootboxes: 0,
          money_from_lootboxes: 0,
          money_from_income_machines: 0,
          lootboxes_by_afking: 0,
          lootboxes_by_afking_common: 0,
          lootboxes_by_afking_uncommon: 0,
          lootboxes_by_afking_rare: 0,
          lootboxes_by_afking_epic: 0,
          lootboxes_by_afking_legendary: 0,
          lootboxes_by_playing: 0,
          lootboxes_by_playing_common: 0,
          lootboxes_by_playing_uncommon: 0,
          lootboxes_by_playing_rare: 0,
          lootboxes_by_playing_epic: 0,
          lootboxes_by_playing_legendary: 0,
          money_stolen: 0,
          money_stolen_from_you: 0,
          bomb_used: 0,
          bombed_money : 0,
          bombed: 0,
          bombed_money_from_you: 0,
          pranked: 0,
          got_pranked: 0,
          pranked_money: 0,
          pranked_from_you: 0,
          opened_lootboxes: {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0
          },
          money_recieved: 0,
          money_given: 0,
          fines: 0,
          compensations: 0,
          hit: 0,
          sticked_money_from_you : 0,
          logged_money_from_you: 0,
          log_used: 0,
          logged_money: 0,
          hit_with_log: 0,
          stick_used: 0,
          sticked_money : 0,
          money_absorbed_from_you: 0,
          money_absorbed_to_you: 0
        },
        game_blackjack: {
          "21": 0,
          double: 0,
          hit: 0,
          games_lost: 0,
          money_lost: 0,
          all_bets: 0,
          games: 0,
          stand: 0,
          games_won: 0,
          money_won: 0,
          less: 0,
          over: 0,
          tie: 0,
          cards_played: 0
        },
        game_slot: {
          money_lost: 0,
          all_bets: 0,
          games: 0,
          games_lost: 0,
          games_won: 0,
          money_won: 0,
          wins: {
            alfa: 0,
            karvis: 0,
            jesilmero: 0,
            poggers1: 0,
            poggers2: 0,
            poggers3: 0,
            sasu: 0
          }
        },
        game_harpoon: {
          money_lost: 0,
          hits: 0,
          games: 0,
          money_won: 0,
          games_lost: 0,
          games_won: 0,
          targets: {
            shark: 0,
            balloon: 0,
            whale: 0
          }
        },
        game_KTEM: {
          money_lost: 0,
          games_lost: 0,
          games: 0,
          games_won: 0,
          money_won: 0,
          all_bets: 0
        },
        game_ryhmäpeli: {
          money_lost: 0,
          games: 0,
          games_lost: 0,
          games_won: 0,
          money_won: 0
        },
        game_kalastus: {
          bait_consumed: 0,
          treasure_chest : 0,
          super_bait_consumed: 0,
          hyper_bait_consumed: 0,
          fish_caught: 0,
          money_got: 0,
          in_sea: 0,
          in_river: 0,
          in_lake: 0,
          top: 0,
          mid: 0,
          bot: 0,
          rod_used: 0,
          super_rod_used: 0,
          hyper_rod_used: 0,
          tier1_completed: false,
          tier2_completed: false,
          tier3_completed: false,
          all_fish_weight: 0,
          fishing_boat_used : 0,
          KalaDex: {}
        }
      };
      for (var fish in fishes) {
        if (!(fish in new_user_users["game_kalastus"]["KalaDex"])) {
          new_user_users["game_kalastus"]["KalaDex"][fish] = {
            caught: 0,
            index: fishes[fish]["index"],
            heaviest: 0,
            money_got: 0
          };
        }
      }

      if (users == undefined) {
        firebase
          .database()
          .ref("users/" + _id)
          .set(new_user_users);
      } else {
        Object.keys(new_user_users).forEach(function(key) {
          if (!(key in users)) {
            firebase
              .database()
              .ref("users/" + _id + "/" + key)
              .set(new_user_users[key]);
          }
          if (typeof new_user_users[key] == "object") {
            Object.keys(new_user_users[key]).forEach(function(key2) {
              if (!(key2 in users[key])) {
                firebase
                  .database()
                  .ref("users/" + _id + "/" + key + "/" + key2)
                  .set(new_user_users[key][key2]);
              }

              if (typeof new_user_users[key][key2] == "object") {
                Object.keys(new_user_users[key][key2]).forEach(function(key3) {
                  if (!(key3 in users[key][key2])) {
                    firebase
                      .database()
                      .ref("users/" + _id + "/" + key + "/" + key2 + "/" + key3)
                      .set(new_user_users[key][key2][key3]);
                  }

                  if (typeof new_user_users[key][key2][key3] == "object") {
                    Object.keys(new_user_users[key][key2][key3]).forEach(
                      function(key4) {
                        if (!(key4 in users[key][key2][key3])) {
                          firebase
                            .database()
                            .ref(
                              "users/" +
                                _id +
                                "/" +
                                key +
                                "/" +
                                key2 +
                                "/" +
                                key3 +
                                "/" +
                                key4
                            )
                            .set(new_user_users[key][key2][key3][key4]);
                        }

                        if (
                          typeof new_user_users[key][key2][key3][key4] ==
                          "object"
                        ) {
                          Object.keys(
                            new_user_users[key][key2][key3][key4]
                          ).forEach(function(key5) {
                            if (!(key5 in users[key][key2][key3][key4])) {
                              firebase
                                .database()
                                .ref(
                                  "users/" +
                                    _id +
                                    "/" +
                                    key +
                                    "/" +
                                    key2 +
                                    "/" +
                                    key3 +
                                    "/" +
                                    key4 +
                                    "/" +
                                    key5
                                )
                                .set(
                                  new_user_users[key][key2][key3][key4][key5]
                                );
                            }
                          });
                        }
                      }
                    );
                  }
                });
              }
            });
          }
        });
      }
    });
}

async function check_income_absorbtion() {
  var users = await get_all_users();
  var already_checked = [];
  var end_chain_user;

  // Finding user on "top of the chain"
  for (let u in users) {
    if ("income_absorb" in users[u] && !already_checked.includes(u)) {
      while (true) {
        var temp_id = users[u].income_absorb.target;

        if ("income_absorb" in users[temp_id]) {
          u = users[u]["income_absorb"]["target"];
        } else {
          end_chain_user = users[u].income_absorb.target;
          break;
        }
      }
    }
    if (end_chain_user == undefined) continue;

    // Going down chain and moving money down

    var id = end_chain_user;
    var all_money = 0;
    while (true) {
      already_checked.push(users[id]);
      if ("absorb_target" in users[id] && user_under_income(users[id])) {
        all_money += users[id]["inventory"]["income"];
        users[id]["inventory"]["money"] -= users[id]["inventory"]["income"];

        users[id]["basic_statistics"]["money_from_incomes"] -=
          users[id]["inventory"]["income"];
        users[id]["basic_statistics"]["money_absorbed_from_you"] +=
          users[id]["inventory"]["income"];
        users[id]["absorb_target"]["sum"] += users[id]["inventory"]["income"];

        if ("income_machine" in users[id]) {
          all_money +=
            users[id]["inventory"]["income"] *
              users[id]["income_machine"]["multi"] -
            users[id]["inventory"]["income"];
          users[id]["inventory"]["money"] -=
            users[id]["inventory"]["income"] *
              users[id]["income_machine"]["multi"] -
            users[id]["inventory"]["income"];
          users[id]["basic_statistics"]["money_from_incomes"] -=
            users[id]["inventory"]["income"] *
              users[id]["income_machine"]["multi"] -
            users[id]["inventory"]["income"];

          users[id]["income_machine"]["sum"] -=
            users[id]["inventory"]["income"] *
              users[id]["income_machine"]["multi"] -
            users[id]["inventory"]["income"];
          users[id]["basic_statistics"]["money_absorbed_from_you"] +=
            users[id]["inventory"]["income"] *
              users[id]["income_machine"]["multi"] -
            users[id]["inventory"]["income"];
          users[id]["absorb_target"]["sum"] +=
            users[id]["inventory"]["income"] *
              users[id]["income_machine"]["multi"] -
            users[id]["inventory"]["income"];
        }

        console.log("Imetty: " + id);
        id = users[id]["absorb_target"]["absorber"];
        continue;
      } else {
        users[id]["inventory"]["money"] += all_money;
        users[id]["basic_statistics"]["money_absorbed_to_you"] += all_money;
        users[id]["income_absorb"]["sum"] += all_money;
        console.log("Imi kaikki: " + id);
        console.log(all_money);
        await save_all_users(users);
        return;
      }
    }

  }
}

function check_peak(user) {
  if (user["inventory"]["money"] > user["basic_statistics"]["peak_money"]) {
    user["basic_statistics"]["peak_money"] = user["inventory"]["money"];
  }
  save_user(user);
}

function user_on_voice(user) {
  var voicechannels_array = client.channels.keyArray();
  for (var i of voicechannels_array) {
    var channel = client.channels.get(i);
    if (channel.type == "voice" && !banned_channels.includes(channel)) {
      var channel_members = channel.members.keyArray();
      if (channel_members.includes(user["id"])) {
        var usr = channel.members.get(user["id"]);
        if (!usr.deaf) {
          return true;
        }
      }
    }
  }
  return false;
}

function user_under_income(user) {
  if (user_on_voice(user) && !user["inventory"]["key_items"]["bush"]["on"])
    return true;
  return false;
}

function check_pääpäivä() {

  return firebase
    .database()
    .ref("global_data/pääpäivä")
    .once("value")
    .then( async d => {
      pp = d.val();
      if (pp == undefined) {
        pp = {
          on: false,
          date: [0, 0, 0]
        };
        firebase
          .database()
          .ref("global_data/pääpäivä")
          .set(pp);
      }
      return pp["on"];
    });
}

function calculate_wealth(user) {
  var all_money = 0;

  all_money += user["inventory"]["money"];
  all_money += user["inventory"]["key_items"]["safe"]["money"];

  if (user["inventory"]["key_items"]["whale_breeding_program"]) {
    all_money += 250000;
  }

  if (user["inventory"]["key_items"]["golden_harpoon"]) {
    all_money += 150000;
  }
  for (var i = 0; i < user["basic_statistics"]["income_bought"]; i++) {
    all_money +=
      Math.floor((1000 * Math.pow(1.08, i) * (10 + 5 * i)) / 100) * 100;
  }

  all_money += user["inventory"]["items"]["ES"];
  all_money += user["inventory"]["items"]["bait"] * 400;
  all_money += user["inventory"]["items"]["super_bait"] * 2000;
  all_money += user["inventory"]["items"]["hyper_bait"] * 12000;
  all_money += user["inventory"]["items"]["bomb"] * 2000;

  all_money +=
    user["inventory"]["money"] * Math.pow(user["inventory"]["items"]["gem"], 2);
  all_money +=
    user["inventory"]["money"] * (user["inventory"]["items"]["glitch"] * 2.5);
  all_money += user["inventory"]["items"]["bronze_income"] * 10000;
  all_money += user["inventory"]["items"]["silver_income"] * 10000 * 3;
  all_money += user["inventory"]["items"]["gold_income"] * 10000 * 5;

  all_money += user["inventory"]["items"]["income_absorber"] * 50000;
  all_money +=
    user["inventory"]["items"]["income_accelerator"] *
    60 *
    40 *
    user["inventory"]["income"];
  all_money +=
    user["inventory"]["items"]["income_machine_X"] *
    60 *
    20 *
    user["inventory"]["income"];
  all_money +=
    user["inventory"]["items"]["income_machine"] *
    60 *
    10 *
    user["inventory"]["income"];
  all_money += user["inventory"]["items"]["mask"] * 10000;
  all_money += user["inventory"]["items"]["security_cam"] * 8000;
  all_money += user["inventory"]["items"]["shield"] * 1500;
  all_money += user["inventory"]["items"]["stick"] * 100;

  all_money += user["inventory"]["lootboxes"]["common"] * 1000;
  all_money += user["inventory"]["lootboxes"]["uncommon"] * 3000;
  all_money += user["inventory"]["lootboxes"]["rare"] * 12000;
  all_money += user["inventory"]["lootboxes"]["epic"] * 50000;
  all_money += user["inventory"]["lootboxes"]["legendary"] * 200000;

  if (user["inventory"]["key_items"]["bush"]["own"]) {
    all_money += 200000;
  }

  if (user["inventory"]["key_items"]["safe"]["own"]) {
    all_money += 100000*user["inventory"]["key_items"]["safe"]["capasity"]/1000000;
  }

  return all_money;
}

function fish_caught(user, _users) {
  var users = _users;
  var place = "";
  if (user["fishing_timer"]["place"] == "S") {
    place = "Meri";
  }
  if (user["fishing_timer"]["place"] == "R") {
    place = "Joki";
  }
  if (user["fishing_timer"]["place"] == "L") {
    place = "Järvi";
  }

  var rod = "";
  if (user["fishing_timer"]["rod"] == "N") {
    rod = emojies["onki"] + " Perusonki";
  }
  if (user["fishing_timer"]["rod"] == "S") {
    rod = emojies["superonki"] + " Superonki";
  }
  if (user["fishing_timer"]["rod"] == "H") {
    rod = emojies["hyperonki"] + " Hyperonki";
  }

  var bait = "";
  if (user["fishing_timer"]["bait"] == "N") {
    bait = emojies["sytti"] + " Sytti";
  }
  if (user["fishing_timer"]["bait"] == "S") {
    bait = emojies["supersytti"] + " Supersytti";
  }
  if (user["fishing_timer"]["bait"] == "H") {
    bait = emojies["hypersytti"] + " Hypersytti";
  }

  var time = "";
  if (user["fishing_timer"]["time"] == "A") {
    time = "Päivä";
  }
  if (user["fishing_timer"]["time"] == "M") {
    time = "Aamu";
  }
  if (user["fishing_timer"]["time"] == "E") {
    time = "Ilta";
  }
  if (user["fishing_timer"]["time"] == "N") {
    time = "Yö";
  }
  var _new = "";
  if (
    user["game_kalastus"]["KalaDex"][user["fishing_timer"]["name"]]["caught"] ==
    0
  ) {
    _new = "***(UUSI)***";
  }
  user["game_kalastus"]["fish_caught"] += 1;
  var heaviest = "";
  user["inventory"]["money"] += user["fishing_timer"]["price"];
  user["game_kalastus"]["KalaDex"][user["fishing_timer"]["name"]][
    "caught"
  ] += 1;
  user["game_kalastus"]["KalaDex"][user["fishing_timer"]["name"]][
    "money_got"
  ] += user["fishing_timer"]["price"];
  if (
    user["game_kalastus"]["KalaDex"][user["fishing_timer"]["name"]][
      "heaviest"
    ] < user["fishing_timer"]["weight"]
  ) {
    user["game_kalastus"]["KalaDex"][user["fishing_timer"]["name"]][
      "heaviest"
    ] = user["fishing_timer"]["weight"];
    heaviest = "(Oma enkka)";
  }
  user["game_kalastus"]["all_fish_weight"] += parseFloat(
    user["fishing_timer"]["weight"]
  );

  all_time_heaviest = "Kaikkien aikojen isoin! :trophy:";
  for (var u in users) {
    if (
      users[u]["game_kalastus"]["KalaDex"][user["fishing_timer"]["name"]][
        "heaviest"
      ] > user["fishing_timer"]["weight"]
    ) {
      all_time_heaviest = "";
    }
  }
  if (all_time_heaviest != "") {
    heaviest = "";
  } else {
    all_time_heaviest = heaviest;
  }
  user["game_kalastus"]["money_got"] += user["fishing_timer"]["price"];
  save_user(user);
  var uz = client.users.get(user["id"]);
  var avatar = uz.avatarURL;

  return {
    embed: {
      color: user["info"]["color"],
      author: {
        name: user["name"] + " saalisti:",
        icon_url: avatar
      },
      fields: [
        {
          name: user["fishing_timer"]["name"] + " " + _new,
          value:
            emojies[fishes[user["fishing_timer"]["name"]]["emoji"]] +
            "\n___Arvo:___ " +
            user["fishing_timer"]["price"] +
            emojies["coin"] +
            "\n___Paino:___ " +
            user["fishing_timer"]["weight"] +
            "kg\n" +
            all_time_heaviest,
          inline: true
        },
        {
          name: "***___Tiedot:___***",
          value:
            "***Paikka:*** " +
            place +
            "\n***Aika:*** " +
            time +
            "\n***Onki:*** " +
            rod +
            "\n***Sytti:*** " +
            bait,
          inline: true
        },
        {
          name: "***___Yleistä:___***",
          value: user["fishing_timer"]["fish"]["description"]
        }
      ]
    }
  };
}

function fishes_caught(user, _users) {
  var users = _users;
  var place = "";
  if (user["fishing_boat_timer"][0]["place"] == "S") {
    place = "Meri";
  }
  if (user["fishing_boat_timer"][0]["place"] == "R") {
    place = "Joki";
  }
  if (user["fishing_boat_timer"][0]["place"] == "L") {
    place = "Järvi";
  }

  var rod = "";
  if (user["fishing_boat_timer"][0]["rod"] == "N") {
    rod = emojies["onki"] + " Perusonki";
  }
  if (user["fishing_boat_timer"][0]["rod"] == "S") {
    rod = emojies["superonki"] + " Superonki";
  }
  if (user["fishing_boat_timer"][0]["rod"] == "H") {
    rod = emojies["hyperonki"] + " Hyperonki";
  }

  var bait = "";
  if (user["fishing_boat_timer"][0]["bait"] == "N") {
    bait = emojies["sytti"] + " Sytti";
  }
  if (user["fishing_boat_timer"][0]["bait"] == "S") {
    bait = emojies["supersytti"] + " Supersytti";
  }
  if (user["fishing_boat_timer"][0]["bait"] == "H") {
    bait = emojies["hypersytti"] + " Hypersytti";
  }

  var time = "";
  if (user["fishing_boat_timer"][0]["time"] == "A") {
    time = "Päivä";
  }
  if (user["fishing_boat_timer"][0]["time"] == "M") {
    time = "Aamu";
  }
  if (user["fishing_boat_timer"][0]["time"] == "E") {
    time = "Ilta";
  }
  if (user["fishing_boat_timer"][0]["time"] == "N") {
    time = "Yö";
  }
  var all_fishes = "";
  var value = 0;
  for (var i = 0; i < user["fishing_boat_timer"].length; i++) {
    var _new = "";
    if (
      user["game_kalastus"]["KalaDex"][user["fishing_boat_timer"][i]["name"]]["caught"] ==
      0
    ) {
      _new = "***(UUSI)***\n";
    }
    user["game_kalastus"]["fish_caught"] += 1;
    value += user["fishing_boat_timer"][i]["price"];

    var heaviest = "(Oma enkka!)\n";
    user["inventory"]["money"] += user["fishing_boat_timer"][i]["price"];
    user["game_kalastus"]["KalaDex"][user["fishing_boat_timer"][i]["name"]][
      "caught"
    ] += 1;
    user["game_kalastus"]["KalaDex"][user["fishing_boat_timer"][i]["name"]][
      "money_got"
    ] += user["fishing_boat_timer"][i]["price"];

    user["game_kalastus"]["all_fish_weight"] += parseFloat(
      user["fishing_boat_timer"][i]["weight"]
    );

    if (
      user["game_kalastus"]["KalaDex"][user["fishing_boat_timer"][i]["name"]][
        "heaviest"
      ] < user["fishing_boat_timer"][i]["weight"]
    ) {
      user["game_kalastus"]["KalaDex"][user["fishing_boat_timer"][i]["name"]][
        "heaviest"
      ] = user["fishing_boat_timer"][i]["weight"];
      heaviest = "(Oma enkka)\n";
    }

    all_time_heaviest = "Kaikkien aikojen isoin! :trophy:\n";
    for (var u in users) {
      if (users[u]["game_kalastus"]["KalaDex"][user["fishing_boat_timer"][i]["name"]]["heaviest"] > user["fishing_boat_timer"][i]["weight"]) {
        all_time_heaviest = "";
      }
    }
    for (var z = 0; z < user["fishing_boat_timer"].length; z++) {
      if (user["fishing_boat_timer"][i]["name"] == user["fishing_boat_timer"][z]["name"]) {
        if (user["fishing_boat_timer"][z]["weight"] > user["fishing_boat_timer"][i]["weight"]) {
          all_time_heaviest = "";
          heaviest = "";
        }
        if (user["fishing_boat_timer"][i]["weight"] < user["game_kalastus"]["KalaDex"][user["fishing_boat_timer"][i]["name"]]["heaviest"]) {
          heaviest = "";
        }
      }
    }

    if (all_time_heaviest != "") {
      heaviest = "";
    } else {
      all_time_heaviest = heaviest;
    }

    all_fishes += emojies[fishes[user["fishing_boat_timer"][i]["name"]]["emoji"]] + " " + user["fishing_boat_timer"][i]["name"] + "\n___Arvo:___ " + user["fishing_boat_timer"][i]["price"] +
    emojies["coin"] + "___Paino:___ " + user["fishing_boat_timer"][i]["weight"] + "kg\n" + all_time_heaviest + _new + "\n";

  }
    user["game_kalastus"]["money_got"] += value;
    save_user(user);
    var uz = client.users.get(user["id"]);
    var avatar = uz.avatarURL;

    return {
      embed: {
        color: user["info"]["color"],
        author: {
          name: "Saalistaja: " + user["name"],
          icon_url: avatar
        },
        "description" : all_fishes,
        fields: [
          {
            name: "***___Tiedot:___***",
            value:
            "***Yhteisumma:*** " + value + emojies["coin"] + "\n" +
            "***Syttien määrä:*** " + user["fishing_boat_timer"].length + "\n" +
              "***Paikka:*** " +
              place +
              "\n***Aika:*** " +
              time +
              "\n***Onki:*** " +
              rod +
              "\n***Sytti:*** " +
              bait
          }
        ]
      }
    };
}

function check_kaladex(user) {
  if (user["game_kalastus"]["tier1_completed"] == false) {
    for (var fish in fishes) {
      if (fishes[fish]["tier"] != 1) continue;
      if (user["game_kalastus"]["KalaDex"][fish]["caught"] == 0) {
        return;
      }
    }

    user["game_kalastus"]["tier1_completed"] = true;
    user["inventory"]["money"] += 100000;
    user["inventory"]["key_items"]["super_rod"] = true;
    client.channels
      .get("280272696560975872")
      .send(
        "Onnea <@" +
          user["id"] +
          "> olet suorittanut KalaDexin ensimmäisen osion. Palkinnoksi saat 100000" +
          emojies["coin"] +
          " ja Superongen " +
          emojies["superonki"]
      );
  } else if (user["game_kalastus"]["tier2_completed"] == false) {
    for (var fish in fishes) {
      if (fishes[fish]["tier"] != 2) continue;
      if (user["game_kalastus"]["KalaDex"][fish]["caught"] == 0) {
        return;
      }
    }

    user["game_kalastus"]["tier2_completed"] = true;
    user["inventory"]["money"] += 250000;
    user["inventory"]["key_items"]["hyper_rod"] = true;
    client.channels
      .get("280272696560975872")
      .send(
        "Onnea <@" +
          user["id"] +
          "> olet suorittanut KalaDexin toisen osion. Palkinnoksi saat 250000" +
          emojies["coin"] +
          " ja Hyperongen " +
          emojies["hyperonki"]
      );
  } else if (user["game_kalastus"]["tier3_completed"] == false) {
    for (var fish in fishes) {
      if (fishes[fish]["tier"] != 3) continue;
      if (user["game_kalastus"]["KalaDex"][fish]["caught"] == 0) {
        return;
      }
    }
    user["game_kalastus"]["tier3_completed"] = true;
    user["inventory"]["money"] += 500000;
    user["inventory"]["key_items"]["fishing_boat"] = true;

    client.channels
      .get("280272696560975872")
      .send(
        "Onnea <@" +
          user["id"] +
          "> olet suorittanut koko KalaDexin. Palkinnoksi saat 500000" +
          emojies["coin"] +
          " ja Kalastusveneen " +
          emojies["kalastusvene"]
      );
  }

  save_user(user);
}

function start_fishing(user, _part_day, _bait, _place, _depth, _rod_tier) {

  var bait = "";
  if (_bait == 1) {
    bait = "N";
  }
  if (_bait == 2) {
    bait = "S";
  }
  if (_bait == 3) {
    bait = "H";
  }

  var multi = 2;
  var rod = "";
  if (_rod_tier == 1) {
    rod = "N";
  }
  if (_rod_tier == 2) {
    rod = "S";
    multi = 2 * 1.2;
  }
  if (_rod_tier == 3) {
    rod = "H";
    multi = 2 * 1.3;
  }

  var depth = "";
  if (_depth == "pinta") {
    depth = "T";
  }
  if (_depth == "keski") {
    depth = "M";
  }
  if (_depth == "pohja") {
    depth = "B";
  }

  var place = "";
  if (_place == "meri") {
    place = "S";
  }
  if (_place == "joki") {
    place = "R";
  }
  if (_place == "järvi") {
    place = "L";
  }

  var available_fishes = {};
  for (var fish in fishes) {
    if (fish == "Aarrearkku") continue;
    if (
      fishes[fish]["depth"].includes(depth) &&
      fishes[fish]["place"].includes(place) &&
      fishes[fish]["time"].includes(_part_day) &&
      fishes[fish]["bait"].includes(bait) &&
      fishes[fish]["rod"].includes(rod)
    ) {
      available_fishes[fish] = fishes[fish];
    }

  }

  // Randomizer
  var bucket = [];
  for (var fish in available_fishes) {
    if (fish == "Aarrearkku") continue;
    var rarity = available_fishes[fish]["rarity"];
    var r = Math.floor((-rarity / 10 + 1) * 200);
    for (var i = 0; i < r; i++) {
      bucket.push(fish);
    }
  }

  var _rnd = Math.floor(Math.random() * Math.floor(bucket.length));

  var caught_fish = bucket[_rnd];

  var weight = randn_bm(0, fishes[caught_fish]["weight"] * multi, 1).toFixed(2);
  var cost = Math.floor((weight * fishes[caught_fish]["price"]) / 10) * 10;

  var time = Math.floor(Math.random() * Math.floor(3)) + 1;
  var rng_chest = Math.floor(Math.random() * Math.floor(300));
  if (depth == "B" && rng_chest == 1) {
    var _fish = {"Aarrearkku" : {
      "index" : 100,
      "weight": 100,
      "price" : 500,
      "emoji" : "aarrearkku",
      "description" : "Aarteinen arkku, näyttää olevan kivasti rahea sisällä!"
    }};

    return {
      fish: fishes["Aarrearkku"],
      name: "Aarrearkku",
      price: fishes["Aarrearkku"]["price"],
      weight: fishes["Aarrearkku"]["weight"],
      place: place,
      depth: depth,
      rod: rod,
      bait: bait,
      timer: time,
      time: _part_day
    };

  } else {
    return {
      fish: fishes[caught_fish],
      name: caught_fish,
      price: cost,
      weight: weight,
      place: place,
      depth: depth,
      rod: rod,
      bait: bait,
      timer: time,
      time: _part_day
    };
  }



}

function check_stun() {
  var stunned;
  var stun = firebase.database().ref("global_data/stunned");
  stun.on("value", function(d) {
    stunned = d.val();
    if (stunned == undefined) {
      stunned = ["id"];
    }

    firebase
      .database()
      .ref("global_data/stunned")
      .set(stunned);

  });
}

function get_stun() {
  var stunned;
  var stun = firebase.database().ref("global_data/stunned");
  stun.on("value", function(d) {
    stunned = d.val();
  });

  return stunned;
}


// All commands
const commands = {

  /// Game commands

  bj: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        check_deck();
        var deck = get_deck();

        msg.delete();

        const BJRATE = 20;

        let bet = msg.content.split(" ")[1];
        let starting_money = user["inventory"]["money"];
        let peak_money = user["basic_statistics"]["peak_money"];
        let basic_income = user["inventory"]["income"];

        ////

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
            bet = Math.log(parseFloat(bet)) * 100;
          } catch (err) {
            return msg.channel.send("Virhe logaritmissä!");
          }
        }

        let min_bet = Math.floor(user["inventory"]["money"] / (BJRATE * 10)) * 10;

        if (min_bet < 5) {
          min_bet = 5;
        }

        if (bet == "min") {
          bet = "" + min_bet;
        }
        if (bet == "max") {
          bet = "" + (starting_money);
        }
        if (bet == "puolet") {
          bet = "" + (starting_money / 2);
        }

        if (bet == 0)
          return msg.channel.send(
            "Panos pitää olla vähintään " + min_bet + emojies["coin"]
          );
        if (bet == "" || bet === undefined) {
          bet = "" + min_bet;
        }

        bet = "" + bet;

        if (bet.slice(-1) == "k") {
          bet = Math.floor(1000*parseFloat(bet));
        }
        else if (bet.slice(-1) == "m") {
          bet = Math.floor(1000000*parseFloat(bet));
        }

        if (isNaN(bet))
          return msg.channel.send("Panos tarvitsee olla positiivinen luku");
        if (bet < min_bet)
          return msg.channel.send(
            "Panos pitää olla vähintään " + min_bet + emojies["coin"]
          );

        bet = Math.floor(bet);

        ////


        if (user["inventory"]["money"] < bet) {
          return msg.channel.send("Liian iso panos!");
        }

        user["inventory"]["money"] -= bet;
        user["game_blackjack"]["all_bets"] += bet;
        user["game_blackjack"]["games"] += 1;

        if (bj[user["id"]] != undefined) {
          user["game_blackjack"]["games_lost"] += 1;
          bj[user["id"]].stop();
          delete bj[user["id"]];
        }

        // PELI //
        let dealer_hand = [];
        let player_hand = [];

        let dealer_sum = 0;
        let player_sum = 0;

        for (let i = 0; i < 2; i++) {
          dealer_hand = deal_card(user["id"], dealer_hand, user);
        }

        for (let u = 0; u < 2; u++) {
          player_hand = deal_card(user["id"], player_hand, user);
        }
        dealer_sum = calculate_sum(dealer_hand, true, 21);
        player_sum = calculate_sum(player_hand, false, 21);

        var history_log = [];
        history_log.push("" + emojies["J_"]);

        if (player_sum == 21) {
          user["game_blackjack"]["21"] += 1;
          user["game_blackjack"]["games_won"] += 1;
          user["game_blackjack"]["money_won"] += Math.floor(bet * 1.5);
          user["inventory"]["money"] += Math.floor(bet * 2.5);
          save_user(user);
          msg.channel.send(
            print_BJ(
              user["id"],
              player_hand,
              dealer_hand,
              Math.floor(bet),
              true,
              "Blackjack! Voitit " + Math.floor(bet * 1.5) + emojies["coin"],
              5348864,
              history_log,
              user
            )
          );
          return;
        } else if (player_sum > 21) {
          user["game_blackjack"]["over"] += 1;
          user["game_blackjack"]["games_lost"] += 1;
          user["game_blackjack"]["money_lost"] += Math.floor(bet);
          save_user(user);
          msg.channel.send(
            print_BJ(
              user["id"],
              player_hand,
              dealer_hand,
              Math.floor(bet),
              true,
              "Jakaja voitti! Hävisit " + Math.floor(bet) + emojies["coin"],
              9381414,
              history_log,
              user
            )
          );
          return;
        }

        save_user(user);

        let bot_message;
        msg.channel
          .send(
            print_BJ(
              user["id"],
              player_hand,
              dealer_hand,
              Math.floor(bet),
              true,
              " ",
              user["info"]["color"],
              history_log,
              user
            )
          )
          .then(m => {
            bot_message = m;
            return bot_message;
          })
          .then(async m => {
            await m.react(emojies["H_"]);
            await m.react(emojies["S_"]);

            let sum_u = calculate_sum(player_hand, false, 21);

            let sum = 0;
            for (let k = 0; k < player_hand.length; k++) {
              if (parseInt(player_hand[k].replace(/\D/g, "")) == 1) {
                sum += 1;
              } else if (parseInt(player_hand[k].replace(/\D/g, "")) > 10) {
                sum += 10;
              } else {
                sum += parseInt(player_hand[k].replace(/\D/g, ""));
              }
            }
            if (
              user["inventory"]["money"] > Math.floor(bet) &&
              ((sum_u >= 9 && sum_u <= 11) || (sum >= 9 && sum <= 11)) &&
              player_hand.length == 2 &&
              sum_u < 21
            ) {
              await m.react(emojies["D_"]);
            }
            return m;
          })
          .then(m => {
            bot_message = m;

            bj[user["id"]] = m.createReactionCollector(
              (reaction, _user) => _user.id === user["id"],
              {
                time: 60 * 1000
              }
            );
            bj[user["id"]].on("collect", (reaction, _user) => {
              if (reaction.emoji == emojies["S_"]) {
                stand();
              } else if (reaction.emoji == emojies["H_"]) {
                reaction.remove(user["id"]);

                for (let re of bot_message.reactions.array()) {
                  if (re.emoji == emojies["D_"]) {
                    re.remove(_user.id);
                  }
                }
                hit();
              } else if (reaction.emoji == emojies["D_"]) {
                let sum_u = calculate_sum(player_hand, false, 21);

                let sum = 0;
                for (let k = 0; k < player_hand.length; k++) {
                  if (parseInt(player_hand[k].replace(/\D/g, "")) == 1) {
                    sum += 1;
                  } else if (parseInt(player_hand[k].replace(/\D/g, "")) > 10) {
                    sum += 10;
                  } else {
                    sum += parseInt(player_hand[k].replace(/\D/g, ""));
                  }
                }
                if (
                  (sum_u >= 9 && sum_u <= 11) ||
                  (sum >= 9 &&
                    sum <= 11 &&
                    player_hand.length == 2 &&
                    sum_u < 21)
                ) {
                  double();
                }
              }
            });

            bj[user["id"]].on("end", () => {
              delete bj[user["id"]];

              var inc = Math.floor((1000 * Math.pow(1.08, user["basic_statistics"]["income_bought"]) * (10 + 5 * user["basic_statistics"]["income_bought"])) / 100) * 100;
              var mon = user["inventory"]["money"] + user["inventory"]["key_items"]["safe"]["money"];
              var mast = (inc*0.5+mon*1.5)/2
              var th = Math.floor(map(bet, min_bet, mast, 10, 1));
              draw_lootbox(user["id"], th, true);
              save_user(user);
            });

            function hit() {
              history_log.push("" + emojies["H_"]);

              // Aloittaa pelin jakamalla pelaajalle
              player_hand = deal_card(user["id"], player_hand, user);
              user["game_blackjack"]["hit"] += 1;

              save_user(user);

              // Tutkii playern summan
              let player_sum = calculate_sum(player_hand, false, 21);

              // Katsoo jos player voitti tai hävisi suoraan
              if (player_sum == 21 && player_hand.length == 2) {
                user["game_blackjack"]["BJ_21"] += 1;
                user["game_blackjack"]["games_won"] += 1;
                user["game_blackjack"]["money_won"] += Math.floor(bet * 1.5);
                user["inventory"]["money"] += Math.floor(bet * 2.5);

                save_user(user);
                bot_message.edit(
                  print_BJ(
                    user["id"],
                    player_hand,
                    dealer_hand,
                    Math.floor(bet),
                    true,
                    "Blackjack! Voitit " +
                      Math.floor(bet * 1.5) +
                      emojies["coin"],
                    5348864,
                    history_log,
                    user
                  )
                );
                bj[user["id"]].stop();
                return;
              } else if (player_sum == 21) {
                stand();

                return;
              } else if (player_sum > 21) {
                user["game_blackjack"]["over"] += 1;
                user["game_blackjack"]["games_lost"] += 1;
                user["game_blackjack"]["money_lost"] += Math.floor(bet);

                save_user(user);
                bot_message.clearReactions();
                bot_message.edit(
                  print_BJ(
                    user["id"],
                    player_hand,
                    dealer_hand,
                    Math.floor(bet),
                    false,
                    "Jakaja voitti! Hävisit " +
                      Math.floor(bet) +
                      emojies["coin"],
                    9381414,
                    history_log,
                    user
                  )
                );
                bj[user["id"]].stop();
              } else {
                bot_message.edit(
                  print_BJ(
                    user["id"],
                    player_hand,
                    dealer_hand,
                    Math.floor(bet),
                    true,
                    " ",
                    user["info"]["color"],
                    history_log,
                    user
                  )
                );
              }
            }

            function stand() {
              history_log.push("" + emojies["S_"]);
              bot_message.clearReactions();

              // katsoo summan -> jakaa ->
              user["game_blackjack"]["stand"] += 1;

              save_user(user);

              let player_sum = calculate_sum(player_hand, false, 21);

              while (true) {
                let jakaja_sum = calculate_sum(dealer_hand, false, 21);

                let sum_2 = 0;
                for (let k = 0; k < dealer_hand.length; k++) {
                  if (parseInt(dealer_hand[k].replace(/\D/g, "")) == 1) {
                    sum_2 += 1;
                  } else if (parseInt(dealer_hand[k].replace(/\D/g, "")) > 10) {
                    sum_2 += 10;
                  } else {
                    sum_2 += parseInt(dealer_hand[k].replace(/\D/g, ""));
                  }
                }

                // Katsoo jos player voitti tai hävisi suoraan
                if (jakaja_sum == 21 && dealer_hand.length == 2) {
                  user["game_blackjack"]["games_lost"] += 1;
                  user["game_blackjack"]["money_lost"] += Math.floor(bet);

                  save_user(user);

                  bot_message.edit(
                    print_BJ(
                      user["id"],
                      player_hand,
                      dealer_hand,
                      Math.floor(bet),
                      false,
                      "Jakajan Blackjack! Hävisit " +
                        Math.floor(bet) +
                        emojies["coin"],
                      9381414,
                      history_log,
                      user
                    )
                  );
                  bj[user["id"]].stop();
                  return;
                } else if (jakaja_sum > 21) {
                  user["game_blackjack"]["games_won"] += 1;
                  user["game_blackjack"]["money_won"] += Math.floor(bet);
                  user["inventory"]["money"] += Math.floor(bet * 2);

                  save_user(user);

                  bot_message.edit(
                    print_BJ(
                      user["id"],
                      player_hand,
                      dealer_hand,
                      Math.floor(bet),
                      false,
                      "Jakaja meni yli! Voitit " +
                        Math.floor(bet) +
                        emojies["coin"],
                      5348864,
                      history_log,
                      user
                    )
                  );
                  bj[user["id"]].stop();
                  return;
                } else if (jakaja_sum >= 17) {
                  if (jakaja_sum > player_sum) {
                    user["game_blackjack"]["games_lost"] += 1;
                    user["game_blackjack"]["money_lost"] += Math.floor(bet);
                    user["game_blackjack"]["less"] += 1;

                    save_user(user);

                    bot_message.edit(
                      print_BJ(
                        user["id"],
                        player_hand,
                        dealer_hand,
                        Math.floor(bet),
                        false,
                        "Jakaja voitti! Hävisit " +
                          Math.floor(bet) +
                          emojies["coin"],
                        9381414,
                        history_log,
                        user
                      )
                    );
                    bj[user["id"]].stop();
                    return;
                  } else if (jakaja_sum == player_sum) {
                    user["game_blackjack"]["games_lost"] += 1;
                    user["game_blackjack"]["money_lost"] += Math.floor(bet);
                    user["game_blackjack"]["tie"] += 1;

                    save_user(user);

                    bot_message.edit(
                      print_BJ(
                        user["id"],
                        player_hand,
                        dealer_hand,
                        Math.floor(bet),
                        false,
                        "Jakaja voitti! Hävisit " +
                          Math.floor(bet) +
                          emojies["coin"],
                        9381414,
                        history_log,
                        user
                      )
                    );
                    bj[user["id"]].stop();
                    return;
                  } else {
                    user["game_blackjack"]["games_won"] += 1;
                    user["game_blackjack"]["money_won"] += Math.floor(bet);
                    user["inventory"]["money"] += Math.floor(bet * 2);

                    save_user(user);

                    bot_message.edit(
                      print_BJ(
                        user["id"],
                        player_hand,
                        dealer_hand,
                        Math.floor(bet),
                        false,
                        "Voitit: " + Math.floor(bet) + emojies["coin"],
                        5348864,
                        history_log,
                        user
                      )
                    );
                    bj[user["id"]].stop();
                    return;
                  }
                } else {
                  dealer_hand = deal_card(user["id"], dealer_hand, user);
                }
              }
            }

            function double() {
              history_log.push("" + emojies["D_"]);
              bot_message.clearReactions();
              // katsoo summan -> jakaa ->

              user["game_blackjack"]["double"] += 1;
              user["inventory"]["money"] -= bet;

              player_hand = deal_card(user["id"], player_hand, user);
              player_sum = calculate_sum(player_hand, false, 21);

              if (player_sum > 21) {
                user["game_blackjack"]["over"] += 1;
                user["game_blackjack"]["games_lost"] += 1;
                user["game_blackjack"]["money_lost"] += Math.floor(bet * 2);

                save_user(user);

                msg.channel.send(
                  print_BJ(
                    user["id"],
                    player_hand,
                    dealer_hand,
                    Math.floor(bet) * 2,
                    false,
                    "Jakaja voitti! Hävisit " +
                      Math.floor(bet * 2) +
                      emojies["coin"],
                    9381414,
                    history_log,
                    user
                  )
                );
                bj[user["id"]].stop();
                return;
              }

              while (true) {
                jakaja_sum = calculate_sum(dealer_hand, false, 21);

                let sum_2 = 0;
                for (let k = 0; k < dealer_hand.length; k++) {
                  if (parseInt(dealer_hand[k].replace(/\D/g, "")) == 1) {
                    sum_2 += 1;
                  } else if (parseInt(dealer_hand[k].replace(/\D/g, "")) > 10) {
                    sum_2 += 10;
                  } else {
                    sum_2 += parseInt(dealer_hand[k].replace(/\D/g, ""));
                  }
                }

                // Katsoo jos player voitti tai hävisi suoraan
                if (jakaja_sum == 21 && dealer_hand.length == 2) {
                  user["game_blackjack"]["games_lost"] += 1;
                  user["game_blackjack"]["money_lost"] += Math.floor(bet * 2);

                  save_user(user);

                  bot_message.edit(
                    print_BJ(
                      user["id"],
                      player_hand,
                      dealer_hand,
                      Math.floor(bet) * 2,
                      false,
                      "Jakajan Blackjack! Hävisit " +
                        Math.floor(bet * 2) +
                        emojies["coin"],
                      9381414,
                      history_log,
                      user
                    )
                  );
                  bj[user["id"]].stop();
                  return;
                } else if (jakaja_sum > 21) {
                  user["game_blackjack"]["games_won"] += 1;
                  user["game_blackjack"]["money_won"] += Math.floor(bet * 2);
                  user["inventory"]["money"] += Math.floor(bet * 2 * 2);

                  save_user(user);

                  bot_message.edit(
                    print_BJ(
                      user["id"],
                      player_hand,
                      dealer_hand,
                      Math.floor(bet) * 2,
                      false,
                      "Jakaja meni yli! Voitit " +
                        Math.floor(bet * 2) +
                        emojies["coin"],
                      5348864,
                      history_log,
                      user
                    )
                  );
                  bj[user["id"]].stop();
                  return;
                } else if (jakaja_sum >= 17) {
                  if (jakaja_sum >= player_sum) {
                    user["game_blackjack"]["games_lost"] += 1;
                    user["game_blackjack"]["money_lost"] += Math.floor(bet * 2);
                    user["game_blackjack"]["less"] += 1;

                    save_user(user);

                    bot_message.edit(
                      print_BJ(
                        user["id"],
                        player_hand,
                        dealer_hand,
                        Math.floor(bet) * 2,
                        false,
                        "Jakaja voitti! Hävisit " +
                          Math.floor(bet * 2) +
                          emojies["coin"],
                        9381414,
                        history_log,
                        user
                      )
                    );
                    bj[user["id"]].stop();
                    return;
                  } else {
                    user["game_blackjack"]["games_won"] += 1;
                    user["game_blackjack"]["money_won"] += Math.floor(bet * 2);
                    user["inventory"]["money"] += Math.floor(bet * 2 * 2);

                    save_user(user);

                    bot_message.edit(
                      print_BJ(
                        user["id"],
                        player_hand,
                        dealer_hand,
                        Math.floor(bet) * 2,
                        false,
                        "Voitit: " + Math.floor(bet * 2) + emojies["coin"],
                        5348864,
                        history_log,
                        user
                      )
                    );
                    bj[user["id"]].stop();
                    return;
                  }
                } else {
                  // Jaa uusi kortti
                  dealer_hand = deal_card(user["id"], dealer_hand, user);
                }
              }
            }
          });

        // Tool commands for BJ

        function check_deck() {
          var deck_ref = firebase.database().ref("global_data/deck");
          deck_ref.on("value", function(d) {
            deck = d.val();
          });

          if (deck == undefined) {
            deck = [];
            for (let m = 0; m < 3; m++) {
              for (let p = 1; p < 14; p++) {
                deck.push(p + "S");
              }
              for (let h = 1; h < 14; h++) {
                deck.push(h + "H");
              }
              for (let r = 1; r < 14; r++) {
                deck.push(r + "C");
              }
              for (let ru = 1; ru < 14; ru++) {
                deck.push(ru + "D");
              }
            }
          } else if (deck.length < 15) {
            deck = [];
            for (let m = 0; m < 3; m++) {
              for (let p = 1; p < 14; p++) {
                deck.push(p + "S");
              }
              for (let h = 1; h < 14; h++) {
                deck.push(h + "H");
              }
              for (let r = 1; r < 14; r++) {
                deck.push(r + "C");
              }
              for (let ru = 1; ru < 14; ru++) {
                deck.push(ru + "D");
              }
            }
          }

          firebase
            .database()
            .ref("global_data/deck")
            .set(deck);
        }

        function get_deck() {
          var deck_ref = firebase.database().ref("global_data/deck");
          var deck;
          deck_ref.on("value", d => {
            deck = d.val();
          });
          return deck;
        }

        function set_deck(deck) {
          firebase
            .database()
            .ref("global_data/deck")
            .set(deck);
        }

        function deal_card(_player, _hand, _user) {
          // Adds new card to the hand
          var deck = get_deck();
          let player = _player;
          let hand = _hand;
          var rnd_c = Math.floor(Math.random() * Math.floor(deck.length));

          hand.push(deck[rnd_c]);
          deck.splice(rnd_c, 1);

          user["game_blackjack"]["cards_played"] += 1;
          set_deck(deck);
          save_user(_user);
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
            if (parseInt(hand[k].replace(/\D/g, "")) == 1) {
              sum += 11;
            } else if (parseInt(hand[k].replace(/\D/g, "")) > 10) {
              sum += 10;
            } else {
              sum += parseInt(hand[k].replace(/\D/g, ""));
            }
          }

          for (let x = 0; x < hand.length; x++) {
            if (sum > threshhold) {
              if (parseInt(hand[x].replace(/\D/g, "")) == 1) {
                sum -= 10;
              }
            }
          }
          return sum;
        }

        function print_BJ(
          _user,
          _player_hand,
          _dealer_hand,
          _bet,
          _first_time,
          _info_text,
          _color,
          _history_log,
          _User
        ) {
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
              dealer_hand_str += emojies["back"];
            } else {
              dealer_hand_str += "" + emojies[card];
            }
            count++;
          }
          for (let card of _player_hand) {
            player_hand_str += "" + emojies[card];
          }

          let sum = 0;
          for (let k = 0; k < _player_hand.length; k++) {
            if (parseInt(_player_hand[k].replace(/\D/g, "")) == 1) {
              sum += 1;
            } else if (parseInt(_player_hand[k].replace(/\D/g, "")) > 10) {
              sum += 10;
            } else {
              sum += parseInt(_player_hand[k].replace(/\D/g, ""));
            }
          }

          dealer_hand_str += "\nYht: " + dealer_sum;
          player_hand_str += "\nYht: " + player_sum;

          avatar = client.users.get(user).avatarURL;
          username = client.users.get(user).username;

          for (var i of _history_log) {
            history += i;
          }
          return {
            embed: {
              color: color,
              author: {
                name: "BLACKJACK",
                icon_url: avatar
              },
              description:
                "Rahat: " +
                _User["inventory"]["money"] +
                emojies["coin"] +
                ", Panos: " +
                _bet +
                emojies["coin"],
              fields: [
                {
                  name: "***Jakaja:***",
                  value: dealer_hand_str,
                  inline: false
                },
                {
                  name: "***" + username + ":***",
                  value: player_hand_str + "\n" + _info_text,
                  inline: true
                },

                {
                  name: "***Historia:***",
                  value: history,
                  inline: true
                }
              ],
              footer: {
                text: "Kortteja jäljellä: " + deck.length
              }
            }
          };
        }
      });
    });
  },

  slot: msg => {
    const ALLOWED_CHANNELS = ["280272696560975872"];
    const SLOTRATE = 30;
    if (!ALLOWED_CHANNELS.includes(msg.channel.id)) return msg.delete();

    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then( u => {
        var user = u;
        let bet = msg.content.split(" ")[1];
        var starting_money = user["inventory"]["money"];

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
            bet = Math.log(parseFloat(bet)) * 100;
          } catch (err) {
            return msg.channel.send("Virhe logaritmissä!");
          }
        }

        let min_bet = Math.floor(starting_money / (SLOTRATE * 10)) * 10;

        if (min_bet < 5) {
          min_bet = 5;
        }

        if (bet == "min") {
          bet = "" + min_bet;
        }
        if (bet == "max") {
          bet = "" + (starting_money);
        }
        if (bet == "puolet") {
          bet = "" + (starting_money / 2);
        }

        if (bet == 0)
          return msg.channel.send(
            "Panos pitää olla vähintään " + min_bet + emojies["coin"]
          );
        if (bet == "" || bet === undefined) {
          bet = "" + min_bet;
        }

        bet = "" + bet;
        if (bet.slice(-1) == "k") {
          bet = Math.floor(1000*parseFloat(bet));
        }
        else if (bet.slice(-1) == "m") {
          bet = Math.floor(1000000*parseFloat(bet));
        }

        if (isNaN(bet))
          return msg.channel.send("Panos tarvitsee olla positiivinen luku");
        if (bet < min_bet)
          return msg.channel.send(
            "Panos pitää olla vähintään " + min_bet + emojies["coin"]
          );

        bet = Math.floor(bet);

        try {
          if (starting_money < bet)
            return msg.channel.send(`Sulla ei oo varaa uhkapelata.`);
          user["inventory"]["money"] -= bet;
          user["game_slot"]["all_bets"] += bet;

          const tpog = 7;
          const tsasu = 35;
          const tkarvis = 28;
          const talfa = 18;
          const tjesilmero = 12;

          const pog1_v = 2;
          const pog2_v = 35;
          const pog3_v = 400;
          const sasu_v = 4;
          const karvis_v = 8;
          const alfa_v = 32;
          const jesilmero_v = 85;

          var win_line = [];
          for (var i = 0; i < 3; i++) {
            var rnd = Math.floor(Math.random() * Math.floor(100 + 1));
            if (rnd <= tkarvis) {
              win_line.push(emojies["karvis"]);
            } else if (rnd <= tsasu + tkarvis) {
              win_line.push(emojies["sasu"]);
            } else if (rnd <= tsasu + tkarvis + talfa) {
              win_line.push(emojies["alfa"]);
            } else if (rnd <= tsasu + tkarvis + tjesilmero + talfa) {
              win_line.push(emojies["jesilmero"]);
            } else {
              win_line.push(emojies["poggers"]);
            }
          }

          var winnings;
          if (
            win_line[0] == emojies["poggers"] &&
            win_line[1] == emojies["poggers"] &&
            win_line[2] == emojies["poggers"]
          ) {
            winnings = pog3_v * bet;
            win_line = [poggersrow, poggersrow, poggersrow];
            user["inventory"]["money"] += winnings;
            user["game_slot"]["wins"]["poggers3"] += 1;
          } else if (
            win_line[0] == emojies["poggers"] &&
            win_line[1] == emojies["poggers"]
          ) {
            winnings = pog2_v * bet;
            user["inventory"]["money"] += winnings;
            user["game_slot"]["wins"]["poggers2"] += 1;
            // poggers x 2
          } else if (win_line[0] == emojies["poggers"]) {
            winnings = pog1_v * bet;
            user["inventory"]["money"] += winnings;
            user["game_slot"]["wins"]["poggers1"] += 1;
            // poggers x 1
          } else if (
            win_line[0] == win_line[1] &&
            win_line[0] == win_line[2] &&
            win_line[1] == win_line[2]
          ) {
            if (win_line[0] == emojies["alfa"]) {
              winnings = alfa_v * bet;
              user["game_slot"]["wins"]["alfa"] += 1;
              user["inventory"]["money"] += winnings;
            } else if (win_line[0] == emojies["karvis"]) {
              winnings = karvis_v * bet;
              user["game_slot"]["wins"]["karvis"] += 1;
              user["inventory"]["money"] += winnings;
            } else if (win_line[0] == emojies["sasu"]) {
              winnings = sasu_v * bet;
              user["game_slot"]["wins"]["sasu"] += 1;
              user["inventory"]["money"] += winnings;
            } else if (win_line[0] == emojies["jesilmero"]) {
              winnings = jesilmero_v * bet;
              user["game_slot"]["wins"]["jesilmero"] += 1;
              user["inventory"]["money"] += winnings;
            }
          } else {
            winnings = 0;
          }

          if (winnings > 0) {
            user["game_slot"]["money_won"] += winnings;
            user["game_slot"]["games_won"] += 1;
            user["game_slot"]["games"] += 1;
          } else {
            user["game_slot"]["money_lost"] += bet;
            user["game_slot"]["games_lost"] += 1;
            user["game_slot"]["games"] += 1;
          }
        } catch (err) {
          msg.channel.send(`Tapahtui virhe.`);
          console.log(err);
        }

        if (
          user["inventory"]["money"] > user["basic_statistics"]["peak_money"]
        ) {
          user["basic_statistics"]["peak_money"] = user["inventory"]["money"];
        }

        var inc = Math.floor((1000 * Math.pow(1.08, user["basic_statistics"]["income_bought"]) * (10 + 5 * user["basic_statistics"]["income_bought"])) / 100) * 100;
        var mon = user["inventory"]["money"] + user["inventory"]["key_items"]["safe"]["money"];

        var weight = map(bet, 0, (inc+mon)/2,  25, 3);
        if (bet < 10*user["inventory"]["income"]) {
          weight = 100;
        }

        save_user(user);
        draw_lootbox(user["id"], weight, true);

        print_slot(win_line[0], win_line[1], win_line[2], winnings, user, msg, bet);

        function print_slot(_first_roll, _second_roll, _third_roll, _win_amount, user, msg, _bet) {
          // Prints slot results
          var starting_money = user["inventory"]["money"];
          var min_bet = Math.floor(starting_money / (SLOTRATE * 10)) * 10;
          if (min_bet < 5) {
            min_bet = 5;
          }

          const tpog = 7;
          const tsasu = 35;
          const tkarvis = 28;
          const talfa = 18;
          const tjesilmero = 12;

          var rnd = [];
          for (var i = 0; i < 6; i++) {
            var rnda = Math.floor(Math.random() * Math.floor(100 + 1));
            if (rnda <= tkarvis) {
              rnd.push(emojies["karvis"]);
            } else if (rnda <= tsasu + tkarvis) {
              rnd.push(emojies["sasu"]);
            } else if (rnda <= tsasu + tkarvis + talfa) {
              rnd.push(emojies["alfa"]);
            } else if (rnda <= tsasu + tkarvis + tjesilmero + talfa) {
              rnd.push(emojies["jesilmero"]);
            } else {
              rnd.push(emojies["poggers"]);
            }
          }

          let color = user["info"]["color"];
          if (_win_amount > 0) {
            color = 5348864;
          }

          var str =
            "Rahat: " +
            starting_money +
            emojies["coin"] +
            ", Panos: " +
            _bet +
            emojies["coin"] +
            "\n\n" +
            "⬛️|        " +
            rnd[0] +
            "    |    " +
            rnd[1] +
            "    |    " +
            rnd[2] +
            "        |⬛️\n" +
            "▶️|        " +
            _first_roll +
            "    |    " +
            _second_roll +
            "    |    " +
            _third_roll +
            "        |◀️\n" +
            "⬛️|        " +
            rnd[3] +
            "    |    " +
            rnd[4] +
            "    |    " +
            rnd[5] +
            "        |⬛️\n" +
            "\nVoitit: " +
            _win_amount +
            emojies["coin"] +
            ", Min panos: " +
            min_bet +
            emojies["coin"];

          msg.channel.send({
            embed: {
              color: color,
              author: {
                name: "SLOTTIPOTTI",
                icon_url:
                  "https://ih1.redbubble.net/image.517537251.7910/flat,800x800,075,f.u2.jpg"
              },
              fields: [
                {
                  name: "***" + user["name"] + "***",
                  value: str
                }
              ]
            }
          });
        }
      })
    })

  },

  harpoon: msg => {
    msg.delete();
    var user;
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        let multi = 1;
        if (user["inventory"]["key_items"]["golden_harpoon"]) {
          multi = 5;
          color = 16093987;
          icon = emojies["harpuuna"];
        } else {
          multi = 1;
          color = 1006999;
          icon = "";
        }

        if (user["inventory"]["money"] < 50 * multi) {
          return msg.channel.send(
            "Tarvitset vähintään " + 50 * multi + emojies["coin"] + "!"
          );
        }

        user["inventory"]["money"] -= 50 * multi;
        user["game_harpoon"]["games"] += 1;

        if (user["id"] in harpoon_collectors) {
          harpoon_collectors[user["id"]].stop();
          user["game_harpoon"]["money_lost"] += 50 * multi;
          user["game_harpoon"]["games_lost"] += 1;
          delete harpoon_collectors[user["id"]];
        }

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

        field_matrix[H - 1][0] = 9; // boat

        //////////
        var whale_rarity = 15;
        var balloon_rarity = 3;
        var shark_rarity = 1.5;
        //////////

        if (user["inventory"]["whale_breeding_program"]) {
          whale_rarity = 10;
        }

        var shark_rnd = Math.floor(
          Math.random() * Math.floor(shark_rarity + 1)
        );
        var balloon_rnd = Math.floor(
          Math.random() * Math.floor(balloon_rarity + 1)
        );
        var whale_rnd = Math.floor(
          Math.random() * Math.floor(whale_rarity + 1)
        );

        if (whale_rnd == 1) {
          var whale_tile = Math.floor(Math.random() * Math.floor(W - 2));
          field_matrix[H - 1][whale_tile + 3] = 3;
        }
        if (balloon_rnd == 1) {
          var balloon_x = Math.floor(Math.random() * Math.floor(W - 4 + 1)) + 3;
          var balloon_y = Math.floor(Math.random() * Math.floor(H - 3));
          field_matrix[balloon_y][balloon_x] = 2;
        }
        if (shark_rnd == 1) {
          while (true) {
            var shark_tile = Math.floor(Math.random() * Math.floor(W - 2));
            if (field_matrix[H - 1][shark_tile + 2] != 3) {
              field_matrix[H - 1][shark_tile + 2] = 1;
              break;
            } else {
              continue;
            }
          }
        }
        if (shark_rnd != 1 && balloon_rnd != 1 && whale_rnd != 1) {
          var shark_tile = Math.floor(Math.random() * Math.floor(W - 2));
          field_matrix[H - 1][shark_tile + 2] = 1;
        }

        // Print
        field = get_field_string(field_matrix, multi);

        let wind = Math.floor(Math.random() * Math.floor(10 + 1)) - 5;
        wind_str = get_wind_string(wind);

        msg.channel
          .send({
            embed: {
              color: color,
              author: {
                name: "HARPOON: " + user["name"],
                icon_url:
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbDL3_tJo_6dJjnVd0hUZMhIIm5NPacOTVJB1yuKU_v0B4zXNtKg"
              },
              fields: [
                {
                  name: icon + " Tuuli: " + wind_str,
                  value: field
                },
                {
                  name: "Ammu kirjoittamalla: ",
                  value: tokens.prefix + "ammu <asteet> <voima> (1-90°, 1-100)."
                }
              ]
            }
          })
          .then(m => {
            msg[user["id"]] = m;
          });

        save_user(user);

        function get_field_string(_field_matrix, multi) {
          let trail = "";
          if (multi == 5) {
            trail = "🔸";
          } else {
            trail = "▫️";
          }

          new_field = "";
          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              if (_field_matrix[y][x] == 0) {
                new_field += "⬛️";
              } else if (_field_matrix[y][x] == 8) {
                new_field += "🌊";
              } else if (_field_matrix[y][x] == 1) {
                new_field += "🦈";
              } else if (_field_matrix[y][x] == 2) {
                new_field += "🎈";
              } else if (_field_matrix[y][x] == 3) {
                new_field += "🐳";
              } else if (_field_matrix[y][x] == 9) {
                new_field += "🚢";
              } else if (_field_matrix[y][x] == 6) {
                new_field += trail;
              } else if (_field_matrix[y][x] == 7) {
                new_field += "💥";
              } else if (_field_matrix[y][x] == 4) {
                new_field += "💦";
              }
            }
            new_field += "\n";
          }
          return new_field;
        }

        function get_wind_string(wind) {
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
          return wind_str;
        }

        harpoon_collectors[user["id"] + ""] = msg.channel.createCollector(
          m => m
        );
        harpoon_collectors[user["id"] + ""].on("collect", m => {
          if (
            m.content.startsWith(tokens.prefix + "ammu") &&
            user["id"] == m.author.id
          ) {
            m.delete();

            let deg = m.content.split(" ")[1];
            let force = m.content.split(" ")[2];

            if (isNaN(deg) || isNaN(force))
              return msg.channel.send(
                "Kulma tarvitsee olla välillä 1-90 astetta ja voima välillä 1-100"
              );
            if (deg < 1 || deg > 90)
              return msg.channel.send(
                "Kulma tarvitsee olla välillä 1-90 astetta ja voima välillä 1-100"
              );

            shoot_harpoon(deg, force, wind, field_matrix, user);
            //draw_lootbox_weighted(user["id"], 14400, 1, 800);
            harpoon_collectors[user["id"]].stop();
            delete harpoon_collectors[user["id"]];
            delete msg[user["id"]];
          } else if (m.content.startsWith(tokens.prefix + "lopeta")) {
            msg.channel.send("Lopetetaan harppuuna.").then(() => {
              user["game_harpoon"]["money_lost"] += 50 * multi;
              user["game_harpoon"]["games_lost"] += 1;
              harpoon_collectors[user["id"]].stop();
              delete harpoon_collectors[user["id"]];
              delete msg[user["id"]];
            });
          }
          save_user(user);
        });

        function shoot_harpoon(_deg, _force, _wind, _field_matrix, user) {
          harpoon_collectors[user["id"]].stop();
          let multi = 1;
          if (user["inventory"]["key_items"]["golden_harpoon"] == true) {
            multi = 5;
          } else {
            multi = 1;
          }

          let field_matrix = _field_matrix;

          let c_w = W * 10;
          let c_h = H * 10;

          let _x = 0;
          let _y = c_w - (c_h / H) * (H - 1);

          let g = -0.2;

          let f_x = Math.cos((_deg / 180) * Math.PI) * _force;
          let f_y = Math.sin((_deg / 180) * Math.PI) * _force;

          let i = 0;
          let flag = true;

          while (flag) {
            i++;

            _x = _x + ((_wind / 5) * i) / 2000 + f_x / 100;
            _y = _y - ((g * i) / 100 + f_y / 100);

            if (_x <= 0 || _x > c_w) {
              user["game_harpoon"]["money_lost"] += 50 * multi;
              user["game_harpoon"]["games_lost"] += 1;
              break;
            }
            if (_y >= c_h) {
              user["game_harpoon"]["money_lost"] += 50 * multi;
              user["game_harpoon"]["games_lost"] += 1;
              break;
            }

            _xtile = Math.floor((_x / c_w) * W);
            _ytile = Math.floor((_y / c_h) * H);

            if (_xtile == 0 && _ytile == H - 1) {
              continue;
            }

            try {
              // OSUMAT
              win_text = "Ammuit ohi... -" + 50 * multi + emojies["coin"];

              if (field_matrix[_ytile][_xtile] == 1) {
                win_text =
                  "Osuit haihin! Voitit: " + 150 * multi + emojies["coin"];

                user["game_harpoon"]["hits"] += 1;
                user["game_harpoon"]["targets"]["shark"] += 1;
                user["game_harpoon"]["money_won"] += 150 * multi;
                user["game_harpoon"]["games_won"] += 1;
                user["inventory"]["money"] += 150 * multi;

                field_matrix[_ytile][_xtile] = 7;
                flag = false;
                break;
              }
              if (field_matrix[_ytile][_xtile] == 2) {
                win_text =
                  "Osuit palloon! Voitit: " + 250 * multi + emojies["coin"];

                user["game_harpoon"]["hits"] += 1;
                user["game_harpoon"]["targets"]["balloon"] += 1;
                user["game_harpoon"]["money_won"] += 250 * multi;
                user["game_harpoon"]["games_won"] += 1;
                user["inventory"]["money"] += 250 * multi;

                field_matrix[_ytile][_xtile] = 7;
                flag = false;
                break;
              }
              if (field_matrix[_ytile][_xtile] == 3) {
                win_text =
                  "Osuit valaaseen! Voitit " + 1000 * multi + emojies["coin"];

                user["game_harpoon"]["hits"] += 1;
                user["game_harpoon"]["targets"]["whale"] += 1;
                user["game_harpoon"]["money_won"] += 1000 * multi;
                user["game_harpoon"]["games_won"] += 1;
                user["inventory"]["money"] += 1000 * multi;

                field_matrix[_ytile][_xtile] = 7;
                flag = false;
                break;
              }

              if (_ytile == H - 1) {
                field_matrix[_ytile][_xtile] = 4;
                flag = false;
                user["game_harpoon"]["money_lost"] += 50 * multi;
                user["game_harpoon"]["games_lost"] += 1;
                break;
              }

              field_matrix[_ytile][_xtile] = 6;
            } catch (err) {
              continue;
            }
          }

          new_field = get_field_string(field_matrix, multi);
          wind_str = get_wind_string(wind);

          if (multi == 5) {
            color = 16093987;
            icon = emojies["harpuuna"];
          } else {
            color = 1006999;
            icon = "";
          }

          save_user(user);
          draw_lootbox(user["id"], 5, true);


          msg[user["id"]].edit({
            embed: {
              color: color,
              author: {
                name: "HARPOON: " + user["name"],
                icon_url:
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbDL3_tJo_6dJjnVd0hUZMhIIm5NPacOTVJB1yuKU_v0B4zXNtKg"
              },
              fields: [
                {
                  name: icon + " Ammuit:",
                  value: "Kulma: " + _deg + "°, Voima: " + _force + "."
                },
                {
                  name: "Tuuli: " + wind_str,
                  value: new_field
                },
                {
                  name: "Tulos:",
                  value: win_text
                }
              ]
            }
          });
        }
      });
    });
  },

  ryhmäpeli: async msg => {
    var message;
    await check_user_in_database(msg.author.id);
    var users = await get_all_users();

    let bet = msg.content.split(" ")[1];
    if (bet == "" || bet == undefined) {
      bet = "100";
    }

    if (bet.slice(-1) == "k") {
      bet = Math.floor(1000*parseFloat(bet));
    }
    else if (bet.slice(-1) == "m") {
      bet = Math.floor(1000000*parseFloat(bet));
    }

    if (isNaN(bet)) return msg.channel.send("Panos tarvitsee olla luku");
    if (bet < 100)
      return msg.channel.send(
        `Ryhmäpelin panos pitää olla vähintään 100 ` + emojies["coin"]
      );

    bet = Math.floor(bet);

    msg.channel
      .send(
        "***" +
          users[msg.author.id]["name"] +
          "*** loi ryhmäpelin panoksella " +
          bet +
          emojies["coin"] +
          ". Liity mukaan painamalla ✅"
      )
      .then(function(msg) {
        message = msg;
        msg.react("✅");
      })
      .catch(function() {
        //Something
      });

    let co = msg.channel.createCollector(m => m);
    co.on("collect", m => {
      if (
        m.content.startsWith(tokens.prefix + "aloita") &&
        msg.author.id == m.author.id
      ) {
        draw(message);
      } else if (m.content.startsWith(tokens.prefix + "keskeytä")) {
        msg.channel.send("Keskeytetään ryhmäpeli.").then(() => {
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
        var usr = client.users.get(participators[i]);
        if (usr.bot) {
        } else if (users[participators[i]] == undefined) {
          failures.push(participators[i]);
        } else if (users[participators[i]]["inventory"]["money"] < bet) {
          no_enough_money.push(participators[i]);
        } else if (users[participators[i]]["ironman"]) {
          ironman_players.push(participators[i]);
        } else {
          successful_players.push(participators[i]);
        }
      }

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
      var ir = "";
      if (successful_players.length < 2)
        return msg.channel.send("Ei ole tarpeeksi kelvollisia osallistuja!");
      if (failures.length > 0) {
        ep = "Error 404:\n" + unsuccessful;
      }
      if (no_enough_money.length > 0) {
        ra = "Liian köyhät:\n" + no_enough_moneys;
      }
      if (ironman_players.length > 0) {
        ir = "Ironmanit:\n" + ironman_players_t;
      }
      var all_money = bet * successful_players.length;
      var rnd = Math.floor(
        Math.random() * Math.floor(successful_players.length)
      );
      var winner = successful_players[rnd];

      for (var part of successful_players) {
        users[part]["inventory"]["money"] -= bet;
        users[part]["game_ryhmäpeli"]["games"] += 1;

        if (part != winner) {
          users[part]["game_ryhmäpeli"]["money_lost"] += bet;
          users[part]["game_ryhmäpeli"]["games_lost"] += 1;
          save_user(users[part]);
        }
      }

      users[winner]["game_ryhmäpeli"]["money_won"] += all_money - bet;
      users[winner]["game_ryhmäpeli"]["games_won"] += 1;
      users[winner]["inventory"]["money"] += all_money;

      check_peak(users[winner]);
      save_user(users[winner]);

      msg.channel.send(
        "Ryhmäpelin potti: " +
          all_money +
          emojies["coin"] +
          "\nVoittaja on: <@" +
          winner +
          ">\n\nOsallistuneet pelaajat:\n" +
          successful +
          "\n" +
          ra +
          ep +
          ir
      );
    }
  },

  kaikkitaieimitään: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        const MIN = 500;

        let starting_money = user["inventory"]["money"];
        let peak_money = user["basic_statistics"]["peak_money"];

        if (user["inventory"]["money"] < MIN)
          return msg.channel.send(
            "Tarvitset vähintään " +
              MIN +
              " " +
              emojies["coin"] +
              " pelataksesi kaikki tai ei mitään."
          );

        var rnd = Math.floor(Math.random() * Math.floor(1000) + 1);

        if (rnd % 2 == 0) {
          user["inventory"]["money"] *= 2;
          msg.channel.send({
            embed: {
              color: 5348864,
              image: {
                url: "https://i.ytimg.com/vi/F39Y67DzHTM/hqdefault.jpg"
              },
              fields: [
                {
                  name:
                    "***VOITIT: " +
                    user["inventory"]["money"] / 2 +
                    emojies["coin"] +
                    "***",
                  value:
                    "Rollasit: " +
                    rnd +
                    ". (Parillinen = winnings, Pariton = Häviö)"
                },
                {
                  name: "Rahat nyt:",
                  value: "" + user["inventory"]["money"] + emojies["coin"]
                }
              ]
            }
          });

          user["game_KTEM"]["games_won"] += 1;
          user["game_KTEM"]["money_won"] += user["inventory"]["money"] / 2;
        } else {
          user["game_KTEM"]["money_lost"] += user["inventory"]["money"];
          msg.channel.send({
            embed: {
              color: 9381414,
              image: {
                url: "https://static.naamapalmu.com/files/pp/big/v7vkeefs.jpg"
              },
              fields: [
                {
                  name:
                    "***HÄVISIT: " +
                    user["inventory"]["money"] +
                    emojies["coin"] +
                    "***",
                  value:
                    "Rollasit: " +
                    rnd +
                    ". (Parillinen = Voitto, Pariton = Häviö)"
                },
                {
                  name: "Rahat nyt:",
                  value: "0" + emojies["coin"]
                }
              ]
            }
          });
          user["inventory"]["money"] = 0;
        }

        if (
          user["inventory"]["money"] > user["basic_statistics"]["peak_money"]
        ) {
          user["basic_statistics"]["peak_money"] = user["inventory"]["money"];
        }
        user["game_KTEM"]["games"] += 1;
        user["game_KTEM"]["all_bets"] += user["inventory"]["money"];

        var weight = map(starting_money, 0, user["basic_statistics"]["peak_money"],  9, 1);
        if (starting_money < 10*user["inventory"]["income"]) {
          weight = 100;
        }

        save_user(user);
        draw_lootbox(user["id"], weight, true);
      });
    });
  },

  kalasta: async msg => {
    await check_user_in_database(msg.author.id);
    var user = await get_user(msg.author.id);
    var rod_tier = 0;
    // Rods
    if (user["inventory"]["key_items"]["hyper_rod"]) {
      rod_tier = 3;
    } else if (user["inventory"]["key_items"]["super_rod"]) {
      rod_tier = 2;
    } else if (user["inventory"]["key_items"]["rod"]) {
      rod_tier = 1;
    } else {
      return msg.channel.send("Sulla ei oo onkea! :(");
    }
    var date = new Date();
    var hour = date.getHours();
    var part_day = "";
    var time;
    if (hour >= 5 && hour < 10) {
      part_day = "M";
      time = "Aamu";
    }
    if (hour >= 10 && hour < 18) {
      part_day = "A";
      time = "Päivä";
    }
    if (hour >= 18 && hour < 23) {
      part_day = "E";
      time = "Ilta";
    }
    if (hour >= 23 || hour < 5) {
      part_day = "N";
      time = "Yö";
    }
    if ("timemachine_timer" in user) {
      part_day = user["timemachine_timer"]["part_day"];
      time = user["timemachine_timer"]["time"];
    }

    if ("fishing_timer" in user)
      return msg.channel.send("Olet jo kalastamassa!");
    if ("fishing_boat_timer" in user)
      return msg.channel.send("Olet jo kalastamassa!");
    let argument = msg.content.split(" ")[1];
    let depth = msg.content.split(" ")[2];

    if (argument != undefined) {
      argument = argument.toLowerCase();
    }
    if (depth != undefined) {
      depth = depth.toLowerCase();
    }

    switch (argument) {
      case "su":
        argument = "supersytti";
        break;
      case "hy":
        argument = "hypersytti";
        break;
      case "me":
        argument = "meri";
        break;
      case "jo":
        argument = "joki";
        break;
      case "jä":
        argument = "järvi";
        break;
    }

    switch (depth) {
      case "pi":
        depth = "pinta";
        break;
      case "ke":
        depth = "keski";
        break;
      case "po":
        depth = "pohja";
        break;
      case "syvä":
        depth = "pohja";
        break;
      case "sy":
        depth = "pohja";
        break;
      case "matala":
        depth = "pinta";
        break;
      case "ma":
        depth = "pinta";
        break;
    }

    var arguments = ["joki", "meri", "järvi", "supersytti", "hypersytti"];
    var depths = ["pinta", "keski", "pohja"];

    if (argument == "" || argument == undefined)
      return msg.channel.send("Kirjoita paikka tai sytti!");
    if (!arguments.includes(argument))
      return msg.channel.send(
        "Virheellinen paikka tai sytti! Kirjoita joko joki, meri, järvi tai erikoisytti."
      );

    if (depth == "" || depth == undefined)
      return msg.channel.send("Kirjoita syvyys! (pinta, keski tai pohja)");
    if (!depths.includes(depth))
      return msg.channel.send(
        "Virheellinen syvyys! Kirjoita joko pinta, keski tai pohja."
      );

    var bait;
    var place;
    if (argument == "supersytti") {
      bait = 2;
      if (user["inventory"]["items"]["super_bait"] < 1)
        return msg.channel.send("Sulla ei ole supersyttiä!");
      user["inventory"]["items"]["super_bait"] -= 1;
      user["game_kalastus"]["super_bait_consumed"] += 1;
    } else if (argument == "hypersytti") {
      bait = 3;
      if (user["inventory"]["items"]["hyper_bait"] < 1)
        return msg.channel.send("Sulla ei ole hypersyttiä!");
      user["inventory"]["items"]["hyper_bait"] -= 1;
      user["game_kalastus"]["hyper_bait_consumed"] += 1;
    } else {
      bait = 1;
      if (user["inventory"]["items"]["bait"] < 1)
        return msg.channel.send("Sulla ei ole syttiä!");
      user["inventory"]["items"]["bait"] -= 1;
      user["game_kalastus"]["bait_consumed"] += 1;
    }

    if (argument == "joki") {
      place = "joki";
      user["game_kalastus"]["in_river"] += 1;
    } else if (argument == "järvi") {
      place = "järvi";
      user["game_kalastus"]["in_lake"] += 1;
    } else {
      place = "meri";
      user["game_kalastus"]["in_sea"] += 1;
    }
    if (depth == "pohja") {
      user["game_kalastus"]["bot"] += 1;
    }
    if (depth == "keski") {
      user["game_kalastus"]["mid"] += 1;
    }
    if (depth == "pinta") {
      user["game_kalastus"]["top"] += 1;
    }

    if (rod_tier == 1) {
      user["game_kalastus"]["rod_used"] += 1;
    }
    if (rod_tier == 2) {
      user["game_kalastus"]["super_rod_used"] += 1;
    }
    if (rod_tier == 3) {
      user["game_kalastus"]["hyper_rod_used"] += 1;
    }

    user["fishing_timer"] = start_fishing(
      user,
      part_day,
      bait,
      place,
      depth,
      rod_tier
    );
    msg.channel.send("Kalastetaan!");
    save_user(user);
  },

  kalastusvene: async msg => {
    await check_user_in_database(msg.author.id);
    var user = await get_user(msg.author.id);

    var rod_tier = 0;
    // Rods
    if (user["inventory"]["key_items"]["hyper_rod"]) {
      rod_tier = 3;
    } else if (user["inventory"]["key_items"]["super_rod"]) {
      rod_tier = 2;
    } else if (user["inventory"]["key_items"]["rod"]) {
      rod_tier = 1;
    } else {
      return msg.channel.send("Sulla ei oo onkea! :(");
    }

    if (!user["inventory"]["key_items"]["fishing_boat"])
      return msg.channel.send("Sulla ei ole kalastusvenettä!");

    var date = new Date();
    var hour = date.getHours();
    var part_day = "";
    var time;

    if (hour > 6 && hour <= 10) {
      part_day = "M";
      time = "Aamu";
    }
    if (hour > 10 && hour <= 18) {
      part_day = "A";
      time = "Päivä";
    }
    if (hour > 18 && hour <= 23) {
      part_day = "E";
      time = "Ilta";
    }
    if (hour > 23 || hour <= 6) {
      part_day = "N";
      time = "Yö";
    }

    if ("timemachine_timer" in user) {
      part_day = user["timemachine_timer"]["part_day"];
      time = user["timemachine_timer"]["time"];
    }

    if ("fishing_timer" in user)
      return msg.channel.send("Olet jo kalastamassa!");
    if ("fishing_boat_timer" in user)
      return msg.channel.send("Olet jo kalastamassa!");

    let argument = msg.content.split(" ")[1];

    if (argument != undefined) {
      argument = argument.toLowerCase();
    }

    var amount = msg.content.split(" ")[2];

    if (amount != undefined) {
      amount = amount.toLowerCase();
    }

    switch (argument) {
      case "su":
        argument = "supersytti";
        break;
      case "hy":
        argument = "hypersytti";
        break;
      case "me":
        argument = "meri";
        break;
      case "jo":
        argument = "joki";
        break;
      case "jä":
        argument = "järvi";
        break;
    }

    var arguments = ["joki", "meri", "järvi", "supersytti", "hypersytti"];

    if (argument == "" || argument == undefined)
      return msg.channel.send("Kirjoita paikka tai sytti!");
    if (!arguments.includes(argument))
      return msg.channel.send(
        "Virheellinen paikka tai sytti! Kirjoita joko joki, meri, järvi tai erikoisytti."
      );

    if (amount == "" || amount === undefined) {
      amount = 10;
      if (argument == "supersytti") {
        if (user["inventory"]["items"]["super_bait"] < amount) {
          amount = user["inventory"]["items"]["super_bait"];
        }
      } else if (argument == "hypersytti") {
        if (user["inventory"]["items"]["hyper_bait"] < amount) {
          amount = user["inventory"]["items"]["hyper_bait"];
        }
      } else {
        if (user["inventory"]["items"]["bait"] < amount) {
          amount = user["inventory"]["items"]["bait"];
        }
      }
    }

    if (isNaN(amount)) return msg.channel.send("Syttien määrä tarvitsee olla positiivinen luku");
    amount = Math.floor(amount);
    if (amount == 0) return msg.channel.send("Tarvitset ainakin yhden syötin!");
    if (amount < 1 || amount > 10) {
      return msg.channel.send("Syttien määrä tulee olla 1-10!");
    }
    if (amount == "min") {
      amount = 1;
    }
    if (amount == "max") {
      amount = 10;
    }
    if (amount == "puolet") {
      amount = 10 / 2;
    }

    var bait;
    var place;
    if (argument == "supersytti") {
      bait = 2;
      if (user["inventory"]["items"]["super_bait"] < amount)
        return msg.channel.send("Sulla ei ole tarpeeksi supersyttiä!");
      user["inventory"]["items"]["super_bait"] -= amount;
      user["game_kalastus"]["super_bait_consumed"] += amount;
    } else if (argument == "hypersytti") {
      bait = 3;
      if (user["inventory"]["items"]["hyper_bait"] < amount)
        return msg.channel.send("Sulla ei ole tarpeeksi hypersyttiä!");
      user["inventory"]["items"]["hyper_bait"] -= amount;
      user["game_kalastus"]["hyper_bait_consumed"] += amount;
    } else {
      bait = 1;
      if (user["inventory"]["items"]["bait"] < amount)
        return msg.channel.send("Sulla ei ole tarpeeksi syttiä!");
      user["inventory"]["items"]["bait"] -= amount;
      user["game_kalastus"]["bait_consumed"] += amount;
    }

    if (argument == "joki") {
      place = "joki";
      user["game_kalastus"]["in_river"] += amount;
    } else if (argument == "järvi") {
      place = "järvi";
      user["game_kalastus"]["in_lake"] += amount;
    } else {
      place = "meri";
      user["game_kalastus"]["in_sea"] += amount;
    }


    if (rod_tier == 1) {
      user["game_kalastus"]["rod_used"] += amount;
    }
    if (rod_tier == 2) {
      user["game_kalastus"]["super_rod_used"] += amount;
    }
    if (rod_tier == 3) {
      user["game_kalastus"]["hyper_rod_used"] += amount;
    }
    var list = [];
    for (var i = 0; i < amount; i++) {
      var rnd = Math.floor(Math.random() * Math.floor(3 + 1));
      switch (rnd) {
        case 1:
          var depth = "pohja";
          break;
        case 2:
          var depth = "pinta";
          break;
        case 3:
          var depth = "keski";
          break;
      }


      if (depth == "pohja") {
        user["game_kalastus"]["bot"] += 1;
      }
      if (depth == "keski") {
        user["game_kalastus"]["mid"] += 1;
      }
      if (depth == "pinta") {
        user["game_kalastus"]["top"] += 1;
      }

      list.push(start_fishing(user, part_day, bait, place, depth, rod_tier));
    }

    msg.channel.send("Kalastusreissulla " + amount + " syötillä!");
    user["game_kalastus"]["fishing_boat_used"] += 1;
    user["fishing_boat_timer"] = list;
    save_user(user);
  },

  ///

  mäjäytä: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        let name = msg.content.split(" ")[1];

          name = name.replace(/\D/g, "");

          var flag = false;
          for (var u in client.users.array()) {
            var _user = client.users.array()[u];
            if (_user.id == name) {
              flag = true;
            }
          }

          if (!flag) return;

          var target_id = name;
          var sender_id = user["id"];

        check_user_in_database(target_id).then(() => {
          get_user(target_id).then(target_user => {

            if (user["inventory"]["items"]["log"] < 1)
              return msg.channel.send(`Sulla ei ole tukkeja`);
            if (name == sender_id)
              return msg.channel.send(`Älä lyö ittees vitun idiotti!`);

            if ("security_cam" in target_user) {
              target_user["security_cam"]["protected"] += 1;
              save_user(target_user);
              return msg.channel.send(
                `Hän huomasi sinut ennalta, et päässyt antamaan läppälimua häneen...`
              );
            }


            if (target_user["inventory"]["items"]["shield"] > 0) {
              msg.channel.send(
                `Hänellä oli kilpi. <@${name}> selvisi vaurioitta.`
              );
              var rnd = Math.floor(Math.random() * Math.floor(5 + 1));
              if (rnd == 3) {
                target_user["inventory"]["items"]["shield"] -= 1;
                msg.channel.send(
                  `Kilpi meni kuitenkin rikki...`
                );
              }

              user["basic_statistics"]["log_used"] += 1;
              user["inventory"]["items"]["log"] -= 1;
              save_user(user);
              save_user(target_user);
              return;
            }

            var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
            var amount = Math.floor(Math.random() * Math.floor(300 + 1)) * 50;
            var your_amount = Math.floor(amount / 10);
            if (rnd > 3 ) {
              if (target_user["inventory"]["money"] < amount) {
                amount = target_user["inventory"]["money"];
                your_amount = Math.floor(amount / 10);
              }
              msg.channel.send(
                "Löit jäbää <@" +
                  name +
                  ">! Hän pudotti " +
                  amount +
                  emojies["coin"] +
                  " maahan eikä saanut yhtään takaisin... Ehdit keräämään " + your_amount + emojies["coin"] + " kolikkoa maasta..."
              );
              target_user["inventory"]["money"] -= amount;
              user["inventory"]["money"] += your_amount;
            } else {
              msg.channel.send(
                "Löit jäbää <@" + name + ">! Et hyötyny mitään."
              );
            }
            user["inventory"]["items"]["log"] -= 1;
            user["basic_statistics"]["log_used"] += 1;
            user["basic_statistics"]["logged_money"] += amount;
            target_user["basic_statistics"]["hit_with_log"] += 1;
            target_user["basic_statistics"]["logged_money_from_you"] += amount;
            save_user(user);
            save_user(target_user);

          });
        });
      });
    });
  },

  avaa: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        let type = msg.content.split(" ")[1];
        let all = msg.content.split(" ")[2];
        if (type != undefined) {
          type = type.toLowerCase();
        }
        let open_all = false;
        if (all == "kaikki" || all == "k") {
          open_all = true;
        }

        var drop_table = {
          common : {
            Coins: {
              path: "user['inventory']['money']",
              amount: [600, 800, 1000],
              name: emojies["coin"],
              rate: 18,
              real_name: "Coins"
            },
            Sytti: {
              path: "user['inventory']['items']['bait']",
              amount: [2, 3],
              name: emojies["sytti"],
              rate: 12,
              real_name: "Sytti"
            },
            Keppi: {
              path: "user['inventory']['items']['stick']",
              amount: [2],
              name: emojies["keppi"],
              rate: 10,
              real_name: "Keppi"
            },
            Pronssitulo: {
              path: "user['inventory']['items']['bronze_income']",
              amount: [1],
              name: emojies["perustulo1"],
              rate: 1,
              real_name: "Pronssitulo"
            }
          },
          uncommon: {
              Coins: {
                path: "user['inventory']['money']",
                amount: [1200, 1500, 2000],
                name: emojies["coin"],
                rate: 10,
                real_name: "Coins"
              },
              Sytti: {
                path: "user['inventory']['items']['bait']",
                amount: [4, 5, 6],
                name: emojies["sytti"],
                rate: 5,
                real_name: "Sytti"
              },
              Keppi: {
                path: "user['inventory']['items']['stick']",
                amount: [5],
                name: emojies["keppi"],
                rate: 5,
                real_name: "Keppi"
              },
              Onki: {
                path: "user['inventory']['key_items']['rod']",
                amount: true,
                key: true,
                name: emojies["onki"],
                rate: 1,
                real_name: "Onki"
              },
              Supersytti: {
                path: "user['inventory']['items']['super_bait']",
                amount: [1],
                name: emojies["supersytti"],
                rate: 4,
                real_name: "Supersytti"
              },
              Pommi: {
                path: "user['inventory']['items']['bomb']",
                amount: [1],
                name: emojies["pommi"],
                rate: 1,
                real_name: "Pommi"
              },
              Kilpi: {
                path: "user['inventory']['items']['shield']",
                amount: [1],
                name: emojies["kilpi"],
                rate: 1,
                real_name: "Kilpi"
              }
            },
          rare: {
            Coins: {
              path: "user['inventory']['money']",
              amount: [10000, 12000, 14000],
              name: emojies["coin"],
              rate: 5,
              real_name: "Coins"
            },
            Tulokone: {
              path: "user['inventory']['items']['income_machine']",
              amount: [1],
              name: emojies["tulokone"],
              rate: 5,
              real_name: "Tulokone"
            },
            Valvontakamera: {
              path: "user['inventory']['items']['security_cam']",
              amount: [1],
              name: emojies["valvontakamera"],
              rate: 2,
              real_name: "Valvontakamera"
            },
            Onki: {
              path: "user['inventory']['key_items']['rod']",
              amount: true,
              key: true,
              name: emojies["onki"],
              rate: 5,
              real_name: "Onki"
            },
            Supersytti: {
              path: "user['inventory']['items']['super_bait']",
              amount: [12],
              name: emojies["supersytti"],
              rate: 5,
              real_name: "Supersytti"
            },
            Hopeatulo: {
              path: "user['inventory']['items']['silver_income']",
              amount: [1],
              name: emojies["perustulo2"],
              rate: 1,
              real_name: "Hopeatulo"
            },
            Hypersytti: {
              path: "user['inventory']['items']['hyper_bait']",
              amount: [1],
              name: emojies["hypersytti"],
              rate: 5,
              real_name: "Hypersytti"
            }
          },
          epic: {
            Coins: {
              path: "user['inventory']['money']",
              amount: [40000],
              name: emojies["coin"],
              rate: 3,
              real_name: "Coins"
            },
            "Tulokone-X": {
              path: "user['inventory']['items']['income_machine_X']",
              amount: [1],
              name: emojies["tulokonex"],
              rate: 5,
              real_name: "Tulokone-X"
            },
            Tuloimu: {
              path: "user['inventory']['items']['income_absorber']",
              amount: [1],
              name: emojies["tuloimu"],
              rate: 7,
              real_name: "Tuloimu"
            },
            Kultatulo: {
              path: "user['inventory']['items']['gold_income']",
              amount: [1],
              name: emojies["perustulo3"],
              rate: 2,
              real_name: "Kultatulo"
            },
            Hypersytti: {
              path: "user['inventory']['items']['hyper_bait']",
              amount: [16, 18, 20],
              name: emojies["hypersytti"],
              rate: 7,
              real_name: "Hypersytti"
            },
            Maski: {
              path: "user['inventory']['items']['mask']",
              amount: [5],
              name: emojies["maski"],
              rate: 5,
              real_name: "Maski"
            },
            Stunner: {
              path: "user['inventory']['items']['stunner']",
              amount: [1],
              name: emojies["stunner"],
              rate: 0, // 5
              real_name: "Stunner"
            },
            Grabber: {
              path: "user['inventory']['items']['grabber']",
              amount: [1],
              name: emojies["grabber"],
              rate: 0, // 5
              real_name: "grabber"
            }
          },
          legendary: {
            Gem: {
              path: "user['inventory']['items']['gem']",
              amount: [1],
              name: emojies["gem"],
              rate: 4,
              real_name: "Gem"
            },
            Prankster: {
              path: "user['inventory']['items']['prankster']",
              amount: [1],
              name: emojies["prankster"],
              rate: 0, // 1.2
              real_name: "Prankster"
            },
            Tallelokero: {
              path: "user['inventory']['key_items']['safe']['own']",
              amount: true,
              key: true,
              name: emojies["tallelokero"],
              rate: 2,
              real_name: "Tallelokero"
            },
            Tulokiihdytin: {
              path: "user['inventory']['items']['income_accelerator']",
              amount: [1],
              name: emojies["tulokiihdytin"],
              rate: 3.8,
              real_name: "Tulokiihdytin"
            },
            Glitch: {
              path: "user['inventory']['items']['glitch']",
              amount: [1],
              name: emojies["glitch"],
              rate: 1.2,
              real_name: "Glitch"
            },
            Grabber: {
              path: "user['inventory']['items']['grabber']",
              amount: [10],
              name: emojies["grabber"],
              rate: 0, // 5
              real_name: "grabber"
            },
            Hypersytti: {
              path: "user['inventory']['items']['hyper_bait']",
              amount: [100],
              name: emojies["hypersytti"],
              rate: 5, // 5
              real_name: "Hypersytti"
            }
          }
        };

        if (type == "" || type === undefined) {
          if (user["inventory"]["lootboxes"]["common"] > 0) {
            type = "common";
          } else if (user["inventory"]["lootboxes"]["uncommon"] > 0) {
            type = "uncommon";
          } else if (user["inventory"]["lootboxes"]["rare"] > 0) {
            type = "rare";
          } else if (user["inventory"]["lootboxes"]["epic"] > 0) {
            type = "epic";
          } else if (user["inventory"]["lootboxes"]["legendary"] > 0) {
            type = "legendary";
          } else {
            return msg.channel.send(`Sinulla ei ole LootBoxeja...`);
          }
        }

        switch (type) {
          case "c":
            type = "common";
            break;
          case "u":
            type = "uncommon";
            break;
          case "r":
            type = "rare";
            break;
          case "e":
            type = "epic";
            break;
          case "l":
            type = "legendary";
            break;
          case "k":
            type = "kaikki";
            break;
        }

        if (type == "kaikki") {
          var opened = false;
          if (user["inventory"]["lootboxes"]["common"] > 0) {
            open_all_lootboxes("common", user, drop_table);
            opened = true;
          }
          if (user["inventory"]["lootboxes"]["uncommon"] > 0) {
            open_all_lootboxes("uncommon", user, drop_table);
            opened = true;
          }
          if (user["inventory"]["lootboxes"]["rare"] > 0) {
            open_all_lootboxes("rare", user, drop_table);
            opened = true;
          }
          if (user["inventory"]["lootboxes"]["epic"] > 0) {
            open_all_lootboxes("epic", user, drop_table);
            opened = true;
          }
          if (user["inventory"]["lootboxes"]["legendary"] > 0) {
            open_all_lootboxes("legendary", user, drop_table);
            opened = true;
          }
          if (!opened) {
            return msg.channel.send(`Sulla ei ole LootBoxeja...`);
          }
          return;
        }

        var boxtypes = ["uncommon", "common", "rare", "epic", "legendary"];
        if (!boxtypes.includes(type))
          return msg.channel.send(`Ei ole olemassa tuollaista LootBoxia.`);

        if (user["inventory"]["lootboxes"][type] > 0) {
          if (open_all) {
            return open_all_lootboxes(type, user, drop_table);
          }
          user["inventory"]["lootboxes"][type] -= 1;
          user["basic_statistics"]["opened_lootboxes"][type] += 1;
          open_lootbox(type, user, drop_table);
          save_user(user);
        } else {
          var type_text = type.charAt(0).toUpperCase() + type.slice(1);
          msg.channel.send(`Sulla ei ole ${type_text} LootBoxia...`);
        }


        function open_lootbox(rarity, user, drop_table) {

          if (rarity == "common") {
            color = 10197915;
            drop_table = drop_table["common"];
          }
          if (rarity == "uncommon") {
            color = 1276418;
            drop_table = drop_table["uncommon"];
          }
          if (rarity == "rare") {
            color = 1146367;
            drop_table = drop_table["rare"];
          }
          if (rarity == "epic") {
            color = 12390624;
            drop_table = drop_table["epic"];
          }
          if (rarity == "legendary") {
            color = 16098851;
            drop_table = drop_table["legendary"];
          }

          var bucket = [];
          for (let item in drop_table) {
            for (let x = 0; x < drop_table[item]["rate"]; x++) {
              bucket.push(item);
            }
          }

          var rnd = Math.floor(Math.random() * Math.floor(bucket.length));
          var item_got = bucket[rnd];

          if ("key" in drop_table[item_got]) {
            if (eval(drop_table[item_got]["path"]) == true) {
              return open_lootbox(rarity, user);
            } else {
              eval(drop_table[item_got]["path"] + " = true;");
              var emoji = emojies["chest_" + rarity];
              var user_name = user["name"];
              var item_emoji = drop_table[item_got]["name"];
              save_user(user);
              return msg.channel.send({
                embed: {
                  title: "***" + user_name + ", Avasit: " + emoji + "***",
                  color: color,
                  fields: [
                    {
                      name: "***___Loot:___***",
                      value:
                        "- Avaintavara: " +
                        item_emoji +
                        " " +
                        item_got +
                        " (Saatavilla vain kerran!)"
                    }
                  ]
                }
              });
            }
          } else {
            var _x = Math.floor(
              Math.random() * Math.floor(drop_table[item_got]["amount"].length)
            );
            eval(
              drop_table[item_got]["path"] +
                "+= drop_table[item_got]['amount'][_x];"
            );
            var emoji = emojies["chest_" + rarity];
            var user_name = user["name"];
            var item_emoji = drop_table[item_got]["name"];
            var item_amount = drop_table[item_got]["amount"][_x];
            if (item_got == "Coins") {
              user["basic_statistics"]["money_from_opening_lootboxes"] +=
                drop_table[item_got]["amount"][_x];
            }
            var rest = "";
            if (item_amount > 1) {
              rest = " x " + item_amount;
            }
            save_user(user);
            return msg.channel.send({
              embed: {
                title: "***" + user_name + ", Avasit: " + emoji + "***",
                color: color,
                fields: [
                  {
                    name: "***___Loot:___***",
                    value: "- " + item_emoji + " " + item_got + rest
                  }
                ]
              }
            });
          }
        }

        function clone(hash) {
          var json = JSON.stringify(hash);
          var object = JSON.parse(json);

          return object;
        }

        function open_all_lootboxes(rarity, user, drop_table) {

          if (rarity == "common") {
            color = 10197915;
            drop_table = drop_table["common"];
          }
          if (rarity == "uncommon") {
            color = 1276418;
            drop_table = drop_table["uncommon"];
          }
          if (rarity == "rare") {
            color = 1146367;
            drop_table = drop_table["rare"];
          }
          if (rarity == "epic") {
            color = 12390624;
            drop_table = drop_table["epic"];
          }
          if (rarity == "legendary") {
            color = 16098851;
            drop_table = drop_table["legendary"];
          }

          var amount_lootboxes = user["inventory"]["lootboxes"][rarity];

          var bucket = [];
          for (let item in drop_table) {
            for (let x = 0; x < drop_table[item]["rate"]; x++) {

              bucket.push(item);
            }
          }

          var items_got = {};
          for (let i = 0; i < amount_lootboxes; i++) {
            let rnd = Math.floor(Math.random() * Math.floor(bucket.length));


            if (eval(drop_table[bucket[rnd]]["path"] + " == true")) {
              i -= 1;
              continue;
            }

            if ( bucket[rnd] in items_got) {

              if ("key" in drop_table[bucket[rnd]]) {
                i -= 1;
                continue;
              }

              else {

                for (var k in items_got) {


                  if (items_got[k]["path"] == drop_table[bucket[rnd]]["path"]) {

                    var am;
                    let _x;
                    if (Array.isArray(drop_table[bucket[rnd]]["amount"])) {
                      _x = Math.floor(Math.random() * Math.floor(drop_table[bucket[rnd]]["amount"].length));
                      am = drop_table[bucket[rnd]]["amount"][_x];
                    } else {
                      am = drop_table[bucket[rnd]]["amount"];
                    }

                    items_got[k]["amount"] = items_got[k]["amount"] + parseInt(am);

                    break;
                  }
                }


              }

            } else {

              var c_item = clone(drop_table);

              if (!("key" in drop_table[bucket[rnd]])) {
                var _x = Math.floor(Math.random() * Math.floor(drop_table[bucket[rnd]]["amount"].length));
                c_item[bucket[rnd]]["amount"] = c_item[bucket[rnd]]["amount"][_x];
              }

              items_got[bucket[rnd]] = c_item[bucket[rnd]];
            }


          }


          user["inventory"]["lootboxes"][rarity] -= amount_lootboxes;
          user["basic_statistics"]["opened_lootboxes"][rarity] += amount_lootboxes;


          var item_list = "";
          for (var h in items_got) {
            var item_got = items_got[h];
            if ("key" in item_got) {

                eval(item_got["path"] + " = true;");

                var emoji = emojies["chest_" + rarity];
                var user_name = user["name"];
                var item_emoji = emojies[item_got["name"]["name"]];
                save_user(user);

                item_list += ("- Avaintavara: " +
                item_emoji +
                " " +
                item_got["real_name"] +
                " (Saatavilla vain kerran!)\n");

            } else {

              eval(
                item_got["path"] +
                  "+= item_got['amount'];"
              );

              var emoji = emojies["chest_" + rarity];
              var user_name = user["name"];
              var item_emoji = emojies[item_got["name"]["name"]];
              var item_amount = item_got["amount"];
              if (item_got["path"] == "user['inventory']['money']") {
                user["basic_statistics"]["money_from_opening_lootboxes"] +=
                  item_got["amount"];
              }
              var rest = "";
              if (item_amount > 1) {
                rest = " x " + item_amount;
              }



              save_user(user);
              item_list += ("- " + item_emoji + " " + item_got["real_name"] + rest + "\n");
            }
          }


          return msg.channel.send(
            {
              embed: {
                title: "***" + user_name + ", Avasit: " + amount_lootboxes + " x "+ emoji + "***",
                color: color,
                fields: [
                  {
                    name: "***___Loot:___***",
                    value: item_list
                  }
                ]
              }
            }
          );
        }
      });
    });
  },

  käytä: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        let item = msg.content.split(" ")[1];
        let name = msg.content.split(" ")[2];
        let second = msg.content.split(" ")[2];

        if (item != undefined) {
          item = item.toLowerCase();
        }

        if (second != undefined) {
          second = second.toLowerCase();
        }

        const exclude = ["tallelokero", "aikakone"];
        if (!exclude.includes(item)) {
          if (name == "" || name == undefined) {
            name = user["id"];
          }

          if (item == "" || item == undefined) {
            return msg.channel.send(
              `Valitse aktivoitava tavara ja mahdollinen kohde!`
            );
          }

          name = name.replace(/\D/g, "");

          var flag = false;
          for (var u in client.users.array()) {
            var _user = client.users.array()[u];
            if (_user.id == name) {
              flag = true;
            }
          }

          if (!flag) return;

          var target_id = name;
          var sender_id = user["id"];
        } else {
          target_id = msg.author.id;
        }

        check_user_in_database(target_id).then(() => {
          get_user(target_id).then(target_user => {
            if (item == "tulokone") {
              if (user["inventory"]["items"]["income_machine"] < 1)
                return msg.channel.send(`Sulla ei ole Tulokonetta`);
              if ("income_machine" in user)
                return msg.channel.send(`Sulla on jo Tulokone päällä!`);
                user["income_machine"] = {
                  multi: 10,
                  timer: 60,
                  sum: 0
                };

                user["inventory"]["items"]["income_machine"] -= 1;
                msg.channel.send(`Hurraa! Tulokone hurraa!`);
                save_user(user);
                return;
            }
            else if (item == "tulokone-x") {
              if (!("income_machine_X" in user["inventory"]["items"]))
                return msg.channel.send(`Sulla ei ole Tulokone-X:ää`);
              if ("income_machine" in user)
                return msg.channel.send("Sulla on jo Tulokone päällä!");
              user["income_machine"] = {
                multi: 20,
                timer: 60,
                sum: 0
              };

              user["inventory"]["items"]["income_machine_X"] -= 1;

              save_user(user);
              return msg.channel.send(`Hurraa! Tulokone-X hurraa!`);
            }
            else if (item == "tulokiihdytin") {
              if (!("income_accelerator" in user["inventory"]["items"]))
                return msg.channel.send(`Sulla ei ole Tulokiihdytintä`);
              if ("income_machine" in user)
                return msg.channel.send(`Sulla on jo Tulokone päällä!`);
              user["income_machine"] = {
                multi: 40,
                timer: 60,
                sum: 0
              };

              user["inventory"]["items"]["income_accelerator"] -= 1;

              save_user(user);
              return msg.channel.send(`Hurraa! Tulokiihdytin hurraa!`);
            }
            else if (item == "gem") {
              if (user["inventory"]["items"]["gem"] < 1)
                return msg.channel.send(`Sulla ei ole gemiä...`);

              user["inventory"]["money"] = user["inventory"]["money"] * 2;
              user["inventory"]["items"]["gem"] -= 1;
              save_user(user);
              return msg.channel.send(
                `Hehkuva kivi imeytyy aikaavaruuteen, tunnet taskujesi täyttyvän!`
              );
            }
            else if (item == "aikakone") {
              if (user["inventory"]["items"]["timemachine"] < 1)
                return msg.channel.send(`Sulla ei ole aikakonetta...`);

              if (second == "" || second == undefined)
                return msg.channel.send(`Laita jokin aika! (Aamu, Päivä, Ilta tai Yö)`);

              var _time = "";
              var _part_day = "";

              if (second == "yö") {
                _time = "Yö";
                _part_day = "N";
              }

              else if (second == "päivä") {
                _time = "Päivä";
                _part_day = "A";
              }

              else if (second == "ilta") {
                _time = "Ilta";
                _part_day = "E";
              }

              else if (second == "aamu") {
                _time = "Aamu";
                _part_day = "M";
              }
              else {
                return msg.channel.send(`Valitse sopiva aika!`);
              }

              user["inventory"]["items"]["timemachine"] -= 1;
              user["timemachine_timer"] = {
                "time" : _time,
                "part_day" : _part_day,
                "timer" : 60
              }

              save_user(user);
              return msg.channel.send(
                `Aikakoneen mukaan sulla on tunti aikaa tällä aikaulottuvuudella. Näyttäisi, että on: ***${_time}***`
              );
            }
            else if (item == "kultatulo") {
              if (user["inventory"]["items"]["gold_income"] < 1)
                return msg.channel.send(`Sulla ei ole perustuloa...`);
              user["inventory"]["income"] += 5;
              msg.channel.send(
                `Uiui, käytit ${emojies["perustulo3"]} ja sait perustuloa +5!`
              );

              user["inventory"]["items"]["gold_income"] -= 1;
              save_user(user);
              return;
            }
            else if (item == "hopeatulo") {
              if (user["inventory"]["items"]["silver_income"] < 1)
                return msg.channel.send(`Sulla ei ole perustuloa...`);

              user["inventory"]["income"] += 3;
              msg.channel.send(
                `Uiui, käytit ${emojies["perustulo2"]} ja sait perustuloa +3!`
              );

              user["inventory"]["items"]["silver_income"] -= 1;
              save_user(user);
              return;
            }
            else if (item == "pronssitulo") {
              if (user["inventory"]["items"]["bronze_income"] < 1)
                return msg.channel.send(`Sulla ei ole perustuloa...`);

              user["inventory"]["income"] += 1;
              msg.channel.send(
                `Uiui, käytit ${emojies["perustulo1"]} ja sait perustuloa +1!`
              );

              user["inventory"]["items"]["bronze_income"] -= 1;
              save_user(user);
              return;
            }
            else if (item == "glitch") {
              if (user["inventory"]["items"]["glitch"] < 1)
                return msg.channel.send(`Sulla ei ole gemiä...`);
              var start_money = user["inventory"]["money"];
              var end_money = user["inventory"]["money"];
              while (start_money == end_money) {
                var money_str = start_money.toString();
                money_str = money_str
                  .split("")
                  .sort(function() {
                    return 0.5 - Math.random();
                  })
                  .join("");

                end_money = parseInt(money_str);
              }

              user["inventory"]["items"]["glitch"] -= 1;
              user["inventory"]["money"] = end_money;
              save_user(user);
              return msg.channel.send(
                `There was a glitch ${
                  emojies["glitch"]
                } in the system. Seems like you had ${start_money} ${
                  emojies["coin"]
                } before.\nNow you have ${end_money} ${emojies["coin"]}.`
              );
            }
            else if (item == "valvontakamera") {
              if (user["inventory"]["items"]["security_cam"] < 1)
                return msg.channel.send(`Sulla ei ole Valvontakameraa!`);
              if ("security_cam" in user)
                return msg.channel.send(`Sulla on jo valvonta päällä!`);
              user["security_cam"] = {
                timer: 120*3,
                protected: 0
              };

              user["inventory"]["items"]["security_cam"] -= 1;
              msg.channel.send(`Valvonta päällä!`);
              save_user(user);
              return;
            }
            else if (item == "tallelokero") {
              if (user["inventory"]["key_items"]["safe"]["own"] == false)
                return msg.channel.send(`Sulla ei ole tallelokeroa!`);
              if (second == "" || second == undefined)
                return msg.channel.send(`Laita summa!`);

              second = second.replace(",", "");

              if (second.slice(-1) == "k") {
                var price = Math.floor(1000*parseFloat(second));
              }
              else if (second.slice(-1) == "m") {
                var price = Math.floor(1000000*parseFloat(second));
              } else {
                var price = Math.floor(second);
              }

              if (isNaN(price)) return msg.channel.send(`Laita summa!`);

              if (second.startsWith("-")) {
                price = price*-1;
                if (user["inventory"]["key_items"]["safe"]["money"] < price) {
                  price = user["inventory"]["key_items"]["safe"]["money"];
                  user["inventory"]["key_items"]["safe"]["money"] = 0;
                  user["inventory"]["money"] += price;
                } else {
                  user["inventory"]["key_items"]["safe"]["money"] -= price;
                  user["inventory"]["money"] += price;
                }
              } else {
                if (price > user["inventory"]["money"]) {
                  price = user["inventory"]["money"];
                }
                if (
                  user["inventory"]["key_items"]["safe"]["capasity"] -
                    user["inventory"]["key_items"]["safe"]["money"] >=
                  price
                ) {
                  user["inventory"]["key_items"]["safe"]["money"] += price;
                  user["inventory"]["money"] -= price;
                } else {
                  price =
                    user["inventory"]["key_items"]["safe"]["capasity"] -
                    user["inventory"]["key_items"]["safe"]["money"];
                  user["inventory"]["key_items"]["safe"]["money"] += price;
                  user["inventory"]["money"] += price;
                }
              }

              msg.channel.send(`Rahoja siirretty ${price}${emojies["coin"]}`);
              save_user(user);
              return;
            }
            else if (item == "puska") {
              if (user["inventory"]["key_items"]["bush"]["own"] == false)
                return msg.channel.send(`Sulla ei ole puskaa!`);


              if (user["inventory"]["key_items"]["bush"]["on"]) {
                user["inventory"]["key_items"]["bush"]["on"] = false;
                msg.channel.send(`Puska pois päältä!`);
              } else {
                user["inventory"]["key_items"]["bush"]["on"] = true;
                msg.channel.send(`Puska päällä!`);
              }
              save_user(user);
              return;
            }

            if (user["ironman"]) return msg.channel.send(`Olet Ironman...`);
            if (target_user["ironman"])
              return msg.channel.send(`Kohde on Ironman...`);

            if (item == "keppi") {
              if (user["inventory"]["items"]["stick"] < 1)
                return msg.channel.send(`Sulla ei ole keppejä`);
              if (name == sender_id)
                return msg.channel.send(`Älä lyö ittees vitun idiotti!`);

              if ("security_cam" in target_user) {
                target_user["security_cam"]["protected"] += 1;
                save_user(target_user);
                return msg.channel.send(
                  `Hän huomasi sinut ennalta, et päässyt käsiksi häneen...`
                );
              }
              if (target_user["inventory"]["key_items"]["bush"]["on"]) return msg.channel.send(
                `Et löydä häntä mistään!?...`
              );

              if (target_user["inventory"]["items"]["shield"] > 0) {
                msg.channel.send(
                  `Hänellä oli kilpi. <@${name}> selvisi vaurioitta.`
                );
                var rnd = Math.floor(Math.random() * Math.floor(5 + 1));
                if (rnd == 3) {
                  target_user["inventory"]["items"]["shield"] -= 1;
                  msg.channel.send(
                    `Kilpi meni kuitenkin rikki...`
                  );
                }

                user["basic_statistics"]["stick_used"] += 1;
                user["inventory"]["items"]["stick"] -= 1;
                save_user(user);
                save_user(target_user);
                return;
              }

              var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
              var amount = Math.floor(Math.random() * Math.floor(300 + 1));
              if (rnd > 3 && target_user["inventory"]["money"] > amount) {
                msg.channel.send(
                  "Löit jäbää <@" +
                    name +
                    ">! Hän pudotti " +
                    amount +
                    emojies["coin"] +
                    " maahan..."
                );
                target_user["inventory"]["money"] -= amount;
              } else {
                msg.channel.send(
                  "Löit jäbää <@" + name + ">! Et hyötyny mitään."
                );
              }
              user["inventory"]["items"]["stick"] -= 1;
              user["basic_statistics"]["stick_used"] += 1;
              user["basic_statistics"]["sticked_money"] += amount;
              target_user["basic_statistics"]["hit"] += 1;
              target_user["basic_statistics"]["sticked_money_from_you"] += amount;
              save_user(user);
              save_user(target_user);
            }
            if (item == "tukki") {
              if (user["inventory"]["items"]["log"] < 1)
                return msg.channel.send(`Sulla ei ole tukkeja`);
              if (name == sender_id)
                return msg.channel.send(`Älä lyö ittees vitun idiotti!`);

              if ("security_cam" in target_user) {
                target_user["security_cam"]["protected"] += 1;
                save_user(target_user);
                return msg.channel.send(
                  `Hän huomasi sinut ennalta, et päässyt antamaan läppälimua häneen...`
                );
              }


              if (target_user["inventory"]["items"]["shield"] > 0) {
                msg.channel.send(
                  `Hänellä oli kilpi. <@${name}> selvisi vaurioitta.`
                );
                var rnd = Math.floor(Math.random() * Math.floor(5 + 1));
                if (rnd == 3) {
                  target_user["inventory"]["items"]["shield"] -= 1;
                  msg.channel.send(
                    `Kilpi meni kuitenkin rikki...`
                  );
                }

                user["basic_statistics"]["log_used"] += 1;
                user["inventory"]["items"]["log"] -= 1;
                save_user(user);
                save_user(target_user);
                return;
              }

              var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
              var amount = Math.floor(Math.random() * Math.floor(300 + 1)) * 50;
              var your_amount = Math.floor(amount / 10);
              if (rnd > 3 ) {
                if (target_user["inventory"]["money"] < amount) {
                  amount = target_user["inventory"]["money"];
                  your_amount = Math.floor(amount / 10);
                }
                msg.channel.send(
                  "Löit jäbää <@" +
                    name +
                    ">! Hän pudotti " +
                    amount +
                    emojies["coin"] +
                    " maahan eikä saanut yhtään takaisin... Ehdit keräämään " + your_amount + emojies["coin"] + " kolikkoa maasta..."
                );
                target_user["inventory"]["money"] -= amount;
                user["inventory"]["money"] += your_amount;
              } else {
                msg.channel.send(
                  "Löit jäbää <@" + name + ">! Et hyötyny mitään."
                );
              }
              user["inventory"]["items"]["log"] -= 1;
              user["basic_statistics"]["log_used"] += 1;
              user["basic_statistics"]["logged_money"] += amount;
              target_user["basic_statistics"]["hit_with_log"] += 1;
              target_user["basic_statistics"]["logged_money_from_you"] += amount;
              save_user(user);
              save_user(target_user);
            }
            if (item == "maski") {
              if (name == sender_id)
                return msg.channel.send(`Et voi varastaa omaa rahaa, lol!`);
              if (user["inventory"]["items"]["mask"] < 1)
                return msg.channel.send(`Sulla ei ole maskeja`);
              if (target_user["inventory"]["money"] <= 0)
                return msg.channel.send(`Kohteella ei ole oikein rahaa...`);
              var multi = (48978*target_user["inventory"]["money"]**(-0.67)) / 100;
              if (multi > 1) {
                multi = 1;
              } else if (multi < 0.01) {
                multi = 0.01;
              }
              // 10m jälkeen prosentti saavuttaa 0.01 -> siitä eteenpäin saa vitusti
              // ennen 10k voi varastaa kaikki rahat.

              var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
              var sum = Math.floor(Math.random() * Math.floor(multi*target_user["inventory"]["money"] + 1));

              if (target_user["inventory"]["key_items"]["bush"]["on"]) return msg.channel.send(
                `Et löydä häntä mistään!?...`
              );

              if ("security_cam" in target_user) {
                msg.channel.send("Valvontakamera osoittaa sinuun!");
                rnd = 1;
                target_user["security_cam"]["protected"] += 1;

              }

              if (rnd > 2) {
                msg.channel.send(
                  "Varastit jäbältä <@" +
                    name +
                    ">! Sait: " +
                    sum +
                    emojies["coin"]
                );
                user["inventory"]["money"] += sum;
                user["basic_statistics"]["money_stolen"] += sum;
                target_user["inventory"]["money"] -= sum;
                target_user["basic_statistics"]["money_stolen_from_you"] += sum;
              } else {
                msg.channel.send(
                  "Jäit kiinni varastaessasi jäbältä <@" +
                    name +
                    ">! Sait sakkoa " +
                    sum +
                    emojies["coin"] +
                    ". Kohdehenkilö saa korvausta: " +
                    Math.floor(sum / 4) +
                    emojies["coin"]
                );
                user["inventory"]["money"] -= sum;
                user["basic_statistics"]["fines"] += sum;
                target_user["inventory"]["money"] += Math.floor(sum / 4);
                target_user["basic_statistics"]["compensations"] += Math.floor(
                  sum / 4
                );
              }
              user["inventory"]["items"]["mask"] -= 1;
              save_user(target_user);
              save_user(user);
            }
            if (item == "tuloimu") {
              if (target_user["id"] == user["id"]) return msg.channel.send(`Et voi imeä itteltäs, tirsk`);
              if (!("income_absorber" in user["inventory"]["items"]))
                return msg.channel.send(`Sulla ei ole Tuloimua`);
              if ("income_absorb" in user)
                return msg.channel.send(`Sulla on jo imuri päällä!`);
              if ("income_absorb" in target_user) {
                if (target_user["income_absorb"]["target"] == user.id)
                  return msg.channel.send(
                    `Et voi imeä häneltä koska hän imee jo sinulta ;)`
                  );
              }
              /*
              if (!check_if_absorb(target_user)) {
                return msg.channel.send(
                  `Et voi imeä häneltä koska olet pohjalla :(`
                );
              }*/


              async function check_if_absorb(target_user) {
                var users = await get_all_users();
                var already_checked = [];
                var end_chain_user;

                // Finding user on "top of the chain"
                for (let u in users) {
                  if ("income_absorb" in users[u] && !already_checked.includes(u)) {
                    while (true) {
                      var temp_id = users[u].income_absorb.target;

                      if ("income_absorb" in users[temp_id]) {
                        u = users[u]["income_absorb"]["target"];
                      } else {
                        end_chain_user = users[u].income_absorb.target;
                        if (end_chain_user == target_user) {
                          return false;
                        }
                      }
                    }
                  }
                  return true;
                }
              }



              if (target_user["inventory"]["key_items"]["bush"]["on"]) return msg.channel.send(
                `Et löydä häntä mistään!?...`
              );

              if ("security_cam" in target_user) {
                target_user["security_cam"]["protected"] += 1;
                save_user(target_user);
                return msg.channel.send(
                  `Hän näki sinut ennelta...Et päässyt käsiksi häneen!`
                );
              }

              user["income_absorb"] = {
                target: target_id,
                timer: 480,
                sum: 0
              };

              target_user["absorb_target"] = {
                absorber: user["id"],
                timer: 480,
                sum: 0
              };

              user["inventory"]["items"]["income_absorber"] -= 1;
              msg.channel.send(`Imet tuloa!`);
              save_user(target_user);
              save_user(user);
            }
            if (item == "pommi") {
              if (user["inventory"]["items"]["bomb"] < 1)
                return msg.channel.send(`Sulla ei ole pommia`);
              if (name == sender_id)
                return msg.channel.send(`Älä pommita ittees vitun idiotti!`);
              var rnd = Math.floor(Math.random() * Math.floor(10 + 1));
              var amount = Math.floor(
                Math.random() * Math.floor(2000 + 1) + 500
              );

              if (target_user["inventory"]["key_items"]["bush"]["on"]) return msg.channel.send(
                `Et löydä häntä mistään!?...`
              );

              if ("security_cam" in target_user) {
                target_user["security_cam"]["protected"] += 1;
                save_user(target_user);
                return msg.channel.send(
                  `Hän näki sinut ennelta...Et päässyt käsiksi häneen!`
                );
              }

              if (target_user["inventory"]["items"]["shield"] > 0) {
                msg.channel.send(
                  `Hänellä oli kilpi. <@${name}> selvisi vaurioitta.`
                );
                var rnd = Math.floor(Math.random() * Math.floor(5 + 1));
                if (rnd == 3) {
                  target_user["inventory"]["items"]["shield"] -= 1;
                  msg.channel.send(
                    `Kilpi meni kuitenkin rikki...`
                  );
                }
                user["basic_statistics"]["bomb_used"] += 1;
                user["inventory"]["items"]["bomb"] -= 1;
                save_user(user);
                save_user(target_user);
                return;
              }
              msg.channel.send(
                "Pommitit jäbää <@" +
                  name +
                  ">! Korjauksiin ja lääkäriin meni: " +
                  amount +
                  emojies["coin"]
              );
              target_user["inventory"]["money"] -= amount;

              user["inventory"]["items"]["bomb"] -= 1;
              user["basic_statistics"]["bomb_used"] += 1;
              user["basic_statistics"]["bombed_money"] += amount;
              target_user["basic_statistics"]["bombed"] += 1;
              target_user["basic_statistics"]["bombed_money_from_you"] += amount;
              save_user(user);
              save_user(target_user);
            }
            if (item == "prankster") {

              if (name == sender_id)
                return msg.channel.send(`Et voi pränkätä omaa rahaa, lol!`);
              if (user["inventory"]["items"]["prankster"] < 1)
                return msg.channel.send(`Sulla ei ole pranksteriä`);
              if (user["inventory"]["money"] <= 0)
                return msg.channel.send(`Et voi pränkätä ilman rahaa...`);


                if ("security_cam" in target_user) {
                  target_user["security_cam"]["protected"] += 1;
                  msg.channel.send("Valvontakamera osoittaa sinuun!");
                  save_user(target_user);
                  save_user(user);
                  return;

                }


              var target_money = target_user["inventory"]["money"];
              var user_money = user["inventory"]["money"];

              user["inventory"]["money"] = target_money;
              target_user["inventory"]["money"] = user_money;



              msg.channel.send(
                  "Pränkkäsit jäbältä <@" +
                    name +
                    "> rahat. Sait hänen: " +
                    target_money +
                    emojies["coin"] + " ja hän säi sinun " + user_money + emojies["coin"]
                );

              user["basic_statistics"]["pranked"] += 1;
              target_user["basic_statistics"]["got_pranked"] += 1;
              user["basic_statistics"]["pranked_money"] += target_money;
              target_user["basic_statistics"]["pranked_from_you"] += user_money;
              user["inventory"]["items"]["prankster"] -= 1;
              save_user(target_user);
              save_user(user);

            }
            if (item == "stunner") {
              if (name == sender_id)
                return msg.channel.send(`Et voi stunnaa itseäsi, lol!`);
              if (user["inventory"]["items"]["stunner"] < 1)
                return msg.channel.send(`Sulla ei ole stunnereitä`);
              if ("stun_timer" in target_user)
                return msg.channel.send(`Kohde on jo kanttuvei...`);

              if ("security_cam" in target_user) {
                target_user["security_cam"]["protected"] += 1;
                msg.channel.send("Valvontakamera osoittaa sinuun!");
                save_user(target_user);
                save_user(user);
                return;

              }

              target_user["stun_timer"] = {
                timer: 45
              }

              var stun = firebase.database().ref("global_data/stunned");
              stun.on("value", function(d) {
                stunned = d.val();
              });

              stunned.push(target_user["id"]);

              firebase
                .database()
                .ref("global_data/stunned")
                .set(stunned);

              user["inventory"]["items"]["stunner"] -= 1;
              user["basic_statistics"]["you_stunned"] += 1;
              target_user["basic_statistics"]["stunned"] += 1;

              save_user(target_user);
              save_user(user);
              return msg.channel.send("Löit iha vitun kovaa, hän on stunneissa!");


            }
            if (item == "grabber") {
              if (name == sender_id)
                return msg.channel.send(`Et voi varastaa omaa tavaraa, lol!`);
              if (user["inventory"]["items"]["grabber"] < 1)
                return msg.channel.send(`Sulla ei ole grabbereitä`);

                if ("security_cam" in target_user) {
                  target_user["security_cam"]["protected"] += 1;
                  msg.channel.send("Valvontakamera osoittaa sinuun!");
                  save_user(target_user);
                  save_user(user);
                  return;

                }


              var inv = target_user["inventory"]["items"];
              var amount = 0;
              var item_list = [];
              for (item in inv) {
                if (inv[item] > 0) {
                  amount += 1;
                  item_list.push(item);
                }
              }
              if (amount == 0) {
                return msg.channel.send(`Kohteella ei ole tavaraa!`);
              }

              var rnd = Math.floor(Math.random() * Math.floor(amount));
              var chosen_item = item_list[rnd];
              console.log(chosen_item);

              var items;

              if (chosen_item == "ES") {
                items = `${emojies["ES"]} ES\n`;
              }
              if (chosen_item == "stick") {
                items = `${emojies["keppi"]} Keppi\n`;
              }
              if (chosen_item == "bait") {
                items = `${emojies["sytti"]} Sytti\n`;
              }
              if (chosen_item == "super_bait") {
                items = `${emojies["supersytti"]} Supersytti\n`;
              }
              if (chosen_item == "hyper_bait") {
                items = `${emojies["hypersytti"]} Hypersytti\n`;
              }
              if (chosen_item == "timemachine") {
                items = `${emojies["aikakone"]} Aikakone\n`;
              }
              if (chosen_item == "shield") {
                items = `${emojies["kilpi"]} Kilpi\n`;
              }
              if (chosen_item == "bomb") {
                items = `${emojies["pommi"]} Pommi\n`;
              }
              if (chosen_item == "security_cam") {
                items = `${emojies["valvontakamera"]} Valvontakamera\n`;
              }
              if (chosen_item == "income_machine") {
                items = `${emojies["tulokone"]} Tulokone`;
              }
              if (chosen_item == "income_machine_X") {
                items = `${emojies["tulokonex"]} Tulokone-X\n`;
              }
              if (chosen_item == "income_accelerator") {
                items = `${emojies["tulokiihdytin"]} Tulokiihdytin`;
              }
              if (chosen_item == "income_absorber") {
                items = `${emojies["tuloimu"]} Tuloimu\n`;
              }
              if (chosen_item == "mask") {
                items = `${emojies["maski"]} Maski`;
              }
              if (chosen_item == "stunner") {
                items = `${emojies["stunner"]} Stunner\n`;
              }
              if (chosen_item == "grabber") {
                items = `${emojies["grabber"]} Grabber\n`;
              }
              if (chosen_item == "gem") {
                items = `${emojies["gem"]} Gem\n`;
              }
              if (chosen_item == "prankster") {
                items = `${emojies["prankster"]} Prankster\n`;
              }
              if (chosen_item == "glitch") {
                items = `${emojies["glitch"]} Glitch\n`;
              }
              if (chosen_item == "bronze_income") {
                items = `${emojies["perustulo1"]} Pronssitulo\n`;
              }
              if (chosen_item == "silver_income") {
                items = `${emojies["perustulo2"]} Hopeatulo\n`;
              }
              if (chosen_item == "gold_income") {
                items = `${emojies["perustulo3"]} Kultatulo\n`;
              }

              msg.channel.send(
                  "Varastit tavaran jäbältä <@" +
                    name +
                    ">! Sait: " +
                    items
                );

              user["inventory"]["items"]["grabber"] -= 1;
              user["inventory"]["items"][chosen_item] += 1;
              target_user["inventory"]["items"][chosen_item] -= 1;
              save_user(target_user);
              save_user(user);


            }

          });
        });
      });
    });
  },

  inv: msg => {
    let name = msg.content.split(" ")[1];
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        if (name == "" || name === undefined)
          return print_inventory(user["id"]);

        name = name.replace(/\D/g, "");

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

        check_user_in_database(name).then(() => {
          get_user(name).then(_user => {
            user = _user;
            print_inventory(user["id"]);
          });
        });

        function print_inventory(_id) {
          var avatar;

          client.fetchUser(_id).then(myUser => {
            avatar = myUser.avatarURL;
            cont(avatar);
          });

          function cont(avatar) {
            var key_items = "";
            var ke = user["inventory"]["key_items"];

            if (ke["rod"]) {
              key_items += `${emojies["onki"]}`;
            }
            if (ke["super_rod"]) {
              key_items += `${emojies["superonki"]}`;
            }
            if (ke["hyper_rod"]) {
              key_items += `${emojies["hyperonki"]}`;
            }
            if (ke["golden_harpoon"]) {
              key_items += `${emojies["harpuuna"]}`;
            }
            if (ke["whale_breeding_program"]) {
              key_items += `\:whale:`;
            }
            if (ke["fishing_boat"]) {
              key_items += `${emojies["kalastusvene"]}`;
            }
            if (ke["bush"]["own"]) {
              key_items += `${emojies["puska"]}`;
            }
            var safe_t = "";
            if (ke["safe"]["own"]) {
              key_items += `${emojies["tallelokero"]}[${user["inventory"]["key_items"]["safe"]["capasity"]/1000000}m]`;
              safe_t = `\n${emojies["tallelokero"]} ${user["inventory"]["key_items"]["safe"]["money"]}${emojies["coin"]}`
            }

            if (key_items == "") {
              key_items = "Ei mitään";
            }

            var lootboxes = "";
            lootboxes += `${emojies["chest_common"]} Common: ${
              user["inventory"]["lootboxes"]["common"]
            } (${user["inventory"]["lootboxes"]["common"] +
              user["basic_statistics"]["opened_lootboxes"]["common"]})\n`;
            lootboxes += `${emojies["chest_uncommon"]} Uncommon: ${
              user["inventory"]["lootboxes"]["uncommon"]
            } (${user["inventory"]["lootboxes"]["uncommon"] +
              user["basic_statistics"]["opened_lootboxes"]["uncommon"]})\n`;
            lootboxes += `${emojies["chest_rare"]} Rare: ${
              user["inventory"]["lootboxes"]["rare"]
            } (${user["inventory"]["lootboxes"]["rare"] +
              user["basic_statistics"]["opened_lootboxes"]["rare"]})\n`;
            lootboxes += `${emojies["chest_epic"]} Epic: ${
              user["inventory"]["lootboxes"]["epic"]
            } (${user["inventory"]["lootboxes"]["epic"] +
              user["basic_statistics"]["opened_lootboxes"]["epic"]})\n`;
            lootboxes += `${emojies["chest_legendary"]} Legendary: ${
              user["inventory"]["lootboxes"]["legendary"]
            } (${user["inventory"]["lootboxes"]["legendary"] +
              user["basic_statistics"]["opened_lootboxes"]["legendary"]})\n`;

            var items = "";
            var ite = user["inventory"]["items"];
            if (ite["ES"] > 0) {
              items += `${emojies["ES"]} ES: ${ite["ES"]} (Juotu: ${
                ite["ES_can"]
              })\n`;
            }
            if (ite["stick"] > 0) {
              items += `${emojies["keppi"]} Keppi: ${ite["stick"]}\n`;
            }
            if (ite["log"] > 0) {
              items += `${emojies["tukki"]} Tukki: ${ite["log"]}\n`;
            }
            if (ite["bait"] > 0) {
              items += `${emojies["sytti"]} Sytti: ${ite["bait"]}\n`;
            }
            if (ite["super_bait"] > 0) {
              items += `${emojies["supersytti"]} Supersytti: ${
                ite["super_bait"]
              }\n`;
            }
            if (ite["hyper_bait"] > 0) {
              items += `${emojies["hypersytti"]} Hypersytti: ${
                ite["hyper_bait"]
              }\n`;
            }
            if (ite["timemachine"] > 0) {
              items += `${emojies["aikakone"]} Aikakone: ${ite["timemachine"]}\n`;
            }
            if (ite["shield"] > 0) {
              items += `${emojies["kilpi"]} Kilpi: ${ite["shield"]}\n`;
            }
            if (ite["bomb"] > 0) {
              items += `${emojies["pommi"]} Pommi: ${ite["bomb"]}\n`;
            }
            if (ite["security_cam"] > 0) {
              items += `${emojies["valvontakamera"]} Valvontakamera: ${
                ite["security_cam"]
              }\n`;
            }
            if (ite["income_machine"] > 0) {
              items += `${emojies["tulokone"]} Tulokone: ${
                ite["income_machine"]
              }\n`;
            }
            if (ite["income_machine_X"] > 0) {
              items += `${emojies["tulokonex"]} Tulokone-X: ${
                ite["income_machine_X"]
              }\n`;
            }
            if (ite["income_accelerator"] > 0) {
              items += `${emojies["tulokiihdytin"]} Tulokiihdytin: ${
                ite["income_accelerator"]
              }\n`;
            }
            if (ite["income_absorber"] > 0) {
              items += `${emojies["tuloimu"]} Tuloimu: ${
                ite["income_absorber"]
              }\n`;
            }
            if (ite["mask"] > 0) {
              items += `${emojies["maski"]} Maski: ${ite["mask"]}\n`;
            }
            if (ite["stunner"] > 0) {
              items += `${emojies["stunner"]} Stunner: ${ite["stunner"]}\n`;
            }
            if (ite["grabber"] > 0) {
              items += `${emojies["grabber"]} Grabber: ${ite["grabber"]}\n`;
            }
            if (ite["gem"] > 0) {
              items += `${emojies["gem"]} Gem: ${ite["gem"]}\n`;
            }
            if (ite["prankster"] > 0) {
              items += `${emojies["prankster"]} Prankster: ${ite["prankster"]}\n`;
            }
            if (ite["glitch"] > 0) {
              items += `${emojies["glitch"]} Glitch: ${ite["glitch"]}\n`;
            }
            if (ite["bronze_income"] > 0) {
              items += `${emojies["perustulo1"]} Pronssitulo: ${
                ite["bronze_income"]
              }\n`;
            }
            if (ite["silver_income"] > 0) {
              items += `${emojies["perustulo2"]} Hopeatulo: ${
                ite["silver_income"]
              }\n`;
            }
            if (ite["gold_income"] > 0) {
              items += `${emojies["perustulo3"]} Kultatulo: ${
                ite["gold_income"]
              }\n`;
            }

            if (items == "") {
              items = "Ei mitään";
            }

            var status = "\n";

            if ("income_machine" in user) { // multi timer sum
              var multi = user["income_machine"]["multi"];
              var emoji;
              var name;
              if (multi == 10) {
                emoji = emojies["tulokone"];
                name = "Tulokone";
              }
              else if (multi == 20) {
                emoji = emojies["tulokonex"];
                name = "Tulokone-X";
              }
              else if (multi == 40) {
                emoji = emojies["tulokiihdytin"];
                name = "Tulokiihdytin";
              }
              status += emoji + " " + name + ": Rahaa saatu " + user["income_machine"]["sum"] + emojies["coin"] + " (" + user["income_machine"]["timer"] + " mins jäljellä)\n";



            }

            if ("income_absorb" in user) {
              status += emojies["tuloimu"] + " Imet tuloa jäbältä <@" + user["income_absorb"]["target"] + ">: Rahaa saatu " + user["income_absorb"]["sum"] + emojies["coin"] + " (" + user["income_absorb"]["timer"] + " mins jäljellä)\n";
            }

            if ("absorb_target" in user) {
              status += emojies["tuloimu"] + " <@" + user["absorb_target"]["absorber"] + "> imee sinulta tuloa: Rahaa menetetty " + user["absorb_target"]["sum"] + emojies["coin"] + " (" + user["income_absorb"]["timer"] + " mins jäljellä)\n";
            }

            if ("timemachine_timer" in user) {
              var time = user["timemachine_timer"]["time"];
              var time_left = user["timemachine_timer"]["timer"];
              status += emojies["aikakone"] + " Aikakone: " + time + " (" + time_left + "mins jäljellä)\n"
            }

            if ("fishing_timer" in user) {
              var emoji;
              if (user["inventory"]["key_items"]["hyper_rod"]) {
                emoji = emojies["hyperonki"];
              }
              else if (user["inventory"]["key_items"]["hyper_rod"]) {
                emoji = emojies["superonki"];
              }
              else {
                emoji = emojies["onki"];
              }
              status += emoji + " Olet kalastamassa!"
            }

            if ("boat_timer" in user) {
              status += emojies["kalastusvene"] + " Olet kalastusreissulla!"
            }

            msg.channel.send({
              embed: {
                title: `***INVENTORY (${user["name"]})***`,
                color: user["info"]["color"],
                thumbnail: {
                  url: avatar
                },
                description: `***Rahat:*** ${user["inventory"]["money"]}${
                  emojies["coin"]
                }, ***Perustulo:*** ${user["inventory"]["income"]}${
                  emojies["coin"]
                }${safe_t}${status}`,
                fields: [
                  {
                    name: "***___Tavarat:___***",
                    value: items
                  },
                  {
                    name: "***___Avaintavarat:___***",
                    value: key_items
                  },
                  {
                    name: "***___LootBoxit:___***",
                    value: lootboxes
                  }
                ]
              }
            });
          }
        }
      });
    });
  },

  status: msg => {
    let name = msg.content.split(" ")[1];
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        if (name == "" || name === undefined)
          return print_status(user["id"]);

        name = name.replace(/\D/g, "");

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

        check_user_in_database(name).then(() => {
          get_user(name).then(_user => {
            user = _user;
            print_status(user["id"]);
          });
        });

        function print_status(_id) {

            var status = "";

            if ("income_machine" in user) { // multi timer sum
              var multi = user["income_machine"]["multi"];
              var emoji;
              var name;
              if (multi == 10) {
                emoji = emojies["tulokone"];
                name = "Tulokone";
              }
              else if (multi == 20) {
                emoji = emojies["tulokonex"];
                name = "Tulokone-X";
              }
              else if (multi == 40) {
                emoji = emojies["tulokiihdytin"];
                name = "Tulokiihdytin";
              }

              status += emoji + " " + name + ": Rahaa saatu " + user["income_machine"]["sum"] + emojies["coin"] + " (" + user["income_machine"]["timer"] + " mins jäljellä)\n";


            }

            if ("income_absorb" in user) {
              status += emojies["tuloimu"] + " Imet tuloa jäbältä <@" + user["income_absorb"]["target"] + ">: Rahaa saatu " + user["income_absorb"]["sum"] + emojies["coin"] + " (" + user["income_absorb"]["timer"] + " mins jäljellä)\n";
            }

            if ("absorb_target" in user) {
              status += emojies["tuloimu"] + " <@" + user["absorb_target"]["absorber"] + "> imee sinulta tuloa: Rahaa menetetty " + user["absorb_target"]["sum"] + emojies["coin"] + " (" + user["income_absorb"]["timer"] + " mins jäljellä)\n";
            }

            if ("timemachine_timer" in user) {
              var time = user["time_machine"]["time"];
              var time_left = user["time_machine"]["timer"];
              status += emojies["aikakone"] + " Aikakone: " + time + " (" + time_left + "mins jäljellä)\n"
            }

            if ("fishing_timer" in user) {
              var emoji;
              if (user["inventory"]["key_items"]["hyper_rod"]) {
                emoji = emojies["hyperonki"];
              }
              else if (user["inventory"]["key_items"]["hyper_rod"]) {
                emoji = emojies["superonki"];
              }
              else {
                emoji = emojies["onki"];
              }
              status += emoji + " Olet kalastamassa!"
            }

            if ("fishing_boat_timer" in user) {
              status += emojies["kalastusvene"] + " Olet kalastusreissulla!"
            }

            if (status == "") {
              status = "Ei mitään!";
            }

            msg.channel.send({
              embed: {
                title: `***STATUS (${user["name"]})***`,
                color: user["info"]["color"],
                description: `${status}`
              }
            });
        }
      });
    });
  },

  ironman: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        if (user["ironman"])
          return msg.channel.send(`Olet jo Ironman, etkä muuksi muutu...`);
        user["ironman"] = true;
        msg.channel.send(`Olet nyt Ironman! Etenet tästä eteenpäin yksin...`);
        save_user(user);
      });
    });
  },

  kauppa: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        var basic_income = Math.floor(user["inventory"]["income"]);
        var cost_next_basic_income =
          Math.floor(
            (1000 *
              Math.pow(1.08, user["basic_statistics"]["income_bought"]) *
              (10 + 5 * user["basic_statistics"]["income_bought"])) /
              100
          ) * 100;

        msg.channel.send({
          embed: {
            title: "***KAUPPA*** (" + user["name"] + ")",
            color: user["info"]["color"],
            description: "___Hakasulkeissa oleva teksti on ostokomento:___\n" + tokens.prefix + "osta [tuote] [määrä]",
            thumbnail: {
              url:
                "https://upload.wikimedia.org/wikipedia/fi/thumb/3/3a/Lidlin_logo.svg/1024px-Lidlin_logo.svg.png"
            },
            fields: [
              {
                name: "***___" + emojies["perustulo3"] + " +5 Perustulo:___*** [perustulo]",
                value:
                  "___Hinta:___ " +
                  cost_next_basic_income +
                  emojies["coin"] +
                  "\n(Olet aikaisemmin ostanut " +
                  user["basic_statistics"]["income_bought"] +
                  ")"
              },
              {
                name: "***___" + emojies["ES"] + "ES:___*** [es]",
                value: "___Hinta:___ 1" + emojies["coin"]
              },
              {
                name:
                  "***___" + emojies["harpuuna"] + "Kultainen harppuuna:___*** [harpuuna]",
                value:
                  "___Hinta:___ 150k" +
                  emojies["coin"] +
                  "\nViisinkertaistaa Harpoon -pelissä liikkuvat massit!"
              },
              {
                name: "***___" + "🐳 Valaankasvatusohjelma:___*** [vko]",
                value:
                  "___Hinta:___ 250k" +
                  emojies["coin"] +
                  "\nNostaa valaiden määrää 50%!"
              },

              {
                name: "***___" + emojies["tallelokero"] + " Tallelokero upgrade:___*** [tallelokero]",
                value:
                  "___Hinta:___ 100k" + emojies["coin"] + "\nNostaa tallelokeron tilavuutta yhdellä miljoonalla."
              },
              {
                name: "***___" + emojies["onki"] + " Onki:___*** [onki]",
                value:
                  "___Hinta:___ 10k" + emojies["coin"]
              },
              {
                name: "***___" + emojies["aikakone"] + " Aikakone:___*** [aikakone]",
                value:
                  "___Hinta:___ 10k" + emojies["coin"] + "\nMahdollistaa kalastamisen eri aikaulottuvuudessa tunnin ajan."
              },
              {
                name: "***___" + emojies["tukki"] + " Tukki:___*** [tukki]",
                value:
                  "___Hinta:___ 50 " + emojies["keppi"] + "\nVoi mäjäyttää vitusti."
              },
              {
                name: "***___" + emojies["supersytti"] + " Supersytti:___*** [supersytti]",
                value:
                  "___Hinta:___ 10 Syttiä"
              },
              {
                name: "***___" + emojies["hypersytti"] + " Hypersytti:___*** [hypersytti]",
                value:
                  "___Hinta:___ 10 Supersyttiä"
              }

            ]
          }
        });
      });
    });
  },

  osta: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        let purchase = msg.content.split(" ")[1];
        let amount = msg.content.split(" ")[2];
        var customer = msg.author.id;

        if (purchase != undefined) {
          purchase = purchase.toLowerCase();
        }

        if (amount != undefined) {
          amount = amount.toLowerCase();
        }

        if (amount == "" || amount === undefined) {
          amount = "1";
        }

        if (amount.slice(-1) == "k") {
          amount = Math.floor(1000*parseFloat(amount));
        }
        else if (amount.slice(-1) == "m") {
          amount = Math.floor(1000000*parseFloat(amount));
        }

        if (isNaN(amount))
          return msg.channel.send(amount + ` määrää ei voida ostaa :D`);
        amount = Math.floor(parseInt(amount));
        if (amount < 0)
          return msg.channel.send("Et voi myydä tuotetta pois :(");
        if (amount == 0)
          return msg.channel.send("Ai, etkö aiokkaan ostaan mitään?");

        if (purchase == "" || purchase === undefined)
          return msg.channel.send(`Kirjoita !osta ja tuotteen nimi`);

        var money = user["inventory"]["money"];

        // PERUSTULO
        if (purchase == "perustulo") {
          var basic_income = user["inventory"]["income"];
          var basic_income_price =
            Math.floor((1000 * Math.pow(1.08, user["basic_statistics"]["income_bought"]) * (10 + 5 * user["basic_statistics"]["income_bought"])) / 100) * 100;
          if (money < basic_income_price)
            return msg.channel.send(
              "Ei ole varaa ostaa... nyt keräämään, tarvitset: " +
                basic_income_price +
                emojies["coin"] +
                "."
            );

          user["inventory"]["income"] += 5;
          user["basic_statistics"]["income_bought"] += 1;
          user["inventory"]["money"] -= basic_income_price;

          msg.channel.send(
            "Onnittelut, perustuloa ostettu! Maksoi: " +
              basic_income_price +
              emojies["coin"]
          );
        } else if (purchase == "es") {
          if (money < amount)
            return msg.channel.send(
              "Lol, köyhä ei oo ees 1 kolee XDDDD t. bOtter.."
            );

          user["inventory"]["items"]["ES"] += amount;
          user["inventory"]["money"] -= amount;

          msg.channel.send("Ostit " + amount + emojies["ES"]);
        } else if (purchase == "harpuuna") {
          if (money < 150000) return msg.channel.send("Lol, köyhä.");
          if (user["inventory"]["key_items"]["golden_harpoon"])
            return msg.channel.send(
              "Älä osta toista harpuunaa, menee hukkaan!"
            );

          user["inventory"]["key_items"]["golden_harpoon"] = true;
          user["inventory"]["money"] -= 150000;

          msg.channel.send("Onnittelut! Sulla on nyt kultainen harppuuna!");
        }
        else if (purchase == "vko") {
          if (money < 250000) return msg.channel.send("Lol, köyhä.");
          if (user["inventory"]["key_items"]["whale_breeding_program"])
            return msg.channel.send(
              "Älä osta toista kasvatusohjelmaa, menee hukkaan!"
            );

          user["inventory"]["key_items"]["whale_breeding_program"] = true;
          user["inventory"]["money"] -= 250000;

          msg.channel.send("Onnittelut! Sulla on nyt valaankasvatusohjelma!");
        }
        else if (purchase == "onki") {
          if (money < 10000) return msg.channel.send("Lol, köyhä.");
          if (user["inventory"]["key_items"]["rod"])
            return msg.channel.send(
              "Älä osta toista onkea, menee hukkaan!"
            );

          user["inventory"]["key_items"]["rod"] = true;
          user["inventory"]["money"] -= 10000;

          msg.channel.send("Onnittelut! Sulla on nyt onki!");
        }
      else if (purchase == "supersytti") {
        if (user["inventory"]["items"]["bait"] < 10*amount) return msg.channel.send("Lol, sulla ei oo tarpeeksi syttejä.");

        user["inventory"]["items"]["super_bait"] += amount;
        user["inventory"]["items"]["bait"] -= amount*10;

        msg.channel.send(`Ostit ${amount} supersyttiä!`);
      }
      else if (purchase == "tukki") {
        if (user["inventory"]["items"]["stick"] < 50*amount) return msg.channel.send("Lol, sulla ei oo tarpeeksi keppejä.");

        user["inventory"]["items"]["log"] += amount;
        user["inventory"]["items"]["stick"] -= amount*50;

        msg.channel.send(`Ostit ${amount} tukkeja!`);
      }
      else if (purchase == "hypersytti") {
        if (user["inventory"]["items"]["super_bait"] < 10*amount) return msg.channel.send("Lol, sulla ei oo tarpeeksi syttejä.");

        user["inventory"]["items"]["hyper_bait"] += amount;
        user["inventory"]["items"]["super_bait"] -= amount*10;

        msg.channel.send(`Ostit ${amount} Hypersyttiä!`);
      }
      else if (purchase == "tallelokero") {
        if (user["inventory"]["money"] < 100000*amount) return msg.channel.send("Lol, sulla ei oo tarpeeksi rahaa.");

        user["inventory"]["key_items"]["safe"]["capasity"] += amount*1000000;
        user["inventory"]["money"] -= amount*100000;

        msg.channel.send(`Ostit ${amount} Tallelokero Upgradea!`);
      }
      else if (purchase == "aikakone") {
        if (user["inventory"]["money"] < 10000*amount) return msg.channel.send("Lol, sulla ei oo tarpeeksi rahaa.");

        user["inventory"]["items"]["timemachine"] += amount;
        user["inventory"]["money"] -= amount*10000;

        msg.channel.send(`Ostit ${amount} aikakonetta!`);
      }
      else {
          msg.channel.send(
            "Et voi ostaa mitään ihme " + purchase + " -juttua..."
          );
        }
        save_user(user);
      });
    });
  },

  vaihda: async msg => {
    var user;
    var target_user;

    let name = msg.content.split(" ")[1];
    if (name == "" || name === undefined)
      return msg.channel.send(`Kirjoita kohdehenkilö!`);

    name = name.replace(/\D/g, "");

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }
    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

    var target_id = name;
    await check_user_in_database(msg.author.id);
    user = await get_user(msg.author.id);

    await check_user_in_database(target_id);
    target_user = await get_user(target_id);

    if (target_id == msg.author.id)
      return msg.channel.send(`Et voi vaihtaa itsesi kanssa!`);

    if (user["ironman"])
      return msg.channel.send(`Oot Ironman, et voi vaihtaa...`);
    if (target_user["ironman"])
      return msg.channel.send(
        `Hän ei halua vaihdella.. hän on katsos Ironman btw..`
      );

    var items = {
      bait: "sytti",
      super_bait: "supersytti",
      hyper_bait: "hypersytti",
      stick: "keppi",
      mask: "maski",
      ES: "es",
      income_machine: "tulokone",
      income_machine_X: "tulokone-x",
      income_accelerator: "tulokiihdytin",
      income_absorber: "tuloimu",
      gem: "gem",
      glitch: "glitch",
      bomb: "pommi",
      shield: "kilpi",
      security_cam: "valvontakamera",
      bronze_income: "pronssitulo",
      silver_income: "hopeatulo",
      gold_income: "kultatulo",
      timemachine: "aikakone"
    };

    var emo = {
      bait: emojies["sytti"],
      super_bait: emojies["supersytti"],
      hyper_bait: emojies["hypersytti"],
      stick: emojies["keppi"],
      mask: emojies["maski"],
      ES: emojies["ES"],
      income_machine: emojies["tulokone"],
      income_machine_X: emojies["tulokonex"],
      income_accelerator: emojies["tulokiihdytin"],
      income_absorber: emojies["tuloimu"],
      gem: emojies["gem"],
      glitch: emojies["glitch"],
      bomb: emojies["pommi"],
      shield: emojies["kilpi"],
      security_cam: emojies["valvontakamera"],
      bronze_income: emojies["perustulo1"],
      silver_income: emojies["perustulo2"],
      gold_income: emojies["perustulo3"],
      timemachine: emojies["aikakone"]
    };

    var trade_message;
    await msg.channel.send(print_trade_window(items, emo)).then(async m => {
      trade_message = m;
      await trade_message.react("✅");
      await trade_message.react("❎");
    });

    var user_trades = {};
    var target_user_trades = {};
    var accepted = [];

    let co = msg.channel.createCollector(m => m);
    co.on("collect", async m => {
      if (
        m.content.startsWith(tokens.prefix + "laita") &&
        (m.author.id == target_id || m.author.id == msg.author.id)
      ) {
        m.delete();
        await trade_message.clearReactions();
        await trade_message.react("✅");
        await trade_message.react("❎");
        accepted = [];
        let item = m.content.split(" ")[1];
        var amount = m.content.split(" ")[2];
        if (amount != undefined) {
          amount = amount.toLowerCase();
        }


        if (item != undefined) {
          item = item.toLowerCase();
        }

        if (amount == "" || amount == undefined) {
          amount = "1";
        }
        if (amount.slice(-1) == "k") {
          amount = Math.floor(1000*parseFloat(amount));
        }

        else if (amount.slice(-1) == "m") {
          amount = Math.floor(1000000*parseFloat(amount));
        }

        var current_user;
        var current_trades;
        if (m.author.id == target_id) {
          current_user = target_user;
          current_trades = target_user_trades;
        }
        if (m.author.id == msg.author.id) {
          current_user = user;
          current_trades = user_trades;
        }

        if (item != "rahat") {
          var ret = {};
          for (var key in items) {
            ret[items[key]] = key;
          }

          if (!(item in ret)) return trade_message.edit(
            print_trade_window(items, emo, "Virheellinen tavara!")
          );

          var helper_amount = 0;
          if (current_trades[item] == undefined || current_trades[item] == null || current_trades[item] == "") {
            helper_amount = 0;
          } else {
            helper_amount = current_trades[item];
          }


          if (amount == "max") {
            amount = Math.floor(current_user["inventory"]["items"][ret[item]] - helper_amount);
          }

          else if (amount == "puolet") {
            amount = Math.floor(current_user["inventory"]["items"][ret[item]]/2 - helper_amount);
          }

          else if (amount == "min") {
            amount = 1;
          }
        } else {

          if (current_trades["money"] == undefined || current_trades["money"] == null || current_trades["money"] == "") {
            helper_amount = 0;
          } else {
            helper_amount = current_trades["money"];
          }


          if (amount == "max") {
            amount = Math.floor(current_user["inventory"]["money"] - helper_amount);
          }

          else if (amount == "puolet") {
            amount = Math.floor(current_user["inventory"]["money"]/2 - helper_amount);
          }

          else if (amount == "min") {
            amount = 1;
          }
        }

        if (isNaN(amount))
          return trade_message.edit(
            print_trade_window(items, emo, "Virheellinen määrä!")
          );

        if (parseInt(amount) < 0) {
          return trade_message.edit(
            print_trade_window(
              items,
              emo,
              "Sun tarvii laittaa + määrä tavaraa!"
            )
          );
        } else if (parseInt(amount) == 0) {
          return trade_message.edit(
            print_trade_window(items, emo, "Et voi laittaa 'ei mitään'.")
          );
        }
        amount = parseInt(amount);

        var u = user;
        var t = user_trades;
        if (m.author.id == target_id) {
          u = target_user;
          t = target_user_trades;
          target_user_trades = add_item(item, amount, u, t);
        } else {
          user_trades = add_item(item, amount, u, t);
        }
        trade_message.edit(print_trade_window(items, emo));
      } else if (
        m.content.startsWith(tokens.prefix + "poista") &&
        (m.author.id == target_id || m.author.id == msg.author.id)
      ) {
        m.delete();
        await trade_message.clearReactions();
        await trade_message.react("✅");
        await trade_message.react("❎");
        let item = m.content.split(" ")[1];
        var amount = m.content.split(" ")[2];

        if (amount != undefined) {
          amount = amount.toLowerCase();
        }


        if (item != undefined) {
          item = item.toLowerCase();
        }


        if (amount.slice(-1) == "k") {
          amount = Math.floor(1000*parseFloat(amount));
        }

        else if (amount.slice(-1) == "m") {
          amount = Math.floor(1000000*parseFloat(amount));
        }

        if (amount == undefined || amount == "") {
          amount = 1;
        }

        var current_user;
        var current_trades;
        if (m.author.id == target_id) {
          current_user = target_user;
          current_trades = target_user_trades;
        }
        if (m.author.id == msg.author.id) {
          current_user = user;
          current_trades = user_trades;
        }

        if (item != "rahat") {
          var ret = {};
          for (var key in items) {
            ret[items[key]] = key;
          }

          if (!(item in ret)) return trade_message.edit(
            print_trade_window(items, emo, "Virheellinen tavara!")
          );

          if (current_trades[item] == undefined) {
            current_trades[item] = 0;
          }
          if (current_trades["money"] == undefined) {
            current_trades["money"] = 0;
          }


          if (amount == "max") {
            amount = Math.floor(current_trades[item]);
          }

          else if (amount == "puolet") {
            amount = Math.floor(current_trades[item]/2);
          }

          else if (amount == "min") {
            amount = 1;
          }
        } else {
          if (amount == "max") {
            amount = Math.floor(current_trades["money"]);
          }

          else if (amount == "puolet") {
            amount = Math.floor(current_trades["money"]/2);
          }

          else if (amount == "min") {
            amount = 1;
          }
        }



        if (isNaN(amount))
          return trade_message.edit(
            print_trade_window(items, emo, "Virheellinen määrä!")
          );

        if (parseInt(amount) < 0) {
          return trade_message.edit(
            print_trade_window(
              items,
              emo,
              "Sun tarvii laittaa + määrä tavaraa!"
            )
          );
        } else if (parseInt(amount) == 0) {
          return trade_message.edit(
            print_trade_window(items, emo, "Et voi laittaa 'ei mitään'.")
          );
        }
        amount = parseInt(amount);

        var u = user;
        var t = user_trades;
        if (m.author.id == target_id) {
          u = target_user;
          t = target_user_trades;
          target_user_trades = remove_item(item, amount, u, t);
        } else {
          user_trades = remove_item(item, amount, u, t);
        }
        trade_message.edit(print_trade_window(items, emo));
      }
    });

    let em = trade_message.createReactionCollector(
      (reaction, _user) => _user.id === msg.author.id || _user.id === target_id,
      {
        time: 10 * 60 * 1000
      }
    );

    function removeDuplicateUsingFilter(arr){
        let unique_array = arr.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
        return unique_array
    }

    em.on("collect", (reaction, _user) => {
      if (reaction.emoji == "✅") {
        accepted.push(_user.id);
        //accepted = removeDuplicateUsingFilter(accepted);
        if (accepted.length == 2) {
          trade_items(msg.author.id, target_id,
            user_trades,
            target_user_trades,
            items
          );

          em.stop();

        }
      } else if (reaction.emoji == "❎") {
        em.stop();
        msg.channel.send("Vaihtoa ei suoritettu...");
      }
    });

    em.on("end", () => {
      trade_message.delete();
      co.stop();
    });

    function add_item(_item, _amount, _user, _trades) {
      if (_item == "rahat") {
        if ("money" in _trades) {
          if (_user["inventory"]["money"] - _trades["money"] < _amount) {
            msg.channel.send("Sulla on liian vähän rahaa!");
            return _trades;
          }
        } else {
          if (_user["inventory"]["money"] < _amount) {
            msg.channel.send("Sulla on liian vähän rahaa!");
            return _trades;
          }
        }

        if (!("money" in _trades)) {
          _trades["money"] = _amount;
        } else {
          _trades["money"] += _amount;
        }
        return _trades;
      } else {
        if (!Object.values(items).includes(_item)) {
          msg.channel.send("Virheellinen tavara!");
          return _trades;
        }
        var ret = {};
        for (var key in items) {
          ret[items[key]] = key;
        }

        if (_item in _trades) {
          if (
            _user["inventory"]["items"][ret[_item]] - _trades[_item] <
            _amount
          ) {
            msg.channel.send("Sulla on liian vähän kyseistä tavaraa!");
            return _trades;
          }
        } else {
          if (_user["inventory"]["items"][ret[_item]] < _amount) {
            msg.channel.send("Sulla on liian vähän kyseistä tavaraa!");
            return _trades;
          }
        }

        if (!(_item in _trades)) {
          _trades[_item] = _amount;
        } else {
          _trades[_item] += _amount;
        }
        return _trades;
      }
    }

    function remove_item(_item, _amount, _user, _trades) {
      if (_item == "rahat") {
        if (!("money" in _trades)) return _trades;

        _trades["money"] -= _amount;
        if (_trades["money"] < 1) {
          delete _trades["money"];
        }
        return _trades;
      } else {
        if (!Object.values(items).includes(_item)) {
          msg.channel.send("Virheellinen tavara!");
          return _trades;
        }

        if (!(_item in _trades)) return _trades;

        _trades[_item] -= _amount;
        if (_trades[_item] < 1) {
          delete _trades[_item];
        }
        return _trades;
      }
    }

    function print_trade_window(itemsx, emox, add = "") {
      var items1 = "";
      var items2 = "";
      var ret = {};
      for (var key in itemsx) {
        ret[itemsx[key]] = key;
      }

      for (var i in user_trades) {
        if (i == "money") {
          items1 += emojies["coin"] + " Coins: " + user_trades["money"] + "\n";
        } else {
          items1 +=
            emox[ret[i]] +
            " " +
            itemsx[ret[i]].charAt(0).toUpperCase() +
            itemsx[ret[i]].slice(1) +
            ": " +
            user_trades[i] +
            "\n";
        }
      }

      for (var i in target_user_trades) {
        if (i == "money") {
          items2 +=
            emojies["coin"] + " Coins: " + target_user_trades["money"] + "\n";
        } else {
          items2 +=
            emox[ret[i]] +
            " " +
            itemsx[ret[i]].charAt(0).toUpperCase() +
            itemsx[ret[i]].slice(1) +
            ": " +
            target_user_trades[i] +
            "\n";
        }
      }

      if (items1 == "") {
        items1 = "Absolutely nothing";
      }
      if (items2 == "") {
        items2 = "Absolutely nothing";
      }
      var color = 10197915;
      if (add == "Vaihto suoritettu!") {
        color = 5348864;
      }
      if (add == "") {
        return {
          embed: {
            title: "***Vaihtoikkuna***",
            color: 10197915,
            fields: [
              {
                name: `***___${user["name"]}___*** `,
                value: items1,
                inline: true
              },
              {
                name: `***___${target_user["name"]}___*** `,
                value: items2,
                inline: true
              }
            ]
          }
        };
      } else {
        return {
          embed: {
            title: "***Vaihtoikkuna***",
            color: color,
            fields: [
              {
                name: `***___${user["name"]}___*** `,
                value: items1,
                inline: true
              },
              {
                name: `***___${target_user["name"]}___*** `,
                value: items2,
                inline: true
              }
            ],
            description: add
          }
        };
      }
    }

    async function trade_items(
      user_id, target_user_id,_user_trades,
      _target_user_trades,
      itemsx
    ) {

      var _user = await get_user(user_id);
      var _target_user = await get_user(target_user_id);

      var ret = {};
      for (var key in itemsx) {
        ret[itemsx[key]] = key;
      }

      for (item in _user_trades) {
        if (item == "money") {

          if (_user_trades["money"] > _user["inventory"]["money"]) return msg.channel.send("Vaihtoa ei suoritettu, rahaa liian vähän...");

          _target_user["inventory"]["money"] += _user_trades["money"];
          _user["inventory"]["money"] -= _user_trades["money"];
        } else {

          if (_user_trades[item] > _user["inventory"]["items"][ret[item]]) return msg.channel.send("Vaihtoa ei suoritettu, liia vähän jotain tavaroista...");

          _target_user["inventory"]["items"][ret[item]] += _user_trades[item];
          _user["inventory"]["items"][ret[item]] -= _user_trades[item];
        }
      }

      for (item in _target_user_trades) {

        if (item == "money") {
          if (_target_user_trades["money"] > _target_user["inventory"]["money"]) return msg.channel.send("Vaihtoa ei suoritettu, rahaa liian vähän...");

          _user["inventory"]["money"] += _target_user_trades["money"];
          _target_user["inventory"]["money"] -= _target_user_trades["money"];

        } else {

          if (_target_user_trades[item] > _target_user["inventory"]["items"][ret[item]]) return msg.channel.send("Vaihtoa ei suoritettu, liia vähän jotain tavaroista...");

          _user["inventory"]["items"][ret[item]] += _target_user_trades[item];
          _target_user["inventory"]["items"][ret[item]] -=
            _target_user_trades[item];
        }
      }



      save_user(_user);
      save_user(_target_user);

      return msg.channel.send(
        print_trade_window(items, emo, "Vaihto suoritettu!")

      );
    }
  },

  rahat: async msg => {
    await check_user_in_database(msg.author.id);
    var user = await get_user(msg.author.id);

    let name = msg.content.split(" ")[1];
    var sender_id = msg.author.id;

    if (name == "" || name === undefined) {
      var safe_txt = "";
      if (user["inventory"]["key_items"]["safe"]["own"]) {
        safe_txt =
          " (" +
          emojies["tallelokero"] +
          " " +
          user["inventory"]["key_items"]["safe"]["money"] +
          emojies["coin"] +
          ")";
      }
      return msg.channel.send(
        "Sulla on " + user["inventory"]["money"] + emojies["coin"] + safe_txt
      );
    } else {
      name = name.replace(/\D/g, "");

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

      await check_user_in_database(target_id);
      var target_user = await get_user(target_id);

      var safe_txt = "";
      if (target_user["inventory"]["key_items"]["safe"]["own"]) {
        safe_txt =
          " (" +
          emojies["tallelokero"] +
          " " +
          target_user["inventory"]["key_items"]["safe"]["money"] +
          emojies["coin"] +
          ")";
      }
      return msg.channel.send(
        "Hänellä on " +
          target_user["inventory"]["money"] +
          emojies["coin"] +
          safe_txt
      );
    }
  },

  profiili: async msg => {
    let name = msg.content.split(" ")[1];
    let category = msg.content.split(" ")[2];
    let thrd = msg.content.split(" ")[3];
    let all = msg.content.split(" ");

    if (category != undefined) {
      category = category.toLowerCase();
    }


    if (thrd != undefined) {
      thrd = thrd.toLowerCase();
    }

    let edit = "";
    if (name == "väri") {
      all = "- - - " + category;
      category = name;
      name = msg.author.id;
    }

    for (var i = 3; i < all.length; i++) {
      edit += all[i] + " ";
    }

    if (name == "" || name === undefined) {
      name = msg.author.id;
    }
    name = name.replace(/\D/g, "");

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

    var target_id = name;
    await check_user_in_database(target_id);
    var user = await get_user(target_id);

    if (category == "" || category === undefined) {
      print_profile(user, msg);
    } else {
      if (category == "nimi") {
        if (user["id"] == msg.author.id)
          return msg.channel.send(`Et pysty vaihtamaan omaaprofiilinimeä!`);
        user["name"] = edit;
        msg.channel.send("Nimi vaihdettu!");
      } else if (category == "motto") {
        if (user["id"] == msg.author.id)
          return msg.channel.send(`Muut määrää sun moton!`);
        user["info"]["motto"] = edit;
        msg.channel.send("Motto vaihdettu!");
      } else if (category == "kuvaus") {
        if (user["id"] == msg.author.id)
          return msg.channel.send(`Muut määrää kuvauksen susta!`);
        user["info"]["description"] = edit;
        msg.channel.send("Kuvaus vaihdettu!");
      } else if (category == "kuva") {
        if (user["id"] == msg.author.id)
          return msg.channel.send(`Muut määrää sun profiilin kuvan!`);
        user["info"]["pictures"] = edit;
        msg.channel.send("Kuva vaihdettu!");
      } else if (category == "väri") {
        edit = edit.replace(/\D/g, "");
        console.log();
        if (edit.length != 9) return msg.channel.send("Virheellinen väri...");
        var rgb = edit.match(/.{1,3}/g);
        var discord_color =
          parseInt(rgb[0]) * 65536 + parseInt(rgb[1]) * 256 + parseInt(rgb[2]);

        user["info"]["color"] = parseInt(discord_color);
        msg.channel.send("Väri vaihdettu!");
      } else {
        msg.channel.send("Vialliset komennot...");
        return;
      }

      save_user(user);
    }
  },

  kaladex: async msg => {
    let name = msg.content.split(" ")[1];
    var sender_id = msg.author.id;

    if (name == "" || name === undefined) {
      name = msg.author.id;
    }
    name = name.replace(/\D/g, "");

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

    await check_user_in_database(target_id);
    var user = await get_user(target_id);

    var _all_users = await get_all_users();

    await msg.channel.send(await lake(user, _all_users)).then(async m => {
      message = m;
      await message.react(emojies["ahven"]);
      await message.react(emojies["lohi"]);
      await message.react(emojies["taskurapu"]);
      await message.react("2⃣");
      await message.react("3⃣");
    });

    let co = message.createReactionCollector((reaction, _user) => !_user.bot, {
      time: 10 * 60 * 1000
    });

    co.on("collect", async (reaction, _user) => {
      var all_users = await reaction.fetchUsers();
      var _all_users = await get_all_users();
      for (var _u of all_users) {
        if (!_u[1].bot) {
          reaction.remove(_u[1].id);
        }
      }
      if (reaction.emoji == emojies["ahven"]) {
        message.edit(await lake(user, _all_users));
      } else if (reaction.emoji == emojies["lohi"]) {
        message.edit(await river(user, _all_users));
      }
      else if (reaction.emoji == emojies["taskurapu"]) {
        message.edit(await sea(user, _all_users));
      }
      else if (reaction.emoji == "2⃣") {
        message.edit(await tier2(user, _all_users));
      }
      else if (reaction.emoji == "3⃣") {
        message.edit(await tier3(user, _all_users));
      }
    });

    co.on("end", () => {
      message.delete();
      co.stop();
    });


    function lake(user, _all_users) {
      var uz = client.users.get(user["id"]);
      var avatar = uz.avatarURL;

      var tier1 = "";
      var all_fish_count = 0;
      var caught_fish_count = 0;
      for (var fish in fishes) {
        if (fishes[fish]["tier"] == 1) {
          all_fish_count += 1;
          if (fishes[fish]["place"] == "L") {
            var mark = ":x: ";
            var more = "";
            var trophy = ":trophy:";
            for (var u in _all_users) {
              if (
                _all_users[u]["game_kalastus"]["KalaDex"][fish]["heaviest"] >
                user["game_kalastus"]["KalaDex"][fish]["heaviest"]
              ) {
                trophy = "";
              }
            }
            if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
              caught_fish_count += 1;
              mark = ":white_check_mark: ";
              more =
                " (" +
                user["game_kalastus"]["KalaDex"][fish]["caught"] +
                " kpl, " +
                user["game_kalastus"]["KalaDex"][fish]["heaviest"] +
                "kg " +
                trophy +
                ")";
            }

            tier1 +=
              mark +
              (fishes[fish]["index"] + 1) +
              ". " +
              emojies[fishes[fish]["emoji"]] +
              " " +
              fish +
              more +
              "\n";
          } else {
            if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
              caught_fish_count += 1;
            }

          }
        }
      }

      var percent = (caught_fish_count*100/all_fish_count).toFixed(0) + "%";
      var progress_bar = "";
      if (caught_fish_count/all_fish_count >= 0.1) {
        progress_bar += emojies["start2"];
      } else {
        progress_bar += emojies["start1"];
      }
      var complete_count = Math.round(10*caught_fish_count/all_fish_count);

      for (var i = 0; i < complete_count-1; i++) {
        if (i < 8) {
          progress_bar += emojies["mid2"];
        }
      }

      for (var i = 0; i < 9-complete_count; i++) {
        if (i < 8) {
          progress_bar += emojies["mid1"];
        }
      }
      if (caught_fish_count/all_fish_count == 1) {
        progress_bar += emojies["end2"];
      } else {
        progress_bar += emojies["end1"];
      }

      return {
        embed: {
          color: user["info"]["color"],
          author: {
            name: user["name"] + " KalaDex:",
            icon_url: avatar
          },
          description: "***Tier 1, Järvi:***\n " + tier1 + "\n" + progress_bar + " " + percent + " (" + caught_fish_count + "/" + all_fish_count + ")"
        }
      };
    }

    function river(user, _all_users) {
      var uz = client.users.get(user["id"]);
      var avatar = uz.avatarURL;

      var tier1 = "";
      var all_fish_count = 0;
      var caught_fish_count = 0;
      for (var fish in fishes) {
        if (fishes[fish]["tier"] == 1) {
          all_fish_count += 1;
          if (fishes[fish]["place"] == "R") {
            var mark = ":x: ";
            var more = "";
            var trophy = ":trophy:";
            for (var u in _all_users) {
              if (
                _all_users[u]["game_kalastus"]["KalaDex"][fish]["heaviest"] >
                user["game_kalastus"]["KalaDex"][fish]["heaviest"]
              ) {
                trophy = "";
              }
            }
            if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
              caught_fish_count += 1;
              mark = ":white_check_mark: ";
              more =
                " (" +
                user["game_kalastus"]["KalaDex"][fish]["caught"] +
                " kpl, " +
                user["game_kalastus"]["KalaDex"][fish]["heaviest"] +
                "kg " +
                trophy +
                ")";
            }

            tier1 +=
              mark +
              (fishes[fish]["index"] + 1) +
              ". " +
              emojies[fishes[fish]["emoji"]] +
              " " +
              fish +
              more +
              "\n";
          } else {
            if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
              caught_fish_count += 1;
            }

          }
        }
      }

      var percent = (caught_fish_count*100/all_fish_count).toFixed(0) + "%";
      var progress_bar = "";
      if (caught_fish_count/all_fish_count >= 0.1) {
        progress_bar += emojies["start2"];
      } else {
        progress_bar += emojies["start1"];
      }
      var complete_count = Math.round(10*caught_fish_count/all_fish_count);

      for (var i = 0; i < complete_count-1; i++) {
        if (i < 8) {
          progress_bar += emojies["mid2"];
        }
      }

      for (var i = 0; i < 9-complete_count; i++) {
        if (i < 8) {
          progress_bar += emojies["mid1"];
        }
      }
      if (caught_fish_count/all_fish_count == 1) {
        progress_bar += emojies["end2"];
      } else {
        progress_bar += emojies["end1"];
      }

      return {
        embed: {
          color: user["info"]["color"],
          author: {
            name: user["name"] + " KalaDex:",
            icon_url: avatar
          },
          description: "***Tier 1, Joki:***\n " + tier1 + "\n" + progress_bar + " " + percent + " (" + caught_fish_count + "/" + all_fish_count + ")"
        }
      };
    }

    function sea(user, _all_users) {
      var uz = client.users.get(user["id"]);
      var avatar = uz.avatarURL;

      var tier1 = "";
      var all_fish_count = 0;
      var caught_fish_count = 0;
      for (var fish in fishes) {
        if (fishes[fish]["tier"] == 1) {
          all_fish_count += 1;
          if (fishes[fish]["place"] == "S") {
            var mark = ":x: ";
            var more = "";
            var trophy = ":trophy:";
            for (var u in _all_users) {
              if (
                _all_users[u]["game_kalastus"]["KalaDex"][fish]["heaviest"] >
                user["game_kalastus"]["KalaDex"][fish]["heaviest"]
              ) {
                trophy = "";
              }
            }
            if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
              caught_fish_count += 1;
              mark = ":white_check_mark: ";
              more =
                " (" +
                user["game_kalastus"]["KalaDex"][fish]["caught"] +
                " kpl, " +
                user["game_kalastus"]["KalaDex"][fish]["heaviest"] +
                "kg " +
                trophy +
                ")";
            }

            tier1 +=
              mark +
              (fishes[fish]["index"] + 1) +
              ". " +
              emojies[fishes[fish]["emoji"]] +
              " " +
              fish +
              more +
              "\n";
          }else {
            if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
              caught_fish_count += 1;
            }

          }
        }
      }

      var percent = (caught_fish_count*100/all_fish_count).toFixed(0) + "%";
      var progress_bar = "";
      if (caught_fish_count/all_fish_count >= 0.1) {
        progress_bar += emojies["start2"];
      } else {
        progress_bar += emojies["start1"];
      }
      var complete_count = Math.round(10*caught_fish_count/all_fish_count);

      for (var i = 0; i < complete_count-1; i++) {
        if (i < 8) {
          progress_bar += emojies["mid2"];
        }
      }

      for (var i = 0; i < 9-complete_count; i++) {
        if (i < 8) {
          progress_bar += emojies["mid1"];
        }
      }
      if (caught_fish_count/all_fish_count == 1) {
        progress_bar += emojies["end2"];
      } else {
        progress_bar += emojies["end1"];
      }

      return {
        embed: {
          color: user["info"]["color"],
          author: {
            name: user["name"] + " KalaDex:",
            icon_url: avatar
          },
          description: "***Tier 1, Meri:***\n " + tier1 + "\n" + progress_bar + " " + percent + " (" + caught_fish_count + "/" + all_fish_count + ")"
        }
      };
    }

    function tier2(user, _all_users) {
      var uz = client.users.get(user["id"]);
      var avatar = uz.avatarURL;

      var tier2 = "";
      var all_fish_count = 0;
      var caught_fish_count = 0;
      for (var fish in fishes) {
        if (fishes[fish]["tier"] == 2) {
          all_fish_count += 1;
          var mark = ":x: ";
          var more = "";
          var trophy = ":trophy:";
          for (var u in _all_users) {
            if (
              _all_users[u]["game_kalastus"]["KalaDex"][fish]["heaviest"] >
              user["game_kalastus"]["KalaDex"][fish]["heaviest"]
            ) {
              trophy = "";
            }
          }
          if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
            caught_fish_count += 1;
            mark = ":white_check_mark: ";
            more =
              " (" +
              user["game_kalastus"]["KalaDex"][fish]["caught"] +
              " kpl, " +
              user["game_kalastus"]["KalaDex"][fish]["heaviest"] +
              "kg " +
              trophy +
              ")";
          }

          tier2 +=
            mark +
            (fishes[fish]["index"] + 1) +
            ". " +
            emojies[fishes[fish]["emoji"]] +
            " " +
            fish +
            more +
            "\n";

        }
      }

      var percent = (caught_fish_count*100/all_fish_count).toFixed(0) + "%";
      var progress_bar = "";
      if (caught_fish_count/all_fish_count >= 0.1) {
        progress_bar += emojies["start2"];
      } else {
        progress_bar += emojies["start1"];
      }
      var complete_count = Math.round(10*caught_fish_count/all_fish_count);

      for (var i = 0; i < complete_count-1; i++) {
        if (i < 8) {
          progress_bar += emojies["mid2"];
        }
      }

      for (var i = 0; i < 9-complete_count; i++) {
        if (i < 8) {
          progress_bar += emojies["mid1"];
        }
      }
      if (caught_fish_count/all_fish_count == 1) {
        progress_bar += emojies["end2"];
      } else {
        progress_bar += emojies["end1"];
      }

      return {
        embed: {
          color: user["info"]["color"],
          author: {
            name: user["name"] + " KalaDex:",
            icon_url: avatar
          },
          description: "***Tier 2:***\n " + tier2 + "\n" + progress_bar + " " + percent + " (" + caught_fish_count + "/" + all_fish_count + ")"
        }
      };
    }

    function tier3(user, _all_users) {
      var uz = client.users.get(user["id"]);
      var avatar = uz.avatarURL;

      var tier3 = "";
      var caught_fish_count = 0;
      var all_fish_count = 0;
      for (var fish in fishes) {
        if (fishes[fish]["tier"] == 3) {
          all_fish_count += 1;
          var mark = ":x: ";
          var more = "";
          var trophy = ":trophy:";
          for (var u in _all_users) {
            if (
              _all_users[u]["game_kalastus"]["KalaDex"][fish]["heaviest"] >
              user["game_kalastus"]["KalaDex"][fish]["heaviest"]
            ) {
              trophy = "";
            }
          }
          if (user["game_kalastus"]["KalaDex"][fish]["caught"] > 0) {
            caught_fish_count += 1;
            mark = ":white_check_mark: ";
            more =
              " (" +
              user["game_kalastus"]["KalaDex"][fish]["caught"] +
              " kpl, " +
              user["game_kalastus"]["KalaDex"][fish]["heaviest"] +
              "kg " +
              trophy +
              ")";
          }
          tier3 +=
            mark +
            (fishes[fish]["index"] + 1) +
            ". " +
            emojies[fishes[fish]["emoji"]] +
            " " +
            fish +
            more +
            "\n";
        }
      }

      var percent = (caught_fish_count*100/all_fish_count).toFixed(0) + "%";
      var progress_bar = "";
      if (caught_fish_count/all_fish_count >= 0.1) {
        progress_bar += emojies["start2"];
      } else {
        progress_bar += emojies["start1"];
      }
      var complete_count = Math.round(10*caught_fish_count/all_fish_count);

      for (var i = 0; i < complete_count-1; i++) {
        if (i < 8) {
          progress_bar += emojies["mid2"];
        }
      }

      for (var i = 0; i < 9-complete_count; i++) {
        if (i < 8) {
          progress_bar += emojies["mid1"];
        }
      }
      if (caught_fish_count/all_fish_count == 1) {
        progress_bar += emojies["end2"];
      } else {
        progress_bar += emojies["end1"];
      }

      return {
        embed: {
          color: user["info"]["color"],
          author: {
            name: user["name"] + " KalaDex:",
            icon_url: avatar
          },
          description: "***Tier 3:***\n " + tier3 + "\n" + progress_bar + " " + percent + " (" + caught_fish_count + "/" + all_fish_count + ")"
        }
      };
    }
  },

  pelidata: async msg => {
    let name = msg.content.split(" ")[1];
    let edit = "";

    if (name == "" || name === undefined) {
      name = msg.author.id;
    }
    name = name.replace(/\D/g, "");

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

    var target_id = name;
    await check_user_in_database(target_id);
    var user = await get_user(target_id);
    var avatar = client.users.get(user.id).avatarURL;

    var message;
    await msg.channel.send(await general(user)).then(async m => {
      message = m;
      await message.react("📊");
      await message.react(emojies["poggers"]);
      await message.react(emojies["1S"]);
      await message.react("🐳");
      await message.react("🐟");
      await message.react("🎭");
      await message.react("🎲");
    });

    let co = message.createReactionCollector((reaction, _user) => !_user.bot, {
      time: 10 * 60 * 1000
    });

    await co.on("collect", async (reaction, _user2) => {
      var all_users = await reaction.fetchUsers();
      for (var _u of all_users) {
        if (!_u[1].bot) {
          reaction.remove(_u[1].id);
        }
      }

      if (reaction.emoji == "📊") {
        message.edit(await general(user));
      } else if (reaction.emoji == emojies["poggers"]) {
        message.edit(await slot(user));
      } else if (reaction.emoji == emojies["1S"]) {
        message.edit(await bj(user));
      } else if (reaction.emoji == "🐳") {
        message.edit(await harpoon(user));
      } else if (reaction.emoji == "🐟") {
        message.edit(await fish(user));
      } else if (reaction.emoji == "🎭") {
        message.edit(await ryhmäpeli(user));
      } else if (reaction.emoji == "🎲") {
        message.edit(await ktem(user));
      }
    });

    co.on("end", () => {
      message.delete();
      co.stop();
    });

    function general(user) {
      // YLEISTÄ

      // KAIKKI Pelit
      var games =
        user["game_KTEM"]["games"] +
        user["game_slot"]["games"] +
        user["game_harpoon"]["games"] +
        user["game_kalastus"]["fish_caught"] +
        user["game_ryhmäpeli"]["games"] +
        user["game_blackjack"]["games"];
      // KAIKKI pelit VOITETTU
      var games_won =
        user["game_KTEM"]["games_won"] +
        user["game_slot"]["games_won"] +
        user["game_harpoon"]["games_won"] +
        user["game_ryhmäpeli"]["games_won"] +
        user["game_blackjack"]["games_won"];
      // KAIKKI Pelit HÄVITTY
      var games_lost =
        user["game_KTEM"]["games_lost"] +
        user["game_slot"]["games_lost"] +
        user["game_harpoon"]["games_lost"] +
        user["game_ryhmäpeli"]["games_lost"] +
        user["game_blackjack"]["games_lost"];
      // KAIKKI RAHAT VOITETTU
      var money_won =
        user["game_KTEM"]["money_won"] +
        user["game_slot"]["money_won"] +
        user["game_harpoon"]["money_won"] +
        user["game_kalastus"]["money_got"] +
        user["game_ryhmäpeli"]["money_won"] +
        user["game_blackjack"]["money_won"];
      // KAIKKI RAHAT HÄVITTY
      var money_lost =
        user["game_KTEM"]["money_lost"] +
        user["game_slot"]["money_lost"] +
        user["game_harpoon"]["money_lost"] +
        user["game_ryhmäpeli"]["money_lost"] +
        user["game_blackjack"]["money_lost"];
      // netto
      var netto = money_won - money_lost;

      return {
        embed: {
          title: `***PELIDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___YLEISTÄ:___***",
              value: `Kaikki pelit: ${games}\nVoitetut pelit: ${games_won}\nHävityt pelit: ${games_lost}\nVoitetut rahat: ${money_won}${
                emojies["coin"]
              }\nHävityt rahat: ${money_lost}${
                emojies["coin"]
              }\nNetto: ${netto}${emojies["coin"]}`
            }
          ]
        }
      };
    }

    function slot(user) {
      // SLOT
      var games = "Pelit: " + user["game_slot"]["games"] + "\n";

      var games_won =
        "Voitetut pelit: " + user["game_slot"]["games_won"] + "\n";

      var games_lost =
        "Hävityt pelit: " + user["game_slot"]["games_lost"] + "\n";

      var wp =
        "W%: " +
        (
          (user["game_slot"]["games_won"] * 100) /
          user["game_slot"]["games"]
        ).toFixed(2) +
        "%\n";

      var money_won =
        "Voitetut rahat: " +
        user["game_slot"]["money_won"] +
        emojies["coin"] +
        "\n";

      var money_lost =
        "Hävityt rahat: " +
        user["game_slot"]["money_lost"] +
        emojies["coin"] +
        "\n";

      var netto =
        "Netto: " +
        (user["game_slot"]["money_won"] - user["game_slot"]["money_lost"]) +
        emojies["coin"] +
        "\n";

      var all_bets =
        "Kaikki panokset: " +
        user["game_slot"]["all_bets"] +
        emojies["coin"] +
        "\n";

      var bet_average =
        "Panoksen keskiarvo: " +
        (user["game_slot"]["all_bets"] / user["game_slot"]["games"]).toFixed(
          2
        ) +
        emojies["coin"] +
        "\n";

      var title1 = "***Yksittäisvoitot:***\n";

      var poggers1 =
        emojies["poggers"] +
        "❌❌: " +
        user["game_slot"]["wins"]["poggers1"] +
        "\n";

      var sasu =
        emojies["sasu"] +
        emojies["sasu"] +
        emojies["sasu"] +
        ": " +
        user["game_slot"]["wins"]["sasu"] +
        "\n";

      var karvis =
        emojies["karvis"] +
        emojies["karvis"] +
        emojies["karvis"] +
        ": " +
        user["game_slot"]["wins"]["karvis"] +
        "\n";

      var poggers2 =
        emojies["poggers"] +
        emojies["poggers"] +
        "❌: " +
        user["game_slot"]["wins"]["poggers2"] +
        "\n";

      var alfa =
        emojies["alfa"] +
        emojies["alfa"] +
        emojies["alfa"] +
        ": " +
        user["game_slot"]["wins"]["alfa"] +
        "\n";

      var jesilmero =
        emojies["jesilmero"] +
        emojies["jesilmero"] +
        emojies["jesilmero"] +
        ": " +
        user["game_slot"]["wins"]["jesilmero"] +
        "\n";

      var poggers3 =
        emojies["poggers"] +
        emojies["poggers"] +
        emojies["poggers"] +
        ": " +
        user["game_slot"]["wins"]["poggers3"] +
        "\n";

      return {
        embed: {
          title: `***PELIDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___SLOT:___***",
              value:
                games +
                games_won +
                games_lost +
                wp +
                money_won +
                money_lost +
                netto +
                all_bets +
                bet_average +
                title1 +
                poggers1 +
                sasu +
                karvis +
                poggers2 +
                alfa +
                jesilmero +
                poggers3
            }
          ]
        }
      };
    }

    function bj(user) {

      var games = "Pelit: " + user["game_blackjack"]["games"] + "\n";

      var games_won =
        "Voitetut pelit: " + user["game_blackjack"]["games_won"] + "\n";

      var games_lost =
        "Hävityt pelit: " + user["game_blackjack"]["games_lost"] + "\n";

      var wp =
        "W%: " +
        (
          (user["game_blackjack"]["games_won"] * 100) /
          user["game_blackjack"]["games"]
        ).toFixed(2) +
        "%\n";

      var money_won =
        "Voitetut rahat: " +
        user["game_blackjack"]["money_won"] +
        emojies["coin"] +
        "\n";

      var money_lost =
        "Hävityt rahat: " +
        user["game_blackjack"]["money_lost"] +
        emojies["coin"] +
        "\n";

      var netto =
        "Netto: " +
        (user["game_blackjack"]["money_won"] -
          user["game_blackjack"]["money_lost"]) +
        emojies["coin"] +
        "\n";

      var all_bets =
        "Kaikki panokset: " +
        user["game_blackjack"]["all_bets"] +
        emojies["coin"] +
        "\n";

      var bet_average =
        "Panoksen keskiarvo: " +
        (
          user["game_blackjack"]["all_bets"] / user["game_blackjack"]["games"]
        ).toFixed(2) +
        emojies["coin"] +
        "\n";

      var cards_played =
        "Pelatut kortit: " + user["game_blackjack"]["cards_played"] + "\n";

      var title1 = "***Yksittäistiedot:*** \n";

      var _bj = "Blackjackit: " + user["game_blackjack"]["21"] + "\n";
      var over = "Yli 21: " + user["game_blackjack"]["over"] + "\n";
      var less = "Vähemmän kun 21: " + user["game_blackjack"]["less"] + "\n";
      var tie = "Tasapeli: " + user["game_blackjack"]["tie"] + "\n";
      var hit = "Hit: " + user["game_blackjack"]["hit"] + "\n";
      var stand = "Stand: " + user["game_blackjack"]["stand"] + "\n";
      var double = "Double: " + user["game_blackjack"]["double"] + "\n";

      return {
        embed: {
          title: `***PELIDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___BLACKJACK:___***",
              value:
                games +
                games_won +
                games_lost +
                wp +
                money_won +
                money_lost +
                netto +
                all_bets +
                bet_average +
                cards_played +
                title1 +
                _bj +
                over +
                less +
                tie +
                hit +
                stand +
                double
            }
          ]
        }
      };
    }

    function harpoon(user) {
      /// Harpoon
      // pelit
      var games = user["game_harpoon"]["games"];
      // Voitetut Pelit
      var games_won = user["game_harpoon"]["games_won"];
      // hävityt Pelit
      var games_lost = user["game_harpoon"]["games_lost"];
      // voitetut Rahat
      var money_won = user["game_harpoon"]["money_won"];
      // hävityt Rahat
      var money_lost = user["game_harpoon"]["money_lost"];
      // NEtto
      var netto = user["game_harpoon"]["money_won"] - user["game_harpoon"]["money_lost"];
      // OSUMAT
      var hits = user["game_harpoon"]["hits"];
      var hits_p = (user["game_harpoon"]["hits"] * 100 / user["game_harpoon"]["games"]).toFixed(2);
      // hai
      var shark = user["game_harpoon"]["targets"]["shark"];
      // palloon
      var balloon = user["game_harpoon"]["targets"]["balloon"];
      // valaaseen
      var whale = user["game_harpoon"]["targets"]["whale"];

      return {
        embed: {
          title: `***PELIDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___HARPOON:___***",
              value: `
              Pelit: ${games}
              Voitetut pelit: ${games_won} ${emojies["coin"]}
              Hävityt pelit: ${games_lost} ${emojies["coin"]}
              Voitetut rahat: ${money_won} ${emojies["coin"]}
              Hävityt rahat: ${money_lost} ${emojies["coin"]}
              Netto: ${netto} ${emojies["coin"]}
              Osumat: ${hits}
              Osumaprosentti: ${hits_p} %
              Hait: ${shark}
              Ilmapallot: ${balloon}
              Valaat: ${whale}`
            }
          ]
        }
      };
    }

    function fish(user) {

      var tier1 = "Ei suoritettu";
      var tier2 = "Ei suoritettu";
      var tier3 = "Ei suoritettu";
      if (user["game_kalastus"]["tier1_completed"]) {
        tier1 = "Suoritettu";
      }
      if (user["game_kalastus"]["tier2_completed"]) {
        tier2 = "Suoritettu";
      }
      if (user["game_kalastus"]["tier3_completed"]) {
        tier3 = "Suoritettu";
      }

      var avrg_w = (user["game_kalastus"]["all_fish_weight"]/user["game_kalastus"]["fish_caught"]).toFixed(2);
      var avrg_p = (user["game_kalastus"]["money_got"]/user["game_kalastus"]["fish_caught"]).toFixed(2);

      return {
        embed: {
          title: `***PELIDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___KALASTUS:___***",
              value: `
              Kalastettu: ${user["game_kalastus"]["fish_caught"]}
              Saadut rahat: ${user["game_kalastus"]["money_got"]} ${emojies["coin"]}
              Kaikkien kalojen paino: ${user["game_kalastus"]["all_fish_weight"].toFixed(2)} kg
              Keskiarvohinta: ${avrg_p} ${emojies["coin"]}
              Keskiarvopaino: ${avrg_w} kg`

            },
            {
              name: "***___Käytetty:___***",
              value: `
              ${emojies["sytti"]} Käytetyt sytit: ${user["game_kalastus"]["bait_consumed"]}
              ${emojies["supersytti"]} Käytetyt supersytit: ${user["game_kalastus"]["super_bait_consumed"]}
              ${emojies["hypersytti"]} Käytetyt hypersytit: ${user["game_kalastus"]["hyper_bait_consumed"]}
              ${emojies["onki"]} Onkea käytetty: ${user["game_kalastus"]["rod_used"]}
              ${emojies["superonki"]} Superonkea käytetty: ${user["game_kalastus"]["super_rod_used"]}
              ${emojies["hyperonki"]} Hyperonkea käytetty: ${user["game_kalastus"]["hyper_rod_used"]}
              Kalastettu meressä: ${user["game_kalastus"]["in_sea"]}
              Kalastettu järvessä: ${user["game_kalastus"]["in_lake"]}
              Kalastettu joessa: ${user["game_kalastus"]["in_river"]}
              Kalastettu pinnalta: ${user["game_kalastus"]["top"]}
              Kalastettu keskeltä: ${user["game_kalastus"]["mid"]}
              Kalastettu pohjasta: ${user["game_kalastus"]["bot"]}
              ${emojies["kalastusvene"]} Kalastusveneilty: ${user["game_kalastus"]["fishing_boat_used"]}`

            },
            {
              name: "***___KalaDex:___***",
              value: `
              KalaDex Tier1: ${tier1}
              KalaDex Tier2: ${tier2}
              KalaDex Tier3: ${tier3}`

            }
          ]
        }
      };
    }

    function ryhmäpeli(user) {

      var games = user["game_ryhmäpeli"]["games"];
      // Voitetut Pelit
      var games_won = user["game_ryhmäpeli"]["games_won"];
      // hävityt Pelit
      var games_lost = user["game_ryhmäpeli"]["games_lost"];
      // voitetut Rahat
      var money_won = user["game_ryhmäpeli"]["money_won"];
      // hävityt Rahat
      var money_lost = user["game_ryhmäpeli"]["money_lost"];
      // NEtto
      var netto = user["game_ryhmäpeli"]["money_won"] - user["game_ryhmäpeli"]["money_lost"];
      // OSUMAT
      var w_p = (games_won * 100 / games).toFixed(2);


      return {
        embed: {
          title: `***PELIDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___RYHMÄPELI:___***",
              value: `
              Pelit: ${games}
              Voitetut pelit: ${games_won} ${emojies["coin"]}
              Hävityt pelit: ${games_lost} ${emojies["coin"]}
              Voitetut rahat: ${money_won} ${emojies["coin"]}
              Hävityt rahat: ${money_lost} ${emojies["coin"]}
              Netto: ${netto} ${emojies["coin"]}
              Osumat: ${w_p} %`
            }
          ]
        }
      };
    }

    function ktem(user) {
      // KTEM
      // pelit
      // VOITETUT
      // Hävityt
      // W%
      // Keskiarvopanos
      // voitetut Rahat
      // hävityt Rahat
      // NEtto

      var games = user["game_KTEM"]["games"];
      // Voitetut Pelit
      var games_won = user["game_KTEM"]["games_won"];
      // hävityt Pelit
      var games_lost = user["game_KTEM"]["games_lost"];
      // voitetut Rahat
      var money_won = user["game_KTEM"]["money_won"];
      // hävityt Rahat
      var money_lost = user["game_KTEM"]["money_lost"];
      // NEtto
      var netto = user["game_KTEM"]["money_won"] - user["game_ryhmäpeli"]["money_lost"];
      // OSUMAT
      var w_p = (games_won * 100 / games).toFixed(2);

      var average_bet = Math.floor(user["game_KTEM"]["all_bets"] / games);



      return {
        embed: {
          title: `***PELIDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___KTEM:___***",
              value: `
              Pelit: ${games}
              Voitetut pelit: ${games_won} ${emojies["coin"]}
              Hävityt pelit: ${games_lost} ${emojies["coin"]}
              Voitetut rahat: ${money_won} ${emojies["coin"]}
              Hävityt rahat: ${money_lost} ${emojies["coin"]}
              Netto: ${netto} ${emojies["coin"]}
              Voittoprosentti: ${w_p} %
              Keskiarvopanos: ${average_bet} ${emojies["coin"]}`
            }
          ]
        }
      };
    }
  },

  data: async msg => {
    let name = msg.content.split(" ")[1];
    let edit = "";

    if (name == "" || name === undefined) {
      name = msg.author.id;
    }
    name = name.replace(/\D/g, "");

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return msg.channel.send(`Kelvoton nimi.`);

    var target_id = name;
    await check_user_in_database(target_id);
    var user = await get_user(target_id);
    print_generaldata(user);

    function print_generaldata(user) {
      // rahat
      var money =
        "`Rahat:` " + user["inventory"]["money"] + emojies["coin"] + "\n";
      // Aktiivisuus
      var activity =
        "`Aktiivisuus:` " +
        user["basic_statistics"]["minutes_on_channel"] +
        " mins\n";
      // PERUSTULO
      var income =
        "`Perustulo:` " +
        user["inventory"]["income"] +
        emojies["coin"] +
        "/min\n";
      // Peak money
      var peak_money =
        "`Peakrahat:` " +
        user["basic_statistics"]["peak_money"] +
        emojies["coin"] +
        "\n";
      // Omaisuus
      var solo_minutes =
        "`Solo minuutit:` " + user["basic_statistics"]["solo_minutes"]+ "\n";
      var wealth =
        "`Omaisuus:` " + calculate_wealth(user) + emojies["coin"] + "\n";
      // Ostetut perustulot
      var income_bought =
        "`Ostetut perustulot:` " +
        user["basic_statistics"]["income_bought"] +
        "\n";
      // Perustuloista saadut Rahat
      var money_from_incomes =
        "`Perustuloista saadut rahat:` " +
        user["basic_statistics"]["money_from_incomes"] +
        emojies["coin"] +
        "\n";

      // sakot
      var fines =
        "`Sakot:` " +
        user["basic_statistics"]["fines"] +
        emojies["coin"] +
        "\n";
      // korvaukset
      var compensations =
        "`Korvaukset:` " +
        user["basic_statistics"]["compensations"] +
        emojies["coin"] +
        "\n";
      // varastut Rahat
      var money_stolen =
        "`Rahat varastettu muilta:` " +
        user["basic_statistics"]["money_stolen"] +
        emojies["coin"] +
        "\n";
      // sulta varastetut Rahat
      var money_stolen_from_you =
        "`Muut varastaneet:` " +
        user["basic_statistics"]["money_stolen_from_you"] +
        emojies["coin"] +
        "\n";
      // Lyöty kepillä
      var hit =
        "`Muut lyöneet kepillä:` " + user["basic_statistics"]["hit"] + "\n";
      // Keppiä käytetty
      var stick_used =
        "`Käytetyt kepit:` " + user["basic_statistics"]["stick_used"] + "\n";
      // Pommitettu
      var bombed =
        "`Muut pommittaneet:` " + user["basic_statistics"]["bombed"] + "\n";
      // Pommia käytetty
      var bomb_used =
        "`Käytetyt pommit:` " + user["basic_statistics"]["bomb_used"] + "\n";

      // Lootboxit afkaamalla
      var loot_afk =
        "`LootBoxit Afkaamalla:` " +
        (user["basic_statistics"]["lootboxes_by_afking_common"] + user["basic_statistics"]["lootboxes_by_afking_uncommon"] + user["basic_statistics"]["lootboxes_by_afking_rare"] + user["basic_statistics"]["lootboxes_by_afking_epic"] + user["basic_statistics"]["lootboxes_by_afking_legendary"] ) +
        "\n";
      // Lootboxit pelaamalla
      var loot_game =
        "`LootBoxit Pelaamalla:` " +
        (user["basic_statistics"]["lootboxes_by_playing_common"] + user["basic_statistics"]["lootboxes_by_playing_uncommon"] + user["basic_statistics"]["lootboxes_by_playing_rare"] + user["basic_statistics"]["lootboxes_by_playing_epic"] + user["basic_statistics"]["lootboxes_by_playing_legendary"] ) +
        "\n";
      // common / minuutti
      var common_min =
        "`Common LootBoxit / 1k min:` " +
        (
          ((user["basic_statistics"]["opened_lootboxes"]["common"] +
            user["inventory"]["lootboxes"]["common"]) *
            1000) /
          user["basic_statistics"]["minutes_on_channel"]
        ).toFixed(2) +
        "\n";
      // uncommon / minuutti
      var uncommon_min =
        "`Unommon LootBoxit / 1k min:` " +
        (
          ((user["basic_statistics"]["opened_lootboxes"]["uncommon"] +
            user["inventory"]["lootboxes"]["uncommon"]) *
            1000) /
          user["basic_statistics"]["minutes_on_channel"]
        ).toFixed(2) +
        "\n";
      // rare / minuutti
      var rare_min =
        "`Rare LootBoxit / 1k min:` " +
        (
          ((user["basic_statistics"]["opened_lootboxes"]["rare"] +
            user["inventory"]["lootboxes"]["rare"]) *
            1000) /
          user["basic_statistics"]["minutes_on_channel"]
        ).toFixed(2) +
        "\n";
      // epic / minuutti
      var epic_min =
        "`Epic LootBoxit / 1k min:` " +
        (
          ((user["basic_statistics"]["opened_lootboxes"]["epic"] +
            user["inventory"]["lootboxes"]["epic"]) *
            1000) /
          user["basic_statistics"]["minutes_on_channel"]
        ).toFixed(2) +
        "\n";
      // legendary / minuutti
      var legendary_min =
        "`Legendary LootBoxit / 1k min:` " +
        (
          ((user["basic_statistics"]["opened_lootboxes"]["legendary"] +
            user["inventory"]["lootboxes"]["legendary"]) *
            1000) /
          user["basic_statistics"]["minutes_on_channel"]
        ).toFixed(2) +
        "\n";
      // Rahat lootboxeista
      var money_from_boxes =
        "`Rahat LootBoxeista:` " +
        user["basic_statistics"]["money_from_opening_lootboxes"] +
        emojies["coin"] +
        "\n";

      // Rahat tulokoneista
      var income_machine =
        "`Rahat tulokoneista:` " +
        user["basic_statistics"]["money_from_income_machines"] +
        emojies["coin"] +
        "\n";
      // Imetyt Rahat
      var money_absorbed =
        "`Imetyt tulot:` " +
        user["basic_statistics"]["money_absorbed_to_you"] +
        emojies["coin"] +
        "\n";
      // sulta imetyt Rahat
      var money_absorbed_from_you =
        "`Muut imeneet tuloa:` " +
        user["basic_statistics"]["money_absorbed_from_you"] +
        emojies["coin"] +
        "\n";

      var sticked_money =
        "`Kepillä poistetut rahat:` " +
        user["basic_statistics"]["sticked_money"] +
        emojies["coin"] +
        "\n";
      var sticked_money_y =
        "`Sulta kepitetyt rahat:` " +
        user["basic_statistics"]["sticked_money_from_you"] +
        emojies["coin"] +
        "\n";
      var bombed_money =
        "`Sun pommittamat rahat:` " +
        user["basic_statistics"]["bombed_money"] +
        emojies["coin"] +
        "\n";
      var bombed_money_y =
        "`Sulta pommitetut rahat:` " +
        user["basic_statistics"]["bombed_money_from_you"] +
        emojies["coin"] +
        "\n";

      var uz = client.users.get(user["id"]);
      var avatar = uz.avatarURL;

      msg.channel.send({
        embed: {
          title: `***YLEISDATA: ***`,
          color: user["info"]["color"],
          author: {
            name: user["name"],
            icon_url: avatar
          },
          fields: [
            {
              name: "***___Yleistä:___***",
              value:
                money +
                activity +
                income +
                peak_money +
                solo_minutes +
                wealth +
                income_bought +
                money_from_incomes
            },
            {
              name: "***___Väkivalta ja muu paska:___***",
              value:
                fines +
                compensations +
                money_stolen +
                money_stolen_from_you +
                stick_used + sticked_money +
                hit + sticked_money_y +
                bomb_used + bombed_money +
                bombed + bombed_money_y
            },
            {
              name: "***___LootBoxit:___***",
              value:
                loot_afk +
                loot_game +
                common_min +
                uncommon_min +
                rare_min +
                epic_min +
                legendary_min +
                money_from_boxes
            },
            {
              name: "***___Tulokoneet ja Tuloimut:___***",
              value: income_machine + money_absorbed + money_absorbed_from_you
            }
          ]
        }
      });
    }
  },

  yhteisdata: async msg => {
    var users;
    msg.delete();
    bot_users.once("value", async function(u) {
      users = u.val();
      var message;
      await msg.channel.send(await activity(users)).then(async m => {
        message = m;
        await message.react("1⃣");
        await message.react("2⃣");
        await message.react("3⃣");
        await message.react("4⃣");
        await message.react("5⃣");
      });

      let co = message.createReactionCollector(
        (reaction, _user) => !_user.bot,
        {
          time: 10 * 60 * 1000
        }
      );

      co.on("collect", async (reaction, _user) => {
        var all_users = await reaction.fetchUsers();
        for (var _u of all_users) {
          if (!_u[1].bot) {
            reaction.remove(_u[1].id);
          }
        }
        if (reaction.emoji == "1⃣") {
          message.edit(await activity(users));
        } else if (reaction.emoji == "2⃣") {
          message.edit(await money(users));
        } else if (reaction.emoji == "3⃣") {
          message.edit(await peak(users));
        } else if (reaction.emoji == "4⃣") {
          message.edit(await owns(users));
        }
        else if (reaction.emoji == "5⃣") {
          message.edit(await solo(users));
        }
      });

      co.on("end", () => {
        message.delete();
        co.stop();
      });

      async function activity(users) {
        var w_l = {};
        for (var id in users) {
          await check_user_in_database(id);

          key = id;
          value = users[id]["basic_statistics"]["minutes_on_channel"];
          w_l[key] = value;
        }

        var items = Object.keys(w_l).map(function(key) {
          return {
            id: key,
            val: w_l[key]
          };
        });

        items = items.sort(function(a, b) {
          return a.val > b.val ? -1 : a.val == b.val ? 0 : 1;
        });

        most_active_list = "";

        var len = items.length;
        if (items.length > 20) {
          len = 20;
        }

        for (var i = 0; i < len; i++) {
          most_active_list +=
            i + 1 + ". <@" + items[i].id + "> : " + items[i].val + " mins\n";
        }

        return {
          embed: {
            title: "***AKTIIVISIMMAT***",
            color: users[msg.author.id]["info"]["color"],
            description: most_active_list,
            footer: {
              text: "1. Aktiivisimmat, 2. Rikkaimmat, 3. Peakrahat, 4. Omaisuus, 5. Solominuutit"
            }
          }
        };
      }

      async function money(users) {
        var w_l = {};
        for (var id in users) {
          await check_user_in_database(id);

          key = id;
          value = users[id]["inventory"]["money"];
          w_l[key] = value;
        }

        var items = Object.keys(w_l).map(function(key) {
          return {
            id: key,
            val: w_l[key]
          };
        });

        items = items.sort(function(a, b) {
          return a.val > b.val ? -1 : a.val == b.val ? 0 : 1;
        });

        list = "";

        var len = items.length;
        if (items.length > 20) {
          len = 20;
        }

        for (var i = 0; i < len; i++) {
          list +=
            i +
            1 +
            ". <@" +
            items[i].id +
            "> : " +
            items[i].val +
            emojies["coin"] +
            " (" +
            users[items[i].id]["inventory"]["income"] +
            emojies["coin"] +
            "/min)\n";
        }

        return {
          embed: {
            title: "***RIKKAIMMAT***",
            color: users[msg.author.id]["info"]["color"],
            description: list,
            footer: {
              text: "1. Aktiivisimmat, 2. Rikkaimmat, 3. Peakrahat, 4. Omaisuus, 5. Solominuutit"
            }
          }
        };
      }

      async function peak(users) {
        var w_l = {};
        for (var id in users) {
          await check_user_in_database(id);

          key = id;
          value = users[id]["basic_statistics"]["peak_money"];
          w_l[key] = value;
        }

        var items = Object.keys(w_l).map(function(key) {
          return {
            id: key,
            val: w_l[key]
          };
        });

        items = items.sort(function(a, b) {
          return a.val > b.val ? -1 : a.val == b.val ? 0 : 1;
        });

        list = "";

        var len = items.length;
        if (items.length > 20) {
          len = 20;
        }

        for (var i = 0; i < len; i++) {
          list +=
            i +
            1 +
            ". <@" +
            items[i].id +
            "> : " +
            items[i].val +
            emojies["coin"] +
            "\n";
        }

        return {
          embed: {
            title: "***PEAKRAHAT***",
            color: users[msg.author.id]["info"]["color"],
            description: list,
            footer: {
              text: "1. Aktiivisimmat, 2. Rikkaimmat, 3. Peakrahat, 4. Omaisuus, 5. Solominuutit"
            }
          }
        };
      }

      async function solo(users) {
        var w_l = {};
        for (var id in users) {
          await check_user_in_database(id);

          key = id;
          value = users[id]["basic_statistics"]["solo_minutes"];
          w_l[key] = value;
        }

        var items = Object.keys(w_l).map(function(key) {
          return {
            id: key,
            val: w_l[key]
          };
        });

        items = items.sort(function(a, b) {
          return a.val > b.val ? -1 : a.val == b.val ? 0 : 1;
        });

        list = "";

        var len = items.length;
        if (items.length > 20) {
          len = 20;
        }

        for (var i = 0; i < len; i++) {
          list +=
            i +
            1 +
            ". <@" +
            items[i].id +
            "> : " +
            items[i].val +
            " mins" +
            "\n";
        }

        return {
          embed: {
            title: "***SOLOMINUUTIT***",
            color: users[msg.author.id]["info"]["color"],
            description: list,
            footer: {
              text: "1. Aktiivisimmat, 2. Rikkaimmat, 3. Peakrahat, 4. Omaisuus, 5. Solominuutit"
            }
          }
        };
      }

      async function owns(users) {
        var w_l = {};
        for (var id in users) {
          await check_user_in_database(id);

          key = id;
          value = calculate_wealth(users[id]);
          w_l[key] = value;
        }

        var items = Object.keys(w_l).map(function(key) {
          return {
            id: key,
            val: w_l[key]
          };
        });

        items = items.sort(function(a, b) {
          return a.val > b.val ? -1 : a.val == b.val ? 0 : 1;
        });

        list = "";

        var len = items.length;
        if (items.length > 20) {
          len = 20;
        }

        for (var i = 0; i < len; i++) {
          list +=
            i +
            1 +
            ". <@" +
            items[i].id +
            "> : " +
            items[i].val +
            emojies["coin"] +
            "\n";
        }

        return {
          embed: {
            title: "***OMAISUUS***",
            color: users[msg.author.id]["info"]["color"],
            description: list,
            footer: {
              text: "1. Aktiivisimmat, 2. Rikkaimmat, 3. Peakrahat, 4. Omaisuus, 5. Solominuutit"
            }
          }
        };
      }
    });
  },

  // tapahtumat

  // boxisade

  pääpäivä: msg => {
    var date = new Date();
    date_array = [date.getDate(), date.getMonth(), date.getYear()];

    let second = msg.content.split(" ")[1];

    if (second != undefined) {
      second = second.toLowerCase();
    }
    var pp = firebase
      .database()
      .ref("global_data/pääpäivä")
      .once("value", d => {
        var pp = d.val();
        if (pp == undefined) {
          pp = {
            on: false,
            date: [0, 0, 0]
          };
        }

        if (second == "on") {
          if (
            !msg.member.roles.some(r =>
              ["Admin", "Aktiivinen"].includes(r.name)
            )
          )
            return msg.channel.send(
              "Sulla ei ole oikeuksia määrittää pääpäivää!"
            );
          pp["date"] = date_array;
          change_title("PÄÄPÄIVÄ");
          if (pp["on"]) {
            msg.channel.send("Tänään on jo pääpäivä!");
          } else {
            pp["on"] = true;
            msg.channel.send("Nyt se on päätetty! Tänään on pääpäivä!");
          }
          firebase
            .database()
            .ref("global_data/pääpäivä")
            .set(pp);
        } else if (second == "ei") {
          if (
            !msg.member.roles.some(r =>
              ["Admin", "Aktiivinen"].includes(r.name)
            )
          )
            return msg.channel.send(
              "Sulla ei ole oikeuksia määrittää pääpäivää!"
            );
          change_title("ttunes");
          if (pp["on"]) {
            msg.channel.send("Ei olekaan pääpäivä :(");
          } else {
            msg.channel.send("Eihä tänää ollukkaa pääpäivä...");
          }

          pp["on"] = false;
          pp["date"] = [0, 0, 0];
          firebase
            .database()
            .ref("global_data/pääpäivä")
            .set(pp);
        } else {
          if (pp["on"] == true) {
            msg.channel.send("Tänään on pääpäivä!");
          } else if (pp["on"] == false) {
            msg.channel.send("Tänään ei ole pääpäivä :(");
          }
        }
      });
  },

  dj: msg => {
    var dj = firebase
      .database()
      .ref("global_data")
      .once("value", d => {
        var g = d.val();
        if (g["dj"] == undefined) {
          if (msg.member.voiceChannel === undefined)
            return msg.channel.send(
              "Kaikkien ehdokkaiden pitää olla voicekannulla, myös sun!"
            );
          if (g["pääpäivä"]["on"] == false) return msg.channel.send("Eihän tänään ees oo pääpäivä...");
          var in_channel = msg.member.voiceChannel.members.keyArray();
          var rnd = Math.floor(Math.random() * Math.floor(in_channel.length));
          g["dj"] = in_channel[rnd];
          msg.channel.send("Pääpäivän DJ on <@" + g["dj"] + ">!");
        } else {
          msg.channel.send(
            "Pääpäivän DJ on jo valittu, ttunettaja on <@" + g["dj"] + ">!"
          );
        }
        firebase
          .database()
          .ref("global_data/dj")
          .set(g["dj"]);
      });
  },

  onkokarvisvammanen: msg => {
    msg.channel.send("ON");
  },

  onkovammanen: msg => {
    let dude = msg.content.split(" ")[1];
    if (dude == "" || dude === undefined)
      return msg.channel.send(`Ketä tarkoitat?`);

    result = Math.floor(Math.random() * Math.floor(2));

    if (result === 1) {
      msg.channel.send(dude + " on vammanen.");
    } else {
      msg.channel.send(dude + " ei ole vammanen");
    }
  },

  wednesday: msg => {
    //IS IT WEDNESDAY MY DUDES?
    let this_date = new Date();
    let day = this_date.getDay();

    if (day == 3) {
      msg.channel.send("", {file: "https://i.imgur.com/NcE2HFK.jpg"});
    } else {
      msg.channel.send("", {file: "https://i.imgur.com/hlNUbYt.jpg"});
    }
  },

  juo: msg => {
    check_user_in_database(msg.author.id).then(() => {
      get_user(msg.author.id).then(user => {
        if (user["inventory"]["items"]["ES"] <= 0)
          return msg.channel.send("Sulla ei oo juotavaa... ostas ES");

        user["inventory"]["items"]["ES"] -= 1;
        user["inventory"]["items"]["ES_can"] += 1;

        const answers = [
          "Bärbär",
          "ES jumalten juoma, jonnen parhain kuoma!",
          "Saa keulisuitn moposi!",
          "Nothing interesting happens.",
          "You drink ES. It makes you feel dizzy...",
          "Tshiiii, kruts... glug glug glug... aah",
          "" + emojies["ES"] + emojies["alfa"] + emojies["ES"],
          "" + emojies["ES"] + emojies["pogges"],
          "5/5",
          "Olis testis...",
          "ES > MF",
          "Joit ES ennätysajassa, toivoisit saavasi lisää...",
          "Oletko maistanu es-hyytelöä?",
          emojies["ES"] + ":boy:" + emojies["ES"],
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
        save_user(user);
      });
    });
  },

  apustus: async msg => {
    await check_user_in_database(msg.author.id);
    var user = await get_user(msg.author.id);

    msg.channel.send({
      embed: {
        title: "***bOtter-Apustus***",
        color: user["info"]["color"],
        fields: [
          {
            name: "***___Komennot:___***",
            value:
              "Kaikki käytössä olevat komennot löytyvät tältä sivulta:\n[Linkki](https://docs.google.com/document/d/1f35NFVZqeKubRP8YN2J7rou6528KLV289mxgtA6CcrI/edit)"
          },
          {
            name: "***___Ohjeet:___***",
            value:
              "Täältä löydät pelien ohjeet, todennäköisyyksiä ja muuta nippelitietoa.\nTulossa!"
          },
          {
            name: "***___BotterData:___***",
            value:
              "Täältä löydät tilastoja ja dataa bOtterin peleihin ja kaikkeen liittyen.\nTulossa!"
          },
          {
            name: "***___Patchnotet:___***",
            value:
              "Täällä on kirjattu kaikki bOtteriin tehdyt muutokset.\nTulossa!"
          }
        ]
      }
    });
  },

  ilmoitukset: async msg => {
    await check_user_in_database(msg.author.id);
    var user = await get_user(msg.author.id);

    if (user["info"]["notifications"]) {
      user["info"]["notifications"] = false;
      msg.channel.send("Ilmoitukset pois päältä!");
    } else {
      user["info"]["notifications"] = true;
      msg.channel.send("Ilmoitukset päällä!");

    }
    save_user(user);
  },

  // Tool Commands

  siirräsaldo: msg => {
    if (msg.author.id != "247754056804728832") return msg.delete();

    let name = msg.content.split(" ")[1];
    let amount = msg.content.split(" ")[2];

    if (amount == "" || amount === undefined) {
      amount = 1;
    }

    if (amount.slice(-1) == "k") {
      amount = Math.floor(1000*parseFloat(amount));
    }
    else if (amount.slice(-1) == "m") {
      amount = Math.floor(1000000*parseFloat(amount));
    }

    if (name == "" || name === undefined) return;
    if (isNaN(amount)) return;
    if (amount == undefined || amount == "") return;

    name = name.replace(/\D/g, "");

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return;

    var target_id = name;

    check_user_in_database(target_id).then(() => {
      get_user(target_id).then(user => {
        user["inventory"]["money"] += parseInt(amount);

        check_peak(user);

        var mark = "+";
        if (amount < 0) {
          mark = "";
        }
        msg.channel.send(
          "<@" + target_id + "> saldoa muutettu " + mark + amount + "!"
        );
        msg.delete();
        save_user(user);
      });
    });
  },

  muutasaldo: msg => {
    if (msg.author.id != "247754056804728832") return msg.delete();

    if (amount == "" || amount === undefined) {
      amount = 1;
    }

    if (amount.slice(-1) == "k") {
      amount = Math.floor(1000*parseFloat(amount));
    }
    else if (amount.slice(-1) == "m") {
      amount = Math.floor(1000000*parseFloat(amount));
    }

    let name = msg.content.split(" ")[1];
    let amount = msg.content.split(" ")[2];

    if (name == "" || name === undefined) return;
    if (isNaN(amount)) return;
    if (amount == undefined || amount == "") return;

    name = name.replace(/\D/g, "");

    var u;
    var flag = false;
    for (u in client.users.array()) {
      var User = client.users.array()[u];
      if (User.id == name) {
        flag = true;
      }
    }

    if (!flag) return;

    var target_id = name;

    check_user_in_database(target_id).then(() => {
      get_user(target_id).then(user => {
        user["inventory"]["money"] = parseInt(amount);

        check_peak(user);

        var mark = "+";
        if (amount < 0) {
          mark = "";
        }
        msg.channel.send(
          "<@" + target_id + ">: saldo asetettu " + mark + amount + "!"
        );
        msg.delete();
        save_user(user);
      });
    });
  },

  sano: msg => {
    if (msg.author.id != "247754056804728832") return msg.delete();
    let text_parts = msg.content.split(" ");
    str = "";
    for (var i = 1; i < text_parts.length; i++) {
      str += text_parts[i] + " ";
    }
    msg.channel.send(str);
    return msg.delete();
  },

  purge: msg => {
    // This command removes all messages from all users in the channel, up to 100.
    if (msg.author.id != "247754056804728832") return msg.delete();
    let amount = msg.content.split(" ")[1];
    // get the delete count, as an actual number.
    if (amount == "" || amount === undefined) {
      msg.channel.send("Kirjoita !purge ja määrä");
      return;
    }

    if (isNaN(amount))
      return msg.channel.send("Purge tarvitsee olla positiivinen luku");
    if (amount < 1) return msg.channel.send(`Purge pitää olla vähintään 1 `);

    amount = Math.floor(amount);

    // So we get our messages, and delete them. Simple enough, right?
    msg.channel
      .fetchMessages({
        limit: amount + 1
      })
      .then(fetch => {
        msg.channel
          .bulkDelete(fetch)
          .catch(error => msg.reply(`Ei voitu purgea syystä: ${error}`));
      });
  },

  ping: msg => {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    msg.channel.send("Ping?").then(m => {
      m.edit(
        `Pong! Viive on ${m.createdTimestamp -
          msg.createdTimestamp}ms. API viive on ${Math.round(client.ping)}ms`
      );
    });
  }

};

var emojies = {};

function loadEmojies() {
  emoji_array = client.emojis.array();
  for (let emoji of emoji_array) {
    emojies[emoji.name] = client.emojis.find(x => x.name == emoji.name);
  }
}

// When bot is ready
client.on("ready", () => {
  loadEmojies();
  check_stun();
  console.log(
    `Bot has started, with ${client.users.size} users, in ${
      client.channels.size
    } channels of ${client.guilds.size} guilds.`
  );

  setTimeout(function(){
    process.exit(0);
  }, 60 * 60 * 1000);

  var date = new Date();
  var date_array = [date.getDate(), date.getMonth(), date.getYear()];
  var day = date.getDay();

  check_pääpäivä().then( v => {
    if (v) {
      change_title("PÄÄPÄIVÄ");
    } else if (day === 3) {
      change_title("Wednesday");
    } else {
      change_title("ttunes");
    }
  });
});

// When message is recieved
const banned_textchannels = ["442466922831806475"];
client.on("message", async msg => {
  if (msg.author.bot) return;
  console.log(get_stun());

  if (msg.content.indexOf(tokens.prefix) !== 0) return;
  if (!msg.content.startsWith(tokens.prefix)) return;

  if ((get_stun()).includes(msg.author.id)) return msg.channel.send("Olet stunneissa.");

  if (!(msg.content).includes("purge")) {
    if (banned_textchannels.includes(msg.channel.id)) {
      msg.delete();
      return;
    }
  }

  if (!(msg.content).includes("sano")) {
    if (!(msg.content).includes("rahat")) {
      msg.content = (msg.content).toLowerCase().replace(tokens.prefix + "r", tokens.prefix + "rahat");
    }
    if (!(msg.content).includes("inv") && !(msg.content).includes("ilmoitukset")) {
      msg.content = (msg.content).toLowerCase().replace(tokens.prefix + "i", tokens.prefix + "inv");
    }
    if ((msg.content.split(" ")[0]) == "!s") {
      msg.content = (msg.content).toLowerCase().replace(tokens.prefix + "s", tokens.prefix + "status");
    }
  }


  if (
    commands.hasOwnProperty(
      msg.content
        .toLowerCase()
        .slice(tokens.prefix.length)
        .split(" ")[0]
    )
  )
    commands[
      msg.content
        .toLowerCase()
        .slice(tokens.prefix.length)
        .split(" ")[0]
    ](msg);
});

client.on("error", e => {
  console.log(e);
});

const banned_channels = ["300242143702679552", "404378873380470786"];

var minute_count = 0;
setInterval(async function() {
  var users;
  var global;
  await bot_users.on("value", async function(u) {
    users = u.val();
  });
  await global_data.once("value", async function(g) {
    global = g.val();
  });

  // Happens every time user is active on voicechannel
  var voicechannels_array = client.channels.keyArray();
  for (var i of voicechannels_array) {
    var channel = client.channels.get(i);
    if (channel.type == "voice" && !banned_channels.includes(channel.id)) {
      var channel_members = channel.members.keyArray();
      for (var n = 0; n < channel_members.length; n++) {
        var memb = channel.members.get(channel_members[n]);
        if (memb.user.bot) {
          console.log("Botti kannulla!");
          channel_members.splice(n, 1);

        }
      }

      var temp_len = channel_members.length;
      for (var m of channel_members) {
        var usr = channel.members.get(m);
        if (!usr.deaf && !usr.user.bot) {

          await check_user_in_database(usr.id);
          if (temp_len == 1) {
            console.log("Solojäbä: " + m);
            await add_solo(m);
          }
          await add_income(usr.id);
          await draw_lootbox(usr.id, 45, false);


        }
      }
    }
  }

  await bot_users.once("value", async function(u) {
    users = u.val();
  });

  // Happens anyways
  var server_members = client.users.keyArray();
  for (var m of server_members) {
    if (m in users) {
      // Absorber
      if ("income_absorb" in users[m]) {

        users[m]["income_absorb"]["timer"] -= 1;
        if (users[m]["income_absorb"]["timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(
              "Tuloimusi loppui, <@" +
                m +
                ">. Imit yhteensä: " +
                users[m]["income_absorb"]["sum"] +
                emojies["coin"]
            );
          delete users[m].income_absorb;
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/income_absorb")
            .set(null);
        }
      }

      if ("stun_timer" in users[m]) {
        users[m]["stun_timer"]["timer"] -= 1;
        if (users[m]["stun_timer"]["timer"] == 0) {
          (global["stunned"]).splice( (global["stunned"]).indexOf("" + m), 1 );
          users[m]["stun_timer"] = null;

          client.channels
            .get("280272696560975872")
            .send(
              "Stunnisi päättyi loppui <@" +
                m + ">"
            );

          await firebase
            .database()
            .ref(global_data)
            .set(global);

        }
      }

      if ("absorb_target" in users[m]) {
        users[m]["absorb_target"]["timer"] -= 1;
        if (users[m]["absorb_target"]["timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(
              "<@" +
                m +
                ">, Menetit yhteensä: " +
                users[m]["absorb_target"]["sum"] +
                emojies["coin"]
            );
          delete users[m].absorb_target;
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/absorb_target")
            .set(null);
        }
      }

      // Income Machine
      if ("income_machine" in users[m]) {
        if (user_under_income(users[m])) {
          users[m]["inventory"]["money"] +=
            users[m]["income_machine"]["multi"] *
              users[m]["inventory"]["income"] -
            users[m]["inventory"]["income"]; // laittaa pelkät tulokone rahat
          users[m]["income_machine"]["sum"] +=
            users[m]["income_machine"]["multi"] *
              users[m]["inventory"]["income"] -
            users[m]["inventory"]["income"];

          if ("absorb_target" in users[m]) {
            if (user_under_income(users[m]["absorb_target"]["absorber"])) {
              users[m]["basic_statistics"]["money_from_income_machines"] -=
                users[m]["income_machine"]["multi"] *
                  users[m]["inventory"]["income"] -
                users[m]["inventory"]["income"]; // poistaa incomerahat jos joku
              users[m]["inventory"]["money"] -=
                users[m]["income_machine"]["multi"] *
                  users[m]["inventory"]["income"] -
                users[m]["inventory"]["income"];
            }
          }
          users[m]["basic_statistics"]["money_from_income_machines"] +=
            users[m]["income_machine"]["multi"] *
              users[m]["inventory"]["income"] -
            users[m]["inventory"]["income"];
        }

        users[m]["income_machine"]["timer"] -= 1;
        if (users[m]["income_machine"]["timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(
              "<@" +
                m +
                ">, Tulokoneesi on päättynyt... Sait: " +
                users[m]["income_machine"]["sum"] +
                emojies["coin"]
            );
          delete users[m].income_machine;
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/income_machine")
            .set(null);
        }
      }

      if ("security_cam" in users[m]) {
        users[m]["security_cam"]["timer"] -= 1;
        if (users[m]["security_cam"]["timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(
              "<@" +
                m +
                ">, Valvontasi on päättynyt... Valvonta suojasi " +
                users[m]["security_cam"]["protected"] +
                " tapausta!"
            );
          delete users[m].security_cam;
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/security_cam")
            .set(null);
        }
      }

      if ("timemachine_timer" in users[m]) {
        users[m]["timemachine_timer"]["timer"] -= 1;
        if (users[m]["timemachine_timer"]["timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(
              "<@" +
                m +
                ">, Aikakone palautti sinut taas normaaliin ulottuvuuteen..."
            );
          delete users[m].timemachine_timer;
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/timemachine_timer")
            .set(null);
        }
      }

      if (users[m]["inventory"]["key_items"]["bush"]["on"]) {
        users[m]["inventory"]["key_items"]["bush"]["timer"] -= 1;
        if (users[m]["inventory"]["key_items"]["bush"]["timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(
              "<@" +
                m +
                ">, Puska kuihtui ajan myötä... ");
        users[m]["inventory"]["key_items"]["bush"]["timer"] = 10080;
        users[m]["inventory"]["key_items"]["bush"]["on"] = false;
        users[m]["inventory"]["key_items"]["bush"]["own"] = false;
        }
      }

      if ("fishing_timer" in users[m]) {
        users[m]["fishing_timer"]["timer"] -= 1;
        if (users[m]["fishing_timer"]["timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(fish_caught(users[m], users));
          await check_kaladex(users[m]);
          await delete users[m].fishing_timer;
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/fishing_timer")
            .set(null);
        }
      }

      if ("fishing_boat_timer" in users[m]) {
        if (!("boat_timer" in users[m])) {
          users[m]["boat_timer"] = 0;
          for (var fish of users[m]["fishing_boat_timer"]) {
            users[m]["boat_timer"] += fish["timer"];
          }
        }

        users[m]["boat_timer"] -= 1;
        if (users[m]["boat_timer"] == 0) {
          client.channels
            .get("280272696560975872")
            .send(fishes_caught(users[m], users));
          check_kaladex(users[m]);
          delete users[m].fishing_boat_timer;
          delete users[m].boat_timer;
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/fishing_boat_timer")
            .set(null);
          await firebase
            .database()
            .ref("users/" + users[m]["id"] + "/boat_timer")
            .set(null);
        }
      }

      await check_kaladex(users[m]);

      // Check if peak
      await check_peak(users[m]);
    }
  }

  await save_all_users(users);
  await check_income_absorbtion();


  var date = new Date();
  var date_array = [date.getDate(), date.getMonth(), date.getYear()];
  var day = date.getDay();

  // Setting up "Title"
  if (global["pääpäivä"]["on"]) {
    change_title("PÄÄPÄIVÄ");
  } else if (day === 3) {
    change_title("Wednesday");
  } else {
    change_title("ttunes");
  }


  // Next day
  if (date_array[0] != global["pääpäivä"]["date"][0] || date_array[1] != global["pääpäivä"]["date"][1] || date_array[2] != global["pääpäivä"]["date"][2]) {
    global["pääpäivä"]["on"] = false;
    delete global["dj"];
    global["pääpäivä"]["date"] = [0, 0, 0];
    firebase
      .database()
      .ref("global_data")
      .set(global);
  }

  minute_count += 1;
  console.log("Intervalli meni! (" + minute_count + ")");
}, 60000 / 10);

// Bot login
client.login(tokens.d_token);
