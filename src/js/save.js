// general save format
const RAW_SIZE_HALF = 0x10000;

const SECTOR_DATA_SIZE = 4084;
const SECTOR_FOOTER_SIZE = 12;
const SECTOR_SIZE = SECTOR_DATA_SIZE + SECTOR_FOOTER_SIZE;

const NUM_SECTORS = 14;
const TOTAL_SIZE = NUM_SECTORS * SECTOR_SIZE;

// misc sizes
const NUM_BOX_SLOTS = 8 * 30;
const POKEMON_NAME_LENGTH = 10;
const PLAYER_NAME_LENGTH = 7;

// struct sizes
const SIZEOF_POKE_SUBSTRUCT = 12;
const SIZEOF_BOXMON = 21 + POKEMON_NAME_LENGTH + PLAYER_NAME_LENGTH + 4 * SIZEOF_POKE_SUBSTRUCT + 2;
const SIZEOF_POKEMON = SIZEOF_BOXMON + 20;

// offsets
const OFFSET_SECTOR_ID = 0xFF4;
const OFFSET_SECTOR0_COUNT = 0xFFC;
const OFFSET_SAVE1_PARTY_SIZE = 0x234;
const OFFSET_SAVE1_PARTY = 0x238;
const OFFSET_BOXMON_SUBSTRUCT0 = SIZEOF_BOXMON - 4 * SIZEOF_POKE_SUBSTRUCT;

// etc.
const NATURES = [
    "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
    "Bold", "Docile", "Relaxed", "Impish", "Lax",
    "Timid", "Hasty", "Serious", "Jolly", "Naive",
    "Modest", "Mild", "Quiet", "Bashful", "Rash",
    "Calm", "Gentle", "Sassy", "Careful", "Quirky"
];
const CHAR_CONVERT = [
    ' ',  'À',  'Á',  'Â', 'Ç',  'È',  'É',  'Ê',  'Ë',  'Ì', 'こ', 'Î',  'Ï',  'Ò',  'Ó',  'Ô',
    'Œ',  'Ù',  'Ú',  'Û', 'Ñ',  'ß',  'à',  'á',  'ね', 'Ç',  'È', 'é',  'ê',  'ë',  'ì',  'í',
    'î',  'ï',  'ò',  'ó', 'ô',  'œ',  'ù',  'ú',  'û',  'ñ',  'º', 'ª',  '⒅', '&',  '+',  'あ',
    'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', '=',  'ょ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず', 'ぜ',
    'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
    'っ', '¿',  '¡',  '⒆', '⒇', 'オ', 'カ', 'キ', 'ク', 'ケ', 'Í',  'コ', 'サ', 'ス', 'セ', 'ソ',
    'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'â',  'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'í',
    'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン', 'ァ',
    'ィ', 'ゥ', 'ェ', 'ォ', 'ャ', 'ュ', 'ョ', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ', 'ザ', 'ジ', 'ズ', 'ゼ',
    'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ',
    'ッ', '0',  '1',  '2', '3',  '4',  '5',  '6',  '7',  '8',  '9',  '!', '?',  '.',  '-',  '・',
    '⑬',  '“',  '”',  '‘', '’',  '♂',  '♀',  '$',  ',',  '⑧',  '/',  'A', 'B',  'C',  'D',  'E',
    'F',  'G',  'H',  'I', 'J',  'K',  'L',  'M',  'N',  'O',  'P',  'Q', 'R',  'S',  'T',  'U',
    'V',  'W',  'X',  'Y', 'Z',  'a',  'b',  'c',  'd',  'e',  'f',  'g', 'h',  'i',  'j',  'k',
    'l',  'm',  'n',  'o', 'p',  'q',  'r',  's',  't',  'u',  'v',  'w', 'x',  'y',  'z',  '0',
    ':',  'Ä',  'Ö',  'Ü', 'ä',  'ö',  'ü',
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
];


function* offsetIter(group) {
    let start = group * TOTAL_SIZE;
    let end = start + TOTAL_SIZE
    for (let i = start; i < end; i += SECTOR_SIZE) {
        yield i;
    }
}

function getActiveSlotHelper(data, group) {
    let mask = 0;
    let sectorZero = null;
    for (offset of offsetIter(group)) {
        let id = data.getInt16(offset + OFFSET_SECTOR_ID, true);
        mask = mask | (1 << id);
        if (id == 0) 
            sectorZero = offset;
    }
    return [mask == 0b0011111111111111, sectorZero];
}

function getActiveSlot(data) {
    if (data.length == RAW_SIZE_HALF) {
        return 0;
    }

    let [valid0, sectorZero0] = getActiveSlotHelper(data, 0);
    let [valid1, sectorZero1] = getActiveSlotHelper(data, 1);

    if (!valid1)
        return 0;
    if (!valid0)
        return 1;

    let count0 = data.getUint32(sectorZero0 + OFFSET_SECTOR0_COUNT, true);
    let count1 = data.getUint32(sectorZero1 + OFFSET_SECTOR0_COUNT, true);

    return count1 > count0 ? 1 : 0;
}

function readSectors(data) {
    let save1 = new Uint8Array(SECTOR_DATA_SIZE * 4);
    let storage = new Uint8Array(SECTOR_DATA_SIZE * 9);
    let dataUint8Array = new Uint8Array(data.buffer);
    
    for (offset of offsetIter(getActiveSlot(data))) {
        let id = data.getInt16(offset + OFFSET_SECTOR_ID, true);
        if (id >= 5) {
            let start = (id - 5) * SECTOR_DATA_SIZE;
            storage.set(dataUint8Array.slice(offset, offset + SECTOR_DATA_SIZE), start);
        } else if (id >= 1) {
            let start = (id - 1) * SECTOR_DATA_SIZE;
            save1.set(dataUint8Array.slice(offset, offset + SECTOR_DATA_SIZE), start);
        }
    }

    return [new DataView(save1.buffer), new DataView(storage.buffer)];
}

function boxMonFromParty(save1, index) {
    let save1Uint8Array = new Uint8Array(save1.buffer);
    let start = OFFSET_SAVE1_PARTY + index * SIZEOF_POKEMON;
    let end = start + SIZEOF_BOXMON;
    return new DataView(save1Uint8Array.slice(start, end).buffer);
}

function boxMonFromStorage(storage, index) {
    let storageUint8Array = new Uint8Array(storage.buffer);
    let start = 0x4 + index * SIZEOF_BOXMON;
    let end = start + SIZEOF_BOXMON;
    let mon = new DataView(storageUint8Array.slice(start, end).buffer);
    console.log(mon.byteLength);
    if (boxMonLevel(mon) == 0)
        return null;
    return mon;
}

function boxMonLevel(mon) {
    let offset = OFFSET_BOXMON_SUBSTRUCT0 + 0x04;
    let exp = mon.getUint32(offset, true);
    // every pokemon has medium-fast exp gain
    return Math.floor(Math.cbrt(exp));
}

function boxMonSpeciesAbilityNickname(mon) {
    let specOffset = OFFSET_BOXMON_SUBSTRUCT0;
    let specObj = SPECIES_LOOKUP[mon.getUint16(specOffset, true)];

    let abilityNumOffset = OFFSET_BOXMON_SUBSTRUCT0 + 3 * SIZEOF_POKE_SUBSTRUCT + 0xB;
    let abilityNum = mon.getUint8(abilityNumOffset, true) & 0x3;

    let nameOffset = 0x8;
    let output = "";
    for (let i = 0; i < POKEMON_NAME_LENGTH; i++) {
        let char = mon.getUint8(nameOffset + i, true);
        if (CHAR_CONVERT[char] == 0xFF)
            break;
        output += CHAR_CONVERT[char];
    }
    let nickname = output == specObj.basename ? null : output;

    return [specObj.name, specObj.abilities[abilityNum], nickname];
}

function boxMonIvStr(mon) {
    let offset = OFFSET_BOXMON_SUBSTRUCT0 + 3 * SIZEOF_POKE_SUBSTRUCT + 0x4;
    let ivWord = mon.getUint32(offset, true);
    let output = "";
    output += ((ivWord >>  0) & 0x1F) + " HP / ";
    output += ((ivWord >>  5) & 0x1F) + " Atk / ";
    output += ((ivWord >> 10) & 0x1F) + " Def / ";
    output += ((ivWord >> 20) & 0x1F) + " SpA / ";
    output += ((ivWord >> 25) & 0x1F) + " SpD / ";
    output += ((ivWord >> 15) & 0x1F) + " Spe";
    return output;
}

function boxMonEvStr(mon) {
    let offset = OFFSET_BOXMON_SUBSTRUCT0 + 2 * SIZEOF_POKE_SUBSTRUCT;
    let output = "";
    output += mon.getUint8(offset + 0, true) + " HP / ";
    output += mon.getUint8(offset + 1, true) + " Atk / ";
    output += mon.getUint8(offset + 2, true) + " Def / ";
    output += mon.getUint8(offset + 4, true) + " SpA / ";
    output += mon.getUint8(offset + 5, true) + " SpD / ";
    output += mon.getUint8(offset + 3, true) + " Spe";
    return output;
}

function boxMonNature(mon) {
    let natureNum = mon.getUint32(0, true) % 25;
    return NATURES[natureNum];
}

function boxMonMoves(mon) {
    let offset = OFFSET_BOXMON_SUBSTRUCT0 + 1 * SIZEOF_POKE_SUBSTRUCT;
    let moves = [];
    for (let i = 0; i < 4; i++) {
        let moveNum = mon.getUint16(offset + 2 * i, true);
        moves.push(MOVE_LOOKUP[moveNum]);
    }
    return moves;
}

function boxMonSetStringLevel(mon) {
    let level = boxMonLevel(mon);
    let [species, ability, nickname] = boxMonSpeciesAbilityNickname(mon);
    let ivStr = boxMonIvStr(mon);
    let evStr = boxMonEvStr(mon);
    let nature = boxMonNature(mon);
    let moves = boxMonMoves(mon);

    output = ""
    if (nickname)
        output += `${nickname} (${species})\n`;
    else
        output += `${species}\n`;
    output += `Level: ${level}\n`;
    output += `${nature} Nature\n`;
    output += `Ability: ${ability}\n`;
    output += `EVs: ${evStr}\nIVs: ${ivStr}\n`;
    for (move of moves) {
        if (move)
            output += `- ${move}\n`;
    }

    return [output, level];
}


function saveDataToSets(data) {
    let [save1, storage] = readSectors(data);

    let sets = "";
    let levelScale = 0;
    let partySize = save1.getUint8(OFFSET_SAVE1_PARTY_SIZE);
    for (let i = 0; i < partySize; i++) {
        let mon = boxMonFromParty(save1, i);
        let [set, level] = boxMonSetStringLevel(mon);
        levelScale = Math.max(level, levelScale)
        sets += set + "\n";
    }
    for (let i = 0; i < NUM_BOX_SLOTS; i++) {
        let mon = boxMonFromStorage(storage, i);
        if (mon) {
            let [set, level] = boxMonSetStringLevel(mon);
            levelScale = Math.max(level, levelScale)
            sets += set + "\n";
        }
    }

    $("#levelScale").val(levelScale);
	$("textarea.import-team-text").val(sets);
}


$("#exportSave").click(async function () {
    let file = $("#saveUpload")[0].files[0];
    var reader = new FileReader();
    reader.onload = function () {
        let dataBuffer = reader.result;
        let data = new DataView(dataBuffer);
        saveDataToSets(data);
    };
    reader.readAsArrayBuffer(file); 
});
