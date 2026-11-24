import { defineConfig } from 'checkly';
import { Frequency } from 'checkly/constructs';
import { emailChannel } from './src/alert-channels';

export default defineConfig({
  projectName: 'Raccoon Synthetics',
  logicalId: 'raccoon-synthetics',
  checks: {
    // Any file ending in .check.ts under src/ defines checks or groups.
    checkMatch: 'src/**/*.check.ts',
    runtimeId: '2026.04',
    frequency: Frequency.EVERY_10M,
    locations: ['us-east-1', 'eu-west-1'],
    // Default for every check in the project: email on failure.
    alertChannels: [emailChannel],
  },
  cli: {
    runLocation: 'us-east-1',
  },
});
