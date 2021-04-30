// import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Animal from 'react-animals';
import { useParams } from 'react-router-dom';
import openSocket from 'socket.io-client';
import { useAppState } from '../providers/AppStateProvider';
import SetUsernameDialog from '../dialogs/SetUsername';
import useLocalStorage from '../hooks/useLocalStorage';
import shuffle from '../utils/shuffle';
import {
  Card,
  CardContent,
  Box,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemSecondaryAction,
  Typography,
  Avatar,
  Icon,
  Tooltip,
  TextField,
  Container,
  IconButton,
} from '@material-ui/core';
import StarsIcon from '@material-ui/icons/Stars';
import GroupIcon from '@material-ui/icons/Group';
import CheckIcon from '@material-ui/icons/Check';

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
  const [answer, setAnswer] = useState('');
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
    if (socket?.connected && username) {
      socket.emit('setting.username', username);
    }
  }, [username]);

  const handleGameStart = useCallback(() => {
    socket.emit('game.start');
  }, [socket]);

  const handleChangeWord = useCallback(() => {
    socket.emit('game.new_word');
  }, [socket]);

  const handleNextTurn = useCallback(() => {
    socket.emit('game.next');
  }, [socket]);

  const handleAnswerChange = useCallback((e) => {
    setAnswer(e.target.value);
  }, []);

  const handleAnswerSubmit = useCallback(() => {
    socket.emit('game.answer', answer);
    setAnswer('');
  }, [answer, socket]);

  const handleChoice = useCallback((choice) => {
    if (userid !== gameState?.dealer) {
      socket.emit('game.choose', choice);
    }
  }, [socket, userid, gameState?.dealer]);

  const isHost = useMemo(() => {
    return userid === members?.[0]?.id;
  }, [userid, members]);

  const isDealer = useMemo(() => {
    return userid === gameState?.dealer;
  }, [userid, gameState]);

  const isAnswered = useMemo(() => {
    return !!gameState?.answers.find(answer => answer.userid === userid)
  }, [gameState, userid]);
  
  // const answerChoices = useMemo(() => {
  //   return shuffle([
  //     { userid: gameState?.dealer, answer: gameState?.word[1] },
  //     ...(gameState?.answers || [])
  //   ]);
  // }, [gameState?.answers]);
  // const isAllAnswered = useMemo(() => {
  //   // filter dealer
  //   const players = members.filter(member => member.id !== gameState?.dealer);
  //   console.log('players', players);
  //   const _answers = gameState?.answers.map(a => a.userid) || [];
  //   return players.every(player => _answers.includes(player.id));
  //   // return !!gameState?.answers.find(answer => answer.userid === userid)
  // }, [gameState, members]);

  return (
    <Container>
      <Grid container={true} spacing={4}>
        <Grid item={true} xs={1} sm={4}>
          <List>
            {members?.length ? members.map((member, index) => (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Avatar><Animal {...member.animal} square={true} size="40px" /></Avatar>
                </ListItemAvatar>
                <ListItemText primary={member.username} secondary={index === 0 ? (
                  <Tooltip title="Game Host">
                    <GroupIcon color="disabled" fontSize="small" />
                  </Tooltip>
                ) : null} />
                <ListItemSecondaryAction>
                    {member.id === gameState?.dealer ? (
                      <Tooltip title="Current Dealer">
                        <StarsIcon color="primary" fontSize="small" />
                      </Tooltip>
                    ) : null}
                  {/* <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton> */}
                </ListItemSecondaryAction>

              </ListItem>
            )) : null}
          </List>
        </Grid>
        <Grid item={true} xs={true}>
          {gameState ? (

            <Box mt={3}>
            {isDealer ? (
              <div>
                <Typography variant="h3">{gameState.word[0]}</Typography>
                <Typography>{gameState.word[1]}</Typography>
                <Button
                  variant="contained"
                  onClick={handleChangeWord}
                >
                    Change Word
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  size="large"
                  onClick={handleNextTurn}
                >
                  Skip Turn
                </Button>  
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGameStart}
                >
                  New Game
                </Button>            
              </div>
            ) : (
              <>
                <Typography>The word is</Typography>
                <Typography variant="h3">{gameState.word[0]}</Typography>
                {
                  isAnswered ? (
                    <Typography>Good luck!</Typography>
                  ) : (
                    <>
                      <TextField
                        label="Your Answer"
                        value={answer}
                        fullWidth={true}
                        multiline={true}
                        rows={2}
                        helperText="If you know it, enter the correct definition for 3 points. Or, make up a conviencing one to fool other players and earn 1 point."
                        onChange={handleAnswerChange}
                      />
                      <Button
                        onClick={handleAnswerSubmit}
                        variant="contained"
                      >
                        Submit
                      </Button>
                    </>
                  )
                }
              </>
            )}
            {/* {gameState.isAllChoosen ? (
              
            ) : (

            )} */}
            {gameState.isAllAnswered ? (
              <>
                <Typography>Select the correct definition:</Typography>
                <List>
                  {gameState?.randomized.map(answer => (
                    <ListItem
                      key={answer.userid}
                      button={userid !== gameState?.dealer}
                      selected={answer.userid === gameState.choices[userid]?.userid}
                      onClick={() => handleChoice(answer)}
                    >
                      <ListItemText primary={answer.answer} />
                      <ListItemSecondaryAction>
                        {answer.userid === gameState.choices[userid]?.userid ? <CheckIcon /> : null}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography>Waiting for all answers</Typography>
            )}

            </Box>
          ) : (
            <Box mt={3}>
              <Grid container={true} spacing={3} justify="center">
                <Grid xs={12} sm={5} item={true} align="center">
                  {isHost ? (
                    <Box mt={5}>
                      <Button
                        color="primary"
                        variant="contained"
                        size="large"
                        onClick={handleGameStart}
                      >
                        Start Game
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Typography color="textSecondary">Waiting for the host to the start game.</Typography>
                      <video
                        src="https://media.giphy.com/media/QBd2kLB5qDmysEXre9/giphy.mp4"
                        width="100%"
                        controls={false}
                        muted={true}
                        autoPlay={true}
                        loop={true}
                      ></video>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>          
          )}


          <pre>{JSON.stringify(gameState, null, 1)}</pre>
        </Grid>
        
      </Grid>
    </Container>
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