# Security policy

## Supported versions

Only the `master` branch is maintained. Fixes are not backported.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub:
**Security → Report a vulnerability** on this repository
([direct link](https://github.com/a-3isa/lms-1/security/advisories/new)).

Please do not open a public issue for a security problem.

Include what you can of:
- the route or file affected;
- steps to reproduce, or a proof of concept;
- the impact you expect.

I aim to acknowledge reports within a week. Once an issue is confirmed, a fix is
prepared on a private branch and you are credited in the advisory unless you prefer not to be.

## Scope

In scope: the code in this repository.

Out of scope: findings that need a stolen admin account or leaked environment secrets,
denial of service by volume, and the third-party services the API calls (the SMTP
provider).
