import express from 'express';

function send(ws, message) {
  ws.send(JSON.stringify(message));
}

export default function socket(wss) {
  const router = express.Router();
  
  const broadcastToRoom = (ws, roomId) => {
    wss.clients.forEach((client) => {
      if (
        roomId === client.roomId &&
        client !== ws &&
        client.readyState === WebSocket.OPEN
      ) {
        send(client, data);
      }
    });
  }
  
  router.ws('/:roomId', function(ws, req) {
    const { roomId } = req.params;
    if (!roomId) {
      return send(ws, { error: 'Missing room id' });
    }
    console.log(`connected to room: ${roomId}`);
    
    ws.on('message', function(msg) {
      console.log('received', msg);
      broadcastToRoom(roomId);
      // ws.send(msg);
    });
    // ws.on('message', function(msg) {
    //   console.log('received', msg);
    //   // ws.send(msg);
    // });
  });

  return router;
}
