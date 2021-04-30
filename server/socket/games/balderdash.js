import randomWord from '../../services/words';
import * as redis from '../../services/redis';

export function init(roomId, members = []) {
  return updateState(roomId, (state) => {

    const _state = {
      ...state,
      turn: 0,
      isAllChoosen: false,
      isAllAnswered: false,
      dealer: null,
      roundDuration: 120,
      roundStartedAt: Date.now(),
      finished: false,
      word: randomWord(),
      answers: [],
      choices: {},
      scores: {},
      roundScores: []
    }
    
    console.log(members);

    if (members.length) {
      _state.dealer = members[0].id;
      members.forEach(member => {
        _state.scores[member.id] = 0;
      });
    }

    return _state;
  });
  // return writeState(roomId, state);
}
async function writeState(roomId, state) {
  await redis.set(`game:bdash:${roomId}`, JSON.stringify(state));
}

async function updateState(roomId, operate) {
  let state = await getState(roomId);
  state = operate(state);
  await writeState(roomId, state);
  return state;
}

export async function getState(roomId) {
  const rawState = await redis.get(`game:bdash:${roomId}`);
  return JSON.parse(rawState) || {};
}

export async function generateWord(roomId) {
  return updateState(roomId, (state) => {
    state.word = randomWord();
    return state;
  });
}

export async function choose(roomId, userid, choice) {
  return updateState(roomId, (state) => {
    state.choices[userid] = choice;
    const players = Object.keys(state.scores).filter(id => id !== state.dealer);
    state.isAllChoosen = players.every(player => Object.keys(state.choices).includes(player));

    // calculate scores

    return state;
  });
}

export async function answer(roomId, userid, answer) {
  return updateState(roomId, (state) => {
      state.answers.push({ userid, answer });
      
      // filter dealer
      const players = Object.keys(state.scores).filter(id => id !== state.dealer);
      const _answers = state.answers.map(a => a.userid);
      state.isAllAnswered = players.every(player => _answers.includes(player));
      console.log(players, _answers, state.isAllAnswered);

      state.randomized = shuffle([
        { userid: state.dealer, answer: state.word[1], real: true },
        ...state.answers
      ]);

      return state;
  });
}

export async function turn(roomId, members) {
  return updateState(roomId, (state) => {
    // select next dealer
    let dealerIndex = members.findIndex(member => member.id === state.dealer);
    if (dealerIndex === -1) {
      dealerIndex = 0;
    } else {
      dealerIndex++;
      if (dealerIndex === members.length) {
        dealerIndex = 0;
      }
    }
    state.dealer = members[dealerIndex].id;
    state.isAllAnswered = false;
    state.answers = [];
    state.isAllChoosen = false;
    state.choices = {};
    state.word = randomWord();
    state.turn++;
    return state;
  });
}


export default function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}