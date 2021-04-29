import { Container, Typography } from '@material-ui/core';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(3)
  },
  header: {
    marginBottom: theme.spacing(3)
  },
}));
export default function About() {
  const classes = useStyles();
  return (
    <Container className={classes.root}>
      <Typography className={classes.header} variant="h4">About</Typography>
      <Typography variant="body">This project was started to create a couple simple games to play with friends and co-workers in real-time.</Typography>
      <Typography variant="body">It's open source! You're welcome to report bugs, or contribute a game of your own!</Typography>
    </Container>
  )
}
