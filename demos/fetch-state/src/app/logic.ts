import { state } from '@react-logic/react-logic';
import { fetchState, postFetchState } from '@react-logic/utils';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

/**
 * Fetch state has two modes, same accessor shape:
 *
 *   - reactive (`fetchState(build)`)            — re-fires on input change.
 *   - imperative (`fetchState.callable(build)`) — fires on `.fetch(...)`.
 *
 * Plus verb-preset helpers (`postFetchState`, `putFetchState`,
 * `deleteFetchState`) that bake in the HTTP method. Each helper preserves
 * the full `fetchState` surface — reactive + `.callable` companion.
 */
export class PostsLogic {
  // Reactive search: typing into the input writes the wrapped signal, which
  // re-fires the GET. Previous in-flight request is aborted automatically.
  posts = fetchState<(q?: string) => string, Post[]>((q = '') =>
    q
      ? `https://jsonplaceholder.typicode.com/posts?title_like=${encodeURIComponent(q)}`
      : 'https://jsonplaceholder.typicode.com/posts?_limit=5'
  );

  // The comment draft — owned by the logic class, not React state. The
  // textarea reads/writes this signal the same way any other field would.
  draft = state('');

  // Imperative mutation via the POST verb helper. `.callable` keeps the
  // request out of the reactive graph — it only fires on `.submit()`.
  submit = postFetchState.callable<[], Comment>(() => ({
    url: 'https://jsonplaceholder.typicode.com/comments',
    body: {
      postId: 1,
      name: 'demo',
      email: 'demo@example.com',
      body: this.draft(),
    },
  }));
}
