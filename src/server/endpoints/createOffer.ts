import Debug from 'debug'
import { Request, Response } from 'express'
import { sendErrorResponse } from '@sphereon/ssi-express-support'
import { SupportedVersion } from '@sphereon/did-auth-siop'

import { Verifier } from 'verifier/Verifier'
import passport from 'passport'
import { v4 } from 'uuid'
import { replaceParamsInUrl } from '@utils/replaceParamsInUrl'
import { getBaseUrl } from '@utils/getBaseUrl'
import { openObserverLog } from '@utils/openObserverLog'

const debug = Debug('verifier:createOffer')
interface CreateOfferRequest {
  [x: string]: any
}

interface CreateOfferResponse {
  state: string
  checkUri: string
  requestUri: string
}

export function createOffer(
  verifier: Verifier,
  createOfferPath: string,
  offerPath: string,
  responsePath: string,
  presentationPath: string,
  checkPath: string
) {
  debug('creating route for createOffer at ', createOfferPath)
  // First, check if the strategy exists
  const strategyName = verifier.name + '-admin'
  debug('Checking if strategy exists:', strategyName)
  debug('Available strategies:', Object.keys(passport.strategies))
  debug('creating route for createOffer at ', createOfferPath)
  verifier.router!.post(
    createOfferPath,
    // passport.authenticate(verifier.name + '-admin', { session: false }, (request: any, response: any) => {
    //   debug('req' + request)
    // }),
    async (request: any, response: any) => {
      try {
        debug('received request to create a Verification Offer from ', verifier.name, request.body)
        const presentationId = request.params.presentationid
        const state: string = v4()
        const requestByReferenceURI = getBaseUrl() + replaceParamsInUrl(offerPath, { presentationid: presentationId, state: state })
        const responseURI = getBaseUrl() + replaceParamsInUrl(responsePath, { presentationid: presentationId, state: state })
        const presentationURI = getBaseUrl() + replaceParamsInUrl(presentationPath, { presentationid: presentationId, state: state })
        const checkUri = getBaseUrl() + replaceParamsInUrl(checkPath, { presentationid: presentationId, state: state })
        const requestUri =
          'openid://?request_uri=' + encodeURIComponent(requestByReferenceURI) + '&client_id=' + encodeURIComponent(verifier.clientId())
        openObserverLog(state, 'create-offer', { name: verifier.name, request: request.params })

        const rp = verifier.getRPForPresentation(presentationId, state)
        if (!rp) {
          throw new Error('RP instance not configured')
        } else {
          rp.createAuthorizationRequest(responseURI, presentationURI, state)
          const authRequestBody: CreateOfferResponse = { state, requestUri, checkUri }
          openObserverLog(state, 'create-offer', authRequestBody)
          debug('returning ', authRequestBody)
          return response.send(authRequestBody)
        }
      } catch (e) {
        openObserverLog('none', 'create-offer', { error: JSON.stringify(e) })
        return sendErrorResponse(response, 500, 'Could not create authorization request', e)
      }
    }
  )
}
