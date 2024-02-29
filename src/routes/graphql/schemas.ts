import { Type } from '@fastify/type-provider-typebox';

export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  }),
);

export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    },
  ),
};

// export const getAllResourcesSchema = new GraphQLSchema({
//   query: new GraphQLObjectType({
//     name: 'getAllResourcesSchema',
//     fields: {
//       memberTypes: {
//         type: new GraphQLList(MemberTypeType),
//         resolve: () => resolvers.memberTypes(prisma),
//       },
//       posts: { type: new GraphQLList(PostType), resolve: resolvers.posts },
//       users: { type: new GraphQLList(UserType), resolve: resolvers.users },
//       profiles: { type: new GraphQLList(ProfileType), resolve: resolvers.profiles },
//     },
//   }),
// });
