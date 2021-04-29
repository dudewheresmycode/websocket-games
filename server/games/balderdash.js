import randomWord from '../services/words';
import * as redis from '../services/redis';

export function init(roomId, members = []) {
  return updateState(roomId, (state) => {

    const _state = {
      ...state,
      turn: 0,
      dealer: null,
      roundDuration: 120,
      roundStartedAt: Date.now(),
      finished: false,
      word: randomWord(),
      scores: {}
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

export async function turn() {
  await updateState(roomId, (state) => {
    state.word = randomWord();
    state.turn++;
    // select next dealer...
    // state.dealer
  });
}
