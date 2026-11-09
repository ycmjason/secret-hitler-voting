import { useEffect } from 'react';
import { RoomCodeSchema } from '../shared/room-code.ts';
import { Landing } from './landing.tsx';
import { navigate, usePathname } from './navigation.ts';
import { RoomPage } from './room-page.tsx';

const TITLE = 'Secret Hitler Voting';

/** `/` is the landing; `/:CODE` is a room. Anything else goes back to the landing. */
const useRoute = (): { code: string | null } => {
  const pathname = usePathname();
  const path = pathname.slice(1);
  const code = RoomCodeSchema.safeParse(path);
  useEffect(() => {
    if (code.success && path !== code.data) navigate(`/${code.data}`, { replace: true });
    else if (!code.success && path !== '') navigate('/', { replace: true });
  }, [code.success, code.data, path]);
  return { code: code.success ? code.data : null };
};

export const App = () => {
  const { code } = useRoute();
  useEffect(() => {
    document.title = code ? `Room ${code} · ${TITLE}` : TITLE;
  }, [code]);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-4 px-5 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)]">
      {code ? <RoomPage key={code} code={code} /> : <Landing />}
    </main>
  );
};
