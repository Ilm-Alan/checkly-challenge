import { EmailAlertChannel } from 'checkly/constructs';

// Where failure alerts go. Every check in the project uses this channel
// (see `alertChannels` in checkly.config.ts).
export const emailChannel = new EmailAlertChannel('raccoon-email', {
  address: 'raccoon@checklyhq.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: false,
});
