import { useLogic } from '@react-logic/react-logic';
import { PostsLogic } from './logic';
import styles from './styles.module.css';

const renderStatus = (s: {
  idle: boolean;
  loading: boolean;
  failed: boolean;
}) => {
  if (s.idle) return { text: 'idle', cls: styles.statusIdle };
  if (s.loading) return { text: 'loading…', cls: styles.statusLoad };
  if (s.failed) return { text: 'failed', cls: styles.statusErr };
  return { text: 'success', cls: styles.statusOk };
};

export const App = () => {
  const logic = useLogic(PostsLogic);
  const posts = logic.posts();
  const submitState = logic.submit();
  const draft = logic.draft();
  const postsStatus = renderStatus(posts);
  const submitStatus = renderStatus(submitState);

  return (
    <main>
      <h1>Fetch state demo</h1>
      <p className="subtitle">
        Reactive search aborts the previous request on every keystroke.
        Imperative comment-post fires only when you click submit.
      </p>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Search posts (reactive)</h2>
          <input
            className={styles.input}
            placeholder="filter title…"
            onChange={(e) => logic.posts.fetch(e.target.value)}
          />
          <p className={styles.status}>
            <span className={postsStatus.cls}>{postsStatus.text}</span>
            {!posts.idle && !posts.loading && !posts.failed && (
              <> · HTTP {posts.status}</>
            )}
          </p>
          <ul className={styles.list}>
            {!posts.idle && !posts.loading && !posts.failed &&
              posts.result.slice(0, 5).map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
            {posts.failed && <li>Error: {posts.error.message}</li>}
          </ul>
          <p className={styles.hint}>
            Type fast — Network tab shows aborted requests.
          </p>
        </section>

        <section className={styles.card}>
          <h2>Post a comment (imperative · postFetchState)</h2>
          <textarea
            className={styles.textarea}
            placeholder="comment body…"
            value={draft}
            onChange={(e) => logic.draft(e.target.value)}
          />
          <button
            className={styles.btn}
            disabled={!draft.trim() || submitState.loading}
            onClick={() => logic.submit.fetch()}
          >
            {submitState.loading ? 'Submitting…' : 'Submit'}
          </button>
          <p className={styles.status}>
            <span className={submitStatus.cls}>{submitStatus.text}</span>
            {!submitState.idle && !submitState.loading && !submitState.failed && (
              <> · HTTP {submitState.status} · id #{submitState.result.id}</>
            )}
            {submitState.failed && <> · {submitState.error.message}</>}
          </p>
          <p className={styles.hint}>
            JSONPlaceholder always returns a fake new id; nothing is really
            stored.
          </p>
        </section>
      </div>
    </main>
  );
};
