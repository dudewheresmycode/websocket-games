import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';

import { Box, Container, List, ListItem, ListItemIcon, ListItemText, ListSubheader } from '@material-ui/core';
import { useAppState } from '../providers/AppStateProvider';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(4)
  },
  input: {
    marginBottom: theme.spacing(2)
  }
}));
export default function Home() {
  const { roomHistory } = useAppState();
  const classes = useStyles();
  const history = useHistory();

  useEffect(() => {
    document.title = `Socket Experiments: Create Room`;
  }, []);

  const generatedRoomId = useMemo(() => {
    return Math.round(Math.random()*10e8).toString(16) + '-' + (new Date()).getTime().toString(16);
  }, []);

  const [customRoomId, setCustomRoomId] = useState('');

  const handleRoomIdChange = useCallback((e) => {
    setCustomRoomId(e.target.value);
  }, []);
  const handleRoomClick = useCallback((e, roomId) => {
    history.push(`/room/${roomId}`);
  }, [history]);
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const newRoomId = customRoomId.length ? customRoomId : generatedRoomId;
    history.push(`/room/${newRoomId}`);
  }, [customRoomId, generatedRoomId, history]);

  return (
    <div className={classes.root}>
      <Container>
        <Grid container={true} spacing={5}>
          <Grid item={true} sm={6} xs={12}>
            <Typography variant="h6">Create a Room</Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                className={classes.input}
                label="Room ID"
                placeholder={generatedRoomId}
                helperText="Leave blank to auto-generate"
                fullWidth={true}
                value={customRoomId}
                onChange={handleRoomIdChange}
              />
              <Button
                type="submit"
                fullWidth={true}
                color="primary"
                variant="outlined"
              >
                Create Room
              </Button>
            </form>
          </Grid>
          <Grid item={true} sm={6} xs={12}>
            <Box mt={3}>
              <List subheader={<ListSubheader>Recent Rooms</ListSubheader>}>
                {roomHistory.map(roomId => (
                  <ListItem button={true} onClick={(e) => handleRoomClick(e, roomId)}>
                    <ListItemIcon>
                      <MeetingRoomIcon />
                    </ListItemIcon>
                    <ListItemText primary={roomId} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
        </Grid>
        
      </Container>
    </div>
  )
}