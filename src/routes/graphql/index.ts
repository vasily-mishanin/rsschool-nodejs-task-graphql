import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  ExecutionResult,
  graphql,
  GraphQLSchema,
  parse,
  Source,
  validate,
} from 'graphql';
import { resourcesMutation } from './mutations/resourcesMutation.js';
import { resourcesQuery } from './queries/resourcesQuery.js';
import depthLimit from 'graphql-depth-limit';

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
        [depthLimit(5)],
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
