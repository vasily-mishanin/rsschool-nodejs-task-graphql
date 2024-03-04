import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

export const usersResolver = async (prisma: PrismaClient) => {
  // PROFILE BATCH LOADER
  const profileLoader = new DataLoader<string, any>(async (userIds) => {
    const userIdsMutable: string[] = [...userIds];

    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: userIdsMutable },
      },
    });

    // Map profiles by userId
    const profileMap = new Map<string, any>();
    profiles.forEach((profile) => {
      profileMap.set(profile.userId, profile);
    });

    // Return profiles in the same order as userIds
    return userIds.map((userId) => profileMap.get(userId));
  });

  // POSTS BATCH LOADER
  const postsLoader = new DataLoader<string, any[]>(async (userIds) => {
    // Batch load posts for the given user IDs
    const userIdsMutable: string[] = [...userIds];
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: userIdsMutable },
      },
    });

    // Group posts by authorId

    const postsByUser = new Map<string, any[]>();
    posts.forEach((post) => {
      const userPosts = postsByUser.get(post.authorId) || [];
      userPosts.push(post);
      postsByUser.set(post.authorId, userPosts);
    });

    // Return posts in the same order as userIds
    return userIds.map((userId) => postsByUser.get(userId) || []);
  });

  const users = await prisma.user.findMany();
  await prisma.memberType.findMany();

  // Batch load profiles and posts using DataLoader
  const profileBatch = users.map((user) => profileLoader.load(user.id));
  const postsBatch = users.map((user) => postsLoader.load(user.id));

  const profiles = await Promise.all(profileBatch);
  const posts = await Promise.all(postsBatch);

  console.log('PRFILES', profiles);
  console.log('POSTS', posts);

  // Combine user data with loaded profiles and posts
  const result = users.map((user, index) => ({
    ...user,
    profile: { ...profiles[index], memberType: { id: profiles[index].memberTypeId } },
    posts: posts[index],
  }));
  console.log('RESULT', result);
  return result;

  // const promises = users.map(async (user) => {
  //   const profile = await prisma.profile.findUnique({
  //     where: { userId: user.id },
  //   });

  //   const posts = await prisma.post.findMany({ where: { authorId: user.id } });
  //   return {
  //     ...user,
  //     profile: { ...profile, memberType: { id: profile?.memberTypeId } },
  //     posts,
  //   };
  // });

  // try {
  //   const users = await Promise.all(promises);
  //   return users;
  // } catch (error) {
  //   console.log('ERROR - users resolver');
  // }
};
