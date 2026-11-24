import { ApiCheck, AssertionBuilder, CheckGroupV2 } from 'checkly/constructs';

export interface User {
  id: number;
  name: string;
  profile_url: string;
}

// Builds one API check for one user entry. Reusable: call it once per entry
// from any list of users, and pass the group the check should belong to.
export function createUserApiCheck(user: User, group: CheckGroupV2): ApiCheck {
  return new ApiCheck(`user-profile-${user.id}`, {
    name: `User profile: ${user.name} (id ${user.id})`,
    group,
    request: {
      method: 'GET',
      url: user.profile_url,
      // {{USERS_API_TOKEN}} is filled in by Checkly when the check runs.
      // The token itself is never written in this repository.
      headers: [{ key: 'Authorization', value: 'Bearer {{USERS_API_TOKEN}}' }],
      assertions: [
        AssertionBuilder.statusCode().equals(200),
        AssertionBuilder.jsonBody('$.id').equals(user.id),
        AssertionBuilder.jsonBody('$.name').equals(user.name),
      ],
    },
  });
}
