import { v4 as uuid } from 'uuid';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { animals, colors } from 'react-animals/src/constants';
import useLocalStorage from '../hooks/useLocalStorage';

export const AppContext = createContext();

// Hook
export function useAppState() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppState must be used within the AppStateProvider');
  }

  return context;
}

function generateUserId() {
  const existingId = window.localStorage.getItem('userid');
  let uid = existingId;
  if (!existingId) {
    uid = uuid();
    window.localStorage.setItem('userid', uid);
  }
  return uid;
}

function generateAnimal() {
  const existing = window.localStorage.getItem('animal');
  let animal = existing && JSON.parse(existing);
  if (!animal) {
    const name = animals[Math.round(Math.random() * animals.length)];
    const keys = Object.keys(colors);
    const color = colors[keys[(keys.length * Math.random()) << 0]];
    animal = { name, color };
    window.localStorage.setItem('animal', JSON.stringify(animal));
  }
  return animal;
}

// Provider
export function AppStateProvider({ options, children }) {
  const [username, setUsername] = useLocalStorage('username', '');
  const [roomHistory, setRoomHistory] = useLocalStorage('roomHistory', []);

  const userid = generateUserId();
  const animal = generateAnimal();
  
  const addRoomToHistory = useCallback((roomId) => {
    if (roomHistory.indexOf(roomId) === -1) {
      setRoomHistory([...roomHistory, roomId]);
    }
  }, [roomHistory, setRoomHistory]);

  const appState = useMemo(() => {
    return {
      animal,
      animals,
      addRoomToHistory,
      roomHistory,
      userid,
      username,
      setUsername
    }
  }, [
    animal,
    addRoomToHistory,
    roomHistory,
    userid,
    username,
    setUsername
  ]);

  return (
    <AppContext.Provider value={appState}>
      {children}
    </AppContext.Provider>
  );
}
