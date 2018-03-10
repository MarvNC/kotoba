'use strict'
const reload = require('require-reload')(require);
const getPronounceInfo = reload('./../kotoba/get_pronounce_info.js');
const constants = reload('./../kotoba/constants.js');

function createEmbedContent() {
  return {
    embed: {
      color: constants.EMBED_NEUTRAL_COLOR,
    },
  };
}

function createNotFoundResult(msg, pronounceInfo) {
  let content = createEmbedContent();
  let query = pronounceInfo.query;
  content.embed.description = `I didn't find any results for **${query}**.`;

  return msg.channel.createMessage(content, null, msg);
}

function createNoSuffixResult(msg) {
  let content = createEmbedContent();
  content.embed.description = 'Say **k!pronounce [word]** to see pronunciation information for a word. For example: **k!pronounce 瞬間**';

  return msg.channel.createMessage(content, null, msg);
}

function underlineStringAtIndices(string, indices) {
  let underline = false;
  let outString = '';
  for (let i = 0; i < string.length; ++i) {
    let char = string[i];
    let shouldUnderline = indices.indexOf(i) !== -1;
    if (shouldUnderline === underline) {
      outString += char;
    } else if (!shouldUnderline && underline) {
      outString += `**__${char}`;
      underline = false;
    } else if (shouldUnderline && !underline) {
      outString += `__**${char}`;
      underline = true;
    }
  }

  if (underline) {
    outString += '__';
  }

  return outString;
}

function addPitchField(fields, pronounceInfo) {
  if (pronounceInfo.pitchAccent.length > 0) {
    let katakana = pronounceInfo.katakana;
    fields.push({
      name: 'Pitch (underline is high)',
      value: underlineStringAtIndices(katakana, pronounceInfo.pitchAccent),
    });
  }
}

function addMutedSoundsField(fields, pronounceInfo) {
  if (pronounceInfo.noPronounceIndices.length > 0) {
    let katakana = pronounceInfo.katakana;
    fields.push({
      name: 'Muted sounds',
      value: underlineStringAtIndices(katakana, pronounceInfo.noPronounceIndices),
    });
  }
}

function addNasalSoundsField(fields, pronounceInfo) {
  if (pronounceInfo.nasalPitchIndices.length > 0) {
    let katakana = pronounceInfo.katakana;
    fields.push({
      name: 'Nasal sounds',
      value: underlineStringAtIndices(katakana, pronounceInfo.nasalPitchIndices),
    });
  }
}

function createFoundResult(msg, pronounceInfo) {
  let content = createEmbedContent();
  let embed = content.embed;
  let query = pronounceInfo.query;
  let uriEncodedQuery = encodeURIComponent(query);

  embed.title = `Pronunciation information for ${pronounceInfo.query}`;
  embed.url = `http://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/word:${uriEncodedQuery}`;
  embed.description = `Class [${pronounceInfo.pitchAccentClass}](http://www.sanseido-publ.co.jp/publ/dicts/daijirin_ac.html) pitch accent`;

  embed.fields = [];
  addPitchField(embed.fields, pronounceInfo);
  addMutedSoundsField(embed.fields, pronounceInfo);
  addNasalSoundsField(embed.fields, pronounceInfo);

  return msg.channel.createMessage(content, null, msg);
}

module.exports = {
  commandAliases: ['k!pronounce', 'k!p'],
  canBeChannelRestricted: true,
  cooldown: 5,
  uniqueId: 'pronounce30294',
  action(bot, msg, suffix) {
    if (!suffix) {
      return createNoSuffixResult(msg);
    }

    let pronounceInfo = getPronounceInfo(suffix);
    if (!pronounceInfo.found) {
      return createNotFoundResult(msg, pronounceInfo);
    }

    return createFoundResult(msg, pronounceInfo);
  },
};
