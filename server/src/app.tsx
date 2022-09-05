import useAsset from "ultra/hooks/use-asset.js";
import { GraphInspector } from "./inspector/components/GraphInspector/GraphInspector.tsx";
import { useEffect, useState } from "react";

export default function App() {
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>basic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href={useAsset("./favicon.ico")} />
        <link rel="stylesheet" href={useAsset("./index.css")} />
        <link rel="stylesheet" href={useAsset("./GraphInspector.css")} />
        <link rel="stylesheet" href={useAsset("./TopBar.css")} />
      </head>
      <body>
        <main>
          {pageLoaded ? <GraphInspector /> : null}
        </main>
      </body>
    </html>
  );
}
