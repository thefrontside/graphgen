import { MouseEventHandler } from 'react';
import './RunButton.css';

interface RunButtonProps {
  changeHandler: MouseEventHandler<HTMLButtonElement>;
}

export function RunButton({ changeHandler }: RunButtonProps): JSX.Element {
  return (
    <div className="run-button">
      <button type="button" onClick={changeHandler}>
        <svg width="35" height="35" viewBox="3.5,4.5,24,24">
          <path d="M 11 9 L 24 16 L 11 23 z"></path>
        </svg>
      </button>
    </div>
  )
}