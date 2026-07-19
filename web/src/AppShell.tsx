import { useState } from 'react';
import { COLORS } from './theme';
import type { User } from './api/types';
import TabBar from './components/TabBar';
import GoalsSheet from './components/GoalsSheet';
import HomePage from './pages/HomePage';
import WorkoutsList from './pages/workouts/WorkoutsList';
import WorkoutDetail from './pages/workouts/WorkoutDetail';
import WorkoutEditor from './pages/workouts/WorkoutEditor';
import MealsPage from './pages/MealsPage';
import ProgressPage from './pages/ProgressPage';

export type Tab = 'home' | 'workouts' | 'meals';
type WorkoutsSubview = 'list' | 'detail' | 'editor';

export default function AppShell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab, setTabState] = useState<Tab>('home');
  const [workoutsSubview, setWorkoutsSubview] = useState<WorkoutsSubview>('list');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const setTab = (t: Tab) => {
    setTabState(t);
    setWorkoutsSubview('list');
    setActiveWorkoutId(null);
  };

  const openWorkout = (id: string) => {
    setTabState('workouts');
    setActiveWorkoutId(id);
    setWorkoutsSubview('detail');
  };

  const startNewWorkout = () => {
    setActiveWorkoutId(null);
    setEditingIsNew(true);
    setWorkoutsSubview('editor');
  };

  const editActiveWorkout = () => {
    setEditingIsNew(false);
    setWorkoutsSubview('editor');
  };

  const cancelEdit = () => {
    setWorkoutsSubview(editingIsNew ? 'list' : 'detail');
  };

  const afterSave = (id: string) => {
    setActiveWorkoutId(id);
    setWorkoutsSubview('detail');
  };

  const afterDeleteFromDetail = () => {
    setActiveWorkoutId(null);
    setWorkoutsSubview('list');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: COLORS.bgApp }}>
      <div style={{ flex: 1, paddingBottom: 14 }}>
        {tab === 'home' && (
          <HomePage user={user} onOpenWorkout={openWorkout} onOpenGoals={() => setShowGoals(true)} onOpenProgress={() => setShowProgress(true)} />
        )}

        {tab === 'workouts' && workoutsSubview === 'list' && (
          <WorkoutsList onOpen={openWorkout} onNew={startNewWorkout} />
        )}
        {tab === 'workouts' && workoutsSubview === 'detail' && activeWorkoutId && (
          <WorkoutDetail
            workoutId={activeWorkoutId}
            onBack={() => { setWorkoutsSubview('list'); setActiveWorkoutId(null); }}
            onEdit={editActiveWorkout}
            onDeleted={afterDeleteFromDetail}
          />
        )}
        {tab === 'workouts' && workoutsSubview === 'editor' && (
          <WorkoutEditor
            workoutId={editingIsNew ? null : activeWorkoutId}
            isNew={editingIsNew}
            onCancel={cancelEdit}
            onSaved={afterSave}
          />
        )}

        {tab === 'meals' && <MealsPage />}
      </div>

      <TabBar tab={tab} onChange={setTab} />

      {showGoals && <GoalsSheet onClose={() => setShowGoals(false)} onLogout={onLogout} />}
      {showProgress && <ProgressPage onBack={() => setShowProgress(false)} onLogout={onLogout} />}
    </div>
  );
}
