# Validator Connector

A simple docker container that can proxy requests to `validator-console` via simple HTTP API without the need of installing full TON node.

# How to use

```bash
docker run -p 3000:3000 tonwhales/validator-connector:v1
```

Then do HTTP POST with body:

```json
{ 
  "clientSecret": "<base64 of a secret key>",
  "serverPublic": "<base64 of a public key>",
  "endpoint": "<host>:<port>",
  "command": "<command to execute>"
}
```

# License
MIT

