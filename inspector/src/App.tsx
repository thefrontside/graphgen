import { useEffect, useState } from 'react'
import { TopBar } from './components/TopBar/TopBar'
import type { GraphGen, GraphQLOptions } from '@frontside/graphgen';
import './App.css'
import { useGraphgen } from './hooks/useGraphgen/useGraphgen';

function App() {
  const [schema, setSchema] = useState<string>();
  const factory = useGraphgen({ source: schema });

  useEffect(() => {
    console.log(factory);
  }, [factory]);
 
  return (
    <>
      <TopBar setSchema={setSchema} />
      <section className="main">
        <section className="margin"/>
        <section className="left">
          <div className="top">top</div>
          <div className="bottom">bottom</div>
        </section>
        <section className="right">
          right
        </section>
      </section>
    </>
  )
}

export default App
