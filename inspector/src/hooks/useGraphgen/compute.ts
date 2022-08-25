import { createDispatch, Generate, GenerateInfo, Seed, weighted } from '@frontside/graphgen';
import { faker as globalFaker, Faker } from '@faker-js/faker';

export const compute = {
  "User.name": ({ displayName }: any) => `${displayName.toLowerCase().replace(/\s+/g, '.')}`,
  "User.email": ({ name }: any) => `${name}@example.com`,
  "Group.name": ({ department }: any) => `${department.toLowerCase()}-department`,
  "Group.description": ({ department }: any) => `${department} Department`,
  "Group.displayName": ({ department }: any) => `${department} Department`,
  "Group.email": ({ department }: any) => `${department.toLowerCase()}@acme.com`,

  "Component.type": () => "website",

  "System.name": ({ displayName }: any) => displayName.toLowerCase().replace(/\s+/g, '-'),
  "System.description": ({ displayName }: any) => `Everything related to ${displayName}`,
};

const lifecycles = weighted([['deprecated', .15], ['experimental', .5], ['production', .35]]);

export const gen: Generate = (info) => {
  if (info.method === "@backstage/component.lifecycle") {
    return lifecycles.sample(info.seed);
  } else {
    return info.next();
  }
}

function createFaker(seed: Seed): Faker {
  const faker = new Faker({ locales: globalFaker.locales });
   faker.seed(seed() * 1000);
   return faker;
 }
 
 const methods = Object.entries(globalFaker).reduce((methods, [name, mod]) => {
   if (mod) {
     for (const [fn, value] of Object.entries(mod)) {
       if (typeof value === 'function') {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         methods[`@faker/${name}.${fn}`] = ({ faker }: any, args: unknown[]) => {
           return faker[name][fn](...args);
         };
       }
     }
   }
   return methods;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
 }, {} as Record<string, any>);

const dispatch = createDispatch({
  methods: {
    ...methods,
    '@backstage/tags': ({ faker }) => faker.lorem.words(3).split(' '),
  },
  patterns: {
    '*.firstName': '@faker/name.firstName',
    '*.lastName': '@faker/name.lastName',
    '*.name': '@faker/name.fullName',
    '*.avatar': '@faker/internet.avatar',
    '*.avatarUrl': '@faker/internet.avatar',
    '*.password': '@faker/internet.password',
  },
  context: (info: GenerateInfo) => {
    return ({ ...info, faker: createFaker(info.seed) });
  },
});

export const fakergen: Generate = info => {
  const result = dispatch.dispatch(info.method, info, info.args);
  if (result.handled) {
    return result.value;
  } else {
    return info.next();
  }
};
