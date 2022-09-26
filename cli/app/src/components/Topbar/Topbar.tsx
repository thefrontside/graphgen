import './top-bar.css';

export function Topbar(): JSX.Element {
  return (
    <section className="top-bar">
      <ul>
        <li><h1>Graphgen</h1></li>
        <li><a target="_blank" href="/graphql">GraphiQL</a></li>
      </ul>
    </section>
  );
}