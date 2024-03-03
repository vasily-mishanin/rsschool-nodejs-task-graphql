import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLSchema } from 'graphql';
import { resourcesMutation } from './mutations/resourcesMutation.js';
import { resourcesQuery } from './queries/resourcesQuery.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  const ResourcesSchema = new GraphQLSchema({
    query: resourcesQuery(prisma),
    mutation: resourcesMutation(prisma),
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
        schema: ResourcesSchema,
        source: query,
        variableValues: variables,
      });
      return result;
    },
  });
};

export default plugin;
