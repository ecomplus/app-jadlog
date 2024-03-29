// read configured E-Com Plus app data
const getAppData = require('./../../lib/store-api/get-app-data')
// create tag to jadlog
const createTag = require('./../../lib/jadlog/create-tag')
const { auth } = require('firebase-admin')

const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

exports.post = ({ appSdk }, req, res) => {
  // receiving notification from Store API
  const { storeId } = req

  /**
   * Treat E-Com Plus trigger body here
   * Ref.: https://developers.e-com.plus/docs/api/#/store/triggers/
   */
  const trigger = req.body
  console.log(`Trigger from #${storeId} - ${trigger.resource}`)
  // get app configured options
  let token, config, auth
  appSdk.getAuth(storeId).then(_auth => {
    auth = _auth
    return getAppData({ appSdk, storeId, auth })
    .then(appData => {
      if (
        Array.isArray(appData.ignore_triggers) &&
        appData.ignore_triggers.indexOf(trigger.resource) > -1
      ) {
        // ignore current trigger
        const err = new Error()
        err.name = SKIP_TRIGGER_NAME
        throw err
      }
      config = appData
      
      const sellerInfo = config.seller_info
      const jadlogContract = config.jadlog_contract || {}
      token = jadlogContract.token


      if (!(token && sellerInfo)) {
        // must have configured origin zip code to continue
        return res.status(409).send({
          error: 'CALCULATE_ERR',
          message: 'Contract and seller info is unset on app hidden data (merchant must configure the app)'
        })
      }

      if (token && sellerInfo && trigger.resource === 'orders' && config.enable_tag) {
        // handle order fulfillment status changes
        const order = trigger.body
        if (
          order &&
          order.fulfillment_status &&
          order.fulfillment_status.current === 'ready_for_shipping'
        ) {
          // read full order body
          return appSdk.apiRequest(storeId, `/orders/${trigger.resource_id}.json`, 'GET', null, auth)
        }
      }

      // ignore current trigger
      const err = new Error()
      err.name = SKIP_TRIGGER_NAME
      throw err
    })

    .then(({ response }) => {
      // finally create manda bem tag parsing full order data
      const order = response.data
      console.log(`Shipping tag for #${storeId} ${order._id}`)
      if (order && order.shipping_lines[0] && order.shipping_lines[0].app && order.shipping_lines[0].app.carrier.toLowerCase().indexOf('jadlog') === -1) {
        return res.send(ECHO_SKIP)
      }
      return createTag(order, token, storeId, config, appSdk, auth)
    })

    .then(() => {
      // all done
      return res.send(ECHO_SUCCESS)
    })

    .catch(err => {
      if (err.name === SKIP_TRIGGER_NAME) {
        // trigger ignored by app configuration
        res.send(ECHO_SKIP)
      } else {
        console.log(err)
        // request to Store API with error response
        // return error status code
        res.status(500)
        const { message } = err
        res.send({
          error: ECHO_API_ERROR,
          message
        })
      }
    })
  }).catch(console.error)
}
