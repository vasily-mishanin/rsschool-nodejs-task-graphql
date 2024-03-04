import { Post, PrismaClient, Profile } from '@prisma/client';
import { GraphQLList, GraphQLObjectType, validate } from 'graphql';
import { MemberTypeIdEnum, MemberTypeType } from '../types/member-type.js';
import { PostType } from '../types/post.js';
import { ProfileType } from '../types/profile.js';
import { UserType } from '../types/user.js';
import { UUIDType } from '../types/uuid.js';
import { memberTypeResolver } from './resolvers/memberTypeResolver.js';
import { memberTypesResolver } from './resolvers/memberTypesResolver.js';
import { postResolver } from './resolvers/postResolver.js';
import { postsResolver } from './resolvers/postsResolver.js';
import { profileResolver } from './resolvers/profileResolver.js';
import { profilesResolver } from './resolvers/profilesResolver.js';
import { userResolver } from './resolvers/userResolver.js';
import { usersResolver } from './resolvers/usersResolver.js';
import DataLoader from 'dataloader';

export const resourcesQuery = (
  prisma: PrismaClient,
  profileLoader: DataLoader<string, Profile, string>,
  postsLoader: DataLoader<string, Post[], string>,
) => {
  return new GraphQLObjectType({
    name: 'Query',
    fields: {
      memberTypes: {
        type: new GraphQLList(MemberTypeType),
        resolve: async () => await memberTypesResolver(prisma),
      },

      posts: {
        type: new GraphQLList(PostType),
        resolve: async () => await postsResolver(prisma),
      },

      users: {
        type: new GraphQLList(UserType),
        resolve: async () => usersResolver(prisma, profileLoader, postsLoader),
      },

      profiles: {
        type: new GraphQLList(ProfileType),
        resolve: async () => await profilesResolver(prisma),
      },

      memberType: {
        type: MemberTypeType,
        args: {
          id: { type: MemberTypeIdEnum },
        },
        resolve: async (_, args) => memberTypeResolver(args, prisma),
      },

      post: {
        type: PostType,
        args: {
          id: { type: UUIDType },
        },
        resolve: async (_, args) => postResolver(args, prisma),
      },

      user: {
        type: UserType,
        args: {
          id: { type: UUIDType },
        },
        resolve: async (_, args) => userResolver(args, prisma),
      },

      profile: {
        type: ProfileType,
        args: {
          id: { type: UUIDType },
        },
        resolve: async (_, args) => profileResolver(args, prisma),
      },
    },
  });
};
