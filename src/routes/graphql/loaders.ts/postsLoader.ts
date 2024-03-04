import { Post, PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

// POSTS BATCH LOADER
export const postsLoader = (prisma: PrismaClient) =>
  new DataLoader<string, Post[]>(async (userIds) => {
    // Batch load posts for the given user IDs
    const userIdsMutable: string[] = [...userIds];
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: userIdsMutable },
      },
    });

    // Group posts by authorId

    const postsByUser = new Map<string, Post[]>();
    posts.forEach((post) => {
      const userPosts = postsByUser.get(post.authorId) || [];
      userPosts.push(post);
      postsByUser.set(post.authorId, userPosts);
    });

    // Return posts in the same order as userIds
    const processedPosts = userIds.map((userId) => postsByUser.get(userId) || []);
    return processedPosts;
  });
