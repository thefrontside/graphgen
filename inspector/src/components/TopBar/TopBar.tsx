import { ChangeEventHandler, MouseEventHandler, useState } from 'react';
import './TopBar.css';
import { RunButton } from '../RunButton/RunButton'
import { assert } from 'assert-ts';

interface TopBarProps {
  setSchema?: (schema: string) => void;
}

export function TopBar({ setSchema = () => void 0 }: TopBarProps = {}): JSX.Element {
  const [input, setInput] = useState('https://raw.githubusercontent.com/thefrontside/backstage/main/packages/graphgen/src/world.graphql');

  const onChangeHandler: ChangeEventHandler<HTMLInputElement> = event => {
     setInput(event.target.value);
  };

  const onClick: MouseEventHandler<HTMLButtonElement> = event => {
    assert(!!input, 'no schemna');

    setSchema(input);
  }
  
  return (
    <section className="top-bar">
      <label htmlFor="schema">Schema</label>
      <input id="schema" name="schema" onChange={onChangeHandler} value={input} />
      <RunButton changeHandler={onClick} />
    </section>
  );
}