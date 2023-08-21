import { KMSClient, SignCommand, SignCommandInput } from '@aws-sdk/client-kms'
import { TokenGenerationConfig } from '../config/interop-token.config.js'
import { InteropJwtHeader, InteropJwtPayload, InteropToken, JWT_INTERNAL_ROLE, b64ByteUrlEncode, b64UrlEncode } from '../index.js'
import { v4 as uuidv4 } from 'uuid'

const JWT_HEADER_ALG = "RS256"
const KMS_SIGNING_ALG = "RSASSA_PKCS1_V1_5_SHA_256"


export class InteropTokenGenerator {
  private kmsClient: KMSClient

  constructor(private config: TokenGenerationConfig) {
    this.kmsClient = new KMSClient()
  }

  public async generateInternalToken(): Promise<InteropToken> {

    const currentTimestamp = Math.floor(Date.now() / 1000)

    const header: InteropJwtHeader = {
      alg: JWT_HEADER_ALG,
      use: "sig",
      typ: "at+jwt",
      kid: this.config.kid
    }

    const payload: InteropJwtPayload = {
      jti: uuidv4(),
      iss: this.config.issuer,
      aud: this.config.audience,
      sub: this.config.subject,
      iat: currentTimestamp,
      nbf: currentTimestamp,
      exp: currentTimestamp + this.config.secondsDuration,
      role: JWT_INTERNAL_ROLE
    }

    const serializedToken = `${b64UrlEncode(JSON.stringify(header))}.${b64UrlEncode(JSON.stringify(payload))}`

    const commandParams: SignCommandInput = {
      KeyId: this.config.kid,
      Message: new TextEncoder().encode(serializedToken),
      SigningAlgorithm: KMS_SIGNING_ALG
    }

    const command = new SignCommand(commandParams)
    const response = await this.kmsClient.send(command)

    if (!response.Signature)
      throw Error("JWT Signature failed. Empty signature returned")

    const jwtSignature = b64ByteUrlEncode(response.Signature)

    return {
      header: header,
      payload: payload,
      serialized: `${serializedToken}.${jwtSignature}`
    }
  }

}
