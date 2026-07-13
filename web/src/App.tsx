import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api/client';
import { queryKeys } from './api/queryKeys';
import Shell from './Shell';
import LoginPage from './pages/LoginPage';
import AppShell from './AppShell';

export default function App() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.me,
    queryFn: api.me,
  });

  if (isLoading) {
    return <Shell>{null}</Shell>;
  }

  if (!data?.user) {
    return (
      <Shell>
        <LoginPage onLoggedIn={(user) => queryClient.setQueryData(queryKeys.me, { user })} />
      </Shell>
    );
  }

  return (
    <Shell>
      <AppShell
        user={data.user}
        onLogout={() => {
          api.logout().finally(() => {
            queryClient.clear();
            queryClient.setQueryData(queryKeys.me, { user: null });
          });
        }}
      />
    </Shell>
  );
}
