/* eslint-disable @typescript-eslint/no-var-requires */
const paypal = require("@paypal/checkout-server-sdk");

const getClient = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  let environment: any;
  if (process.env.NODE_ENV === "production") {
    environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
  const client = new paypal.core.PayPalHttpClient(environment);
  return client;
};

// Call API with your client and get a response for your call
export const createOrder = async function (amount: string, currency: string) {
  const client = getClient();
  // Construct a request object and set desired parameters
  // Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
  const request = new paypal.orders.OrdersCreateRequest();
  // If we need more object while sending request refer to below example
  // https://github.com/paypal/Checkout-NodeJS-SDK/blob/develop/samples/CaptureIntentExamples/createOrder.js
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount,
          breakdown: {
            item_total: {
              currency_code: currency,
              value: amount,
            },
          },
        },
        items: [
          {
            name: "Item Name",
            unit_amount: {
              currency_code: currency,
              value: amount,
            },
            quantity: "1",
            category: "DIGITAL_GOODS",
          },
        ],
      },
    ],
  });
  const response = await client.execute(request);
  return response;
};

// From payment Id get the payment details
export const fetchPayment = async function (paymentId) {
  try {
    const client = getClient();
    const requestPayment = new paypal.payments.CapturesGetRequest(paymentId);
    const responsePayment = await client.execute(requestPayment);
    return responsePayment;
  } catch (err) {
    console.log({
      level: "error",
      message: "Error while fetching payment : ",
      metadata: { paymentId, err },
    });
    return { statusCode: "500", status: "ERROR", error: err };
  }
};

// From order Id get order details
export const fetchOrder = async function (orderId) {
  // From payment details object verify if the order was captured successfully or it's tampered
  try {
    const client = getClient();
    const requestCapture = new paypal.orders.OrdersGetRequest(orderId);
    const responseCapture = await client.execute(requestCapture);
    return {
      statusCode: responseCapture.statusCode,
      status: responseCapture.result.status,
    };
  } catch (err) {
    console.log({
      level: "error",
      message: "Error while fetching order : ",
      metadata: { orderId, err },
    });
    return { statusCode: "500", status: "PENDING" };
  }
};
