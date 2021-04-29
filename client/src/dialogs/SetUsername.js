import React, { useCallback, useMemo, useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import { useAppState } from '../providers/AppStateProvider';

const POSSIBLE_NAMES = [
  'Michael Scarn',
  'Recyclops',
  'Pammy',
  'Señor Loadenstein',
  'Mose Shrute'
];
export default function SetUsernameDialog({ open, dismissable, onClose }) {
  const { username } = useAppState();
  const [tempUsername, setTempUsername] = useState(username || '');

  const [hasError, setHasError] = useState(false);

  const randomPlaceholder = useMemo(() => {
    return POSSIBLE_NAMES[Math.floor(Math.random()*POSSIBLE_NAMES.length)];
  }, []);

  const handleUsernameChange = useCallback((e) => {
    // setUsername(e.target.value);
    setTempUsername(e.target.value);
  }, []);

  const handleConfirm = useCallback((e) => {
    if (!tempUsername?.length || tempUsername.length < 4) {
      console.log('err');
      e.preventDefault();
      setHasError('A username of at least 4 characters is required');
      return;
    }
    console.log('ok');
    setHasError(null);
    if (onClose) {
      onClose(tempUsername);
    }
  }, [onClose, tempUsername]);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        disableBackdropClick={!dismissable}
        disableEscapeKeyDown={!dismissable}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Select a Username</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a cool handle that will be displayed to others.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            required={true}
            error={!!hasError}
            helperText={hasError}
            label="Username"
            placeholder={randomPlaceholder}
            fullWidth={true}
            value={tempUsername}
            onChange={handleUsernameChange}
          />
        </DialogContent>
        <DialogActions>
          {/* <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button> */}
          <Button onClick={handleConfirm} color="primary" variant="outlined">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
