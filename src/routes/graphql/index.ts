import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFloat,
} from 'graphql';
import { MemberTypeType } from './types/member-type.js';
import { PostType } from './types/post.js';
import { UserType } from './types/user.js';
import { ProfileType } from './types/profile.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  const getAllResourcesSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'getAllResourcesSchema',
      fields: {
        memberTypes: {
          type: new GraphQLList(MemberTypeType),
          resolve: () => prisma.memberType.findMany(),
        },
        posts: { type: new GraphQLList(PostType), resolve: () => prisma.post.findMany() },
        users: { type: new GraphQLList(UserType), resolve: () => prisma.user.findMany() },
        profiles: {
          type: new GraphQLList(ProfileType),
          resolve: () => prisma.profile.findMany(),
        },
      },
    }),
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },

    async handler(req) {
      const { query, variables } = req.body;
      const result = await graphql({
        schema: getAllResourcesSchema,
        source: query,
        variableValues: variables,
      });
      return result;
    },
  });
};

export default plugin;
