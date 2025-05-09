import { PaymeMethod } from "../enum/transaction.enum.js";
import transactionModel from "../models/transaction.model.js";
import paymeService from "../services/payme.service.js";
import base64 from "base-64";

class PaymeController {
  async pay(req, res, next) {
    try {
      const { method, params, id } = req.body;
      switch (method) {
        case PaymeMethod.CheckPerformTransaction: {
          await paymeService.checkPerformTransaction(params, id);
          return res.json({ result: { allow: true } });
        }
        case PaymeMethod.CheckTransaction: {
          const result = await paymeService.checkTransaction(params, id);
          return res.json({ result, id });
        }
        case PaymeMethod.CreateTransaction: {
          const result = await paymeService.createTransaction(params, id);
          return res.json({ result, id });
        }
        case PaymeMethod.PerformTransaction: {
          const result = await paymeService.performTransaction(params, id);
          return res.json({ result, id });
        }
        case PaymeMethod.CancelTransaction: {
          const result = await paymeService.cancelTransaction(params, id);
          return res.json({ result, id });
        }
        case PaymeMethod.GetStatement: {
          const result = await paymeService.getStatement(params, id);
          return res.json({ result: { transactions: result } });
        }
      }
    } catch (err) {
      next(err);
    }
  }

  async checkout(req, res, next) {
    try {
      const { orderDetails, amount, url, userId } = req.body;
      const MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
      const amountOrder = orderDetails.amount * 100;

      if (userId) {
         transactionModel.deleteMany({
          userId,
          status: 1,
          provider: "payme",
        });
      }

      const orderData = {
        orderDetails,
        status: 0,
        provider: "payme",
        amount: amount,
      };

      if (userId) {
        orderData.userId = userId;
      }
      const order = await transactionModel.create(orderData);
      const r = base64.encode(
        `m=${MERCHANT_ID};ac:order_id=${order?._id};a=${amountOrder};c=${url}`
      );
      return res.json({
        url: `https://checkout.payme.uz/${r}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymeController();
