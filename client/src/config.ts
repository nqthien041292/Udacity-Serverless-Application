// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'y1po7px9jf'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-dlx87j2b7mpd5lph.us.auth0.com',            // Auth0 domain
  clientId: 'QI1ox9KghdOwtUV0RCM0VM5acBjpy1iq',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
