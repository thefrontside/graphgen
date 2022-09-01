import { weighted, Generate } from "../../mod.ts";
import { Computed } from "../server/types.ts";
import { fakergen } from "./fakerGen.ts";


type Lifecycle = 'deprecated' | 'experimental' | 'production';

const lifecycles = weighted<Lifecycle>([['deprecated', .15], ['experimental', .5], ['production', .35]]);

const gen: Generate = (info) => {
  if (info.method === "@backstage/component.lifecycle") {
    return lifecycles.sample(info.seed);
  } else {
    return info.next();
  }
}

export const computed: Computed = {
  generate: [gen, fakergen],
  compute: {
    "User.name": ({ displayName }) => `${displayName.toLowerCase().replace(/\s+/g, '.')}`,
    "User.email": ({ name }) => `${name}@example.com`,
    "Group.name": ({ department }) => `${department.toLowerCase()}-department`,
    "Group.description": ({ department }) => `${department} Department`,
    "Group.displayName": ({ department }) => `${department} Department`,
    "Group.email": ({ department }) => `${department.toLowerCase()}@acme.com`,

    "Component.type": () => "website",

    "System.name": ({ displayName }) => displayName.toLowerCase().replace(/\s+/g, '-'),
    "System.description": ({ displayName }) => `Everything related to ${displayName}`,
  },
}