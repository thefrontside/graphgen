import { gql } from 'graphql_tag';

export const typeDefs = gql`
  type User {
    id: Int 
    first_name: String
    last_name: String
  }

  type UserOutput {
    id: Int 
  }

  type Query {
    fetchUser(id: Int): User 
  }

  type Mutation {
    insertUser(first_name: String!, last_name: String!): UserOutput!
  }
`;

export const resolvers = {
  Query: {
    fetchUser: (parent: any, { id }: any, context: any, info: any) => {
      return {
        id: 1,
        first_name: "Paul",
        last_name: "Cowan",
      };
    },
  },
  Mutation: {
    insertUser: (parent: any, { first_name, last_name }: any, context: any, info: any) => {
      console.log("input:", first_name, last_name);
      return {
        id: 1,
      };
    },
  },
};
