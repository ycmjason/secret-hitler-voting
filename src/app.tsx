import { useState } from 'react';
import { generateRoomCode, RoomCodeSchema } from '../shared/room-code.ts';
import { getPlayerId, getSavedPlayerName, savePlayerName } from './identity.ts';
import { useRoom } from './use-room.ts';

/** Placeholder UI that exercises the room hook. Replaced by the designed screens. */
export const App = () => {
  const code = RoomCodeSchema.safeParse(location.pathname.slice(1));
  if (!code.success) {
    return (
      <main className="p-6">
        <button type="button" onClick={() => location.assign(`/${generateRoomCode()}`)}>
          Create room
        </button>
      </main>
    );
  }
  return <RoomScreen code={code.data} />;
};

const RoomScreen = ({ code }: { code: string }) => {
  const [name, setName] = useState(getSavedPlayerName);
  const { room, status, send } = useRoom(code, name ? { id: getPlayerId(), name } : null);
  if (!name) {
    return (
      <form
        className="p-6"
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get('name')?.toString().trim() ?? '';
          if (value) {
            savePlayerName(value);
            setName(value);
          }
        }}
      >
        <input name="name" placeholder="Your name" />
        <button type="submit">Join</button>
      </form>
    );
  }
  return (
    <main className="p-6">
      <p>{status}</p>
      <button type="button" onClick={() => send({ type: 'vote', vote: 'ja' })}>
        JA!
      </button>
      <button type="button" onClick={() => send({ type: 'vote', vote: 'nein' })}>
        NEIN
      </button>
      <button type="button" onClick={() => send({ type: 'reset' })}>
        New vote
      </button>
      <pre>{JSON.stringify(room, null, 2)}</pre>
    </main>
  );
};
