import { ref } from 'vue';

const savedTheme =
  typeof window !== 'undefined' && window.localStorage.getItem('dojo-theme') === 'light'
    ? 'light'
    : 'dark';

export const theme = ref<'dark' | 'light'>(savedTheme);

function applyThemeToDom(mode: 'dark' | 'light'): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('dojo-theme', mode);
  }
}

applyThemeToDom(theme.value);

export function toggleTheme(): void {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  applyThemeToDom(theme.value);
}
