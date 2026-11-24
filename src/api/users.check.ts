import { CheckGroupV2 } from 'checkly/constructs';
import { secret } from 'checkly/util';
import { createUserApiCheck } from './user-check-builder';
import data from './users.json';

// Group 2: one API check per entry in users.json.
// Add an entry to the JSON file and the next `npx checkly deploy` adds its check.
export const userApiGroup = new CheckGroupV2('user-api-checks', {
  name: 'User API checks',
  environmentVariables: [
    // Read from CHECKLY_SECRET_USERS_API_TOKEN on the machine that runs the
    // CLI (see .env.example) and stored in Checkly as an encrypted secret.
    { key: 'USERS_API_TOKEN', value: secret('USERS_API_TOKEN'), secret: true },
  ],
});

for (const user of data.users) {
  createUserApiCheck(user, userApiGroup);
}
