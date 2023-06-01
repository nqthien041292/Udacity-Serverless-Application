import {CustomAuthorizerEvent, CustomAuthorizerResult} from 'aws-lambda'
import 'source-map-support/register'

import {decode, verify} from 'jsonwebtoken'
import {createLogger} from '../../utils/logger'
import Axios from 'axios'
import {Jwt} from '../../auth/Jwt'
import {JwtPayload} from '../../auth/JwtPayload'

const logger = createLogger('auth')

// DONE: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-4j7w7l3d.auth0.com/.well-known/jwks.json'

export const handler = async (
    event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // DONE: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  try {
    const response = await Axios(jwksUrl)
    logger.info('Successfully retrieve jwks keys', response);
    const keys = response.data.keys
    const signingKeys = keys
        .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
            && key.kty === 'RSA' // We are only supporting RSA
            && key.kid           // The `kid` must be present to be useful for later
            && key.x5c && key.x5c.length // Has useful public keys (we aren't using n or e)
        ).map(key => {
          return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
        });
    if (!signingKeys.length) {
      logger.error('The JWKS endpoint did not contain any signing keys');
      throw new Error('Failed to retrieve jwks keys')
    } else {
      const cert = signingKeys[0].publicKey
      return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
    }
  } catch (err) {
    logger.error('Failed to retrieve jwks keys', err);
    throw new Error('Failed to retrieve jwks keys')
  }
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  return split[1]
}

function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}
