import clickService from "../services/click.service.js";
import transactionModel from "../models/transaction.model.js";

class ClickController {
  async prepare(req, res, next) {
    try {
      const data = req.body;
      const result = await clickService.prepare(data);
      res
        .set({
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        })
        .send(result);
    } catch (error) {
      next(error);
    }
  }

  async complete(req, res, next) {
    try {
      const data = req.body;
      const result = await clickService.complete(data);
      res
        .set({
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        })
        .send(result);
    } catch (error) {
      next(error);
    }
  }

  async checkout(req, res, next) {
    try {
      const { orderDetails, amount, userId } = req.body;
      let { url } = req.body;
      const MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
      const SERVICE_ID = process.env.CLICK_SERVICE_ID;
      const MERCHANT_USER_ID = process.env.CLICK_MERCHANT_USER_ID;

      if (userId) {
        transactionModel.deleteMany({
          userId,
          status: 1,
          provider: "click",
        });
      }

      const orderData = {
        orderDetails,
        status: 1,
        amount,
        provider: "click",
      };

      if (userId) {
        orderData.userId = userId;
      }
      const order = await transactionModel.create(orderData);
      if (orderDetails?.service_mode != 1) {
        url = url + "/" + order?._id;
      }
      const checkoutUrl = `https://my.click.uz/services/pay?service_id=${SERVICE_ID}&merchant_id=${MERCHANT_ID}&amount=${amount}&transaction_param=${order?._id}&merchant_order_id=${MERCHANT_USER_ID}&return_url=${url}`;

      res.json({ url: checkoutUrl, order_id: order._id });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClickController();
