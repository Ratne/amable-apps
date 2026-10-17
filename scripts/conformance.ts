import { main } from '../.amable/packages/app-cli/src/cli';

/** `amable-app test` from the AmableData checkout, so CI tests with the CRM's own schema. */
process.exitCode = await main(['test', ...process.argv.slice(2)]);
