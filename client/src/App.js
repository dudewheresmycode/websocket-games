import React, { useCallback, useState } from 'react';
import Animal from 'react-animals';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useParams
} from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import { AppStateProvider, useAppState } from './providers/AppStateProvider';
import About from './pages/About';
import Home from './pages/Home';
import Room from './pages/Room';
import SetUsernameDialog from './dialogs/SetUsername';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  // avatar: {
  //   marginRight: theme.spacing(1)
  // },
  username: {
    marginLeft: theme.spacing(1)
  },
}));

function AppHeader() {
  const classes = useStyles();
  const history = useHistory();
  const { animal, username, setUsername } = useAppState();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);

  const handleNavChange = useCallback((location) => {
    history.push(location);
  }, [history]);

  const handleChangeUsername = useCallback(() => {
    setUsernameDialogOpen(true);
  }, []);

  const handleClose = useCallback((tmpUsername) => {
    if (tmpUsername?.length) {
      console.log(`SET USER: ${tmpUsername}`);
      setUsername(tmpUsername);
    }
    setUsernameDialogOpen(false);
  }, [setUsername]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            WebSocket Experiments
          </Typography>
          {username ? (
            <>
              <Button color="inherit" onClick={handleChangeUsername}>
                <Animal {...animal} square={true} size="28px" />
                <Typography className={classes.username}>{username}</Typography>
              </Button>
            </>
          ) : null}
          <Button color="inherit" onClick={() => handleNavChange('/')}>
            Lobby
          </Button>
          <Button color="inherit" onClick={() => handleNavChange('/about')}>About</Button>
        </Toolbar>
      </AppBar>
      <SetUsernameDialog
        open={usernameDialogOpen}
        onClose={handleClose}
        dismissable={true}
      />
    </>
  )  
}

function AppContent() {
  return (
    <div>
      {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
      <Switch>
        <Route path="/room/:roomId">
          <Room />
        </Route>
        <Route path="/about">
          <About />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <Router>
        <AppHeader />
        <AppContent />
      </Router>
    </AppStateProvider>
  );
}

