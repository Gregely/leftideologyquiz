import { mount } from 'svelte';
import { rawContent } from '$content-source';
import { parseContent } from './content/load.js';
import { buildModel, withConfig } from './engine/index.js';
import App from './App.svelte';
import LoadFailed from './components/LoadFailed.svelte';
import './styles/tokens.css';
import './styles/global.css';

const target = document.getElementById('app') as HTMLElement;

// Content is proved valid by `npm run validate` in CI, so a parse failure here
// means a broken build. It still gets a readable page rather than a blank one.
const { content } = parseContent(rawContent);

if (content) {
  const model = buildModel(content, withConfig());
  // The only randomness in the app: which order this session shows options in.
  const newSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
  mount(App, { target, props: { model, newSeed } });
} else {
  mount(LoadFailed, { target });
}
