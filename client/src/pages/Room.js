// import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Animal from 'react-animals';
import { useParams } from 'react-router-dom';
import openSocket from 'socket.io-client';
import { useAppState } from '../providers/AppStateProvider';
import SetUsernameDialog from '../dialogs/SetUsername';
import useLocalStorage from '../hooks/useLocalStorage';
import { Grid, Button, List, ListItem, ListItemText, ListItemIcon, ListItemAvatar } from '@material-ui/core';

const SOCKET_ENDPOINT = process.env.REACT_APP_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}`;

function ActiveRoom() {
  const {
    animal,
    roomHistory,
    addRoomToHistory,
    username,
    userid
  } = useAppState();
  const [members, setMembers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const params = useParams();
  const [socketStatus, setSocketStatus] = useState({ connected: false });

  useEffect(() => {
    document.title = `Socket Experiments: Room ${params.roomId}`;
    
    addRoomToHistory(params.roomId);

    console.log('SOCKET_ENDPOINT', SOCKET_ENDPOINT);
    const _socket = openSocket(SOCKET_ENDPOINT, {
      query: {
        animal: Object.values(animal),
        roomId: params.roomId,
        userid,
        username
      }
    });
    _socket.on('connect', () => {
      console.log('[socket] connected');
      setSocketStatus({ connected: true });
    });
    _socket.on('room.members', (_members) => {
      console.log('[members]', _members);
      setMembers(_members.map(_member => {
        const [name, color] = _member.animal.split(',');
        const animal = { name, color };
        return {
          ..._member,
          animal
        }
      }));
    });
    _socket.on('game.state', (_state) => {
      setGameState(_state);
    });

    setSocket(_socket);

    return function cleanup() {
      console.log('remove listen?');
      _socket.close();
      console.log('closing socket...');
    }
  }, [params.roomId]);

  useEffect(() => {
    console.log('username change!', username, socket);
    if (socket?.connected) {
      socket.emit('setting.username', username);
    }
  }, [socket, username]);

  const handleGameStart = useCallback(() => {
    socket.emit('game.start');
  }, [socket]);

  const handleChangeWord = useCallback(() => {
    socket.emit('game.new_word');
  }, [socket]);

  const isHost = useMemo(() => {
    return userid === members?.[0]?.id;
  }, [userid, members]);

  const isDealer = useMemo(() => {
    return userid === gameState?.dealer;
  }, [userid, gameState]);

  return (
    <Grid container={true}>
      <Grid item={true} xs={1} sm={4} md={3}>
        <List>
          {members?.length ? members.map(member => (
            <ListItem>
              <ListItemAvatar>
                <Animal {...member.animal} square={true} size="28px" />
              </ListItemAvatar>
              <ListItemText primary={member.username} />
            </ListItem>
          )) : null}
        </List>
      </Grid>
      <Grid item={true} xs={true}>
        {isHost ? (
          <Button onClick={handleGameStart}>Start Game</Button>
        ) : null}
        {isDealer ? (
          <Button onClick={handleChangeWord}>Change Word</Button>
        ) : null}
        <pre>{JSON.stringify(gameState, null, 1)}</pre>
      </Grid>
      
    </Grid>
  )
}

export default function Room() {
  const { username, setUsername } = useAppState();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(!username?.length);


  const handleClose = useCallback((tmpUsername) => {
    console.log(`SET USER: ${tmpUsername}`);
    if (tmpUsername?.length) {
      setUsername(tmpUsername);
    }
    setUsernameDialogOpen(false);
  }, [setUsername]);


  if (!username) {
    return (
      <SetUsernameDialog
        open={usernameDialogOpen}
        onClose={handleClose}
        dismissable={false}
      />
    );
  }

  return <ActiveRoom />
}