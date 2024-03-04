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
import { profileLoader } from './loaders.ts/profileLoader.js';
import { postsLoader } from './loaders.ts/postsLoader.js';
import DataLoader from 'dataloader';
import { Post, Profile } from '@prisma/client';

const MAX_DEPTH = 5;

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma, httpErrors } = fastify;

  const ResourcesSchema = (
    profileLoader: DataLoader<string, Profile, string>,
    postsLoader: DataLoader<string, Post[], string>,
  ) =>
    new GraphQLSchema({
      query: resourcesQuery(prisma, profileLoader, postsLoader),
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

      // loaders for caching data must be created for each request - so schema too
      const resourcesSchema = ResourcesSchema(profileLoader(prisma), postsLoader(prisma));

      const validationErrors = validate(
        resourcesSchema,
        parse(new Source(req.body.query)),
        [depthLimit(MAX_DEPTH)],
      );

      if (validationErrors.length) {
        return { errors: validationErrors } as ExecutionResult;
      }

      const result = await graphql({
        schema: resourcesSchema,
        source: query,
        variableValues: variables,
      });

      return result;
    },
  });
};

export default plugin;
