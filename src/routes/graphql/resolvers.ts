export const resolvers = {
  memberTypes: async (prisma) => {
    prisma.memberType.findMany();
  },
};
