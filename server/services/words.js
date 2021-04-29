import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const data = fs.readFileSync(`./server/data/words.csv`);
const { data: WORDS } = Papa.parse(data.toString('utf8'));

export default function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}