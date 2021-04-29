import { useCallback, useEffect, useMemo, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

function Game() {
  //Public API that will echo messages sent to it back to the client
  const [messages, setMessages] = useState([]);

  const {
    sendMessage,
    lastMessage,
    readyState,
  } = useWebSocket('ws://localhost:8081/game/game123');

  useEffect(() => {
    console.log(lastMessage);
    if (lastMessage) {
      setMessages([...messages, lastMessage]);
    }
  }, [lastMessage]);

  // messageHistory.current = useMemo(() => {
  //   setMessages([
  //     ...messages,
  //     lastMessage
  //   ]);
  //   // messageHistory.current.concat(lastMessage);
  // }, []);

  const handleClickSendMessage = useCallback(() => {
    sendMessage('Hello');
  }, [sendMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  console.log(messages);
  return (
    <div className="App">
      <button
        onClick={handleClickSendMessage}
        disabled={readyState !== ReadyState.OPEN}
      >
        Click Me to send 'Hello'
      </button>
      <span>The WebSocket is currently {connectionStatus}</span>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      <ul>
        {messages.map((message, idx) => <span key={idx}>{message.data}</span>)}
      </ul>
    </div>
  );
}

export default Game;
