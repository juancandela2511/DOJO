import * as state from './dojoState';
import * as themeMod from './useTheme';
import * as authMod from './useAuth';
import * as pathMod from './useLearningPaths';
import * as studentMod from './useStudents';

export function useDojoStore() {
  return {
    ...state,
    ...themeMod,
    ...authMod,
    ...pathMod,
    ...studentMod,
  };
}
