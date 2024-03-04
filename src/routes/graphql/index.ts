import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  ExecutionResult,
  GraphQLSchema,
  Source,
  graphql,
  parse,
  validate,
} from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { resourcesMutation } from './mutations/resourcesMutation.js';
import { resourcesQuery } from './queries/resourcesQuery.js';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';

const MAX_DEPTH = 5;

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

    //preHandler: depthLimit(5),
    async handler(req) {
      const { query, variables } = req.body;

      const validationErrors = validate(
        ResourcesSchema,
        parse(new Source(req.body.query)),
        [depthLimit(MAX_DEPTH)],
      );

      if (validationErrors.length) {
        return { errors: validationErrors } as ExecutionResult;
      }

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
