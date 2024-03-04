import { test } from 'tap';
import { build } from '../helper.js';
import {
  createPost,
  createProfile,
  createUser,
  getPrismaStats,
  gqlQuery,
  subscribeTo,
  unsubscribeFrom,
} from '../utils/requests.js';
import { MemberTypeId } from '../../src/routes/member-types/schemas.js';

await test('gql-loader', async (t) => {
  const app = await build(t);

  await t.test('Get users with their posts, memberTypes.', async (t) => {
    const { body: user1 } = await createUser(app);
    await createPost(app, user1.id);
    await createProfile(app, user1.id, MemberTypeId.BASIC);
    const { body: user2 } = await createUser(app);
    await createPost(app, user2.id);
    await createProfile(app, user2.id, MemberTypeId.BUSINESS);

    await subscribeTo(app, user1.id, user2.id);
    await subscribeTo(app, user2.id, user1.id);

    const {
      body: { operationHistory: beforeHistory },
    } = await getPrismaStats(app);

    const {
      body: { errors },
    } = await gqlQuery(app, {
      query: `query {
        users {
            id
            posts {
              id
            }
            profile {
              id
              memberType {
                id
              }
            }
            userSubscribedTo {
              id
            }
            subscribedToUser {
              id
            }
        }
    }`,
    });

    const {
      body: { operationHistory: afterHistory },
    } = await getPrismaStats(app);

    console.log('TEST', errors);

    t.ok(!errors);
    console.log('TEST <=6', afterHistory.length - beforeHistory.length);
    t.ok(afterHistory.length - beforeHistory.length <= 6);

    const history = afterHistory.slice(beforeHistory.length);
    const foundPostCall = history.find(
      ({ model, operation }) => model === 'Post' && operation === 'findMany',
    );
    const foundMemberTypeCall = history.find(
      ({ model, operation }) => model === 'MemberType' && operation === 'findMany',
    );
    console.log('TEST foundPostCall', foundPostCall);
    t.ok(foundPostCall);
    console.log('TEST foundMemberTypeCall', foundMemberTypeCall);
    t.ok(foundMemberTypeCall);
  });

  await t.test('Dataloader should be created per request.', async (t) => {
    const { body: user1 } = await createUser(app);
    const { body: user2 } = await createUser(app);

    await subscribeTo(app, user1.id, user2.id);

    await gqlQuery(app, {
      query: `query {
        users {
          id
          userSubscribedTo {
            id
          }
        }
      }`,
    });

    await unsubscribeFrom(app, user1.id, user2.id);

    const {
      body: { data, errors },
    } = await gqlQuery(app, {
      query: `query {
        users {
          id
          userSubscribedTo {
            id
          }
        }
      }`,
    });

    console.log('ERRORS', errors);
    const foundUser1 = data.users.find(({ id }) => id === user1.id);

    console.log('FOUND USER-1', foundUser1);

    t.ok(foundUser1.userSubscribedTo.length === 0);
  });
});
