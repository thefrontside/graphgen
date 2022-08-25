import { useEffect, useState } from 'react'
import { TopBar } from './components/TopBar/TopBar'
import './App.css'
import { useGraphgen } from './hooks/useGraphgen/useGraphgen';
import type { GraphGen } from '@frontside/graphgen';
import { GraphInspector } from './components/Inspector/Inspector';

function App() {
  const factory = useGraphgen();
  const isLoading = !factory;
  const [graph, setGraph] = useState<{[k: string]: any}>();
  
  useEffect(() => {
    if(!factory || !!graph) {
      return;
    }
    const roots = {} as {[k: string]: any};
    
    for(const root of Object.keys(factory.graph.roots)) {
      roots[root] = [factory.create(root)];
    }

    setGraph(roots);
  }, [factory, graph]);

  console.log(graph);

  return (
    <>
      <TopBar />
      <section className="main">
        <section className="margin"/>
        <section className="left">
          <div className="top"></div>
          <div className="bottom"></div>
        </section>
        <section className="right">
          <GraphInspector graph={graph}/>
        </section>
      </section>
    </>
  )
}

export default App
